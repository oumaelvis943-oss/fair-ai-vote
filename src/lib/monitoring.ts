/**
 * Monitoring and Error Tracking Configuration
 * Production-ready monitoring utilities
 */

interface ErrorContext {
  user_id?: string;
  election_id?: string;
  component?: string;
  action?: string;
  [key: string]: any;
}

interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

class MonitoringService {
  private static instance: MonitoringService;
  private performanceMetrics: PerformanceMetric[] = [];
  private errorCount: number = 0;

  private constructor() {
    // Initialize monitoring
    this.initializeMonitoring();
  }

  static getInstance(): MonitoringService {
    if (!MonitoringService.instance) {
      MonitoringService.instance = new MonitoringService();
    }
    return MonitoringService.instance;
  }

  private initializeMonitoring() {
    // Set up global error handler
    window.addEventListener('error', (event) => {
      this.captureError(event.error, {
        type: 'unhandled_error',
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      });
    });

    // Set up unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      this.captureError(event.reason, {
        type: 'unhandled_promise_rejection',
        promise: event.promise
      });
    });

    // Performance monitoring
    if ('performance' in window && 'PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            this.recordPerformance(entry.name, entry.duration, {
              entryType: entry.entryType,
              startTime: entry.startTime
            });
          }
        });
        observer.observe({ entryTypes: ['navigation', 'resource', 'measure'] });
      } catch (error) {
        console.warn('Performance monitoring not available:', error);
      }
    }
  }

  /**
   * Capture and log errors
   */
  captureError(error: Error | unknown, context?: ErrorContext): void {
    this.errorCount++;

    const errorData = {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
      environment: import.meta.env.MODE,
      url: window.location.href,
      userAgent: navigator.userAgent,
      ...context
    };

    // Log to console in development
    if (import.meta.env.DEV) {
      console.error('Error captured:', errorData);
    }

    // In production, send to error tracking service
    if (import.meta.env.PROD) {
      this.sendToErrorTracking(errorData);
    }

    // Store in session for debugging
    this.storeErrorInSession(errorData);
  }

  /**
   * Record performance metrics
   */
  recordPerformance(name: string, duration: number, metadata?: Record<string, any>): void {
    const metric: PerformanceMetric = {
      name,
      duration,
      timestamp: Date.now(),
      metadata
    };

    this.performanceMetrics.push(metric);

    // Log slow operations
    if (duration > 1000) {
      console.warn(`Slow operation detected: ${name} took ${duration}ms`, metadata);
    }

    // Keep only last 100 metrics
    if (this.performanceMetrics.length > 100) {
      this.performanceMetrics.shift();
    }
  }

  /**
   * Track custom events
   */
  trackEvent(eventName: string, properties?: Record<string, any>): void {
    const event = {
      name: eventName,
      timestamp: new Date().toISOString(),
      properties,
      url: window.location.href
    };

    if (import.meta.env.DEV) {
      console.log('Event tracked:', event);
    }

    // Send to analytics in production
    if (import.meta.env.PROD) {
      this.sendToAnalytics(event);
    }
  }

  /**
   * Track user actions
   */
  trackUserAction(action: string, details?: Record<string, any>): void {
    this.trackEvent('user_action', {
      action,
      ...details
    });
  }

  /**
   * Get performance report
   */
  getPerformanceReport(): { 
    averageDuration: number; 
    slowestOperations: PerformanceMetric[];
    totalErrors: number;
  } {
    const total = this.performanceMetrics.reduce((sum, m) => sum + m.duration, 0);
    const avg = this.performanceMetrics.length > 0 ? total / this.performanceMetrics.length : 0;
    const slowest = [...this.performanceMetrics]
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 10);

    return {
      averageDuration: avg,
      slowestOperations: slowest,
      totalErrors: this.errorCount
    };
  }

  private sendToErrorTracking(errorData: any): void {
    // TODO: Integrate with Sentry or other error tracking service
    // Example: Sentry.captureException(errorData);
    
    // For now, use browser's sendBeacon for non-blocking send
    if ('sendBeacon' in navigator) {
      const blob = new Blob([JSON.stringify(errorData)], { type: 'application/json' });
      navigator.sendBeacon('/api/errors', blob);
    }
  }

  private sendToAnalytics(event: any): void {
    // TODO: Integrate with Google Analytics or other analytics service
    // Example: gtag('event', event.name, event.properties);
    
    if ('sendBeacon' in navigator) {
      const blob = new Blob([JSON.stringify(event)], { type: 'application/json' });
      navigator.sendBeacon('/api/analytics', blob);
    }
  }

  private storeErrorInSession(errorData: any): void {
    try {
      const errors = JSON.parse(sessionStorage.getItem('app_errors') || '[]');
      errors.push(errorData);
      // Keep only last 10 errors
      if (errors.length > 10) errors.shift();
      sessionStorage.setItem('app_errors', JSON.stringify(errors));
    } catch (error) {
      console.warn('Failed to store error in session:', error);
    }
  }
}

// Export singleton instance
export const monitoring = MonitoringService.getInstance();

// Convenience functions
export const captureError = (error: Error | unknown, context?: ErrorContext) => 
  monitoring.captureError(error, context);

export const trackEvent = (eventName: string, properties?: Record<string, any>) => 
  monitoring.trackEvent(eventName, properties);

export const trackUserAction = (action: string, details?: Record<string, any>) => 
  monitoring.trackUserAction(action, details);

export const recordPerformance = (name: string, duration: number, metadata?: Record<string, any>) => 
  monitoring.recordPerformance(name, duration, metadata);

/**
 * Performance measurement utility
 */
export function measurePerformance<T>(
  name: string,
  fn: () => T | Promise<T>,
  metadata?: Record<string, any>
): T | Promise<T> {
  const start = performance.now();
  
  try {
    const result = fn();
    
    if (result instanceof Promise) {
      return result.then(
        (value) => {
          const duration = performance.now() - start;
          monitoring.recordPerformance(name, duration, metadata);
          return value;
        },
        (error) => {
          const duration = performance.now() - start;
          monitoring.recordPerformance(name, duration, { ...metadata, error: true });
          throw error;
        }
      );
    } else {
      const duration = performance.now() - start;
      monitoring.recordPerformance(name, duration, metadata);
      return result;
    }
  } catch (error) {
    const duration = performance.now() - start;
    monitoring.recordPerformance(name, duration, { ...metadata, error: true });
    throw error;
  }
}
