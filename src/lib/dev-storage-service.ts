// Development storage service for when Amplify is not configured
export interface DevStorageResult {
  key: string;
  url: string;
  metadata?: Record<string, unknown>;
}

class DevStorageService {
  private mockFiles = new Map<string, { file: File; metadata: Record<string, string> }>();

  async uploadFile(key: string, file: File, metadata: Record<string, string>): Promise<DevStorageResult> {
    // Create a blob URL for the file
    const url = URL.createObjectURL(file);
    this.mockFiles.set(key, { file, metadata });
    
    console.log(`[DEV STORAGE] Uploaded file: ${key}`, { 
      size: file.size, 
      type: file.type,
      metadata 
    });
    
    return { key, url, metadata };
  }

  async deleteFile(key: string): Promise<void> {
    const fileData = this.mockFiles.get(key);
    if (fileData) {
      // Revoke the blob URL to free memory
      const existingUrl = Array.from(this.mockFiles.values())
        .find(data => data.file === fileData.file);
      if (existingUrl) {
        URL.revokeObjectURL(key);
      }
      this.mockFiles.delete(key);
      console.log(`[DEV STORAGE] Deleted file: ${key}`);
    }
  }

  async listFiles(): Promise<Array<{ key: string; metadata?: Record<string, string> }>> {
    return Array.from(this.mockFiles.entries()).map(([key, data]) => ({
      key,
      metadata: data.metadata
    }));
  }

  getFileCount(): number {
    return this.mockFiles.size;
  }

  clear(): void {
    // Revoke all blob URLs
    this.mockFiles.forEach((data, key) => {
      URL.revokeObjectURL(key);
    });
    this.mockFiles.clear();
    console.log('[DEV STORAGE] Cleared all files');
  }
}

export const devStorageService = new DevStorageService(); 