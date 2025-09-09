/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from 'react';
import { sendHealthRecordsEmail, createMailtoLink, isEmailServiceConfigured } from '../services/emailService';
import { generateHealthRecordsPDF, generateTextSummary } from '../utils/pdfGenerator';
import { prepareFileAttachments } from '../utils/fileHelpers';
import { syncToGoogleCalendar, createCalendarEvent, generateMedicationSchedule } from '../services/calendarIntegration';
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
  const [medications, setMedications] = useState([]);
  const [medicalEvents, setMedicalEvents] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [questionSets, setQuestionSets] = useState([]);
  const [questionTemplates, setQuestionTemplates] = useState([]);

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

    // Load medications and events on mount
    loadMedicationsAndEvents();
  }, []);

  // Sync extracted events to calendar
  const syncEventsToCalendar = async (recordId, extractedEvents) => {
    try {
      console.log('[HealthRecords] Syncing events to calendar for record:', recordId);

      const calendarEvents = [];

      // Convert medical events to calendar events
      if (extractedEvents.events) {
        extractedEvents.events.forEach(event => {
          calendarEvents.push(createCalendarEvent(event));
        });
      }

      // Generate medication reminders
      if (extractedEvents.medications) {
        extractedEvents.medications.forEach(medication => {
          if (medication.action === 'start' && medication.frequency) {
            const startDate = new Date(medication.startDate || new Date());
            const endDate = medication.endDate ? new Date(medication.endDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
            const medicationEvents = generateMedicationSchedule(medication, startDate, endDate);
            calendarEvents.push(...medicationEvents);
          }
        });
      }

      if (calendarEvents.length > 0) {
        const syncResult = await syncToGoogleCalendar(calendarEvents);
        console.log('[HealthRecords] Calendar sync completed:', syncResult);

        // Update record with sync information
        setRecords(prev => {
          const updated = prev.map(record => {
            if (record.id === recordId) {
              return {
                ...record,
                calendarSyncResult: syncResult,
                calendarSyncedAt: new Date().toISOString()
              };
            }
            return record;
          });
          localStorage.setItem('healthRecords', JSON.stringify(updated));
          return updated;
        });

        return syncResult;
      }

    } catch (error) {
      console.error('[HealthRecords] Calendar sync failed:', error);
      throw error;
    }
  };

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

        // Handle voice recordings and document captures differently
        const isVoiceRecord = file.voiceData;
        const isDocumentCapture = file.documentType;

        let displayName = file.name.replace(/\.[^/.]+$/, ''); // Default: remove extension
        let recordType = file.type.includes('pdf') ? 'document' : 'image';

        if (isVoiceRecord) {
          displayName = 'Voice Conversation';
          recordType = 'voice_conversation';
        } else if (isDocumentCapture) {
          displayName = file.documentType.name || 'Captured Document';
          recordType = 'captured_document';
        }

        const newRecord = {
          id: Date.now().toString(),
          originalName: file.name,
          displayName: displayName,
          filename: file.name,
          type: recordType,
          mimeType: file.type,
          uploadedAt: new Date().toISOString(),
          status: 'processing',
          size: file.size,
          extractedData: file.extractedData || null,
          // Voice-specific data
          voiceData: isVoiceRecord ? file.voiceData : null,
          // Document capture specific data
          documentType: isDocumentCapture ? file.documentType : null,
          capturedImage: file.capturedImage || null,
          // Calendar sync data
          syncWithCalendar: file.saveWithSync || false,
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

          // If sync is enabled, sync to calendar
          if (newRecord.syncWithCalendar && isVoiceRecord && file.voiceData.extractedEvents) {
            await syncEventsToCalendar(newRecord.id, file.voiceData.extractedEvents);
          }
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
          // Handle voice conversations differently
          if (record.type === 'voice_conversation' && record.voiceData) {
            return {
              ...record,
              status: 'completed',
              extractedData: {
                patientName: 'User',
                date: new Date().toISOString().split('T')[0],
                provider: 'AI Assistant',
                type: 'Voice Conversation',
                summary: record.voiceData.analysis?.summary || 'Voice conversation recorded',
                keyTopics: record.voiceData.analysis?.keyTopics || [],
                duration: record.voiceData.duration || 0,
                transcription: record.voiceData.transcription || '',
                urgencyLevel: record.voiceData.analysis?.urgencyLevel || 'low',
              },
              aiAnalysis: record.voiceData.analysis || null,
              extractedEvents: record.voiceData.extractedEvents || null,
              syncWithCalendar: record.syncWithCalendar || false,
            };
          } else if (record.type === 'captured_document' && record.extractedData) {
            // Handle captured documents with extracted data
            const extractedFields = record.extractedData;
            const summary = extractedFields.map(f => `${f.label}: ${f.value}`).join(', ');

            return {
              ...record,
              status: 'completed',
              extractedData: {
                patientName: 'User',
                date: new Date().toISOString().split('T')[0],
                provider: extractedFields.find(f => f.label === 'Provider')?.value || 'Healthcare Provider',
                type: record.documentType?.name || 'Medical Document',
                summary: summary.substring(0, 200) + (summary.length > 200 ? '...' : ''),
                fields: extractedFields,
                documentType: record.documentType,
              },
              syncWithCalendar: record.syncWithCalendar || false,
            };
          } else {
            // Default processing for files
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
    console.log('[HealthRecords] Backend mode:', useBackend ? 'ENABLED' : 'DISABLED');

    // Set analysis in progress
    setAnalysisInProgress(prev => ({ ...prev, [recordId]: true }));

    try {
      if (useBackend) {
        console.log('[HealthRecords] Calling backend API service...');
        console.log('[HealthRecords] API endpoint:', `/api/analyze/${recordId}`);

        // Call backend AI analysis service
        const response = await apiService.analyzeRecord(recordId);
        console.log('[HealthRecords] Raw backend response:', response);

        if (response.success) {
          console.log('[HealthRecords] Backend returned success, updating record...');
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
        } else {
          console.log('[HealthRecords] Backend returned failure:', response);
        }
      } else {
        console.log('[HealthRecords] Using local simulation mode for AI analysis');
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

  const generateSharePackage = async (doctorEmail, options = {}) => {
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
          recipientEmail: doctorEmail,
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
          recipientEmail: doctorEmail,
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
        recipientEmail: doctorEmail,
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

  // Medication management functions
  const addMedication = (medication) => {
    const newMedication = {
      ...medication,
      id: medication.id || Date.now().toString(),
      addedAt: new Date().toISOString()
    };

    setMedications(prev => {
      const updated = [...prev, newMedication];
      localStorage.setItem('medications', JSON.stringify(updated));
      return updated;
    });

    return newMedication;
  };

  const updateMedication = (medicationId, updates) => {
    setMedications(prev => {
      const updated = prev.map(med =>
        med.id === medicationId ? { ...med, ...updates, updatedAt: new Date().toISOString() } : med
      );
      localStorage.setItem('medications', JSON.stringify(updated));
      return updated;
    });
  };

  const removeMedication = (medicationId) => {
    setMedications(prev => {
      const updated = prev.filter(med => med.id !== medicationId);
      localStorage.setItem('medications', JSON.stringify(updated));
      return updated;
    });
  };

  const getActiveMedications = () => {
    return medications.filter(med =>
      med.action !== 'stop' &&
      (!med.endDate || new Date(med.endDate) > new Date())
    );
  };

  // Medical events management
  const addMedicalEvent = (event) => {
    const newEvent = {
      ...event,
      id: event.id || Date.now().toString(),
      addedAt: new Date().toISOString()
    };

    setMedicalEvents(prev => {
      const updated = [...prev, newEvent];
      localStorage.setItem('medicalEvents', JSON.stringify(updated));
      return updated;
    });

    return newEvent;
  };

  const updateMedicalEvent = (eventId, updates) => {
    setMedicalEvents(prev => {
      const updated = prev.map(event =>
        event.id === eventId ? { ...event, ...updates, updatedAt: new Date().toISOString() } : event
      );
      localStorage.setItem('medicalEvents', JSON.stringify(updated));
      return updated;
    });
  };

  const removeMedicalEvent = (eventId) => {
    setMedicalEvents(prev => {
      const updated = prev.filter(event => event.id !== eventId);
      localStorage.setItem('medicalEvents', JSON.stringify(updated));
      return updated;
    });
  };

  const getUpcomingEvents = (days = 30) => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() + days);

    return medicalEvents.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate >= new Date() && eventDate <= cutoffDate;
    }).sort((a, b) => new Date(a.date) - new Date(b.date));
  };

  // Load medications and events from localStorage
  const loadMedicationsAndEvents = () => {
    try {
      const storedMedications = localStorage.getItem('medications');
      if (storedMedications) {
        setMedications(JSON.parse(storedMedications));
      } else {
        // Initialize with dummy medication data
        const dummyMedications = [
          {
            id: '1',
            name: 'Lisinopril',
            dosage: '10mg',
            frequency: 'Once daily',
            times: ['08:00'],
            pillType: 'tablet',
            color: '#ffffff',
            shape: 'round',
            status: 'active',
            prescribedBy: 'Dr. Smith',
            startDate: '2024-01-01',
            nextDose: new Date(new Date().setHours(8, 0, 0, 0)).toISOString(),
            instructions: 'Take with water, preferably in the morning'
          },
          {
            id: '2',
            name: 'Metformin',
            dosage: '500mg',
            frequency: 'Twice daily',
            times: ['08:00', '20:00'],
            pillType: 'tablet',
            color: '#ffffff',
            shape: 'oval',
            status: 'active',
            prescribedBy: 'Dr. Johnson',
            startDate: '2024-01-15',
            nextDose: new Date(new Date().setHours(8, 0, 0, 0)).toISOString(),
            instructions: 'Take with food to reduce stomach upset'
          },
          {
            id: '3',
            name: 'Atorvastatin',
            dosage: '20mg',
            frequency: 'Once daily',
            times: ['22:00'],
            pillType: 'capsule',
            color: '#ffffff',
            shape: 'capsule',
            status: 'active',
            prescribedBy: 'Dr. Wilson',
            startDate: '2024-02-01',
            nextDose: new Date(new Date().setHours(22, 0, 0, 0)).toISOString(),
            instructions: 'Take at bedtime'
          },
          {
            id: '4',
            name: 'Vitamin D3',
            dosage: '1000IU',
            frequency: 'Once daily',
            times: ['08:00'],
            pillType: 'capsule',
            color: '#ffd700',
            shape: 'capsule',
            status: 'active',
            prescribedBy: 'Dr. Smith',
            startDate: '2024-02-15',
            nextDose: new Date(new Date().setHours(8, 0, 0, 0)).toISOString(),
            instructions: 'Take with fatty food for better absorption'
          },
          {
            id: '5',
            name: 'Aspirin',
            dosage: '81mg',
            frequency: 'Once daily',
            times: ['08:00'],
            pillType: 'tablet',
            color: '#ffffff',
            shape: 'round',
            status: 'active',
            prescribedBy: 'Dr. Johnson',
            startDate: '2024-01-01',
            nextDose: new Date(new Date().setHours(8, 0, 0, 0)).toISOString(),
            instructions: 'Low-dose aspirin for heart health'
          },
          {
            id: '6',
            name: 'Prednisone',
            dosage: '20mg',
            frequency: 'Once daily',
            times: ['08:00'],
            pillType: 'tablet',
            color: '#ffffff',
            shape: 'round',
            status: 'completed',
            prescribedBy: 'Dr. Wilson',
            startDate: '2024-01-01',
            endDate: '2024-02-01',
            instructions: 'Completed 30-day course for inflammation'
          }
        ];
        setMedications(dummyMedications);
        localStorage.setItem('medications', JSON.stringify(dummyMedications));
      }

      const storedEvents = localStorage.getItem('medicalEvents');
      if (storedEvents) {
        setMedicalEvents(JSON.parse(storedEvents));
      }

      const storedReminders = localStorage.getItem('reminders');
      if (storedReminders) {
        setReminders(JSON.parse(storedReminders));
      }

      // Load question sets and templates
      const storedQuestionSets = localStorage.getItem('questionSets');
      if (storedQuestionSets) {
        setQuestionSets(JSON.parse(storedQuestionSets));
      }

      const storedQuestionTemplates = localStorage.getItem('questionTemplates');
      if (storedQuestionTemplates) {
        setQuestionTemplates(JSON.parse(storedQuestionTemplates));
      }
    } catch (error) {
      console.error('[HealthRecords] Error loading medications and events:', error);
    }
  };

  // Questions management
  const saveQuestionSet = async (questionSet) => {
    try {
      const newQuestionSet = {
        id: `qs-${Date.now()}`,
        ...questionSet,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const updatedSets = [...questionSets, newQuestionSet];
      setQuestionSets(updatedSets);
      localStorage.setItem('questionSets', JSON.stringify(updatedSets));

      console.log('[HealthRecords] Question set saved:', newQuestionSet.id);
      return { success: true, questionSet: newQuestionSet };
    } catch (error) {
      console.error('[HealthRecords] Error saving question set:', error);
      return { success: false, error: error.message };
    }
  };

  const getQuestionSets = () => {
    return questionSets.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  };

  const deleteQuestionSet = async (questionSetId) => {
    try {
      const updatedSets = questionSets.filter(qs => qs.id !== questionSetId);
      setQuestionSets(updatedSets);
      localStorage.setItem('questionSets', JSON.stringify(updatedSets));

      console.log('[HealthRecords] Question set deleted:', questionSetId);
      return { success: true };
    } catch (error) {
      console.error('[HealthRecords] Error deleting question set:', error);
      return { success: false, error: error.message };
    }
  };

  const saveQuestionTemplate = async (template) => {
    try {
      const newTemplate = {
        id: `qt-${Date.now()}`,
        ...template,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const updatedTemplates = [...questionTemplates, newTemplate];
      setQuestionTemplates(updatedTemplates);
      localStorage.setItem('questionTemplates', JSON.stringify(updatedTemplates));

      console.log('[HealthRecords] Question template saved:', newTemplate.id);
      return { success: true, template: newTemplate };
    } catch (error) {
      console.error('[HealthRecords] Error saving question template:', error);
      return { success: false, error: error.message };
    }
  };

  const getQuestionTemplates = () => {
    return questionTemplates.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  };

  const shareQuestions = async (questions, recipientEmail, options = {}) => {
    try {
      // Simulate sharing questions via email
      const shareRecord = {
        id: `share-${Date.now()}`,
        type: 'questions',
        recipientEmail,
        questions: questions.map(q => ({
          id: q.id,
          text: q.text,
          category: q.category,
          isImportant: q.isImportant
        })),
        appointmentContext: options.appointmentContext || {},
        customMessage: options.customMessage || '',
        format: options.format || 'professional',
        sharedAt: new Date().toISOString(),
        sharedBy: options.sharedBy || 'user'
      };

      // Add to share history (reusing existing share tracking)
      const existingShares = JSON.parse(localStorage.getItem('shareHistory') || '[]');
      const updatedShares = [...existingShares, shareRecord];
      localStorage.setItem('shareHistory', JSON.stringify(updatedShares));

      console.log('[HealthRecords] Questions shared:', shareRecord.id);
      return { success: true, shareId: shareRecord.id };
    } catch (error) {
      console.error('[HealthRecords] Error sharing questions:', error);
      return { success: false, error: error.message };
    }
  };

  const getNextAppointment = () => {
    // Mock implementation - in a real app, this would check calendar integration
    const mockAppointments = [
      {
        date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
        provider: 'Dr. Smith',
        type: 'primary-care'
      }
    ];

    return mockAppointments[0] || null;
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
    // Medication management
    medications,
    addMedication,
    updateMedication,
    removeMedication,
    getActiveMedications,
    // Medical events management
    medicalEvents,
    addMedicalEvent,
    updateMedicalEvent,
    removeMedicalEvent,
    getUpcomingEvents,
    // Reminders
    reminders,
    setReminders,
    // Calendar sync
    syncEventsToCalendar,
    // Questions management
    questionSets,
    questionTemplates,
    saveQuestionSet,
    getQuestionSets,
    deleteQuestionSet,
    saveQuestionTemplate,
    getQuestionTemplates,
    shareQuestions,
    getNextAppointment,
  };

  return (
    <HealthRecordsContext.Provider value={value}>
      {children}
    </HealthRecordsContext.Provider>
  );
}
