import { useState } from 'react';
import type { Product } from './UpgradeModal';

interface Props {
  onClose: () => void;
  onBuy: (product: Product) => void;
  isPro: boolean;
  hasExam: boolean;
  isLoggedIn: boolean;
  T: Record<string, string>;
}

const TIERS: {
  id: Product | 'free';
  icon: string;
  label: string;
  price: string;
  priceNote?: string;
  badge?: string;
  gradient: string;
  glow: string;
  color: string;
  features: string[];
  recommended?: boolean;
}[] = [
  {
    id: 'free',
    icon: '🌐',
    label: 'Free',
    price: '£0',
    priceNote: 'forever',
    gradient: 'linear-gradient(135deg,#22c55e,#16a34a)',
    glow: '#22c55e',
    color: '#22c55e',
    features: [
      'All beginner & intermediate labs',
      'Subnetting calculator & tools',
      'Wi-Fi & fundamentals labs',
      'No account required',
    ],
  },
  {
    id: 'labs',
    icon: '🔬',
    label: 'Labs Pro',
    price: '£5.99',
    priceNote: 'one-time',
    gradient: 'linear-gradient(135deg,#4493f8,#2563eb)',
    glow: '#4493f8',
    color: '#4493f8',
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
    icon: '📝',
    label: 'Exam Prep',
    price: '£8.99',
    priceNote: 'one-time',
    gradient: 'linear-gradient(135deg,#a855f7,#7c3aed)',
    glow: '#a855f7',
    color: '#a855f7',
    features: [
      'CompTIA Network+ (N10-009)',
      'CompTIA Security+ (SY0-701)',
      '500+ practice questions',
      'Adaptive difficulty engine',
      'Detailed answer explanations',
      'Timed exam simulation mode',
    ],
  },
  {
    id: 'bundle',
    icon: '🚀',
    label: 'Full Bundle',
    price: '£11.99',
    priceNote: 'one-time · save £2.99',
    badge: 'BEST VALUE',
    gradient: 'linear-gradient(135deg,#f59e0b,#d97706)',
    glow: '#f59e0b',
    color: '#f59e0b',
    recommended: true,
    features: [
      'Everything in Labs Pro',
      'Everything in Exam Prep',
      'Permanent access on all devices',
      'All future content included',
    ],
  },
];

