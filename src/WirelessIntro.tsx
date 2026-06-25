import React, { useState } from 'react';
import { getLabTheme } from './labTheme';

interface Props { isDarkMode?: boolean; }
type Tab = 'overview' | 'bands' | 'topology' | 'standards';

const BANDS = [
  {
    name: '2.4 GHz', color: '#22c55e', textColor: '#fff',
    speed: '600 Mbps', speedPct: 14,
    range: '~70 m indoors', rangePct: 85,
    penetration: 'Excellent', penPct: 90,
    channels: '14 total · 3 non-overlapping (1, 6, 11)',
    pros: ['Long range', 'Penetrates walls well', 'Works with older devices'],
    cons: ['Congested (microwaves, Bluetooth)', 'Slower max speed', 'Only 3 usable channels'],
  },
  {
    name: '5 GHz', color: '#4493f8', textColor: '#fff',
    speed: '3.5 Gbps', speedPct: 50,
    range: '~35 m indoors', rangePct: 45,
    penetration: 'Good', penPct: 55,
    channels: '25 non-overlapping (UNII-1, 2, 3)',
    pros: ['Much faster', '25 non-overlapping channels', 'Far less interference'],
    cons: ['Shorter range', 'Struggles through walls', 'Older devices may lack it'],
  },
  {
    name: '6 GHz', color: '#a855f7', textColor: '#fff',
    speed: '9.6 Gbps', speedPct: 100,
    range: '~15 m indoors', rangePct: 18,
    penetration: 'Fair', penPct: 25,
    channels: '59 non-overlapping (WiFi 6E / 7)',
    pros: ['Highest throughput', '59 clean channels', 'Zero legacy interference'],
    cons: ['Very short range', 'Requires WiFi 6E or WiFi 7 device', 'Poor wall penetration'],
  },
];

const STANDARDS = [
  { name: '802.11b', year: 1999, band: '2.4 GHz',     maxSpeed: '11 Mbps',   speedN: 11,    wifiName: '—',         color: '#6b7280' },
  { name: '802.11a', year: 1999, band: '5 GHz',       maxSpeed: '54 Mbps',   speedN: 54,    wifiName: '—',         color: '#6b7280' },
  { name: '802.11g', year: 2003, band: '2.4 GHz',     maxSpeed: '54 Mbps',   speedN: 54,    wifiName: '—',         color: '#6b7280' },
  { name: '802.11n', year: 2009, band: '2.4 / 5 GHz', maxSpeed: '600 Mbps',  speedN: 600,   wifiName: 'WiFi 4',    color: '#22c55e' },
  { name: '802.11ac',year: 2013, band: '5 GHz',       maxSpeed: '3.5 Gbps',  speedN: 3500,  wifiName: 'WiFi 5',    color: '#4493f8' },
  { name: '802.11ax',year: 2021, band: '2.4 / 5 / 6 GHz', maxSpeed: '9.6 Gbps', speedN: 9600, wifiName: 'WiFi 6 / 6E', color: '#a855f7' },
  { name: '802.11be',year: 2024, band: '2.4 / 5 / 6 GHz', maxSpeed: '46 Gbps',  speedN: 46000, wifiName: 'WiFi 7', color: '#f59e0b' },
];

