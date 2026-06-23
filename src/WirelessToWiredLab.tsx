import React, { useState } from 'react';
import { getLabTheme } from './labTheme';

interface WirelessToWiredLabProps { isDarkMode?: boolean; }

interface Node {
  id: string;
  label: string;
  shortLabel: string;
  layer: string;
  media: string;
  details: string;
  encap: string;
}

export const WirelessToWiredLab: React.FC<WirelessToWiredLabProps> = ({ isDarkMode = true }) => {
  const [selectedId, setSelectedId] = useState('client');
  const T = getLabTheme(isDarkMode);

  const nodes: Node[] = [
    {
      id: 'client', label: 'Wireless Client', shortLabel: 'Client',
      layer: 'RF (Layer 1–2)', media: 'Radio waves — 2.4 GHz / 5 GHz / 6 GHz',
      details: 'The laptop or phone converts digital data into phase-shifted radio waves and broadcasts them into the air. The frame format used over Wi-Fi is IEEE 802.11, not the Ethernet 802.3 used on wires.',
      encap: '802.11 Wi-Fi frame',
    },
    {
      id: 'ap', label: 'Access Point', shortLabel: 'AP',
      layer: 'Layer 2 bridge', media: 'Copper Cat6 — horizontal run to patch panel',
      details: 'The access point is the critical media boundary. It receives the 802.11 wireless frame, strips the Wi-Fi header, and rebuilds the payload as an 802.3 Ethernet frame before forwarding it down the copper cable toward the switch.',
      encap: '802.11 → 802.3 (media conversion)',
    },
    {
      id: 'patch', label: 'Patch Panel', shortLabel: 'Patch',
      layer: 'Layer 1 only', media: 'Passive 110-block punch-down termination',
      details: 'The patch panel is a purely passive physical device — it has no processing logic. Horizontal cabling from the wall terminates here, and flexible patch leads connect it to the switch ports. It protects permanent cable from repeated plugging and unplugging.',
      encap: 'Layer 1 bit stream — no frame processing',
    },
    {
      id: 'switch', label: 'PoE+ Access Switch', shortLabel: 'Switch',
      layer: 'Layer 2 switch', media: 'Stranded Cat6 patch leads — RJ45 to switch ports',
      details: 'The switch reads destination MAC addresses to forward frames only to the correct port. It also delivers PoE (Power over Ethernet) to the access point, eliminating the need for a separate power cable to the AP.',
      encap: '802.3 Ethernet frame (optionally 802.1Q VLAN tagged)',
    },
    {
      id: 'core', label: 'Core Switch (MDF)', shortLabel: 'Core',
      layer: 'Layer 3 routing', media: 'OM4 multimode fibre — LC duplex uplink',
      details: 'The core or distribution switch aggregates multiple access switches over high-speed fibre uplinks. It handles inter-VLAN routing, connecting different network segments and forwarding traffic toward the internet or data centre.',
      encap: 'Routed IP packet / 802.3 Ethernet over fibre',
    },
  ];

  const linkColors = ['#4493f8', '#3b82f6', '#3fb950', '#d29922'];
  const linkStyles = ['6 4', 'none', 'none', 'none'];

  const selected = nodes.find(n => n.id === selectedId) ?? nodes[0];

  return (
    <div style={{ padding: '2rem', backgroundColor: T.cardBg, borderRadius: '12px', border: T.border, color: T.textPrimary, fontFamily: 'system-ui, sans-serif' }}>

      {/* Header */}
      <div style={{ marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: T.border }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Wireless-to-Wired Infrastructure</h3>
        <p style={{ color: T.textSecondary, margin: '4px 0 0', fontSize: '0.875rem' }}>
          Click any device to see what media it uses and what happens to the frame at each boundary.
        </p>
      </div>

      {/* Topology diagram */}
      <div style={{ backgroundColor: T.insetBg, border: T.border, borderRadius: '12px', padding: '2.5rem 1.5rem', position: 'relative', marginBottom: '1.5rem', overflowX: 'auto' }}>
        <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', minWidth: 700 }} preserveAspectRatio="none">
          {linkColors.map((c, i) => (
            <line key={i}
              x1={`${10 + i * 20}%`} y1="50%" x2={`${30 + i * 20}%`} y2="50%"
              stroke={c} strokeWidth="2.5" strokeDasharray={linkStyles[i]} />
          ))}
        </svg>
        <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', position: 'relative', zIndex: 2, minWidth: 700 }}>
          {nodes.map((n, i) => {
            const active = n.id === selectedId;
            const iconMap: Record<string, string> = { client: '&#128241;', ap: '&#128225;', patch: '&#128268;', switch: '&#9728;', core: '&#128421;' };
            const linkColor = i > 0 ? linkColors[i - 1] : T.accent;
            return (
              <div key={n.id} onClick={() => setSelectedId(n.id)} style={{ textAlign: 'center', width: 110, cursor: 'pointer' }}>
                <div style={{ width: 56, height: 56, margin: '0 auto', fontSize: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '12px', backgroundColor: active ? T.panelBg : T.cardBg, border: `2px solid ${active ? linkColor : T.borderColor}`, boxShadow: active ? `0 0 14px ${linkColor}55` : 'none', transform: active ? 'scale(1.1)' : 'scale(1)', transition: 'all 0.15s' }}>
                  <span dangerouslySetInnerHTML={{ __html: iconMap[n.id] }} />
                </div>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, marginTop: 8, color: active ? linkColor : T.textPrimary }}>{n.shortLabel}</div>
                <div style={{ fontSize: '0.6rem', color: T.textMuted, marginTop: 2 }}>{n.layer.split('(')[0].trim()}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', marginBottom: '1.25rem', fontSize: '0.75rem', color: T.textMuted }}>
        <span><span style={{ color: linkColors[0] }}>--- </span>Radio (802.11)</span>
        <span><span style={{ color: linkColors[1] }}>— </span>Copper permanent run</span>
        <span><span style={{ color: linkColors[2] }}>— </span>Patch lead</span>
        <span><span style={{ color: linkColors[3] }}>— </span>Fibre uplink</span>
      </div>

      {/* Detail panels */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
        <div style={{ backgroundColor: T.panelBg, padding: '1.25rem', borderRadius: '12px', border: T.border }}>
          <span style={{ fontSize: '0.7rem', fontWeight: 700, color: T.accent, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{selected.layer}</span>
          <h4 style={{ margin: '6px 0 10px', fontSize: '1rem', fontWeight: 700 }}>{selected.label}</h4>
          <p style={{ margin: 0, color: T.textSecondary, fontSize: '0.85rem', lineHeight: '1.6' }}>{selected.details}</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ backgroundColor: T.insetBg, padding: '1rem', borderRadius: '8px', border: T.border }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Physical media</span>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: T.textPrimary }}>{selected.media}</div>
          </div>
          <div style={{ backgroundColor: T.termBg, padding: '1rem', borderRadius: '8px', border: `1px solid ${T.termBorder}` }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: T.termMuted, textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Frame / encapsulation</span>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: T.termText, fontFamily: 'monospace' }}>{selected.encap}</div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default WirelessToWiredLab;
