import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useHealthRecords } from '../contexts/HealthRecordsContext';
import apiService from '../services/api';
import VoiceRecorder from '../components/VoiceRecording/VoiceRecorder';
import SyncNotification from '../components/VoiceRecording/SyncNotification';
import UploadBottomSheet from '../components/UploadBottomSheet';
import UploadSuccessAnimation from '../components/UploadSuccessAnimation';
import CameraCapture from '../components/CameraCapture/CameraCapture';
import DocumentExtractionSummary from '../components/CameraCapture/DocumentExtractionSummary';
import {
  DocumentPlusIcon,
  CameraIcon,
  EnvelopeIcon,
  MicrophoneIcon,
  CloudArrowUpIcon,
  CheckCircleIcon,
  ServerIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';

function UploadPage() {
  const { uploadFile, connectProvider, uploadProgress, loading } = useHealthRecords();
  const [uploadMethod, setUploadMethod] = useState(null);
  const [providerEmail, setProviderEmail] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [backendStatus, setBackendStatus] = useState('checking');
  const [syncNotification, setSyncNotification] = useState(null);
  const [showSyncNotification, setShowSyncNotification] = useState(false);
  const [showBottomSheet, setShowBottomSheet] = useState(false);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [showSummary, setShowSummary] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    // Check backend availability
    const checkBackend = async () => {
      try {
        const isAvailable = await apiService.isBackendAvailable();
        setBackendStatus(isAvailable ? 'connected' : 'offline');
      } catch (error) {
        setBackendStatus('offline');
      }
    };

    checkBackend();
    // Check again every 30 seconds
    const interval = setInterval(checkBackend, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      await uploadFile(file);
      setUploadSuccess(true);
      setTimeout(() => {
        setUploadSuccess(false);
        setUploadMethod(null);
      }, 3000);
    } catch (error) {
      console.error('Upload failed:', error);
    }
  };

  const handleProviderConnect = async (e) => {
    e.preventDefault();
    try {
      await connectProvider(providerEmail);
      setProviderEmail('');
      setUploadSuccess(true);
      setTimeout(() => {
        setUploadSuccess(false);
        setUploadMethod(null);
      }, 3000);
    } catch (error) {
      console.error('Connection failed:', error);
    }
  };

  const handleVoiceComplete = async (voiceRecord) => {
    try {
      // Create a dummy file for the voice record to integrate with existing system
      const dummyFile = new File(['voice-recording'], `voice-${Date.now()}.webm`, {
        type: 'audio/webm'
      });

      // Add voice-specific metadata including sync preferences
      dummyFile.voiceData = voiceRecord;
      dummyFile.saveWithSync = voiceRecord.saveWithSync || false;

      await uploadFile(dummyFile);

      // Show sync notification if calendar sync was enabled
      if (voiceRecord.saveWithSync && voiceRecord.extractedEvents) {
        // Wait a bit for the sync to complete
        setTimeout(() => {
          const mockSyncResult = {
            success: true,
            eventsCreated: (voiceRecord.extractedEvents.events?.length || 0) +
                          (voiceRecord.extractedEvents.medications?.length || 0),
            results: [
              ...(voiceRecord.extractedEvents.events || []).map(event => ({
                summary: event.title,
                start: { dateTime: event.date }
              })),
              ...(voiceRecord.extractedEvents.medications || []).map(med => ({
                summary: `Take ${med.name}`,
                start: { dateTime: new Date().toISOString() }
              }))
            ],
            syncedAt: new Date().toISOString()
          };

          setSyncNotification(mockSyncResult);
          setShowSyncNotification(true);

          // Auto-dismiss after 8 seconds
          setTimeout(() => {
            setShowSyncNotification(false);
          }, 8000);
        }, 3000);
      }

      setUploadSuccess(true);
      setTimeout(() => {
        setUploadSuccess(false);
        setUploadMethod(null);
      }, 3000);
    } catch (error) {
      console.error('Voice upload failed:', error);
    }
  };

  const handleVoiceCancel = () => {
    setUploadMethod(null);
  };

  const uploadMethods = [
    {
      id: 'file',
      icon: DocumentPlusIcon,
      title: 'Add Document',
      description: 'PDFs, photos, or any health papers',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
    },
    {
      id: 'camera',
      icon: CameraIcon,
      title: 'Quick Photo',
      description: 'Snap a picture of your document',
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600',
    },
    {
      id: 'provider',
      icon: EnvelopeIcon,
      title: 'Connect Provider',
      description: 'Request records via email',
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
    },
    {
      id: 'voice',
      icon: MicrophoneIcon,
      title: 'Talk to AI Assistant',
      description: 'Ask questions or describe symptoms',
      iconBg: 'bg-orange-100',
      iconColor: 'text-orange-600',
    },
  ];

  return (
    <div className="min-h-screen bg-white pb-20">
      {/* Upload Bottom Sheet */}
      <UploadBottomSheet
        isOpen={showBottomSheet}
        onClose={() => setShowBottomSheet(false)}
        onUploadComplete={() => {
          setShowSuccessAnimation(true);
          setTimeout(() => setShowSuccessAnimation(false), 3000);
        }}
      />

      {/* Success Animation */}
      <UploadSuccessAnimation
        show={showSuccessAnimation}
        message="Perfect! Document Secured"
        subMessage="Your document is safe with us"
        onComplete={() => setShowSuccessAnimation(false)}
      />

      {/* Sync Notification */}
      <SyncNotification
        syncResult={syncNotification}
        isVisible={showSyncNotification}
        onDismiss={() => setShowSyncNotification(false)}
      />

      <div className="pt-safe-top px-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="py-6"
        >
          <h1 className="text-2xl font-bold text-gray-900">
            Let's Add Your Documents
          </h1>
          <p className="text-gray-600 mt-1">
            No rush - we'll keep everything safe and organized
          </p>
        </motion.div>

        {/* Backend Status Indicator */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`mb-4 px-3 py-2 rounded-lg flex items-center space-x-2 ${
            backendStatus === 'connected'
              ? 'bg-green-50 border border-green-200'
              : backendStatus === 'offline'
              ? 'bg-yellow-50 border border-yellow-200'
              : 'bg-gray-50 border border-gray-100'
          }`}
        >
          <ServerIcon className={`w-4 h-4 ${
            backendStatus === 'connected'
              ? 'text-green-600'
              : backendStatus === 'offline'
              ? 'text-yellow-600'
              : 'text-gray-600'
          }`} />
          <span className={`text-xs font-medium ${
            backendStatus === 'connected'
              ? 'text-green-700'
              : backendStatus === 'offline'
              ? 'text-yellow-700'
              : 'text-gray-700'
          }`}>
            {backendStatus === 'connected'
              ? 'Server Connected - Files stored securely'
              : backendStatus === 'offline'
              ? 'Offline Mode - Files stored locally'
              : 'Checking server connection...'}
          </span>
        </motion.div>

        {!uploadMethod && !uploadSuccess && (
          <div className="space-y-3">
            {/* Quick Access Button - Opens Bottom Sheet */}
            <motion.button
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowCamera(true)}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-2xl p-5 flex items-center justify-between shadow-lg hover:shadow-xl transition-shadow"
            >
              <div className="flex items-center space-x-3">
                <div className="bg-white/20 backdrop-blur p-3 rounded-xl">
                  <DocumentPlusIcon className="w-6 h-6 text-white" />
                </div>
                <div className="text-left">
                  <h3 className="font-bold text-lg">Quick Add</h3>
                  <p className="text-sm text-white/90">Fastest way to add documents</p>
                </div>
              </div>
              <div className="bg-white/20 backdrop-blur px-3 py-1 rounded-full">
                <span className="text-xs font-semibold">RECOMMENDED</span>
              </div>
            </motion.button>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-3 bg-white text-gray-500">or choose below</span>
              </div>
            </div>

            {uploadMethods.map((method, index) => (
              <motion.button
                key={method.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * index }}
                onClick={() => {
                  setUploadMethod(method.id);
                  if (method.id === 'file') {
                    fileInputRef.current?.click();
                  } else if (method.id === 'camera') {
                    // For camera, we'll use file input with capture attribute
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'image/*';
                    input.capture = 'environment';
                    input.onchange = handleFileUpload;
                    input.click();
                  }
                }}
                className="w-full bg-white rounded-2xl p-4 flex items-center space-x-4 hover:shadow-xl transition-all border border-gray-100 shadow-lg"
              >
                <div className={`${method.iconBg} rounded-xl p-3`}>
                  <method.icon className={`w-6 h-6 ${method.iconColor}`} />
                </div>
                <div className="flex-1 text-left">
                  <h3 className="font-semibold text-gray-900">
                    {method.title}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {method.description}
                  </p>
                </div>
                <svg
                  className="w-5 h-5 text-gray-400"
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

        {/* File Upload Input (Hidden) */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,image/*"
          onChange={handleFileUpload}
          className="hidden"
        />

        {/* Provider Connection Form */}
        {uploadMethod === 'provider' && !uploadSuccess && (
          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            onSubmit={handleProviderConnect}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Provider Email Address
              </label>
              <input
                type="email"
                value={providerEmail}
                onChange={(e) => setProviderEmail(e.target.value)}
                placeholder="provider@hospital.com"
                required
                className="w-full px-4 py-3 bg-gray-100 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 border border-gray-100"
              />
              <p className="text-xs text-gray-500 mt-2">
                We'll send a secure request to this email address
              </p>
            </div>

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => setUploadMethod(null)}
                className="flex-1 bg-gray-100 text-gray-900 py-3 rounded-xl font-medium hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-semibold disabled:opacity-50 hover:bg-blue-700 transition-colors"
              >
                {loading ? 'Connecting...' : 'Send Request'}
              </button>
            </div>
          </motion.form>
        )}

        {/* Voice Recording Interface */}
        {uploadMethod === 'voice' && !uploadSuccess && (
          <VoiceRecorder
            onComplete={handleVoiceComplete}
            onCancel={handleVoiceCancel}
          />
        )}

        {/* Upload Progress */}
        {loading && uploadProgress > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-8 bg-gray-100 rounded-2xl p-6 shadow-lg"
          >
            <div className="flex items-center justify-center mb-4">
              <CloudArrowUpIcon className="w-16 h-16 text-blue-600 animate-pulse" />
            </div>

            <p className="text-center font-medium text-gray-900 mb-2">
              Almost there! Processing your document...
            </p>

            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <motion.div
                className="h-full bg-blue-600"
                initial={{ width: 0 }}
                animate={{ width: `${uploadProgress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>

            <p className="text-center text-sm text-gray-500 mt-2">
              {uploadProgress}% complete - You're doing great!
            </p>
          </motion.div>
        )}

        {/* Success Message */}
        {uploadSuccess && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-8 bg-green-50 rounded-2xl p-6 shadow-lg"
          >
            <div className="flex flex-col items-center">
              <CheckCircleIcon className="w-16 h-16 text-green-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Perfect! Document Secured
              </h3>
              <p className="text-sm text-gray-600 text-center">
                Your document is safe with us and ready when you need it
              </p>
            </div>
          </motion.div>
        )}

        {/* Recent Uploads Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8 bg-blue-50 rounded-2xl p-4 shadow-lg"
        >
          <h3 className="font-medium text-blue-600 mb-2">Good to Know</h3>
          <ul className="space-y-1 text-sm text-gray-600">
            <li>• We'll organize everything automatically for you</li>
            <li>• Blurry photos? No problem - we'll enhance them</li>
            <li>• Your documents are encrypted and private</li>
            <li>• You can share with doctors anytime</li>
          </ul>
        </motion.div>
      </div>

      {/* Camera Capture Modal - Direct from Quick Add */}
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

      {/* Document Extraction Summary - Direct after capture */}
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
            setShowSummary(false);
            setCapturedImage(null);
            setShowSuccessAnimation(true);

            // Show sync notification if sync options were selected
            if (data.syncOptions && data.syncOptions.length > 0) {
              setTimeout(() => {
                const mockSyncResult = {
                  success: true,
                  eventsCreated: data.syncOptions.length,
                  results: data.syncOptions.map(opt => ({
                    summary: `Synced to ${opt}`,
                    start: { dateTime: new Date().toISOString() }
                  })),
                  syncedAt: new Date().toISOString()
                };

                setSyncNotification(mockSyncResult);
                setShowSyncNotification(true);

                setTimeout(() => {
                  setShowSyncNotification(false);
                }, 8000);
              }, 3000);
            }

            setTimeout(() => setShowSuccessAnimation(false), 3000);
          }}
          onRetake={() => {
            setShowSummary(false);
            setCapturedImage(null);
            setShowCamera(true);
          }}
          onCancel={() => {
            setShowSummary(false);
            setCapturedImage(null);
          }}
        />
      )}
    </div>
  );
}

export default UploadPage;
