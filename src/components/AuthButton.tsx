import { useState } from 'react';
import type { CSSProperties, FormEvent } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface Props {
  T: Record<string, string>;
  onUpgrade: () => void;
  onProfile: () => void;
}

type PanelMode = 'signin' | 'signup' | 'reset';

export function AuthButton({ T, onUpgrade, onProfile }: Props) {
  const { user, profile, loading, signInWithGoogle, signInWithEmail, signUpWithEmail, resetPassword, signOut } = useAuth();

  // Panel state
  const [open,    setOpen]    = useState(false);
  const [mode,    setMode]    = useState<PanelMode>('signin');
  const [email,   setEmail]   = useState('');
  const [pw,      setPw]      = useState('');
  const [busy,    setBusy]    = useState(false);
  const [err,     setErr]     = useState<string | null>(null);
  const [msg,     setMsg]     = useState<string | null>(null);
  const [showPw,  setShowPw]  = useState(false);

  // Logged-in dropdown state
  const [ddOpen,  setDdOpen]  = useState(false);

  const btn: CSSProperties = { cursor: 'pointer', border: 'none', background: 'none', fontFamily: 'inherit' };
  const menuBg = T.appBg === '#0d1117' ? '#161b22' : '#ffffff';

  const closePanel = () => { setOpen(false); setErr(null); setMsg(null); setEmail(''); setPw(''); setShowPw(false); };

  const switchMode = (m: PanelMode) => { setMode(m); setErr(null); setMsg(null); };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    setMsg(null);

    if (mode === 'reset') {
      const { error } = await resetPassword(email);
      setBusy(false);
      if (error) { setErr(error); return; }
      setMsg('Check your email for a password reset link.');
      return;
    }

    if (mode === 'signup') {
      if (pw.length < 8) { setErr('Password must be at least 8 characters.'); setBusy(false); return; }
      const { error, needsConfirm } = await signUpWithEmail(email, pw);
      setBusy(false);
      if (error) { setErr(error); return; }
      if (needsConfirm) {
        setMsg('Account created! Check your email to confirm before signing in.');
        switchMode('signin');
      } else {
        closePanel();
      }
      return;
    }

    // signin
    const { error } = await signInWithEmail(email, pw);
    setBusy(false);
    if (error) { setErr(error.includes('Invalid') ? 'Incorrect email or password.' : error); return; }
    closePanel();
  };

  if (loading) return null;

  /* ── Logged-in state ── */
  if (user) {
    const avatarUrl = (user.user_metadata?.avatar_url ?? user.user_metadata?.picture) as string | undefined;
    return (
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <button
          onClick={() => setDdOpen(o => !o)}
          style={{ ...btn, display: 'flex', alignItems: 'center', gap: 5, padding: '0.2rem 0.4rem', borderRadius: 6, border: `1px solid ${T.border}`, background: T.toggleBg }}
        >
          <Avatar email={user.email ?? ''} accent={T.accent} avatarUrl={avatarUrl} />
          <span style={{ fontSize: '0.7rem', color: T.textMuted, maxWidth: 110, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</span>
          <span style={{ fontSize: '0.5rem', color: T.textMuted }}>▾</span>
        </button>

        {ddOpen && (
          <>
            <div style={{ position: 'fixed', inset: 0, zIndex: 98 }} onClick={() => setDdOpen(false)} />
            <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 6px)', background: menuBg, border: `1px solid ${T.border}`, borderRadius: 8, padding: '0.35rem', minWidth: 175, zIndex: 99, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <button onClick={() => { setDdOpen(false); onProfile(); }} style={{ ...btn, padding: '0.4rem 0.6rem', borderRadius: 6, color: T.textPrimary, fontSize: '0.78rem', fontWeight: 600, textAlign: 'left', display: 'flex', alignItems: 'center', gap: 7 }}>
                <span style={{ fontSize: '0.85rem' }}>👤</span> My Profile
              </button>
              <div style={{ height: 1, background: T.border, margin: '2px 0' }} />
              {profile?.is_pro
                ? <div style={{ padding: '0.35rem 0.6rem', color: '#3fb950', fontSize: '0.75rem', fontWeight: 600 }}>⚡ Pro active</div>
                : <button onClick={() => { setDdOpen(false); onUpgrade(); }} style={{ ...btn, padding: '0.4rem 0.6rem', borderRadius: 6, background: `${T.accent}18`, color: T.accent, fontSize: '0.78rem', fontWeight: 700, textAlign: 'left' }}>⚡ Upgrade — from £5.99</button>
              }
              <div style={{ height: 1, background: T.border, margin: '2px 0' }} />
              <button onClick={() => { setDdOpen(false); void signOut(); }} style={{ ...btn, padding: '0.38rem 0.6rem', borderRadius: 6, color: T.textMuted, fontSize: '0.78rem', textAlign: 'left' }}>
                Sign out
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  /* ── Signed-out state: button + inline panel ── */
  const inputSt: CSSProperties = {
    width: '100%', padding: '0.45rem 0.6rem', borderRadius: 7,
    border: `1px solid ${T.border}`, background: T.appBg,
    color: T.textPrimary, fontSize: '0.78rem', fontFamily: 'inherit',
    outline: 'none', boxSizing: 'border-box',
  };

  const submitSt: CSSProperties = {
    ...btn, width: '100%', padding: '0.5rem', borderRadius: 7,
    background: T.accent, color: '#fff', fontWeight: 700,
    fontSize: '0.78rem', opacity: busy ? 0.6 : 1,
    transition: 'opacity 0.15s', marginTop: 2,
  };

  const TITLES: Record<PanelMode, string> = {
    signin: 'Sign in to NetForge',
    signup: 'Create your account',
    reset:  'Reset password',
  };

  return (
    <div style={{ position: 'relative', flexShrink: 0 }}>
      <button
        onClick={() => { setOpen(o => !o); setMode('signin'); setErr(null); setMsg(null); }}
        style={{ ...btn, display: 'flex', alignItems: 'center', gap: 5, padding: '0.28rem 0.6rem', borderRadius: 6, border: `1px solid ${T.border}`, background: T.toggleBg, color: T.textPrimary, fontSize: '0.73rem', fontWeight: 600 }}
      >
        Sign in
      </button>

      {open && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 98 }} onClick={closePanel} />
          <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 8px)', background: menuBg, border: `1px solid ${T.border}`, borderRadius: 12, padding: '1.1rem', width: 280, zIndex: 99, boxShadow: '0 8px 32px #00000050' }}>

            {/* Header */}
            <div style={{ marginBottom: '0.9rem' }}>
              <div style={{ fontWeight: 800, fontSize: '0.88rem', color: T.textPrimary, marginBottom: 2 }}>{TITLES[mode]}</div>
              {mode !== 'reset' && (
                <div style={{ fontSize: '0.68rem', color: T.textMuted }}>
                  {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
                  <button type="button" onClick={() => switchMode(mode === 'signin' ? 'signup' : 'signin')} style={{ ...btn, color: T.accent, fontWeight: 700, fontSize: '0.68rem', padding: 0, display: 'inline' }}>
                    {mode === 'signin' ? 'Sign up free' : 'Sign in'}
                  </button>
                </div>
              )}
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <input
                type="email" required placeholder="Email address"
                value={email} onChange={e => setEmail(e.target.value)}
                style={inputSt} autoComplete="email"
              />

              {mode !== 'reset' && (
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPw ? 'text' : 'password'} required
                    placeholder={mode === 'signup' ? 'Password (8+ characters)' : 'Password'}
                    value={pw} onChange={e => setPw(e.target.value)}
                    style={{ ...inputSt, paddingRight: '2.2rem' }}
                    autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                    minLength={mode === 'signup' ? 8 : undefined}
                  />
                  <button type="button" onClick={() => setShowPw(v => !v)} style={{ ...btn, position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', fontSize: '0.7rem', color: T.textMuted, padding: 0 }}>
                    {showPw ? 'Hide' : 'Show'}
                  </button>
                </div>
              )}

              {err && <p style={{ margin: 0, fontSize: '0.7rem', color: '#f85149', lineHeight: 1.4 }}>{err}</p>}
              {msg && <p style={{ margin: 0, fontSize: '0.7rem', color: '#3fb950', lineHeight: 1.4 }}>{msg}</p>}

              <button type="submit" disabled={busy} style={submitSt}>
                {busy ? '…' : mode === 'signin' ? 'Sign in' : mode === 'signup' ? 'Create account' : 'Send reset link'}
              </button>
            </form>

            {/* Forgot password */}
            {mode === 'signin' && (
              <button type="button" onClick={() => switchMode('reset')} style={{ ...btn, fontSize: '0.68rem', color: T.textMuted, marginTop: '0.4rem', padding: 0, display: 'block' }}>
                Forgot password?
              </button>
            )}
            {mode === 'reset' && (
              <button type="button" onClick={() => switchMode('signin')} style={{ ...btn, fontSize: '0.68rem', color: T.textMuted, marginTop: '0.4rem', padding: 0, display: 'block' }}>
                ← Back to sign in
              </button>
            )}

            {/* Divider + Google */}
            {mode !== 'reset' && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '0.85rem 0 0.7rem' }}>
                  <div style={{ flex: 1, height: 1, background: T.border }} />
                  <span style={{ fontSize: '0.65rem', color: T.textMuted }}>or</span>
                  <div style={{ flex: 1, height: 1, background: T.border }} />
                </div>
                <button
                  type="button" onClick={signInWithGoogle}
                  style={{ ...btn, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '0.45rem', borderRadius: 7, border: `1px solid ${T.border}`, background: T.toggleBg, color: T.textPrimary, fontSize: '0.75rem', fontWeight: 600 }}
                >
                  <GoogleIcon /> Continue with Google
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function Avatar({ email, accent, avatarUrl }: { email: string; accent: string; avatarUrl?: string }) {
  if (avatarUrl) {
    return <img src={avatarUrl} alt="" referrerPolicy="no-referrer" style={{ width: 22, height: 22, borderRadius: '50%', flexShrink: 0, objectFit: 'cover' }} />;
  }
  return (
    <div style={{ width: 22, height: 22, borderRadius: '50%', background: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.65rem', fontWeight: 800, flexShrink: 0 }}>
      {(email[0] ?? 'U').toUpperCase()}
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}
