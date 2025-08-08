/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from 'react';
import { sendHealthRecordsEmail, createMailtoLink, isEmailServiceConfigured } from '../services/emailService';
import { generateHealthRecordsPDF, generateTextSummary } from '../utils/pdfGenerator';
import { prepareFileAttachments } from '../utils/fileHelpers';
import apiService from '../services/api';

const HealthRecordsContext = createContext();

export const useHealthRecords = () => {
  const context = useContext(HealthRecordsContext);
  if (!context) {
    throw new Error('useHealthRecords must be used within HealthRecordsProvider');
  }
  return context;
};

export function HealthRecordsProvider({ children }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processingQueue, setProcessingQueue] = useState([]);
  const [useBackend, setUseBackend] = useState(false);
  const [analysisInProgress, setAnalysisInProgress] = useState({});

  useEffect(() => {
    // Check if backend is available
    apiService.isBackendAvailable().then(available => {
      setUseBackend(available);
      if (available) {
        console.log('[HealthRecords] Backend API available, using server storage');
        loadRecordsFromBackend();
      } else {
        console.log('[HealthRecords] Backend API not available, using local storage');
        // Load cached records from localStorage
        const cached = localStorage.getItem('healthRecords');
        if (cached) {
          setRecords(JSON.parse(cached));
        }
      }
    });
  }, []);

  const loadRecordsFromBackend = async () => {
    try {
      const response = await apiService.getRecords();
      if (response.success) {
        setRecords(response.records);
      }
    } catch (error) {
      console.error('[HealthRecords] Failed to load records from backend:', error);
    }
  };

  const uploadFile = async (file) => {
    setLoading(true);
    setUploadProgress(0);

    try {
      if (useBackend) {
        // Upload to backend server
        const response = await apiService.uploadFile(file, (progress) => {
          setUploadProgress(progress);
        });

        if (response.success) {
          const newRecord = {
            id: response.file.id,
            originalName: response.file.originalName,
            displayName: response.file.displayName,
            filename: response.file.filename,
            type: response.file.type,
            url: response.file.url,
            uploadedAt: response.file.uploadedAt || new Date().toISOString(),
            processedAt: response.file.processedAt,
            status: response.file.status,
            size: response.file.size,
            mimeType: response.file.mimeType,
            extractedData: null,
          };

          setRecords(prev => [...prev, newRecord]);
          setProcessingQueue(prev => [...prev, newRecord.id]);

          // Check processing status periodically
          const checkStatus = setInterval(async () => {
            try {
              const statusResponse = await apiService.getUploadStatus(newRecord.id);
              if (statusResponse.status === 'completed') {
                clearInterval(checkStatus);
                await loadRecordsFromBackend();
                setProcessingQueue(prev => prev.filter(id => id !== newRecord.id));
                
                // Automatically trigger AI analysis after upload completes
                await analyzeRecord(newRecord.id);
              }
            } catch (error) {
              console.error('[HealthRecords] Error checking status:', error);
              clearInterval(checkStatus);
            }
          }, 2000);

          setLoading(false);
          return newRecord;
        }
      } else {
        // Local storage fallback
        const interval = setInterval(() => {
          setUploadProgress(prev => {
            if (prev >= 90) {
              clearInterval(interval);
              return 90;
            }
            return prev + 10;
          });
        }, 200);

        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const newRecord = {
          id: Date.now().toString(),
          originalName: file.name,
          displayName: file.name.replace(/\.[^/.]+$/, ''), // Remove extension
          filename: file.name,
          type: file.type.includes('pdf') ? 'document' : 'image',
          mimeType: file.type,
          uploadedAt: new Date().toISOString(),
          status: 'processing',
          size: file.size,
          extractedData: null,
        };

        setProcessingQueue(prev => [...prev, newRecord.id]);
        setRecords(prev => {
          const updated = [...prev, newRecord];
          localStorage.setItem('healthRecords', JSON.stringify(updated));
          return updated;
        });

        clearInterval(interval);
        setUploadProgress(100);

        setTimeout(async () => {
          processRecord(newRecord.id);
          // Automatically trigger AI analysis for local uploads
          await analyzeRecord(newRecord.id);
        }, 3000);

        setLoading(false);
        return newRecord;
      }
    } catch (error) {
      console.error('[HealthRecords] Upload failed:', error);
      setLoading(false);
      setUploadProgress(0);
      throw error;
    }
  };

  const processRecord = (recordId) => {
    setRecords(prev => {
      const updated = prev.map(record => {
        if (record.id === recordId) {
          return {
            ...record,
            status: 'completed',
            extractedData: {
              patientName: 'John Doe',
              date: '2024-01-15',
              provider: 'City Medical Center',
              type: 'Lab Results',
              summary: 'Routine blood work - all values within normal range',
            },
          };
        }
        return record;
      });
      localStorage.setItem('healthRecords', JSON.stringify(updated));
      return updated;
    });

    setProcessingQueue(prev => prev.filter(id => id !== recordId));
  };

  const connectProvider = async (providerEmail) => {
    setLoading(true);
    
    // Simulate Direct message send
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const newRecord = {
      id: Date.now().toString(),
      originalName: `Records from ${providerEmail}`,
      displayName: `Records from ${providerEmail}`,
      filename: `ccda_${Date.now()}.xml`,
      type: 'ccda',
      mimeType: 'application/xml',
      uploadedAt: new Date().toISOString(),
      status: 'pending',
      providerEmail,
    };

    setRecords(prev => {
      const updated = [...prev, newRecord];
      localStorage.setItem('healthRecords', JSON.stringify(updated));
      return updated;
    });

    setLoading(false);
    return newRecord;
  };

  const deleteRecord = async (recordId) => {
    try {
      if (useBackend) {
        // Delete from backend
        await apiService.deleteRecord(recordId, true);
        await loadRecordsFromBackend();
      } else {
        // Delete from local storage
        setRecords(prev => {
          const updated = prev.filter(r => r.id !== recordId);
          localStorage.setItem('healthRecords', JSON.stringify(updated));
          return updated;
        });
      }
    } catch (error) {
      console.error('[HealthRecords] Delete failed:', error);
      throw error;
    }
  };

  const analyzeRecord = async (recordId) => {
    console.log('[HealthRecords] Starting AI analysis for record:', recordId);
    
    // Set analysis in progress
    setAnalysisInProgress(prev => ({ ...prev, [recordId]: true }));
    
    try {
      if (useBackend) {
        // Call backend AI analysis service
        const response = await apiService.analyzeRecord(recordId);
        
        if (response.success) {
          // Update record with analysis results
          setRecords(prev => prev.map(record => {
            if (record.id === recordId) {
              return {
                ...record,
                aiAnalysis: response.analysis,
                analyzedAt: new Date().toISOString()
              };
            }
            return record;
          }));
          
          console.log('[HealthRecords] AI analysis completed:', response.analysis);
          return response.analysis;
        }
      } else {
        // Simulate AI analysis for local mode
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const mockAnalysis = {
          summary: 'This document contains important health information including lab results and clinical notes.',
          keyFindings: [
            'Blood pressure within normal range',
            'Cholesterol levels slightly elevated',
            'No abnormalities detected in imaging'
          ],
          recommendations: [
            'Continue current medication regimen',
            'Schedule follow-up in 3 months',
            'Consider dietary changes for cholesterol management'
          ],
          extractedData: {
            patientInfo: {
              name: 'John Doe',
              dob: '1980-01-15',
              mrn: 'MRN-123456'
            },
            visitDate: '2024-01-15',
            provider: 'Dr. Smith',
            facility: 'City Medical Center'
          },
          confidence: 0.92,
          processingTime: 2.3
        };
        
        setRecords(prev => {
          const updated = prev.map(record => {
            if (record.id === recordId) {
              return {
                ...record,
                aiAnalysis: mockAnalysis,
                analyzedAt: new Date().toISOString()
              };
            }
            return record;
          });
          localStorage.setItem('healthRecords', JSON.stringify(updated));
          return updated;
        });
        
        return mockAnalysis;
      }
    } catch (error) {
      console.error('[HealthRecords] AI analysis failed:', error);
      throw error;
    } finally {
      // Clear analysis in progress
      setAnalysisInProgress(prev => {
        const updated = { ...prev };
        delete updated[recordId];
        return updated;
      });
    }
  };

  const toggleRecordVisibility = async (recordId) => {
    try {
      if (useBackend) {
        // Find current state
        const record = records.find(r => r.id === recordId);
        if (record) {
          await apiService.toggleRecordVisibility(recordId, !record.hidden);
          await loadRecordsFromBackend();
        }
      } else {
        // Update local storage
        setRecords(prev => {
          const updated = prev.map(record => {
            if (record.id === recordId) {
              return { ...record, hidden: !record.hidden };
            }
            return record;
          });
          localStorage.setItem('healthRecords', JSON.stringify(updated));
          return updated;
        });
      }
    } catch (error) {
      console.error('[HealthRecords] Toggle visibility failed:', error);
      throw error;
    }
  };

  const generateSharePackage = async (dentistEmail, options = {}) => {
    setLoading(true);
    
    try {
      // Filter visible records or specific record if provided
      const visibleRecords = options.recordId 
        ? records.filter(r => r.id === options.recordId && !r.hidden)
        : records.filter(r => !r.hidden && r.status === 'completed');
      
      if (visibleRecords.length === 0) {
        throw new Error('No records available to share');
      }
      
      // Get patient info from localStorage
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const patientName = options.patientName || user.name || 'Patient';
      const patientEmail = options.patientEmail || user.email || 'patient@email.com';
      
      // Generate date range
      const dates = visibleRecords
        .map(r => r.uploadedAt ? new Date(r.uploadedAt) : null)
        .filter(d => d);
      const earliestDate = dates.length ? new Date(Math.min(...dates)) : null;
      const latestDate = dates.length ? new Date(Math.max(...dates)) : null;
      const dateRange = earliestDate && latestDate 
        ? `${earliestDate.toLocaleDateString()} - ${latestDate.toLocaleDateString()}`
        : 'All available dates';
      
      // Generate PDF summary
      console.log('[HealthRecords] Generating PDF summary...');
      const pdfResult = await generateHealthRecordsPDF({
        patientName,
        patientEmail,
        records: visibleRecords,
        recipientName: options.recipientName || 'Healthcare Provider',
        includeAISummary: true
      });
      
      // Generate text summary for email body
      const textSummary = generateTextSummary({
        patientName,
        patientEmail,
        records: visibleRecords
      });
      
      // Prepare file attachments if backend is available
      let fileAttachments = [];
      if (useBackend) {
        console.log('[HealthRecords] Preparing file attachments from backend...');
        try {
          // Only include smaller files that can be attached to email
          const smallRecords = visibleRecords.filter(r => 
            r.size && r.size < 500 * 1024 // Less than 500KB
          );
          fileAttachments = await prepareFileAttachments(smallRecords);
          console.log(`[HealthRecords] Prepared ${fileAttachments.length} file attachments`);
        } catch (error) {
          console.error('[HealthRecords] Failed to prepare attachments:', error);
        }
      }
      
      // Check if EmailJS is configured
      const emailServiceReady = isEmailServiceConfigured();
      
      let emailResult;
      
      if (emailServiceReady) {
        // Send via EmailJS
        console.log('[HealthRecords] Sending email via EmailJS...');
        emailResult = await sendHealthRecordsEmail({
          recipientEmail: dentistEmail,
          recipientName: options.recipientName || 'Healthcare Provider',
          patientName,
          patientEmail,
          recordsSummary: textSummary,
          pdfAttachment: pdfResult.base64,
          fileAttachments, // Include actual file attachments
          recordCount: visibleRecords.length,
          dateRange,
          shareLink: null, // Could add cloud storage link here
          expirationDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()
        });
      } else {
        // Fallback to mailto link
        console.log('[HealthRecords] EmailJS not configured, using mailto fallback...');
        
        // Create downloadable PDF
        const pdfUrl = URL.createObjectURL(pdfResult.blob);
        const downloadLink = document.createElement('a');
        downloadLink.href = pdfUrl;
        downloadLink.download = pdfResult.fileName;
        downloadLink.click();
        URL.revokeObjectURL(pdfUrl);
        
        // Open mailto link
        const mailtoLink = createMailtoLink({
          recipientEmail: dentistEmail,
          patientName,
          recordCount: visibleRecords.length,
          recordsSummary: 'Please find the attached PDF summary of health records.'
        });
        
        window.open(mailtoLink, '_blank');
        
        emailResult = {
          success: true,
          fallback: true,
          message: 'PDF downloaded. Please attach it to the email that opened.'
        };
      }
      
      // Create share package record
      const sharePackage = {
        id: Date.now().toString(),
        recipientEmail: dentistEmail,
        recordCount: visibleRecords.length,
        recordIds: visibleRecords.map(r => r.id),
        sharedAt: new Date().toISOString(),
        status: emailResult.success ? 'sent' : 'failed',
        method: emailResult.fallback ? 'mailto' : 'emailjs',
        pdfSize: pdfResult.size,
        emailMessageId: emailResult.messageId || null,
        error: emailResult.error || null,
        recipientName: options.recipientName || 'Healthcare Provider'
      };

      // Store share history
      const shareHistory = JSON.parse(localStorage.getItem('shareHistory') || '[]');
      shareHistory.push(sharePackage);
      localStorage.setItem('shareHistory', JSON.stringify(shareHistory));

      setLoading(false);
      
      if (!emailResult.success && !emailResult.fallback) {
        throw new Error(emailResult.error || 'Failed to send email');
      }
      
      return sharePackage;
    } catch (error) {
      console.error('[HealthRecords] Error generating share package:', error);
      setLoading(false);
      throw error;
    }
  };

  const getShareHistory = () => {
    return JSON.parse(localStorage.getItem('shareHistory') || '[]');
  };

  const getShareCountForRecord = (recordId) => {
    const shareHistory = getShareHistory();
    return shareHistory.filter(share => 
      share.recordIds?.includes(recordId) ||
      (share.sharedAt && new Date(share.sharedAt) > new Date(records.find(r => r.id === recordId)?.uploadedAt || 0))
    ).length;
  };

  const value = {
    records,
    loading,
    uploadProgress,
    processingQueue,
    analysisInProgress,
    uploadFile,
    connectProvider,
    deleteRecord,
    toggleRecordVisibility,
    analyzeRecord,
    generateSharePackage,
    getShareHistory,
    getShareCountForRecord,
  };

  return (
    <HealthRecordsContext.Provider value={value}>
      {children}
    </HealthRecordsContext.Provider>
  );
}