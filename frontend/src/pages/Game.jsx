import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ChipIcon from '../components/ChipIcon.jsx';
import Modal from '../components/Modal.jsx';
import api from '../services/api';

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
  const [activeModal, setActiveModal] = useState(null); // 'home' | 'config' | 'help' | 'about'

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

  const API_BASE = import.meta.env.VITE_API_URL || '';

  // Fetch game state
  const fetchGameState = async () => {
    const gid = resolvedGameId || gameId;
    if (!gid) return;
    try {
      const response = await fetch(`${API_BASE}/api/game/${gid}/state`);
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
    if (!timerEnabled || gameEnded || activeModal) return;
    setSecondsLeft(timerMinutes * 60);
    const id = setInterval(() => setSecondsLeft((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState?.currentTeam, timerEnabled, gameEnded, activeModal]);

  // When timer hits zero on player's turn, auto-play a random legal move
  useEffect(() => {
    const humanTeam = sessionConfig?.playerColor;
    if (!timerEnabled || secondsLeft > 0 || gameEnded || isLoading) return;
    if (humanTeam && gameState?.currentTeam === humanTeam) {
      const legal = gameState?.legalMoves || [];
      if (legal.length > 0) {
        const random = legal[Math.floor(Math.random() * legal.length)];
        executeMove(random);
      }
    }
  }, [secondsLeft]);

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
      const response = await fetch(`${API_BASE}/api/game/${gid}/move`, {
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
      const response = await fetch(`${API_BASE}/api/game/${gid}/restart`, { method: 'POST' });
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
    <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10">
      <div className="flex items-center gap-4 bg-mg-brown/90 text-mg-cream px-4 py-1 rounded-full shadow">
        <span className="text-lg tracking-wide font-bold">YOU</span>
        <span className="inline-flex items-center bg-mg-sand text-mg-brown font-bold px-3 py-0.5 rounded text-lg">
          {gameState?.score?.LEFT ?? 0} <span className="mx-1 text-lg">-</span> {gameState?.score?.RIGHT ?? 0}
        </span>
        <span className="text-lg tracking-wide font-bold">AI</span>
      </div>
    </div>
  );

  const SideToolbar = () => (
    <div className="absolute left-0 top-1/2 -translate-y-1/2 ml-[180px]">
      <div className="w-20 rounded-2xl bg-mg-brown/95 text-mg-cream flex flex-col items-center py-8 gap-12 shadow-lg">
        <button onClick={() => setActiveModal('home')} title="Home" className="hover:opacity-90">
          <img src="/assets/HomeVerticalMenu.svg" alt="Home" className="w-8 h-8" />
        </button>
        <button onClick={() => setActiveModal('pause')} title="Pause" className="hover:opacity-90">
          <img src="/assets/PauseVerticalMenu.svg" alt="Pause" className="w-8 h-8" />
        </button>
        <button onClick={() => setActiveModal('restart')} title="Restart" className="hover:opacity-90">
          <img src="/assets/RestartVerticalMenu.svg" alt="Restart" className="w-8 h-8" />
        </button>
        <button onClick={() => setActiveModal('help')} title="Help" className="hover:opacity-90">
          <img src="/assets/AboutVerticalMenu.svg" alt="About" className="w-8 h-8" />
        </button>
        <button onClick={() => setActiveModal('config')} title="Settings" className="hover:opacity-90">
          <img src="/assets/SettingsVerticalMenu.svg" alt="Settings" className="w-8 h-8" />
        </button>

      </div>
    </div>
  );

  // Horizontal toolbar for small/vertical screens
  const TopToolbar = () => (
    <div className="flex items-center justify-center gap-5 text-mg-cream">
      <button onClick={() => setActiveModal('home')} title="Home" className="hover:opacity-90">
        <img src="/assets/HomeVerticalMenu.svg" alt="Home" className="w-6 h-6" />
      </button>
      <button onClick={() => setActiveModal('help')} title="Help" className="hover:opacity-90">❓</button>
      <button onClick={() => setActiveModal('config')} title="Settings" className="hover:opacity-90">
        <img src="/assets/SettingsVerticalMenu.svg" alt="Settings" className="w-6 h-6" />
      </button>
      <button onClick={() => setActiveModal('about')} title="About" className="hover:opacity-90">
        <img src="/assets/AboutVerticalMenu.svg" alt="About" className="w-6 h-6" />
      </button>
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

  // Board chrome: side toolbar and field overlays
  const FieldOverlay = () => (
    <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
      <rect x="2" y="8.5" width="96" height="83" rx="3" ry="3" fill="none" stroke="#F5EFD5" strokeWidth="1.5" />
      <circle cx="5.5" cy="12" r="1.2" fill="#F5EFD5" />
      <circle cx="94.5" cy="12" r="1.2" fill="#F5EFD5" />
      <circle cx="5.5" cy="88" r="1.2" fill="#F5EFD5" />
      <circle cx="94.5" cy="88" r="1.2" fill="#F5EFD5" />
      <rect x="8" y="18" width="18" height="64" fill="none" stroke="#F5EFD5" strokeWidth="1.5" />
      <rect x="8" y="32" width="10" height="36" fill="none" stroke="#F5EFD5" strokeWidth="1.5" />
      <rect x="74" y="18" width="18" height="64" fill="none" stroke="#F5EFD5" strokeWidth="1.5" />
      <rect x="82" y="32" width="10" height="36" fill="none" stroke="#F5EFD5" strokeWidth="1.5" />
    </svg>
  );


  // Render single cell
  const renderCell = (dRow, dCol) => {
    // Map display coords to model coords when landscape (transpose)
    const row = isLandscape ? dCol : dRow;
    const col = isLandscape ? dRow : dCol;
    const isGoalLeft = row === 0 && col >= 3 && col <= 7;
    const isGoalRight = row === 14 && col >= 3 && col <= 7;
    const isGoal = isGoalLeft || isGoalRight;
    const isOutside = (row === 0 || row === 14) && (col < 3 || col > 7);

    const player = gameState?.players?.find(p => p.position.row === row && p.position.col === col);
    const hasBall = gameState?.ball?.row === row && gameState?.ball?.col === col;

    const isLegalMove = legalMoves.some(m => m.to.row === row && m.to.col === col);
    const isSelected = selectedPiece && selectedPiece.position?.row === row && selectedPiece.position?.col === col;
    const isAiMoveFrom = lastAiMove && lastAiMove.from.row === row && lastAiMove.from.col === col;
    const isAiMoveTo = lastAiMove && lastAiMove.to.row === row && lastAiMove.to.col === col;

    let cellClass = 'w-12 h-12 relative flex items-center justify-center ';
    if (isOutside) {
      cellClass += 'bg-mg-brown cursor-not-allowed ';
    } else if (isGoal) {
      cellClass += 'bg-mg-green-2 relative ';
    } else {
      const isDark = (row + col) % 2 === 0;
      cellClass += isDark ? 'bg-mg-green-2 ' : 'bg-mg-green-3 ';
    }
   // Cream border around playable field edges - apply based on display coordinates
    if (!isLandscape) {
      // Portrait mode: normal orientation
      if (row === 1) cellClass += ' border-t-4 border-mg-cream ';
      if (row === 13) cellClass += ' border-b-4 border-mg-cream ';
      if (col === 0 && row >= 1 && row <= 13) cellClass += ' border-l-4 border-mg-cream ';
      if (col === 10 && row >= 1 && row <= 13) cellClass += ' border-r-4 border-mg-cream ';
      if (row === 1 && col === 0) cellClass += ' rounded-tl-xl ';
      if (row === 1 && col === 10) cellClass += ' rounded-tr-xl ';
      if (row === 13 && col === 0) cellClass += ' rounded-bl-xl ';
      if (row === 13 && col === 10) cellClass += ' rounded-br-xl ';
      if (row === 4 && col >= 1 && col <= 9) cellClass += ' border-b-4 border-mg-cream ';
      if (row === 2 && col >= 2 && col <= 8) cellClass += ' border-b-4 border-mg-cream ';
        if (col === 0 && row >= 1 && row <= 4) cellClass += ' border-r-4 border-mg-cream ';
        if (col === 9 && row >= 1 && row <= 4) cellClass += ' border-r-4 border-mg-cream ';
        if (col === 0 && row >= 10 && row <= 13) cellClass += ' border-r-4 border-mg-cream ';
        if (col === 9 && row >= 10 && row <= 13) cellClass += ' border-r-4 border-mg-cream ';
        if (row === 12 && col >= 2 && col <= 8) cellClass += ' border-t-4 border-mg-cream ';
        if (row === 10 && col >= 1 && col <= 9) cellClass += ' border-t-4 border-mg-cream ';
        if (col == 1 && row >= 1 && row <= 2) cellClass += ' border-r-4 border-mg-cream ';
        if (col == 8 && row >= 1 && row <= 2) cellClass += ' border-r-4 border-mg-cream ';
        if (col == 1 && row >= 12 && row <= 13) cellClass += ' border-r-4 border-mg-cream ';
        if (col == 8 && row >= 12 && row <= 13) cellClass += ' border-r-4 border-mg-cream ';

    } else {
      // Landscape mode: transposed, so apply borders based on display coords
        if (dRow === 0 && dCol >= 1 && dCol <= 13) cellClass += ' border-t-4 border-mg-cream ';
        if (dRow === 10 && dCol >= 1 && dCol <= 13) cellClass += ' border-b-4 border-mg-cream ';
        if (dCol === 1) cellClass += ' border-l-4 border-mg-cream ';
        if (dCol === 13) cellClass += ' border-r-4 border-mg-cream ';
        if (dRow === 0 && dCol === 1) cellClass += ' rounded-tl-xl ';
        if (dRow === 0 && dCol === 13) cellClass += ' rounded-tr-xl ';
        if (dRow === 10 && dCol === 1) cellClass += ' rounded-bl-xl ';
        if (dRow === 10 && dCol === 13) cellClass += ' rounded-br-xl ';
        if (dRow === 1 && dCol >= 1 && dCol <= 4) cellClass += ' border-t-4 border-mg-cream ';
        if (dRow === 10 && dCol >= 1 && dCol <= 4) cellClass += ' border-t-4 border-mg-cream ';
        if (dCol === 4 && dRow >= 1 && dRow <= 9) cellClass += ' border-r-4 border-mg-cream ';
        if (dRow === 1 && dCol >= 10 && dCol <= 13) cellClass += ' border-t-4 border-mg-cream ';
        if (dRow === 10 && dCol >= 10 && dCol <= 13) cellClass += ' border-t-4 border-mg-cream ';
        if (dCol === 10 && dRow >= 1 && dRow <= 9) cellClass += ' border-l-4 border-mg-cream ';
        if (dRow === 2 && dCol >= 1 && dCol <= 2) cellClass += ' border-t-4 border-mg-cream ';
        if (dRow === 8 && dCol >= 1 && dCol <= 2) cellClass += ' border-b-4 border-mg-cream ';
        if (dCol === 2 && dRow >= 2 && dRow <= 8) cellClass += ' border-r-4 border-mg-cream ';
        if (dRow === 2 && dCol >= 12 && dCol <= 13) cellClass += ' border-t-4 border-mg-cream ';
        if (dRow === 8 && dCol >= 12 && dCol <= 13) cellClass += ' border-b-4 border-mg-cream ';
        if (dCol === 11 && dRow >= 2 && dRow <= 8) cellClass += ' border-r-4 border-mg-cream ';

    }

    if (isLegalMove && !isOutside) cellClass += 'ring-4 ring-mg-sand cursor-pointer hover:brightness-110 ';
    if (isSelected) cellClass += 'ring-4 ring-blue-400 ';
    if (isAiMoveFrom) cellClass += 'ring-4 ring-purple-400 ';
    if (isAiMoveTo) cellClass += 'ring-4 ring-purple-600 animate-pulse ';

    return (
      <div key={`${dRow}-${dCol}`} className={cellClass} onClick={() => handleCellClick(row, col)}>
        {isGoal && (
          <>
            <div className="absolute inset-0 pointer-events-none opacity-40" 
                 style={{
                   backgroundImage: `
                     repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(255,255,255,0.6) 8px, rgba(255,255,255,0.6) 8px),
                     repeating-linear-gradient(-45deg, transparent, transparent 4px, rgba(255,255,255,0.6) 8px, rgba(255,255,255,0.6) 8px)
                   `
                 }}
            />
            {/* Goal box borders - adjusted for orientation */}
            {!isLandscape ? (
              // Vertical/Portrait mode
              <>
                {isGoalLeft && col === 3 && <div className="absolute left-0 top-0 bottom-0 w-1 bg-mg-cream pointer-events-none" />}
                {isGoalLeft && col === 7 && <div className="absolute right-0 top-0 bottom-0 w-1 bg-mg-cream pointer-events-none" />}
                {isGoalLeft && row === 0 && col >= 3 && col <= 7 && <div className="absolute top-0 left-0 right-0 h-1 bg-mg-cream pointer-events-none" />}
                
                {isGoalRight && col === 3 && <div className="absolute left-0 top-0 bottom-0 w-1 bg-mg-cream pointer-events-none" />}
                {isGoalRight && col === 7 && <div className="absolute right-0 top-0 bottom-0 w-1 bg-mg-cream pointer-events-none" />}
                {isGoalRight && row === 14 && col >= 3 && col <= 7 && <div className="absolute bottom-0 left-0 right-0 h-1 bg-mg-cream pointer-events-none" />}
              </>
            ) : (
              // Landscape mode (transposed)
              <>
                {isGoalLeft && col === 3 && <div className="absolute top-0 left-0 right-0 h-1 bg-mg-cream pointer-events-none" />}
                {isGoalLeft && col === 7 && <div className="absolute bottom-0 left-0 right-0 h-1 bg-mg-cream pointer-events-none" />}
                {isGoalLeft && row === 0 && col >= 3 && col <= 7 && <div className="absolute left-0 top-0 bottom-0 w-1 bg-mg-cream pointer-events-none" />}
                
                {isGoalRight && col === 3 && <div className="absolute top-0 left-0 right-0 h-1 bg-mg-cream pointer-events-none" />}
                {isGoalRight && col === 7 && <div className="absolute bottom-0 left-0 right-0 h-1 bg-mg-cream pointer-events-none" />}
                {isGoalRight && row === 14 && col >= 3 && col <= 7 && <div className="absolute right-0 top-0 bottom-0 w-1 bg-mg-cream pointer-events-none" />}
              </>
            )}
          </>
        )}
        
        {player && (
          <div className="pointer-events-none">
            <ChipIcon color={TEAM_COLORS[player.team]} width={34} height={34} />
          </div>
        )}
        {hasBall && <img src="/assets/bw-ball.svg" alt="ball" className="w-7 h-7 drop-shadow" />}
        {
          (() => {
            const team = gameState?.currentTeam;
            if (!team || gameState?.level < 3) return null;
            const isLeft = team === 'LEFT';
            let special = false;
            if (isLeft) {
              if ((row === 13 && (col === 0 || col === 10)) || (row === 13 && col >= 3 && col <= 7)) special = true;
            } else {
              if ((row === 1 && (col === 0 || col === 10)) || (row === 1 && col >= 3 && col <= 7)) special = true;
            }
            return special ? <span className="absolute w-2 h-2 rounded-full bg-mg-cream" /> : null;
          })()
        }
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
          {isLandscape ? <SideToolbar /> : null}
          <div className="relative bg-mg-brown rounded-3xl pt-12 pb-6 px-6 shadow-2xl">
            {!isLandscape && (
              <div className="absolute top-2 left-0 right-0 flex items-center justify-center">
                <TopToolbar />
              </div>
            )}
            <ScorePill />
            <TimerWidget />
            <div className="bg-mg-brown rounded-xl p-4 relative">
              <div className="grid" style={{ gridTemplateRows: `repeat(${isLandscape ? 11 : 15}, 3rem)`, gridTemplateColumns: `repeat(${isLandscape ? 15 : 11}, 3rem)` }}>
                {Array.from({ length: isLandscape ? 11 : 15 }).map((_, r) => (
                  Array.from({ length: isLandscape ? 15 : 11 }).map((_, c) => (
                    <div key={`${r}-${c}`}>{renderCell(r, c)}</div>
                  ))
                ))}
              </div>
            </div>
            <div className="mt-3 text-center text-mg-cream">
              <span className="font-bold">Turn: </span>
              <span className={gameState?.currentTeam === 'LEFT' ? 'text-mg-sand' : 'text-mg-sage'}>
                {gameState?.currentTeam}
              </span>
              {(() => {
                let enabled = false;
                let maxTurns = 0;
                try {
                  const saved = JSON.parse(sessionStorage.getItem('gameSession') || '{}');
                  enabled = !!saved?.maxTurnsEnabled;
                  maxTurns = saved?.maxTurns || 0;
                } catch {}
                const count = gameState?.turnCount ?? 0;
                return enabled && maxTurns ? (
                  <span className="ml-2 text-mg-cream/80">{count}/{maxTurns}</span>
                ) : null;
              })()}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {activeModal === 'home' && (
        <Modal title="Leave Game?" onClose={() => setActiveModal(null)}
          actions={[
            <button key="cancel" className="px-4 py-2 rounded bg-white/30" onClick={() => setActiveModal(null)}>Cancel</button>,
            <button key="leave" className="px-4 py-2 rounded bg-mg-brown text-mg-cream" onClick={() => navigate('/')}>Leave</button>
          ]}
        >
          <p>You're about to leave the game. Are you sure?</p>
        </Modal>
      )}
      {activeModal === 'help' && (
        <Modal title="Help" onClose={() => setActiveModal(null)}
          actions={[
            <button key="close" className="px-4 py-2 rounded bg-mg-brown text-mg-cream" onClick={() => setActiveModal(null)}>Close</button>
          ]}
        >
          <p>Select a chip or the ball; click highlighted cells to move or kick. Forced kicks apply when adjacent and ball is not neutral.</p>
        </Modal>
      )}
      {activeModal === 'about' && (
        <Modal title="About" onClose={() => setActiveModal(null)}
          actions={[
            <button key="close" className="px-4 py-2 rounded bg-mg-brown text-mg-cream" onClick={() => setActiveModal(null)}>Close</button>
          ]}
        >
          <p>This thesis project showcases AI agents (Minimax, MCTS, Heuristics) playing Mastergoal.</p>
        </Modal>
      )}
      {activeModal === 'config' && (
        <Modal title="Game Settings" onClose={() => setActiveModal(null)}
          actions={[
            <button key="save" className="px-4 py-2 rounded bg-mg-brown text-mg-cream" onClick={() => setActiveModal(null)}>Save</button>
          ]}
        >
          <div className="space-y-4">
            <div>
              <div className="font-semibold mb-1">Timer</div>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2">
                  <input type="checkbox" defaultChecked={timerEnabled} onChange={(e) => {
                    const saved = JSON.parse(sessionStorage.getItem('gameSession') || '{}');
                    saved.timerEnabled = e.target.checked; sessionStorage.setItem('gameSession', JSON.stringify(saved));
                  }} />
                  <span>Enabled</span>
                </label>
                <select defaultValue={timerMinutes} className="bg-white/40 px-2 py-1 rounded"
                  onChange={(e) => {
                    const saved = JSON.parse(sessionStorage.getItem('gameSession') || '{}');
                    saved.timerMinutes = parseInt(e.target.value); sessionStorage.setItem('gameSession', JSON.stringify(saved));
                  }}>
                  {[5,10,15,20].map(m => (<option key={m} value={m}>{m} min</option>))}
                </select>
              </div>
            </div>
          </div>
        </Modal>
      )}

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



