import { motion } from 'framer-motion';
import { FaCheckCircle } from 'react-icons/fa';

export default function SuccessModal({ teamData, onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl relative text-center p-6 sm:p-8 md:p-12"
      >
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-green-400 to-emerald-500" />
        
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
          className="mx-auto w-20 h-20 md:w-24 md:h-24 bg-green-500/20 rounded-full flex items-center justify-center mb-6"
        >
          <FaCheckCircle className="text-5xl md:text-6xl text-green-400" />
        </motion.div>

        <h2 className="text-2xl md:text-3xl font-bold mb-4">Registration Successful! 🎉</h2>
        <p className="text-lg md:text-xl text-slate-300 mb-2">
          Thank you for registering, <span className="font-bold text-cyan-400">Team {teamData?.teamNumber}</span>!
        </p>
        <p className="text-slate-400 mb-8">
          The event will begin on Thursday, 25th June 2026.<br />
          Welcome to Soft Tech Association's PPT Presentation Event!
        </p>

        <button
          onClick={onClose}
          className="btn-primary w-full py-3"
        >
          Back to Home
        </button>
      </motion.div>
    </motion.div>
  );
}
