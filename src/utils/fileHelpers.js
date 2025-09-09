/**
 * File helper utilities for handling uploads and attachments
 */

/**
 * Convert a file or blob to base64 string
 */
export async function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      // Remove the data URL prefix to get just the base64 string
      const base64 = reader.result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Fetch a file from URL and convert to base64
 */
export async function urlToBase64(url) {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return fileToBase64(blob);
  } catch (error) {
    console.error('Failed to fetch file from URL:', error);
    throw error;
  }
}

/**
 * Get file extension from filename
 */
export function getFileExtension(filename) {
  const parts = filename.split('.');
  return parts.length > 1 ? parts.pop().toLowerCase() : '';
}

/**
 * Get MIME type from file extension
 */
export function getMimeType(filename) {
  const ext = getFileExtension(filename);
  const mimeTypes = {
    // Images
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'bmp': 'image/bmp',
    'webp': 'image/webp',

    // Documents
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'txt': 'text/plain',

    // Default
    '': 'application/octet-stream'
  };

  return mimeTypes[ext] || 'application/octet-stream';
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Check if file is an image
 */
export function isImageFile(filename) {
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'];
  const ext = getFileExtension(filename);
  return imageExtensions.includes(ext);
}

/**
 * Prepare file attachments for email
 * Fetches files and converts them to base64
 */
export async function prepareFileAttachments(records) {
  const attachments = [];

  for (const record of records) {
    if (record.url && record.status === 'completed') {
      try {
        // Skip if file is too large (EmailJS has a 50KB limit per attachment)
        if (record.size && record.size > 50 * 1024) {
          const fileName = record.displayName || record.originalName || record.filename || 'Unknown file';
          console.log(`Skipping large file: ${fileName} (${formatFileSize(record.size)})`);
          continue;
        }

        const base64 = await urlToBase64(record.url);
        const fileName = record.originalName || record.displayName || record.filename || 'attachment';

        attachments.push({
          name: fileName,
          type: record.mimeType || getMimeType(fileName),
          base64: base64,
          size: record.size
        });
      } catch (error) {
        console.error(`Failed to prepare attachment: ${record.name}`, error);
      }
    }
  }

  return attachments;
}
