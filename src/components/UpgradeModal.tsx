import { useState } from 'react';
import type { CSSProperties } from 'react';
import { supabase } from '../lib/supabase';

export type Product = 'labs' | 'exam' | 'bundle';

interface Props {
  onClose: () => void;
  T: Record<string, string>;
  defaultProduct?: Product;
  isPro?: boolean;
  hasExam?: boolean;
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

function owned(id: Product, isPro: boolean, hasExam: boolean): boolean {
  if (id === 'labs')   return isPro;
  if (id === 'exam')   return hasExam;
  if (id === 'bundle') return isPro && hasExam;
  return false;
}

function bestDefault(defaultProduct: Product | undefined, isPro: boolean, hasExam: boolean): Product {
  if (defaultProduct && !owned(defaultProduct, isPro, hasExam)) return defaultProduct;
  if (!owned('bundle', isPro, hasExam)) return 'bundle';
  if (!owned('labs',   isPro, hasExam)) return 'labs';
  return 'exam';
}

export function UpgradeModal({ onClose, T, defaultProduct, isPro = false, hasExam = false }: Props) {
  const allOwned = isPro && hasExam;
  const [selected, setSelected] = useState<Product>(() => bestDefault(defaultProduct, isPro, hasExam));
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
    try { localStorage.setItem('nf-pending-product', selected); } catch {}
    try {
      // Ensure the session token is fresh — an expired JWT causes a 422 at the gateway
      // before the function even runs. getSession() triggers a silent refresh if needed.
      const { data: sessionData, error: sessionErr } = await supabase.auth.getSession();
      if (sessionErr || !sessionData.session) {
        setError('Your session has expired. Please sign in again.');
        setLoading(false);
        return;
      }

      const { data, error: fnErr } = await supabase.functions.invoke('create-checkout-session', {
        body: { product: selected },
      });

      if (fnErr) {
        // Try to extract the actual message from the function's response body
        const body = await (fnErr as unknown as { context?: Response }).context?.json().catch(() => null);
        throw new Error(body?.error ?? 'Could not start checkout. Please try again.');
      }
      if (!data?.url) throw new Error('No checkout URL returned');
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
            <h2 style={{ margin: '0 0 0.25rem', color: T.textPrimary, fontSize: '1.15rem', fontWeight: 800 }}>
              {allOwned ? 'You have everything! 🎉' : 'Upgrade NetForge'}
            </h2>
            <p style={{ margin: 0, fontSize: '0.78rem', color: T.textMuted, lineHeight: 1.5 }}>
              {allOwned
                ? 'You already own Labs Pro and Exam Prep. Enjoy full access!'
                : 'One-time payment. Permanent access across all devices.'}
            </p>
          </div>
          <button onClick={onClose} style={{ ...btn, color: T.textMuted, fontSize: '1.1rem', padding: '0 4px', lineHeight: 1, marginTop: 2 }}>✕</button>
        </div>

        {allOwned ? (
          <button
            onClick={onClose}
            style={{ ...btn, width: '100%', padding: '0.8rem', borderRadius: 10, background: T.accent, color: '#fff', fontWeight: 700, fontSize: '0.95rem' }}
          >
            Back to labs →
          </button>
        ) : (
          <>
            {/* Tier cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1.25rem' }}>
              {PRODUCTS.map(p => {
                const isOwned    = owned(p.id, isPro, hasExam);
                const isSelected = !isOwned && selected === p.id;

                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => { if (!isOwned) setSelected(p.id); }}
                    style={{
                      ...btn,
                      width: '100%', textAlign: 'left',
                      padding: '0.85rem 1rem',
                      borderRadius: 10,
                      border: `2px solid ${isOwned ? '#3fb95040' : isSelected ? T.accent : bd}`,
                      background: isOwned
                        ? (isDark ? '#3fb95008' : '#f0fdf4')
                        : isSelected
                          ? (isDark ? `${T.accent}10` : `${T.accent}08`)
                          : insetBg,
                      opacity: isOwned ? 0.75 : 1,
                      cursor: isOwned ? 'default' : 'pointer',
                      transition: 'border-color 0.15s, background 0.15s',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: isSelected ? '0.5rem' : 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {/* Radio dot or purchased tick */}
                        {isOwned ? (
                          <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#3fb950', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <span style={{ color: '#fff', fontSize: '0.55rem', fontWeight: 900, lineHeight: 1 }}>✓</span>
                          </div>
                        ) : (
                          <div style={{ width: 16, height: 16, borderRadius: '50%', border: `2px solid ${isSelected ? T.accent : T.textMuted}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            {isSelected && <div style={{ width: 7, height: 7, borderRadius: '50%', background: T.accent }} />}
                          </div>
                        )}
                        <span style={{ fontWeight: 800, fontSize: '0.9rem', color: T.textPrimary }}>{p.label}</span>
                        {isOwned && (
                          <span style={{ fontSize: '0.56rem', fontWeight: 800, padding: '2px 7px', borderRadius: 20, background: '#3fb95022', color: '#3fb950', border: '1px solid #3fb95040', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                            Purchased
                          </span>
                        )}
                        {!isOwned && p.badge && (
                          <span style={{ fontSize: '0.56rem', fontWeight: 800, padding: '2px 7px', borderRadius: 20, background: '#d2992222', color: '#d29922', border: '1px solid #d2992240', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                            {p.badge}
                          </span>
                        )}
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        {isOwned ? (
                          <span style={{ fontSize: '0.72rem', color: '#3fb950', fontWeight: 700 }}>✓ Owned</span>
                        ) : (
                          <>
                            <span style={{ fontSize: '1rem', fontWeight: 800, color: isSelected ? T.accent : T.textPrimary }}>{p.price}</span>
                            {p.save && <div style={{ fontSize: '0.62rem', color: '#3fb950', fontWeight: 700 }}>{p.save}</div>}
                          </>
                        )}
                      </div>
                    </div>
                    {/* Feature list — only show when selected and not owned */}
                    {isSelected && !isOwned && (
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
          </>
        )}
      </div>
    </div>
  );
}
