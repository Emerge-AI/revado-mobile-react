import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import DocumentExtractionSummary from './DocumentExtractionSummary';
import {
  DocumentTextIcon,
  CheckCircleIcon,
  PencilSquareIcon,
  CalendarDaysIcon,
  ClipboardDocumentListIcon,
  HeartIcon,
  BellAlertIcon,
  SparklesIcon,
  ArrowRightIcon,
  ChevronRightIcon,
  XMarkIcon,
  CheckIcon,
  BeakerIcon,
  PhotoIcon,
  IdentificationIcon
} from '@heroicons/react/24/outline';

// Consistent color scheme for sync options
const SYNC_COLOR_SCHEME = {
  calendar: { bg: 'bg-blue-100', icon: 'text-blue-600', border: 'border-blue-200' },
  medlist: { bg: 'bg-purple-100', icon: 'text-purple-600', border: 'border-purple-200' },
  reminders: { bg: 'bg-orange-100', icon: 'text-orange-600', border: 'border-orange-200' },
  vitals: { bg: 'bg-red-100', icon: 'text-red-600', border: 'border-red-200' },
  profile: { bg: 'bg-green-100', icon: 'text-green-600', border: 'border-green-200' },
  trends: { bg: 'bg-indigo-100', icon: 'text-indigo-600', border: 'border-indigo-200' }
};

// Mock extraction based on document type
const getMockExtraction = (documentType) => {
  const extractions = {
    insurance: {
      fields: [
        { label: 'Member ID', value: 'ABC123456789', editable: true },
        { label: 'Group Number', value: 'GRP-2024-5678', editable: true },
        { label: 'Provider', value: 'Blue Cross Blue Shield', editable: false },
        { label: 'Coverage Type', value: 'PPO', editable: false },
        { label: 'Copay', value: '$25', editable: true },
        { label: 'Deductible', value: '$1,500', editable: true }
      ],
      syncOptions: [
        { id: 'profile', name: 'Update Profile', icon: IdentificationIcon, description: 'Save to your insurance info' }
      ]
    },
    medication: {
      fields: [
        { label: 'Medication', value: 'Lisinopril', editable: true },
        { label: 'Dosage', value: '10mg', editable: true },
        { label: 'Frequency', value: 'Once daily', editable: true },
        { label: 'Prescriber', value: 'Dr. Sarah Johnson', editable: true },
        { label: 'Pharmacy', value: 'CVS Pharmacy', editable: true },
        { label: 'Refills', value: '3 remaining', editable: true }
      ],
      syncOptions: [
        { id: 'medlist', name: 'Medication List', icon: ClipboardDocumentListIcon, description: 'Add to your med tracker' },
        { id: 'reminders', name: 'Set Reminders', icon: BellAlertIcon, description: 'Daily medication alerts' }
      ]
    },
    lab: {
      fields: [
        { label: 'Test Date', value: '2025-01-05', editable: true },
        { label: 'Cholesterol', value: '180 mg/dL', editable: true },
        { label: 'HDL', value: '55 mg/dL', editable: true },
        { label: 'LDL', value: '110 mg/dL', editable: true },
        { label: 'Glucose', value: '95 mg/dL', editable: true },
        { label: 'Provider', value: 'Quest Diagnostics', editable: false }
      ],
      syncOptions: [
        { id: 'calendar', name: 'Follow-up Reminder', icon: CalendarDaysIcon, description: 'Schedule next test' },
        { id: 'trends', name: 'Track Trends', icon: HeartIcon, description: 'Monitor your progress' }
      ]
    },
    vitals: {
      fields: [
        { label: 'Blood Pressure', value: '120/80', editable: true },
        { label: 'Heart Rate', value: '72 bpm', editable: true },
        { label: 'Temperature', value: '98.6°F', editable: true },
        { label: 'Weight', value: '165 lbs', editable: true },
        { label: 'Date', value: new Date().toLocaleDateString(), editable: true }
      ],
      syncOptions: [
        { id: 'vitals', name: 'Vitals Tracker', icon: HeartIcon, description: 'Add to health metrics' },
        { id: 'calendar', name: 'Next Check-up', icon: CalendarDaysIcon, description: 'Schedule monitoring' }
      ]
    },
    general: {
      fields: [
        { label: 'Document Type', value: 'Medical Record', editable: true },
        { label: 'Date', value: new Date().toLocaleDateString(), editable: true },
        { label: 'Provider', value: 'Healthcare Provider', editable: true },
        { label: 'Notes', value: 'Additional information extracted', editable: true }
      ],
      syncOptions: []
    }
  };

  return extractions[documentType.id] || extractions.general;
};

