import { NextRequest, NextResponse } from 'next/server';
import { postgresService } from '@/lib/aurora-postgresql-service';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // Validate required fields
    if (!data.exerciseId) {
      return NextResponse.json(
        { error: 'Missing required field: exerciseId' },
        { status: 400 }
      );
    }

    // Convert to the format expected by PostgreSQL service
    const dbResponse = await postgresService.saveExerciseResponse({
      exerciseId: data.exerciseId,
      userId: 'dev-user',
      responseText: data.responseText,
      audioS3Key: data.s3Key,
      videoS3Key: data.s3Key && data.videoUrl ? data.s3Key : undefined,
      imageS3Keys: data.imageS3Keys || [],
      s3Bucket: 'north-playbook',
      analysisResult: data.analysisResult || {},
      insights: data.insights ? [data.insights] : [],
      mood: data.mood,
      tags: data.tags || [],
      completionTimeSeconds: undefined,
      confidenceRating: undefined,
      sentimentScore: undefined,
      pineconeId: undefined,
      metadata: {}
    });
    
    // Convert back to SavedExerciseResponse format for the client
    const clientResponse = {
      id: dbResponse.id,
      exerciseId: dbResponse.exerciseId,
      userId: dbResponse.userId,
      responseText: dbResponse.responseText,
      audioUrl: data.audioUrl,
      videoUrl: data.videoUrl,
      s3Key: dbResponse.audioS3Key || dbResponse.videoS3Key,
      mood: dbResponse.mood,
      tags: dbResponse.tags,
      insights: dbResponse.insights.join('; '),
      analysisResult: dbResponse.analysisResult,
      imageS3Keys: dbResponse.imageS3Keys,
      createdAt: dbResponse.createdAt.toISOString(),
      updatedAt: dbResponse.updatedAt.toISOString(),
    };

    return NextResponse.json(
      { 
        success: true, 
        data: clientResponse,
        message: 'Exercise response saved successfully' 
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error saving exercise response:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to save exercise response'
      },
      { status: 500 }
    );
  }
} 