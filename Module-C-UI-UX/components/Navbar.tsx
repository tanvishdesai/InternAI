'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useAuth } from './AuthProvider';
import { useRouter } from 'next/navigation';

const languages = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'hi', name: 'हिंदी', flag: '🇮🇳' },
  { code: 'ta', name: 'தமிழ்', flag: '🇮🇳' },
  { code: 'bn', name: 'বাংলা', flag: '🇮🇳' },
  { code: 'te', name: 'తెలుగు', flag: '🇮🇳' }
];

export const Navbar: React.FC = () => {
  const { isLoggedIn, logout } = useAuth();
  const router = useRouter();
  const [showLang, setShowLang] = React.useState(false);
  const [selected, setSelected] = React.useState<string>('en');

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = window.localStorage.getItem('language');
      if (stored) setSelected(stored);
    }
  }, []);

  const changeLanguage = (code: string) => {
    setSelected(code);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('language', code);
      window.dispatchEvent(new CustomEvent('languageChange', { detail: code }));
    }
    setShowLang(false);
  };

  return (
    <motion.header
      className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-200"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <div className="px-4 md:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="h-14 md:h-16 flex items-center justify-between">
            <Link href="/" className="group flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl gradient-primary shadow-sm flex items-center justify-center group-hover:shadow-md transition-shadow">
                <span className="text-white font-semibold">AI</span>
              </div>
              <div className="leading-tight">
                <span className="block text-base md:text-lg font-heading font-bold text-slate-900">InternAI</span>
                <span className="block text-[11px] md:text-xs text-slate-600">Your Perfect Matches</span>
              </div>
            </Link>

            <nav className="flex items-center gap-2 md:gap-3 relative">
              <motion.button
                onClick={() => setShowLang(v => !v)}
                className="inline-flex items-center gap-2 px-3 md:px-4 py-2 bg-white/90 text-slate-700 rounded-lg border border-slate-200 shadow-sm hover:bg-white focus-ring"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <span>{languages.find(l => l.code === selected)?.flag}</span>
                <span className="hidden sm:inline">{languages.find(l => l.code === selected)?.name}</span>
              </motion.button>
              <AnimatePresence>
                {showLang && (
                  <motion.div
                    className="absolute right-0 top-12 bg-white border border-slate-200 rounded-xl shadow-lg p-2 w-44 z-50"
                    initial={{ opacity: 0, y: -6, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.98 }}
                  >
                    {languages.map(lang => (
                      <button
                        key={lang.code}
                        onClick={() => changeLanguage(lang.code)}
                        className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-sm text-left text-slate-800 hover:bg-slate-50 transition-colors ${selected === lang.code ? 'bg-slate-100 text-slate-900' : ''}`}
                      >
                        <span>{lang.flag}</span>
                        <span className="font-medium">{lang.name}</span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
              <button
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    try { sessionStorage.setItem('newSearch', '1'); } catch {}
                    window.location.href = '/?new=1';
                  } else {
                    router.push('/?new=1');
                    router.refresh();
                  }
                }}
                className="hidden sm:inline-flex px-3 md:px-4 py-2 bg-slate-100 text-slate-800 rounded-lg border border-slate-200 hover:bg-slate-200 transition-colors focus-ring"
              >
                New Search
              </button>
              {isLoggedIn && (
                <motion.button
                  onClick={async () => {
                    await logout();
                    if (typeof window !== 'undefined') {
                      window.location.href = '/';
                    } else {
                      router.replace('/');
                      router.refresh();
                    }
                  }}
                  className="px-3 md:px-4 py-2 bg-red-600 text-white rounded-lg shadow-sm hover:bg-red-700 transition-colors focus-ring"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Logout
                </motion.button>
              )}
            </nav>
          </div>
        </div>
      </div>
    </motion.header>
  );
};

export default Navbar;


