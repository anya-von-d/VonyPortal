import { supabase } from '@/lib/supabaseClient';

export const capturePayPalOrder = async (payload) => {
  const { data, error } = await supabase.functions.invoke('capture-paypal-order', {
    body: payload
  });
  if (error) {
    throw error;
  }
  return { data };
};
