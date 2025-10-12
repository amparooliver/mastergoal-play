// src/components/Navigation.jsx
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useI18n } from '../context/i18n';

const Navigation = () => {
  const location = useLocation();
  const isInGame = location.pathname === '/game';
  const { lang, setLang, t } = useI18n();

  if (isInGame) return null;
  
  return (
    <nav className="bg-mg-brown shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="text-2xl font-bold text-mg-cream hover:text-mg-sand transition">
               Mastergoal
            </Link>
          </div>
          <div className="flex items-center space-x-8">
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
              className="ml-4 px-3 py-1 rounded border border-mg-cream/30 text-mg-cream hover:bg-white/10"
            >
              {lang.toUpperCase()}
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;


