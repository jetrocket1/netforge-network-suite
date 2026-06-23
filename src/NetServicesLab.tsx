import React, { useState } from 'react';
import { getLabTheme } from './labTheme';

interface NetServicesLabProps { isDarkMode?: boolean; }

export const NetServicesLab: React.FC<NetServicesLabProps> = ({ isDarkMode = true }) => {
  const [activeService, setActiveService] = useState<'DHCP' | 'DNS'>('DHCP');
  const [dhcpStage, setDhcpStage] = useState(0);
  const [dnsStage, setDnsStage] = useState(0);
  const T = getLabTheme(isDarkMode);

  const dhcpSteps = [
    { label: 'Discover', direction: 'out', packet: 'DHCP Discover (broadcast)', log: 'PC1 has no IP address. It broadcasts a Discover message to the whole network: "Is there a DHCP server that can give me an address?"', ip: '0.0.0.0', mask: '—', gw: '—', dns: '—' },
    { label: 'Offer',    direction: 'in',  packet: 'DHCP Offer (unicast)',     log: 'The DHCP server responds with an Offer: "I can lease you 10.0.0.100 for 8 days." The address is reserved but not yet assigned.', ip: 'Offered: 10.0.0.100', mask: '255.255.255.0', gw: '10.0.0.1', dns: '10.0.0.2' },
    { label: 'Request',  direction: 'out', packet: 'DHCP Request (broadcast)', log: 'PC1 broadcasts a Request to formally accept the offer. Broadcasting ensures any other DHCP servers on the segment know the address has been claimed.', ip: 'Requested: 10.0.0.100', mask: '255.255.255.0', gw: '10.0.0.1', dns: '10.0.0.2' },
    { label: 'Ack',      direction: 'in',  packet: 'DHCP Ack (unicast)',       log: 'The server sends an Acknowledgement confirming the lease. PC1 applies the address and is now fully configured on the network.', ip: '10.0.0.100', mask: '255.255.255.0', gw: '10.0.0.1', dns: '10.0.0.2' },
  ];

  const dnsSteps = [
    { label: 'Client query',       packet: 'DNS Query (UDP 53)', log: 'The user types "netforge.com". The browser checks the local cache — nothing found — so the OS sends a query to the configured DNS resolver.', result: 'Querying...' },
    { label: 'Recursive lookup',   packet: 'Root → TLD → Auth', log: 'The resolver walks the DNS hierarchy: it asks a Root server for ".com", a TLD server for "netforge.com", then the Authoritative nameserver for the A record.', result: 'Resolving...' },
    { label: 'Authoritative reply',packet: 'A Record returned',  log: 'The Authoritative nameserver for netforge.com answers: "That hostname maps to 104.26.10.23." The resolver receives the answer.', result: '104.26.10.23' },
    { label: 'Delivered to client',packet: 'Answer cached',      log: 'The resolver forwards the answer to PC1. The OS caches it for the TTL period, and the browser opens a connection to 104.26.10.23.', result: '104.26.10.23 (cached)' },
  ];

  const d = dhcpSteps[dhcpStage];
  const n = dnsSteps[dnsStage];

  const clientActive = activeService === 'DHCP' ? d.direction === 'out' : dnsStage === 0 || dnsStage === 1;
  const serverActive = activeService === 'DHCP' ? d.direction === 'in' : dnsStage === 2 || dnsStage === 3;
  const serverColor = activeService === 'DNS' ? T.success : T.accent;

  const stepBtn = (label: string, idx: number, active: boolean, color: string) => (
    <button key={idx} type="button" onClick={() => activeService === 'DHCP' ? setDhcpStage(idx) : setDnsStage(idx)}
      style={{ padding: '10px 8px', fontSize: '0.8rem', fontWeight: 600, borderRadius: '6px', border: `1px solid ${active ? color : T.borderColor}`, cursor: 'pointer', backgroundColor: active ? color : T.panelBg, color: active ? '#fff' : T.textSecondary, transition: 'all 0.12s' }}>
      {idx + 1}. {label}
    </button>
  );

  return (
    <div style={{ padding: '2rem', backgroundColor: T.cardBg, borderRadius: '12px', border: T.border, color: T.textPrimary, fontFamily: 'system-ui, sans-serif' }}>

      {/* Header */}
      <div style={{ marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: T.border }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Network Services</h3>
        <p style={{ color: T.textSecondary, margin: '4px 0 0', fontSize: '0.875rem' }}>
          Visualise the DHCP DORA handshake and DNS resolution step by step.
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '1.5rem', backgroundColor: T.panelBg, padding: '3px', borderRadius: '8px', border: T.border }}>
        {(['DHCP', 'DNS'] as const).map(s => (
          <button key={s} type="button" onClick={() => setActiveService(s)}
            style={{ flex: 1, padding: '8px', fontWeight: 700, fontSize: '0.85rem', border: 'none', borderRadius: '6px', cursor: 'pointer', backgroundColor: activeService === s ? (s === 'DHCP' ? T.accent : T.success) : 'transparent', color: activeService === s ? '#fff' : T.textSecondary, transition: 'all 0.12s' }}>
            {s === 'DHCP' ? 'DHCP — Address Assignment' : 'DNS — Name Resolution'}
          </button>
        ))}
      </div>

      {/* Topology */}
      <div style={{ backgroundColor: T.insetBg, border: T.border, padding: '1.5rem 1rem', borderRadius: '12px', marginBottom: '1.25rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr 110px', alignItems: 'center', gap: 12, textAlign: 'center', maxWidth: 620, margin: '0 auto' }}>

          {/* Client */}
          <div style={{ padding: '12px 8px', borderRadius: '8px', border: `2px solid ${clientActive ? T.accent : T.borderColor}`, backgroundColor: clientActive ? T.accentSubtle : T.panelBg, transition: 'all 0.2s' }}>
            <div style={{ fontSize: '1.5rem' }}>&#128187;</div>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, marginTop: 4 }}>PC1</div>
            <div style={{ fontSize: '0.62rem', fontFamily: 'monospace', color: T.textMuted }}>Client</div>
          </div>

          {/* Arrow / packet label */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <div style={{ padding: '4px 10px', backgroundColor: T.panelBg, border: T.border, borderRadius: 4, fontSize: '0.72rem', fontWeight: 600, color: T.warning, fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
              {activeService === 'DHCP' ? d.packet : n.packet}
            </div>
            <div style={{ fontSize: '1.1rem', color: T.borderColor, letterSpacing: 4 }}>
              {activeService === 'DHCP' ? (d.direction === 'out' ? '→→→→→→' : '←←←←←←') : '⇄⇄⇄⇄'}
            </div>
          </div>

          {/* Server */}
          <div style={{ padding: '12px 8px', borderRadius: '8px', border: `2px solid ${serverActive ? serverColor : T.borderColor}`, backgroundColor: serverActive ? `${serverColor}18` : T.panelBg, transition: 'all 0.2s' }}>
            <div style={{ fontSize: '1.5rem' }}>{activeService === 'DHCP' ? '🗄️' : '🌐'}</div>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, marginTop: 4, color: serverActive ? serverColor : T.textPrimary }}>{activeService === 'DHCP' ? 'DHCP Server' : 'DNS Resolver'}</div>
          </div>

        </div>
      </div>

      {/* Steps + Log */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
        <div style={{ backgroundColor: T.panelBg, padding: '1rem', borderRadius: '8px', border: T.border }}>
          <span style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', marginBottom: '8px' }}>
            {activeService === 'DHCP' ? 'DORA steps' : 'Resolution steps'}
          </span>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            {activeService === 'DHCP'
              ? dhcpSteps.map((s, i) => stepBtn(s.label, i, dhcpStage === i, T.accent))
              : dnsSteps.map((s, i) => stepBtn(s.label, i, dnsStage === i, T.success))
            }
          </div>
        </div>

        <div style={{ backgroundColor: T.termBg, padding: '1rem', borderRadius: '8px', border: `1px solid ${T.termBorder}` }}>
          <span style={{ fontSize: '0.7rem', fontFamily: 'monospace', color: T.termMuted, display: 'block', borderBottom: `1px solid ${T.termBorder}`, paddingBottom: 4, marginBottom: 10, fontWeight: 700 }}>Packet log</span>
          <div style={{ fontFamily: 'monospace', fontSize: '0.82rem', color: T.termText, lineHeight: '1.6' }}>
            {activeService === 'DHCP' ? d.log : n.log}
          </div>
        </div>
      </div>

      {/* State table */}
      <div style={{ backgroundColor: T.panelBg, padding: '1rem', borderRadius: '8px', border: T.border }}>
        {activeService === 'DHCP' ? (
          <>
            <span style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', marginBottom: 8 }}>PC1 adapter state (ipconfig)</span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 6, fontFamily: 'monospace', fontSize: '0.78rem' }}>
              {[['IP Address', d.ip, d.ip !== '0.0.0.0'], ['Subnet Mask', d.mask, false], ['Default Gateway', d.gw, false], ['DNS Server', d.dns, false]].map(([label, val, green]) => (
                <div key={label as string} style={{ padding: '8px', backgroundColor: T.insetBg, borderRadius: 4 }}>
                  <span style={{ color: T.textMuted }}>{label as string}:</span>{' '}
                  <span style={{ color: green ? T.success : T.textPrimary, fontWeight: 700 }}>{val as string}</span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            <span style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', marginBottom: 8 }}>DNS lookup result</span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 6, fontFamily: 'monospace', fontSize: '0.78rem' }}>
              <div style={{ padding: '8px', backgroundColor: T.insetBg, borderRadius: 4 }}>
                <span style={{ color: T.textMuted }}>Query:</span> <span style={{ color: T.textPrimary, fontWeight: 700 }}>netforge.com</span>
              </div>
              <div style={{ padding: '8px', backgroundColor: T.insetBg, borderRadius: 4 }}>
                <span style={{ color: T.textMuted }}>A record:</span>{' '}
                <span style={{ color: n.result.startsWith('104') ? T.success : T.warning, fontWeight: 700 }}>{n.result}</span>
              </div>
            </div>
          </>
        )}
      </div>

    </div>
  );
};

export default NetServicesLab;
