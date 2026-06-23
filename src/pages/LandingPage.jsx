import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaUserFriends, FaFilePowerpoint, FaClock, FaChalkboardTeacher } from 'react-icons/fa';
import RegistrationModal from '../components/RegistrationModal';
import SuccessModal from '../components/SuccessModal';

export default function LandingPage() {
  const [isRegModalOpen, setIsRegModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [successData, setSuccessData] = useState(null);

  const handleSuccess = (data) => {
    setIsRegModalOpen(false);
    setSuccessData(data);
    setIsSuccessModalOpen(true);
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-slate-900 text-white">
      {/* Background blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/30 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-600/20 rounded-full blur-[120px]" />

      <div className="relative z-10 container mx-auto px-6 py-12 flex flex-col items-center justify-center min-h-screen">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center max-w-4xl px-4"
        >
          <h2 className="text-lg md:text-2xl text-cyan-400 font-semibold mb-2">Ayya Nadar Janaki Ammal College, Sivakasi</h2>
          <h3 className="text-base md:text-xl text-slate-300 mb-8">Soft Tech Association — Department of Computer Applications</h3>
          
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold mb-6 tracking-tight">
            <span className="gradient-text">PPT Presentation Event</span>
          </h1>
          
          <p className="text-lg md:text-xl text-slate-400 mb-8 max-w-2xl mx-auto leading-relaxed">
            Showcase your ideas. Present with confidence. Join us for a day of innovation and learning.
          </p>

          <div className="inline-block glass-card px-4 md:px-6 py-2 md:py-3 mb-10 border-cyan-500/30">
            <span className="text-cyan-300 font-medium tracking-wider uppercase text-xs md:text-sm">
              🗓️ Thursday, 25th June 2026
            </span>
          </div>

          <div>
            <button
              onClick={() => setIsRegModalOpen(true)}
              className="btn-primary text-base md:text-lg px-8 py-3 md:px-10 md:py-4"
            >
              Register Now
            </button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-24 w-full max-w-6xl"
        >
          {[
            { icon: <FaUserFriends className="text-3xl text-indigo-400" />, title: 'Individual Participant', desc: 'Present your own ideas solo' },
            { icon: <FaFilePowerpoint className="text-3xl text-pink-400" />, title: 'Cloud PPT Link', desc: 'Submit Google Drive or OneDrive link' },
            { icon: <FaChalkboardTeacher className="text-3xl text-cyan-400" />, title: 'Live Presentation', desc: 'Present directly to the judges' },
            { icon: <FaClock className="text-3xl text-purple-400" />, title: 'Time-Limited', desc: 'Strict time limits for each round' },
          ].map((feature, i) => (
            <div key={i} className="glass-card p-6 flex flex-col items-center text-center hover:-translate-y-2 transition-transform duration-300">
              <div className="bg-slate-800/50 p-4 rounded-full mb-4">
                {feature.icon}
              </div>
              <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
              <p className="text-slate-400 text-sm">{feature.desc}</p>
            </div>
          ))}
        </motion.div>

        {/* Demo Video Section */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-24 w-full max-w-4xl mx-auto"
        >
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">How to Register & Share PPT</h2>
            <p className="text-slate-400">Watch this quick demo on how to upload your presentation to Google Drive, generate a public link, and register for the event.</p>
          </div>
          <div className="glass-card p-2 md:p-4 rounded-2xl border border-slate-700 overflow-hidden shadow-2xl bg-slate-900/50 relative z-20">
            <video 
              controls 
              playsInline
              webkit-playsinline="true"
              className="w-full rounded-xl"
              preload="auto"
            >
              <source src="/demo-video.mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>
        </motion.div>

        <footer className="mt-24 text-center text-slate-500 text-sm">
          <p>Ayya Nadar Janaki Ammal College &copy; 2026</p>
          <p className="mt-1">Soft Tech Association — Department of Computer Applications</p>
        </footer>
      </div>

      <AnimatePresence>
        {isRegModalOpen && (
          <RegistrationModal
            onClose={() => setIsRegModalOpen(false)}
            onSuccess={handleSuccess}
          />
        )}
        {isSuccessModalOpen && (
          <SuccessModal
            teamData={successData}
            onClose={() => setIsSuccessModalOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
