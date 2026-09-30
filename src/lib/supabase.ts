import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Sanitize Supabase URL to ensure it is the project root URL without /rest/v1/
export function sanitizeSupabaseUrl(rawUrl: string): string {
  if (!rawUrl) return '';
  return rawUrl.trim().replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
}

// Retrieve credentials from environment variables or localStorage fallback
export function getSupabaseCredentials() {
  const envUrl = (import.meta.env.VITE_SUPABASE_URL as string) || '';
  const envKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || '';

  const storedUrl = typeof window !== 'undefined' ? localStorage.getItem('studyflow_supabase_url') || '' : '';
  const storedKey = typeof window !== 'undefined' ? localStorage.getItem('studyflow_supabase_key') || '' : '';

  const rawUrl = (envUrl.trim() || storedUrl.trim());
  const key = (envKey.trim() || storedKey.trim());
  const url = sanitizeSupabaseUrl(rawUrl);

  return { url, key, isConfigured: Boolean(url && key) };
}

let clientInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  const { url, key, isConfigured } = getSupabaseCredentials();
  if (!isConfigured) {
    return null;
  }
  if (!clientInstance) {
    try {
      clientInstance = createClient(url, key, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      });
    } catch (e) {
      console.error('Failed to initialize Supabase client:', e);
      return null;
    }
  }
  return clientInstance;
}

export function saveSupabaseCredentials(url: string, key: string) {
  const cleanUrl = sanitizeSupabaseUrl(url);
  if (typeof window !== 'undefined') {
    localStorage.setItem('studyflow_supabase_url', cleanUrl);
    localStorage.setItem('studyflow_supabase_key', key.trim());
  }
  clientInstance = null; // force re-creation
  return getSupabaseClient();
}

export function clearSupabaseCredentials() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('studyflow_supabase_url');
    localStorage.removeItem('studyflow_supabase_key');
  }
  clientInstance = null;
}

export const supabase = getSupabaseClient();
