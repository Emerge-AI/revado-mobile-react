import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Create subdirectories for different file types
const subdirs = ['images', 'pdfs', 'documents', 'temp'];
subdirs.forEach(dir => {
  const dirPath = path.join(uploadDir, dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
});

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let folder = 'documents'; // default folder
    
    if (file.mimetype.startsWith('image/')) {
      folder = 'images';
    } else if (file.mimetype === 'application/pdf') {
      folder = 'pdfs';
    }
    
    const destPath = path.join(uploadDir, folder);
    cb(null, destPath);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueId = uuidv4();
    const ext = path.extname(file.originalname);
    const timestamp = Date.now();
    const filename = `${timestamp}-${uniqueId}${ext}`;
    cb(null, filename);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  // Allowed file types
  const allowedMimeTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/heic',
    'image/heif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ];
  
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} not allowed. Allowed types: images (JPEG, PNG, GIF, WebP, HEIC), PDFs, and documents.`), false);
  }
};

// Create multer instance
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
    files: 10 // Max 10 files per request
  }
});

// Middleware for handling single file upload
export const uploadSingle = upload.single('file');

// Middleware for handling multiple file uploads
export const uploadMultiple = upload.array('files', 10);

// Middleware for handling form with multiple fields
export const uploadFields = upload.fields([
  { name: 'document', maxCount: 1 },
  { name: 'images', maxCount: 5 }
]);

// Helper function to delete uploaded file
export const deleteUploadedFile = (filePath) => {
  return new Promise((resolve, reject) => {
    fs.unlink(filePath, (err) => {
      if (err) {
        console.error('Error deleting file:', err);
        reject(err);
      } else {
        resolve();
      }
    });
  });
};

// Helper function to get file info
export const getFileInfo = (file) => {
  return {
    id: uuidv4(),
    originalName: file.originalname,
    filename: file.filename,
    path: file.path,
    destination: file.destination,
    mimeType: file.mimetype,
    size: file.size,
    encoding: file.encoding,
    uploadedAt: new Date().toISOString()
  };
};

// Helper function to process image (resize, compress, etc.)
export const processImage = async (filePath) => {
  // TODO: Implement image processing with sharp library if needed
  // For now, just return the original path
  return filePath;
};

// Helper function to extract text from PDF
export const extractPDFText = async (filePath) => {
  // TODO: Implement PDF text extraction with pdf-parse if needed
  // For now, return placeholder
  return {
    text: 'PDF content extraction pending',
    pages: 0,
    info: {}
  };
};

// Cleanup old temporary files (run periodically)
export const cleanupTempFiles = () => {
  const tempDir = path.join(uploadDir, 'temp');
  const now = Date.now();
  const maxAge = 24 * 60 * 60 * 1000; // 24 hours
  
  fs.readdir(tempDir, (err, files) => {
    if (err) {
      console.error('Error reading temp directory:', err);
      return;
    }
    
    files.forEach(file => {
      const filePath = path.join(tempDir, file);
      fs.stat(filePath, (err, stats) => {
        if (err) return;
        
        if (now - stats.mtimeMs > maxAge) {
          fs.unlink(filePath, (err) => {
            if (err) {
              console.error('Error deleting old temp file:', err);
            } else {
              console.log('Deleted old temp file:', file);
            }
          });
        }
      });
    });
  });
};

// Run cleanup every hour
setInterval(cleanupTempFiles, 60 * 60 * 1000);

export default {
  uploadSingle,
  uploadMultiple,
  uploadFields,
  deleteUploadedFile,
  getFileInfo,
  processImage,
  extractPDFText,
  cleanupTempFiles
};