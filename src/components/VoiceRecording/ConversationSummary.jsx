import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  CheckCircleIcon,
  PencilIcon,
  EyeIcon,
  EyeSlashIcon,
  ClockIcon,
  SparklesIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  BookmarkIcon,
  ArrowPathIcon,
  CalendarDaysIcon,
  BeakerIcon,
  CloudArrowUpIcon,
  ChevronDownIcon,
  DocumentArrowUpIcon,
  PlusIcon
} from '@heroicons/react/24/outline';

import EventCard from './EventCard';
import MedicationTracker from './MedicationTracker';
import { extractMedicalEvents, generateMedicationTracking } from '../../services/eventExtraction';

function ConversationSummary({ 
  transcription, 
  analysis, 
  duration, 
  onSave, 
  onEdit 
}) {
  const [showFullTranscript, setShowFullTranscript] = useState(false);
  const [editedSummary, setEditedSummary] = useState(analysis?.summary || '');
  const [isEditing, setIsEditing] = useState(false);
  const [extractedData, setExtractedData] = useState(null);
  const [isProcessingEvents, setIsProcessingEvents] = useState(true);
  const [expandedEvents, setExpandedEvents] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveOption, setSaveOption] = useState('health-records'); // 'health-records', 'health-records-sync'
  const [showSaveOptions, setShowSaveOptions] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  // Extract events and medications when component mounts
  useEffect(() => {
    const processEvents = async () => {
      setIsProcessingEvents(true);
      try {
        const extracted = await extractMedicalEvents(transcription, analysis);
        setExtractedData(extracted);
      } catch (error) {
        console.error('Error extracting events:', error);
      } finally {
        setIsProcessingEvents(false);
      }
    };
    
    if (transcription) {
      processEvents();
    }
  }, [transcription, analysis]);

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getUrgencyConfig = (urgencyLevel) => {
    switch (urgencyLevel) {
      case 'high':
        return {
          color: 'text-red-600',
          bg: 'bg-red-100',
          icon: ExclamationTriangleIcon,
          label: 'High Priority'
        };
      case 'medium':
        return {
          color: 'text-yellow-600',
          bg: 'bg-yellow-100',
          icon: InformationCircleIcon,
          label: 'Medium Priority'
        };
      default:
        return {
          color: 'text-green-600',
          bg: 'bg-green-100',
          icon: CheckCircleIcon,
          label: 'Low Priority'
        };
    }
  };

  const urgencyConfig = getUrgencyConfig(analysis?.urgencyLevel);
  const UrgencyIcon = urgencyConfig.icon;

  const handleSaveSummary = async () => {
    setIsSaving(true);
    
    try {
      const updatedAnalysis = {
        ...analysis,
        summary: editedSummary
      };
      
      const saveData = {
        transcription,
        analysis: updatedAnalysis,
        duration,
        extractedEvents: extractedData,
        saveWithSync: saveOption === 'health-records-sync'
      };
      
      // Simulate save delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setIsEditing(false);
      setSaveSuccess(true);
      
      // Show success briefly then proceed
      setTimeout(() => {
        onSave(saveData);
      }, 1500);
      
    } catch (error) {
      console.error('Save failed:', error);
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleToggleEventExpand = (eventId) => {
    setExpandedEvents(prev => ({
      ...prev,
      [eventId]: !prev[eventId]
    }));
  };
  
  const handleAddToCalendar = (event) => {
    // In real app would integrate with Google Calendar API
    console.log('Adding to calendar:', event);
    alert(`Would add "${event.title}" to your calendar for ${event.date}`);
  };
  
  const handleDismissEvent = (event) => {
    console.log('Dismissing event:', event);
    // Remove event from extractedData
    setExtractedData(prev => ({
      ...prev,
      events: prev.events.filter(e => e.id !== event.id)
    }));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header with Success Animation */}
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
          Analysis Complete!
        </h3>
        <p className="text-gray-600 text-sm">
          Your conversation has been processed and summarized
        </p>
      </motion.div>

      {/* Recording Info */}
      <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <ClockIcon className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-700">Recording Details</span>
          </div>
          <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${urgencyConfig.bg}`}>
            <UrgencyIcon className={`w-3 h-3 ${urgencyConfig.color}`} />
            <span className={`text-xs font-medium ${urgencyConfig.color}`}>
              {urgencyConfig.label}
            </span>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-lg font-semibold text-gray-900">{formatDuration(duration)}</p>
            <p className="text-xs text-gray-600">Duration</p>
          </div>
          <div>
            <p className="text-lg font-semibold text-gray-900">{Math.round(analysis?.confidence * 100)}%</p>
            <p className="text-xs text-gray-600">Confidence</p>
          </div>
          <div>
            <p className="text-lg font-semibold text-gray-900">{analysis?.keyTopics?.length || 0}</p>
            <p className="text-xs text-gray-600">Topics</p>
          </div>
        </div>
      </div>

      {/* AI Summary */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <SparklesIcon className="w-5 h-5 text-purple-600" />
            <h4 className="font-semibold text-gray-900">AI Summary</h4>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsEditing(!isEditing)}
            className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            <PencilIcon className="w-4 h-4 text-gray-600" />
          </motion.button>
        </div>

        {isEditing ? (
          <div className="space-y-3">
            <textarea
              value={editedSummary}
              onChange={(e) => setEditedSummary(e.target.value)}
              rows={4}
              className="w-full p-3 border border-gray-200 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Edit the AI summary..."
            />
            <div className="flex gap-2">
              <button
                onClick={handleSaveSummary}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Save Changes
              </button>
              <button
                onClick={() => {
                  setEditedSummary(analysis?.summary || '');
                  setIsEditing(false);
                }}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <p className="text-gray-700 leading-relaxed">
            {editedSummary}
          </p>
        )}
      </div>

      {/* Key Topics */}
      {analysis?.keyTopics && analysis.keyTopics.length > 0 && (
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-lg">
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <BookmarkIcon className="w-5 h-5 text-blue-600" />
            Key Topics Identified
          </h4>
          <div className="flex flex-wrap gap-2">
            {analysis.keyTopics.map((topic, index) => (
              <motion.span
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-sm font-medium"
              >
                {topic}
              </motion.span>
            ))}
          </div>
        </div>
      )}

      {/* AI Insights */}
      {analysis?.insights && (
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-lg">
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <SparklesIcon className="w-5 h-5 text-purple-600" />
            AI Insights
          </h4>
          <p className="text-gray-700 leading-relaxed">
            {analysis.insights}
          </p>
        </div>
      )}

      {/* Follow-up Suggestions */}
      {analysis?.followUpSuggestions && analysis.followUpSuggestions.length > 0 && (
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-lg">
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <ArrowPathIcon className="w-5 h-5 text-green-600" />
            Recommended Next Steps
          </h4>
          <ul className="space-y-2">
            {analysis.followUpSuggestions.map((suggestion, index) => (
              <motion.li
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-start gap-2"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2 flex-shrink-0" />
                <span className="text-gray-700 text-sm leading-relaxed">
                  {suggestion}
                </span>
              </motion.li>
            ))}
          </ul>
        </div>
      )}

      {/* Original Transcript */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold text-gray-900 flex items-center gap-2">
            <EyeIcon className="w-5 h-5 text-gray-600" />
            Original Transcript
          </h4>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowFullTranscript(!showFullTranscript)}
            className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            {showFullTranscript ? (
              <>
                <EyeSlashIcon className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">Hide</span>
              </>
            ) : (
              <>
                <EyeIcon className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">Show Full</span>
              </>
            )}
          </motion.button>
        </div>

        <motion.div
          initial={false}
          animate={{ height: showFullTranscript ? 'auto' : '80px' }}
          className="overflow-hidden"
        >
          <p className="text-gray-700 leading-relaxed text-sm">
            {transcription}
          </p>
        </motion.div>

        {!showFullTranscript && transcription.length > 200 && (
          <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white to-transparent" />
        )}
      </div>

      {/* Extracted Events */}
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
              <p className="text-gray-600 font-medium">Extracting medical events...</p>
              <p className="text-sm text-gray-500 mt-1">Analyzing conversation for appointments, medications, and reminders</p>
            </div>
          </div>
        </div>
      ) : extractedData && (
        <>
          {/* Events Summary */}
          {extractedData.summary && (
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl p-5 border border-purple-100">
              <div className="flex items-center gap-2 mb-3">
                <CalendarDaysIcon className="w-5 h-5 text-purple-600" />
                <h4 className="font-semibold text-gray-900">Events Summary</h4>
              </div>
              <div className="grid grid-cols-3 gap-4 text-center mb-3">
                <div className="bg-white/50 rounded-lg p-3">
                  <p className="text-lg font-bold text-purple-600">{extractedData.summary.totalEvents}</p>
                  <p className="text-xs text-gray-600">Appointments</p>
                </div>
                <div className="bg-white/50 rounded-lg p-3">
                  <p className="text-lg font-bold text-blue-600">{extractedData.summary.totalMedications}</p>
                  <p className="text-xs text-gray-600">Medications</p>
                </div>
                <div className="bg-white/50 rounded-lg p-3">
                  <p className="text-lg font-bold text-green-600">{extractedData.summary.totalReminders}</p>
                  <p className="text-xs text-gray-600">Reminders</p>
                </div>
              </div>
              {extractedData.summary.urgentItems > 0 && (
                <div className="bg-red-100 border border-red-200 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <ExclamationTriangleIcon className="w-4 h-4 text-red-600" />
                    <span className="text-sm font-medium text-red-800">
                      {extractedData.summary.urgentItems} urgent item{extractedData.summary.urgentItems > 1 ? 's' : ''} require immediate attention
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Upcoming Events */}
          {extractedData.events && extractedData.events.length > 0 && (
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-lg">
              <div className="flex items-center gap-2 mb-4">
                <CalendarDaysIcon className="w-5 h-5 text-blue-600" />
                <h4 className="font-semibold text-gray-900">Extracted Medical Events</h4>
                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                  {extractedData.events.length}
                </span>
              </div>
              <div className="space-y-4">
                {extractedData.events.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    isExpanded={expandedEvents[event.id]}
                    onToggleExpand={() => handleToggleEventExpand(event.id)}
                    onAddToCalendar={handleAddToCalendar}
                    onDismiss={handleDismissEvent}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Medication Changes */}
          {extractedData.medications && extractedData.medications.length > 0 && (
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-lg">
              <div className="flex items-center gap-2 mb-4">
                <BeakerIcon className="w-5 h-5 text-green-600" />
                <h4 className="font-semibold text-gray-900">Medication Changes</h4>
                <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                  {extractedData.medications.length}
                </span>
              </div>
              <MedicationTracker medications={extractedData.medications} />
            </div>
          )}

          {/* Reminders & Lifestyle Changes */}
          {extractedData.reminders && extractedData.reminders.length > 0 && (
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-lg">
              <div className="flex items-center gap-2 mb-4">
                <BookmarkIcon className="w-5 h-5 text-purple-600" />
                <h4 className="font-semibold text-gray-900">Reminders & Action Items</h4>
                <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                  {extractedData.reminders.length}
                </span>
              </div>
              <div className="space-y-3">
                {extractedData.reminders.map((reminder, index) => (
                  <motion.div
                    key={reminder.id || index}
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
                    <div className="flex items-center justify-between text-xs text-purple-600 mt-3 pt-2 border-t border-purple-200">
                      <span>Start: {new Date(reminder.startDate).toLocaleDateString()}</span>
                      <span>{Math.round((reminder.confidence || 0.8) * 100)}% confidence</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Action Buttons */}
      <div className="space-y-4 pt-4">
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
                ? 'Voice record saved and events syncing to calendar'
                : 'Voice conversation added to your health records'
              }
            </p>
          </motion.div>
        ) : (
          <>
            {/* Save Options Dropdown */}
            {showSaveOptions && (
              <motion.div
                initial={{ opacity: 0, y: -10, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                className="bg-white border border-gray-200 rounded-xl p-4 shadow-lg"
              >
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <DocumentArrowUpIcon className="w-5 h-5 text-blue-600" />
                  Choose Save Option
                </h4>
                
                <div className="space-y-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
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
                        <p className="text-sm text-gray-600 mt-1">
                          Store conversation and AI analysis in your personal health timeline
                        </p>
                      </div>
                    </div>
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
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
                        <p className="text-sm text-gray-600 mt-1">
                          Save to health records AND automatically sync appointments and medication reminders to your calendar
                        </p>
                        {extractedData?.summary && (
                          <div className="flex items-center gap-4 mt-2 text-xs">
                            <span className="flex items-center gap-1 text-purple-600">
                              <CalendarDaysIcon className="w-3 h-3" />
                              {extractedData.summary.totalEvents} appointments
                            </span>
                            <span className="flex items-center gap-1 text-blue-600">
                              <BeakerIcon className="w-3 h-3" />
                              {extractedData.summary.totalMedications} medications
                            </span>
                            <span className="flex items-center gap-1 text-green-600">
                              <BookmarkIcon className="w-3 h-3" />
                              {extractedData.summary.totalReminders} reminders
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.button>
                </div>
              </motion.div>
            )}
            
            {/* Main Action Buttons */}
            <div className="flex gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSaveSummary}
                disabled={isSaving}
                className={`flex-1 py-4 rounded-xl font-semibold transition-all shadow-lg ${
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
                      className="w-4 h-4"
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
                        Save + Sync to Calendar
                      </>
                    ) : (
                      <>
                        <DocumentArrowUpIcon className="w-5 h-5" />
                        Save to Health Records
                      </>
                    )}
                  </div>
                )}
              </motion.button>
              
              {/* Options Toggle Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowSaveOptions(!showSaveOptions)}
                className="px-4 py-4 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
              >
                <ChevronDownIcon 
                  className={`w-5 h-5 transition-transform ${showSaveOptions ? 'rotate-180' : ''}`} 
                />
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onEdit}
                disabled={isSaving}
                className="px-6 py-4 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                Record Again
              </motion.button>
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
}

export default ConversationSummary;