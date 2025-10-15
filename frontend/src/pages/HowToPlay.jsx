import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import ChipIcon from '../components/ChipIcon.jsx';

const MiniBoard = () => {
  const rows = 5;
  const cols = 7;
  const players = [
    { team: 'LEFT', r: 2, c: 1, gk: false },
    { team: 'RIGHT', r: 2, c: 5, gk: false },
  ];
  const ball = { r: 2, c: 3 };

  const sessionConfig = (() => {
    try {
      const saved = sessionStorage.getItem('gameSession');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  })();
  const TEAM_COLORS = sessionConfig?.chipColors || {
    LEFT: '#E6DCB7',
    RIGHT: '#F18F01',
  };

  return (
    <div className="inline-block max-w-full rounded-xl overflow-hidden border border-mg-cream/10 shadow">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex">
          {Array.from({ length: cols }).map((_, c) => {
            const isDark = (r + c) % 2 === 0;
            const player = players.find(p => p.r === r && p.c === c);
            const hasBall = ball.r === r && ball.c === c;
            const isGoalLeft = r === 0 && c >= 2 && c <= 4;
            const isGoalRight = r === rows - 1 && c >= 2 && c <= 4;
            const base = isGoalLeft
              ? 'bg-mg-green-3'
              : isGoalRight
              ? 'bg-mg-green-2'
              : isDark
              ? 'bg-mg-green-2'
              : 'bg-mg-green-3';
            return (
              <div
                key={`${r}-${c}`}
                className={`w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 border border-mg-green-1 relative ${base}`}
                title={`(${r}, ${c})`}
              >
                {player && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none w-3/4 h-3/4 mx-auto my-auto">
                    <ChipIcon color={TEAM_COLORS[player.team]} width="100%" height="100%" />
                  </div>
                )}
                {hasBall && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <img src="/assets/bw-ball.svg" alt="ball" className="w-1/2 h-1/2 drop-shadow" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
};

const HowToPlay = () => {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const embedded = ['1', 'true', 'yes'].includes((params.get('embed') || params.get('embedded') || '').toLowerCase());
  // Tabs (capítulos) estáticos en español
  const tabs = ["Básicos", "Movimiento", "Pase", "Casillas", "Anotar"];

  // Contenido por tab: página izquierda y derecha
  const CONTENT = {
    "Básicos": {
      leftTitle: "Objetivo del Juego",
      leftText: (
        <>
          Mastergoal es un juego de fútbol trasladado a un tablero.
          Dos equipos compiten con el objetivo de meter la pelota en el arco rival.
        </>
      ),
      leftImage: <img src="/assets/mod3osc.png" alt="tablero" className="w-full h-full object-contain" />,
      rightTitle: "Comienzo del Partido",
      rightItems: [
        "Las cantidad de fichas dependen de la modalidad de juego: 1v1, 2v2 o 5v5.",
        "La pelota se ubica en el centro.",
        "El equipo ubicado a la izquierda (o arriba, si el tablero está en modo vertical) comienza la partida.",
        "Gana el equipo que anote dos goles primero.",
      ],
      rightImage: (
        <img
          src="/assets/casillasespeciales.png"
          alt="casillas especiales"
          className="w-full md:w-4/5 lg:w-3/4 h-auto mx-auto object-contain mt-3"
        />
      ),
    },
    "Movimiento": {
      leftTitle: "Jugador",
      leftText: (
        <>
          • Se mueve en cualquier dirección (adelante, atrás, diagonal o lateral).
          <br />
          • Hasta 2 casillas por turno, siempre en línea recta.
        </>
      ),
      leftImage: <img src="/assets/jugador.png" alt="movimientos jugador" className="w-full h-full object-contain" />,
      rightTitle: "Arquero",
      rightItems: [
        "Se mueve igual que un jugador.",
        "Posee “brazos” laterales que bloquean el paso de la pelota o de otros jugadores.",
        "Las casillas adyacentes a sus brazos le pertenecen y no pueden ser ocupadas por jugadores rivales.",
      ],
      rightImage: (
        <img
          src="/assets/arquero.png"
          alt="arquero"
          className="w-3/4 md:w-1/2 lg:w-2/5 h-auto mx-auto object-contain mt-3"
        />
      ),
    },
    "Pase": {
      leftTitle: "La Pelota",
      leftText: (
        <>
          • La pelota nunca se mueve sola: debe ser impulsada por un jugador o arquero.
          <br />
          • Se mueve en línea recta hasta 4 casillas (1–4) en cualquier dirección.
          <br />
          • Solo puede “saltar” jugadores o arquero si están dentro del área chica.
          <br />
          • Dentro de su área, el arquero tiene prioridad sobre la pelota.
        </>
      ),
      leftImage: <img src="/assets/pelotaa.png" alt="movimientos pelota" className="w-full h-full object-contain" />,
      rightTitle: "Pases",
      rightItems: [
        "En cada turno debe moverse al menos un jugador o la pelota.",
        "La pelota puede moverse hasta 4 veces por turno (pases entre jugadores).",
        "No es obligatorio usar los 4 movimientos.",
        "Los pases solo pueden hacerse entre jugadores del mismo equipo adyacentes a la pelota.",
        "No se permiten autopases (el mismo jugador no puede empujar y recibir la pelota).",
      ],
      rightImage: (
        <img
          src="/assets/pases.png"
          alt="pases"
          className="w-full md:w-4/5 lg:w-3/4 h-auto mx-auto object-contain mt-3"
        />
      ),
    },
    "Casillas": {
      leftTitle: "Casillas Neutras",
      leftText: (
        <>
          • La pelota no se puede mover ya que no pertenecen a ningún equipo.
          <br />
          • Cuando un equipo tiene mayoría de jugadores junto a la pelota, deja de ser neutra y la pelota pasa a su control.
        </>
      ),
      leftImage: <img src="/assets/casillaneutra.png" alt="casillas neutras" className="w-full h-full object-contain" />,
      rightTitle: "Casillas Especiales",
      rightItems: [
        "Son las marcadas con puntos blancos en la línea de fondo contraria.",
        "Si un jugador coloca la pelota allí, obtiene un turno adicional.",
        "Las casillas de corner propias no pueden ser ocupadas por la pelota.",
      ],
    },
    "Anotar": {
      leftTitle: "Gol",
      leftText: (
        <>
          • Se produce cuando la pelota entra en una casilla del arco.
          <br />
          • Puede hacerlo en movimiento recto o diagonal.
          <br />
          • Después del gol, todas las fichas vuelven a su posición inicial.
          <br />
          • El equipo que recibió el gol inicia el siguiente turno.
        </>
      ),
      leftImage: <img src="/assets/ScoreGoal.png" alt="gol" className="w-full h-full object-contain" />,
      rightTitle: "Reinicio",
      rightItems: [
        "Tras un gol, se recolocan todas las fichas y la pelota vuelve al centro del tablero.",
        "El equipo que recibió el gol comienza el siguiente turno.",
      ],
    },
  };

  const [active, setActive] = useState(tabs[0]);
  const current = CONTENT[active] || CONTENT[tabs[0]];

  return (
    <div className="min-h-screen bg-mg-green-1 py-10 md:py-16 overflow-x-hidden">
      <div className="container mx-auto px-4 md:px-6">
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-4xl md:text-5xl font-extrabold text-mg-sand text-center"
        >
          Libro de Reglas
        </motion.h1>

        <div className="mt-8 md:mt-12 relative flex justify-center">
          <div className="relative w-full max-w-4xl">
            <div className="absolute -inset-2 md:-inset-3 bg-black/20 rounded-3xl"></div>
            <div className="relative bg-mg-brown rounded-3xl p-3 md:p-5">
              <div className="absolute right-10 -top-1 h-10 w-4 bg-red-600 rounded-b-sm md:right-16" />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-5">
                <div className="rounded-2xl bg-[#F6F1DE] text-mg-brown p-6 md:p-8 min-h-[420px] flex flex-col">
                  <div className="text-sm font-semibold uppercase tracking-wide text-mg-green-3">Objetivo: ¡Anotar goles para ganar!</div>
                  <div className="mt-3 text-3xl md:text-4xl font-extrabold text-mg-green-3">{current.leftTitle}</div>
                  <p className="mt-3 text-mg-brown/80 leading-relaxed text-sm">{current.leftText}</p>

                  <div className="mt-6 flex-1 flex items-center justify-center">
                    <div className="w-full">
                      {current.leftImage}
                    </div>
                  </div>
                </div>

                <div className="relative rounded-2xl bg-[#F6F1DE] text-mg-brown p-6 md:p-8 min-h-[420px] overflow-y-auto">
                  <div className="mt-3 text-3xl md:text-4xl font-extrabold text-mg-green-3">{current.rightTitle}</div>
                  {Array.isArray(current.rightItems) ? (
                    <ul className="text-sm text-mg-brown/85 leading-relaxed list-disc list-inside space-y-2">
                      {current.rightItems.map((it, i) => (
                        <React.Fragment key={i}>
                          <li>{it}</li>
                          {current.rightTitle === 'Casillas Especiales' &&
                            typeof it === 'string' &&
                            it.trim() === 'Las casillas de corner propias no pueden ser ocupadas por la pelota.' &&
                            current.rightImage && (
                              <div className="mt-4 -mx-2 md:-mx-4">
                                {current.rightImage}
                              </div>
                            )}
                        </React.Fragment>
                      ))}
                    </ul>
                  ) : null}
                </div>
              </div>

              <div className="hidden md:flex flex-col gap-2 absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2">
                {tabs.map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActive(tab)}
                    className={`px-3 py-3 rounded-r-xl shadow font-semibold text-sm transition-all ${
                      active === tab ? 'bg-mg-orange text-mg-brown' : 'bg-mg-green-2 text-mg-cream/90 hover:brightness-110'
                    }`}
                    aria-pressed={active === tab}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="md:hidden mt-6 flex items-center justify-center gap-2 flex-wrap">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActive(tab)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
                active === tab ? 'bg-mg-cream text-mg-brown' : 'bg-white/10 text-mg-cream border border-white/20'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {!embedded && (
          <div className="mt-10 text-center">
            <a href="/config" className="inline-flex items-center justify-center rounded-xl bg-mg-cream text-green-900 font-semibold px-8 py-3 shadow hover:bg-yellow-300 transition">
              Configurar Partida
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default HowToPlay;
