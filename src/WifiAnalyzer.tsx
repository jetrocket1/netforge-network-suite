import React, { useState } from 'react';

interface AccessPoint {
  id: string;
  name: string;
  channel: number;
  width: number; // MHz: 20, 40, 80, 160, 320
  signal: number; // dBm
  band: '2.4G' | '5G' | '6G';
}

interface InterferenceSource {
  id: string;
  type: 'Microwave' | 'Satellite' | 'Bluetooth';
  impact: string;
  centerFreq: number; // MHz
  width: number; // MHz
  dbmNoise: number; // Noise floor height amplification
}

interface WifiAnalyzerProps {
  isDarkMode?: boolean;
}

export const WifiAnalyzer: React.FC<WifiAnalyzerProps> = ({ isDarkMode = true }) => {
  const [regDomain, setRegDomain] = useState<'UK' | 'US'>('UK');
  const [activeBand, setActiveBand] = useState<'2.4G' | '5G' | '6G'>('2.4G');

  const [aps, setAps] = useState<AccessPoint[]>([
    { id: 'ap-1', name: 'Office_Ch1', channel: 1, width: 22, signal: -45, band: '2.4G' },
    { id: 'ap-2', name: 'Rogue_Ch4', channel: 4, width: 22, signal: -55, band: '2.4G' },
    { id: 'ap-3', name: 'Corp_HighSpeed', channel: 36, width: 80, signal: -45, band: '5G' },
    { id: 'ap-4', name: 'Warehouse_Narrow', channel: 44, width: 20, signal: -60, band: '5G' },
    { id: 'ap-5', name: 'Backhaul_6G', channel: 5, width: 20, signal: -40, band: '6G' },
  ]);

  const [interferenceSources, setInterferenceSources] = useState<InterferenceSource[]>([]);
  const [newName, setNewName] = useState<string>('');
  const [newChannel, setNewChannel] = useState<number>(1);
  const [newWidth, setNewWidth] = useState<number>(20);
  const [newSignal, setNewSignal] = useState<number>(-50);
  const [log, setLog] = useState<string>('Transmitter monitoring module online. Ready for RF signal injection.');

  const styles = {
    cardBg: isDarkMode ? '#111827' : '#ffffff',
    border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid rgba(0, 0, 0, 0.06)',
    textPrimary: isDarkMode ? '#f8fafc' : '#0f172a',
    textMuted: isDarkMode ? '#94a3b8' : '#475569',
    setupBg: isDarkMode ? '#161f30' : '#f1f5f9',
    chartBg: isDarkMode ? '#0b0f19' : '#f8fafc',
    terminalBg: '#05050a',
    terminalText: '#38bdf8',
    accent: isDarkMode ? '#06b6d4' : '#0284c7',
    fwd: '#10b981',
    blk: '#f43f5e',
    lst: '#eab308'
  };

  const getAvailableChannels = (): number[] => {
    if (activeBand === '2.4G') {
      return regDomain === 'US' 
        ? [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] 
        : [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];
    }
    if (activeBand === '5G') {
      const base5G = [36, 40, 44, 48, 52, 56, 60, 64, 100, 104, 108, 112, 116, 132, 136, 140, 144];
      return regDomain === 'US' ? [...base5G, 149, 153, 157, 161, 165] : base5G;
    }
    return [5, 21, 37, 53, 69, 85, 101, 117, 133, 149, 165, 181, 197, 213];
  };

  const getAvailableWidths = (): number[] => {
    if (activeBand === '2.4G') return [22];
    if (activeBand === '5G') return [20, 40, 80, 160];
    return [20, 40, 80, 160, 320];
  };

  const channelsList = getAvailableChannels();
  const widthsList = getAvailableWidths();

  const getFrequencyBounds = () => {
    switch (activeBand) {
      case '2.4G': return { min: 2400, max: 2485, label: "2.4 GHz ISM Frequency Spectrum" };
      case '5G': return { min: 5160, max: 5850, label: "5 GHz U-NII Frequency Spectrum" };
      case '6G': return { min: 5925, max: 7125, label: "6 GHz Greenfield Architecture Frequency Spectrum" };
    }
  };

  const getChannelCenterFreq = (channel: number, band: '2.4G' | '5G' | '6G'): number => {
    if (band === '2.4G') return 2412 + (channel - 1) * 5;
    if (band === '5G') return 5180 + (channel - 36) * 5;
    return 5955 + (channel - 1) * 5;
  };

  const bounds = getFrequencyBounds();

  const evaluateRFOverlap = (target: AccessPoint) => {
    let cci = false;
    let aci = false;
    const targetCenter = getChannelCenterFreq(target.channel, target.band);

    aps.filter(ap => ap.id !== target.id && ap.band === target.band).forEach(ap => {
      const apCenter = getChannelCenterFreq(ap.channel, ap.band);
      const distance = Math.abs(targetCenter - apCenter);
      const overlapThreshold = (target.width / 2) + (ap.width / 2);

      if (distance < overlapThreshold) {
        if (ap.channel === target.channel && ap.width === target.width) {
          cci = true;
        } else {
          aci = true;
        }
      }
    });

    return { cci, aci };
  };

  const handleAddAp = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = newName.trim() || `AP_Ch${newChannel}_${newWidth}M`;
    setAps([...aps, { id: `ap-${Date.now()}`, name: cleanName, channel: newChannel, width: newWidth, signal: newSignal, band: activeBand }]);
    setLog(`📡 Provisioned: "${cleanName}" operating with a broad ${newWidth} MHz spectral mask.`);
    setNewName('');
  };

  const handleDeleteAp = (id: string, name: string) => {
    if (aps.length <= 1) return;
    setAps(aps.filter(ap => ap.id !== id));
    setLog(`🗑️ Decommissioned: Transmitter "${name}" removed from the active grid.`);
  };

  const toggleInterference = (type: 'Microwave' | 'Satellite' | 'Bluetooth') => {
    if (interferenceSources.some(i => i.type === type)) {
      setInterferenceSources(prev => prev.filter(i => i.type !== type));
      setLog(`♻️ Environment Cleared: Active ${type} background noise has dissipated.`);
    } else {
      let source: InterferenceSource;
      if (type === 'Microwave') {
        source = { id: 'int-mw', type: 'Microwave', impact: 'Severe Layer 1 continuous noise', centerFreq: 2442, width: 30, dbmNoise: 45 };
      } else if (type === 'Satellite') {
        source = { id: 'int-sat', type: 'Satellite', impact: 'Out-of-band fixed link carrier bleed', centerFreq: 5400, width: 80, dbmNoise: 35 };
      } else {
        source = { id: 'int-bt', type: 'Bluetooth', impact: 'Fast adaptive frequency hopping transients', centerFreq: 2425, width: 15, dbmNoise: 20 };
      }
      setInterferenceSources([...interferenceSources, source]);
      setLog(`⚠️ Collision Warning: Non-802.11 ${type} radiation fields operating inside spectrum cells.`);
    }
  };

  const handleBandSwitch = (band: '2.4G' | '5G' | '6G') => {
    setActiveBand(band);
    setNewChannel(band === '2.4G' ? 1 : (band === '5G' ? 36 : 5));
    setNewWidth(band === '2.4G' ? 22 : 20);
  };

  const handleDomainSwitch = (domain: 'UK' | 'US') => {
    setRegDomain(domain);
    setNewChannel(activeBand === '2.4G' ? 1 : (activeBand === '5G' ? 36 : 5));
    setLog(`🌍 Regulatory context shifted to ${domain === 'UK' ? 'UK (Ofcom)' : 'US (FCC)'}. Dropdown channel filters updated.`);
  };

  const visibleAps = aps.filter(ap => ap.band === activeBand);
  const activeInterference = interferenceSources.filter(source => {
    if (activeBand === '2.4G') return source.type === 'Microwave' || source.type === 'Bluetooth';
    if (activeBand === '5G') return source.type === 'Satellite';
    return false;
  });

  return (
    <div style={{ padding: '2rem', backgroundColor: styles.cardBg, borderRadius: '12px', border: styles.border, color: styles.textPrimary, fontFamily: 'system-ui, sans-serif' }}>
      
      {/* SIMPLIFIED HEADERS */}
      <div style={{ marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h3 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, letterSpacing: '-0.025em' }}>WIFI Frequency Visualiser</h3>
          <p style={{ color: styles.textMuted, margin: '4px 0 0 0', fontSize: '0.85rem' }}>Analyze real-time channel width density, overlapping noise bounds, and multi-band compliance vectors.</p>
        </div>
        
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', backgroundColor: styles.setupBg, padding: '4px', borderRadius: '8px', border: `1px solid ${styles.border}` }}>
            {/* FIXED TYPO HERE */}
            <button type="button" onClick={() => handleDomainSwitch('UK')} style={{ padding: '6px 10px', fontSize: '0.7rem', fontWeight: 'bold', border: 'none', borderRadius: '4px', cursor: 'pointer', backgroundColor: regDomain === 'UK' ? styles.accent : 'transparent', color: regDomain === 'UK' ? '#fff' : styles.textMuted }}>🇬🇧 UK</button>
            <button type="button" onClick={() => handleDomainSwitch('US')} style={{ padding: '6px 10px', fontSize: '0.7rem', fontWeight: 'bold', border: 'none', borderRadius: '4px', cursor: 'pointer', backgroundColor: regDomain === 'US' ? styles.accent : 'transparent', color: regDomain === 'US' ? '#fff' : styles.textMuted }}>🇺🇸 US</button>
          </div>

          <div style={{ display: 'flex', backgroundColor: styles.setupBg, padding: '4px', borderRadius: '8px' }}>
            {(['2.4G', '5G', '6G'] as const).map(band => (
              <button type="button" key={band} onClick={() => handleBandSwitch(band)} style={{ padding: '6px 12px', fontSize: '0.75rem', fontWeight: 'bold', border: 'none', borderRadius: '4px', cursor: 'pointer', backgroundColor: activeBand === band ? styles.accent : 'transparent', color: activeBand === band ? '#fff' : styles.textMuted }}>{band}</button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* DEPLOYMENTS */}
          <div style={{ backgroundColor: styles.setupBg, padding: '1.2rem', borderRadius: '8px', border: styles.border }}>
            <span style={{ display: 'block', fontSize: '0.65rem', fontWeight: 800, color: styles.textMuted, textTransform: 'uppercase', marginBottom: '10px' }}>Deploy {activeBand} Access Point</span>
            <form onSubmit={handleAddAp} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <input type="text" placeholder="SSID / Network Name" value={newName} onChange={e => setNewName(e.target.value)} style={{ padding: '8px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)', backgroundColor: styles.chartBg, color: styles.textPrimary, fontSize: '0.75rem' }} />
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
                <div>
                  <label style={{ fontSize: '0.6rem', color: styles.textMuted, display: 'block', marginBottom: '2px' }}>Channel</label>
                  <select value={newChannel} onChange={e => setNewChannel(parseInt(e.target.value))} style={{ width: '100%', padding: '7px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)', backgroundColor: styles.chartBg, color: styles.textPrimary, fontSize: '0.75rem' }}>
                    {channelsList.map(ch => <option key={ch} value={ch}>Ch {ch}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.6rem', color: styles.textMuted, display: 'block', marginBottom: '2px' }}>Width</label>
                  <select value={newWidth} onChange={e => setNewWidth(parseInt(e.target.value))} style={{ width: '100%', padding: '7px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)', backgroundColor: styles.chartBg, color: styles.textPrimary, fontSize: '0.75rem' }}>
                    {widthsList.map(w => <option key={w} value={w}>{w} MHz</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.6rem', color: styles.textMuted, display: 'block', marginBottom: '2px' }}>Signal</label>
                  <input type="number" min="-90" max="-30" value={newSignal} onChange={e => setNewSignal(parseInt(e.target.value) || -50)} style={{ width: '100%', boxSizing: 'border-box', padding: '6px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)', backgroundColor: styles.chartBg, color: styles.textPrimary, fontSize: '0.75rem' }} />
                </div>
              </div>
              <button type="submit" style={{ marginTop: '4px', padding: '8px', backgroundColor: styles.accent, color: '#fff', border: 'none', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer' }}>➕ Add Access Point</button>
            </form>
          </div>

          {/* ACTIVE FOOTPRINTS */}
          <div style={{ backgroundColor: styles.setupBg, padding: '1.2rem', borderRadius: '8px', border: styles.border, flexGrow: 1 }}>
            <span style={{ display: 'block', fontSize: '0.65rem', fontWeight: 800, color: styles.textMuted, textTransform: 'uppercase', marginBottom: '10px' }}>Active Spectrum Transmitters</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '180px', overflowY: 'auto' }}>
              {visibleAps.map(ap => {
                const { cci, aci } = evaluateRFOverlap(ap);
                return (
                  <div key={ap.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px', backgroundColor: styles.chartBg, borderRadius: '6px', border: (cci || aci) ? `1px dashed ${styles.blk}` : '1px solid rgba(255,255,255,0.02)' }}>
                    <div>
                      <div style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>{ap.name} ({ap.width} MHz)</div>
                      <div style={{ fontSize: '0.65rem', color: styles.textMuted }}>Primary Channel: <span style={{ color: styles.lst }}>{ap.channel}</span> | Power: <span style={{ color: styles.fwd }}>{ap.signal} dBm</span></div>
                    </div>
                    <button type="button" onClick={() => handleDeleteAp(ap.id, ap.name)} disabled={aps.length <= 1} style={{ backgroundColor: 'transparent', border: 'none', color: styles.blk, cursor: 'pointer', padding: '4px 8px' }}>🗑️</button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* INJECT INTERFERENCE BUTTONS */}
          <div style={{ backgroundColor: styles.setupBg, padding: '1.2rem', borderRadius: '8px', border: styles.border }}>
            <span style={{ display: 'block', fontSize: '0.65rem', fontWeight: 800, color: styles.textMuted, textTransform: 'uppercase', marginBottom: '8px' }}>Inject Non-802.11 Hardware Noise Fields</span>
            <div style={{ display: 'flex', gap: '6px', flexDirection: 'column' }}>
              {activeBand === '2.4G' && (
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button type="button" onClick={() => toggleInterference('Microwave')} style={{ flex: 1, padding: '10px', fontSize: '0.65rem', fontWeight: 'bold', borderRadius: '4px', border: 'none', cursor: 'pointer', backgroundColor: interferenceSources.some(i => i.type === 'Microwave') ? styles.blk : styles.chartBg, color: '#fff' }}>🍳 Microwave (Continuous)</button>
                  <button type="button" onClick={() => toggleInterference('Bluetooth')} style={{ flex: 1, padding: '10px', fontSize: '0.65rem', fontWeight: 'bold', borderRadius: '4px', border: 'none', cursor: 'pointer', backgroundColor: interferenceSources.some(i => i.type === 'Bluetooth') ? styles.lst : styles.chartBg, color: interferenceSources.some(i => i.type === 'Bluetooth') ? '#000' : '#fff' }}>🔷 BT Hopping Transients</button>
                </div>
              )}
              {activeBand === '5G' && (
                <button type="button" onClick={() => toggleInterference('Satellite')} style={{ width: '100%', padding: '10px', fontSize: '0.65rem', fontWeight: 'bold', borderRadius: '4px', border: 'none', cursor: 'pointer', backgroundColor: interferenceSources.some(i => i.type === 'Satellite') ? styles.blk : styles.chartBg, color: '#fff' }}>🛰️ Satellite C-Band Bleed Overlap</button>
              )}
              {activeBand === '6G' && (
                <div style={{ textAlign: 'center', fontSize: '0.65rem', color: styles.textMuted, padding: '4px', border: '1px dashed rgba(255,255,255,0.05)', borderRadius: '4px' }}>🛡️ Greenfield 6 GHz isolated from legacy microwave/satellite carrier anomalies.</div>
              )}
            </div>
          </div>

        </div>

        {/* FREQUENCY PLOT CANVAS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          <div style={{ flexGrow: 1, backgroundColor: '#05070f', border: '1px solid #1e293b', borderRadius: '12px', padding: '1.5rem', position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '320px' }}>
            <span style={{ fontSize: '0.65rem', color: styles.accent, fontWeight: 'bold', fontFamily: 'monospace' }}>{bounds.label}</span>
            
            <div style={{ position: 'relative', flexGrow: 1, margin: '35px 0', borderBottom: '1px dashed #334155' }}>
              
              {/* INTERFERENCE SHAPES */}
              {activeInterference.map(source => {
                const leftPct = ((source.centerFreq - source.width/2 - bounds.min) / (bounds.max - bounds.min)) * 100;
                const widthPct = (source.width / (bounds.max - bounds.min)) * 100;
                
                return (
                  <div key={source.id} style={{
                    position: 'absolute', bottom: 0, left: `${leftPct}%`, width: `${widthPct}%`, height: `${source.dbmNoise}%`,
                    background: 'repeating-linear-gradient(45deg, rgba(244,63,94,0.08), rgba(244,63,94,0.08) 6px, transparent 6px, transparent 12px)',
                    borderTop: `2px dotted ${source.type === 'Bluetooth' ? styles.lst : styles.blk}`,
                    transition: 'all 0.3s ease', zIndex: 1
                  }}>
                    <span style={{ position: 'absolute', top: '-14px', left: '50%', transform: 'translateX(-50%)', fontSize: '0.55rem', color: source.type === 'Bluetooth' ? styles.lst : styles.blk, fontWeight: 'bold', whiteSpace: 'nowrap', textTransform: 'uppercase', backgroundColor: '#05070f', padding: '0 4px', borderRadius: '3px' }}>
                      ⚠️ {source.type} Noise Envelope
                    </span>
                  </div>
                );
              })}

              {/* WIFI ARCS */}
              {visibleAps.map((ap) => {
                const centerFreq = getChannelCenterFreq(ap.channel, ap.band);
                const leftPct = ((centerFreq - bounds.min) / (bounds.max - bounds.min)) * 100;
                const widthPct = (ap.width / (bounds.max - bounds.min)) * 100;
                const heightPct = Math.max(25, 100 + ap.signal);

                const { cci, aci } = evaluateRFOverlap(ap);

                return (
                  <div key={ap.id} style={{
                    position: 'absolute', bottom: 0, left: `${leftPct}%`, width: `${widthPct}%`, height: `${heightPct}%`,
                    transform: 'translateX(-50%)', borderTopLeftRadius: '30px', borderTopRightRadius: '30px',
                    background: (cci || aci) 
                      ? 'linear-gradient(to top, rgba(244,63,94,0.02), rgba(244,63,94,0.18))' 
                      : 'linear-gradient(to top, rgba(6,182,212,0.01), rgba(6,182,212,0.1))',
                    borderLeft: `1px dashed ${cci ? styles.blk : (aci ? styles.lst : styles.accent + '44')}`,
                    borderRight: `1px dashed ${cci ? styles.blk : (aci ? styles.lst : styles.accent + '44')}`,
                    borderTop: `2px solid ${cci || aci ? styles.blk : styles.fwd}`,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', paddingBottom: '10px', transition: 'all 0.3s ease', zIndex: 2
                  }}>
                    {cci && <span style={{ position: 'absolute', top: '-18px', backgroundColor: styles.blk, color: '#fff', fontSize: '0.45rem', padding: '1px 4px', borderRadius: '3px', fontWeight: 'bold', whiteSpace: 'nowrap' }}>⚠️ CCI CONTENTION</span>}
                    {!cci && aci && <span style={{ position: 'absolute', top: '-18px', backgroundColor: styles.lst, color: '#000', fontSize: '0.45rem', padding: '1px 4px', borderRadius: '3px', fontWeight: 'bold', whiteSpace: 'nowrap' }}>⚠️ OVERLAP (ACI)</span>}
                    
                    <span style={{ fontSize: '0.55rem', fontFamily: 'monospace', color: styles.textPrimary, fontWeight: 'bold', textAlign: 'center', maxWidth: '95%', overflow: 'hidden' }}>{ap.name}</span>
                    <span style={{ fontSize: '0.5rem', color: styles.textMuted }}>{ap.width}MHz Pool</span>
                  </div>
                );
              })}

            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #1e293b', paddingTop: '4px', fontSize: '0.55rem', color: '#475569', fontFamily: 'monospace' }}>
              <span>{bounds.min} MHz</span>
              <span>{Math.floor(bounds.min + (bounds.max - bounds.min) * 0.5)} MHz</span>
              <span>{bounds.max} MHz</span>
            </div>
          </div>

          {/* DIAGNOSTICS */}
          <div style={{ backgroundColor: styles.terminalBg, padding: '1rem', borderRadius: '8px', border: '1px solid #1e293b', fontFamily: 'monospace', fontSize: '0.75rem', lineHeight: '1.5', color: styles.terminalText }}>
            <span style={{ color: '#475569', display: 'block', borderBottom: '1px solid #1e293b', paddingBottom: '4px', marginBottom: '8px', fontWeight: 'bold' }}>REGULATORY COMPLIANCE HUD</span>
            <div style={{ color: '#cbd5e1' }}>{log}</div>
          </div>

        </div>

      </div>

      {/* CURRICULUM NOTES */}
      <div style={{ borderTop: '2px solid rgba(255,255,255,0.05)', paddingTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', fontSize: '0.8rem', lineHeight: '1.5' }}>
        
        <div style={{ backgroundColor: styles.setupBg, padding: '1.2rem', borderRadius: '8px', border: styles.border }}>
          <h4 style={{ margin: '0 0 8px 0', fontSize: '1rem', fontWeight: 700, color: styles.blk }}>💥 RF Overlap Diagnostics: CCI vs. ACI Matrix</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
            <div>
              <h5 style={{ margin: '0 0 4px 0', fontSize: '0.8rem', fontWeight: 700, color: styles.lst }}>👥 Co-Channel Interference (CCI) — Layer 2 Contention</h5>
              <p style={{ margin: 0, color: styles.textMuted, fontSize: '0.75rem' }}>
                CCI occurs when APs share the **exact same frequency block**. Because 802.11 relies on **CSMA/CA**, endpoints pause their queues when they hear another preamble. CCI does not corrupt data; instead, it turns the link into a shared airtime slot machine, triggering high latency as nodes wait their turn.
              </p>
            </div>
            <div>
              <h5 style={{ margin: '0 0 4px 0', fontSize: '0.8rem', fontWeight: 700, color: styles.blk }}>🔊 Adjacent-Channel Interference (ACI) — Layer 1 Distortion</h5>
              <p style={{ margin: 0, color: styles.textMuted, fontSize: '0.75rem' }}>
                ACI occurs when signals **bleed over into overlapping curves** (e.g., placing APs on Channel 1 and 4). This is destructive, physical white noise. Because radios cannot decode the overlapping packet headers, they cannot negotiate airtime, leading directly to dropped frames, retries, and high noise floors.
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
          {activeBand === '2.4G' && (
            <>
              <div>
                <h4 style={{ margin: '0 0 6px 0', fontSize: '0.95rem', fontWeight: 700, color: styles.lst }}>⚡ 2.4 GHz Layout Guidelines</h4>
                <p style={{ margin: 0, color: styles.textMuted }}>
                  The 2.4 GHz band punches deeply through walls but faces extreme congestion. System designers should stick strictly to a **1, 6, and 11 channel plan** to prevent side-lobe overlap. Note that the **UK (Ofcom)** unlocks channel 13, whereas the **US (FCC)** enforces a hard cap at channel 11.
                </p>
              </div>
              <div>
                <h4 style={{ margin: '0 0 6px 0', fontSize: '0.95rem', fontWeight: 700, color: styles.blk }}>🍳 Layer 1 Contaminants</h4>
                <p style={{ margin: 0, color: styles.textMuted }}>
                  Industrial microwave magnetrons, analog video links, and legacy Bluetooth hardware saturate these frequencies without checking headers. This degrades your Signal-to-Noise Ratio (SNR), corrupting standard frames and driving up retransmission rates.
                </p>
              </div>
            </>
          )}

          {activeBand === '5G' && (
            <>
              <div>
                <h4 style={{ margin: '0 0 6px 0', fontSize: '0.95rem', fontWeight: 700, color: styles.accent }}>🚀 5 GHz Channel Bonding & ACI Traps</h4>
                <p style={{ margin: 0, color: styles.textMuted }}>
                  5 GHz provides up to 25 distinct, clean 20 MHz channels. However, if you use **Channel Bonding** to merge paths into 80 MHz or 160 MHz lanes, you shrink your unique channel choices down to just a handful. Placing a standard 20 MHz AP next to an over-bonded cell causes major structural **ACI bleed loops**.
                </p>
              </div>
              <div>
                <h4 style={{ margin: '0 0 6px 0', fontSize: '0.95rem', fontWeight: 700, color: styles.lst }}>🛰️ DFS Radar Mitigation</h4>
                <p style={{ margin: 0, color: styles.textMuted }}>
                  Middle U-NII spectrum ranges share space with meteorological and aviation radar arrays. Access Points configured on **DFS (Dynamic Frequency Selection)** paths must drop current user transmissions immediately if a radar pulse is picked up, resulting in brief roaming handoffs.
                </p>
              </div>
            </>
          )}

          {activeBand === '6G' && (
            <>
              <div>
                <h4 style={{ margin: '0 0 6px 0', fontSize: '0.95rem', fontWeight: 700, color: styles.fwd }}>🟢 6 GHz Wide-Lane Greenfield Engine</h4>
                <p style={{ margin: 0, color: styles.textMuted }}>
                  Brought online via Wi-Fi 6E and Wi-Fi 7, 6 GHz locks out old legacy clients entirely, meaning there is zero backward-compatibility overhead. However, blasting maximum **320 MHz channel widths** consumes your spectral choices immediately, making **CCI contention loops** inevitable if neighboring APs overlap.
                </p>
              </div>
              <div>
                <h4 style={{ margin: '0 0 6px 0', fontSize: '0.95rem', fontWeight: 700, color: styles.accent }}>🎯 PSC & Preamble Puncturing</h4>
                <p style={{ margin: 0, color: styles.textMuted }}>
                  Because scanning dozens of channels would drain client batteries, discovery is limited to **Preferred Scanner Channels (PSC)**. If out-of-band carriers block a frequency slice, Wi-Fi 7 uses **Preamble Puncturing** to isolate the noisy 20 MHz block while letting traffic flow across the rest of the channel.
                </p>
              </div>
            </>
          )}
        </div>

      </div>

    </div>
  );
};

export default WifiAnalyzer;