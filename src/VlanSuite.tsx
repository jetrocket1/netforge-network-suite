import React, { useState, useEffect, useRef } from 'react';
import { getLabTheme } from './labTheme';
import { LabEduPanel, type EduCard } from './LabEduPanel';

/* ─── Types ─────────────────────────────────────────────────────── */
type TabId    = 'switch' | 'packet' | 'frame' | 'cli' | 'roas' | 'topo';
type PortMode = 'access' | 'trunk';
interface Vlan { id: number; name: string; color: string; }
interface Port { id: number; mode: PortMode; vlanId: number; nativeVlan: number; allowedVlans: number[]; label: string; }
interface SimLog { icon: string; text: string; sub: string; color: string; blocked?: boolean; }
interface CliLine { text: string; kind: 'prompt' | 'ok' | 'err' | 'info'; }

/* ─── Constants ──────────────────────────────────────────────────── */
const INIT_VLANS: Vlan[] = [
  { id:1,  name:'Default',    color:'#64748b' },
  { id:10, name:'Corp Data',  color:'#4493f8' },
  { id:20, name:'VoIP',       color:'#3fb950' },
  { id:30, name:'Guest/IoT',  color:'#f0883e' },
  { id:99, name:'Management', color:'#a855f7' },
];

const makePorts = (n: number): Port[] =>
  Array.from({ length: n }, (_, i) => ({
    id: i + 1,
    mode: (i === n - 1 ? 'trunk' : 'access') as PortMode,
    vlanId: i < Math.floor(n / 3) ? 10 : i < Math.floor(2 * n / 3) ? 20 : 30,
    nativeVlan: 1,
    allowedVlans: [1, 10, 20, 30, 99],
    label: i === n - 1 ? 'Uplink' : '',
  }));

const PCP_LABELS = [
  '0 – Best Effort (BE)', '1 – Background (BK)', '2 – Excellent Effort (EE)',
  '3 – Critical App (CA)', '4 – Video <100ms (VI)', '5 – Voice <10ms (VO)',
  '6 – Internetwork Ctrl (IC)', '7 – Network Ctrl (NC)',
];

const FRAME_FIELDS = [
  { key:'preamble', label:'Preamble',  bytes:'8 B',    color:'#64748b', desc:'7 bytes of alternating 10101010… + 1 byte SFD (10101011). Allows receiver clock synchronisation. Stripped by the NIC — never seen in Wireshark.' },
  { key:'dstmac',   label:'Dst MAC',   bytes:'6 B',    color:'#4493f8', desc:'48-bit destination MAC address. The switch reads this to perform MAC table lookup and decide which port(s) to forward the frame to.' },
  { key:'srcmac',   label:'Src MAC',   bytes:'6 B',    color:'#4493f8', desc:'48-bit source MAC address. The switch uses this to learn MAC-to-port mappings (fills the CAM table).' },
  { key:'tag',      label:'802.1Q Tag', bytes:'4 B',   color:'#a855f7', desc:'Added by the switch on trunk ports. Contains TPID (0x8100), PCP (3-bit priority), DEI (1-bit drop eligibility), and VID (12-bit VLAN ID, 1–4094).' },
  { key:'etype',    label:'EtherType', bytes:'2 B',    color:'#d29922', desc:'Identifies the Layer 3 protocol in the payload. 0x0800 = IPv4, 0x0806 = ARP, 0x86DD = IPv6. Value ≥ 1536 = EtherType; value < 1536 = IEEE 802.3 length field.' },
  { key:'payload',  label:'Payload',   bytes:'46–1500 B', color:'#3fb950', desc:'The encapsulated upper-layer data (IP packet, ARP packet, etc.). Minimum 46 B due to CSMA/CD slot time; maximum 1500 B (standard MTU). Padding is added if payload is shorter than 46 B.' },
  { key:'fcs',      label:'FCS',       bytes:'4 B',    color:'#f85149', desc:'Frame Check Sequence — 32-bit CRC computed over everything from Dest MAC through payload. Receiver recomputes CRC; mismatch = corrupted frame, silently discarded.' },
];

const SCENARIOS = [
  { title:'Configure an Access Port',    desc:'Fa0/3 must carry Corp Data (VLAN 10) only. Configure it as an 802.1Q access port.',              cmds:['interface fa0/3','switchport mode access','switchport access vlan 10'],         hints:['interface fa0/3','switchport mode access','switchport access vlan 10'] },
  { title:'Configure a Trunk Uplink',    desc:'Fa0/24 connects to another switch. Make it an 802.1Q trunk with native VLAN 99.',                 cmds:['interface fa0/24','switchport mode trunk','switchport trunk native vlan 99'],     hints:['interface fa0/24','switchport mode trunk','switchport trunk native vlan 99'] },
  { title:'Restrict Trunk VLAN List',    desc:'Allow only VLANs 10, 20 and 99 on the Fa0/24 trunk. Prune everything else.',                      cmds:['interface fa0/24','switchport trunk allowed vlan 10,20,99'],                     hints:['interface fa0/24','switchport trunk allowed vlan 10,20,99'] },
  { title:'Create VLAN in Database',     desc:'Create VLAN 50 named "DMZ_Servers". Ports cannot be assigned until the VLAN exists here.',         cmds:['vlan 50','name dmz_servers'],                                                    hints:['vlan 50','name DMZ_Servers'] },
  { title:'Verify VLAN Configuration',   desc:'Display all VLANs and their assigned ports in a compact summary.',                                  cmds:['show vlan brief'],                                                               hints:['show vlan brief'] },
];

function normCmd(s: string) { return s.trim().toLowerCase().replace(/\s+/g, ' '); }

function buildSimLog(src: Port, dst: Port, vlans: Vlan[]): SimLog[] {
  const sv = src.mode === 'access' ? src.vlanId : src.nativeVlan;
  const dv = dst.mode === 'access' ? dst.vlanId : dst.nativeVlan;
  const sc = vlans.find(v => v.id === sv)?.color ?? '#64748b';
  const dc = vlans.find(v => v.id === dv)?.color ?? '#64748b';
  const logs: SimLog[] = [
    { icon:'📤', text:`Frame leaves Fa0/${src.id}`, sub: src.mode==='access' ? `Untagged egress — access port implies VLAN ${sv}` : `Tagged with 802.1Q VID ${sv} (native ${src.nativeVlan} = untagged)`, color: sc },
    { icon:'🏷️', text:'Switch ingress processing', sub: src.mode==='access' ? `Internal VLAN tag ${sv} added by switch for forwarding decision` : `802.1Q header parsed — VID = ${sv}`, color:'#4493f8' },
    { icon:'🔍', text:'MAC address table lookup', sub:`Searching CAM table for destination MAC within VLAN ${sv} broadcast domain`, color:'#d29922' },
  ];
  if (src.id === dst.id) {
    logs.push({ icon:'🔄', text:'Same port — frame dropped', sub:'Source and destination are the same port. Switch does not forward.', color:'#f85149', blocked:true });
  } else if (sv !== dv) {
    logs.push({ icon:'🚫', text:'Blocked — different broadcast domain', sub:`Src VLAN ${sv} ≠ Dst VLAN ${dv}. Layer 2 cannot cross VLAN boundaries. Inter-VLAN routing (Layer 3) required.`, color:'#f85149', blocked:true });
  } else {
    const trunkNote = dst.mode === 'trunk' ? ` Frame exits tagged (VLAN ${dv})` : ' Tag stripped on egress (access port)';
    logs.push(
      { icon:'✅', text:`Forward to Fa0/${dst.id}`, sub:`Same VLAN ${sv} — forwarding permitted.${trunkNote}`, color:'#3fb950' },
      { icon:'📥', text:`Delivered to Fa0/${dst.id}`, sub: dst.mode==='access' ? `End device receives untagged frame — transparent to VLAN tagging` : `Downstream switch receives 802.1Q-tagged frame for VLAN ${dv}`, color: dc },
    );
  }
  return logs;
}