// ── Channel overlap SVG for 2.4 GHz ──────────────────────────────────────────
function ChannelOverlapSvg({ isDark }: { isDark: boolean }) {
  const H = 80, W = 480;
  const highlight = new Set([1, 6, 11]);
  const channels = Array.from({ length: 11 }, (_, i) => i + 1);
  const cx = (ch: number) => ((ch - 1) / 10) * (W - 40) + 20;
  // Each 802.11b/g channel is ~22 MHz wide, spaced 5 MHz → about 4.4 ch spacing
  const halfW = (22 / 5) * ((W - 40) / 10) / 2;

  const arc = (ch: number) => {
    const x = cx(ch);
    const isHigh = highlight.has(ch);
    const color = isHigh ? (ch === 1 ? '#22c55e' : ch === 6 ? '#4493f8' : '#a855f7') : (isDark ? '#374151' : '#d1d5db');
    return (
      <g key={ch}>
        <path
          d={`M ${x - halfW} ${H} Q ${x - halfW * 0.3} ${H * 0.05} ${x} ${H * 0.05} Q ${x + halfW * 0.3} ${H * 0.05} ${x + halfW} ${H}`}
          fill={color}
          fillOpacity={isHigh ? 0.55 : 0.3}
          stroke={color}
          strokeWidth={isHigh ? 1.5 : 0.5}
          strokeOpacity={isHigh ? 0.9 : 0.4}
        />
        {isHigh && (
          <text x={x} y={H * 0.05 - 7} textAnchor="middle" fontSize={9} fontWeight={800} fill={color}>
            Ch {ch}
          </text>
        )}
      </g>
    );
  };

  return (
    <div style={{ overflowX: 'auto' }}>
      <svg width="100%" viewBox={`0 0 ${W} ${H + 24}`} style={{ minWidth: 280 }}>
        {/* Baseline */}
        <line x1={10} y1={H} x2={W - 10} y2={H} stroke={isDark ? '#30363d' : '#e5e7eb'} strokeWidth={1} />
        {/* Gray channels first (so highlights draw on top) */}
        {channels.filter(c => !highlight.has(c)).map(arc)}
        {/* Highlighted channels */}
        {[1, 6, 11].map(arc)}
        {/* Channel number labels */}
        {channels.map(ch => (
          <text key={ch} x={cx(ch)} y={H + 14} textAnchor="middle" fontSize={8}
            fill={highlight.has(ch) ? (isDark ? '#e6edf3' : '#1e293b') : (isDark ? '#6b7280' : '#9ca3af')}
            fontWeight={highlight.has(ch) ? 700 : 400}>
            {ch}
          </text>
        ))}
      </svg>
      <p style={{ margin: '0.25rem 0 0', fontSize: '0.72rem', color: isDark ? '#6b7280' : '#9ca3af', textAlign: 'center' }}>
        Channels 1–11 (US). Only <strong style={{ color: '#22c55e' }}>1</strong>, <strong style={{ color: '#4493f8' }}>6</strong>, <strong style={{ color: '#a855f7' }}>11</strong> are non-overlapping — use these to avoid co-channel interference.
      </p>
    </div>
  );
}

// ── Topology SVG ──────────────────────────────────────────────────────────────
function TopologySvg({ isDark }: { isDark: boolean }) {
  const tc = isDark ? '#e6edf3' : '#1e293b';
  const mc = isDark ? '#8b949e' : '#64748b';
  const acc = '#4493f8';

  const clients = [
    { x: 100, y: 80,  icon: '💻', label: 'Laptop' },
    { x: 310, y: 60,  icon: '📱', label: 'Phone' },
    { x: 360, y: 185, icon: '🖨️', label: 'Printer' },
    { x: 90,  y: 200, icon: '📺', label: 'Smart TV' },
    { x: 200, y: 260, icon: '🎮', label: 'Console' },
  ];

  const apX = 230, apY = 155;

  return (
    <svg viewBox="0 0 460 310" style={{ width: '100%', maxHeight: 260 }}>
      {/* BSA boundary */}
      <ellipse cx={apX} cy={apY} rx={165} ry={135}
        fill={`${acc}08`} stroke={acc} strokeWidth={1.5} strokeDasharray="6 4" />
      <text x={apX} y={apY - 143} textAnchor="middle" fontSize={9} fill={acc} fontWeight={700}>
        BSA — Basic Service Area
      </text>

      {/* Signal lines */}
      {clients.map((c, i) => (
        <line key={i} x1={apX} y1={apY} x2={c.x} y2={c.y}
          stroke={acc} strokeWidth={1.2} strokeDasharray="4 3" strokeOpacity={0.5} />
      ))}

      {/* AP */}
      <rect x={apX - 28} y={apY - 20} width={56} height={40} rx={10}
        fill={`${acc}22`} stroke={acc} strokeWidth={2} />
      <text x={apX} y={apY - 2}  textAnchor="middle" fontSize={16}>📶</text>
      <text x={apX} y={apY + 25} textAnchor="middle" fontSize={8.5} fontWeight={800} fill={tc}>AP</text>

      {/* SSID / BSSID label */}
      <rect x={apX + 32} y={apY - 30} width={120} height={38} rx={6}
        fill={isDark ? '#161b22' : '#f0f6ff'} stroke={acc} strokeWidth={1} strokeOpacity={0.4} />
      <text x={apX + 38} y={apY - 15} fontSize={7.5} fill={acc} fontWeight={700}>SSID</text>
      <text x={apX + 38} y={apY - 4}  fontSize={7.5} fill={tc}>"NetForgens_5G"</text>
      <text x={apX + 38} y={apY + 7}  fontSize={7}   fill={mc}>BSSID: AA:BB:CC:DD:EE:FF</text>

      {/* Client nodes */}
      {clients.map((c, i) => (
        <g key={i}>
          <circle cx={c.x} cy={c.y} r={22} fill={isDark ? '#161b22' : '#f8fafc'}
            stroke={isDark ? '#30363d' : '#e2e8f0'} strokeWidth={1.5} />
          <text x={c.x} y={c.y + 5}  textAnchor="middle" fontSize={15}>{c.icon}</text>
          <text x={c.x} y={c.y + 34} textAnchor="middle" fontSize={7.5} fill={mc}>{c.label}</text>
        </g>
      ))}
    </svg>
  );
}

