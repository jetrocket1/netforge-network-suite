import { useState } from 'react';
import type { FormEvent } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface Props {
  T: Record<string, string>;
}

export function ResetPasswordModal({ T }: Props) {
  const { updatePassword } = useAuth();

  const [pw,      setPw]      = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw,  setShowPw]  = useState(false);
  const [busy,    setBusy]    = useState(false);
  const [err,     setErr]     = useState<string | null>(null);
  const [done,    setDone]    = useState(false);

  const isDark = T.appBg === '#0d1117';

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (pw.length < 8) { setErr('Password must be at least 8 characters.'); return; }
    if (pw !== confirm) { setErr('Passwords do not match.'); return; }
    setBusy(true);
    const { error } = await updatePassword(pw);
    setBusy(false);
    if (error) { setErr(error); return; }
    setDone(true);
  };

  const inputSt = {
    width: '100%', padding: '0.5rem 0.65rem', borderRadius: 8,
    border: `1px solid ${T.border}`, background: T.appBg,
    color: T.textPrimary, fontSize: '0.82rem', fontFamily: 'inherit',
    outline: 'none', boxSizing: 'border-box' as const,
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
      <div style={{ background: isDark ? '#161b22' : '#ffffff', border: `1px solid ${T.border}`, borderRadius: 14, padding: '1.75rem', maxWidth: 380, width: '90%' }}>

        <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
          <div style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>{done ? '✅' : '🔑'}</div>
          <h2 style={{ margin: '0 0 0.3rem', color: T.textPrimary, fontSize: '1.05rem', fontWeight: 800 }}>
            {done ? 'Password updated' : 'Set a new password'}
          </h2>
          <p style={{ margin: 0, color: T.textMuted, fontSize: '0.78rem', lineHeight: 1.5 }}>
            {done ? 'You\'re signed in and good to go.' : 'Choose a strong password for your NetForge account.'}
          </p>
        </div>

        {done ? (
          <a
            href="/app"
            style={{ display: 'block', textAlign: 'center', padding: '0.55rem', borderRadius: 8, background: T.accent, color: '#fff', fontWeight: 700, fontSize: '0.85rem', textDecoration: 'none' }}
          >
            Continue to NetForge →
          </a>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
            <div style={{ position: 'relative' }}>
              <input
                type={showPw ? 'text' : 'password'} required
                placeholder="New password (8+ characters)"
                value={pw} onChange={e => setPw(e.target.value)}
                style={{ ...inputSt, paddingRight: '2.4rem' }}
                autoComplete="new-password" minLength={8}
              />
              <button
                type="button" onClick={() => setShowPw(v => !v)}
                style={{ cursor: 'pointer', border: 'none', background: 'none', position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: '0.68rem', color: T.textMuted, padding: 0, fontFamily: 'inherit' }}
              >
                {showPw ? 'Hide' : 'Show'}
              </button>
            </div>

            <input
              type={showPw ? 'text' : 'password'} required
              placeholder="Confirm new password"
              value={confirm} onChange={e => setConfirm(e.target.value)}
              style={inputSt}
              autoComplete="new-password"
            />

            {err && <p style={{ margin: 0, fontSize: '0.73rem', color: '#f85149', lineHeight: 1.4 }}>{err}</p>}

            <button
              type="submit" disabled={busy}
              style={{ cursor: 'pointer', border: 'none', padding: '0.55rem', borderRadius: 8, background: T.accent, color: '#fff', fontWeight: 700, fontSize: '0.82rem', fontFamily: 'inherit', opacity: busy ? 0.6 : 1, transition: 'opacity 0.15s', marginTop: 2 }}
            >
              {busy ? '…' : 'Update password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
