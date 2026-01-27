import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pxgqvfibmvcpuunltzkm.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB4Z3F2ZmlibXZjcHV1bmx0emttIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0MDE1NDksImV4cCI6MjA4NDk3NzU0OX0.XMXau4ZCIFAgwy2BeXxQFF-pmOdvx9yHYi5w1o2HnQA';

// Enhanced Supabase client with better configuration
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Persist session in localStorage
    persistSession: true,
    // Auto refresh tokens
    autoRefreshToken: true,
    // Detect session from URL (for email confirmations)
    detectSessionInUrl: true,
    // Storage key for session
    storageKey: 'globetrek-auth',
  },
  global: {
    headers: {
      'X-Client-Info': 'globetrek-web',
    },
  },
});

// Helper function to check if user is authenticated
export const isAuthenticated = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    return { isAuth: !!session, session, error };
  } catch (error) {
    console.error('Auth check error:', error);
    return { isAuth: false, session: null, error };
  }
};

// Helper function to get current user profile
export const getCurrentUserProfile = async () => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      throw new Error('No authenticated user');
    }

    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) {
      throw profileError;
    }

    return { user, profile, error: null };
  } catch (error) {
    console.error('Get user profile error:', error);
    return { user: null, profile: null, error };
  }
};

// Helper to sign out
export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return { success: true, error: null };
  } catch (error) {
    console.error('Sign out error:', error);
    return { success: false, error };
  }
};
