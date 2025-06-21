import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // For now, return empty array since we're creating entries directly on the client side
    // The client-side playbook component should fetch entries directly using Amplify
    return NextResponse.json({
      success: true,
      data: [],
      count: 0,
      message: 'Playbook entries should be fetched directly from Amplify on the client side'
    });

  } catch (error) {
    console.error('Error in playbook entries API:', error);
    return NextResponse.json(
      { 
        error: 'API error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 