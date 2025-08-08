import { useState } from 'react';
import { motion } from 'framer-motion';
import { useHealthRecords } from '../contexts/HealthRecordsContext';
import { 
  EnvelopeIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  PaperAirplaneIcon
} from '@heroicons/react/24/outline';

function SharePage() {
  const { records, generateSharePackage, loading } = useHealthRecords();
  const [dentistEmail, setDentistEmail] = useState('');
  const [shareSuccess, setShareSuccess] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState(false);
  const [shareError, setShareError] = useState(null);
  const [shareProgress, setShareProgress] = useState(null);
  const [shareMethod, setShareMethod] = useState(null);

  const completedRecords = records.filter(r => r.status === 'completed' && !r.hidden);
  const hiddenRecords = records.filter(r => r.hidden);

  const handleShare = async (e) => {
    e.preventDefault();
    setConfirmDialog(true);
  };

  const confirmShare = async () => {
    setConfirmDialog(false);
    setShareError(null);
    setShareProgress('Preparing records...');
    
    try {
      // Simulate progress stages
      setTimeout(() => setShareProgress('Generating PDF summary...'), 500);
      setTimeout(() => setShareProgress('Sending email...'), 1500);
      
      const result = await generateSharePackage(dentistEmail);
      
      setShareProgress(null);
      setShareSuccess(true);
      setShareMethod(result.method);
      setDentistEmail('');
      
      // Auto-hide success message after 7 seconds
      setTimeout(() => {
        setShareSuccess(false);
        setShareMethod(null);
      }, 7000);
    } catch (error) {
      console.error('Share failed:', error);
      setShareProgress(null);
      setShareError(error.message || 'Failed to share records. Please try again.');
      
      // Auto-hide error after 5 seconds
      setTimeout(() => {
        setShareError(null);
      }, 5000);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black pb-20">
      <div className="pt-safe-top px-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="py-6"
        >
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Share with Dentist
          </h1>
          <p className="text-ios-gray-600 dark:text-ios-gray-400 mt-1">
            Send your health records securely
          </p>
        </motion.div>

        {/* Records Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-ios-gray-100 dark:bg-ios-gray-900 rounded-2xl p-4 mb-6"
        >
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
            Records to Share
          </h3>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <DocumentTextIcon className="w-5 h-5 text-green-500" />
                <span className="text-sm text-gray-900 dark:text-white">
                  Ready to share
                </span>
              </div>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {completedRecords.length} records
              </span>
            </div>
            
            {hiddenRecords.length > 0 && (
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <ExclamationTriangleIcon className="w-5 h-5 text-orange-500" />
                  <span className="text-sm text-gray-900 dark:text-white">
                    Hidden from sharing
                  </span>
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {hiddenRecords.length} records
                </span>
              </div>
            )}
          </div>

          <p className="text-xs text-ios-gray-500 mt-3">
            Review your records in the Timeline before sharing
          </p>
        </motion.div>

        {/* Progress Indicator */}
        {shareProgress && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-4 mb-6"
          >
            <div className="flex items-center space-x-3">
              <svg className="animate-spin h-5 w-5 text-blue-600" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                {shareProgress}
              </span>
            </div>
          </motion.div>
        )}

        {/* Error Message */}
        {shareError && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 dark:bg-red-900/20 rounded-2xl p-4 mb-6"
          >
            <div className="flex items-start space-x-3">
              <ExclamationTriangleIcon className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-600 dark:text-red-400">
                  {shareError}
                </p>
                <button
                  onClick={() => setShareError(null)}
                  className="text-xs text-red-500 underline mt-1"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Share Form */}
        {!shareSuccess && !shareProgress && (
          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            onSubmit={handleShare}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-ios-gray-300 mb-2">
                Dentist's Email Address
              </label>
              <input
                type="email"
                value={dentistEmail}
                onChange={(e) => setDentistEmail(e.target.value)}
                placeholder="dentist@clinic.com"
                required
                className="w-full px-4 py-3 bg-ios-gray-100 dark:bg-ios-gray-900 rounded-xl text-gray-900 dark:text-white placeholder-ios-gray-500 focus:outline-none focus:ring-2 focus:ring-ios-blue"
              />
              <p className="text-xs text-ios-gray-500 mt-2">
                Your dentist will receive a secure email with your records
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || completedRecords.length === 0}
              className="w-full bg-ios-blue text-white py-3 rounded-xl font-semibold disabled:opacity-50 hover:bg-blue-600 transition-colors flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <PaperAirplaneIcon className="w-5 h-5" />
                  <span>Send Records</span>
                </>
              )}
            </button>

            {completedRecords.length === 0 && (
              <p className="text-center text-sm text-red-500">
                No records ready to share. Please upload records first.
              </p>
            )}
          </motion.form>
        )}

        {/* Confirmation Dialog */}
        {confirmDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white dark:bg-ios-gray-900 rounded-2xl p-6 max-w-sm w-full"
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Confirm Share
              </h3>
              <p className="text-sm text-ios-gray-600 dark:text-ios-gray-400 mb-4">
                You're about to share {completedRecords.length} health records with:
              </p>
              <p className="font-medium text-gray-900 dark:text-white mb-6">
                {dentistEmail}
              </p>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => setConfirmDialog(false)}
                  className="flex-1 bg-ios-gray-100 dark:bg-ios-gray-800 text-gray-900 dark:text-white py-2 rounded-xl font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmShare}
                  className="flex-1 bg-ios-blue text-white py-2 rounded-xl font-semibold"
                >
                  Confirm
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Success Message */}
        {shareSuccess && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-green-50 dark:bg-green-900/20 rounded-2xl p-6"
          >
            <div className="flex flex-col items-center">
              <CheckCircleIcon className="w-16 h-16 text-green-500 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {shareMethod === 'mailto' ? 'Records Prepared!' : 'Records Sent Successfully!'}
              </h3>
              <p className="text-sm text-ios-gray-600 dark:text-ios-gray-400 text-center">
                {shareMethod === 'mailto' 
                  ? 'PDF downloaded. Please attach it to the email that opened.'
                  : 'Your dentist will receive the records shortly'}
              </p>
              {shareMethod === 'mailto' && (
                <p className="text-xs text-ios-gray-500 mt-2 text-center">
                  Note: EmailJS not configured. Using email client instead.
                </p>
              )}
            </div>
          </motion.div>
        )}

        {/* What Gets Shared */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8 bg-ios-blue/10 dark:bg-ios-blue/20 rounded-2xl p-4"
        >
          <h3 className="font-medium text-ios-blue mb-2">What Your Dentist Receives</h3>
          <ul className="space-y-1 text-sm text-ios-gray-600 dark:text-ios-gray-400">
            <li>• AI-generated one-page summary</li>
            <li>• Complete C-CDA file attachment</li>
            <li>• All uploaded documents and images</li>
            <li>• Secure, encrypted transmission</li>
          </ul>
        </motion.div>
      </div>
    </div>
  );
}

export default SharePage;