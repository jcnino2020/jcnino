import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@frameforge/database';
import { z } from 'zod';
import Stripe from 'stripe';

const stripeSecret = process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder';
const stripe = new Stripe(stripeSecret, {
  apiVersion: '2024-04-10' as any,
});

const createCheckoutSchema = z.object({
  invoiceId: z.string().uuid(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = createCheckoutSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: 'Invalid invoice reference', details: result.error.format() }, { status: 400 });
    }

    const { invoiceId } = result.data;

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { project: { include: { workspace: true } } },
    });

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    if (invoice.isPaid) {
      return NextResponse.json({ error: 'Invoice has already been settled' }, { status: 400 });
    }

    const origin = req.headers.get('origin') || 'http://localhost:3000';
    const clientReviewUrl = `${origin}/review/${invoice.projectId}`;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Project Payment: ${invoice.project.name}`,
              description: `Escrow Lock Delivery Balance for FrameForge Studio Workspace`,
            },
            unit_amount: Math.round(Number(invoice.amount) * 100),
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${clientReviewUrl}?payment_status=success&invoice_id=${invoiceId}`,
      cancel_url: `${clientReviewUrl}?payment_status=cancelled`,
      metadata: {
        invoiceId: invoice.id,
        projectId: invoice.projectId,
        workspaceId: invoice.project.workspaceId,
      },
    });

    await prisma.invoice.update({
      where: { id: invoiceId },
      data: { stripeId: session.id },
    });

    return NextResponse.json({
      url: session.url,
      sessionId: session.id,
    });
  } catch (error: any) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
