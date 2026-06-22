import React, { useState, useEffect } from 'react';
import { calculateSubnet } from './subnetUtils';

interface PracticeStationProps {
  isDarkMode?: boolean;
}

interface Question {
  type: 'network' | 'broadcast' | 'mask';
  ip: string;
  cidr: number;
  text: string;
  correctAnswer: string;
}

export const PracticeStation: React.FC<PracticeStationProps> = ({ isDarkMode = true }) => {
  const [question, setQuestion] = useState<Question | null>(null);
  const [userAnswer, setUserAnswer] = useState<string>('');
  const [hasSubmitted, setHasSubmitted] = useState<boolean>(false);
  const [isCorrect, setIsCorrect] = useState<boolean>(false);
  const [streak, setStreak] = useState<number>(0);

  const generateQuestion = () => {
    setUserAnswer('');
    setHasSubmitted(false);

    const classes = [
      { base: '192.168.', minCidr: 24, maxCidr: 30, thirdMax: 254 },
      { base: '172.16.', minCidr: 16, maxCidr: 23, thirdMax: 31 },
      { base: '10.', minCidr: 8, maxCidr: 15, thirdMax: 254 }
    ];
    
    const selectedClass = classes[Math.floor(Math.random() * classes.length)];
    const cidr = Math.floor(Math.random() * (selectedClass.maxCidr - selectedClass.minCidr + 1)) + selectedClass.minCidr;
    
    const octet3 = Math.floor(Math.random() * (selectedClass.thirdMax + 1));
    const octet4 = Math.floor(Math.random() * 254) + 1;
    const generatedIp = `${selectedClass.base}${selectedClass.base.split('.').length === 3 ? octet4 : `${octet3}.${octet4}`}`;

    const results = calculateSubnet(generatedIp, cidr);
    
    const types: ('network' | 'broadcast' | 'mask')[] = ['network', 'broadcast', 'mask'];
    const selectedType = types[Math.floor(Math.random() * types.length)];

    let text = '';
    let correctAnswer = '';

    switch (selectedType) {
      case 'network':
        text = `Given the host address ${generatedIp}/${cidr}, what is the valid Network ID address?`;
        correctAnswer = results.networkAddress;
        break;
      case 'broadcast':
        text = `Given the host address ${generatedIp}/${cidr}, what is the valid Broadcast Address?`;
        correctAnswer = results.broadcastAddress;
        break;
      case 'mask':
        text = `What is the standard decimal Subnet Mask representation for a /${cidr} prefix?`;
        correctAnswer = results.subnetMask;
        break;
    }

    setQuestion({ type: selectedType, ip: generatedIp, cidr, text, correctAnswer });
  };

  useEffect(() => {
    generateQuestion();
  }, []);

  const checkAnswer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!question || hasSubmitted) return;

    const formattedUserAns = userAnswer.trim();
    const correct = formattedUserAns === question.correctAnswer;

    setIsCorrect(correct);
    setHasSubmitted(true);
    setStreak(prev => (correct ? prev + 1 : 0));
  };

  const styles = {
    panelBg: isDarkMode ? '#111827' : '#ffffff',
    panelBorder: isDarkMode ? '#1e293b' : '#f1f5f9',
    titleText: isDarkMode ? '#f8fafc' : '#0f172a',
    descText: isDarkMode ? '#94a3b8' : '#64748b',
    cardBg: isDarkMode ? '#1e293b' : '#f8fafc',
    inputBg: isDarkMode ? '#0f172a' : '#ffffff',
    inputText: isDarkMode ? '#ffffff' : '#0f172a',
    inputBorder: isDarkMode ? '#475569' : '#cbd5e1',
    buttonBg: isDarkMode ? '#f8fafc' : '#0f172a',
    buttonText: isDarkMode ? '#0f172a' : '#ffffff'
  };

  if (!question) return null;

  return (
    <div style={{
      maxWidth: '800px',
      margin: '0 auto',
      padding: '2.5rem',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      backgroundColor: styles.panelBg,
      borderRadius: '16px',
      boxShadow: isDarkMode ? '0 20px 25px -5px rgba(0, 0, 0, 0.3)' : '0 10px 25px -5px rgba(0, 0, 0, 0.05)',
      border: `1px solid ${styles.panelBorder}`,
      transition: 'all 0.3s ease'
    }}>
      
      {/* Header Info Container - Aligned */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '2rem', 
        borderBottom: `2px solid ${styles.panelBorder}`, 
        paddingBottom: '1.25rem', 
        flexWrap: 'wrap', 
        gap: '1rem' 
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <h3 style={{ color: styles.titleText, fontSize: '1.5rem', fontWeight: 700, margin: 0, lineHeight: '1.2' }}>
            Subnetting Practice Station
          </h3>
          <p style={{ color: styles.descText, margin: 0, fontSize: '0.9rem', fontWeight: 500 }}>
            Test your bitwise conversion speed against random infrastructure scenarios.
          </p>
        </div>
        
        <div style={{
          backgroundColor: streak > 0 ? '#15803d' : (isDarkMode ? '#334155' : '#cbd5e1'),
          color: '#ffffff',
          padding: '0.55rem 1.1rem',
          borderRadius: '10px',
          fontWeight: 800,
          fontSize: '0.85rem',
          letterSpacing: '0.05em',
          transition: 'all 0.3s',
          alignSelf: 'center'
        }}>
          🔥 STREAK: {streak}
        </div>
      </div>

      {/* Core Question Layout Area */}
      <form onSubmit={checkAnswer} style={{ backgroundColor: styles.cardBg, padding: '2rem', borderRadius: '12px', border: `2px solid ${styles.panelBorder}` }}>
        <p style={{ color: styles.titleText, fontSize: '1.15rem', fontWeight: 700, margin: '0 0 1.5rem 0', lineHeight: '1.5' }}>
          {question.text}
        </p>

        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
          <input
            type="text"
            value={userAnswer}
            disabled={hasSubmitted}
            onChange={(e) => setUserAnswer(e.target.value)}
            style={{
              flex: '2 1 300px',
              padding: '0.75rem 1rem',
              fontSize: '1.1rem',
              fontWeight: 600,
              fontFamily: 'monospace',
              borderRadius: '8px',
              border: `2px solid ${styles.inputBorder}`,
              backgroundColor: styles.inputBg,
              color: styles.inputText,
              outline: 'none'
            }}
            placeholder="e.g., 255.255.255.0"
            autoFocus
          />
          
          {!hasSubmitted ? (
            <button type="submit" style={{ flex: '1 1 150px', padding: '0.75rem 1.5rem', backgroundColor: '#1d4ed8', color: '#ffffff', border: 'none', borderRadius: '8px', fontSize: '1rem', fontWeight: 700, cursor: 'pointer' }}>
              Submit Answer
            </button>
          ) : (
            <button type="button" onClick={generateQuestion} style={{ flex: '1 1 150px', padding: '0.75rem 1.5rem', backgroundColor: styles.buttonBg, color: styles.buttonText, border: 'none', borderRadius: '8px', fontSize: '1rem', fontWeight: 700, cursor: 'pointer' }}>
              Next Scenario ➡️
            </button>
          )}
        </div>

        {/* Validation Result Shading Alert */}
        {hasSubmitted && (
          <div style={{
            padding: '1.25rem',
            borderRadius: '8px',
            backgroundColor: isCorrect ? (isDarkMode ? '#064e3b' : '#dcfce7') : (isDarkMode ? '#7f1d1d' : '#fee2e2'),
            border: `2px solid ${isCorrect ? '#22c55e' : '#ef4444'}`,
            color: isCorrect ? (isDarkMode ? '#a7f3d0' : '#14532d') : (isDarkMode ? '#fecaca' : '#7f1d1d'),
            fontWeight: 700,
            fontSize: '1rem'
          }}>
            {isCorrect ? (
              <span>🎯 Perfect! That is the correct binary boundary block format.</span>
            ) : (
              <div>
                <span style={{ display: 'block', marginBottom: '0.25rem' }}>❌ Incorrect.</span>
                <span style={{ fontSize: '0.9rem', fontFamily: 'monospace', opacity: 0.9 }}>Correct value: {question.correctAnswer}</span>
              </div>
            )}
          </div>
        )}
      </form>
    </div>
  );
};