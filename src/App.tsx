import { useState, useEffect, Component } from 'react';

// ==========================================
// 1. COMPLIANT ES MODULE STATIC REGISTRY
// ==========================================
import * as OsiModule from './OsiModel';
import * as HeaderModule from './HeaderInspector';
import * as ProtocolModule from './ProtocolMapper';
import * as TopologyModule from './TopologyLab';
import * as CsmaModule from './CsmaLab'; 
import * as CableModule from './CableLab';
import * as IcmpModule from './IcmpLab';
import * as ArpModule from './ArpLab'; 
import * as NetServicesModule from './NetServicesLab'; 
import * as SubnetCalcModule from './SubnetCalculator';
import * as SubnetSplitModule from './SubnetSplitter';
import * as SubnetCheatModule from './SubnetCheatSheet';
import * as Ipv6Module from './Ipv6Suite';
import * as VlanModule from './VlanSuite';
import * as LinkAggModule from './LinkAggregationLab';
import * as StpModule from './StpLab'; 
import * as WifiAnalModule from './WifiAnalyzer';
import * as WifiRoamModule from './WifiRoamingLab';
import * as WifiBeamModule from './WifiBeamforming';
import * as WifiSecModule from './WifiSecurity';
import * as WifiStandModule from './WifiStandards';
import * as PracticeModule from './PracticeStation';

// Import Security Suite Elements Statically
import * as Layer2SecurityModule from './Layer2SecurityLab';
import * as AclModule from './AclLab';

// Import Routing Modules Statically
import * as LpmModule from './LpmSimulator';
import * as GatewayModule from './GatewayLab';
import * as DynamicRoutingModule from './DynamicRoutingLab';

// Import PowerShell Diagnostics Matrix Module Statically
import * as PowerShellModule from './PowerShellCheatsheet';

// Added: Static Import for the Wireless-to-Wired Infrastructure Lab
import * as WirelessToWiredModule from './WirelessToWiredLab';

// Unpack function that dynamically handles named vs default exports safely
const unpack = (mod: any, fallbackName: string) => {
  if (!mod) return null;
  return mod.default || mod[fallbackName] || Object.values(mod)[0];
};

