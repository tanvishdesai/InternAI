'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { useTranslation } from '../utils/i18n';
import { useAccessibility } from './AccessibilityProvider';

interface Internship {
  id: string;
  title: string;
  company: string;
  location: string;
  type: 'remote' | 'onsite' | 'hybrid';
  salary?: string;
  skills: string[];
  description: string;
  logo?: string;
  matchScore: number;
  applicationDeadline?: string;
  duration: string;
  explanations?: string[];
  contributors?: { name: string; percentage: number }[];
}

interface RecommendationCardsProps {
  recommendations: Internship[];
  onLike?: (internship: Internship) => void;
  onPass?: (internship: Internship) => void;
  onApply?: (internship: Internship) => void;
  onSave?: (internship: Internship) => void;
  language?: string;
}

export const RecommendationCards: React.FC<RecommendationCardsProps> = ({
  recommendations,
  onLike,
  onPass,
  onApply,
  language = 'en'
}) => {
  const [index, setIndex] = useState(0);
  const [leaving, setLeaving] = useState<'left' | 'right' | null>(null);
  const { t } = useTranslation(language);
  const { reducedMotion } = useAccessibility();

  const currentCard = recommendations[index];
  const nextCard1 = recommendations[index + 1];


  if (!currentCard) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <motion.div
            className="text-6xl mb-4"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            🎉
          </motion.div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            {t('noMoreRecommendations')}
          </h3>
          <p className="text-gray-600">
            {t('checkBackLater')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full max-w-md mx-auto h-[600px] select-none pb-28 md:pb-20">
      {/* Progress Indicator */}
      <div className="mb-4 px-4">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>{Math.min(index + 1, recommendations.length)} of {recommendations.length}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <motion.div
            className="h-full gradient-primary rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${((Math.min(index + 1, recommendations.length)) / recommendations.length) * 100}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      {/* Cards Stack */}
      <div className="relative h-full">
        {nextCard1 && (
          <motion.div className="absolute inset-0" initial={{ scale: 0.95, y: 10, opacity: 0.85 }} animate={{ scale: 0.95, y: 10, opacity: 0.85 }}>
            <Card internship={nextCard1} language={language} />
          </motion.div>
        )}

        <AnimatePresence initial={false}>
          <motion.div
            key={currentCard.id}
            className="absolute inset-0 cursor-grab active:cursor-grabbing touch-pan-x"
            drag="x"
            dragConstraints={{ left: -200, right: 200 }}
            onDragEnd={(_, info) => {
              const threshold = 100;
              if (info.offset.x > threshold) setLeaving('right');
              else if (info.offset.x < -threshold) setLeaving('left');
            }}
            initial={{ scale: 1, opacity: 1, x: 0, rotate: 0 }}
            animate={leaving ? {
              x: leaving === 'right' ? 400 : -400,
              opacity: 0,
              rotate: reducedMotion ? 0 : leaving === 'right' ? 20 : -20
            } : { x: 0, rotate: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 26 }}
            onAnimationComplete={() => {
              if (leaving) {
                if (leaving === 'right') onLike?.(currentCard);
                if (leaving === 'left') onPass?.(currentCard);
                setLeaving(null);
                setIndex(i => Math.min(i + 1, recommendations.length));
              }
            }}
          >
            <Card
              internship={currentCard}
              onApply={() => onApply?.(currentCard)}
              language={language}
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Action Buttons - kept inside body area and away from footer */}
      <div className="sticky bottom-6 z-20 flex justify-center space-x-6 mt-6">
        <motion.button
          onClick={() => setLeaving('left')}
          className="w-14 h-14 bg-red-500 rounded-full flex items-center justify-center text-white shadow-lg hover:shadow-xl focus-ring"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </motion.button>

        

        <motion.button
          onClick={() => setLeaving('right')}
          className="w-14 h-14 bg-green-500 rounded-full flex items-center justify-center text-white shadow-lg hover:shadow-xl focus-ring"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </motion.button>
      </div>

      {/* Instructions */}
      <motion.div
        className="text-center mt-4 text-sm text-gray-700"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
      >
        <p>{t('swipeRightToLike')} • {t('swipeLeftToPass')}</p>
      </motion.div>
    </div>
  );
};

// Individual Card Component
interface CardProps {
  internship: Internship;
  style?: React.CSSProperties;
  onApply?: () => void;
  language?: string;
}

