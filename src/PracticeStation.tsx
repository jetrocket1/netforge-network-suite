import React, { useState, useEffect } from 'react';
import type { CSSProperties } from 'react';
import { calculateSubnet } from './subnetUtils';
import { getLabTheme } from './labTheme';
import {
  TOPIC_META,
  EXAM_META,
  getByTopic,
  getForExam,
} from './data/examQuestions';
import type { MCQuestion, Topic, ExamType } from './data/examQuestions';

// ─── Local types ──────────────────────────────────────────────────────────────

type Screen = 'home' | 'practice' | 'drill' | 'exam' | 'results';

interface DrillQuestion {
  ip: string;
  cidr: number;
  text: string;
  correctAnswer: string;
}

interface ExamResult {
  examType: ExamType;
  questions: MCQuestion[];
  answers: (number | null)[];
  elapsed: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

function makeDrillQ(): DrillQuestion {
  const classes = [
    { base: '192.168.', minCidr: 24, maxCidr: 30, thirdMax: 254 },
    { base: '172.16.',  minCidr: 16, maxCidr: 23, thirdMax: 31  },
    { base: '10.',      minCidr:  8, maxCidr: 15, thirdMax: 254 },
  ];
  const cls  = classes[Math.floor(Math.random() * classes.length)];
  const cidr = Math.floor(Math.random() * (cls.maxCidr - cls.minCidr + 1)) + cls.minCidr;
  const o3   = Math.floor(Math.random() * (cls.thirdMax + 1));
  const o4   = Math.floor(Math.random() * 254) + 1;
  const ip   = `${cls.base}${cls.base.split('.').length === 3 ? o4 : `${o3}.${o4}`}`;
  const res  = calculateSubnet(ip, cidr);
  const types = ['network', 'broadcast', 'mask'] as const;
  const type = types[Math.floor(Math.random() * types.length)];
  const map = {
    network:   { text: `Given ${ip}/${cidr}, what is the Network Address?`,           answer: res.networkAddress   },
    broadcast: { text: `Given ${ip}/${cidr}, what is the Broadcast Address?`,         answer: res.broadcastAddress },
    mask:      { text: `What is the dotted-decimal Subnet Mask for a /${cidr} prefix?`, answer: res.subnetMask     },
  };
  return { ip, cidr, text: map[type].text, correctAnswer: map[type].answer };
}

// ─── Component ────────────────────────────────────────────────────────────────

export const PracticeStation: React.FC<{ isDarkMode?: boolean; isPro?: boolean; onUpgrade?: () => void }> = ({ isDarkMode = true, isPro = false, onUpgrade }) => {
  const T = getLabTheme(isDarkMode);

  // ── Screen state ─────────────────────────────────────────────────────────────
  const [screen, setScreen] = useState<Screen>('home');

  // ── Practice (MCQ topic) state ───────────────────────────────────────────────
  const [practiceTopic,   setPracticeTopic]   = useState<Topic>('osi');
  const [practiceQs,      setPracticeQs]      = useState<MCQuestion[]>([]);
  const [pqIdx,           setPqIdx]           = useState(0);
  const [selected,        setSelected]        = useState<number | null>(null);
  const [practiceStreak,  setPracticeStreak]  = useState(0);
  const [practiceCorrect, setPracticeCorrect] = useState(0);
  const [practiceTotal,   setPracticeTotal]   = useState(0);

  // ── Drill (subnetting type-in) state ─────────────────────────────────────────
  const [drillQ,         setDrillQ]         = useState<DrillQuestion | null>(null);
  const [drillAnswer,    setDrillAnswer]    = useState('');
  const [drillSubmitted, setDrillSubmitted] = useState(false);
  const [drillCorrect,   setDrillCorrect]   = useState(false);
  const [drillStreak,    setDrillStreak]    = useState(0);

  // ── Exam state ───────────────────────────────────────────────────────────────
  const [examType,    setExamType]    = useState<ExamType>('network+');
  const [examQs,      setExamQs]      = useState<MCQuestion[]>([]);
  const [examIdx,     setExamIdx]     = useState(0);
  const [examAnswers, setExamAnswers] = useState<(number | null)[]>([]);
  const [examElapsed, setExamElapsed] = useState(0);

  // ── Results state ─────────────────────────────────────────────────────────────
  const [results,     setResults]     = useState<ExamResult | null>(null);
  const [reviewOpen,  setReviewOpen]  = useState(false);

  // Exam timer
  useEffect(() => {
    if (screen !== 'exam') return;
    const id = setInterval(() => setExamElapsed(e => e + 1), 1000);
    return () => clearInterval(id);
  }, [screen]);

  // ── Navigation ────────────────────────────────────────────────────────────────

  const startPractice = (topic: Topic) => {
    setPracticeTopic(topic);
    setPracticeQs(getByTopic(topic));
    setPqIdx(0);
    setSelected(null);
    setPracticeStreak(0);
    setPracticeCorrect(0);
    setPracticeTotal(0);
    setScreen('practice');
  };

  const startDrill = () => {
    setDrillStreak(0);
    setDrillQ(makeDrillQ());
    setDrillAnswer('');
    setDrillSubmitted(false);
    setScreen('drill');
  };

  const nextDrillQ = () => {
    setDrillQ(makeDrillQ());
    setDrillAnswer('');
    setDrillSubmitted(false);
  };

  const startExam = (type: ExamType) => {
    const qs = getForExam(type, 20);
    setExamType(type);
    setExamQs(qs);
    setExamIdx(0);
    setExamAnswers(Array<null>(qs.length).fill(null));
    setExamElapsed(0);
    setScreen('exam');
  };

  const submitExam = () => {
    setResults({ examType, questions: examQs, answers: examAnswers, elapsed: examElapsed });
    setReviewOpen(false);
    setScreen('results');
  };

  const goHome = () => setScreen('home');

  // ── Shared styles ─────────────────────────────────────────────────────────────

  const outerCard: CSSProperties = {
    maxWidth: 800, margin: '0 auto',
    padding: '2rem',
    background: T.cardBg,
    border: `1px solid ${T.borderColor}`,
    borderRadius: 16,
    color: T.textPrimary,
    fontFamily: 'system-ui, -apple-system, sans-serif',
  };

  const panel: CSSProperties = {
    background: T.panelBg,
    border: `1px solid ${T.borderColor}`,
    borderRadius: 12,
    padding: '1.5rem',
  };

  const btnStyles: Record<string, CSSProperties> = {
    accent:  { background: T.accent,  color: '#fff', border: 'none' },
    ghost:   { background: T.panelBg, color: T.textSecondary, border: `1px solid ${T.borderColor}` },
    success: { background: T.success, color: '#fff', border: 'none' },
    muted:   { background: 'transparent', color: T.textMuted, border: 'none' },
  };
  const mkBtn = (variant: keyof typeof btnStyles, extra?: CSSProperties): CSSProperties => ({
    cursor: 'pointer', fontFamily: 'inherit', borderRadius: 8,
    fontWeight: 700, fontSize: '0.85rem', padding: '0.6rem 1rem',
    ...btnStyles[variant], ...extra,
  });

  const optBase: CSSProperties = {
    cursor: 'pointer', fontFamily: 'inherit', borderRadius: 10,
    padding: '0.7rem 1rem', textAlign: 'left', width: '100%',
    fontSize: '0.87rem', fontWeight: 500,
    display: 'flex', gap: 10, alignItems: 'flex-start',
    border: `1px solid ${T.borderColor}`,
    background: T.panelBg, color: T.textPrimary,
  };

  // ──────────────────────────────────────────────────────────────────────────────
  // HOME
  // ──────────────────────────────────────────────────────────────────────────────
  if (screen === 'home') {
    return (
      <div style={outerCard}>
        <h2 style={{ margin: '0 0 0.3rem', fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em' }}>Practice &amp; Exams</h2>
        <p style={{ margin: '0 0 2rem', color: T.textSecondary, fontSize: '0.9rem' }}>
          Topic drills, subnetting practice, and full mock exams for Network+ and Security+.
        </p>

        {/* Topic Practice */}
        <section style={{ marginBottom: '2rem' }}>
          <h3 style={{ margin: '0 0 0.75rem', fontSize: '0.72rem', fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
            Topic Practice — MCQ with instant feedback
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(175px, 1fr))', gap: '0.6rem' }}>
            {(Object.keys(TOPIC_META) as Topic[]).map(topic => {
              const m = TOPIC_META[topic];
              return (
                <button
                  key={topic}
                  onClick={() => startPractice(topic)}
                  style={{
                    ...mkBtn('ghost', { display: 'flex', alignItems: 'center', gap: 8, padding: '0.75rem 0.9rem', fontSize: '0.83rem', textAlign: 'left' }),
                    borderLeft: `3px solid ${m.color}`, borderRadius: 10, color: T.textPrimary,
                  }}
                >
                  <span style={{ fontSize: '1rem', flexShrink: 0 }}>{m.icon}</span>
                  <span style={{ fontWeight: 600 }}>{m.label}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Subnetting Drill */}
        <section style={{ marginBottom: '2rem' }}>
          <h3 style={{ margin: '0 0 0.75rem', fontSize: '0.72rem', fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
            Subnetting Drill — type-in answers
          </h3>
          <div style={{ ...panel, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', padding: '1rem 1.25rem' }}>
            <div>
              <p style={{ margin: '0 0 0.2rem', fontWeight: 700, color: T.textPrimary, fontSize: '0.9rem' }}>🔢 Subnetting Drill</p>
              <p style={{ margin: 0, color: T.textSecondary, fontSize: '0.78rem' }}>Calculate network, broadcast, and mask from random host IPs</p>
            </div>
            <button onClick={startDrill} style={mkBtn('accent', { whiteSpace: 'nowrap', flexShrink: 0 })}>Start Drill</button>
          </div>
        </section>

        {/* Mock Exams */}
        <section>
          <h3 style={{ margin: '0 0 0.75rem', fontSize: '0.72rem', fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
            Mock Exams
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.75rem' }}>
            {(['network+', 'security+'] as ExamType[]).map(type => {
              const m = EXAM_META[type];
              return (
                <div key={type} style={{ ...panel, padding: '1.25rem', borderTop: `3px solid ${m.color}`, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <p style={{ margin: '0 0 0.2rem', fontWeight: 800, fontSize: '0.95rem', color: T.textPrimary }}>{m.label}</p>
                      <p style={{ margin: 0, color: T.textSecondary, fontSize: '0.77rem' }}>{m.description}</p>
                    </div>
                    {!isPro && (
                      <span style={{ fontSize: '0.6rem', fontWeight: 800, color: T.accent, background: `${T.accent}18`, border: `1px solid ${T.accent}40`, padding: '2px 7px', borderRadius: 6, flexShrink: 0, marginLeft: 8 }}>PRO</span>
                    )}
                  </div>
                  {isPro
                    ? <button onClick={() => startExam(type)} style={mkBtn('accent', { textAlign: 'center' })}>Start Exam</button>
                    : <button onClick={onUpgrade} style={mkBtn('ghost', { textAlign: 'center', color: T.accent, borderColor: `${T.accent}50` })}>🔒 Unlock Pro — £4.99</button>
                  }
                </div>
              );
            })}
          </div>
        </section>
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────────────────────────
  // PRACTICE (MCQ topic)
  // ──────────────────────────────────────────────────────────────────────────────
  if (screen === 'practice') {
    const q       = practiceQs[pqIdx];
    const meta    = TOPIC_META[practiceTopic];
    const revealed = selected !== null;
    const isRight  = revealed && selected === q.answer;

    const handleSelect = (idx: number) => {
      if (selected !== null) return;
      setSelected(idx);
      const ok = idx === q.answer;
      if (ok) { setPracticeStreak(s => s + 1); setPracticeCorrect(c => c + 1); }
      else      setPracticeStreak(0);
      setPracticeTotal(t => t + 1);
    };

    const nextQ = () => {
      if (pqIdx + 1 >= practiceQs.length) {
        setPracticeQs(getByTopic(practiceTopic));
        setPqIdx(0);
      } else {
        setPqIdx(i => i + 1);
      }
      setSelected(null);
    };

    const optStyle = (i: number): CSSProperties => {
      if (!revealed)              return { ...optBase };
      if (i === q.answer)         return { ...optBase, background: T.successSubtle, borderColor: T.success };
      if (i === selected)         return { ...optBase, background: T.dangerSubtle,  borderColor: T.danger  };
      return { ...optBase, opacity: 0.45, cursor: 'default' };
    };

    return (
      <div style={outerCard}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <button onClick={goHome} style={mkBtn('muted', { padding: '0.3rem 0.5rem', fontSize: '0.8rem' })}>← Back</button>
            <span style={{ padding: '0.3rem 0.75rem', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700, background: `${meta.color}22`, color: meta.color, border: `1px solid ${meta.color}50` }}>
              {meta.icon} {meta.label}
            </span>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            {practiceTotal > 0 && <span style={{ fontSize: '0.78rem', color: T.textMuted }}>{practiceCorrect}/{practiceTotal}</span>}
            {practiceStreak > 1 && (
              <span style={{ padding: '0.25rem 0.65rem', borderRadius: 20, background: T.successSubtle, color: T.success, fontWeight: 700, fontSize: '0.75rem' }}>
                🔥 {practiceStreak} streak
              </span>
            )}
          </div>
        </div>

        {/* Question */}
        <div style={{ ...panel, marginBottom: '1.25rem' }}>
          <p style={{ margin: 0, fontSize: '1rem', fontWeight: 600, lineHeight: 1.65, color: T.textPrimary }}>{q.question}</p>
        </div>

        {/* Options */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1.25rem' }}>
          {q.options.map((opt, i) => (
            <button key={i} onClick={() => handleSelect(i)} style={optStyle(i)} disabled={revealed}>
              <span style={{ fontWeight: 800, fontSize: '0.73rem', flexShrink: 0, marginTop: 2, color: revealed && i === q.answer ? T.success : revealed && i === selected ? T.danger : T.textMuted }}>
                {String.fromCharCode(65 + i)}
              </span>
              <span style={{ flex: 1 }}>{opt}</span>
              {revealed && i === q.answer && <span style={{ color: T.success, fontWeight: 900, flexShrink: 0 }}>✓</span>}
              {revealed && i === selected && i !== q.answer && <span style={{ color: T.danger, fontWeight: 900, flexShrink: 0 }}>✗</span>}
            </button>
          ))}
        </div>

        {/* Explanation */}
        {revealed && (
          <div style={{ background: isRight ? T.successSubtle : T.dangerSubtle, border: `1px solid ${isRight ? T.success : T.danger}`, borderRadius: 10, padding: '1rem 1.25rem', marginBottom: '1.25rem' }}>
            <p style={{ margin: '0 0 0.3rem', fontWeight: 700, fontSize: '0.82rem', color: isRight ? T.success : T.danger }}>
              {isRight ? '✓ Correct!' : '✗ Incorrect'}
            </p>
            <p style={{ margin: 0, color: T.textSecondary, fontSize: '0.82rem', lineHeight: 1.65 }}>{q.explanation}</p>
          </div>
        )}

        {revealed && (
          <button onClick={nextQ} style={mkBtn('accent', { width: '100%', padding: '0.75rem', fontSize: '0.9rem', textAlign: 'center' })}>
            Next Question →
          </button>
        )}
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────────────────────────
  // DRILL (subnetting type-in)
  // ──────────────────────────────────────────────────────────────────────────────
  if (screen === 'drill') {
    if (!drillQ) return null;

    const checkDrill = (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (drillSubmitted) return;
      const ok = drillAnswer.trim() === drillQ.correctAnswer;
      setDrillCorrect(ok);
      setDrillSubmitted(true);
      setDrillStreak(s => ok ? s + 1 : 0);
    };

    return (
      <div style={outerCard}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <button onClick={goHome} style={mkBtn('muted', { padding: '0.3rem 0.5rem', fontSize: '0.8rem' })}>← Back</button>
            <span style={{ fontWeight: 800, fontSize: '1.05rem' }}>🔢 Subnetting Drill</span>
          </div>
          <div style={{ padding: '0.35rem 0.9rem', borderRadius: 10, fontWeight: 800, fontSize: '0.82rem', border: `1px solid ${T.borderColor}`, transition: 'all 0.3s', background: drillStreak > 0 ? T.success : T.panelBg, color: drillStreak > 0 ? '#fff' : T.textSecondary }}>
            STREAK: {drillStreak}
          </div>
        </div>

        <form onSubmit={checkDrill} style={{ ...panel, border: `2px solid ${T.borderColor}`, padding: '1.75rem' }}>
          <p style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0 0 1.5rem', lineHeight: 1.55 }}>{drillQ.text}</p>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
            <input
              type="text"
              value={drillAnswer}
              disabled={drillSubmitted}
              onChange={e => setDrillAnswer(e.target.value)}
              placeholder="e.g., 255.255.255.0"
              autoFocus
              style={{ flex: '2 1 260px', padding: '0.7rem 1rem', fontSize: '1rem', fontWeight: 600, fontFamily: 'monospace', borderRadius: 8, border: `2px solid ${T.borderColor}`, background: T.insetBg, color: T.textPrimary, outline: 'none' }}
            />
            {!drillSubmitted
              ? <button type="submit" style={mkBtn('accent', { flex: '1 1 120px', padding: '0.7rem 1rem', fontSize: '0.9rem', textAlign: 'center' })}>Submit</button>
              : <button type="button" onClick={nextDrillQ} style={{ flex: '1 1 120px', padding: '0.7rem 1rem', borderRadius: 8, background: T.textPrimary, color: T.cardBg, border: 'none', fontFamily: 'inherit', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', textAlign: 'center' }}>Next →</button>
            }
          </div>
          {drillSubmitted && (
            <div style={{ padding: '1rem 1.25rem', borderRadius: 8, background: drillCorrect ? T.successSubtle : T.dangerSubtle, border: `2px solid ${drillCorrect ? T.success : T.danger}`, fontWeight: 700, color: T.textPrimary }}>
              {drillCorrect
                ? 'Correct!'
                : <><span style={{ display: 'block', marginBottom: '0.2rem' }}>Incorrect.</span><span style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: T.textSecondary }}>Answer: {drillQ.correctAnswer}</span></>
              }
            </div>
          )}
        </form>
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────────────────────────
  // EXAM
  // ──────────────────────────────────────────────────────────────────────────────
  if (screen === 'exam') {
    const q    = examQs[examIdx];
    const meta = EXAM_META[examType];
    const answered = examAnswers.filter(a => a !== null).length;

    const selectAnswer = (idx: number) => {
      setExamAnswers(prev => { const next = [...prev]; next[examIdx] = idx; return next; });
    };

    return (
      <div style={outerCard}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{ padding: '0.3rem 0.75rem', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700, background: `${meta.color}22`, color: meta.color, border: `1px solid ${meta.color}50` }}>
              {meta.label}
            </span>
            <span style={{ fontSize: '0.8rem', color: T.textMuted }}>Q {examIdx + 1}/{examQs.length}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.8rem', color: T.textMuted }}>
            <span style={{ fontFamily: 'monospace' }}>⏱ {fmt(examElapsed)}</span>
            <span>{answered}/{examQs.length} answered</span>
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ height: 4, background: T.panelBg, borderRadius: 2, marginBottom: '1.5rem', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${((examIdx + 1) / examQs.length) * 100}%`, background: meta.color, borderRadius: 2, transition: 'width 0.2s' }} />
        </div>

        {/* Question */}
        <div style={{ ...panel, marginBottom: '1.25rem' }}>
          <p style={{ margin: 0, fontSize: '1rem', fontWeight: 600, lineHeight: 1.65, color: T.textPrimary }}>{q.question}</p>
        </div>

        {/* Options */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1.5rem' }}>
          {q.options.map((opt, i) => {
            const isSel = examAnswers[examIdx] === i;
            return (
              <button
                key={i}
                onClick={() => selectAnswer(i)}
                style={{ ...optBase, background: isSel ? T.accentSubtle : T.panelBg, borderColor: isSel ? T.accent : T.borderColor }}
              >
                <span style={{ fontWeight: 800, fontSize: '0.73rem', flexShrink: 0, marginTop: 2, color: isSel ? T.accent : T.textMuted }}>
                  {String.fromCharCode(65 + i)}
                </span>
                <span style={{ flex: 1 }}>{opt}</span>
                {isSel && <span style={{ color: T.accent, flexShrink: 0, fontWeight: 800 }}>●</span>}
              </button>
            );
          })}
        </div>

        {/* Navigation */}
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={goHome} style={mkBtn('ghost', { fontSize: '0.78rem', padding: '0.5rem 0.75rem' })}>✕ Abandon</button>
            {examIdx > 0 && <button onClick={() => setExamIdx(i => i - 1)} style={mkBtn('ghost')}>← Prev</button>}
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {examIdx < examQs.length - 1
              ? <button onClick={() => setExamIdx(i => i + 1)} style={mkBtn('accent')}>Next →</button>
              : <button onClick={submitExam} style={mkBtn('success', { padding: '0.6rem 1.5rem' })}>Finish Exam ✓</button>
            }
          </div>
        </div>

        {/* Question mini-map */}
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {examQs.map((_, i) => (
            <button
              key={i}
              onClick={() => setExamIdx(i)}
              style={{
                width: 26, height: 26, borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit',
                fontSize: '0.6rem', fontWeight: 700, border: 'none',
                background: i === examIdx ? meta.color : examAnswers[i] !== null ? T.accentSubtle : T.panelBg,
                color:      i === examIdx ? '#fff'      : examAnswers[i] !== null ? T.accent       : T.textMuted,
                outline: i === examIdx ? `2px solid ${meta.color}` : 'none',
                outlineOffset: 1,
              }}
            >
              {i + 1}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────────────────────────
  // RESULTS
  // ──────────────────────────────────────────────────────────────────────────────
  if (screen === 'results' && results) {
    const score    = results.answers.filter((a, i) => a === results.questions[i].answer).length;
    const pct      = Math.round((score / results.questions.length) * 100);
    const examMeta = EXAM_META[results.examType];
    const passed   = pct >= examMeta.passPercent;

    // Per-topic breakdown
    const topicMap: Record<string, { correct: number; total: number }> = {};
    results.questions.forEach((q, i) => {
      const label = TOPIC_META[q.topic].label;
      topicMap[label] ??= { correct: 0, total: 0 };
      topicMap[label].total += 1;
      if (results.answers[i] === q.answer) topicMap[label].correct += 1;
    });

    return (
      <div style={outerCard}>
        {/* Score hero */}
        <div style={{ textAlign: 'center', padding: '1.5rem 0 1.75rem', borderBottom: `1px solid ${T.borderColor}`, marginBottom: '1.75rem' }}>
          <div style={{ fontSize: '3.5rem', fontWeight: 900, lineHeight: 1, letterSpacing: '-0.03em', color: passed ? T.success : T.danger }}>
            {pct}%
          </div>
          <div style={{ fontSize: '0.9rem', color: T.textSecondary, margin: '0.5rem 0 1rem' }}>
            {score}/{results.questions.length} correct &middot; {fmt(results.elapsed)}
          </div>
          <span style={{ padding: '0.4rem 1.25rem', borderRadius: 20, fontWeight: 800, fontSize: '0.82rem', background: passed ? T.successSubtle : T.dangerSubtle, color: passed ? T.success : T.danger, border: `1px solid ${passed ? T.success : T.danger}` }}>
            {passed ? '✓ PASS' : '✗ FAIL'} &mdash; {examMeta.label} requires {examMeta.passPercent}%
          </span>
        </div>

        {/* Topic breakdown */}
        <h3 style={{ margin: '0 0 0.75rem', fontSize: '0.72rem', fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Topic Breakdown</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1.75rem' }}>
          {Object.entries(topicMap).map(([label, { correct, total }]) => {
            const tp = Math.round((correct / total) * 100);
            return (
              <div key={label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: '0.82rem', color: T.textPrimary }}>{label}</span>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: tp >= 75 ? T.success : T.danger }}>{correct}/{total}</span>
                </div>
                <div style={{ height: 6, background: T.panelBg, borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${tp}%`, background: tp >= 75 ? T.success : T.danger, borderRadius: 3 }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Review toggle */}
        <button onClick={() => setReviewOpen(r => !r)} style={{ ...mkBtn('ghost', { width: '100%', padding: '0.65rem', textAlign: 'center', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6 }), marginBottom: '0.75rem' }}>
          {reviewOpen ? '▲ Hide' : '▼ Review'} All Answers
        </button>

        {reviewOpen && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem' }}>
            {results.questions.map((q, i) => {
              const isOk  = results.answers[i] === q.answer;
              const uAns  = results.answers[i];
              return (
                <div key={i} style={{ background: isOk ? T.successSubtle : T.dangerSubtle, border: `1px solid ${isOk ? T.success : T.danger}`, borderRadius: 10, padding: '1rem' }}>
                  <p style={{ margin: '0 0 0.5rem', fontWeight: 600, fontSize: '0.82rem', color: T.textPrimary }}>
                    <span style={{ fontWeight: 800, color: isOk ? T.success : T.danger }}>{isOk ? '✓' : '✗'}</span>{' '}
                    Q{i + 1}: {q.question}
                  </p>
                  {!isOk && uAns !== null && <p style={{ margin: '0 0 0.2rem', fontSize: '0.76rem', color: T.danger }}>Your answer: {String.fromCharCode(65 + uAns)}. {q.options[uAns]}</p>}
                  {!isOk && uAns === null  && <p style={{ margin: '0 0 0.2rem', fontSize: '0.76rem', color: T.textMuted }}>Not answered</p>}
                  <p style={{ margin: '0 0 0.35rem', fontSize: '0.76rem', color: isOk ? T.success : T.textSecondary }}>
                    {!isOk && 'Correct: '}{String.fromCharCode(65 + q.answer)}. {q.options[q.answer]}
                  </p>
                  <p style={{ margin: 0, fontSize: '0.74rem', color: T.textSecondary, lineHeight: 1.55, fontStyle: 'italic' }}>{q.explanation}</p>
                </div>
              );
            })}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
          <button onClick={() => startExam(results.examType)} style={mkBtn('accent', { flex: '1 1 140px', textAlign: 'center' })}>Retake Exam</button>
          <button onClick={goHome} style={mkBtn('ghost', { flex: '1 1 140px', textAlign: 'center' })}>← Back to Home</button>
        </div>
      </div>
    );
  }

  return null;
};
