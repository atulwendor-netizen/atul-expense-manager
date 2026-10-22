import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Environment variables or client storage overrides
const getSupabaseConfig = () => {
  let url = '';
  let anonKey = '';

  try {
    const metaEnv = (import.meta as unknown as { env?: Record<string, string> })?.env;
    if (metaEnv) {
      url = metaEnv.VITE_SUPABASE_URL || '';
      anonKey = metaEnv.VITE_SUPABASE_ANON_KEY || '';
    }
  } catch {
    // ignore
  }

  if ((!url || !anonKey) && typeof process !== 'undefined' && process.env) {
    url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || url;
    anonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || anonKey;
  }

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

// --- SUPABASE AUTHENTICATION INTEGRATION ---

export async function supabaseSignIn(
  email: string,
  password?: string
): Promise<{ success: boolean; user?: any; session?: any; error?: string }> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, error: 'Supabase client is not configured.' };
  }
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail) {
    return { success: false, error: 'Please enter a valid email address.' };
  }

  try {
    if (!password) {
      return { success: false, error: 'Password required for Supabase authentication.' };
    }
    const { data, error } = await client.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, user: data.user, session: data.session };
  } catch (err: any) {
    return { success: false, error: err.message || 'Supabase authentication failed.' };
  }
}

export async function supabaseSignUp(
  email: string,
  password: string,
  name: string,
  role: string = 'manager'
): Promise<{ success: boolean; user?: any; session?: any; error?: string }> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, error: 'Supabase client is not configured.' };
  }
  const cleanEmail = email.trim().toLowerCase();
  const cleanName = name.trim();

  try {
    const { data, error } = await client.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: {
          name: cleanName,
          role,
        },
      },
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, user: data.user, session: data.session };
  } catch (err: any) {
    return { success: false, error: err.message || 'Supabase sign up failed.' };
  }
}

export async function supabaseGetSession(): Promise<any | null> {
  const client = getSupabaseClient();
  if (!client) return null;
  try {
    const { data } = await client.auth.getSession();
    return data.session || null;
  } catch {
    return null;
  }
}

export async function supabaseSignOut(): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;
  try {
    await client.auth.signOut();
  } catch {
    // Ignore sign out errors
  }
}

export async function supabaseUpdatePassword(newPassword: string): Promise<{ success: boolean; error?: string }> {
  const client = getSupabaseClient();
  if (!client) return { success: false, error: 'Supabase client is not configured.' };
  try {
    const { error } = await client.auth.updateUser({ password: newPassword });
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to update account password.' };
  }
}

export function supabaseIsInviteCallback(): { isInvite: boolean; email?: string; token?: string } {
  if (typeof window === 'undefined') return { isInvite: false };
  try {
    const hash = window.location.hash.replace(/^#/, '');
    const hashParams = new URLSearchParams(hash);
    const searchParams = new URLSearchParams(window.location.search);

    const type = hashParams.get('type') || searchParams.get('type');
    const isInvite = type === 'invite';
    const email = hashParams.get('email') || searchParams.get('email') || undefined;
    const token = hashParams.get('access_token') || hashParams.get('token') || searchParams.get('token') || undefined;

    return { isInvite, email, token };
  } catch {
    return { isInvite: false };
  }
}

// --- SUPABASE DATABASE: INVITATIONS, PROFILES & WORKSPACE MEMBERS ---

export async function supabaseCreateInvitation(invitation: {
  id?: string;
  workspaceId: string;
  email: string;
  role: string;
  token: string;
  invitedBy?: string;
  expiresAt: string;
}): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;
  try {
    const invId = invitation.id || `inv-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const { error } = await client.from('workspace_invitations').upsert(
      {
        id: invId,
        workspace_id: invitation.workspaceId,
        email: invitation.email.trim().toLowerCase(),
        role: invitation.role,
        token: invitation.token,
        status: 'pending',
        expires_at: invitation.expiresAt,
      },
      { onConflict: 'token' }
    );
    return !error;
  } catch {
    return false;
  }
}

export async function supabaseGetInvitation(
  tokenOrEmail: string,
  email?: string
): Promise<{ data: any | null; error: any | null }> {
  const client = getSupabaseClient();
  if (!client) return { data: null, error: 'Supabase client not initialized' };
  try {
    let query = client.from('workspace_invitations').select('*');
    if (tokenOrEmail && tokenOrEmail.includes('@')) {
      query = query.eq('email', tokenOrEmail.trim().toLowerCase());
    } else if (tokenOrEmail) {
      query = query.eq('token', tokenOrEmail.trim());
    } else if (email) {
      query = query.eq('email', email.trim().toLowerCase());
    }
    const { data, error } = await query.maybeSingle();
    return { data, error };
  } catch (err) {
    return { data: null, error: err };
  }
}

export async function supabaseAcceptInvitation(
  invitationTokenOrId: string,
  emailOrUserId: string,
  workspaceId: string = 'ws-atul-2026',
  role: string = 'manager'
): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;
  try {
    // 1. Mark invitation accepted by token or id
    await client
      .from('workspace_invitations')
      .update({ status: 'accepted' })
      .or(`token.eq.${invitationTokenOrId},id.eq.${invitationTokenOrId}`);

    // 2. Add or update workspace member if user ID is known
    if (emailOrUserId && !emailOrUserId.includes('@')) {
      await client.from('workspace_members').upsert(
        {
          workspace_id: workspaceId,
          user_id: emailOrUserId,
          role,
          status: 'active',
        },
        { onConflict: 'workspace_id,user_id' }
      );
    }

    return true;
  } catch {
    return false;
  }
}

export async function supabaseUpsertProfile(profile: {
  id: string;
  email: string;
  name?: string;
  full_name?: string;
  workspaceId?: string;
  workspace_id?: string;
  role?: string;
}): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;
  try {
    const displayName = profile.name || profile.full_name || profile.email.split('@')[0];
    const wsId = profile.workspaceId || profile.workspace_id || 'ws-atul-2026';
    const { error } = await client.from('profiles').upsert(
      {
        id: profile.id,
        email: profile.email.trim().toLowerCase(),
        name: displayName,
        workspace_id: wsId,
        ...(profile.role ? { role: profile.role } : {}),
      },
      { onConflict: 'id' }
    );
    return !error;
  } catch {
    return false;
  }
}

