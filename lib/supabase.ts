import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  if (!supabaseInstance) {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
  }

  return supabaseInstance;
}

export interface UserRootProfile {
  id?: string;
  pincode: string;
  city?: string;
  state?: string;
  cultural_roots?: string;
  created_at?: string;
}

/**
 * Save user roots lookup to Supabase (or fallback locally)
 */
export async function saveUserRootDiscovery(profile: UserRootProfile) {
  const client = getSupabaseClient();
  if (!client) {
    // Graceful offline fallback in sessionStorage
    if (typeof window !== 'undefined') {
      try {
        const existing = JSON.parse(sessionStorage.getItem('muse_user_roots') || '[]');
        existing.push({ ...profile, created_at: new Date().toISOString() });
        sessionStorage.setItem('muse_user_roots', JSON.stringify(existing));
      } catch {
        // Ignored
      }
    }
    return { status: 'saved_locally' };
  }

  try {
    const { data, error } = await client.from('user_roots').insert([profile]).select();
    if (error) throw error;
    return { status: 'saved_supabase', data };
  } catch (err) {
    console.warn('Supabase insert error, falling back locally:', err);
    return { status: 'saved_locally' };
  }
}