const VLAN_EDU: EduCard[] = [
  { type:'exam', title:'Access vs Trunk Port', body:'Access ports carry one VLAN — frames leave untagged (VLAN implied by port assignment). Trunk ports carry multiple VLANs — each frame is 802.1Q-tagged unless it belongs to the native VLAN (transmitted untagged). Mixing them causes silent traffic loss — the #1 VLAN misconfiguration on the exam.' },
  { type:'exam', title:'Native VLAN Must Match on Both Trunk Ends', body:'Untagged frames arriving on a trunk are assigned to the native VLAN. If native VLANs differ on both ends of the trunk, traffic is silently placed in the wrong VLAN. Cisco switches generate a CDP "Native VLAN mismatch" warning. Change native from VLAN 1 to an unused VLAN on all trunks as a security baseline.' },
  { type:'config', title:'Full VLAN + Trunk + RoaS Config', body:'Switch and router configuration for inter-VLAN routing.', code:`! ─── VLAN database ───
vlan 10
  name Corporate_Data
vlan 20
  name VoIP_Voice
vlan 99
  name Management

! ─── Access port ───
interface FastEthernet0/1
  switchport mode access
  switchport access vlan 10

! ─── Voice VLAN (PC + IP phone, one cable) ───
interface FastEthernet0/5
  switchport mode access
  switchport access vlan 10
  switchport voice vlan 20

! ─── Trunk to router ───
interface FastEthernet0/24
  switchport mode trunk
  switchport trunk native vlan 99
  switchport trunk allowed vlan 10,20,99

! ─── Router sub-interfaces (RoaS) ───
interface GigabitEthernet0/0.10
  encapsulation dot1Q 10
  ip address 192.168.10.1 255.255.255.0
interface GigabitEthernet0/0.20
  encapsulation dot1Q 20
  ip address 192.168.20.1 255.255.255.0` },
  { type:'gotcha', title:'VLAN 1 as Native = VLAN Hopping Attack Surface', body:'Double-tagging VLAN hopping: attacker on native VLAN sends a frame with two 802.1Q tags. Switch 1 strips the outer tag (VLAN 1), switch 2 processes the inner tag (target VLAN). Attack is one-way but can reach any VLAN from an unprotected access port. Fix: change native VLAN to an unused VLAN (e.g., 999) on every trunk.' },
  { type:'gotcha', title:'Allowed List Doesn\'t Create VLANs', body:'"switchport trunk allowed vlan 10,20" permits those VLANs on the trunk — but if VLAN 10 doesn\'t exist in the VLAN database, its traffic is still dropped silently. Always create VLANs with "vlan X / name Y" first, then assign them to ports. Check with "show vlan brief".' },
  { type:'realworld', title:'Voice VLAN: Two VLANs, One Cable', body:'IP phones have a built-in 3-port switch. Phone connects to wall jack; PC connects to phone. "switchport voice vlan 20" tells the phone to tag its own traffic VLAN 20 and pass PC traffic untagged (VLAN 10). One cable, two logically separated VLANs with different QoS policies — standard in every enterprise office with 100+ desk phones.' },
];

/* ─── VLAN Topology SVG ─────────────────────────────────────────── */
const TOPO_SW_CX = 430, TOPO_SW_CY = 240, TOPO_SW_HW = 85, TOPO_SW_HH = 48;

function topoSwEdge(zx: number, zy: number) {
  const dx = zx - TOPO_SW_CX, dy = zy - TOPO_SW_CY;
  let t = Infinity;
  if (dx >  0.01) { const tx = TOPO_SW_HW / dx;  if (Math.abs(dy * tx) <= TOPO_SW_HH + 1) t = Math.min(t, tx); }
  if (dx < -0.01) { const tx = TOPO_SW_HW / -dx; if (Math.abs(dy * tx) <= TOPO_SW_HH + 1) t = Math.min(t, tx); }
  if (dy >  0.01) { const ty = TOPO_SW_HH / dy;  if (Math.abs(dx * ty) <= TOPO_SW_HW + 1) t = Math.min(t, ty); }
  if (dy < -0.01) { const ty = TOPO_SW_HH / -dy; if (Math.abs(dx * ty) <= TOPO_SW_HW + 1) t = Math.min(t, ty); }
  if (!isFinite(t)) return { x: TOPO_SW_CX, y: TOPO_SW_CY };
  return { x: TOPO_SW_CX + dx * t, y: TOPO_SW_CY + dy * t };
}

function topoDeviceOffsets(count: number) {
  const n = Math.min(count, 4);
  if (n === 1) return [{ dx:  0, dy:  0 }];
  if (n === 2) return [{ dx:-26, dy:  0 }, { dx: 26, dy:  0 }];
  if (n === 3) return [{ dx:-30, dy:  8 }, { dx:  0, dy:-16 }, { dx: 30, dy:  8 }];
  return      [{ dx:-30, dy:-12 }, { dx: 30, dy:-12 }, { dx:-30, dy: 18 }, { dx: 30, dy: 18 }];
}

function topoVlanIcon(v: Vlan) {
  const n = v.name.toLowerCase();
  if (n.includes('voip') || n.includes('voice'))            return '📞';
  if (n.includes('guest') || n.includes('iot'))             return '📱';
  if (n.includes('mgmt') || n.includes('manage') || n.includes('ment')) return '🖥️';
  if (n.includes('server') || n.includes('dmz'))            return '🗄️';
  return '💻';
}

const TOPO_ZONES = [
  { x:135, y:125 },
  { x:695, y:125 },
  { x:145, y:375 },
  { x:695, y:375 },
  { x:420, y:82  },
];
const TOPO_ROUTER_X = 812, TOPO_ROUTER_Y = 240;
const ZRX = 80, ZRY = 65;

interface TopoSvgProps { vlans: Vlan[]; ports: Port[]; isDarkMode: boolean; T: ReturnType<typeof getLabTheme>; }

