import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ChipIcon from '../components/ChipIcon.jsx';

const Game = ({ gameId, initialState }) => {
  const [gameState, setGameState] = useState(initialState?.gameState || null);
  const [resolvedGameId, setResolvedGameId] = useState(gameId || null);
  const [selectedPiece, setSelectedPiece] = useState(null);
  const [legalMoves, setLegalMoves] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastAiMove, setLastAiMove] = useState(null);
  const [gameEnded, setGameEnded] = useState(false);
  const [winner, setWinner] = useState(null);
  const navigate = useNavigate();

  const ROWS = 15;
  const COLS = 11;

  // Read chip colors from session (fallback to palette mapping)
  const sessionConfig = (() => {
    try {
      const saved = sessionStorage.getItem('gameSession');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  })();
  const TEAM_COLORS = sessionConfig?.chipColors || {
    LEFT: '#E6DCB7', // sand
    RIGHT: '#A4A77E', // sage
  };

  const timerEnabled = !!sessionConfig?.timerEnabled;
  const timerMinutes = sessionConfig?.timerMinutes ?? 0;
  const [secondsLeft, setSecondsLeft] = useState(timerEnabled ? timerMinutes * 60 : 0);

  // Orientation: landscape if viewport wide enough
  const [isLandscape, setIsLandscape] = useState(() => window.matchMedia('(min-width: 1024px)').matches);
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const handler = (e) => setIsLandscape(e.matches);
    mq.addEventListener?.('change', handler);
    return () => mq.removeEventListener?.('change', handler);
  }, []);

  // Resolve session on mount if needed
  useEffect(() => {
    if (!gameId) {
      try {
        const saved = sessionStorage.getItem('gameSession');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed?.gameId) {
            setResolvedGameId(parsed.gameId);
            if (!initialState && parsed.gameState) {
              setGameState(parsed.gameState);
            }
          }
        }
      } catch {}
    }
  }, []);

  // Fetch game state
  const fetchGameState = async () => {
    const gid = resolvedGameId || gameId;
    if (!gid) return;
    try {
      const response = await fetch(`/api/game/${gid}/state`);
      const data = await response.json();
      if (data.success) setGameState(data.gameState);
    } catch (e) {
      console.error('Error fetching game state:', e);
    }
  };

  useEffect(() => {
    const gid = resolvedGameId || gameId;
    if (gid && !initialState) fetchGameState();
  }, [resolvedGameId, gameId]);

  // Timer: simple per-turn countdown UI (client-side only)
  useEffect(() => {
    if (!timerEnabled || gameEnded) return;
    setSecondsLeft(timerMinutes * 60);
    const id = setInterval(() => setSecondsLeft((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState?.currentTeam, timerEnabled, gameEnded]);

  // Handle cell click
  const handleCellClick = async (row, col) => {
    if (isLoading || gameEnded || !gameState) return;

    const piece = gameState.players?.find(p => p.position.row === row && p.position.col === col);
    const onBall = gameState.ball?.row === row && gameState.ball?.col === col;

    if (piece && piece.team === gameState.currentTeam) {
      setSelectedPiece(piece);
      const pieceMoves = gameState.legalMoves.filter(m => m.from.row === row && m.from.col === col);
      setLegalMoves(pieceMoves);
      return;
    }

    if (selectedPiece) {
      const move = legalMoves.find(m => m.to.row === row && m.to.col === col);
      if (move) return executeMove(move);
      setSelectedPiece(null);
      setLegalMoves([]);
      return;
    }

    if (onBall) {
      const kickMoves = gameState.legalMoves.filter(m => m.type === 'kick' && m.from.row === row && m.from.col === col);
      if (kickMoves.length) {
        setLegalMoves(kickMoves);
        setSelectedPiece({ isBall: true, position: { row, col } });
      }
    }
  };

  // Execute move
  const executeMove = async (move) => {
    const gid = resolvedGameId || gameId;
    if (!gid) return;
    setIsLoading(true);
    try {
      const response = await fetch(`/api/game/${gid}/move`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ moveType: move.type, fromPos: move.from, toPos: move.to })
      });
      const data = await response.json();
      if (data.success) {
        setGameState(data.gameState);
        setSelectedPiece(null);
        setLegalMoves([]);
        if (data.lastAiMove) {
          setLastAiMove(data.lastAiMove);
          setTimeout(() => setLastAiMove(null), 3000);
        }
        if (data.gameEnded) {
          setGameEnded(true);
          setWinner(data.winner);
        }
      }
    } catch (e) {
      console.error('Error executing move:', e);
    } finally {
      setIsLoading(false);
    }
  };

  // Restart
  const restartGame = async () => {
    const gid = resolvedGameId || gameId;
    if (!gid) return;
    try {
      const response = await fetch(`/api/game/${gid}/restart`, { method: 'POST' });
      const data = await response.json();
      if (data.success) {
        setGameState(data.gameState);
        setGameEnded(false);
        setWinner(null);
        setSelectedPiece(null);
        setLegalMoves([]);
      }
    } catch (e) {
      console.error('Error restarting:', e);
    }
  };

  // UI helpers
  const ScorePill = () => (
    <div className="absolute -top-10 left-1/2 -translate-x-1/2 z-10">
      <div className="flex items-center gap-3 bg-mg-brown/90 text-mg-cream px-4 py-1 rounded-full shadow">
        <span className="text-xs tracking-wide">YOU</span>
        <span className="inline-flex items-center bg-mg-sand text-mg-brown font-bold px-3 py-0.5 rounded">
          {gameState?.score?.LEFT ?? 0} <span className="mx-1">-</span> {gameState?.score?.RIGHT ?? 0}
        </span>
        <span className="text-xs tracking-wide">AI</span>
      </div>
    </div>
  );

  const SideToolbar = () => (
    <div className="absolute left-0 top-1/2 -translate-y-1/2 ml-[-72px]">
      <div className="w-14 rounded-2xl bg-mg-brown/95 text-mg-cream flex flex-col items-center py-4 gap-5 shadow-lg">
        <button onClick={() => navigate('/')} title="Home" className="hover:text-mg-sand">🏠</button>
        <button disabled title="Pause" className="opacity-60 cursor-not-allowed">⏸️</button>
        <button onClick={() => navigate('/config')} title="New" className="hover:text-mg-sand">🕹️</button>
        <button onClick={() => alert('Select a chip or the ball; use highlighted targets.')} title="Help" className="hover:text-mg-sand">❓</button>
        <button onClick={() => navigate('/about')} title="About" className="hover:text-mg-sand">⚙️</button>
      </div>
    </div>
  );

  const TimerWidget = () => (
    !timerEnabled ? null : (
      <div className="absolute right-0 top-1/2 -translate-y-1/2 mr-[-88px]">
        <div className="w-28 rounded-2xl bg-mg-brown/95 text-mg-cream flex flex-col items-center py-4 gap-2 shadow-lg">
          <div className="text-3xl">⏱️</div>
          <div className="text-sm">{secondsLeft}s left</div>
        </div>
      </div>
    )
  );

  // Render single cell
  const renderCell = (dRow, dCol) => {
    // Map display coords to model coords when landscape (transpose)
    const row = isLandscape ? dCol : dRow;
    const col = isLandscape ? dRow : dCol;
    const isGoalLeft = row === 0 && col >= 3 && col <= 7;
    const isGoalRight = row === 14 && col >= 3 && col <= 7;
    const isGoal = isGoalLeft || isGoalRight;
    const isCorner = (row === 0 || row === 14) && (col < 3 || col > 7);

    const player = gameState?.players?.find(p => p.position.row === row && p.position.col === col);
    const hasBall = gameState?.ball?.row === row && gameState?.ball?.col === col;

    const isLegalMove = legalMoves.some(m => m.to.row === row && m.to.col === col);
    const isSelected = selectedPiece && selectedPiece.position?.row === row && selectedPiece.position?.col === col;
    const isAiMoveFrom = lastAiMove && lastAiMove.from.row === row && lastAiMove.from.col === col;
    const isAiMoveTo = lastAiMove && lastAiMove.to.row === row && lastAiMove.to.col === col;

    let cellClass = 'w-12 h-12 border border-mg-green-1 relative flex items-center justify-center ';
    if (isCorner) {
      cellClass += 'bg-mg-brown/80 cursor-not-allowed ';
    } else if (isGoal) {
      cellClass += 'bg-mg-green-3 ';
    } else {
      const isDark = (row + col) % 2 === 0;
      cellClass += isDark ? 'bg-mg-green-2 ' : 'bg-mg-green-3 ';
    }
    if (isLegalMove && !isCorner) cellClass += 'ring-4 ring-mg-sand cursor-pointer hover:brightness-110 ';
    if (isSelected) cellClass += 'ring-4 ring-blue-400 ';
    if (isAiMoveFrom) cellClass += 'ring-4 ring-purple-400 ';
    if (isAiMoveTo) cellClass += 'ring-4 ring-purple-600 animate-pulse ';

    return (
      <div key={`${dRow}-${dCol}`} className={cellClass} onClick={() => handleCellClick(row, col)}>
        {player && (
          <div className="pointer-events-none">
            <ChipIcon color={TEAM_COLORS[player.team]} width={28} height={28} />
          </div>
        )}
        {hasBall && <img src="/assets/bw-ball.svg" alt="ball" className="w-5 h-5 drop-shadow" />}
      </div>
    );
  };

  if (!gameState) {
    return (
      <div className="min-h-screen bg-mg-green-1 flex items-center justify-center">
        <div className="text-mg-cream text-2xl">Loading game...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-mg-green-1 py-8">
      <div className="container mx-auto px-4">
        <div className="relative flex items-start justify-center">
          <SideToolbar />
          <div className="relative bg-mg-brown rounded-3xl p-6 shadow-2xl">
            <ScorePill />
            <TimerWidget />
            <div className="bg-mg-green-2 rounded-xl p-4 border-4 border-mg-cream">
              <div className="grid" style={{ gridTemplateRows: `repeat(${isLandscape ? 11 : 15}, 3rem)`, gridTemplateColumns: `repeat(${isLandscape ? 15 : 11}, 3rem)` }}>
                {Array.from({ length: isLandscape ? 11 : 15 }).map((_, r) => (
                  Array.from({ length: isLandscape ? 15 : 11 }).map((_, c) => (
                    <div key={`${r}-${c}`}>{renderCell(r, c)}</div>
                  ))
                ))}
              </div>
            </div>

            <div className="mt-4 flex justify-between items-center text-mg-cream">
              <div className="flex items-center gap-4">
                <button onClick={restartGame} className="bg-mg-sand text-mg-brown px-4 py-2 rounded-lg font-semibold hover:brightness-110 transition">Restart</button>
                <button onClick={() => navigate('/')} className="bg-white/10 px-4 py-2 rounded-lg border border-white/20 hover:bg-white/20 transition">Home</button>
              </div>
              <div>
                <span className="font-bold">Turn: </span>
                <span className={gameState?.currentTeam === 'LEFT' ? 'text-mg-sand' : 'text-mg-sage'}>{gameState?.currentTeam}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Game Over Modal */}
      {gameEnded && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-mg-cream rounded-lg p-8 max-w-md text-mg-brown">
            <h2 className="text-3xl font-bold mb-4 text-center">{winner === 'DRAW' ? 'Draw!' : `${winner} Wins!`}</h2>
            <div className="text-center mb-6">
              <p className="text-xl">Final Score</p>
              <p className="text-2xl font-bold">{gameState.score.LEFT} - {gameState.score.RIGHT}</p>
            </div>
            <div className="flex gap-4">
              <button onClick={restartGame} className="flex-1 bg-mg-sage text-mg-brown px-4 py-2 rounded-lg font-bold">Play Again</button>
              <button onClick={() => navigate('/config')} className="flex-1 bg-mg-brown text-mg-cream px-4 py-2 rounded-lg font-bold">New Game</button>
            </div>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-40">
          <div className="bg-mg-cream rounded-lg p-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mg-green-2"></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Game;
