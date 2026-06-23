import React, { useState, useEffect } from 'react';
import { calculateSubnet } from './subnetUtils';
import { getLabTheme } from './labTheme';

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

  const T = getLabTheme(isDarkMode);

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

  if (!question) return null;

  return (
    <div style={{
      maxWidth: '800px',
      margin: '0 auto',
      padding: '2.5rem',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      backgroundColor: T.cardBg,
      borderRadius: '16px',
      border: `1px solid ${T.borderColor}`,
      color: T.textPrimary
    }}>
      
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '2rem', 
        borderBottom: `2px solid ${T.borderColor}`, 
        paddingBottom: '1.25rem', 
        flexWrap: 'wrap', 
        gap: '1rem' 
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0, lineHeight: '1.2' }}>
            Subnetting Practice Station
          </h3>
          <p style={{ color: T.textSecondary, margin: 0, fontSize: '0.9rem', fontWeight: 500 }}>
            Test your bitwise conversion speed against random infrastructure scenarios.
          </p>
        </div>
        
        <div style={{
          backgroundColor: streak > 0 ? T.success : T.panelBg,
          color: streak > 0 ? '#fff' : T.textSecondary,
          padding: '0.55rem 1.1rem',
          borderRadius: '10px',
          fontWeight: 800,
          fontSize: '0.85rem',
          letterSpacing: '0.05em',
          transition: 'all 0.3s',
          alignSelf: 'center',
          border: `1px solid ${T.borderColor}`
        }}>
          STREAK: {streak}
        </div>
      </div>

      <form onSubmit={checkAnswer} style={{ backgroundColor: T.panelBg, padding: '2rem', borderRadius: '12px', border: `2px solid ${T.borderColor}` }}>
        <p style={{ fontSize: '1.15rem', fontWeight: 700, margin: '0 0 1.5rem 0', lineHeight: '1.5' }}>
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
              border: `2px solid ${T.borderColor}`,
              backgroundColor: T.insetBg,
              color: T.textPrimary,
              outline: 'none'
            }}
            placeholder="e.g., 255.255.255.0"
            autoFocus
          />
          
          {!hasSubmitted ? (
            <button type="submit" style={{ flex: '1 1 150px', padding: '0.75rem 1.5rem', backgroundColor: T.accent, color: '#ffffff', border: 'none', borderRadius: '8px', fontSize: '1rem', fontWeight: 700, cursor: 'pointer' }}>
              Submit Answer
            </button>
          ) : (
            <button type="button" onClick={generateQuestion} style={{ flex: '1 1 150px', padding: '0.75rem 1.5rem', backgroundColor: T.textPrimary, color: T.cardBg, border: 'none', borderRadius: '8px', fontSize: '1rem', fontWeight: 700, cursor: 'pointer' }}>
              Next Scenario
            </button>
          )}
        </div>

        {hasSubmitted && (
          <div style={{
            padding: '1.25rem',
            borderRadius: '8px',
            backgroundColor: isCorrect ? T.successSubtle : T.dangerSubtle,
            border: `2px solid ${isCorrect ? T.success : T.danger}`,
            color: T.textPrimary,
            fontWeight: 700,
            fontSize: '1rem'
          }}>
            {isCorrect ? (
              <span>Correct! That is the right binary boundary block format.</span>
            ) : (
              <div>
                <span style={{ display: 'block', marginBottom: '0.25rem' }}>Incorrect.</span>
                <span style={{ fontSize: '0.9rem', fontFamily: 'monospace', color: T.textSecondary }}>Correct value: {question.correctAnswer}</span>
              </div>
            )}
          </div>
        )}
      </form>
    </div>
  );
};
