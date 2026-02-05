import { supabase } from '@/lib/supabaseClient';

const parseOrder = (order) => {
  if (!order) return null;
  const isDesc = order.startsWith('-');
  const field = isDesc ? order.slice(1) : order;
  return { field, ascending: !isDesc };
};

const normalizeFilter = (query) => {
  if (!query || typeof query !== 'object') return [];
  return Object.entries(query).map(([key, value]) => {
    if (value && typeof value === 'object' && 'eq' in value) {
      return { key, op: 'eq', value: value.eq };
    }
    return { key, op: 'eq', value };
  });
};

const createTableApi = (tableName) => ({
  async list(order = null, limit = null) {
    let query = supabase.from(tableName).select('*');
    const orderConfig = parseOrder(order);
    if (orderConfig) {
      query = query.order(orderConfig.field, { ascending: orderConfig.ascending });
    }
    if (limit) {
      query = query.limit(limit);
    }
    const { data, error } = await query;
    if (error) throw error;
    return data ?? [];
  },
  async filter(queryObj, order = null, limit = null) {
    let query = supabase.from(tableName).select('*');
    const filters = normalizeFilter(queryObj);
    filters.forEach(({ key, op, value }) => {
      if (op === 'eq') query = query.eq(key, value);
    });
    const orderConfig = parseOrder(order);
    if (orderConfig) {
      query = query.order(orderConfig.field, { ascending: orderConfig.ascending });
    }
    if (limit) {
      query = query.limit(limit);
    }
    const { data, error } = await query;
    if (error) throw error;
    return data ?? [];
  },
  async create(payload) {
    const { data, error } = await supabase
      .from(tableName)
      .insert(payload)
      .select('*')
      .single();
    if (error) throw error;
    return data;
  },
  async update(id, payload) {
    const { data, error } = await supabase
      .from(tableName)
      .update(payload)
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw error;
    return data;
  },
  async delete(id) {
    const { error } = await supabase.from(tableName).delete().eq('id', id);
    if (error) throw error;
    return true;
  }
});

const getCurrentUserProfile = async () => {
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  if (!authData?.user) return null;
  const user = authData.user;
  const metadata = user.user_metadata || {};
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();
  if (profileError && profileError.code !== 'PGRST116') {
    throw profileError;
  }
  if (!profile) {
    const { data: createdProfile, error: createError } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        email: user.email,
        full_name: metadata.full_name ?? null,
        username: metadata.username ?? null
      })
      .select('*')
      .single();
    if (createError) throw createError;
    return {
      id: user.id,
      email: user.email,
      ...createdProfile
    };
  }
  return {
    id: user.id,
    email: user.email,
    full_name: metadata.full_name,
    username: metadata.username,
    ...profile
  };
};

const updateCurrentUserProfile = async (payload) => {
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  if (!authData?.user) throw new Error('Not authenticated');
  const userId = authData.user.id;
  const { data, error } = await supabase
    .from('profiles')
    .upsert({ id: userId, email: authData.user.email, ...payload })
    .select('*')
    .single();
  if (error) throw error;
  return data;
};

export const User = {
  async me() {
    return getCurrentUserProfile();
  },
  async list(order = null, limit = null) {
    return createTableApi('profiles').list(order, limit);
  },
  async updateMyUserData(payload) {
    return updateCurrentUserProfile(payload);
  },
  async loginWithGoogle() {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    });
    if (error) throw error;
    return data;
  },
  async logout() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },
  async redirectToLogin() {
    return User.loginWithGoogle();
  }
};

export const PublicProfile = createTableApi('public_profiles');
export const Loan = createTableApi('loans');
export const LoanAgreement = createTableApi('loan_agreements');
export const Payment = createTableApi('payments');
export const PayPalConnection = createTableApi('paypal_connections');
export const VenmoConnection = createTableApi('venmo_connections');
