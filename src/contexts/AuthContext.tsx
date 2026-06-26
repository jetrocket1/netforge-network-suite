import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface Profile { id: string; is_pro: boolean; has_labs: boolean; has_exam: boolean; }

interface AuthCtx {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  isPro: boolean;
  hasExam: boolean;
  isRecovery: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<{ error: string | null }>;
  signUpWithEmail: (email: string, password: string) => Promise<{ error: string | null; needsConfirm?: boolean }>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  updatePassword: (password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user,       setUser]       = useState<User | null>(null);
  const [profile,    setProfile]    = useState<Profile | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [isRecovery, setIsRecovery] = useState(false);

  async function fetchProfile(uid: string) {
    const { data } = await supabase
      .from('profiles')
      .select('id, is_pro, has_labs, has_exam')
      .eq('id', uid)
      .single();
    setProfile(data ?? null);
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) void fetchProfile(u.id);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsRecovery(true);
        return;
      }
      const u = session?.user ?? null;
      setUser(u);
      if (u) void fetchProfile(u.id);
      else setProfile(null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithGoogle = () =>
    supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/app` },
    }).then(() => undefined);

  const signInWithEmail = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  };

  const signUpWithEmail = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/app` },
    });
    if (error) return { error: error.message };
    // Supabase returns a session immediately if email confirmation is disabled,
    // or a user-with-no-session if confirmation is required.
    const needsConfirm = !data.session;
    return { error: null, needsConfirm };
  };

  const updatePassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password });
    if (!error) setIsRecovery(false);
    return { error: error?.message ?? null };
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/app`,
    });
    return { error: error?.message ?? null };
  };

  const signOut = () => supabase.auth.signOut().then(() => undefined);

  const refreshProfile = async () => { if (user) await fetchProfile(user.id); };

  const isPro   = (profile?.is_pro || profile?.has_labs)  ?? false;
  const hasExam = (profile?.is_pro || profile?.has_exam)  ?? false;

  return (
    <Ctx.Provider value={{
      user, profile, loading,
      isPro, hasExam, isRecovery,
      signInWithGoogle, signInWithEmail, signUpWithEmail, resetPassword, updatePassword,
      signOut, refreshProfile,
    }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
