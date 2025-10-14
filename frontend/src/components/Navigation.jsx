// src/components/Navigation.jsx
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useI18n } from '../context/i18n2';

const Navigation = () => {
  const location = useLocation();
  const isInGame = location.pathname === '/game';
  const { lang, setLang, t } = useI18n();
  const [open, setOpen] = useState(false);

  if (isInGame) return null;
  
  return (
    <nav className="bg-mg-brown shadow-lg sticky top-0 z-50 overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
        <div className="flex justify-between h-16 md:h-20">
          {/* Brand */}
          <div className="flex items-center">
            <Link to="/" className="text-2xl font-bold text-mg-cream hover:text-mg-sand transition" onClick={() => setOpen(false)}>
              Mastergoal
            </Link>
          </div>

          {/* Desktop menu */}
          <div className="hidden md:flex items-center space-x-6">
            <Link to="/how-to-play" className="text-mg-cream hover:text-mg-sand transition">
              {t('howToPlay')}
            </Link>
            <Link to="/about" className="text-mg-cream hover:text-mg-sand transition">
              {t('about')}
            </Link>
            <Link to="/config" className="bg-mg-sand text-mg-brown px-4 py-2 rounded-lg font-semibold hover:brightness-110 transition">
              {t('playNow')}
            </Link>
            <button
              aria-label="language"
              onClick={() => setLang(lang === 'en' ? 'es' : 'en')}
              className="px-3 py-1 rounded border border-mg-cream/30 text-mg-cream hover:bg-white/10"
            >
              {lang.toUpperCase()}
            </button>
          </div>

          {/* Mobile toggle */}
          <div className="flex items-center md:hidden">
            <button
              aria-label="Toggle menu"
              onClick={() => setOpen(o => !o)}
              className="p-2 rounded hover:bg-white/10 text-mg-cream focus:outline-none"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile panel */}
      {open && (
        <div className="md:hidden bg-mg-brown/95 border-t border-white/10">
          <div className="max-w-7xl mx-auto px-4 py-3 space-y-2">
            <Link to="/how-to-play" onClick={() => setOpen(false)} className="block text-mg-cream py-2">{t('howToPlay')}</Link>
            <Link to="/about" onClick={() => setOpen(false)} className="block text-mg-cream py-2">{t('about')}</Link>
            <Link to="/config" onClick={() => setOpen(false)} className="inline-flex items-center justify-center rounded-lg bg-mg-sand text-mg-brown font-semibold px-4 py-2">{t('playNow')}</Link>
            <div>
              <button
                aria-label="language"
                onClick={() => setLang(lang === 'en' ? 'es' : 'en')}
                className="mt-2 px-3 py-1 rounded border border-mg-cream/30 text-mg-cream hover:bg-white/10"
              >
                {lang.toUpperCase()}
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navigation;
