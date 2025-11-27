import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import stripe from '@/lib/stripe';
import { adminDb } from '@/lib/firebase-admin';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

async function updateUserSubscription(
  userId: string,
  subscriptionData: {
    stripeCustomerId: string;
    subscriptionId: string;
    status: string;
    tier: string;
    currentPeriodEnd: Date;
  }
) {
  const db = adminDb();
  await db.collection('subscriptions').doc(userId).set(subscriptionData, { merge: true });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const headersList = await headers();
    const signature = headersList.get('stripe-signature')!;

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        
        if (userId && session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(
            session.subscription as string
          );
          
          const priceId = subscription.items.data[0].price.id;
          let tier = 'starter';
          if (priceId.includes('growth')) tier = 'growth';
          if (priceId.includes('pro')) tier = 'pro';

          await updateUserSubscription(userId, {
            stripeCustomerId: session.customer as string,
            subscriptionId: subscription.id,
            status: subscription.status,
            tier,
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
          });
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.userId;

        if (userId) {
          const priceId = subscription.items.data[0].price.id;
          let tier = 'starter';
          if (priceId.includes('growth')) tier = 'growth';
          if (priceId.includes('pro')) tier = 'pro';

          await updateUserSubscription(userId, {
            stripeCustomerId: subscription.customer as string,
            subscriptionId: subscription.id,
            status: subscription.status,
            tier,
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
          });
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.userId;

        if (userId) {
          const db = adminDb();
          await db.collection('subscriptions').doc(userId).update({
            status: 'canceled',
            canceledAt: new Date().toISOString(),
          });
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = invoice.subscription as string;
        
        if (subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          const userId = subscription.metadata?.userId;

          if (userId) {
            const db = adminDb();
            await db.collection('subscriptions').doc(userId).update({
              status: 'past_due',
              lastPaymentFailed: new Date().toISOString(),
            });
          }
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}


