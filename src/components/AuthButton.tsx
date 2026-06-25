import { useState } from 'react';
import type { CSSProperties } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface Props {
  T: Record<string, string>;
  onUpgrade: () => void;
  onProfile: () => void;
}

export function AuthButton({ T, onUpgrade, onProfile }: Props) {
  const { user, profile, loading, signInWithGoogle, signOut } = useAuth();
  const [open, setOpen] = useState(false);

  const btn: CSSProperties = { cursor: 'pointer', border: 'none', background: 'none', fontFamily: 'inherit' };
  const menuBg = T.appBg === '#0d1117' ? '#161b22' : '#ffffff';

  if (loading) return null;

  if (!user) {
    return (
      <button
        onClick={signInWithGoogle}
        style={{ ...btn, display: 'flex', alignItems: 'center', gap: 5, padding: '0.28rem 0.6rem', borderRadius: 6, border: `1px solid ${T.border}`, background: T.toggleBg, color: T.textPrimary, fontSize: '0.73rem', fontWeight: 600, flexShrink: 0 }}
      >
        <GoogleIcon />
        Sign in
      </button>
    );
  }

  const avatarUrl = (user.user_metadata?.avatar_url ?? user.user_metadata?.picture) as string | undefined;

  return (
    <div style={{ position: 'relative', flexShrink: 0 }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ ...btn, display: 'flex', alignItems: 'center', gap: 5, padding: '0.2rem 0.4rem', borderRadius: 6, border: `1px solid ${T.border}`, background: T.toggleBg }}
      >
        <Avatar email={user.email ?? ''} accent={T.accent} avatarUrl={avatarUrl} />
        <span style={{ fontSize: '0.7rem', color: T.textMuted, maxWidth: 110, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</span>
        <span style={{ fontSize: '0.5rem', color: T.textMuted }}>▾</span>
      </button>

      {open && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 98 }} onClick={() => setOpen(false)} />
          <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 6px)', background: menuBg, border: `1px solid ${T.border}`, borderRadius: 8, padding: '0.35rem', minWidth: 175, zIndex: 99, display: 'flex', flexDirection: 'column', gap: 2 }}>

            <button
              onClick={() => { setOpen(false); onProfile(); }}
              style={{ ...btn, padding: '0.4rem 0.6rem', borderRadius: 6, color: T.textPrimary, fontSize: '0.78rem', fontWeight: 600, textAlign: 'left', display: 'flex', alignItems: 'center', gap: 7 }}
            >
              <span style={{ fontSize: '0.85rem' }}>👤</span> My Profile
            </button>

            <div style={{ height: 1, background: T.border, margin: '2px 0' }} />

            {profile?.is_pro
              ? <div style={{ padding: '0.35rem 0.6rem', color: '#3fb950', fontSize: '0.75rem', fontWeight: 600 }}>⚡ Pro active</div>
              : (
                <button
                  onClick={() => { setOpen(false); onUpgrade(); }}
                  style={{ ...btn, padding: '0.4rem 0.6rem', borderRadius: 6, background: `${T.accent}18`, color: T.accent, fontSize: '0.78rem', fontWeight: 700, textAlign: 'left' }}
                >
                  ⚡ Upgrade — from £5.99
                </button>
              )
            }

            <div style={{ height: 1, background: T.border, margin: '2px 0' }} />

            <button
              onClick={() => { setOpen(false); void signOut(); }}
              style={{ ...btn, padding: '0.38rem 0.6rem', borderRadius: 6, color: T.textMuted, fontSize: '0.78rem', textAlign: 'left' }}
            >
              Sign out
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function Avatar({ email, accent, avatarUrl }: { email: string; accent: string; avatarUrl?: string }) {
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt=""
        referrerPolicy="no-referrer"
        style={{ width: 22, height: 22, borderRadius: '50%', flexShrink: 0, objectFit: 'cover' }}
      />
    );
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
