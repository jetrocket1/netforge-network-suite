import { useState, useEffect, useRef, Component, lazy, Suspense } from 'react';

type LabProps = { isDarkMode: boolean; isPro?: boolean; onUpgrade?: () => void };

const lazyLab = (loader: () => Promise<Record<string, unknown>>, name: string) =>
  lazy(() => loader().then(m => ({ default: (m.default ?? m[name] ?? Object.values(m)[0]) as React.ComponentType<LabProps> })));

// ── Lab imports ──────────────────────────────────────────────────────────────
const OsiModelLazy         = lazyLab(() => import('./OsiModel'),             'OsiModel');
const HeaderInspectorLazy  = lazyLab(() => import('./HeaderInspector'),      'HeaderInspector');
const ProtocolMapperLazy   = lazyLab(() => import('./ProtocolMapper'),       'ProtocolMapper');
const TopologyLabLazy      = lazyLab(() => import('./TopologyLab'),          'TopologyLab');
const CsmaLabLazy          = lazyLab(() => import('./CsmaLab'),              'CsmaLab');
const CableLabLazy         = lazyLab(() => import('./CableLab'),             'CableLab');
const IcmpLabLazy          = lazyLab(() => import('./IcmpLab'),              'IcmpLab');
const ArpLabLazy           = lazyLab(() => import('./ArpLab'),               'ArpLab');
const NetServicesLabLazy   = lazyLab(() => import('./NetServicesLab'),       'NetServicesLab');
const WirelessToWiredLazy  = lazyLab(() => import('./WirelessToWiredLab'),   'WirelessToWiredLab');
const SubnetCalcLazy       = lazyLab(() => import('./SubnetCalculator'),     'SubnetCalculator');
const SubnetSplitterLazy   = lazyLab(() => import('./SubnetSplitter'),       'SubnetSplitter');
const Ipv6SuiteLazy        = lazyLab(() => import('./Ipv6Suite'),            'Ipv6Suite');
const SubnetCheatLazy      = lazyLab(() => import('./SubnetCheatSheet'),     'SubnetCheatSheet');
const VlanSuiteLazy        = lazyLab(() => import('./VlanSuite'),            'VlanSuite');
const LinkAggLabLazy       = lazyLab(() => import('./LinkAggregationLab'),   'LinkAggregationLab');
const StpLabLazy           = lazyLab(() => import('./StpLab'),               'StpLab');
const WifiAnalyzerLazy     = lazyLab(() => import('./WifiAnalyzer'),         'WifiAnalyzer');
const WifiRoamingLazy      = lazyLab(() => import('./WifiRoamingLab'),       'WifiRoamingLab');
const WifiBeamformingLazy  = lazyLab(() => import('./WifiBeamforming'),      'WifiBeamforming');
const WifiSecurityLazy     = lazyLab(() => import('./WifiSecurity'),         'WifiSecurity');
const WifiStandardsLazy    = lazyLab(() => import('./WifiStandards'),        'WifiStandards');
const Layer2SecurityLazy   = lazyLab(() => import('./Layer2SecurityLab'),    'Layer2SecurityLab');
const AclLabLazy           = lazyLab(() => import('./AclLab'),               'AclLab');
const LpmSimLazy           = lazyLab(() => import('./LpmSimulator'),         'LpmSimulator');
const GatewayLabLazy       = lazyLab(() => import('./GatewayLab'),           'GatewayLab');
const DynamicRoutingLazy   = lazyLab(() => import('./DynamicRoutingLab'),    'DynamicRoutingLab');
const PowerShellLazy       = lazyLab(() => import('./PowerShellCheatsheet'), 'PowerShellCheatsheet');
const PracticeStationLazy  = lazyLab(() => import('./PracticeStation'),      'PracticeStation');
const TcpLabLazy           = lazyLab(() => import('./TcpLab'),               'TcpLab');
const NatLabLazy           = lazyLab(() => import('./NatLab'),               'NatLab');
const FirewallLabLazy      = lazyLab(() => import('./FirewallLab'),          'FirewallLab');
const OspfLabLazy          = lazyLab(() => import('./OspfLab'),              'OspfLab');
const QosLabLazy           = lazyLab(() => import('./QosLab'),               'QosLab');
const DnsLabLazy           = lazyLab(() => import('./DnsLab'),               'DnsLab');
const TlsLabLazy           = lazyLab(() => import('./TlsLab'),               'TlsLab');
const MacLabLazy           = lazyLab(() => import('./MacLab'),               'MacLab');

