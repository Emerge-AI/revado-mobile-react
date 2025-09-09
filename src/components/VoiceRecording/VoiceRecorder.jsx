import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import RecordingVisualizer from './RecordingVisualizer';
import ConversationSummary from './ConversationSummary';
import {
  MicrophoneIcon,
  StopIcon,
  PauseIcon,
  PlayIcon,
  XMarkIcon,
  SparklesIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { MicrophoneIcon as MicrophoneIconSolid } from '@heroicons/react/24/solid';

function VoiceRecorder({ onComplete, onCancel }) {
  const [recordingState, setRecordingState] = useState('idle'); // idle, recording, paused, processing, completed
  const [audioBlob, setAudioBlob] = useState(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [transcription, setTranscription] = useState('');
  const [realtimeTranscript, setRealtimeTranscript] = useState('');
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [audioLevel, setAudioLevel] = useState(0);

  const mediaRecorderRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const intervalRef = useRef(null);
  const animationFrameRef = useRef(null);

  // Demo conversation data with medical events
  const demoConversations = [
    {
      transcript: "Hi Doctor, I need to discuss my test results and upcoming appointments. The blood work from last week showed my cholesterol is still elevated at 280, and you mentioned we might need to start a statin medication like Lipitor. I'm also scheduled for that stress test next Thursday at 2 PM at the cardiac lab. Dr. Williams wants me to stop taking my beta blocker 48 hours before the test. After we get those results, we're supposed to schedule a follow-up appointment in 2 weeks to discuss the treatment plan. Oh, and I'm supposed to start taking that baby aspirin daily for heart protection.",
      summary: "Patient discussing elevated cholesterol results (280), potential statin initiation, scheduled cardiac stress test with pre-test medication holds, and cardiovascular protection with aspirin.",
      keyTopics: ["elevated cholesterol", "statin therapy", "stress test", "medication holds", "follow-up planning", "aspirin therapy", "cardiac evaluation"],
      aiInsights: "Cardiovascular risk assessment in progress with appropriate diagnostic testing and medication optimization. Patient demonstrates good understanding of pre-test requirements and treatment plan.",
      urgencyLevel: "medium",
      followUpSuggestions: [
        "Schedule stress test appointment for Thursday at 2 PM",
        "Stop beta blocker 48 hours before stress test",
        "Start daily baby aspirin as prescribed",
        "Plan follow-up appointment in 2 weeks",
        "Discuss statin therapy options based on test results"
      ]
    },
    {
      transcript: "Hi Doctor, I wanted to discuss my upcoming knee surgery scheduled for next Tuesday. You mentioned I need to stop eating 12 hours before the procedure. Also, I'm currently taking ibuprofen for pain, but I think you said I should switch to something else before surgery? I'm also supposed to start those antibiotics you prescribed 3 days before the surgery. Could you remind me about the post-surgery physical therapy schedule? I think you mentioned exercises 3 times a day and follow-up appointments.",
      summary: "Patient discussing upcoming knee surgery preparation including pre-operative fasting, medication changes (stopping ibuprofen), antibiotic prophylaxis, and post-operative physical therapy planning.",
      keyTopics: ["knee surgery", "pre-operative preparation", "medication management", "antibiotic prophylaxis", "physical therapy", "post-operative care"],
      aiInsights: "Comprehensive surgical preparation discussion. Patient demonstrates good understanding of pre-operative requirements. Post-operative care plan including PT exercises and follow-up scheduling discussed.",
      urgencyLevel: "high",
      followUpSuggestions: [
        "Confirm surgery preparation checklist with surgical team",
        "Schedule post-operative physical therapy sessions",
        "Set up medication reminders for antibiotic course",
        "Arrange transportation for surgery day"
      ]
    },
    {
      transcript: "I've been having some concerning symptoms lately. My blood pressure has been running high, around 150 over 95, and I'm experiencing occasional chest tightness. Dr. Smith wants me to start taking Lisinopril 10mg once daily in the morning, and stop taking the ibuprofen I've been using for joint pain. I also need to get blood work done this Friday to check my kidney function and cholesterol levels before starting the new medication. He said I should monitor my blood pressure daily for the first month and schedule a follow-up appointment in 3 weeks.",
      summary: "Patient reports elevated blood pressure (150/95) with chest tightness. New prescription for Lisinopril 10mg daily, discontinuing ibuprofen. Laboratory studies ordered for baseline kidney and lipid assessment. BP monitoring and follow-up care planned.",
      keyTopics: ["hypertension", "chest symptoms", "Lisinopril", "medication changes", "blood work", "blood pressure monitoring", "follow-up care"],
      aiInsights: "New diagnosis of hypertension with appropriate medication initiation. Baseline laboratory studies and monitoring plan established. Medication interaction addressed (stopping ibuprofen).",
      urgencyLevel: "medium",
      followUpSuggestions: [
        "Start daily blood pressure monitoring routine",
        "Set up medication reminders for Lisinopril",
        "Schedule laboratory appointment for Friday",
        "Plan follow-up appointment in 3 weeks",
        "Monitor for Lisinopril side effects (dry cough, dizziness)"
      ]
    },
    {
      transcript: "I wanted to update you on my diabetes management. My morning blood sugars have been running between 140-160, which I know is higher than target. Dr. Johnson increased my Metformin from 500mg twice daily to 1000mg twice daily, and we're adding Jardiance 10mg once in the morning. I'm also supposed to see the nutritionist next month to work on my diet plan. We scheduled my A1C recheck for 3 months from now, and I need to continue checking my blood sugar twice daily. Should I be concerned about any side effects with the new medication?",
      summary: "Diabetes management update with suboptimal glucose control (140-160 mg/dL fasting). Metformin dose increased, Jardiance added. Nutritionist consultation and A1C monitoring planned.",
      keyTopics: ["diabetes", "blood glucose monitoring", "Metformin adjustment", "Jardiance", "nutritionist consultation", "A1C testing", "medication side effects"],
      aiInsights: "Type 2 diabetes with medication optimization in response to elevated glucose levels. Comprehensive management approach including medication adjustment, nutrition consultation, and monitoring plan.",
      urgencyLevel: "medium",
      followUpSuggestions: [
        "Monitor blood glucose twice daily",
        "Watch for Jardiance side effects (UTI, yeast infections)",
        "Schedule nutritionist appointment for next month",
        "Set A1C recheck reminder for 3 months",
        "Continue current blood sugar monitoring routine"
      ]
    }
  ];

  useEffect(() => {
    return () => {
      // Cleanup
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 44100,
          echoCancellation: true,
          noiseSuppression: true
        }
      });

      // Set up audio context for visualization
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      mediaRecorderRef.current = mediaRecorder;

      const audioChunks = [];
      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        setAudioBlob(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setRecordingState('recording');

      // Start duration timer
      intervalRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);

      // Start audio level monitoring
      monitorAudioLevel();

      // Simulate real-time transcription
      simulateRealtimeTranscription();

    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Unable to access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    setRecordingState('processing');
    processRecording();
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setRecordingState('paused');
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
      intervalRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
      setRecordingState('recording');
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    // Clean up streams
    if (mediaRecorderRef.current && mediaRecorderRef.current.stream) {
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }

    onCancel();
  };

  const monitorAudioLevel = () => {
    if (!analyserRef.current) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);

    const updateLevel = () => {
      analyserRef.current.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((acc, value) => acc + value, 0) / dataArray.length;
      setAudioLevel(average / 255); // Normalize to 0-1

      if (recordingState === 'recording') {
        animationFrameRef.current = requestAnimationFrame(updateLevel);
      }
    };

    updateLevel();
  };

  const simulateRealtimeTranscription = () => {
    // Simulate real-time transcription with a demo conversation
    const demoText = "I've been having headaches for the past three days, usually in the afternoon...";
    let currentText = '';
    let index = 0;

    const addText = () => {
      if (index < demoText.length && recordingState === 'recording') {
        currentText += demoText[index];
        setRealtimeTranscript(currentText);
        index++;
        setTimeout(addText, 100 + Math.random() * 100); // Vary timing
      }
    };

    setTimeout(addText, 1000); // Start after 1 second
  };

  const processRecording = async () => {
    // Simulate AI processing with realistic delays
    const processingSteps = [
      { message: "🎤 Transcribing your voice...", duration: 2000 },
      { message: "🧠 Understanding context...", duration: 1500 },
      { message: "✨ Generating summary...", duration: 2000 },
      { message: "📝 Preparing your record...", duration: 1000 }
    ];

    for (let i = 0; i < processingSteps.length; i++) {
      await new Promise(resolve => setTimeout(resolve, processingSteps[i].duration));
    }

    // Use a random demo conversation
    const demoData = demoConversations[Math.floor(Math.random() * demoConversations.length)];

    setTranscription(demoData.transcript);
    setAiAnalysis({
      summary: demoData.summary,
      keyTopics: demoData.keyTopics,
      insights: demoData.aiInsights,
      urgencyLevel: demoData.urgencyLevel,
      followUpSuggestions: demoData.followUpSuggestions,
      confidence: 0.92,
      processingTime: recordingDuration
    });

    setRecordingState('completed');
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleComplete = (data) => {
    const voiceRecord = {
      type: 'voice_conversation',
      audioBlob,
      transcription: data?.transcription || transcription,
      summary: data?.analysis?.summary || aiAnalysis?.summary,
      keyTopics: data?.analysis?.keyTopics || aiAnalysis?.keyTopics,
      duration: data?.duration || recordingDuration,
      analysis: data?.analysis || aiAnalysis,
      extractedEvents: data?.extractedEvents || null,
      createdAt: new Date().toISOString()
    };

    onComplete(voiceRecord);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">AI Voice Assistant</h2>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={cancelRecording}
          className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
        >
          <XMarkIcon className="w-5 h-5 text-gray-600" />
        </motion.button>
      </div>

      {/* Recording Interface */}
      <AnimatePresence mode="wait">
        {recordingState === 'idle' && (
          <motion.div
            key="idle"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="text-center py-12"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={startRecording}
              className="relative mx-auto mb-6 w-20 h-20 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow"
            >
              <MicrophoneIconSolid className="w-8 h-8 text-white" />
              <motion.div
                className="absolute inset-0 rounded-full border-4 border-orange-300"
                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ repeat: Infinity, duration: 2 }}
              />
            </motion.button>

            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Ready to Listen
            </h3>
            <p className="text-gray-600 text-sm">
              Tap to start recording your health questions or symptoms
            </p>
          </motion.div>
        )}

        {(recordingState === 'recording' || recordingState === 'paused') && (
          <motion.div
            key="recording"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="space-y-6"
          >
            {/* Recording Indicator */}
            <div className="text-center">
              <motion.div
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${
                  recordingState === 'recording' ? 'bg-red-100' : 'bg-yellow-100'
                }`}
                animate={recordingState === 'recording' ? { scale: [1, 1.05, 1] } : {}}
                transition={{ repeat: Infinity, duration: 1.5 }}
              >
                <div className={`w-3 h-3 rounded-full ${
                  recordingState === 'recording' ? 'bg-red-500' : 'bg-yellow-500'
                }`} />
                <span className={`text-sm font-semibold ${
                  recordingState === 'recording' ? 'text-red-700' : 'text-yellow-700'
                }`}>
                  {recordingState === 'recording' ? 'Recording' : 'Paused'} • {formatDuration(recordingDuration)}
                </span>
              </motion.div>
            </div>

            {/* Audio Visualizer */}
            <RecordingVisualizer
              audioLevel={audioLevel}
              isRecording={recordingState === 'recording'}
            />

            {/* Real-time Transcription */}
            {realtimeTranscript && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-blue-50 rounded-xl p-4 border border-blue-100"
              >
                <div className="flex items-center gap-2 mb-2">
                  <SparklesIcon className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-700">Live Transcription</span>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {realtimeTranscript}
                  <motion.span
                    className="inline-block w-2 h-4 bg-blue-600 ml-1"
                    animate={{ opacity: [0, 1, 0] }}
                    transition={{ repeat: Infinity, duration: 1 }}
                  />
                </p>
              </motion.div>
            )}

            {/* Recording Controls */}
            <div className="flex justify-center gap-4">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={recordingState === 'recording' ? pauseRecording : resumeRecording}
                className="p-4 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                {recordingState === 'recording' ? (
                  <PauseIcon className="w-6 h-6 text-gray-700" />
                ) : (
                  <PlayIcon className="w-6 h-6 text-gray-700" />
                )}
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={stopRecording}
                className="p-4 rounded-full bg-red-100 hover:bg-red-200 transition-colors"
              >
                <StopIcon className="w-6 h-6 text-red-600" />
              </motion.button>
            </div>
          </motion.div>
        )}

        {recordingState === 'processing' && (
          <motion.div
            key="processing"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="text-center py-12"
          >
            <motion.div
              className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center"
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <SparklesIcon className="w-8 h-8 text-white" />
            </motion.div>

            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              AI is Analyzing...
            </h3>
            <p className="text-gray-600 text-sm">
              Processing your conversation and generating insights
            </p>
          </motion.div>
        )}

        {recordingState === 'completed' && (
          <ConversationSummary
            transcription={transcription}
            analysis={aiAnalysis}
            duration={recordingDuration}
            onSave={handleComplete}
            onEdit={() => setRecordingState('idle')}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default VoiceRecorder;
