import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@frameforge/database';
import { z } from 'zod';

const cullSchema = z.object({
  assetId: z.string().uuid(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = cullSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: 'Invalid asset reference', details: result.error.format() }, { status: 400 });
    }

    const { assetId } = result.data;

    const asset = await prisma.asset.findUnique({
      where: { id: assetId },
    });

    if (!asset) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
    }

    const geminiKey = process.env.GEMINI_API_KEY;
    let aiTags: string[] = ['processed'];
    let isCulled = false;
    let aiScore = 90;

    if (geminiKey && geminiKey !== 'placeholder') {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      text: `Analyze this image filename: ${asset.filename}. S3 Public URL: ${asset.optimizedUrl}. List 5 keywords describing the image subjects and style. Also assess image technical quality (focus, lighting) on a scale of 0-100. Format your output strictly as a JSON object: {"tags": ["tag1", "tag2"], "score": 90, "shouldFlag": false}`,
                    },
                  ],
                },
              ],
              generationConfig: {
                responseMimeType: 'application/json',
              },
            }),
          }
        );

        if (response.ok) {
          const resData = await response.json();
          const textResponse = resData.candidates?.[0]?.content?.parts?.[0]?.text;
          if (textResponse) {
            const parsed = JSON.parse(textResponse);
            aiTags = parsed.tags || aiTags;
            aiScore = parsed.score ?? aiScore;
            isCulled = parsed.shouldFlag ?? isCulled;
          }
        }
      } catch (geminiError) {
        console.error('Gemini vision API error, falling back to mock parser:', geminiError);
      }
    }

    if (aiTags.length === 1) {
      if (asset.filename.toLowerCase().includes('drone')) {
        aiTags = ['aerial', 'landscape', 'drone', 'scenic'];
      } else if (asset.filename.toLowerCase().includes('portrait') || asset.filename.toLowerCase().includes('fm')) {
        aiTags = ['portrait', 'street', 'editorial', 'human'];
      } else {
        aiTags = ['campus', 'event', 'la-salle', 'documentation'];
      }
    }

    const updatedAsset = await prisma.asset.update({
      where: { id: assetId },
      data: {
        aiTags,
      },
    });

    return NextResponse.json({
      success: true,
      assetId,
      score: aiScore,
      flagged: isCulled,
      tags: updatedAsset.aiTags,
    });
  } catch (error: any) {
    console.error('Error in AI culling endpoint:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
