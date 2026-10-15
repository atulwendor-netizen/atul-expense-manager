import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Environment variables or client storage overrides
const getSupabaseConfig = () => {
  const metaEnv = (import.meta as unknown as { env?: Record<string, string> }).env || {};
  let url = metaEnv.VITE_SUPABASE_URL || '';
  let anonKey = metaEnv.VITE_SUPABASE_ANON_KEY || '';

  if (typeof window !== 'undefined' && window.localStorage) {
    const savedUrl = window.localStorage.getItem('atul_expense_manager_supabase_url');
    const savedKey = window.localStorage.getItem('atul_expense_manager_supabase_key');
    if (savedUrl && savedKey) {
      url = savedUrl;
      anonKey = savedKey;
    }
  }

  return { url, anonKey };
};

let clientInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  const { url, anonKey } = getSupabaseConfig();
  if (!url || !anonKey || url === 'YOUR_SUPABASE_URL' || anonKey === 'YOUR_SUPABASE_ANON_KEY') {
    return null;
  }

  if (!clientInstance) {
    try {
      clientInstance = createClient(url, anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      });
    } catch (err) {
      console.warn('Failed to initialize Supabase client:', err);
      return null;
    }
  }

  return clientInstance;
}

export function isSupabaseConfigured(): boolean {
  const { url, anonKey } = getSupabaseConfig();
  return Boolean(url && anonKey && url !== 'YOUR_SUPABASE_URL' && anonKey !== 'YOUR_SUPABASE_ANON_KEY');
}

export function saveSupabaseConfig(url: string, anonKey: string): void {
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.setItem('atul_expense_manager_supabase_url', url.trim());
    window.localStorage.setItem('atul_expense_manager_supabase_key', anonKey.trim());
    clientInstance = null; // Reset instance so it re-initializes
  }
}

export function clearSupabaseConfig(): void {
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.removeItem('atul_expense_manager_supabase_url');
    window.localStorage.removeItem('atul_expense_manager_supabase_key');
    clientInstance = null;
  }
}
