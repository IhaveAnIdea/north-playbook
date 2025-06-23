import { NextRequest, NextResponse } from 'next/server';
import { generateClient } from 'aws-amplify/api';
import { getCurrentUser } from 'aws-amplify/auth';
import type { Schema } from '../../../../amplify/data/resource';

const client = generateClient<Schema>();

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }
    const { id } = params;
    const body = await request.json();
    
    // Build update object with all possible fields
    const updateData: Record<string, unknown> = {};
    
    if (body.title !== undefined) updateData.title = body.title;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.category !== undefined) updateData.category = body.category;
    if (body.question !== undefined) updateData.question = body.question;
    if (body.instructions !== undefined) updateData.instructions = body.instructions;
    if (body.requireText !== undefined) updateData.requireText = body.requireText;
    if (body.requireImage !== undefined) updateData.requireImage = body.requireImage;
    if (body.requireAudio !== undefined) updateData.requireAudio = body.requireAudio;
    if (body.requireVideo !== undefined) updateData.requireVideo = body.requireVideo;
    if (body.requireDocument !== undefined) updateData.requireDocument = body.requireDocument;
    if (body.textPrompt !== undefined) updateData.textPrompt = body.textPrompt;
    if (body.maxTextLength !== undefined) updateData.maxTextLength = body.maxTextLength;
    if (body.allowMultipleImages !== undefined) updateData.allowMultipleImages = body.allowMultipleImages;
    if (body.allowMultipleDocuments !== undefined) updateData.allowMultipleDocuments = body.allowMultipleDocuments;
    if (body.allowEditingCompleted !== undefined) updateData.allowEditingCompleted = body.allowEditingCompleted;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;
    
    const updatedExercise = await client.models.Exercise.update({
      id,
      ...updateData,
    });
    return NextResponse.json(updatedExercise);
  } catch (error) {
    console.error('Error updating exercise:', error);
    return new NextResponse('Failed to update exercise', { status: 500 });
  }
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const exercise = await client.models.Exercise.get({ id });
    if (!exercise) {
      return new NextResponse('Exercise not found', { status: 404 });
    }
    return NextResponse.json(exercise);
  } catch (error) {
    console.error('Error fetching exercise:', error);
    return new NextResponse('Failed to fetch exercise', { status: 500 });
  }
} 