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
    const { description } = body;
    if (!description) {
      return new NextResponse('Description is required', { status: 400 });
    }
    const updatedExercise = await client.models.Exercise.update({
      id,
      description
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