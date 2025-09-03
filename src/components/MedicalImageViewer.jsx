import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  XMarkIcon,
  MagnifyingGlassPlusIcon,
  MagnifyingGlassMinusIcon,
  ArrowPathIcon,
  DocumentTextIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  InformationCircleIcon,
  SparklesIcon,
  PhotoIcon,
  BeakerIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import apiService from '../services/api';

function MedicalImageViewer({ imageUrl, recordId, onClose, initialAnalysis }) {
  const [analysis, setAnalysis] = useState(initialAnalysis || null);
  const [loading, setLoading] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [showMetrics, setShowMetrics] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  // Analyze image if not already analyzed
  useEffect(() => {
    if (!analysis && imageUrl) {
      analyzeImage();
    }
  }, [imageUrl]);

  const analyzeImage = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Convert image URL to file for analysis
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const file = new File([blob], 'medical-image.jpg', { type: blob.type });
      
      // Call image analysis API
      const formData = new FormData();
      formData.append('image', file);
      if (recordId) {
        formData.append('recordId', recordId);
      }
      
      const analysisResult = await apiService.analyzeImage(formData);
      setAnalysis(analysisResult);
    } catch (err) {
      console.error('Image analysis error:', err);
      setError('Failed to analyze image');
    } finally {
      setLoading(false);
    }
  };

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.5));
  const handleResetZoom = () => setZoom(1);

  // Format metrics for display
  const formatMetric = (value, unit = '') => {
    if (typeof value === 'number') {
      return `${value.toFixed(2)} ${unit}`.trim();
    }
    return value || 'N/A';
  };

  // Get quality color
  const getQualityColor = (score) => {
    if (score >= 0.8) return 'text-success-600';
    if (score >= 0.6) return 'text-primary-600';
    if (score >= 0.4) return 'text-amber-600';
    return 'text-red-600';
  };

  // Get boolean icon
  const getBooleanIcon = (value) => {
    return value ? 
      <CheckCircleIcon className="w-4 h-4 text-success-600" /> :
      <XMarkIcon className="w-4 h-4 text-red-600" />;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-white/95 backdrop-blur-sm z-50 flex flex-col"
    >
      {/* Header */}
      <div className="bg-white/90 backdrop-blur-sm border-b border-gray-100 shadow-lg">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-3">
            <PhotoIcon className="w-6 h-6 text-gray-900" />
            <h2 className="text-lg font-semibold text-gray-900">Medical Image Analysis</h2>
            {analysis?.imageType && (
              <span className="px-2 py-1 bg-primary-100 text-primary-700 text-xs font-medium rounded-lg capitalize">
                {analysis.imageType}
              </span>
            )}
          </div>
          
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <XMarkIcon className="w-6 h-6 text-gray-900" />
          </button>
        </div>
        
        {/* Tabs */}
        <div className="flex space-x-1 px-4 pb-2">
          {['overview', 'metrics', 'measurements', 'ai'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Image Viewer */}
        <div className="flex-1 relative bg-gray-50 flex items-center justify-center overflow-hidden">
          {/* Zoom Controls */}
          <div className="absolute top-4 right-4 z-10 bg-white/90 backdrop-blur-sm rounded-lg p-2 flex space-x-2 shadow-lg">
            <button
              onClick={handleZoomOut}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <MagnifyingGlassMinusIcon className="w-5 h-5 text-gray-900" />
            </button>
            <button
              onClick={handleResetZoom}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowPathIcon className="w-5 h-5 text-gray-900" />
            </button>
            <button
              onClick={handleZoomIn}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <MagnifyingGlassPlusIcon className="w-5 h-5 text-gray-900" />
            </button>
          </div>
          
          {/* Image */}
          <motion.div
            className="relative"
            style={{
              transform: `scale(${zoom})`,
              transition: 'transform 0.2s ease-out'
            }}
          >
            <img
              src={imageUrl}
              alt="Medical scan"
              className="max-w-full max-h-full object-contain"
              draggable={false}
            />
            
            {/* Loading Overlay */}
            {loading && (
              <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                <div className="text-center">
                  <ArrowPathIcon className="w-8 h-8 text-gray-900 animate-spin mx-auto mb-2" />
                  <p className="text-gray-900 text-sm">Analyzing image...</p>
                </div>
              </div>
            )}
          </motion.div>
        </div>

        {/* Analysis Panel */}
        <div className="w-96 bg-white border-l border-gray-100 overflow-y-auto shadow-lg">
          <AnimatePresence mode="wait">
            {activeTab === 'overview' && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-4 space-y-4"
              >
                {/* Quality Score */}
                {analysis?.qualityMetrics && (
                  <div className="bg-gray-50 rounded-xl p-4 shadow-lg">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                      <ShieldCheckIcon className="w-4 h-4 mr-2" />
                      Image Quality
                    </h3>
                    
                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-600">Overall Quality</span>
                        <span className={`text-2xl font-bold ${
                          getQualityColor(analysis.qualityMetrics.overallQuality.score)
                        }`}>
                          {Math.round(analysis.qualityMetrics.overallQuality.score * 100)}%
                        </span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-gradient-to-r from-primary-500 to-success-500"
                          initial={{ width: 0 }}
                          animate={{ width: `${analysis.qualityMetrics.overallQuality.score * 100}%` }}
                          transition={{ duration: 0.5 }}
                        />
                      </div>
                      <p className="text-xs text-gray-600 mt-1 capitalize">
                        {analysis.qualityMetrics.overallQuality.rating}
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div className="text-xs">
                        <span className="text-gray-600">Brightness:</span>
                        <span className="ml-1 text-gray-900">
                          {analysis.qualityMetrics.brightness.assessment}
                        </span>
                      </div>
                      <div className="text-xs">
                        <span className="text-gray-600">Contrast:</span>
                        <span className="ml-1 text-gray-900">
                          {analysis.qualityMetrics.contrast.assessment}
                        </span>
                      </div>
                      <div className="text-xs">
                        <span className="text-gray-600">Sharpness:</span>
                        <span className="ml-1 text-gray-900">
                          {analysis.qualityMetrics.sharpness.assessment}
                        </span>
                      </div>
                      <div className="text-xs">
                        <span className="text-gray-600">Noise:</span>
                        <span className="ml-1 text-gray-900">
                          {analysis.qualityMetrics.noise.assessment}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Clinical Flags */}
                {analysis?.clinicalFlags && analysis.clinicalFlags.length > 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <h3 className="text-sm font-semibold text-amber-700 mb-3 flex items-center">
                      <ExclamationTriangleIcon className="w-4 h-4 mr-2" />
                      Clinical Flags
                    </h3>
                    <div className="space-y-2">
                      {analysis.clinicalFlags.map((flag, i) => (
                        <div key={i} className="flex items-start space-x-2">
                          <InformationCircleIcon className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-xs text-gray-900">{flag.description}</p>
                            <span className={`text-xs ${
                              flag.severity === 'high' ? 'text-red-600' :
                              flag.severity === 'moderate' ? 'text-amber-600' :
                              'text-primary-600'
                            }`}>
                              {flag.severity} severity
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Confidence Score */}
                {analysis?.confidenceScore !== undefined && (
                  <div className="bg-gray-50 rounded-xl p-4 shadow-lg">
                    <h3 className="text-sm font-semibold text-gray-900 mb-2">
                      Analysis Confidence
                    </h3>
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <motion.div
                            className="h-full bg-secondary-500"
                            initial={{ width: 0 }}
                            animate={{ width: `${analysis.confidenceScore * 100}%` }}
                            transition={{ duration: 0.5 }}
                          />
                        </div>
                      </div>
                      <span className="ml-3 text-sm font-medium text-secondary-600">
                        {Math.round(analysis.confidenceScore * 100)}%
                      </span>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
            
            {activeTab === 'metrics' && (
              <motion.div
                key="metrics"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-4 space-y-4"
              >
                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                  <ChartBarIcon className="w-4 h-4 mr-2" />
                  Numerical Metrics
                </h3>
                
                {analysis?.numericalMetrics && (
                  <div className="space-y-3">
                    <div className="bg-gray-50 rounded-lg p-3 shadow-lg">
                      <h4 className="text-xs font-medium text-gray-700 mb-2">Intensity Statistics</h4>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-600">Mean:</span>
                          <span className="text-gray-900">
                            {formatMetric(analysis.numericalMetrics.meanIntensity)}
                          </span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-600">Median:</span>
                          <span className="text-gray-900">
                            {formatMetric(analysis.numericalMetrics.medianIntensity)}
                          </span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-600">Std Dev:</span>
                          <span className="text-gray-900">
                            {formatMetric(analysis.numericalMetrics.stdDeviation)}
                          </span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-600">Entropy:</span>
                          <span className="text-gray-900">
                            {formatMetric(analysis.numericalMetrics.entropy)}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {analysis.numericalMetrics.spatialResolution && (
                      <div className="bg-gray-50 rounded-lg p-3 shadow-lg">
                        <h4 className="text-xs font-medium text-gray-700 mb-2">Spatial Resolution</h4>
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-600">Dimensions:</span>
                            <span className="text-gray-900">
                              {analysis.numericalMetrics.spatialResolution.horizontal} × {analysis.numericalMetrics.spatialResolution.vertical}
                            </span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-600">Total Pixels:</span>
                            <span className="text-gray-900">
                              {analysis.numericalMetrics.spatialResolution.total.toLocaleString()}
                            </span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-600">Aspect Ratio:</span>
                            <span className="text-gray-900">
                              {analysis.numericalMetrics.spatialResolution.aspectRatio}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {analysis.numericalMetrics.densityMetrics && (
                      <div className="bg-gray-50 rounded-lg p-3 shadow-lg">
                        <h4 className="text-xs font-medium text-gray-700 mb-2">Density Analysis</h4>
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-600">Mean Density:</span>
                            <span className="text-gray-900">
                              {formatMetric(analysis.numericalMetrics.densityMetrics.meanDensity)}
                            </span>
                          </div>
                          {analysis.numericalMetrics.densityMetrics.densityCategory && (
                            <div className="flex justify-between text-xs">
                              <span className="text-gray-600">Category:</span>
                              <span className="text-gray-900 capitalize">
                                {analysis.numericalMetrics.densityMetrics.densityCategory.replace('_', ' ')}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Boolean Metrics */}
                {analysis?.booleanMetrics && (
                  <div className="mt-4">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">
                      Boolean Assessments
                    </h3>
                    <div className="bg-gray-50 rounded-lg p-3 space-y-2 shadow-lg">
                      {Object.entries(analysis.booleanMetrics).map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between text-xs">
                          <span className="text-gray-600">
                            {key.replace(/([A-Z])/g, ' $1').trim()}:
                          </span>
                          <div className="flex items-center space-x-1">
                            {getBooleanIcon(value)}
                            <span className={value ? 'text-success-600' : 'text-red-600'}>
                              {value ? 'Yes' : 'No'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
            
            {activeTab === 'measurements' && (
              <motion.div
                key="measurements"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-4 space-y-4"
              >
                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                  <BeakerIcon className="w-4 h-4 mr-2" />
                  Clinical Measurements
                </h3>
                
                {analysis?.measurements && Object.keys(analysis.measurements).length > 0 ? (
                  <div className="space-y-3">
                    {Object.entries(analysis.measurements).map(([key, value]) => (
                      <div key={key} className="bg-gray-50 rounded-lg p-3 shadow-lg">
                        <h4 className="text-xs font-medium text-gray-700 mb-2 capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </h4>
                        {typeof value === 'object' ? (
                          <div className="space-y-1">
                            {Object.entries(value).map(([subKey, subValue]) => (
                              <div key={subKey} className="flex justify-between text-xs">
                                <span className="text-gray-600 capitalize">
                                  {subKey.replace(/([A-Z])/g, ' $1').trim()}:
                                </span>
                                <span className="text-gray-900">
                                  {formatMetric(subValue)}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-900">{formatMetric(value)}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-600 text-center py-8">
                    No measurements available for this image type
                  </p>
                )}
              </motion.div>
            )}
            
            {activeTab === 'ai' && (
              <motion.div
                key="ai"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-4 space-y-4"
              >
                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                  <SparklesIcon className="w-4 h-4 mr-2" />
                  AI Analysis
                </h3>
                
                {analysis?.aiAnalysis ? (
                  <div className="space-y-4">
                    {analysis.aiAnalysis.findings && analysis.aiAnalysis.findings.length > 0 && (
                      <div className="bg-gray-50 rounded-lg p-3 shadow-lg">
                        <h4 className="text-xs font-medium text-gray-700 mb-2">Key Findings</h4>
                        <ul className="space-y-1">
                          {analysis.aiAnalysis.findings.map((finding, i) => (
                            <li key={i} className="text-xs text-gray-900 flex items-start">
                              <span className="text-primary-600 mr-2">•</span>
                              {finding}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {analysis.aiAnalysis.measurements && Object.keys(analysis.aiAnalysis.measurements).length > 0 && (
                      <div className="bg-gray-50 rounded-lg p-3 shadow-lg">
                        <h4 className="text-xs font-medium text-gray-700 mb-2">AI Measurements</h4>
                        <div className="space-y-1">
                          {Object.entries(analysis.aiAnalysis.measurements).map(([key, value]) => (
                            <div key={key} className="flex justify-between text-xs">
                              <span className="text-gray-600">{key}:</span>
                              <span className="text-gray-900">
                                {value.value} {value.unit}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {analysis.aiAnalysis.clinicalNotes && analysis.aiAnalysis.clinicalNotes.length > 0 && (
                      <div className="bg-gray-50 rounded-lg p-3 shadow-lg">
                        <h4 className="text-xs font-medium text-gray-700 mb-2">Clinical Notes</h4>
                        <div className="space-y-2">
                          {analysis.aiAnalysis.clinicalNotes.map((note, i) => (
                            <p key={i} className="text-xs text-gray-900">
                              {note}
                            </p>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <SparklesIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">
                      AI analysis not available
                    </p>
                    <button
                      onClick={analyzeImage}
                      disabled={loading}
                      className="mt-3 px-4 py-2 bg-secondary-600 hover:bg-secondary-700 text-white text-sm rounded-lg transition-colors disabled:opacity-50"
                    >
                      {loading ? 'Analyzing...' : 'Run AI Analysis'}
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

export default MedicalImageViewer;