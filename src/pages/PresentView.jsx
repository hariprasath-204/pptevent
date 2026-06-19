import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { FaCompress, FaExpand, FaArrowLeft, FaCheck, FaExternalLinkAlt } from 'react-icons/fa';
import toast from 'react-hot-toast';

export default function PresentView() {
  const location = useLocation();
  const navigate = useNavigate();
  const { teamId } = useParams();
  
  const team = location.state?.team;
  const timerLimitMinutes = location.state?.timerLimit || 3;
  
  const [timeLeft, setTimeLeft] = useState(timerLimitMinutes * 60);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [startTime] = useState(Date.now());
  const containerRef = useRef(null);

  useEffect(() => {
    if (!team) {
      toast.error("No team data found. Returning to dashboard.");
      navigate('/admin/dashboard');
      return;
    }

    if (team.status === 'completed') {
      if (!window.confirm("This team has already presented. Open anyway?")) {
        navigate('/admin/dashboard');
        return;
      }
    }

    // Auto-fullscreen attempt
    tryFullscreen();

    // Timer logic
    const timerInterval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerInterval);
          handleFinishPresentation();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      clearInterval(timerInterval);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(err => console.log(err));
      }
    };
  }, []);

  const tryFullscreen = async () => {
    if (containerRef.current && !document.fullscreenElement) {
      try {
        await containerRef.current.requestFullscreen();
      } catch (err) {
        console.log("Auto-fullscreen blocked by browser", err);
      }
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(err => console.log(err));
    } else {
      document.exitFullscreen();
    }
  };

  const handleFinishPresentation = async () => {
    try {
      if (team.id) {
        const endTime = Date.now();
        const durationSeconds = Math.floor((endTime - startTime) / 1000);
        const teamRef = doc(db, 'teams', team.id);
        await updateDoc(teamRef, { 
          status: 'completed',
          startTime: startTime,
          endTime: endTime,
          durationSeconds: durationSeconds
        });
        toast.success(`Team ${team.teamNumber} marked as completed`);
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to update status');
    } finally {
      navigate('/admin/dashboard');
    }
  };

  const handleBack = () => {
    navigate('/admin/dashboard');
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (!team) return null;

  const isWarning = timeLeft <= 60 && timeLeft > 30;
  const isDanger = timeLeft <= 30;

  // Attempt to generate a viewer URL if it's a direct file link, otherwise just use the URL
  // If it's a google drive link, it's better to just embed it directly if it's an embed link, or let them open in new tab
  const getEmbedUrl = (url) => {
    // Handle Google Drive file links
    if (url.includes('drive.google.com/file/d/')) {
      const match = url.match(/d\/(.*?)(?:\/|$)/);
      if (match) return `https://drive.google.com/file/d/${match[1]}/preview`;
    }
    // Handle Google Slides document links (forces fullscreen slideshow mode)
    if (url.includes('docs.google.com/presentation/d/')) {
      const match = url.match(/\/d\/(.*?)(?:\/|$)/);
      if (match) {
        return `https://docs.google.com/presentation/d/${match[1]}/embed?rm=minimal`;
      }
    }
    // Office Online Viewer fallback for direct .ppt links
    if (url.endsWith('.ppt') || url.endsWith('.pptx')) {
      return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`;
    }
    return url;
  };

  return (
    <div ref={containerRef} className="h-screen w-screen bg-black flex flex-col relative overflow-hidden">
      {/* Top Controls Overlay */}
      <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-start z-50 pointer-events-none">
        
        {/* Left Side: Back & Info */}
        <div className="flex flex-col gap-2 pointer-events-auto">
          <div className="bg-black/50 backdrop-blur-md px-4 py-2 rounded-lg border border-white/10 text-white shadow-xl max-w-xs mt-2">
            <h2 className="font-bold text-cyan-400">Team {team.teamNumber}</h2>
            <p className="text-sm font-semibold truncate" title={team.title}>{team.title}</p>
          </div>
        </div>

        {/* Right Side: Timer & Fullscreen */}
        <div className="flex flex-col items-end gap-2 pointer-events-auto">
          <div className={`backdrop-blur-sm px-6 py-3 rounded-lg border shadow-2xl transition-colors duration-500 font-mono text-5xl font-black tracking-widest ${
            isDanger ? 'bg-red-500/10 text-red-500 border-red-500/30 animate-pulse' : 
            isWarning ? 'bg-orange-500/10 text-orange-400 border-orange-500/30' : 
            'bg-black/20 text-white border-white/10'
          }`}>
            {formatTime(timeLeft)}
          </div>
        </div>
      </div>

      {/* Main Content: Iframe */}
      <div className="flex-grow w-full h-full bg-slate-900 flex items-center justify-center">
        <iframe 
          src={getEmbedUrl(team.pptFileURL)}
          className="w-full h-full border-none shadow-2xl"
          title={`Presentation for Team ${team.teamNumber}`}
          allowFullScreen
        />
      </div>

      {/* Bottom Control Overlay */}
      <div className="absolute bottom-6 right-6 z-50 pointer-events-auto">
        <button
          onClick={handleFinishPresentation}
          className="bg-green-500 hover:bg-green-400 text-black px-6 py-3 rounded-xl font-bold shadow-lg shadow-green-500/30 flex items-center gap-2 transition-transform hover:scale-105"
        >
          <FaCheck /> Finish Presentation
        </button>
      </div>
    </div>
  );
}
