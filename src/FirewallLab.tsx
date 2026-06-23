import React, { useState } from 'react';
import { getLabTheme } from './labTheme';

interface FirewallLabProps { isDarkMode?: boolean; }

type Zone = 'inside' | 'dmz' | 'outside';
type Protocol = 'HTTP' | 'HTTPS' | 'SSH' | 'RDP' | 'ICMP' | 'FTP' | 'DNS';

interface Rule {
  src: Zone | '*';
  dst: Zone | '*';
  proto: Protocol | '*';
  action: 'permit' | 'deny';
  reason: string;
}

export const FirewallLab: React.FC<FirewallLabProps> = ({ isDarkMode = true }) => {
  const [src, setSrc] = useState<Zone>('outside');
  const [dst, setDst] = useState<Zone>('inside');
  const [proto, setProto] = useState<Protocol>('RDP');
  const [result, setResult] = useState<{ action: 'permit' | 'deny'; rule: Rule; matchedIndex: number } | null>(null);
  const T = getLabTheme(isDarkMode);

  const rules: Rule[] = [
    { src: 'inside',  dst: 'outside', proto: '*',     action: 'permit', reason: 'All outbound traffic from the trusted inside network is allowed.' },
    { src: 'inside',  dst: 'dmz',     proto: '*',     action: 'permit', reason: 'Inside network can reach DMZ servers for management.' },
    { src: 'outside', dst: 'dmz',     proto: 'HTTP',  action: 'permit', reason: 'Internet users may reach the DMZ web server on HTTP.' },
    { src: 'outside', dst: 'dmz',     proto: 'HTTPS', action: 'permit', reason: 'Internet users may reach the DMZ web server on HTTPS.' },
    { src: 'outside', dst: 'dmz',     proto: 'DNS',   action: 'permit', reason: 'Internet resolvers may reach the DMZ authoritative DNS server.' },
    { src: 'dmz',     dst: 'outside', proto: 'HTTP',  action: 'permit', reason: 'DMZ servers may fetch updates via HTTP.' },
    { src: 'dmz',     dst: 'outside', proto: 'HTTPS', action: 'permit', reason: 'DMZ servers may fetch updates via HTTPS.' },
    { src: 'dmz',     dst: 'outside', proto: 'DNS',   action: 'permit', reason: 'DMZ servers may resolve names via DNS.' },
    { src: 'dmz',     dst: 'inside',  proto: '*',     action: 'deny',   reason: 'The DMZ must never reach the inside network. A compromised DMZ server cannot pivot inward.' },
    { src: 'outside', dst: 'inside',  proto: '*',     action: 'deny',   reason: 'All unsolicited inbound traffic from the internet to the inside network is blocked.' },
    { src: '*',       dst: '*',       proto: '*',     action: 'deny',   reason: 'Implicit deny — anything not explicitly permitted is blocked.' },
  ];

  const evaluate = () => {
    for (let i = 0; i < rules.length; i++) {
      const r = rules[i];
      const srcMatch = r.src === '*' || r.src === src;
      const dstMatch = r.dst === '*' || r.dst === dst;
      const protoMatch = r.proto === '*' || r.proto === proto;
      if (srcMatch && dstMatch && protoMatch) {
        setResult({ action: r.action, rule: r, matchedIndex: i });
        return;
      }
    }
  };

  const zoneColor: Record<Zone, string> = { inside: T.success, dmz: T.warning, outside: T.danger };
  const zoneLabel: Record<Zone, string> = { inside: 'Inside (LAN)', dmz: 'DMZ', outside: 'Outside (Internet)' };
  const zoneIcon: Record<Zone, string> = { inside: '🏢', dmz: '🖥️', outside: '🌐' };

  const protocols: Protocol[] = ['HTTP', 'HTTPS', 'SSH', 'RDP', 'ICMP', 'FTP', 'DNS'];
  const zones: Zone[] = ['inside', 'dmz', 'outside'];

  const sel = (active: boolean, color: string): React.CSSProperties => ({
    flex: 1, padding: '8px 6px', border: `1px solid ${active ? color : T.borderColor}`,
    borderRadius: '6px', cursor: 'pointer', fontWeight: active ? 700 : 500,
    backgroundColor: active ? `${color}18` : T.panelBg, color: active ? color : T.textSecondary,
    fontSize: '0.8rem', transition: 'all 0.12s', textAlign: 'center' as const,
  });

  return (
    <div style={{ padding: '2rem', backgroundColor: T.cardBg, borderRadius: '12px', border: T.border, color: T.textPrimary, fontFamily: 'system-ui, sans-serif' }}>

      {/* Header */}
      <div style={{ marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: T.border }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Firewall Zone Policy</h3>
        <p style={{ color: T.textSecondary, margin: '4px 0 0', fontSize: '0.875rem' }}>
          Select a source zone, destination zone, and protocol to see which firewall rule applies and why.
        </p>
      </div>

      <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>

        {/* Left — zone diagram + selector */}
        <div style={{ flex: '1 1 380px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* Zone diagram */}
          <div style={{ backgroundColor: T.insetBg, borderRadius: '12px', border: T.border, padding: '1.5rem' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '1rem' }}>Zone topology</span>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0 }}>
              {zones.map((z, i) => (
                <React.Fragment key={z}>
                  <div style={{ textAlign: 'center', padding: '10px 14px', borderRadius: '8px', border: `2px solid ${src === z || dst === z ? zoneColor[z] : T.borderColor}`, backgroundColor: src === z || dst === z ? `${zoneColor[z]}12` : T.panelBg, minWidth: 80 }}>
                    <div style={{ fontSize: '1.5rem' }}>{zoneIcon[z]}</div>
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: zoneColor[z], marginTop: 4 }}>{z.toUpperCase()}</div>
                    <div style={{ fontSize: '0.6rem', color: T.textMuted, marginTop: 2 }}>
                      {z === 'inside' ? '10.0.0.0/24' : z === 'dmz' ? '172.16.0.0/24' : '0.0.0.0/0'}
                    </div>
                  </div>
                  {i < zones.length - 1 && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '0 4px' }}>
                      <div style={{ padding: '4px 8px', backgroundColor: T.panelBg, border: T.border, borderRadius: '4px', fontSize: '0.65rem', fontWeight: 700, color: T.accent, marginBottom: 4 }}>🔥 FW</div>
                      <div style={{ height: 2, width: 24, backgroundColor: T.borderColor }} />
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Traffic selector */}
          <div style={{ backgroundColor: T.panelBg, borderRadius: '12px', border: T.border, padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', marginBottom: '8px' }}>Source zone</label>
              <div style={{ display: 'flex', gap: '6px' }}>
                {zones.map(z => <button key={z} type="button" onClick={() => { setSrc(z); setResult(null); }} style={sel(src === z, zoneColor[z])}>{z.charAt(0).toUpperCase() + z.slice(1)}</button>)}
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', marginBottom: '8px' }}>Destination zone</label>
              <div style={{ display: 'flex', gap: '6px' }}>
                {zones.map(z => <button key={z} type="button" onClick={() => { setDst(z); setResult(null); }} style={sel(dst === z, zoneColor[z])}>{z.charAt(0).toUpperCase() + z.slice(1)}</button>)}
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', marginBottom: '8px' }}>Protocol</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {protocols.map(p => <button key={p} type="button" onClick={() => { setProto(p); setResult(null); }} style={{ ...sel(proto === p, T.accent), flex: 'none', minWidth: 60 }}>{p}</button>)}
              </div>
            </div>

            <button type="button" onClick={evaluate}
              style={{ padding: '0.75rem', borderRadius: '6px', border: 'none', backgroundColor: T.accent, color: '#fff', fontWeight: 700, cursor: src === dst ? 'not-allowed' : 'pointer', opacity: src === dst ? 0.5 : 1, fontSize: '0.9rem' }}
              disabled={src === dst}>
              {src === dst ? 'Source and destination must differ' : 'Evaluate traffic →'}
            </button>
          </div>
        </div>

        {/* Right — result + rule table */}
        <div style={{ flex: '1 1 280px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* Result */}
          {result ? (
            <div style={{ padding: '1.5rem', borderRadius: '12px', backgroundColor: result.action === 'permit' ? T.successSubtle : T.dangerSubtle, border: `2px solid ${result.action === 'permit' ? T.success : T.danger}`, textAlign: 'center' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>{result.action === 'permit' ? '✅' : '🚫'}</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: result.action === 'permit' ? T.success : T.danger, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {result.action}
              </div>
              <div style={{ fontSize: '0.78rem', color: T.textSecondary, lineHeight: 1.6 }}>
                <strong style={{ color: T.textPrimary }}>{proto}</strong> from{' '}
                <strong style={{ color: zoneColor[src] }}>{zoneLabel[src]}</strong> to{' '}
                <strong style={{ color: zoneColor[dst] }}>{zoneLabel[dst]}</strong>
              </div>
              <div style={{ marginTop: '10px', padding: '8px 12px', backgroundColor: result.action === 'permit' ? `${T.success}12` : `${T.danger}12`, borderRadius: '6px', fontSize: '0.78rem', color: T.textSecondary, lineHeight: 1.5, textAlign: 'left' }}>
                <strong style={{ color: T.textPrimary }}>Rule {result.matchedIndex + 1} matched:</strong> {result.rule.reason}
              </div>
            </div>
          ) : (
            <div style={{ padding: '1.5rem', borderRadius: '12px', backgroundColor: T.panelBg, border: T.border, textAlign: 'center', color: T.textMuted, fontSize: '0.85rem', fontStyle: 'italic' }}>
              Configure traffic above and click "Evaluate" to test the firewall policy.
            </div>
          )}

          {/* Rule table */}
          <div style={{ backgroundColor: T.panelBg, borderRadius: '12px', border: T.border, overflow: 'hidden', flexGrow: 1 }}>
            <div style={{ padding: '10px 14px', borderBottom: T.border }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Firewall policy (evaluated top-down)</span>
            </div>
            <div style={{ overflowY: 'auto', maxHeight: 320 }}>
              {rules.map((r, i) => (
                <div key={i} style={{ padding: '7px 14px', borderBottom: T.border, display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: result?.matchedIndex === i ? (r.action === 'permit' ? T.successSubtle : T.dangerSubtle) : 'transparent', transition: 'background-color 0.2s' }}>
                  <span style={{ fontSize: '0.62rem', fontFamily: 'monospace', color: T.textMuted, width: 16, flexShrink: 0, fontWeight: 700 }}>{i + 1}</span>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: r.action === 'permit' ? T.success : T.danger, flexShrink: 0 }} />
                  <span style={{ fontFamily: 'monospace', fontSize: '0.68rem', color: T.textSecondary, flexGrow: 1 }}>
                    <span style={{ color: r.src === '*' ? T.textMuted : zoneColor[r.src as Zone] }}>{r.src}</span>
                    {' → '}
                    <span style={{ color: r.dst === '*' ? T.textMuted : zoneColor[r.dst as Zone] }}>{r.dst}</span>
                    {' '}
                    <span style={{ color: T.accent }}>{r.proto}</span>
                  </span>
                  <span style={{ fontSize: '0.65rem', fontWeight: 700, color: r.action === 'permit' ? T.success : T.danger, textTransform: 'uppercase' }}>{r.action}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* Theory */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', paddingTop: '1.25rem', marginTop: '1.5rem', borderTop: T.border }}>
        <div>
          <h4 style={{ margin: '0 0 6px', fontSize: '0.9rem', fontWeight: 700, color: T.accent }}>Stateful inspection</h4>
          <p style={{ margin: 0, color: T.textSecondary, fontSize: '0.82rem', lineHeight: 1.6 }}>A stateful firewall tracks active sessions. When inside traffic is permitted outbound, it creates a state table entry — return traffic matching that session is automatically allowed without a separate rule. Stateless ACLs require explicit rules for both directions.</p>
        </div>
        <div>
          <h4 style={{ margin: '0 0 6px', fontSize: '0.9rem', fontWeight: 700, color: T.warning }}>The DMZ purpose</h4>
          <p style={{ margin: 0, color: T.textSecondary, fontSize: '0.82rem', lineHeight: 1.6 }}>The DMZ (demilitarised zone) hosts public-facing services — web, mail, DNS — that must be reachable from the internet. If a DMZ server is compromised, the firewall blocks it from reaching the inside network, containing the blast radius.</p>
        </div>
        <div>
          <h4 style={{ margin: '0 0 6px', fontSize: '0.9rem', fontWeight: 700, color: T.danger }}>Implicit deny</h4>
          <p style={{ margin: 0, color: T.textSecondary, fontSize: '0.82rem', lineHeight: 1.6 }}>Every firewall policy ends with an implicit "deny all." If no rule matches a packet, it is dropped silently. This is why the rule base is read top-down — the first match wins, and the implicit deny is always last.</p>
        </div>
      </div>

    </div>
  );
};

export default FirewallLab;
