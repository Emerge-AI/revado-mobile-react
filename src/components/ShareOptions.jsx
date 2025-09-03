import { motion, AnimatePresence } from 'framer-motion';
import { 
  EnvelopeIcon,
  ChatBubbleLeftIcon,
  LinkIcon,
  XMarkIcon,
  DocumentDuplicateIcon,
  CheckIcon
} from '@heroicons/react/24/outline';
import { useState } from 'react';

function ShareOptions({ isOpen, onClose, recordData, recipientEmail }) {
  const [copied, setCopied] = useState(false);
  
  const shareOptions = [
    {
      id: 'mail',
      name: 'Mail',
      icon: EnvelopeIcon,
      color: 'bg-blue-500',
      action: () => shareViaMail()
    },
    {
      id: 'messages',
      name: 'Messages',
      icon: ChatBubbleLeftIcon,
      color: 'bg-green-500',
      action: () => shareViaText()
    },
    {
      id: 'copy',
      name: 'Copy Link',
      icon: LinkIcon,
      color: 'bg-purple-500',
      action: () => copyShareLink()
    }
  ];

  const shareViaMail = () => {
    const subject = encodeURIComponent('Health Records from Revado');
    const body = encodeURIComponent(
      `Hi ${recipientEmail?.split('@')[0] || 'there'},\n\n` +
      `I'm sharing my health records with you through Revado Health.\n\n` +
      `Records included:\n` +
      `${recordData?.map(r => `• ${r.displayName || r.originalName || r.name}`).join('\n') || '• Health records'}\n\n` +
      `Please review these at your convenience.\n\n` +
      `Best regards,\n` +
      `${localStorage.getItem('userName') || 'Your Patient'}\n\n` +
      `---\n` +
      `Sent securely via Revado Health`
    );
    
    // Open native mail app
    window.location.href = `mailto:${recipientEmail || ''}?subject=${subject}&body=${body}`;
    onClose();
  };

  const shareViaText = () => {
    const message = encodeURIComponent(
      `Health Records Update: I've shared ${recordData?.length || 'my'} medical records with you via Revado Health. ` +
      `Please check your email for details.`
    );
    
    // Try to open native messages app (works on mobile)
    if (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
      // For iOS
      if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
        window.location.href = `sms:&body=${message}`;
      } else {
        // For Android
        window.location.href = `sms:?body=${message}`;
      }
    } else {
      // Fallback for desktop - copy to clipboard
      navigator.clipboard.writeText(decodeURIComponent(message));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
    onClose();
  };

  const copyShareLink = () => {
    const shareText = 
      `I've shared my health records via Revado Health.\n` +
      `Recipient: ${recipientEmail || 'Healthcare Provider'}\n` +
      `Records: ${recordData?.length || 0} files\n` +
      `Date: ${new Date().toLocaleDateString()}`;
    
    navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
      onClose();
    }, 2000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-white/50 backdrop-blur-sm z-40"
            onClick={onClose}
          />

          {/* Share Sheet */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.2}
            onDragEnd={(e, { velocity }) => {
              if (velocity.y > 500) {
                onClose();
              }
            }}
            transition={{ 
              type: "spring", 
              stiffness: 400, 
              damping: 30
            }}
            className="fixed bottom-0 left-0 right-0 z-50"
          >
            <div className="bg-white rounded-t-3xl pb-safe-bottom">
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing">
                <div className="w-10 h-1 bg-gray-300 rounded-full" />
              </div>

              {/* Header */}
              <div className="px-6 py-4">
                <h3 className="text-lg font-semibold text-gray-900 text-center">
                  Share Health Records
                </h3>
                {recipientEmail && (
                  <p className="text-sm text-gray-500 text-center mt-1">
                    To: {recipientEmail}
                  </p>
                )}
              </div>

              {/* Share Options Grid */}
              <div className="px-6 pb-6">
                <div className="grid grid-cols-3 gap-4">
                  {shareOptions.map((option) => (
                    <motion.button
                      key={option.id}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={option.action}
                      className="flex flex-col items-center space-y-2 p-4"
                    >
                      <div className={`${option.color} rounded-2xl p-4 shadow-lg`}>
                        <option.icon className="w-8 h-8 text-white" />
                      </div>
                      <span className="text-xs font-medium text-gray-700">
                        {option.name}
                      </span>
                    </motion.button>
                  ))}
                </div>

                {/* Copy Success Message */}
                <AnimatePresence>
                  {copied && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="mt-4 bg-green-50 rounded-xl p-3 flex items-center justify-center space-x-2"
                    >
                      <CheckIcon className="w-5 h-5 text-green-600" />
                      <span className="text-sm font-medium text-green-600">
                        Copied to clipboard!
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Additional Options */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <button
                    onClick={onClose}
                    className="w-full py-3 bg-gray-100 rounded-xl font-medium text-gray-700 hover:bg-gray-200:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default ShareOptions;