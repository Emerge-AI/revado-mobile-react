import { useState, useEffect, useRef } from 'react';
import { motion, useMotionValue, useTransform, useSpring, AnimatePresence } from 'framer-motion';
import { useHealthRecords } from '../contexts/HealthRecordsContext';
import {
  HeartIcon,
  SunIcon,
  MoonIcon,
  SparklesIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  PlusIcon,
  DocumentTextIcon,
  BeakerIcon,
  CalendarIcon,
  ShieldCheckIcon,
  EyeIcon,
  BoltIcon,
  UserIcon,
  ClipboardDocumentCheckIcon,
  PhotoIcon,
  ChartBarIcon,
  CpuChipIcon
} from '@heroicons/react/24/outline';
import { 
  HeartIcon as HeartSolid,
  StarIcon as StarSolid 
} from '@heroicons/react/24/solid';

// Specialty icons mapping
const SPECIALTY_ICONS = {
  dental: '🦷',
  cardiology: '❤️',
  orthopedic: '🦴',
  neurology: '🧠',
  dermatology: '🔬',
  ophthalmology: '👁️',
  psychiatry: '🧘',
  pediatrics: '👶',
  obgyn: '🤱',
  radiology: '📡',
  general: '👨‍⚕️',
  laboratory: '🧪',
  immunology: '💉',
  nutrition: '🥗',
  fitness: '💪'
};

// Categorize records by specialty
const categorizeRecord = (record) => {
  const name = (record.displayName || record.originalName || '').toLowerCase();
  const extractedType = (record.extractedData?.type || '').toLowerCase();
  const provider = (record.extractedData?.provider || '').toLowerCase();
  const aiSummary = (record.aiAnalysis?.summary || '').toLowerCase();
  
  // Check for dental
  if (name.includes('dental') || name.includes('dentist') || name.includes('teeth') || 
      name.includes('orthodont') || provider.includes('dental') || aiSummary.includes('dental')) {
    return { category: 'dental', icon: SPECIALTY_ICONS.dental, color: 'cyan' };
  }
  
  // Check for cardiology
  if (name.includes('cardio') || name.includes('heart') || name.includes('ekg') || 
      name.includes('ecg') || extractedType.includes('cardio')) {
    return { category: 'cardiology', icon: SPECIALTY_ICONS.cardiology, color: 'red' };
  }
  
  // Check for orthopedic
  if (name.includes('ortho') || name.includes('bone') || name.includes('joint') || 
      name.includes('fracture') || name.includes('spine')) {
    return { category: 'orthopedic', icon: SPECIALTY_ICONS.orthopedic, color: 'orange' };
  }
  
  // Check for neurology
  if (name.includes('neuro') || name.includes('brain') || name.includes('mri') || 
      name.includes('nerve')) {
    return { category: 'neurology', icon: SPECIALTY_ICONS.neurology, color: 'purple' };
  }
  
  // Check for radiology
  if (name.includes('xray') || name.includes('x-ray') || name.includes('ct scan') || 
      name.includes('mri') || name.includes('ultrasound') || extractedType.includes('imaging')) {
    return { category: 'radiology', icon: SPECIALTY_ICONS.radiology, color: 'indigo' };
  }
  
  // Check for lab
  if (name.includes('lab') || name.includes('blood') || name.includes('test') || 
      extractedType.includes('lab')) {
    return { category: 'laboratory', icon: SPECIALTY_ICONS.laboratory, color: 'green' };
  }
  
  // Check for vision
  if (name.includes('eye') || name.includes('vision') || name.includes('optical') || 
      provider.includes('optom')) {
    return { category: 'ophthalmology', icon: SPECIALTY_ICONS.ophthalmology, color: 'blue' };
  }
  
  // Check for dermatology
  if (name.includes('derm') || name.includes('skin')) {
    return { category: 'dermatology', icon: SPECIALTY_ICONS.dermatology, color: 'pink' };
  }
  
  // Check for mental health
  if (name.includes('psych') || name.includes('mental') || name.includes('therapy')) {
    return { category: 'psychiatry', icon: SPECIALTY_ICONS.psychiatry, color: 'teal' };
  }
  
  // Default to general
  return { category: 'general', icon: SPECIALTY_ICONS.general, color: 'gray' };
};

