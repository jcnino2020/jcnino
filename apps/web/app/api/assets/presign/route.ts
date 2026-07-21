import { NextRequest, NextResponse } from 'next/server';
import { getUploadPresignedUrl, getPublicAssetUrl } from '@frameforge/storage';
import { prisma } from '@frameforge/database';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { randomUUID } from 'crypto';

const presignSchema = z.object({
  filename: z.string().min(1),
  mimeType: z.string().min(1),
  collectionId: z.string().uuid(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    const userEmail = session?.user?.email;
    
    const body = await req.json();
    const result = presignSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: 'Invalid input parameters', details: result.error.format() }, { status: 400 });
    }
    
    const { filename, mimeType, collectionId } = result.data;
    
    const collection = await prisma.collection.findUnique({
      where: { id: collectionId },
      include: { workspace: { include: { members: { include: { user: true } } } } },
    });
    
    if (!collection) {
      return NextResponse.json({ error: 'Target collection not found' }, { status: 404 });
    }
    
    if (userEmail) {
      const isMember = collection.workspace.members.some(m => m.user.email === userEmail);
      if (!isMember) {
        return NextResponse.json({ error: 'Unauthorized workspace access' }, { status: 403 });
      }
    }

    const fileId = randomUUID();
    const sanitizedFilename = encodeURIComponent(filename.replace(/\s+/g, '-'));
    const storageKey = `workspaces/${collection.workspaceId}/collections/${collectionId}/${fileId}-${sanitizedFilename}`;
    
    const uploadUrl = await getUploadPresignedUrl(storageKey, mimeType);
    const publicUrl = getPublicAssetUrl(storageKey);
    
    return NextResponse.json({
      uploadUrl,
      publicUrl,
      storageKey,
      fileId,
    });
  } catch (error: any) {
    console.error('Error generating pre-signed URL:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
