import { useState, useEffect, Component, lazy, Suspense } from 'react';

// Lazy-loads a lab module that may use a default or named export.
const lazyLab = (loader: () => Promise<Record<string, unknown>>, name: string) =>
  lazy(() => loader().then(m => ({ default: (m.default ?? m[name] ?? Object.values(m)[0]) as React.ComponentType<{ isDarkMode: boolean }> })));

// ==========================================
// 1. LAZY-LOADED LAB REGISTRY
// ==========================================
const OsiModelLazy          = lazyLab(() => import('./OsiModel'),             'OsiModel');
const HeaderInspectorLazy   = lazyLab(() => import('./HeaderInspector'),      'HeaderInspector');
const ProtocolMapperLazy    = lazyLab(() => import('./ProtocolMapper'),       'ProtocolMapper');
const TopologyLabLazy       = lazyLab(() => import('./TopologyLab'),          'TopologyLab');
const CsmaLabLazy           = lazyLab(() => import('./CsmaLab'),              'CsmaLab');
const CableLabLazy          = lazyLab(() => import('./CableLab'),             'CableLab');
const IcmpLabLazy           = lazyLab(() => import('./IcmpLab'),              'IcmpLab');
const ArpLabLazy            = lazyLab(() => import('./ArpLab'),               'ArpLab');
const NetServicesLabLazy    = lazyLab(() => import('./NetServicesLab'),       'NetServicesLab');
const WirelessToWiredLazy   = lazyLab(() => import('./WirelessToWiredLab'),   'WirelessToWiredLab');
const SubnetCalculatorLazy  = lazyLab(() => import('./SubnetCalculator'),     'SubnetCalculator');
const SubnetSplitterLazy    = lazyLab(() => import('./SubnetSplitter'),       'SubnetSplitter');
const Ipv6SuiteLazy         = lazyLab(() => import('./Ipv6Suite'),            'Ipv6Suite');
const SubnetCheatSheetLazy  = lazyLab(() => import('./SubnetCheatSheet'),     'SubnetCheatSheet');
const VlanSuiteLazy         = lazyLab(() => import('./VlanSuite'),            'VlanSuite');
const LinkAggLabLazy        = lazyLab(() => import('./LinkAggregationLab'),   'LinkAggregationLab');
const StpLabLazy            = lazyLab(() => import('./StpLab'),               'StpLab');
const WifiAnalyzerLazy      = lazyLab(() => import('./WifiAnalyzer'),         'WifiAnalyzer');
const WifiRoamingLazy       = lazyLab(() => import('./WifiRoamingLab'),       'WifiRoamingLab');
const WifiBeamformingLazy   = lazyLab(() => import('./WifiBeamforming'),      'WifiBeamforming');
const WifiSecurityLazy      = lazyLab(() => import('./WifiSecurity'),         'WifiSecurity');
const WifiStandardsLazy     = lazyLab(() => import('./WifiStandards'),        'WifiStandards');
const Layer2SecurityLazy    = lazyLab(() => import('./Layer2SecurityLab'),    'Layer2SecurityLab');
const AclLabLazy            = lazyLab(() => import('./AclLab'),               'AclLab');
const LpmSimulatorLazy      = lazyLab(() => import('./LpmSimulator'),         'LpmSimulator');
const GatewayLabLazy        = lazyLab(() => import('./GatewayLab'),           'GatewayLab');
const DynamicRoutingLazy    = lazyLab(() => import('./DynamicRoutingLab'),    'DynamicRoutingLab');
const PowerShellLazy        = lazyLab(() => import('./PowerShellCheatsheet'), 'PowerShellCheatsheet');
const PracticeStationLazy   = lazyLab(() => import('./PracticeStation'),      'PracticeStation');

