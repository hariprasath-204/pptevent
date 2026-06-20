import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, getDocs, doc, updateDoc } from 'firebase/firestore';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

export default function StaffDashboard() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      const q = query(collection(db, 'teams'));
      const snapshot = await getDocs(q);
      const user = auth.currentUser;
      const teamsData = snapshot.docs.map(doc => {
        const data = doc.data();
        const myEval = data.evaluations?.[user?.uid] || { presentation: '', technical: '', design: '', total: 0 };
        return {
          ...data,
          id: doc.id,
          evaluations: data.evaluations || {},
          marks: { 
            presentation: myEval.presentation, 
            technical: myEval.technical, 
            design: myEval.design 
          },
          totalMark: myEval.total || 0
        };
      });
      // Sort by team number
      teamsData.sort((a, b) => a.teamNumber - b.teamNumber);
      setTeams(teamsData);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load teams');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/staff/login');
    } catch (error) {
      toast.error('Failed to log out');
    }
  };

  const handleMarkChange = (teamId, field, value) => {
    let numValue = parseInt(value, 10);
    if (isNaN(numValue)) numValue = '';
    
    // Validate maximums
    if (field === 'presentation' && numValue > 20) numValue = 20;
    if (field === 'technical' && numValue > 20) numValue = 20;
    if (field === 'design' && numValue > 10) numValue = 10;
    if (numValue !== '' && numValue < 0) numValue = 0;

    setTeams(prevTeams => prevTeams.map(team => {
      if (team.id === teamId) {
        const updatedMarks = { ...team.marks, [field]: numValue };
        const p = updatedMarks.presentation === '' ? 0 : updatedMarks.presentation;
        const t = updatedMarks.technical === '' ? 0 : updatedMarks.technical;
        const d = updatedMarks.design === '' ? 0 : updatedMarks.design;
        const total = p + t + d;

        return { ...team, marks: updatedMarks, totalMark: total };
      }
      return team;
    }));
  };

  const saveMarks = async (team) => {
    const user = auth.currentUser;
    if (!user) {
      toast.error('You must be logged in');
      return;
    }
    
    try {
      const teamRef = doc(db, 'teams', team.id);
      await updateDoc(teamRef, {
        [`evaluations.${user.uid}`]: {
          staffEmail: user.email || 'staff',
          presentation: team.marks.presentation,
          technical: team.marks.technical,
          design: team.marks.design,
          total: team.totalMark
        }
      });
      toast.success(`Marks saved for Team ${team.teamNumber}`);
    } catch (error) {
      console.error(error);
      toast.error('Failed to save marks');
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">Loading teams...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold gradient-text">Staff Evaluation Dashboard</h1>
            <p className="text-slate-400 mt-2">Evaluate teams and generate score sheets</p>
          </div>
          <div className="flex flex-wrap gap-4">
            <button onClick={handleLogout} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors border border-slate-700 text-sm">
              Logout
            </button>
          </div>
        </div>

        <div className="glass-card rounded-2xl overflow-hidden border border-slate-700">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-800/50 border-b border-slate-700">
                  <th className="p-4 font-semibold text-cyan-400">Team No</th>
                  <th className="p-4 font-semibold text-cyan-400">Members & Topic</th>
                  <th className="p-4 font-semibold text-indigo-400 text-center">Presentation (20)</th>
                  <th className="p-4 font-semibold text-indigo-400 text-center">Technical (20)</th>
                  <th className="p-4 font-semibold text-indigo-400 text-center">Design (10)</th>
                  <th className="p-4 font-semibold text-pink-400 text-center">Total (50)</th>
                  <th className="p-4 font-semibold text-slate-400 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {teams.map((team) => (
                  <tr key={team.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-4 whitespace-nowrap font-bold">Team {team.teamNumber}</td>
                    <td className="p-4">
                      <div className="font-semibold">{team.member1Name} <span className="text-slate-500 text-sm">({team.member1Roll || 'N/A'})</span></div>
                      <div className="font-semibold mt-1">{team.member2Name} <span className="text-slate-500 text-sm">({team.member2Roll || 'N/A'})</span></div>
                      <div className="text-sm text-cyan-300 mt-2 truncate max-w-[200px]" title={team.title}>Topic: {team.title}</div>
                    </td>
                    <td className="p-4 text-center">
                      <input 
                        type="number" 
                        min="0" max="20"
                        className="w-16 p-2 bg-slate-900 border border-slate-700 rounded text-center focus:border-indigo-500 focus:outline-none"
                        value={team.marks?.presentation ?? ''}
                        onChange={(e) => handleMarkChange(team.id, 'presentation', e.target.value)}
                      />
                    </td>
                    <td className="p-4 text-center">
                      <input 
                        type="number" 
                        min="0" max="20"
                        className="w-16 p-2 bg-slate-900 border border-slate-700 rounded text-center focus:border-indigo-500 focus:outline-none"
                        value={team.marks?.technical ?? ''}
                        onChange={(e) => handleMarkChange(team.id, 'technical', e.target.value)}
                      />
                    </td>
                    <td className="p-4 text-center">
                      <input 
                        type="number" 
                        min="0" max="10"
                        className="w-16 p-2 bg-slate-900 border border-slate-700 rounded text-center focus:border-indigo-500 focus:outline-none"
                        value={team.marks?.design ?? ''}
                        onChange={(e) => handleMarkChange(team.id, 'design', e.target.value)}
                      />
                    </td>
                    <td className="p-4 text-center">
                      <div className="font-bold text-xl text-pink-400">{team.totalMark || 0}</div>
                    </td>
                    <td className="p-4 text-center">
                      <button 
                        onClick={() => saveMarks(team)}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors text-sm font-semibold"
                      >
                        Save
                      </button>
                    </td>
                  </tr>
                ))}
                {teams.length === 0 && (
                  <tr>
                    <td colSpan="7" className="p-8 text-center text-slate-500">
                      No teams registered yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
