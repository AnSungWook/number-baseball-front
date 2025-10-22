import React, { useEffect, useState } from 'react';
import './App.css';
import GameStart from './components/GameStart';
import GamePlay from './components/GamePlay';
import GameResult from './components/GameResult';

export interface GameState {
  answer: string;
  attempts: Array<{
    strikes: number;
    balls: number;
    isCorrect: boolean;
    message: string;
    guess: string;
  }>;
  gameOver: boolean;
  won: boolean;
  attemptCount: number;
  hintCount: number;
  usedHints: string[];
}

function App() {
  const [gameId, setGameId] = useState<string | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isMobile, setIsMobile] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.innerWidth <= 520 : false
  );

  useEffect(() => {
    const handleResize = () => {
      if (typeof window === 'undefined') return;
      setIsMobile(window.innerWidth <= 520);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleGameStart = (newGameId: string) => {
    setGameId(newGameId);
    setGameState(null);
  };

  const handleGameStateUpdate = (newGameState: GameState) => {
    setGameState(newGameState);
  };

  const handleGameEnd = () => {
    setGameId(null);
    setGameState(null);
  };

  return (
    <div className="App">
      <div className="container">
        <h1 className="title">
          {isMobile ? '⚾ 숫자 야구' : '⚾ 숫자 야구 게임 ⚾'}
        </h1>
        
        {!gameId ? (
          <GameStart onGameStart={handleGameStart} />
        ) : gameState?.gameOver ? (
          <GameResult 
            gameState={gameState} 
            onNewGame={handleGameEnd} 
          />
        ) : (
          <GamePlay 
            gameId={gameId}
            gameState={gameState}
            onGameStateUpdate={handleGameStateUpdate}
          />
        )}
      </div>
    </div>
  );
}

export default App;
