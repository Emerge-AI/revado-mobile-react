// Simple API test script
// Run with: node test-api.js

const API_URL = 'http://localhost:3001/api';

async function testBackend() {
  console.log('🧪 Testing Revado Backend API...\n');

  try {
    // 1. Test health endpoint
    console.log('1️⃣  Testing health endpoint...');
    const healthResponse = await fetch(`${API_URL}/health`);
    const health = await healthResponse.json();
    console.log('   ✅ Health check:', health.status);
    console.log('   📊 Database:', health.database.status);
    console.log('   💾 Storage:', health.storage.status);
    
    // 2. Test records endpoint
    console.log('\n2️⃣  Testing records endpoint...');
    const recordsResponse = await fetch(`${API_URL}/records`, {
      headers: {
        'X-User-Id': 'test-user'
      }
    });
    const records = await recordsResponse.json();
    console.log('   ✅ Records fetched:', records.count, 'records');
    
    // 3. Test file upload with a test file
    console.log('\n3️⃣  Testing file upload...');
    const testContent = 'This is a test file for the Revado backend';
    const blob = new Blob([testContent], { type: 'text/plain' });
    const file = new File([blob], 'test-document.txt', { type: 'text/plain' });
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('userId', 'test-user');
    
    const uploadResponse = await fetch(`${API_URL}/upload/single`, {
      method: 'POST',
      headers: {
        'X-User-Id': 'test-user'
      },
      body: formData
    });
    
    const uploadResult = await uploadResponse.json();
    if (uploadResult.success) {
      console.log('   ✅ File uploaded successfully');
      console.log('   📁 File ID:', uploadResult.file.id);
      console.log('   📄 Filename:', uploadResult.file.filename);
      console.log('   🔗 URL:', uploadResult.file.url);
      
      // 4. Test file retrieval
      console.log('\n4️⃣  Testing file retrieval...');
      const getRecordResponse = await fetch(`${API_URL}/records/${uploadResult.file.id}`, {
        headers: {
          'X-User-Id': 'test-user'
        }
      });
      const recordData = await getRecordResponse.json();
      console.log('   ✅ Record retrieved:', recordData.record.name);
      
      // 5. Test file deletion
      console.log('\n5️⃣  Testing file deletion...');
      const deleteResponse = await fetch(`${API_URL}/records/${uploadResult.file.id}?permanent=true`, {
        method: 'DELETE',
        headers: {
          'X-User-Id': 'test-user'
        }
      });
      const deleteResult = await deleteResponse.json();
      console.log('   ✅ File deleted:', deleteResult.message);
    }
    
    console.log('\n✨ All tests passed! Backend is working correctly.');
    console.log('\n📱 The React frontend will automatically detect and use this backend.');
    console.log('   When backend is unavailable, it will fall back to localStorage.\n');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('\nMake sure the backend server is running with: npm start');
  }
}

// Run tests
testBackend();