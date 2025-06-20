import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('📝 API route called for playbook entry creation');
    const playbookData = await request.json();
    console.log('📦 Received data in API route:', JSON.stringify(playbookData, null, 2));
    
    // For now, return success and let the client-side Amplify handle the actual creation
    // This avoids server-side Amplify configuration issues
    console.log('✅ API route returning success (client should handle Amplify creation)');

    return NextResponse.json({
      success: true,
      message: 'API route received data, client should handle Amplify creation directly',
      data: playbookData
    });

  } catch (error) {
    console.error('❌ Error in playbook API route:', error);
    return NextResponse.json(
      { 
        error: 'API route error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET endpoint to check API status
export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Playbook API route is active',
    note: 'Client-side handles Amplify operations directly'
  });
} 