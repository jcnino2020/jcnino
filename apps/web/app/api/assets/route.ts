import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@frameforge/database';
import { getServerSession } from 'next-auth';
import { z } from 'zod';

const createAssetSchema = z.object({
  id: z.string().uuid(),
  filename: z.string().min(1),
  size: z.number().int().positive(),
  mimeType: z.string().min(1),
  collectionId: z.string().uuid(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  s3Url: z.string().url(),
  optimizedUrl: z.string().url(),
  exif: z.any().optional(),
  aiTags: z.array(z.string()).optional(),
});

// POST /api/assets - Record newly uploaded asset metadata
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    const userEmail = session?.user?.email;

    const body = await req.json();
    const result = createAssetSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: 'Invalid metadata fields', details: result.error.format() }, { status: 400 });
    }

    const data = result.data;

    const collection = await prisma.collection.findUnique({
      where: { id: data.collectionId },
      include: { workspace: { include: { members: { include: { user: true } } } } },
    });

    if (!collection) {
      return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
    }

    if (userEmail) {
      const isMember = collection.workspace.members.some(m => m.user.email === userEmail);
      if (!isMember) {
        return NextResponse.json({ error: 'Unauthorized workspace access' }, { status: 403 });
      }
    }

    const asset = await prisma.asset.create({
      data: {
        id: data.id,
        filename: data.filename,
        size: BigInt(data.size),
        mimeType: data.mimeType,
        width: data.width,
        height: data.height,
        s3Url: data.s3Url,
        optimizedUrl: data.optimizedUrl,
        exif: data.exif || {},
        aiTags: data.aiTags || [],
        collectionId: data.collectionId,
      },
    });

    await prisma.workspace.update({
      where: { id: collection.workspaceId },
      data: {
        storageUsed: {
          increment: BigInt(data.size),
        },
      },
    });

    const serializedAsset = {
      ...asset,
      size: Number(asset.size),
    };

    return NextResponse.json({ success: true, asset: serializedAsset }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating asset metadata:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}

// GET /api/assets - Retrieve assets in a collection
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const collectionId = searchParams.get('collectionId');
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const order = searchParams.get('order') || 'desc';

    if (!collectionId) {
      return NextResponse.json({ error: 'collectionId parameter is required' }, { status: 400 });
    }

    const skip = (page - 1) * limit;

    const whereClause: any = {
      collectionId: collectionId,
    };

    if (search) {
      whereClause.OR = [
        { filename: { contains: search, mode: 'insensitive' } },
        { aiTags: { has: search } },
      ];
    }

    const [assets, totalCount] = await Promise.all([
      prisma.asset.findMany({
        where: whereClause,
        orderBy: {
          [sortBy]: order,
        },
        skip,
        take: limit,
      }),
      prisma.asset.count({ where: whereClause }),
    ]);

    const serializedAssets = assets.map(a => ({
      ...a,
      size: Number(a.size),
    }));

    return NextResponse.json({
      assets: serializedAssets,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error: any) {
    console.error('Error listing assets:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
