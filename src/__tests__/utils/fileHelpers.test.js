import {
  fileToBase64,
  urlToBase64,
  getFileExtension,
  getMimeType,
  formatFileSize,
  isImageFile,
  prepareFileAttachments
} from '../../utils/fileHelpers';

// Mock fetch for urlToBase64 tests
global.fetch = jest.fn();

// Mock FileReader
global.FileReader = class FileReader {
  constructor() {
    this.onload = null;
    this.onerror = null;
  }

  readAsDataURL(blob) {
    setTimeout(() => {
      if (blob.type === 'application/pdf') {
        this.result = 'data:application/pdf;base64,cGRmLWJhc2U2NC1kYXRh';
      } else if (blob.type === 'image/png') {
        this.result = 'data:image/png;base64,cG5nLWJhc2U2NC1kYXRh';
      } else {
        this.result = 'data:text/plain;base64,dGV4dC1iYXNlNjQtZGF0YQ==';
      }
      if (this.onload) {
        this.onload();
      }
    }, 0);
  }
};

describe('File Helpers Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    fetch.mockClear();
    
    // Reset FileReader mock to default behavior
    global.FileReader = class FileReader {
      constructor() {
        this.onload = null;
        this.onerror = null;
      }

      readAsDataURL(blob) {
        setTimeout(() => {
          if (blob.type === 'application/pdf') {
            this.result = 'data:application/pdf;base64,cGRmLWJhc2U2NC1kYXRh';
          } else if (blob.type === 'image/png') {
            this.result = 'data:image/png;base64,cG5nLWJhc2U2NC1kYXRh';
          } else {
            this.result = 'data:text/plain;base64,dGV4dC1iYXNlNjQtZGF0YQ==';
          }
          if (this.onload) {
            this.onload();
          }
        }, 0);
      }
    };
  });

  describe('fileToBase64', () => {
    it('should convert PDF file to base64', async () => {
      const pdfFile = new File(['pdf content'], 'test.pdf', { type: 'application/pdf' });
      const result = await fileToBase64(pdfFile);
      
      expect(result).toBe('cGRmLWJhc2U2NC1kYXRh');
    });

    it('should convert image file to base64', async () => {
      const imageFile = new File(['png content'], 'test.png', { type: 'image/png' });
      const result = await fileToBase64(imageFile);
      
      expect(result).toBe('cG5nLWJhc2U2NC1kYXRh');
    });

    it('should convert text file to base64', async () => {
      const textFile = new File(['text content'], 'test.txt', { type: 'text/plain' });
      const result = await fileToBase64(textFile);
      
      expect(result).toBe('dGV4dC1iYXNlNjQtZGF0YQ==');
    });

    it('should handle FileReader errors', async () => {
      // Mock FileReader to simulate error
      global.FileReader = class FileReader {
        readAsDataURL() {
          setTimeout(() => {
            if (this.onerror) {
              this.onerror(new Error('FileReader error'));
            }
          }, 0);
        }
      };

      const file = new File(['content'], 'test.txt', { type: 'text/plain' });
      await expect(fileToBase64(file)).rejects.toThrow();
    });
  });

  describe('urlToBase64', () => {
    it('should fetch file from URL and convert to base64', async () => {
      const mockBlob = new Blob(['file content'], { type: 'application/pdf' });
      
      fetch.mockResolvedValue({
        blob: () => Promise.resolve(mockBlob)
      });

      const result = await urlToBase64('http://example.com/test.pdf');
      
      expect(fetch).toHaveBeenCalledWith('http://example.com/test.pdf');
      expect(result).toBe('cGRmLWJhc2U2NC1kYXRh');
    });

    it('should handle fetch errors', async () => {
      fetch.mockRejectedValue(new Error('Network error'));

      await expect(urlToBase64('http://example.com/test.pdf')).rejects.toThrow('Network error');
    });

    it('should handle blob conversion errors', async () => {
      fetch.mockResolvedValue({
        blob: () => Promise.reject(new Error('Blob conversion failed'))
      });

      await expect(urlToBase64('http://example.com/test.pdf')).rejects.toThrow('Blob conversion failed');
    });
  });

  describe('getFileExtension', () => {
    it('should extract file extension correctly', () => {
      expect(getFileExtension('document.pdf')).toBe('pdf');
      expect(getFileExtension('image.PNG')).toBe('png');
      expect(getFileExtension('file.name.with.dots.txt')).toBe('txt');
      expect(getFileExtension('complex.file.v2.FINAL.docx')).toBe('docx');
    });

    it('should return empty string for files without extension', () => {
      expect(getFileExtension('filename')).toBe('');
      expect(getFileExtension('file.')).toBe('');
    });

    it('should handle edge cases', () => {
      expect(getFileExtension('')).toBe('');
      expect(getFileExtension('.')).toBe('');
      expect(getFileExtension('.hidden')).toBe('hidden');
    });
  });

  describe('getMimeType', () => {
    it('should return correct MIME types for common extensions', () => {
      expect(getMimeType('document.pdf')).toBe('application/pdf');
      expect(getMimeType('image.jpg')).toBe('image/jpeg');
      expect(getMimeType('image.jpeg')).toBe('image/jpeg');
      expect(getMimeType('image.png')).toBe('image/png');
      expect(getMimeType('image.gif')).toBe('image/gif');
      expect(getMimeType('document.doc')).toBe('application/msword');
      expect(getMimeType('document.docx')).toBe('application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      expect(getMimeType('file.txt')).toBe('text/plain');
    });

    it('should handle case insensitive extensions', () => {
      expect(getMimeType('FILE.PDF')).toBe('application/pdf');
      expect(getMimeType('IMAGE.PNG')).toBe('image/png');
    });

    it('should return default MIME type for unknown extensions', () => {
      expect(getMimeType('file.unknown')).toBe('application/octet-stream');
      expect(getMimeType('file')).toBe('application/octet-stream');
    });
  });

  describe('formatFileSize', () => {
    it('should format file sizes correctly', () => {
      expect(formatFileSize(0)).toBe('0 Bytes');
      expect(formatFileSize(1024)).toBe('1 KB');
      expect(formatFileSize(1536)).toBe('1.5 KB');
      expect(formatFileSize(1048576)).toBe('1 MB');
      expect(formatFileSize(1073741824)).toBe('1 GB');
      expect(formatFileSize(512)).toBe('512 Bytes');
      expect(formatFileSize(2048)).toBe('2 KB');
    });

    it('should handle decimal values', () => {
      expect(formatFileSize(1536)).toBe('1.5 KB');
      expect(formatFileSize(1572864)).toBe('1.5 MB');
    });

    it('should handle very small sizes', () => {
      expect(formatFileSize(1)).toBe('1 Bytes');
      expect(formatFileSize(100)).toBe('100 Bytes');
    });
  });

  describe('isImageFile', () => {
    it('should identify image files correctly', () => {
      expect(isImageFile('photo.jpg')).toBe(true);
      expect(isImageFile('photo.jpeg')).toBe(true);
      expect(isImageFile('photo.png')).toBe(true);
      expect(isImageFile('photo.gif')).toBe(true);
      expect(isImageFile('photo.bmp')).toBe(true);
      expect(isImageFile('photo.webp')).toBe(true);
    });

    it('should handle case insensitive extensions', () => {
      expect(isImageFile('photo.JPG')).toBe(true);
      expect(isImageFile('photo.PNG')).toBe(true);
    });

    it('should return false for non-image files', () => {
      expect(isImageFile('document.pdf')).toBe(false);
      expect(isImageFile('document.txt')).toBe(false);
      expect(isImageFile('document.doc')).toBe(false);
      expect(isImageFile('file')).toBe(false);
    });
  });

  describe('prepareFileAttachments', () => {
    beforeEach(() => {
      // Reset FileReader mock
      global.FileReader = class FileReader {
        constructor() {
          this.onload = null;
          this.onerror = null;
        }

        readAsDataURL(blob) {
          setTimeout(() => {
            if (blob.type === 'application/pdf') {
              this.result = 'data:application/pdf;base64,cGRmLWJhc2U2NC1kYXRh';
            } else if (blob.type === 'image/png') {
              this.result = 'data:image/png;base64,cG5nLWJhc2U2NC1kYXRh';
            } else {
              this.result = 'data:text/plain;base64,dGV4dC1iYXNlNjQtZGF0YQ==';
            }
            if (this.onload) {
              this.onload();
            }
          }, 0);
        }
      };
    });

    it('should prepare attachments for small files', async () => {
      const records = [
        {
          id: '1',
          originalName: 'Lab_Results.pdf',
          displayName: 'Lab_Results',
          filename: 'lab.pdf',
          url: 'http://localhost:3001/uploads/pdfs/lab.pdf',
          mimeType: 'application/pdf',
          size: 30000, // 30KB - small enough for email
          status: 'completed'
        },
        {
          id: '2',
          originalName: 'X-Ray.png',
          displayName: 'X-Ray',
          filename: 'xray.png',
          url: 'http://localhost:3001/uploads/images/xray.png',
          mimeType: 'image/png',
          size: 45000, // 45KB - small enough for email
          status: 'completed'
        }
      ];

      const mockBlob1 = new Blob(['pdf content'], { type: 'application/pdf' });
      const mockBlob2 = new Blob(['png content'], { type: 'image/png' });

      fetch
        .mockResolvedValueOnce({ blob: () => Promise.resolve(mockBlob1) })
        .mockResolvedValueOnce({ blob: () => Promise.resolve(mockBlob2) });

      const attachments = await prepareFileAttachments(records);

      expect(attachments).toHaveLength(2);
      
      expect(attachments[0]).toMatchObject({
        name: 'Lab_Results.pdf',
        type: 'application/pdf',
        base64: 'cGRmLWJhc2U2NC1kYXRh',
        size: 30000
      });

      expect(attachments[1]).toMatchObject({
        name: 'X-Ray.png',
        type: 'image/png',
        base64: 'cG5nLWJhc2U2NC1kYXRh',
        size: 45000
      });
    });

    it('should skip large files that exceed email limits', async () => {
      const records = [
        {
          id: '1',
          originalName: 'Small_File.pdf',
          displayName: 'Small_File',
          filename: 'small.pdf',
          url: 'http://localhost:3001/uploads/pdfs/small.pdf',
          mimeType: 'application/pdf',
          size: 30000, // 30KB - okay
          status: 'completed'
        },
        {
          id: '2',
          originalName: 'Large_File.pdf',
          displayName: 'Large_File',
          filename: 'large.pdf',
          url: 'http://localhost:3001/uploads/pdfs/large.pdf',
          mimeType: 'application/pdf',
          size: 100 * 1024, // 100KB - too large for EmailJS
          status: 'completed'
        }
      ];

      const mockBlob = new Blob(['pdf content'], { type: 'application/pdf' });
      fetch.mockResolvedValueOnce({ blob: () => Promise.resolve(mockBlob) });

      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

      const attachments = await prepareFileAttachments(records);

      expect(attachments).toHaveLength(1);
      expect(attachments[0].name).toBe('Small_File.pdf');
      
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Skipping large file: Large_File')
      );

      consoleLogSpy.mockRestore();
    });

    it('should skip records without URLs', async () => {
      const records = [
        {
          id: '1',
          originalName: 'Valid_File.pdf',
          displayName: 'Valid_File',
          filename: 'valid.pdf',
          url: 'http://localhost:3001/uploads/pdfs/valid.pdf',
          mimeType: 'application/pdf',
          size: 30000,
          status: 'completed'
        },
        {
          id: '2',
          originalName: 'No_URL_File.pdf',
          displayName: 'No_URL_File',
          filename: 'nourl.pdf',
          // No URL field
          mimeType: 'application/pdf',
          size: 30000,
          status: 'completed'
        }
      ];

      const mockBlob = new Blob(['pdf content'], { type: 'application/pdf' });
      fetch.mockResolvedValueOnce({ blob: () => Promise.resolve(mockBlob) });

      const attachments = await prepareFileAttachments(records);

      expect(attachments).toHaveLength(1);
      expect(attachments[0].name).toBe('Valid_File.pdf');
    });

    it('should skip records that are not completed', async () => {
      const records = [
        {
          id: '1',
          originalName: 'Completed_File.pdf',
          displayName: 'Completed_File',
          filename: 'completed.pdf',
          url: 'http://localhost:3001/uploads/pdfs/completed.pdf',
          mimeType: 'application/pdf',
          size: 30000,
          status: 'completed'
        },
        {
          id: '2',
          originalName: 'Processing_File.pdf',
          displayName: 'Processing_File',
          filename: 'processing.pdf',
          url: 'http://localhost:3001/uploads/pdfs/processing.pdf',
          mimeType: 'application/pdf',
          size: 30000,
          status: 'processing' // Not completed
        }
      ];

      const mockBlob = new Blob(['pdf content'], { type: 'application/pdf' });
      fetch.mockResolvedValueOnce({ blob: () => Promise.resolve(mockBlob) });

      const attachments = await prepareFileAttachments(records);

      expect(attachments).toHaveLength(1);
      expect(attachments[0].name).toBe('Completed_File.pdf');
    });

    it('should handle fetch errors gracefully', async () => {
      const records = [
        {
          id: '1',
          originalName: 'Valid_File.pdf',
          displayName: 'Valid_File',
          filename: 'valid.pdf',
          url: 'http://localhost:3001/uploads/pdfs/valid.pdf',
          mimeType: 'application/pdf',
          size: 30000,
          status: 'completed'
        },
        {
          id: '2',
          originalName: 'Error_File.pdf',
          displayName: 'Error_File',
          filename: 'error.pdf',
          url: 'http://localhost:3001/uploads/pdfs/error.pdf',
          mimeType: 'application/pdf',
          size: 30000,
          status: 'completed'
        }
      ];

      const mockBlob = new Blob(['pdf content'], { type: 'application/pdf' });
      fetch
        .mockResolvedValueOnce({ blob: () => Promise.resolve(mockBlob) })
        .mockRejectedValueOnce(new Error('Network error'));

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const attachments = await prepareFileAttachments(records);

      expect(attachments).toHaveLength(1);
      expect(attachments[0].name).toBe('Valid_File.pdf');
      
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to prepare attachment'),
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });

    it('should use correct filename priority', async () => {
      const testCases = [
        {
          record: {
            id: '1',
            originalName: 'Original.pdf',
            displayName: 'Display',
            filename: 'generated.pdf',
            url: 'http://test.com/file.pdf',
            mimeType: 'application/pdf',
            size: 30000,
            status: 'completed'
          },
          expectedName: 'Original.pdf' // originalName has priority
        },
        {
          record: {
            id: '2',
            displayName: 'Display',
            filename: 'generated.pdf',
            url: 'http://test.com/file.pdf',
            mimeType: 'application/pdf',
            size: 30000,
            status: 'completed'
          },
          expectedName: 'Display' // displayName when no originalName
        },
        {
          record: {
            id: '3',
            filename: 'generated.pdf',
            url: 'http://test.com/file.pdf',
            mimeType: 'application/pdf',
            size: 30000,
            status: 'completed'
          },
          expectedName: 'generated.pdf' // filename when no originalName or displayName
        },
        {
          record: {
            id: '4',
            url: 'http://test.com/file.pdf',
            mimeType: 'application/pdf',
            size: 30000,
            status: 'completed'
          },
          expectedName: 'attachment' // fallback when no names
        }
      ];

      for (const { record, expectedName } of testCases) {
        const mockBlob = new Blob(['content'], { type: 'application/pdf' });
        fetch.mockResolvedValueOnce({ blob: () => Promise.resolve(mockBlob) });

        const attachments = await prepareFileAttachments([record]);
        
        expect(attachments).toHaveLength(1);
        expect(attachments[0].name).toBe(expectedName);
      }
    });

    it('should infer MIME type when not provided', async () => {
      const records = [{
        id: '1',
        originalName: 'Test.pdf',
        displayName: 'Test',
        filename: 'test.pdf',
        url: 'http://test.com/test.pdf',
        // No mimeType provided
        size: 30000,
        status: 'completed'
      }];

      const mockBlob = new Blob(['content'], { type: 'application/pdf' });
      fetch.mockResolvedValueOnce({ blob: () => Promise.resolve(mockBlob) });

      const attachments = await prepareFileAttachments(records);
      
      expect(attachments).toHaveLength(1);
      expect(attachments[0].type).toBe('application/pdf'); // Inferred from filename
    });
  });
});