// ── Auth / ads / payment ──────────────────────────────────────────────────────
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AuthButton }            from './components/AuthButton';
import { UpgradeModal }          from './components/UpgradeModal';
import { ProSuccessModal }       from './components/ProSuccessModal';
import { ProfilePage }           from './components/ProfilePage';

// ── Error boundary ────────────────────────────────────────────────────────────
class SafeComponentBridge extends Component<
  { target: React.ComponentType<LabProps>; name: string; isDarkMode: boolean; isPro?: boolean; onUpgrade?: () => void },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(e: unknown, i: unknown) { console.error(`Lab [${this.props.name}] failed:`, e, i); }
  render() {
    if (this.state.hasError) return (
      <div style={{ padding:'2rem', backgroundColor:'#1e1b4b', borderRadius:'10px', border:'1px dashed #6366f1', color:'#f8fafc' }}>
        <h4 style={{ margin:'0 0 6px', color:'#f43f5e', fontSize:'0.95rem' }}>Module failed to load</h4>
        <p style={{ margin:0, fontSize:'0.82rem', color:'#cbd5e1', lineHeight:1.5 }}><strong>{this.props.name}</strong> could not be mounted. Check the browser console.</p>
      </div>
    );
    const C = this.props.target;
    return <C isDarkMode={this.props.isDarkMode} isPro={this.props.isPro} onUpgrade={this.props.onUpgrade} />;
  }
}

// ── Registry ──────────────────────────────────────────────────────────────────
interface Tool { id:string; label:string; component:ReturnType<typeof lazy>; name:string; premium?:true; }
interface Category { catId:string; catLabel:string; tools:Tool[]; }

