import React from 'react';

// Type definitions for performance utilities
interface ExtendedWindow extends Window {
  gtag?: (command: string, action: string, properties?: Record<string, unknown>) => void;
}

interface PerformanceMemory {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

interface ExtendedPerformance extends Performance {
  memory?: PerformanceMemory;
}

interface NavigationEntry extends PerformanceEntry {
  transferSize?: number;
}

// Performance monitoring utilities

// Service Worker for offline functionality
export const registerServiceWorker = () => {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('Service Worker registered:', registration);
      })
      .catch((error) => {
        console.log('Service Worker registration failed:', error);
      });
  }
};

export const measurePerformance = () => {
  if (typeof window !== 'undefined') {
    // Core Web Vitals tracking
    import('web-vitals').then((webVitals: unknown) => {
      const vitals = webVitals as {
        getCLS?: (callback: (metric: unknown) => void) => void;
        getFID?: (callback: (metric: unknown) => void) => void;
        getFCP?: (callback: (metric: unknown) => void) => void;
        getLCP?: (callback: (metric: unknown) => void) => void;
        getTTFB?: (callback: (metric: unknown) => void) => void;
      };

      if (vitals.getCLS) vitals.getCLS(console.log);
      if (vitals.getFID) vitals.getFID(console.log);
      if (vitals.getFCP) vitals.getFCP(console.log);
      if (vitals.getLCP) vitals.getLCP(console.log);
      if (vitals.getTTFB) vitals.getTTFB(console.log);
    });
  }
};

// Track user interactions for optimization
export const trackUserInteraction = (action: string, properties: Record<string, unknown> = {}) => {
  if (typeof window !== 'undefined') {
    // Send to analytics (replace with your analytics service)
    console.log('User interaction:', action, properties);

    // Example with Google Analytics
    const extendedWindow = window as ExtendedWindow;
    if (extendedWindow.gtag) {
      extendedWindow.gtag('event', action, properties);
    }
  }
};

// Memory usage monitoring
export const monitorMemoryUsage = () => {
  if (typeof window !== 'undefined' && 'memory' in performance) {
    const memory = (performance as ExtendedPerformance).memory;
    if (memory) {
      console.log('Memory usage:', {
        used: Math.round(memory.usedJSHeapSize / 1048576),
        total: Math.round(memory.totalJSHeapSize / 1048576),
        limit: Math.round(memory.jsHeapSizeLimit / 1048576)
      });
    }
  }
};

// Bundle size monitoring
export const reportBundleSize = () => {
  if (typeof window !== 'undefined' && 'sendBeacon' in navigator) {
    // Report bundle size to monitoring service
    const navigationEntry = window.performance?.getEntriesByType('navigation')[0] as NavigationEntry;
    const bundleSize = navigationEntry?.transferSize;
    if (bundleSize) {
      navigator.sendBeacon('/api/metrics/bundle-size', JSON.stringify({ size: bundleSize }));
    }
  }
};

// Preload critical resources
export const preloadCriticalResources = () => {
  if (typeof document !== 'undefined') {
    // Preload critical fonts
    const fontLink = document.createElement('link');
    fontLink.rel = 'preload';
    fontLink.href = 'https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&family=Inter:wght@400;500;600&display=swap';
    fontLink.as = 'style';
    document.head.appendChild(fontLink);

    // Preload critical images
    const images = [
      '/images/hero-illustration.svg',
      '/images/feature-1.svg',
      '/images/feature-2.svg',
      '/images/feature-3.svg'
    ];

    images.forEach(src => {
      const img = new Image();
      img.src = src;
    });
  }
};

// Intersection Observer for lazy loading
export const useIntersectionObserver = (
  ref: React.RefObject<Element>,
  callback: () => void,
  options: IntersectionObserverInit = {}
) => {
  React.useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            callback();
            observer.unobserve(element);
          }
        });
      },
      { threshold: 0.1, ...options }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [ref, callback, options]);
};

// Debounce utility for performance
export const debounce = <T extends (...args: unknown[]) => void>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Throttle utility for performance
export const throttle = <T extends (...args: unknown[]) => void>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// Cache management
export const clearCache = () => {
  if (typeof window !== 'undefined') {
    // Clear local storage
    localStorage.clear();

    // Clear session storage
    sessionStorage.clear();

    // Clear cache storage
    if ('caches' in window) {
      caches.keys().then((names) => {
        names.forEach((name) => {
          caches.delete(name);
        });
      });
    }
  }
};

// Error boundary for graceful error handling
export class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ComponentType<{ error: Error }> },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode; fallback?: React.ComponentType<{ error: Error }> }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    trackUserInteraction('error_boundary_caught', { error: error.message });
  }

  render() {
    if (this.state.hasError && this.state.error) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      return React.createElement(FallbackComponent, { error: this.state.error });
    }

    return this.props.children;
  }
}

const DefaultErrorFallback: React.FC<{ error: Error }> = ({ error }) => 
  React.createElement('div', { className: 'min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center' },
    React.createElement('div', { className: 'bg-white rounded-3xl p-8 shadow-lg max-w-md mx-auto text-center' },
      React.createElement('div', { className: 'w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4' },
        React.createElement('span', { className: 'text-3xl' }, '⚠️')
      ),
      React.createElement('h3', { className: 'text-xl font-bold text-gray-900 mb-2' }, 'Something went wrong'),
      React.createElement('p', { className: 'text-gray-600 mb-6' }, error.message),
      React.createElement('button', {
        onClick: () => window.location.reload(),
        className: 'px-6 py-3 gradient-primary text-white rounded-xl font-medium shadow-lg hover:shadow-xl'
      }, 'Reload Page')
    )
  );
