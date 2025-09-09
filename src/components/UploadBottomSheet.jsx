import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useHealthRecords } from '../contexts/HealthRecordsContext';
import {
  DocumentPlusIcon,
  CameraIcon,
  EnvelopeIcon,
  MicrophoneIcon,
  XMarkIcon,
  SparklesIcon,
  CheckCircleIcon,
  PhotoIcon,
  FolderPlusIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';
import VoiceRecorder from './VoiceRecording/VoiceRecorder';
import CameraCapture from './CameraCapture/CameraCapture';
import DocumentExtractionSummary from './CameraCapture/DocumentExtractionSummary';

function UploadBottomSheet({ isOpen, onClose, onUploadComplete }) {
  const { uploadFile, connectProvider, loading, uploadProgress } = useHealthRecords();
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [providerEmail, setProviderEmail] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [selectedFamily, setSelectedFamily] = useState('me');
  const [batchMode, setBatchMode] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [aiSuggestion, setAiSuggestion] = useState(null);
  const [showCamera, setShowCamera] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [showSummary, setShowSummary] = useState(false);
  const fileInputRef = useRef(null);
  const batchInputRef = useRef(null);
  const sheetRef = useRef(null);

  // Family members (would come from context in real app)
  const familyMembers = [
    { id: 'me', name: 'Me', color: 'bg-blue-500' },
    { id: 'spouse', name: 'Spouse', color: 'bg-pink-500' },
    { id: 'child1', name: 'Emma', color: 'bg-purple-500' },
    { id: 'child2', name: 'Jack', color: 'bg-green-500' },
  ];

  // Detect document type suggestion based on context
  useEffect(() => {
    if (isOpen && !selectedMethod) {
      // Simulate AI suggestion based on time/location
      const hour = new Date().getHours();
      if (hour >= 9 && hour <= 17) {
        setAiSuggestion({
          type: 'appointment',
          message: 'Just finished an appointment?',
          icon: DocumentPlusIcon,
          action: 'Add visit summary'
        });
      } else {
        setAiSuggestion(null);
      }
    }
  }, [isOpen, selectedMethod]);

  // Handle swipe to dismiss
  useEffect(() => {
    if (!isOpen) return;

    let startY = 0;
    let currentY = 0;

    const handleTouchStart = (e) => {
      startY = e.touches[0].clientY;
    };

    const handleTouchMove = (e) => {
      currentY = e.touches[0].clientY;
      const diff = currentY - startY;

      if (diff > 0 && sheetRef.current) {
        sheetRef.current.style.transform = `translateY(${diff}px)`;
      }
    };

    const handleTouchEnd = () => {
      const diff = currentY - startY;

      if (diff > 100) {
        onClose();
      } else if (sheetRef.current) {
        sheetRef.current.style.transform = 'translateY(0)';
      }
    };

    const sheet = sheetRef.current;
    if (sheet) {
      sheet.addEventListener('touchstart', handleTouchStart);
      sheet.addEventListener('touchmove', handleTouchMove);
      sheet.addEventListener('touchend', handleTouchEnd);

      return () => {
        sheet.removeEventListener('touchstart', handleTouchStart);
        sheet.removeEventListener('touchmove', handleTouchMove);
        sheet.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [isOpen, onClose]);

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    if (batchMode) {
      setSelectedFiles(files);
      // Process batch upload
      for (const file of files) {
        await uploadFile(file);
      }
    } else {
      await uploadFile(files[0]);
    }

    setUploadSuccess(true);
    setTimeout(() => {
      setUploadSuccess(false);
      setSelectedMethod(null);
      onUploadComplete && onUploadComplete();
      onClose();
    }, 2000);
  };

  const handleProviderConnect = async (e) => {
    e.preventDefault();
    try {
      await connectProvider(providerEmail);
      setProviderEmail('');
      setUploadSuccess(true);
      setTimeout(() => {
        setUploadSuccess(false);
        setSelectedMethod(null);
        onUploadComplete && onUploadComplete();
        onClose();
      }, 2000);
    } catch (error) {
      console.error('Connection failed:', error);
    }
  };

  const handleVoiceComplete = async (voiceRecord) => {
    try {
      const dummyFile = new File(['voice-recording'], `voice-${Date.now()}.webm`, {
        type: 'audio/webm'
      });
      dummyFile.voiceData = voiceRecord;
      await uploadFile(dummyFile);

      setUploadSuccess(true);
      setTimeout(() => {
        setUploadSuccess(false);
        setSelectedMethod(null);
        onUploadComplete && onUploadComplete();
        onClose();
      }, 2000);
    } catch (error) {
      console.error('Voice upload failed:', error);
    }
  };

  const uploadMethods = [
    {
      id: 'quick',
      icon: CameraIcon,
      title: 'Quick Capture',
      description: 'Take a photo right now',
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600',
      recommended: true,
    },
    {
      id: 'file',
      icon: DocumentPlusIcon,
      title: 'Choose Files',
      description: 'Select from your device',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
    },
    {
      id: 'batch',
      icon: FolderPlusIcon,
      title: 'Multiple Documents',
      description: 'Upload several at once',
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
    },
    {
      id: 'voice',
      icon: MicrophoneIcon,
      title: 'Voice Note',
      description: 'Describe your symptoms',
      iconBg: 'bg-orange-100',
      iconColor: 'text-orange-600',
    },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          />

          {/* Bottom Sheet */}
          <motion.div
            ref={sheetRef}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-50 max-h-[85vh] overflow-hidden"
          >
            {/* Handle bar */}
            <div className="flex justify-center pt-2">
              <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-4 py-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Add to Your Health Story
                </h2>
                <p className="text-sm text-gray-600 mt-0.5">
                  Everything stays private and secure
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <XMarkIcon className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Content */}
            <div className="px-4 pb-safe-bottom overflow-y-auto max-h-[60vh]">
              {/* Family Member Selector */}
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Who is this for?</p>
                <div className="flex gap-2">
                  {familyMembers.map((member) => (
                    <button
                      key={member.id}
                      onClick={() => setSelectedFamily(member.id)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                        selectedFamily === member.id
                          ? `${member.color} text-white`
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {member.name}
                    </button>
                  ))}
                  <button className="p-1.5 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200">
                    <UserGroupIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* AI Suggestion */}
              {aiSuggestion && !selectedMethod && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl border border-blue-100"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-xl">
                      <SparklesIcon className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{aiSuggestion.message}</p>
                      <button
                        onClick={() => setSelectedMethod('quick')}
                        className="text-sm text-blue-600 font-medium hover:text-blue-700"
                      >
                        {aiSuggestion.action} →
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Upload Methods */}
              {!selectedMethod && !uploadSuccess && (
                <div className="space-y-3">
                  {uploadMethods.map((method, index) => (
                    <motion.button
                      key={method.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.05 * index }}
                      onClick={() => {
                        if (method.id === 'quick') {
                          setShowCamera(true);
                        } else if (method.id === 'file') {
                          setSelectedMethod('file');
                          setTimeout(() => fileInputRef.current?.click(), 100);
                        } else if (method.id === 'batch') {
                          setBatchMode(true);
                          setSelectedMethod('batch');
                          setTimeout(() => batchInputRef.current?.click(), 100);
                        } else {
                          setSelectedMethod(method.id);
                        }
                      }}
                      className="w-full bg-white rounded-2xl p-4 flex items-center space-x-3 hover:shadow-lg transition-all border border-gray-100 shadow-sm relative"
                    >
                      {method.recommended && (
                        <span className="absolute -top-2 left-4 px-2 py-0.5 bg-green-500 text-white text-xs font-medium rounded-full">
                          Recommended
                        </span>
                      )}
                      <div className={`${method.iconBg} rounded-xl p-2.5`}>
                        <method.icon className={`w-5 h-5 ${method.iconColor}`} />
                      </div>
                      <div className="flex-1 text-left">
                        <h3 className="font-semibold text-gray-900 text-sm">
                          {method.title}
                        </h3>
                        <p className="text-xs text-gray-600">
                          {method.description}
                        </p>
                      </div>
                      <svg
                        className="w-4 h-4 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </motion.button>
                  ))}
                </div>
              )}

              {/* Hidden file inputs */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <input
                ref={batchInputRef}
                type="file"
                accept=".pdf,image/*"
                multiple
                onChange={handleFileUpload}
                className="hidden"
              />

              {/* Voice Recording */}
              {selectedMethod === 'voice' && !uploadSuccess && (
                <VoiceRecorder
                  onComplete={handleVoiceComplete}
                  onCancel={() => setSelectedMethod(null)}
                />
              )}

              {/* Upload Progress */}
              {loading && uploadProgress > 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mt-4 bg-blue-50 rounded-2xl p-4"
                >
                  <div className="flex items-center justify-center mb-3">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="w-12 h-12 border-3 border-blue-200 border-t-blue-600 rounded-full"
                    />
                  </div>

                  <p className="text-center font-medium text-gray-900 mb-2">
                    Processing your document...
                  </p>

                  <div className="w-full bg-blue-100 rounded-full h-2 overflow-hidden">
                    <motion.div
                      className="h-full bg-blue-600"
                      initial={{ width: 0 }}
                      animate={{ width: `${uploadProgress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>

                  <p className="text-center text-xs text-gray-600 mt-2">
                    {uploadProgress < 50
                      ? "Getting started..."
                      : uploadProgress < 90
                      ? "Almost there..."
                      : "Finishing up..."}
                  </p>
                </motion.div>
              )}

              {/* Success State */}
              {uploadSuccess && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mt-4 text-center py-8"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', delay: 0.1 }}
                    className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4"
                  >
                    <CheckCircleIcon className="w-12 h-12 text-green-600" />
                  </motion.div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">
                    Perfect! All Secured
                  </h3>
                  <p className="text-sm text-gray-600">
                    Your document is safe and ready when you need it
                  </p>
                </motion.div>
              )}

              {/* Help Text */}
              {!selectedMethod && !uploadSuccess && (
                <div className="mt-6 p-3 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-600 text-center">
                    <span className="font-medium">Tip:</span> You can upload multiple files at once or add them one by one - whatever works for you!
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}

      {/* Camera Capture Modal */}
      {showCamera && (
        <CameraCapture
          onComplete={(image) => {
            setCapturedImage(image);
            setShowCamera(false);
            setShowSummary(true);
          }}
          onCancel={() => setShowCamera(false)}
        />
      )}

      {/* Document Extraction Summary */}
      {showSummary && capturedImage && (
        <DocumentExtractionSummary
          capturedImage={capturedImage}
          onSave={async (data) => {
            // Create file from captured image
            const file = new File([data.blob], `capture-${Date.now()}.jpg`, {
              type: 'image/jpeg'
            });
            file.extractedData = data.extractedData;
            file.syncOptions = data.syncOptions;

            await uploadFile(file);
            setUploadSuccess(true);
            setShowSummary(false);

            setTimeout(() => {
              setUploadSuccess(false);
              setSelectedMethod(null);
              setCapturedImage(null);
              onUploadComplete && onUploadComplete();
              onClose();
            }, 2000);
          }}
          onRetake={() => {
            setShowSummary(false);
            setCapturedImage(null);
            setShowCamera(true);
          }}
          onCancel={() => {
            setShowSummary(false);
            setCapturedImage(null);
            onClose();
          }}
        />
      )}
    </AnimatePresence>
  );
}

export default UploadBottomSheet;
