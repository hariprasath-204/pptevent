import { useState } from 'react';
import { motion } from 'framer-motion';
import { FaTimes, FaLink, FaSpinner } from 'react-icons/fa';
import { db } from '../firebase';
import { doc, runTransaction, serverTimestamp } from 'firebase/firestore';
import toast from 'react-hot-toast';

export default function RegistrationModal({ onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    member1Name: '',
    member1Roll: '',
    title: 'How AI technology used comupter known people VS computer unknown people',
    pptUrl: '',
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = () => {
    const newErrors = {};
    if (!formData.member1Name.trim()) newErrors.member1Name = 'Required';
    if (!formData.title.trim()) newErrors.title = 'Required';
    if (!formData.pptUrl.trim()) {
      newErrors.pptUrl = 'Required';
    } else {
      try {
        new URL(formData.pptUrl);
      } catch (_) {
        newErrors.pptUrl = 'Must be a valid URL';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      let newTeamNumber;
      await runTransaction(db, async (transaction) => {
        const counterRef = doc(db, 'counters', 'teams');
        const counterDoc = await transaction.get(counterRef);

        if (!counterDoc.exists()) {
          transaction.set(counterRef, { count: 1 });
          newTeamNumber = 1;
        } else {
          newTeamNumber = counterDoc.data().count + 1;
          transaction.update(counterRef, { count: newTeamNumber });
        }

        const teamRef = doc(db, 'teams', `team_${newTeamNumber}`);
        transaction.set(teamRef, {
          teamNumber: newTeamNumber,
          member1Name: formData.member1Name.trim(),
          member1Roll: formData.member1Roll.trim() || null,
          title: formData.title.trim(),
          pptFileURL: formData.pptUrl.trim(),
          status: 'registered',
          createdAt: serverTimestamp()
        });
      });

      onSuccess({ teamNumber: newTeamNumber });
    } catch (error) {
      console.error(error);
      toast.error('Registration failed. Check your connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl relative custom-scrollbar"
      >
        <div className="sticky top-0 left-0 w-full h-2 bg-gradient-to-r from-cyan-400 to-indigo-500 z-20" />

        <div className="sticky top-2 right-0 flex justify-end px-4 md:px-6 pt-4 z-20 pointer-events-none">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="text-slate-400 hover:text-white transition-colors bg-slate-800/80 backdrop-blur p-2 rounded-full pointer-events-auto"
          >
            <FaTimes size={20} />
          </button>
        </div>

        <div className="px-6 pb-6 sm:px-8 sm:pb-8 md:px-12 md:pb-12 pt-2">
          <h2 className="text-3xl font-bold mb-2">Register Your Team</h2>
          <p className="text-slate-400 mb-8">Fill in the details below to secure your spot.</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              {/* Member */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-cyan-400 border-b border-slate-800 pb-2">Participant Details</h3>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Name *</label>
                  <input
                    type="text"
                    className="input-field"
                    value={formData.member1Name}
                    onChange={(e) => setFormData({ ...formData, member1Name: e.target.value })}
                    disabled={isSubmitting}
                  />
                  {errors.member1Name && <p className="text-red-400 text-xs mt-1">{errors.member1Name}</p>}
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Roll Number (Optional)</label>
                  <input
                    type="text"
                    className="input-field"
                    value={formData.member1Roll}
                    onChange={(e) => setFormData({ ...formData, member1Roll: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </div>

            {/* Presentation Details */}
            <div className="space-y-4 pt-4">
              <h3 className="text-lg font-semibold text-pink-400 border-b border-slate-800 pb-2">Presentation</h3>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Presentation Title *</label>
                <input
                  type="text"
                  className="input-field cursor-not-allowed opacity-70"
                  value={formData.title}
                  readOnly
                  disabled
                />
                {errors.title && <p className="text-red-400 text-xs mt-1">{errors.title}</p>}
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1">PPT Public URL (Google Drive, OneDrive, etc.) *</label>
                <div className="relative">
                  <FaLink className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-500" />
                  <input
                    type="url"
                    className="input-field pl-12"
                    placeholder="https://"
                    value={formData.pptUrl}
                    onChange={(e) => setFormData({ ...formData, pptUrl: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>
                {errors.pptUrl && <p className="text-red-400 text-xs mt-1">{errors.pptUrl}</p>}
                <p className="text-slate-500 text-xs mt-2">
                  Please provide a direct link to your PPT file. Make sure the link is set to "Anyone with the link can view".
                </p>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full py-4 text-lg mt-8 flex justify-center items-center"
            >
              {isSubmitting ? (
                <>
                  <FaSpinner className="animate-spin mr-2" /> Submitting...
                </>
              ) : (
                'Complete Registration'
              )}
            </button>
          </form>
        </div>
      </motion.div>
    </motion.div>
  );
}