function HealthOracle() {
  const { records } = useHealthRecords();
  const [expanded, setExpanded] = useState(false);
  const [currentContext, setCurrentContext] = useState('default');
  const [compositeScore, setCompositeScore] = useState(null);
  const [dataSources, setDataSources] = useState([]);
  const [showJournal, setShowJournal] = useState(false);
  const [journalEntry, setJournalEntry] = useState('');
  const cardRef = useRef(null);
  
  // Motion values for parallax effect
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useSpring(useTransform(mouseY, [-300, 300], [3, -3]));
  const rotateY = useSpring(useTransform(mouseX, [-300, 300], [-3, 3]));
  
  // Breathing animation value
  const [isBreathing, setIsBreathing] = useState(true);
  
  // Determine time-based context
  useEffect(() => {
    const updateContext = () => {
      const hour = new Date().getHours();
      
      if (hour >= 5 && hour < 10) {
        setCurrentContext('morning');
      } else if (hour >= 10 && hour < 14) {
        setCurrentContext('midday');
      } else if (hour >= 14 && hour < 18) {
        setCurrentContext('afternoon');
      } else if (hour >= 18 && hour < 22) {
        setCurrentContext('evening');
      } else {
        setCurrentContext('night');
      }
    };
    
    updateContext();
    const interval = setInterval(updateContext, 60000);
    return () => clearInterval(interval);
  }, []);
  
  // Calculate composite health score and categorize data sources
  useEffect(() => {
    if (!records || records.length === 0) {
      setCompositeScore({
        value: 0,
        label: 'No Data',
        description: 'Upload your first health record to get started',
        trend: 'neutral',
        color: 'gray'
      });
      setDataSources([]);
      return;
    }
    
    // Calculate base score components
    const completedRecords = records.filter(r => r.status === 'completed');
    const aiAnalyzedRecords = records.filter(r => r.aiAnalysis);
    const imageAnalyzedRecords = records.filter(r => r.has_image_analysis || r.imageAnalysis);
    const recentRecords = records.filter(r => {
      const daysSince = (Date.now() - new Date(r.uploadedAt)) / (1000 * 60 * 60 * 24);
      return daysSince <= 30;
    });
    
    // Score calculation (0-100)
    let score = 50; // Base score
    
    // Data completeness (up to +20 points)
    const completenessRatio = completedRecords.length / Math.max(records.length, 1);
    score += completenessRatio * 20;
    
    // AI insights (up to +15 points)
    const aiRatio = aiAnalyzedRecords.length / Math.max(completedRecords.length, 1);
    score += aiRatio * 15;
    
    // Image analysis bonus (up to +10 points) - NEW
    const imageRatio = imageAnalyzedRecords.length / Math.max(completedRecords.length, 1);
    score += imageRatio * 10;
    
    // Recency bonus (up to +10 points) - Reduced from 15
    const recencyBonus = Math.min(recentRecords.length * 2, 10);
    score += recencyBonus;
    
    // Diversity bonus - multiple specialties (up to +5 points) - Reduced from 10
    const categories = new Set(records.map(r => categorizeRecord(r).category));
    const diversityBonus = Math.min(categories.size * 1, 5);
    score += diversityBonus;
    
    // Cap at 100
    score = Math.min(Math.round(score), 100);
    
    // Determine score interpretation
    let label, description, color;
    if (score >= 90) {
      label = 'Excellent';
      description = 'Comprehensive health tracking';
      color = 'emerald';
    } else if (score >= 75) {
      label = 'Very Good';
      description = 'Strong health awareness';
      color = 'green';
    } else if (score >= 60) {
      label = 'Good';
      description = 'Solid foundation';
      color = 'blue';
    } else if (score >= 40) {
      label = 'Fair';
      description = 'Room for improvement';
      color = 'amber';
    } else {
      label = 'Getting Started';
      description = 'Keep adding records';
      color = 'orange';
    }
    
    // Categorize and count data sources
    const sourceMap = new Map();
    
    completedRecords.forEach(record => {
      const { category, icon, color } = categorizeRecord(record);
      
      if (!sourceMap.has(category)) {
        sourceMap.set(category, {
          category,
          icon,
          color,
          count: 0,
          records: [],
          latestDate: null,
          hasAI: false
        });
      }
      
      const source = sourceMap.get(category);
      source.count++;
      source.records.push(record);
      
      const recordDate = new Date(record.uploadedAt);
      if (!source.latestDate || recordDate > source.latestDate) {
        source.latestDate = recordDate;
      }
      
      if (record.aiAnalysis) {
        source.hasAI = true;
      }
    });
    
    // Convert to array and sort by count
    const sources = Array.from(sourceMap.values()).sort((a, b) => b.count - a.count);
    
    setCompositeScore({
      value: score,
      label,
      description,
      trend: score > 50 ? 'up' : score < 50 ? 'down' : 'neutral',
      color,
      breakdown: {
        completeness: Math.round(completenessRatio * 100),
        insights: Math.round(aiRatio * 100),
        imageAnalysis: Math.round(imageRatio * 100),
        recency: recentRecords.length,
        diversity: categories.size
      }
    });
    
    setDataSources(sources);
  }, [records]);
  
  // Handle mouse movement for parallax
  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    mouseX.set(e.clientX - centerX);
    mouseY.set(e.clientY - centerY);
  };
  
  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };
  
  // Get gradient based on score
  const getGradient = () => {
    if (!compositeScore) return 'from-gray-500 to-gray-600';
    
    const colors = {
      emerald: 'from-emerald-500 via-emerald-600 to-emerald-700',
      green: 'from-green-500 via-green-600 to-green-700',
      blue: 'from-blue-500 via-blue-600 to-blue-700',
      amber: 'from-amber-500 via-orange-500 to-yellow-600',
      orange: 'from-orange-500 via-red-500 to-pink-600',
      gray: 'from-gray-500 to-gray-600'
    };
    
    return colors[compositeScore.color || 'gray'];
  };
  
  // Format time ago
  const formatTimeAgo = (date) => {
    const now = new Date();
    const then = new Date(date);
    const days = Math.floor((now - then) / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days}d ago`;
    if (days < 30) return `${Math.floor(days / 7)}w ago`;
    return then.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };
  
  if (!compositeScore) return null;
  
  return (
    <motion.div
      ref={cardRef}
      className="relative w-full mb-6"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
    >
      <motion.div
        className={`relative bg-gradient-to-br ${getGradient()} rounded-3xl p-6 shadow-lg overflow-hidden cursor-pointer`}
        style={{
          rotateX,
          rotateY,
          transformStyle: 'preserve-3d',
          transformPerspective: 1000
        }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setExpanded(!expanded)}
      >
        {/* Breathing animation overlay */}
        <motion.div
          className="absolute inset-0 bg-white/10 rounded-3xl"
          animate={isBreathing ? {
            opacity: [0.05, 0.15, 0.05],
            scale: [1, 1.01, 1]
          } : {}}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        
        {/* Content */}
        <div className="relative z-10">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-white/20 backdrop-blur rounded-xl">
                <ShieldCheckIcon className="w-5 h-5 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-white/90 text-xs font-medium">
                  Health Score
                </span>
                <span className="text-white/60 text-xs">
                  {dataSources.length} data sources
                </span>
              </div>
            </div>
            
            {/* Trend indicator */}
            <div className="flex items-center space-x-2">
              {compositeScore.trend === 'up' && (
                <ArrowTrendingUpIcon className="w-4 h-4 text-white/80" />
              )}
              {compositeScore.trend === 'down' && (
                <ArrowTrendingDownIcon className="w-4 h-4 text-white/80" />
              )}
              <ChevronDownIcon className={`w-4 h-4 text-white/60 transition-transform ${
                expanded ? 'rotate-180' : ''
              }`} />
            </div>
          </div>
          
          {/* Score Display */}
          <motion.div
            className="mb-3"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex items-baseline space-x-3">
              <h2 className="text-5xl font-bold text-white">
                {compositeScore.value}
              </h2>
              <span className="text-2xl font-light text-white/80">/100</span>
            </div>
            <p className="text-white/90 text-sm font-medium mt-1">
              {compositeScore.label}
            </p>
            <p className="text-white/70 text-xs">
              {compositeScore.description}
            </p>
          </motion.div>
          
          {/* Quick Stats Bar */}
          {!expanded && dataSources.length > 0 && (
            <div className="flex items-center space-x-2 mt-4">
              {dataSources.slice(0, 5).map((source, i) => (
                <motion.div
                  key={source.category}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className="relative"
                >
                  <div className="text-2xl" title={source.category}>
                    {source.icon}
                  </div>
                  {source.hasAI && (
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-purple-400 rounded-full" />
                  )}
                </motion.div>
              ))}
              {dataSources.length > 5 && (
                <span className="text-white/60 text-xs">
                  +{dataSources.length - 5} more
                </span>
              )}
            </div>
          )}
          
          {/* Expandable Section */}
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="pt-4 border-t border-white/20">
                  {/* Score Breakdown */}
                  <div className="mb-4">
                    <h3 className="text-white/90 text-xs font-semibold mb-3 uppercase tracking-wider">
                      Score Breakdown
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-white/20 backdrop-blur rounded-xl p-3">
                        <div className="flex items-center justify-between">
                          <span className="text-white/70 text-xs">Completeness</span>
                          <span className="text-white font-semibold text-sm">
                            {compositeScore.breakdown?.completeness}%
                          </span>
                        </div>
                        <div className="mt-1 h-1 bg-white/20 rounded-full overflow-hidden">
                          <motion.div
                            className="h-full bg-white/60"
                            initial={{ width: 0 }}
                            animate={{ width: `${compositeScore.breakdown?.completeness}%` }}
                            transition={{ delay: 0.2, duration: 0.5 }}
                          />
                        </div>
                      </div>
                      
                      <div className="bg-white/20 backdrop-blur rounded-xl p-3">
                        <div className="flex items-center justify-between">
                          <span className="text-white/70 text-xs">AI Insights</span>
                          <span className="text-white font-semibold text-sm">
                            {compositeScore.breakdown?.insights}%
                          </span>
                        </div>
                        <div className="mt-1 h-1 bg-white/20 rounded-full overflow-hidden">
                          <motion.div
                            className="h-full bg-white/60"
                            initial={{ width: 0 }}
                            animate={{ width: `${compositeScore.breakdown?.insights}%` }}
                            transition={{ delay: 0.3, duration: 0.5 }}
                          />
                        </div>
                      </div>
                      
                      <div className="bg-white/20 backdrop-blur rounded-xl p-3">
                        <div className="flex items-center justify-between">
                          <span className="text-white/70 text-xs">Image Analysis</span>
                          <span className="text-white font-semibold text-sm">
                            {compositeScore.breakdown?.imageAnalysis || 0}%
                          </span>
                        </div>
                        <div className="mt-1 h-1 bg-white/20 rounded-full overflow-hidden">
                          <motion.div
                            className="h-full bg-purple-400/60"
                            initial={{ width: 0 }}
                            animate={{ width: `${compositeScore.breakdown?.imageAnalysis || 0}%` }}
                            transition={{ delay: 0.4, duration: 0.5 }}
                          />
                        </div>
                      </div>
                      
                      <div className="bg-white/20 backdrop-blur rounded-xl p-3">
                        <div className="flex items-center justify-between">
                          <span className="text-white/70 text-xs">Diversity</span>
                          <span className="text-white font-semibold text-sm">
                            {compositeScore.breakdown?.diversity} types
                          </span>
                        </div>
                        <div className="mt-1 h-1 bg-white/20 rounded-full overflow-hidden">
                          <motion.div
                            className="h-full bg-blue-400/60"
                            initial={{ width: 0 }}
                            animate={{ width: `${(compositeScore.breakdown?.diversity || 0) * 20}%` }}
                            transition={{ delay: 0.5, duration: 0.5 }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Data Sources */}
                  <div>
                    <h3 className="text-white/90 text-xs font-semibold mb-3 uppercase tracking-wider">
                      Data Sources
                    </h3>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {dataSources.map((source, i) => (
                        <motion.div
                          key={source.category}
                          initial={{ x: -20, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: i * 0.05 }}
                          className="bg-white/20 backdrop-blur rounded-xl p-3"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="text-2xl">
                                {source.icon}
                              </div>
                              <div>
                                <p className="text-white font-medium text-sm capitalize">
                                  {source.category.replace('_', ' ')}
                                </p>
                                <p className="text-white/60 text-xs">
                                  {source.count} {source.count === 1 ? 'record' : 'records'}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-white/80 text-xs">
                                {formatTimeAgo(source.latestDate)}
                              </p>
                              {source.hasAI && (
                                <div className="flex items-center justify-end mt-1">
                                  <SparklesIcon className="w-3 h-3 text-secondary-300 mr-1" />
                                  <span className="text-secondary-300 text-xs">AI</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                      
                      {dataSources.length === 0 && (
                        <div className="text-center py-4">
                          <DocumentTextIcon className="w-8 h-8 text-white/40 mx-auto mb-2" />
                          <p className="text-white/60 text-sm">No records yet</p>
                          <p className="text-white/40 text-xs">Upload your first health record</p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Quick Actions */}
                  <div className="mt-4 flex space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowJournal(true);
                      }}
                      className="flex-1 bg-white/30 backdrop-blur text-white text-sm font-medium py-2 px-4 rounded-xl flex items-center justify-center space-x-2 hover:bg-white/40 transition-colors"
                    >
                      <PlusIcon className="w-4 h-4" />
                      <span>Add Note</span>
                    </button>
                    <button className="flex-1 bg-white/30 backdrop-blur text-white text-sm font-medium py-2 px-4 rounded-xl hover:bg-white/40 transition-colors">
                      View Timeline
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-white/5 rounded-full blur-3xl" />
        
        {/* Score ring decoration */}
        <svg className="absolute top-4 right-4 w-16 h-16 opacity-20" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="white"
            strokeWidth="2"
            strokeDasharray={`${compositeScore.value * 2.83} 283`}
            transform="rotate(-90 50 50)"
            className="transition-all duration-1000"
          />
        </svg>
      </motion.div>
      
      {/* Journal Modal */}
      <AnimatePresence>
        {showJournal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-white/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowJournal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-lg"
            >
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                Quick Health Note
              </h3>
              <textarea
                value={journalEntry}
                onChange={(e) => setJournalEntry(e.target.value)}
                placeholder="How are you feeling today? Any symptoms or updates?"
                className="w-full h-32 p-3 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 bg-gray-50 text-gray-900"
              />
              <div className="flex space-x-3 mt-4">
                <button
                  onClick={() => setShowJournal(false)}
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    console.log('Journal entry:', journalEntry);
                    setJournalEntry('');
                    setShowJournal(false);
                  }}
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 transition-colors"
                >
                  Save
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default HealthOracle;