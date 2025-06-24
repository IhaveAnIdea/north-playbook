#!/usr/bin/env node

/**
 * Comprehensive backup script for North Playbook
 * Exports all data to JSON files with timestamps
 */

const { generateClient } = require('aws-amplify/api');
const { Amplify } = require('aws-amplify');
const fs = require('fs');
const path = require('path');

// Import amplify config
const outputs = require('../amplify_outputs.json');

// Configure Amplify for server-side usage
Amplify.configure(outputs, {
  ssr: true // Enable server-side rendering mode
});

const client = generateClient({
  authMode: 'apiKey' // Use API key for server-side access
});

// Create backups directory if it doesn't exist
const backupsDir = path.join(__dirname, '..', 'backups');
if (!fs.existsSync(backupsDir)) {
  fs.mkdirSync(backupsDir, { recursive: true });
}

async function backupAllData() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
  const fullTimestamp = new Date().toISOString();
  
  console.log(`🔄 Starting backup at ${fullTimestamp}`);
  
  try {
    // Backup all models
    console.log('📋 Backing up exercises...');
    const exercises = await client.models.Exercise.list();
    
    console.log('📝 Backing up exercise responses...');
    const responses = await client.models.ExerciseResponse.list();
    
    console.log('📖 Backing up playbook entries...');
    const playbookEntries = await client.models.PlaybookEntry.list();
    
    console.log('👥 Backing up user profiles...');
    const userProfiles = await client.models.UserProfile.list();
    
    console.log('📊 Backing up user insights...');
    const userInsights = await client.models.UserInsights.list();
    
    console.log('📁 Backing up media assets...');
    const mediaAssets = await client.models.MediaAsset.list();
    
    console.log('🎯 Backing up user sessions...');
    const userSessions = await client.models.UserSession.list();
    
    console.log('📈 Backing up user progress...');
    const userProgress = await client.models.UserProgress.list();

    // Create comprehensive backup object
    const backup = {
      metadata: {
        timestamp: fullTimestamp,
        version: '1.0',
        environment: process.env.NODE_ENV || 'development',
        totalRecords: {
          exercises: exercises.data?.length || 0,
          responses: responses.data?.length || 0,
          playbookEntries: playbookEntries.data?.length || 0,
          userProfiles: userProfiles.data?.length || 0,
          userInsights: userInsights.data?.length || 0,
          mediaAssets: mediaAssets.data?.length || 0,
          userSessions: userSessions.data?.length || 0,
          userProgress: userProgress.data?.length || 0
        }
      },
      data: {
        exercises: exercises.data || [],
        exerciseResponses: responses.data || [],
        playbookEntries: playbookEntries.data || [],
        userProfiles: userProfiles.data || [],
        userInsights: userInsights.data || [],
        mediaAssets: mediaAssets.data || [],
        userSessions: userSessions.data || [],
        userProgress: userProgress.data || []
      }
    };

    // Write backup file
    const backupFileName = `backup-${timestamp}.json`;
    const backupFilePath = path.join(backupsDir, backupFileName);
    
    fs.writeFileSync(backupFilePath, JSON.stringify(backup, null, 2));
    
    // Create latest backup symlink/copy
    const latestBackupPath = path.join(backupsDir, 'latest-backup.json');
    fs.writeFileSync(latestBackupPath, JSON.stringify(backup, null, 2));
    
    console.log(`✅ Backup completed successfully!`);
    console.log(`📁 Backup file: ${backupFilePath}`);
    console.log(`📊 Total records backed up: ${Object.values(backup.metadata.totalRecords).reduce((a, b) => a + b, 0)}`);
    
    // Display summary
    console.log('\n📈 Backup Summary:');
    Object.entries(backup.metadata.totalRecords).forEach(([key, count]) => {
      console.log(`   ${key}: ${count} records`);
    });
    
    return backupFilePath;
    
  } catch (error) {
    console.error('❌ Backup failed:', error);
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

// Run backup if called directly
if (require.main === module) {
  backupAllData()
    .then((backupFile) => {
      cleanupOldBackups();
      console.log(`\n🎉 Backup process completed successfully!`);
      console.log(`💾 Backup saved to: ${backupFile}`);
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Backup process failed:', error);
      process.exit(1);
    });
}

module.exports = { backupAllData, cleanupOldBackups }; 