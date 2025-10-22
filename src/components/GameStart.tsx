import React, { useEffect, useState } from 'react';

interface GameStartProps {
  onGameStart: (gameId: string) => void;
}

const MOBILE_BREAKPOINT = 520;

const DESKTOP_RULES: React.ReactNode[] = [
  <>컴퓨터가 만든 서로 다른 4자리 숫자를 맞춰보세요! (0~9) </>,
  <>첫 자리는 1~9 중 하나이며, 입력도 동일한 규칙을 따릅니다.</>,
  <>
    <strong>스트라이크:</strong> 숫자와 위치가 모두 정답과 일치합니다.
  </>,
  <>
    <strong>볼:</strong> 숫자는 포함되지만 위치가 다릅니다.
  </>,
  <>
    <strong>아웃:</strong> 네 자리 모두 일치하지 않으면 아웃으로 표시됩니다.
  </>,
  <>최대 10번까지 도전할 수 있고, 매 시도마다 결과가 기록됩니다.</>,
  <>막히면 원하는 자리 하나를 골라 단 한 번 힌트를 받을 수 있습니다.</>,
  <>
    결과 화면의 <span className="legend legend-s">S</span>
    {' '}는 스트라이크,
    {' '}<span className="legend legend-b">B</span>
    {' '}는 볼,
    {' '}<span className="legend legend-o">OUT</span>
    {' '}은 아웃을 의미합니다.
  </>,
];

const MOBILE_RULES: React.ReactNode[] = [
  <>서로 다른 4자리 숫자를 맞춰보세요.</>,
  <>첫 자리는 1~9, 숫자 중복은 금지입니다.</>,
  <>
    <span className="legend legend-s">S</span>
    {' '}·{' '}
    <span className="legend legend-b">B</span>
    {' '}·{' '}
    <span className="legend legend-o">OUT</span>
    {' '}표시로 결과를 확인하세요.
  </>,
  <>최대 10번 안에 맞추면 승리!</>,
  <>힌트는 원하는 자리 단 한 번만 사용 가능합니다.</>,
];

const getIsMobile = () =>
  typeof window !== 'undefined' ? window.innerWidth <= MOBILE_BREAKPOINT : false;

const GameStart: React.FC<GameStartProps> = ({ onGameStart }) => {
  const [isMobile, setIsMobile] = useState<boolean>(() => getIsMobile());

  useEffect(() => {
    const handleResize = () => setIsMobile(getIsMobile());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const startGame = async () => {
    try {
      const response = await fetch('/api/game/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const gameId = await response.text();
        onGameStart(gameId);
      } else {
        alert('게임 시작에 실패했습니다.');
      }
    } catch (error) {
      console.error('Error starting game:', error);
      alert('게임 시작에 실패했습니다.');
    }
  };

  return (
    <div className="game-section">
      <div className="rules">
        <h3>🎯 게임 규칙</h3>
        <ul>
          {(isMobile ? MOBILE_RULES : DESKTOP_RULES).map((rule, index) => (
            <li key={index}>{rule}</li>
          ))}
        </ul>
      </div>
      
      <button className="btn" onClick={startGame}>
        🚀 게임 시작하기
      </button>
    </div>
  );
};

export default GameStart;