export function PricingModal({ onClose, onBuy, isPro, hasExam, isLoggedIn, T }: Props) {
  const [hovered, setHovered] = useState<string | null>(null);
  const isDark  = T.appBg === '#0d1117';
  const cardBg  = isDark ? '#161b22' : '#ffffff';
  const panelBg = isDark ? '#0d1117' : '#f6f8fa';

  const isOwned = (id: Product | 'free') => {
    if (id === 'free')   return true;
    if (id === 'bundle') return isPro && hasExam;
    if (id === 'labs')   return isPro;
    if (id === 'exam')   return hasExam;
    return false;
  };

  const handleCta = (id: Product | 'free') => {
    if (id === 'free' || isOwned(id)) return;
    onClose();
    onBuy(id as Product);
  };

  return (
    <>
      <style>{`
        @keyframes pm-in  { from{opacity:0;transform:translateY(28px) scale(0.97)} to{opacity:1;transform:none} }
        @keyframes pm-bg  { from{opacity:0} to{opacity:1} }
        @keyframes pm-shine { 0%{background-position:200% center} 100%{background-position:-200% center} }
        .pm-card { transition: transform 0.2s ease, box-shadow 0.2s ease; }
        .pm-card:hover { transform: translateY(-3px); }
      `}</style>

      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', backdropFilter:'blur(6px)', zIndex:9999, animation:'pm-bg 0.2s ease' }}
      />

      {/* Modal */}
      <div style={{ position:'fixed', inset:0, zIndex:10000, display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem', pointerEvents:'none' }}>
        <div
          onClick={e => e.stopPropagation()}
          style={{ background:cardBg, borderRadius:24, maxWidth:660, width:'100%', maxHeight:'92vh', display:'flex', flexDirection:'column', overflow:'hidden', pointerEvents:'auto', animation:'pm-in 0.3s cubic-bezier(0.34,1.3,0.64,1)', boxShadow:'0 32px 80px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.06)' }}
        >
          {/* Header */}
          <div style={{ position:'relative', padding:'2rem 2rem 1.5rem', overflow:'hidden', flexShrink:0 }}>
            {/* Decorative blobs */}
            <div style={{ position:'absolute', top:-40, right:-40, width:180, height:180, borderRadius:'50%', background:'radial-gradient(circle,#4493f820,transparent 70%)', pointerEvents:'none' }} />
            <div style={{ position:'absolute', bottom:-20, left:20, width:120, height:120, borderRadius:'50%', background:'radial-gradient(circle,#a855f718,transparent 70%)', pointerEvents:'none' }} />

            <div style={{ position:'relative', display:'flex', alignItems:'flex-start', justifyContent:'space-between' }}>
              <div>
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:'0.5rem' }}>
                  <div style={{ width:36, height:36, borderRadius:10, background:'linear-gradient(135deg,#4493f8,#a855f7)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1rem' }}>🔷</div>
                  <div>
                    <div style={{ fontSize:'0.6rem', fontWeight:800, color:T.textMuted, textTransform:'uppercase', letterSpacing:'0.12em' }}>NetForge</div>
                    <h2 style={{ margin:0, fontSize:'1.35rem', fontWeight:900, color:T.textPrimary, letterSpacing:'-0.02em', lineHeight:1 }}>Pricing</h2>
                  </div>
                </div>
                <p style={{ margin:'0 0 1rem', fontSize:'0.82rem', color:T.textMuted, lineHeight:1.5 }}>
                  One-time payment. No subscriptions. Access never expires.
                </p>
                {/* Trust badges */}
                <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                  {['🔒 Secure via Stripe', '♾️ Permanent access', '📱 All devices', '⚡ Instant unlock'].map(b => (
                    <span key={b} style={{ fontSize:'0.65rem', padding:'3px 10px', borderRadius:20, background: isDark?'rgba(255,255,255,0.06)':'rgba(0,0,0,0.05)', color:T.textMuted, border:`1px solid ${isDark?'rgba(255,255,255,0.08)':'rgba(0,0,0,0.08)'}` }}>{b}</span>
                  ))}
                </div>
              </div>
              <button
                onClick={onClose}
                style={{ cursor:'pointer', border:'none', background: isDark?'rgba(255,255,255,0.06)':'rgba(0,0,0,0.05)', borderRadius:8, padding:'6px 8px', color:T.textMuted, fontSize:'1rem', lineHeight:1, flexShrink:0, fontFamily:'inherit' }}
              >✕</button>
            </div>
          </div>

          {/* Divider */}
          <div style={{ height:1, background: isDark?'rgba(255,255,255,0.06)':'rgba(0,0,0,0.07)', flexShrink:0 }} />

          {/* Cards grid */}
          <div style={{ overflowY:'auto', padding:'1.25rem', display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.85rem' }}>
            {TIERS.map(tier => {
              const owned    = isOwned(tier.id);
              const isHov    = hovered === tier.id;
              const canBuy   = tier.id !== 'free' && !owned;
              const glow     = tier.recommended
                ? `0 0 0 2px ${tier.glow}50, 0 8px 32px ${tier.glow}25`
                : isHov
                  ? `0 0 0 1px ${tier.glow}30, 0 8px 24px rgba(0,0,0,0.2)`
                  : `0 2px 8px rgba(0,0,0,0.12)`;

              return (
                <div
                  key={tier.id}
                  className="pm-card"
                  onMouseEnter={() => setHovered(tier.id)}
                  onMouseLeave={() => setHovered(null)}
                  style={{ background: tier.recommended ? (isDark?'#1a1525':'#fefce8') : panelBg, borderRadius:16, overflow:'hidden', boxShadow: glow, border: tier.recommended ? `1px solid ${tier.glow}60` : `1px solid ${isDark?'rgba(255,255,255,0.06)':'rgba(0,0,0,0.08)'}`, display:'flex', flexDirection:'column' }}
                >
                  {/* Gradient top bar */}
                  <div style={{ height:4, background:tier.gradient, flexShrink:0 }} />

                  <div style={{ padding:'1rem', flex:1, display:'flex', flexDirection:'column' }}>
                    {/* Icon + name + badge */}
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'0.75rem' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <div style={{ width:32, height:32, borderRadius:9, background:`${tier.glow}18`, border:`1px solid ${tier.glow}30`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1rem' }}>{tier.icon}</div>
                        <span style={{ fontWeight:800, fontSize:'0.9rem', color: owned ? tier.color : T.textPrimary }}>{tier.label}</span>
                      </div>
                      {tier.badge && (
                        <span style={{ fontSize:'0.55rem', fontWeight:800, padding:'3px 8px', borderRadius:20, background:tier.gradient, color:'#fff', letterSpacing:'0.08em' }}>{tier.badge}</span>
                      )}
                      {owned && tier.id !== 'free' && (
                        <span style={{ fontSize:'0.55rem', fontWeight:800, padding:'3px 8px', borderRadius:20, background:`${tier.color}18`, color:tier.color, border:`1px solid ${tier.color}40` }}>ACTIVE</span>
                      )}
                    </div>

                    {/* Price */}
                    <div style={{ marginBottom:'0.85rem', paddingBottom:'0.85rem', borderBottom:`1px solid ${isDark?'rgba(255,255,255,0.06)':'rgba(0,0,0,0.07)'}` }}>
                      <span style={{ fontSize:'2rem', fontWeight:900, color: owned ? tier.color : T.textPrimary, letterSpacing:'-0.03em', lineHeight:1 }}>{tier.price}</span>
                      {tier.priceNote && <div style={{ fontSize:'0.68rem', marginTop:3, fontWeight: tier.recommended?700:400, color: tier.recommended?tier.color:T.textMuted }}>{tier.priceNote}</div>}
                    </div>

                    {/* Features */}
                    <div style={{ flex:1, display:'flex', flexDirection:'column', gap:6, marginBottom:'1rem' }}>
                      {tier.features.map(f => (
                        <div key={f} style={{ display:'flex', alignItems:'flex-start', gap:8, fontSize:'0.73rem', color: isDark?'#c9d1d9':'#374151' }}>
                          <span style={{ width:15, height:15, borderRadius:'50%', background:`${tier.glow}18`, border:`1px solid ${tier.glow}40`, display:'inline-flex', alignItems:'center', justifyContent:'center', fontSize:'0.5rem', fontWeight:900, color:tier.color, flexShrink:0, marginTop:1 }}>✓</span>
                          {f}
                        </div>
                      ))}
                    </div>

                    {/* CTA */}
                    {owned ? (
                      <div style={{ padding:'0.55rem', borderRadius:10, border:`1px solid ${tier.color}40`, background:`${tier.color}10`, textAlign:'center', fontSize:'0.78rem', fontWeight:700, color:tier.color }}>
                        {tier.id === 'free' ? 'Your current plan' : '✓ Unlocked'}
                      </div>
                    ) : (
                      <button
                        onClick={() => handleCta(tier.id)}
                        style={{ cursor:'pointer', border:'none', fontFamily:'inherit', padding:'0.6rem', borderRadius:10, background: canBuy ? tier.gradient : (isDark?'rgba(255,255,255,0.06)':'rgba(0,0,0,0.05)'), color: canBuy ? '#fff' : T.textMuted, fontWeight:700, fontSize:'0.8rem', letterSpacing:'0.01em', boxShadow: canBuy && isHov ? `0 4px 16px ${tier.glow}40` : 'none', transition:'box-shadow 0.2s' }}
                      >
                        {!isLoggedIn ? 'Sign in to buy →' : `Get ${tier.label} →`}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div style={{ padding:'1rem 1.5rem', borderTop:`1px solid ${isDark?'rgba(255,255,255,0.06)':'rgba(0,0,0,0.07)'}`, flexShrink:0, background: isDark?'rgba(0,0,0,0.2)':'rgba(0,0,0,0.02)', textAlign:'center' }}>
            <p style={{ margin:0, fontSize:'0.7rem', color:T.textMuted, lineHeight:1.6 }}>
              Questions? Email <span style={{ color:T.accent }}>support@netforgens.com</span> · Payments processed securely by Stripe · VAT may apply
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
