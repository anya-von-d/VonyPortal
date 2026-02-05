import { supabase } from '@/lib/supabaseClient';

export const getPayPalClientId = async () => {
  const { data, error } = await supabase.functions.invoke('get-paypal-client-id');
  if (error) {
    throw error;
  }
  return { data };
};
