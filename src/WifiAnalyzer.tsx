import React, { useState } from 'react';
import { getLabTheme } from './labTheme';
import { LabEduPanel, type EduCard } from './LabEduPanel';

type Band   = '2.4G' | '5G' | '6G';
type Domain = 'UK' | 'US';
type OvType = 'none' | 'cci' | 'aci';
type IntKey = 'Microwave' | 'Bluetooth' | 'DECT' | 'Radar';

interface AP {
  id: string;
  name: string;
  channel: number;
  width: number;
  signal: number;
  band: Band;
  colorIdx: number;
}

interface IntSource {
  key: IntKey;
  label: string;
  centerMhz: number;
  widthMhz: number;
  bands: Band[];
}

// ── Edu cards ─────────────────────────────────────────────────────────────────
const WIFI_EDU: EduCard[] = [
  {
    type: 'exam',
    title: '2.4 GHz: Only Channels 1, 6 and 11 Are Non-Overlapping',
    body: '2.4 GHz channels are 22 MHz wide but spaced only 5 MHz apart, so any two channels within 4 of each other overlap. Only 1, 6, and 11 have zero spectral overlap. UK (Ofcom) adds Ch 13; US (FCC) caps at 11. Exam: which channels are non-overlapping in the 2.4 GHz band? Answer: 1, 6, 11 (or 1, 5, 9, 13 in Europe with 20 MHz channels).',
  },
  {
    type: 'exam',
    title: 'DFS — Dynamic Frequency Selection on 5 GHz Channels 52–144',
    body: 'Channels 52–64 (UNII-2A) and 100–144 (UNII-2C) share spectrum with meteorological and aviation radar. The AP must monitor for radar pulses and vacate the channel within 10 seconds on detection — causing client disconnection. APs must also "listen" for 60 seconds before first using a DFS channel (CAC period). Avoid DFS for latency-sensitive deployments.',
  },
  {
    type: 'gotcha',
    title: 'Channel Bonding Trades Non-Overlapping Slots for Speed',
    body: '80 MHz bonding in 5 GHz consumes 4 x 20 MHz channels. With 25 non-overlapping 20 MHz channels available, 80 MHz bonding leaves only 6 non-overlapping 80 MHz channels. Bonding too aggressively in a dense environment guarantees ACI between neighbouring APs. In high-density deployments (offices, stadiums), 20 MHz or 40 MHz is often preferred to maximise spatial reuse.',
  },
  {
    type: 'gotcha',
    title: 'ACI Is More Damaging Than CCI — Do Not Mix Channels 1 and 4',
    body: 'Co-channel interference (CCI) means two APs share airtime via CSMA/CA — throughput is split but frames are not corrupted. Adjacent-channel interference (ACI, e.g. Ch 1 and Ch 4) produces physical RF noise that neither radio can decode. Stations cannot negotiate airtime, so frames are lost and retransmission rates spike. ACI is a Layer 1 problem; CCI is a capacity problem. Always use non-overlapping channels.',
  },
  {
    type: 'realworld',
    title: 'Enterprise WLAN Design: Co-Channel Reuse Distance',
    body: 'A three-channel plan (1/6/11) works only if adjacent APs on the same channel are physically separated enough that their signals are below the noise floor of each other (typically -82 dBm). In practice this means APs on the same channel need ~15–20 m separation indoors. High-density venues (conference rooms, lecture halls) often use a microcell design with reduced TX power and all APs on non-overlapping channels.',
  },
  {
    type: 'realworld',
    title: '6 GHz (WiFi 6E / 7): 59 Non-Overlapping 20 MHz Channels',
    body: 'The 6 GHz band (5925–7125 MHz) adds 1200 MHz of clean spectrum. 59 non-overlapping 20 MHz channels — or 7 non-overlapping 160 MHz channels — are available with zero legacy device interference. Client devices must support WiFi 6E or WiFi 7. Discovery uses Preferred Scanning Channels (PSC: 5, 21, 37…) to avoid scanning all 59 channels and wasting battery.',
  },
];

// ── Constants ─────────────────────────────────────────────────────────────────
const COLORS = ['#4493f8','#22c55e','#f59e0b','#a855f7','#f85149','#06b6d4','#ec4899','#84cc16','#fb923c'];

const BAND_BOUNDS: Record<Band, { min: number; max: number; label: string }> = {
  '2.4G': { min: 2400, max: 2500, label: '2.4 GHz  (2400–2500 MHz)' },
  '5G':   { min: 5150, max: 5875, label: '5 GHz  (5150–5875 MHz)' },
  '6G':   { min: 5925, max: 7125, label: '6 GHz  (5925–7125 MHz)' },
};

