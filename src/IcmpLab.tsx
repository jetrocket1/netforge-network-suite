import React, { useState } from 'react';
import { getLabTheme } from './labTheme';

interface IcmpLabProps { isDarkMode?: boolean; }
type Mode = 'ping' | 'traceroute';

export const IcmpLab: React.FC<IcmpLabProps> = ({ isDarkMode = true }) => {
  const [mode, setMode] = useState<Mode>('ping');
  const [target, setTarget] = useState('8.8.8.8');
  const [activeHop, setActiveHop] = useState(0);
  const [running, setRunning] = useState(false);
  const [logs, setLogs] = useState<string[]>(['Ready — enter an IP address and run a test.']);
  const T = getLabTheme(isDarkMode);

  const hops = [
    { hop: 1, label: 'Default gateway',       ip: '192.168.1.1',   note: 'Local edge router' },
    { hop: 2, label: 'ISP edge',              ip: '10.254.12.89',  note: 'Regional aggregation' },
    { hop: 3, label: 'Transit backbone',      ip: '64.233.174.45', note: 'Internet exchange point' },
    { hop: 4, label: 'Destination',           ip: '8.8.8.8',       note: 'Google Public DNS' },
  ];

  const run = () => {
    if (running) return;
    setRunning(true);
    setActiveHop(0);

    if (mode === 'ping') {
      setLogs([`Pinging ${target} with 32 bytes of data:`]);
      let n = 1;
      const id = setInterval(() => {
        if (n <= 4) {
          setActiveHop(4);
          setLogs(p => [...p, `Reply from ${target}: bytes=32 time=${11 + n}ms TTL=56`]);
          n++;
        } else {
          clearInterval(id);
          setLogs(p => [...p, `\nPing statistics: 4 sent, 4 received, 0% loss.`]);
          setRunning(false);
          setActiveHop(0);
        }
      }, 500);
    } else {
      setLogs([`Tracing route to ${target} over a maximum of 30 hops:`]);
      let ttl = 1;
      const id = setInterval(() => {
        if (ttl <= hops.length) {
          const h = hops[ttl - 1];
          setActiveHop(ttl);
          const ms = [ttl * 4, ttl * 5, ttl * 3];
          setLogs(p => [...p, `  ${ttl}    ${ms[0]} ms   ${ms[1]} ms   ${ms[2]} ms   ${h.ip}`]);
          if (ttl === hops.length) {
            setLogs(p => [...p, '\nTrace complete.']);
            clearInterval(id);
            setRunning(false);
            setActiveHop(0);
          }
          ttl++;
        } else {
          clearInterval(id);
          setRunning(false);
        }
      }, 800);
    }
  };

  return (
    <div style={{ padding: '2rem', backgroundColor: T.cardBg, borderRadius: '12px', border: T.border, color: T.textPrimary, fontFamily: 'system-ui, sans-serif' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: T.border, flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>ICMP — Ping & Traceroute</h3>
          <p style={{ color: T.textSecondary, margin: '4px 0 0', fontSize: '0.875rem' }}>
            Simulate ICMP echo requests and incremental TTL-based route tracing.
          </p>
        </div>
        <div style={{ display: 'flex', backgroundColor: T.panelBg, padding: '3px', borderRadius: '8px', border: T.border }}>
          {(['ping', 'traceroute'] as Mode[]).map(m => (
            <button key={m} type="button" onClick={() => { setMode(m); setLogs(['Ready — enter an IP address and run a test.']); setActiveHop(0); }}
              style={{ padding: '6px 14px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem', backgroundColor: mode === m ? T.accent : 'transparent', color: mode === m ? '#fff' : T.textSecondary, transition: 'all 0.12s' }}>
              {m === 'ping' ? 'Ping' : 'Traceroute'}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>

        {/* Input + hop map */}
        <div style={{ flex: '1 1 360px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
            <div style={{ flexGrow: 1 }}>
              <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', marginBottom: '5px' }}>Target IP</label>
              <input type="text" value={target} onChange={e => setTarget(e.target.value)} disabled={running}
                style={{ width: '100%', boxSizing: 'border-box', padding: '8px 10px', borderRadius: '6px', border: T.border, backgroundColor: T.insetBg, color: T.textPrimary, fontFamily: 'monospace', fontWeight: 700, fontSize: '0.875rem' }} />
            </div>
            <button type="button" onClick={run} disabled={running}
              style={{ padding: '8px 18px', border: 'none', borderRadius: '6px', backgroundColor: T.success, color: '#fff', fontWeight: 700, cursor: running ? 'not-allowed' : 'pointer', opacity: running ? 0.6 : 1, fontSize: '0.875rem', whiteSpace: 'nowrap' }}>
              {running ? 'Running...' : 'Run'}
            </button>
          </div>

          <div style={{ backgroundColor: T.insetBg, border: T.border, borderRadius: '12px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '8px', flexGrow: 1 }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Route hops</span>
            {hops.map(h => {
              const active = activeHop === h.hop;
              return (
                <div key={h.hop} style={{ display: 'flex', alignItems: 'center', padding: '8px 12px', borderRadius: '6px', backgroundColor: active ? T.accentSubtle : T.panelBg, border: active ? `2px solid ${T.accent}` : T.border, transition: 'all 0.2s', transform: active ? 'scale(1.02)' : 'scale(1)' }}>
                  <div style={{ fontFamily: 'monospace', fontSize: '0.72rem', width: 44, color: active ? T.accent : T.textMuted, fontWeight: 700 }}>Hop {h.hop}</div>
                  <div style={{ flexGrow: 1 }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 700, color: active ? T.accent : T.textPrimary }}>{h.label}</div>
                    <div style={{ fontSize: '0.68rem', fontFamily: 'monospace', color: T.textMuted }}>{h.ip} · {h.note}</div>
                  </div>
                  {active && (
                    <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '2px 7px', borderRadius: 3, backgroundColor: mode === 'ping' ? T.success : T.warning, color: mode === 'ping' ? '#fff' : '#000', fontFamily: 'monospace' }}>
                      {mode === 'ping' ? 'Echo' : `TTL ${h.hop}`}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Terminal + theory */}
        <div style={{ flex: '1 1 280px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ backgroundColor: T.termBg, borderRadius: '12px', padding: '1.25rem', border: `1px solid ${T.termBorder}`, minHeight: 200, display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${T.termBorder}`, paddingBottom: '8px', marginBottom: '10px' }}>
              <span style={{ fontFamily: 'monospace', fontSize: '0.65rem', fontWeight: 700, color: T.termMuted }}>
                {mode === 'ping' ? 'ping output' : 'traceroute output'}
              </span>
              <div style={{ display: 'flex', gap: 4 }}>
                {['#ef4444','#eab308','#22c55e'].map(c => <span key={c} style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: c, display: 'inline-block' }} />)}
              </div>
            </div>
            <div style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: T.termText, lineHeight: '1.6', flexGrow: 1, overflowY: 'auto' }}>
              {logs.map((l, i) => <div key={i} style={{ whiteSpace: 'pre-wrap' }}>{l}</div>)}
            </div>
          </div>

          <div style={{ backgroundColor: T.panelBg, padding: '1rem', borderRadius: '8px', border: T.border, borderLeft: `4px solid ${T.warning}`, fontSize: '0.82rem', lineHeight: '1.6', color: T.textSecondary }}>
            <strong style={{ color: T.warning }}>How it works:</strong>
            <ul style={{ margin: '6px 0 0', paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: 4 }}>
              <li><strong>Ping</strong> sends <code style={{ color: T.accent }}>ICMP Type 8</code> (Echo Request). The destination replies with <code style={{ color: T.accent }}>ICMP Type 0</code> (Echo Reply).</li>
              <li><strong>Traceroute</strong> sends packets with TTL=1, TTL=2, etc. Each router that decrements TTL to zero returns <code style={{ color: T.warning }}>ICMP Type 11</code> (Time Exceeded), revealing its IP address.</li>
            </ul>
          </div>
        </div>

      </div>
    </div>
  );
};

export default IcmpLab;
