import { useState, useEffect, useRef, Component, lazy, Suspense } from 'react';
import type { ReactNode } from 'react';
// Page components — lazy so they don't inflate the main /app bundle
const p = <T extends React.ComponentType>(fn: () => Promise<Record<string, unknown>>, key: string) =>
  lazy(() => fn().then(m => ({ default: (m as Record<string, T>)[key] })));

const HomePageLazy       = p(() => import('./HomePage'),        'HomePage');
const PrivacyPolicyLazy  = p(() => import('./LegalPages'),      'PrivacyPolicy');
const TermsOfServiceLazy = p(() => import('./LegalPages'),      'TermsOfService');
const SubnettingLazy     = p(() => import('./MarketingPages'),  'SubnettingPage');
const NetworkPlusLazy    = p(() => import('./MarketingPages'),  'NetworkPlusPage');
const SecurityPlusLazy   = p(() => import('./MarketingPages'),  'SecurityPlusPage');
const LabsPageLazy       = p(() => import('./MarketingPages'),  'LabsPage');
const PricingPageLazy    = p(() => import('./MarketingPages'),  'PricingPage');
const AboutPageLazy      = p(() => import('./MarketingPages'),  'AboutPage');
const GuidesIndexLazy    = p(() => import('./GuidesPages'),     'GuidesIndexPage');
const GuideSubnetLazy    = p(() => import('./GuidesPages'),     'GuideHowToSubnet');
const GuideNPlusLazy     = p(() => import('./GuidesPages'),     'GuideNetworkPlusStudy');
const GuideNvsS_Lazy     = p(() => import('./GuidesPages'),     'GuideNplusVsSecplus');
const GuideVlanLazy      = p(() => import('./GuidesPages'),     'GuideWhatIsVlan');
const GuideArpLazy       = p(() => import('./GuidesPages'),     'GuideArpPoisoning');
const GuideCiscoLazy     = p(() => import('./GuidesPages'),     'GuideCiscoIos');
const FaqPageLazy        = p(() => import('./GuidesPages'),     'FaqPage');
const ContactPageLazy    = p(() => import('./GuidesPages'),     'ContactPage');
const NotFoundLazy       = p(() => import('./NotFoundPage'),    'NotFoundPage');

const PAGE_ROUTES: Record<string, React.LazyExoticComponent<React.ComponentType>> = {
  '/':                                       HomePageLazy,
  '/privacy':                                PrivacyPolicyLazy,
  '/terms':                                  TermsOfServiceLazy,
  '/subnetting':                             SubnettingLazy,
  '/comptia-network-plus':                   NetworkPlusLazy,
  '/comptia-security-plus':                  SecurityPlusLazy,
  '/networking-labs':                        LabsPageLazy,
  '/pricing':                                PricingPageLazy,
  '/about':                                  AboutPageLazy,
  '/guides':                                 GuidesIndexLazy,
  '/guides/how-to-subnet':                   GuideSubnetLazy,
  '/guides/network-plus-study-guide':        GuideNPlusLazy,
  '/guides/network-plus-vs-security-plus':   GuideNvsS_Lazy,
  '/guides/what-is-a-vlan':                 GuideVlanLazy,
  '/guides/arp-poisoning':                  GuideArpLazy,
  '/guides/cisco-ios-commands':             GuideCiscoLazy,
  '/faq':                                    FaqPageLazy,
  '/contact':                                ContactPageLazy,
};

type LabProps = { isDarkMode: boolean; isPro?: boolean; hasExam?: boolean; onUpgrade?: () => void };

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
const SwitchIntroLazy      = lazyLab(() => import('./SwitchIntro'),          'SwitchIntro');
const RouterIntroLazy      = lazyLab(() => import('./RouterIntro'),          'RouterIntro');
const VlanSuiteLazy        = lazyLab(() => import('./VlanSuite'),            'VlanSuite');
const LinkAggLabLazy       = lazyLab(() => import('./LinkAggregationLab'),   'LinkAggregationLab');
const StpLabLazy           = lazyLab(() => import('./StpLab'),               'StpLab');
const WirelessIntroLazy    = lazyLab(() => import('./WirelessIntro'),        'WirelessIntro');
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
const PkiLabLazy           = lazyLab(() => import('./PkiLab'),               'PkiLab');
const Dot1xLabLazy         = lazyLab(() => import('./Dot1xLab'),             'Dot1xLab');
const ForensicsLabLazy     = lazyLab(() => import('./ForensicsLab'),         'ForensicsLab');
const IpsecLabLazy         = lazyLab(() => import('./IpsecLab'),             'IpsecLab');
const PhishingSimLazy      = lazyLab(() => import('./PhishingSim'),          'PhishingSim');
const ArpMitmLazy          = lazyLab(() => import('./ArpMitm'),              'ArpMitm');

