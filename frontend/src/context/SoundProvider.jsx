import React, { useEffect, useMemo, useState } from 'react';
import { SoundContext } from './soundContext.js';

const SFX_MAP = {
  onMove: '/assets/onMove.mp3',
  onSideToolClick: '/assets/onSideToolClick.ogg',
  onUserGoal: '/assets/onUserGoal.ogg',
  onUserWin: '/assets/onUserWin.wav',
  onAIGoal: '/assets/onAIGoal.mp3',
  onAIWin: '/assets/onAIWin.mp3',
  onDraw: '/assets/onDraw.mp3',
  onError: '/assets/onError.ogg',
};

export function SoundProvider({ children }) {
  const [soundEnabled, setSoundEnabled] = useState(() => {
    try {
      const saved = localStorage.getItem('soundEnabled');
      return saved === null ? true : saved === 'true';
    } catch {
      return true;
    }
  });

  const [hapticsEnabled, setHapticsEnabled] = useState(() => {
    try {
      const saved = localStorage.getItem('hapticsEnabled');
      return saved === null ? true : saved === 'true';
    } catch {
      return true;
    }
  });

  // Track active audio elements to be able to stop them
  const activeAudioRef = React.useRef([]);

  useEffect(() => {
    try { localStorage.setItem('soundEnabled', String(soundEnabled)); } catch {}
  }, [soundEnabled]);

  useEffect(() => {
    try { localStorage.setItem('hapticsEnabled', String(hapticsEnabled)); } catch {}
  }, [hapticsEnabled]);

  const toggleSound = () => setSoundEnabled((v) => !v);
  const toggleHaptics = () => setHapticsEnabled((v) => !v);

  const playSfx = (name) => {
    try {
      if (!soundEnabled) return;
      const url = SFX_MAP[name];
      if (!url) return;
      const audio = new Audio(url);
      audio.volume = 1.0;

      // Track audio element
      activeAudioRef.current.push(audio);

      // Remove from tracking when ended
      audio.addEventListener('ended', () => {
        const index = activeAudioRef.current.indexOf(audio);
        if (index > -1) activeAudioRef.current.splice(index, 1);
      });

      audio.play().catch(() => {});
    } catch {}
  };

  const stopAllSounds = () => {
    try {
      // Stop and remove all active audio elements
      activeAudioRef.current.forEach(audio => {
        try {
          audio.pause();
          audio.currentTime = 0;
        } catch {}
      });
      activeAudioRef.current = [];
    } catch {}
  };

  const vibrate = (pattern = 30) => {
    try {
      if (!hapticsEnabled) return;
      if (navigator?.vibrate) navigator.vibrate(pattern);
    } catch {}
  };

  const value = useMemo(() => ({
    soundEnabled,
    hapticsEnabled,
    toggleSound,
    toggleHaptics,
    playSfx,
    stopAllSounds,
    vibrate,
  }), [soundEnabled, hapticsEnabled]);

  return (
    <SoundContext.Provider value={value}>{children}</SoundContext.Provider>
  );
}
