import React, { useState } from 'react';
import { getLabTheme } from './labTheme';

interface NatLabProps { isDarkMode?: boolean; }

interface NatEntry {
  insideLocal: string;
  insidePort: number;
  insideGlobal: string;
  outsidePort: number;
  protocol: string;
  state: 'active' | 'new';
}

interface Host {
  ip: string;
  label: string;
}

export const NatLab: React.FC<NatLabProps> = ({ isDarkMode = true }) => {
  const [natTable, setNatTable] = useState<NatEntry[]>([]);
  const [mode, setMode] = useState<'PAT' | 'static' | 'dynamic'>('PAT');
  const [lastSrc, setLastSrc] = useState<string | null>(null);
  const [animating, setAnimating] = useState(false);
  const T = getLabTheme(isDarkMode);

  const PUBLIC_IP = '203.0.113.10';
  const STATIC_MAP: Record<string, string> = {
    '10.0.0.10': '203.0.113.21',
    '10.0.0.20': '203.0.113.22',
    '10.0.0.30': '203.0.113.23',
  };
  const POOL = ['203.0.113.21', '203.0.113.22', '203.0.113.23'];

  const hosts: Host[] = [
    { ip: '10.0.0.10', label: 'Host A' },
    { ip: '10.0.0.20', label: 'Host B' },
    { ip: '10.0.0.30', label: 'Host C' },
  ];

  const usedPorts = natTable.filter(e => e.insideGlobal === PUBLIC_IP).map(e => e.outsidePort);
  const nextPort = () => {
    let p = 10000;
    while (usedPorts.includes(p)) p++;
    return p;
  };

  const usedPoolIps = natTable.map(e => e.insideGlobal).filter(ip => ip !== PUBLIC_IP);
  const nextPoolIp = () => POOL.find(ip => !usedPoolIps.includes(ip)) ?? null;

  const sendPacket = (host: Host) => {
    if (animating) return;
    setAnimating(true);
    setLastSrc(host.ip);
    setTimeout(() => {
      setNatTable(prev => {
        const existing = prev.find(e => e.insideLocal === host.ip);
        if (existing && mode === 'PAT') {
          const port = nextPort();
          return [
            ...prev.map(e => ({ ...e, state: 'active' as const })),
            { insideLocal: host.ip, insidePort: 80, insideGlobal: PUBLIC_IP, outsidePort: port, protocol: 'TCP', state: 'new' as const },
          ];
        }
        if (mode === 'PAT') {
          const port = nextPort();
          return [...prev.map(e => ({ ...e, state: 'active' as const })), { insideLocal: host.ip, insidePort: 80, insideGlobal: PUBLIC_IP, outsidePort: port, protocol: 'TCP', state: 'new' as const }];
        }
        if (mode === 'static') {
          if (prev.find(e => e.insideLocal === host.ip)) return prev.map(e => ({ ...e, state: 'active' as const }));
          return [...prev.map(e => ({ ...e, state: 'active' as const })), { insideLocal: host.ip, insidePort: 0, insideGlobal: STATIC_MAP[host.ip], outsidePort: 0, protocol: 'any', state: 'new' as const }];
        }
        // dynamic pool
        if (prev.find(e => e.insideLocal === host.ip)) return prev.map(e => ({ ...e, state: 'active' as const }));
        const poolIp = nextPoolIp();
        if (!poolIp) return prev;
        return [...prev.map(e => ({ ...e, state: 'active' as const })), { insideLocal: host.ip, insidePort: 0, insideGlobal: poolIp, outsidePort: 0, protocol: 'any', state: 'new' as const }];
      });
      setAnimating(false);
    }, 600);
  };

  const modeInfo = {
    PAT: {
      title: 'PAT — Port Address Translation (NAT Overload)',
      desc: 'Many inside hosts share a single public IP. The router tracks each session by assigning a unique source port number. This is the most common form of NAT — used in virtually every home and office router.',
    },
    static: {
      title: 'Static NAT — One-to-One Mapping',
      desc: 'Each inside host maps permanently to a dedicated public IP. Return traffic is always allowed for that specific pair. Used to publish internal servers (e.g., a web or mail server) to the internet.',
    },
    dynamic: {
      title: 'Dynamic NAT — Address Pool',
      desc: 'Inside hosts borrow a public IP from a pool when they need one and return it when done. If the pool is exhausted, new sessions are dropped. Less common than PAT but provides dedicated addresses for each active session.',
    },
  };

  return (
    <div style={{ padding: '2rem', backgroundColor: T.cardBg, borderRadius: '12px', border: T.border, color: T.textPrimary, fontFamily: 'system-ui, sans-serif' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: T.border, flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>NAT / PAT Simulator</h3>
          <p style={{ color: T.textSecondary, margin: '4px 0 0', fontSize: '0.875rem' }}>
            Click a host to send a packet and watch the NAT table build in real time.
          </p>
        </div>
        <div style={{ display: 'flex', backgroundColor: T.panelBg, padding: '3px', borderRadius: '8px', border: T.border }}>
          {(['PAT', 'static', 'dynamic'] as const).map(m => (
            <button key={m} type="button" onClick={() => { setMode(m); setNatTable([]); setLastSrc(null); }}
              style={{ padding: '6px 12px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 700, fontSize: '0.78rem', backgroundColor: mode === m ? T.accent : 'transparent', color: mode === m ? '#fff' : T.textSecondary, transition: 'all 0.12s' }}>
              {m === 'PAT' ? 'PAT' : m === 'static' ? 'Static NAT' : 'Dynamic NAT'}
            </button>
          ))}
        </div>
      </div>

      {/* Mode description */}
      <div style={{ padding: '12px 14px', backgroundColor: T.accentSubtle, border: `1px solid ${T.borderColor}`, borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.82rem', lineHeight: '1.6', color: T.textSecondary }}>
        <strong style={{ color: T.accent }}>{modeInfo[mode].title}</strong><br />
        {modeInfo[mode].desc}
      </div>

      <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>

        {/* Network diagram */}
        <div style={{ flex: '1 1 380px', backgroundColor: T.insetBg, borderRadius: '12px', border: T.border, padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <span style={{ fontSize: '0.7rem', fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Network diagram</span>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 80px 1fr', alignItems: 'center', gap: '8px' }}>

            {/* Inside hosts */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {hosts.map(h => {
                const isActive = lastSrc === h.ip;
                const hasEntry = natTable.some(e => e.insideLocal === h.ip);
                return (
                  <button key={h.ip} type="button" onClick={() => sendPacket(h)} disabled={animating}
                    style={{ padding: '10px', borderRadius: '8px', border: `2px solid ${isActive ? T.accent : hasEntry ? T.success : T.borderColor}`, backgroundColor: isActive ? T.accentSubtle : hasEntry ? T.successSubtle : T.panelBg, cursor: animating ? 'not-allowed' : 'pointer', textAlign: 'center', transition: 'all 0.15s' }}>
                    <div style={{ fontSize: '1.1rem' }}>💻</div>
                    <div style={{ fontSize: '0.7rem', fontWeight: 700, color: isActive ? T.accent : T.textPrimary, marginTop: 3 }}>{h.label}</div>
                    <div style={{ fontSize: '0.62rem', fontFamily: 'monospace', color: T.textMuted }}>{h.ip}</div>
                  </button>
                );
              })}
            </div>

            {/* Wire + label */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ height: 2, backgroundColor: T.borderColor, marginBottom: 4 }} />
              <div style={{ fontSize: '0.58rem', color: T.textMuted, fontFamily: 'monospace' }}>Private<br />10.0.0.0/24</div>
            </div>

            {/* NAT Router */}
            <div style={{ padding: '12px 6px', borderRadius: '8px', backgroundColor: T.panelBg, border: `2px solid ${T.accent}`, textAlign: 'center' }}>
              <div style={{ fontSize: '1.3rem' }}>🔀</div>
              <div style={{ fontSize: '0.62rem', fontWeight: 700, color: T.accent, marginTop: 3, fontFamily: 'monospace' }}>NAT</div>
              <div style={{ fontSize: '0.55rem', color: T.textMuted, fontFamily: 'monospace', marginTop: 2 }}>{PUBLIC_IP}</div>
            </div>

            {/* Internet server */}
            <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: T.panelBg, border: T.border, textAlign: 'center' }}>
              <div style={{ fontSize: '1.3rem' }}>🌐</div>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, marginTop: 3 }}>Web Server</div>
              <div style={{ fontSize: '0.62rem', fontFamily: 'monospace', color: T.textMuted }}>198.51.100.5<br />:443</div>
            </div>
          </div>

          <div style={{ fontSize: '0.75rem', color: T.textMuted, textAlign: 'center', fontStyle: 'italic' }}>
            Click a host to simulate sending a packet through the NAT router
          </div>

          <button type="button" onClick={() => { setNatTable([]); setLastSrc(null); }}
            style={{ padding: '0.6rem', borderRadius: '6px', border: `1px solid ${T.borderColor}`, backgroundColor: 'transparent', color: T.textSecondary, cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem' }}>
            Clear NAT table
          </button>
        </div>

        {/* NAT Table */}
        <div style={{ flex: '1 1 300px' }}>
          <div style={{ backgroundColor: T.panelBg, borderRadius: '12px', border: T.border, overflow: 'hidden' }}>
            <div style={{ padding: '10px 14px', borderBottom: T.border, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                NAT translation table
              </span>
              <span style={{ fontSize: '0.68rem', color: T.textMuted, fontFamily: 'monospace' }}>{natTable.length} {natTable.length === 1 ? 'entry' : 'entries'}</span>
            </div>

            {natTable.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: T.textMuted, fontSize: '0.82rem', fontStyle: 'italic' }}>
                Table is empty — send a packet to populate it.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'monospace', fontSize: '0.72rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: T.insetBg }}>
                      <th style={{ padding: '6px 10px', textAlign: 'left', color: T.textMuted, fontWeight: 700, borderBottom: T.border }}>Inside local</th>
                      <th style={{ padding: '6px 10px', textAlign: 'left', color: T.textMuted, fontWeight: 700, borderBottom: T.border }}>Inside global</th>
                      {mode === 'PAT' && <th style={{ padding: '6px 10px', textAlign: 'left', color: T.textMuted, fontWeight: 700, borderBottom: T.border }}>Port</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {natTable.map((e, i) => (
                      <tr key={i} style={{ backgroundColor: e.state === 'new' ? T.successSubtle : 'transparent', transition: 'background-color 0.5s' }}>
                        <td style={{ padding: '7px 10px', color: T.textPrimary, borderBottom: T.border }}>{e.insideLocal}</td>
                        <td style={{ padding: '7px 10px', color: T.accent, fontWeight: 700, borderBottom: T.border }}>{e.insideGlobal}</td>
                        {mode === 'PAT' && <td style={{ padding: '7px 10px', color: T.success, borderBottom: T.border }}>:{e.outsidePort}</td>}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Theory */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', paddingTop: '1.25rem', borderTop: T.border }}>
        <div>
          <h4 style={{ margin: '0 0 6px', fontSize: '0.9rem', fontWeight: 700, color: T.accent }}>Why NAT exists</h4>
          <p style={{ margin: 0, color: T.textSecondary, fontSize: '0.82rem', lineHeight: 1.6 }}>IPv4 has roughly 4.3 billion addresses — far fewer than devices on earth. NAT lets an entire network share one public IP, which solved address exhaustion long enough for IPv6 to mature.</p>
        </div>
        <div>
          <h4 style={{ margin: '0 0 6px', fontSize: '0.9rem', fontWeight: 700, color: T.warning }}>NAT and firewalls</h4>
          <p style={{ margin: 0, color: T.textSecondary, fontSize: '0.82rem', lineHeight: 1.6 }}>PAT provides implicit inbound filtering: unsolicited packets from the internet have no matching NAT table entry, so the router drops them. This is not a firewall by design, but it has a similar effect in practice.</p>
        </div>
        <div>
          <h4 style={{ margin: '0 0 6px', fontSize: '0.9rem', fontWeight: 700, color: T.success }}>NAT and IPv6</h4>
          <p style={{ margin: 0, color: T.textSecondary, fontSize: '0.82rem', lineHeight: 1.6 }}>IPv6's enormous address space (3.4 × 10³⁸) eliminates the need for NAT. Every device can have a globally unique address, restoring end-to-end connectivity that NAT breaks for protocols like VoIP and peer-to-peer.</p>
        </div>
      </div>

    </div>
  );
};

export default NatLab;
