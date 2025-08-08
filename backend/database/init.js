import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure database directory exists
const dbDir = __dirname;
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Database path
const dbPath = path.join(dbDir, 'health_records.db');

// Create database connection
const db = new (sqlite3.verbose()).Database(dbPath);

/**
 * Initialize database tables
 */
export function initDatabase() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Create users table (simplified for demo)
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          email TEXT UNIQUE NOT NULL,
          name TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) console.error('Error creating users table:', err);
      });

      // Create records table with AI analysis fields
      db.run(`
        CREATE TABLE IF NOT EXISTS records (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          original_name TEXT NOT NULL,
          display_name TEXT NOT NULL,
          filename TEXT NOT NULL,
          file_path TEXT NOT NULL,
          file_type TEXT NOT NULL,
          file_size INTEGER NOT NULL,
          mime_type TEXT,
          status TEXT DEFAULT 'uploaded',
          extracted_data TEXT,
          ai_analysis TEXT,
          analysis_status TEXT DEFAULT 'pending',
          analysis_confidence REAL,
          document_type TEXT,
          hidden BOOLEAN DEFAULT 0,
          uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          processed_at DATETIME,
          analyzed_at DATETIME,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `, (err) => {
        if (err) console.error('Error creating records table:', err);
        else {
          // Add new columns for existing databases
          const newColumns = [
            { name: 'display_name', type: 'TEXT' },
            { name: 'ai_analysis', type: 'TEXT' },
            { name: 'analysis_status', type: 'TEXT DEFAULT "pending"' },
            { name: 'analysis_confidence', type: 'REAL' },
            { name: 'document_type', type: 'TEXT' },
            { name: 'analyzed_at', type: 'DATETIME' }
          ];
          
          newColumns.forEach(col => {
            db.run(`ALTER TABLE records ADD COLUMN ${col.name} ${col.type}`, (alterErr) => {
              if (alterErr && !alterErr.message.includes('duplicate column')) {
                console.error(`Error adding ${col.name} column:`, alterErr);
              }
            });
          });
        }
      });

      // Create share_history table
      db.run(`
        CREATE TABLE IF NOT EXISTS share_history (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          recipient_email TEXT NOT NULL,
          record_ids TEXT NOT NULL,
          record_count INTEGER NOT NULL,
          status TEXT DEFAULT 'sent',
          method TEXT DEFAULT 'email',
          shared_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          expires_at DATETIME,
          access_token TEXT,
          accessed_count INTEGER DEFAULT 0,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `, (err) => {
        if (err) console.error('Error creating share_history table:', err);
      });

      // Create indexes for better performance
      db.run('CREATE INDEX IF NOT EXISTS idx_records_user_id ON records(user_id)');
      db.run('CREATE INDEX IF NOT EXISTS idx_records_status ON records(status)');
      db.run('CREATE INDEX IF NOT EXISTS idx_share_history_user_id ON share_history(user_id)');
      db.run('CREATE INDEX IF NOT EXISTS idx_share_history_access_token ON share_history(access_token)');

      console.log('✅ Database initialized successfully');
      resolve(db);
    });
  });
}

/**
 * Get database instance
 */
export function getDatabase() {
  return db;
}

/**
 * Close database connection
 */
export function closeDatabase() {
  return new Promise((resolve, reject) => {
    db.close((err) => {
      if (err) {
        console.error('Error closing database:', err);
        reject(err);
      } else {
        console.log('Database connection closed');
        resolve();
      }
    });
  });
}

// Helper functions for database operations

/**
 * Run a database query
 */
export function runQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) {
        reject(err);
      } else {
        resolve({ id: this.lastID, changes: this.changes });
      }
    });
  });
}

/**
 * Get single row from database
 */
export function getOne(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
}

/**
 * Get multiple rows from database
 */
export function getAll(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

export default {
  initDatabase,
  getDatabase,
  closeDatabase,
  runQuery,
  getOne,
  getAll
};