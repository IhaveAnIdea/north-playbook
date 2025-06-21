import { NextRequest, NextResponse } from 'next/server';
import { generateClient } from 'aws-amplify/api';
import { getCurrentUser } from 'aws-amplify/auth';
import type { Schema } from '../../../amplify/data/resource';

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
    const user = await getCurrentUser();
    if (!user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const body = await request.json();
    
    // Validate required fields
    if (!body.title || !body.description || !body.question) {
      return new NextResponse('Missing required fields: title, description, or question', { status: 400 });
    }

    // Validate that at least one response type is required
    const hasRequiredType = body.requireText || body.requireImage || 
                           body.requireAudio || body.requireVideo || 
                           body.requireDocument;
    
    if (!hasRequiredType) {
      return new NextResponse('At least one response type must be required', { status: 400 });
    }

    const newExercise = await client.models.Exercise.create({
      title: body.title,
      description: body.description,
      category: body.category,
      question: body.question,
      instructions: body.instructions,
      requireText: body.requireText || false,
      requireImage: body.requireImage || false,
      requireAudio: body.requireAudio || false,
      requireVideo: body.requireVideo || false,
      requireDocument: body.requireDocument || false,
      textPrompt: body.textPrompt || null,
      maxTextLength: body.maxTextLength || 1000,
      allowMultipleImages: body.allowMultipleImages || false,
      allowMultipleDocuments: body.allowMultipleDocuments || false,
      allowEditingCompleted: body.allowEditingCompleted || false,
      isActive: body.isActive !== false, // Default to true unless explicitly false
    });

    return NextResponse.json(newExercise);
  } catch (error) {
    console.error('Error creating exercise:', error);
    return new NextResponse('Failed to create exercise', { status: 500 });
  }
} 