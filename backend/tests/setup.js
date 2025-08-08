import fs from 'fs';
import path from 'path';

// Test database setup
const testDbPath = path.join(process.cwd(), 'database', 'test_health_records.db');

// Clean up test database before each test suite
beforeEach(() => {
  // Remove test database if it exists
  if (fs.existsSync(testDbPath)) {
    fs.unlinkSync(testDbPath);
  }
  
  // Set test environment
  process.env.NODE_ENV = 'test';
  process.env.DATABASE_PATH = testDbPath;
});

// Clean up after all tests
afterAll(() => {
  // Remove test database
  if (fs.existsSync(testDbPath)) {
    fs.unlinkSync(testDbPath);
  }
  
  // Clean up test uploads directory
  const testUploadsDir = path.join(process.cwd(), 'uploads', 'test');
  if (fs.existsSync(testUploadsDir)) {
    fs.rmSync(testUploadsDir, { recursive: true, force: true });
  }
});