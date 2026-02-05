export const getPayPalAccessToken = async (clientId: string, clientSecret: string, apiBase: string) => {
  const authString = btoa(`${clientId}:${clientSecret}`);
  const response = await fetch(`${apiBase}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${authString}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials'
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`PayPal auth failed: ${errorText}`);
  }

  const data = await response.json();
  return data.access_token as string;
};
