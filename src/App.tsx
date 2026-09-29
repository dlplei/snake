import { useEffect, useRef, useCallback } from 'react';
import { useSnakeGame, Direction, Difficulty } from './hooks/useSnakeGame';

const CELL_SIZE_DESKTOP = 24;
const CELL_SIZE_MOBILE = 16;

export default function App() {
  const {
    snake,
    food,
    direction,
    gameState,
    score,
    highScore,
    difficulty,
    gridSize,
    startGame,
    togglePause,
    resetGame,
    changeDirection,
    setDifficulty,
  } = useSnakeGame();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate cell size based on screen
  const getCellSize = useCallback(() => {
    if (window.innerWidth < 640) return CELL_SIZE_MOBILE;
    return CELL_SIZE_DESKTOP;
  }, []);

  // Draw game
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cellSize = getCellSize();
    const canvasSize = gridSize * cellSize;
    canvas.width = canvasSize;
    canvas.height = canvasSize;

    // Clear canvas with dark background
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, canvasSize, canvasSize);

    // Draw grid lines (subtle)
    ctx.strokeStyle = 'rgba(51, 65, 85, 0.3)';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= gridSize; i++) {
      ctx.beginPath();
      ctx.moveTo(i * cellSize, 0);
      ctx.lineTo(i * cellSize, canvasSize);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * cellSize);
      ctx.lineTo(canvasSize, i * cellSize);
      ctx.stroke();
    }

    // Draw food with glow effect
    const foodX = food.x * cellSize + cellSize / 2;
    const foodY = food.y * cellSize + cellSize / 2;
    const foodRadius = cellSize * 0.4;

    // Glow
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 12;
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(foodX, foodY, foodRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Inner highlight
    ctx.fillStyle = '#fca5a5';
    ctx.beginPath();
    ctx.arc(foodX - foodRadius * 0.2, foodY - foodRadius * 0.2, foodRadius * 0.4, 0, Math.PI * 2);
    ctx.fill();

    // Draw snake
    snake.forEach((segment, index) => {
      const x = segment.x * cellSize;
      const y = segment.y * cellSize;
      const padding = 1;

      if (index === 0) {
        // Head - brighter with glow
        ctx.shadowColor = '#22d3ee';
        ctx.shadowBlur = 8;
        const gradient = ctx.createLinearGradient(x, y, x + cellSize, y + cellSize);
        gradient.addColorStop(0, '#06b6d4');
        gradient.addColorStop(1, '#0891b2');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(x + padding, y + padding, cellSize - padding * 2, cellSize - padding * 2, 4);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Eyes
        const eyeSize = cellSize * 0.12;
        ctx.fillStyle = '#fff';
        let eye1X: number, eye1Y: number, eye2X: number, eye2Y: number;

        switch (direction) {
          case 'UP':
            eye1X = x + cellSize * 0.3; eye1Y = y + cellSize * 0.3;
            eye2X = x + cellSize * 0.7; eye2Y = y + cellSize * 0.3;
            break;
          case 'DOWN':
            eye1X = x + cellSize * 0.3; eye1Y = y + cellSize * 0.7;
            eye2X = x + cellSize * 0.7; eye2Y = y + cellSize * 0.7;
            break;
          case 'LEFT':
            eye1X = x + cellSize * 0.3; eye1Y = y + cellSize * 0.3;
            eye2X = x + cellSize * 0.3; eye2Y = y + cellSize * 0.7;
            break;
          case 'RIGHT':
            eye1X = x + cellSize * 0.7; eye1Y = y + cellSize * 0.3;
            eye2X = x + cellSize * 0.7; eye2Y = y + cellSize * 0.7;
            break;
        }
        ctx.beginPath();
        ctx.arc(eye1X, eye1Y, eyeSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(eye2X, eye2Y, eyeSize, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Body segments with gradient
        const progress = index / snake.length;
        const r = Math.round(6 + progress * 10);
        const g = Math.round(182 - progress * 80);
        const b = Math.round(212 - progress * 60);
        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        ctx.beginPath();
        ctx.roundRect(x + padding + 1, y + padding + 1, cellSize - (padding + 1) * 2, cellSize - (padding + 1) * 2, 3);
        ctx.fill();
      }
    });
  }, [snake, food, direction, gridSize, getCellSize]);

  // Redraw on state changes
  useEffect(() => {
    draw();
  }, [draw]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          e.preventDefault();
          changeDirection('UP');
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          e.preventDefault();
          changeDirection('DOWN');
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          e.preventDefault();
          changeDirection('LEFT');
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          e.preventDefault();
          changeDirection('RIGHT');
          break;
        case ' ':
          e.preventDefault();
          if (gameState === 'idle' || gameState === 'gameover') {
            startGame();
          } else {
            togglePause();
          }
          break;
        case 'Escape':
          e.preventDefault();
          if (gameState === 'playing' || gameState === 'paused') {
            togglePause();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [changeDirection, gameState, startGame, togglePause]);

  // Touch controls
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const touch = e.changedTouches[0];
    const dx = touch.clientX - touchStartRef.current.x;
    const dy = touch.clientY - touchStartRef.current.y;
    const minSwipe = 30;

    if (Math.abs(dx) < minSwipe && Math.abs(dy) < minSwipe) return;

    if (Math.abs(dx) > Math.abs(dy)) {
      changeDirection(dx > 0 ? 'RIGHT' : 'LEFT');
    } else {
      changeDirection(dy > 0 ? 'DOWN' : 'UP');
    }
    touchStartRef.current = null;
  };

  // Handle D-pad button press
  const handleDPad = (dir: Direction) => {
    if (gameState === 'playing') {
      changeDirection(dir);
    }
  };

  const canvasSize = gridSize * getCellSize();

  const difficultyOptions: { value: Difficulty; label: string; color: string }[] = [
    { value: 'easy', label: '简单', color: 'bg-green-500' },
    { value: 'medium', label: '中等', color: 'bg-yellow-500' },
    { value: 'hard', label: '困难', color: 'bg-red-500' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col items-center justify-center p-4 select-none">
      {/* Header */}
      <div className="text-center mb-4">
        <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent mb-1">
          🐍 贪吃蛇
        </h1>
        <p className="text-slate-400 text-sm">Snake Game</p>
      </div>

      {/* Score Panel */}
      <div className="flex gap-4 sm:gap-8 mb-4">
        <div className="bg-slate-800/80 backdrop-blur-sm border border-slate-700 rounded-xl px-4 py-2 text-center">
          <div className="text-xs text-slate-400 uppercase tracking-wider">当前分数</div>
          <div className="text-2xl font-bold text-cyan-400">{score}</div>
        </div>
        <div className="bg-slate-800/80 backdrop-blur-sm border border-slate-700 rounded-xl px-4 py-2 text-center">
          <div className="text-xs text-slate-400 uppercase tracking-wider">最高分</div>
          <div className="text-2xl font-bold text-amber-400">{highScore}</div>
        </div>
      </div>

      {/* Game Canvas */}
      <div
        ref={containerRef}
        className="relative rounded-xl overflow-hidden shadow-2xl shadow-cyan-500/10 border border-slate-700"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <canvas
          ref={canvasRef}
          width={canvasSize}
          height={canvasSize}
          className="block"
        />

        {/* Overlay for idle/paused/gameover */}
        {gameState !== 'playing' && (
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-center animate-fade-in">
            {gameState === 'idle' && (
              <>
                <div className="text-5xl mb-4 animate-bounce">🐍</div>
                <p className="text-slate-300 text-lg mb-4">准备好了吗？</p>
                <button
                  onClick={startGame}
                  className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-emerald-500 text-white font-bold rounded-lg shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 transition-all hover:scale-105 active:scale-95"
                >
                  开始游戏
                </button>
                <p className="text-slate-500 text-xs mt-3">按空格键或点击开始</p>
              </>
            )}
            {gameState === 'paused' && (
              <>
                <div className="text-4xl mb-4">⏸️</div>
                <p className="text-slate-300 text-lg mb-4">游戏暂停</p>
                <button
                  onClick={togglePause}
                  className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-emerald-500 text-white font-bold rounded-lg shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 transition-all hover:scale-105 active:scale-95"
                >
                  继续游戏
                </button>
              </>
            )}
            {gameState === 'gameover' && (
              <>
                <div className="text-4xl mb-2">💀</div>
                <p className="text-red-400 text-xl font-bold mb-1">游戏结束</p>
                <p className="text-slate-300 text-lg mb-4">得分: {score}</p>
                {score >= highScore && score > 0 && (
                  <p className="text-amber-400 text-sm mb-3 animate-pulse">🎉 新纪录！</p>
                )}
                <button
                  onClick={() => { resetGame(); setTimeout(startGame, 50); }}
                  className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-emerald-500 text-white font-bold rounded-lg shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 transition-all hover:scale-105 active:scale-95"
                >
                  再来一局
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="mt-4 flex flex-col items-center gap-3">
        {/* Difficulty & Action Buttons */}
        <div className="flex flex-wrap gap-2 justify-center">
          {difficultyOptions.map(opt => (
            <button
              key={opt.value}
              onClick={() => {
                if (gameState === 'idle' || gameState === 'gameover') {
                  setDifficulty(opt.value);
                }
              }}
              disabled={gameState === 'playing' || gameState === 'paused'}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                difficulty === opt.value
                  ? `${opt.color} text-white shadow-md`
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              } ${gameState === 'playing' || gameState === 'paused' ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          {gameState === 'playing' && (
            <button
              onClick={togglePause}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-sm font-medium transition-all active:scale-95"
            >
              ⏸️ 暂停
            </button>
          )}
          {gameState === 'paused' && (
            <button
              onClick={togglePause}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-sm font-medium transition-all active:scale-95"
            >
              ▶️ 继续
            </button>
          )}
          {(gameState === 'playing' || gameState === 'paused') && (
            <button
              onClick={() => { resetGame(); }}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-sm font-medium transition-all active:scale-95"
            >
              🔄 重新开始
            </button>
          )}
        </div>

        {/* D-Pad for mobile */}
        <div className="sm:hidden mt-2">
          <div className="grid grid-cols-3 gap-1 w-36">
            <div></div>
            <button
              onTouchStart={(e) => { e.preventDefault(); handleDPad('UP'); }}
              className="bg-slate-700/80 active:bg-cyan-600 text-white rounded-lg p-3 text-xl flex items-center justify-center transition-colors"
            >
              ↑
            </button>
            <div></div>
            <button
              onTouchStart={(e) => { e.preventDefault(); handleDPad('LEFT'); }}
              className="bg-slate-700/80 active:bg-cyan-600 text-white rounded-lg p-3 text-xl flex items-center justify-center transition-colors"
            >
              ←
            </button>
            <button
              onTouchStart={(e) => { e.preventDefault(); handleDPad('DOWN'); }}
              className="bg-slate-700/80 active:bg-cyan-600 text-white rounded-lg p-3 text-xl flex items-center justify-center transition-colors"
            >
              ↓
            </button>
            <button
              onTouchStart={(e) => { e.preventDefault(); handleDPad('RIGHT'); }}
              className="bg-slate-700/80 active:bg-cyan-600 text-white rounded-lg p-3 text-xl flex items-center justify-center transition-colors"
            >
              →
            </button>
          </div>
        </div>
      </div>

      {/* Footer hints */}
      <div className="mt-4 text-center text-slate-500 text-xs hidden sm:block">
        <p>方向键/WASD 控制方向 | 空格键 开始/暂停 | ESC 暂停</p>
      </div>
    </div>
  );
}
