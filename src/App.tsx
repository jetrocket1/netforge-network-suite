import { useState, useEffect, Component, lazy, Suspense } from 'react';

// Lazy-loads a lab module that may use a default or named export.
// Each import() call becomes its own bundle chunk — only downloaded on first visit.
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
class SafeComponentBridge extends Component<{ target: React.ComponentType<{ isDarkMode: boolean }>; name: string; isDarkMode: boolean }, { hasError: boolean }> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error: unknown, errorInfo: unknown) {
    console.error(`Fault detected inside laboratory module [${this.props.name}]:`, error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2.5rem', backgroundColor: '#1e1b4b', borderRadius: '12px', border: '1px dashed #6366f1', color: '#f8fafc' }}>
          <h4 style={{ margin: '0 0 6px 0', color: '#f43f5e' }}>🛑 Lab Integration Fault Detect Loop</h4>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#cbd5e1', lineHeight: '1.5' }}>
            The module <strong>{this.props.name}</strong> failed to mount. Verify whether this file uses a <code>named export</code> or a <code>default export</code> match inside its export block structure.
          </p>
        </div>
      );
    }
    const Target = this.props.target;
    return <Target isDarkMode={this.props.isDarkMode} />;
  }
}

// ==========================================
// 3. LOGICALLY ORDERED WORKSPACE REGISTRY
// ==========================================
const WORKSPACE_REGISTRY = [
  {
    catId: 'fundamentals',
    catLabel: '📚 Fundamentals',
    tools: [
      { id: 'osiModel',        label: '🔍 The 7-Layer Model',            component: OsiModelLazy,        name: 'OsiModel' },
      { id: 'topologyLab',     label: '🕸️ Network Topologies',           component: TopologyLabLazy,     name: 'TopologyLab' },
      { id: 'csmaLab',         label: '🚦 Access Control (CSMA)',         component: CsmaLabLazy,         name: 'CsmaLab' },
      { id: 'cableLab',        label: '🔌 Cables & Hardware',             component: CableLabLazy,        name: 'CableLab' },
      { id: 'arpLab',          label: '📡 Address Resolution (ARP)',      component: ArpLabLazy,          name: 'ArpLab' },
      { id: 'netServices',     label: '⚙️ Network Services (DHCP/DNS)',   component: NetServicesLabLazy,  name: 'NetServicesLab' },
      { id: 'headerInspector', label: '🔄 Packets vs. Frames',           component: HeaderInspectorLazy, name: 'HeaderInspector' },
      { id: 'protocolMapper',  label: '🔄 Protocol Data Units',          component: ProtocolMapperLazy,  name: 'ProtocolMapper' },
      { id: 'icmpLab',         label: '🛰️ How Ping Works',               component: IcmpLabLazy,         name: 'IcmpLab' },
      { id: 'wirelessToWired', label: '🔌 Wireless-to-Wired Path',       component: WirelessToWiredLazy, name: 'WirelessToWiredLab' },
    ]
  },
  {
    catId: 'switching',
    catLabel: '🔌 Switching',
    tools: [
      { id: 'vlanMap',         label: '⚙️ VLAN Console & Ports',         component: VlanSuiteLazy,    name: 'VlanSuite' },
      { id: 'linkAggregation', label: '⛓️ Combining Switch Links',        component: LinkAggLabLazy,   name: 'LinkAggregationLab' },
      { id: 'stpLab',          label: '🌲 Spanning Tree Protocol (STP)', component: StpLabLazy,       name: 'StpLab' },
    ]
  },
  {
    catId: 'subnetting',
    catLabel: '⚡ Subnetting',
    tools: [
      { id: 'calculator', label: '🌐 IP Subnet Calculator',         component: SubnetCalculatorLazy, name: 'SubnetCalculator' },
      { id: 'splitter',   label: '✂️ Variable Length Masks (VLSM)', component: SubnetSplitterLazy,  name: 'SubnetSplitter' },
      { id: 'ipv6Suite',  label: '🌐 IPv6 Address Basics',          component: Ipv6SuiteLazy,       name: 'Ipv6Suite' },
      { id: 'cheatsheet', label: '📋 Subnetting Quick Sheet',       component: SubnetCheatSheetLazy, name: 'SubnetCheatSheet' },
    ]
  },
  {
    catId: 'routing',
    catLabel: '🚦 Routing',
    tools: [
      { id: 'lpmSim',     label: '🎯 How Routers Choose Paths',    component: LpmSimulatorLazy,  name: 'LpmSimulator' },
      { id: 'gatewayLab', label: '🎛️ Smart Backup Routes',         component: GatewayLabLazy,    name: 'GatewayLab' },
      { id: 'dynamicLab', label: '🚦 Routing Fundamentals Matrix', component: DynamicRoutingLazy, name: 'DynamicRoutingLab' },
    ]
  },
  {
    catId: 'wireless',
    catLabel: '📶 Wireless',
    tools: [
      { id: 'wifi',        label: '📊 Wi-Fi Signal Graph',       component: WifiAnalyzerLazy,    name: 'WifiAnalyzer' },
      { id: 'roaming',     label: '🔄 Cell Overlap & Roaming',   component: WifiRoamingLazy,     name: 'WifiRoamingLab' },
      { id: 'beamforming', label: '🎯 Focusing Wireless Signals', component: WifiBeamformingLazy, name: 'WifiBeamforming' },
      { id: 'security',    label: '🔒 Wi-Fi Security (WPA)',      component: WifiSecurityLazy,    name: 'WifiSecurity' },
      { id: 'standards',   label: '📚 Wireless Standards',        component: WifiStandardsLazy,   name: 'WifiStandards' },
    ]
  },
  {
    catId: 'security',
    catLabel: '🔒 Security',
    tools: [
      { id: 'layer2', label: '🛡️ Layer 2 Mitigation',  component: Layer2SecurityLazy, name: 'Layer2SecurityLab' },
      { id: 'aclLab', label: '🛡️ ACL Rules Simulator', component: AclLabLazy,         name: 'AclLab' },
    ]
  },
  {
    catId: 'powershell',
    catLabel: '📟 PowerShell',
    tools: [
      { id: 'cheatsheet', label: '📋 Systems & Diagnostics Matrix', component: PowerShellLazy, name: 'PowerShellCheatsheet' },
    ]
  },
  {
    catId: 'training',
    catLabel: '🎯 Training',
    tools: [
      { id: 'practice', label: '⚔️ Exam Practice Sandbox', component: PracticeStationLazy, name: 'PracticeStation' },
    ]
  }
];

