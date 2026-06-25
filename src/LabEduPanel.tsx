import React, { useState } from 'react';
import { getLabTheme } from './labTheme';

export type EduType = 'exam' | 'config' | 'gotcha' | 'realworld';

export interface EduCard {
  type: EduType;
  title: string;
  body: string;
  code?: string;
}

interface Props {
  cards: EduCard[];
  isDarkMode?: boolean;
}

const TYPE_META: Record<EduType, { icon: string; label: string; color: string; borderColor: string }> = {
  exam:      { icon:'📝', label:'Exam Tip',       color:'#d29922', borderColor:'#d2992240' },
  config:    { icon:'💻', label:'IOS / CLI',       color:'#4493f8', borderColor:'#4493f840' },
  gotcha:    { icon:'⚠️',  label:'Common Gotcha',  color:'#f85149', borderColor:'#f8514940' },
  realworld: { icon:'🌐', label:'Real World',      color:'#3fb950', borderColor:'#3fb95040' },
};

function ConfigCard({ card, T }: { card: EduCard; T: ReturnType<typeof getLabTheme> }) {
  const [open, setOpen] = useState(false);
  const m = TYPE_META[card.type];
  return (
    <div style={{ background:T.cardBg, border:`1px solid ${T.borderColor}`, borderRadius:12, borderLeft:`4px solid ${m.color}`, overflow:'hidden' }}>
      <div style={{ padding:'0.9rem 1rem' }}>
        <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:6 }}>
          <span style={{ fontSize:'0.75rem' }}>{m.icon}</span>
          <span style={{ fontSize:'0.6rem', fontWeight:800, padding:'2px 7px', borderRadius:20, background:`${m.color}18`, color:m.color, border:`1px solid ${m.borderColor}`, textTransform:'uppercase', letterSpacing:'0.07em' }}>{m.label}</span>
          <span style={{ fontWeight:700, fontSize:'0.82rem', color:T.textPrimary }}>{card.title}</span>
        </div>
        <p style={{ margin:0, fontSize:'0.78rem', color:T.textSecondary, lineHeight:1.6 }}>{card.body}</p>
        {card.code && (
          <button type="button" onClick={() => setOpen(v=>!v)} style={{ marginTop:'0.65rem', display:'flex', alignItems:'center', gap:5, background:'none', border:`1px solid ${T.borderColor}`, borderRadius:6, padding:'4px 10px', cursor:'pointer', color:T.accent, fontSize:'0.68rem', fontWeight:700, fontFamily:'inherit' }}>
            {open ? '▲ Hide' : '▼ Show'} {card.type==='config'?'config':'example'}
          </button>
        )}
      </div>
      {open && card.code && (
        <div style={{ borderTop:`1px solid ${T.borderColor}`, borderRadius:'0 0 8px 8px', overflow:'hidden' }}>
          <div style={{ background:'#1a1a2e', padding:'0.4rem 0.9rem', display:'flex', alignItems:'center', gap:7 }}>
            <div style={{ display:'flex', gap:4 }}>
              {['#ff5f56','#ffbd2e','#27c93f'].map(c=><div key={c} style={{ width:8,height:8,borderRadius:'50%',background:c }} />)}
            </div>
            <span style={{ fontFamily:'monospace', fontSize:'0.6rem', color:'#8b949e' }}>
              {card.type==='config' ? 'terminal — ios / cli' : 'example'}
            </span>
          </div>
          <pre style={{ margin:0, background:'#0d1117', padding:'0.8rem 1rem', fontSize:'0.68rem', lineHeight:1.75, fontFamily:'\'Fira Code\',\'Cascadia Code\',monospace', overflowX:'auto', whiteSpace:'pre', color:'#e6edf3' }}>
            {card.code.split('\n').map((line,i)=>{
              const isComment = line.trimStart().startsWith('!') || line.trimStart().startsWith('#') || line.trimStart().startsWith('//');
              const isKey     = /^[A-Za-z][\w-]*[\s(]/.test(line.trimStart()) && !isComment;
              return <span key={i} style={{ display:'block', color: isComment?'#8b949e':isKey?'#7ee787':'#e6edf3' }}>{line}</span>;
            })}
          </pre>
        </div>
      )}
    </div>
  );
}

export const LabEduPanel: React.FC<Props> = ({ cards, isDarkMode = true }) => {
  const [open, setOpen] = useState(false);
  const T = getLabTheme(isDarkMode);
  const counts: Partial<Record<EduType,number>> = {};
  for (const c of cards) counts[c.type] = (counts[c.type]??0)+1;

  return (
    <div style={{ marginTop:'1.5rem', borderTop:`1px solid ${T.borderColor}`, paddingTop:'1rem' }}>
      <button type="button" onClick={()=>setOpen(v=>!v)} style={{ display:'flex', alignItems:'center', gap:10, background:'none', border:`1px solid ${T.borderColor}`, borderRadius:10, padding:'0.6rem 1rem', cursor:'pointer', color:T.textPrimary, fontFamily:'inherit', width:'100%', textAlign:'left', transition:'background 0.15s' }}>
        <span style={{ fontSize:'0.75rem', fontWeight:800 }}>📚</span>
        <span style={{ fontSize:'0.82rem', fontWeight:700, flex:1 }}>Study Guide</span>
        <div style={{ display:'flex', gap:6 }}>
          {(Object.entries(counts) as [EduType,number][]).map(([type,n])=>(
            <span key={type} style={{ fontSize:'0.6rem', fontWeight:700, padding:'2px 7px', borderRadius:20, background:`${TYPE_META[type].color}18`, color:TYPE_META[type].color, border:`1px solid ${TYPE_META[type].borderColor}` }}>
              {TYPE_META[type].icon} {n}
            </span>
          ))}
        </div>
        <span style={{ fontSize:'0.8rem', color:T.textMuted, marginLeft:4 }}>{open?'▲':'▼'}</span>
      </button>

      {open && (
        <div style={{ marginTop:'1rem', display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(340px, 1fr))', gap:'0.85rem' }}>
          {cards.map((c,i) => <ConfigCard key={i} card={c} T={T} />)}
        </div>
      )}
    </div>
  );
};

export default LabEduPanel;
