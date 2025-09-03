import Database from 'better-sqlite3';
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
export const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

/**
 * Initialize database tables
 */
export function initDatabase() {
  // Create health_records table
  db.prepare(`
    CREATE TABLE IF NOT EXISTS health_records (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      original_name TEXT,
      display_name TEXT,
      filename TEXT,
      file_path TEXT,
      file_size INTEGER,
      mime_type TEXT,
      type TEXT,
      status TEXT DEFAULT 'pending',
      uploaded_at TEXT DEFAULT CURRENT_TIMESTAMP,
      processed_at TEXT,
      deleted_at TEXT,
      hidden BOOLEAN DEFAULT 0,
      extracted_data TEXT,
      ai_analysis TEXT,
      image_analysis_id TEXT,
      has_image_analysis BOOLEAN DEFAULT 0,
      metadata TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `).run();
  
  // Create image_analyses table for medical image analysis
  db.prepare(`
    CREATE TABLE IF NOT EXISTS image_analyses (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      record_id TEXT,
      filename TEXT NOT NULL,
      original_name TEXT,
      file_path TEXT,
      file_size INTEGER,
      mime_type TEXT,
      image_type TEXT,
      analysis_data TEXT,
      quality_score REAL,
      confidence_score REAL,
      clinical_flags TEXT,
      numerical_metrics TEXT,
      boolean_metrics TEXT,
      measurements TEXT,
      ai_insights TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (record_id) REFERENCES health_records(id)
    )
  `).run();
  
  // Create indexes for faster queries
  db.prepare(`
    CREATE INDEX IF NOT EXISTS idx_health_records_user_id 
    ON health_records(user_id)
  `).run();
  
  db.prepare(`
    CREATE INDEX IF NOT EXISTS idx_health_records_status 
    ON health_records(status)
  `).run();
  
  db.prepare(`
    CREATE INDEX IF NOT EXISTS idx_image_analyses_user_id 
    ON image_analyses(user_id)
  `).run();
  
  db.prepare(`
    CREATE INDEX IF NOT EXISTS idx_image_analyses_record_id 
    ON image_analyses(record_id)
  `).run();
  
  db.prepare(`
    CREATE INDEX IF NOT EXISTS idx_image_analyses_confidence 
    ON image_analyses(confidence_score)
  `).run();

  // Create share_history table
  db.prepare(`
    CREATE TABLE IF NOT EXISTS share_history (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      recipient_email TEXT NOT NULL,
      record_ids TEXT NOT NULL,
      record_count INTEGER NOT NULL,
      status TEXT DEFAULT 'sent',
      method TEXT DEFAULT 'email',
      shared_at TEXT DEFAULT CURRENT_TIMESTAMP,
      expires_at TEXT,
      access_token TEXT,
      accessed_count INTEGER DEFAULT 0,
      FOREIGN KEY (user_id) REFERENCES health_records(id) ON DELETE CASCADE
    )
  `).run();

  // Create indexes for share history
  db.prepare(`
    CREATE INDEX IF NOT EXISTS idx_share_history_user_id 
    ON share_history(user_id)
  `).run();
  
  db.prepare(`
    CREATE INDEX IF NOT EXISTS idx_share_history_access_token 
    ON share_history(access_token)
  `).run();

  console.log('✅ Database initialized with image analysis support');
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
  db.close();
  console.log('Database connection closed');
}

// Helper functions for database operations

/**
 * Run a database query
 */
export function runQuery(sql, params = []) {
  const stmt = db.prepare(sql);
  const result = stmt.run(...params);
  return { id: result.lastInsertRowid, changes: result.changes };
}

/**
 * Get single row from database
 */
export function getOne(sql, params = []) {
  const stmt = db.prepare(sql);
  return stmt.get(...params);
}

/**
 * Get multiple rows from database
 */
export function getAll(sql, params = []) {
  const stmt = db.prepare(sql);
  return stmt.all(...params);
}

export default {
  db,
  initDatabase,
  getDatabase,
  closeDatabase,
  runQuery,
  getOne,
  getAll
};