import { corsHeaders } from '../_shared/cors.ts';
import { getPayPalAccessToken } from '../_shared/paypal.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { orderId } = body || {};

    if (!orderId) {
      return new Response(JSON.stringify({ error: 'Missing orderId' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const clientId = Deno.env.get('PAYPAL_CLIENT_ID');
    const clientSecret = Deno.env.get('PAYPAL_CLIENT_SECRET');
    const apiBase = Deno.env.get('PAYPAL_API_BASE') ?? 'https://api-m.paypal.com';

    if (!clientId || !clientSecret) {
      return new Response(JSON.stringify({ error: 'PayPal credentials not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const accessToken = await getPayPalAccessToken(clientId, clientSecret, apiBase);

    const response = await fetch(`${apiBase}/v2/checkout/orders/${orderId}/capture`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    const responseBody = await response.text();
    if (!response.ok) {
      return new Response(JSON.stringify({ error: responseBody }), {
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const capture = JSON.parse(responseBody);
    return new Response(JSON.stringify(capture), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
