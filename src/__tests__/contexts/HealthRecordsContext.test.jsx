import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HealthRecordsProvider, useHealthRecords } from '../../contexts/HealthRecordsContext';

// Mock dependencies
jest.mock('../../services/api', () => ({
  default: {
    isBackendAvailable: jest.fn(),
    uploadFile: jest.fn(),
    getRecords: jest.fn(),
    getUploadStatus: jest.fn(),
    deleteRecord: jest.fn(),
    toggleRecordVisibility: jest.fn(),
  }
}));

jest.mock('../../services/emailService', () => ({
  sendHealthRecordsEmail: jest.fn(),
  createMailtoLink: jest.fn(),
  isEmailServiceConfigured: jest.fn()
}));

jest.mock('../../utils/pdfGenerator', () => ({
  generateHealthRecordsPDF: jest.fn(),
  generateTextSummary: jest.fn()
}));

jest.mock('../../utils/fileHelpers', () => ({
  prepareFileAttachments: jest.fn()
}));

import apiService from '../../services/api';
import { sendHealthRecordsEmail, createMailtoLink, isEmailServiceConfigured } from '../../services/emailService';
import { generateHealthRecordsPDF, generateTextSummary } from '../../utils/pdfGenerator';
import { prepareFileAttachments } from '../../utils/fileHelpers';

// Test component to access context
function TestComponent() {
  const {
    records,
    loading,
    uploadProgress,
    processingQueue,
    uploadFile,
    connectProvider,
    deleteRecord,
    toggleRecordVisibility,
    generateSharePackage,
  } = useHealthRecords();

  return (
    <div>
      <div data-testid="loading">{loading.toString()}</div>
      <div data-testid="upload-progress">{uploadProgress}</div>
      <div data-testid="records-count">{records.length}</div>
      <div data-testid="processing-queue">{processingQueue.length}</div>
      <button 
        data-testid="upload-file" 
        onClick={() => uploadFile(new File(['content'], 'test.pdf', { type: 'application/pdf' }))}
      >
        Upload
      </button>
      <button 
        data-testid="generate-share" 
        onClick={() => generateSharePackage('dentist@example.com')}
      >
        Share
      </button>
      {records.map(record => (
        <div key={record.id} data-testid={`record-${record.id}`}>
          <span data-testid="original-name">{record.originalName}</span>
          <span data-testid="display-name">{record.displayName}</span>
          <span data-testid="mime-type">{record.mimeType}</span>
          <span data-testid="file-type">{record.type}</span>
          <span data-testid="status">{record.status}</span>
        </div>
      ))}
    </div>
  );
}