// ── Auth / ads / payment ──────────────────────────────────────────────────────
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AuthButton }            from './components/AuthButton';
import { UpgradeModal }          from './components/UpgradeModal';
import type { Product }          from './components/UpgradeModal';
import { ProSuccessModal }       from './components/ProSuccessModal';
import { PricingModal }          from './components/PricingModal';
import { ProfilePage }           from './components/ProfilePage';

// ── Error boundary ────────────────────────────────────────────────────────────
class SafeComponentBridge extends Component<
  { target: React.ComponentType<LabProps>; name: string; isDarkMode: boolean; isPro?: boolean; hasExam?: boolean; onUpgrade?: () => void },
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
    return <C isDarkMode={this.props.isDarkMode} isPro={this.props.isPro} hasExam={this.props.hasExam} onUpgrade={this.props.onUpgrade} />;
  }
}

// ── Registry ──────────────────────────────────────────────────────────────────
type Difficulty = 'beginner' | 'intermediate' | 'advanced';
interface Tool { id:string; label:string; component:ReturnType<typeof lazy>; name:string; premium?:true; difficulty?:Difficulty; }
interface Category { catId:string; catLabel:string; tools:Tool[]; }
const diffColor = (d?:Difficulty) => d === 'beginner' ? '#3fb950' : d === 'intermediate' ? '#d29922' : d === 'advanced' ? '#f85149' : 'transparent';

