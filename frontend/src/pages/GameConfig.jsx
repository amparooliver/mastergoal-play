import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useI18n } from '../context/i18n2';

const CHIP_COLORS = ['#F5EFD5', '#F18F01', '#A40606', '#202C59', '#120F0F'];

const GameConfig = ({ onStartGame }) => {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [config, setConfig] = useState({
    level: 1,
    difficulty: 'medium',
    playerColor: 'LEFT',
    mode: 'pve', // 'pve' or 'pvp'
    timerEnabled: false,
    timerSeconds: 15,
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
        timerMinutes: Math.ceil((config.timerSeconds || 0) / 60),
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
          timerSeconds: config.timerSeconds,
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

  // Handler for player chip color selection
  const handlePlayerChipColorChange = (color) => {
    const newConfig = { ...config, chipColor: color };
    // If opponent has the same color, auto-select a different one
    if (config.opponentChipColor === color) {
      const availableColor = CHIP_COLORS.find(c => c !== color);
      if (availableColor) {
        newConfig.opponentChipColor = availableColor;
      }
    }
    setConfig(newConfig);
  };

  // Handler for opponent chip color selection
  const handleOpponentChipColorChange = (color) => {
    const newConfig = { ...config, opponentChipColor: color };
    // If player has the same color, auto-select a different one
    if (config.chipColor === color) {
      const availableColor = CHIP_COLORS.find(c => c !== color);
      if (availableColor) {
        newConfig.chipColor = availableColor;
      }
    }
    setConfig(newConfig);
  };

  return (
    <div className="min-h-screen bg-mg-green-1 py-8">
      <div className="container mx-auto px-3">
        <div className="max-w-lg mx-auto">
          <h1 className="text-3xl font-extrabold text-mg-cream mb-4 text-center whitespace-nowrap">
            {t('gameConfiguration')}
          </h1>

          <div className="bg-mg-cream text-mg-brown rounded-2xl p-5 border border-mg-cream/30 shadow-md">
            {/* Mode Selection */}
            <div className="mb-5">
              <label className="text-mg-brown text-lg font-bold mb-2 block">{t('mode')}</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setConfig({ ...config, mode: 'pve' })}
                  className={`flex items-start gap-2.5 p-3 rounded-xl border transition shadow-sm select-none ${
                    config.mode === 'pve'
                      ? 'bg-mg-green-1 text-mg-cream border-mg-green-1'
                      : 'bg-white/50 text-mg-brown/90 hover:bg-white/70 border-mg-sage'
                  }`}
                >
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-black/10">
                    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor" aria-hidden>
                      <path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm-7 8a7 7 0 0 1 14 0Z" />
                    </svg>
                  </span>
                  <span className="flex flex-col leading-tight w-min">
                    <span className="text-xs font-extrabold tracking-wide uppercase whitespace-nowrap">{t('onePlayerShort')}</span>
                    <span className={`text-[10px] ${config.mode==='pve' ? 'text-mg-cream/90' : 'text-mg-brown/60'}`}>{t('vsAI')}</span>
                  </span>
                </button>
                <button
                  onClick={() => setConfig({ ...config, mode: 'pvp' })}
                  className={`flex items-start gap-2.5 p-3 rounded-xl border transition shadow-sm select-none ${
                    config.mode === 'pvp'
                      ? 'bg-mg-green-1 text-mg-cream border-mg-green-1'
                      : 'bg-white/50 text-mg-brown/90 hover:bg-white/70 border-mg-green-1/20'
                  }`}
                >
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-black/10">
                    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor" aria-hidden>
                      <path d="M8 10a3 3 0 1 0-3-3 3 3 0 0 0 3 3Zm11-3a3 3 0 1 1-3 3 3 3 0 0 1 3-3ZM2 20a6 6 0 0 1 12 0Zm12 0a6 6 0 0 1 12 0Z" />
                    </svg>
                  </span>
                  <span className="flex flex-col leading-tight">
                    <span className="text-xs font-extrabold tracking-wide uppercase">{t('twoPlayersShort')}</span>
                    <span className={`text-[10px] ${config.mode==='pvp' ? 'text-mg-cream/90' : 'text-mg-brown/60'}`}>{t('sameDevice')}</span>
                  </span>
                </button>
              </div>
            </div>

            {/* Level Selection */}
            <div className="mb-5">
              <label className="text-mg-brown text-lg font-bold mb-2 block">{t('gameLevel')}</label>
              <div className="flex items-center gap-2.5 justify-center">
                {[1, 2, 3].map(level => (
                  <button
                    key={level}
                    onClick={() => setConfig({ ...config, level })}
                    aria-label={`Level ${level}`}
                    className={`w-10 h-10 rounded-full border border-2 flex items-center justify-center text-xs font-bold transition select-none ${
                      config.level === level
                        ? 'bg-mg-green-1 text-mg-cream border-mg-green-1'
                        : 'bg-transparent text-mg-brown border-mg-sage hover:bg-mg-green-1/10'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            {/* Difficulty Selection */}
            <div className="mb-5">
              <label className="text-mg-brown text-lg font-bold mb-2 block">{t('difficulty')}</label>
              <div className="flex items-center gap-4 justify-center">
                {['easy', 'medium', 'hard'].map(diff => (
                  <button
                    key={diff}
                    onClick={() => setConfig({ ...config, difficulty: diff })}
                    className={`text-base capitalize tracking-wide transition select-none ${
                      config.difficulty === diff
                        ? 'text-mg-green-1 font-extrabold'
                        : 'text-mg-brown/50 font-bold hover:text-mg-brown/80'
                      }`}
                    >
                      {t(diff)}
                    </button>
                  ))}
                </div>
              </div>

            {/* Team Side Selection */}
            <div className="mb-5">
              <label className="text-mg-brown text-lg font-bold mb-2 block">{t('yourTeam')}</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setConfig({ ...config, playerColor: 'LEFT' })}
                  className={`p-3 rounded-xl border transition shadow-sm text-left select-none ${
                    config.playerColor === 'LEFT'
                      ? 'bg-mg-green-1 text-mg-cream border-mg-green-1'
                      : 'bg-white/50 text-mg-brown/90 hover:bg-white/70 border-mg-green-1/20'
                  }`}
                >
                  <div className="text-xs font-extrabold uppercase tracking-wide">{t('left')}</div>
                  <div className={`text-[10px] ${config.playerColor==='LEFT' ? 'text-mg-cream/90' : 'text-mg-brown/60'}`}>{t('youStart')}</div>
                </button>
                <button
                  onClick={() => setConfig({ ...config, playerColor: 'RIGHT' })}
                  className={`p-3 rounded-xl border transition shadow-sm text-left select-none ${
                    config.playerColor === 'RIGHT'
                      ? 'bg-mg-green-1 text-mg-cream border-mg-green-1'
                      : 'bg-white/50 text-mg-brown/90 hover:bg-white/70 border-mg-green-1/20'
                  }`}
                >
                  <div className="text-xs font-extrabold uppercase tracking-wide">{t('right')}</div>
                  <div className={`text-[10px] ${config.playerColor==='RIGHT' ? 'text-mg-cream/90' : 'text-mg-brown/60'}`}>{config.mode === 'pvp' ? t('player2') : t('aiStarts')}</div>
                </button>
              </div>
            </div>

            {/* Chip color selection */}
            <div className="mb-5">
              <label className="text-mg-brown text-lg font-bold mb-2 block">{t('teamColors')}</label>
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <div className="text-xs font-semibold mb-2">{t('you')}</div>
                  <div className="flex flex-wrap gap-2.5">
                    {CHIP_COLORS.map((color) => {
                      const isDisabled = color === config.opponentChipColor;
                      return (
                        <button
                          key={color}
                          onClick={() => !isDisabled && handlePlayerChipColorChange(color)}
                          style={{ backgroundColor: color }}
                          className={`w-6 h-6 rounded-full border-2 transition shadow-sm ${
                            config.chipColor === color 
                              ? 'border-mg-sand ring-2 ring-mg-sand'
                              : isDisabled
                              ? 'border-white/30 opacity-30 cursor-not-allowed'
                              : 'border-white/30 hover:border-mg-sand/50 cursor-pointer'
                          }`}
                          title={isDisabled ? t('colorSelectedByOpponent') : color}
                          disabled={isDisabled}
                        />
                      );
                    })}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-semibold mb-2">{config.mode === 'pvp' ? t('player2') : t('ai')}</div>
                  <div className="flex flex-wrap gap-2.5">
                    {CHIP_COLORS.map((color) => {
                      const isDisabled = color === config.chipColor;
                      return (
                        <button
                          key={color}
                          onClick={() => !isDisabled && handleOpponentChipColorChange(color)}
                          style={{ backgroundColor: color }}
                          className={`w-6 h-6 rounded-full border-2 transition shadow-sm ${
                            config.opponentChipColor === color 
                              ? 'border-mg-sand ring-2 ring-mg-sand' 
                              : isDisabled
                              ? 'border-white/30 opacity-30 cursor-not-allowed'
                              : 'border-white/30 hover:border-mg-sand/50 cursor-pointer'
                          }`}
                          title={isDisabled ? t('colorSelectedByPlayer') : color}
                          disabled={isDisabled}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Advanced Configurations */}
            <details className="mb-5">
              <summary className="cursor-pointer text-mg-brown/80 text-xs font-bold underline underline-offset-4 hover:text-mg-brown">{t('advancedConfigurations')}</summary>
              <div className="mt-3 space-y-4">
                {/* Timer Option */}
                <div>
                  <label className="text-mg-brown text-base font-bold mb-2 block">{t('turnTimer')}</label>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => setConfig({ ...config, timerEnabled: !config.timerEnabled })}
                      className={`w-14 h-7 rounded-full border border-mg-green-1/20 transition ${config.timerEnabled ? 'bg-mg-green-1' : 'bg-white/50'}`}
                    >
                      <div className={`w-6 h-6 bg-white rounded-full transition transform ${config.timerEnabled ? 'translate-x-7' : 'translate-x-0.5'}`}></div>
                    </button>
                    <span className="text-mg-brown text-sm">{config.timerEnabled ? t('enabled') : t('disabled')}</span>
                    {config.timerEnabled && (
                      <select
                        value={config.timerSeconds}
                        onChange={(e) => setConfig({ ...config, timerSeconds: parseInt(e.target.value) })}
                        className="bg-white/50 text-mg-brown px-2.5 py-1 rounded-md border border-mg-green-1/20 text-sm"
                      >
                        {[10,15,20,30,45,60].map(s => (
                          <option key={s} value={s}>{s} {t('seconds')}</option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>

                {/* Max Turns */}
                <div>
                  <label className="text-mg-brown text-base font-bold mb-2 block">{t('maxTurns')}</label>
                  <div className="flex items-center gap-2.5">
                    <button
                      onClick={() => setConfig({ ...config, maxTurnsEnabled: !config.maxTurnsEnabled })}
                      className={`w-14 h-7 rounded-full border border-mg-green-1/20 transition ${config.maxTurnsEnabled ? 'bg-mg-green-1' : 'bg-white/50'}`}
                    >
                      <div className={`w-6 h-6 bg-white rounded-full transition transform ${config.maxTurnsEnabled ? 'translate-x-7' : 'translate-x-0.5'}`}></div>
                    </button>
                    <input
                      type="number"
                      min={10}
                      max={300}
                      step={5}
                      value={config.maxTurns}
                      onChange={(e) => setConfig({ ...config, maxTurns: parseInt(e.target.value || '0') })}
                      disabled={!config.maxTurnsEnabled}
                      className="w-24 bg-white/50 text-mg-brown px-2.5 py-1.5 rounded-md border border-mg-green-1/20 disabled:opacity-50 text-sm"
                    />
                    <span className="text-xs text-mg-brown/80">{t('maxTurnsHint')}</span>
                  </div>
                </div>
              </div>
            </details>

            {/* Start Button */}
            <button
              onClick={handleStartGame}
              className="w-full bg-mg-green-1 text-mg-cream text-lg font-extrabold py-3 rounded-xl tracking-wider uppercase shadow-md hover:brightness-110 transition"
            >
              {t('start')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameConfig;