const NON_OVERLAP: Record<Band, number[]> = {
  '2.4G': [1, 6, 11],
  '5G':   [36, 40, 44, 48, 149, 153, 157, 161],
  '6G':   [5, 21, 37, 53, 69, 85, 101, 117, 133, 149, 165, 181, 197, 213],
};

const INT_DEFS: Record<IntKey, IntSource> = {
  Microwave: { key:'Microwave', label:'Microwave oven',      centerMhz:2450, widthMhz:40,  bands:['2.4G'] },
  Bluetooth: { key:'Bluetooth', label:'Bluetooth (AFH)',     centerMhz:2425, widthMhz:80,  bands:['2.4G'] },
  DECT:      { key:'DECT',      label:'DECT phone',          centerMhz:2462, widthMhz:10,  bands:['2.4G'] },
  Radar:     { key:'Radar',     label:'Weather radar (DFS)', centerMhz:5600, widthMhz:100, bands:['5G']   },
};

// ── Frequency helpers ─────────────────────────────────────────────────────────
function centerMhz(ap: AP): number {
  if (ap.band === '2.4G') return 2407 + ap.channel * 5;
  if (ap.band === '5G')   return 5000 + ap.channel * 5;
  return 5950 + ap.channel * 5;
}

function getChannels(band: Band, domain: Domain): number[] {
  if (band === '2.4G') return domain === 'US'
    ? [1,2,3,4,5,6,7,8,9,10,11]
    : [1,2,3,4,5,6,7,8,9,10,11,12,13];
  if (band === '5G') {
    const base = [36,40,44,48,52,56,60,64,100,104,108,112,116,120,124,128,132,136,140,144];
    return domain === 'US' ? [...base,149,153,157,161,165] : base;
  }
  return [5,21,37,53,69,85,101,117,133,149,165,181,197,213];
}

function getWidths(band: Band): number[] {
  if (band === '2.4G') return [20, 40];
  if (band === '5G')   return [20, 40, 80, 160];
  return [20, 40, 80, 160, 320];
}

function checkOverlap(a: AP, b: AP): OvType {
  if (a.band !== b.band) return 'none';
  const dist = Math.abs(centerMhz(a) - centerMhz(b));
  if (dist >= (a.width + b.width) / 2) return 'none';
  return dist < 3 ? 'cci' : 'aci';
}

function worstOverlap(ap: AP, peers: AP[]): OvType {
  return peers.filter(b => b.id !== ap.id).reduce<OvType>((w, b) => {
    const ov = checkOverlap(ap, b);
    return ov === 'cci' ? 'cci' : (ov === 'aci' && w === 'none' ? 'aci' : w);
  }, 'none');
}

function bestChannel(aps: AP[], band: Band, domain: Domain): number {
  const candidates = getChannels(band, domain).filter(ch => NON_OVERLAP[band].includes(ch));
  const scored = candidates.map(ch => {
    const probe: AP = { id:'__p', name:'', channel:ch, width:getWidths(band)[0], signal:-50, band, colorIdx:0 };
    return { ch, n: aps.filter(a => a.band === band && checkOverlap(probe, a) !== 'none').length };
  });
  scored.sort((a, b) => a.n - b.n);
  return scored[0]?.ch ?? candidates[0] ?? 1;
}

// ── Spectrum SVG ──────────────────────────────────────────────────────────────
const SVG_W = 900, BASE_Y = 220;

function bellPath(cxPx: number, halfWPx: number, h: number): string {
  const x0 = cxPx - halfWPx, x1 = cxPx + halfWPx, cp = halfWPx * 0.45;
  return `M ${x0} ${BASE_Y} C ${x0+cp} ${BASE_Y} ${cxPx-cp*0.55} ${BASE_Y-h} ${cxPx} ${BASE_Y-h} C ${cxPx+cp*0.55} ${BASE_Y-h} ${x1-cp} ${BASE_Y} ${x1} ${BASE_Y} Z`;
}

