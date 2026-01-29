import { createClient } from '@supabase/supabase-js';

// Runtime validation - app won't start if env vars missing
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase env vars. Check deployment dashboard.');
  // Don't throw in production - show user-friendly error instead
  if (typeof window !== 'undefined') {
    console.error('App misconfigured - contact support');
  }
}

// Prevent multiple instances (memory leak fix for SPAs)
let supabaseInstance = null;

export const getSupabase = () => {
  if (supabaseInstance) return supabaseInstance;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    // Return dummy client to prevent crashes (graceful degradation)
    return {
      auth: { getSession: () => Promise.resolve({ data: { session: null } }) },
      from: () => ({ select: () => ({ data: null, error: new Error('Config error') }) }),
    };
  }

  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: 'globetrek-auth',
      flowType: 'pkce', // More secure
    },
    global: {
      headers: { 'X-Client-Info': 'globetrek-prod' },
      // Essential for travel apps: retry on spotty connections
      fetch: async (url, options = {}) => {
        const MAX_RETRIES = 3;
        const TIMEOUT = 20000; // 20s for slow hotel/airport WiFi
        
        for (let i = 0; i < MAX_RETRIES; i++) {
          try {
            const controller = new AbortController();
            const id = setTimeout(() => controller.abort(), TIMEOUT);
            const res = await fetch(url, { ...options, signal: controller.signal });
            clearTimeout(id);
            return res;
          } catch (err) {
            if (i === MAX_RETRIES - 1) throw err;
            await new Promise(r => setTimeout(r, 1000 * Math.pow(2, i))); // Exponential backoff
          }
        }
      },
    },
  });
  
  return supabaseInstance;
};

export const supabase = getSupabase();

// Cache auth checks (critical for performance in production)
let sessionCache = null;
let cacheTime = 0;
const CACHE_TTL = 8000; // 8 seconds

export const isAuthenticated = async () => {
  try {
    if (sessionCache && Date.now() - cacheTime < CACHE_TTL) {
      return { isAuth: true, session: sessionCache, error: null };
    }
    
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    
    if (session) {
      sessionCache = session;
      cacheTime = Date.now();
    }
    
    return { isAuth: !!session, session, error: null };
  } catch (error) {
    return { isAuth: false, session: null, error };
  }
};

export const getCurrentUserProfile = async () => {
  try {
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) throw authErr || new Error('Not authenticated');
    
    // Single query with joins (faster than multiple queries)
    const { data: profile, error } = await supabase
      .from('users')
      .select(`*, preferences:user_preferences(*)`)
      .eq('id', user.id)
      .single();
      
    if (error && error.code === 'PGRST116') {
      // Auto-create profile for new OAuth users
      const { data: newProfile, error: createErr } = await supabase
        .from('users')
        .insert({ 
          id: user.id, 
          email: user.email,
          display_name: user.user_metadata?.full_name || user.email?.split('@')[0],
          created_at: new Date().toISOString()
        })
        .select()
        .single();
        
      if (createErr) throw createErr;
      return { user, profile: newProfile, error: null };
    }
    
    if (error) throw error;
    return { user, profile, error: null };
  } catch (error) {
    return { user: null, profile: null, error };
  }
};

export const signOut = async () => {
  sessionCache = null;
  cacheTime = 0;
  const { error } = await supabase.auth.signOut({ scope: 'global' });
  return { success: !error, error };
};

// Cleanup helper for React useEffect
export const onAuthStateChange = (callback) => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN') {
      sessionCache = session;
      cacheTime = Date.now();
    } else if (event === 'SIGNED_OUT') {
      sessionCache = null;
    }
    callback(event, session);
  });
  return () => subscription?.unsubscribe();
};