function TopoSvg({ vlans, ports, isDarkMode, T }: TopoSvgProps) {
  const isDark = isDarkMode;
  const bgCol   = isDark ? '#0d1117' : '#f6f8fa';
  const gridCol = isDark ? '#1c2128' : '#e8ecef';
  const swBg    = isDark ? '#161b22' : '#ffffff';
  const swBd    = isDark ? '#30363d' : '#d0d7de';
  const textC   = isDark ? '#e6edf3' : '#1f2328';
  const mutedC  = isDark ? '#6e7681' : '#8c959f';

  const vlanGroups = vlans
    .filter(v => v.id !== 1)
    .map(v => ({ ...v, apCount: ports.filter(p => p.mode === 'access' && p.vlanId === v.id).length }))
    .filter(g => g.apCount > 0);

  const trunkCount = ports.filter(p => p.mode === 'trunk').length;
  const trunkVlans = vlans.filter(v => v.id !== 1);

  return (
    <div style={{ background:T.panelBg, border:`1px solid ${T.borderColor}`, borderRadius:14, overflow:'hidden' }}>
      <svg viewBox="0 0 860 480" style={{ width:'100%', height:'auto', display:'block' }}>
        <defs>
          <linearGradient id="topoSwGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor="#4493f8" />
            <stop offset="45%"  stopColor="#3fb950" />
            <stop offset="100%" stopColor="#a855f7" />
          </linearGradient>
        </defs>

        {/* Background */}
        <rect width={860} height={480} fill={bgCol} />
        {Array.from({ length: 16 * 29 }, (_, k) => {
          const xi = k % 29, yi = Math.floor(k / 29);
          return <circle key={k} cx={xi * 30 + 15} cy={yi * 30 + 15} r={1} fill={gridCol} />;
        })}

        {/* Trunk lines to router */}
        {trunkCount > 0 && (() => {
          const edge = topoSwEdge(TOPO_ROUTER_X, TOPO_ROUTER_Y);
          const totalSpread = (trunkVlans.length - 1) * 5;
          const midX = (edge.x + TOPO_ROUTER_X - 28) / 2;
          return (
            <g>
              {trunkVlans.map((v, i) => (
                <line key={v.id}
                  x1={edge.x} y1={TOPO_SW_CY - totalSpread / 2 + i * 5}
                  x2={TOPO_ROUTER_X - 28} y2={TOPO_SW_CY - totalSpread / 2 + i * 5}
                  stroke={v.color} strokeWidth={2.5} strokeOpacity={0.75} />
              ))}
              <text x={midX} y={TOPO_SW_CY - totalSpread / 2 - 12}
                textAnchor="middle" fontSize={8.5} fontWeight={700} fill={mutedC}>802.1Q trunk</text>
              <text x={midX} y={TOPO_SW_CY - totalSpread / 2 - 2}
                textAnchor="middle" fontSize={7.5} fill={mutedC}>
                {trunkCount} port{trunkCount !== 1 ? 's' : ''}
              </text>
            </g>
          );
        })()}

        {/* VLAN broadcast domain zones */}
        {vlanGroups.map((g, i) => {
          if (i >= TOPO_ZONES.length) return null;
          const zone = TOPO_ZONES[i];
          const edge = topoSwEdge(zone.x, zone.y);
          const mx = (edge.x + zone.x) / 2;
          const my = (edge.y + zone.y) / 2 - 20;
          const offsets = topoDeviceOffsets(g.apCount);
          const icon = topoVlanIcon(g);
          return (
            <g key={g.id}>
              {/* Connector from switch edge to zone */}
              <path
                d={`M ${edge.x.toFixed(1)} ${edge.y.toFixed(1)} Q ${mx.toFixed(1)} ${my.toFixed(1)} ${zone.x} ${zone.y}`}
                fill="none" stroke={g.color} strokeWidth={2} strokeOpacity={0.5} />

              {/* Broadcast domain ellipse */}
              <ellipse cx={zone.x} cy={zone.y} rx={ZRX} ry={ZRY}
                fill={g.color} fillOpacity={0.07}
                stroke={g.color} strokeWidth={1.5} strokeDasharray="7 4" strokeOpacity={0.65} />

              {/* Port count badge inside top of zone */}
              <rect x={zone.x - 24} y={zone.y - ZRY + 8} width={48} height={18} rx={9} fill={g.color} />
              <text x={zone.x} y={zone.y - ZRY + 21}
                textAnchor="middle" fontSize={8.5} fontWeight={800} fill="#fff">
                {g.apCount} port{g.apCount !== 1 ? 's' : ''}
              </text>

              {/* Device icons */}
              {offsets.map((off, di) => (
                <g key={di} transform={`translate(${zone.x + off.dx},${zone.y + 10 + off.dy})`}>
                  <circle cx={0} cy={0} r={16}
                    fill={isDark ? '#1c2128' : '#ffffff'}
                    stroke={g.color} strokeWidth={1.5} />
                  <text x={0} y={6} textAnchor="middle" fontSize={12}>{icon}</text>
                </g>
              ))}

              {/* VLAN labels below zone */}
              <text x={zone.x} y={zone.y + ZRY + 15}
                textAnchor="middle" fontSize={9.5} fontWeight={800} fill={g.color}>
                VLAN {g.id}
              </text>
              <text x={zone.x} y={zone.y + ZRY + 27}
                textAnchor="middle" fontSize={8} fill={mutedC}>{g.name}</text>
            </g>
          );
        })}

        {/* Switch chassis */}
        <rect x={TOPO_SW_CX - TOPO_SW_HW} y={TOPO_SW_CY - TOPO_SW_HH}
          width={TOPO_SW_HW * 2} height={TOPO_SW_HH * 2} rx={13} fill={swBg} stroke={swBd} strokeWidth={2} />
        <rect x={TOPO_SW_CX - TOPO_SW_HW} y={TOPO_SW_CY - TOPO_SW_HH}
          width={TOPO_SW_HW * 2} height={4} fill="url(#topoSwGrad)" rx={13} />
        {ports.slice(0, Math.min(ports.length, 20)).map((p, i) => {
          const col = p.mode === 'trunk'
            ? '#a855f7'
            : (vlans.find(v => v.id === p.vlanId)?.color ?? '#64748b');
          const ci = i % 10, row = Math.floor(i / 10);
          return (
            <rect key={p.id}
              x={TOPO_SW_CX - TOPO_SW_HW + 12 + ci * 15}
              y={TOPO_SW_CY - TOPO_SW_HH + 10 + row * 17}
              width={11} height={8} rx={2} fill={col} opacity={0.85} />
          );
        })}
        <text x={TOPO_SW_CX} y={TOPO_SW_CY + TOPO_SW_HH - 16}
          textAnchor="middle" fontSize={10.5} fontWeight={800} fill={textC}>Catalyst-2960</text>
        <text x={TOPO_SW_CX} y={TOPO_SW_CY + TOPO_SW_HH - 4}
          textAnchor="middle" fontSize={7.5} fill={mutedC}>{ports.length}-port managed switch</text>

        {/* Router (trunk uplink) */}
        {trunkCount > 0 && (
          <g>
            <circle cx={TOPO_ROUTER_X} cy={TOPO_ROUTER_Y} r={28}
              fill={isDark ? '#161b22' : '#ffffff'}
              stroke={isDark ? '#30363d' : '#d0d7de'} strokeWidth={1.5} />
            <text x={TOPO_ROUTER_X} y={TOPO_ROUTER_Y + 7} textAnchor="middle" fontSize={19}>🔀</text>
            <text x={TOPO_ROUTER_X} y={TOPO_ROUTER_Y + 44}
              textAnchor="middle" fontSize={9} fontWeight={800} fill={textC}>Router</text>
            <text x={TOPO_ROUTER_X} y={TOPO_ROUTER_Y + 56}
              textAnchor="middle" fontSize={7.5} fill={mutedC}>RoaS</text>
          </g>
        )}

        {/* Empty state */}
        {vlanGroups.length === 0 && (
          <text x={TOPO_SW_CX} y={TOPO_SW_CY - 72}
            textAnchor="middle" fontSize={11} fill={mutedC}>
            Assign access ports in Switch Lab to see broadcast domains
          </text>
        )}
      </svg>

      {/* Legend */}
      <div style={{ padding:'0.65rem 1rem', borderTop:`1px solid ${T.borderColor}`, display:'flex', gap:'0.85rem', flexWrap:'wrap', alignItems:'center' }}>
        <span style={{ fontSize:'0.62rem', fontWeight:800, color:T.textMuted, textTransform:'uppercase', letterSpacing:'0.07em' }}>Broadcast Domains:</span>
        {vlanGroups.map(g => (
          <div key={g.id} style={{ display:'flex', alignItems:'center', gap:4 }}>
            <div style={{ width:8, height:8, borderRadius:2, background:g.color }} />
            <span style={{ fontSize:'0.7rem', fontWeight:600, color:T.textPrimary }}>VLAN {g.id} — {g.name}</span>
            <span style={{ fontSize:'0.62rem', color:T.textMuted }}>({g.apCount})</span>
          </div>
        ))}
        {trunkCount > 0 && (
          <div style={{ display:'flex', alignItems:'center', gap:5 }}>
            <div style={{ width:20, height:4, background:'linear-gradient(90deg,#4493f8,#3fb950,#a855f7)', borderRadius:2 }} />
            <span style={{ fontSize:'0.7rem', fontWeight:600, color:T.textPrimary }}>
              Trunk · {trunkCount} port{trunkCount !== 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Component ─────────────────────────────────────────────────── */
interface VlanSuiteProps { isDarkMode?: boolean; }

export const VlanSuite: React.FC<VlanSuiteProps> = ({ isDarkMode = true }) => {
  const T = getLabTheme(isDarkMode);

  /* switch lab */
  const [tab, setTab]             = useState<TabId>('switch');
  const [vlans, setVlans]         = useState<Vlan[]>(INIT_VLANS);
  const [chassisN, setChassisN]   = useState<8|24|48>(24);
  const [ports, setPorts]         = useState<Port[]>(() => makePorts(24));
  const [selPorts, setSelPorts]   = useState<Set<number>>(new Set([1]));
  const [newVlan, setNewVlan]     = useState({ id:'', name:'', color:'#4493f8' });
  const [bulkVlan, setBulkVlan]   = useState<number>(10);

  /* packet sim */
  const [simSrc, setSimSrc]       = useState(1);
  const [simDst, setSimDst]       = useState(5);
  const [simLogs, setSimLogs]     = useState<SimLog[]>([]);
  const [simStep, setSimStep]     = useState(-1);
  const [simRunning, setSimRunning] = useState(false);
  const simRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* frame forge */
  const [frameVid, setFrameVid]   = useState(10);
  const [framePcp, setFramePcp]   = useState(0);
  const [frameDei, setFrameDei]   = useState(0);
  const [activeField, setActiveField] = useState<string>('tag');

  /* cli challenge */
  const [cliIdx, setCliIdx]       = useState(0);
  const [cliInput, setCliInput]   = useState('');
  const [cliLog, setCliLog]       = useState<CliLine[]>([{ text:'Switch# ', kind:'prompt' }]);
  const [cliCmdIdx, setCliCmdIdx] = useState(0);
  const [cliDone, setCliDone]     = useState<Set<number>>(new Set());
  const [showHints, setShowHints] = useState(false);
  const cliEnd = useRef<HTMLDivElement>(null);

  /* derived */
  const firstSel = [...selPorts][0] ?? 1;
  const selPort  = ports.find(p => p.id === firstSel) ?? ports[0];
  const vlanOf   = (p: Port) => vlans.find(v => v.id === (p.mode === 'access' ? p.vlanId : p.nativeVlan));

  /* ─ handlers ─ */
  const resizeChassis = (n: 8|24|48) => { setChassisN(n); setPorts(makePorts(n)); setSelPorts(new Set([1])); };

  const clickPort = (id: number, shift: boolean) => {
    setSelPorts(prev => {
      const next = new Set(prev);
      if (shift) { next.has(id) ? next.delete(id) : next.add(id); }
      else { next.clear(); next.add(id); }
      return next;
    });
  };

  const updatePort = (partial: Partial<Port>) =>
    setPorts(ps => ps.map(p => selPorts.has(p.id) ? { ...p, ...partial } : p));

  const addVlan = (e: React.SyntheticEvent) => {
    e.preventDefault();
    const vid = parseInt(newVlan.id);
    if (isNaN(vid) || vid < 2 || vid > 4094) return;
    if (vlans.some(v => v.id === vid)) return;
    if (!newVlan.name.trim()) return;
    setVlans(vs => [...vs, { id:vid, name:newVlan.name.trim(), color:newVlan.color }].sort((a,b) => a.id-b.id));
    setNewVlan({ id:'', name:'', color:'#4493f8' });
  };

  const deleteVlan = (id: number) => {
    if (id === 1) return;
    setVlans(vs => vs.filter(v => v.id !== id));
    setPorts(ps => ps.map(p => p.vlanId === id ? { ...p, vlanId:1 } : p));
  };

  /* packet sim */
  const runSim = () => {
    if (simRunning) return;
    const src = ports.find(p => p.id === simSrc) ?? ports[0];
    const dst = ports.find(p => p.id === simDst) ?? ports[1];
    const logs = buildSimLog(src, dst, vlans);
    setSimLogs(logs);
    setSimStep(0);
    setSimRunning(true);
  };

  useEffect(() => {
    if (!simRunning || simStep < 0) return;
    simRef.current = setTimeout(() => {
      setSimStep(s => {
        if (s >= simLogs.length - 1) { setSimRunning(false); return s; }
        return s + 1;
      });
    }, 900);
    return () => { if (simRef.current) clearTimeout(simRef.current); };
  }, [simRunning, simStep, simLogs.length]);

  const resetSim = () => {
    if (simRef.current) clearTimeout(simRef.current);
    setSimRunning(false); setSimStep(-1); setSimLogs([]);
  };

  /* frame forge */
  const byte2 = (framePcp << 5) | (frameDei << 4) | ((frameVid >> 8) & 0x0F);
  const byte3 = frameVid & 0xFF;
  const toHex = (n: number) => n.toString(16).toUpperCase().padStart(2,'0');
  const toBin = (n: number, w: number) => n.toString(2).padStart(w,'0');

  /* CLI */
  useEffect(() => { cliEnd.current?.scrollIntoView({ behavior:'smooth' }); }, [cliLog]);

  const submitCli = (e: React.SyntheticEvent) => {
    e.preventDefault();
    const raw = cliInput.trim();
    if (!raw) return;
    setCliInput('');
    const scenario = SCENARIOS[cliIdx];
    const entered  = normCmd(raw);
    const expected = scenario.cmds.map(normCmd);
    const isCorrect = expected[cliCmdIdx] === entered;

    setCliLog(prev => [
      ...prev,
      { text:`Switch(config)# ${raw}`, kind:'prompt' },
      isCorrect
        ? { text:`✔  Correct${cliCmdIdx === expected.length - 1 ? ' — scenario complete!' : ''}`, kind:'ok' }
        : { text:`✘  Expected: ${scenario.cmds[cliCmdIdx]}`, kind:'err' },
    ]);

    if (isCorrect) {
      const nextIdx = cliCmdIdx + 1;
      if (nextIdx >= expected.length) {
        setCliDone(d => new Set([...d, cliIdx]));
        setCliCmdIdx(0);
        setCliLog(prev => [...prev, { text:'──── Scenario complete ────', kind:'info' }]);
      } else {
        setCliCmdIdx(nextIdx);
      }
    }
  };

  const selectScenario = (idx: number) => {
    setCliIdx(idx); setCliCmdIdx(0); setShowHints(false);
    setCliLog([{ text:`Switch# ! Scenario: ${SCENARIOS[idx].title}`, kind:'info' }, { text:'Switch(config)# ', kind:'prompt' }]);
  };

  /* RoaS config */
  const trunks = ports.filter(p => p.mode === 'trunk');
  const roasConfig = [
    `! ─── Switch: VLAN database ───`,
    ...vlans.filter(v => v.id !== 1).flatMap(v => [`vlan ${v.id}`, `  name ${v.name.replace(/\s/g,'_')}`, `!`]),
    `! ─── Trunk port${trunks.length > 1 ? 's' : ''} ───`,
    ...trunks.flatMap(p => [
      `interface FastEthernet0/${p.id}`,
      `  switchport mode trunk`,
      `  switchport trunk native vlan ${p.nativeVlan}`,
      `  switchport trunk allowed vlan ${p.allowedVlans.filter(v => vlans.some(vl => vl.id === v)).join(',')}`,
      `!`,
    ]),
    `! ─── Router-on-a-Stick (router Gi0/0) ───`,
    `interface GigabitEthernet0/0`,
    `  no shutdown`,
    `  exit`,
    `!`,
    ...vlans.filter(v => v.id !== 1).map(v =>
      `interface GigabitEthernet0/0.${v.id}\n  description ${v.name}\n  encapsulation dot1Q ${v.id}\n  ip address 10.${v.id}.0.1 255.255.255.0\n  exit\n!`
    ),
    `end`,
    `write memory`,
  ].join('\n');

  /* shared styles */
  const pill = (active: boolean, col: string): React.CSSProperties => ({
    padding:'5px 14px', borderRadius:20, fontWeight:700, fontSize:'0.72rem', cursor:'pointer',
    border:`1px solid ${active ? col : T.borderColor}`, background: active ? `${col}18` : 'transparent',
    color: active ? col : T.textMuted, transition:'all 0.15s', letterSpacing:'0.03em',
  });
  const inputS: React.CSSProperties = { width:'100%', boxSizing:'border-box', padding:'0.45rem 0.6rem', borderRadius:8, border:`1px solid ${T.borderColor}`, background:T.insetBg, color:T.textPrimary, outline:'none', fontSize:'0.8rem', fontFamily:'inherit' };
  const selS: React.CSSProperties   = { ...inputS, cursor:'pointer', fontWeight:600 };

  /* ─── Render ─── */
  return (
    <div style={{ background:T.cardBg, borderRadius:20, border:`1px solid ${T.borderColor}`, overflow:'hidden', fontFamily:'system-ui,-apple-system,sans-serif', color:T.textPrimary }}>
      <style>{`
        @keyframes vlan-fade { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:none} }
        @keyframes vlan-glow { 0%,100%{box-shadow:0 0 0 0 #4493f840} 50%{box-shadow:0 0 0 6px #4493f820} }
        @keyframes pkt-move  { from{transform:translateX(-12px);opacity:0} to{transform:none;opacity:1} }
        @keyframes pkt-block { 0%{transform:scale(1)} 30%{transform:scale(1.15)} 100%{transform:scale(1)} }
        .vlan-port:hover { filter:brightness(1.15); transform:scale(1.06)!important; }
      `}</style>

      {/* ── Premium header ── */}
      <div style={{ height:3, background:'linear-gradient(90deg,#4493f8,#3fb950,#d29922,#f85149)' }} />
      <div style={{ padding:'1.75rem 2rem 0' }}>
        <div style={{ display:'flex', alignItems:'flex-start', gap:'1.25rem', marginBottom:'1.25rem' }}>
          <div style={{ width:52, height:52, borderRadius:14, background:'linear-gradient(135deg,#4493f8,#3fb950)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.5rem', flexShrink:0 }}>🔀</div>
          <div style={{ flex:1 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap', marginBottom:4 }}>
              <h2 style={{ margin:0, fontSize:'1.25rem', fontWeight:800 }}>VLAN Configuration Lab</h2>
              <span style={{ fontSize:'0.6rem', fontWeight:800, padding:'3px 8px', borderRadius:20, background:'#4493f820', color:'#4493f8', border:'1px solid #4493f840', textTransform:'uppercase', letterSpacing:'0.08em' }}>Advanced</span>
              <span style={{ fontSize:'0.6rem', fontWeight:800, padding:'3px 8px', borderRadius:20, background:'#d2992220', color:'#d29922', border:'1px solid #d2992240', textTransform:'uppercase', letterSpacing:'0.08em' }}>PRO Lab</span>
            </div>
            <p style={{ margin:0, fontSize:'0.8rem', color:T.textSecondary, lineHeight:1.55 }}>Build a live switch, animate 802.1Q packet tagging, forge frames bit-by-bit, and complete IOS CLI challenges.</p>
          </div>
        </div>
        {/* stats */}
        <div style={{ display:'flex', gap:'1.5rem', borderTop:`1px solid ${T.borderColor}`, paddingTop:'0.9rem', paddingBottom:'0.9rem', flexWrap:'wrap' }}>
          {[
            { label:'VLANs defined',   value:vlans.length,                                          color:'#4493f8' },
            { label:'Ports configured',value:`${ports.filter(p=>p.vlanId!==1||p.mode==='trunk').length}/${ports.length}`, color:'#3fb950' },
            { label:'Trunk ports',     value:ports.filter(p=>p.mode==='trunk').length,               color:'#a855f7' },
            { label:'CLI completed',   value:`${cliDone.size}/${SCENARIOS.length}`,                  color:'#d29922' },
          ].map(s => (
            <div key={s.label}>
              <div style={{ fontSize:'1.05rem', fontWeight:800, color:s.color, fontFamily:'monospace' }}>{s.value}</div>
              <div style={{ fontSize:'0.62rem', color:T.textMuted, textTransform:'uppercase', letterSpacing:'0.05em' }}>{s.label}</div>
            </div>
          ))}
        </div>
        {/* tab bar */}
        <div style={{ display:'flex', gap:6, marginBottom:'0', paddingBottom:'0', overflowX:'auto' }}>
          {([['switch','Switch Lab'],['packet','Packet Sim'],['frame','Frame Forge'],['cli','CLI Challenge'],['roas','RoaS Config'],['topo','Topology']] as [TabId,string][]).map(([id,label]) => (
            <button key={id} type="button" onClick={() => setTab(id)} style={{ padding:'0.55rem 1rem', border:'none', borderBottom: tab===id ? `2px solid #4493f8` : '2px solid transparent', background:'none', color: tab===id ? '#4493f8' : T.textMuted, fontWeight:700, fontSize:'0.78rem', cursor:'pointer', whiteSpace:'nowrap', fontFamily:'inherit', transition:'color 0.15s' }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab content ── */}
      <div style={{ padding:'1.5rem 2rem 2rem' }}>

        {/* ══ TAB 1: Switch Lab ══ */}
        {tab === 'switch' && (
          <div style={{ animation:'vlan-fade 0.2s ease-out' }}>
            <div style={{ display:'grid', gridTemplateColumns:'220px 1fr', gap:'1.25rem', marginBottom:'1.25rem' }}>

              {/* VLAN sidebar */}
              <div style={{ background:T.panelBg, border:`1px solid ${T.borderColor}`, borderRadius:14, padding:'1rem', display:'flex', flexDirection:'column', gap:'0.6rem' }}>
                <div style={{ fontSize:'0.68rem', fontWeight:800, color:T.textMuted, textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:2 }}>VLAN Database</div>
                {vlans.map(v => (
                  <div key={v.id} style={{ display:'flex', alignItems:'center', gap:6, padding:'0.4rem 0.6rem', borderRadius:8, background:`${v.color}14`, border:`1px solid ${v.color}40`, animation:'vlan-fade 0.2s ease-out' }}>
                    <div style={{ width:10, height:10, borderRadius:3, background:v.color, flexShrink:0 }} />
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:'0.72rem', fontWeight:700, color:T.textPrimary }}>{v.name}</div>
                      <div style={{ fontSize:'0.62rem', color:T.textMuted, fontFamily:'monospace' }}>VLAN {v.id}</div>
                    </div>
                    {v.id !== 1 && <button type="button" onClick={() => deleteVlan(v.id)} style={{ background:'none', border:'none', color:T.textMuted, cursor:'pointer', fontSize:'0.8rem', padding:0, lineHeight:1 }}>×</button>}
                  </div>
                ))}
                <form onSubmit={addVlan} style={{ borderTop:`1px solid ${T.borderColor}`, paddingTop:'0.6rem', display:'flex', flexDirection:'column', gap:'0.4rem' }}>
                  <input type="number" min="2" max="4094" placeholder="VLAN ID" value={newVlan.id} onChange={e => setNewVlan(n=>({...n,id:e.target.value}))} style={{ ...inputS, fontSize:'0.73rem' }} />
                  <input type="text" placeholder="Name" value={newVlan.name} onChange={e => setNewVlan(n=>({...n,name:e.target.value}))} style={{ ...inputS, fontSize:'0.73rem' }} />
                  <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                    <input type="color" value={newVlan.color} onChange={e => setNewVlan(n=>({...n,color:e.target.value}))} style={{ width:32, height:28, border:'none', padding:0, cursor:'pointer', background:'transparent', borderRadius:4 }} />
                    <button type="submit" style={{ flex:1, padding:'0.4rem', background:T.accent, color:'#fff', border:'none', borderRadius:7, fontWeight:700, fontSize:'0.72rem', cursor:'pointer', fontFamily:'inherit' }}>+ Add VLAN</button>
                  </div>
                </form>
              </div>

              {/* Chassis + port config */}
              <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
                {/* chassis controls */}
                <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                  <span style={{ fontSize:'0.7rem', color:T.textMuted, fontWeight:700 }}>Chassis:</span>
                  {([8,24,48] as const).map(n => (
                    <button key={n} type="button" onClick={() => resizeChassis(n)} style={pill(chassisN===n,'#4493f8')}>{n}-Port</button>
                  ))}
                  {selPorts.size > 1 && (
                    <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:6 }}>
                      <span style={{ fontSize:'0.72rem', color:T.textMuted }}>{selPorts.size} ports selected</span>
                      <select value={bulkVlan} onChange={e => setBulkVlan(Number(e.target.value))} style={{ ...selS, width:'auto', padding:'0.3rem 0.5rem', fontSize:'0.72rem' }}>
                        {vlans.map(v => <option key={v.id} value={v.id}>VLAN {v.id} — {v.name}</option>)}
                      </select>
                      <button type="button" onClick={() => updatePort({ vlanId:bulkVlan, mode:'access' })} style={{ padding:'0.3rem 0.7rem', background:'#3fb950', color:'#fff', border:'none', borderRadius:7, fontWeight:700, fontSize:'0.72rem', cursor:'pointer' }}>Assign All</button>
                    </div>
                  )}
                </div>

                {/* chassis visual */}
                <div style={{ background:'#0d1117', borderRadius:14, border:`2px solid ${T.borderColor}`, padding:'1.25rem', boxShadow:'inset 0 2px 8px rgba(0,0,0,0.4)' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'0.9rem' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <div style={{ display:'flex', gap:4 }}>{['#ff5f56','#ffbd2e','#27c93f'].map(c=><div key={c} style={{ width:9, height:9, borderRadius:'50%', background:c }} />)}</div>
                      <span style={{ fontSize:'0.62rem', color:'#8b949e', fontFamily:'monospace', letterSpacing:'0.06em' }}>Catalyst-2960 — {chassisN} ports</span>
                    </div>
                    <div style={{ width:8, height:8, borderRadius:'50%', background:'#27c93f', boxShadow:'0 0 6px #27c93f' }} />
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns: chassisN===8 ? 'repeat(8,1fr)' : chassisN===24 ? 'repeat(12,1fr)' : 'repeat(16,1fr)', gap:6 }}>
                    {ports.map(p => {
                      const vl   = vlanOf(p);
                      const isSel = selPorts.has(p.id);
                      const bg   = p.mode === 'trunk'
                        ? `repeating-linear-gradient(45deg,${T.borderColor},${T.borderColor} 3px,#1a1a2e 3px,#1a1a2e 7px)`
                        : (vl?.color ?? '#64748b');
                      return (
                        <div key={p.id} className="vlan-port" onClick={e => clickPort(p.id, e.shiftKey)}
                          title={`Fa0/${p.id} — ${p.mode==='trunk'?'TRUNK':'VLAN '+p.vlanId} ${p.label?'('+p.label+')':''}`}
                          style={{ height:36, background:bg, borderRadius:5, border: isSel ? '2px solid #fff' : '2px solid rgba(255,255,255,0.08)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', position:'relative', transition:'transform 0.1s,filter 0.1s', transform: isSel ? 'scale(1.08)' : 'scale(1)', boxShadow: isSel ? '0 0 0 2px #4493f8' : 'none', animation:'vlan-glow 0s' }}>
                          <div style={{ width:4, height:4, borderRadius:'50%', background: p.mode==='trunk' ? '#a855f7' : '#27c93f', position:'absolute', top:4, left:4 }} />
                          <span style={{ fontSize:'0.62rem', fontWeight:800, color:'#fff', textShadow:'0 1px 3px rgba(0,0,0,0.8)', fontFamily:'monospace' }}>{p.id}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Port config panel */}
                <div style={{ background:T.panelBg, border:`1px solid ${T.borderColor}`, borderRadius:14, padding:'1rem' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:'0.75rem' }}>
                    <div style={{ width:8, height:8, borderRadius:'50%', background: vlanOf(selPort)?.color ?? '#64748b' }} />
                    <span style={{ fontWeight:700, fontSize:'0.85rem' }}>Fa0/{selPort.id}{selPort.label ? ` — ${selPort.label}` : ''}</span>
                    <span style={{ fontSize:'0.68rem', color:T.textMuted, marginLeft:'auto' }}>Shift+click to multi-select</span>
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem', marginBottom:'0.75rem' }}>
                    <div>
                      <label style={{ fontSize:'0.68rem', fontWeight:700, color:T.textMuted, display:'block', marginBottom:4, textTransform:'uppercase' }}>Port Mode</label>
                      <select value={selPort.mode} onChange={e => updatePort({ mode: e.target.value as PortMode })} style={selS}>
                        <option value="access">Access</option>
                        <option value="trunk">Trunk (802.1Q)</option>
                      </select>
                    </div>
                    {selPort.mode === 'access' ? (
                      <div>
                        <label style={{ fontSize:'0.68rem', fontWeight:700, color:T.textMuted, display:'block', marginBottom:4, textTransform:'uppercase' }}>Access VLAN</label>
                        <select value={selPort.vlanId} onChange={e => updatePort({ vlanId:Number(e.target.value) })} style={selS}>
                          {vlans.map(v => <option key={v.id} value={v.id}>VLAN {v.id} — {v.name}</option>)}
                        </select>
                      </div>
                    ) : (
                      <div>
                        <label style={{ fontSize:'0.68rem', fontWeight:700, color:T.textMuted, display:'block', marginBottom:4, textTransform:'uppercase' }}>Native VLAN</label>
                        <select value={selPort.nativeVlan} onChange={e => updatePort({ nativeVlan:Number(e.target.value) })} style={selS}>
                          {vlans.map(v => <option key={v.id} value={v.id}>VLAN {v.id} — {v.name}</option>)}
                        </select>
                      </div>
                    )}
                  </div>
                  {/* IOS snippet */}
                  <div style={{ borderRadius:10, overflow:'hidden', border:`1px solid ${T.borderColor}` }}>
                    <div style={{ background:'#1a1a2e', padding:'0.4rem 0.8rem', display:'flex', alignItems:'center', gap:6 }}>
                      {['#ff5f56','#ffbd2e','#27c93f'].map(c => <div key={c} style={{ width:7, height:7, borderRadius:'50%', background:c }} />)}
                      <span style={{ fontFamily:'monospace', fontSize:'0.6rem', color:'#8b949e', marginLeft:4 }}>ios — running-config</span>
                    </div>
                    <pre style={{ margin:0, background:'#0d1117', padding:'0.75rem 1rem', fontSize:'0.7rem', fontFamily:"'Fira Code',monospace", lineHeight:1.8, color:'#e6edf3', overflowX:'auto' }}>
                      {selPort.mode === 'access'
                        ? `interface FastEthernet0/${selPort.id}\n  switchport mode access\n  switchport access vlan ${selPort.vlanId}\n  exit`
                        : `interface FastEthernet0/${selPort.id}\n  switchport mode trunk\n  switchport trunk native vlan ${selPort.nativeVlan}\n  switchport trunk allowed vlan ${selPort.allowedVlans.join(',')}\n  exit`
                      }
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══ TAB 2: Packet Sim ══ */}
        {tab === 'packet' && (
          <div style={{ animation:'vlan-fade 0.2s ease-out' }}>
            {/* pickers */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr auto 1fr', gap:'0.75rem', alignItems:'end', marginBottom:'1.25rem' }}>
              <div>
                <label style={{ fontSize:'0.68rem', fontWeight:700, color:T.textMuted, display:'block', marginBottom:4, textTransform:'uppercase' }}>Source Port</label>
                <select value={simSrc} onChange={e => { setSimSrc(Number(e.target.value)); resetSim(); }} style={selS}>
                  {ports.map(p => { const v = vlanOf(p); return <option key={p.id} value={p.id}>Fa0/{p.id} — {p.mode==='trunk'?`TRUNK (native ${p.nativeVlan})`:`VLAN ${p.vlanId} (${v?.name??'?'})`}{p.label?' ['+p.label+']':''}</option>; })}
                </select>
              </div>
              <span style={{ fontSize:'1.2rem', paddingBottom:2, color:T.textMuted }}>→</span>
              <div>
                <label style={{ fontSize:'0.68rem', fontWeight:700, color:T.textMuted, display:'block', marginBottom:4, textTransform:'uppercase' }}>Destination Port</label>
                <select value={simDst} onChange={e => { setSimDst(Number(e.target.value)); resetSim(); }} style={selS}>
                  {ports.map(p => { const v = vlanOf(p); return <option key={p.id} value={p.id}>Fa0/{p.id} — {p.mode==='trunk'?`TRUNK (native ${p.nativeVlan})`:`VLAN ${p.vlanId} (${v?.name??'?'})`}{p.label?' ['+p.label+']':''}</option>; })}
                </select>
              </div>
            </div>

            {/* visual flow */}
            <div style={{ background:'#0d1117', borderRadius:14, border:`1px solid ${T.borderColor}`, padding:'1.5rem', marginBottom:'1.25rem' }}>
              {/* pipeline stages */}
              {(() => {
                const src = ports.find(p => p.id === simSrc)!;
                const dst = ports.find(p => p.id === simDst)!;
                const sv  = vlanOf(src);
                const dv  = vlanOf(dst);
                const blocked = simStep >= 3 && simLogs[3]?.blocked;
                const stages = [
                  { label:`Fa0/${src.id}`, sub: src.mode==='access'?`VLAN ${src.vlanId}`:'TRUNK', color: sv?.color??'#64748b', icon:'🖥️' },
                  { label:'Ingress', sub:'Tag added', color:'#4493f8', icon:'🏷️' },
                  { label:'CAM Lookup', sub:'MAC table', color:'#d29922', icon:'🔍' },
                  { label: blocked?'Blocked':'Egress', sub: blocked?'Wrong VLAN':'Tag stripped', color: blocked?'#f85149':'#3fb950', icon: blocked?'🚫':'✅' },
                  { label:`Fa0/${dst.id}`, sub: dst.mode==='access'?`VLAN ${dst.vlanId}`:'TRUNK', color: dv?.color??'#64748b', icon:'🖥️' },
                ];
                return (
                  <div style={{ display:'flex', alignItems:'center', gap:0 }}>
                    {stages.map((s, i) => (
                      <React.Fragment key={i}>
                        <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:4, opacity: simStep < 0 ? 0.35 : simStep >= i ? 1 : 0.3, transition:'opacity 0.4s', animation: simStep === i ? 'pkt-move 0.3s ease-out' : 'none' }}>
                          <div style={{ width:44, height:44, borderRadius:12, background: simStep >= i ? `${s.color}20` : '#1a1a2e', border:`2px solid ${simStep>=i?s.color:T.borderColor}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.1rem', boxShadow: simStep===i ? `0 0 12px ${s.color}60` : 'none', transition:'all 0.3s' }}>{s.icon}</div>
                          <div style={{ fontSize:'0.65rem', fontWeight:700, color: simStep>=i?s.color:T.textMuted, textAlign:'center' }}>{s.label}</div>
                          <div style={{ fontSize:'0.58rem', color:T.textMuted, textAlign:'center' }}>{s.sub}</div>
                        </div>
                        {i < stages.length-1 && (
                          <div style={{ width:32, flexShrink:0, height:2, background: simStep > i ? `linear-gradient(90deg,${stages[i].color},${stages[i+1].color})` : T.borderColor, transition:'background 0.4s', borderRadius:2, margin:'0 2px', position:'relative', top:-10 }}>
                            {simStep===i+1 && <div style={{ width:8, height:8, borderRadius:'50%', background:stages[i+1].color, position:'absolute', top:-3, right:0, boxShadow:`0 0 6px ${stages[i+1].color}`, animation:'pkt-move 0.3s ease-out' }} />}
                          </div>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                );
              })()}
            </div>

            {/* step log */}
            <div style={{ background:T.panelBg, border:`1px solid ${T.borderColor}`, borderRadius:14, padding:'1rem', minHeight:140, marginBottom:'1rem' }}>
              {simStep < 0 && <p style={{ margin:0, color:T.textMuted, fontSize:'0.8rem', textAlign:'center', paddingTop:'1.5rem' }}>Select ports and click Send Frame to watch the packet traverse the switch.</p>}
              {simLogs.slice(0, simStep + 1).map((log, i) => (
                <div key={i} style={{ display:'flex', gap:10, padding:'0.5rem 0', borderBottom: i < simStep ? `1px solid ${T.borderColor}` : 'none', animation:'pkt-move 0.3s ease-out' }}>
                  <div style={{ width:28, height:28, borderRadius:8, background:`${log.color}18`, border:`1px solid ${log.color}40`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.85rem', flexShrink:0 }}>{log.icon}</div>
                  <div>
                    <div style={{ fontWeight:700, fontSize:'0.8rem', color: log.blocked ? '#f85149' : T.textPrimary }}>{log.text}</div>
                    <div style={{ fontSize:'0.72rem', color:T.textSecondary, marginTop:1 }}>{log.sub}</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display:'flex', gap:'0.75rem' }}>
              <button type="button" onClick={runSim} disabled={simRunning} style={{ padding:'0.6rem 1.4rem', background:simRunning?T.panelBg:T.accent, color:simRunning?T.textMuted:'#fff', border:`1px solid ${simRunning?T.borderColor:T.accent}`, borderRadius:9, fontWeight:700, fontSize:'0.82rem', cursor:simRunning?'not-allowed':'pointer', fontFamily:'inherit', transition:'all 0.2s' }}>
                {simRunning ? '⏳ Simulating…' : '▶ Send Frame'}
              </button>
              <button type="button" onClick={resetSim} style={{ padding:'0.6rem 1rem', background:'none', border:`1px solid ${T.borderColor}`, borderRadius:9, color:T.textSecondary, fontWeight:700, fontSize:'0.82rem', cursor:'pointer', fontFamily:'inherit' }}>↺ Reset</button>
            </div>
          </div>
        )}

        {/* ══ TAB 3: Frame Forge ══ */}
        {tab === 'frame' && (
          <div style={{ animation:'vlan-fade 0.2s ease-out' }}>
            <p style={{ margin:'0 0 1rem', fontSize:'0.8rem', color:T.textSecondary }}>Click any field to inspect it. Adjust the 802.1Q tag controls to see the byte values update live.</p>
            {/* frame fields */}
            <div style={{ display:'flex', gap:4, overflowX:'auto', paddingBottom:'0.5rem', marginBottom:'1rem' }}>
              {FRAME_FIELDS.map(f => (
                <div key={f.key} onClick={() => setActiveField(f.key)}
                  style={{ flexShrink:0, padding:'0.9rem 0.5rem', borderRadius:8, border: activeField===f.key ? `2px solid ${f.color}` : `1px solid ${T.borderColor}`, background: activeField===f.key ? `${f.color}16` : T.panelBg, cursor:'pointer', textAlign:'center', minWidth: f.key==='payload'?90:60, transition:'all 0.15s', flex: f.key==='payload'?'2 1 90px':'1 1 60px' }}>
                  <div style={{ fontSize:'0.6rem', fontWeight:800, color: activeField===f.key ? f.color : T.textMuted, textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:4 }}>{f.label}</div>
                  {f.key === 'tag' ? (
                    <div style={{ display:'flex', flexDirection:'column', gap:2 }}>
                      <div style={{ fontSize:'0.55rem', fontFamily:'monospace', color:'#8b949e', background:'#0d1117', padding:'2px 4px', borderRadius:3 }}>81 00</div>
                      <div style={{ fontSize:'0.55rem', fontFamily:'monospace', color:'#7ee787', background:'#0d1117', padding:'2px 4px', borderRadius:3 }}>{toHex(byte2)} {toHex(byte3)}</div>
                    </div>
                  ) : (
                    <div style={{ fontSize:'0.6rem', color: activeField===f.key ? f.color : T.textMuted, fontFamily:'monospace' }}>{f.bytes}</div>
                  )}
                </div>
              ))}
            </div>

            {/* detail panel */}
            {activeField && (() => {
              const f = FRAME_FIELDS.find(x => x.key === activeField)!;
              return (
                <div style={{ background:T.panelBg, border:`1px solid ${f.color}40`, borderLeft:`4px solid ${f.color}`, borderRadius:12, padding:'1rem', marginBottom:'1rem', animation:'vlan-fade 0.15s ease-out' }}>
                  <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:6 }}>
                    <span style={{ fontSize:'0.65rem', fontWeight:800, padding:'2px 8px', borderRadius:20, background:`${f.color}18`, color:f.color, border:`1px solid ${f.color}40`, textTransform:'uppercase' }}>{f.label}</span>
                    <span style={{ fontSize:'0.68rem', fontFamily:'monospace', color:T.textMuted }}>{f.bytes}</span>
                  </div>
                  <p style={{ margin:0, fontSize:'0.78rem', color:T.textSecondary, lineHeight:1.65 }}>{f.desc}</p>
                </div>
              );
            })()}

            {/* 802.1Q tag controls */}
            <div style={{ background:T.panelBg, border:`1px solid ${T.borderColor}`, borderRadius:14, padding:'1.25rem', marginBottom:'1rem' }}>
              <div style={{ fontSize:'0.7rem', fontWeight:800, color:'#a855f7', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:'1rem' }}>802.1Q Tag Builder</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 80px', gap:'1rem', marginBottom:'1.25rem' }}>
                <div>
                  <label style={{ fontSize:'0.68rem', fontWeight:700, color:T.textMuted, display:'block', marginBottom:4, textTransform:'uppercase' }}>VID — VLAN ID (12 bits, 1–4094)</label>
                  <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                    <input type="range" min={1} max={4094} value={frameVid} onChange={e => setFrameVid(Number(e.target.value))} style={{ flex:1, accentColor:'#a855f7' }} />
                    <input type="number" min={1} max={4094} value={frameVid} onChange={e => setFrameVid(Math.min(4094,Math.max(1,Number(e.target.value))))} style={{ ...inputS, width:70, textAlign:'center', fontFamily:'monospace' }} />
                  </div>
                </div>
                <div>
                  <label style={{ fontSize:'0.68rem', fontWeight:700, color:T.textMuted, display:'block', marginBottom:4, textTransform:'uppercase' }}>PCP — Priority Code Point (3 bits)</label>
                  <select value={framePcp} onChange={e => setFramePcp(Number(e.target.value))} style={selS}>
                    {PCP_LABELS.map((l,i) => <option key={i} value={i}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize:'0.68rem', fontWeight:700, color:T.textMuted, display:'block', marginBottom:4, textTransform:'uppercase' }}>DEI (1 bit)</label>
                  <div style={{ display:'flex', gap:8, alignItems:'center', height:34, background:T.insetBg, border:`1px solid ${T.borderColor}`, borderRadius:8, padding:'0 10px', cursor:'pointer' }} onClick={() => setFrameDei(d => d===0?1:0)}>
                    <div style={{ width:16, height:16, borderRadius:4, border:`2px solid ${frameDei?'#d29922':T.borderColor}`, background:frameDei?'#d2992220':'transparent', display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.15s' }}>
                      {frameDei===1 && <span style={{ color:'#d29922', fontSize:'0.7rem', lineHeight:1 }}>✓</span>}
                    </div>
                    <span style={{ fontSize:'0.72rem', color:frameDei?'#d29922':T.textMuted, fontWeight:700 }}>Drop Eligible</span>
                  </div>
                </div>
              </div>

              {/* live byte display */}
              <div style={{ borderRadius:10, overflow:'hidden', border:`1px solid ${T.borderColor}` }}>
                <div style={{ background:'#1a1a2e', padding:'0.4rem 0.8rem', display:'flex', alignItems:'center', gap:6 }}>
                  {['#ff5f56','#ffbd2e','#27c93f'].map(c=><div key={c} style={{ width:7,height:7,borderRadius:'50%',background:c }} />)}
                  <span style={{ fontFamily:'monospace', fontSize:'0.6rem', color:'#8b949e', marginLeft:4 }}>802.1Q tag — 4 bytes</span>
                </div>
                <div style={{ background:'#0d1117', padding:'1rem', display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:8 }}>
                  {[
                    { label:'TPID[15:8]', hex:'81', bin:'10000001', color:'#8b949e', note:'Fixed 0x81' },
                    { label:'TPID[7:0]',  hex:'00', bin:'00000000', color:'#8b949e', note:'Fixed 0x00' },
                    { label:'PCP+DEI+VID[11:8]', hex:toHex(byte2), bin:toBin(byte2,8), color:'#7ee787',
                      note:`PCP=${toBin(framePcp,3)} DEI=${frameDei} VID[11:8]=${toBin((frameVid>>8)&0xF,4)}` },
                    { label:'VID[7:0]',   hex:toHex(byte3), bin:toBin(byte3,8),  color:'#ffa657', note:`VID[7:0]=${toBin(byte3,8)}` },
                  ].map(b => (
                    <div key={b.label} style={{ textAlign:'center' }}>
                      <div style={{ fontSize:'0.6rem', color:'#8b949e', marginBottom:4 }}>{b.label}</div>
                      <div style={{ fontSize:'1.2rem', fontFamily:'monospace', fontWeight:700, color:b.color, letterSpacing:'0.05em' }}>0x{b.hex}</div>
                      <div style={{ fontSize:'0.58rem', fontFamily:'monospace', color:'#8b949e', marginTop:2, letterSpacing:'0.03em' }}>{b.bin}</div>
                      <div style={{ fontSize:'0.55rem', color:'#8b949e', marginTop:4, lineHeight:1.3 }}>{b.note}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══ TAB 4: CLI Challenge ══ */}
        {tab === 'cli' && (
          <div style={{ animation:'vlan-fade 0.2s ease-out' }}>
            {/* scenario selector */}
            <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:'1rem' }}>
              {SCENARIOS.map((s, i) => (
                <button key={i} type="button" onClick={() => selectScenario(i)}
                  style={{ ...pill(cliIdx===i,'#4493f8'), position:'relative', paddingRight: cliDone.has(i)?22:14 }}>
                  {i+1}. {s.title}
                  {cliDone.has(i) && <span style={{ position:'absolute', right:6, top:'50%', transform:'translateY(-50%)', color:'#3fb950', fontSize:'0.75rem' }}>✓</span>}
                </button>
              ))}
            </div>

            {/* scenario card */}
            <div style={{ background:T.panelBg, border:`1px solid ${T.borderColor}`, borderRadius:12, padding:'1rem', marginBottom:'1rem' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:12 }}>
                <div>
                  <div style={{ fontWeight:700, fontSize:'0.88rem', marginBottom:4, color:T.textPrimary }}>{SCENARIOS[cliIdx].title}</div>
                  <p style={{ margin:0, fontSize:'0.78rem', color:T.textSecondary, lineHeight:1.6 }}>{SCENARIOS[cliIdx].desc}</p>
                </div>
                <div style={{ display:'flex', gap:4, flexShrink:0 }}>
                  {SCENARIOS[cliIdx].cmds.map((_,i) => (
                    <div key={i} style={{ width:8, height:8, borderRadius:'50%', background: i < cliCmdIdx ? '#3fb950' : i === cliCmdIdx ? '#4493f8' : T.borderColor, transition:'background 0.3s' }} />
                  ))}
                </div>
              </div>
              <button type="button" onClick={() => setShowHints(h=>!h)} style={{ marginTop:'0.75rem', background:'none', border:`1px solid ${T.borderColor}`, borderRadius:6, padding:'3px 10px', cursor:'pointer', color:T.textMuted, fontSize:'0.68rem', fontFamily:'inherit', fontWeight:700 }}>
                {showHints ? '▲ Hide hints' : '▼ Show hints'}
              </button>
              {showHints && (
                <div style={{ marginTop:'0.6rem', display:'flex', flexDirection:'column', gap:4 }}>
                  {SCENARIOS[cliIdx].hints.map((h,i) => (
                    <div key={i} style={{ fontFamily:'monospace', fontSize:'0.72rem', color:'#d29922', background:'#d2992212', border:'1px solid #d2992230', borderRadius:6, padding:'4px 10px' }}>💡 {h}</div>
                  ))}
                </div>
              )}
            </div>

            {/* terminal */}
            <div style={{ borderRadius:14, overflow:'hidden', border:`1px solid ${T.borderColor}` }}>
              <div style={{ background:'#1a1a2e', padding:'0.5rem 1rem', display:'flex', alignItems:'center', gap:8 }}>
                {['#ff5f56','#ffbd2e','#27c93f'].map(c=><div key={c} style={{ width:9,height:9,borderRadius:'50%',background:c }} />)}
                <span style={{ fontFamily:'monospace', fontSize:'0.62rem', color:'#8b949e', marginLeft:4 }}>IOS — CLI Challenge</span>
                <span style={{ marginLeft:'auto', fontSize:'0.62rem', color:'#8b949e' }}>{SCENARIOS[cliIdx].cmds.length - cliCmdIdx} command{SCENARIOS[cliIdx].cmds.length - cliCmdIdx !== 1 ? 's' : ''} remaining</span>
              </div>
              <div style={{ background:'#0d1117', padding:'0.75rem 1rem', minHeight:160, maxHeight:260, overflowY:'auto', fontFamily:"'Fira Code',monospace", fontSize:'0.75rem', lineHeight:1.85 }}>
                {cliLog.map((l, i) => (
                  <div key={i} style={{ color: l.kind==='ok'?'#3fb950':l.kind==='err'?'#f85149':l.kind==='info'?'#d29922':'#e6edf3' }}>{l.text}</div>
                ))}
                <div ref={cliEnd} />
              </div>
              <form onSubmit={submitCli} style={{ background:'#0d1117', borderTop:`1px solid ${T.borderColor}`, padding:'0.6rem 1rem', display:'flex', gap:8 }}>
                <span style={{ fontFamily:'monospace', fontSize:'0.75rem', color:'#7ee787', flexShrink:0 }}>Switch(config)#</span>
                <input autoFocus type="text" value={cliInput} onChange={e => setCliInput(e.target.value)} placeholder="type command…" style={{ flex:1, background:'none', border:'none', outline:'none', fontFamily:"'Fira Code',monospace", fontSize:'0.75rem', color:'#e6edf3', caretColor:'#7ee787' }} />
                <button type="submit" style={{ background:'#4493f820', border:'1px solid #4493f840', borderRadius:6, color:'#4493f8', fontFamily:'inherit', fontWeight:700, fontSize:'0.68rem', padding:'3px 10px', cursor:'pointer' }}>Enter</button>
              </form>
            </div>
          </div>
        )}

        {/* ══ TAB 5: RoaS Config ══ */}
        {tab === 'roas' && (
          <div style={{ animation:'vlan-fade 0.2s ease-out' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'0.9rem' }}>
              <div>
                <p style={{ margin:0, fontSize:'0.8rem', color:T.textSecondary }}>Generated from your active VLAN database and trunk configuration. Paste into global config mode on the upstream router.</p>
              </div>
              <button type="button" onClick={() => navigator.clipboard?.writeText(roasConfig)} style={{ padding:'0.45rem 1rem', background:'none', border:`1px solid ${T.borderColor}`, borderRadius:8, color:T.textSecondary, fontSize:'0.75rem', fontWeight:700, cursor:'pointer', fontFamily:'inherit', flexShrink:0 }}>📋 Copy</button>
            </div>
            <div style={{ borderRadius:14, overflow:'hidden', border:`1px solid ${T.borderColor}` }}>
              <div style={{ background:'#1a1a2e', padding:'0.45rem 1rem', display:'flex', alignItems:'center', gap:6 }}>
                {['#ff5f56','#ffbd2e','#27c93f'].map(c=><div key={c} style={{ width:8,height:8,borderRadius:'50%',background:c }} />)}
                <span style={{ fontFamily:'monospace', fontSize:'0.62rem', color:'#8b949e', marginLeft:4 }}>ios — router-on-a-stick config</span>
              </div>
              <pre style={{ margin:0, background:'#0d1117', padding:'1.25rem 1.5rem', fontSize:'0.73rem', fontFamily:"'Fira Code','Cascadia Code',monospace", lineHeight:1.85, color:'#e6edf3', overflowX:'auto', whiteSpace:'pre' }}>
                {roasConfig.split('\n').map((line, i) => {
                  const isComment = line.startsWith('!');
                  const isVlan    = /^(vlan|interface|name)\b/.test(line.trim());
                  return <span key={i} style={{ display:'block', color: isComment?'#8b949e':isVlan?'#7ee787':'#e6edf3' }}>{line}</span>;
                })}
              </pre>
            </div>
          </div>
        )}

        {/* ══ TAB 6: Topology ══ */}
        {tab === 'topo' && (
          <div style={{ animation:'vlan-fade 0.2s ease-out' }}>
            <p style={{ margin:'0 0 1rem', fontSize:'0.8rem', color:T.textSecondary, lineHeight:1.55 }}>
              Live broadcast domain map — updates as you configure ports in the Switch Lab. Dashed zones are Layer 2 segments; hosts in different zones require a Layer 3 router to communicate.
            </p>
            <TopoSvg vlans={vlans} ports={ports} isDarkMode={isDarkMode} T={T} />
          </div>
        )}

        <LabEduPanel cards={VLAN_EDU} isDarkMode={isDarkMode} />
      </div>
    </div>
  );
};