// ── Radio wave animation SVG ───────────────────────────────────────────────────
function RadioWaveSvg({ isDark }: { isDark: boolean }) {
  const acc = '#4493f8';
  const tc  = isDark ? '#e6edf3' : '#1e293b';
  const mc  = isDark ? '#8b949e' : '#64748b';

  const devices = [
    { x: 50,  y: 80,  icon: '💻' },
    { x: 370, y: 70,  icon: '📱' },
    { x: 60,  y: 195, icon: '📺' },
    { x: 360, y: 200, icon: '🎮' },
  ];

  return (
    <>
      <style>{`
        @keyframes wi-w1 { 0%,100%{opacity:0.1;stroke-width:1.5} 20%{opacity:0.9;stroke-width:2} 40%,100%{opacity:0.1} }
        @keyframes wi-w2 { 0%,20%{opacity:0.1} 40%{opacity:0.85;stroke-width:2} 60%,100%{opacity:0.1;stroke-width:1.5} }
        @keyframes wi-w3 { 0%,40%{opacity:0.1} 60%{opacity:0.75;stroke-width:2} 80%,100%{opacity:0.1;stroke-width:1.5} }
        @keyframes wi-w4 { 0%,60%{opacity:0.1} 80%{opacity:0.6;stroke-width:2} 100%{opacity:0.1;stroke-width:1.5} }
        @keyframes wi-link { 0%,100%{stroke-dashoffset:20} 50%{stroke-dashoffset:0} }
      `}</style>
      <svg viewBox="0 0 420 270" style={{ width: '100%', maxHeight: 220 }}>
        {/* Animated data lines to devices */}
        {devices.map((d, i) => (
          <line key={i} x1={210} y1={135} x2={d.x} y2={d.y}
            stroke={acc} strokeWidth={1} strokeDasharray="6 4" strokeOpacity={0.4}
            style={{ animation: `wi-link ${1.4 + i * 0.3}s linear infinite`, animationDelay: `${i * 0.25}s` }} />
        ))}

        {/* Radio wave arcs */}
        {([30, 55, 80, 108] as const).map((r, i) => (
          <ellipse key={i} cx={210} cy={135} rx={r} ry={r * 0.55}
            fill="none" stroke={acc} strokeWidth={1.5} strokeOpacity={0.1}
            style={{ animation: `wi-w${i + 1} 2s ease-in-out infinite`, animationDelay: `${i * 0.45}s` }} />
        ))}

        {/* AP device */}
        <rect x={183} y={115} width={54} height={40} rx={11}
          fill={`${acc}20`} stroke={acc} strokeWidth={2} />
        <text x={210} y={134} textAnchor="middle" fontSize={18}>📶</text>
        <text x={210} y={148} textAnchor="middle" fontSize={8} fontWeight={800} fill={tc}>Access Point</text>

        {/* Devices */}
        {devices.map((d, i) => (
          <g key={i}>
            <circle cx={d.x} cy={d.y} r={20}
              fill={isDark ? '#161b22' : '#f8fafc'}
              stroke={isDark ? '#30363d' : '#e2e8f0'} strokeWidth={1.5} />
            <text x={d.x} y={d.y + 6} textAnchor="middle" fontSize={14}>{d.icon}</text>
          </g>
        ))}

        {/* "Data" label */}
        <text x={210} y={260} textAnchor="middle" fontSize={9} fill={mc}>
          Radio waves carry 802.11 frames bidirectionally between AP and clients
        </text>
      </svg>
    </>
  );
}

