// Test API route for database connectivity (App Router)
import { NextResponse } from 'next/server';
import { playbookService } from '../../../lib/playbook-service';

export async function GET() {
  try {
    console.log('🧪 Testing database connection...');
    
    // Test getting exercises (should work in dev mode with mock data)
    const exercises = await playbookService.getExercises();
    console.log(`✅ Found ${exercises.length} exercises`);
    
    // Test getting user profile (should work in dev mode)
    const profile = await playbookService.getUserProfile('test-user-123');
    console.log('✅ User profile test:', profile ? 'Success' : 'No profile');
    
    // Test progress summary
    const progress = await playbookService.getUserProgressSummary('test-user-123');
    console.log('✅ Progress summary test:', progress);
    
    return NextResponse.json({
      status: 'success',
      message: 'Database service is working!',
      data: {
        exerciseCount: exercises.length,
        hasUserProfile: !!profile,
        progressSummary: progress,
        isDevMode: process.env.NODE_ENV === 'development',
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('❌ Database test failed:', error);
    
    return NextResponse.json({
      status: 'error',
      message: 'Database test failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      isDevMode: process.env.NODE_ENV === 'development',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 