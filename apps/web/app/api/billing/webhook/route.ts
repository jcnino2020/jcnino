import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@frameforge/database';
import Stripe from 'stripe';

const stripeSecret = process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder';
const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_placeholder';
const stripe = new Stripe(stripeSecret, {
  apiVersion: '2024-04-10' as any,
});

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe signature header' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, stripeWebhookSecret);
  } catch (err: any) {
    console.error(`Webhook signature verification failed:`, err.message);
    return NextResponse.json({ error: 'Webhook signature verification failed', details: err.message }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const invoiceId = session.metadata?.invoiceId;

    if (invoiceId) {
      try {
        await prisma.$transaction([
          prisma.invoice.update({
            where: { id: invoiceId },
            data: { isPaid: true },
          }),
          prisma.project.update({
            where: { id: session.metadata?.projectId },
            data: { status: 'COMPLETED' },
          }),
        ]);
        
        console.log(`Invoice ${invoiceId} marked as PAID via webhook transaction.`);
      } catch (dbErr: any) {
        console.error(`Failed to update invoice database records:`, dbErr);
        return NextResponse.json({ error: 'Database update failed' }, { status: 500 });
      }
    }
  }

  return NextResponse.json({ received: true });
}
