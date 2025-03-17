/**
 * SMART Live TV - Error Handler
 * 
 * Centralized error handling for the application
 * Provides consistent error reporting and fallback strategies
 */

import CONFIG from './config.js';

const ErrorHandler = {
  /**
   * Initialize error handler
   */
  init() {
    // Set up global error handling
    window.addEventListener('error', this.handleGlobalError.bind(this));
    window.addEventListener('unhandledrejection', this.handlePromiseRejection.bind(this));
    
    console.log('Error handler initialized');
  },
  
  /**
   * Handle global JavaScript errors
   * @param {ErrorEvent} event - Error event
   */
  handleGlobalError(event) {
    // Log error
    console.error('Global error:', event.error);
    
    // Track error
    this.trackError({
      type: 'global',
      message: event.message,
      source: event.filename,
      line: event.lineno,
      column: event.colno,
      stack: event.error?.stack
    });
    
    // Prevent default browser error handling
    event.preventDefault();
  },
  
  /**
   * Handle unhandled promise rejections
   * @param {PromiseRejectionEvent} event - Promise rejection event
   */
  handlePromiseRejection(event) {
    // Log error
    console.error('Unhandled promise rejection:', event.reason);
    
    // Track error
    this.trackError({
      type: 'promise',
      message: event.reason?.message || 'Promise rejected',
      stack: event.reason?.stack
    });
    
    // Prevent default browser error handling
    event.preventDefault();
  },
  
  /**
   * Handle API errors
   * @param {Error} error - Error object
   * @param {string} endpoint - API endpoint
   * @param {Object} options - Request options
   * @returns {Object} - Fallback data or empty object
   */
  handleApiError(error, endpoint, options) {
    // Log error
    console.error(`API error for ${endpoint}:`, error);
    
    // Track error
    this.trackError({
      type: 'api',
      message: error.message,
      endpoint: endpoint,
      stack: error.stack
    });
    
    // Return fallback data based on endpoint
    return this.getFallbackData(endpoint);
  },
  
  /**
   * Get fallback data for API errors
   * @param {string} endpoint - API endpoint
   * @returns {Object} - Fallback data
   */
  getFallbackData(endpoint) {
    // Determine endpoint type
    if (endpoint.includes('matches')) {
      return { events: [] };
    } else if (endpoint.includes('standings')) {
      return { standings: [] };
    } else if (endpoint.includes('team')) {
      return { team: {} };
    } else if (endpoint.includes('events')) {
      return { events: [] };
    } else if (endpoint.includes('races')) {
      return { races: [] };
    } else {
      return {};
    }
  },
  
  /**
   * Display error message to user
   * @param {string} message - Error message
   * @param {string} container - Container selector
   */
  showErrorMessage(message, container) {
    const errorContainer = document.querySelector(container);
    if (errorContainer) {
      errorContainer.innerHTML = `
        <div class="error-message">
          <i class="fas fa-exclamation-circle"></i>
          <p>${message}</p>
        </div>
      `;
    }
  },
  
  /**
   * Track error for analytics
   * @param {Object} errorData - Error data
   */
  trackError(errorData) {
    // Add timestamp
    errorData.timestamp = new Date().toISOString();
    
    // Get existing errors
    const errors = JSON.parse(localStorage.getItem('error_log') || '[]');
    
    // Add new error
    errors.push(errorData);
    
    // Keep only last 50 errors
    const recentErrors = errors.slice(-50);
    
    // Save to localStorage
    localStorage.setItem('error_log', JSON.stringify(recentErrors));
    
    // If error tracking endpoint is configured, send error
    if (CONFIG.FEATURES.ERROR_TRACKING && CONFIG.ENDPOINTS.ERROR_TRACKING) {
      // In a real implementation, this would send the error to a server
      console.log('Would send error to tracking endpoint:', errorData);
    }
  }
};

// Initialize error handler
ErrorHandler.init();

// Export error handler
export default ErrorHandler; 