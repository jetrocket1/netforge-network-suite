import { useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface CompletedLab { id: string; label: string; catLabel: string; }

interface Props {
  user: User;
  isPro: boolean;
  hasExam?: boolean;
  completedLabs: CompletedLab[];
  totalLabs: number;
  onClose: () => void;
  onUpgrade?: () => void;
  T: Record<string, string>;
}

type BugState = 'idle' | 'submitting' | 'success' | 'error';

export function ProfilePage({ user, isPro, completedLabs, totalLabs, onClose, T }: Props) {
  const [showBug, setShowBug] = useState(false);

  const pct        = Math.round((completedLabs.length / totalLabs) * 100);
  const cardBg     = T.appBg === '#0d1117' ? '#161b22' : '#ffffff';
  const isDark     = T.appBg === '#0d1117';
  const avatarUrl  = (user.user_metadata?.avatar_url ?? user.user_metadata?.picture) as string | undefined;
  const displayName = (user.user_metadata?.full_name ?? user.user_metadata?.name ?? user.email ?? 'User') as string;

  const btn: CSSProperties = { cursor: 'pointer', border: 'none', background: 'none', fontFamily: 'inherit' };

  const byCategory = completedLabs.reduce<Record<string, CompletedLab[]>>((acc, lab) => {
    (acc[lab.catLabel] ??= []).push(lab);
    return acc;
  }, {});

  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9000 }} />

      {/* Slide-in panel */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0,
        width: 'min(440px, 100vw)',
        background: cardBg,
        borderLeft: `1px solid ${T.border}`,
        zIndex: 9001,
        display: 'flex', flexDirection: 'column',
        overflowY: 'auto',
        boxShadow: '-8px 0 32px rgba(0,0,0,0.3)',
      }}>

        {/* Header */}
        <div style={{ padding: '1.25rem 1.25rem 1rem', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <span style={{ fontWeight: 700, fontSize: '0.95rem', color: T.textPrimary }}>My Profile</span>
          <button onClick={onClose} style={{ ...btn, color: T.textMuted, fontSize: '1.1rem', lineHeight: 1 }}>✕</button>
        </div>

        <div style={{ flex: 1, padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* Identity */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {avatarUrl
              ? <img src={avatarUrl} alt="" referrerPolicy="no-referrer" style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
              : <div style={{ width: 56, height: 56, borderRadius: '50%', background: T.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '1.4rem', fontWeight: 800, flexShrink: 0 }}>{displayName[0].toUpperCase()}</div>
            }
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: '1rem', color: T.textPrimary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{displayName}</div>
              <div style={{ fontSize: '0.78rem', color: T.textMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</div>
              {isPro
                ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 4, fontSize: '0.65rem', fontWeight: 800, color: T.accent, background: `${T.accent}18`, border: `1px solid ${T.accent}40`, padding: '2px 8px', borderRadius: 20 }}>⚡ PRO</span>
                : <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 4, fontSize: '0.65rem', fontWeight: 700, color: T.textMuted, background: `${T.border}60`, padding: '2px 8px', borderRadius: 20 }}>Free plan</span>
              }
            </div>
          </div>

          {/* Progress */}
          <Section title="Learning Progress" T={T} isDark={isDark}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: '0.78rem', color: T.textMuted }}>Labs completed</span>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: pct === 100 ? '#3fb950' : T.accent }}>{completedLabs.length} / {totalLabs}</span>
            </div>
            <div style={{ height: 8, background: T.border, borderRadius: 4, overflow: 'hidden', marginBottom: '1rem' }}>
              <div style={{ height: '100%', width: `${pct}%`, background: pct === 100 ? '#3fb950' : T.accent, borderRadius: 4, transition: 'width 0.4s ease' }} />
            </div>
            {completedLabs.length === 0
              ? <p style={{ margin: 0, fontSize: '0.8rem', color: T.textMuted, fontStyle: 'italic' }}>No labs completed yet — get started!</p>
              : Object.entries(byCategory).map(([cat, labs]) => (
                  <div key={cat} style={{ marginBottom: '0.75rem' }}>
                    <div style={{ fontSize: '0.65rem', fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>{cat}</div>
                    {labs.map(lab => (
                      <div key={lab.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '3px 0', fontSize: '0.8rem', color: T.textPrimary }}>
                        <span style={{ width: 14, height: 14, borderRadius: '50%', background: '#3fb950', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.55rem', color: '#fff', fontWeight: 900, flexShrink: 0 }}>✓</span>
                        {lab.label}
                      </div>
                    ))}
                  </div>
                ))
            }
          </Section>

          {/* Bug report button */}
          <button
            onClick={() => setShowBug(true)}
            style={{ ...btn, display: 'flex', alignItems: 'center', gap: 8, padding: '0.65rem 0.9rem', borderRadius: 8, border: `1px solid ${T.border}`, background: T.toggleBg, color: T.textMuted, fontSize: '0.82rem', fontWeight: 600, textAlign: 'left' }}
          >
            <span style={{ fontSize: '1rem' }}>🐛</span>
            Report a Bug
            <span style={{ marginLeft: 'auto', fontSize: '0.7rem', opacity: 0.5 }}>›</span>
          </button>

        </div>
      </div>

      {/* Bug report card */}
      {showBug && <BugReportCard user={user} onClose={() => setShowBug(false)} T={T} isDark={isDark} />}
    </>
  );
}

function BugReportCard({ user, onClose, T, isDark }: { user: User; onClose: () => void; T: Record<string, string>; isDark: boolean }) {
  const [title, setTitle]       = useState('');
  const [desc, setDesc]         = useState('');
  const [bugState, setBugState] = useState<BugState>('idle');
  const [errMsg, setErrMsg]     = useState('');

  const cardBg = isDark ? '#1c2128' : '#ffffff';
  const btn: CSSProperties = { cursor: 'pointer', border: 'none', background: 'none', fontFamily: 'inherit' };

  const inputStyle: CSSProperties = {
    width: '100%', boxSizing: 'border-box',
    padding: '0.5rem 0.6rem', borderRadius: 6,
    border: `1px solid ${T.border}`,
    background: isDark ? '#0d1117' : '#f6f8fa',
    color: T.textPrimary, fontSize: '0.82rem',
    fontFamily: 'inherit', outline: 'none',
  };

  const handleSubmit = async () => {
    if (!title.trim() || !desc.trim()) return;
    setBugState('submitting');
    setErrMsg('');
    const { error } = await supabase.from('bug_reports').insert({
      user_id: user.id,
      email: user.email,
      title: title.trim(),
      description: desc.trim(),
    });
    if (error) { setErrMsg(error.message); setBugState('error'); }
    else { setBugState('success'); }
  };

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 9100 }} />
      <div style={{
        position: 'fixed', inset: 0, zIndex: 9101,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        pointerEvents: 'none',
      }}>
        <div style={{
          background: cardBg, border: `1px solid ${T.border}`,
          borderRadius: 14, padding: '1.75rem',
          width: 'min(420px, 92vw)',
          boxShadow: '0 16px 48px rgba(0,0,0,0.4)',
          pointerEvents: 'auto',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: T.textPrimary, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>🐛</span> Report a Bug
            </h3>
            <button onClick={onClose} style={{ ...btn, color: T.textMuted, fontSize: '1rem', lineHeight: 1 }}>✕</button>
          </div>

          {bugState === 'success' ? (
            <div style={{ textAlign: 'center', padding: '1rem 0' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: 10 }}>✅</div>
              <p style={{ margin: '0 0 0.4rem', fontWeight: 700, color: T.textPrimary }}>Report sent — thank you!</p>
              <p style={{ margin: '0 0 1.25rem', color: T.textMuted, fontSize: '0.82rem' }}>We'll look into it as soon as possible.</p>
              <button onClick={onClose} style={{ ...btn, padding: '0.55rem 1.5rem', borderRadius: 8, background: T.accent, color: '#fff', fontWeight: 700, fontSize: '0.85rem' }}>Close</button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: T.textMuted, marginBottom: 4 }}>Title</label>
                <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Brief summary of the issue" style={inputStyle} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: T.textMuted, marginBottom: 4 }}>Description</label>
                <textarea
                  value={desc} onChange={e => setDesc(e.target.value)}
                  placeholder="Steps to reproduce, what you expected, what happened..."
                  rows={4}
                  style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }}
                />
              </div>
              {bugState === 'error' && <p style={{ margin: 0, color: '#f85149', fontSize: '0.78rem' }}>{errMsg}</p>}
              <button
                onClick={handleSubmit}
                disabled={bugState === 'submitting' || !title.trim() || !desc.trim()}
                style={{ ...btn, padding: '0.6rem', borderRadius: 8, background: T.accent, color: '#fff', fontWeight: 700, fontSize: '0.88rem', opacity: (bugState === 'submitting' || !title.trim() || !desc.trim()) ? 0.6 : 1 }}
              >
                {bugState === 'submitting' ? 'Sending…' : 'Submit Report'}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}


function Section({ title, children, T, isDark: _isDark }: { title: string; children: ReactNode; T: Record<string, string>; isDark: boolean }) {
  return (
    <div>
      <h3 style={{ margin: '0 0 0.75rem', fontSize: '0.75rem', fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{title}</h3>
      <div style={{ background: T.toggleBg, border: `1px solid ${T.border}`, borderRadius: 10, padding: '0.9rem' }}>
        {children}
      </div>
    </div>
  );
}
