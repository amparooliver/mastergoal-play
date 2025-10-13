import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const CHIP_COLORS = ['#F5EFD5', '#F18F01', '#A40606', '#202C59', '#120F0F'];

const GameConfig = ({ onStartGame }) => {
  const navigate = useNavigate();
  const [config, setConfig] = useState({
    level: 1,
    difficulty: 'medium',
    playerColor: 'LEFT',
    mode: 'pve', // 'pve' or 'pvp'
    timerEnabled: false,
    timerMinutes: 10,
    chipColor: '#F5EFD5',
    maxTurnsEnabled: false,
    maxTurns: 60,
    opponentChipColor: '#A40606',
  });

  const handleStartGame = async () => {
  try {
    const data = await api.createGame({
      level: config.level,
      difficulty: config.difficulty,
      playerColor: config.playerColor,
      mode: config.mode,
      timerEnabled: config.timerEnabled,
      timerMinutes: config.timerMinutes,
      maxTurnsEnabled: !!config.maxTurnsEnabled,
      maxTurns: config.maxTurnsEnabled ? config.maxTurns : undefined,
    });
    if (data && data.success) {
      const playerTeam = config.playerColor;
      const opponentTeam = playerTeam === 'LEFT' ? 'RIGHT' : 'LEFT';
      let opponentChip = config.opponentChipColor;
      if ((opponentChip || '').toLowerCase() === config.chipColor.toLowerCase()) {
        opponentChip = CHIP_COLORS.find(c => c.toLowerCase() !== config.chipColor.toLowerCase()) || '#A4A77E';
      }
      const enriched = {
        ...data,
        mode: config.mode,
        timerEnabled: config.timerEnabled,
        timerMinutes: config.timerMinutes,
        maxTurnsEnabled: !!config.maxTurnsEnabled,
        maxTurns: config.maxTurnsEnabled ? config.maxTurns : 0,
        chipColors: {
          [playerTeam]: config.chipColor,
          [opponentTeam]: opponentChip,
        },
      };
      try { sessionStorage.setItem('gameSession', JSON.stringify(enriched)); } catch {}
      onStartGame(enriched);
      navigate('/game');
    }
  } catch (error) {
    console.error('Error starting game:', error);
  }
};

  return (
    <div className="min-h-screen bg-mg-green-1 py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-5xl font-extrabold text-mg-cream mb-8 text-center">Game Configuration</h1>

          <div className="bg-mg-cream text-mg-brown rounded-lg p-8 border border-mg-cream/20">
            {/* Mode Selection */}
            <div className="mb-8">
              <label className="text-mg-brown text-xl font-bold mb-4 block">Mode</label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setConfig({ ...config, mode: 'pve' })}
                  className={`p-4 rounded-lg border transition ${config.mode === 'pve' ? 'bg-mg-green-1 text-mg-cream border-transparent' : 'bg-white/40 text-mg-brown hover:bg-white/60 border-mg-brown/20'}`}
                >
                  <div className="text-lg font-bold">1 PLAYER</div>
                  <div className="text-xs">vs AI</div>
                </button>
                <button
                  onClick={() => setConfig({ ...config, mode: 'pvp' })}
                  className={`p-4 rounded-lg border transition ${config.mode === 'pvp' ? 'bg-mg-green-1 text-mg-cream border-transparent' : 'bg-white/40 text-mg-brown hover:bg-white/60 border-mg-brown/20'}`}
                >
                  <div className="text-lg font-bold">2 PLAYERS</div>
                  <div className="text-xs">same device</div>
                </button>
              </div>
            </div>

            {/* Level Selection */}
            <div className="mb-8">
              <label className="text-mg-cream text-xl font-bold mb-4 block">Game Level</label>
              <div className="grid grid-cols-3 gap-4">
                {[1, 2, 3].map(level => (
                  <button
                    key={level}
                    onClick={() => setConfig({ ...config, level })}
                    className={`p-4 rounded-lg transition ${
                      config.level === level ? 'bg-mg-green-1 text-mg-cream' : 'bg-white/40 text-mg-brown hover:bg-white/60'
                    }`}
                  >
                    <div className="text-2xl font-bold">Level {level}</div>
                    <div className="text-sm mt-1">{level === 1 ? '1 vs 1' : level === 2 ? '2 vs 2' : '5 vs 5'}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Difficulty Selection */}
            <div className="mb-8">
              <label className="text-mg-brown text-xl font-bold mb-4 block">Difficulty</label>
              <div className="grid grid-cols-3 gap-4">
                {['easy', 'medium', 'hard'].map(diff => (
                  <button
                    key={diff}
                    onClick={() => setConfig({ ...config, difficulty: diff })}
                    className={`p-4 rounded-lg transition capitalize ${
                      config.difficulty === diff ? 'bg-mg-green-1 text-mg-cream' : 'bg-white/40 text-mg-brown hover:bg-white/60'
                    }`}
                  >
                    {diff}
                  </button>
                ))}
              </div>
            </div>

            {/* Team Side Selection */}
            <div className="mb-8">
              <label className="text-mg-brown text-xl font-bold mb-4 block">Your Team</label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setConfig({ ...config, playerColor: 'LEFT' })}
                  className={`p-4 rounded-lg transition ${
                    config.playerColor === 'LEFT' ? 'bg-mg-green-1 text-mg-cream' : 'bg-white/40 text-mg-brown hover:bg-white/60'
                  }`}
                >
                  <div className="font-bold">Left (You start)</div>
                  <div className="text-sm">Play first</div>
                </button>
                <button
                  onClick={() => setConfig({ ...config, playerColor: 'RIGHT' })}
                  className={`p-4 rounded-lg transition ${
                    config.playerColor === 'RIGHT' ? 'bg-mg-green-1 text-mg-cream' : 'bg-white/40 text-mg-brown hover:bg-white/60'
                  }`}
                >
                  <div className="font-bold">{config.mode === 'pvp' ? 'Right (Player 2)' : 'Right (AI starts)'}</div>
                  <div className="text-sm">Play second</div>
                </button>
              </div>
            </div>

            {/* Chip color selection */}
            <div className="mb-8">
              <label className="text-mg-brown text-xl font-bold mb-2 block">Team Colors</label>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="text-sm font-semibold mb-2">You</div>
                  <div className="flex flex-wrap gap-3">
                {CHIP_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setConfig({ ...config, chipColor: color })}
                    style={{ backgroundColor: color }}
                    className={`w-10 h-10 rounded-full border-2 ${
                      config.chipColor === color ? 'border-mg-sand ring-2 ring-mg-sand' : 'border-white/30'
                    }`}
                    title={color}
                  />
                ))}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-semibold mb-2">{config.mode === 'pvp' ? 'Player 2' : 'AI'}</div>
                  <div className="flex flex-wrap gap-3">
                    {CHIP_COLORS.map((color) => (
                      <button
                        key={color}
                        onClick={() => setConfig({ ...config, opponentChipColor: color })}
                        style={{ backgroundColor: color }}
                        className={`w-10 h-10 rounded-full border-2 ${
                          config.opponentChipColor === color ? 'border-mg-sand ring-2 ring-mg-sand' : 'border-white/30'
                        }`}
                        title={color}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Advanced Configurations */}
            <details className="mb-8">
              <summary className="cursor-pointer text-mg-brown text-xl font-bold">Advanced Configurations</summary>
              <div className="mt-4 space-y-6">
                {/* Timer Option */}
                <div>
                  <label className="text-mg-brown text-lg font-bold mb-2 block">Timer</label>
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => setConfig({ ...config, timerEnabled: !config.timerEnabled })}
                      className={`w-16 h-8 rounded-full transition ${config.timerEnabled ? 'bg-mg-green-1' : 'bg-white/40'}`}
                    >
                      <div className={`w-7 h-7 bg-white rounded-full transition transform ${config.timerEnabled ? 'translate-x-8' : 'translate-x-0.5'}`}></div>
                    </button>
                    <span className="text-mg-brown">{config.timerEnabled ? 'Enabled' : 'Disabled'}</span>
                    {config.timerEnabled && (
                      <select
                        value={config.timerMinutes}
                        onChange={(e) => setConfig({ ...config, timerMinutes: parseInt(e.target.value) })}
                        className="bg-white/40 text-mg-brown px-3 py-1 rounded border border-mg-cream/20"
                      >
                        <option value="5">5 minutes</option>
                        <option value="10">10 minutes</option>
                        <option value="15">15 minutes</option>
                        <option value="20">20 minutes</option>
                      </select>
                    )}
                  </div>
                </div>

                {/* Max Turns */}
                <div>
                  <label className="text-mg-brown text-lg font-bold mb-2 block">Max Turns</label>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setConfig({ ...config, maxTurnsEnabled: !config.maxTurnsEnabled })}
                      className={`w-16 h-8 rounded-full transition ${config.maxTurnsEnabled ? 'bg-mg-green-1' : 'bg-white/40'}`}
                    >
                      <div className={`w-7 h-7 bg-white rounded-full transition transform ${config.maxTurnsEnabled ? 'translate-x-8' : 'translate-x-0.5'}`}></div>
                    </button>
                    <input
                      type="number"
                      min={10}
                      max={300}
                      step={5}
                      value={config.maxTurns}
                      onChange={(e) => setConfig({ ...config, maxTurns: parseInt(e.target.value || '0') })}
                      disabled={!config.maxTurnsEnabled}
                      className="w-28 bg-white/40 text-mg-brown px-3 py-2 rounded border border-mg-cream/20 disabled:opacity-50"
                    />
                    <span className="text-sm text-mg-brown/80">When enabled, game draws at this turn.</span>
                  </div>
                </div>
              </div>
            </details>

            {/* Start Button */}
            <button
              onClick={handleStartGame}
              className="w-full bg-mg-green-1 text-mg-cream text-2xl font-bold py-4 rounded-lg hover:brightness-110 transition transform hover:scale-105"
            >
              Start Game
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameConfig;