function ExtractionPreview({
  capturedImage,
  onSave,
  onCancel,
  onSyncOptions
}) {
  const [extractedData, setExtractedData] = useState(null);
  const [isProcessing, setIsProcessing] = useState(true);
  const [editingField, setEditingField] = useState(null);
  const [fields, setFields] = useState([]);
  const [selectedSyncOptions, setSelectedSyncOptions] = useState(new Set());
  const [showSyncMenu, setShowSyncMenu] = useState(false);
  const [showFullImage, setShowFullImage] = useState(false);
  const [showSummary, setShowSummary] = useState(false);

  useEffect(() => {
    // Simulate OCR processing
    setTimeout(() => {
      const extraction = getMockExtraction(capturedImage.type);
      setExtractedData(extraction);
      setFields(extraction.fields);
      setIsProcessing(false);
    }, 2000);
  }, [capturedImage]);

  const handleFieldEdit = (index, newValue) => {
    const updatedFields = [...fields];
    updatedFields[index].value = newValue;
    setFields(updatedFields);
  };

  const toggleSyncOption = (optionId) => {
    const newSelection = new Set(selectedSyncOptions);
    if (newSelection.has(optionId)) {
      newSelection.delete(optionId);
    } else {
      newSelection.add(optionId);
    }
    setSelectedSyncOptions(newSelection);
  };

  const handleContinue = () => {
    setShowSummary(true);
  };

  const handleSave = (data) => {
    onSave(data);
  };

  const handleRetake = () => {
    setShowSummary(false);
    onCancel();
  };

  const getSyncColorScheme = (optionId) => {
    return SYNC_COLOR_SCHEME[optionId] || SYNC_COLOR_SCHEME.profile;
  };

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      {/* Header - iOS style */}
      <div className="bg-white border-b border-gray-100 pt-safe-top">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={onCancel}
            className="text-blue-600 font-medium"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2">
            <capturedImage.type.icon className="w-5 h-5 text-gray-700" />
            <span className="font-semibold text-gray-900">{capturedImage.type.name}</span>
          </div>

          <div className="w-14" />
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto bg-gray-50">
        {isProcessing ? (
          <div className="flex flex-col items-center justify-center py-16">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-16 h-16 border-3 border-blue-200 border-t-blue-600 rounded-full"
            />
            <p className="mt-4 text-gray-700 font-medium">Extracting text from image...</p>
            <div className="mt-2 flex items-center gap-2">
              <SparklesIcon className="w-4 h-4 text-blue-600" />
              <span className="text-sm text-gray-500">AI-powered extraction</span>
            </div>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="pb-24"
          >
            {/* Success Banner */}
            <div className="bg-green-50 border-b border-green-100 px-4 py-3">
              <div className="flex items-center gap-2">
                <CheckCircleIcon className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium text-green-900">Document captured successfully</span>
              </div>
            </div>

            {/* Image Thumbnail - Tappable */}
            <button
              onClick={() => setShowFullImage(true)}
              className="bg-white mx-4 mt-4 rounded-xl shadow-sm border border-gray-100 p-3 flex items-center gap-3 w-[calc(100%-2rem)] hover:shadow-md transition-shadow"
            >
              <img
                src={capturedImage.url}
                alt="Captured document"
                className="w-16 h-16 rounded-lg object-cover"
              />
              <div className="flex-1 text-left">
                <p className="text-sm font-semibold text-gray-900">Original Document</p>
                <p className="text-xs text-gray-500">Tap to view full document</p>
              </div>
              <ChevronRightIcon className="w-5 h-5 text-gray-400" />
            </button>

            {/* Extracted Fields */}
            <div className="px-4 mt-6">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Extracted Information
              </h3>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {fields.map((field, index) => (
                  <div
                    key={index}
                    className={`px-4 py-3 ${index !== fields.length - 1 ? 'border-b border-gray-100' : ''}`}
                  >
                    <label className="text-xs font-medium text-gray-500 mb-1 block">
                      {field.label}
                    </label>

                    {editingField === index ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={field.value}
                          onChange={(e) => handleFieldEdit(index, e.target.value)}
                          className="flex-1 text-gray-900 font-medium bg-blue-50 px-2 py-1 rounded border-2 border-blue-500 outline-none"
                          autoFocus
                          onBlur={() => setEditingField(null)}
                        />
                        <button
                          onClick={() => setEditingField(null)}
                          className="p-1.5 bg-blue-600 text-white rounded-lg"
                        >
                          <CheckIcon className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => field.editable && setEditingField(index)}
                        className={`w-full flex items-center justify-between ${
                          field.editable ? 'hover:bg-gray-50 -mx-2 px-2 py-1 rounded transition-colors' : ''
                        }`}
                      >
                        <span className="text-gray-900 font-medium text-left">{field.value}</span>
                        {field.editable && (
                          <PencilSquareIcon className="w-4 h-4 text-gray-400" />
                        )}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Sync Options */}
            {extractedData?.syncOptions?.length > 0 && (
              <div className="px-4 mt-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                    Sync Options
                  </h3>
                  <span className="text-xs text-gray-400">Optional</span>
                </div>

                <div className="space-y-2">
                  {extractedData.syncOptions.map((option) => {
                    const colorScheme = getSyncColorScheme(option.id);
                    const isSelected = selectedSyncOptions.has(option.id);

                    return (
                      <motion.button
                        key={option.id}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => toggleSyncOption(option.id)}
                        className={`w-full bg-white rounded-xl shadow-sm border ${
                          isSelected ? colorScheme.border : 'border-gray-100'
                        } p-3 transition-all`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${colorScheme.bg}`}>
                              <option.icon className={`w-5 h-5 ${colorScheme.icon}`} />
                            </div>
                            <div className="text-left">
                              <p className="text-sm font-semibold text-gray-900">
                                {option.name}
                              </p>
                              <p className="text-xs text-gray-500">
                                {option.description}
                              </p>
                            </div>
                          </div>

                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                            isSelected
                              ? 'border-blue-600 bg-blue-600'
                              : 'border-gray-300'
                          }`}>
                            {isSelected && (
                              <CheckIcon className="w-3 h-3 text-white" />
                            )}
                          </div>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* Bottom Action Bar - Fixed above tab bar */}
      {!isProcessing && (
        <div className="fixed bottom-14 left-0 right-0 bg-white border-t border-gray-100 px-4 py-3 shadow-lg">
          <div className="flex items-center gap-3">
            <button
              onClick={handleContinue}
              className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              <span>Continue</span>
              <ChevronRightIcon className="w-5 h-5" />
            </button>

            {selectedSyncOptions.size > 0 && (
              <motion.button
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                onClick={() => setShowSyncMenu(true)}
                className="p-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl hover:shadow-lg transition-all"
              >
                <ArrowRightIcon className="w-6 h-6" />
              </motion.button>
            )}
          </div>

          {selectedSyncOptions.size > 0 && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center text-xs text-gray-500 mt-2"
            >
              {selectedSyncOptions.size} sync option{selectedSyncOptions.size > 1 ? 's' : ''} selected
            </motion.p>
          )}
        </div>
      )}

      {/* Full Image Viewer */}
      <AnimatePresence>
        {showFullImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black z-[70] flex flex-col"
          >
            {/* Header */}
            <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/70 to-transparent pt-safe-top px-4 py-4 z-10">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setShowFullImage(false)}
                  className="p-2 bg-white/20 backdrop-blur-sm rounded-full text-white"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
                <span className="text-white font-medium">
                  {capturedImage.type.name}
                </span>
                <div className="w-10" />
              </div>
            </div>

            {/* Image */}
            <div className="flex-1 flex items-center justify-center p-4">
              <img
                src={capturedImage.url}
                alt="Full document view"
                className="max-w-full max-h-full object-contain"
              />
            </div>

            {/* Bottom hint */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent pb-safe-bottom px-4 py-6">
              <p className="text-center text-white/70 text-sm">
                Pinch to zoom • Swipe to close
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sync Menu Overlay */}
      <AnimatePresence>
        {showSyncMenu && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-60 flex items-end"
            onClick={() => setShowSyncMenu(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-t-3xl w-full pb-safe-bottom"
            >
              <div className="p-1">
                <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto" />
              </div>

              <div className="p-6 pt-4">
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Ready to Sync!
                </h3>
                <p className="text-gray-600 mb-4">
                  Your data will be synced to:
                </p>

                <div className="space-y-2 mb-6">
                  {Array.from(selectedSyncOptions).map(optionId => {
                    const option = extractedData.syncOptions.find(o => o.id === optionId);
                    const colorScheme = getSyncColorScheme(optionId);
                    return (
                      <div key={optionId} className={`flex items-center gap-3 p-3 ${colorScheme.bg} rounded-xl`}>
                        <option.icon className={`w-5 h-5 ${colorScheme.icon}`} />
                        <span className="font-medium text-gray-900">{option.name}</span>
                      </div>
                    );
                  })}
                </div>

                <button
                  onClick={() => {
                    setShowSyncMenu(false);
                    handleSave();
                  }}
                  className="w-full bg-gradient-to-r from-purple-500 to-blue-500 text-white py-3 rounded-xl font-semibold"
                >
                  Confirm & Sync
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Document Summary Screen */}
      {showSummary && (
        <DocumentExtractionSummary
          capturedImage={capturedImage}
          extractedData={{
            fields: fields,
            syncOptions: Array.from(selectedSyncOptions)
          }}
          onSave={handleSave}
          onRetake={handleRetake}
        />
      )}
    </div>
  );
}

export default ExtractionPreview;
