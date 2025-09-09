import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useHealthRecords } from '../contexts/HealthRecordsContext';
import claudeService from '../services/claudeService';
import {
  ArrowLeftIcon,
  ChatBubbleLeftRightIcon,
  SparklesIcon,
  MicrophoneIcon,
  StopIcon,
  PlayIcon,
  PauseIcon
} from '@heroicons/react/24/outline';

function PrepareQuestionsPage() {
  const navigate = useNavigate();
  const { records, medications } = useHealthRecords();
  const [questions, setQuestions] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedDoctorType, setSelectedDoctorType] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordings, setRecordings] = useState({});
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioPlayback, setAudioPlayback] = useState({});

  const doctorTypes = [
    { id: '', label: 'General Questions', description: 'Based on your health data' },
    { id: 'primary-care', label: 'Primary Care Doctor', description: 'General health checkup' },
    { id: 'cardiologist', label: 'Cardiologist', description: 'Heart health specialist' },
    { id: 'dermatologist', label: 'Dermatologist', description: 'Skin health specialist' },
    { id: 'endocrinologist', label: 'Endocrinologist', description: 'Hormone & diabetes specialist' },
    { id: 'gastroenterologist', label: 'Gastroenterologist', description: 'Digestive health specialist' },
    { id: 'neurologist', label: 'Neurologist', description: 'Brain & nervous system specialist' },
    { id: 'orthopedist', label: 'Orthopedist', description: 'Bone & joint specialist' },
    { id: 'psychiatrist', label: 'Psychiatrist', description: 'Mental health specialist' }
  ];

  const generateQuestions = useCallback(async (doctorType = '') => {
    setIsGenerating(true);

    try {
      // Prepare health data for Claude
      const activeMeds = medications?.filter(m => m.status === 'active') || [];
      const completedRecords = records?.filter(r => r.status === 'completed') || [];
      const recentRecords = completedRecords.slice(-3);
      const prescribers = [...new Set(activeMeds.map(m => m.prescribedBy).filter(Boolean))];

      const healthData = {
        medications: activeMeds,
        records: completedRecords,
        recentRecords,
        prescribers,
        doctorType
      };

      // Generate questions using Claude API
      const generatedQuestions = await claudeService.generateQuestions(healthData);
      setQuestions(generatedQuestions);
    } catch (error) {
      console.error('Error generating questions:', error);
      // Fallback to local generation
      const fallbackQuestions = generateContextualQuestions(doctorType);
      setQuestions(fallbackQuestions);
    } finally {
      setIsGenerating(false);
    }
  }, [records, medications]);

  // Auto-generate questions on load
  useEffect(() => {
    generateQuestions(selectedDoctorType);
  }, [selectedDoctorType, generateQuestions]);

  const generateContextualQuestions = (doctorType) => {
    const questions = [];

    // Analyze health data for personalized questions
    const activeMeds = medications?.filter(m => m.status === 'active') || [];
    const completedRecords = records?.filter(r => r.status === 'completed') || [];
    const recentRecords = completedRecords.slice(-3); // Last 3 records

    // Get unique prescribers
    const prescribers = [...new Set(activeMeds.map(m => m.prescribedBy).filter(Boolean))];

    // Calculate time since medication start dates
    const getTimeSince = (dateStr) => {
      if (!dateStr) return null;
      const date = new Date(dateStr);
      const now = new Date();
      const diffTime = Math.abs(now - date);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const diffMonths = Math.floor(diffDays / 30);
      const diffWeeks = Math.floor(diffDays / 7);

      if (diffMonths > 0) return `${diffMonths} month${diffMonths > 1 ? 's' : ''}`;
      if (diffWeeks > 0) return `${diffWeeks} week${diffWeeks > 1 ? 's' : ''}`;
      return `${diffDays} day${diffDays > 1 ? 's' : ''}`;
    };

    // Generate doctor-specific questions with real data
    switch (doctorType) {
      case 'primary-care':
        // Medication coordination questions
        if (prescribers.length > 1) {
          questions.push(`I'm seeing multiple doctors: ${prescribers.join(', ')}. How should we coordinate my care between these providers?`);
        }

        if (activeMeds.length > 0) {
          const recentMed = activeMeds.find(m => m.startDate);
          const timeSince = recentMed ? getTimeSince(recentMed.startDate) : null;
          if (timeSince && recentMed) {
            questions.push(`It's been ${timeSince} since I started taking ${recentMed.name} ${recentMed.dosage}. How am I responding to this medication?`);
          } else {
            questions.push(`I'm currently taking ${activeMeds.map(m => `${m.name} ${m.dosage}`).join(', ')}. Are there any interactions or adjustments we should consider?`);
          }
        }

        // Health records questions
        if (recentRecords.length > 0) {
          const lastRecord = recentRecords[recentRecords.length - 1];
          const recordDate = lastRecord.uploadedAt ? new Date(lastRecord.uploadedAt).toLocaleDateString() : 'recently';
          questions.push(`Based on the health records I uploaded ${recordDate}, what areas should we focus on improving?`);
        }

        // Fallback questions
        if (questions.length === 0) {
          questions.push("What preventive screenings should I be getting at my age?");
        }
        break;

      case 'cardiologist':
        // Heart-specific medication questions
        const heartMeds = activeMeds.filter(m =>
          m.name.toLowerCase().includes('lisinopril') ||
          m.name.toLowerCase().includes('atorvastatin') ||
          m.name.toLowerCase().includes('aspirin') ||
          m.name.toLowerCase().includes('metoprolol')
        );

        if (heartMeds.length > 0) {
          const med = heartMeds[0];
          const timeSince = getTimeSince(med.startDate);
          if (timeSince) {
            questions.push(`I've been on ${med.name} ${med.dosage} for ${timeSince}. How are my cardiovascular markers responding?`);
          } else {
            questions.push(`I'm taking ${med.name} ${med.dosage} for heart health. What improvements should we be seeing?`);
          }
        }

        if (activeMeds.some(m => m.name.toLowerCase().includes('atorvastatin'))) {
          questions.push(`How are my cholesterol levels responding to the Atorvastatin? Should we adjust the dose or consider dietary changes?`);
        }

        // General cardiology questions
        questions.push("Based on my current medications and health history, what cardiovascular risks should I be monitoring?");
        break;

      case 'endocrinologist':
        // Diabetes medication questions
        const diabetesMeds = activeMeds.filter(m =>
          m.name.toLowerCase().includes('metformin') ||
          m.name.toLowerCase().includes('insulin') ||
          m.name.toLowerCase().includes('glipizide')
        );

        if (diabetesMeds.length > 0) {
          const med = diabetesMeds[0];
          questions.push(`How is my diabetes control with ${med.name} ${med.dosage}? What should my HbA1c target be?`);
          questions.push(`I'm taking ${med.name} ${med.frequency.toLowerCase()}. Are there any dietary adjustments I should make?`);
        }

        // Thyroid/hormone questions
        const thyroidMeds = activeMeds.filter(m =>
          m.name.toLowerCase().includes('levothyroxine') ||
          m.name.toLowerCase().includes('synthroid')
        );

        if (thyroidMeds.length > 0) {
          questions.push(`How are my thyroid levels with my current ${thyroidMeds[0].name} dose?`);
        }

        if (questions.length === 0) {
          questions.push("How can I better manage my hormone levels and metabolic health?");
        }
        break;

      case 'psychiatrist':
        // Mental health medication questions
        const mentalHealthMeds = activeMeds.filter(m =>
          m.name.toLowerCase().includes('sertraline') ||
          m.name.toLowerCase().includes('fluoxetine') ||
          m.name.toLowerCase().includes('alprazolam') ||
          m.name.toLowerCase().includes('bupropion')
        );

        if (mentalHealthMeds.length > 0) {
          const med = mentalHealthMeds[0];
          const timeSince = getTimeSince(med.startDate);
          if (timeSince) {
            questions.push(`I've been on ${med.name} ${med.dosage} for ${timeSince}. How should I be feeling by now?`);
          }
          questions.push(`Are there any side effects from ${med.name} I should watch for?`);
        }

        questions.push("What coping strategies work best with my current treatment plan?");
        break;

      default:
        // General questions with health data
        if (activeMeds.length > 0) {
          questions.push(`I'm currently taking ${activeMeds.length} medication${activeMeds.length > 1 ? 's' : ''}${activeMeds.length <= 3 ? ' (' + activeMeds.map(m => m.name).join(', ') + ')' : ''}. How do these affect what we discuss today?`);
        }

        if (recentRecords.length > 0) {
          questions.push(`Based on my recent health records, what patterns or concerns should we address?`);
        }

        if (prescribers.length > 1) {
          questions.push(`I work with ${prescribers.length} different doctors (${prescribers.slice(0, 2).join(', ')}${prescribers.length > 2 ? ', and others' : ''}). How can we best coordinate my care?`);
        }

        // Fallback
        if (questions.length === 0) {
          questions.push("How can I improve my overall health based on my current condition?");
          questions.push("What preventive measures should I be focusing on?");
          questions.push("Are there any health trends I should be monitoring?");
        }
    }

    // Ensure we have at least 3 questions
    const fallbackQuestions = [
      "What follow-up appointments or tests should I schedule?",
      "Are there any warning signs I should watch for?",
      "How can I better prepare for our next visit?",
      "What lifestyle changes would you recommend?",
      "Should I be concerned about any family history factors?"
    ];

    while (questions.length < 3) {
      questions.push(fallbackQuestions[questions.length] || "What else should we discuss today?");
    }

    return questions.slice(0, 3).map((q, index) => ({
      id: `q-${index}`,
      text: q,
      recording: null,
      isPlaying: false
    }));
  };

  const startRecording = async (questionId) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks = [];

      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/wav' });
        setRecordings(prev => ({ ...prev, [questionId]: blob }));
      };

      setMediaRecorder(recorder);
      recorder.start();
      setIsRecording(questionId);
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      setMediaRecorder(null);
    }
  };

  const playRecording = (questionId) => {
    const recording = recordings[questionId];
    if (recording) {
      const audio = new Audio(URL.createObjectURL(recording));
      audio.play();
      setAudioPlayback(prev => ({ ...prev, [questionId]: true }));
      audio.onended = () => {
        setAudioPlayback(prev => ({ ...prev, [questionId]: false }));
      };
    }
  };

  return (
    <div className="min-h-screen pb-20">
      <div className="pt-safe-top px-4">
        {/* Header */}
        <div className="py-6">
          <div className="flex items-center gap-3 mb-6">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/')}
              className="p-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <ArrowLeftIcon className="w-5 h-5 text-gray-600" />
            </motion.button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <ChatBubbleLeftRightIcon className="w-6 h-6 text-teal-600" />
                Prepare Questions
              </h1>
              <p className="text-gray-600 font-medium">
                Personalized questions based on your health data
              </p>
            </div>
          </div>
        </div>

        {/* Doctor Type Selector */}
        <div className="mb-8">
          <label className="block text-sm font-semibold text-gray-900 mb-4">
            What type of doctor are you seeing?
          </label>
          <select
            value={selectedDoctorType}
            onChange={(e) => setSelectedDoctorType(e.target.value)}
            className="w-full p-4 rounded-xl border border-gray-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition-colors bg-white text-gray-900 font-medium"
          >
            {doctorTypes.map((type) => (
              <option key={type.id} value={type.id}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        {/* Questions */}
        <div className="space-y-6">
          <AnimatePresence mode="wait">
            {isGenerating ? (
              <motion.div
                key="generating"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="text-center py-12"
              >
                <motion.div
                  className="w-16 h-16 mx-auto mb-4 bg-teal-100 rounded-full flex items-center justify-center"
                  animate={{
                    scale: [1, 1.1, 1],
                    rotate: [0, 180, 360]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <SparklesIcon className="w-8 h-8 text-teal-600" />
                </motion.div>
                <p className="text-lg font-semibold text-gray-900 mb-2">
                  Generating personalized questions...
                </p>
                <p className="text-gray-600">
                  Using Claude AI to analyze your health data
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="questions"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-4"
              >
                {questions.map((question, index) => (
                  <motion.div
                    key={question.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1 pr-4">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-sm font-bold text-teal-600">
                              {index + 1}
                            </span>
                          </div>
                          <h3 className="font-semibold text-gray-900">Question {index + 1}</h3>
                        </div>
                        <p className="text-gray-800 leading-relaxed">
                          {question.text}
                        </p>
                      </div>

                      {/* Recording Controls */}
                      <div className="flex items-center gap-2">
                        {recordings[question.id] && (
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => playRecording(question.id)}
                            disabled={audioPlayback[question.id]}
                            className={`p-2 rounded-lg transition-colors ${
                              audioPlayback[question.id]
                                ? 'bg-green-100 text-green-600'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                          >
                            {audioPlayback[question.id] ? (
                              <PauseIcon className="w-4 h-4" />
                            ) : (
                              <PlayIcon className="w-4 h-4" />
                            )}
                          </motion.button>
                        )}

                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() =>
                            isRecording === question.id
                              ? stopRecording()
                              : startRecording(question.id)
                          }
                          className={`p-2 rounded-lg transition-colors ${
                            isRecording === question.id
                              ? 'bg-red-100 text-red-600 animate-pulse'
                              : recordings[question.id]
                              ? 'bg-teal-100 text-teal-600'
                              : 'bg-teal-100 text-teal-600 hover:bg-teal-200'
                          }`}
                        >
                          {isRecording === question.id ? (
                            <StopIcon className="w-4 h-4" />
                          ) : (
                            <MicrophoneIcon className="w-4 h-4" />
                          )}
                        </motion.button>
                      </div>
                    </div>

                    {isRecording === question.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="bg-red-50 rounded-lg p-3 border border-red-100"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                          <span className="text-sm font-medium text-red-800">
                            Recording your answer...
                          </span>
                        </div>
                      </motion.div>
                    )}

                    {recordings[question.id] && !isRecording && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="bg-green-50 rounded-lg p-3 border border-green-100"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full" />
                          <span className="text-sm font-medium text-green-800">
                            Answer recorded - tap play to review
                          </span>
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

export default PrepareQuestionsPage;
