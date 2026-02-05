import { supabase } from '@/lib/supabaseClient';

export const createPayPalOrder = async (payload) => {
  const { data, error } = await supabase.functions.invoke('create-paypal-order', {
    body: payload
  });
  if (error) {
    throw error;
  }
  return { data };
};
