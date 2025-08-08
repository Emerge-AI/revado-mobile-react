# Testing Guide for Revado Health Records App

This document provides comprehensive information about the test suites created for the Revado health records application, with focus on the file upload, PDF generation, and email attachment features.

## Overview

The testing suite includes:
- **Backend API Tests** - Direct testing of upload endpoints, metadata storage, and field mapping
- **Frontend Component Tests** - React component testing with mocked dependencies
- **PDF Generation Tests** - Validation of PDF content, field mapping, and file type handling
- **File Helpers Tests** - Attachment preparation and email formatting
- **Integration Tests** - Complete upload → store → retrieve → share flow
- **E2E Tests** - End-to-end testing with actual API calls

## Quick Start

```bash
# Run all tests
npm run test:all

# Frontend tests only
npm test

# Backend tests only  
cd backend && npm test

# E2E tests only
npm run test:e2e

# Watch mode for development
npm run test:watch
```

## Test Structure

```
src/
├── __tests__/
│   ├── contexts/
│   │   └── HealthRecordsContext.test.jsx    # Context provider tests
│   ├── utils/
│   │   ├── pdfGenerator.test.js             # PDF generation tests
│   │   └── fileHelpers.test.js              # File utilities tests
│   └── integration/
│       └── uploadShareFlow.test.jsx         # Integration tests
├── setupTests.js                            # Jest setup
└── jest.config.js                           # Jest configuration

backend/
├── tests/
│   ├── upload.test.js                       # Upload API tests
│   ├── records.test.js                      # Records API tests
│   └── setup.js                             # Backend test setup
└── jest.config.js                           # Backend Jest config

test-e2e.js                                  # E2E test script
```

## Test Categories

### 1. Backend API Tests (`backend/tests/`)

Tests the core backend functionality that was recently fixed:

#### Upload API Tests (`upload.test.js`)
- ✅ File upload with various types (PDF, images, documents)
- ✅ Metadata storage and retrieval with correct field mapping
- ✅ Field mapping validation (originalName, displayName, mimeType, type)
- ✅ Complex filename handling (dots, extensions, special characters)
- ✅ Error handling and file cleanup
- ✅ Processing status updates
- ✅ Multiple file uploads

**Key Tests:**
```javascript
// Tests the bug fix where displayName wasn't removing extensions
expect(response.body.file.displayName).toBe('Medical_Report_2024'); // from Medical_Report_2024.pdf

// Tests proper field mapping from backend to frontend
expect(record.originalName).toBe('Complex_File_Name.v2.final.pdf');
expect(record.displayName).toBe('Complex_File_Name.v2.final');
```

#### Records API Tests (`records.test.js`)
- ✅ Records retrieval with correct field transformations
- ✅ Record visibility management (hide/unhide)
- ✅ Status updates and processing completion
- ✅ Field consistency across all endpoints
- ✅ Filtering and pagination

### 2. Frontend Component Tests (`src/__tests__/`)

#### HealthRecordsContext Tests
Tests the React context that manages upload flow and field mapping:

- ✅ Backend vs local storage mode switching
- ✅ File upload with progress tracking
- ✅ Field mapping from API responses to UI state
- ✅ Share package generation with correct attachment preparation
- ✅ Status polling and record updates
- ✅ Error handling and state management

**Key Tests:**
```javascript
// Tests field mapping in uploaded records
expect(screen.getByTestId('display-name')).toHaveTextContent('test');
expect(screen.getByTestId('mime-type')).toHaveTextContent('application/pdf');

// Tests share package filters hidden records
expect(pdfCall.records.find(r => r.id === 'hidden-record')).toBeUndefined();
```

#### PDF Generator Tests (`utils/pdfGenerator.test.js`)
Tests the PDF generation that creates summaries for sharing:

- ✅ PDF document properties and structure
- ✅ Patient information inclusion
- ✅ Records list with proper display names and file types
- ✅ File attachment indicators (small files marked as "[Attached]")
- ✅ File type identification from mimeType and type fields
- ✅ Edge cases (complex filenames, missing data)
- ✅ Text summary generation

**Key Tests:**
```javascript
// Tests that displayName is used in PDF (not originalName)
expect(mockPDF.text).toHaveBeenCalledWith('Medical_Report', expect.any(Number), expect.any(Number));

// Tests attachment indicators
expect(mockPDF.text).toHaveBeenCalledWith('[Attached] PDF Document', expect.any(Number), expect.any(Number));
```

#### File Helpers Tests (`utils/fileHelpers.test.js`)
Tests utilities for file processing and email attachments:

- ✅ Base64 conversion for various file types
- ✅ File extension and MIME type detection
- ✅ File size formatting
- ✅ Email attachment preparation with size limits
- ✅ Filename priority (originalName > displayName > filename)
- ✅ Error handling for network failures

**Key Tests:**
```javascript
// Tests filename priority for attachments
expect(attachments[0].name).toBe('Original.pdf'); // originalName has priority

// Tests file size filtering
expect(attachments).toHaveLength(1); // Large file filtered out
expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Skipping large file'));
```

### 3. Integration Tests (`src/__tests__/integration/`)

#### Upload-Share Flow Tests
Tests the complete user journey from upload to sharing:

- ✅ Complete flow: upload → process → retrieve → share
- ✅ Field mapping consistency throughout the pipeline
- ✅ Multiple file handling
- ✅ Hidden record filtering
- ✅ Backend and local storage modes
- ✅ Error handling at each step

