import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Since we're in development mode and there are schema mismatches between
    // the frontend (Amplify) and backend (postgres service), let's provide
    // a simple debug response
    
    return NextResponse.json({
      success: true,
      data: {
        userId,
        systemMode: 'development',
        message: 'Debug data is currently limited in development mode. The system uses Amplify on the frontend but different services on the backend.',
        totalResponses: 0,
        responses: [],
        completedResponses: [],
        totalPlaybookEntries: 0,
        playbookEntries: [],
        totalExercises: 3, // Default exercises
        exercises: [
          { id: '1', title: 'Daily Gratitude Reflection', isActive: true },
          { id: '2', title: 'Vision Board Creation', isActive: true },
          { id: '3', title: 'Mindfulness Check-in', isActive: true }
        ],
        recommendation: 'Complete exercises using the frontend to see them appear in your playbook automatically'
      }
    });

  } catch (error) {
    console.error('Error in debug API:', error);
    return NextResponse.json(
      { 
        error: 'Debug API error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 