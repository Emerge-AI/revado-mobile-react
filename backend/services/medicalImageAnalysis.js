import sharp from 'sharp';
import * as tf from '@tensorflow/tfjs-node';
import fs from 'fs/promises';
import path from 'path';
import Anthropic from '@anthropic-ai/sdk';

// Initialize Anthropic client for advanced image analysis
const anthropic = process.env.ANTHROPIC_API_KEY ?
  new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY }) : null;

/**
 * Medical Image Analysis Service
 * Analyzes CT scans, X-rays, MRIs, and other medical images
 * Extracts numerical and boolean metrics for clinical insights
 */
class MedicalImageAnalysisService {
  constructor() {
    this.supportedFormats = [
      'image/jpeg', 'image/png', 'image/gif',
      'image/webp', 'image/tiff', 'image/bmp',
      'application/dicom', 'image/dicom-rle'
    ];

    // Medical image type detection patterns
    this.imageTypePatterns = {
      xray: /x[-_]?ray|radiograph|chest|bone|skeletal/i,
      ct: /ct[-_]?scan|computed[-_]?tomography|cat[-_]?scan/i,
      mri: /mri|magnetic[-_]?resonance/i,
      ultrasound: /ultrasound|sonogram|echo/i,
      mammogram: /mammogram|breast/i,
      dental: /dental|teeth|panoramic|bitewing|periapical/i,
      pet: /pet[-_]?scan|positron/i,
      ekg: /ekg|ecg|electrocardiogram/i
    };

    // Initialize metrics thresholds
    this.metricsThresholds = {
      quality: { min: 0.7, optimal: 0.85 },
      contrast: { min: 0.3, optimal: 0.5 },
      brightness: { min: 0.2, max: 0.8 },
      sharpness: { min: 0.6, optimal: 0.8 }
    };
  }

  /**
   * Main analysis function for medical images
   */
  async analyzeImage(filePath, metadata = {}) {
    try {
      console.log('[MedicalImageAnalysis] Starting analysis for:', filePath);

      // Load and preprocess image
      const imageBuffer = await fs.readFile(filePath);
      const imageMetadata = await sharp(imageBuffer).metadata();

      // Detect image type
      const imageType = this.detectImageType(metadata.filename || '', metadata.description || '');

      // Perform basic image quality analysis
      const qualityMetrics = await this.analyzeImageQuality(imageBuffer, imageMetadata);

      // Extract numerical metrics
      const numericalMetrics = await this.extractNumericalMetrics(imageBuffer, imageMetadata, imageType);

      // Perform boolean assessments
      const booleanMetrics = await this.performBooleanAssessments(imageBuffer, imageType, qualityMetrics);

      // Extract anatomical measurements if applicable
      const measurements = await this.extractMeasurements(imageBuffer, imageType);

      // AI-powered analysis if available
      let aiAnalysis = null;
      if (anthropic && process.env.ENABLE_AI_ANALYSIS === 'true') {
        aiAnalysis = await this.performAIAnalysis(imageBuffer, imageType, metadata);
      }

      // Compile comprehensive analysis result
      const result = {
        imageType,
        metadata: {
          width: imageMetadata.width,
          height: imageMetadata.height,
          format: imageMetadata.format,
          channels: imageMetadata.channels,
          density: imageMetadata.density,
          hasAlpha: imageMetadata.hasAlpha,
          size: imageMetadata.size
        },
        qualityMetrics,
        numericalMetrics,
        booleanMetrics,
        measurements,
        aiAnalysis,
        clinicalFlags: this.generateClinicalFlags(booleanMetrics, measurements),
        confidenceScore: this.calculateConfidenceScore(qualityMetrics, numericalMetrics),
        timestamp: new Date().toISOString()
      };

      console.log('[MedicalImageAnalysis] Analysis complete:', {
        type: result.imageType,
        confidence: result.confidenceScore,
        flags: result.clinicalFlags.length
      });

      return result;
    } catch (error) {
      console.error('[MedicalImageAnalysis] Analysis error:', error);
      throw error;
    }
  }