const THEME_PALETTES = {
  dark: {
    appBg: '#0b0f19', containerBg: '#161f30', cardBg: '#111827', textPrimary: '#f8fafc', textMuted: '#94a3b8', accent: '#06b6d4', border: 'rgba(255, 255, 255, 0.05)', btnBorder: 'rgba(255, 255, 255, 0.08)'
  },
  light: {
    appBg: '#f8fafc', containerBg: '#e2e8f0', cardBg: '#ffffff', textPrimary: '#0f172a', textMuted: '#475569', accent: '#0284c7', border: 'rgba(0, 0, 0, 0.06)', btnBorder: 'rgba(0, 0, 0, 0.1)'
  }
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
    const currentCatObj = WORKSPACE_REGISTRY.find(c => c.catId === activeCategory);
    return currentCatObj?.tools.some(t => t.id === urlTool) ? urlTool! : currentCatObj?.tools[0].id || '';
  });

  // Persisted across sessions via localStorage; defaults to dark
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('netforge-theme');
      return saved !== null ? saved === 'dark' : true;
    } catch {
      return true;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('netforge-theme', isDarkMode ? 'dark' : 'light');
    } catch { /* storage unavailable in private/sandboxed contexts */ }
  }, [isDarkMode]);

  // --- DYNAMIC BROWSER TAB TITLE MANAGEMENT ---
  useEffect(() => {
    const currentCatObj = WORKSPACE_REGISTRY.find(c => c.catId === activeCategory);
    const currentToolObj = currentCatObj?.tools.find(t => t.id === activeTool);

    if (currentToolObj) {
      const plainLabel = currentToolObj.label.replace(/[-]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[‑-⛿]|\uD83E[\uDD10-\uDDFF]/g, '').trim();
      document.title = `${plainLabel} | Netforge`;
    } else {
      document.title = 'Netforge | System Architect Suite';
    }

    const url = new URL(window.location.href);
    url.searchParams.set('cat', activeCategory);
    url.searchParams.set('tool', activeTool);
    window.history.pushState({}, '', url.toString());
  }, [activeCategory, activeTool]);

  const handleCategoryChange = (catId: string) => {
    const targetCat = WORKSPACE_REGISTRY.find(c => c.catId === catId);
    if (targetCat && targetCat.tools.length > 0) {
      setActiveCategory(catId);
      setActiveTool(targetCat.tools[0].id);
    }
  };

  const activePalette = isDarkMode ? THEME_PALETTES.dark : THEME_PALETTES.light;
  const currentCategoryData = WORKSPACE_REGISTRY.find(c => c.catId === activeCategory) || WORKSPACE_REGISTRY[0];
  const selectedToolObj = currentCategoryData.tools.find(t => t.id === activeTool) || currentCategoryData.tools[0];

  return (
    <div style={{ backgroundColor: activePalette.appBg, minHeight: '100vh', padding: '2rem 1rem', fontFamily: 'system-ui, -apple-system, sans-serif', boxSizing: 'border-box', transition: 'background-color 0.2s ease' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto 1.5rem auto' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h2 style={{ color: activePalette.textPrimary, fontSize: '1.4rem', fontWeight: 800, margin: 0, letterSpacing: '-0.025em' }}>
            NET<span style={{ color: activePalette.accent }}>FORGE</span> NETWORK SUITE
          </h2>
          <button type="button" onClick={() => setIsDarkMode(!isDarkMode)} style={{ width: '2.4rem', height: '2.4rem', backgroundColor: activePalette.containerBg, color: activePalette.textPrimary, border: `1px solid ${activePalette.border}`, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>
            {isDarkMode ? '☀️' : '🌙'}
          </button>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
          {WORKSPACE_REGISTRY.map(cat => {
            const isCatActive = activeCategory === cat.catId;
            return (
              <button key={cat.catId} onClick={() => handleCategoryChange(cat.catId)} style={{ padding: '0.6rem 1.2rem', border: isCatActive ? `1px solid ${activePalette.accent}` : `1px solid ${activePalette.btnBorder}`, borderRadius: '20px', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', backgroundColor: isCatActive ? `${activePalette.accent}15` : activePalette.containerBg, color: isCatActive ? activePalette.accent : activePalette.textMuted, transition: 'all 0.15s ease' }}>
                {cat.catLabel}
              </button>
            );
          })}
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center', backgroundColor: activePalette.containerBg, padding: '0.6rem 1rem', borderRadius: '12px', marginBottom: '2.5rem', border: `1px solid ${activePalette.border}` }}>
          {currentCategoryData.tools.map(tool => (
            <button key={tool.id} onClick={() => setActiveTool(tool.id)} style={{ padding: '0.4rem 0.8rem', border: 'none', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', backgroundColor: activeTool === tool.id ? (isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)') : 'transparent', color: activeTool === tool.id ? activePalette.accent : activePalette.textMuted, transition: 'all 0.15s ease' }}>
              {tool.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <Suspense fallback={
          <div style={{ padding: '3rem', textAlign: 'center', color: activePalette.textMuted }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⚡</div>
            <p style={{ margin: 0, fontSize: '0.9rem' }}>Loading lab...</p>
          </div>
        }>
          {/* key resets the error boundary when switching between labs */}
          <SafeComponentBridge key={selectedToolObj.id} target={selectedToolObj.component} name={selectedToolObj.name} isDarkMode={isDarkMode} />
        </Suspense>
      </div>
    </div>
  );
}