const REGISTRY: Category[] = [
  { catId:'fundamentals', catLabel:'Fundamentals', tools:[
    { id:'osiModel',        label:'The OSI 7-Layer Model',       component:OsiModelLazy,        name:'OsiModel' },
    { id:'topologyLab',     label:'Network Topologies',          component:TopologyLabLazy,     name:'TopologyLab' },
    { id:'csmaLab',         label:'Access Control (CSMA/CD)',    component:CsmaLabLazy,         name:'CsmaLab' },
    { id:'cableLab',        label:'Cables & Hardware',           component:CableLabLazy,        name:'CableLab' },
    { id:'arpLab',          label:'Address Resolution (ARP)',    component:ArpLabLazy,          name:'ArpLab' },
    { id:'netServices',     label:'Network Services (DHCP/DNS)', component:NetServicesLabLazy,  name:'NetServicesLab' },
    { id:'dnsLab',          label:'DNS Resolution Visualiser',   component:DnsLabLazy,          name:'DnsLab' },
    { id:'headerInspector', label:'Packets vs. Frames',          component:HeaderInspectorLazy, name:'HeaderInspector' },
    { id:'protocolMapper',  label:'Protocol Data Units',         component:ProtocolMapperLazy,  name:'ProtocolMapper' },
    { id:'icmpLab',         label:'How Ping Works (ICMP)',       component:IcmpLabLazy,         name:'IcmpLab' },
    { id:'tcpLab',          label:'TCP Connection Lifecycle',    component:TcpLabLazy,          name:'TcpLab' },
    { id:'wirelessToWired', label:'Wireless-to-Wired Path',      component:WirelessToWiredLazy, name:'WirelessToWiredLab' },
  ]},
  { catId:'switching', catLabel:'Switching', tools:[
    { id:'vlanMap',         label:'VLAN Configuration',          component:VlanSuiteLazy,     name:'VlanSuite' },
    { id:'linkAggregation', label:'Link Aggregation',            component:LinkAggLabLazy,    name:'LinkAggregationLab' },
    { id:'stpLab',          label:'Spanning Tree Protocol',      component:StpLabLazy,        name:'StpLab' },
    { id:'macLab',          label:'MAC Learning & Forwarding',   component:MacLabLazy,        name:'MacLab' },
  ]},
  { catId:'subnetting', catLabel:'Subnetting', tools:[
    { id:'calculator', label:'IP Subnet Calculator',   component:SubnetCalcLazy,    name:'SubnetCalculator' },
    { id:'splitter',   label:'VLSM Planner',           component:SubnetSplitterLazy,name:'SubnetSplitter' },
    { id:'ipv6Suite',  label:'IPv6 Address Basics',    component:Ipv6SuiteLazy,     name:'Ipv6Suite' },
    { id:'cheatsheet', label:'Subnetting Quick Sheet', component:SubnetCheatLazy,   name:'SubnetCheatSheet' },
  ]},
  { catId:'routing', catLabel:'Routing', tools:[
    { id:'lpmSim',     label:'Longest Prefix Match',     component:LpmSimLazy,        name:'LpmSimulator' },
    { id:'gatewayLab', label:'Gateway & Backup Routes',  component:GatewayLabLazy,    name:'GatewayLab' },
    { id:'dynamicLab', label:'Routing Protocols Matrix', component:DynamicRoutingLazy,name:'DynamicRoutingLab' },
    { id:'natLab',     label:'NAT / PAT Simulator',      component:NatLabLazy,        name:'NatLab' },
    { id:'ospfLab',    label:'OSPF Visualiser',          component:OspfLabLazy,       name:'OspfLab',  premium:true },
    { id:'qosLab',     label:'QoS Traffic Management',   component:QosLabLazy,        name:'QosLab',   premium:true },
  ]},
  { catId:'wireless', catLabel:'Wireless', tools:[
    { id:'wifi',        label:'Wi-Fi Signal Analyser',  component:WifiAnalyzerLazy,   name:'WifiAnalyzer' },
    { id:'roaming',     label:'Cell Overlap & Roaming', component:WifiRoamingLazy,    name:'WifiRoamingLab' },
    { id:'beamforming', label:'Beamforming',            component:WifiBeamformingLazy,name:'WifiBeamforming' },
    { id:'security',    label:'Wi-Fi Security (WPA)',   component:WifiSecurityLazy,   name:'WifiSecurity' },
    { id:'standards',   label:'802.11 Standards',       component:WifiStandardsLazy,  name:'WifiStandards' },
  ]},
  { catId:'security', catLabel:'Security', tools:[
    { id:'layer2',      label:'Layer 2 Attack Mitigation', component:Layer2SecurityLazy, name:'Layer2SecurityLab', premium:true },
    { id:'aclLab',      label:'ACL Rules Simulator',       component:AclLabLazy,         name:'AclLab' },
    { id:'tlsLab',      label:'TLS Handshake Visualiser',  component:TlsLabLazy,         name:'TlsLab' },
    { id:'firewallLab', label:'Firewall Zone Policy',       component:FirewallLabLazy,    name:'FirewallLab', premium:true },
  ]},
  { catId:'powershell', catLabel:'PowerShell', tools:[
    { id:'cheatsheet', label:'Diagnostics Command Matrix', component:PowerShellLazy, name:'PowerShellCheatsheet' },
  ]},
  { catId:'training', catLabel:'Training', tools:[
    { id:'practice', label:'Exam Practice Sandbox', component:PracticeStationLazy, name:'PracticeStation' },
  ]},
];

const ALL_TOOLS = REGISTRY.flatMap(c => c.tools.map(t => ({ ...t, catLabel: c.catLabel, catId: c.catId })));

// ── Theme ─────────────────────────────────────────────────────────────────────
const THEME = {
  dark:  { appBg:'#0d1117', sidebarBg:'#010409', headerBg:'#0d1117', border:'#21262d', textPrimary:'#e6edf3', textMuted:'#8b949e', navText:'#7d8590', activeText:'#e6edf3', activeBg:'#1c2128', accent:'#4493f8', toggleBg:'#161b22' },
  light: { appBg:'#f6f8fa', sidebarBg:'#ffffff', headerBg:'#ffffff', border:'#d0d7de', textPrimary:'#1f2328', textMuted:'#636c76', navText:'#59636e', activeText:'#0969da', activeBg:'#ddf4ff', accent:'#0969da', toggleBg:'#f6f8fa' },
};

