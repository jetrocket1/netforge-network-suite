import { useState } from 'react';
import type { CSSProperties } from 'react';
import { supabase } from '../lib/supabase';

interface Props {
  onClose: () => void;
  T: Record<string, string>;
}

export function UpgradeModal({ onClose, T }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const cardBg = T.appBg === '#0d1117' ? '#161b22' : '#ffffff';
  const btn: CSSProperties = { cursor: 'pointer', border: 'none', background: 'none', fontFamily: 'inherit' };

  const handlePay = async () => {
    setLoading(true);
    setError('');
    try {
      const { data, error: fnErr } = await supabase.functions.invoke('create-checkout-session');
      if (fnErr || !data?.url) throw new Error((fnErr as Error)?.message ?? 'No checkout URL returned');
      window.location.href = data.url as string;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
      setLoading(false);
    }
  };

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}
      onClick={onClose}
    >
      <div
        style={{ background: cardBg, border: `1px solid ${T.border}`, borderRadius: 12, padding: '2rem', maxWidth: 400, width: '90%', textAlign: 'center' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🚀</div>
        <h2 style={{ margin: '0 0 0.5rem', color: T.textPrimary, fontSize: '1.2rem', fontWeight: 700 }}>Unlock NetForge Pro</h2>
        <p style={{ color: T.textMuted, fontSize: '0.85rem', margin: '0 0 1rem', lineHeight: 1.6 }}>
          One-time payment. Unlocks all premium labs permanently across all devices.
        </p>
        <div style={{ background: T.activeBg, border: `1px solid ${T.border}`, borderRadius: 8, padding: '0.75rem 1rem', marginBottom: '1.5rem', textAlign: 'left' }}>
          {['OSPF Visualiser', 'QoS Traffic Management', 'Firewall Zone Policy', 'Layer 2 Attack Mitigation', 'All future pro labs'].map(f => (
            <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '3px 0', fontSize: '0.8rem', color: T.textPrimary }}>
              <span style={{ color: '#3fb950', fontWeight: 700, fontSize: '0.75rem' }}>✓</span> {f}
            </div>
          ))}
        </div>
        <div style={{ fontSize: '2rem', fontWeight: 800, color: T.accent, marginBottom: '1.5rem' }}>£4.99</div>
        {error && <p style={{ color: '#f85149', fontSize: '0.8rem', margin: '0 0 1rem' }}>{error}</p>}
        <button
          onClick={handlePay}
          disabled={loading}
          style={{ ...btn, width: '100%', padding: '0.75rem', borderRadius: 8, background: T.accent, color: '#fff', fontWeight: 700, fontSize: '0.95rem', opacity: loading ? 0.7 : 1 }}
        >
          {loading ? 'Redirecting to checkout…' : 'Unlock Pro — £4.99'}
        </button>
        <button onClick={onClose} style={{ ...btn, marginTop: '1rem', color: T.textMuted, fontSize: '0.78rem', textDecoration: 'underline' }}>
          Maybe later
        </button>
      </div>
    </div>
  );
}