describe('HealthRecordsContext', () => {
  let mockApi, mockEmail, mockPdf, mockFileHelpers;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    localStorage.clear();
    
    // Setup default mock implementations
    mockApi = apiService;
    mockEmail = { sendHealthRecordsEmail, createMailtoLink, isEmailServiceConfigured };
    mockPdf = { generateHealthRecordsPDF, generateTextSummary };
    mockFileHelpers = { prepareFileAttachments };

    // Default API service mock responses
    mockApi.isBackendAvailable.mockResolvedValue(true);
    mockApi.uploadFile.mockResolvedValue({
      success: true,
      file: {
        id: 'test-file-id',
        originalName: 'test.pdf',
        displayName: 'test',
        filename: 'generated-filename.pdf',
        type: 'pdf',
        mimeType: 'application/pdf',
        url: 'http://localhost:3001/uploads/pdfs/generated-filename.pdf',
        size: 12345,
        status: 'processing',
        uploadedAt: new Date().toISOString()
      }
    });
    
    mockApi.getRecords.mockResolvedValue({
      success: true,
      records: []
    });
    
    mockApi.getUploadStatus.mockResolvedValue({
      status: 'completed'
    });

    // Email service mocks
    mockEmail.isEmailServiceConfigured.mockReturnValue(true);
    mockEmail.sendHealthRecordsEmail.mockResolvedValue({
      success: true,
      messageId: 'mock-message-id'
    });

    // PDF generator mocks
    mockPdf.generateHealthRecordsPDF.mockResolvedValue({
      blob: new Blob(['mock pdf content'], { type: 'application/pdf' }),
      base64: 'mock-base64-content',
      fileName: 'health_records.pdf',
      size: 12345
    });
    
    mockPdf.generateTextSummary.mockReturnValue('Mock text summary');

    // File helpers mocks
    mockFileHelpers.prepareFileAttachments.mockResolvedValue([]);
  });

  describe('Backend Integration Mode', () => {
    it('should initialize with backend mode when API is available', async () => {
      render(
        <HealthRecordsProvider>
          <TestComponent />
        </HealthRecordsProvider>
      );

      await waitFor(() => {
        expect(mockApi.isBackendAvailable).toHaveBeenCalled();
        expect(mockApi.getRecords).toHaveBeenCalled();
      });
    });

    it('should upload file with correct field mapping', async () => {
      const user = userEvent.setup();
      
      render(
        <HealthRecordsProvider>
          <TestComponent />
        </HealthRecordsProvider>
      );

      // Wait for initialization
      await waitFor(() => {
        expect(mockApi.isBackendAvailable).toHaveBeenCalled();
      });

      // Trigger file upload
      await user.click(screen.getByTestId('upload-file'));

      await waitFor(() => {
        expect(mockApi.uploadFile).toHaveBeenCalled();
      });

      // Check that record is added with correct field mapping
      await waitFor(() => {
        const recordsCount = screen.getByTestId('records-count');
        expect(recordsCount.textContent).toBe('1');
      });

      // Verify field mapping in the rendered record
      await waitFor(() => {
        expect(screen.getByTestId('original-name')).toHaveTextContent('test.pdf');
        expect(screen.getByTestId('display-name')).toHaveTextContent('test');
        expect(screen.getByTestId('mime-type')).toHaveTextContent('application/pdf');
        expect(screen.getByTestId('file-type')).toHaveTextContent('pdf');
        expect(screen.getByTestId('status')).toHaveTextContent('processing');
      });
    });

    it('should handle upload progress correctly', async () => {
      const user = userEvent.setup();
      
      // Mock upload with progress callback
      mockApi.uploadFile.mockImplementation((file, progressCallback) => {
        // Simulate progress updates
        setTimeout(() => progressCallback(25), 100);
        setTimeout(() => progressCallback(50), 200);
        setTimeout(() => progressCallback(75), 300);
        setTimeout(() => progressCallback(100), 400);
        
        return Promise.resolve({
          success: true,
          file: {
            id: 'progress-test-id',
            originalName: 'progress-test.pdf',
            displayName: 'progress-test',
            filename: 'progress.pdf',
            type: 'pdf',
            mimeType: 'application/pdf',
            url: 'http://localhost:3001/uploads/pdfs/progress.pdf',
            size: 12345,
            status: 'processing'
          }
        });
      });

      render(
        <HealthRecordsProvider>
          <TestComponent />
        </HealthRecordsProvider>
      );

      await waitFor(() => {
        expect(mockApi.isBackendAvailable).toHaveBeenCalled();
      });

      await user.click(screen.getByTestId('upload-file'));

      // Check progress updates
      await waitFor(() => {
        const progress = screen.getByTestId('upload-progress');
        expect(parseInt(progress.textContent)).toBeGreaterThan(0);
      });
    });

    it('should poll for processing status and update record when complete', async () => {
      const user = userEvent.setup();
      
      // Mock status checking
      let statusCallCount = 0;
      mockApi.getUploadStatus.mockImplementation(() => {
        statusCallCount++;
        if (statusCallCount >= 2) {
          return Promise.resolve({ status: 'completed' });
        }
        return Promise.resolve({ status: 'processing' });
      });

      mockApi.getRecords.mockResolvedValueOnce({
        success: true,
        records: []
      }).mockResolvedValueOnce({
        success: true,
        records: [{
          id: 'test-file-id',
          originalName: 'test.pdf',
          displayName: 'test',
          filename: 'generated-filename.pdf',
          type: 'pdf',
          mimeType: 'application/pdf',
          url: 'http://localhost:3001/uploads/pdfs/generated-filename.pdf',
          size: 12345,
          status: 'completed',
          uploadedAt: new Date().toISOString()
        }]
      });

      render(
        <HealthRecordsProvider>
          <TestComponent />
        </HealthRecordsProvider>
      );

      await waitFor(() => {
        expect(mockApi.isBackendAvailable).toHaveBeenCalled();
      });

      await user.click(screen.getByTestId('upload-file'));

      // Wait for status polling to complete
      await waitFor(() => {
        expect(mockApi.getUploadStatus).toHaveBeenCalled();
      }, { timeout: 3000 });

      // Should call getRecords again to refresh data
      await waitFor(() => {
        expect(mockApi.getRecords).toHaveBeenCalledTimes(2);
      }, { timeout: 3000 });
    });
  });

  describe('Local Storage Fallback Mode', () => {
    beforeEach(() => {
      mockApi.isBackendAvailable.mockResolvedValue(false);
    });

    it('should initialize with local storage mode when backend unavailable', async () => {
      render(
        <HealthRecordsProvider>
          <TestComponent />
        </HealthRecordsProvider>
      );

      await waitFor(() => {
        expect(mockApi.isBackendAvailable).toHaveBeenCalled();
        expect(mockApi.getRecords).not.toHaveBeenCalled();
      });
    });

    it('should upload file to local storage with correct field mapping', async () => {
      const user = userEvent.setup();
      
      render(
        <HealthRecordsProvider>
          <TestComponent />
        </HealthRecordsProvider>
      );

      await waitFor(() => {
        expect(mockApi.isBackendAvailable).toHaveBeenCalled();
      });

      await user.click(screen.getByTestId('upload-file'));

      // Wait for local upload to complete
      await waitFor(() => {
        const recordsCount = screen.getByTestId('records-count');
        expect(recordsCount.textContent).toBe('1');
      });

      // Verify local storage field mapping
      await waitFor(() => {
        expect(screen.getByTestId('original-name')).toHaveTextContent('test.pdf');
        expect(screen.getByTestId('display-name')).toHaveTextContent('test');
        expect(screen.getByTestId('mime-type')).toHaveTextContent('application/pdf');
        expect(screen.getByTestId('file-type')).toHaveTextContent('document');
        expect(screen.getByTestId('status')).toHaveTextContent('processing');
      });

      // Check localStorage was updated
      const storedRecords = JSON.parse(localStorage.getItem('healthRecords'));
      expect(storedRecords).toHaveLength(1);
      expect(storedRecords[0]).toMatchObject({
        originalName: 'test.pdf',
        displayName: 'test',
        mimeType: 'application/pdf',
        type: 'document'
      });
    });
  });

  describe('Share Package Generation', () => {
    beforeEach(() => {
      // Set up completed records for sharing
      const mockRecords = [{
        id: 'record-1',
        originalName: 'medical_report.pdf',
        displayName: 'medical_report',
        filename: 'report.pdf',
        type: 'pdf',
        mimeType: 'application/pdf',
        url: 'http://localhost:3001/uploads/pdfs/report.pdf',
        size: 50000,
        status: 'completed',
        hidden: false,
        uploadedAt: new Date().toISOString()
      }];

      mockApi.getRecords.mockResolvedValue({
        success: true,
        records: mockRecords
      });
    });

    it('should generate share package with correct file attachments', async () => {
      const user = userEvent.setup();
      
      // Mock file attachments preparation
      mockFileHelpers.prepareFileAttachments.mockResolvedValue([{
        name: 'medical_report.pdf',
        type: 'application/pdf',
        base64: 'mock-base64-data',
        size: 50000
      }]);

      render(
        <HealthRecordsProvider>
          <TestComponent />
        </HealthRecordsProvider>
      );

      // Wait for records to load
      await waitFor(() => {
        const recordsCount = screen.getByTestId('records-count');
        expect(recordsCount.textContent).toBe('1');
      });

      await user.click(screen.getByTestId('generate-share'));

      await waitFor(() => {
        expect(mockPdf.generateHealthRecordsPDF).toHaveBeenCalledWith({
          patientName: 'Patient',
          patientEmail: 'patient@email.com',
          records: expect.arrayContaining([
            expect.objectContaining({
              originalName: 'medical_report.pdf',
              displayName: 'medical_report'
            })
          ]),
          recipientName: 'Healthcare Provider',
          includeAISummary: true
        });
      });

      await waitFor(() => {
        expect(mockFileHelpers.prepareFileAttachments).toHaveBeenCalledWith([
          expect.objectContaining({
            originalName: 'medical_report.pdf',
            displayName: 'medical_report',
            size: 50000
          })
        ]);
      });

      await waitFor(() => {
        expect(mockEmail.sendHealthRecordsEmail).toHaveBeenCalledWith(
          expect.objectContaining({
            recipientEmail: 'dentist@example.com',
            fileAttachments: expect.arrayContaining([
              expect.objectContaining({
                name: 'medical_report.pdf',
                type: 'application/pdf'
              })
            ])
          })
        );
      });
    });

    it('should use mailto fallback when email service not configured', async () => {
      const user = userEvent.setup();
      
      mockEmail.isEmailServiceConfigured.mockReturnValue(false);
      mockEmail.createMailtoLink.mockReturnValue('mailto:dentist@example.com?subject=Health%20Records');
      
      // Mock window.open
      const mockOpen = jest.fn();
      Object.defineProperty(window, 'open', { value: mockOpen });

      render(
        <HealthRecordsProvider>
          <TestComponent />
        </HealthRecordsProvider>
      );

      await waitFor(() => {
        const recordsCount = screen.getByTestId('records-count');
        expect(recordsCount.textContent).toBe('1');
      });

      await user.click(screen.getByTestId('generate-share'));

      await waitFor(() => {
        expect(mockEmail.createMailtoLink).toHaveBeenCalledWith({
          recipientEmail: 'dentist@example.com',
          patientName: 'Patient',
          recordCount: 1,
          recordsSummary: 'Please find the attached PDF summary of health records.'
        });
      });

      await waitFor(() => {
        expect(mockOpen).toHaveBeenCalledWith('mailto:dentist@example.com?subject=Health%20Records', '_blank');
      });
    });

    it('should filter out hidden records from share package', async () => {
      const user = userEvent.setup();
      
      const mixedRecords = [
        {
          id: 'visible-record',
          originalName: 'visible.pdf',
          displayName: 'visible',
          status: 'completed',
          hidden: false
        },
        {
          id: 'hidden-record',
          originalName: 'hidden.pdf',
          displayName: 'hidden',
          status: 'completed',
          hidden: true
        }
      ];

      mockApi.getRecords.mockResolvedValue({
        success: true,
        records: mixedRecords
      });

      render(
        <HealthRecordsProvider>
          <TestComponent />
        </HealthRecordsProvider>
      );

      await waitFor(() => {
        const recordsCount = screen.getByTestId('records-count');
        expect(recordsCount.textContent).toBe('2');
      });

      await user.click(screen.getByTestId('generate-share'));

      await waitFor(() => {
        expect(mockPdf.generateHealthRecordsPDF).toHaveBeenCalledWith(
          expect.objectContaining({
            records: expect.arrayContaining([
              expect.objectContaining({ id: 'visible-record' })
            ])
          })
        );
      });

      // Verify hidden record is NOT included
      const pdfCall = mockPdf.generateHealthRecordsPDF.mock.calls[0][0];
      expect(pdfCall.records.find(r => r.id === 'hidden-record')).toBeUndefined();
    });

    it('should handle share package errors gracefully', async () => {
      const user = userEvent.setup();
      
      mockPdf.generateHealthRecordsPDF.mockRejectedValue(new Error('PDF generation failed'));

      render(
        <HealthRecordsProvider>
          <TestComponent />
        </HealthRecordsProvider>
      );

      await waitFor(() => {
        const recordsCount = screen.getByTestId('records-count');
        expect(recordsCount.textContent).toBe('1');
      });

      await expect(async () => {
        await user.click(screen.getByTestId('generate-share'));
        
        // Wait for error to be handled
        await waitFor(() => {
          expect(mockPdf.generateHealthRecordsPDF).toHaveBeenCalled();
        });
      }).rejects.toThrow();
    });
  });

  describe('Field Mapping Edge Cases', () => {
    it('should handle files with complex names correctly', async () => {
      const complexFileName = 'Patient_Report.2024.01.15.Final.v2.pdf';
      const mockFile = new File(['content'], complexFileName, { type: 'application/pdf' });

      mockApi.uploadFile.mockResolvedValue({
        success: true,
        file: {
          id: 'complex-file-id',
          originalName: complexFileName,
          displayName: 'Patient_Report.2024.01.15.Final.v2',
          filename: 'generated-complex.pdf',
          type: 'pdf',
          mimeType: 'application/pdf',
          url: 'http://localhost:3001/uploads/pdfs/generated-complex.pdf',
          size: 12345,
          status: 'processing'
        }
      });

      const user = userEvent.setup();
      
      render(
        <HealthRecordsProvider>
          <TestComponent />
        </HealthRecordsProvider>
      );

      await waitFor(() => {
        expect(mockApi.isBackendAvailable).toHaveBeenCalled();
      });

      // Mock uploadFile to use the complex file
      const uploadButton = screen.getByTestId('upload-file');
      uploadButton.onclick = () => {
        const context = React.useContext();
        return context.uploadFile(mockFile);
      };

      await user.click(uploadButton);

      await waitFor(() => {
        expect(screen.getByTestId('original-name')).toHaveTextContent(complexFileName);
        expect(screen.getByTestId('display-name')).toHaveTextContent('Patient_Report.2024.01.15.Final.v2');
      });
    });

    it('should handle files without extensions', async () => {
      mockApi.uploadFile.mockResolvedValue({
        success: true,
        file: {
          id: 'no-ext-id',
          originalName: 'document_without_extension',
          displayName: 'document_without_extension',
          filename: 'generated-no-ext.txt',
          type: 'document',
          mimeType: 'text/plain',
          url: 'http://localhost:3001/uploads/documents/generated-no-ext.txt',
          size: 12345,
          status: 'processing'
        }
      });

      const user = userEvent.setup();
      
      render(
        <HealthRecordsProvider>
          <TestComponent />
        </HealthRecordsProvider>
      );

      await waitFor(() => {
        expect(mockApi.isBackendAvailable).toHaveBeenCalled();
      });

      await user.click(screen.getByTestId('upload-file'));

      await waitFor(() => {
        expect(screen.getByTestId('original-name')).toHaveTextContent('document_without_extension');
        expect(screen.getByTestId('display-name')).toHaveTextContent('document_without_extension');
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle upload failures gracefully', async () => {
      const user = userEvent.setup();
      
      mockApi.uploadFile.mockRejectedValue(new Error('Upload failed'));

      render(
        <HealthRecordsProvider>
          <TestComponent />
        </HealthRecordsProvider>
      );

      await waitFor(() => {
        expect(mockApi.isBackendAvailable).toHaveBeenCalled();
      });

      await expect(async () => {
        await user.click(screen.getByTestId('upload-file'));
      }).rejects.toThrow('Upload failed');

      // Verify loading state is reset
      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });
    });

    it('should handle backend unavailability during operations', async () => {
      const user = userEvent.setup();
      
      // Start with backend available
      mockApi.isBackendAvailable.mockResolvedValue(true);
      
      render(
        <HealthRecordsProvider>
          <TestComponent />
        </HealthRecordsProvider>
      );

      await waitFor(() => {
        expect(mockApi.isBackendAvailable).toHaveBeenCalled();
      });

      // Make upload fail as if backend went down
      mockApi.uploadFile.mockRejectedValue(new Error('Backend unavailable'));

      await expect(async () => {
        await user.click(screen.getByTestId('upload-file'));
      }).rejects.toThrow('Backend unavailable');
    });
  });
});