const SIDEBAR_W = 232;
const ls = { get: (k:string, fb:string) => { try { return localStorage.getItem(k) ?? fb; } catch { return fb; } }, set: (k:string,v:string) => { try { localStorage.setItem(k,v); } catch {} } };

// ── Premium gate component ────────────────────────────────────────────────────
function PremiumGate({ label, onUnlock, T }: { label:string; onUnlock:()=>void; T:typeof THEME.dark }) {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:400, padding:'2rem' }}>
      <div style={{ maxWidth:420, width:'100%', textAlign:'center', backgroundColor: T.appBg === '#0d1117' ? '#161b22' : '#ffffff', border:`1px solid ${T.border}`, borderRadius:16, padding:'3rem 2rem' }}>
        <div style={{ width:56, height:56, borderRadius:'50%', border:`2px solid ${T.accent}`, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 1.5rem', fontSize:'0.75rem', fontWeight:900, color:T.accent, letterSpacing:'0.05em' }}>PRO</div>
        <h3 style={{ margin:'0 0 0.75rem', fontSize:'1.2rem', fontWeight:700, color:T.textPrimary }}>Premium Feature</h3>
        <p style={{ margin:'0 0 0.5rem', fontSize:'0.85rem', color:T.textMuted, lineHeight:1.6 }}>
          <strong style={{ color:T.textPrimary }}>{label}</strong> is part of Netforge Premium — advanced labs covering enterprise routing, security, and QoS.
        </p>
        <p style={{ margin:'0 0 2rem', fontSize:'0.8rem', color:T.textMuted, lineHeight:1.5 }}>
          Includes all current and future advanced labs, no ads, and priority updates.
        </p>
        <button onClick={onUnlock} style={{ display:'block', width:'100%', padding:'0.85rem', borderRadius:8, border:'none', backgroundColor:T.accent, color:'#fff', fontWeight:700, fontSize:'0.9rem', cursor:'pointer', marginBottom:'0.75rem' }}>
          Unlock Premium
        </button>
        <p style={{ margin:0, fontSize:'0.72rem', color:T.textMuted }}>One-time payment of £4.99 unlocks all pro labs permanently.</p>
      </div>
    </div>
  );
}