// ── Tabs ──────────────────────────────────────────────────────────────────────
function OverviewTab({ T, isDark }: { T: ReturnType<typeof getLabTheme>; isDark: boolean }) {
  const concepts = [
    {
      icon: '📡',
      title: 'Radio Waves',
      body: 'Wireless networks transmit data as electromagnetic waves in the 2.4 GHz, 5 GHz, or 6 GHz frequency bands — the same physics as FM radio, just at a much higher frequency.',
    },
    {
      icon: '📜',
      title: 'IEEE 802.11',
      body: 'The 802.11 standard defines how wireless devices talk to each other. Each revision (b, a, g, n, ac, ax, be) brought faster speeds, more channels, or better efficiency.',
    },
    {
      icon: '🔁',
      title: 'Half-Duplex Shared Medium',
      body: 'Unlike wired Ethernet, all Wi-Fi clients on the same channel share the same airspace. Only one device transmits at a time — managed by CSMA/CA (listen before you talk).',
    },
    {
      icon: '🏷️',
      title: 'SSID & BSSID',
      body: 'The SSID is the human-readable network name (e.g. "HomeWifi"). The BSSID is the AP\'s MAC address that uniquely identifies it. Clients associate to a BSSID, not just an SSID.',
    },
  ];

  return (
    <div>
      {/* Animated diagram */}
      <div style={{ backgroundColor: T.insetBg, border: T.border, borderRadius: 12, padding: '1.5rem 1rem', marginBottom: '1.25rem' }}>
        <RadioWaveSvg isDark={isDark} />
      </div>

      {/* Concept cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: '0.75rem' }}>
        {concepts.map(c => (
          <div key={c.title} style={{ backgroundColor: T.panelBg, border: T.border, borderRadius: 10, padding: '1rem' }}>
            <div style={{ fontSize: '1.25rem', marginBottom: 6 }}>{c.icon}</div>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: T.textPrimary, marginBottom: 4 }}>{c.title}</div>
            <div style={{ fontSize: '0.78rem', color: T.textSecondary, lineHeight: 1.6 }}>{c.body}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function BandsTab({ T, isDark, selBand, setSelBand }: { T: ReturnType<typeof getLabTheme>; isDark: boolean; selBand: number; setSelBand: (n: number) => void }) {
  const b = BANDS[selBand];
  const barBg = isDark ? '#21262d' : '#e5e7eb';

  return (
    <div>
      {/* Band selector */}
      <div style={{ display: 'flex', gap: 8, marginBottom: '1.25rem' }}>
        {BANDS.map((band, i) => (
          <button key={band.name} onClick={() => setSelBand(i)}
            style={{ flex: 1, padding: '0.6rem', borderRadius: 10, border: `2px solid ${selBand === i ? band.color : 'transparent'}`, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700, fontSize: '0.85rem', background: selBand === i ? `${band.color}22` : (isDark ? '#161b22' : '#f8fafc'), color: selBand === i ? band.color : T.textMuted, transition: 'all 0.15s' }}>
            {band.name}
          </button>
        ))}
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
        <div style={{ backgroundColor: T.panelBg, border: T.border, borderRadius: 10, padding: '1.1rem' }}>
          <div style={{ fontSize: '0.65rem', fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.85rem' }}>Performance</div>

          {[
            { label: 'Max Speed', value: b.speed, pct: b.speedPct },
            { label: 'Indoor Range', value: b.range, pct: b.rangePct },
            { label: 'Wall Penetration', value: b.penetration, pct: b.penPct },
          ].map(row => (
            <div key={row.label} style={{ marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: '0.78rem', color: T.textMuted }}>{row.label}</span>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: b.color }}>{row.value}</span>
              </div>
              <div style={{ height: 6, borderRadius: 3, background: barBg, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${row.pct}%`, background: b.color, borderRadius: 3, transition: 'width 0.4s ease' }} />
              </div>
            </div>
          ))}

          <div style={{ marginTop: '0.75rem', padding: '0.5rem 0.7rem', background: isDark ? '#0d1117' : '#f1f5f9', borderRadius: 6, fontSize: '0.75rem', color: T.textSecondary }}>
            <span style={{ fontWeight: 700, color: T.textPrimary }}>Channels: </span>{b.channels}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ backgroundColor: T.panelBg, border: T.border, borderRadius: 10, padding: '1rem', flex: 1 }}>
            <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#22c55e', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>Pros</div>
            {b.pros.map(p => (
              <div key={p} style={{ display: 'flex', gap: 7, marginBottom: 5, fontSize: '0.78rem', color: T.textSecondary }}>
                <span style={{ color: '#22c55e', flexShrink: 0, fontWeight: 700 }}>✓</span>{p}
              </div>
            ))}
          </div>
          <div style={{ backgroundColor: T.panelBg, border: T.border, borderRadius: 10, padding: '1rem', flex: 1 }}>
            <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#f85149', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>Cons</div>
            {b.cons.map(c => (
              <div key={c} style={{ display: 'flex', gap: 7, marginBottom: 5, fontSize: '0.78rem', color: T.textSecondary }}>
                <span style={{ color: '#f85149', flexShrink: 0, fontWeight: 700 }}>✗</span>{c}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Channel overlap (only for 2.4 GHz) */}
      {selBand === 0 && (
        <div style={{ backgroundColor: T.panelBg, border: T.border, borderRadius: 10, padding: '1rem' }}>
          <div style={{ fontSize: '0.65rem', fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.75rem' }}>Channel Overlap (2.4 GHz)</div>
          <ChannelOverlapSvg isDark={isDark} />
        </div>
      )}

      {selBand !== 0 && (
        <div style={{ backgroundColor: T.insetBg, border: T.border, borderRadius: 10, padding: '0.9rem', fontSize: '0.8rem', color: T.textSecondary, lineHeight: 1.6 }}>
          <strong style={{ color: T.textPrimary }}>{b.name} channels</strong> are 20 / 40 / 80 / 160 MHz wide (bonded channels) and do not overlap — channel planning is far simpler than 2.4 GHz. Higher channel numbers (U-NII-2C, U-NII-3) require DFS clearance in most countries.
        </div>
      )}
    </div>
  );
}

function TopologyTab({ T, isDark }: { T: ReturnType<typeof getLabTheme>; isDark: boolean }) {
  const terms = [
    { term: 'BSS', full: 'Basic Service Set', def: 'One AP and all its associated clients form a BSS. The geographic area it covers is the BSA (Basic Service Area).' },
    { term: 'ESS', full: 'Extended Service Set', def: 'Multiple APs broadcasting the same SSID, connected by a wired distribution system (DS). Enables seamless roaming between APs.' },
    { term: 'SSID', full: 'Service Set Identifier', def: 'The human-readable network name (up to 32 characters). Multiple APs can share one SSID in an ESS.' },
    { term: 'BSSID', full: 'Basic Service Set Identifier', def: 'The MAC address of the AP radio. Clients use this to distinguish APs when multiple share the same SSID.' },
    { term: 'Association', full: 'The client–AP handshake', def: 'Before sending data, a client must authenticate then associate to an AP. The AP assigns an association ID (AID).' },
  ];

  return (
    <div>
      {/* Topology SVG */}
      <div style={{ backgroundColor: T.insetBg, border: T.border, borderRadius: 12, padding: '1.25rem 0.75rem', marginBottom: '1.25rem' }}>
        <div style={{ fontSize: '0.65rem', fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.75rem', paddingLeft: '0.5rem' }}>
          Infrastructure Mode — BSS
        </div>
        <TopologySvg isDark={isDark} />
      </div>

      {/* Terms */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
        {terms.map(t => (
          <div key={t.term} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', backgroundColor: T.panelBg, border: T.border, borderRadius: 8, padding: '0.75rem' }}>
            <div style={{ minWidth: 48, textAlign: 'center', padding: '3px 0', borderRadius: 6, background: `${T.accent}18`, border: `1px solid ${T.accent}30`, fontSize: '0.68rem', fontWeight: 900, color: T.accent, flexShrink: 0 }}>{t.term}</div>
            <div>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: T.textPrimary, marginBottom: 2 }}>{t.full}</div>
              <div style={{ fontSize: '0.76rem', color: T.textSecondary, lineHeight: 1.6 }}>{t.def}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StandardsTab({ T, isDark }: { T: ReturnType<typeof getLabTheme>; isDark: boolean }) {
  const maxSpeed = 46000;

  return (
    <div>
      <div style={{ backgroundColor: T.panelBg, border: T.border, borderRadius: 10, overflow: 'hidden', marginBottom: '1rem' }}>
        {/* Header row */}
        <div style={{ display: 'grid', gridTemplateColumns: '90px 48px 1fr 90px 80px', gap: 0, backgroundColor: isDark ? '#161b22' : '#f1f5f9', padding: '0.55rem 0.9rem', borderBottom: T.border }}>
          {['Standard', 'Year', 'Max Speed', 'Band', 'Wi-Fi Name'].map(h => (
            <div key={h} style={{ fontSize: '0.65rem', fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</div>
          ))}
        </div>

        {STANDARDS.map((s, i) => (
          <div key={s.name} style={{ display: 'grid', gridTemplateColumns: '90px 48px 1fr 90px 80px', gap: 0, padding: '0.65rem 0.9rem', borderBottom: i < STANDARDS.length - 1 ? T.border : 'none', alignItems: 'center' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: s.color, fontFamily: 'monospace' }}>{s.name}</div>
            <div style={{ fontSize: '0.75rem', color: T.textMuted }}>{s.year}</div>
            <div style={{ paddingRight: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ flex: 1, height: 6, borderRadius: 3, background: isDark ? '#21262d' : '#e5e7eb', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${Math.max((s.speedN / maxSpeed) * 100, 1)}%`, background: s.color, borderRadius: 3 }} />
                </div>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: T.textPrimary, whiteSpace: 'nowrap', minWidth: 58 }}>{s.maxSpeed}</span>
              </div>
            </div>
            <div style={{ fontSize: '0.72rem', color: T.textSecondary }}>{s.band}</div>
            <div>
              {s.wifiName !== '—'
                ? <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: `${s.color}22`, color: s.color, border: `1px solid ${s.color}40` }}>{s.wifiName}</span>
                : <span style={{ fontSize: '0.72rem', color: T.textMuted }}>—</span>
              }
            </div>
          </div>
        ))}
      </div>

      <div style={{ backgroundColor: T.insetBg, border: T.border, borderRadius: 8, padding: '0.8rem', fontSize: '0.78rem', color: T.textSecondary, lineHeight: 1.65 }}>
        <strong style={{ color: T.textPrimary }}>Tip:</strong> The Wi-Fi Alliance introduced friendly names (WiFi 4/5/6/7) starting with 802.11n. Older standards (a/b/g) predate the naming scheme. Max speeds are theoretical — real-world throughput is typically 40–60% of the headline figure due to overhead, interference, and distance.
      </div>
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
export const WirelessIntro: React.FC<Props> = ({ isDarkMode = true }) => {
  const T = getLabTheme(isDarkMode);
  const isDark = isDarkMode ?? true;
  const [tab, setTab] = useState<Tab>('overview');
  const [selBand, setSelBand] = useState(0);

  const tabs: { id: Tab; label: string }[] = [
    { id: 'overview',   label: '📡 Overview' },
    { id: 'bands',      label: '📶 Frequency Bands' },
    { id: 'topology',   label: '🗺 Topology' },
    { id: 'standards',  label: '📋 Standards' },
  ];

  return (
    <div style={{ padding: '1.5rem', backgroundColor: T.cardBg, borderRadius: 12, border: T.border, color: T.textPrimary, fontFamily: 'system-ui,-apple-system,"Segoe UI",sans-serif' }}>

      {/* Header */}
      <div style={{ marginBottom: '1.25rem', paddingBottom: '1rem', borderBottom: T.border }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>What is Wireless Networking?</h3>
        <p style={{ color: T.textSecondary, margin: '4px 0 0', fontSize: '0.875rem' }}>
          An interactive introduction to Wi-Fi — from radio waves to 802.11 standards.
        </p>
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 6, marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {tabs.map(({ id, label }) => (
          <button key={id} onClick={() => setTab(id)}
            style={{ padding: '0.4rem 0.9rem', borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.8rem', fontWeight: 600, background: tab === id ? T.accent : T.toggleBg, color: tab === id ? '#fff' : T.textMuted, transition: 'background 0.15s' }}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'overview'  && <OverviewTab  T={T} isDark={isDark} />}
      {tab === 'bands'     && <BandsTab     T={T} isDark={isDark} selBand={selBand} setSelBand={setSelBand} />}
      {tab === 'topology'  && <TopologyTab  T={T} isDark={isDark} />}
      {tab === 'standards' && <StandardsTab T={T} isDark={isDark} />}
    </div>
  );
};

export default WirelessIntro;
