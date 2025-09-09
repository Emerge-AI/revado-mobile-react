import { useState, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useHealthRecords } from '../../contexts/HealthRecordsContext';
import {
  CheckCircleIcon,
  PencilIcon,
  EyeIcon,
  EyeSlashIcon,
  SparklesIcon,
  CalendarDaysIcon,
  ClipboardDocumentListIcon,
  HeartIcon,
  BeakerIcon,
  DocumentArrowUpIcon,
  CloudArrowUpIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  CheckIcon,
  BookmarkIcon,
  ArrowPathIcon,
  InformationCircleIcon,
  ExclamationTriangleIcon,
  UserIcon,
  MapPinIcon,
  ClockIcon,
  PlusIcon,
  XMarkIcon,
  ShareIcon,
  IdentificationIcon,
  PhotoIcon,
  BellAlertIcon
} from '@heroicons/react/24/outline';

// Extract structured data from document fields
function extractDocumentEvents(fields, documentType) {
  const events = [];
  const medications = [];
  const reminders = [];

  // Extract based on document type
  switch(documentType.id) {
    case 'lab':
      // Extract follow-up appointment if mentioned
      const testDate = fields.find(f => f.label === 'Test Date')?.value;
      if (testDate) {
        events.push({
          id: `evt_${Date.now()}_1`,
          type: 'follow_up',
          title: 'Lab Results Follow-up',
          description: 'Review lab results with your provider',
          date: getNextDate(14), // 2 weeks from now
          time: '10:00 AM',
          location: 'Provider Office',
          priority: 'medium',
          provider: fields.find(f => f.label === 'Provider')?.value || 'Healthcare Provider',
          calendarReady: true,
          confidence: 0.85
        });

        // Add monitoring reminder
        reminders.push({
          id: `rem_${Date.now()}_1`,
          type: 'monitoring',
          title: 'Monitor Cholesterol',
          description: 'Track dietary changes and exercise',
          frequency: 'weekly',
          startDate: new Date().toISOString().split('T')[0],
          instructions: [
            'Follow low-cholesterol diet',
            'Exercise 30 minutes daily',
            'Log food intake'
          ],
          priority: 'medium',
          confidence: 0.8
        });
      }
      break;

    case 'medication':
      // Extract medication information
      const medName = fields.find(f => f.label === 'Medication')?.value;
      const dosage = fields.find(f => f.label === 'Dosage')?.value;
      const frequency = fields.find(f => f.label === 'Frequency')?.value;

      if (medName) {
        medications.push({
          id: `med_${Date.now()}_1`,
          action: 'start',
          name: medName,
          dosage: dosage,
          frequency: frequency,
          instructions: 'Take as prescribed',
          startDate: new Date().toISOString().split('T')[0],
          prescriber: fields.find(f => f.label === 'Prescriber')?.value,
          priority: 'high',
          confidence: 0.92
        });

        // Add medication reminder
        reminders.push({
          id: `rem_${Date.now()}_2`,
          type: 'medication',
          title: `Take ${medName}`,
          description: `${dosage} - ${frequency}`,
          frequency: 'daily',
          startDate: new Date().toISOString().split('T')[0],
          instructions: [
            `Take ${dosage} ${frequency}`,
            'Take with food if needed',
            'Do not skip doses'
          ],
          priority: 'high',
          confidence: 0.9
        });
      }
      break;

    case 'insurance':
      // Add insurance update reminder
      reminders.push({
        id: `rem_${Date.now()}_3`,
        type: 'administrative',
        title: 'Insurance Card Updated',
        description: 'New insurance information saved',
        frequency: 'once',
        startDate: new Date().toISOString().split('T')[0],
        instructions: [
          'Share with healthcare providers',
          'Update pharmacy records',
          'Keep card accessible'
        ],
        priority: 'low',
        confidence: 0.95
      });
      break;

    case 'vitals':
      // Track vitals trends
      const bp = fields.find(f => f.label === 'Blood Pressure')?.value;
      if (bp && bp.includes('/')) {
        const [systolic] = bp.split('/').map(n => parseInt(n));
        if (systolic > 140) {
          events.push({
            id: `evt_${Date.now()}_2`,
            type: 'appointment',
            title: 'Blood Pressure Check',
            description: 'Follow up on elevated blood pressure reading',
            date: getNextDate(7), // 1 week
            time: '2:00 PM',
            location: 'Primary Care Office',
            priority: 'high',
            needsPrep: true,
            prepInstructions: [
              'Bring blood pressure log',
              'List current medications',
              'Avoid caffeine before visit'
            ],
            calendarReady: true,
            confidence: 0.88
          });
        }
      }
      break;
  }

  return { events, medications, reminders };
}

