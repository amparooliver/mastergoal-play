import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const LanguageContext = createContext({ lang: 'en', t: (k) => k, setLang: () => {} });

const DICT = {
  en: {
    playNow: 'Play Now',
    howToPlay: 'How to Play',
    about: 'About',
    gameSettings: 'Game Settings',
    gameConfiguration: 'Game Configuration',
    mode: 'Mode',
    onePlayer: '1 Player (vs AI)',
    twoPlayers: '2 Players (same device)',
    level: 'Level',
    teamColors: 'Team Colors',
    you: 'You',
    ai: 'AI',
    start: 'Start',
    advancedConfigurations: 'Advanced Configurations',
    yourTeam: 'Your Team',
    leftYouStart: 'Left (You start)',
    rightAIStarts: 'Right (AI starts)',
    timer: 'Timer',
    optional: '(Optional)',
    enabled: 'Enabled',
    disabled: 'Disabled',
    minutes: 'minutes',
    turn: 'Turn',
    homeConfirmTitle: 'Leave Game?',
    homeConfirmText: "You're about to leave the game. Are you sure?",
    cancel: 'Cancel',
    leave: 'Leave',
    save: 'Save',
    close: 'Close',
    helpTitle: 'Help',
    helpText: 'Select a chip or the ball; click highlighted cells to move or kick. Forced kicks apply when adjacent and ball is not neutral.',
    configTitle: 'Game Settings',
  },
  es: {
    playNow: 'Jugar Ahora',
    howToPlay: 'Cómo Jugar',
    about: 'Acerca de',
    gameSettings: 'Configuración del Juego',
    gameConfiguration: 'Configuración del Juego',
    mode: 'Modo',
    onePlayer: '1 Jugador (vs IA)',
    twoPlayers: '2 Jugadores (mismo dispositivo)',
    level: 'Nivel',
    teamColors: 'Colores del Equipo',
    you: 'Tú',
    ai: 'IA',
    start: 'Comenzar',
    advancedConfigurations: 'Configuraciones Avanzadas',
    yourTeam: 'Tu Equipo',
    leftYouStart: 'Izquierda (Tú empiezas)',
    rightAIStarts: 'Derecha (IA empieza)',
    timer: 'Temporizador',
    optional: '(Opcional)',
    enabled: 'Activado',
    disabled: 'Desactivado',
    minutes: 'minutos',
    turn: 'Turno',
    homeConfirmTitle: '¿Salir del Juego?',
    homeConfirmText: 'Estás a punto de salir del juego. ¿Estás seguro?',
    cancel: 'Cancelar',
    leave: 'Salir',
    save: 'Guardar',
    close: 'Cerrar',
    helpTitle: 'Ayuda',
    helpText: 'Selecciona una ficha o la pelota; haz clic en las casillas resaltadas para mover o patear. Hay pateo forzado cuando estás adyacente y la pelota no es neutral.',
    configTitle: 'Configuración del Juego',
  }
};

export const LanguageProvider = ({ children }) => {
  const [lang, setLang] = useState(() => localStorage.getItem('lang') || 'en');
  useEffect(() => { try { localStorage.setItem('lang', lang); } catch {} }, [lang]);
  const t = useMemo(() => (key) => (DICT[lang] && DICT[lang][key]) || key, [lang]);
  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useI18n = () => useContext(LanguageContext);