// ==========================================
// 2. DEFENSIVE FAIL-SAFE WRAPPER ENGINE
// ==========================================
class SafeComponentBridge extends Component<
  { target: React.ComponentType<{ isDarkMode: boolean }>; name: string; isDarkMode: boolean },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error: unknown, errorInfo: unknown) {
    console.error(`Lab module [${this.props.name}] failed to mount:`, error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', backgroundColor: '#1e1b4b', borderRadius: '10px', border: '1px dashed #6366f1', color: '#f8fafc' }}>
          <h4 style={{ margin: '0 0 6px', color: '#f43f5e', fontSize: '0.95rem' }}>Module failed to load</h4>
          <p style={{ margin: 0, fontSize: '0.82rem', color: '#cbd5e1', lineHeight: 1.5 }}>
            <strong>{this.props.name}</strong> could not be mounted. Check the browser console for details.
          </p>
        </div>
      );
    }
    const Target = this.props.target;
    return <Target isDarkMode={this.props.isDarkMode} />;
  }
}

// ==========================================
// 3. WORKSPACE REGISTRY
// ==========================================
const WORKSPACE_REGISTRY = [
  {
    catId: 'fundamentals', catLabel: 'Fundamentals',
    tools: [
      { id: 'osiModel',        label: 'The OSI 7-Layer Model',       component: OsiModelLazy,        name: 'OsiModel' },
      { id: 'topologyLab',     label: 'Network Topologies',          component: TopologyLabLazy,     name: 'TopologyLab' },
      { id: 'csmaLab',         label: 'Access Control (CSMA/CD)',    component: CsmaLabLazy,         name: 'CsmaLab' },
      { id: 'cableLab',        label: 'Cables & Hardware',           component: CableLabLazy,        name: 'CableLab' },
      { id: 'arpLab',          label: 'Address Resolution (ARP)',    component: ArpLabLazy,          name: 'ArpLab' },
      { id: 'netServices',     label: 'Network Services (DHCP/DNS)', component: NetServicesLabLazy,  name: 'NetServicesLab' },
      { id: 'headerInspector', label: 'Packets vs. Frames',         component: HeaderInspectorLazy, name: 'HeaderInspector' },
      { id: 'protocolMapper',  label: 'Protocol Data Units',        component: ProtocolMapperLazy,  name: 'ProtocolMapper' },
      { id: 'icmpLab',         label: 'How Ping Works (ICMP)',      component: IcmpLabLazy,         name: 'IcmpLab' },
      { id: 'wirelessToWired', label: 'Wireless-to-Wired Path',     component: WirelessToWiredLazy, name: 'WirelessToWiredLab' },
    ]
  },
  {
    catId: 'switching', catLabel: 'Switching',
    tools: [
      { id: 'vlanMap',         label: 'VLAN Configuration',          component: VlanSuiteLazy,    name: 'VlanSuite' },
      { id: 'linkAggregation', label: 'Link Aggregation',            component: LinkAggLabLazy,   name: 'LinkAggregationLab' },
      { id: 'stpLab',          label: 'Spanning Tree Protocol',      component: StpLabLazy,       name: 'StpLab' },
    ]
  },
  {
    catId: 'subnetting', catLabel: 'Subnetting',
    tools: [
      { id: 'calculator', label: 'IP Subnet Calculator',    component: SubnetCalculatorLazy,  name: 'SubnetCalculator' },
      { id: 'splitter',   label: 'VLSM Planner',            component: SubnetSplitterLazy,   name: 'SubnetSplitter' },
      { id: 'ipv6Suite',  label: 'IPv6 Address Basics',     component: Ipv6SuiteLazy,        name: 'Ipv6Suite' },
      { id: 'cheatsheet', label: 'Subnetting Quick Sheet',  component: SubnetCheatSheetLazy, name: 'SubnetCheatSheet' },
    ]
  },
  {
    catId: 'routing', catLabel: 'Routing',
    tools: [
      { id: 'lpmSim',     label: 'Longest Prefix Match',     component: LpmSimulatorLazy,   name: 'LpmSimulator' },
      { id: 'gatewayLab', label: 'Gateway & Backup Routes',  component: GatewayLabLazy,     name: 'GatewayLab' },
      { id: 'dynamicLab', label: 'Routing Protocols Matrix', component: DynamicRoutingLazy, name: 'DynamicRoutingLab' },
    ]
  },
  {
    catId: 'wireless', catLabel: 'Wireless',
    tools: [
      { id: 'wifi',        label: 'Wi-Fi Signal Analyser',  component: WifiAnalyzerLazy,    name: 'WifiAnalyzer' },
      { id: 'roaming',     label: 'Cell Overlap & Roaming', component: WifiRoamingLazy,     name: 'WifiRoamingLab' },
      { id: 'beamforming', label: 'Beamforming',            component: WifiBeamformingLazy, name: 'WifiBeamforming' },
      { id: 'security',    label: 'Wi-Fi Security (WPA)',   component: WifiSecurityLazy,    name: 'WifiSecurity' },
      { id: 'standards',   label: '802.11 Standards',       component: WifiStandardsLazy,   name: 'WifiStandards' },
    ]
  },
  {
    catId: 'security', catLabel: 'Security',
    tools: [
      { id: 'layer2', label: 'Layer 2 Attack Mitigation', component: Layer2SecurityLazy, name: 'Layer2SecurityLab' },
      { id: 'aclLab', label: 'ACL Rules Simulator',       component: AclLabLazy,         name: 'AclLab' },
    ]
  },
  {
    catId: 'powershell', catLabel: 'PowerShell',
    tools: [
      { id: 'cheatsheet', label: 'Diagnostics Command Matrix', component: PowerShellLazy, name: 'PowerShellCheatsheet' },
    ]
  },
  {
    catId: 'training', catLabel: 'Training',
    tools: [
      { id: 'practice', label: 'Exam Practice Sandbox', component: PracticeStationLazy, name: 'PracticeStation' },
    ]
  }
];

