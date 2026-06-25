import Stripe from 'npm:stripe@14';
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Validate secrets are present before doing anything
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    const priceMap: Record<string, string | undefined> = {
      labs:   Deno.env.get('STRIPE_PRICE_LABS'),
      exam:   Deno.env.get('STRIPE_PRICE_EXAM'),
      bundle: Deno.env.get('STRIPE_PRICE_BUNDLE'),
    };

    if (!stripeKey) throw new Error('STRIPE_SECRET_KEY secret is not set');

    // Get authenticated user
    const authHeader = req.headers.get('Authorization') ?? '';
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: 'Not signed in' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse product from body
    const body = await req.json().catch(() => ({}));
    const product: string = (body.product && priceMap[body.product]) ? body.product : 'bundle';
    const priceId = priceMap[product];

    if (!priceId) throw new Error(`Secret STRIPE_PRICE_${product.toUpperCase()} is not set`);

    const stripe = new Stripe(stripeKey);
    const origin = req.headers.get('origin') ?? Deno.env.get('SITE_URL') ?? 'https://netforgens.com';

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: user.email,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}?payment=success`,
      cancel_url: origin,
      metadata: { user_id: user.id, product },
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('create-checkout-session error:', msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
