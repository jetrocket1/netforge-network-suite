import { useState } from 'react';
import type { CSSProperties } from 'react';
import { supabase } from '../lib/supabase';

export type Product = 'labs' | 'exam' | 'bundle';

interface Props {
  onClose: () => void;
  T: Record<string, string>;
  defaultProduct?: Product;
}

const PRODUCTS: {
  id: Product;
  label: string;
  price: string;
  save?: string;
  badge?: string;
  features: string[];
}[] = [
  {
    id: 'labs',
    label: 'Labs Pro',
    price: '£5.99',
    features: [
      'OSPF Visualiser',
      'QoS Traffic Management',
      'Firewall Zone Policy',
      'IPsec / WireGuard VPN',
      'PKI & Certificate Chain',
      'Network Forensics',
      '802.1X Network Access Control',
      'Layer 2 Attack Mitigation',
      'All future pro labs',
    ],
  },
  {
    id: 'exam',
    label: 'Exam Prep',
    price: '£8.99',
    features: [
      'CompTIA Network+ (N10-009) full exam',
      'CompTIA Security+ (SY0-701) full exam',
      '500+ practice questions',
      'Adaptive difficulty',
      'Detailed answer explanations',
      'Timed exam mode',
    ],
  },
  {
    id: 'bundle',
    label: 'Full Bundle',
    price: '£11.99',
    save: 'Save £2.99',
    badge: 'BEST VALUE',
    features: [
      'Everything in Labs Pro',
      'Everything in Exam Prep',
      'Permanent access, all devices',
    ],
  },
];

export function UpgradeModal({ onClose, T, defaultProduct }: Props) {
  const [selected, setSelected] = useState<Product>(defaultProduct ?? 'bundle');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  const isDark  = T.appBg === '#0d1117';
  const cardBg  = isDark ? '#161b22' : '#ffffff';
  const insetBg = isDark ? '#0d1117' : '#f6f8fa';
  const bd      = T.border;
  const btn: CSSProperties = { cursor: 'pointer', border: 'none', background: 'none', fontFamily: 'inherit' };

  const current = PRODUCTS.find(p => p.id === selected)!;

  const handlePay = async () => {
    setLoading(true);
    setError('');
    // Store selected product so ProSuccessModal can read it
    try { localStorage.setItem('nf-pending-product', selected); } catch {}
    try {
      const { data, error: fnErr } = await supabase.functions.invoke('create-checkout-session', {
        body: { product: selected },
      });
      if (fnErr || !data?.url) throw new Error((fnErr as Error)?.message ?? 'No checkout URL returned');
      window.location.href = data.url as string;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
      setLoading(false);
    }
  };

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.70)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem' }}
      onClick={onClose}
    >
      <div
        style={{ background: cardBg, border: `1px solid ${bd}`, borderRadius: 16, padding: '1.75rem 1.5rem 1.5rem', maxWidth: 460, width: '100%' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div>
            <h2 style={{ margin: '0 0 0.25rem', color: T.textPrimary, fontSize: '1.15rem', fontWeight: 800 }}>Upgrade NetForge</h2>
            <p style={{ margin: 0, fontSize: '0.78rem', color: T.textMuted, lineHeight: 1.5 }}>One-time payment. Permanent access across all devices.</p>
          </div>
          <button onClick={onClose} style={{ ...btn, color: T.textMuted, fontSize: '1.1rem', padding: '0 4px', lineHeight: 1, marginTop: 2 }}>✕</button>
        </div>

        {/* Tier cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1.25rem' }}>
          {PRODUCTS.map(p => {
            const isSelected = selected === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setSelected(p.id)}
                style={{
                  ...btn,
                  width: '100%', textAlign: 'left',
                  padding: '0.85rem 1rem',
                  borderRadius: 10,
                  border: `2px solid ${isSelected ? T.accent : bd}`,
                  background: isSelected ? (isDark ? `${T.accent}10` : `${T.accent}08`) : insetBg,
                  transition: 'border-color 0.15s, background 0.15s',
                  cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: p.features ? '0.5rem' : 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {/* Radio dot */}
                    <div style={{ width: 16, height: 16, borderRadius: '50%', border: `2px solid ${isSelected ? T.accent : T.textMuted}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {isSelected && <div style={{ width: 7, height: 7, borderRadius: '50%', background: T.accent }} />}
                    </div>
                    <span style={{ fontWeight: 800, fontSize: '0.9rem', color: T.textPrimary }}>{p.label}</span>
                    {p.badge && (
                      <span style={{ fontSize: '0.56rem', fontWeight: 800, padding: '2px 7px', borderRadius: 20, background: '#d2992222', color: '#d29922', border: '1px solid #d2992240', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                        {p.badge}
                      </span>
                    )}
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <span style={{ fontSize: '1rem', fontWeight: 800, color: isSelected ? T.accent : T.textPrimary }}>{p.price}</span>
                    {p.save && <div style={{ fontSize: '0.62rem', color: '#3fb950', fontWeight: 700 }}>{p.save}</div>}
                  </div>
                </div>
                {/* Feature list — only show when selected */}
                {isSelected && (
                  <div style={{ paddingLeft: 24, display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {p.features.map(f => (
                      <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: '0.75rem', color: T.textMuted }}>
                        <span style={{ color: '#3fb950', fontWeight: 700, fontSize: '0.7rem', flexShrink: 0 }}>✓</span>
                        {f}
                      </div>
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {error && <p style={{ color: '#f85149', fontSize: '0.78rem', margin: '0 0 0.75rem', textAlign: 'center' }}>{error}</p>}

        <button
          onClick={handlePay}
          disabled={loading}
          style={{ ...btn, width: '100%', padding: '0.8rem', borderRadius: 10, background: T.accent, color: '#fff', fontWeight: 700, fontSize: '0.95rem', opacity: loading ? 0.7 : 1, transition: 'opacity 0.15s' }}
        >
          {loading ? 'Redirecting to checkout…' : `Continue to Checkout — ${current.price}`}
        </button>

        <p style={{ margin: '0.75rem 0 0', textAlign: 'center', fontSize: '0.7rem', color: T.textMuted }}>
          Secure payment via Stripe · No subscription · Cancel anytime
        </p>
      </div>
    </div>
  );
}