**Key Tests:**
```javascript
// Tests complete field mapping through entire flow
expect(screen.getByTestId('record-original-name')).toHaveTextContent('Medical_Report_2024.pdf');
expect(screen.getByTestId('record-display-name')).toHaveTextContent('Medical_Report_2024');

// Tests share package excludes hidden records
expect(pdfCall.records.find(r => r.id === 'hidden-record')).toBeUndefined();
```

### 4. E2E Tests (`test-e2e.js`)

Comprehensive end-to-end testing script that makes actual HTTP calls:

- ✅ Backend health check
- ✅ Real file uploads with FormData
- ✅ Processing status monitoring
- ✅ Records retrieval and field validation
- ✅ Record management (hide/unhide, status updates)
- ✅ File accessibility for email attachments
- ✅ Error handling scenarios
- ✅ Cleanup of test data

**Usage:**
```bash
# Start backend first
cd backend && npm start

# Run E2E tests
npm run test:e2e
```

## Running Tests

### Prerequisites

1. **Backend Tests**: No additional setup required
2. **Frontend Tests**: Jest, React Testing Library (already installed)
3. **E2E Tests**: Backend server must be running on port 3001

### Commands

```bash
# Install dependencies (if not already done)
npm install
cd backend && npm install && cd ..

# Run specific test suites
npm test                          # Frontend tests
cd backend && npm test           # Backend tests
npm run test:e2e                 # E2E tests (requires backend running)

# Development workflows
npm run test:watch               # Frontend tests in watch mode
npm run test:coverage            # With coverage report
cd backend && npm run test:watch # Backend tests in watch mode

# Run everything
npm run test:all                 # All tests sequentially
```

### Coverage Reports

Generate coverage reports to see what's tested:

```bash
# Frontend coverage
npm run test:coverage

# Backend coverage  
cd backend && npm run test:coverage
```

Coverage reports are generated in `coverage/` directories.

## What These Tests Verify

### Bug Fixes Validated

1. **Malformed Filenames**: Tests ensure displayName properly removes file extensions
2. **Wrong Field Names**: Tests verify correct API field mapping (originalName vs displayName)
3. **PDF Generation Issues**: Tests validate proper field usage in generated PDFs
4. **Email Attachment Problems**: Tests confirm correct filename usage in attachments

### Edge Cases Covered

1. **Complex Filenames**: `Patient_Report.2024.01.15.Final.v2.pdf` → `Patient_Report.2024.01.15.Final.v2`
2. **Files Without Extensions**: `document` → `document`
3. **Hidden Files**: `.hidden.txt` → `.hidden`
4. **Large Files**: Proper filtering for email size limits
5. **Network Errors**: Graceful handling of failed uploads/fetches
6. **Missing Data**: Fallbacks when fields are not present

### Data Integrity

Tests ensure data consistency:
- Upload response ↔ Database storage ↔ Records retrieval ↔ PDF generation ↔ Email attachments
- Field mapping remains consistent throughout the entire data pipeline
- No data loss or corruption during transformations

## Test Data and Mocking

### Test Files
- **PDF**: Valid PDF structure with proper headers
- **PNG**: Minimal valid PNG with correct byte signature
- **Text**: Plain text content for document testing

### Mock Strategies
- **API Calls**: Mocked with predictable responses
- **File System**: Mocked FileReader and blob operations
- **External Services**: EmailJS and PDF generation libraries mocked
- **Time-based Operations**: Processing delays and timeouts mocked

## Debugging Tests

### Common Issues

1. **Tests Timing Out**: Increase timeout for async operations
2. **Mock Not Working**: Check import paths and mock setup
3. **File Upload Failing**: Verify FormData construction and headers
4. **Database Errors**: Check test database isolation

### Debug Commands

```bash
# Run single test file
npm test -- --testPathPattern="upload.test.js"

# Run with verbose output
npm test -- --verbose

# Run specific test case
npm test -- --testNamePattern="should upload PDF file successfully"

# Debug mode (Node.js debugging)
node --inspect-brk node_modules/.bin/jest --runInBand
```

### Logs and Output

Tests include detailed logging:
- **API Responses**: Full response bodies in test output
- **Field Mapping**: Before/after values for validations
- **Error Details**: Complete error messages and stack traces
- **Coverage Reports**: Which lines are tested/untested

## Continuous Integration

These tests are designed to run in CI environments:

```yaml
# Example GitHub Actions workflow
- name: Run tests
  run: |
    npm install
    cd backend && npm install && cd ..
    npm run test
    cd backend && npm test
    
    # Start backend for E2E tests
    cd backend && npm start &
    sleep 5
    cd ..
    npm run test:e2e
```

## Contributing

When adding new features:

1. **Add Backend Tests**: Test API endpoints and database operations
2. **Add Frontend Tests**: Test React components and contexts
3. **Update Integration Tests**: Test complete user flows
4. **Update E2E Tests**: Test actual HTTP interactions

### Test Naming Conventions

- Backend: `describe('API Endpoint', () => { it('should handle specific case', ...) })`
- Frontend: `describe('Component Name', () => { it('should render correctly when...', ...) })`
- E2E: `describe('Feature Flow', () => { it('should complete entire journey...', ...) })`

### Field Mapping Tests

When modifying field mappings, ensure tests cover:
- Database column ↔ API response mapping
- API response ↔ Frontend state mapping  
- Frontend state ↔ PDF generation mapping
- PDF generation ↔ Email attachment mapping

This comprehensive test suite ensures the reliability of the file upload, processing, and sharing features, with particular attention to the field mapping issues that were recently resolved.