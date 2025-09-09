import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  MicrophoneIcon,
  PlayIcon,
  PauseIcon,
  SpeakerWaveIcon,
  ClockIcon,
  SparklesIcon,
  EyeIcon,
  EyeSlashIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  ChatBubbleBottomCenterTextIcon,
  CloudArrowUpIcon,
  CalendarDaysIcon,
} from '@heroicons/react/24/outline';

function VoiceRecordCard({ record, onClick, isDetailView = false }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const [audioCurrentTime, setAudioCurrentTime] = useState(0);

  // Voice conversation specific data
  const voiceData = record.voiceData || {};
  const analysis = record.aiAnalysis || voiceData.analysis || {};
  const extractedData = record.extractedData || {};
  const duration = extractedData.duration || voiceData.duration || 0;
  const transcription = extractedData.transcription || voiceData.transcription || '';
  const keyTopics = extractedData.keyTopics || analysis.keyTopics || [];
  const isSynced = record.calendarSyncResult && record.calendarSyncedAt;
  const syncResult = record.calendarSyncResult;

  const formatDuration = (seconds) => {
    if (!seconds || seconds === 0) return '0:00';
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

  const urgencyConfig = getUrgencyConfig(extractedData.urgencyLevel || analysis.urgencyLevel);
  const UrgencyIcon = urgencyConfig.icon;

  const handlePlayPause = (e) => {
    e.stopPropagation();
    // Simulate audio playback
    setIsPlaying(!isPlaying);

    if (!isPlaying) {
      // Start "playback" simulation
      const interval = setInterval(() => {
        setAudioCurrentTime(prev => {
          if (prev >= duration) {
            clearInterval(interval);
            setIsPlaying(false);
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    }
  };

  const toggleTranscript = (e) => {
    e.stopPropagation();
    setShowTranscript(!showTranscript);
  };

  if (isDetailView) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl p-6 border border-gray-100 shadow-lg space-y-4"
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-orange-100 rounded-xl">
              <MicrophoneIcon className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Voice Conversation</h3>
              <p className="text-sm text-gray-600">
                {new Date(record.uploadedAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          </div>

          <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${urgencyConfig.bg}`}>
            <UrgencyIcon className={`w-3 h-3 ${urgencyConfig.color}`} />
            <span className={`text-xs font-medium ${urgencyConfig.color}`}>
              {urgencyConfig.label}
            </span>
          </div>
        </div>

        {/* Playback Controls */}
        <div className="bg-gray-50 rounded-xl p-4">
          <div className="flex items-center gap-4 mb-3">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handlePlayPause}
              className={`p-3 rounded-full transition-colors ${
                isPlaying
                  ? 'bg-orange-600 hover:bg-orange-700'
                  : 'bg-orange-600 hover:bg-orange-700'
              }`}
            >
              {isPlaying ? (
                <PauseIcon className="w-5 h-5 text-white" />
              ) : (
                <PlayIcon className="w-5 h-5 text-white ml-0.5" />
              )}
            </motion.button>

            <div className="flex-1">
              <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                <span>{formatDuration(audioCurrentTime)}</span>
                <span>{formatDuration(duration)}</span>
              </div>
              {/* Progress bar */}
              <div className="w-full bg-gray-200 rounded-full h-2">
                <motion.div
                  className="bg-orange-600 h-2 rounded-full"
                  initial={{ width: 0 }}
                  animate={{
                    width: duration > 0 ? `${(audioCurrentTime / duration) * 100}%` : '0%'
                  }}
                  transition={{ duration: 0.1 }}
                />
              </div>
            </div>

            <SpeakerWaveIcon className="w-5 h-5 text-gray-500" />
          </div>
        </div>

        {/* AI Summary */}
        {extractedData.summary && (
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
            <div className="flex items-center gap-2 mb-2">
              <SparklesIcon className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-700">AI Summary</span>
            </div>
            <p className="text-gray-700 text-sm leading-relaxed">
              {extractedData.summary}
            </p>
          </div>
        )}

        {/* Key Topics */}
        {keyTopics.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-2">Key Topics</h4>
            <div className="flex flex-wrap gap-2">
              {keyTopics.slice(0, 5).map((topic, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium"
                >
                  {topic}
                </span>
              ))}
              {keyTopics.length > 5 && (
                <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                  +{keyTopics.length - 5} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Transcript Toggle */}
        {transcription && (
          <div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={toggleTranscript}
              className="flex items-center gap-2 w-full p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ChatBubbleBottomCenterTextIcon className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">
                {showTranscript ? 'Hide' : 'Show'} Full Transcript
              </span>
              {showTranscript ? (
                <EyeSlashIcon className="w-4 h-4 text-gray-500 ml-auto" />
              ) : (
                <EyeIcon className="w-4 h-4 text-gray-500 ml-auto" />
              )}
            </motion.button>

            {showTranscript && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3 p-4 bg-white border border-gray-200 rounded-lg"
              >
                <h5 className="text-sm font-medium text-gray-900 mb-2">Full Transcript</h5>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {transcription}
                </p>
              </motion.div>
            )}
          </div>
        )}
      </motion.div>
    );
  }

  // Timeline card view (compact)
  return (
    <motion.button
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={() => onClick(record)}
      className="w-full bg-white rounded-2xl p-4 border border-gray-100 shadow-lg hover:shadow-xl transition-all text-left"
    >
      <div className="flex items-start space-x-3">
        {/* Voice icon with status */}
        <div className="relative">
          <div className="p-2.5 bg-orange-100 rounded-xl">
            <MicrophoneIcon className="w-5 h-5 text-orange-600" />
          </div>
          {isPlaying && (
            <motion.div
              className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 1 }}
            />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Title and time */}
          <div className="flex items-start justify-between mb-1">
            <p className="font-semibold text-gray-900 truncate pr-2">
              Voice Conversation
            </p>
            <div className="flex items-center gap-1 text-xs text-gray-500 flex-shrink-0">
              <ClockIcon className="w-3 h-3" />
              <span>{formatDuration(duration)}</span>
            </div>
          </div>

          {/* Summary */}
          <p className="text-sm text-gray-600 mb-2 line-clamp-2">
            {extractedData.summary || 'Voice conversation with AI assistant'}
          </p>

          {/* Metadata badges */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* AI Analysis badge */}
            <span className="inline-flex items-center text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-medium">
              <SparklesIcon className="w-3 h-3 mr-1" />
              AI Analyzed
            </span>

            {/* Calendar Sync badge */}
            {isSynced && (
              <span className="inline-flex items-center text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">
                <CloudArrowUpIcon className="w-3 h-3 mr-1" />
                Synced to Calendar
              </span>
            )}

            {/* Urgency badge */}
            <span className={`inline-flex items-center text-xs px-2 py-0.5 rounded-full font-medium ${urgencyConfig.bg} ${urgencyConfig.color}`}>
              <UrgencyIcon className="w-3 h-3 mr-1" />
              {urgencyConfig.label}
            </span>

            {/* Topics count */}
            {keyTopics.length > 0 && (
              <span className="text-xs text-gray-500">
                {keyTopics.length} topic{keyTopics.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>

        {/* Quick play button */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={handlePlayPause}
          className="p-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
        >
          {isPlaying ? (
            <PauseIcon className="w-4 h-4 text-gray-600" />
          ) : (
            <PlayIcon className="w-4 h-4 text-gray-600 ml-0.5" />
          )}
        </motion.button>
      </div>
    </motion.button>
  );
}

export default VoiceRecordCard;