const REGISTRY: Category[] = [
  { catId:'fundamentals', catLabel:'Fundamentals', tools:[
    { id:'osiModel',        label:'The OSI 7-Layer Model',       component:OsiModelLazy,        name:'OsiModel',           difficulty:'beginner' },
    { id:'topologyLab',     label:'Network Topologies',          component:TopologyLabLazy,     name:'TopologyLab',        difficulty:'beginner' },
    { id:'csmaLab',         label:'Access Control (CSMA/CD)',    component:CsmaLabLazy,         name:'CsmaLab',            difficulty:'beginner' },
    { id:'cableLab',        label:'Cables & Hardware',           component:CableLabLazy,        name:'CableLab',           difficulty:'beginner' },
    { id:'arpLab',          label:'Address Resolution (ARP)',    component:ArpLabLazy,          name:'ArpLab',             difficulty:'beginner' },
    { id:'netServices',     label:'Network Services (DHCP/DNS)', component:NetServicesLabLazy,  name:'NetServicesLab',     difficulty:'beginner' },
    { id:'dnsLab',          label:'DNS Resolution Visualiser',   component:DnsLabLazy,          name:'DnsLab',             difficulty:'intermediate' },
    { id:'headerInspector', label:'Packets vs. Frames',          component:HeaderInspectorLazy, name:'HeaderInspector',    difficulty:'beginner' },
    { id:'protocolMapper',  label:'Protocol Data Units',         component:ProtocolMapperLazy,  name:'ProtocolMapper',     difficulty:'beginner' },
    { id:'icmpLab',         label:'How Ping Works (ICMP)',       component:IcmpLabLazy,         name:'IcmpLab',            difficulty:'beginner' },
    { id:'tcpLab',          label:'TCP Connection Lifecycle',    component:TcpLabLazy,          name:'TcpLab',             difficulty:'intermediate' },
    { id:'wirelessToWired', label:'Wireless-to-Wired Path',      component:WirelessToWiredLazy, name:'WirelessToWiredLab', difficulty:'intermediate' },
  ]},
  { catId:'subnetting', catLabel:'Subnetting', tools:[
    { id:'calculator', label:'IP Subnet Calculator',   component:SubnetCalcLazy,    name:'SubnetCalculator', difficulty:'beginner' },
    { id:'splitter',   label:'VLSM Planner',           component:SubnetSplitterLazy,name:'SubnetSplitter',   difficulty:'intermediate' },
    { id:'ipv6Suite',  label:'IPv6 Address Basics',    component:Ipv6SuiteLazy,     name:'Ipv6Suite',        difficulty:'intermediate' },
    { id:'cheatsheet', label:'Subnetting Quick Sheet', component:SubnetCheatLazy,   name:'SubnetCheatSheet', difficulty:'beginner' },
  ]},
  { catId:'switching', catLabel:'Switching', tools:[
    { id:'switchIntro',     label:'What is a Switch?',           component:SwitchIntroLazy,   name:'SwitchIntro',         difficulty:'beginner' },
    { id:'macLab',          label:'MAC Learning & Forwarding',   component:MacLabLazy,        name:'MacLab',              difficulty:'beginner' },
    { id:'vlanMap',         label:'VLAN Configuration',          component:VlanSuiteLazy,     name:'VlanSuite',           difficulty:'intermediate', premium:true },
    { id:'stpLab',          label:'Spanning Tree Protocol',      component:StpLabLazy,        name:'StpLab',              difficulty:'intermediate' },
    { id:'linkAggregation', label:'Link Aggregation',            component:LinkAggLabLazy,    name:'LinkAggregationLab',  difficulty:'intermediate' },
    { id:'dot1xLab',        label:'802.1X Network Access Control', component:Dot1xLabLazy,    name:'Dot1xLab',            difficulty:'advanced', premium:true },
  ]},
  { catId:'routing', catLabel:'Routing', tools:[
    { id:'routerIntro', label:'What is a Router?',        component:RouterIntroLazy,   name:'RouterIntro',      difficulty:'beginner' },
    { id:'gatewayLab',  label:'Gateway & Backup Routes',  component:GatewayLabLazy,    name:'GatewayLab',       difficulty:'beginner' },
    { id:'lpmSim',      label:'Longest Prefix Match',     component:LpmSimLazy,        name:'LpmSimulator',     difficulty:'intermediate' },
    { id:'natLab',      label:'NAT / PAT Simulator',      component:NatLabLazy,        name:'NatLab',           difficulty:'intermediate' },
    { id:'dynamicLab',  label:'Routing Protocols Matrix', component:DynamicRoutingLazy,name:'DynamicRoutingLab',difficulty:'intermediate' },
    { id:'ospfLab',     label:'OSPF Visualiser',          component:OspfLabLazy,       name:'OspfLab',          difficulty:'advanced', premium:true },
    { id:'qosLab',      label:'QoS Traffic Management',   component:QosLabLazy,        name:'QosLab',           difficulty:'advanced', premium:true },
    { id:'ipsecLab',    label:'IPsec / WireGuard VPN',    component:IpsecLabLazy,      name:'IpsecLab',         difficulty:'advanced', premium:true },
  ]},
  { catId:'wireless', catLabel:'Wireless', tools:[
    { id:'wirelessIntro', label:'What is Wireless?',    component:WirelessIntroLazy,  name:'WirelessIntro',  difficulty:'beginner' },
    { id:'wifi',        label:'Wi-Fi Spectrum Analyser', component:WifiAnalyzerLazy,   name:'WifiAnalyzer',   difficulty:'intermediate', premium:true },
    { id:'roaming',     label:'Cell Overlap & Roaming', component:WifiRoamingLazy,    name:'WifiRoamingLab', difficulty:'intermediate' },
    { id:'beamforming', label:'Beamforming',            component:WifiBeamformingLazy,name:'WifiBeamforming',difficulty:'intermediate' },
    { id:'security',    label:'Wi-Fi Security (WPA)',   component:WifiSecurityLazy,   name:'WifiSecurity',   difficulty:'intermediate' },
    { id:'standards',   label:'802.11 Standards',       component:WifiStandardsLazy,  name:'WifiStandards',  difficulty:'beginner' },
  ]},
  { catId:'security', catLabel:'Security', tools:[
    { id:'layer2',       label:'Layer 2 Attack Mitigation',   component:Layer2SecurityLazy, name:'Layer2SecurityLab', difficulty:'advanced',     premium:true },
    { id:'aclLab',       label:'ACL Rules Simulator',         component:AclLabLazy,         name:'AclLab',            difficulty:'intermediate' },
    { id:'tlsLab',       label:'TLS Handshake Visualiser',    component:TlsLabLazy,         name:'TlsLab',            difficulty:'intermediate' },
    { id:'firewallLab',  label:'Firewall Zone Policy',        component:FirewallLabLazy,    name:'FirewallLab',       difficulty:'advanced',     premium:true },
    { id:'pkiLab',       label:'PKI & Certificate Chain',     component:PkiLabLazy,         name:'PkiLab',            difficulty:'advanced',     premium:true },
    { id:'forensicsLab', label:'Network Forensics',           component:ForensicsLabLazy,   name:'ForensicsLab',      difficulty:'advanced',     premium:true },
    { id:'phishingSim',  label:'Phishing Simulator',          component:PhishingSimLazy,    name:'PhishingSim',       difficulty:'advanced',     premium:true },
    { id:'arpMitm',      label:'ARP Poisoning / MITM',        component:ArpMitmLazy,        name:'ArpMitm',           difficulty:'advanced',     premium:true },
  ]},
  { catId:'powershell', catLabel:'PowerShell', tools:[
    { id:'cheatsheet', label:'Diagnostics Command Matrix', component:PowerShellLazy, name:'PowerShellCheatsheet', difficulty:'beginner' },
  ]},
  { catId:'training', catLabel:'Training', tools:[
    { id:'practice', label:'Exam Practice Sandbox', component:PracticeStationLazy, name:'PracticeStation', difficulty:'intermediate' },
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

// ── Premium teaser component ──────────────────────────────────────────────────
function PremiumTeaser({ label, onUnlock, T, children }: { label:string; onUnlock:()=>void; T:typeof THEME.dark; children: ReactNode }) {
  const isDark = T.appBg === '#0d1117';
  return (
    <div style={{ position:'relative' }}>
      <style>{`
        @keyframes pt-lock { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-3px)} }
        @keyframes pt-in { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:none} }
      `}</style>
      {/* Blurred preview of the actual lab */}
      <div style={{ filter:'blur(4px)', pointerEvents:'none', userSelect:'none', maxHeight:360, overflow:'hidden', opacity:0.5 }}>
        {children}
      </div>
      {/* Gradient fade-out */}
      <div style={{ position:'absolute', top:0, left:0, right:0, height:360, background:`linear-gradient(to bottom, transparent 15%, ${T.appBg} 68%)`, pointerEvents:'none' }} />
      {/* Upgrade card */}
      <div style={{ position:'relative', zIndex:1, marginTop:-120, display:'flex', justifyContent:'center', padding:'0 1rem 2rem', animation:'pt-in 0.35s ease-out' }}>
        <div style={{ background: isDark ? '#161b22' : '#ffffff', border:`1px solid ${isDark ? '#30363d' : '#d0d7de'}`, borderRadius:18, padding:'1.75rem 2rem', maxWidth:420, width:'100%', textAlign:'center', boxShadow:`0 16px 48px rgba(0,0,0,${isDark ? 0.5 : 0.12})` }}>
          <div style={{ width:52, height:52, borderRadius:'50%', background:`linear-gradient(135deg,${T.accent}20,${T.accent}08)`, border:`2px solid ${T.accent}50`, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 1.25rem', animation:'pt-lock 2s ease-in-out infinite' }}>
            <span style={{ fontSize:'1.25rem' }}>🔒</span>
          </div>
          <div style={{ marginBottom:'0.65rem' }}>
            <span style={{ fontSize:'0.6rem', fontWeight:800, letterSpacing:'0.1em', padding:'3px 10px', borderRadius:20, background:'linear-gradient(135deg,#4493f8,#a855f7)', color:'#fff' }}>LABS PRO</span>
          </div>
          <h3 style={{ margin:'0 0 0.5rem', fontSize:'1.05rem', fontWeight:800, color:T.textPrimary, letterSpacing:'-0.01em' }}>{label}</h3>
          <p style={{ margin:'0 0 1.25rem', fontSize:'0.8rem', color:T.textMuted, lineHeight:1.6 }}>
            This is a premium lab covering advanced enterprise concepts. Unlock <strong style={{ color:T.textPrimary }}>all</strong> current and future Pro labs — one-time payment, permanent access.
          </p>
          <button onClick={onUnlock} style={{ display:'block', width:'100%', padding:'0.8rem', borderRadius:10, border:'none', background:'linear-gradient(135deg,#4493f8,#2563eb)', color:'#fff', fontWeight:700, fontSize:'0.9rem', cursor:'pointer', marginBottom:'0.6rem', fontFamily:'inherit', boxShadow:'0 4px 14px rgba(68,147,248,0.4)' }}>
            Unlock Labs Pro — £5.99 →
          </button>
          <p style={{ margin:0, fontSize:'0.7rem', color:T.textMuted }}>
            Or get the <strong style={{ color:T.textPrimary }}>Full Bundle</strong> (Labs + Exam Prep) for £11.99 · One-time · No subscription
          </p>
        </div>
      </div>
    </div>
  );
}

// ── App ───────────────────────────────────────────────────────────────────────
function AppInner() {
  const { user, isPro: ctxIsPro, hasExam: ctxHasExam, refreshProfile, signInWithGoogle } = useAuth();
  const [activeCat,  setActiveCat]  = useState(() => { const u=new URLSearchParams(window.location.search).get('cat'); return REGISTRY.some(c=>c.catId===u)?u!:'fundamentals'; });
  const [activeTool, setActiveTool] = useState(() => { const u=new URLSearchParams(window.location.search).get('tool'); const c=REGISTRY.find(c=>c.catId===activeCat); return c?.tools.some(t=>t.id===u)?u!:c?.tools[0].id??''; });
  const [isDark,     setIsDark]     = useState(() => ls.get('netforge-theme','dark')==='dark');
  const [completed,  setCompleted]  = useState<Set<string>>(() => { try { const s=localStorage.getItem('netforge-progress'); return s?new Set(JSON.parse(s) as string[]):new Set(); } catch { return new Set(); } });
  const [isMobile,   setIsMobile]   = useState(() => window.innerWidth<768);
  const [sidebarOpen,setSidebarOpen]= useState(() => window.innerWidth>=768);
  const [collapsed,  setCollapsed]  = useState(() => ls.get('netforge-sidebar-collapsed','false')==='true');
  const [search,      setSearch]      = useState('');
  const [showUpgrade,     setShowUpgrade]     = useState(false);
  const [cookieDismissed, setCookieDismissed] = useState(() => ls.get('netforge-cookie-consent','') === 'yes');
  const [upgradeProduct,  setUpgradeProduct]  = useState<Product>('bundle');
  const [showPricing,     setShowPricing]     = useState(false);
  const [showProSuccess,  setShowProSuccess]  = useState(false);
  const [showProfile,     setShowProfile]     = useState(false);
  const [showSignIn,      setShowSignIn]      = useState(false);
  const [favourites,      setFavourites]      = useState<Set<string>>(() => { try { const s=localStorage.getItem('netforge-favs'); return s?new Set(JSON.parse(s) as string[]):new Set(); } catch { return new Set(); } });
  const [recentTools,     setRecentTools]     = useState<string[]>(() => { try { const s=localStorage.getItem('netforge-recent'); return s?JSON.parse(s) as string[]:[];  } catch { return []; } });
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
  useEffect(() => { try { localStorage.setItem('netforge-favs',   JSON.stringify([...favourites]));  } catch {} },[favourites]);
  useEffect(() => { try { localStorage.setItem('netforge-recent', JSON.stringify(recentTools));       } catch {} },[recentTools]);

  useEffect(() => {
    const cat=REGISTRY.find(c=>c.catId===activeCat);
    const tool=cat?.tools.find(t=>t.id===activeTool);
    document.title = tool?`${tool.label} | Netforge`:'Netforge';
    const url=new URL(window.location.href);
    url.searchParams.set('cat',activeCat); url.searchParams.set('tool',activeTool);
    url.searchParams.delete('payment'); url.searchParams.delete('ip'); url.searchParams.delete('cidr');
    window.history.pushState({},'',url.toString());
  },[activeCat,activeTool]);

  const toggleFavourite = (id:string) => setFavourites(prev => { const n=new Set(prev); n.has(id)?n.delete(id):n.add(id); return n; });

  const selectTool = (toolId:string, catId?:string) => {
    if(catId) setActiveCat(catId);
    setActiveTool(toolId);
    setSearch('');
    if(isMobile) setSidebarOpen(false);
    setRecentTools(prev => [toolId, ...prev.filter(id => id !== toolId)].slice(0, 3));
  };

  const selectCat = (catId:string) => {
    const cat=REGISTRY.find(c=>c.catId===catId);
    if(cat?.tools.length) { setActiveCat(catId); setActiveTool(cat.tools[0].id); }
  };

  const toggleDone = (id:string) => setCompleted(prev=>{ const n=new Set(prev); n.has(id)?n.delete(id):n.add(id); return n; });
  const unlockPremium = () => { if (!user) { setShowSignIn(true); return; } setShowUpgrade(true); };
  const buyProduct = (p: Product) => { setUpgradeProduct(p); if (!user) { setShowSignIn(true); return; } setShowUpgrade(true); };

  const T = isDark ? THEME.dark : THEME.light;
  const hasPremium = ctxIsPro;
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
            <>
              {/* Favourites */}
              {hasPremium && favourites.size > 0 && (
                <div style={{ marginBottom:'0.25rem' }}>
                  <div style={{ padding:'4px 14px 4px', fontSize:'0.6rem', fontWeight:700, color:'#d29922', textTransform:'uppercase', letterSpacing:'0.07em' }}>★ Favourites</div>
                  {ALL_TOOLS.filter(t=>favourites.has(t.id)).map(tool => {
                    const isActive = activeTool===tool.id;
                    return (
                      <button key={tool.id} onClick={()=>selectTool(tool.id,tool.catId)}
                        style={{ ...btnBase, width:'100%', textAlign:'left', padding:'0.32rem 0.6rem 0.32rem 1rem', borderLeft:`2px solid ${isActive?T.accent:'transparent'}`, backgroundColor:isActive?T.activeBg:'transparent', color:isActive?T.activeText:T.navText, fontSize:'0.78rem', lineHeight:1.4, display:'flex', alignItems:'center', justifyContent:'space-between', gap:6 }}>
                        <span style={{ flexGrow:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{tool.label}</span>
                        <span style={{ color:'#d29922', fontSize:'0.7rem', flexShrink:0 }}>★</span>
                      </button>
                    );
                  })}
                  <div style={{ height:1, background:T.border, margin:'4px 14px 2px' }} />
                </div>
              )}
              {/* Recent */}
              {recentTools.length > 0 && (
                <div style={{ marginBottom:'0.25rem' }}>
                  <div style={{ padding:'4px 14px 4px', fontSize:'0.6rem', fontWeight:700, color:T.textMuted, textTransform:'uppercase', letterSpacing:'0.07em' }}>Recent</div>
                  {recentTools.map(id => {
                    const tool = ALL_TOOLS.find(t=>t.id===id);
                    if (!tool) return null;
                    const isActive = activeTool===tool.id;
                    return (
                      <button key={id} onClick={()=>selectTool(id,tool.catId)}
                        style={{ ...btnBase, width:'100%', textAlign:'left', padding:'0.32rem 0.6rem 0.32rem 1rem', borderLeft:`2px solid ${isActive?T.accent:'transparent'}`, backgroundColor:isActive?T.activeBg:'transparent', color:isActive?T.activeText:T.navText, fontSize:'0.78rem', lineHeight:1.4, display:'flex', alignItems:'center', justifyContent:'space-between', gap:6 }}>
                        <span style={{ flexGrow:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{tool.label}</span>
                        <span style={{ fontSize:'0.6rem', color:T.textMuted, flexShrink:0 }}>↵</span>
                      </button>
                    );
                  })}
                  <div style={{ height:1, background:T.border, margin:'4px 14px 2px' }} />
                </div>
              )}
              {/* Accordion nav */}
              {REGISTRY.map(cat => {
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
                      const isLock   = !!tool.premium && !hasPremium;
                      const dc       = diffColor(tool.difficulty);
                      return (
                        <button key={tool.id} onClick={()=>selectTool(tool.id)}
                          style={{ ...btnBase, width:'100%', textAlign:'left', padding:'0.38rem 0.6rem 0.38rem 1.1rem', borderLeft:`2px solid ${isActive?T.accent:'transparent'}`, backgroundColor:isActive?T.activeBg:'transparent', color:isActive?T.activeText:T.navText, fontSize:'0.8rem', fontWeight:isActive?600:400, lineHeight:1.45, display:'flex', alignItems:'center', justifyContent:'space-between', gap:6 }}>
                          <span style={{ flexGrow:1 }}>{tool.label}</span>
                          <span style={{ display:'flex', alignItems:'center', gap:4, flexShrink:0 }}>
                            {tool.difficulty && hasPremium && <span style={{ fontSize:'0.5rem', fontWeight:800, color:dc, backgroundColor:`${dc}18`, padding:'1px 4px', borderRadius:4 }}>{tool.difficulty[0].toUpperCase()}</span>}
                            {isLock && <span style={{ fontSize:'0.55rem', fontWeight:700, color:T.accent, backgroundColor:`${T.accent}18`, padding:'1px 5px', borderRadius:6 }}>PRO</span>}
                            {toolDone && <span style={{ width:14, height:14, borderRadius:'50%', backgroundColor:'#3fb950', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'8px', color:'#fff', fontWeight:900, lineHeight:1 }}>✓</span>}
                            {hasPremium && favourites.has(tool.id) && <span style={{ fontSize:'0.65rem', color:'#d29922', lineHeight:1 }}>★</span>}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </>
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
          <div style={{ display:'flex', gap:'0.4rem', alignItems:'center' }}>
            <a href="https://buymeacoffee.com/netforgens" target="_blank" rel="noopener noreferrer" title="Buy me a coffee"
              style={{ display:'flex', alignItems:'center', justifyContent:'center', width:32, height:32, backgroundColor:'#ffdd00', border:'none', borderRadius:6, fontSize:'1rem', textDecoration:'none', cursor:'pointer' }}>
              ☕
            </a>
            {[
              { href: '#', title: 'X / Twitter',  icon: '𝕏',   bg: '#000',    fg: '#fff' },
              { href: '#', title: 'LinkedIn',      icon: 'in',  bg: '#0a66c2', fg: '#fff' },
              { href: '#', title: 'YouTube',       icon: '▶',   bg: '#ff0000', fg: '#fff' },
            ].map(s => (
              <a key={s.title} href={s.href} title={s.title} target="_blank" rel="noopener noreferrer"
                style={{ display:'flex', alignItems:'center', justifyContent:'center', width:32, height:32, background:s.bg, borderRadius:6, fontSize:'0.7rem', fontWeight:900, color:s.fg, textDecoration:'none', cursor:'pointer', fontFamily:'system-ui,sans-serif', letterSpacing:'-0.02em' }}>
                {s.icon}
              </a>
            ))}
          </div>
          <div style={{ display:'flex', gap:'0.75rem', justifyContent:'center', paddingTop:'0.25rem' }}>
            <a href="/" style={{ fontSize:'0.65rem', color:T.textMuted, textDecoration:'none' }}>Home</a>
            <span style={{ fontSize:'0.65rem', color:T.border }}>·</span>
            <a href="/privacy" style={{ fontSize:'0.65rem', color:T.textMuted, textDecoration:'none' }}>Privacy</a>
            <span style={{ fontSize:'0.65rem', color:T.border }}>·</span>
            <a href="/terms" style={{ fontSize:'0.65rem', color:T.textMuted, textDecoration:'none' }}>Terms</a>
          </div>
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
          {hasPremium && (
            <button
              onClick={() => toggleFavourite(selectedTool.id)}
              title={favourites.has(selectedTool.id) ? 'Remove from favourites' : 'Add to favourites'}
              style={{ ...btnBase, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, width:32, height:32, border:`1px solid ${favourites.has(selectedTool.id)?'#d29922':T.border}`, borderRadius:5, fontSize:'1rem', backgroundColor:favourites.has(selectedTool.id)?(isDark?'rgba(210,153,34,0.12)':'rgba(210,153,34,0.08)'):'transparent', color:favourites.has(selectedTool.id)?'#d29922':T.textMuted }}>
              {favourites.has(selectedTool.id) ? '★' : '☆'}
            </button>
          )}
          <button onClick={() => setShowPricing(true)} style={{ ...btnBase, padding:'0.28rem 0.7rem', borderRadius:6, border:`1px solid ${T.border}`, background:T.toggleBg, color:T.textMuted, fontSize:'0.73rem', fontWeight:600, flexShrink:0 }}>Pricing</button>
          <AuthButton T={T} onUpgrade={unlockPremium} onProfile={() => setShowProfile(true)} />
        </div>

        {/* Lab content */}
        <div style={{ flex:1, overflowY:'auto', padding:isMobile?'1rem':'1.5rem' }}>
          {isLocked ? (
            <PremiumTeaser label={selectedTool.label} onUnlock={unlockPremium} T={T}>
              <Suspense fallback={<div style={{ padding:'4rem', textAlign:'center', color:T.textMuted }}><p style={{ margin:0, fontSize:'0.85rem' }}>Loading...</p></div>}>
                <SafeComponentBridge key={selectedTool.id} target={selectedTool.component} name={selectedTool.name} isDarkMode={isDark} isPro={false} hasExam={false} onUpgrade={unlockPremium} />
              </Suspense>
            </PremiumTeaser>
          ) : (
            <Suspense fallback={<div style={{ padding:'4rem', textAlign:'center', color:T.textMuted }}><p style={{ margin:0, fontSize:'0.85rem' }}>Loading...</p></div>}>
              <SafeComponentBridge key={selectedTool.id} target={selectedTool.component} name={selectedTool.name} isDarkMode={isDark} isPro={hasPremium} hasExam={ctxHasExam} onUpgrade={unlockPremium} />
            </Suspense>
          )}
        </div>
      </div>
    </div>
    {showUpgrade    && <UpgradeModal    onClose={() => setShowUpgrade(false)}    T={T} defaultProduct={upgradeProduct} isPro={hasPremium} hasExam={ctxHasExam} />}
    {showPricing    && <PricingModal   onClose={() => setShowPricing(false)}    onBuy={buyProduct} isPro={hasPremium} hasExam={ctxHasExam} isLoggedIn={!!user} T={T} />}
    {showProSuccess && <ProSuccessModal onClose={() => setShowProSuccess(false)} T={T} />}
    {showProfile && user && <ProfilePage user={user} isPro={hasPremium} hasExam={ctxHasExam} completedLabs={completedLabs} totalLabs={totalLabs} onClose={() => setShowProfile(false)} onUpgrade={unlockPremium} T={T} />}
    {showSignIn && (
      <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.65)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999 }} onClick={() => setShowSignIn(false)}>
        <div style={{ background: isDark?'#161b22':'#ffffff', border:`1px solid ${T.border}`, borderRadius:14, padding:'2rem', maxWidth:360, width:'90%', textAlign:'center' }} onClick={e => e.stopPropagation()}>
          <div style={{ fontSize:'2rem', marginBottom:'0.75rem' }}>🔒</div>
          <h2 style={{ margin:'0 0 0.5rem', color:T.textPrimary, fontSize:'1.1rem', fontWeight:700 }}>Sign in to continue</h2>
          <p style={{ color:T.textMuted, fontSize:'0.83rem', margin:'0 0 1.5rem', lineHeight:1.6 }}>
            You need a free account to unlock NetForge Pro. Sign in with Google, then complete your purchase.
          </p>
          <button
            onClick={() => { setShowSignIn(false); void signInWithGoogle(); }}
            style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, width:'100%', padding:'0.7rem', borderRadius:8, border:`1px solid ${T.border}`, background:T.toggleBg, color:T.textPrimary, fontWeight:700, fontSize:'0.88rem', cursor:'pointer', fontFamily:'inherit' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            Continue with Google
          </button>
          <button onClick={() => setShowSignIn(false)} style={{ marginTop:'0.75rem', background:'none', border:'none', cursor:'pointer', color:T.textMuted, fontSize:'0.78rem', textDecoration:'underline', fontFamily:'inherit' }}>Cancel</button>
        </div>
      </div>
    )}

    {/* ── Cookie banner ── */}
    {!cookieDismissed && (
      <div style={{ position:'fixed', bottom:0, left:0, right:0, zIndex:9999, padding:'0.85rem 1.25rem', background: isDark ? '#161b22' : '#ffffff', borderTop:`1px solid ${T.border}`, display:'flex', alignItems:'center', gap:'1rem', flexWrap:'wrap', fontFamily:'system-ui,-apple-system,sans-serif', boxShadow:'0 -4px 24px rgba(0,0,0,0.25)' }}>
        <span style={{ flex:1, fontSize:'0.78rem', color:T.textMuted, lineHeight:1.6, minWidth:220 }}>
          🍪 We use an authentication session cookie and localStorage to save your progress and theme. No tracking or advertising cookies. <a href="/privacy" style={{ color:T.accent, textDecoration:'none' }}>Privacy Policy</a>
        </span>
        <button onClick={() => { ls.set('netforge-cookie-consent','yes'); setCookieDismissed(true); }}
          style={{ padding:'0.45rem 1.25rem', background:T.accent, color:'#fff', border:'none', borderRadius:8, fontWeight:700, fontSize:'0.8rem', cursor:'pointer', fontFamily:'inherit', whiteSpace:'nowrap', flexShrink:0 }}>
          Got it
        </button>
      </div>
    )}
    </>
  );
}

export default function App() {
  const path = window.location.pathname;
  if (path === '/app' || path.startsWith('/app/')) return <AuthProvider><AppInner /></AuthProvider>;
  const Page = PAGE_ROUTES[path] ?? NotFoundLazy;
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#0d1117' }} />}>
      <Page />
    </Suspense>
  );
}
