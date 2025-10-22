import React from 'react';
import { GameState } from '../App';

interface GameResultProps {
  gameState: GameState;
  onNewGame: () => void;
}

const GameResult: React.FC<GameResultProps> = ({ gameState, onNewGame }) => {
  const isWin = gameState.won;
  const attemptCount = gameState.attemptCount;

  return (
    <div className="game-section">
      <div className={`result-message ${isWin ? 'win' : 'lose'}`}>
        {isWin ? (
          <>
            <h2>🎉 축하합니다! 🎉</h2>
            <p>정답을 맞추셨습니다!</p>
            <p>{attemptCount}번 만에 성공하셨네요!</p>
          </>
        ) : (
          <>
            <h2>😢 게임 오버</h2>
            <p>아쉽게도 정답을 맞추지 못했습니다.</p>
            <p>정답은 <strong>{gameState.answer}</strong>였습니다.</p>
          </>
        )}
      </div>

      <div className="attempts-list">
        <h3>📊 최종 기록</h3>
        {gameState.attempts.slice().reverse().map((attempt, index) => (
          <div key={gameState.attempts.length - index - 1} className="attempt-item">
            <span className="attempt-number">
              {gameState.attempts.length - index}번째 시도: {attempt.guess || 'N/A'}
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

      <button className="btn" onClick={onNewGame}>
        🔄 새 게임 시작하기
      </button>
    </div>
  );
};

export default GameResult;