function SpectrumSvg({ aps, intSrcs, band, selectedId, onSelect, isDark }: {
  aps: AP[]; intSrcs: Set<IntKey>; band: Band;
  selectedId: string | null; onSelect: (id: string) => void; isDark: boolean;
}) {
  const bounds  = BAND_BOUNDS[band];
  const span    = bounds.max - bounds.min;
  const toX     = (mhz: number) => ((mhz - bounds.min) / span) * SVG_W;
  const toHW    = (w: number)   => (w / span) * SVG_W / 2;
  const toH     = (sig: number) => Math.max(16, Math.min(185, (sig + 90) * 3.1));

  const mc      = isDark ? '#6e7681' : '#8c959f';
  const gridC   = isDark ? '#21262d' : '#e5e7eb';
  const baseC   = isDark ? '#30363d' : '#d0d7de';
  const bgC     = isDark ? '#010409' : '#f0f6ff';
  const tc      = isDark ? '#e6edf3' : '#1f2328';

  const visAps  = aps.filter(a => a.band === band);
  const noCh    = NON_OVERLAP[band];
  const tickStep = band === '6G' ? 100 : 20;
  const ticks: number[] = [];
  for (let f = Math.ceil(bounds.min / tickStep) * tickStep; f <= bounds.max; f += tickStep) ticks.push(f);

  const activeInt = Array.from(intSrcs).map(k => INT_DEFS[k]).filter(s => s.bands.includes(band));

  return (
    <svg viewBox={`0 0 ${SVG_W} 260`} style={{ width:'100%', height:'auto', display:'block' }}>
      <style>{`@keyframes wfa-int { 0%,100%{opacity:0.18} 50%{opacity:0.48} }`}</style>
      <rect width={SVG_W} height={260} fill={bgC} />

      {ticks.map(t => (
        <line key={t} x1={toX(t)} y1={0} x2={toX(t)} y2={BASE_Y} stroke={gridC} strokeWidth={1} />
      ))}

      {/* Non-overlap shading + labels */}
      {noCh.map(ch => {
        const probe: AP = { id:'', name:'', channel:ch, width:20, signal:-50, band, colorIdx:0 };
        const x = toX(centerMhz(probe));
        return (
          <g key={ch}>
            <line x1={x} y1={0} x2={x} y2={BASE_Y} stroke="#22c55e" strokeWidth={14} strokeOpacity={0.07} />
            <text x={x} y={BASE_Y+13} textAnchor="middle" fontSize={8} fill="#22c55e" fontWeight={800} fontFamily="monospace">
              {band === '2.4G' ? `Ch${ch}` : ch}
            </text>
          </g>
        );
      })}

      {/* Interference */}
      {activeInt.map(src => {
        const cx = toX(src.centerMhz), hw = (src.widthMhz / span) * SVG_W / 2;
        return (
          <g key={src.key}>
            <rect x={cx-hw} y={0} width={hw*2} height={BASE_Y}
              fill="rgba(248,81,73,0.1)" style={{ animation:'wfa-int 1.6s ease-in-out infinite' }} />
            <rect x={cx-hw} y={0} width={hw*2} height={BASE_Y}
              fill="none" stroke="#f85149" strokeWidth={1.2} strokeDasharray="5 3" />
            <rect x={cx-44} y={5} width={88} height={15} rx={3}
              fill={isDark ? '#161b22' : '#fff'} fillOpacity={0.9} />
            <text x={cx} y={15.5} textAnchor="middle" fontSize={8} fill="#f85149" fontWeight={800} fontFamily="monospace">{src.label}</text>
          </g>
        );
      })}

      {/* Bell curves */}
      {visAps.map(ap => {
        const cx    = toX(centerMhz(ap));
        const hw    = toHW(ap.width);
        const h     = toH(ap.signal);
        const color = COLORS[ap.colorIdx % COLORS.length];
        const isSel = ap.id === selectedId;
        const ov    = worstOverlap(ap, visAps);
        const strokeC = ov === 'cci' ? '#f85149' : ov === 'aci' ? '#d29922' : color;

        return (
          <g key={ap.id} onClick={() => onSelect(ap.id)} style={{ cursor:'pointer' }}>
            <path d={bellPath(cx, hw, h)} fill={color} fillOpacity={isSel ? 0.38 : 0.17}
              stroke={strokeC} strokeWidth={isSel ? 2.5 : 1.5} />
            <text x={cx} y={BASE_Y-h-9} textAnchor="middle" fontSize={8.5}
              fontWeight={isSel ? 800 : 600} fill={isSel ? color : tc} fontFamily="system-ui">
              {ap.name.length > 13 ? ap.name.slice(0,12)+'…' : ap.name}
            </text>
            {hw > 28 && (
              <text x={cx} y={BASE_Y-h/2+4} textAnchor="middle" fontSize={7}
                fill={color} fillOpacity={0.85} fontFamily="monospace">{ap.width} MHz</text>
            )}
            {ov !== 'none' && (
              <g>
                <rect x={cx-18} y={BASE_Y-h-28} width={36} height={14} rx={3}
                  fill={ov === 'cci' ? '#f85149' : '#d29922'} />
                <text x={cx} y={BASE_Y-h-18} textAnchor="middle" fontSize={7.5}
                  fontWeight={800} fill={ov === 'cci' ? '#fff' : '#000'} fontFamily="monospace">
                  {ov.toUpperCase()}
                </text>
              </g>
            )}
          </g>
        );
      })}

      <line x1={0} y1={BASE_Y} x2={SVG_W} y2={BASE_Y} stroke={baseC} strokeWidth={1.5} />

      {ticks.map(t => (
        <g key={`lbl-${t}`}>
          <line x1={toX(t)} y1={BASE_Y} x2={toX(t)} y2={BASE_Y+5} stroke={baseC} strokeWidth={1} />
          <text x={toX(t)} y={BASE_Y+16} textAnchor="middle" fontSize={7.5} fill={mc} fontFamily="monospace">{t}</text>
        </g>
      ))}
      <text x={SVG_W} y={257} textAnchor="end" fontSize={7} fill={mc} fontFamily="monospace">MHz</text>
    </svg>
  );
}