// ==========================================
// 2. DEFENSIVE FAIL-SAFE WRAPPER ENGINE
// ==========================================
class SafeComponentBridge extends Component<{ target: any; name: string; isDarkMode: boolean }, { hasError: boolean }> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error: any, errorInfo: any) {
    console.error(`Fault detected inside laboratory module [${this.props.name}]:`, error, errorInfo);
  }
  render() {
    if (this.state.hasError || !this.props.target) {
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
      { id: 'osiModel', label: '🔍 The 7-Layer Model', component: unpack(OsiModule, 'OsiModel'), name: 'OsiModel' },
      { id: 'topologyLab', label: '🕸️ Network Topologies', component: unpack(TopologyModule, 'TopologyLab'), name: 'TopologyLab' },
      { id: 'csmaLab', label: '🚦 Access Control (CSMA)', component: unpack(CsmaModule, 'CsmaLab'), name: 'CsmaLab' },
      { id: 'cableLab', label: '🔌 Cables & Hardware', component: unpack(CableModule, 'CableLab'), name: 'CableLab' },
      { id: 'arpLab', label: '📡 Address Resolution (ARP)', component: unpack(ArpModule, 'ArpLab'), name: 'ArpLab' },
      { id: 'netServices', label: '⚙️ Network Services (DHCP/DNS)', component: unpack(NetServicesModule, 'NetServicesLab'), name: 'NetServicesLab' },
      { id: 'headerInspector', label: '🔄 Packets vs. Frames', component: unpack(HeaderModule, 'HeaderInspector'), name: 'HeaderInspector' },
      { id: 'protocolMapper', label: '🔄 Protocol Data Units', component: unpack(ProtocolModule, 'ProtocolMapper'), name: 'ProtocolMapper' },
      { id: 'icmpLab', label: '🛰️ How Ping Works', component: unpack(IcmpModule, 'IcmpLab'), name: 'IcmpLab' },
      { id: 'wirelessToWired', label: '🔌 Wireless-to-Wired Path', component: unpack(WirelessToWiredModule, 'WirelessToWiredLab'), name: 'WirelessToWiredLab' },
    ]
  },
  {
    catId: 'switching',
    catLabel: '🔌 Switching',
    tools: [
      { id: 'vlanMap', label: '⚙️ VLAN Console & Ports', component: unpack(VlanModule, 'VlanSuite'), name: 'VlanSuite' },
      { id: 'linkAggregation', label: '⛓️ Combining Switch Links', component: unpack(LinkAggModule, 'LinkAggregationLab'), name: 'LinkAggregationLab' },
      { id: 'stpLab', label: '🌲 Spanning Tree Protocol (STP)', component: unpack(StpModule, 'StpLab'), name: 'StpLab' },
    ]
  },
  {
    catId: 'subnetting',
    catLabel: '⚡ Subnetting',
    tools: [
      { id: 'calculator', label: '🌐 IP Subnet Calculator', component: unpack(SubnetCalcModule, 'SubnetCalculator'), name: 'SubnetCalculator' },
      { id: 'splitter', label: '✂️ Variable Length Masks (VLSM)', component: unpack(SubnetSplitModule, 'SubnetSplitter'), name: 'SubnetSplitter' },
      { id: 'ipv6Suite', label: '🌐 IPv6 Address Basics', component: unpack(Ipv6Module, 'Ipv6Suite'), name: 'Ipv6Suite' },
      { id: 'cheatsheet', label: '📋 Subnetting Quick Sheet', component: unpack(SubnetCheatModule, 'SubnetCheatSheet'), name: 'SubnetCheatSheet' },
    ]
  },
  {
    catId: 'routing',
    catLabel: '🚦 Routing',
    tools: [
      { id: 'lpmSim', label: '🎯 How Routers Choose Paths', component: unpack(LpmModule, 'LpmSimulator'), name: 'LpmSimulator' },
      { id: 'gatewayLab', label: '🎛️ Smart Backup Routes', component: unpack(GatewayModule, 'GatewayLab'), name: 'GatewayLab' },
      { id: 'dynamicLab', label: '🚦 Routing Fundamentals Matrix', component: unpack(DynamicRoutingModule, 'DynamicRoutingLab'), name: 'DynamicRoutingLab' },
    ]
  },
  {
    catId: 'wireless',
    catLabel: '📶 Wireless',
    tools: [
      { id: 'wifi', label: '📊 Wi-Fi Signal Graph', component: unpack(WifiAnalModule, 'WifiAnalyzer'), name: 'WifiAnalyzer' },
      { id: 'roaming', label: '🔄 Cell Overlap & Roaming', component: unpack(WifiRoamModule, 'WifiRoamingLab'), name: 'WifiRoamingLab' },
      { id: 'beamforming', label: '🎯 Focusing Wireless Signals', component: unpack(WifiBeamModule, 'WifiBeamforming'), name: 'WifiBeamforming' },
      { id: 'security', label: '🔒 Wi-Fi Security (WPA)', component: unpack(WifiSecModule, 'WifiSecurity'), name: 'WifiSecurity' },
      { id: 'standards', label: '📚 Wireless Standards', component: unpack(WifiStandModule, 'WifiStandards'), name: 'WifiStandards' },
    ]
  },
  {
    catId: 'security',
    catLabel: '🔒 Security',
    tools: [
      { id: 'layer2', label: '🛡️ Layer 2 Mitigation', component: unpack(Layer2SecurityModule, 'Layer2SecurityLab'), name: 'Layer2SecurityLab' },
      { id: 'aclLab', label: '🛡️ ACL Rules Simulator', component: unpack(AclModule, 'AclLab'), name: 'AclLab' },
    ]
  },
  {
    catId: 'powershell',
    catLabel: '📟 PowerShell',
    tools: [
      { id: 'cheatsheet', label: '📋 Systems & Diagnostics Matrix', component: unpack(PowerShellModule, 'PowerShellCheatsheet'), name: 'PowerShellCheatsheet' },
    ]
  },
  {
    catId: 'training',
    catLabel: '🎯 Training',
    tools: [
      { id: 'practice', label: '⚔️ Exam Practice Sandbox', component: unpack(PracticeModule, 'PracticeStation'), name: 'PracticeStation' },
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

  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);

  // --- DYNAMIC BROWSER TAB TITLE MANAGEMENT ---
  useEffect(() => {
    const currentCatObj = WORKSPACE_REGISTRY.find(c => c.catId === activeCategory);
    const currentToolObj = currentCatObj?.tools.find(t => t.id === activeTool);

    if (currentToolObj) {
      // Strips explicit emojis from labels cleanly for clean browser presentation
      const plainLabel = currentToolObj.label.replace(/[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF]/g, '').trim();
      document.title = `${plainLabel} | Netforge`;
    } else {
      document.title = 'Netforge | System Architect Suite';
    }

    // Preserve search params configuration history stack safely
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
            NET<span style={{ color: activePalette.accent }}>FORGE</span> SYSTEM ARCHITECT SUITE
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
        <SafeComponentBridge target={selectedToolObj.component} name={selectedToolObj.name} isDarkMode={isDarkMode} />
      </div>
    </div>
  );
}