import { generateHealthRecordsPDF, generateTextSummary } from '../../utils/pdfGenerator';

// Mock jsPDF
const mockPDF = {
  setProperties: jest.fn(),
  setFillColor: jest.fn(),
  rect: jest.fn(),
  setTextColor: jest.fn(),
  setFontSize: jest.fn(),
  setFont: jest.fn(),
  text: jest.fn(),
  setDrawColor: jest.fn(),
  line: jest.fn(),
  splitTextToSize: jest.fn().mockReturnValue(['Mock line 1', 'Mock line 2']),
  addPage: jest.fn(),
  internal: {
    getNumberOfPages: jest.fn().mockReturnValue(2)
  },
  setPage: jest.fn(),
  output: jest.fn().mockReturnValue(new Blob(['mock pdf content'], { type: 'application/pdf' }))
};

jest.mock('jspdf', () => ({
  jsPDF: jest.fn(() => mockPDF)
}));

// Mock html2canvas
jest.mock('html2canvas', () => jest.fn());

// Mock FileReader for base64 conversion
global.FileReader = class {
  readAsDataURL() {
    setTimeout(() => {
      this.result = 'data:application/pdf;base64,bW9ja0Jhc2U2NA==';
      if (this.onloadend) {
        this.onloadend();
      }
    }, 0);
  }
};

