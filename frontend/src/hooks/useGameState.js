import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

export function useGameState(gameId) {
  const [gameState, setGameState] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchGameState = useCallback(async () => {
    if (!gameId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await api.getGameState(gameId);
      if (data.success) {
        setGameState(data.gameState);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [gameId]);

  const makeMove = useCallback(async (move) => {
    if (!gameId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await api.makeMove(gameId, move);
      if (data.success) {
        setGameState(data.gameState);
        return data;
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [gameId]);

  const restartGame = useCallback(async () => {
    if (!gameId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await api.restartGame(gameId);
      if (data.success) {
        setGameState(data.gameState);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [gameId]);

  useEffect(() => {
    fetchGameState();
  }, [fetchGameState]);

  return {
    gameState,
    loading,
    error,
    makeMove,
    restartGame,
    refetch: fetchGameState,
  };
}