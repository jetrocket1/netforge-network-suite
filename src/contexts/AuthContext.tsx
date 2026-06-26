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
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]       = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

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

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
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

  const signOut = () => supabase.auth.signOut().then(() => undefined);

  const refreshProfile = async () => { if (user) await fetchProfile(user.id); };

  const isPro  = (profile?.is_pro || profile?.has_labs)  ?? false;
  const hasExam = (profile?.is_pro || profile?.has_exam) ?? false;

  return (
    <Ctx.Provider value={{
      user, profile, loading,
      isPro, hasExam,
      signInWithGoogle, signOut, refreshProfile,
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
