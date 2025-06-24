#!/usr/bin/env node

/**
 * Simplified backup script for North Playbook
 * Uses API route to backup data with proper authentication
 */

const fs = require('fs');
const path = require('path');
const http = require('http');

// Create backups directory if it doesn't exist
const backupsDir = path.join(__dirname, '..', 'backups');
if (!fs.existsSync(backupsDir)) {
  fs.mkdirSync(backupsDir, { recursive: true });
}

async function fetchBackupFromAPI() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
  
  console.log(`🔄 Starting backup at ${new Date().toISOString()}`);
  console.log('📡 Fetching backup from API...');
  
  try {
    // Use fetch API to call our backup endpoint
    const response = await fetch('http://localhost:3000/api/admin/backup', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Backup failed');
    }
    
    // Write backup file
    const backupFileName = `backup-${timestamp}.json`;
    const backupFilePath = path.join(backupsDir, backupFileName);
    
    fs.writeFileSync(backupFilePath, JSON.stringify(result.backup, null, 2));
    
    // Create latest backup symlink/copy
    const latestBackupPath = path.join(backupsDir, 'latest-backup.json');
    fs.writeFileSync(latestBackupPath, JSON.stringify(result.backup, null, 2));
    
    console.log(`✅ Backup completed successfully!`);
    console.log(`📁 Backup file: ${backupFilePath}`);
    console.log(`📊 Total records backed up: ${Object.values(result.summary.totalRecords).reduce((a, b) => a + b, 0)}`);
    
    // Display summary
    console.log('\n📈 Backup Summary:');
    Object.entries(result.summary.totalRecords).forEach(([key, count]) => {
      console.log(`   ${key}: ${count} records`);
    });
    
    return backupFilePath;
    
  } catch (error) {
    console.error('❌ Backup failed:', error.message);
    
    if (error.message.includes('ECONNREFUSED')) {
      console.error('\n💡 Make sure the development server is running:');
      console.error('   npm run dev');
      console.error('\nThen run the backup again.');
    }
    
    throw error;
  }
}

// Auto-cleanup old backups (keep last 30 days)
function cleanupOldBackups() {
  try {
    const files = fs.readdirSync(backupsDir);
    const backupFiles = files.filter(f => f.startsWith('backup-') && f.endsWith('.json'));
    
    if (backupFiles.length > 30) {
      // Sort by date and remove oldest
      backupFiles.sort();
      const toDelete = backupFiles.slice(0, backupFiles.length - 30);
      
      toDelete.forEach(file => {
        fs.unlinkSync(path.join(backupsDir, file));
        console.log(`🗑️ Deleted old backup: ${file}`);
      });
    }
  } catch (error) {
    console.warn('⚠️ Could not cleanup old backups:', error.message);
  }
}

// Check if development server is running
async function checkServerRunning() {
  try {
    const response = await fetch('http://localhost:3000/api/exercises');
    return response.status !== 404; // Any response means server is running
  } catch (error) {
    return false;
  }
}

// Run backup if called directly
if (require.main === module) {
  (async () => {
    try {
      // Check if server is running
      const serverRunning = await checkServerRunning();
      if (!serverRunning) {
        console.error('❌ Development server is not running!');
        console.error('\n💡 Start the server first:');
        console.error('   npm run dev');
        console.error('\nThen run the backup again.');
        process.exit(1);
      }
      
      const backupFile = await fetchBackupFromAPI();
      cleanupOldBackups();
      console.log(`\n🎉 Backup process completed successfully!`);
      console.log(`💾 Backup saved to: ${backupFile}`);
      process.exit(0);
    } catch (error) {
      console.error('\n💥 Backup process failed:', error.message);
      process.exit(1);
    }
  })();
}

module.exports = { fetchBackupFromAPI, cleanupOldBackups }; 