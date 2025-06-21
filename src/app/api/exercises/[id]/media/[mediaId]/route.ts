import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from 'aws-amplify/auth';
import { remove } from 'aws-amplify/storage';
import { generateClient } from 'aws-amplify/api';
import type { Schema } from '../../../../../../amplify/data/resource';

const client = generateClient<Schema>();

export async function DELETE(request: NextRequest, { params }: { params: { id: string, mediaId: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }
    const { mediaId } = params;
    const asset = await client.models.MediaAsset.get({ id: mediaId });
    if (!asset) {
      return new NextResponse('Media asset not found', { status: 404 });
    }
    await remove({ key: asset.s3Key });
    await client.models.MediaAsset.delete({ id: mediaId });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting media asset:', error);
    return new NextResponse('Failed to delete media', { status: 500 });
  }
} 