describe('PDF Generator Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset mock implementations
    mockPDF.output.mockReturnValue(new Blob(['fake pdf'], { type: 'application/pdf' }));
  });

  describe('generateHealthRecordsPDF', () => {
    const mockPatientData = {
      patientName: 'John Doe',
      patientEmail: 'john.doe@example.com',
      records: [
        {
          id: '1',
          originalName: 'Lab_Results_2024.pdf',
          displayName: 'Lab_Results_2024',
          filename: 'lab-results.pdf',
          type: 'pdf',
          mimeType: 'application/pdf',
          size: 50000,
          url: 'http://localhost:3001/uploads/pdfs/lab-results.pdf',
          status: 'completed',
          uploadedAt: '2024-01-15T10:30:00Z',
          extractedData: {
            patientName: 'John Doe',
            date: '2024-01-15',
            provider: 'City Medical Center',
            type: 'Lab Results',
            summary: 'Blood work shows normal values across all parameters'
          }
        },
        {
          id: '2',
          originalName: 'X-Ray_Chest.png',
          displayName: 'X-Ray_Chest',
          filename: 'xray.png',
          type: 'image',
          mimeType: 'image/png',
          size: 25000,
          url: 'http://localhost:3001/uploads/images/xray.png',
          status: 'completed',
          uploadedAt: '2024-01-20T14:15:00Z'
        }
      ],
      recipientName: 'Dr. Smith',
      includeAISummary: true
    };

    it('should generate PDF with correct document properties', async () => {
      const result = await generateHealthRecordsPDF(mockPatientData);

      expect(mockPDF.setProperties).toHaveBeenCalledWith({
        title: 'Health Records - John Doe',
        subject: 'Medical Records Summary',
        author: 'Revado Health App',
        keywords: 'health, medical, records',
        creator: 'Revado Health'
      });

      expect(result).toMatchObject({
        fileName: expect.stringMatching(/health_records_John_Doe_\d+\.pdf/),
        pageCount: 2,
        size: expect.any(Number)
      });

      expect(result.blob).toBeInstanceOf(Blob);
      expect(result.base64).toBe('bW9ja0Jhc2U2NA==');
    });

    it('should include patient information in PDF', async () => {
      await generateHealthRecordsPDF(mockPatientData);

      // Verify patient info is written to PDF
      expect(mockPDF.text).toHaveBeenCalledWith('Patient Information', expect.any(Number), expect.any(Number));
      expect(mockPDF.text).toHaveBeenCalledWith('Name: John Doe', expect.any(Number), expect.any(Number));
      expect(mockPDF.text).toHaveBeenCalledWith('Email: john.doe@example.com', expect.any(Number), expect.any(Number));
      expect(mockPDF.text).toHaveBeenCalledWith('Records Shared: 2', expect.any(Number), expect.any(Number));
    });

    it('should include AI summary when enabled', async () => {
      await generateHealthRecordsPDF(mockPatientData);

      expect(mockPDF.text).toHaveBeenCalledWith('Medical Summary', expect.any(Number), expect.any(Number));
      expect(mockPDF.splitTextToSize).toHaveBeenCalled();
    });

    it('should skip AI summary when disabled', async () => {
      const dataWithoutSummary = { ...mockPatientData, includeAISummary: false };
      await generateHealthRecordsPDF(dataWithoutSummary);

      // Should not include medical summary section
      expect(mockPDF.text).not.toHaveBeenCalledWith('Medical Summary', expect.any(Number), expect.any(Number));
    });

    it('should list all records with correct field mapping', async () => {
      await generateHealthRecordsPDF(mockPatientData);

      expect(mockPDF.text).toHaveBeenCalledWith('Records Included', expect.any(Number), expect.any(Number));

      // Check that displayName is used instead of originalName in the PDF
      expect(mockPDF.text).toHaveBeenCalledWith('Lab_Results_2024', expect.any(Number), expect.any(Number));
      expect(mockPDF.text).toHaveBeenCalledWith('X-Ray_Chest', expect.any(Number), expect.any(Number));

      // Check dates are formatted
      expect(mockPDF.text).toHaveBeenCalledWith(
        expect.stringMatching(/Date: \d{1,2}\/\d{1,2}\/\d{4}/),
        expect.any(Number),
        expect.any(Number)
      );
    });

    it('should indicate attached files correctly', async () => {
      await generateHealthRecordsPDF(mockPatientData);

      // Should indicate attachment count
      expect(mockPDF.text).toHaveBeenCalledWith(
        'Note: 2 original file(s) are attached to this email',
        expect.any(Number),
        expect.any(Number)
      );

      // Small files should show as [Attached]
      expect(mockPDF.text).toHaveBeenCalledWith(
        '[Attached] PDF Document',
        expect.any(Number),
        expect.any(Number)
      );

      expect(mockPDF.text).toHaveBeenCalledWith(
        '[Attached] PNG Image',
        expect.any(Number),
        expect.any(Number)
      );
    });

    it('should handle large files that cannot be attached', async () => {
      const dataWithLargeFile = {
        ...mockPatientData,
        records: [{
          ...mockPatientData.records[0],
          size: 1000000 // 1MB - too large for email attachment
        }]
      };

      await generateHealthRecordsPDF(dataWithLargeFile);

      // Large files should not show [Attached] prefix
      expect(mockPDF.text).not.toHaveBeenCalledWith(
        expect.stringContaining('[Attached]'),
        expect.any(Number),
        expect.any(Number)
      );
    });

    it('should show readable file types', async () => {
      await generateHealthRecordsPDF(mockPatientData);

      expect(mockPDF.text).toHaveBeenCalledWith('[Attached] PDF Document', expect.any(Number), expect.any(Number));
      expect(mockPDF.text).toHaveBeenCalledWith('[Attached] PNG Image', expect.any(Number), expect.any(Number));
    });

    it('should include extracted data summaries', async () => {
      await generateHealthRecordsPDF(mockPatientData);

      expect(mockPDF.splitTextToSize).toHaveBeenCalledWith(
        'Blood work shows normal values across all parameters',
        expect.any(Number)
      );
    });

    it('should add page numbers and security notice', async () => {
      await generateHealthRecordsPDF(mockPatientData);

      expect(mockPDF.setPage).toHaveBeenCalledTimes(2); // For 2 pages
      expect(mockPDF.text).toHaveBeenCalledWith('Page 1 of 2', expect.any(Number), expect.any(Number), { align: 'center' });
      expect(mockPDF.text).toHaveBeenCalledWith('Page 2 of 2', expect.any(Number), expect.any(Number), { align: 'center' });
      expect(mockPDF.text).toHaveBeenCalledWith(
        'This document contains protected health information',
        expect.any(Number),
        expect.any(Number),
        { align: 'center' }
      );
    });

    it('should handle edge cases in patient names for filename', async () => {
      const edgeCaseData = {
        ...mockPatientData,
        patientName: 'José María O\'Brien-Smith Jr.'
      };

      const result = await generateHealthRecordsPDF(edgeCaseData);

      expect(result.fileName).toMatch(/health_records_José_María_O'Brien-Smith_Jr\._\d+\.pdf/);
    });

    it('should handle empty records list', async () => {
      const emptyData = {
        ...mockPatientData,
        records: []
      };

      const result = await generateHealthRecordsPDF(emptyData);

      expect(mockPDF.text).toHaveBeenCalledWith('Records Shared: 0', expect.any(Number), expect.any(Number));
      // Note: attachment message is only shown when attachmentCount > 0
      expect(mockPDF.text).not.toHaveBeenCalledWith('Note: 0 original file(s) are attached to this email', expect.any(Number), expect.any(Number));
    });

    it('should handle records without extracted data', async () => {
      const recordsWithoutData = {
        ...mockPatientData,
        records: [{
          id: '1',
          originalName: 'simple.pdf',
          displayName: 'simple',
          type: 'pdf',
          mimeType: 'application/pdf',
          status: 'completed',
          uploadedAt: '2024-01-15T10:30:00Z'
          // No extractedData field
        }]
      };

      await generateHealthRecordsPDF(recordsWithoutData);

      expect(mockPDF.text).toHaveBeenCalledWith('simple', expect.any(Number), expect.any(Number));
      // Should not try to add extracted data summary
      expect(mockPDF.splitTextToSize).toHaveBeenCalledTimes(1); // Only for AI summary
    });

    it('should throw error when PDF generation fails', async () => {
      mockPDF.output.mockImplementation(() => {
        throw new Error('PDF output failed');
      });

      await expect(generateHealthRecordsPDF(mockPatientData)).rejects.toThrow('Failed to generate PDF summary');
    });
  });

  describe('generateTextSummary', () => {
    const mockSummaryData = {
      patientName: 'Jane Smith',
      patientEmail: 'jane.smith@example.com',
      records: [
        {
          id: '1',
          originalName: 'Medical_Report.pdf',
          displayName: 'Medical_Report',
          type: 'pdf',
          mimeType: 'application/pdf',
          uploadedAt: '2024-01-15T10:30:00Z',
          extractedData: {
            summary: 'Comprehensive health checkup results'
          }
        },
        {
          id: '2',
          originalName: 'Lab_Results.txt',
          displayName: 'Lab_Results',
          type: 'document',
          mimeType: 'text/plain',
          uploadedAt: '2024-01-20T14:15:00Z'
        }
      ]
    };

    it('should generate text summary with correct format', () => {
      const summary = generateTextSummary(mockSummaryData);

      expect(summary).toContain('HEALTH RECORDS SUMMARY');
      expect(summary).toContain('Patient: Jane Smith');
      expect(summary).toContain('Email: jane.smith@example.com');
      expect(summary).toContain('Total Records: 2');
      expect(summary).toContain('RECORDS LIST:');
    });

    it('should list records with display names and proper formatting', () => {
      const summary = generateTextSummary(mockSummaryData);

      expect(summary).toContain('1. Medical_Report');
      expect(summary).toContain('2. Lab_Results');
      expect(summary).toContain('Type: PDF Document');
      expect(summary).toContain('Type: Text File');
    });

    it('should include extracted data summaries when available', () => {
      const summary = generateTextSummary(mockSummaryData);

      expect(summary).toContain('Summary: Comprehensive health checkup results');
    });

    it('should format dates correctly', () => {
      const summary = generateTextSummary(mockSummaryData);

      expect(summary).toMatch(/Date: \d{1,2}\/\d{1,2}\/\d{4}/);
    });

    it('should handle records without dates', () => {
      const dataWithoutDates = {
        ...mockSummaryData,
        records: [{
          ...mockSummaryData.records[0],
          uploadedAt: null
        }]
      };

      const summary = generateTextSummary(dataWithoutDates);

      expect(summary).toContain('Date: N/A');
    });

    it('should handle records without display names', () => {
      const dataWithoutDisplayNames = {
        ...mockSummaryData,
        records: [{
          id: '1',
          originalName: 'Original_Name.pdf',
          // No displayName
          type: 'pdf',
          mimeType: 'application/pdf'
        }]
      };

      const summary = generateTextSummary(dataWithoutDisplayNames);

      expect(summary).toContain('1. Original_Name.pdf');
    });

    it('should handle records without filenames fallback to "Unnamed Record"', () => {
      const dataWithoutNames = {
        ...mockSummaryData,
        records: [{
          id: '1',
          // No originalName, displayName, or filename
          type: 'pdf',
          mimeType: 'application/pdf'
        }]
      };

      const summary = generateTextSummary(dataWithoutNames);

      expect(summary).toContain('1. Unnamed Record');
    });

    it('should include footer information', () => {
      const summary = generateTextSummary(mockSummaryData);

      expect(summary).toContain('Generated by Revado Health App');
      expect(summary).toMatch(/={50}/);
    });
  });

  describe('getReadableFileType function (via PDF generation)', () => {
    it('should correctly identify file types from mimeType', async () => {
      const testRecords = [
        { mimeType: 'application/pdf', expected: 'PDF Document' },
        { mimeType: 'image/jpeg', expected: 'JPEG Image' },
        { mimeType: 'image/png', expected: 'PNG Image' },
        { mimeType: 'application/msword', expected: 'Word Document' },
        { mimeType: 'text/plain', expected: 'Text File' },
        { mimeType: 'application/xml', expected: 'XML Document' },
        { mimeType: 'unknown/type', expected: 'unknown/type' }
      ];

      for (const { mimeType, expected } of testRecords) {
        const mockData = {
          patientName: 'Test',
          patientEmail: 'test@example.com',
          records: [{
            id: '1',
            originalName: 'test.file',
            displayName: 'test',
            mimeType,
            type: 'document',
            status: 'completed',
            size: 10000,
            url: 'http://test.com/file'
          }]
        };

        await generateHealthRecordsPDF(mockData);
        expect(mockPDF.text).toHaveBeenCalledWith(`[Attached] ${expected}`, expect.any(Number), expect.any(Number));
      }
    });

    it('should fallback to type field when mimeType is not available', async () => {
      const mockData = {
        patientName: 'Test',
        patientEmail: 'test@example.com',
        records: [{
          id: '1',
          originalName: 'test.file',
          displayName: 'test',
          // No mimeType
          type: 'ccda',
          status: 'completed',
          size: 10000,
          url: 'http://test.com/file'
        }]
      };

      await generateHealthRecordsPDF(mockData);
      expect(mockPDF.text).toHaveBeenCalledWith('[Attached] Clinical Document', expect.any(Number), expect.any(Number));
    });

    it('should handle unknown types gracefully', async () => {
      const mockData = {
        patientName: 'Test',
        patientEmail: 'test@example.com',
        records: [{
          id: '1',
          originalName: 'test.file',
          displayName: 'test',
          // No mimeType or type
          status: 'completed',
          size: 10000,
          url: 'http://test.com/file'
        }]
      };

      await generateHealthRecordsPDF(mockData);
      expect(mockPDF.text).toHaveBeenCalledWith('[Attached] Unknown', expect.any(Number), expect.any(Number));
    });
  });
});