const Card: React.FC<CardProps> = ({
  internship,
  style,
  onApply,
  language = 'en'
}) => {
  const { t } = useTranslation(language);
  const { reducedMotion } = useAccessibility();
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [showExplain, setShowExplain] = useState(false);
  const formatDate = (input?: string) => {
    if (!input) return '';
    const date = new Date(input);
    if (isNaN(date.getTime())) return input;
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yy = String(date.getFullYear()).slice(-2);
    return `${dd}-${mm}-${yy}`;
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'remote': return 'bg-blue-100 text-blue-800';
      case 'onsite': return 'bg-green-100 text-green-800';
      case 'hybrid': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <motion.div
      className="absolute inset-0 bg-white rounded-3xl shadow-xl overflow-hidden flex flex-col"
      style={style}
      layoutId={internship.id}
    >
      {/* Header */}
      <div className="p-6 gradient-primary text-white">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-xl font-bold mb-1">{internship.title}</h3>
            <p className="text-white/90">{internship.company}</p>
          </div>
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
            {internship.logo ? (
              <Image src={internship.logo} alt={internship.company} width={32} height={32} className="w-8 h-8 rounded-full" />
            ) : (
              <span className="text-lg font-bold">{internship.company.charAt(0)}</span>
            )}
          </div>
          
        </div>

        <div className="flex items-center space-x-2 mb-4">
          <span className="text-sm">📍</span>
          <span className="text-sm">{internship.location}</span>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(internship.type)}`}>
            {internship.type}
          </span>
        </div>

        {/* Match Score with explain toggle */}
        <div className="flex items-center space-x-2">
          <div className="flex-1 bg-white/20 rounded-full h-2">
            <motion.div
              className="h-full bg-white rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${internship.matchScore}%` }}
              transition={{ duration: 1, delay: 0.5 }}
            />
          </div>
          <button
            type="button"
            onClick={() => setShowExplain(v => !v)}
            className="text-sm font-semibold flex items-center gap-1"
            aria-expanded={showExplain}
          >
            {internship.matchScore}% match
            <svg className={`w-4 h-4 transition-transform ${showExplain ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M6 9l6 6 6-6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>

      {/* Scrollable Content + Sticky Footer */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6">
        {/* Explainability panel */}
        {showExplain && (internship.explanations?.length || internship.contributors?.length) && (
          <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-slate-900">
            {internship.contributors && internship.contributors.length > 0 && (
              <div className="mb-3">
                <div className="text-sm font-semibold text-slate-800 mb-2">Top contributing factors</div>
                <div className="flex flex-wrap gap-2">
                  {internship.contributors.map((c) => (
                    <span
                      key={c.name}
                      className="px-2.5 py-1 rounded-full bg-white border border-slate-200 text-[11px] text-slate-700"
                    >
                      {c.name}: {Math.round(c.percentage)}%
                    </span>
                  ))}
                </div>
              </div>
            )}
            {internship.explanations && internship.explanations.length > 0 && (
              <ul className="space-y-1.5 text-sm text-slate-800">
                {internship.explanations.map((e, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-slate-400"></span>
                    <span className="leading-relaxed">{e}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
        {/* Skills */}
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Required Skills</h4>
          <div className="flex flex-wrap gap-2">
            {internship.skills.slice(0, 4).map((skill) => (
              <span
                key={skill}
                className="px-2 py-1 bg-primary-100 text-primary-700 rounded-full text-xs font-medium"
              >
                {skill}
              </span>
            ))}
            {internship.skills.length > 4 && (
              <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                +{internship.skills.length - 4} more
              </span>
            )}
          </div>
        </div>

        {/* Description with Read more/Less */}
        <div className="mb-4">
          <p className={`text-gray-600 text-sm ${showFullDescription ? '' : 'line-clamp-3'}`}>
            {internship.description}
          </p>
          {internship.description && internship.description.length > 160 && (
            <button
              type="button"
              onClick={() => setShowFullDescription(v => !v)}
              className="mt-2 text-primary-700 hover:underline text-sm font-medium"
            >
              {showFullDescription ? 'Read less' : 'Read more'}
            </button>
          )}
        </div>

        {/* Details - enhanced display */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
          <div className="bg-gray-50 rounded-xl p-3 flex items-center space-x-2">
            <span className="text-gray-700">⏱️</span>
            <div className="min-w-0">
              <div className="text-xs text-gray-500 leading-tight">Duration</div>
              <div className="font-semibold text-gray-800 truncate">{internship.duration}</div>
            </div>
          </div>
          {internship.salary && (
            <div className="bg-gray-50 rounded-xl p-3 flex items-center space-x-2">
              <span className="text-gray-700">💰</span>
              <div className="min-w-0">
                <div className="text-xs text-gray-500 leading-tight">Stipend</div>
                <div className="font-semibold text-gray-800 truncate">{internship.salary}</div>
              </div>
            </div>
          )}
          {internship.applicationDeadline && (
            <div className="bg-gray-50 rounded-xl p-3 flex items-center space-x-2">
              <span className="text-gray-700">📅</span>
              <div className="min-w-0">
                <div className="text-xs text-gray-500 leading-tight">Deadline</div>
                <div className="font-semibold text-gray-800 truncate">{formatDate(internship.applicationDeadline)}</div>
              </div>
            </div>
          )}
        </div>
        </div>
        {/* Sticky Apply Button */}
        {onApply && (
          <div className="p-6 pt-0 sticky bottom-0 bg-white">
            <motion.button
              onClick={onApply}
              className="w-full py-3 px-4 gradient-primary text-white rounded-xl font-medium shadow-lg hover:shadow-xl"
              whileHover={{ scale: reducedMotion ? 1 : 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {t('applyNow')}
            </motion.button>
          </div>
        )}
      </div>
    </motion.div>
  );
};
