import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useHealthRecords } from '../contexts/HealthRecordsContext';
import apiService from '../services/api';
import { 
  DocumentPlusIcon,
  CameraIcon,
  EnvelopeIcon,
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

  const uploadMethods = [
    {
      id: 'file',
      icon: DocumentPlusIcon,
      title: 'Upload PDF/Image',
      description: 'Lab results, notes, records',
      color: 'bg-blue-500',
    },
    {
      id: 'camera',
      icon: CameraIcon,
      title: 'Take Photo',
      description: 'Capture document with camera',
      color: 'bg-purple-500',
    },
    {
      id: 'provider',
      icon: EnvelopeIcon,
      title: 'Connect Provider',
      description: 'Request records via email',
      color: 'bg-green-500',
    },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-black pb-20">
      <div className="pt-safe-top px-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="py-6"
        >
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Add Health Records
          </h1>
          <p className="text-ios-gray-600 dark:text-ios-gray-400 mt-1">
            Choose how to import your records
          </p>
        </motion.div>

        {/* Backend Status Indicator */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`mb-4 px-3 py-2 rounded-lg flex items-center space-x-2 ${
            backendStatus === 'connected' 
              ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' 
              : backendStatus === 'offline'
              ? 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800'
              : 'bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-800'
          }`}
        >
          <ServerIcon className={`w-4 h-4 ${
            backendStatus === 'connected' 
              ? 'text-green-600 dark:text-green-400' 
              : backendStatus === 'offline'
              ? 'text-yellow-600 dark:text-yellow-400'
              : 'text-gray-600 dark:text-gray-400'
          }`} />
          <span className={`text-xs font-medium ${
            backendStatus === 'connected' 
              ? 'text-green-700 dark:text-green-300' 
              : backendStatus === 'offline'
              ? 'text-yellow-700 dark:text-yellow-300'
              : 'text-gray-700 dark:text-gray-300'
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
                className="w-full bg-ios-gray-100 dark:bg-ios-gray-900 rounded-2xl p-4 flex items-center space-x-4 hover:bg-ios-gray-200 dark:hover:bg-ios-gray-800 transition-colors"
              >
                <div className={`${method.color} rounded-xl p-3`}>
                  <method.icon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 text-left">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {method.title}
                  </h3>
                  <p className="text-sm text-ios-gray-600 dark:text-ios-gray-400">
                    {method.description}
                  </p>
                </div>
                <svg
                  className="w-5 h-5 text-ios-gray-400"
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
              <label className="block text-sm font-medium text-gray-700 dark:text-ios-gray-300 mb-2">
                Provider Email Address
              </label>
              <input
                type="email"
                value={providerEmail}
                onChange={(e) => setProviderEmail(e.target.value)}
                placeholder="provider@hospital.com"
                required
                className="w-full px-4 py-3 bg-ios-gray-100 dark:bg-ios-gray-900 rounded-xl text-gray-900 dark:text-white placeholder-ios-gray-500 focus:outline-none focus:ring-2 focus:ring-ios-blue"
              />
              <p className="text-xs text-ios-gray-500 mt-2">
                We'll send a secure request to this email address
              </p>
            </div>

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => setUploadMethod(null)}
                className="flex-1 bg-ios-gray-100 dark:bg-ios-gray-800 text-gray-900 dark:text-white py-3 rounded-xl font-medium hover:bg-ios-gray-200 dark:hover:bg-ios-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-ios-blue text-white py-3 rounded-xl font-semibold disabled:opacity-50 hover:bg-blue-600 transition-colors"
              >
                {loading ? 'Connecting...' : 'Send Request'}
              </button>
            </div>
          </motion.form>
        )}

        {/* Upload Progress */}
        {loading && uploadProgress > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-8 bg-ios-gray-100 dark:bg-ios-gray-900 rounded-2xl p-6"
          >
            <div className="flex items-center justify-center mb-4">
              <CloudArrowUpIcon className="w-16 h-16 text-ios-blue animate-pulse" />
            </div>
            
            <p className="text-center font-medium text-gray-900 dark:text-white mb-2">
              Uploading...
            </p>
            
            <div className="w-full bg-ios-gray-200 dark:bg-ios-gray-800 rounded-full h-2 overflow-hidden">
              <motion.div
                className="h-full bg-ios-blue"
                initial={{ width: 0 }}
                animate={{ width: `${uploadProgress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            
            <p className="text-center text-sm text-ios-gray-500 mt-2">
              {uploadProgress}% complete
            </p>
          </motion.div>
        )}

        {/* Success Message */}
        {uploadSuccess && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-8 bg-green-50 dark:bg-green-900/20 rounded-2xl p-6"
          >
            <div className="flex flex-col items-center">
              <CheckCircleIcon className="w-16 h-16 text-green-500 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Upload Successful!
              </h3>
              <p className="text-sm text-ios-gray-600 dark:text-ios-gray-400 text-center">
                Your record is being processed and will be ready soon
              </p>
            </div>
          </motion.div>
        )}

        {/* Recent Uploads Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8 bg-ios-blue/10 dark:bg-ios-blue/20 rounded-2xl p-4"
        >
          <h3 className="font-medium text-ios-blue mb-2">Quick Tips</h3>
          <ul className="space-y-1 text-sm text-ios-gray-600 dark:text-ios-gray-400">
            <li>• PDFs are processed automatically with AI</li>
            <li>• Photos are enhanced and text is extracted</li>
            <li>• Provider connections update nightly</li>
            <li>• All uploads are encrypted and secure</li>
          </ul>
        </motion.div>
      </div>
    </div>
  );
}

export default UploadPage;