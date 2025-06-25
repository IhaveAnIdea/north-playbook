import { NextRequest, NextResponse } from 'next/server';
import { generateClient } from 'aws-amplify/api';
import { getCurrentUser } from 'aws-amplify/auth';
import { Amplify } from 'aws-amplify';
import type { Schema } from '../../../../amplify/data/resource';
import amplifyConfig from '../../../../amplify_outputs.json';

// Configure Amplify for server-side usage
Amplify.configure(amplifyConfig, { ssr: true });

const client = generateClient<Schema>();

export async function GET() {
  try {
    const exercises = await client.models.Exercise.list();
    return NextResponse.json(exercises);
  } catch (error) {
    console.error('Error fetching exercises:', error);
    return new NextResponse('Failed to fetch exercises', { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Starting exercise creation...');
    
    const user = await getCurrentUser();
    if (!user) {
      console.error('❌ No authenticated user found');
      return new NextResponse('Unauthorized', { status: 401 });
    }
    console.log('✅ User authenticated:', user.userId);

    const body = await request.json();
    console.log('📥 Request body received:', body);
    
    // Validate required fields
    if (!body.title || !body.description || !body.question) {
      console.error('❌ Missing required fields:', { 
        title: !!body.title, 
        description: !!body.description, 
        question: !!body.question 
      });
      return new NextResponse('Missing required fields: title, description, or question', { status: 400 });
    }

    // Collect OR types to store in instructions field 
    const orTypes = [];
    if (body.requireText === 'or') orTypes.push('text');
    if (body.requireImage === 'or') orTypes.push('image');
    if (body.requireAudio === 'or') orTypes.push('audio');
    if (body.requireVideo === 'or') orTypes.push('video');
    if (body.requireDocument === 'or') orTypes.push('document');

    // Handle single OR as required logic
    let finalRequireText = body.requireText;
    let finalRequireImage = body.requireImage;
    let finalRequireAudio = body.requireAudio;
    let finalRequireVideo = body.requireVideo;
    let finalRequireDocument = body.requireDocument;

    if (orTypes.length === 1) {
      // Convert single OR to required
      if (body.requireText === 'or') finalRequireText = 'required';
      if (body.requireImage === 'or') finalRequireImage = 'required';
      if (body.requireAudio === 'or') finalRequireAudio = 'required';
      if (body.requireVideo === 'or') finalRequireVideo = 'required';
      if (body.requireDocument === 'or') finalRequireDocument = 'required';
    }

    // Validate at least one requirement
    const hasRequirement = finalRequireText !== 'not_required' || 
                          finalRequireImage !== 'not_required' || 
                          finalRequireAudio !== 'not_required' || 
                          finalRequireVideo !== 'not_required' || 
                          finalRequireDocument !== 'not_required';
    
    if (!hasRequirement) {
      return new NextResponse('At least one response type must be required', { status: 400 });
    }

    // Create enhanced instructions with OR logic embedded
    let enhancedInstructions = body.instructions || '';
    if (orTypes.length > 1) {
      enhancedInstructions += `\n\n[OR_TYPES:${orTypes.join(',')}]`;
    }

    console.log('📝 Creating exercise with data:', {
      title: body.title,
      description: body.description,
      category: body.category,
      question: body.question,
      instructions: enhancedInstructions,
      requireText: finalRequireText,
      requireImage: finalRequireImage,
      requireAudio: finalRequireAudio,
      requireVideo: finalRequireVideo,
      requireDocument: finalRequireDocument,
    });

    const newExercise = await client.models.Exercise.create({
      title: body.title,
      description: body.description,
      category: body.category,
      question: body.question,
      instructions: enhancedInstructions,
      requireText: finalRequireText,
      requireImage: finalRequireImage,
      requireAudio: finalRequireAudio,
      requireVideo: finalRequireVideo,
      requireDocument: finalRequireDocument,
      textPrompt: body.textPrompt || null,
      maxTextLength: body.maxTextLength || 1000,
      allowMultipleImages: body.allowMultipleImages || false,
      allowMultipleDocuments: body.allowMultipleDocuments || false,
      allowEditingCompleted: body.allowEditingCompleted || false,
      isActive: body.isActive !== false,
    });

    console.log('✅ Exercise created successfully:', newExercise.data?.id);
    return NextResponse.json(newExercise);
  } catch (error) {
    console.error('💥 Error creating exercise:', error);
    
    // Enhanced error logging
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    
    return new NextResponse(`Failed to create exercise: ${error instanceof Error ? error.message : String(error)}`, { status: 500 });
  }
} 