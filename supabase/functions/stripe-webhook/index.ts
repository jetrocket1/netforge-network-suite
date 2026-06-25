import Stripe from 'npm:stripe@14';
import { createClient } from 'npm:@supabase/supabase-js@2';

const VALID_PRODUCTS = new Set(['labs', 'exam', 'bundle']);

Deno.serve(async (req) => {
  try {
    const stripeKey     = Deno.env.get('STRIPE_SECRET_KEY');
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

    if (!stripeKey)     throw new Error('STRIPE_SECRET_KEY secret is not set');
    if (!webhookSecret) throw new Error('STRIPE_WEBHOOK_SECRET secret is not set');

    const signature = req.headers.get('stripe-signature');
    if (!signature) {
      return new Response('Missing stripe-signature header', { status: 400 });
    }

    const stripe = new Stripe(stripeKey);

    let event: Stripe.Event;
    try {
      const body = await req.text();
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Signature verification failed';
      console.error('Webhook signature error:', msg);
      return new Response('Webhook signature verification failed', { status: 400 });
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId  = session.metadata?.user_id;
      const product = session.metadata?.product;

      if (!userId) {
        console.error('Webhook missing user_id in metadata', session.id);
        return new Response('No user_id in metadata', { status: 400 });
      }

      // Reject unexpected product values before touching the DB
      if (!product || !VALID_PRODUCTS.has(product)) {
        console.error('Unknown product in metadata:', product);
        return new Response('Unknown product', { status: 400 });
      }

      const updates: Record<string, boolean> =
        product === 'labs' ? { has_labs: true } :
        product === 'exam' ? { has_exam: true } :
                             { has_labs: true, has_exam: true, is_pro: true };

      const supabase = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      );

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId);

      if (error) {
        console.error('Profile update failed:', error.message);
        return new Response('DB update failed', { status: 500 });
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('stripe-webhook error:', msg);
    return new Response('Internal server error', { status: 500 });
  }
});
