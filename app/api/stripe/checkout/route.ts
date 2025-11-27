import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';

// Price IDs - these need to be created in Stripe Dashboard
const PRICE_IDS = {
  starter: {
    month: process.env.STRIPE_STARTER_MONTHLY_PRICE_ID || '',
    year: process.env.STRIPE_STARTER_ANNUAL_PRICE_ID || '',
  },
  growth: {
    month: process.env.STRIPE_GROWTH_MONTHLY_PRICE_ID || '',
    year: process.env.STRIPE_GROWTH_ANNUAL_PRICE_ID || '',
  },
  pro: {
    month: process.env.STRIPE_PRO_MONTHLY_PRICE_ID || '',
    year: process.env.STRIPE_PRO_ANNUAL_PRICE_ID || '',
  },
};

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = await currentUser();
    const body = await request.json();
    const { plan, interval } = body;

    if (!plan || !['starter', 'growth', 'pro'].includes(plan)) {
      return NextResponse.json(
        { error: 'Invalid plan' },
        { status: 400 }
      );
    }

    if (!interval || !['month', 'year'].includes(interval)) {
      return NextResponse.json(
        { error: 'Invalid billing interval' },
        { status: 400 }
      );
    }

    const priceId = PRICE_IDS[plan as keyof typeof PRICE_IDS][interval as 'month' | 'year'];

    // Check if Stripe is configured
    if (!process.env.STRIPE_SECRET_KEY || !priceId) {
      return NextResponse.json({
        error: 'Payment system not configured',
        message: 'Stripe is not yet configured. Please contact support or try again later.',
      }, { status: 503 });
    }

    // Dynamic import of Stripe to avoid build errors
    const Stripe = (await import('stripe')).default;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16',
    });

    // Create or retrieve customer
    let customerId: string | undefined;
    
    // Check if user already has a customer ID
    const existingCustomers = await stripe.customers.list({
      email: user?.emailAddresses[0]?.emailAddress,
      limit: 1,
    });

    if (existingCustomers.data.length > 0) {
      customerId = existingCustomers.data[0].id;
    } else {
      const customer = await stripe.customers.create({
        email: user?.emailAddresses[0]?.emailAddress,
        metadata: {
          userId,
        },
      });
      customerId = customer.id;
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?canceled=true`,
      metadata: {
        userId,
        plan,
        interval,
      },
      subscription_data: {
        metadata: {
          userId,
          plan,
        },
      },
      allow_promotion_codes: true,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Checkout error:', error);
    
    // Return a graceful error if Stripe isn't configured
    if (error instanceof Error && error.message.includes('API key')) {
      return NextResponse.json({
        error: 'Payment system not configured',
        message: 'Please contact support to complete your subscription.',
      }, { status: 503 });
    }

    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
