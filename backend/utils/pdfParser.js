/**
 * Wrapper for pdf-parse to avoid the debug mode issue
 * The pdf-parse library has a bug where it tries to read a test file
 * when imported in certain Node.js environments
 */

// Direct import - the postinstall script handles the fix
import pdfParse from 'pdf-parse';

export default pdfParse;