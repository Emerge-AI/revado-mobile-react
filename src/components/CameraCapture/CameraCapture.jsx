import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CameraIcon,
  XMarkIcon,
  CheckIcon,
  SparklesIcon,
  DocumentTextIcon,
  IdentificationIcon,
  BeakerIcon,
  ClipboardDocumentListIcon,
  HeartIcon,
  PhotoIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

// Document type detection patterns
const DOCUMENT_TYPES = {
  insurance: {
    id: 'insurance',
    name: 'Insurance Card',
    icon: IdentificationIcon,
    color: 'blue',
    keywords: ['insurance', 'member', 'group', 'copay', 'deductible', 'provider'],
    patterns: [/member\s*id/i, /group\s*#/i, /policy/i, /insurance/i]
  },
  medication: {
    id: 'medication',
    name: 'Medication List',
    icon: ClipboardDocumentListIcon,
    color: 'purple',
    keywords: ['medication', 'prescription', 'dosage', 'mg', 'take', 'daily'],
    patterns: [/prescription/i, /medication/i, /dosage/i, /\d+\s*mg/i]
  },
  lab: {
    id: 'lab',
    name: 'Lab Results',
    icon: BeakerIcon,
    color: 'green',
    keywords: ['lab', 'test', 'result', 'range', 'blood', 'urine'],
    patterns: [/lab\s*results/i, /blood\s*test/i, /cholesterol/i, /glucose/i]
  },
  imaging: {
    id: 'imaging',
    name: 'Medical Imaging',
    icon: PhotoIcon,
    color: 'indigo',
    keywords: ['xray', 'x-ray', 'ct', 'mri', 'ultrasound', 'scan'],
    patterns: [/x-ray/i, /mri/i, /ct\s*scan/i, /ultrasound/i]
  },
  vitals: {
    id: 'vitals',
    name: 'Vital Signs',
    icon: HeartIcon,
    color: 'red',
    keywords: ['blood pressure', 'heart rate', 'temperature', 'oxygen', 'weight'],
    patterns: [/blood\s*pressure/i, /\d+\/\d+/i, /heart\s*rate/i, /bpm/i]
  },
  general: {
    id: 'general',
    name: 'Medical Document',
    icon: DocumentTextIcon,
    color: 'gray',
    keywords: [],
    patterns: []
  }
};

function CameraCapture({ onComplete, onCancel }) {
  const [cameraActive, setCameraActive] = useState(true);
  const [capturedImage, setCapturedImage] = useState(null);
  const [detectedType, setDetectedType] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const [confidence, setConfidence] = useState(0);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const canvasRef = useRef(null);
  const analyzeIntervalRef = useRef(null);

  useEffect(() => {
    if (cameraActive) {
      startCamera();
    }
    return () => {
      stopCamera();
    };
  }, [cameraActive]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;

        // Start document type detection
        startDocumentAnalysis();
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      // Fallback to file input
      handleFallbackToFileInput();
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (analyzeIntervalRef.current) {
      clearInterval(analyzeIntervalRef.current);
    }
  };

  const startDocumentAnalysis = () => {
    // Simulate document type detection every 2 seconds
    let cycleCount = 0;
    analyzeIntervalRef.current = setInterval(() => {
      cycleCount++;

      // Simulate detection with increasing confidence
      const types = Object.values(DOCUMENT_TYPES);
      const randomType = types[Math.floor(Math.random() * (types.length - 1))];

      setDetectedType(randomType);
      setConfidence(Math.min(30 + cycleCount * 15, 95));

      // After 3 seconds, lock onto a type
      if (cycleCount >= 3) {
        setIsAnalyzing(false);
        setConfidence(95);
      }
    }, 1000);
  };

  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert to image
    canvas.toBlob((blob) => {
      const imageUrl = URL.createObjectURL(blob);
      setCapturedImage({
        url: imageUrl,
        blob: blob,
        type: detectedType || DOCUMENT_TYPES.general
      });
      setCameraActive(false);
      stopCamera();
    }, 'image/jpeg', 0.9);
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setCameraActive(true);
    setIsAnalyzing(true);
    setDetectedType(null);
    setConfidence(0);
  };

  const handleConfirm = () => {
    if (capturedImage) {
      onComplete(capturedImage);
    }
  };

  // Auto-proceed after capture
  useEffect(() => {
    if (capturedImage) {
      // Auto-proceed after a short delay to show the captured image
      const timer = setTimeout(() => {
        handleConfirm();
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [capturedImage]);

  const handleFallbackToFileInput = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        const imageUrl = URL.createObjectURL(file);
        setCapturedImage({
          url: imageUrl,
          blob: file,
          type: DOCUMENT_TYPES.general
        });
        setCameraActive(false);
      }
    };
    input.click();
  };

  return (
    <div className="fixed inset-0 bg-black z-50">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/70 to-transparent pt-safe-top px-4 py-4">
        <div className="flex items-center justify-between">
          <button
            onClick={onCancel}
            className="p-2 bg-white/20 backdrop-blur-sm rounded-full text-white"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>

          {detectedType && !capturedImage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1.5"
            >
              <detectedType.icon className={`w-4 h-4 text-${detectedType.color}-400`} />
              <span className="text-white text-sm font-medium">{detectedType.name}</span>
              {!isAnalyzing && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="flex items-center gap-1"
                >
                  <CheckIcon className="w-4 h-4 text-green-400" />
                  <span className="text-green-400 text-xs">{confidence}%</span>
                </motion.div>
              )}
            </motion.div>
          )}
        </div>
      </div>

      {/* Camera View */}
      {cameraActive && (
        <>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />

          {/* Document Detection Overlay */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <motion.div
              animate={{
                scale: isAnalyzing ? [1, 1.02, 1] : 1,
                opacity: isAnalyzing ? [0.8, 1, 0.8] : 1
              }}
              transition={{
                duration: 2,
                repeat: isAnalyzing ? Infinity : 0
              }}
              className="relative w-[90%] max-w-md aspect-[1.586] border-2 border-white/50 rounded-2xl"
            >
              {/* Corner markers */}
              <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-2xl" />
              <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-2xl" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-2xl" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-2xl" />

              {/* Scanning animation */}
              {isAnalyzing && (
                <motion.div
                  animate={{ y: ['0%', '100%', '0%'] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-blue-400 to-transparent"
                />
              )}
            </motion.div>
          </div>

          {/* Analysis Status */}
          <div className="absolute bottom-32 left-0 right-0 flex flex-col items-center gap-2 px-4">
            {isAnalyzing ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-black/50 backdrop-blur-sm rounded-full px-4 py-2 flex items-center gap-2"
              >
                <ArrowPathIcon className="w-4 h-4 text-white animate-spin" />
                <span className="text-white text-sm">Detecting document type...</span>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-green-500/20 backdrop-blur-sm rounded-full px-4 py-2 flex items-center gap-2"
              >
                <SparklesIcon className="w-4 h-4 text-green-400" />
                <span className="text-white text-sm font-medium">Ready to capture!</span>
              </motion.div>
            )}
          </div>
        </>
      )}

      {/* Captured Image Preview */}
      {capturedImage && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 flex items-center justify-center bg-black"
        >
          <img
            src={capturedImage.url}
            alt="Captured document"
            className="max-w-full max-h-full object-contain"
          />

          {/* Processing indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="absolute bottom-32 bg-black/50 backdrop-blur-sm rounded-full px-4 py-2 flex items-center gap-2"
          >
            <ArrowPathIcon className="w-4 h-4 text-white animate-spin" />
            <span className="text-white text-sm">Processing...</span>
          </motion.div>
        </motion.div>
      )}

      {/* Bottom Controls */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent pb-safe-bottom px-4 py-6">
        <div className="flex items-center justify-center gap-4">
          {cameraActive && (
            <button
              onClick={handleCapture}
              disabled={isAnalyzing}
              className={`w-20 h-20 rounded-full border-4 border-white flex items-center justify-center transition-all ${
                isAnalyzing
                  ? 'opacity-50 scale-95'
                  : 'hover:scale-105 active:scale-95'
              }`}
            >
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
                <CameraIcon className="w-8 h-8 text-black" />
              </div>
            </button>
          )}
        </div>

        {cameraActive && !isAnalyzing && (
          <p className="text-center text-white/70 text-sm mt-4">
            Position your {detectedType?.name.toLowerCase() || 'document'} within the frame
          </p>
        )}
      </div>

      {/* Hidden canvas for image capture */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}

export default CameraCapture;
