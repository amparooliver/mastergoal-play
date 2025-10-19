import { useContext } from 'react';
import { SoundContext } from '../context/soundContext.js';

export function useSound() {
  const ctx = useContext(SoundContext);
  if (!ctx) throw new Error('useSound must be used within a SoundProvider');
  return ctx;
}
