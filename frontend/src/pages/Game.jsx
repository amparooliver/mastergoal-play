import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import ChipIcon from '../components/ChipIcon.jsx';
import Modal from '../components/Modal.jsx';
import { useI18n } from '../context/i18n2';

const Game = ({ gameId, initialState }) => {
  const [gameState, setGameState] = useState(initialState?.gameState || null);
  const [resolvedGameId, setResolvedGameId] = useState(gameId || null);
  const [selectedPiece, setSelectedPiece] = useState(null);
  const [legalMoves, setLegalMoves] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastAiMove, setLastAiMove] = useState(null);
  const [gameEnded, setGameEnded] = useState(false);
  const [winner, setWinner] = useState(null); // 'LEFT' | 'RIGHT' | 'DRAW' | null
  const [isAnimatingAi, setIsAnimatingAi] = useState(false);
  const aiAnimTimer = useRef(null);
  const [aiAnim, setAiAnim] = useState({ active: false, path: [], index: 0, type: null, team: null });
  const aiSequenceEnd = useRef(null);
  // AI sequence helpers for robust animation ordering
  const preKickBallRef = useRef({ active: false, row: null, col: null });
  const ballFinalPosRef = useRef(null); // {row, col} of last kick destination in sequence
  // Prevent AI autoplay when an extra-turn was just granted by special tile
  const [pendingExtraTurn, setPendingExtraTurn] = useState(false);
  // Drag and drop state
  const [dragging, setDragging] = useState({ active: false, from: null, type: null }); // type: 'piece' | 'ball'
  const [hoverCell, setHoverCell] = useState(null); // {row, col}
  // Track AI move sequence to control ball visibility ordering
  const aiSeqRef = useRef({ moves: [], index: -1, firstKick: -1 });

  // Animation tuning (slower, smoother pacing)
  const AI_STEP_MS = 420;            // time per grid step for AI overlays
  const AI_GAP_MS = 450;             // gap between consecutive moves in a sequence
  const AI_PRE_KICK_PAUSE_MS = 400;  // brief pause before kick to emphasize order
  const AI_POST_KICK_PAUSE_MS = 300; // brief pause after kick before next move
  const navigate = useNavigate();
  const [activeModal, setActiveModal] = useState(null); // 'home' | 'config' | 'help' | 'about'
  const { t } = useI18n();

  const ROWS = 15;
  const COLS = 11;

  // Board size that adapts to viewport so it doesn't require scroll in landscape
  const [boardWidthPx, setBoardWidthPx] = useState(null);

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
  const MODE = sessionConfig?.mode || 'pve';
  const HUMAN_TEAM = sessionConfig?.playerColor || 'LEFT';
  const AI_TEAM = HUMAN_TEAM === 'LEFT' ? 'RIGHT' : 'LEFT';

  const timerEnabled = !!sessionConfig?.timerEnabled;
  const timerSeconds = (sessionConfig?.timerSeconds ?? (sessionConfig?.timerMinutes ?? 0) * 60) || 0;
  const [secondsLeft, setSecondsLeft] = useState(timerEnabled ? timerSeconds : 0);

  // Track last known score to detect goals and trigger a popup
  const lastScoreRef = useRef({
    LEFT: initialState?.gameState?.score?.LEFT ?? 0,
    RIGHT: initialState?.gameState?.score?.RIGHT ?? 0,
  });
  const [lastGoalTeam, setLastGoalTeam] = useState(null); // 'LEFT' | 'RIGHT'
  const maybeShowGoalPopup = (score, { gameEnded } = { gameEnded: false }) => {
    try {
      const prev = lastScoreRef.current || { LEFT: 0, RIGHT: 0 };
      const l = score?.LEFT ?? 0;
      const r = score?.RIGHT ?? 0;
      const incLeft = l > (prev.LEFT ?? 0);
      const incRight = r > (prev.RIGHT ?? 0);
      lastScoreRef.current = { LEFT: l, RIGHT: r };
      if (gameEnded) return; // show game-over instead if match ended
      if (incLeft && !incRight) { setLastGoalTeam('LEFT'); setActiveModal('goal'); }
      else if (incRight && !incLeft) { setLastGoalTeam('RIGHT'); setActiveModal('goal'); }
    } catch {}
  };

  // Orientation: landscape if viewport wide enough
  const [isLandscape, setIsLandscape] = useState(() => window.matchMedia('(min-width: 1024px)').matches);
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const handler = (e) => setIsLandscape(e.matches);
    mq.addEventListener?.('change', handler);
    return () => mq.removeEventListener?.('change', handler);
  }, []);

  // Recompute board size to fit viewport (avoid vertical scroll in landscape)
  useEffect(() => {
    const recompute = () => {
      try {
        const vw = window.innerWidth || 0;
        const vh = window.innerHeight || 0;
        // Effective grid dimensions depending on orientation
        const rows = isLandscape ? 11 : 15;
        const cols = isLandscape ? 15 : 11;
        // Horizontal paddings around the grid area (container px-4 + wrapper px-6 + inner p-4)
        const padX = (16 + 24 + 16) * 2; // = 112px total
        const availableWidth = Math.max(0, vw - padX);
        // Vertical chrome/paddings above/below the grid so the full board fits without scroll
        // Outer py-8 (64) + wrapper pt-12 (48) + pb-6 (24) + inner p-4 (32) + below-turn text (~40)
        const overheadY = (isLandscape ? 200 : 220); // small buffer; tuneable without layout thrash
        const availableHeight = Math.max(0, vh - overheadY);
        // Grid height = gridWidth * rows/cols => gridWidth must be <= availableHeight * cols/rows
        const widthFromHeight = Math.floor(availableHeight * (cols / rows));
        // Final width bound by both width and height constraints
        const target = Math.max(280, Math.min(availableWidth, widthFromHeight));
        setBoardWidthPx(Number.isFinite(target) ? target : null);
      } catch {
        setBoardWidthPx(null);
      }
    };
    recompute();
    window.addEventListener('resize', recompute);
    return () => window.removeEventListener('resize', recompute);
  }, [isLandscape]);

  // Cleanup AI animation timer on unmount
  useEffect(() => {
    return () => {
      if (aiAnimTimer.current) {
        clearInterval(aiAnimTimer.current);
        aiAnimTimer.current = null;
      }
    };
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

  // Helpers to map between display coords and model coords
  const toModelCoords = (dRow, dCol) => ({ row: isLandscape ? dCol : dRow, col: isLandscape ? dRow : dCol });

  // Special tiles helper (reuse the same logic used for white dots)
  const isSpecialTileForTeam = (row, col, team) => {
    if (!team && gameState?.currentTeam) team = gameState.currentTeam;
    if (!team) return false;
    const isLeft = team === 'LEFT';
    if (isLeft) {
      if ((row === 13 && (col === 0 || col === 10)) || (row === 13 && col >= 3 && col <= 7)) return true;
      if ((row === 1 && (col === 0 || col === 10)) || (row === 1 && col >= 3 && col <= 7)) return true;
    } else {
      if ((row === 1 && (col === 0 || col === 10)) || (row === 1 && col >= 3 && col <= 7)) return true;
      if ((row === 13 && (col === 0 || col === 10)) || (row === 13 && col >= 3 && col <= 7)) return true;
    }
    return false;
  };

  // Lightweight notice banner (auto-hide)
  const [notice, setNotice] = useState(null); // { title, body }
  const noticeTimer = useRef(null);
  const showNotice = (title, body, ms = 4200) => {
    setNotice({ title, body });
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
    noticeTimer.current = setTimeout(() => setNotice(null), ms);
  };
  useEffect(() => () => { if (noticeTimer.current) clearTimeout(noticeTimer.current); }, []);

  // Drag and drop helpers
  const canStartDragAt = (row, col) => {
    if (!gameState) return { ok: false };
    const piece = gameState.players?.find(p => p.position.row === row && p.position.col === col);
    const onBall = gameState.ball?.row === row && gameState.ball?.col === col;
    if (piece && piece.team === gameState.currentTeam) {
      return { ok: true, type: 'piece', piece };
    }
    if (onBall) {
      const kickMoves = (gameState.legalMoves || []).filter(m => (m.type === 'kick') && m.from.row === row && m.from.col === col);
      if (kickMoves.length) return { ok: true, type: 'ball', piece: { isBall: true, position: { row, col } }, kickMoves };
    }
    return { ok: false };
  };

  const startDragFrom = (row, col) => {
    const info = canStartDragAt(row, col);
    if (!info.ok) return false;
    if (info.type === 'piece') {
      setSelectedPiece(info.piece);
      const pieceMoves = (gameState.legalMoves || []).filter(m => m.from.row === row && m.from.col === col);
      setLegalMoves(pieceMoves);
    } else {
      setSelectedPiece(info.piece);
      const kickMoves = (gameState.legalMoves || []).filter(m => (m.type === 'kick') && m.from.row === row && m.from.col === col);
      setLegalMoves(kickMoves);
      if ((kickMoves || []).length === 0) {
        showNotice(t('neutralTileTitle'), t('neutralTileBody'));
      }
    }
    setDragging({ active: true, from: { row, col }, type: info.type });
    setHoverCell({ row, col });
    return true;
  };

  const cancelDrag = () => {
    setDragging({ active: false, from: null, type: null });
    setHoverCell(null);
  };

  const commitDragTo = (target) => {
    if (!target) { cancelDrag(); return; }
    const move = (legalMoves || []).find(m => m.to.row === target.row && m.to.col === target.col);
    cancelDrag();
    if (move) {
      executeMove(move);
    }
  };

  // Fetch game state
  const fetchGameState = async () => {
    const gid = resolvedGameId || gameId;
    if (!gid) return;
    try {
      const response = await fetch(`${API_BASE}/api/game/${gid}/state`);
      if (response.status === 404) {
        await recreateGameSession();
        return;
      }
      const data = await response.json();
      if (data.success) {
        setGameState(data.gameState);
        try { maybeShowGoalPopup(data.gameState?.score, { gameEnded: false }); } catch {}
        const aiMoves = data.aiMoves || (data.lastAiMove ? [data.lastAiMove] : []);
        if (aiMoves.length) animateAiSequence(aiMoves);
        // If backend marks session completed on AI turn, infer winner and show modal
        if (data.status === 'completed' && !gameEnded) {
          const left = data.gameState?.score?.LEFT ?? 0;
          const right = data.gameState?.score?.RIGHT ?? 0;
          const inferred = left === right ? 'DRAW' : (left > right ? 'LEFT' : 'RIGHT');
          setWinner(inferred);
          setGameEnded(true);
          setActiveModal('gameover');
        }
      }
    } catch (e) {
      console.error('Error fetching game state:', e);
    }
  };

  // Recreate game on server if in-memory session was lost (e.g., backend restart)
  const recreateGameSession = async () => {
    try {
      const saved = JSON.parse(sessionStorage.getItem('gameSession') || '{}');
      const payload = {
        level: saved.level || 1,
        difficulty: saved.difficulty || 'medium',
        playerColor: saved.playerColor || saved.playerColor || 'LEFT',
        mode: saved.mode || 'pve',
        timerEnabled: !!saved.timerEnabled,
        timerMinutes: Math.ceil(((saved.timerSeconds || 0) / 60) || saved.timerMinutes || 0),
        maxTurnsEnabled: !!saved.maxTurnsEnabled,
        maxTurns: saved.maxTurnsEnabled ? (saved.maxTurns || 0) : undefined,
      };
      const resp = await fetch(`${API_BASE}/api/game/new`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!resp.ok) return;
      const data = await resp.json();
      if (!data?.success) return;
      const playerTeam = payload.playerColor;
      const opponentTeam = playerTeam === 'LEFT' ? 'RIGHT' : 'LEFT';
      const enriched = {
        ...data,
        mode: payload.mode,
        timerEnabled: payload.timerEnabled,
        timerSeconds: saved.timerSeconds || 0,
        maxTurnsEnabled: !!payload.maxTurnsEnabled,
        maxTurns: payload.maxTurnsEnabled ? payload.maxTurns : 0,
        chipColors: saved.chipColors || { LEFT: '#E6DCB7', RIGHT: '#A4A77E' },
      };
      sessionStorage.setItem('gameSession', JSON.stringify(enriched));
      setResolvedGameId(data.gameId);
      setGameState(data.gameState);
      showNotice('Sesión recuperada', 'El servidor se reinició. Creamos una nueva partida con tu configuración.');
    } catch (e) {
      console.error('Failed to recreate game session:', e);
    }
  };

  const buildPath = (from, to) => {
    const dr = Math.sign((to?.row ?? 0) - (from?.row ?? 0));
    const dc = Math.sign((to?.col ?? 0) - (from?.col ?? 0));
    const steps = Math.max(
      Math.abs((to?.row ?? 0) - (from?.row ?? 0)),
      Math.abs((to?.col ?? 0) - (from?.col ?? 0))
    );
    return Array.from({ length: steps + 1 }).map((_, i) => ({ row: from.row + dr * i, col: from.col + dc * i }));
  };

  const animateSingleMove = (move, onDone) => {
    const path = buildPath(move.from, move.to);
    if (!path || path.length <= 1) { setTimeout(onDone, 100); return; }
    setIsAnimatingAi(true);
    const moveType = move.moveType || move.type;
    // If a kick starts, stop the pre-kick overlay immediately
    if (moveType === 'kick') {
      preKickBallRef.current = { active: false, row: null, col: null };
    }
    setAiAnim({ active: true, path, index: 0, type: moveType, team: move.player });
    if (aiAnimTimer.current) clearInterval(aiAnimTimer.current);
    // Slow down AI step animation for better readability
    aiAnimTimer.current = setInterval(() => {
      setAiAnim(prev => {
        const nextIndex = prev.index + 1;
        if (nextIndex >= prev.path.length) {
          clearInterval(aiAnimTimer.current);
          aiAnimTimer.current = null;
          setAiAnim({ active: false, path: [], index: 0, type: null, team: null });
          setTimeout(onDone, 80);
          return prev;
        }
        return { ...prev, index: nextIndex };
      });
    }, AI_STEP_MS);
  };

  const animateAiSequence = (moves) => {
    if (!moves || moves.length === 0) return;
    setLastAiMove(moves[moves.length - 1]);
    // Track whole sequence and kick boundaries
    const firstKickIndex = moves.findIndex(m => (m.moveType || m.type) === 'kick');
    const lastKickIndex = (() => {
      let idx = -1; for (let k = moves.length - 1; k >= 0; k--) { if ((moves[k].moveType || moves[k].type) === 'kick') { idx = k; break; } }
      return idx;
    })();
    aiSequenceEnd.current = moves[moves.length - 1].to;
    aiSeqRef.current = {
      moves,
      index: 0,
      firstKick: firstKickIndex,
    };
    // Prepare pre-kick overlay at the original ball position (before any kicks)
    if (firstKickIndex >= 0) {
      const firstKick = moves[firstKickIndex];
      preKickBallRef.current = { active: true, row: firstKick.from.row, col: firstKick.from.col };
    } else {
      preKickBallRef.current = { active: false, row: null, col: null };
    }
    // Remember ball final destination (last kick target) to hide static ball only there during anims
    if (lastKickIndex >= 0) {
      ballFinalPosRef.current = { ...moves[lastKickIndex].to };
    } else {
      ballFinalPosRef.current = null;
    }
    let i = 0;
    const next = () => {
      if (i >= moves.length) {
        setIsAnimatingAi(false);
        aiSequenceEnd.current = null;
        aiSeqRef.current = { moves: [], index: -1, firstKick: -1 };
        preKickBallRef.current = { active: false, row: null, col: null };
        ballFinalPosRef.current = null;
        setTimeout(() => setLastAiMove(null), 1000);
        return;
      }
      // Add a small delay between consecutive AI moves
      const move = moves[i];
      aiSeqRef.current.index = i;
      const start = () => {
        animateSingleMove(move, () => {
          i += 1;
          const gap = (move.moveType || move.type) === 'kick'
            ? (AI_GAP_MS + AI_POST_KICK_PAUSE_MS)
            : AI_GAP_MS;
          setTimeout(next, gap);
        });
      };
      // Insert a small pause before the kick starts and show pre-kick ball at the kick origin
      if ((move.moveType || move.type) === 'kick') {
        preKickBallRef.current = { active: true, row: move.from.row, col: move.from.col };
        setTimeout(start, AI_PRE_KICK_PAUSE_MS);
      } else {
        start();
      }
    };
    next();
  };

  useEffect(() => {
    const gid = resolvedGameId || gameId;
    if (gid && !initialState) fetchGameState();
  }, [resolvedGameId, gameId]);

  // If AI should start or it's AI's turn on load, trigger state fetch to let backend play
  useEffect(() => {
    if (!gameState) return;
    const gid = resolvedGameId || gameId;
    if (!gid) return;
    if (MODE === 'pve' && gameState.currentTeam === AI_TEAM && !isLoading && !isAnimatingAi && !activeModal && !pendingExtraTurn) {
      fetchGameState();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState?.currentTeam, pendingExtraTurn, activeModal]);

  // Timer: simple per-turn countdown UI (client-side only)
  useEffect(() => {
    if (!timerEnabled || gameEnded || activeModal) return;
    setSecondsLeft(timerSeconds);
    const id = setInterval(() => setSecondsLeft((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState?.currentTeam, timerEnabled, gameEnded, activeModal, timerSeconds]);

  // When timer hits zero on player's turn, auto-play a random legal move
  useEffect(() => {
    const humanTeam = sessionConfig?.playerColor;
    // Also pause auto-move while AI animation is running to avoid ordering conflicts
    if (!timerEnabled || secondsLeft > 0 || gameEnded || isLoading || isAnimatingAi) return;
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
    if (isLoading || gameEnded || !gameState || isAnimatingAi) return;
    if (activeModal) return;
    if (MODE === 'pve' && gameState.currentTeam !== HUMAN_TEAM) return; // block input if it's AI's turn

    const piece = gameState.players?.find(p => p.position.row === row && p.position.col === col);
    const onBall = gameState.ball?.row === row && gameState.ball?.col === col;

    if (piece && piece.team === gameState.currentTeam) {
      setSelectedPiece(piece);
      const pieceMoves = gameState.legalMoves.filter(m => m.from.row === row && m.from.col === col);
      setLegalMoves(pieceMoves);
      return;
    }

    if (selectedPiece) {
      // If clicking the same origin cell again, keep selection (avoid immediate deselect flicker)
      const selRow = selectedPiece.position?.row;
      const selCol = selectedPiece.position?.col;
      if ((selRow === row && selCol === col) || (selectedPiece.isBall && onBall)) {
        return;
      }
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
      } else {
        showNotice(t('neutralTileTitle'), t('neutralTileBody'));
      }
    }
  };

  // Execute move
  const executeMove = async (move) => {
    const gid = resolvedGameId || gameId;
    if (!gid) return;
    const movingTeam = gameState?.currentTeam;
    setPendingExtraTurn(false);
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/game/${gid}/move`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ moveType: move.type, fromPos: move.from, toPos: move.to })
      });
      if (response.status === 404) {
        await recreateGameSession();
        setIsLoading(false);
        return;
      }
      const data = await response.json();
      if (response.ok && data.success) {
        setGameState(data.gameState);
        try { maybeShowGoalPopup(data.gameState?.score, { gameEnded: !!data.gameEnded }); } catch {}
        setSelectedPiece(null);
        setLegalMoves([]);
        const aiMoves = data.aiMoves || (data.lastAiMove ? [data.lastAiMove] : []);
        // If team kept the turn after a kick to a special tile, surface extra-turn notice
        try {
          const kicked = move.type === 'kick';
          const ballEnd = data.gameState?.ball;
          const teamKeepsTurn = movingTeam && (data.gameState?.currentTeam === movingTeam);
          if (kicked && teamKeepsTurn && ballEnd && isSpecialTileForTeam(ballEnd.row, ballEnd.col, movingTeam)) {
            showNotice(t('specialTileTitle'), t('specialTileBody'));
          }
        } catch {}
        // Backend hint: extra turn granted (guard AI autoplay)
        if (!data.gameEnded && data.extraTurn) {
          setPendingExtraTurn(true);
        }
        if (aiMoves.length) animateAiSequence(aiMoves);
        if (data.gameEnded) {
          setGameEnded(true);
          setWinner(data.winner);
          setActiveModal('gameover');
        }
      } else {
        // Desync or invalid move. Refresh state to recover and clear selection.
        console.warn('Move rejected', data);
        try { await fetchGameState(); } catch {}
        setSelectedPiece(null);
        setLegalMoves([]);
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
        try { lastScoreRef.current = { LEFT: data.gameState?.score?.LEFT ?? 0, RIGHT: data.gameState?.score?.RIGHT ?? 0 }; } catch {}
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
  const ScoreBoard = () => {
    const leftScore = gameState?.score?.LEFT ?? 0;
    const rightScore = gameState?.score?.RIGHT ?? 0;
    const leftLabel = MODE === 'pve' && HUMAN_TEAM === 'LEFT' ? 'YOU' : 'LEFT';
    const rightLabel = MODE === 'pve' && HUMAN_TEAM === 'RIGHT' ? 'YOU' : (MODE === 'pve' ? 'AI' : 'RIGHT');
    return (
      <div className="absolute top-2 left-1/2 -translate-x-1/2 z-20">
        <div className="flex items-center gap-4 bg-mg-brown/95 text-mg-cream px-3 sm:px-4 py-1.5 rounded-full shadow-lg">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full" style={{ backgroundColor: TEAM_COLORS.LEFT }} />
            <span className="text-xs sm:text-sm font-semibold tracking-wide">{leftLabel}</span>
          </div>
          <div className="inline-flex items-center bg-mg-sand text-mg-brown font-extrabold px-3 py-0.5 rounded text-lg sm:text-xl leading-none">
            {leftScore}
            <span className="mx-2">-</span>
            {rightScore}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs sm:text-sm font-semibold tracking-wide">{rightLabel}</span>
            <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full" style={{ backgroundColor: TEAM_COLORS.RIGHT }} />
          </div>
        </div>
      </div>
    );
  };

  // Turn indicator: keep simple text below the board

  const SideToolbar = () => (
    <div className="absolute left-0 top-1/2 -translate-y-1/2 ml-[140px]">
      <div className="w-20 rounded-2xl bg-mg-brown/95 text-mg-cream flex flex-col items-center py-8 gap-12 shadow-lg">
        <button onClick={() => setActiveModal('home')} title="Inicio" className="hover:opacity-90">
          <img src="/assets/HomeVerticalMenu.svg" alt="Home" className="w-8 h-8" />
        </button>
        <button onClick={() => setActiveModal('pause')} title="Pausa" className="hover:opacity-90">
          <img src="/assets/PauseVerticalMenu.svg" alt="Pause" className="w-8 h-8" />
        </button>
        <button onClick={() => setActiveModal('restart')} title="Reiniciar" className="hover:opacity-90">
          <img src="/assets/RestartVerticalMenu.svg" alt="Restart" className="w-8 h-8" />
        </button>
        <button onClick={() => setActiveModal('help')} title="Ayuda" className="hover:opacity-90">
          <img src="/assets/AboutVerticalMenu.svg" alt="About" className="w-8 h-8" />
        </button>
        <button onClick={() => setActiveModal('config')} title="Configuraci�n" className="hover:opacity-90">
          <img src="/assets/SettingsVerticalMenu.svg" alt="Settings" className="w-8 h-8" />
        </button>

      </div>
    </div>
  );

  // Horizontal toolbar for small/vertical screens
  const TopToolbar = () => (
    <div className="flex items-center justify-center gap-5 text-mg-cream">
      <button onClick={() => setActiveModal('home')} title="Inicio" className="hover:opacity-90">
        <img src="/assets/HomeVerticalMenu.svg" alt="Home" className="w-6 h-6" />
      </button>
      <button onClick={() => setActiveModal('help')} title="Ayuda" className="hover:opacity-90">?</button>
      <button onClick={() => setActiveModal('config')} title="Configuraci�n" className="hover:opacity-90">
        <img src="/assets/SettingsVerticalMenu.svg" alt="Settings" className="w-6 h-6" />
      </button>
      <button onClick={() => setActiveModal('about')} title="Acerca de" className="hover:opacity-90">
        <img src="/assets/AboutVerticalMenu.svg" alt="About" className="w-6 h-6" />
      </button>
    </div>
  );

  const TimerWidget = () => (
    !timerEnabled ? null : (
      <div className="absolute right-0 top-1/2 -translate-y-1/2 mr-[-160px]">
        <div className="w-28 rounded-2xl bg-mg-brown/95 text-mg-cream flex flex-col items-center py-4 gap-2 shadow-lg">
          <div className="text-3xl">??</div>
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

    // AI animation overlay logic
    const aiActive = aiAnim.active;
    const aiStepPos = aiActive ? aiAnim.path[aiAnim.index] : null;
    const aiFinalPos = aiActive ? aiAnim.path[aiAnim.path.length - 1] : null;
    const showAiOverlayHere = aiActive && aiStepPos && aiStepPos.row === row && aiStepPos.col === col;
    const hideFinalDuringAnim = aiActive && aiFinalPos && aiFinalPos.row === row && aiFinalPos.col === col;
    const hideSequenceEnd = aiActive && aiSequenceEnd.current && aiSequenceEnd.current.row === row && aiSequenceEnd.current.col === col;
    // Determine if we should hide the static ball at its final position only (to avoid ghosting),
    // and show a pre-kick overlay at the original position until the first kick starts.
    const seq = aiSeqRef.current;
    const firstKickIndex = (seq && typeof seq.firstKick === 'number') ? seq.firstKick : -1;
    const curSeqIndex = (seq && typeof seq.index === 'number') ? seq.index : -1;
    const ballFinal = ballFinalPosRef.current;
    const isBallFinalCell = !!ballFinal && ballFinal.row === row && ballFinal.col === col;
    const hideStaticBallOnlyAtFinal = isBallFinalCell && (curSeqIndex < firstKickIndex || (aiActive && aiAnim.type === 'kick'));

    const isLegalMove = legalMoves.some(m => m.to.row === row && m.to.col === col);
    const isHoverTarget = dragging.active && hoverCell && hoverCell.row === row && hoverCell.col === col;
    const isSelected = selectedPiece && selectedPiece.position?.row === row && selectedPiece.position?.col === col;
    const isAiMoveFrom = lastAiMove && lastAiMove.from.row === row && lastAiMove.from.col === col;
    const isAiMoveTo = lastAiMove && lastAiMove.to.row === row && lastAiMove.to.col === col;
    const isDragOrigin = dragging.active && dragging.from && dragging.from.row === row && dragging.from.col === col;
    const hideStaticPieceOnDrag = isDragOrigin && dragging.type === 'piece';
    const hideStaticBallOnDrag = isDragOrigin && dragging.type === 'ball';
    const hoverIsLegal = isHoverTarget && isLegalMove;
    let dragTeam = null;
    if (dragging.active && dragging.type === 'piece') {
      dragTeam = selectedPiece?.team;
      if (!dragTeam && dragging.from) {
        const dp = gameState?.players?.find(p => p.position.row === dragging.from.row && p.position.col === dragging.from.col);
        dragTeam = dp?.team || null;
      }
    }

    let cellClass = 'w-full h-full relative flex items-center justify-center ';
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

    // Highlight styles for legal moves
    if (isLegalMove && !isOutside) {
      // Keep interaction + hover only; visual effect is rendered via overlay element below
      cellClass += 'cursor-pointer hover:brightness-110 ';
    }
    // Removed blue selection ring for selected chip
    if (isHoverTarget && isLegalMove) cellClass += 'ring-4 ring-yellow-400 ';
    // Remove AI move borders to avoid colored outlines during AI animations
    // (was ring-purple on from/to cells)

    return (
      <div key={`${dRow}-${dCol}`} className={cellClass}>
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

        {/* Legal move overlay visuals (keeps full, even glow around the square) */}
        
        {isLegalMove && !isOutside && (
          <>
            {/* 1) BORDERS ONLY (active) */}
            <span className="pointer-events-none absolute inset-0 rounded-sm z-10 border-4 border-[#ffbe02]"></span>

            {/* 2) GLOW ONLY ? uncomment to try */}
            {/** <span className="pointer-events-none absolute inset-0 rounded-sm z-10 shadow-[0_0_0_2px_rgba(255,255,255,0.6),0_0_18px_6px_rgba(255,190,2,0.9)]"></span> **/}

            {/* 3) PAINTED ONLY (yellow fill) ? uncomment to try */}
            {/** <span className="pointer-events-none absolute inset-0 rounded-sm z-10 bg-[#ffbe02] opacity-70"></span> **/}
          </>
        )}
        {player && !(hideFinalDuringAnim || hideSequenceEnd) && !hideStaticPieceOnDrag && (
          <div className="pointer-events-none w-3/4 h-3/4 flex items-center justify-center">
            <ChipIcon color={TEAM_COLORS[player.team]} width="100%" height="100%" />
          </div>
        )}
        {/* Static ball, hidden only at its final destination while pre-kick/kick is animating */}
        {hasBall && !(hideFinalDuringAnim || hideSequenceEnd || hideStaticBallOnlyAtFinal) && !hideStaticBallOnDrag && (
          <img src="/assets/bw-ball.svg" alt="ball" className="relative z-30 pointer-events-none w-1/2 h-1/2 drop-shadow" />
        )}
        {/* Pre-kick overlay ball at original position until the kick animation begins */}
        {preKickBallRef.current.active && preKickBallRef.current.row === row && preKickBallRef.current.col === col && (
          <img src="/assets/bw-ball.svg" alt="ball-prekick" className="relative z-30 pointer-events-none w-1/2 h-1/2 opacity-90 drop-shadow" />
        )}
        {showAiOverlayHere && (
          aiAnim.type === 'kick' ? (
            <img src="/assets/bw-ball.svg" alt="ball-anim" className="relative z-30 w-1/2 h-1/2 drop-shadow pointer-events-none" />
          ) : (
            <div className="pointer-events-none w-3/4 h-3/4 flex items-center justify-center">
              <ChipIcon color={TEAM_COLORS[aiAnim.team] || '#FFF'} width="100%" height="100%" />
            </div>
          )
        )}
        {/* Ghost preview snapped to hovered cell while dragging */}
        {dragging.active && isHoverTarget && (
          dragging.type === 'ball' ? (
            <div className={`absolute inset-0 flex items-center justify-center pointer-events-none z-40 ${hoverIsLegal ? 'opacity-90' : 'opacity-60'}`}>
              <img
                src="/assets/bw-ball.svg"
                alt="ball-ghost"
                className={`w-1/2 h-1/2 drop-shadow transition-transform duration-150 ease-out ${hoverIsLegal ? 'scale-110' : 'scale-95'}`}
              />
            </div>
          ) : (
            <div className={`absolute inset-0 flex items-center justify-center pointer-events-none z-40 ${hoverIsLegal ? 'opacity-90' : 'opacity-60'}`}>
              <div className={`w-3/4 h-3/4 transition-transform duration-150 ease-out ${hoverIsLegal ? 'scale-110' : 'scale-95'}`}>
                <ChipIcon color={TEAM_COLORS[dragTeam] || '#FFF'} width="100%" height="100%" />
              </div>
            </div>
          )
        )}
        {
          (() => {
            const team = gameState?.currentTeam;
            if (!team) return null;
            const isLeft = team === 'LEFT';
            let special = false;
            if (isLeft) {
              if ((row === 13 && (col === 0 || col === 10)) || (row === 13 && col >= 3 && col <= 7)) special = true;
              if ((row === 1 && (col === 0 || col === 10)) || (row === 1 && col >= 3 && col <= 7)) special = true;
            } else {
              if ((row === 1 && (col === 0 || col === 10)) || (row === 1 && col >= 3 && col <= 7)) special = true;
              if ((row === 13 && (col === 0 || col === 10)) || (row === 13 && col >= 3 && col <= 7)) special = true;
            }
            return special ? (
              <span className="absolute w-4 h-4 rounded-full bg-mg-cream shadow-sm z-10 pointer-events-none" />
            ) : null;
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
    <div className="min-h-screen bg-mg-green-1 py-8 overflow-x-hidden">
      <div className="container mx-auto px-4">
        <div className="relative flex items-start justify-center">
          {isLandscape ? <SideToolbar /> : null}
          <div className="relative bg-mg-brown rounded-3xl pt-12 pb-6 px-6 shadow-2xl">
            {!isLandscape && (
              <div className="absolute top-2 left-0 right-0 flex items-center justify-center">
                <TopToolbar />
              </div>
            )}
            <ScoreBoard />
            {/* Responsive notice banner */}
            {notice && (
              <div className="absolute top-14 left-1/2 -translate-x-1/2 z-30 px-3 sm:px-4 py-2 bg-mg-brown/95 text-mg-cream rounded-full shadow-md flex items-center gap-2 max-w-[92vw]">
                <span className="inline-block text-xs sm:text-sm font-semibold">{notice.title}:</span>
                <span className="inline-block text-xs sm:text-sm opacity-95">{notice.body}</span>
                <button className="ml-2 text-mg-cream/80 hover:text-mg-cream text-sm" onClick={() => setNotice(null)} aria-label="Close">×</button>
              </div>
            )}
            <TimerWidget />
            <div className="bg-mg-brown rounded-xl p-4 relative">
              {(() => {
                const rows = isLandscape ? 11 : 15;
                const cols = isLandscape ? 15 : 11;
                return (
                  <div
                    className="grid"
                    style={{
                      width: boardWidthPx ? `${boardWidthPx}px` : undefined,
                      maxWidth: '92vw',
                      gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
                      touchAction: 'manipulation'
                    }}
                    onPointerUp={(e) => {
                      if (!dragging.active) return;
                      e.preventDefault();
                      commitDragTo(hoverCell);
                    }}
                    onPointerCancel={() => { if (dragging.active) cancelDrag(); }}
                    onPointerLeave={() => { if (dragging.active) cancelDrag(); }}
                  >
                    {Array.from({ length: rows }).map((_, r) => (
                      Array.from({ length: cols }).map((_, c) => (
                        <div
                          key={`${r}-${c}`}
                          onPointerDown={(e) => {
                            const { row, col } = toModelCoords(r, c);
                            if (isLoading || gameEnded || !gameState || isAnimatingAi || activeModal) return;
                            if (MODE === 'pve' && gameState.currentTeam !== HUMAN_TEAM) return;
                            // Try to start drag; if not eligible, fallback to click behavior
                            const started = startDragFrom(row, col);
                            if (!started) {
                              handleCellClick(row, col);
                            } else {
                              e.preventDefault();
                            }
                          }}
                          onPointerEnter={() => {
                            if (!dragging.active) return;
                            const { row, col } = toModelCoords(r, c);
                            setHoverCell({ row, col });
                          }}
                        >
                          {/* Each cell fills its grid track; content keeps square via aspect-square wrapper */}
                          <div className="w-full aspect-square">{renderCell(r, c)}</div>
                        </div>
                      ))
                    ))}
                  </div>
                );
              })()}
            </div>
            <div className="mt-3 text-center text-mg-cream">
              {(() => {
                // In PvE we often receive a state where AI already played (backend chains moves),
                // making currentTeam look like it never changed. Reflect AI's turn while animating.
                const displayTeam = (MODE === 'pve' && (isAnimatingAi)) ? AI_TEAM : (gameState?.currentTeam);
                const cls = displayTeam === 'LEFT' ? 'text-mg-sand' : 'text-mg-sage';
                return (
                  <>
                    <span className="font-bold">Turn: </span>
                    <span className={cls}>{displayTeam}</span>
                  </>
                );
              })()}
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
        <Modal title={t('homeConfirmTitle')} onClose={() => setActiveModal(null)}
          actions={[
            <button key="cancel" className="px-4 py-2 rounded bg-white/30" onClick={() => setActiveModal(null)}>{t('cancel')}</button>,
            <button key="leave" className="px-4 py-2 rounded bg-mg-brown text-mg-cream" onClick={() => navigate('/')}>{t('leave')}</button>
          ]}
        >
          <p>{t('homeConfirmText')}</p>
        </Modal>
      )}

      {activeModal === 'pause' && (
        <Modal title="Pausa" onClose={() => setActiveModal(null)}
          actions={[
            <button key="resume" className="px-4 py-2 rounded bg-mg-brown text-mg-cream" onClick={() => setActiveModal(null)}>Continuar</button>
          ]}
        >
          <p className="text-mg-brown">La partida esta pausada. Cerra para continuar jugando.</p>
        </Modal>
      )}

      {activeModal === 'restart' && (
        <Modal title="¿Reiniciar partida?" onClose={() => setActiveModal(null)}
          actions={[
            <button key="cancel" className="px-4 py-2 rounded bg-white/30" onClick={() => setActiveModal(null)}>Cancelar</button>,
            <button key="restart" className="px-4 py-2 rounded bg-mg-brown text-mg-cream" onClick={() => { setActiveModal(null); restartGame(); }}>Reiniciar</button>
          ]}
        >
          <p className="text-mg-brown">Esto reiniciará el tablero y el marcador. ¿Estás seguro?</p>
        </Modal>
      )}

      {activeModal === 'help' && (
        <Modal title="Libro de Reglas" onClose={() => setActiveModal(null)} contentClassName="max-w-5xl w-[95vw] max-h-[90vh]"
          actions={[
            <button key="close" className="px-4 py-2 rounded bg-mg-brown text-mg-cream" onClick={() => setActiveModal(null)}>Cerrar</button>
          ]}
        >
          <div className="w-full h-[70vh] overflow-hidden">
            <iframe src="/how-to-play?embed=1" title="Libro de Reglas" className="w-full h-full rounded" />
          </div>
        </Modal>
      )}

      {activeModal === 'about' && (
        <Modal title={t('about')} onClose={() => setActiveModal(null)}
          actions={[
            <button key="close" className="px-4 py-2 rounded bg-mg-brown text-mg-cream" onClick={() => setActiveModal(null)}>{t('close')}</button>
          ]}
        >
          <p>{t('researchBlurb')}</p>
        </Modal>
      )}

      {activeModal === 'config' && (
        <Modal title={t('configTitle')} onClose={() => setActiveModal(null)}
          actions={[
            <button key="save" className="px-4 py-2 rounded bg-mg-brown text-mg-cream" onClick={() => setActiveModal(null)}>{t('save')}</button>
          ]}
        >
          <div className="space-y-6">
            <div>
              <div className="font-semibold mb-1">{t('turnTimer')}</div>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2">
                  <input type="checkbox" defaultChecked={timerEnabled} onChange={(e) => {
                    const saved = JSON.parse(sessionStorage.getItem('gameSession') || '{}');
                    saved.timerEnabled = e.target.checked; sessionStorage.setItem('gameSession', JSON.stringify(saved));
                  }} />
                  <span>{t('enabled')}</span>
                </label>
                <select defaultValue={timerSeconds || 15} className="bg-white/40 px-2 py-1 rounded"
                  onChange={(e) => {
                    const saved = JSON.parse(sessionStorage.getItem('gameSession') || '{}');
                    saved.timerSeconds = parseInt(e.target.value);
                    sessionStorage.setItem('gameSession', JSON.stringify(saved));
                  }}>
                  {[10,15,20,30,45,60].map(s => (<option key={s} value={s}>{s} {t('seconds')}</option>))}
                </select>
              </div>
            </div>

            <div>
              <div className="font-semibold mb-1">{t('maxTurns')}</div>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2">
                  <input type="checkbox" defaultChecked={(function(){ try { return !!JSON.parse(sessionStorage.getItem('gameSession')||'{}').maxTurnsEnabled } catch(e){ return false } })()} onChange={(e) => {
                    const saved = JSON.parse(sessionStorage.getItem('gameSession') || '{}');
                    saved.maxTurnsEnabled = e.target.checked; sessionStorage.setItem('gameSession', JSON.stringify(saved));
                  }} />
                  <span>{t('enabled')}</span>
                </label>
                <input type="number" min={10} max={300} step={5}
                  defaultValue={(function(){ try { return JSON.parse(sessionStorage.getItem('gameSession')||'{}').maxTurns || 60 } catch(e){ return 60 } })()}
                  className="w-28 bg-white/40 px-2 py-1 rounded border border-mg-cream/20"
                  onChange={(e) => {
                    const saved = JSON.parse(sessionStorage.getItem('gameSession') || '{}');
                    saved.maxTurns = parseInt(e.target.value || '0'); sessionStorage.setItem('gameSession', JSON.stringify(saved));
                  }} />
              </div>
            </div>
          </div>
        </Modal>
      )}
      {/* Goal Modal */}
      {activeModal === 'goal' && lastGoalTeam && (
        <Modal
          title={lastGoalTeam === 'LEFT' ? '¡Gol del equipo LEFT!' : '¡Gol del equipo RIGHT!'}
          onClose={() => setActiveModal(null)}
          actions={[
            <button key="continue" className="px-4 py-2 rounded bg-mg-brown text-mg-cream" onClick={() => setActiveModal(null)}>
              Continuar
            </button>
          ]}
        >
          <p className="text-mg-brown">
            {(function() {
              if (MODE === 'pve') {
                const humanScored = lastGoalTeam === HUMAN_TEAM;
                return humanScored ? '¡Anotaste un gol! ¡Bien jugado!' : '¡El rival anotó! ¡A remontar!';
              }
              return 'Se ha anotado un gol. La partida continúa.';
            })()}
          </p>
        </Modal>
      )}
      {/* Game Over Modal */}
      {activeModal === 'gameover' && (
        <Modal
          title={(function() {
            if (!winner) return 'Partida terminada';
            if (winner === 'DRAW') return '¡Empate!';
            if (MODE === 'pve') {
              return winner === HUMAN_TEAM ? '¡Felicidades! ¡Ganaste!' : '¡Qué lástima! ¡Perdiste!';
            }
            // PvP: show winning side
            return winner === 'LEFT' ? '¡Gana LEFT!' : '¡Gana RIGHT!';
          })()}
          onClose={() => setActiveModal(null)}
          actions={[
            <button key="again" className="px-4 py-2 rounded bg-mg-brown text-mg-cream" onClick={() => { setActiveModal(null); restartGame(); }}>
              Jugar otra vez
            </button>,
            <button key="exit" className="px-4 py-2 rounded bg-white/30" onClick={() => navigate('/')}>Salir</button>
          ]}
        >
          <p className="text-mg-brown">
            {(function() {
              // Detect if draw due to max turns
              const saved = (() => { try { return JSON.parse(sessionStorage.getItem('gameSession')||'{}'); } catch { return {}; } })();
              const maxEnabled = !!saved?.maxTurnsEnabled;
              const maxTurns = saved?.maxTurns || 0;
              const turnCount = gameState?.turnCount ?? 0;
              const drawByTurns = winner === 'DRAW' && maxEnabled && maxTurns && turnCount >= maxTurns;
              if (winner === 'DRAW') {
                return drawByTurns ? t('drawByTurnsExplain') : t('drawExplain');
              }
              if (MODE === 'pve') {
                return winner === HUMAN_TEAM ? '¡Gran partido! ¿Otra ronda?' : 'Revancha inmediata, ¿te animas?';
              }
              return 'La partida ha terminado. ¿Jugar otra vez?';
            })()}
          </p>
        </Modal>
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



