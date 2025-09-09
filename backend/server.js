import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Import routes
import uploadRoutes from './routes/upload.js';
import recordsRoutes from './routes/records.js';
import healthRoutes from './routes/health.js';
import analyzeRoutes from './routes/analyze.js';
import imageAnalysisRoutes from './routes/imageAnalysis.js';

// Import database
import { initDatabase } from './database/init.js';

// ES modules fix for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Initialize database
initDatabase();

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" } // Allow cross-origin for images
}));

// CORS configuration
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or file:// URLs)
    if (!origin) return callback(null, true);

    // List of allowed origins
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:5174',
      'https://localhost:5173',
      'https://192.168.1.233:5173',
      'https://revado-mobile-react.vercel.app',
      'https://revado-mobile-react-*.vercel.app', // Allow preview deployments
      process.env.FRONTEND_URL
    ].filter(Boolean);

    // In development, allow any localhost origin
    if (process.env.NODE_ENV === 'development') {
      if (origin.includes('localhost') || origin.includes('127.0.0.1') || origin === 'null') {
        return callback(null, true);
      }
    }

    // In production, allow Vercel deployments
    if (process.env.NODE_ENV === 'production') {
      if (origin.includes('vercel.app') && origin.includes('revado-mobile-react')) {
        return callback(null, true);
      }
    }

    // Check if origin is in allowed list
    if (allowedOrigins.some(allowed => {
      if (allowed.includes('*')) {
        // Handle wildcard patterns
        const pattern = allowed.replace('*', '.*');
        return new RegExp(pattern).test(origin);
      }
      return allowed === origin;
    })) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-User-Id']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});

const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20, // Limit uploads to 20 per 15 minutes
  message: 'Too many uploads, please try again later.'
});

// Middleware
app.use(compression());
app.use(morgan('dev'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Apply rate limiting
app.use('/api/', limiter);
app.use('/api/upload', uploadLimiter);

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  setHeaders: (res, filePath) => {
    // Set cache headers for static files
    res.set('Cache-Control', 'public, max-age=31536000');

    // Set CORS headers for images
    res.set('Access-Control-Allow-Origin', '*');
  }
}));

// Serve test page in development
if (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) {
  app.use('/test', express.static(path.join(__dirname, 'public')));

  // Also add explicit route for test.html
  app.get('/test.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'test.html'));
  });
}

// API Routes
app.use('/api/health', healthRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/records', recordsRoutes);
app.use('/api/analyze', analyzeRoutes);
app.use('/api/image-analysis', imageAnalysisRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Revado Health Records API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      upload: '/api/upload',
      records: '/api/records',
      analyze: '/api/analyze'
    },
    features: {
      aiAnalysis: process.env.ENABLE_AI_ANALYSIS === 'true',
      model: process.env.AI_MODEL || 'claude-3-5-sonnet-20241022'
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);

  // Multer file size error
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      error: 'File too large',
      message: 'Maximum file size is 10MB'
    });
  }

  // Multer file type error
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({
      error: 'Invalid file',
      message: 'Unexpected file field'
    });
  }

  // Default error
  res.status(err.status || 500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: `Cannot ${req.method} ${req.url}`
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`
🚀 Revado Health Records Backend
📁 Server running on http://localhost:${PORT}
📂 Uploads directory: ${path.join(__dirname, 'uploads')}
🗄️  Database: ${path.join(__dirname, 'database', 'health_records.db')}
🔒 CORS enabled for frontend
  `);
});