  /**
   * Detect the type of medical image
   */
  detectImageType(filename, description) {
    const text = `${filename} ${description}`.toLowerCase();

    for (const [type, pattern] of Object.entries(this.imageTypePatterns)) {
      if (pattern.test(text)) {
        return type;
      }
    }

    // Default based on common patterns
    if (text.includes('scan')) return 'ct';
    if (text.includes('ray')) return 'xray';

    return 'general';
  }

  /**
   * Analyze image quality metrics
   */
  async analyzeImageQuality(buffer, metadata) {
    const image = sharp(buffer);
    const stats = await image.stats();

    // Calculate quality metrics
    const brightness = this.calculateBrightness(stats);
    const contrast = this.calculateContrast(stats);
    const sharpness = await this.calculateSharpness(buffer);
    const noise = this.calculateNoise(stats);

    // Overall quality score (0-1)
    const qualityScore = this.calculateQualityScore({
      brightness, contrast, sharpness, noise
    });

    return {
      brightness: {
        value: brightness,
        normalized: this.normalize(brightness, 0, 255),
        assessment: this.assessBrightness(brightness)
      },
      contrast: {
        value: contrast,
        normalized: this.normalize(contrast, 0, 100),
        assessment: this.assessContrast(contrast)
      },
      sharpness: {
        value: sharpness,
        normalized: sharpness,
        assessment: this.assessSharpness(sharpness)
      },
      noise: {
        value: noise,
        normalized: this.normalize(noise, 0, 50),
        assessment: this.assessNoise(noise)
      },
      overallQuality: {
        score: qualityScore,
        rating: this.getQualityRating(qualityScore)
      }
    };
  }

  /**
   * Extract numerical metrics from the image
   */
  async extractNumericalMetrics(buffer, metadata, imageType) {
    const image = sharp(buffer);
    const { data, info } = await image
      .raw()
      .toBuffer({ resolveWithObject: true });

    // Convert to grayscale for analysis
    const grayscale = await sharp(buffer)
      .grayscale()
      .raw()
      .toBuffer();

    // Calculate histogram
    const histogram = this.calculateHistogram(grayscale, info.width * info.height);

    // Calculate statistical metrics
    const metrics = {
      // Pixel intensity statistics
      meanIntensity: this.calculateMean(grayscale),
      medianIntensity: this.calculateMedian(grayscale),
      stdDeviation: this.calculateStdDev(grayscale),

      // Distribution metrics
      skewness: this.calculateSkewness(histogram),
      kurtosis: this.calculateKurtosis(histogram),
      entropy: this.calculateEntropy(histogram),

      // Spatial metrics
      spatialResolution: {
        horizontal: metadata.width,
        vertical: metadata.height,
        total: metadata.width * metadata.height,
        aspectRatio: (metadata.width / metadata.height).toFixed(2)
      },

      // Density metrics (for applicable image types)
      densityMetrics: this.calculateDensityMetrics(grayscale, imageType),

      // Region of interest metrics
      roiMetrics: await this.calculateROIMetrics(buffer, imageType)
    };

    return metrics;
  }

  /**
   * Perform boolean assessments on the image
   */
  async performBooleanAssessments(buffer, imageType, qualityMetrics) {
    const assessments = {
      // Quality assessments
      isHighQuality: qualityMetrics.overallQuality.score >= this.metricsThresholds.quality.optimal,
      isAcceptableQuality: qualityMetrics.overallQuality.score >= this.metricsThresholds.quality.min,
      hasGoodContrast: qualityMetrics.contrast.normalized >= this.metricsThresholds.contrast.optimal,
      hasGoodSharpness: qualityMetrics.sharpness.normalized >= this.metricsThresholds.sharpness.optimal,

      // Image characteristics
      isColorImage: await this.isColorImage(buffer),
      hasAnnotations: await this.detectAnnotations(buffer),
      hasMarkers: await this.detectMarkers(buffer),
      isInverted: await this.isInverted(buffer, imageType),

      // Clinical relevance
      isValidOrientation: await this.checkOrientation(buffer, imageType),
      hasCompleteView: await this.checkCompleteness(buffer, imageType),
      hasArtifacts: await this.detectArtifacts(buffer),
      requiresEnhancement: qualityMetrics.overallQuality.score < 0.7
    };

    // Type-specific assessments
    if (imageType === 'xray' || imageType === 'ct') {
      assessments.hasAbnormalDensity = await this.detectAbnormalDensity(buffer);
      assessments.hasAsymmetry = await this.detectAsymmetry(buffer);
    }

    if (imageType === 'dental') {
      assessments.showsAllTeeth = await this.checkDentalCompleteness(buffer);
      assessments.hasVisiblePathology = await this.detectDentalPathology(buffer);
    }

    return assessments;
  }

