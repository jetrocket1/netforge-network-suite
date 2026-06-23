import React, { useState } from 'react';
import { getLabTheme } from './labTheme';

interface AccessPoint {
  id: string;
  name: string;
  channel: number;
  width: number;
  signal: number;
  band: '2.4G' | '5G' | '6G';
}

interface InterferenceSource {
  id: string;
  type: 'Microwave' | 'Satellite' | 'Bluetooth';
  impact: string;
  centerFreq: number;
  width: number;
  dbmNoise: number;
}

interface WifiAnalyzerProps {
  isDarkMode?: boolean;
}

export const WifiAnalyzer: React.FC<WifiAnalyzerProps> = ({ isDarkMode = true }) => {
  const [regDomain, setRegDomain] = useState<'UK' | 'US'>('UK');
  const [activeBand, setActiveBand] = useState<'2.4G' | '5G' | '6G'>('2.4G');
  const T = getLabTheme(isDarkMode);

  const [aps, setAps] = useState<AccessPoint[]>([
    { id: 'ap-1', name: 'Office_Ch1',    channel: 1,  width: 22, signal: -45, band: '2.4G' },
    { id: 'ap-2', name: 'Rogue_Ch4',     channel: 4,  width: 22, signal: -55, band: '2.4G' },
    { id: 'ap-3', name: 'Corp_HighSpeed',channel: 36, width: 80, signal: -45, band: '5G'   },
    { id: 'ap-4', name: 'Warehouse_Narrow',channel:44, width: 20, signal: -60, band: '5G'  },
    { id: 'ap-5', name: 'Backhaul_6G',   channel: 5,  width: 20, signal: -40, band: '6G'   },
  ]);

  const [interferenceSources, setInterferenceSources] = useState<InterferenceSource[]>([]);
  const [newName, setNewName]     = useState<string>('');
  const [newChannel, setNewChannel] = useState<number>(1);
  const [newWidth, setNewWidth]   = useState<number>(20);
  const [newSignal, setNewSignal] = useState<number>(-50);
  const [log, setLog]             = useState<string>('Ready. Add access points or inject interference to see the spectrum update.');

  const getAvailableChannels = (): number[] => {
    if (activeBand === '2.4G') return regDomain === 'US' ? [1,2,3,4,5,6,7,8,9,10,11] : [1,2,3,4,5,6,7,8,9,10,11,12,13];
    if (activeBand === '5G') {
      const base = [36,40,44,48,52,56,60,64,100,104,108,112,116,132,136,140,144];
      return regDomain === 'US' ? [...base,149,153,157,161,165] : base;
    }
    return [5,21,37,53,69,85,101,117,133,149,165,181,197,213];
  };

  const getAvailableWidths = (): number[] => {
    if (activeBand === '2.4G') return [22];
    if (activeBand === '5G') return [20,40,80,160];
    return [20,40,80,160,320];
  };

  const channelsList = getAvailableChannels();
  const widthsList   = getAvailableWidths();

  const getFrequencyBounds = () => {
    switch (activeBand) {
      case '2.4G': return { min: 2400, max: 2485, label: '2.4 GHz ISM band' };
      case '5G':   return { min: 5160, max: 5850, label: '5 GHz U-NII band' };
      case '6G':   return { min: 5925, max: 7125, label: '6 GHz band (Wi-Fi 6E / 7)' };
    }
  };

  const getChannelCenterFreq = (channel: number, band: '2.4G' | '5G' | '6G'): number => {
    if (band === '2.4G') return 2412 + (channel - 1) * 5;
    if (band === '5G')   return 5180 + (channel - 36) * 5;
    return 5955 + (channel - 1) * 5;
  };

  const bounds = getFrequencyBounds();

  const evaluateRFOverlap = (target: AccessPoint) => {
    let cci = false, aci = false;
    const tc = getChannelCenterFreq(target.channel, target.band);
    aps.filter(ap => ap.id !== target.id && ap.band === target.band).forEach(ap => {
      const ac = getChannelCenterFreq(ap.channel, ap.band);
      const distance = Math.abs(tc - ac);
      if (distance < (target.width / 2) + (ap.width / 2)) {
        if (ap.channel === target.channel && ap.width === target.width) cci = true;
        else aci = true;
      }
    });
    return { cci, aci };
  };

  const handleAddAp = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newName.trim() || `AP_Ch${newChannel}_${newWidth}M`;
    setAps([...aps, { id: `ap-${Date.now()}`, name, channel: newChannel, width: newWidth, signal: newSignal, band: activeBand }]);
    setLog(`Added "${name}" on ${activeBand} ch ${newChannel} with ${newWidth} MHz channel width.`);
    setNewName('');
  };

  const handleDeleteAp = (id: string, name: string) => {
    if (aps.length <= 1) return;
    setAps(aps.filter(ap => ap.id !== id));
    setLog(`Removed "${name}" from the spectrum view.`);
  };

  const toggleInterference = (type: 'Microwave' | 'Satellite' | 'Bluetooth') => {
    if (interferenceSources.some(i => i.type === type)) {
      setInterferenceSources(prev => prev.filter(i => i.type !== type));
      setLog(`${type} interference cleared.`);
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
      setLog(`${type} interference injected into the ${activeBand} spectrum.`);
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
    setLog(`Regulatory domain set to ${domain === 'UK' ? 'UK (Ofcom)' : 'US (FCC)'}. Channel list updated.`);
  };

  const visibleAps = aps.filter(ap => ap.band === activeBand);
  const activeInterference = interferenceSources.filter(source => {
    if (activeBand === '2.4G') return source.type === 'Microwave' || source.type === 'Bluetooth';
    if (activeBand === '5G') return source.type === 'Satellite';
    return false;
  });

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '8px', borderRadius: '4px', border: T.border,
    backgroundColor: T.insetBg, color: T.textPrimary, fontSize: '0.75rem', boxSizing: 'border-box',
  };

  const selectStyle: React.CSSProperties = {
    width: '100%', padding: '7px', borderRadius: '4px', border: T.border,
    backgroundColor: T.insetBg, color: T.textPrimary, fontSize: '0.75rem',
  };

  return (
    <div style={{ padding: '2rem', backgroundColor: T.cardBg, borderRadius: '12px', border: T.border, color: T.textPrimary, fontFamily: 'system-ui, sans-serif' }}>

      {/* Header */}
      <div style={{ marginBottom: '1.5rem', borderBottom: T.border, paddingBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Wi-Fi Channel Analyser</h3>
          <p style={{ color: T.textSecondary, margin: '4px 0 0 0', fontSize: '0.875rem' }}>Visualise channel overlap, interference, and signal strength across the 2.4, 5, and 6 GHz bands.</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', backgroundColor: T.panelBg, padding: '4px', borderRadius: '8px', border: T.border }}>
            <button type="button" onClick={() => handleDomainSwitch('UK')} style={{ padding: '6px 10px', fontSize: '0.7rem', fontWeight: 'bold', border: 'none', borderRadius: '4px', cursor: 'pointer', backgroundColor: regDomain === 'UK' ? T.accent : 'transparent', color: regDomain === 'UK' ? '#fff' : T.textSecondary }}>UK</button>
            <button type="button" onClick={() => handleDomainSwitch('US')} style={{ padding: '6px 10px', fontSize: '0.7rem', fontWeight: 'bold', border: 'none', borderRadius: '4px', cursor: 'pointer', backgroundColor: regDomain === 'US' ? T.accent : 'transparent', color: regDomain === 'US' ? '#fff' : T.textSecondary }}>US</button>
          </div>
          <div style={{ display: 'flex', backgroundColor: T.panelBg, padding: '4px', borderRadius: '8px', border: T.border }}>
            {(['2.4G', '5G', '6G'] as const).map(band => (
              <button type="button" key={band} onClick={() => handleBandSwitch(band)} style={{ padding: '6px 12px', fontSize: '0.75rem', fontWeight: 'bold', border: 'none', borderRadius: '4px', cursor: 'pointer', backgroundColor: activeBand === band ? T.accent : 'transparent', color: activeBand === band ? '#fff' : T.textSecondary }}>
                {band}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          {/* Add AP form */}
          <div style={{ backgroundColor: T.panelBg, padding: '1.2rem', borderRadius: '8px', border: T.border }}>
            <span style={{ display: 'block', fontSize: '0.65rem', fontWeight: 800, color: T.textMuted, textTransform: 'uppercase', marginBottom: '10px' }}>Add {activeBand} access point</span>
            <form onSubmit={handleAddAp} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <input type="text" placeholder="SSID / network name" value={newName} onChange={e => setNewName(e.target.value)} style={inputStyle} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
                <div>
                  <label style={{ fontSize: '0.6rem', color: T.textMuted, display: 'block', marginBottom: '2px' }}>Channel</label>
                  <select value={newChannel} onChange={e => setNewChannel(parseInt(e.target.value))} style={selectStyle}>
                    {channelsList.map(ch => <option key={ch} value={ch}>Ch {ch}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.6rem', color: T.textMuted, display: 'block', marginBottom: '2px' }}>Width</label>
                  <select value={newWidth} onChange={e => setNewWidth(parseInt(e.target.value))} style={selectStyle}>
                    {widthsList.map(w => <option key={w} value={w}>{w} MHz</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.6rem', color: T.textMuted, display: 'block', marginBottom: '2px' }}>Signal (dBm)</label>
                  <input type="number" min="-90" max="-30" value={newSignal} onChange={e => setNewSignal(parseInt(e.target.value) || -50)} style={{ ...inputStyle, padding: '6px' }} />
                </div>
              </div>
              <button type="submit" style={{ marginTop: '4px', padding: '8px', backgroundColor: T.accent, color: '#fff', border: 'none', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer' }}>+ Add access point</button>
            </form>
          </div>

          {/* Active APs */}
          <div style={{ backgroundColor: T.panelBg, padding: '1.2rem', borderRadius: '8px', border: T.border, flexGrow: 1 }}>
            <span style={{ display: 'block', fontSize: '0.65rem', fontWeight: 800, color: T.textMuted, textTransform: 'uppercase', marginBottom: '10px' }}>Active access points</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '180px', overflowY: 'auto' }}>
              {visibleAps.map(ap => {
                const { cci, aci } = evaluateRFOverlap(ap);
                return (
                  <div key={ap.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px', backgroundColor: T.insetBg, borderRadius: '6px', border: (cci || aci) ? `1px dashed ${T.danger}` : T.border }}>
                    <div>
                      <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: T.textPrimary }}>{ap.name} ({ap.width} MHz)</div>
                      <div style={{ fontSize: '0.65rem', color: T.textSecondary }}>Ch <span style={{ color: T.warning }}>{ap.channel}</span> &nbsp;|&nbsp; <span style={{ color: T.success }}>{ap.signal} dBm</span></div>
                    </div>
                    <button type="button" onClick={() => handleDeleteAp(ap.id, ap.name)} disabled={aps.length <= 1} style={{ backgroundColor: 'transparent', border: 'none', color: T.danger, cursor: 'pointer', padding: '4px 8px', fontSize: '0.85rem' }}>&#10005;</button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Interference */}
          <div style={{ backgroundColor: T.panelBg, padding: '1.2rem', borderRadius: '8px', border: T.border }}>
            <span style={{ display: 'block', fontSize: '0.65rem', fontWeight: 800, color: T.textMuted, textTransform: 'uppercase', marginBottom: '8px' }}>Inject interference</span>
            <div style={{ display: 'flex', gap: '6px', flexDirection: 'column' }}>
              {activeBand === '2.4G' && (
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button type="button" onClick={() => toggleInterference('Microwave')} style={{ flex: 1, padding: '10px', fontSize: '0.65rem', fontWeight: 'bold', borderRadius: '4px', border: `1px solid ${T.danger}`, cursor: 'pointer', backgroundColor: interferenceSources.some(i => i.type === 'Microwave') ? T.dangerSubtle : 'transparent', color: T.danger }}>Microwave (continuous)</button>
                  <button type="button" onClick={() => toggleInterference('Bluetooth')} style={{ flex: 1, padding: '10px', fontSize: '0.65rem', fontWeight: 'bold', borderRadius: '4px', border: `1px solid ${T.warning}`, cursor: 'pointer', backgroundColor: interferenceSources.some(i => i.type === 'Bluetooth') ? T.warningSubtle : 'transparent', color: T.warning }}>Bluetooth hopping</button>
                </div>
              )}
              {activeBand === '5G' && (
                <button type="button" onClick={() => toggleInterference('Satellite')} style={{ width: '100%', padding: '10px', fontSize: '0.65rem', fontWeight: 'bold', borderRadius: '4px', border: `1px solid ${T.danger}`, cursor: 'pointer', backgroundColor: interferenceSources.some(i => i.type === 'Satellite') ? T.dangerSubtle : 'transparent', color: T.danger }}>Satellite C-Band bleed</button>
              )}
              {activeBand === '6G' && (
                <div style={{ textAlign: 'center', fontSize: '0.65rem', color: T.textMuted, padding: '8px', border: T.border, borderRadius: '4px' }}>6 GHz is isolated from legacy microwave and satellite interference sources.</div>
              )}
            </div>
          </div>
        </div>

        {/* Frequency plot */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ flexGrow: 1, backgroundColor: T.insetBg, border: T.border, borderRadius: '12px', padding: '1.5rem', position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '320px' }}>
            <span style={{ fontSize: '0.65rem', color: T.accent, fontWeight: 'bold', fontFamily: 'monospace' }}>{bounds.label}</span>

            <div style={{ position: 'relative', flexGrow: 1, margin: '35px 0', borderBottom: `1px dashed ${T.borderColor}` }}>

              {/* Interference overlays */}
              {activeInterference.map(source => {
                const leftPct = ((source.centerFreq - source.width / 2 - bounds.min) / (bounds.max - bounds.min)) * 100;
                const widthPct = (source.width / (bounds.max - bounds.min)) * 100;
                return (
                  <div key={source.id} style={{ position: 'absolute', bottom: 0, left: `${leftPct}%`, width: `${widthPct}%`, height: `${source.dbmNoise}%`, background: `repeating-linear-gradient(45deg, ${T.dangerSubtle}, ${T.dangerSubtle} 6px, transparent 6px, transparent 12px)`, borderTop: `2px dotted ${source.type === 'Bluetooth' ? T.warning : T.danger}`, transition: 'all 0.3s ease', zIndex: 1 }}>
                    <span style={{ position: 'absolute', top: '-14px', left: '50%', transform: 'translateX(-50%)', fontSize: '0.55rem', color: source.type === 'Bluetooth' ? T.warning : T.danger, fontWeight: 'bold', whiteSpace: 'nowrap', textTransform: 'uppercase', backgroundColor: T.insetBg, padding: '0 4px', borderRadius: '3px' }}>
                      {source.type} noise
                    </span>
                  </div>
                );
              })}

              {/* AP arcs */}
              {visibleAps.map(ap => {
                const centerFreq = getChannelCenterFreq(ap.channel, ap.band);
                const leftPct   = ((centerFreq - bounds.min) / (bounds.max - bounds.min)) * 100;
                const widthPct  = (ap.width / (bounds.max - bounds.min)) * 100;
                const heightPct = Math.max(25, 100 + ap.signal);
                const { cci, aci } = evaluateRFOverlap(ap);
                return (
                  <div key={ap.id} style={{ position: 'absolute', bottom: 0, left: `${leftPct}%`, width: `${widthPct}%`, height: `${heightPct}%`, transform: 'translateX(-50%)', borderTopLeftRadius: '30px', borderTopRightRadius: '30px', background: (cci || aci) ? `linear-gradient(to top, ${T.dangerSubtle}, rgba(248,81,73,0.18))` : `linear-gradient(to top, ${T.accentSubtle}, rgba(68,147,248,0.1))`, borderLeft: `1px dashed ${cci ? T.danger : (aci ? T.warning : T.accent + '44')}`, borderRight: `1px dashed ${cci ? T.danger : (aci ? T.warning : T.accent + '44')}`, borderTop: `2px solid ${(cci || aci) ? T.danger : T.success}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', paddingBottom: '10px', transition: 'all 0.3s ease', zIndex: 2 }}>
                    {cci && <span style={{ position: 'absolute', top: '-18px', backgroundColor: T.danger, color: '#fff', fontSize: '0.45rem', padding: '1px 4px', borderRadius: '3px', fontWeight: 'bold', whiteSpace: 'nowrap' }}>CCI</span>}
                    {!cci && aci && <span style={{ position: 'absolute', top: '-18px', backgroundColor: T.warning, color: '#000', fontSize: '0.45rem', padding: '1px 4px', borderRadius: '3px', fontWeight: 'bold', whiteSpace: 'nowrap' }}>ACI OVERLAP</span>}
                    <span style={{ fontSize: '0.55rem', fontFamily: 'monospace', color: T.textPrimary, fontWeight: 'bold', textAlign: 'center', maxWidth: '95%', overflow: 'hidden' }}>{ap.name}</span>
                    <span style={{ fontSize: '0.5rem', color: T.textMuted }}>{ap.width} MHz</span>
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: `1px solid ${T.borderSubtle}`, paddingTop: '4px', fontSize: '0.55rem', color: T.textMuted, fontFamily: 'monospace' }}>
              <span>{bounds.min} MHz</span>
              <span>{Math.floor(bounds.min + (bounds.max - bounds.min) * 0.5)} MHz</span>
              <span>{bounds.max} MHz</span>
            </div>
          </div>

          {/* Log */}
          <div style={{ backgroundColor: T.termBg, padding: '1rem', borderRadius: '8px', border: `1px solid ${T.termBorder}`, fontFamily: 'monospace', fontSize: '0.75rem', lineHeight: '1.5', color: T.termText }}>
            <span style={{ color: T.termMuted, display: 'block', borderBottom: `1px solid ${T.termBorder}`, paddingBottom: '4px', marginBottom: '8px', fontWeight: 'bold' }}>Spectrum log</span>
            <div>{log}</div>
          </div>
        </div>
      </div>

      {/* Theory */}
      <div style={{ borderTop: T.border, paddingTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', fontSize: '0.8rem', lineHeight: '1.5' }}>

        <div style={{ backgroundColor: T.panelBg, padding: '1.2rem', borderRadius: '8px', border: T.border }}>
          <h4 style={{ margin: '0 0 8px 0', fontSize: '1rem', fontWeight: 700, color: T.danger }}>CCI vs. ACI</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
            <div>
              <h5 style={{ margin: '0 0 4px 0', fontSize: '0.8rem', fontWeight: 700, color: T.warning }}>Co-Channel Interference (CCI)</h5>
              <p style={{ margin: 0, color: T.textSecondary, fontSize: '0.75rem' }}>CCI occurs when APs share the exact same frequency block. Because 802.11 uses CSMA/CA, endpoints pause when they hear another preamble. CCI turns the link into a shared airtime slot machine, causing high latency as nodes wait their turn.</p>
            </div>
            <div>
              <h5 style={{ margin: '0 0 4px 0', fontSize: '0.8rem', fontWeight: 700, color: T.danger }}>Adjacent-Channel Interference (ACI)</h5>
              <p style={{ margin: 0, color: T.textSecondary, fontSize: '0.75rem' }}>ACI occurs when signals bleed into overlapping curves (e.g., APs on channels 1 and 4). This is destructive physical noise. Radios cannot decode overlapping headers, so they cannot negotiate airtime — leading directly to dropped frames and high noise floors.</p>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
          {activeBand === '2.4G' && (
            <>
              <div>
                <h4 style={{ margin: '0 0 6px 0', fontSize: '0.95rem', fontWeight: 700, color: T.warning }}>2.4 GHz layout guidelines</h4>
                <p style={{ margin: 0, color: T.textSecondary }}>The 2.4 GHz band penetrates walls well but faces heavy congestion. Stick to a 1, 6, 11 channel plan to avoid side-lobe overlap. The UK (Ofcom) unlocks channel 13; the US (FCC) caps at channel 11.</p>
              </div>
              <div>
                <h4 style={{ margin: '0 0 6px 0', fontSize: '0.95rem', fontWeight: 700, color: T.danger }}>Layer 1 contaminants</h4>
                <p style={{ margin: 0, color: T.textSecondary }}>Industrial microwave ovens, analog video links, and legacy Bluetooth hardware saturate these frequencies without checking headers. This degrades SNR, corrupts frames, and drives up retransmission rates.</p>
              </div>
            </>
          )}
          {activeBand === '5G' && (
            <>
              <div>
                <h4 style={{ margin: '0 0 6px 0', fontSize: '0.95rem', fontWeight: 700, color: T.accent }}>5 GHz channel bonding</h4>
                <p style={{ margin: 0, color: T.textSecondary }}>5 GHz offers up to 25 clean 20 MHz channels. But bonding into 80 or 160 MHz channels reduces the number of unique non-overlapping options significantly. Placing a standard 20 MHz AP next to an over-bonded cell causes serious ACI bleed.</p>
              </div>
              <div>
                <h4 style={{ margin: '0 0 6px 0', fontSize: '0.95rem', fontWeight: 700, color: T.warning }}>DFS radar avoidance</h4>
                <p style={{ margin: 0, color: T.textSecondary }}>Middle U-NII bands share spectrum with meteorological and aviation radar. APs on DFS channels must vacate the channel immediately if a radar pulse is detected, causing brief client disruption.</p>
              </div>
            </>
          )}
          {activeBand === '6G' && (
            <>
              <div>
                <h4 style={{ margin: '0 0 6px 0', fontSize: '0.95rem', fontWeight: 700, color: T.success }}>6 GHz greenfield advantage</h4>
                <p style={{ margin: 0, color: T.textSecondary }}>Available via Wi-Fi 6E and Wi-Fi 7, the 6 GHz band excludes all legacy clients, eliminating backward-compatibility overhead. However, using 320 MHz channels consumes the available spectrum rapidly, making CCI inevitable if neighbouring APs overlap.</p>
              </div>
              <div>
                <h4 style={{ margin: '0 0 6px 0', fontSize: '0.95rem', fontWeight: 700, color: T.accent }}>Preferred Scanning Channels & preamble puncturing</h4>
                <p style={{ margin: 0, color: T.textSecondary }}>Discovery is limited to Preferred Scanning Channels (PSC) to save battery. If an out-of-band carrier blocks a frequency slice, Wi-Fi 7 uses preamble puncturing to isolate the noisy 20 MHz sub-channel while keeping traffic flowing on the rest.</p>
              </div>
            </>
          )}
        </div>
      </div>

    </div>
  );
};

export default WifiAnalyzer;