// ── App ───────────────────────────────────────────────────────────────────────
function AppInner() {
  const { user, profile, refreshProfile, signInWithGoogle } = useAuth();
  const [activeCat,  setActiveCat]  = useState(() => { const u=new URLSearchParams(window.location.search).get('cat'); return REGISTRY.some(c=>c.catId===u)?u!:'fundamentals'; });
  const [activeTool, setActiveTool] = useState(() => { const u=new URLSearchParams(window.location.search).get('tool'); const c=REGISTRY.find(c=>c.catId===activeCat); return c?.tools.some(t=>t.id===u)?u!:c?.tools[0].id??''; });
  const [isDark,     setIsDark]     = useState(() => ls.get('netforge-theme','dark')==='dark');
  const [completed,  setCompleted]  = useState<Set<string>>(() => { try { const s=localStorage.getItem('netforge-progress'); return s?new Set(JSON.parse(s) as string[]):new Set(); } catch { return new Set(); } });
  const [isMobile,   setIsMobile]   = useState(() => window.innerWidth<768);
  const [sidebarOpen,setSidebarOpen]= useState(() => window.innerWidth>=768);
  const [collapsed,  setCollapsed]  = useState(() => ls.get('netforge-sidebar-collapsed','false')==='true');
  const [search,      setSearch]      = useState('');
  const [showUpgrade,     setShowUpgrade]     = useState(false);
  const [showProSuccess,  setShowProSuccess]  = useState(false);
  const [showProfile,     setShowProfile]     = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onResize = () => { const m=window.innerWidth<768; setIsMobile(m); if(!m) setSidebarOpen(true); };
    window.addEventListener('resize',onResize);
    return ()=>window.removeEventListener('resize',onResize);
  },[]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('payment') === 'success') { void refreshProfile(); setShowProSuccess(true); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { try { localStorage.setItem('netforge-progress',JSON.stringify([...completed])); } catch {} },[completed]);
  useEffect(() => { ls.set('netforge-theme', isDark?'dark':'light'); },[isDark]);
  useEffect(() => { ls.set('netforge-sidebar-collapsed', collapsed?'true':'false'); },[collapsed]);

  useEffect(() => {
    const cat=REGISTRY.find(c=>c.catId===activeCat);
    const tool=cat?.tools.find(t=>t.id===activeTool);
    document.title = tool?`${tool.label} | Netforge`:'Netforge';
    const url=new URL(window.location.href);
    url.searchParams.set('cat',activeCat); url.searchParams.set('tool',activeTool);
    url.searchParams.delete('payment');
    window.history.pushState({},'',url.toString());
  },[activeCat,activeTool]);

  const selectTool = (toolId:string, catId?:string) => {
    if(catId) setActiveCat(catId);
    setActiveTool(toolId);
    setSearch('');
    if(isMobile) setSidebarOpen(false);
  };

  const selectCat = (catId:string) => {
    const cat=REGISTRY.find(c=>c.catId===catId);
    if(cat?.tools.length) { setActiveCat(catId); setActiveTool(cat.tools[0].id); }
  };

  const toggleDone = (id:string) => setCompleted(prev=>{ const n=new Set(prev); n.has(id)?n.delete(id):n.add(id); return n; });
  const unlockPremium = () => { if (!user) { void signInWithGoogle(); return; } setShowUpgrade(true); };

  const T = isDark ? THEME.dark : THEME.light;
  const hasPremium = profile?.is_pro ?? false;
  const currentCat = REGISTRY.find(c=>c.catId===activeCat)??REGISTRY[0];
  const selectedTool = currentCat.tools.find(t=>t.id===activeTool)??currentCat.tools[0];
  const isDone = completed.has(selectedTool.id);
  const isLocked = !!selectedTool.premium && !hasPremium;
  const totalLabs    = REGISTRY.reduce((n,c)=>n+c.tools.length,0);
  const totalDone    = completed.size;
  const pct          = Math.round((totalDone/totalLabs)*100);
  const completedLabs = ALL_TOOLS.filter(t => completed.has(t.id));

  const q = search.trim().toLowerCase();
  const searchResults = q ? ALL_TOOLS.filter(t=>t.label.toLowerCase().includes(q)) : [];

  const btnBase: React.CSSProperties = { background:'none', border:'none', cursor:'pointer', transition:'all 0.12s' };

  // Sidebar style
  const sidebarW = isMobile ? SIDEBAR_W : (collapsed ? 0 : SIDEBAR_W);
  const sidebarStyle: React.CSSProperties = isMobile
    ? { position:'fixed', top:0, left:0, height:'100vh', zIndex:1000, width:SIDEBAR_W, display:'flex', flexDirection:'column', backgroundColor:T.sidebarBg, borderRight:`1px solid ${T.border}`, transform:sidebarOpen?'translateX(0)':`translateX(-${SIDEBAR_W}px)`, transition:'transform 0.25s ease' }
    : { width:sidebarW, flexShrink:0, display:'flex', flexDirection:'column', height:'100vh', backgroundColor:T.sidebarBg, borderRight:collapsed?'none':`1px solid ${T.border}`, overflow:'hidden', transition:'width 0.25s ease' };

  return (
    <>
    <div style={{ display:'flex', height:'100vh', overflow:'hidden', backgroundColor:T.appBg, fontFamily:'system-ui,-apple-system,"Segoe UI",sans-serif' }}>

      {/* Backdrop */}
      {isMobile && sidebarOpen && <div onClick={()=>setSidebarOpen(false)} style={{ position:'fixed', inset:0, backgroundColor:'rgba(0,0,0,0.55)', zIndex:999 }} />}

      {/* ── Sidebar ── */}
      <aside style={sidebarStyle}>

        {/* Logo */}
        <div style={{ padding:'1.1rem 1rem 0.875rem', borderBottom:`1px solid ${T.border}`, flexShrink:0 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
            <div>
              <div style={{ fontSize:'1rem', fontWeight:800, letterSpacing:'-0.02em', color:T.textPrimary, lineHeight:1 }}>NET<span style={{ color:T.accent }}>FORGE</span></div>
              <div style={{ fontSize:'0.65rem', color:T.textMuted, marginTop:4, letterSpacing:'0.08em', textTransform:'uppercase', fontWeight:600 }}>Network Training Suite</div>
            </div>
            {isMobile && <button onClick={()=>setSidebarOpen(false)} style={{ ...btnBase, color:T.textMuted, fontSize:'1.1rem', padding:'0 2px' }} aria-label="Close">✕</button>}
          </div>
          {/* Progress */}
          <div style={{ marginTop:'0.75rem' }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
              <span style={{ fontSize:'0.62rem', color:T.textMuted, fontWeight:600 }}>Progress</span>
              <span style={{ fontSize:'0.62rem', color:totalDone>0?T.accent:T.textMuted, fontWeight:700 }}>{totalDone}/{totalLabs}</span>
            </div>
            <div style={{ height:4, backgroundColor:T.border, borderRadius:2, overflow:'hidden' }}>
              <div style={{ height:'100%', width:`${pct}%`, backgroundColor:pct===100?'#3fb950':T.accent, borderRadius:2, transition:'width 0.3s ease' }} />
            </div>
          </div>
          {/* Search */}
          <div style={{ marginTop:'0.75rem', position:'relative' }}>
            <span style={{ position:'absolute', left:8, top:'50%', transform:'translateY(-50%)', color:T.textMuted, fontSize:'0.75rem', pointerEvents:'none' }}>⌕</span>
            <input ref={searchRef} value={search} onChange={e=>setSearch(e.target.value)}
              placeholder="Search labs..."
              style={{ width:'100%', boxSizing:'border-box', padding:'5px 8px 5px 24px', borderRadius:6, border:`1px solid ${T.border}`, backgroundColor:T.toggleBg, color:T.textPrimary, fontSize:'0.75rem', outline:'none', fontFamily:'inherit' }}
            />
            {search && <button onClick={()=>setSearch('')} style={{ ...btnBase, position:'absolute', right:6, top:'50%', transform:'translateY(-50%)', color:T.textMuted, fontSize:'0.8rem', lineHeight:1 }}>✕</button>}
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex:1, overflowY:'auto', padding:'0.5rem 0' }}>

          {/* Search results */}
          {q ? (
            <div>
              <div style={{ padding:'4px 14px 6px', fontSize:'0.6rem', fontWeight:700, color:T.textMuted, textTransform:'uppercase', letterSpacing:'0.07em' }}>
                {searchResults.length} result{searchResults.length!==1?'s':''} for "{q}"
              </div>
              {searchResults.length === 0
                ? <div style={{ padding:'1rem 14px', fontSize:'0.78rem', color:T.textMuted, fontStyle:'italic' }}>No labs found</div>
                : searchResults.map(t => {
                    const isActive = activeTool===t.id;
                    const isLock = !!t.premium && !hasPremium;
                    return (
                      <button key={t.id} onClick={()=>selectTool(t.id, t.catId)}
                        style={{ ...btnBase, width:'100%', textAlign:'left', padding:'0.35rem 0.6rem 0.35rem 1rem', borderLeft:`2px solid ${isActive?T.accent:'transparent'}`, backgroundColor:isActive?T.activeBg:'transparent', color:isActive?T.activeText:T.navText, fontSize:'0.78rem', lineHeight:1.4, display:'flex', alignItems:'center', justifyContent:'space-between', gap:6 }}>
                        <span style={{ flexGrow:1 }}>
                          <span style={{ display:'block', fontSize:'0.6rem', color:T.textMuted, fontWeight:600, textTransform:'uppercase', marginBottom:1 }}>{t.catLabel}</span>
                          {t.label}
                        </span>
                        {isLock && <span style={{ fontSize:'0.55rem', fontWeight:700, color:T.accent, backgroundColor:`${T.accent}18`, padding:'1px 5px', borderRadius:6, flexShrink:0 }}>PRO</span>}
                      </button>
                    );
                  })
              }
            </div>
          ) : (
            /* Normal accordion nav */
            REGISTRY.map(cat => {
              const isOpen = activeCat===cat.catId;
              const catDone = cat.tools.filter(t=>completed.has(t.id)).length;
              return (
                <div key={cat.catId} style={{ marginBottom:'0.2rem' }}>
                  <button onClick={()=>selectCat(cat.catId)}
                    style={{ ...btnBase, width:'100%', textAlign:'left', display:'flex', justifyContent:'space-between', alignItems:'center', padding:'0.35rem 0.875rem', color:isOpen?T.textPrimary:T.textMuted, fontSize:'0.68rem', fontWeight:700, letterSpacing:'0.07em', textTransform:'uppercase' }}>
                    <span>{cat.catLabel}</span>
                    <span style={{ display:'flex', alignItems:'center', gap:5 }}>
                      {catDone>0 && <span style={{ fontSize:'0.6rem', color:catDone===cat.tools.length?'#3fb950':T.accent, fontWeight:700 }}>{catDone}/{cat.tools.length}</span>}
                      <span style={{ fontSize:'0.5rem', opacity:0.5 }}>{isOpen?'▲':'▼'}</span>
                    </span>
                  </button>
                  {isOpen && cat.tools.map(tool => {
                    const isActive = activeTool===tool.id;
                    const toolDone = completed.has(tool.id);
                    const isLock = !!tool.premium && !hasPremium;
                    return (
                      <button key={tool.id} onClick={()=>selectTool(tool.id)}
                        style={{ ...btnBase, width:'100%', textAlign:'left', padding:'0.38rem 0.6rem 0.38rem 1.1rem', borderLeft:`2px solid ${isActive?T.accent:'transparent'}`, backgroundColor:isActive?T.activeBg:'transparent', color:isActive?T.activeText:T.navText, fontSize:'0.8rem', fontWeight:isActive?600:400, lineHeight:1.45, display:'flex', alignItems:'center', justifyContent:'space-between', gap:6 }}>
                        <span style={{ flexGrow:1 }}>{tool.label}</span>
                        <span style={{ display:'flex', alignItems:'center', gap:4, flexShrink:0 }}>
                          {isLock && <span style={{ fontSize:'0.55rem', fontWeight:700, color:T.accent, backgroundColor:`${T.accent}18`, padding:'1px 5px', borderRadius:6 }}>PRO</span>}
                          {toolDone && <span style={{ width:14, height:14, borderRadius:'50%', backgroundColor:'#3fb950', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'8px', color:'#fff', fontWeight:900, lineHeight:1 }}>✓</span>}
                        </span>
                      </button>
                    );
                  })}
                </div>
              );
            })
          )}
        </nav>

        {/* Footer: theme + premium status */}
        <div style={{ padding:'0.6rem 0.875rem', borderTop:`1px solid ${T.border}`, flexShrink:0, display:'flex', flexDirection:'column', gap:6 }}>
          {hasPremium && (
            <div style={{ display:'flex', alignItems:'center', gap:6, padding:'4px 8px', borderRadius:6, backgroundColor:`${T.accent}12`, border:`1px solid ${T.accent}30` }}>
              <span style={{ fontSize:'0.6rem', fontWeight:800, color:T.accent }}>PRO</span>
              <span style={{ fontSize:'0.65rem', color:T.textMuted }}>Pro active</span>
            </div>
          )}
          <button onClick={()=>setIsDark(!isDark)}
            style={{ ...btnBase, width:'100%', textAlign:'left', display:'flex', alignItems:'center', gap:'0.5rem', padding:'0.45rem 0.6rem', backgroundColor:T.toggleBg, border:`1px solid ${T.border}`, borderRadius:6, color:T.textMuted, fontSize:'0.78rem', fontWeight:500 }}>
            <span>{isDark?'☀️':'🌙'}</span>
            <span>{isDark?'Light mode':'Dark mode'}</span>
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', height:'100vh', overflow:'hidden', minWidth:0 }}>

        {/* Header bar */}
        <div style={{ backgroundColor:T.headerBg, borderBottom:`1px solid ${T.border}`, padding:'0.55rem 1rem', display:'flex', alignItems:'center', gap:'0.5rem', fontSize:'0.78rem', flexShrink:0 }}>
          {/* Sidebar toggle — mobile=hamburger, desktop=collapse */}
          {isMobile ? (
            <button onClick={()=>setSidebarOpen(true)} aria-label="Open menu" style={{ ...btnBase, color:T.textMuted, fontSize:'1.1rem', padding:'0 4px', lineHeight:1, flexShrink:0 }}>☰</button>
          ) : (
            <button onClick={()=>setCollapsed(c=>!c)} aria-label={collapsed?'Expand sidebar':'Collapse sidebar'}
              style={{ ...btnBase, color:T.textMuted, fontSize:'1rem', padding:'2px 6px', lineHeight:1, flexShrink:0, borderRadius:4, border:`1px solid ${T.border}`, backgroundColor:T.toggleBg }}
              title={collapsed?'Show sidebar':'Hide sidebar'}>
              {collapsed?'›':'‹'}
            </button>
          )}
          <span style={{ color:T.textMuted, fontWeight:500, flexShrink:0 }}>{currentCat.catLabel}</span>
          <span style={{ color:T.border, fontSize:'1rem', lineHeight:1, flexShrink:0 }}>›</span>
          <span style={{ color:T.textPrimary, fontWeight:600, flexGrow:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{selectedTool.label}</span>
          {selectedTool.premium && !hasPremium
            ? <span style={{ fontSize:'0.65rem', fontWeight:700, color:T.accent, backgroundColor:`${T.accent}18`, border:`1px solid ${T.accent}40`, padding:'3px 8px', borderRadius:6, flexShrink:0 }}>PRO</span>
            : <button onClick={()=>toggleDone(selectedTool.id)}
                style={{ ...btnBase, display:'flex', alignItems:'center', gap:5, flexShrink:0, padding:'0.3rem 0.6rem', border:`1px solid ${isDone?'#3fb950':T.border}`, borderRadius:5, fontSize:'0.72rem', fontWeight:600, backgroundColor:isDone?(isDark?'rgba(63,185,80,0.12)':'rgba(26,127,55,0.08)'):T.toggleBg, color:isDone?'#3fb950':T.textMuted }}>
                <span style={{ width:13, height:13, borderRadius:'50%', border:`1.5px solid ${isDone?'#3fb950':T.border}`, backgroundColor:isDone?'#3fb950':'transparent', display:'inline-flex', alignItems:'center', justifyContent:'center', fontSize:'8px', color:'#fff', fontWeight:900, flexShrink:0 }}>{isDone?'✓':''}</span>
                <span style={{ display:isMobile?'none':'inline' }}>{isDone?'Completed':'Mark complete'}</span>
              </button>
          }
          <AuthButton T={T} onUpgrade={unlockPremium} onProfile={() => setShowProfile(true)} />
        </div>

        {/* Lab content */}
        <div style={{ flex:1, overflowY:'auto', padding:isMobile?'1rem':'1.5rem' }}>
          {isLocked ? (
            <PremiumGate label={selectedTool.label} onUnlock={unlockPremium} T={T} />
          ) : (
            <Suspense fallback={<div style={{ padding:'4rem', textAlign:'center', color:T.textMuted }}><p style={{ margin:0, fontSize:'0.85rem' }}>Loading...</p></div>}>
              <SafeComponentBridge key={selectedTool.id} target={selectedTool.component} name={selectedTool.name} isDarkMode={isDark} isPro={hasPremium} onUpgrade={unlockPremium} />
            </Suspense>
          )}
        </div>
      </div>
    </div>
    {showUpgrade    && <UpgradeModal    onClose={() => setShowUpgrade(false)}    T={T} />}
    {showProSuccess && <ProSuccessModal onClose={() => setShowProSuccess(false)} T={T} />}
    {showProfile && user && <ProfilePage user={user} isPro={hasPremium} completedLabs={completedLabs} totalLabs={totalLabs} onClose={() => setShowProfile(false)} T={T} />}
    </>
  );
}

export default function App() {
  return <AuthProvider><AppInner /></AuthProvider>;
}
