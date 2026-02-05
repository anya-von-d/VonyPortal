import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';

const AuthContext = createContext();

// Check if running as native app
const isNativeApp = () => Capacitor.isNativePlatform();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authError, setAuthError] = useState(null);
  const authCheckInProgress = useRef(false);

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

  const checkUserAuth = async () => {
    // Prevent duplicate auth checks
    if (authCheckInProgress.current) return;
    authCheckInProgress.current = true;

    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.user) {
        setUser(null);
        setUserProfile(null);
        setIsAuthenticated(false);
        setIsLoadingAuth(false);
        authCheckInProgress.current = false;
        return;
      }

      setUser(session.user);
      setIsAuthenticated(true);
      setIsLoadingAuth(false);

      // Fetch profile in background
      fetchUserProfile(session.user.id);
    } catch (error) {
      console.error('User auth check failed:', error);
      setIsLoadingAuth(false);
      setIsAuthenticated(false);
    }
    authCheckInProgress.current = false;
  };

  useEffect(() => {
    // Handle OAuth callback tokens in URL (for web)
    const handleOAuthCallback = async () => {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');

      if (accessToken && refreshToken) {
        await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken
        });
        window.history.replaceState(null, '', window.location.pathname);
      }
    };

    const init = async () => {
      await handleOAuthCallback();
      await checkUserAuth();
    };

    init();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        setUser(null);
        setUserProfile(null);
        setIsAuthenticated(false);
      } else if (event === 'SIGNED_IN' && session?.user) {
        setUser(session.user);
        setIsAuthenticated(true);
        setIsLoadingAuth(false);
        fetchUserProfile(session.user.id);

        // Close browser if on mobile after successful login
        if (isNativeApp()) {
          try {
            Browser.close();
          } catch (e) {
            // Browser might already be closed
          }
        }
      } else if (event === 'TOKEN_REFRESHED' && session?.user) {
        setUser(session.user);
      }
    });

    // For mobile: re-check auth when app becomes active (after returning from browser login)
    if (isNativeApp()) {
      import('@capacitor/app').then(({ App }) => {
        App.addListener('appStateChange', async ({ isActive }) => {
          if (isActive) {
            console.log('App became active, checking auth...');
            // Small delay to let any pending auth complete
            setTimeout(async () => {
              const { data: { session } } = await supabase.auth.getSession();
              if (session?.user && !user) {
                console.log('Found session after returning to app');
                setUser(session.user);
                setIsAuthenticated(true);
                setIsLoadingAuth(false);
                fetchUserProfile(session.user.id);
                // Close the browser if still open
                try {
                  await Browser.close();
                } catch (e) {}
              }
            }, 500);
          }
        });
      });
    }

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const refreshProfile = async () => {
    if (user?.id) {
      await fetchUserProfile(user.id);
    }
  };

  const logout = (shouldRedirect = true) => {
    setUser(null);
    setUserProfile(null);
    setIsAuthenticated(false);
    supabase.auth.signOut();
    if (shouldRedirect && !isNativeApp()) {
      window.location.href = '/';
    }
  };

  const navigateToLogin = async () => {
    try {
      console.log('Starting login, isNative:', isNativeApp());

      // Always use the website URL for OAuth redirect
      // The website will handle the tokens and the app will pick them up
      const redirectUrl = 'https://lend-with-vony.com';

      if (isNativeApp()) {
        // Mobile: Open OAuth in system browser
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: redirectUrl,
            skipBrowserRedirect: true
          }
        });

        console.log('OAuth response:', { data, error });

        if (error) {
          console.error('OAuth error:', error);
          throw error;
        }

        if (data?.url) {
          console.log('Opening browser with URL:', data.url);
          await Browser.open({
            url: data.url,
            presentationStyle: 'popover'
          });
        }
      } else {
        // Web: Normal OAuth redirect
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: redirectUrl
          }
        });

        if (error) {
          console.error('OAuth error:', error);
          throw error;
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
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
