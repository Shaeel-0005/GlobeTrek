import { createClient } from '@supabase/supabase-js';

/* ======================
   ENV VALIDATION (FAIL FAST)
   ====================== */

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL?.trim();
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  const missing = [
    !SUPABASE_URL && 'VITE_SUPABASE_URL',
    !SUPABASE_ANON_KEY && 'VITE_SUPABASE_ANON_KEY',
  ].filter(Boolean).join(', ');

  throw new Error(
    `❌ Missing environment variables: ${missing}\n` +
    `✅ Add them to .env.local and restart the dev server`
  );
}

// Basic JWT sanity check (future-proof)
if (!SUPABASE_ANON_KEY.startsWith('eyJ')) {
  throw new Error('❌ Invalid Supabase anon key format');
}

/* ======================
   SUPABASE CLIENT
   ====================== */

export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: 'globetrek-auth',
    },
  }
);

/* ======================
   SESSION CACHE
   ====================== */

let sessionCache = null;
let cacheTimestamp = 0;
const SESSION_CACHE_TTL = 5000;

const getFreshSession = async () => {
  if (sessionCache && Date.now() - cacheTimestamp < SESSION_CACHE_TTL) {
    return sessionCache;
  }

  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;

  sessionCache = data?.session ?? null;
  cacheTimestamp = Date.now();
  return sessionCache;
};

/* ======================
   AUTH HELPERS
   ====================== */

export const isAuthenticated = async () => {
  try {
    const session = await getFreshSession();
    return { isAuth: !!session, session, error: null };
  } catch (error) {
    sessionCache = null;
    return {
      isAuth: false,
      session: null,
      error: error instanceof Error ? error : new Error('Auth check failed'),
    };
  }
};

export const getCurrentUserProfile = async () => {
  try {
    const session = await getFreshSession();
    if (!session?.user) throw new Error('Session expired');

    const user = session.user;

    const { data: profile, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (error) throw error;
    if (profile) return { user, profile, error: null };

    const name =
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.email?.split('@')[0] ||
      'Traveler';

    const { data: newProfile, error: insertError } = await supabase
      .from('users')
      .insert({
        id: user.id,
        email: user.email,
        name,
      })
      .select('*')
      .maybeSingle();

    if (insertError?.code === '23505') {
      const { data: recovered, error: recoverError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (recoverError) throw recoverError;
      return { user, profile: recovered, error: null };
    }

    if (insertError) throw insertError;

    return { user, profile: newProfile, error: null };
  } catch (error) {
    return {
      user: null,
      profile: null,
      error: error instanceof Error ? error : new Error('Profile error'),
    };
  }
};

/* ======================
   AUTH STATE HANDLING
   ====================== */

supabase.auth.onAuthStateChange((event) => {
  if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
    sessionCache = null;
    cacheTimestamp = 0;
  }
});

/* ======================
   DEV DEBUG
   ====================== */

if (import.meta.env.DEV) {
  console.log('✅ Supabase client initialized');
  console.log(
    'Project:',
    SUPABASE_URL.replace('https://', '').split('.')[0] + '...'
  );
}
