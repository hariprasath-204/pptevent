import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, getDocs, doc, updateDoc, setDoc, getDoc } from 'firebase/firestore';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

export default function StaffDashboard() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFinished, setIsFinished] = useState(false);
  const [signatureUploading, setSignatureUploading] = useState(false);
  const [signature, setSignature] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedCategory, setSelectedCategory] = useState(
    location.state?.category || localStorage.getItem('staffCategory') || 'UG'
  );

  useEffect(() => {
    fetchTeams();
    fetchSignature();
  }, []);

  const fetchSignature = async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        const userRef = doc(db, 'users', user.uid);
        const snap = await getDoc(userRef);
        if (snap.exists() && snap.data().signature) {
          setSignature(snap.data().signature);
        }
      }
    } catch (error) {
      console.error(error);
    }
  };

  const fetchTeams = async () => {
    try {
      const q = query(collection(db, 'teams'));
      const snapshot = await getDocs(q);
      const user = auth.currentUser;
      const teamsData = snapshot.docs.map(doc => {
        const data = doc.data();
        const myEval = data.evaluations?.[user?.uid] || { presentation: '', communication: '', concept: '', total: 0 };
        return {
          ...data,
          id: doc.id,
          evaluations: data.evaluations || {},
          marks: { 
            presentation: myEval.presentation, 
            communication: myEval.communication, 
            concept: myEval.concept 
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
    if (field === 'communication' && numValue > 20) numValue = 20;
    if (field === 'concept' && numValue > 10) numValue = 10;
    if (numValue !== '' && numValue < 0) numValue = 0;

    setTeams(prevTeams => prevTeams.map(team => {
      if (team.id === teamId) {
        const updatedMarks = { ...team.marks, [field]: numValue };
        const p = updatedMarks.presentation === '' ? 0 : updatedMarks.presentation;
        const t = updatedMarks.communication === '' ? 0 : updatedMarks.communication;
        const d = updatedMarks.concept === '' ? 0 : updatedMarks.concept;
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
          communication: team.marks.communication,
          concept: team.marks.concept,
          total: team.totalMark
        }
      });
      toast.success(`Marks saved for Team ${team.teamNumber}`);
    } catch (error) {
      console.error(error);
      toast.error('Failed to save marks');
    }
  };

  const handleSignatureUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Check file size (limit to 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('File too large. Please upload an image under 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target.result;
      setSignatureUploading(true);
      try {
        const userRef = doc(db, 'users', auth.currentUser.uid);
        await setDoc(userRef, { signature: base64 }, { merge: true });
        setSignature(base64);
        toast.success('Signature uploaded successfully!');
      } catch (err) {
        console.error(err);
        toast.error('Failed to upload signature');
      } finally {
        setSignatureUploading(false);
      }
    };
    reader.readAsDataURL(file);
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
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 bg-slate-800 px-3 py-2 rounded-xl border border-slate-700">
              <label className="text-sm text-slate-400 whitespace-nowrap">Category:</label>
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  localStorage.setItem('staffCategory', e.target.value);
                }}
                className="bg-transparent text-cyan-400 font-bold outline-none border-b border-slate-600 focus:border-cyan-400 text-center cursor-pointer"
              >
                <option value="UG" className="bg-slate-900 text-white">UG</option>
                <option value="PG" className="bg-slate-900 text-white">PG</option>
                <option value="All" className="bg-slate-900 text-white">All</option>
              </select>
            </div>
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
                  <th className="p-4 font-semibold text-cyan-400">Participant & Topic</th>
                  <th className="p-4 font-semibold text-indigo-400 text-center">Presentation (20)</th>
                  <th className="p-4 font-semibold text-indigo-400 text-center">Communication (20)</th>
                  <th className="p-4 font-semibold text-indigo-400 text-center">Concept (10)</th>
                  <th className="p-4 font-semibold text-pink-400 text-center">Total (50)</th>
                  <th className="p-4 font-semibold text-slate-400 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {teams
                  .filter(team => {
                    if (selectedCategory === 'All') return true;
                    return (team.category || 'UG') === selectedCategory;
                  })
                  .map((team) => (
                  <tr key={team.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-4 whitespace-nowrap font-bold">Team {team.teamNumber}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="font-semibold">{team.member1Name} <span className="text-slate-500 text-sm">({team.member1Roll || 'N/A'})</span></div>
                        <span className="text-xs bg-slate-800 text-cyan-400 px-2 py-0.5 rounded font-bold uppercase">{team.category || 'UG'}</span>
                      </div>
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
                        value={team.marks?.communication ?? ''}
                        onChange={(e) => handleMarkChange(team.id, 'communication', e.target.value)}
                      />
                    </td>
                    <td className="p-4 text-center">
                      <input 
                        type="number" 
                        min="0" max="10"
                        className="w-16 p-2 bg-slate-900 border border-slate-700 rounded text-center focus:border-indigo-500 focus:outline-none"
                        value={team.marks?.concept ?? ''}
                        onChange={(e) => handleMarkChange(team.id, 'concept', e.target.value)}
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
                {teams.filter(team => selectedCategory === 'All' ? true : (team.category || 'UG') === selectedCategory).length === 0 && (
                  <tr>
                    <td colSpan="7" className="p-8 text-center text-slate-500">
                      No {selectedCategory === 'All' ? '' : selectedCategory} teams registered yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <button 
            onClick={() => setIsFinished(true)} 
            className="px-8 py-3 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-400 hover:to-rose-400 text-white rounded-xl font-bold shadow-lg shadow-pink-500/30 transition-all transform hover:-translate-y-1"
          >
            Finish Evaluation
          </button>
        </div>

        {/* Modal Popup for Finished State */}
        {isFinished && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }} 
              animate={{ opacity: 1, scale: 1 }} 
              className="bg-slate-900 border border-pink-500/30 p-8 rounded-2xl text-center shadow-2xl max-w-lg w-full relative"
            >
              <button 
                onClick={() => setIsFinished(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
              >
                ✕
              </button>
              
              <h2 className="text-3xl font-bold text-pink-400 mb-4">Thank You!</h2>
              <p className="text-slate-300 mb-8 max-w-lg mx-auto">
                Thank you for your valuable time and effort in evaluating the teams. Your expertise is greatly appreciated.
              </p>
              
              <div className="bg-slate-800/50 p-6 rounded-xl inline-block w-full">
                <h3 className="text-xl font-semibold text-cyan-400 mb-4">Upload Your Signature</h3>
                <p className="text-sm text-slate-400 mb-6">
                  Upload a clear photo of your signature (PNG or JPG) to be automatically added to the final score sheets.
                </p>
                
                {signature ? (
                  <div className="mb-6">
                     <img src={signature} alt="Signature" className="h-20 mx-auto bg-white p-2 rounded-lg object-contain" />
                     <p className="text-green-400 mt-2 text-sm font-semibold">Signature saved successfully!</p>
                  </div>
                ) : null}

                <label className="relative cursor-pointer flex justify-center items-center gap-2 w-full px-6 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-colors font-semibold text-white">
                  <span>{signatureUploading ? 'Uploading...' : (signature ? 'Update Signature' : 'Choose File')}</span>
                  <input type="file" accept="image/png, image/jpeg" className="hidden" onChange={handleSignatureUpload} disabled={signatureUploading} />
                </label>
              </div>
            </motion.div>
          </div>
        )}

      </div>
    </div>
  );
}
