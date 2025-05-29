// Test file for development storage service
import { devStorageService } from './dev-storage-service';

export async function testDevStorage() {
  console.log('Testing development storage service...');
  
  // Create a mock file
  const mockFileContent = 'Hello, this is a test file!';
  const mockFile = new File([mockFileContent], 'test.txt', { type: 'text/plain' });
  
  try {
    // Test upload
    const result = await devStorageService.uploadFile(
      'test/test.txt',
      mockFile,
      { userId: 'test-user', category: 'test' }
    );
    
    console.log('Upload successful:', result);
    
    // Test list
    const files = await devStorageService.listFiles();
    console.log('Files in storage:', files);
    
    // Test delete
    await devStorageService.deleteFile(result.key);
    console.log('Delete successful');
    
    // Verify deletion
    const filesAfterDelete = await devStorageService.listFiles();
    console.log('Files after delete:', filesAfterDelete);
    
    return true;
  } catch (error) {
    console.error('Test failed:', error);
    return false;
  }
}

// Auto-run test in development
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  testDevStorage();
} 