function getNextDate(daysFromNow) {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString().split('T')[0];
}

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
      syncOptions: ['profile']
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
      syncOptions: ['medlist', 'reminders']
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
      syncOptions: ['calendar', 'trends']
    },
    vitals: {
      fields: [
        { label: 'Blood Pressure', value: '120/80', editable: true },
        { label: 'Heart Rate', value: '72 bpm', editable: true },
        { label: 'Temperature', value: '98.6°F', editable: true },
        { label: 'Weight', value: '165 lbs', editable: true },
        { label: 'Date', value: new Date().toLocaleDateString(), editable: true }
      ],
      syncOptions: ['vitals', 'calendar']
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

function DocumentExtractionSummary({
  capturedImage,
  onSave,
  onRetake,
  onCancel
}) {
  const {
    uploadFile,
    addMedication,
    addMedicalEvent,
    syncEventsToCalendar,
    setReminders: addReminders
  } = useHealthRecords();

  const [isProcessingOCR, setIsProcessingOCR] = useState(true);
  const [showFullExtraction, setShowFullExtraction] = useState(false);
  const [editedFields, setEditedFields] = useState([]);
  const [editingField, setEditingField] = useState(null);
  const [extractedEvents, setExtractedEvents] = useState(null);
  const [isProcessingEvents, setIsProcessingEvents] = useState(false);
  const [expandedEvents, setExpandedEvents] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveOption, setSaveOption] = useState('health-records');
  const [showSaveOptions, setShowSaveOptions] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [selectedSyncOptions, setSelectedSyncOptions] = useState(new Set());
  const [showFullImage, setShowFullImage] = useState(false);

  // Simulate OCR processing and extraction
  useEffect(() => {
    const processOCR = async () => {
      setIsProcessingOCR(true);
      // Simulate OCR delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Get mock extraction based on document type
      const extraction = getMockExtraction(capturedImage.type);
      setEditedFields(extraction.fields);
      setSelectedSyncOptions(new Set(extraction.syncOptions));
      setIsProcessingOCR(false);

      // Then process events
      setIsProcessingEvents(true);
      await new Promise(resolve => setTimeout(resolve, 1500));

      const extracted = extractDocumentEvents(
        extraction.fields,
        capturedImage?.type
      );
      setExtractedEvents(extracted);
      setIsProcessingEvents(false);
    };

    processOCR();
  }, [capturedImage]);

  const handleFieldEdit = (index, newValue) => {
    const updatedFields = [...editedFields];
    updatedFields[index].value = newValue;
    setEditedFields(updatedFields);
  };

  const handleSave = async () => {
    setIsSaving(true);

    try {
      // Create a file-like object for the upload
      const documentFile = {
        name: `${capturedImage.type.name}_${Date.now()}.jpg`,
        type: 'image/jpeg',
        size: 1024 * 100, // Simulated size
        voiceData: null,
        extractedData: editedFields,
        documentType: capturedImage.type,
        capturedImage: capturedImage.url,
        saveWithSync: saveOption === 'health-records-sync'
      };

      // Upload the document to health records
      const uploadedRecord = await uploadFile(documentFile);

      // Save extracted medications to the medication list
      if (extractedEvents?.medications) {
        for (const medication of extractedEvents.medications) {
          await addMedication(medication);
        }
      }

      // Save extracted events to the medical events
      if (extractedEvents?.events) {
        for (const event of extractedEvents.events) {
          await addMedicalEvent(event);
        }
      }

      // Save reminders if any
      if (extractedEvents?.reminders && extractedEvents.reminders.length > 0) {
        const existingReminders = JSON.parse(localStorage.getItem('reminders') || '[]');
        const updatedReminders = [...existingReminders, ...extractedEvents.reminders];
        localStorage.setItem('reminders', JSON.stringify(updatedReminders));

        if (addReminders) {
          addReminders(updatedReminders);
        }
      }

      // Sync to calendar if requested
      if (saveOption === 'health-records-sync' && extractedEvents) {
        await syncEventsToCalendar(uploadedRecord.id, extractedEvents);
      }

      setSaveSuccess(true);

      // Return to the upload page after success
      setTimeout(() => {
        const saveData = {
          ...capturedImage,
          extractedData: editedFields,
          extractedEvents: extractedEvents,
          syncOptions: Array.from(selectedSyncOptions),
          saveWithSync: saveOption === 'health-records-sync',
          recordId: uploadedRecord.id
        };
        onSave(saveData);
      }, 1500);

    } catch (error) {
      console.error('Save failed:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddToCalendar = (event) => {
    console.log('Adding to calendar:', event);
    // In real app, would use Google Calendar API
  };

  const handleDismissEvent = (eventId) => {
    setExtractedEvents(prev => ({
      ...prev,
      events: prev.events.filter(e => e.id !== eventId)
    }));
  };

  const getDocumentTypeConfig = (type) => {
    const configs = {
      insurance: { icon: IdentificationIcon, color: 'blue', label: 'Insurance Card' },
      medication: { icon: ClipboardDocumentListIcon, color: 'purple', label: 'Medication List' },
      lab: { icon: BeakerIcon, color: 'green', label: 'Lab Results' },
      vitals: { icon: HeartIcon, color: 'red', label: 'Vital Signs' },
      imaging: { icon: PhotoIcon, color: 'indigo', label: 'Medical Imaging' },
      general: { icon: DocumentArrowUpIcon, color: 'gray', label: 'Medical Document' }
    };
    return configs[type?.id] || configs.general;
  };

  const typeConfig = getDocumentTypeConfig(capturedImage?.type);
  const TypeIcon = typeConfig.icon;

  // Calculate summary stats
  const totalExtractedFields = editedFields.length;
  const totalEvents = extractedEvents?.events?.length || 0;
  const totalMedications = extractedEvents?.medications?.length || 0;
  const totalReminders = extractedEvents?.reminders?.length || 0;
  const urgentItems = [
    ...(extractedEvents?.events || []),
    ...(extractedEvents?.medications || []),
    ...(extractedEvents?.reminders || [])
  ].filter(item => item.priority === 'high' || item.priority === 'urgent').length;

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 pt-safe-top">
        <div className="px-4 py-3">
          <div className="flex items-center justify-center gap-2">
            <TypeIcon className={`w-5 h-5 text-${typeConfig.color}-600`} />
            <span className="font-semibold text-gray-900">{typeConfig.label}</span>
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto bg-gray-50 pb-24">
        {isProcessingOCR ? (
          <div className="flex flex-col items-center justify-center py-32">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full mb-4"
            />
            <p className="text-gray-700 font-medium">Extracting text from image...</p>
            <div className="mt-2 flex items-center gap-2">
              <SparklesIcon className="w-4 h-4 text-blue-600" />
              <span className="text-sm text-gray-500">AI-powered extraction</span>
            </div>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="px-4 py-6 space-y-6"
          >
          {/* Success Header */}
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="text-center"
          >
            <motion.div
              className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center shadow-lg"
              animate={{
                boxShadow: [
                  "0 10px 30px rgba(34, 197, 94, 0.3)",
                  "0 15px 40px rgba(34, 197, 94, 0.4)",
                  "0 10px 30px rgba(34, 197, 94, 0.3)"
                ]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <CheckCircleIcon className="w-8 h-8 text-white" />
            </motion.div>

            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Extraction Complete!
            </h3>
            <p className="text-gray-600 text-sm">
              Your document has been processed and analyzed
            </p>
          </motion.div>

          {/* Document Info */}
          <div className={`bg-${typeConfig.color}-50 rounded-xl p-4 border border-${typeConfig.color}-100`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <TypeIcon className={`w-4 h-4 text-${typeConfig.color}-600`} />
                <span className={`text-sm font-medium text-${typeConfig.color}-700`}>Document Details</span>
              </div>
              <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-green-100">
                <CheckCircleIcon className="w-3 h-3 text-green-600" />
                <span className="text-xs font-medium text-green-700">Verified</span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-lg font-semibold text-gray-900">{totalExtractedFields}</p>
                <p className="text-xs text-gray-600">Fields</p>
              </div>
              <div>
                <p className="text-lg font-semibold text-gray-900">95%</p>
                <p className="text-xs text-gray-600">Confidence</p>
              </div>
              <div>
                <p className="text-lg font-semibold text-gray-900">{capturedImage?.type?.name}</p>
                <p className="text-xs text-gray-600">Type</p>
              </div>
            </div>
          </div>

          {/* Extracted Fields Summary */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <SparklesIcon className="w-5 h-5 text-purple-600" />
                <h4 className="font-semibold text-gray-900">Extracted Information</h4>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowFullExtraction(!showFullExtraction)}
                className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                {showFullExtraction ? (
                  <>
                    <EyeSlashIcon className="w-4 h-4 text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">Hide</span>
                  </>
                ) : (
                  <>
                    <EyeIcon className="w-4 h-4 text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">Show All</span>
                  </>
                )}
              </motion.button>
            </div>

            {/* Editable Fields */}
            <div className="space-y-2">
              {editedFields.slice(0, showFullExtraction ? undefined : 3).map((field, index) => (
                <div key={index} className="py-2 border-b border-gray-100 last:border-0">
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
                      className={`w-full flex items-center justify-between ${field.editable ? 'hover:bg-gray-50 -mx-2 px-2 py-1 rounded transition-colors' : ''}`}
                    >
                      <span className="text-sm font-medium text-gray-900 text-left">{field.value}</span>
                      {field.editable && (
                        <PencilIcon className="w-4 h-4 text-gray-400" />
                      )}
                    </button>
                  )}
                </div>
              ))}
              {!showFullExtraction && editedFields.length > 3 && (
                <p className="text-xs text-gray-500 text-center pt-1">
                  +{editedFields.length - 3} more fields
                </p>
              )}
            </div>
          </div>

          {/* Events Summary - Similar to voice assistant */}
          {isProcessingEvents ? (
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-lg">
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="w-8 h-8 mx-auto mb-3"
                  >
                    <SparklesIcon className="w-8 h-8 text-blue-600" />
                  </motion.div>
                  <p className="text-gray-600 font-medium">Analyzing for actionable items...</p>
                  <p className="text-sm text-gray-500 mt-1">Extracting appointments, medications, and reminders</p>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Summary Stats */}
              {(totalEvents > 0 || totalMedications > 0 || totalReminders > 0) && (
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl p-5 border border-purple-100">
                  <div className="flex items-center gap-2 mb-3">
                    <CalendarDaysIcon className="w-5 h-5 text-purple-600" />
                    <h4 className="font-semibold text-gray-900">Action Items Found</h4>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-center mb-3">
                    <div className="bg-white/50 rounded-lg p-3">
                      <p className="text-lg font-bold text-purple-600">{totalEvents}</p>
                      <p className="text-xs text-gray-600">Events</p>
                    </div>
                    <div className="bg-white/50 rounded-lg p-3">
                      <p className="text-lg font-bold text-blue-600">{totalMedications}</p>
                      <p className="text-xs text-gray-600">Medications</p>
                    </div>
                    <div className="bg-white/50 rounded-lg p-3">
                      <p className="text-lg font-bold text-green-600">{totalReminders}</p>
                      <p className="text-xs text-gray-600">Reminders</p>
                    </div>
                  </div>
                  {urgentItems > 0 && (
                    <div className="bg-red-100 border border-red-200 rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <ExclamationTriangleIcon className="w-4 h-4 text-red-600" />
                        <span className="text-sm font-medium text-red-800">
                          {urgentItems} high priority item{urgentItems > 1 ? 's' : ''} require attention
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Event Cards */}
              {extractedEvents?.events?.map((event) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-2xl border-2 border-blue-200 shadow-lg p-5"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3">
                      <div className="p-2.5 bg-blue-50 rounded-xl">
                        <CalendarDaysIcon className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900">{event.title}</h3>
                        <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                      </div>
                    </div>
                    {event.priority === 'high' && (
                      <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full font-medium">
                        High Priority
                      </span>
                    )}
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <CalendarDaysIcon className="w-4 h-4 text-blue-600" />
                      <span>{new Date(event.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
                    </div>
                    {event.time && (
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <ClockIcon className="w-4 h-4 text-green-600" />
                        <span>{event.time}</span>
                      </div>
                    )}
                    {event.location && (
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <MapPinIcon className="w-4 h-4 text-purple-600" />
                        <span>{event.location}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAddToCalendar(event)}
                      className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white py-2 px-4 rounded-xl font-medium hover:bg-blue-700 transition-colors"
                    >
                      <PlusIcon className="w-4 h-4" />
                      Add to Calendar
                    </button>
                    <button
                      onClick={() => handleDismissEvent(event.id)}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
                    >
                      <XMarkIcon className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ))}

              {/* Medications */}
              {extractedEvents?.medications?.map((med, index) => (
                <motion.div
                  key={med.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-2xl border-2 border-purple-200 shadow-lg p-5"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className="p-2.5 bg-purple-50 rounded-xl">
                      <BeakerIcon className="w-5 h-5 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900">{med.name}</h3>
                      <p className="text-sm text-gray-600">{med.dosage} - {med.frequency}</p>
                    </div>
                    {med.action === 'start' && (
                      <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">
                        New
                      </span>
                    )}
                  </div>

                  <div className="bg-purple-50 rounded-lg p-3 mb-3">
                    <p className="text-sm text-purple-900 font-medium mb-1">Instructions</p>
                    <p className="text-sm text-purple-700">{med.instructions}</p>
                  </div>

                  <button className="w-full bg-purple-600 text-white py-2 rounded-xl font-medium hover:bg-purple-700 transition-colors">
                    Add to Medication List
                  </button>
                </motion.div>
              ))}

              {/* Reminders */}
              {extractedEvents?.reminders?.map((reminder, index) => (
                <motion.div
                  key={reminder.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-purple-50 border border-purple-200 rounded-xl p-4"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h5 className="font-medium text-purple-900">{reminder.title}</h5>
                    <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                      {reminder.frequency}
                    </span>
                  </div>
                  <p className="text-sm text-purple-700 mb-2">{reminder.description}</p>
                  {reminder.instructions && (
                    <ul className="space-y-1">
                      {reminder.instructions.map((instruction, idx) => (
                        <li key={idx} className="text-sm text-purple-600 flex items-start gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-2 flex-shrink-0" />
                          <span>{instruction}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </motion.div>
              ))}
            </>
          )}
            {/* Image Thumbnail - Tappable */}
            <button
              onClick={() => setShowFullImage(true)}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 flex items-center gap-3 w-full hover:shadow-md transition-shadow"
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
          </motion.div>
        )}
      </div>

      {/* Action Buttons - Fixed at bottom */}
      <div className="fixed bottom-14 left-0 right-0 bg-white border-t border-gray-100 px-4 py-3 shadow-lg">
        {saveSuccess ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-green-50 border border-green-200 rounded-xl p-4 text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.2 }}
              className="w-12 h-12 mx-auto mb-2 bg-green-500 rounded-full flex items-center justify-center"
            >
              <CheckCircleIcon className="w-6 h-6 text-white" />
            </motion.div>
            <p className="font-semibold text-green-800 mb-1">
              {saveOption === 'health-records-sync' ? 'Saved & Syncing!' : 'Successfully Saved!'}
            </p>
            <p className="text-sm text-green-600">
              {saveOption === 'health-records-sync'
                ? 'Document saved and events syncing to calendar'
                : 'Document added to your health records'
              }
            </p>
          </motion.div>
        ) : (
          <>
            {/* Save Options */}
            <AnimatePresence>
              {showSaveOptions && (
                <motion.div
                  initial={{ opacity: 0, y: 10, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, y: 10, height: 0 }}
                  className="mb-3 bg-white border border-gray-200 rounded-xl p-3 shadow-lg"
                >
                  <div className="space-y-2">
                    <button
                      onClick={() => {
                        setSaveOption('health-records');
                        setShowSaveOptions(false);
                      }}
                      className={`w-full p-3 rounded-lg border-2 text-left transition-all ${
                        saveOption === 'health-records'
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <DocumentArrowUpIcon className="w-5 h-5 text-blue-600 mt-0.5" />
                        <div>
                          <p className="font-medium text-gray-900">Save to Health Records</p>
                          <p className="text-xs text-gray-600 mt-0.5">
                            Store document and extracted data
                          </p>
                        </div>
                      </div>
                    </button>

                    {(totalEvents > 0 || totalMedications > 0) && (
                      <button
                        onClick={() => {
                          setSaveOption('health-records-sync');
                          setShowSaveOptions(false);
                        }}
                        className={`w-full p-3 rounded-lg border-2 text-left transition-all ${
                          saveOption === 'health-records-sync'
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <CloudArrowUpIcon className="w-5 h-5 text-purple-600 mt-0.5" />
                          <div>
                            <p className="font-medium text-gray-900 flex items-center gap-2">
                              Save + Sync to Calendar
                              <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full font-medium">
                                Smart
                              </span>
                            </p>
                            <p className="text-xs text-gray-600 mt-0.5">
                              Auto-sync {totalEvents} events & {totalMedications} medications
                            </p>
                          </div>
                        </div>
                      </button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Main Action Buttons */}
            <div className="flex gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSave}
                disabled={isSaving}
                className={`flex-1 py-3 rounded-xl font-semibold transition-all shadow-lg ${
                  isSaving
                    ? 'bg-gray-400 cursor-not-allowed'
                    : saveOption === 'health-records-sync'
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {isSaving ? (
                  <div className="flex items-center justify-center gap-2">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <SparklesIcon className="w-4 h-4" />
                    </motion.div>
                    {saveOption === 'health-records-sync' ? 'Saving & Syncing...' : 'Saving...'}
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    {saveOption === 'health-records-sync' ? (
                      <>
                        <CloudArrowUpIcon className="w-5 h-5" />
                        Save + Sync
                      </>
                    ) : (
                      <>
                        <DocumentArrowUpIcon className="w-5 h-5" />
                        Save to Records
                      </>
                    )}
                  </div>
                )}
              </motion.button>

              {/* Options Toggle */}
              <button
                onClick={() => setShowSaveOptions(!showSaveOptions)}
                className="px-3 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
              >
                <ChevronDownIcon
                  className={`w-5 h-5 transition-transform ${showSaveOptions ? 'rotate-180' : ''}`}
                />
              </button>

              <button
                onClick={onRetake}
                disabled={isSaving}
                className="px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                Retake
              </button>
            </div>
          </>
        )}
      </div>

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
    </div>
  );
}

export default DocumentExtractionSummary;
