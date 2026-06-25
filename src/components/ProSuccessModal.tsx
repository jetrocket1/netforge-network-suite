import { useEffect, useState } from 'react';
import type { Product } from './UpgradeModal';

interface Props {
  onClose: () => void;
  T: Record<string, string>;
}

const CONTENT: Record<Product, { emoji: string; heading: string; sub: string; items: string[] }> = {
  labs: {
    emoji: '🔬',
    heading: 'Pro Labs Unlocked!',
    sub: 'You now have permanent access to all advanced labs.',
    items: ['OSPF Visualiser', 'QoS Traffic Management', 'Firewall Zone Policy', 'IPsec / WireGuard VPN', 'PKI & Certificate Chain', 'Network Forensics', '802.1X NAC', 'Layer 2 Attack Mitigation', 'All future pro labs'],
  },
  exam: {
    emoji: '📝',
    heading: 'Exam Prep Unlocked!',
    sub: 'You now have full access to all CompTIA practice exams.',
    items: ['CompTIA Network+ (N10-009) exam', 'CompTIA Security+ (SY0-701) exam', '500+ practice questions', 'Adaptive difficulty', 'Detailed answer explanations', 'Timed exam mode'],
  },
  bundle: {
    emoji: '🚀',
    heading: 'Full Bundle Unlocked!',
    sub: 'You now have permanent access to everything — labs and exams.',
    items: ['All pro labs unlocked', 'CompTIA N+ exam', 'CompTIA Sec+ exam', '500+ practice questions', 'All future content included'],
  },
};

export function ProSuccessModal({ onClose, T }: Props) {
  const [visible, setVisible] = useState(false);

  // Read which product was purchased (stored before Stripe redirect)
  const product = (() => {
    try { return (localStorage.getItem('nf-pending-product') ?? 'bundle') as Product; } catch { return 'bundle' as Product; }
  })();

  useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(true));
    try { localStorage.removeItem('nf-pending-product'); } catch {}
    return () => cancelAnimationFrame(id);
  }, []);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 280);
  };

  const c      = CONTENT[product] ?? CONTENT.bundle;
  const cardBg = T.appBg === '#0d1117' ? '#161b22' : '#ffffff';
  const isDark = T.appBg === '#0d1117';

  return (
    <>
      <style>{`
        @keyframes nf-pop  { 0%{transform:scale(0.6);opacity:0} 70%{transform:scale(1.15)} 100%{transform:scale(1);opacity:1} }
        @keyframes nf-rise { from{transform:translateY(24px);opacity:0} to{transform:translateY(0);opacity:1} }
      `}</style>

      {/* Backdrop */}
      <div
        onClick={handleClose}
        style={{ position: 'fixed', inset: 0, zIndex: 9998, background: 'rgba(0,0,0,0.72)', opacity: visible ? 1 : 0, transition: 'opacity 0.28s ease' }}
      />

      {/* Card */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
        <div style={{
          background: cardBg,
          border: `1px solid ${T.accent}50`,
          boxShadow: `0 0 0 1px ${T.accent}20, 0 24px 64px rgba(0,0,0,0.5)`,
          borderRadius: 20, padding: '2.5rem 2rem',
          maxWidth: 420, width: '90%', textAlign: 'center',
          pointerEvents: 'auto',
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0) scale(1)' : 'translateY(32px) scale(0.94)',
          transition: 'opacity 0.32s ease, transform 0.32s cubic-bezier(0.34,1.56,0.64,1)',
        }}>
          <div style={{ fontSize: '3.5rem', lineHeight: 1, marginBottom: '1rem', animation: 'nf-pop 0.5s 0.1s both' }}>
            {c.emoji}
          </div>
          <h2 style={{ margin: '0 0 0.4rem', fontSize: '1.5rem', fontWeight: 800, color: T.textPrimary, letterSpacing: '-0.02em', animation: 'nf-rise 0.4s 0.15s both' }}>
            {c.heading}
          </h2>
          <p style={{ margin: '0 0 1.5rem', fontSize: '0.9rem', color: T.textMuted, lineHeight: 1.6, animation: 'nf-rise 0.4s 0.2s both' }}>
            {c.sub}
          </p>

          <div style={{ background: isDark ? 'rgba(68,147,248,0.06)' : 'rgba(9,105,218,0.05)', border: `1px solid ${T.accent}25`, borderRadius: 10, padding: '0.75rem 1rem', marginBottom: '1.75rem', animation: 'nf-rise 0.4s 0.25s both' }}>
            {c.items.map((item, i) => (
              <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 0', fontSize: '0.82rem', color: T.textPrimary, animation: `nf-rise 0.3s ${0.28 + i * 0.06}s both` }}>
                <span style={{ color: '#3fb950', fontWeight: 800, fontSize: '0.75rem', flexShrink: 0 }}>✓</span>
                {item}
              </div>
            ))}
          </div>

          <button
            onClick={handleClose}
            style={{ cursor: 'pointer', border: 'none', fontFamily: 'inherit', width: '100%', padding: '0.8rem', borderRadius: 10, background: T.accent, color: '#fff', fontWeight: 700, fontSize: '1rem', animation: 'nf-rise 0.4s 0.55s both' }}
          >
            Start exploring →
          </button>
        </div>
      </div>
    </>
  );
}