// ── Default APs ───────────────────────────────────────────────────────────────
const DEFAULT_APS: AP[] = [
  { id:'ap-1', name:'Office_Main',    channel:1,  width:20, signal:-48, band:'2.4G', colorIdx:0 },
  { id:'ap-2', name:'Rogue_Ch4',      channel:4,  width:20, signal:-62, band:'2.4G', colorIdx:1 },
  { id:'ap-3', name:'Neighbour_Ch6',  channel:6,  width:20, signal:-70, band:'2.4G', colorIdx:2 },
  { id:'ap-4', name:'Corp_5G_80MHz',  channel:36, width:80, signal:-44, band:'5G',   colorIdx:3 },
  { id:'ap-5', name:'Guest_5G_20MHz', channel:44, width:20, signal:-58, band:'5G',   colorIdx:4 },
  { id:'ap-6', name:'Backhaul_6G',    channel:5,  width:80, signal:-38, band:'6G',   colorIdx:5 },
];

// ── Main component ────────────────────────────────────────────────────────────
export const WifiAnalyzer: React.FC<{ isDarkMode?: boolean }> = ({ isDarkMode = true }) => {
  const T      = getLabTheme(isDarkMode);
  const isDark = isDarkMode;

  const [band,       setBand]       = useState<Band>('2.4G');
  const [domain,     setDomain]     = useState<Domain>('UK');
  const [aps,        setAps]        = useState<AP[]>(DEFAULT_APS);
  const [intSrcs,    setIntSrcs]    = useState<Set<IntKey>>(new Set());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [newName,    setNewName]    = useState('');
  const [newCh,      setNewCh]      = useState(1);
  const [newW,       setNewW]       = useState(20);
  const [newSig,     setNewSig]     = useState(-55);
  const [nextColor,  setNextColor]  = useState(6);

  const channels   = getChannels(band, domain);
  const widths     = getWidths(band);
  const bounds     = BAND_BOUNDS[band];
  const visAps     = aps.filter(a => a.band === band);
  const selAp      = aps.find(a => a.id === selectedId) ?? null;
  const suggestion = bestChannel(aps, band, domain);

  const bandIntKeys: Record<Band, IntKey[]> = {
    '2.4G': ['Microwave', 'Bluetooth', 'DECT'],
    '5G':   ['Radar'],
    '6G':   [],
  };

  const handleBandSwitch = (b: Band) => {
    setBand(b); setNewCh(getChannels(b, domain)[0]); setNewW(getWidths(b)[0]); setSelectedId(null);
  };

  const handleDomainSwitch = (d: Domain) => {
    setDomain(d);
    if (!getChannels(band, d).includes(newCh)) setNewCh(getChannels(band, d)[0]);
  };

  const handleAdd = (e: React.SyntheticEvent) => {
    e.preventDefault();
    const id   = `ap-${Date.now()}`;
    const name = newName.trim() || `AP_Ch${newCh}_${newW}M`;
    setAps(prev => [...prev, { id, name, channel:newCh, width:newW, signal:newSig, band, colorIdx: nextColor % COLORS.length }]);
    setNextColor(c => c + 1);
    setNewName('');
    setSelectedId(id);
  };

  const handleDelete = (id: string) => {
    setAps(prev => prev.filter(a => a.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const toggleInt = (key: IntKey) => {
    setIntSrcs(prev => { const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n; });
  };

  const iStyle: React.CSSProperties = {
    width:'100%', boxSizing:'border-box', padding:'6px 8px', borderRadius:6,
    border:`1px solid ${T.borderColor}`, background:T.insetBg, color:T.textPrimary,
    fontSize:'0.78rem', fontFamily:'inherit', outline:'none',
  };

  const btnBase: React.CSSProperties = {
    cursor:'pointer', border:'none', fontFamily:'inherit', transition:'all 0.15s',
  };

  return (
    <div style={{ maxWidth:920, margin:'0 auto', fontFamily:'system-ui,-apple-system,"Segoe UI",sans-serif', color:T.textPrimary }}>
      <style>{`
        @keyframes wfa-fade { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:none} }
        @keyframes wfa-int  { 0%,100%{opacity:0.18} 50%{opacity:0.48} }
      `}</style>

      {/* ── Header ── */}
      <div style={{ background:`linear-gradient(135deg, ${T.cardBg} 0%, ${T.panelBg} 100%)`, borderBottom:`1px solid ${T.borderColor}`, padding:'1.5rem 2rem', marginBottom:'1.5rem', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:'linear-gradient(90deg,#4493f8,#22c55e,#a855f7)' }} />
        <div style={{ display:'flex', alignItems:'flex-start', gap:'1.25rem', flexWrap:'wrap' }}>
          <div style={{ width:52, height:52, borderRadius:14, background:'#4493f815', border:'1px solid #4493f830', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.5rem', flexShrink:0 }}>📶</div>
          <div style={{ flex:1, minWidth:200 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap', marginBottom:6 }}>
              <h2 style={{ margin:0, fontSize:'1.35rem', fontWeight:800, letterSpacing:'-0.02em' }}>Wi-Fi Spectrum Analyser</h2>
              <span style={{ fontSize:'0.6rem', fontWeight:800, padding:'2px 8px', borderRadius:20, background:`${T.accent}20`, color:T.accent, border:`1px solid ${T.accent}40`, textTransform:'uppercase', letterSpacing:'0.07em' }}>Intermediate</span>
              <span style={{ fontSize:'0.6rem', fontWeight:700, padding:'2px 8px', borderRadius:20, background:'#a855f715', color:'#a855f7', border:'1px solid #a855f730', textTransform:'uppercase', letterSpacing:'0.07em' }}>PRO Lab</span>
            </div>
            <p style={{ margin:0, color:T.textSecondary, fontSize:'0.84rem', lineHeight:1.5 }}>
              Plot APs on the real frequency spectrum. Visualise channel overlap, bonding width, CCI vs ACI, and interference sources across 2.4 / 5 / 6 GHz.
            </p>
          </div>
          <div style={{ display:'flex', gap:'1.25rem', flexShrink:0 }}>
            {[{label:'Bands', val:'3'},{label:'AP Slots', val:'∞'},{label:'Edu Cards', val:String(WIFI_EDU.length)}].map(s => (
              <div key={s.label} style={{ textAlign:'center' }}>
                <div style={{ fontSize:'1.1rem', fontWeight:800, color:'#4493f8' }}>{s.val}</div>
                <div style={{ fontSize:'0.6rem', color:T.textMuted, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ padding:'0 2rem 2rem' }}>

        {/* ── Controls ── */}
        <div style={{ display:'flex', gap:'0.5rem', flexWrap:'wrap', alignItems:'center', background:T.cardBg, border:`1px solid ${T.borderColor}`, borderRadius:12, padding:'0.75rem 1rem', marginBottom:'1.25rem' }}>
          <span style={{ fontSize:'0.7rem', fontWeight:700, color:T.textMuted, textTransform:'uppercase', letterSpacing:'0.07em' }}>Band:</span>
          {(['2.4G','5G','6G'] as Band[]).map(b => (
            <button key={b} onClick={() => handleBandSwitch(b)}
              style={{ ...btnBase, padding:'0.3rem 0.9rem', borderRadius:8, border:`1px solid ${band===b ? T.accent : T.borderColor}`, background: band===b ? `${T.accent}15` : T.panelBg, color: band===b ? T.accent : T.textMuted, fontWeight:700, fontSize:'0.75rem' }}>
              {b}
            </button>
          ))}
          <span style={{ fontSize:'0.7rem', fontWeight:700, color:T.textMuted, textTransform:'uppercase', letterSpacing:'0.07em', marginLeft:8 }}>Region:</span>
          {(['UK','US'] as Domain[]).map(d => (
            <button key={d} onClick={() => handleDomainSwitch(d)}
              style={{ ...btnBase, padding:'0.3rem 0.75rem', borderRadius:8, border:`1px solid ${domain===d ? '#a855f7' : T.borderColor}`, background: domain===d ? '#a855f715' : T.panelBg, color: domain===d ? '#a855f7' : T.textMuted, fontWeight:700, fontSize:'0.75rem' }}>
              {d}
            </button>
          ))}
          <div style={{ marginLeft:'auto', fontSize:'0.68rem', color:T.textMuted, display:'flex', gap:'0.75rem' }}>
            <span><span style={{ color:'#22c55e', fontWeight:800 }}>▌</span> Non-overlapping</span>
            <span><span style={{ color:'#f85149', fontWeight:800 }}>CCI</span> Co-channel</span>
            <span><span style={{ color:'#d29922', fontWeight:800 }}>ACI</span> Adjacent</span>
          </div>
        </div>

        {/* ── Spectrum chart ── */}
        <div style={{ background:T.cardBg, border:`1px solid ${T.borderColor}`, borderRadius:14, overflow:'hidden', marginBottom:'1.25rem' }}>
          <div style={{ padding:'0.6rem 1rem', borderBottom:`1px solid ${T.borderColor}`, background:T.panelBg, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span style={{ fontSize:'0.72rem', fontWeight:700, color:T.accent, fontFamily:'monospace' }}>{bounds.label}</span>
            <span style={{ fontSize:'0.68rem', color:T.textMuted }}>Click a curve to inspect</span>
          </div>
          <SpectrumSvg aps={aps} intSrcs={intSrcs} band={band}
            selectedId={selectedId}
            onSelect={id => setSelectedId(p => p === id ? null : id)}
            isDark={isDark} />
        </div>

        {/* ── Selected AP detail (terminal style) ── */}
        {selAp && selAp.band === band && (() => {
          const color = COLORS[selAp.colorIdx % COLORS.length];
          const ov    = worstOverlap(selAp, visAps);
          const cf    = centerMhz(selAp);
          return (
            <div style={{ borderRadius:12, overflow:'hidden', border:`1px solid ${color}50`, marginBottom:'1.25rem', animation:'wfa-fade 0.2s ease-out' }}>
              <div style={{ background:'#1a1a2e', padding:'0.55rem 1rem', display:'flex', alignItems:'center', gap:8 }}>
                <div style={{ display:'flex', gap:5 }}>
                  {['#ff5f56','#ffbd2e','#27c93f'].map(c => <div key={c} style={{ width:9,height:9,borderRadius:'50%',background:c }} />)}
                </div>
                <div style={{ width:10,height:10,borderRadius:'50%',background:color,flexShrink:0 }} />
                <span style={{ fontFamily:'monospace', fontSize:'0.68rem', color:'#e6edf3', fontWeight:700, flex:1 }}>{selAp.name}</span>
                {ov !== 'none' && (
                  <span style={{ fontSize:'0.6rem', fontWeight:800, padding:'2px 7px', borderRadius:20, background: ov==='cci' ? '#f8514925' : '#d2992225', color: ov==='cci' ? '#f85149' : '#d29922', border:`1px solid ${ov==='cci' ? '#f8514940' : '#d2992240'}`, textTransform:'uppercase' }}>
                    {ov} interference
                  </span>
                )}
              </div>
              <div style={{ background:'#0d1117', padding:'0.9rem 1.25rem' }}>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:'0 1.25rem' }}>
                  {[
                    ['Center frequency',  `${cf} MHz`],
                    ['Lower edge',        `${cf - selAp.width/2} MHz`],
                    ['Upper edge',        `${cf + selAp.width/2} MHz`],
                    ['Signal strength',   `${selAp.signal} dBm`],
                    ['Channel width',     `${selAp.width} MHz`],
                    ['Channel',           `${selAp.channel}`],
                    ['Non-overlapping?',  NON_OVERLAP[band].includes(selAp.channel) ? '✓ Yes' : '✗ No'],
                    ['Band',              selAp.band],
                  ].map(([lbl, val]) => (
                    <div key={lbl} style={{ display:'grid', gridTemplateColumns:'140px 1fr', gap:'0 0.75rem', padding:'0.22rem 0', borderBottom:'1px solid #ffffff08' }}>
                      <span style={{ fontSize:'0.68rem', color:'#7ee787', fontFamily:'monospace' }}>{lbl}:</span>
                      <span style={{ fontSize:'0.68rem', color:'#ffa657', fontFamily:'monospace' }}>{val}</span>
                    </div>
                  ))}
                </div>
                {ov !== 'none' && (
                  <p style={{ margin:'0.75rem 0 0', fontSize:'0.77rem', color:'#c9d1d9', lineHeight:1.7 }}>
                    {ov === 'cci'
                      ? '⚠ Co-channel interference — another AP shares this exact center frequency. Both must take turns via CSMA/CA, dividing throughput. Move this AP to a different non-overlapping channel.'
                      : '⚠ Adjacent-channel interference — another AP\'s signal overlaps this channel\'s spectrum. This produces physical RF noise that corrupts frames. Always use non-overlapping channels (marked in green on the chart).'}
                  </p>
                )}
              </div>
            </div>
          );
        })()}

        {/* ── AP management + interference ── */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:'1rem', marginBottom:'1.25rem' }}>

          {/* Add AP */}
          <div style={{ background:T.cardBg, border:`1px solid ${T.borderColor}`, borderRadius:14, padding:'1.1rem' }}>
            <div style={{ fontSize:'0.65rem', fontWeight:800, color:T.textMuted, textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:10 }}>Add AP — {band}</div>
            <form onSubmit={handleAdd} style={{ display:'flex', flexDirection:'column', gap:7 }}>
              <input placeholder="SSID / AP name (optional)" value={newName}
                onChange={e => setNewName(e.target.value)} style={iStyle} />
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:6 }}>
                <div>
                  <label style={{ fontSize:'0.6rem', color:T.textMuted, display:'block', marginBottom:3 }}>Channel</label>
                  <select value={newCh} onChange={e => setNewCh(+e.target.value)} style={iStyle}>
                    {channels.map(ch => (
                      <option key={ch} value={ch}>Ch {ch}{NON_OVERLAP[band].includes(ch) ? ' ✓' : ''}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize:'0.6rem', color:T.textMuted, display:'block', marginBottom:3 }}>Width</label>
                  <select value={newW} onChange={e => setNewW(+e.target.value)} style={iStyle}>
                    {widths.map(w => <option key={w} value={w}>{w} MHz</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize:'0.6rem', color:T.textMuted, display:'block', marginBottom:3 }}>dBm</label>
                  <input type="number" min={-95} max={-20} value={newSig}
                    onChange={e => setNewSig(+e.target.value || -55)} style={iStyle} />
                </div>
              </div>
              <button type="submit"
                style={{ ...btnBase, padding:'7px', background:T.accent, color:'#fff', borderRadius:8, fontSize:'0.8rem', fontWeight:700 }}>
                + Add to spectrum
              </button>
            </form>

            {/* Best channel suggestion */}
            <div style={{ marginTop:10, padding:'0.55rem 0.8rem', background:'#3fb95010', border:'1px solid #3fb95035', borderRadius:8, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div>
                <div style={{ fontSize:'0.6rem', fontWeight:700, color:'#3fb950', textTransform:'uppercase', letterSpacing:'0.07em' }}>Recommended channel</div>
                <div style={{ fontSize:'0.82rem', fontWeight:800, color:T.textPrimary, marginTop:1, fontFamily:'monospace' }}>Ch {suggestion}</div>
              </div>
              <button onClick={() => setNewCh(suggestion)}
                style={{ ...btnBase, padding:'4px 12px', background:'#3fb950', color:'#fff', borderRadius:6, fontSize:'0.72rem', fontWeight:700 }}>
                Use
              </button>
            </div>
          </div>

          {/* AP list */}
          <div style={{ background:T.cardBg, border:`1px solid ${T.borderColor}`, borderRadius:14, padding:'1.1rem' }}>
            <div style={{ fontSize:'0.65rem', fontWeight:800, color:T.textMuted, textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:8 }}>
              APs on {band} ({visAps.length})
            </div>
            {visAps.length === 0
              ? <p style={{ margin:0, fontSize:'0.78rem', color:T.textMuted, fontStyle:'italic' }}>No APs on this band — add one above.</p>
              : visAps.map(ap => {
                  const color  = COLORS[ap.colorIdx % COLORS.length];
                  const isSel  = ap.id === selectedId;
                  const ov     = worstOverlap(ap, visAps);
                  const ovC    = ov === 'cci' ? '#f85149' : '#d29922';
                  return (
                    <div key={ap.id}
                      onClick={() => setSelectedId(p => p === ap.id ? null : ap.id)}
                      style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 10px', borderRadius:8, border:`1px solid ${isSel ? color : (ov !== 'none' ? ovC : T.borderColor)}`, background: isSel ? `${color}10` : T.panelBg, cursor:'pointer', marginBottom:5, transition:'all 0.12s' }}>
                      <div style={{ width:9, height:9, borderRadius:'50%', background:color, flexShrink:0 }} />
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:'0.78rem', fontWeight:700, color:T.textPrimary, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{ap.name}</div>
                        <div style={{ fontSize:'0.68rem', color:T.textMuted, fontFamily:'monospace' }}>
                          Ch {ap.channel} · {ap.width} MHz · {ap.signal} dBm · {centerMhz(ap)} MHz
                        </div>
                      </div>
                      {ov !== 'none' && (
                        <span style={{ fontSize:'0.55rem', fontWeight:800, padding:'2px 5px', borderRadius:4, background: ov==='cci' ? '#f85149' : '#d29922', color: ov==='cci' ? '#fff' : '#000', flexShrink:0 }}>
                          {ov.toUpperCase()}
                        </span>
                      )}
                      <button onClick={e => { e.stopPropagation(); handleDelete(ap.id); }}
                        style={{ ...btnBase, background:'none', color:T.danger, fontSize:'0.9rem', padding:'0 2px', opacity:0.6, flexShrink:0 }}>✕</button>
                    </div>
                  );
                })
            }
          </div>

          {/* Interference */}
          <div style={{ background:T.cardBg, border:`1px solid ${T.borderColor}`, borderRadius:14, padding:'1.1rem' }}>
            <div style={{ fontSize:'0.65rem', fontWeight:800, color:T.textMuted, textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:8 }}>
              Inject interference
            </div>
            {bandIntKeys[band].length === 0
              ? <p style={{ margin:0, fontSize:'0.78rem', color:T.textMuted, lineHeight:1.6 }}>
                  6 GHz is isolated from legacy interference sources — no microwave, Bluetooth, or radar contention. A key advantage of WiFi 6E / 7.
                </p>
              : bandIntKeys[band].map(key => {
                  const src = INT_DEFS[key];
                  const active = intSrcs.has(key);
                  return (
                    <button key={key} onClick={() => toggleInt(key)}
                      style={{ ...btnBase, display:'flex', justifyContent:'space-between', alignItems:'center', width:'100%', marginBottom:6, padding:'8px 10px', border:`1px solid ${active ? '#f85149' : T.borderColor}`, borderRadius:8, background: active ? 'rgba(248,81,73,0.1)' : T.panelBg, color: active ? '#f85149' : T.textSecondary, fontSize:'0.78rem', fontWeight: active ? 700 : 500, textAlign:'left' }}>
                      <span>{src.label}</span>
                      <span style={{ fontSize:'0.64rem', fontFamily:'monospace', opacity:0.65 }}>{src.centerMhz} ± {src.widthMhz/2} MHz</span>
                    </button>
                  );
                })
            }
          </div>
        </div>

        {/* ── CCI vs ACI comparison table ── */}
        <div style={{ background:T.cardBg, border:`1px solid ${T.borderColor}`, borderRadius:14, overflow:'hidden', marginBottom:'1.25rem' }}>
          <div style={{ padding:'0.9rem 1.25rem', borderBottom:`1px solid ${T.borderColor}`, background:T.panelBg, display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ fontSize:'0.75rem', fontWeight:700, color:T.textPrimary }}>CCI vs ACI — understanding the difference</span>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1.2fr 1fr 1fr', gap:0 }}>
            {[
              ['',                   'Co-Channel (CCI)',           'Adjacent-Channel (ACI)'],
              ['Cause',              'Same center frequency',      'Overlapping but different freq'],
              ['Layer affected',     'Layer 2 (CSMA/CA)',          'Layer 1 (RF noise)'],
              ['Frame corruption',   '✅ No — frames decoded',     '❌ Yes — frames destroyed'],
              ['Throughput impact',  '⚠️ Divided among APs',       '🔴 Severe retransmissions'],
              ['Fix',                'Accept & plan reuse dist.',  'Move to non-overlapping ch.'],
              ['Severity',           '⚠️ Capacity problem',        '🔴 More damaging'],
            ].map((row, ri) =>
              row.map((cell, ci) => (
                <div key={`${ri}-${ci}`}
                  style={{ padding:'0.42rem 0.75rem', borderBottom:`1px solid ${T.borderColor}`, borderRight: ci<2 ? `1px solid ${T.borderColor}` : 'none', fontSize: ci===0 ? '0.72rem' : '0.75rem', fontWeight: ri===0||ci===0 ? 700 : 400, color: ri===0 ? T.textMuted : ci===0 ? T.textSecondary : T.textPrimary, background: ri===0 ? T.panelBg : 'transparent', textTransform: ri===0 ? 'uppercase' : 'none', letterSpacing: ri===0 ? '0.05em' : 'normal' }}>
                  {cell}
                </div>
              ))
            )}
          </div>
        </div>

        <LabEduPanel cards={WIFI_EDU} isDarkMode={isDarkMode} />
      </div>
    </div>
  );
};

export default WifiAnalyzer;
