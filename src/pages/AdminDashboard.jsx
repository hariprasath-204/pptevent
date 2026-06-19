import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { auth, db } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaDownload, FaPlay, FaSignOutAlt, FaSearch } from 'react-icons/fa';

export default function AdminDashboard() {
  const [teams, setTeams] = useState([]);
  const [timerLimit, setTimerLimit] = useState(
    parseInt(localStorage.getItem('timerLimit')) || 3
  );
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('teams');

  useEffect(() => {
    const q = query(collection(db, 'teams'), orderBy('teamNumber', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const teamsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setTeams(teamsData);
    });

    return () => unsubscribe();
  }, []);

  const handleTimerChange = (e) => {
    const val = parseInt(e.target.value) || 1;
    setTimerLimit(val);
    localStorage.setItem('timerLimit', val.toString());
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/admin/login');
  };

  const filteredTeams = teams.filter(team => 
    team.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    team.teamNumber.toString().includes(searchTerm)
  );

  const completedTeams = teams
    .filter(t => t.status === 'completed' && t.durationSeconds !== undefined)
    .sort((a, b) => a.durationSeconds - b.durationSeconds); // Sort fastest first

  const formatTimeStr = (ms) => {
    if (!ms) return '-';
    return new Date(ms).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };
  
  const formatDuration = (secs) => {
    if (secs === undefined) return '-';
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}m ${s}s`;
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white pb-12">
      {/* Navbar */}
      <nav className="bg-slate-800 border-b border-slate-700 px-6 py-4 sticky top-0 z-40">
        <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <h1 className="text-2xl font-bold gradient-text">Admin Dashboard</h1>
          
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3 bg-slate-900 px-4 py-2 rounded-xl border border-slate-700">
              <label className="text-sm text-slate-400 whitespace-nowrap">Timer (min):</label>
              <input
                type="number"
                min="1"
                max="60"
                value={timerLimit}
                onChange={handleTimerChange}
                className="w-16 bg-transparent text-white font-bold outline-none border-b border-slate-600 focus:border-cyan-400 text-center"
              />
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-red-400 hover:text-red-300 transition-colors bg-red-400/10 px-4 py-2 rounded-xl"
            >
              <FaSignOutAlt />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container mx-auto px-6 mt-8">
        
        {/* Tabs & Search */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div className="flex bg-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('teams')}
              className={`px-6 py-2 rounded-lg font-bold transition-colors ${
                activeTab === 'teams' ? 'bg-cyan-500 text-slate-900 shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              Registered Teams ({teams.length})
            </button>
            <button
              onClick={() => setActiveTab('leaderboard')}
              className={`px-6 py-2 rounded-lg font-bold transition-colors ${
                activeTab === 'leaderboard' ? 'bg-indigo-500 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              Leaderboard
            </button>
          </div>
          
          {activeTab === 'teams' && (
            <div className="relative w-full md:w-64">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search teams..."
                className="input-field pl-10 py-2 text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          )}
        </div>

        {activeTab === 'teams' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredTeams.map((team) => (
              <motion.div
                key={team.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-card p-6 flex flex-col h-full"
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-bold text-cyan-400">Team {team.teamNumber}</h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                    team.status === 'completed' 
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                      : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                  }`}>
                    {team.status}
                  </span>
                </div>

                <h4 className="text-lg font-bold mb-4 line-clamp-2" title={team.title}>
                  {team.title}
                </h4>

                <div className="space-y-2 mb-6 flex-grow">
                  <div className="bg-slate-800/50 p-3 rounded-lg">
                    <p className="font-semibold text-slate-200">{team.member1Name}</p>
                    {team.member1Roll && <p className="text-sm text-slate-500">Roll: {team.member1Roll}</p>}
                  </div>
                  <div className="bg-slate-800/50 p-3 rounded-lg">
                    <p className="font-semibold text-slate-200">{team.member2Name}</p>
                    {team.member2Roll && <p className="text-sm text-slate-500">Roll: {team.member2Roll}</p>}
                  </div>
                </div>

                <div className="flex gap-3 mt-auto pt-4 border-t border-slate-700">
                  <a
                    href={team.pptFileURL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white py-2 rounded-xl transition-colors text-sm font-semibold"
                  >
                    <FaDownload />
                    <span>Open Link</span>
                  </a>
                  
                  <button
                    onClick={() => navigate(`/admin/present/${team.teamNumber}`, { state: { team, timerLimit } })}
                    className="flex-1 flex items-center justify-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-slate-900 py-2 rounded-xl transition-colors text-sm font-bold shadow-lg shadow-cyan-500/20"
                  >
                    <FaPlay />
                    <span>Present</span>
                  </button>
                </div>
              </motion.div>
            ))}

            {filteredTeams.length === 0 && (
              <div className="col-span-full py-12 text-center text-slate-500">
                No teams found matching your search.
              </div>
            )}
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-800/80 border-b border-slate-700">
                    <th className="p-4 font-semibold text-cyan-400">Rank</th>
                    <th className="p-4 font-semibold text-cyan-400">Team</th>
                    <th className="p-4 font-semibold text-cyan-400">Members</th>
                    <th className="p-4 font-semibold text-cyan-400">Title</th>
                    <th className="p-4 font-semibold text-slate-300">Starting Time</th>
                    <th className="p-4 font-semibold text-slate-300">Ending Time</th>
                    <th className="p-4 font-semibold text-pink-400">Final Time</th>
                  </tr>
                </thead>
                <tbody>
                  {completedTeams.map((team, index) => (
                    <tr key={team.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                      <td className="p-4 font-bold text-slate-300">#{index + 1}</td>
                      <td className="p-4 font-bold text-white whitespace-nowrap">Team {team.teamNumber}</td>
                      <td className="p-4">
                        <div className="text-sm">
                          <div className="font-semibold text-slate-200">
                            {team.member1Name} <span className="text-slate-500 font-normal">{team.member1Roll ? `(${team.member1Roll})` : ''}</span>
                          </div>
                          <div className="font-semibold text-slate-200 mt-1">
                            {team.member2Name} <span className="text-slate-500 font-normal">{team.member2Roll ? `(${team.member2Roll})` : ''}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-slate-300 max-w-[200px] truncate" title={team.title}>{team.title}</td>
                      <td className="p-4 text-slate-400 font-mono whitespace-nowrap">{formatTimeStr(team.startTime)}</td>
                      <td className="p-4 text-slate-400 font-mono whitespace-nowrap">{formatTimeStr(team.endTime)}</td>
                      <td className="p-4 font-bold text-pink-400 font-mono text-lg whitespace-nowrap">{formatDuration(team.durationSeconds)}</td>
                    </tr>
                  ))}
                  {completedTeams.length === 0 && (
                    <tr>
                      <td colSpan="7" className="p-8 text-center text-slate-500">
                        No presentations have been completed yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
