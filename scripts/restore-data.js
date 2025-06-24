#!/usr/bin/env node

/**
 * Data restoration script for North Playbook
 * Restores data from backup JSON files
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

async function restoreFromBackup(backupFilePath) {
  console.log(`🔄 Starting restore from ${backupFilePath}`);
  
  try {
    // Read backup file
    if (!fs.existsSync(backupFilePath)) {
      throw new Error(`Backup file not found: ${backupFilePath}`);
    }
    
    const backup = JSON.parse(fs.readFileSync(backupFilePath, 'utf8'));
    
    console.log(`📅 Backup timestamp: ${backup.metadata.timestamp}`);
    console.log(`📊 Total records to restore: ${Object.values(backup.metadata.totalRecords).reduce((a, b) => a + b, 0)}`);
    
    // Restore in dependency order
    
    // 1. User Profiles (no dependencies)
    console.log('👥 Restoring user profiles...');
    for (const profile of backup.data.userProfiles) {
      try {
        await client.models.UserProfile.create({
          userId: profile.userId,
          firstName: profile.firstName,
          lastName: profile.lastName,
          email: profile.email,
          role: profile.role
        });
      } catch (error) {
        console.warn(`⚠️ Could not restore user profile ${profile.email}:`, error.message);
      }
    }
    
    // 2. Exercises (no dependencies)
    console.log('📋 Restoring exercises...');
    const exerciseIdMap = new Map(); // Map old IDs to new IDs
    
    for (const exercise of backup.data.exercises) {
      try {
        const restored = await client.models.Exercise.create({
          title: exercise.title,
          description: exercise.description,
          category: exercise.category,
          question: exercise.question,
          instructions: exercise.instructions,
          requireText: exercise.requireText,
          requireImage: exercise.requireImage,
          requireAudio: exercise.requireAudio,
          requireVideo: exercise.requireVideo,
          requireDocument: exercise.requireDocument,
          textPrompt: exercise.textPrompt,
          maxTextLength: exercise.maxTextLength,
          allowMultipleImages: exercise.allowMultipleImages,
          allowMultipleDocuments: exercise.allowMultipleDocuments,
          allowEditingCompleted: exercise.allowEditingCompleted,
          isActive: exercise.isActive,
          order: exercise.order,
          createdBy: exercise.createdBy
        });
        
        exerciseIdMap.set(exercise.id, restored.data.id);
      } catch (error) {
        console.warn(`⚠️ Could not restore exercise ${exercise.title}:`, error.message);
      }
    }
    
    // 3. Exercise Responses (depends on exercises)
    console.log('📝 Restoring exercise responses...');
    for (const response of backup.data.exerciseResponses) {
      try {
        const newExerciseId = exerciseIdMap.get(response.exerciseId);
        if (newExerciseId) {
          await client.models.ExerciseResponse.create({
            exerciseId: newExerciseId,
            userId: response.userId,
            responseText: response.responseText,
            audioS3Key: response.audioS3Key,
            videoS3Key: response.videoS3Key,
            videoS3Keys: response.videoS3Keys,
            imageS3Keys: response.imageS3Keys,
            documentS3Keys: response.documentS3Keys,
            notes: response.notes,
            s3Bucket: response.s3Bucket,
            status: response.status,
            completedAt: response.completedAt,
            timeSpentSeconds: response.timeSpentSeconds,
            analysisResult: response.analysisResult,
            insights: response.insights
          });
        }
      } catch (error) {
        console.warn(`⚠️ Could not restore exercise response:`, error.message);
      }
    }
    
    // 4. Media Assets
    console.log('📁 Restoring media assets...');
    for (const asset of backup.data.mediaAssets) {
      try {
        const newExerciseId = asset.exerciseId ? exerciseIdMap.get(asset.exerciseId) : null;
        
        await client.models.MediaAsset.create({
          userId: asset.userId,
          s3Key: asset.s3Key,
          s3Bucket: asset.s3Bucket,
          fileName: asset.fileName,
          fileType: asset.fileType,
          fileSize: asset.fileSize,
          mimeType: asset.mimeType,
          exerciseId: newExerciseId,
          category: asset.category,
          tags: asset.tags,
          description: asset.description,
          uploadedAt: asset.uploadedAt,
          lastAccessedAt: asset.lastAccessedAt,
          accessCount: asset.accessCount
        });
      } catch (error) {
        console.warn(`⚠️ Could not restore media asset ${asset.fileName}:`, error.message);
      }
    }
    
    // 5. Other data (playbook entries, user insights, etc.)
    console.log('📖 Restoring playbook entries...');
    for (const entry of backup.data.playbookEntries) {
      try {
        await client.models.PlaybookEntry.create({
          userId: entry.userId,
          exerciseResponseId: entry.exerciseResponseId, // Note: may need ID mapping
          title: entry.title,
          content: entry.content,
          category: entry.category,
          insights: entry.insights,
          audioS3Keys: entry.audioS3Keys,
          videoS3Keys: entry.videoS3Keys,
          imageS3Keys: entry.imageS3Keys,
          documentS3Keys: entry.documentS3Keys,
          s3Bucket: entry.s3Bucket,
          mood: entry.mood,
          tags: entry.tags,
          isHighlight: entry.isHighlight,
          viewCount: entry.viewCount,
          lastViewedAt: entry.lastViewedAt
        });
      } catch (error) {
        console.warn(`⚠️ Could not restore playbook entry ${entry.title}:`, error.message);
      }
    }
    
    console.log('✅ Data restoration completed!');
    console.log(`📊 Restored ${backup.data.exercises.length} exercises`);
    console.log(`📝 Restored ${backup.data.exerciseResponses.length} responses`);
    console.log(`📖 Restored ${backup.data.playbookEntries.length} playbook entries`);
    
  } catch (error) {
    console.error('❌ Restore failed:', error);
    throw error;
  }
}

// List available backups
function listBackups() {
  const backupsDir = path.join(__dirname, '..', 'backups');
  
  if (!fs.existsSync(backupsDir)) {
    console.log('📁 No backups directory found');
    return [];
  }
  
  const files = fs.readdirSync(backupsDir);
  const backupFiles = files.filter(f => f.startsWith('backup-') && f.endsWith('.json'));
  
  console.log('📋 Available backups:');
  backupFiles.forEach((file, index) => {
    const filePath = path.join(backupsDir, file);
    const stats = fs.statSync(filePath);
    console.log(`  ${index + 1}. ${file} (${stats.size} bytes, ${stats.mtime.toISOString()})`);
  });
  
  return backupFiles.map(f => path.join(backupsDir, f));
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('📋 Usage: node restore-data.js <backup-file>');
    console.log('📋 Or: node restore-data.js --list');
    listBackups();
    process.exit(1);
  }
  
  if (args[0] === '--list') {
    listBackups();
    process.exit(0);
  }
  
  const backupFile = args[0];
  
  restoreFromBackup(backupFile)
    .then(() => {
      console.log('\n🎉 Restore process completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Restore process failed:', error);
      process.exit(1);
    });
}

module.exports = { restoreFromBackup, listBackups }; 