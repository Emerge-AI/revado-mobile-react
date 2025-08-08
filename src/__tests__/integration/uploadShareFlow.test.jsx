import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HealthRecordsProvider, useHealthRecords } from '../../contexts/HealthRecordsContext';

// Integration test that verifies the complete upload → store → retrieve → share flow
describe('Upload to Share Integration Flow', () => {
  let mockFetch, mockEmailSend, mockPdfGenerate, mockFileAttachments;

  // Test component that simulates the complete user journey
  function IntegrationTestApp() {
    const {
      records,
      loading,
      uploadProgress,
      uploadFile,
      generateSharePackage,
    } = useHealthRecords();

    const [shareResult, setShareResult] = React.useState(null);
    const [uploadResult, setUploadResult] = React.useState(null);

    const handleUpload = async () => {
      try {
        const file = new File(['medical report content'], 'Medical_Report_2024.pdf', { 
          type: 'application/pdf' 
        });
        const result = await uploadFile(file);
        setUploadResult(result);
      } catch (error) {
        setUploadResult({ error: error.message });
      }
    };

    const handleShare = async () => {
      try {
        const result = await generateSharePackage('dentist@example.com', {
          patientName: 'John Doe',
          patientEmail: 'john.doe@email.com',
          recipientName: 'Dr. Smith'
        });
        setShareResult(result);
      } catch (error) {
        setShareResult({ error: error.message });
      }
    };

    return (
      <div data-testid="app">
        <div data-testid="loading">{loading.toString()}</div>
        <div data-testid="upload-progress">{uploadProgress}</div>
        <div data-testid="records-count">{records.length}</div>
        
        <button data-testid="upload-btn" onClick={handleUpload}>
          Upload File
        </button>
        
        <button data-testid="share-btn" onClick={handleShare}>
          Generate Share Package
        </button>

        {uploadResult && (
          <div data-testid="upload-result">
            {uploadResult.error ? (
              <span data-testid="upload-error">{uploadResult.error}</span>
            ) : (
              <div>
                <span data-testid="upload-id">{uploadResult.id}</span>
                <span data-testid="upload-original-name">{uploadResult.originalName}</span>
                <span data-testid="upload-display-name">{uploadResult.displayName}</span>
                <span data-testid="upload-type">{uploadResult.type}</span>
                <span data-testid="upload-mime-type">{uploadResult.mimeType}</span>
              </div>
            )}
          </div>
        )}

        {shareResult && (
          <div data-testid="share-result">
            {shareResult.error ? (
              <span data-testid="share-error">{shareResult.error}</span>
            ) : (
              <div>
                <span data-testid="share-id">{shareResult.id}</span>
                <span data-testid="share-recipient">{shareResult.recipientEmail}</span>
                <span data-testid="share-status">{shareResult.status}</span>
                <span data-testid="share-method">{shareResult.method}</span>
                <span data-testid="share-record-count">{shareResult.recordCount}</span>
              </div>
            )}
          </div>
        )}

        <div data-testid="records-list">
          {records.map(record => (
            <div key={record.id} data-testid={`record-${record.id}`}>
              <span data-testid="record-original-name">{record.originalName}</span>
              <span data-testid="record-display-name">{record.displayName}</span>
              <span data-testid="record-status">{record.status}</span>
              <span data-testid="record-type">{record.type}</span>
              <span data-testid="record-mime-type">{record.mimeType}</span>
              <span data-testid="record-hidden">{record.hidden?.toString()}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  beforeEach(() => {
    // Reset all mocks and localStorage
    jest.clearAllMocks();
    localStorage.clear();

    // Mock fetch for API calls
    mockFetch = jest.fn();
    global.fetch = mockFetch;

    // Mock the modules that are imported by HealthRecordsContext
    mockEmailSend = jest.fn();
    mockPdfGenerate = jest.fn();
    mockFileAttachments = jest.fn();

    jest.doMock('../../services/emailService', () => ({
      sendHealthRecordsEmail: mockEmailSend,
      createMailtoLink: jest.fn(() => 'mailto:dentist@example.com'),
      isEmailServiceConfigured: jest.fn(() => true)
    }));

    jest.doMock('../../utils/pdfGenerator', () => ({
      generateHealthRecordsPDF: mockPdfGenerate,
      generateTextSummary: jest.fn(() => 'Mock summary text')
    }));

    jest.doMock('../../utils/fileHelpers', () => ({
      prepareFileAttachments: mockFileAttachments
    }));

    // Setup default successful responses
    setupSuccessfulMocks();
  });

  function setupSuccessfulMocks() {
    // Backend availability check
    mockFetch
      .mockImplementationOnce(() => Promise.resolve({ ok: true, json: () => Promise.resolve({ status: 'ok' }) }))
      // Get records (initially empty)
      .mockImplementationOnce(() => Promise.resolve({ 
        ok: true, 
        json: () => Promise.resolve({ success: true, records: [] }) 
      }))
      // File upload
      .mockImplementationOnce(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          file: {
            id: 'test-file-123',
            originalName: 'Medical_Report_2024.pdf',
            displayName: 'Medical_Report_2024',
            filename: 'generated-filename.pdf',
            type: 'pdf',
            mimeType: 'application/pdf',
            url: 'http://localhost:3001/uploads/pdfs/generated-filename.pdf',
            size: 75000,
            status: 'processing',
            uploadedAt: new Date().toISOString()
          }
        })
      }))
      // Upload status check
      .mockImplementationOnce(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ status: 'completed' })
      }))
      // Get updated records after processing
      .mockImplementationOnce(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          records: [{
            id: 'test-file-123',
            originalName: 'Medical_Report_2024.pdf',
            displayName: 'Medical_Report_2024',
            filename: 'generated-filename.pdf',
            type: 'pdf',
            mimeType: 'application/pdf',
            url: 'http://localhost:3001/uploads/pdfs/generated-filename.pdf',
            size: 75000,
            status: 'completed',
            hidden: false,
            uploadedAt: new Date().toISOString(),
            processedAt: new Date().toISOString(),
            extractedData: {
              patientName: 'John Doe',
              date: '2024-01-15',
              provider: 'Medical Center',
              type: 'Medical Report',
              summary: 'Comprehensive medical evaluation results'
            }
          }]
        })
      }))
      // Fetch file for attachment
      .mockImplementation(() => Promise.resolve({
        blob: () => Promise.resolve(new Blob(['pdf content'], { type: 'application/pdf' }))
      }));

    // PDF generator mock
    mockPdfGenerate.mockResolvedValue({
      blob: new Blob(['mock pdf'], { type: 'application/pdf' }),
      base64: 'bW9ja1BkZkNvbnRlbnQ=',
      fileName: 'health_records_John_Doe_123456789.pdf',
      size: 12345,
      pageCount: 2
    });

    // File attachments mock
    mockFileAttachments.mockResolvedValue([{
      name: 'Medical_Report_2024.pdf',
      type: 'application/pdf',
      base64: 'cGRmQmFzZTY0Q29udGVudA==',
      size: 75000
    }]);

    // Email service mock
    mockEmailSend.mockResolvedValue({
      success: true,
      messageId: 'email-123'
    });

    // FileReader mock for base64 conversion
    global.FileReader = class FileReader {
      readAsDataURL() {
        setTimeout(() => {
          this.onloadend();
        }, 0);
      }
      get result() {
        return 'data:application/pdf;base64,bW9ja1BkZkNvbnRlbnQ=';
      }
    };
  }

  describe('Complete Upload to Share Flow', () => {
    it('should successfully complete the entire upload → process → share flow', async () => {
      const user = userEvent.setup();
      
      render(
        <HealthRecordsProvider>
          <IntegrationTestApp />
        </HealthRecordsProvider>
      );

      // Initial state - no records
      expect(screen.getByTestId('records-count')).toHaveTextContent('0');
      expect(screen.getByTestId('loading')).toHaveTextContent('false');

      // Step 1: Upload file
      await act(async () => {
        await user.click(screen.getByTestId('upload-btn'));
      });

      // Verify upload initiates
      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('true');
      });

      // Wait for upload to complete
      await waitFor(() => {
        expect(screen.getByTestId('upload-result')).toBeInTheDocument();
      }, { timeout: 5000 });

      // Verify upload result with correct field mapping
      await waitFor(() => {
        expect(screen.getByTestId('upload-id')).toHaveTextContent('test-file-123');
        expect(screen.getByTestId('upload-original-name')).toHaveTextContent('Medical_Report_2024.pdf');
        expect(screen.getByTestId('upload-display-name')).toHaveTextContent('Medical_Report_2024');
        expect(screen.getByTestId('upload-type')).toHaveTextContent('pdf');
        expect(screen.getByTestId('upload-mime-type')).toHaveTextContent('application/pdf');
      });

      // Verify record appears in records list
      await waitFor(() => {
        expect(screen.getByTestId('records-count')).toHaveTextContent('1');
      });

      // Step 2: Wait for processing to complete
      await waitFor(() => {
        const recordStatus = screen.getByTestId('record-status');
        expect(recordStatus).toHaveTextContent('completed');
      }, { timeout: 10000 });

      // Verify record has correct field mapping after processing
      await waitFor(() => {
        expect(screen.getByTestId('record-original-name')).toHaveTextContent('Medical_Report_2024.pdf');
        expect(screen.getByTestId('record-display-name')).toHaveTextContent('Medical_Report_2024');
        expect(screen.getByTestId('record-type')).toHaveTextContent('pdf');
        expect(screen.getByTestId('record-mime-type')).toHaveTextContent('application/pdf');
        expect(screen.getByTestId('record-hidden')).toHaveTextContent('false');
      });

      // Step 3: Generate share package
      await act(async () => {
        await user.click(screen.getByTestId('share-btn'));
      });

      // Wait for share to complete
      await waitFor(() => {
        expect(screen.getByTestId('share-result')).toBeInTheDocument();
      }, { timeout: 5000 });

      // Verify share result
      await waitFor(() => {
        expect(screen.getByTestId('share-recipient')).toHaveTextContent('dentist@example.com');
        expect(screen.getByTestId('share-status')).toHaveTextContent('sent');
        expect(screen.getByTestId('share-method')).toHaveTextContent('emailjs');
        expect(screen.getByTestId('share-record-count')).toHaveTextContent('1');
      });

      // Step 4: Verify all services were called with correct data
      expect(mockPdfGenerate).toHaveBeenCalledWith({
        patientName: 'John Doe',
        patientEmail: 'john.doe@email.com',
        records: expect.arrayContaining([
          expect.objectContaining({
            id: 'test-file-123',
            originalName: 'Medical_Report_2024.pdf',
            displayName: 'Medical_Report_2024',
            type: 'pdf',
            mimeType: 'application/pdf'
          })
        ]),
        recipientName: 'Dr. Smith',
        includeAISummary: true
      });

      expect(mockFileAttachments).toHaveBeenCalledWith([
        expect.objectContaining({
          originalName: 'Medical_Report_2024.pdf',
          displayName: 'Medical_Report_2024',
          mimeType: 'application/pdf',
          size: 75000
        })
      ]);

      expect(mockEmailSend).toHaveBeenCalledWith({
        recipientEmail: 'dentist@example.com',
        recipientName: 'Dr. Smith',
        patientName: 'John Doe',
        patientEmail: 'john.doe@email.com',
        recordsSummary: 'Mock summary text',
        pdfAttachment: 'bW9ja1BkZkNvbnRlbnQ=',
        fileAttachments: expect.arrayContaining([
          expect.objectContaining({
            name: 'Medical_Report_2024.pdf',
            type: 'application/pdf',
            base64: 'cGRmQmFzZTY0Q29udGVudA=='
          })
        ]),
        recordCount: 1,
        dateRange: expect.any(String),
        shareLink: null,
        expirationDate: expect.any(String)
      });
    });

    it('should handle upload errors gracefully', async () => {
      const user = userEvent.setup();
      
      // Mock upload failure
      mockFetch
        .mockImplementationOnce(() => Promise.resolve({ ok: true, json: () => Promise.resolve({ status: 'ok' }) }))
        .mockImplementationOnce(() => Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true, records: [] }) }))
        .mockImplementationOnce(() => Promise.reject(new Error('Upload failed')));

      render(
        <HealthRecordsProvider>
          <IntegrationTestApp />
        </HealthRecordsProvider>
      );

      await act(async () => {
        await user.click(screen.getByTestId('upload-btn'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('upload-error')).toHaveTextContent('Upload failed');
      });

      // Verify no records were added
      expect(screen.getByTestId('records-count')).toHaveTextContent('0');
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });

    it('should handle share generation errors gracefully', async () => {
      const user = userEvent.setup();
      
      // Setup successful upload but failed share
      mockPdfGenerate.mockRejectedValue(new Error('PDF generation failed'));

      render(
        <HealthRecordsProvider>
          <IntegrationTestApp />
        </HealthRecordsProvider>
      );

      // Upload first
      await act(async () => {
        await user.click(screen.getByTestId('upload-btn'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('records-count')).toHaveTextContent('1');
      });

      // Try to share
      await act(async () => {
        await user.click(screen.getByTestId('share-btn'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('share-error')).toHaveTextContent('PDF generation failed');
      });
    });

    it('should work with multiple files in share package', async () => {
      const user = userEvent.setup();
      
      // Mock multiple file upload responses
      mockFetch
        .mockImplementationOnce(() => Promise.resolve({ ok: true, json: () => Promise.resolve({ status: 'ok' }) }))
        .mockImplementationOnce(() => Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true, records: [] }) }))
        // First file upload
        .mockImplementationOnce(() => Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            file: {
              id: 'file-1',
              originalName: 'Lab_Results.pdf',
              displayName: 'Lab_Results',
              filename: 'lab.pdf',
              type: 'pdf',
              mimeType: 'application/pdf',
              url: 'http://localhost:3001/uploads/pdfs/lab.pdf',
              size: 45000,
              status: 'completed',
              uploadedAt: new Date().toISOString()
            }
          })
        }))
        // Status check for first file
        .mockImplementationOnce(() => Promise.resolve({ ok: true, json: () => Promise.resolve({ status: 'completed' }) }))
        // Get updated records after first file
        .mockImplementationOnce(() => Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            records: [{
              id: 'file-1',
              originalName: 'Lab_Results.pdf',
              displayName: 'Lab_Results',
              type: 'pdf',
              mimeType: 'application/pdf',
              status: 'completed',
              hidden: false
            }]
          })
        }))
        // Second file upload
        .mockImplementationOnce(() => Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            file: {
              id: 'file-2',
              originalName: 'X-Ray_Image.png',
              displayName: 'X-Ray_Image',
              filename: 'xray.png',
              type: 'image',
              mimeType: 'image/png',
              url: 'http://localhost:3001/uploads/images/xray.png',
              size: 35000,
              status: 'completed',
              uploadedAt: new Date().toISOString()
            }
          })
        }))
        // Status check for second file
        .mockImplementationOnce(() => Promise.resolve({ ok: true, json: () => Promise.resolve({ status: 'completed' }) }))
        // Get updated records after second file
        .mockImplementationOnce(() => Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            records: [
              {
                id: 'file-1',
                originalName: 'Lab_Results.pdf',
                displayName: 'Lab_Results',
                type: 'pdf',
                mimeType: 'application/pdf',
                status: 'completed',
                hidden: false,
                size: 45000
              },
              {
                id: 'file-2',
                originalName: 'X-Ray_Image.png',
                displayName: 'X-Ray_Image',
                type: 'image',
                mimeType: 'image/png',
                status: 'completed',
                hidden: false,
                size: 35000
              }
            ]
          })
        }))
        // Fetch files for attachments
        .mockImplementation(() => Promise.resolve({
          blob: () => Promise.resolve(new Blob(['content'], { type: 'application/pdf' }))
        }));

      // Mock multiple file attachments
      mockFileAttachments.mockResolvedValue([
        {
          name: 'Lab_Results.pdf',
          type: 'application/pdf',
          base64: 'bGFiUmVzdWx0c0Jhc2U2NA==',
          size: 45000
        },
        {
          name: 'X-Ray_Image.png',
          type: 'image/png',
          base64: 'eFJheUltYWdlQmFzZTY0',
          size: 35000
        }
      ]);

      render(
        <HealthRecordsProvider>
          <IntegrationTestApp />
        </HealthRecordsProvider>
      );

      // Upload two files
      await act(async () => {
        await user.click(screen.getByTestId('upload-btn'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('records-count')).toHaveTextContent('1');
      });

      await act(async () => {
        await user.click(screen.getByTestId('upload-btn'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('records-count')).toHaveTextContent('2');
      });

      // Generate share package
      await act(async () => {
        await user.click(screen.getByTestId('share-btn'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('share-record-count')).toHaveTextContent('2');
      });

      // Verify PDF generation was called with both records
      expect(mockPdfGenerate).toHaveBeenCalledWith(
        expect.objectContaining({
          records: expect.arrayContaining([
            expect.objectContaining({
              originalName: 'Lab_Results.pdf',
              displayName: 'Lab_Results'
            }),
            expect.objectContaining({
              originalName: 'X-Ray_Image.png',
              displayName: 'X-Ray_Image'
            })
          ])
        })
      );

      // Verify email was sent with both attachments
      expect(mockEmailSend).toHaveBeenCalledWith(
        expect.objectContaining({
          recordCount: 2,
          fileAttachments: expect.arrayContaining([
            expect.objectContaining({ name: 'Lab_Results.pdf' }),
            expect.objectContaining({ name: 'X-Ray_Image.png' })
          ])
        })
      );
    });

    it('should exclude hidden records from share package', async () => {
      const user = userEvent.setup();
      
      // Mock response with one visible and one hidden record
      mockFetch
        .mockImplementationOnce(() => Promise.resolve({ ok: true, json: () => Promise.resolve({ status: 'ok' }) }))
        .mockImplementationOnce(() => Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            records: [
              {
                id: 'visible-record',
                originalName: 'Visible_Report.pdf',
                displayName: 'Visible_Report',
                type: 'pdf',
                mimeType: 'application/pdf',
                status: 'completed',
                hidden: false,
                size: 45000
              },
              {
                id: 'hidden-record',
                originalName: 'Hidden_Report.pdf',
                displayName: 'Hidden_Report',
                type: 'pdf',
                mimeType: 'application/pdf',
                status: 'completed',
                hidden: true,
                size: 35000
              }
            ]
          })
        }))
        .mockImplementation(() => Promise.resolve({
          blob: () => Promise.resolve(new Blob(['content'], { type: 'application/pdf' }))
        }));

      mockFileAttachments.mockResolvedValue([{
        name: 'Visible_Report.pdf',
        type: 'application/pdf',
        base64: 'dmlzaWJsZVJlcG9ydA==',
        size: 45000
      }]);

      render(
        <HealthRecordsProvider>
          <IntegrationTestApp />
        </HealthRecordsProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('records-count')).toHaveTextContent('2');
      });

      await act(async () => {
        await user.click(screen.getByTestId('share-btn'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('share-record-count')).toHaveTextContent('1');
      });

      // Verify only visible record was included
      expect(mockPdfGenerate).toHaveBeenCalledWith(
        expect.objectContaining({
          records: expect.arrayContaining([
            expect.objectContaining({
              id: 'visible-record',
              hidden: false
            })
          ])
        })
      );

      // Verify hidden record was NOT included
      const pdfCall = mockPdfGenerate.mock.calls[0][0];
      expect(pdfCall.records.find(r => r.id === 'hidden-record')).toBeUndefined();
    });
  });

  describe('Offline/Local Storage Fallback', () => {
    beforeEach(() => {
      // Mock backend as unavailable
      mockFetch.mockImplementationOnce(() => Promise.reject(new Error('Backend unavailable')));
    });

    it('should complete upload to share flow using local storage', async () => {
      const user = userEvent.setup();
      
      render(
        <HealthRecordsProvider>
          <IntegrationTestApp />
        </HealthRecordsProvider>
      );

      // Upload file (will go to local storage)
      await act(async () => {
        await user.click(screen.getByTestId('upload-btn'));
      });

      // Wait for local storage upload to complete
      await waitFor(() => {
        expect(screen.getByTestId('records-count')).toHaveTextContent('1');
      });

      // Wait for processing to complete (simulated locally)
      await waitFor(() => {
        const recordStatus = screen.getByTestId('record-status');
        expect(recordStatus).toHaveTextContent('completed');
      }, { timeout: 5000 });

      // Generate share package
      await act(async () => {
        await user.click(screen.getByTestId('share-btn'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('share-result')).toBeInTheDocument();
      });

      // Verify share was successful
      await waitFor(() => {
        expect(screen.getByTestId('share-status')).toHaveTextContent('sent');
      });

      // Verify record data was preserved in local storage mode
      expect(screen.getByTestId('record-original-name')).toHaveTextContent('Medical_Report_2024.pdf');
      expect(screen.getByTestId('record-display-name')).toHaveTextContent('Medical_Report_2024');
    });
  });
});