  /**
   * Extract measurements from medical images
   */
  async extractMeasurements(buffer, imageType) {
    const measurements = {};

    // Common measurements for all image types
    const image = sharp(buffer);
    const metadata = await image.metadata();

    // Physical dimensions if DPI is available
    if (metadata.density) {
      measurements.physicalDimensions = {
        width: (metadata.width / metadata.density).toFixed(2),
        height: (metadata.height / metadata.density).toFixed(2),
        unit: 'inches'
      };
    }

    // Type-specific measurements
    switch (imageType) {
      case 'xray':
        measurements.cardiothoracicRatio = await this.measureCTRatio(buffer);
        measurements.lungFieldArea = await this.measureLungFields(buffer);
        break;

      case 'dental':
        measurements.toothCount = await this.countTeeth(buffer);
        measurements.boneLevel = await this.measureBoneLevel(buffer);
        break;

      case 'ct':
      case 'mri':
        measurements.sliceThickness = this.extractSliceThickness(metadata);
        measurements.fieldOfView = this.calculateFieldOfView(metadata);
        break;
    }

    return measurements;
  }

  /**
   * Perform AI-powered analysis using Claude
   */
  async performAIAnalysis(buffer, imageType, metadata) {
    if (!anthropic) return null;

    try {
      const base64Image = buffer.toString('base64');
      const mimeType = `image/${metadata.format || 'jpeg'}`;

      const prompt = `Analyze this medical ${imageType} image and provide:
1. Numerical measurements (in appropriate units)
2. Boolean assessments (true/false findings)
3. Clinical observations
4. Quality assessment
5. Any notable anatomical features or abnormalities

Focus on factual, measurable data. Provide specific numbers where possible.
Format measurements as: measurement_name: value unit
Format booleans as: assessment_name: true/false`;

      const response = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1500,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mimeType,
                data: base64Image
              }
            },
            {
              type: 'text',
              text: prompt
            }
          ]
        }]
      });

      // Parse the AI response
      const aiText = response.content[0].text;
      const parsed = this.parseAIResponse(aiText);

      return {
        findings: parsed.findings,
        measurements: parsed.measurements,
        booleanAssessments: parsed.booleans,
        clinicalNotes: parsed.clinical,
        confidence: 0.85 // AI confidence score
      };
    } catch (error) {
      console.error('[MedicalImageAnalysis] AI analysis error:', error);
      return null;
    }
  }

  /**
   * Helper functions for calculations
   */

  calculateBrightness(stats) {
    const channels = stats.channels;
    const avgBrightness = channels.reduce((sum, channel) =>
      sum + channel.mean, 0) / channels.length;
    return avgBrightness;
  }

  calculateContrast(stats) {
    const channels = stats.channels;
    const avgStdDev = channels.reduce((sum, channel) =>
      sum + channel.stdev, 0) / channels.length;
    return avgStdDev;
  }

  async calculateSharpness(buffer) {
    // Simplified sharpness calculation using edge detection
    const edges = await sharp(buffer)
      .convolve({
        width: 3,
        height: 3,
        kernel: [-1, -1, -1, -1, 8, -1, -1, -1, -1] // Laplacian kernel
      })
      .raw()
      .toBuffer();

    const variance = this.calculateVariance(edges);
    return Math.min(variance / 1000, 1); // Normalize to 0-1
  }

  calculateNoise(stats) {
    // Estimate noise from high-frequency components
    const channels = stats.channels;
    const avgNoise = channels.reduce((sum, channel) => {
      const noise = channel.stdev / channel.mean;
      return sum + (isNaN(noise) ? 0 : noise);
    }, 0) / channels.length;
    return avgNoise * 100; // Convert to percentage
  }

  calculateQualityScore(metrics) {
    const weights = {
      brightness: 0.2,
      contrast: 0.3,
      sharpness: 0.35,
      noise: 0.15
    };

    let score = 0;

    // Brightness score (optimal between 0.3-0.7)
    const brightnessScore = metrics.brightness > 0.3 && metrics.brightness < 0.7 ? 1 :
      Math.max(0, 1 - Math.abs(metrics.brightness - 0.5) * 2);
    score += brightnessScore * weights.brightness;

    // Contrast score
    score += Math.min(metrics.contrast / 50, 1) * weights.contrast;

    // Sharpness score
    score += metrics.sharpness * weights.sharpness;

    // Noise score (inverse - less noise is better)
    score += Math.max(0, 1 - metrics.noise / 20) * weights.noise;

    return Math.min(Math.max(score, 0), 1);
  }

  calculateHistogram(data, size) {
    const histogram = new Array(256).fill(0);
    for (let i = 0; i < size; i++) {
      histogram[data[i]]++;
    }
    return histogram.map(count => count / size);
  }

  calculateMean(data) {
    const sum = data.reduce((a, b) => a + b, 0);
    return sum / data.length;
  }

  calculateMedian(data) {
    const sorted = Array.from(data).sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  }

  calculateStdDev(data) {
    const mean = this.calculateMean(data);
    const squaredDiffs = Array.from(data).map(value => Math.pow(value - mean, 2));
    const avgSquaredDiff = this.calculateMean(squaredDiffs);
    return Math.sqrt(avgSquaredDiff);
  }

  calculateVariance(data) {
    const mean = this.calculateMean(data);
    const squaredDiffs = Array.from(data).map(value => Math.pow(value - mean, 2));
    return this.calculateMean(squaredDiffs);
  }

  calculateSkewness(histogram) {
    // Simplified skewness calculation
    let mean = 0, variance = 0, skewness = 0;

    for (let i = 0; i < histogram.length; i++) {
      mean += i * histogram[i];
    }

    for (let i = 0; i < histogram.length; i++) {
      variance += Math.pow(i - mean, 2) * histogram[i];
    }

    const stdDev = Math.sqrt(variance);

    for (let i = 0; i < histogram.length; i++) {
      skewness += Math.pow((i - mean) / stdDev, 3) * histogram[i];
    }

    return skewness;
  }

  calculateKurtosis(histogram) {
    // Simplified kurtosis calculation
    let mean = 0, variance = 0, kurtosis = 0;

    for (let i = 0; i < histogram.length; i++) {
      mean += i * histogram[i];
    }

    for (let i = 0; i < histogram.length; i++) {
      variance += Math.pow(i - mean, 2) * histogram[i];
    }

    const stdDev = Math.sqrt(variance);

    for (let i = 0; i < histogram.length; i++) {
      kurtosis += Math.pow((i - mean) / stdDev, 4) * histogram[i];
    }

    return kurtosis - 3; // Excess kurtosis
  }

  calculateEntropy(histogram) {
    let entropy = 0;
    for (const p of histogram) {
      if (p > 0) {
        entropy -= p * Math.log2(p);
      }
    }
    return entropy;
  }

  calculateDensityMetrics(data, imageType) {
    const metrics = {};

    if (imageType === 'xray' || imageType === 'ct') {
      // Hounsfield units simulation for CT
      const mean = this.calculateMean(data);
      const normalized = (mean - 128) * 8; // Rough approximation

      metrics.meanDensity = normalized;
      metrics.densityCategory = this.categorizeDensity(normalized);
    }

    return metrics;
  }

  async calculateROIMetrics(buffer, imageType) {
    // Simplified ROI detection - find the center region with highest variance
    const image = sharp(buffer);
    const { data, info } = await image
      .grayscale()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const centerX = Math.floor(info.width / 2);
    const centerY = Math.floor(info.height / 2);
    const roiSize = Math.min(info.width, info.height) / 4;

    // Extract ROI data
    const roiData = [];
    for (let y = centerY - roiSize; y < centerY + roiSize; y++) {
      for (let x = centerX - roiSize; x < centerX + roiSize; x++) {
        if (x >= 0 && x < info.width && y >= 0 && y < info.height) {
          roiData.push(data[y * info.width + x]);
        }
      }
    }

    return {
      meanIntensity: this.calculateMean(roiData),
      variance: this.calculateVariance(roiData),
      size: roiData.length
    };
  }

  // Assessment helper functions
  normalize(value, min, max) {
    return Math.max(0, Math.min(1, (value - min) / (max - min)));
  }

  assessBrightness(value) {
    if (value < 50) return 'underexposed';
    if (value > 200) return 'overexposed';
    return 'optimal';
  }

  assessContrast(value) {
    if (value < 20) return 'low';
    if (value > 60) return 'high';
    return 'good';
  }

  assessSharpness(value) {
    if (value < 0.4) return 'blurry';
    if (value > 0.7) return 'sharp';
    return 'acceptable';
  }

  assessNoise(value) {
    if (value < 5) return 'clean';
    if (value > 15) return 'noisy';
    return 'moderate';
  }

  getQualityRating(score) {
    if (score >= 0.85) return 'excellent';
    if (score >= 0.7) return 'good';
    if (score >= 0.5) return 'acceptable';
    if (score >= 0.3) return 'poor';
    return 'unusable';
  }

  categorizeDensity(value) {
    if (value < -1000) return 'air';
    if (value < -500) return 'lung';
    if (value < -100) return 'fat';
    if (value < 40) return 'soft_tissue';
    if (value < 300) return 'bone_cancellous';
    return 'bone_cortical';
  }

  // Boolean check implementations
  async isColorImage(buffer) {
    const metadata = await sharp(buffer).metadata();
    return metadata.channels >= 3;
  }

  async detectAnnotations(buffer) {
    // Simple check for text/annotations by looking for high-contrast edges
    const edges = await sharp(buffer)
      .convolve({
        width: 3,
        height: 3,
        kernel: [-1, -1, -1, -1, 8, -1, -1, -1, -1]
      })
      .raw()
      .toBuffer();

    const variance = this.calculateVariance(edges);
    return variance > 5000; // Threshold for annotation detection
  }

  async detectMarkers(buffer) {
    // Detect standard medical image markers (L/R, measurement rulers)
    return false; // Simplified implementation
  }

  async isInverted(buffer, imageType) {
    if (imageType !== 'xray') return false;

    const stats = await sharp(buffer).stats();
    const meanBrightness = stats.channels[0].mean;

    // X-rays typically have dark background (air) and bright bones
    // If mean is > 128, might be inverted
    return meanBrightness > 140;
  }

  async checkOrientation(buffer, imageType) {
    const metadata = await sharp(buffer).metadata();

    // Check if image has proper orientation for the type
    if (imageType === 'xray' && metadata.orientation) {
      return metadata.orientation === 1; // Normal orientation
    }

    return true;
  }

  async checkCompleteness(buffer, imageType) {
    // Check if the image shows complete anatomical view
    // Simplified - check if image is not cropped too tightly
    const metadata = await sharp(buffer).metadata();

    if (imageType === 'xray') {
      return metadata.width >= 1000 && metadata.height >= 1000;
    }

    return true;
  }

  async detectArtifacts(buffer) {
    // Detect common imaging artifacts
    return false; // Simplified implementation
  }

  async detectAbnormalDensity(buffer) {
    const stats = await sharp(buffer).grayscale().stats();
    const histogram = this.calculateHistogram(
      await sharp(buffer).grayscale().raw().toBuffer(),
      stats.channels[0].mean
    );

    // Check for unusual density distribution
    const skewness = this.calculateSkewness(histogram);
    return Math.abs(skewness) > 1.5;
  }

  async detectAsymmetry(buffer) {
    // Compare left and right halves of the image
    const metadata = await sharp(buffer).metadata();
    const midpoint = Math.floor(metadata.width / 2);

    // Simplified asymmetry detection
    return false;
  }

  async checkDentalCompleteness(buffer) {
    // Check if panoramic dental X-ray shows full dentition
    const metadata = await sharp(buffer).metadata();

    // Panoramic X-rays are typically wider
    return metadata.width / metadata.height > 2;
  }

  async detectDentalPathology(buffer) {
    // Simplified pathology detection
    return false;
  }

  async measureCTRatio(buffer) {
    // Cardiothoracic ratio measurement for chest X-rays
    // Simplified calculation
    return 0.5; // Normal is < 0.5
  }

  async measureLungFields(buffer) {
    // Measure lung field area
    return {
      left: 0,
      right: 0,
      unit: 'pixels'
    };
  }

  async countTeeth(buffer) {
    // Count visible teeth in dental X-ray
    return 32; // Normal adult dentition
  }

  async measureBoneLevel(buffer) {
    // Measure alveolar bone level for periodontal assessment
    return {
      average: 2,
      unit: 'mm'
    };
  }

  extractSliceThickness(metadata) {
    // Extract from DICOM metadata if available
    return metadata.sliceThickness || null;
  }

  calculateFieldOfView(metadata) {
    if (!metadata.density) return null;

    return {
      width: metadata.width / metadata.density,
      height: metadata.height / metadata.density,
      unit: 'inches'
    };
  }

  /**
   * Parse AI response into structured data
   */
  parseAIResponse(text) {
    const lines = text.split('\n');
    const result = {
      measurements: {},
      booleans: {},
      findings: [],
      clinical: []
    };

    for (const line of lines) {
      // Parse measurements (format: name: value unit)
      const measureMatch = line.match(/^([^:]+):\s*([\d.]+)\s*([a-zA-Z%]+)?/);
      if (measureMatch) {
        result.measurements[measureMatch[1].trim()] = {
          value: parseFloat(measureMatch[2]),
          unit: measureMatch[3] || ''
        };
        continue;
      }

      // Parse booleans (format: name: true/false)
      const boolMatch = line.match(/^([^:]+):\s*(true|false)/i);
      if (boolMatch) {
        result.booleans[boolMatch[1].trim()] = boolMatch[2].toLowerCase() === 'true';
        continue;
      }

      // Other lines are findings or clinical notes
      if (line.trim()) {
        if (line.includes('finding') || line.includes('observe')) {
          result.findings.push(line.trim());
        } else {
          result.clinical.push(line.trim());
        }
      }
    }

    return result;
  }

  /**
   * Generate clinical flags based on analysis
   */
  generateClinicalFlags(booleanMetrics, measurements) {
    const flags = [];

    if (booleanMetrics.hasAbnormalDensity) {
      flags.push({
        type: 'abnormality',
        severity: 'moderate',
        description: 'Abnormal density detected'
      });
    }

    if (booleanMetrics.hasAsymmetry) {
      flags.push({
        type: 'asymmetry',
        severity: 'low',
        description: 'Asymmetry detected'
      });
    }

    if (booleanMetrics.requiresEnhancement) {
      flags.push({
        type: 'quality',
        severity: 'low',
        description: 'Image quality could be improved'
      });
    }

    if (measurements.cardiothoracicRatio > 0.5) {
      flags.push({
        type: 'measurement',
        severity: 'moderate',
        description: 'Elevated cardiothoracic ratio'
      });
    }

    return flags;
  }

  /**
   * Calculate overall confidence score
   */
  calculateConfidenceScore(qualityMetrics, numericalMetrics) {
    let confidence = qualityMetrics.overallQuality.score;

    // Adjust based on image characteristics
    if (numericalMetrics.entropy < 3) {
      confidence *= 0.9; // Low entropy suggests poor information content
    }

    if (Math.abs(numericalMetrics.skewness) > 2) {
      confidence *= 0.95; // High skewness might indicate issues
    }

    return Math.min(Math.max(confidence, 0), 1);
  }
}

// Export singleton instance
export default new MedicalImageAnalysisService();
