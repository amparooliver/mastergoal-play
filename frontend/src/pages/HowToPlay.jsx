import React, { useState } from 'react';
import { motion } from 'framer-motion';
import ChipIcon from '../components/ChipIcon.jsx';
import { useI18n } from '../context/i18n2';

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
  const { t } = useI18n();

  const sections = [
    {
      key: 'basics',
      label: t('ruleBasicsLabel'),
      title: t('ruleBasicsTitle'),
      lead: t('ruleBasicsLead'),
      items: t('ruleBasicsItems'),
      imageSlot: (<img src="/assets/mod2osc.png" alt="diagram" className="w-full h-full object-contain" />),
    },
    {
      key: 'movement',
      label: t('ruleMoveLabel'),
      title: t('ruleMoveTitle'),
      lead: t('ruleMoveLead'),
      items: t('ruleMoveItems'),
      imageSlot: (<img src="/assets/MovValidosOscuro.png" alt="movement" className="w-3/4 h-auto mx-auto object-contain" />),
    },
    {
      key: 'kick',
      label: t('ruleKickLabel'),
      title: t('ruleKickTitle'),
      lead: t('ruleKickLead'),
      items: t('ruleKickItems'),
      imageSlot: (<MiniBoard />),
    },
    {
      key: 'score',
      label: t('ruleScoreLabel'),
      title: t('ruleScoreTitle'),
      lead: t('ruleScoreLead'),
      items: t('ruleScoreItems'),
      imageSlot: (<img src="/assets/mod3osc.png" alt="scoring" className="w-full h-auto mx-auto object-contain" />),
    },
  ];

  const [active, setActive] = useState(sections[0].key);
  const current = sections.find(s => s.key === active) || sections[0];

  return (
    <div className="min-h-screen bg-mg-green-1 py-10 md:py-16 overflow-x-hidden">
      <div className="container mx-auto px-4 md:px-6">
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-4xl md:text-5xl font-extrabold text-mg-sand text-center"
        >
          {t('ruleBook')}
        </motion.h1>

        <div className="mt-8 md:mt-12 relative flex justify-center">
          <div className="relative w-full max-w-4xl">
            <div className="absolute -inset-2 md:-inset-3 bg-black/20 rounded-3xl"></div>
            <div className="relative bg-mg-brown rounded-3xl p-3 md:p-5">
              <div className="absolute right-10 -top-1 h-10 w-4 bg-red-600 rounded-b-sm md:right-16" />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-5">
                <div className="rounded-2xl bg-[#F6F1DE] text-mg-brown p-6 md:p-8 min-h-[420px] flex flex-col">
                  <div className="text-sm font-semibold uppercase tracking-wide text-mg-green-3">{t('ruleObjectiveBanner')}</div>
                  <div className="mt-3 text-3xl md:text-4xl font-extrabold text-mg-green-3">{current.title}</div>
                  <p className="mt-3 text-mg-brown/80 leading-relaxed text-sm">{current.lead}</p>

                  <div className="mt-6 flex-1 flex items-center justify-center">
                    <div className="w-full">
                      {current.imageSlot}
                    </div>
                  </div>
                </div>

                <div className="relative rounded-2xl bg-[#F6F1DE] text-mg-brown p-6 md:p-8 min-h-[420px] overflow-y-auto">
                  <div className="text-2xl font-bold text-mg-green-3 mb-4">{t('ruleDetails')}</div>
                  {Array.isArray(current.items) ? (
                    <ul className="text-sm text-mg-brown/85 leading-relaxed list-disc list-inside space-y-2">
                      {current.items.map((it, i) => (
                        <li key={i}>{it}</li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              </div>

              <div className="hidden md:flex flex-col gap-2 absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2">
                {sections.map(s => (
                  <button
                    key={s.key}
                    onClick={() => setActive(s.key)}
                    className={`px-3 py-3 rounded-r-xl shadow font-semibold text-sm transition-all ${
                      active === s.key ? 'bg-mg-orange text-mg-brown' : 'bg-mg-green-2 text-mg-cream/90 hover:brightness-110'
                    }`}
                    aria-pressed={active === s.key}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="md:hidden mt-6 flex items-center justify-center gap-2 flex-wrap">
          {sections.map(s => (
            <button
              key={s.key}
              onClick={() => setActive(s.key)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
                active === s.key ? 'bg-mg-cream text-mg-brown' : 'bg-white/10 text-mg-cream border border-white/20'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        <div className="mt-10 text-center">
          <a href="/config" className="inline-flex items-center justify-center rounded-xl bg-mg-cream text-green-900 font-semibold px-8 py-3 shadow hover:bg-yellow-300 transition">
            {t('configureMatch')}
          </a>
        </div>
      </div>
    </div>
  );
};

export default HowToPlay;

