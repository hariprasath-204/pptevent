import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, getDocs, doc, setDoc, getDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { auth, db } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaDownload, FaPlay, FaSignOutAlt, FaSearch } from 'react-icons/fa';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import toast from 'react-hot-toast';

export default function AdminDashboard() {
  const [teams, setTeams] = useState([]);
  const [timerLimit, setTimerLimit] = useState(
    parseInt(localStorage.getItem('timerLimit')) || 3
  );
  const [selectedCategory, setSelectedCategory] = useState('UG');
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('teams');
  const [eventSettings, setEventSettings] = useState({
    eventName: 'PPT Presentation Event',
    eventDate: 'Coming Soon....'
  });
  const [savingSettings, setSavingSettings] = useState(false);

  const [usersInfo, setUsersInfo] = useState({});

  useEffect(() => {
    const q = query(collection(db, 'teams'), orderBy('teamNumber', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const teamsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setTeams(teamsData);
    });

    const unsubSettings = onSnapshot(doc(db, 'settings', 'event'), (docSnap) => {
      if (docSnap.exists()) {
        setEventSettings({
          eventName: docSnap.data().eventName || 'PPT Presentation Event',
          eventDate: docSnap.data().eventDate || 'Coming Soon....'
        });
      }
    });

    fetchUsersInfo();

    return () => {
      unsubscribe();
      unsubSettings();
    };
  }, []);

  const fetchUsersInfo = async () => {
    try {
      const snap = await getDocs(collection(db, 'users'));
      const uMap = {};
      snap.forEach(doc => {
        uMap[doc.id] = doc.data();
      });
      setUsersInfo(uMap);
    } catch (e) {
      console.error(e);
    }
  };

  const handleTimerChange = (e) => {
    const val = parseInt(e.target.value) || 1;
    setTimerLimit(val);
    localStorage.setItem('timerLimit', val.toString());
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      await setDoc(doc(db, 'settings', 'event'), {
        eventName: eventSettings.eventName.trim() || 'PPT Presentation Event',
        eventDate: eventSettings.eventDate.trim() || 'Coming Soon....'
      }, { merge: true });
      toast.success('Event settings updated successfully!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to update event settings.');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/admin/login');
  };

  const categoryTeams = teams.filter(team => {
    if (selectedCategory === 'All') return true;
    const cat = team.category || 'UG';
    return cat === selectedCategory;
  });

  const filteredTeams = categoryTeams.filter(team =>
    team.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    team.teamNumber.toString().includes(searchTerm)
  );

  const completedTeams = categoryTeams
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

  const getAverages = (evaluations) => {
    if (!evaluations) return { presentation: 0, communication: 0, concept: 0, total: 0 };
    const keys = Object.keys(evaluations);
    if (keys.length === 0) return { presentation: 0, communication: 0, concept: 0, total: 0 };

    let p = 0, t = 0, d = 0, tot = 0;
    keys.forEach(k => {
      p += parseFloat(evaluations[k].presentation) || 0;
      t += parseFloat(evaluations[k].communication) || 0;
      d += parseFloat(evaluations[k].concept) || 0;
      tot += parseFloat(evaluations[k].total) || 0;
    });

    return {
      presentation: (p / keys.length).toFixed(1),
      communication: (t / keys.length).toFixed(1),
      concept: (d / keys.length).toFixed(1),
      total: (tot / keys.length).toFixed(1)
    };
  };

  const loadLogo = (src) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = src;
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
    });
  };

  const addHeader = async (doc, title) => {
    const pageWidth = doc.internal.pageSize.getWidth();

    const collegeLogo = await loadLogo('/college-logo.png');
    const deptLogo = await loadLogo('/dept-logo.png');

    if (collegeLogo) {
      doc.addImage(collegeLogo, 'PNG', 15, 12, 22, 22);
    }
    if (deptLogo) {
      doc.addImage(deptLogo, 'PNG', pageWidth - 37, 12, 22, 22);
    }

    doc.setTextColor(0, 0, 0); // Black and White theme

    // Line 1
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text('SOFTECH', pageWidth / 2, 15, { align: 'center' });

    // Line 2
    doc.setFontSize(14);
    doc.text('DEPARTMENT OF COMPUTER APPLICATIONS', pageWidth / 2, 21, { align: 'center' });

    // Line 3: College Name
    doc.setFontSize(14);
    doc.text('AYYA NADAR JANAKI AMMAL COLLEGE', pageWidth / 2, 28, { align: 'center' });

    // Accreditations (Smaller text)
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    const accText1 = "(Autonomous, Affiliated to Madurai Kamaraj University, Madurai, Re-accredited (4th Cycle) with 'A+' Grade";
    const accText2 = "(CGPA 3.48 out of 4) by NAAC, Recognized as College of Excellence and Mentor Institution by UGC, STAR College by DBT";
    const accText3 = "and Ranked 72nd at National Level in NIRF 2025 and DST-FIST (2023) Supported & An ISO 9001:2015 & ISO 21001:2018 Certified Institution)";
    doc.text(accText1, pageWidth / 2, 33, { align: 'center' });
    doc.text(accText2, pageWidth / 2, 37, { align: 'center' });
    doc.text(accText3, pageWidth / 2, 41, { align: 'center' });

    // Location
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text('SIVAKASI - 626 124.', pageWidth / 2, 46, { align: 'center' });

    // Horizontal Line separator
    doc.setLineWidth(0.5);
    doc.line(14, 50, pageWidth - 14, 50);

    // Event Name
    doc.setFontSize(18);
    doc.text(eventSettings.eventName || 'PPT Presentation Event', pageWidth / 2, 57, { align: 'center' });

    // Document Title (Optional)
    if (title) {
      doc.setFontSize(14);
      doc.text(title, pageWidth / 2, 65, { align: 'center' });
    }
  };

  const downloadScoreSheet = async () => {
    const doc = new jsPDF();
    const titleText = selectedCategory === 'All' ? '' : `${selectedCategory} ScoreSheet`;
    await addHeader(doc, titleText);

    const tableColumn = ["Team No", "Participant", "Topic", "Presentation (20)", "Communication (20)", "Concept (10)", "Total (50)"];
    const tableRows = [];

    const targetTeams = teams.filter(team => {
      if (selectedCategory === 'All') return true;
      return (team.category || 'UG') === selectedCategory;
    });

    const sortedTeams = [...targetTeams].sort((a, b) => a.teamNumber - b.teamNumber);
    sortedTeams.forEach(team => {
      const avg = getAverages(team.evaluations);
      const members = `${team.member1Name} (${team.member1Roll || 'N/A'})`;
      const rowData = [
        team.teamNumber,
        members,
        team.title,
        avg.presentation,
        avg.communication,
        avg.concept,
        avg.total
      ];
      tableRows.push(rowData);
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 72,
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 3, valign: 'middle', textColor: [0, 0, 0] },
      headStyles: { fillColor: [200, 200, 200], textColor: [0, 0, 0] },
    });

    const finalY = doc.lastAutoTable.finalY || 72;
    const pageWidth = doc.internal.pageSize.getWidth();
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);

    const staffUIDs = new Set();
    teams.forEach(t => {
       if (t.evaluations) Object.keys(t.evaluations).forEach(uid => staffUIDs.add(uid));
    });
    let currentX = pageWidth - 44;
    Array.from(staffUIDs).forEach(uid => {
      const sig = usersInfo[uid]?.signature;
      if (sig) {
        doc.addImage(sig, 'PNG', currentX, finalY + 10, 30, 15);
        currentX -= 35;
      }
    });

    doc.text('Staff Signature', pageWidth - 14, finalY + 30, { align: 'right' });

    doc.save(`${selectedCategory}_ScoreSheet.pdf`);
    toast.success('ScoreSheet downloaded');
  };

  const downloadWinnerSheet = async () => {
    const targetTeams = teams.filter(team => {
      if (selectedCategory === 'All') return true;
      return (team.category || 'UG') === selectedCategory;
    });
    const teamsWithAvg = targetTeams.map(t => ({ ...t, avgTotal: parseFloat(getAverages(t.evaluations).total) }));
    const sortedTeams = teamsWithAvg.sort((a, b) => b.avgTotal - a.avgTotal);
    const top3 = sortedTeams.slice(0, 3).filter(t => t.avgTotal > 0);

    if (top3.length === 0) {
      toast.error('No scores available to generate winners.');
      return;
    }

    const doc = new jsPDF();
    const titleText = selectedCategory === 'All' ? 'Top 3 Winners' : `Top 3 Winners (${selectedCategory})`;
    await addHeader(doc, titleText);

    const tableColumn = ["Rank", "Team No", "Participant", "Roll No", "Topic", "Total (50)"];
    const tableRows = [];

    top3.forEach((team, index) => {
      const members = team.member1Name;
      const rolls = team.member1Roll || 'N/A';
      const rowData = [
        index + 1,
        team.teamNumber,
        members,
        rolls,
        team.title,
        team.avgTotal.toFixed(1)
      ];
      tableRows.push(rowData);
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 72,
      theme: 'grid',
      styles: { fontSize: 10, cellPadding: 4, valign: 'middle', textColor: [0, 0, 0] },
      headStyles: { fillColor: [200, 200, 200], textColor: [0, 0, 0] },
    });

    const finalY = doc.lastAutoTable.finalY || 72;
    const pageWidth = doc.internal.pageSize.getWidth();
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);

    const staffUIDs = new Set();
    teams.forEach(t => {
       if (t.evaluations) Object.keys(t.evaluations).forEach(uid => staffUIDs.add(uid));
    });
    let currentX = pageWidth - 44;
    Array.from(staffUIDs).forEach(uid => {
      const sig = usersInfo[uid]?.signature;
      if (sig) {
        doc.addImage(sig, 'PNG', currentX, finalY + 10, 30, 15);
        currentX -= 35;
      }
    });

    doc.text('Staff Signature', pageWidth - 14, finalY + 30, { align: 'right' });

    doc.save(`WinnerSheet_Top3_${selectedCategory}.pdf`);
    toast.success('WinnerSheet downloaded');
  };

  const downloadIndividualStaffSheets = async () => {
    const targetTeams = teams.filter(team => {
      if (selectedCategory === 'All') return true;
      return (team.category || 'UG') === selectedCategory;
    });

    const staffMap = {};
    targetTeams.forEach(team => {
      if (team.evaluations) {
        Object.entries(team.evaluations).forEach(([uid, evalData]) => {
          staffMap[uid] = evalData.staffEmail || uid;
        });
      }
    });

    if (Object.keys(staffMap).length === 0) {
      toast.error('No staff evaluations found.');
      return;
    }

    const doc = new jsPDF();
    const staffEntries = Object.entries(staffMap);

    for (let index = 0; index < staffEntries.length; index++) {
      const [uid, email] = staffEntries[index];
      if (index > 0) doc.addPage();

      const catText = selectedCategory === 'All' ? '' : ` (${selectedCategory})`;
      await addHeader(doc, `Staff Evaluation Sheet${catText} - Evaluator: ${email}`);

      const tableColumn = ["Team No", "Participant", "Topic", "Presentation (20)", "Communication (20)", "Concept (10)", "Total (50)"];
      const tableRows = [];

      const sortedTeams = [...targetTeams].sort((a, b) => a.teamNumber - b.teamNumber);
      sortedTeams.forEach(team => {
        const ev = team.evaluations?.[uid];
        if (!ev) return;
        const members = `${team.member1Name} (${team.member1Roll || 'N/A'})`;
        tableRows.push([
          team.teamNumber,
          members,
          team.title,
          ev.presentation ?? '-',
          ev.communication ?? '-',
          ev.concept ?? '-',
          ev.total ?? '-'
        ]);
      });

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 72,
        theme: 'grid',
        styles: { fontSize: 9, cellPadding: 3, valign: 'middle', textColor: [0, 0, 0] },
        headStyles: { fillColor: [200, 200, 200], textColor: [0, 0, 0] },
      });

      const finalY = doc.lastAutoTable.finalY || 72;
      const pageWidth = doc.internal.pageSize.getWidth();
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);

      const sig = usersInfo[uid]?.signature;
      if (sig) {
        doc.addImage(sig, 'PNG', pageWidth - 44, finalY + 10, 30, 15);
      }

      doc.text('Staff Signature', pageWidth - 14, finalY + 30, { align: 'right' });
    }

    doc.save(`Individual_Staff_ScoreSheets_${selectedCategory}.pdf`);
    toast.success('Individual sheets downloaded');
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white pb-12">
      {/* Navbar */}
      <nav className="bg-slate-800 border-b border-slate-700 px-6 py-4 sticky top-0 z-40">
        <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <h1 className="text-2xl font-bold gradient-text">Admin Dashboard</h1>

          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2 bg-slate-900 px-3 py-2 rounded-xl border border-slate-700">
              <label className="text-sm text-slate-400 whitespace-nowrap">Category:</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-transparent text-cyan-400 font-bold outline-none border-b border-slate-600 focus:border-cyan-400 text-center cursor-pointer"
              >
                <option value="UG" className="bg-slate-900 text-white">UG</option>
                <option value="PG" className="bg-slate-900 text-white">PG</option>
                <option value="All" className="bg-slate-900 text-white">All</option>
              </select>
            </div>

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
              onClick={downloadScoreSheet}
              className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 transition-colors px-3 py-2 rounded-xl text-sm font-semibold whitespace-nowrap"
            >
              📄 ScoreSheet
            </button>
            <button
              onClick={downloadWinnerSheet}
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 transition-colors px-3 py-2 rounded-xl text-sm font-semibold whitespace-nowrap"
            >
              🏆 WinnerSheet
            </button>
            <button
              onClick={downloadIndividualStaffSheets}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 transition-colors px-3 py-2 rounded-xl text-sm font-semibold whitespace-nowrap"
            >
              👤 Staff Sheets
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-red-400 hover:text-red-300 transition-colors bg-red-400/10 px-3 py-2 rounded-xl whitespace-nowrap"
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
              className={`px-6 py-2 rounded-lg font-bold transition-colors ${activeTab === 'teams' ? 'bg-cyan-500 text-slate-900 shadow-md' : 'text-slate-400 hover:text-white'
                }`}
            >
              Registered Teams ({categoryTeams.length})
            </button>
            <button
              onClick={() => setActiveTab('leaderboard')}
              className={`px-6 py-2 rounded-lg font-bold transition-colors ${activeTab === 'leaderboard' ? 'bg-indigo-500 text-white shadow-md' : 'text-slate-400 hover:text-white'
                }`}
            >
              Leaderboard
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-6 py-2 rounded-lg font-bold transition-colors ${activeTab === 'settings' ? 'bg-pink-500 text-white shadow-md' : 'text-slate-400 hover:text-white'
                }`}
            >
              ⚙️ Event Settings
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

        {activeTab === 'teams' && (
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
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${team.status === 'completed'
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
                    <div className="flex justify-between items-center">
                      <p className="font-semibold text-slate-200">{team.member1Name}</p>
                      <span className="text-xs bg-slate-700 text-cyan-400 px-2 py-0.5 rounded font-bold uppercase">{team.category || 'UG'}</span>
                    </div>
                    {team.member1Roll && <p className="text-sm text-slate-500 mt-1">Roll: {team.member1Roll}</p>}
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
        )}

        {activeTab === 'leaderboard' && (
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
                    <th className="p-4 font-semibold text-cyan-400">Participant</th>
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
                          <span className="text-xs bg-slate-800 text-cyan-400 px-2 py-0.5 rounded font-bold uppercase mt-1 inline-block">{team.category || 'UG'}</span>
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

        {activeTab === 'settings' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card max-w-2xl mx-auto p-8 border border-slate-700"
          >
            <h2 className="text-2xl font-bold text-cyan-400 mb-2">Manage Event Details</h2>
            <p className="text-slate-400 mb-6">Update the event name and display date shown on the landing page and reports.</p>
            <form onSubmit={handleSaveSettings} className="space-y-6">
              <div>
                <label className="block text-sm text-slate-400 mb-2">Event Name</label>
                <input
                  type="text"
                  className="input-field"
                  value={eventSettings.eventName}
                  onChange={(e) => setEventSettings({ ...eventSettings, eventName: e.target.value })}
                  placeholder="PPT Presentation Event"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">Date of Event</label>
                <input
                  type="text"
                  className="input-field"
                  value={eventSettings.eventDate}
                  onChange={(e) => setEventSettings({ ...eventSettings, eventDate: e.target.value })}
                  placeholder="Coming Soon...."
                  required
                />
                <p className="text-xs text-slate-500 mt-2">Example: "Coming Soon...." or "Thursday, 2nd July 2026"</p>
              </div>
              <button
                type="submit"
                disabled={savingSettings}
                className="btn-primary w-full py-3 text-lg font-bold shadow-lg shadow-pink-500/20 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-400 hover:to-rose-400"
              >
                {savingSettings ? 'Saving...' : 'Save Settings'}
              </button>
            </form>
          </motion.div>
        )}
      </div>
    </div>
  );
}
