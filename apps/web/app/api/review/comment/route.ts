import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@frameforge/database';
import { z } from 'zod';

const createCommentSchema = z.object({
  invoiceId: z.string().uuid(),
  authorName: z.string().min(1),
  content: z.string().min(1),
  timestamp: z.number().optional(),
  drawingJson: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = createCommentSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: 'Invalid comment details', details: result.error.format() }, { status: 400 });
    }

    const { invoiceId, authorName, content, timestamp, drawingJson } = result.data;

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
    });

    if (!invoice) {
      return NextResponse.json({ error: 'Linked invoice not found' }, { status: 404 });
    }

    const comment = await prisma.comment.create({
      data: {
        invoiceId,
        authorName,
        content,
        timestamp: timestamp ?? null,
        drawingJson: drawingJson ?? null,
      },
    });

    return NextResponse.json({ success: true, comment }, { status: 201 });
  } catch (error: any) {
    console.error('Error posting review comment:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const invoiceId = searchParams.get('invoiceId');

    if (!invoiceId) {
      return NextResponse.json({ error: 'invoiceId parameter is required' }, { status: 400 });
    }

    const comments = await prisma.comment.findMany({
      where: { invoiceId },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({ comments });
  } catch (error: any) {
    console.error('Error fetching comments:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
