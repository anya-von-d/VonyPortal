import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';

const AuthContext = createContext();

// Check if running as native app - safely handle when Capacitor isn't available
const isNativeApp = () => {
  try {
    // Dynamic import check
    if (typeof window !== 'undefined' && window.Capacitor) {
      return window.Capacitor.isNativePlatform();
    }
    return false;
  } catch {
    return false;
  }
};

// Deep link URL for OAuth callback
const DEEP_LINK_CALLBACK = 'com.vony.lend://auth/callback';

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
        console.log('Found tokens in URL hash, setting session...');
        await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken
        });
        window.history.replaceState(null, '', window.location.pathname);
      }
    };

    // Handle deep link URL (for mobile OAuth callback)
    const handleDeepLink = async (url) => {
      console.log('Handling deep link:', url);

      // Parse the URL for tokens
      const hashIndex = url.indexOf('#');
      if (hashIndex === -1) return;

      const hashParams = new URLSearchParams(url.substring(hashIndex + 1));
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');

      if (accessToken && refreshToken) {
        console.log('Found tokens in deep link, setting session...');
        try {
          await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });
          console.log('Session set successfully from deep link');

          // Close the browser if on native
          if (isNativeApp()) {
            try {
              const { Browser } = await import('@capacitor/browser');
              await Browser.close();
            } catch (e) {
              console.log('Browser already closed or not available');
            }
          }
        } catch (e) {
          console.error('Error setting session from deep link:', e);
        }
      }
    };

    const init = async () => {
      await handleOAuthCallback();
      await checkUserAuth();
    };

    init();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state change:', event);
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
            const { Browser } = await import('@capacitor/browser');
            await Browser.close();
          } catch (e) {
            // Browser might already be closed or not available
          }
        }
      } else if (event === 'TOKEN_REFRESHED' && session?.user) {
        setUser(session.user);
      }
    });

    // For mobile: listen for deep links (OAuth callback) and app state changes
    let appUrlListener = null;
    let appStateListener = null;

    const setupMobileListeners = async () => {
      if (isNativeApp()) {
        try {
          const { App: CapApp } = await import('@capacitor/app');
          const { Browser } = await import('@capacitor/browser');

          // Listen for deep link URLs (OAuth callback)
          appUrlListener = await CapApp.addListener('appUrlOpen', async ({ url }) => {
            console.log('App URL opened:', url);
            if (url.startsWith('com.vony.lend://auth/callback')) {
              await handleDeepLink(url);
            }
          });

          // Also re-check auth when app becomes active
          appStateListener = await CapApp.addListener('appStateChange', async ({ isActive }) => {
            if (isActive) {
              console.log('App became active, checking auth...');
              setTimeout(async () => {
                const { data: { session } } = await supabase.auth.getSession();
                if (session?.user && !user) {
                  console.log('Found session after returning to app');
                  setUser(session.user);
                  setIsAuthenticated(true);
                  setIsLoadingAuth(false);
                  fetchUserProfile(session.user.id);
                  try {
                    await Browser.close();
                  } catch (e) {}
                }
              }, 500);
            }
          });
        } catch (e) {
          console.log('Capacitor plugins not available:', e);
        }
      }
    };

    setupMobileListeners();

    return () => {
      subscription?.unsubscribe();
      if (appUrlListener) appUrlListener.remove();
      if (appStateListener) appStateListener.remove();
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

      if (isNativeApp()) {
        // Mobile: Use Browser plugin to open OAuth in system browser
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: DEEP_LINK_CALLBACK,
            skipBrowserRedirect: true
          }
        });

        if (error) {
          console.error('OAuth error:', error);
          throw error;
        }

        if (data?.url) {
          console.log('Opening OAuth URL in browser:', data.url);
          try {
            const { Browser } = await import('@capacitor/browser');
            await Browser.open({ url: data.url });
          } catch (e) {
            console.error('Failed to open browser:', e);
            // Fallback to window.open
            window.open(data.url, '_blank');
          }
        }
      } else {
        // Web: Normal OAuth redirect
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: 'https://lend-with-vony.com'
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
