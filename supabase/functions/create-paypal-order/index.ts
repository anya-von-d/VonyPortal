import { corsHeaders } from '../_shared/cors.ts';
import { getPayPalAccessToken } from '../_shared/paypal.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { recipientEmail, amount, currency = 'USD', loanId, returnUrl } = body || {};

    if (!recipientEmail || !amount) {
      return new Response(JSON.stringify({ error: 'Missing recipientEmail or amount' }), {
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

    const response = await fetch(`${apiBase}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [
          {
            amount: {
              currency_code: currency,
              value: Number(amount).toFixed(2)
            },
            payee: {
              email_address: recipientEmail
            },
            custom_id: loanId
          }
        ],
        application_context: {
          brand_name: 'Vony',
          landing_page: 'LOGIN',
          user_action: 'PAY_NOW',
          return_url: returnUrl || 'https://example.com',
          cancel_url: returnUrl || 'https://example.com'
        }
      })
    });

    const responseBody = await response.text();
    if (!response.ok) {
      return new Response(JSON.stringify({ error: responseBody }), {
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const order = JSON.parse(responseBody);

    return new Response(JSON.stringify({ orderId: order.id, status: order.status }), {
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
