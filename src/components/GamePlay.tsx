import React, { useState, useEffect, useCallback } from 'react';
import { GameState } from '../App';
import Modal from './Modal';

interface GamePlayProps {
  gameId: string;
  gameState: GameState | null;
  onGameStateUpdate: (gameState: GameState) => void;
}

const MOBILE_BREAKPOINT = 520;

const getIsMobile = () =>
  typeof window !== 'undefined' ? window.innerWidth <= MOBILE_BREAKPOINT : false;

const GamePlay: React.FC<GamePlayProps> = ({ gameId, gameState, onGameStateUpdate }) => {
  const [guess, setGuess] = useState(['', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [hintPosition, setHintPosition] = useState<number>(1);
  const [modal, setModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'error' | 'success' | 'info';
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info'
  });
  const [isMobile, setIsMobile] = useState<boolean>(() => getIsMobile());

  // 변경: 각 자리별 힌트(숫자)를 저장하는 배열 (빈문자열 = 미확인)
  const [hintSlots, setHintSlots] = useState<string[]>(['', '', '', '']);
  // 이전 usedHintsList도 보관하되 UI는 hintSlots 사용
  const [usedHintsList, setUsedHintsList] = useState<string[]>([]);

  const showModal = (title: string, message: string, type: 'error' | 'success' | 'info' = 'info') => {
    setModal({
      isOpen: true,
      title,
      message,
      type
    });
  };

  const closeModal = () => {
    setModal(prev => ({ ...prev, isOpen: false }));
  };

  useEffect(() => {
    const handleResize = () => setIsMobile(getIsMobile());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const remainingAttempts = 10 - (gameState?.attemptCount || 0);

  // 힌트 메시지에서 "n번째 자리는 x입니다." 형태를 파싱해서 hintSlots 반영
  const applyHintMessageToSlots = (hintMessage: string) => {
    // 메시지 예시: "2번째 자리는 7입니다." 또는 오류/다른 포맷이 올 수 있음
    const posMatch = hintMessage.match(/(\d+)\s*번째/);
    // '입니다' 앞의 숫자를 확실히 잡아내기 위해 '(\d+)(?=입니다)' 사용
    const digitMatch = hintMessage.match(/(\d+)(?=\s*입니다)/);
    if (posMatch) {
      const pos = Number(posMatch[1]);
      setHintSlots(prev => {
        const next = [...prev];
        if (pos >= 1 && pos <= 4) {
          if (digitMatch) {
            // 여러 자리 숫자가 올 가능성은 없지만 안전하게 전체 매치 사용
            next[pos - 1] = digitMatch[1];
          } else {
            // 값이 명시적으로 없을 경우 물음표로 표시
            if (!next[pos - 1]) next[pos - 1] = '?';
          }
        }
        return next;
      });
    }
  };

  const getHint = async () => {
    if (!gameId) return;
    
    try {
      const response = await fetch(`/api/game/${gameId}/hint`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ position: hintPosition }),
      });
      
      if (response.ok) {
        const hintMessage = await response.text();
        showModal('💡 힌트', hintMessage, 'info');
        // 로컬에 결과값도 함께 저장
        setUsedHintsList(prev => [...prev, hintMessage]);
        // 메시지에서 자리/값 추출하여 슬롯에 반영
        applyHintMessageToSlots(hintMessage);
        // 게임 상태 업데이트
        fetchGameState();
      } else {
        const errorText = await response.text();
        showModal('힌트 오류', errorText, 'error');
      }
    } catch (error) {
      showModal('힌트 오류', '힌트를 가져오는데 실패했습니다.', 'error');
    }
  };

  const fetchGameState = useCallback(async () => {
    try {
      const response = await fetch(`/api/game/${gameId}/state`);
      if (response.ok) {
        const state = await response.json();
        onGameStateUpdate(state);
        // 서버에서 usedHints 키만 넘어오는 경우가 있으므로, 로컬에 이미 저장된 힌트 메시지가 없으면 키로 기본 채움
        if ((state.usedHints?.length || 0) > 0 && usedHintsList.length === 0) {
          const keys: string[] = state.usedHints.map((k: string) => `${k}`);
          setUsedHintsList(keys);
          // keys에 "n번째 자리" 형태가 있으면 슬롯에 '?'로 표시
          keys.forEach(k => {
            const posMatch = k.match(/(\d+)번째/);
            if (posMatch) {
              const pos = Number(posMatch[1]);
              setHintSlots(prev => {
                const next = [...prev];
                if (pos >= 1 && pos <= 4 && !next[pos - 1]) {
                  next[pos - 1] = '?';
                }
                return next;
              });
            }
          });
        }
      } else {
        showModal('오류', '게임 상태를 가져오지 못했습니다.', 'error');
      }
    } catch (error) {
      showModal('오류', '게임 상태를 가져오는 중 오류가 발생했습니다.', 'error');
    }
  }, [gameId, onGameStateUpdate, usedHintsList.length]);

  useEffect(() => {
    if (gameId && !gameState) {
      fetchGameState();
    }
  }, [gameId, gameState, fetchGameState]);

  const handleInputChange = (index: number, value: string) => {
    if (value.length <= 1 && /^\d*$/.test(value)) {
      const newGuess = [...guess];
      newGuess[index] = value;
      setGuess(newGuess);
    }
  };

  const handleKeyPress = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && guess[index] === '') {
      if (index > 0) {
        const newGuess = [...guess];
        newGuess[index - 1] = '';
        setGuess(newGuess);
      }
    } else if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    const guessString = guess.join('');
    
    if (guessString.length !== 4) {
      showModal('입력 오류', '4자리 숫자를 모두 입력해주세요.', 'error');
      return;
    }

    // 0으로 시작하는 숫자 체크
    if (guessString.startsWith('0')) {
      showModal('입력 오류', '0으로 시작하는 숫자는 입력할 수 없습니다.\n4자리 숫자를 입력해주세요.', 'error');
      return;
    }

    // 중복 숫자 체크
    const uniqueDigits = new Set(guessString);
    if (uniqueDigits.size !== 4) {
      showModal('입력 오류', '서로 다른 4자리 숫자를 입력해주세요.', 'error');
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await fetch(`/api/game/${gameId}/guess`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ guess: guessString }),
      });

      if (response.ok) {
        const result = await response.json();
        await fetchGameState();
      } else {
        const error = await response.text();
        showModal('API 오류', error, 'error');
      }
    } catch (error) {
      showModal('연결 오류', '예측에 실패했습니다. 네트워크를 확인해주세요.', 'error');
    } finally {
      setIsLoading(false);
      setGuess(['', '', '', '']);
    }
  };

  return (
    <div className="game-section">
      <h2>{isMobile ? '🎮 게임 진행' : '🎮 게임 진행 중'}</h2>
      <p>{isMobile ? `남은 기회 ${remainingAttempts}번` : `남은 기회: ${remainingAttempts}번`}</p>
      
      <div className="input-group">
        {guess.map((digit, index) => (
          <input
            key={index}
            type="text"
            className="number-input"
            value={digit}
            onChange={(e) => handleInputChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyPress(index, e)}
            maxLength={1}
            disabled={isLoading}
          />
        ))}
      </div>
      
      <button 
        className="btn" 
        onClick={handleSubmit}
        disabled={isLoading || guess.join('').length !== 4}
      >
        {isLoading ? '처리 중...' : '예측하기'}
      </button>
      
      {/* 힌트 섹션 (새 스타일) */}
      <div className="hint-section">
        <h3>
          💡 {isMobile ? '힌트' : '힌트 안내'} ({gameState?.hintCount || 0}/1)
        </h3>
        <div className="hint-controls">
          <select 
            value={hintPosition} 
            onChange={(e) => setHintPosition(Number(e.target.value))}
            className="hint-select"
          >
            <option value={1}>1번째 자리</option>
            <option value={2}>2번째 자리</option>
            <option value={3}>3번째 자리</option>
            <option value={4}>4번째 자리</option>
          </select>
          <button 
            className="btn hint-btn" 
            onClick={getHint}
            disabled={isLoading || (gameState?.hintCount || 0) >= 1}
          >
            힌트 받기
          </button>
        </div>

        {/* 4자리 슬롯 UI */}
        <div className="hint-slots" style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
          {hintSlots.map((val, idx) => (
            <div
              key={idx}
              className="hint-slot"
              style={{
                width: 48,
                height: 48,
                borderRadius: 6,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: val ? '#ffd54f' : '#f0f0f0',
                color: val ? '#000' : '#999',
                fontWeight: 600,
                fontSize: 18,
                boxShadow: val ? '0 2px 6px rgba(0,0,0,0.12)' : 'none'
              }}
            >
              {val || '-'}
            </div>
          ))}
        </div>

        {/* 사용한 힌트 로그(문자열) */}
        {usedHintsList && usedHintsList.length > 0 && (
          <div className="used-hints" style={{ marginTop: '12px' }}>
            <h4>{isMobile ? '사용 힌트' : '사용한 힌트:'}</h4>
            <ul>
              {usedHintsList.map((hint, index) => (
                <li key={index}>{hint}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {gameState?.attempts && gameState.attempts.length > 0 && (
        <div className="attempts-list">
          <h3>{isMobile ? '📝 기록' : '📝 시도 기록'}</h3>
          {gameState.attempts.slice().reverse().map((attempt, index) => (
            <div key={gameState.attempts.length - index - 1} className="attempt-item">
              <span className="attempt-number">
                {isMobile
                  ? `#${gameState.attempts.length - index}: ${attempt.guess || 'N/A'}`
                  : `${gameState.attempts.length - index}번째 시도: ${attempt.guess || 'N/A'}`}
              </span>
              <div className="attempt-result">
                {attempt.strikes > 0 && (
                  <span className="strike">
                    S {attempt.strikes}
                  </span>
                )}
                {attempt.balls > 0 && (
                  <span className="ball">
                    B {attempt.balls}
                  </span>
                )}
                {attempt.strikes === 0 && attempt.balls === 0 && (
                  <span className="out">OUT</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={modal.isOpen}
        onClose={closeModal}
        title={modal.title}
        message={modal.message}
        type={modal.type}
      />
    </div>
  );
};

export default GamePlay;