// ==========================================
// 4. THEME
// ==========================================
const THEME = {
  dark: {
    appBg:       '#0d1117',
    sidebarBg:   '#010409',
    headerBg:    '#0d1117',
    border:      '#21262d',
    textPrimary: '#e6edf3',
    textMuted:   '#8b949e',
    navText:     '#7d8590',
    activeText:  '#e6edf3',
    activeBg:    '#1c2128',
    accent:      '#4493f8',
    toggleBg:    '#161b22',
  },
  light: {
    appBg:       '#f6f8fa',
    sidebarBg:   '#ffffff',
    headerBg:    '#ffffff',
    border:      '#d0d7de',
    textPrimary: '#1f2328',
    textMuted:   '#636c76',
    navText:     '#59636e',
    activeText:  '#0969da',
    activeBg:    '#ddf4ff',
    accent:      '#0969da',
    toggleBg:    '#f6f8fa',
  },
};

export default function App() {
  const [activeCategory, setActiveCategory] = useState<string>(() => {
    const params = new URLSearchParams(window.location.search);
    const urlCat = params.get('cat');
    return WORKSPACE_REGISTRY.some(c => c.catId === urlCat) ? urlCat! : 'fundamentals';
  });

  const [activeTool, setActiveTool] = useState<string>(() => {
    const params = new URLSearchParams(window.location.search);
    const urlTool = params.get('tool');
    const cat = WORKSPACE_REGISTRY.find(c => c.catId === activeCategory);
    return cat?.tools.some(t => t.id === urlTool) ? urlTool! : cat?.tools[0].id ?? '';
  });

  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('netforge-theme');
      return saved !== null ? saved === 'dark' : true;
    } catch { return true; }
  });

  useEffect(() => {
    try { localStorage.setItem('netforge-theme', isDarkMode ? 'dark' : 'light'); }
    catch { /* storage unavailable */ }
  }, [isDarkMode]);

  useEffect(() => {
    const cat = WORKSPACE_REGISTRY.find(c => c.catId === activeCategory);
    const tool = cat?.tools.find(t => t.id === activeTool);
    document.title = tool ? `${tool.label} | Netforge` : 'Netforge';
    const url = new URL(window.location.href);
    url.searchParams.set('cat', activeCategory);
    url.searchParams.set('tool', activeTool);
    window.history.pushState({}, '', url.toString());
  }, [activeCategory, activeTool]);

  const handleCategoryChange = (catId: string) => {
    const cat = WORKSPACE_REGISTRY.find(c => c.catId === catId);
    if (cat && cat.tools.length > 0) {
      setActiveCategory(catId);
      setActiveTool(cat.tools[0].id);
    }
  };

  const T = isDarkMode ? THEME.dark : THEME.light;
  const currentCat = WORKSPACE_REGISTRY.find(c => c.catId === activeCategory) ?? WORKSPACE_REGISTRY[0];
  const selectedTool = currentCat.tools.find(t => t.id === activeTool) ?? currentCat.tools[0];

  const sidebarItemBase: React.CSSProperties = {
    width: '100%', display: 'block', background: 'none', border: 'none',
    cursor: 'pointer', textAlign: 'left', transition: 'all 0.12s',
  };

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', backgroundColor: T.appBg, fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif' }}>

      {/* ── SIDEBAR ── */}
      <aside style={{ width: 232, flexShrink: 0, display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: T.sidebarBg, borderRight: `1px solid ${T.border}` }}>

        {/* Logo */}
        <div style={{ padding: '1.1rem 1rem 1rem', borderBottom: `1px solid ${T.border}`, flexShrink: 0 }}>
          <div style={{ fontSize: '1rem', fontWeight: 800, letterSpacing: '-0.02em', color: T.textPrimary, lineHeight: 1 }}>
            NET<span style={{ color: T.accent }}>FORGE</span>
          </div>
          <div style={{ fontSize: '0.65rem', color: T.textMuted, marginTop: '4px', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 600 }}>
            Network Training Suite
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, overflowY: 'auto', padding: '0.75rem 0' }}>
          {WORKSPACE_REGISTRY.map(cat => {
            const isOpen = activeCategory === cat.catId;
            return (
              <div key={cat.catId} style={{ marginBottom: '0.25rem' }}>

                <button
                  onClick={() => handleCategoryChange(cat.catId)}
                  style={{
                    ...sidebarItemBase,
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '0.35rem 0.875rem',
                    color: isOpen ? T.textPrimary : T.textMuted,
                    fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase',
                  }}
                >
                  {cat.catLabel}
                  <span style={{ fontSize: '0.5rem', opacity: 0.5 }}>{isOpen ? '▲' : '▼'}</span>
                </button>

                {isOpen && (
                  <div>
                    {cat.tools.map(tool => {
                      const isActive = activeTool === tool.id;
                      return (
                        <button
                          key={tool.id}
                          onClick={() => setActiveTool(tool.id)}
                          style={{
                            ...sidebarItemBase,
                            padding: '0.38rem 0.875rem 0.38rem 1.1rem',
                            borderLeft: `2px solid ${isActive ? T.accent : 'transparent'}`,
                            backgroundColor: isActive ? T.activeBg : 'transparent',
                            color: isActive ? T.activeText : T.navText,
                            fontSize: '0.8rem', fontWeight: isActive ? 600 : 400,
                            lineHeight: 1.45,
                          }}
                        >
                          {tool.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Theme toggle */}
        <div style={{ padding: '0.75rem 0.875rem', borderTop: `1px solid ${T.border}`, flexShrink: 0 }}>
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            style={{
              ...sidebarItemBase,
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.45rem 0.6rem',
              backgroundColor: T.toggleBg, border: `1px solid ${T.border}`,
              borderRadius: '6px', color: T.textMuted, fontSize: '0.78rem', fontWeight: 500,
            }}
          >
            <span>{isDarkMode ? '☀️' : '🌙'}</span>
            <span>{isDarkMode ? 'Light mode' : 'Dark mode'}</span>
          </button>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', minWidth: 0 }}>

        {/* Breadcrumb bar */}
        <div style={{
          backgroundColor: T.headerBg, borderBottom: `1px solid ${T.border}`,
          padding: '0.7rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem',
          fontSize: '0.78rem', flexShrink: 0,
        }}>
          <span style={{ color: T.textMuted, fontWeight: 500 }}>{currentCat.catLabel}</span>
          <span style={{ color: T.border, fontSize: '1rem', lineHeight: 1 }}>›</span>
          <span style={{ color: T.textPrimary, fontWeight: 600 }}>{selectedTool.label}</span>
        </div>

        {/* Lab content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
          <Suspense fallback={
            <div style={{ padding: '4rem', textAlign: 'center', color: T.textMuted }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>⚡</div>
              <p style={{ margin: 0, fontSize: '0.85rem' }}>Loading lab module...</p>
            </div>
          }>
            <SafeComponentBridge
              key={selectedTool.id}
              target={selectedTool.component}
              name={selectedTool.name}
              isDarkMode={isDarkMode}
            />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
