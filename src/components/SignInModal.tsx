import { useState } from 'react';
import type { FormEvent } from 'react';
import { useAuth } from '../contexts/AuthContext';

type Mode = 'signin' | 'signup' | 'reset';

interface Props {
  T: Record<string, string>;
  onClose: () => void;
}

export function SignInModal({ T, onClose }: Props) {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail, resetPassword } = useAuth();

  const [mode,   setMode]   = useState<Mode>('signin');
  const [email,  setEmail]  = useState('');
  const [pw,     setPw]     = useState('');
  const [showPw, setShowPw] = useState(false);
  const [busy,   setBusy]   = useState(false);
  const [err,    setErr]    = useState<string | null>(null);
  const [msg,    setMsg]    = useState<string | null>(null);

  const isDark = T.appBg === '#0d1117';
  const bg = isDark ? '#161b22' : '#ffffff';

  const btn = { cursor: 'pointer' as const, border: 'none', background: 'none', fontFamily: 'inherit' };

  const inputSt = {
    width: '100%', padding: '0.5rem 0.65rem', borderRadius: 8,
    border: `1px solid ${T.border}`, background: T.appBg,
    color: T.textPrimary, fontSize: '0.82rem', fontFamily: 'inherit',
    outline: 'none', boxSizing: 'border-box' as const,
  };

  const switchMode = (m: Mode) => { setMode(m); setErr(null); setMsg(null); };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    setMsg(null);

    if (mode === 'reset') {
      const { error } = await resetPassword(email);
      setBusy(false);
      if (error) { setErr(error); return; }
      setMsg('Check your email for a reset link.');
      return;
    }

    if (mode === 'signup') {
      if (pw.length < 8) { setErr('Password must be at least 8 characters.'); setBusy(false); return; }
      const { error, needsConfirm } = await signUpWithEmail(email, pw);
      setBusy(false);
      if (error) { setErr(error); return; }
      if (needsConfirm) {
        setMsg('Account created! Check your email to confirm, then sign in.');
        switchMode('signin');
      } else {
        onClose();
      }
      return;
    }

    const { error } = await signInWithEmail(email, pw);
    setBusy(false);
    if (error) { setErr(error.includes('Invalid') ? 'Incorrect email or password.' : error); return; }
    onClose();
  };

  const TITLES: Record<Mode, string> = {
    signin: 'Sign in to NetForge',
    signup: 'Create a free account',
    reset:  'Reset your password',
  };

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}
      onClick={onClose}
    >
      <div
        style={{ background: bg, border: `1px solid ${T.border}`, borderRadius: 14, padding: '1.75rem', maxWidth: 380, width: '90%' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
          <div style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>🔒</div>
          <h2 style={{ margin: '0 0 0.3rem', color: T.textPrimary, fontSize: '1.05rem', fontWeight: 800 }}>{TITLES[mode]}</h2>
          <p style={{ margin: 0, color: T.textMuted, fontSize: '0.78rem', lineHeight: 1.5 }}>
            {mode === 'signin' && 'Sign in to access NetForge Pro and save your progress.'}
            {mode === 'signup' && 'Free account — no credit card needed to get started.'}
            {mode === 'reset' && "We'll email you a link to reset your password."}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
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
                style={{ ...inputSt, paddingRight: '2.4rem' }}
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                minLength={mode === 'signup' ? 8 : undefined}
              />
              <button type="button" onClick={() => setShowPw(v => !v)} style={{ ...btn, position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: '0.68rem', color: T.textMuted, padding: 0 }}>
                {showPw ? 'Hide' : 'Show'}
              </button>
            </div>
          )}

          {err && <p style={{ margin: 0, fontSize: '0.73rem', color: '#f85149', lineHeight: 1.4 }}>{err}</p>}
          {msg && <p style={{ margin: 0, fontSize: '0.73rem', color: '#3fb950', lineHeight: 1.4 }}>{msg}</p>}

          <button
            type="submit" disabled={busy}
            style={{ ...btn, padding: '0.55rem', borderRadius: 8, background: T.accent, color: '#fff', fontWeight: 700, fontSize: '0.82rem', opacity: busy ? 0.6 : 1, transition: 'opacity 0.15s', marginTop: 2 }}
          >
            {busy ? '…' : mode === 'signin' ? 'Sign in' : mode === 'signup' ? 'Create account' : 'Send reset link'}
          </button>
        </form>

        {/* Secondary links */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.6rem' }}>
          {mode === 'signin' && (
            <>
              <button type="button" onClick={() => switchMode('reset')} style={{ ...btn, fontSize: '0.7rem', color: T.textMuted, padding: 0 }}>Forgot password?</button>
              <button type="button" onClick={() => switchMode('signup')} style={{ ...btn, fontSize: '0.7rem', color: T.accent, fontWeight: 700, padding: 0 }}>Create account</button>
            </>
          )}
          {mode === 'signup' && (
            <button type="button" onClick={() => switchMode('signin')} style={{ ...btn, fontSize: '0.7rem', color: T.textMuted, padding: 0 }}>Already have an account? Sign in</button>
          )}
          {mode === 'reset' && (
            <button type="button" onClick={() => switchMode('signin')} style={{ ...btn, fontSize: '0.7rem', color: T.textMuted, padding: 0 }}>← Back to sign in</button>
          )}
        </div>

        {/* Divider + Google */}
        {mode !== 'reset' && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '1rem 0 0.8rem' }}>
              <div style={{ flex: 1, height: 1, background: T.border }} />
              <span style={{ fontSize: '0.68rem', color: T.textMuted }}>or</span>
              <div style={{ flex: 1, height: 1, background: T.border }} />
            </div>
            <button
              type="button" onClick={() => { onClose(); void signInWithGoogle(); }}
              style={{ ...btn, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '0.55rem', borderRadius: 8, border: `1px solid ${T.border}`, background: T.toggleBg, color: T.textPrimary, fontWeight: 600, fontSize: '0.82rem' }}
            >
              <GoogleIcon /> Continue with Google
            </button>
          </>
        )}

        <button onClick={onClose} style={{ ...btn, display: 'block', width: '100%', marginTop: '0.85rem', fontSize: '0.73rem', color: T.textMuted, textDecoration: 'underline' }}>Cancel</button>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}
