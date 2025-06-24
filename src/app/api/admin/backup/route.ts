import { NextResponse } from 'next/server';
import { generateClient } from 'aws-amplify/api';
import { Amplify } from 'aws-amplify';
import type { Schema } from '../../../../../amplify/data/resource';
import amplifyConfig from '../../../../../amplify_outputs.json';

// Configure Amplify for server-side usage
Amplify.configure(amplifyConfig, { ssr: true });

const client = generateClient<Schema>();

export async function GET() {
  try {
    const timestamp = new Date().toISOString();
    
    console.log('🔄 Starting backup at', timestamp);
    
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
        timestamp,
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

    console.log('✅ Backup completed successfully!');
    console.log(`📊 Total records backed up: ${Object.values(backup.metadata.totalRecords).reduce((a, b) => a + b, 0)}`);
    
    return NextResponse.json({
      success: true,
      backup,
      summary: backup.metadata
    });
    
  } catch (error) {
    console.error('❌ Backup failed:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
} 