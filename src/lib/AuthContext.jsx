import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Fetch full profile from profiles table
  const fetchUserProfile = async (userId) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (!error && profile) {
        setUserProfile(profile);
        return profile;
      }
    } catch (e) {
      console.log('Profile fetch error:', e);
    }
    return null;
  };

  useEffect(() => {
    const handleAuth = async () => {
      // Check for tokens in URL hash (OAuth callback)
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');

      if (accessToken && refreshToken) {
        // Manually set the session from URL params
        await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken
        });
        // Clear the hash from URL after setting session
        window.history.replaceState(null, '', window.location.pathname);
      }

      await checkUserAuth();
    };

    handleAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!session?.user) {
        setUser(null);
        setUserProfile(null);
        setIsAuthenticated(false);
        return;
      }
      await checkUserAuth();
    });
    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const checkUserAuth = async () => {
    try {
      setIsLoadingAuth(true);

      const { data: sessionData } = await supabase.auth.getSession();
      const { data: authData, error } = await supabase.auth.getUser();

      if (error || !authData?.user) {
        setUser(null);
        setUserProfile(null);
        setIsAuthenticated(false);
        setIsLoadingAuth(false);
        return;
      }

      setUser(authData.user);
      setIsAuthenticated(true);

      // Fetch profile in parallel - don't block auth
      fetchUserProfile(authData.user.id);

      setIsLoadingAuth(false);
    } catch (error) {
      console.error('User auth check failed:', error);
      setIsLoadingAuth(false);
      setIsAuthenticated(false);
    }
  };

  const refreshProfile = async () => {
    if (user?.id) {
      await fetchUserProfile(user.id);
    }
  };

  const logout = (shouldRedirect = true) => {
    setUser(null);
    setIsAuthenticated(false);
    supabase.auth.signOut();
    if (shouldRedirect) {
      window.location.href = '/';
    }
  };

  const navigateToLogin = () => {
    // Use production URL for OAuth redirect (works for both web and mobile)
    const redirectUrl = 'https://lend-with-vony.com';

    supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: redirectUrl }
    });
  };

  return (
    <AuthContext.Provider value={{
      user,
      userProfile,
      isAuthenticated,
      isLoadingAuth,
      authError,
      logout,
      navigateToLogin,
      checkUserAuth,
      refreshProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
