import React, { useState, useEffect, useRef, useCallback } from 'react';
import { getLabTheme } from './labTheme';
import { LabEduPanel, type EduCard } from './LabEduPanel';

// ─── Types ───────────────────────────────────────────────────────────────────

type ArpTab = 'topology' | 'attack' | 'defence' | 'cli';

interface ArpEntry {
  ip: string;
  mac: string;
  poisoned: boolean;
}

interface Packet {
  route: string;
  color: string;
  label: string;
  delay: number;
}

interface AttackStep {
  title: string;
  desc: string;
  packets: Packet[];
  victimArp: ArpEntry[];
  gatewayArp: ArpEntry[];
  showIntercept?: boolean;
  showDai?: boolean;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const VICTIM_IP    = '192.168.1.10';
const VICTIM_MAC   = '00:1A:2B:3C:4D:5E';
const GW_IP        = '192.168.1.1';
const GW_MAC       = 'AA:BB:CC:DD:EE:FF';
const ATT_IP       = '192.168.1.100';
const ATT_MAC      = 'DE:AD:BE:EF:CA:FE';

const NORMAL_VICTIM_ARP:  ArpEntry[] = [{ ip: GW_IP,     mac: GW_MAC,   poisoned: false }];
const NORMAL_GW_ARP:      ArpEntry[] = [{ ip: VICTIM_IP, mac: VICTIM_MAC, poisoned: false }];
const POISONED_VICTIM_ARP: ArpEntry[] = [{ ip: GW_IP,     mac: ATT_MAC,  poisoned: true  }];
const POISONED_GW_ARP:     ArpEntry[] = [{ ip: VICTIM_IP, mac: ATT_MAC,  poisoned: true  }];

const ATTACK_STEPS: AttackStep[] = [
  {
    title: 'Normal Operation',
    desc: 'Network operating normally. Victim → Switch → Gateway using correct MACs. The ARP caches on both devices contain accurate IP-to-MAC mappings.',
    packets: [
      { route: 'v-sw',  color: '#3fb950', label: 'Data',  delay: 0   },
      { route: 'sw-gw', color: '#3fb950', label: 'Data',  delay: 0.4 },
    ],
    victimArp:  NORMAL_VICTIM_ARP,
    gatewayArp: NORMAL_GW_ARP,
  },
  {
    title: 'Attacker Joins Network',
    desc: 'Attacker connects to the same Layer 2 segment. They send an ARP broadcast to discover device MAC addresses. Because ARP is broadcast-based, every device on the segment receives this request.',
    packets: [
      { route: 'att-sw', color: '#f85149', label: 'ARP Who has 1.1?', delay: 0   },
      { route: 'sw-v',   color: '#f85149', label: 'Broadcast',        delay: 0.5 },
      { route: 'sw-gw',  color: '#f85149', label: 'Broadcast',        delay: 0.5 },
    ],
    victimArp:  NORMAL_VICTIM_ARP,
    gatewayArp: NORMAL_GW_ARP,
  },
  {
    title: 'Gateway Replies',
    desc: "Gateway responds to the attacker's ARP request with its real MAC address. Attacker now knows both victims' MACs and has everything needed to launch the poisoning attack.",
    packets: [
      { route: 'gw-sw',  color: '#3fb950', label: 'ARP Reply',    delay: 0   },
      { route: 'sw-att', color: '#3fb950', label: 'AA:BB:CC:DD',  delay: 0.4 },
    ],
    victimArp:  NORMAL_VICTIM_ARP,
    gatewayArp: NORMAL_GW_ARP,
  },
  {
    title: 'ARP Poison → Victim',
    desc: `Attacker sends an UNSOLICITED ARP Reply to the Victim: "192.168.1.1 is at ${ATT_MAC}." No authentication exists in ARP — the victim's cache updates immediately. This is called a Gratuitous ARP Reply.`,
    packets: [
      { route: 'att-sw', color: '#f85149', label: 'Poison Reply', delay: 0   },
      { route: 'sw-v',   color: '#f85149', label: '1.1 → DE:AD…', delay: 0.4 },
    ],
    victimArp:  POISONED_VICTIM_ARP,
    gatewayArp: NORMAL_GW_ARP,
  },
  {
    title: 'ARP Poison → Gateway',
    desc: `Attacker sends another unsolicited ARP Reply to the Gateway: "192.168.1.10 is at ${ATT_MAC}." Now BOTH devices think the attacker is the other party — classic Man-in-the-Middle.`,
    packets: [
      { route: 'att-sw', color: '#f85149', label: 'Poison Reply',  delay: 0   },
      { route: 'sw-gw',  color: '#f85149', label: '1.10 → DE:AD…', delay: 0.4 },
    ],
    victimArp:  POISONED_VICTIM_ARP,
    gatewayArp: POISONED_GW_ARP,
  },
  {
    title: 'MITM Established',
    desc: "Both ARP caches are poisoned. All traffic from Victim destined for the Gateway flows to the Attacker first. Attacker forwards it (so the victim suspects nothing) — they are transparently relaying every packet.",
    packets: [
      { route: 'v-sw',   color: '#4493f8', label: 'Data→GW',    delay: 0   },
      { route: 'sw-att', color: '#4493f8', label: 'Intercepted', delay: 0.4 },
      { route: 'att-sw', color: '#4493f8', label: 'Forwarded',   delay: 0.9 },
      { route: 'sw-gw',  color: '#4493f8', label: 'Data→GW',    delay: 1.3 },
    ],
    victimArp:  POISONED_VICTIM_ARP,
    gatewayArp: POISONED_GW_ARP,
  },
  {
    title: 'Credential Interception',
    desc: 'Victim submits login credentials over HTTP. The Attacker reads them in plaintext before forwarding to the server. No encryption = full exposure of sensitive data.',
    packets: [
      { route: 'v-sw',   color: '#d29922', label: 'HTTP POST',     delay: 0   },
      { route: 'sw-att', color: '#d29922', label: '🔓 Plain text!', delay: 0.4 },
    ],
    victimArp:  POISONED_VICTIM_ARP,
    gatewayArp: POISONED_GW_ARP,
    showIntercept: true,
  },
  {
    title: 'Defence: Apply DAI',
    desc: 'Dynamic ARP Inspection (DAI) on the switch validates ARP packets against the DHCP snooping binding table. Unsolicited ARP Replies from untrusted ports are dropped — poisoning attempt blocked before it reaches any device.',
    packets: [
      { route: 'att-sw', color: '#f85149', label: 'Poison Attempt', delay: 0   },
      { route: 'att-sw', color: '#3fb950', label: '🚫 DROPPED',     delay: 0.5 },
    ],
    victimArp:  NORMAL_VICTIM_ARP,
    gatewayArp: NORMAL_GW_ARP,
    showDai: true,
  },
];

const EDU_CARDS: EduCard[] = [
  {
    type: 'exam',
    title: "ARP Protocol & Why It's Vulnerable",
    body: 'ARP has no authentication and accepts unsolicited Replies — any host can claim any IP. Designed for efficiency not security. Gratuitous ARP (a host announcing its own IP/MAC unprompted) is the exact vector abused in poisoning. CompTIA Sec+ tests this as a classic Layer 2 MITM attack.',
  },
  {
    type: 'exam',
    title: 'Dynamic ARP Inspection (DAI)',
    body: 'DAI requires the DHCP snooping binding table to validate ARP packets. Trusted ports (uplinks) bypass DAI; untrusted ports (access ports) are validated. Configure per-VLAN: `ip arp inspection vlan X`. Rate-limit ARP on access ports to detect ARP floods.',
  },
  {
    type: 'config',
    title: 'DHCP Snooping + DAI Full Config',
    body: 'Complete Cisco IOS sequence for enabling DHCP Snooping and DAI on a Layer 2 switch.',
    code: `! Step 1: Enable DHCP Snooping (DAI prerequisite)
ip dhcp snooping
ip dhcp snooping vlan 10,20,99

! Step 2: Mark uplink as trusted
interface GigabitEthernet0/1
 ip dhcp snooping trust
 ip arp inspection trust
 exit

! Step 3: Enable DAI per VLAN
ip arp inspection vlan 10,20,99

! Step 4: Rate-limit ARP on access ports (optional)
interface range FastEthernet0/1-23
 ip arp inspection limit rate 100
 exit

! Verify
show ip arp inspection
show ip arp inspection vlan 10`,
  },
  {
    type: 'gotcha',
    title: 'Gratuitous ARP: Legitimate vs Malicious',
    body: 'Gratuitous ARP is used legitimately for IP failover (HSRP/VRRP) and duplicate IP detection on boot. The same mechanism is abused in poisoning — an attacker crafts a Gratuitous Reply mapping any IP to their MAC. DAI rate limiting (100 pps default) can catch excessive gratuitous ARPs from a rogue host.',
  },
  {
    type: 'gotcha',
    title: 'DAI Without DHCP Snooping',
    body: 'DAI validates ARPs against the DHCP snooping binding table. If DHCP snooping is off, the binding table is empty — DAI will drop ALL dynamic ARP traffic including legitimate hosts. Always enable `ip dhcp snooping vlan X` BEFORE enabling DAI, or you will black-hole your network.',
  },
  {
    type: 'realworld',
    title: 'Marriott Hotel MITM (2015)',
    body: "Guests at a Marriott conference centre were subjected to ARP poisoning via a rogue access point. Credentials were harvested from HTTP sessions. The FCC fined Marriott $600K for blocking personal hotspots and enabling the attack surface. Enterprise defence: 802.1X port authentication + DAI on all access ports + mandatory HTTPS.",
  },
];

// ─── SVG Packet Animation ─────────────────────────────────────────────────────

const PKT_STYLES = `
@keyframes arp-fade { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:none} }
@keyframes pkt-v-sw   { 0%{transform:translate(90px,170px)}  100%{transform:translate(335px,170px)} }
@keyframes pkt-sw-v   { 0%{transform:translate(335px,170px)} 100%{transform:translate(90px,170px)}  }
@keyframes pkt-sw-gw  { 0%{transform:translate(385px,170px)} 100%{transform:translate(620px,170px)} }
@keyframes pkt-gw-sw  { 0%{transform:translate(620px,170px)} 100%{transform:translate(385px,170px)} }
@keyframes pkt-att-sw { 0%{transform:translate(360px,300px)} 100%{transform:translate(360px,205px)} }
@keyframes pkt-sw-att { 0%{transform:translate(360px,205px)} 100%{transform:translate(360px,300px)} }
`;

function labelWidth(label: string): number {
  return Math.max(label.length * 5.2 + 10, 30);
}

interface SvgPacketsProps {
  packets: Packet[];
  stepKey: number;
}

const SvgPackets: React.FC<SvgPacketsProps> = ({ packets, stepKey }) => (
  <g key={stepKey}>
    {packets.map((p, i) => {
      const w = labelWidth(p.label);
      return (
        <g
          key={i}
          style={{
            animation: `pkt-${p.route} 1s ${p.delay}s ease-in-out both`,
          }}
        >
          <circle cx={0} cy={0} r={6} fill={p.color} />
          <rect x={8} y={-8} width={w} height={14} rx={3} fill={p.color} opacity={0.85} />
          <text x={11} y={3} fontSize={8} fill="#fff" fontWeight={700} fontFamily="monospace">
            {p.label}
          </text>
        </g>
      );
    })}
  </g>
);

// ─── Network Topology SVG ─────────────────────────────────────────────────────

interface TopologySvgProps {
  step: number;
  packets: Packet[];
  stepKey: number;
  showDai?: boolean;
  selectedDevice: string | null;
  onSelectDevice: (id: string | null) => void;
  isDarkMode: boolean;
}

const TopologySvg: React.FC<TopologySvgProps> = ({
  step: _step,
  packets,
  stepKey,
  showDai,
  selectedDevice,
  onSelectDevice,
  isDarkMode,
}) => {
  const T = getLabTheme(isDarkMode);
  const highlight = (id: string) => selectedDevice === id;

  return (
    <svg viewBox="0 0 720 420" style={{ width: '100%', display: 'block' }}>
      <style>{PKT_STYLES}</style>

      {/* Wires */}
      <line x1={90} y1={170} x2={335} y2={170} stroke={T.borderColor} strokeWidth={2} />
      <line x1={385} y1={170} x2={620} y2={170} stroke={T.borderColor} strokeWidth={2} />
      <line x1={360} y1={205} x2={360} y2={300} stroke={T.borderColor} strokeWidth={2} />

      {/* Switch (rectangle) */}
      <rect
        x={335} y={148} width={50} height={44} rx={6}
        fill={showDai ? '#0f2a1a' : T.panelBg}
        stroke={showDai ? '#3fb950' : highlight('switch') ? '#a855f7' : T.borderColor}
        strokeWidth={showDai ? 2 : highlight('switch') ? 2 : 1.5}
        style={{ cursor: 'pointer', transition: 'stroke 0.2s' }}
        onClick={() => onSelectDevice(selectedDevice === 'switch' ? null : 'switch')}
      />
      <text x={360} y={167} textAnchor="middle" fontSize={14}>🎛️</text>
      <text x={360} y={181} textAnchor="middle" fontSize={8} fontWeight={700} fill={T.textSecondary} fontFamily="monospace">SW1</text>
      {showDai && (
        <g>
          <rect x={326} y={195} width={68} height={13} rx={4} fill="#3fb95020" stroke="#3fb950" strokeWidth={1} />
          <text x={360} y={205} textAnchor="middle" fontSize={7.5} fontWeight={800} fill="#3fb950" fontFamily="monospace">DAI ACTIVE</text>
        </g>
      )}

      {/* Victim PC */}
      <circle
        cx={90} cy={170} r={32}
        fill={highlight('victim') ? '#1a2a4a' : T.panelBg}
        stroke={highlight('victim') ? '#4493f8' : '#4493f830'}
        strokeWidth={highlight('victim') ? 2.5 : 1.5}
        style={{ cursor: 'pointer', transition: 'stroke 0.2s' }}
        onClick={() => onSelectDevice(selectedDevice === 'victim' ? null : 'victim')}
      />
      <text x={90} y={175} textAnchor="middle" fontSize={20}>💻</text>
      <text x={90} y={217} textAnchor="middle" fontSize={9} fontWeight={700} fill="#4493f8" fontFamily="sans-serif">Victim PC</text>
      <text x={90} y={229} textAnchor="middle" fontSize={8} fill={T.textMuted} fontFamily="monospace">{VICTIM_IP}</text>
      <text x={90} y={241} textAnchor="middle" fontSize={7.5} fill={T.textMuted} fontFamily="monospace">{VICTIM_MAC}</text>

      {/* Gateway */}
      <circle
        cx={620} cy={170} r={32}
        fill={highlight('gateway') ? '#0f2a1a' : T.panelBg}
        stroke={highlight('gateway') ? '#3fb950' : '#3fb95030'}
        strokeWidth={highlight('gateway') ? 2.5 : 1.5}
        style={{ cursor: 'pointer', transition: 'stroke 0.2s' }}
        onClick={() => onSelectDevice(selectedDevice === 'gateway' ? null : 'gateway')}
      />
      <text x={620} y={175} textAnchor="middle" fontSize={20}>🌐</text>
      <text x={620} y={217} textAnchor="middle" fontSize={9} fontWeight={700} fill="#3fb950" fontFamily="sans-serif">Gateway</text>
      <text x={620} y={229} textAnchor="middle" fontSize={8} fill={T.textMuted} fontFamily="monospace">{GW_IP}</text>
      <text x={620} y={241} textAnchor="middle" fontSize={7.5} fill={T.textMuted} fontFamily="monospace">{GW_MAC}</text>

      {/* Attacker */}
      <circle
        cx={360} cy={330} r={32}
        fill={highlight('attacker') ? '#2a0f0f' : T.panelBg}
        stroke={highlight('attacker') ? '#f85149' : '#f8514930'}
        strokeWidth={highlight('attacker') ? 2.5 : 1.5}
        style={{ cursor: 'pointer', transition: 'stroke 0.2s' }}
        onClick={() => onSelectDevice(selectedDevice === 'attacker' ? null : 'attacker')}
      />
      <text x={360} y={335} textAnchor="middle" fontSize={20}>💀</text>
      <text x={360} y={377} textAnchor="middle" fontSize={9} fontWeight={700} fill="#f85149" fontFamily="sans-serif">Attacker</text>
      <text x={360} y={389} textAnchor="middle" fontSize={8} fill={T.textMuted} fontFamily="monospace">{ATT_IP}</text>
      <text x={360} y={401} textAnchor="middle" fontSize={7.5} fill={T.textMuted} fontFamily="monospace">{ATT_MAC}</text>

      {/* Packets */}
      <SvgPackets packets={packets} stepKey={stepKey} />
    </svg>
  );
};

// ─── ARP Table Panel ─────────────────────────────────────────────────────────

interface ArpTablePanelProps {
  title: string;
  subtitle: string;
  entries: ArpEntry[];
  isDarkMode: boolean;
}

const ArpTablePanel: React.FC<ArpTablePanelProps> = ({ title, subtitle, entries, isDarkMode }) => {
  const T = getLabTheme(isDarkMode);
  return (
    <div style={{
      background: T.cardBg,
      border: `1px solid ${T.borderColor}`,
      borderRadius: 10,
      overflow: 'hidden',
      flex: 1,
      minWidth: 260,
    }}>
      <div style={{
        background: T.panelBg,
        padding: '0.6rem 1rem',
        borderBottom: `1px solid ${T.borderColor}`,
      }}>
        <div style={{ fontSize: '0.78rem', fontWeight: 700, color: T.textPrimary }}>{title}</div>
        <div style={{ fontSize: '0.68rem', fontFamily: 'monospace', color: T.textMuted }}>{subtitle}</div>
      </div>
      <div style={{ padding: '0.6rem' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1.6fr auto',
          gap: '4px 8px',
          fontFamily: 'monospace',
          fontSize: '0.68rem',
          marginBottom: 4,
          padding: '0 4px',
        }}>
          <span style={{ color: T.textMuted, fontWeight: 700 }}>IP</span>
          <span style={{ color: T.textMuted, fontWeight: 700 }}>MAC</span>
          <span style={{ color: T.textMuted, fontWeight: 700 }}>Status</span>
        </div>
        {entries.map((e, i) => (
          <div
            key={i}
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1.6fr auto',
              gap: '4px 8px',
              padding: '5px 8px',
              borderRadius: 6,
              marginBottom: 3,
              background: e.poisoned ? 'rgba(248,81,73,0.08)' : T.panelBg,
              border: `1px solid ${e.poisoned ? '#f8514940' : T.borderColor}`,
              fontFamily: 'monospace',
              fontSize: '0.68rem',
              alignItems: 'center',
            }}
          >
            <span style={{ color: T.textPrimary }}>{e.ip}</span>
            <span style={{ color: e.poisoned ? '#f85149' : '#7ee787', fontWeight: 700 }}>{e.mac}</span>
            {e.poisoned ? (
              <span style={{
                fontSize: '0.58rem',
                padding: '2px 5px',
                borderRadius: 4,
                background: '#f8514920',
                color: '#f85149',
                fontWeight: 800,
                whiteSpace: 'nowrap',
              }}>⚠ POISONED</span>
            ) : (
              <span style={{
                fontSize: '0.58rem',
                padding: '2px 5px',
                borderRadius: 4,
                background: T.panelBg,
                color: T.textMuted,
                border: `1px solid ${T.borderColor}`,
                fontWeight: 600,
              }}>dynamic</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Device Info Popup ────────────────────────────────────────────────────────

interface DeviceInfo {
  name: string;
  emoji: string;
  ip: string;
  mac: string;
  role: string;
  color: string;
}

const DEVICE_INFO: Record<string, DeviceInfo> = {
  victim:   { name: 'Victim PC',  emoji: '💻', ip: VICTIM_IP, mac: VICTIM_MAC, role: 'End-user workstation — target of the MITM attack', color: '#4493f8' },
  switch:   { name: 'Switch SW1', emoji: '🎛️', ip: '—',        mac: '—',        role: 'Layer 2 switch — DAI can be enabled here to block ARP poisoning', color: '#a855f7' },
  gateway:  { name: 'Gateway',    emoji: '🌐', ip: GW_IP,      mac: GW_MAC,     role: "Default gateway to internet — attacker poisons victim's view of this device", color: '#3fb950' },
  attacker: { name: 'Attacker',   emoji: '💀', ip: ATT_IP,     mac: ATT_MAC,    role: 'Malicious actor performing ARP cache poisoning to intercept traffic', color: '#f85149' },
};

// ─── Intercept Panel ─────────────────────────────────────────────────────────

const InterceptPanel: React.FC<{ isDarkMode: boolean }> = ({ isDarkMode: _isDarkMode }) => {
  return (
    <div style={{ borderRadius: 12, overflow: 'hidden', border: `1px solid #f8514940` }}>
      <div style={{
        background: '#1a1a2e',
        padding: '0.5rem 1rem',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
      }}>
        <div style={{ display: 'flex', gap: 5 }}>
          {['#ff5f56', '#ffbd2e', '#27c93f'].map(c => (
            <div key={c} style={{ width: 9, height: 9, borderRadius: '50%', background: c }} />
          ))}
        </div>
        <span style={{ fontFamily: 'monospace', fontSize: '0.65rem', color: '#8b949e', flex: 1 }}>
          wireshark — packet capture — attacker interface
        </span>
        <span style={{
          fontSize: '0.58rem',
          fontWeight: 800,
          padding: '2px 7px',
          borderRadius: 10,
          background: '#f8514920',
          color: '#f85149',
          border: '1px solid #f8514940',
        }}>⚠ CREDENTIALS EXPOSED</span>
      </div>
      <pre style={{
        margin: 0,
        background: '#0d1117',
        padding: '1rem 1.2rem',
        fontFamily: "'Fira Code','Cascadia Code',monospace",
        fontSize: '0.72rem',
        lineHeight: 1.8,
        overflowX: 'auto',
        color: '#e6edf3',
      }}>
        <span style={{ color: '#f85149', fontWeight: 700 }}>POST /login HTTP/1.1{'\n'}</span>
        <span style={{ color: '#8b949e' }}>Host: bank.internal.com{'\n'}</span>
        <span style={{ color: '#8b949e' }}>Content-Type: application/x-www-form-urlencoded{'\n'}</span>
        <span style={{ color: '#8b949e' }}>Content-Length: 38{'\n'}</span>
        {'\n'}
        <span style={{ color: '#d29922', fontWeight: 700 }}>username=jsmith&amp;password=P%40ssw0rd123</span>
        {'\n'}
        {'\n'}
        <span style={{ color: '#3fb950' }}># Attacker captured in plaintext — no TLS in use</span>
      </pre>
    </div>
  );
};

// ─── CLI Tab ─────────────────────────────────────────────────────────────────

const CLI_CODE = `! Step 1: Enable DHCP Snooping (DAI prerequisite)
ip dhcp snooping
ip dhcp snooping vlan 10,20,99

! Step 2: Mark uplink as trusted
interface GigabitEthernet0/1
 ip dhcp snooping trust
 ip arp inspection trust
 exit

! Step 3: Enable DAI per VLAN
ip arp inspection vlan 10,20,99

! Step 4: Rate-limit ARP on access ports (optional)
interface range FastEthernet0/1-23
 ip arp inspection limit rate 100
 exit

! Verify
show ip arp inspection
show ip arp inspection vlan 10`;

interface CliLine {
  text: string;
  color: string;
}

function highlightCli(code: string): CliLine[] {
  return code.split('\n').map(line => {
    const trimmed = line.trim();
    if (trimmed.startsWith('!')) return { text: line, color: '#8b949e' };
    if (trimmed.startsWith('show ')) return { text: line, color: '#7ee787' };
    if (/^(ip|interface|exit)/.test(trimmed)) {
      // orange for values (vlan numbers, interface names in value position)
      return { text: line, color: '#7ee787' };
    }
    if (/^\s+(ip |switchport|spanning)/.test(line)) return { text: line, color: '#7ee787' };
    return { text: line, color: '#e6edf3' };
  });
}

const CliTab: React.FC<{ isDarkMode: boolean }> = ({ isDarkMode }) => {
  const T = getLabTheme(isDarkMode);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(CLI_CODE).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
      // fallback: select the text
    });
  };

  const lines = highlightCli(CLI_CODE);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', animation: 'arp-fade 0.25s ease-out' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: T.textPrimary }}>Cisco IOS — DAI Configuration</h3>
          <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: T.textSecondary }}>
            Full command sequence to enable DHCP Snooping and Dynamic ARP Inspection.
          </p>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          style={{
            padding: '7px 14px',
            fontSize: '0.72rem',
            fontWeight: 700,
            borderRadius: 8,
            border: `1px solid ${T.borderColor}`,
            background: copied ? '#3fb95020' : T.cardBg,
            color: copied ? '#3fb950' : T.textSecondary,
            cursor: 'pointer',
            fontFamily: 'inherit',
            transition: 'all 0.2s',
          }}
        >
          {copied ? '✓ Copied!' : '📋 Copy'}
        </button>
      </div>

      <div style={{ borderRadius: 12, overflow: 'hidden', border: `1px solid ${T.borderColor}` }}>
        <div style={{
          background: '#1a1a2e',
          padding: '0.55rem 1rem',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          <div style={{ display: 'flex', gap: 5 }}>
            {['#ff5f56', '#ffbd2e', '#27c93f'].map(c => (
              <div key={c} style={{ width: 9, height: 9, borderRadius: '50%', background: c }} />
            ))}
          </div>
          <span style={{ fontFamily: 'monospace', fontSize: '0.65rem', color: '#8b949e' }}>
            terminal — ios / privileged exec
          </span>
        </div>
        <pre style={{
          margin: 0,
          background: '#0d1117',
          padding: '1rem 1.25rem',
          fontFamily: "'Fira Code','Cascadia Code',monospace",
          fontSize: '0.72rem',
          lineHeight: 1.85,
          overflowX: 'auto',
        }}>
          {lines.map((l, i) => {
            // highlight vlan numbers and interface names orange
            const rendered = l.text.replace(
              /(\bvlan\s+[\d,]+|\bGigabitEthernet[\w/]+|\bFastEthernet[\w/-]+|\brange\s+\S+|\brate\s+\d+)/g,
              '<ORANGE>$1</ORANGE>'
            );
            const parts = rendered.split(/(<ORANGE>.*?<\/ORANGE>)/);
            return (
              <span key={i} style={{ display: 'block', color: l.color }}>
                {parts.map((part, j) => {
                  if (part.startsWith('<ORANGE>')) {
                    return (
                      <span key={j} style={{ color: '#ffa657' }}>
                        {part.replace(/<\/?ORANGE>/g, '')}
                      </span>
                    );
                  }
                  return part;
                })}
              </span>
            );
          })}
        </pre>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1rem',
        borderTop: `1px solid ${T.borderColor}`,
        paddingTop: '1.25rem',
      }}>
        {[
          {
            icon: '🔒',
            color: '#3fb950',
            title: 'Order Matters',
            body: 'Always enable DHCP Snooping before DAI. DAI requires the snooping binding table — enabling DAI first drops all ARP traffic.',
          },
          {
            icon: '⚡',
            color: '#4493f8',
            title: 'Trusted Ports',
            body: 'Only uplinks to known legitimate devices should be trusted. All access ports should remain untrusted by default.',
          },
          {
            icon: '📊',
            color: '#d29922',
            title: 'Rate Limiting',
            body: 'Default 100 ARP/sec per port. Excessive ARP (from scanning/poisoning) triggers an err-disabled event — investigate with `show ip arp inspection statistics`.',
          },
        ].map(item => (
          <div key={item.title} style={{
            background: T.cardBg,
            border: `1px solid ${T.borderColor}`,
            borderRadius: 10,
            padding: '0.9rem',
            borderTop: `3px solid ${item.color}`,
          }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: item.color, marginBottom: 5 }}>
              {item.icon} {item.title}
            </div>
            <p style={{ margin: 0, fontSize: '0.75rem', color: T.textSecondary, lineHeight: 1.55 }}>{item.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Defence Tab ─────────────────────────────────────────────────────────────

interface DefenceTabProps {
  defDAI: boolean;
  defStaticArp: boolean;
  onToggleDAI: () => void;
  onToggleStaticArp: () => void;
  isDarkMode: boolean;
}

const DefenceTab: React.FC<DefenceTabProps> = ({
  defDAI,
  defStaticArp,
  onToggleDAI,
  onToggleStaticArp,
  isDarkMode,
}) => {
  const T = getLabTheme(isDarkMode);
  const [attackBlocked, setAttackBlocked] = useState(false);
  const [simulating, setSimulating] = useState(false);

  const isProtected = defDAI || defStaticArp;

  const simulateAttack = () => {
    if (simulating) return;
    setSimulating(true);
    setAttackBlocked(false);
    setTimeout(() => {
      setAttackBlocked(true);
      setTimeout(() => {
        setAttackBlocked(false);
        setSimulating(false);
      }, 2500);
    }, 800);
  };

  const ToggleCard = ({
    enabled,
    onToggle,
    title,
    icon,
    color,
    onDesc,
    offDesc,
    command,
  }: {
    enabled: boolean;
    onToggle: () => void;
    title: string;
    icon: string;
    color: string;
    onDesc: string;
    offDesc: string;
    command: string;
  }) => (
    <div style={{
      background: T.cardBg,
      border: `1px solid ${enabled ? color + '50' : T.borderColor}`,
      borderRadius: 12,
      overflow: 'hidden',
      transition: 'border-color 0.25s',
    }}>
      <div style={{
        padding: '1rem 1.1rem',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        background: enabled ? `${color}08` : 'transparent',
        borderBottom: `1px solid ${enabled ? color + '30' : T.borderColor}`,
      }}>
        <span style={{ fontSize: '1.4rem' }}>{icon}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: '0.88rem', color: T.textPrimary }}>{title}</div>
          <div style={{ fontSize: '0.7rem', color: T.textMuted, fontFamily: 'monospace', marginTop: 2 }}>
            {command}
          </div>
        </div>
        <button
          type="button"
          onClick={onToggle}
          style={{
            width: 44,
            height: 24,
            borderRadius: 12,
            border: 'none',
            cursor: 'pointer',
            background: enabled ? color : T.panelBg,
            position: 'relative',
            transition: 'background 0.25s',
            flexShrink: 0,
          }}
          aria-pressed={enabled}
        >
          <div style={{
            position: 'absolute',
            top: 3,
            left: enabled ? 23 : 3,
            width: 18,
            height: 18,
            borderRadius: '50%',
            background: '#fff',
            transition: 'left 0.2s',
            boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
          }} />
        </button>
      </div>
      <div style={{ padding: '0.85rem 1.1rem' }}>
        <p style={{ margin: 0, fontSize: '0.78rem', color: T.textSecondary, lineHeight: 1.6 }}>
          {enabled ? onDesc : offDesc}
        </p>
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', animation: 'arp-fade 0.25s ease-out' }}>

      {/* Status banner */}
      <div style={{
        padding: '0.85rem 1.25rem',
        borderRadius: 10,
        background: isProtected ? 'rgba(63,185,80,0.08)' : 'rgba(248,81,73,0.08)',
        border: `1px solid ${isProtected ? '#3fb95040' : '#f8514940'}`,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}>
        <span style={{ fontSize: '1.4rem' }}>{isProtected ? '🛡️' : '⚠️'}</span>
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.88rem', color: isProtected ? '#3fb950' : '#f85149' }}>
            {isProtected ? 'Protected — Attack blocked' : 'Vulnerable — ARP cache can be poisoned'}
          </div>
          <div style={{ fontSize: '0.72rem', color: isProtected ? '#3fb95080' : '#f8514980', marginTop: 2 }}>
            {isProtected
              ? `Active defences: ${[defDAI && 'Dynamic ARP Inspection', defStaticArp && 'Static ARP'].filter(Boolean).join(' + ')}`
              : 'Enable at least one defence mechanism below to protect the network'}
          </div>
        </div>
        {attackBlocked && (
          <div style={{
            marginLeft: 'auto',
            padding: '4px 10px',
            borderRadius: 6,
            background: '#3fb95020',
            border: '1px solid #3fb95040',
            fontSize: '0.72rem',
            fontWeight: 700,
            color: '#3fb950',
            animation: 'arp-fade 0.2s ease-out',
          }}>
            🚫 Attack BLOCKED
          </div>
        )}
      </div>

      {/* Toggle cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px,1fr))', gap: '1rem' }}>
        <ToggleCard
          enabled={defDAI}
          onToggle={onToggleDAI}
          title="Dynamic ARP Inspection (DAI)"
          icon="🔍"
          color="#3fb950"
          command="ip arp inspection vlan 10"
          onDesc="The switch validates every ARP packet against the DHCP snooping binding table. Unsolicited ARP Replies from untrusted ports are silently dropped. Enable per-VLAN: ip arp inspection vlan 10"
          offDesc="ARP poisoning is possible. Any device on the segment can send forged ARP Replies and overwrite another host's cache entry without validation."
        />
        <ToggleCard
          enabled={defStaticArp}
          onToggle={onToggleStaticArp}
          title="Static ARP Entries"
          icon="📌"
          color="#4493f8"
          command="arp 192.168.1.1 AA:BB:CC:DD:EE:FF ARPA"
          onDesc="Critical MAC-IP mappings are pinned permanently in the ARP table. Cannot be overwritten by ARP Replies — even unsolicited gratuitous ARPs are ignored for pinned entries."
          offDesc="ARP entries are dynamically learned and can be overwritten at any time. An attacker can send a forged ARP Reply to redirect traffic through their machine."
        />
      </div>

      {/* Simulate button */}
      <div style={{ textAlign: 'center' }}>
        <button
          type="button"
          onClick={simulateAttack}
          disabled={simulating}
          style={{
            padding: '10px 24px',
            fontSize: '0.8rem',
            fontWeight: 700,
            borderRadius: 10,
            border: `1px solid ${isProtected ? '#3fb95040' : '#f8514940'}`,
            background: isProtected ? '#3fb95015' : '#f8514915',
            color: isProtected ? '#3fb950' : '#f85149',
            cursor: simulating ? 'not-allowed' : 'pointer',
            opacity: simulating ? 0.6 : 1,
            fontFamily: 'inherit',
            transition: 'all 0.2s',
          }}
        >
          {simulating
            ? (attackBlocked ? '🚫 Attack Blocked!' : '⚡ Simulating…')
            : '⚡ Simulate Poison Attempt'}
        </button>
        <p style={{ margin: '8px 0 0', fontSize: '0.72rem', color: getLabTheme(isDarkMode).textMuted }}>
          {isProtected
            ? 'Defence active — the attack will be intercepted and blocked by the switch'
            : 'No defences active — the attack will succeed and poison both ARP caches'}
        </p>
      </div>

      {/* DHCP Snooping explanation */}
      <div style={{
        background: getLabTheme(isDarkMode).cardBg,
        border: `1px solid ${getLabTheme(isDarkMode).borderColor}`,
        borderRadius: 12,
        padding: '1.1rem',
        borderLeft: '4px solid #4493f8',
      }}>
        <h4 style={{ margin: '0 0 8px', fontSize: '0.88rem', fontWeight: 700, color: '#4493f8' }}>
          DHCP Snooping: DAI Prerequisite
        </h4>
        <p style={{ margin: '0 0 8px', fontSize: '0.78rem', color: getLabTheme(isDarkMode).textSecondary, lineHeight: 1.6 }}>
          DAI validates ARP packets against the <strong>DHCP snooping binding table</strong> — a database of
          {' '}<code style={{ fontFamily: 'monospace', color: '#4493f8' }}>IP + MAC + port + VLAN</code> entries built
          as clients receive DHCP leases. Without this table, DAI has nothing to validate against and will drop all
          ARP traffic from untrusted ports.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px,1fr))', gap: '0.75rem' }}>
          {[
            { title: 'Trusted Ports', body: 'Uplinks to distribution switches, DHCP servers, and routers. These bypass DAI validation.', color: '#3fb950' },
            { title: 'Untrusted Ports', body: 'All access ports to end devices. Every ARP packet is validated against the binding table.', color: '#f85149' },
          ].map(item => (
            <div key={item.title} style={{
              padding: '0.7rem',
              borderRadius: 8,
              background: `${item.color}08`,
              border: `1px solid ${item.color}30`,
            }}>
              <div style={{ fontWeight: 700, fontSize: '0.78rem', color: item.color, marginBottom: 4 }}>{item.title}</div>
              <div style={{ fontSize: '0.72rem', color: getLabTheme(isDarkMode).textSecondary, lineHeight: 1.5 }}>{item.body}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── Topology Tab ─────────────────────────────────────────────────────────────

interface TopologyTabProps {
  isDarkMode: boolean;
  selectedDevice: string | null;
  onSelectDevice: (id: string | null) => void;
}

const TopologyTab: React.FC<TopologyTabProps> = ({ isDarkMode, selectedDevice, onSelectDevice }) => {
  const T = getLabTheme(isDarkMode);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', animation: 'arp-fade 0.25s ease-out' }}>
      {/* Main SVG */}
      <div style={{
        background: T.panelBg,
        border: `1px solid ${T.borderColor}`,
        borderRadius: 14,
        overflow: 'hidden',
      }}>
        <TopologySvg
          step={0}
          packets={[]}
          stepKey={0}
          showDai={false}
          selectedDevice={selectedDevice}
          onSelectDevice={onSelectDevice}
          isDarkMode={isDarkMode}
        />
      </div>

      {/* Device info popup */}
      {selectedDevice && DEVICE_INFO[selectedDevice] && (
        <div style={{
          background: T.cardBg,
          border: `1px solid ${DEVICE_INFO[selectedDevice].color}40`,
          borderRadius: 12,
          padding: '1rem 1.25rem',
          animation: 'arp-fade 0.2s ease-out',
          display: 'flex',
          gap: 12,
          alignItems: 'flex-start',
        }}>
          <span style={{ fontSize: '1.8rem' }}>{DEVICE_INFO[selectedDevice].emoji}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: '0.92rem', color: DEVICE_INFO[selectedDevice].color, marginBottom: 4 }}>
              {DEVICE_INFO[selectedDevice].name}
            </div>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 6 }}>
              <span style={{ fontSize: '0.72rem', fontFamily: 'monospace', color: T.textSecondary }}>
                IP: <span style={{ color: T.textPrimary }}>{DEVICE_INFO[selectedDevice].ip}</span>
              </span>
              <span style={{ fontSize: '0.72rem', fontFamily: 'monospace', color: T.textSecondary }}>
                MAC: <span style={{ color: T.textPrimary }}>{DEVICE_INFO[selectedDevice].mac}</span>
              </span>
            </div>
            <p style={{ margin: 0, fontSize: '0.78rem', color: T.textSecondary, lineHeight: 1.55 }}>
              {DEVICE_INFO[selectedDevice].role}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onSelectDevice(null)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: T.textMuted,
              fontSize: '1rem',
              padding: 4,
              lineHeight: 1,
            }}
          >✕</button>
        </div>
      )}

      {/* Normal ARP Tables */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <ArpTablePanel
          title="Victim ARP Cache"
          subtitle={VICTIM_IP}
          entries={NORMAL_VICTIM_ARP}
          isDarkMode={isDarkMode}
        />
        <ArpTablePanel
          title="Gateway ARP Cache"
          subtitle={GW_IP}
          entries={NORMAL_GW_ARP}
          isDarkMode={isDarkMode}
        />
      </div>

      {/* Explanation */}
      <div style={{
        background: T.cardBg,
        border: `1px solid ${T.borderColor}`,
        borderRadius: 10,
        padding: '1rem 1.25rem',
        borderLeft: '4px solid #4493f8',
      }}>
        <p style={{ margin: 0, fontSize: '0.8rem', color: T.textSecondary, lineHeight: 1.65 }}>
          In normal operation, each device's ARP cache correctly maps IP addresses to MAC addresses. The switch
          forwards frames to the correct port based on its MAC table. All four devices share the same Layer 2
          broadcast domain — meaning any device can send ARP broadcasts that every other device will receive.
          This is the property that makes ARP poisoning possible. Click any device to learn more.
        </p>
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

export interface ArpMitmProps {
  isDarkMode?: boolean;
  isPro?: boolean;
  onUpgrade?: () => void;
}

export const ArpMitm: React.FC<ArpMitmProps> = ({ isDarkMode = true }) => {
  const T = getLabTheme(isDarkMode);

  const [tab, setTab]                   = useState<ArpTab>('topology');
  const [step, setStep]                 = useState(0);
  const [playing, setPlaying]           = useState(false);
  const [defDAI, setDefDAI]             = useState(false);
  const [defStaticArp, setDefStaticArp] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);

  // Used to force re-animation on step change
  const [stepKey, setStepKey] = useState(0);

  const playTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const totalSteps = ATTACK_STEPS.length;
  const currentStep = ATTACK_STEPS[step];

  const goToStep = useCallback((n: number) => {
    setStep(n);
    setStepKey(k => k + 1);
  }, []);

  const handleNext = useCallback(() => {
    if (step < totalSteps - 1) goToStep(step + 1);
    else setPlaying(false);
  }, [step, totalSteps, goToStep]);

  const handlePrev = useCallback(() => {
    if (step > 0) goToStep(step - 1);
  }, [step, goToStep]);

  const handleReset = useCallback(() => {
    setPlaying(false);
    goToStep(0);
  }, [goToStep]);

  // Auto-play effect
  useEffect(() => {
    if (playing) {
      playTimer.current = setTimeout(() => {
        if (step < totalSteps - 1) {
          goToStep(step + 1);
        } else {
          setPlaying(false);
        }
      }, 3000);
    }
    return () => {
      if (playTimer.current !== null) {
        clearTimeout(playTimer.current);
        playTimer.current = null;
      }
    };
  }, [playing, step, totalSteps, goToStep]);

  const protectionLabel = [defDAI && 'DAI', defStaticArp && 'Static ARP'].filter(Boolean).join(' + ') || 'None';

  const TABS: { id: ArpTab; label: string }[] = [
    { id: 'topology', label: '🗺️ Topology' },
    { id: 'attack',   label: '⚔️ Attack'   },
    { id: 'defence',  label: '🛡️ Defence'  },
    { id: 'cli',      label: '💻 CLI'      },
  ];

  return (
    <div style={{
      maxWidth: 960,
      margin: '0 auto',
      fontFamily: 'system-ui,-apple-system,sans-serif',
      color: T.textPrimary,
    }}>
      <style>{PKT_STYLES}</style>

      {/* ── Rainbow top bar ── */}
      <div style={{ height: 3, background: 'linear-gradient(90deg,#f85149,#a855f7,#4493f8,#3fb950)' }} />

      {/* ── Header ── */}
      <div style={{
        background: `linear-gradient(135deg, ${T.cardBg} 0%, ${T.panelBg} 100%)`,
        borderBottom: `1px solid ${T.borderColor}`,
        padding: '1.5rem 2rem',
        marginBottom: '1.5rem',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.25rem', flexWrap: 'wrap' }}>
          {/* Icon */}
          <div style={{
            width: 52,
            height: 52,
            borderRadius: 14,
            background: 'linear-gradient(135deg,#f85149,#a855f7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.5rem',
            flexShrink: 0,
          }}>🕵️</div>

          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
              <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
                ARP Poisoning & MITM Attack
              </h2>
              <span style={{
                fontSize: '0.6rem',
                fontWeight: 800,
                padding: '2px 8px',
                borderRadius: 20,
                background: `${T.danger}20`,
                color: T.danger,
                border: `1px solid ${T.danger}40`,
                textTransform: 'uppercase',
                letterSpacing: '0.07em',
              }}>Advanced</span>
              <span style={{
                fontSize: '0.6rem',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: 20,
                background: '#d2992215',
                color: '#d29922',
                border: '1px solid #d2992230',
                textTransform: 'uppercase',
                letterSpacing: '0.07em',
              }}>PRO Lab</span>
            </div>
            <p style={{ margin: 0, color: T.textSecondary, fontSize: '0.84rem', lineHeight: 1.5 }}>
              Step through a live ARP cache poisoning attack, intercept credentials, and apply DAI and static ARP defences.
            </p>
          </div>

          {/* Stats strip */}
          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
            {[
              { label: 'Devices',       val: '4'             },
              { label: 'Attack Steps',  val: '8'             },
              { label: 'Current Step',  val: `${step + 1}/8` },
              { label: 'Protection',    val: protectionLabel  },
            ].map(s => (
              <div key={s.label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1rem', fontWeight: 800, color: '#a855f7' }}>{s.val}</div>
                <div style={{ fontSize: '0.58rem', color: T.textMuted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ padding: '0 2rem 2rem' }}>

        {/* ── Tab bar ── */}
        <div style={{
          display: 'flex',
          gap: 0,
          marginBottom: '1.5rem',
          borderBottom: `1px solid ${T.borderColor}`,
        }}>
          {TABS.map(t => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              style={{
                padding: '0.55rem 1.1rem',
                fontSize: '0.8rem',
                fontWeight: 700,
                border: 'none',
                borderBottom: tab === t.id ? '2px solid #a855f7' : '2px solid transparent',
                background: 'transparent',
                color: tab === t.id ? '#a855f7' : T.textMuted,
                cursor: 'pointer',
                fontFamily: 'inherit',
                transition: 'color 0.15s, border-color 0.15s',
                marginBottom: -1,
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Topology Tab ── */}
        {tab === 'topology' && (
          <TopologyTab
            isDarkMode={isDarkMode}
            selectedDevice={selectedDevice}
            onSelectDevice={setSelectedDevice}
          />
        )}

        {/* ── Attack Tab ── */}
        {tab === 'attack' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', animation: 'arp-fade 0.25s ease-out' }}>

            {/* Step title + description */}
            <div style={{
              background: T.cardBg,
              border: `1px solid ${T.borderColor}`,
              borderRadius: 12,
              padding: '1.1rem 1.25rem',
              borderLeft: `4px solid ${step >= 5 ? '#f85149' : step === 7 ? '#3fb950' : '#a855f7'}`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <span style={{
                  fontSize: '0.65rem',
                  fontWeight: 800,
                  padding: '2px 7px',
                  borderRadius: 10,
                  background: T.panelBg,
                  color: T.textMuted,
                  border: `1px solid ${T.borderColor}`,
                  fontFamily: 'monospace',
                }}>Step {step + 1} / {totalSteps}</span>
                <span style={{ fontSize: '1rem', fontWeight: 800, color: T.textPrimary }}>
                  {currentStep.title}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '0.8rem', color: T.textSecondary, lineHeight: 1.65 }}>
                {currentStep.desc}
              </p>
            </div>

            {/* SVG Topology */}
            <div style={{
              background: T.panelBg,
              border: `1px solid ${T.borderColor}`,
              borderRadius: 14,
              overflow: 'hidden',
            }}>
              <TopologySvg
                step={step}
                packets={currentStep.packets}
                stepKey={stepKey}
                showDai={currentStep.showDai}
                selectedDevice={selectedDevice}
                onSelectDevice={setSelectedDevice}
                isDarkMode={isDarkMode}
              />
            </div>

            {/* Intercept panel (step 6) */}
            {currentStep.showIntercept && (
              <div style={{ animation: 'arp-fade 0.3s ease-out' }}>
                <InterceptPanel isDarkMode={isDarkMode} />
              </div>
            )}

            {/* ARP Tables */}
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <ArpTablePanel
                title="Victim ARP Cache"
                subtitle={VICTIM_IP}
                entries={currentStep.victimArp}
                isDarkMode={isDarkMode}
              />
              <ArpTablePanel
                title="Gateway ARP Cache"
                subtitle={GW_IP}
                entries={currentStep.gatewayArp}
                isDarkMode={isDarkMode}
              />
            </div>

            {/* Controls */}
            <div style={{
              background: T.cardBg,
              border: `1px solid ${T.borderColor}`,
              borderRadius: 12,
              padding: '1rem 1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              flexWrap: 'wrap',
            }}>
              <button
                type="button"
                onClick={handlePrev}
                disabled={step === 0}
                style={{
                  padding: '8px 16px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  borderRadius: 8,
                  border: `1px solid ${T.borderColor}`,
                  background: T.panelBg,
                  color: step === 0 ? T.textMuted : T.textPrimary,
                  cursor: step === 0 ? 'not-allowed' : 'pointer',
                  opacity: step === 0 ? 0.4 : 1,
                  fontFamily: 'inherit',
                }}
              >← Prev</button>

              <button
                type="button"
                onClick={() => setPlaying(p => !p)}
                style={{
                  padding: '8px 18px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  borderRadius: 8,
                  border: 'none',
                  background: playing ? '#d29922' : '#a855f7',
                  color: '#fff',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  minWidth: 80,
                }}
              >{playing ? '⏸ Pause' : '▶ Play'}</button>

              <button
                type="button"
                onClick={handleNext}
                disabled={step === totalSteps - 1}
                style={{
                  padding: '8px 16px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  borderRadius: 8,
                  border: `1px solid ${T.borderColor}`,
                  background: T.panelBg,
                  color: step === totalSteps - 1 ? T.textMuted : T.textPrimary,
                  cursor: step === totalSteps - 1 ? 'not-allowed' : 'pointer',
                  opacity: step === totalSteps - 1 ? 0.4 : 1,
                  fontFamily: 'inherit',
                }}
              >Next →</button>

              <button
                type="button"
                onClick={handleReset}
                style={{
                  padding: '8px 14px',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  borderRadius: 8,
                  border: `1px dashed ${T.borderColor}`,
                  background: 'transparent',
                  color: T.textMuted,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  marginLeft: 'auto',
                }}
              >↺ Reset</button>

              {/* Step dots */}
              <div style={{ display: 'flex', gap: 5, marginLeft: 'auto' }}>
                {ATTACK_STEPS.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => goToStep(i)}
                    style={{
                      width: i === step ? 20 : 8,
                      height: 8,
                      borderRadius: 4,
                      border: 'none',
                      cursor: 'pointer',
                      background: i === step ? '#a855f7' : i < step ? '#a855f750' : T.borderColor,
                      padding: 0,
                      transition: 'width 0.2s, background 0.2s',
                    }}
                    aria-label={`Go to step ${i + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Defence Tab ── */}
        {tab === 'defence' && (
          <DefenceTab
            defDAI={defDAI}
            defStaticArp={defStaticArp}
            onToggleDAI={() => setDefDAI(v => !v)}
            onToggleStaticArp={() => setDefStaticArp(v => !v)}
            isDarkMode={isDarkMode}
          />
        )}

        {/* ── CLI Tab ── */}
        {tab === 'cli' && <CliTab isDarkMode={isDarkMode} />}

        {/* ── Edu Panel ── */}
        <LabEduPanel cards={EDU_CARDS} isDarkMode={isDarkMode} />
      </div>
    </div>
  );
};

export default ArpMitm;
