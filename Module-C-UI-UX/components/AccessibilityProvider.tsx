'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AccessibilityContextType {
  highContrast: boolean;
  fontSize: 'normal' | 'large';
  reducedMotion: boolean;
  toggleHighContrast: () => void;
  changeFontSize: (size: 'normal' | 'large') => void;
  setReducedMotion: (reduced: boolean) => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (context === undefined) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
};

interface AccessibilityProviderProps {
  children: ReactNode;
}

export const AccessibilityProvider: React.FC<AccessibilityProviderProps> = ({ children }) => {
  const [highContrast, setHighContrast] = useState(false);
  const [fontSize, setFontSize] = useState<'normal' | 'large'>('normal');
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    // Check system preferences on mount
    if (typeof window !== 'undefined') {
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const prefersHighContrast = window.matchMedia('(prefers-contrast: high)').matches;
      setReducedMotion(prefersReducedMotion);
      setHighContrast(prefersHighContrast);

      // Load saved preferences from localStorage
      const savedHighContrast = localStorage.getItem('accessibility-highContrast');
      const savedFontSize = localStorage.getItem('accessibility-fontSize') as 'normal' | 'large';
      const savedReducedMotion = localStorage.getItem('accessibility-reducedMotion');

      if (savedHighContrast !== null) {
        setHighContrast(savedHighContrast === 'true');
      }
      if (savedFontSize) {
        setFontSize(savedFontSize);
      }
      if (savedReducedMotion !== null) {
        setReducedMotion(savedReducedMotion === 'true');
      }
    }
  }, []);

  const toggleHighContrast = () => {
    const newValue = !highContrast;
    setHighContrast(newValue);
    localStorage.setItem('accessibility-highContrast', newValue.toString());

    // Update CSS custom properties for proper contrast
    if (newValue) {
      document.documentElement.style.setProperty('--background', '#000000');
      document.documentElement.style.setProperty('--foreground', '#ffffff');
      // Also update common text colors for high contrast
      document.documentElement.style.setProperty('--text-primary', '#ffffff');
      document.documentElement.style.setProperty('--text-secondary', '#ffffff');
      document.documentElement.style.setProperty('--text-muted', '#cccccc');
    } else {
      document.documentElement.style.removeProperty('--background');
      document.documentElement.style.removeProperty('--foreground');
      document.documentElement.style.removeProperty('--text-primary');
      document.documentElement.style.removeProperty('--text-secondary');
      document.documentElement.style.removeProperty('--text-muted');
    }
  };

  const changeFontSize = (size: 'normal' | 'large') => {
    setFontSize(size);
    localStorage.setItem('accessibility-fontSize', size);

    // Update font size on document
    const fontSizeMultiplier = size === 'large' ? 1.2 : 1;
    document.documentElement.style.setProperty('--font-size-multiplier', fontSizeMultiplier.toString());
  };

  const updateReducedMotion = (reduced: boolean) => {
    setReducedMotion(reduced);
    localStorage.setItem('accessibility-reducedMotion', reduced.toString());

    // Update CSS custom properties for animations
    if (reduced) {
      document.documentElement.style.setProperty('--animation-duration', '0.01ms');
    } else {
      document.documentElement.style.removeProperty('--animation-duration');
    }
  };

  const contextValue: AccessibilityContextType = {
    highContrast,
    fontSize,
    reducedMotion,
    toggleHighContrast,
    changeFontSize,
    setReducedMotion: updateReducedMotion
  };

  return (
    <AccessibilityContext.Provider value={contextValue}>
      <div
        className={`
          ${highContrast ? 'high-contrast' : ''}
          ${fontSize === 'large' ? 'text-lg' : ''}
          ${reducedMotion ? 'reduce-motion' : ''}
        `}
        style={{
          fontSize: fontSize === 'large' ? '1.125rem' : '1rem'
        }}
      >
        {children}
      </div>
    </AccessibilityContext.Provider>
  );
};

// Accessibility Settings Component
export const AccessibilitySettings: React.FC = () => {
  const { highContrast, fontSize, reducedMotion, toggleHighContrast, changeFontSize, setReducedMotion } = useAccessibility();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 max-w-md mx-auto">
      <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
        Accessibility Settings
      </h3>

      <div className="space-y-4">
        {/* High Contrast Toggle */}
        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              High Contrast
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Increase contrast for better visibility
            </p>
          </div>
          <button
            onClick={toggleHighContrast}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
              highContrast ? 'bg-primary-600' : 'bg-gray-200'
            }`}
            aria-pressed={highContrast}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                highContrast ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Font Size Selection */}
        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Font Size
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Choose your preferred text size
            </p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => changeFontSize('normal')}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                fontSize === 'normal'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Normal
            </button>
            <button
              onClick={() => changeFontSize('large')}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                fontSize === 'large'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Large
            </button>
          </div>
        </div>

        {/* Reduced Motion Toggle */}
        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Reduced Motion
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Minimize animations and transitions
            </p>
          </div>
          <button
            onClick={() => setReducedMotion(!reducedMotion)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
              reducedMotion ? 'bg-primary-600' : 'bg-gray-200'
            }`}
            aria-pressed={reducedMotion}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                reducedMotion ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
};
