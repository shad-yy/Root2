/**
 * SMART Live TV - Error Handler
 * 
 * Centralized error handling for the application
 * Provides consistent error reporting and fallback strategies
 */

import CONFIG from './config.js';

const ErrorHandler = {
  /**
   * Track errors that have been displayed to the user
   * to avoid showing the same error multiple times
   */
  displayedErrors: new Set(),
  
  /**
   * Initialize error handler
   */
  init() {
    // Set up global error handling
    window.addEventListener('error', this.handleGlobalError.bind(this));
    window.addEventListener('unhandledrejection', this.handlePromiseRejection.bind(this));
    
    console.log('Error handler initialized');
    
    // Set up global error handling
    if (CONFIG.ERROR_HANDLING.LOG_ERRORS) {
      this.setupGlobalErrorHandling();
    }
    
    // Clear displayed errors list periodically
    setInterval(() => {
      this.displayedErrors.clear();
    }, 3600000); // Clear every hour
  },
  
  /**
   * Set up global error handling
   */
  setupGlobalErrorHandling() {
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.logError('unhandled_promise_rejection', event.reason);
    });
    
    // Handle uncaught exceptions
    window.addEventListener('error', (event) => {
      this.logError('uncaught_exception', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error ? event.error.stack : null
      });
    });
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
    
    // Prevent default browser error handling if needed
    if (CONFIG.FEATURES.ERROR_TRACKING) {
      event.preventDefault();
    }
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
    
    // Prevent default browser error handling if needed
    if (CONFIG.FEATURES.ERROR_TRACKING) {
      event.preventDefault();
    }
  },
  
  /**
   * Handle API errors
   * @param {Error} error - Error object
   * @param {string} endpoint - API endpoint
   * @param {Object} params - Request parameters
   * @returns {Object} - Fallback data
   */
  handleApiError(error, endpoint, params) {
    // Log error
    console.error(`API error for ${endpoint}:`, error);
    
    // Track error
    this.trackError({
      type: 'api',
      message: error.message,
      endpoint: endpoint,
      params: params,
      stack: error.stack
    });
    
    // Return fallback data
    return this.getFallbackData(endpoint);
  },
  
  /**
   * Get fallback data for API errors
   * @param {string} endpoint - API endpoint
   * @returns {Object} - Fallback data
   */
  getFallbackData(endpoint) {
    // Football fallback data
    if (endpoint.includes('FOOTBALL/fixtures') || endpoint.includes('matches')) {
      return {
        response: [
          {
            fixture: {
              id: 1,
              date: new Date().toISOString(),
              status: { short: 'NS' }
            },
            league: {
              id: 39,
              name: 'Premier League',
              logo: '/main/images/leagues/premier-league.png'
            },
            teams: {
              home: {
                id: 33,
                name: 'Manchester United',
                logo: '/main/images/teams/manchester-united.png'
              },
              away: {
                id: 42,
                name: 'Arsenal',
                logo: '/main/images/teams/arsenal.png'
              }
            },
            goals: {
              home: null,
              away: null
            }
          },
          {
            fixture: {
              id: 2,
              date: new Date().toISOString(),
              status: { short: 'NS' }
            },
            league: {
              id: 140,
              name: 'La Liga',
              logo: '/main/images/leagues/la-liga.png'
            },
            teams: {
              home: {
                id: 541,
                name: 'Real Madrid',
                logo: '/main/images/teams/real-madrid.png'
              },
              away: {
                id: 529,
                name: 'Barcelona',
                logo: '/main/images/teams/barcelona.png'
              }
            },
            goals: {
              home: null,
              away: null
            }
          }
        ]
      };
    } 
    // Football standings fallback data
    else if (endpoint.includes('FOOTBALL/standings')) {
      return {
        response: [
          {
            league: {
              id: 39,
              name: 'Premier League',
              logo: '/main/images/leagues/premier-league.png',
              standings: [
                [
                  {
                    rank: 1,
                    team: {
                      id: 50,
                      name: 'Manchester City',
                      logo: '/main/images/teams/manchester-city.png'
                    },
                    all: {
                      played: 10,
                      win: 8,
                      draw: 1,
                      lose: 1
                    },
                    goalsDiff: 17,
                    points: 25
                  },
                  {
                    rank: 2,
                    team: {
                      id: 42,
                      name: 'Arsenal',
                      logo: '/main/images/teams/arsenal.png'
                    },
                    all: {
                      played: 10,
                      win: 7,
                      draw: 2,
                      lose: 1
                    },
                    goalsDiff: 12,
                    points: 23
                  },
                  {
                    rank: 3,
                    team: {
                      id: 40,
                      name: 'Liverpool',
                      logo: '/main/images/teams/liverpool.png'
                    },
                    all: {
                      played: 10,
                      win: 7,
                      draw: 1,
                      lose: 2
                    },
                    goalsDiff: 11,
                    points: 22
                  },
                  {
                    rank: 4,
                    team: {
                      id: 47,
                      name: 'Tottenham',
                      logo: '/main/images/teams/tottenham.png'
                    },
                    all: {
                      played: 10,
                      win: 6,
                      draw: 2,
                      lose: 2
                    },
                    goalsDiff: 8,
                    points: 20
                  },
                  {
                    rank: 5,
                    team: {
                      id: 66,
                      name: 'Aston Villa',
                      logo: '/main/images/teams/aston-villa.png'
                    },
                    all: {
                      played: 10,
                      win: 6,
                      draw: 1,
                      lose: 3
                    },
                    goalsDiff: 8,
                    points: 19
                  }
                ]
              ]
            }
          }
        ]
      };
    }
    // UFC events fallback data
    else if (endpoint.includes('UFC/events')) {
      return {
        events: [
          {
            id: 1,
            name: 'UFC 307: Jones vs Aspinall',
            date: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            location: 'Las Vegas, Nevada',
            venue: 'T-Mobile Arena',
            mainCard: [
              {
                id: 1,
                fighter1: {
                  id: 1,
                  name: 'Jon Jones',
                  record: '27-1-0',
                  country: 'USA',
                  image: '/main/images/fighters/jon-jones.png'
                },
                fighter2: {
                  id: 2,
                  name: 'Tom Aspinall',
                  record: '14-3-0',
                  country: 'UK',
                  image: '/main/images/fighters/tom-aspinall.png'
                },
                weightClass: 'Heavyweight',
                title: true
              }
            ]
          }
        ]
      };
    }
    // F1 races fallback data
    else if (endpoint.includes('F1/races')) {
      return {
        races: [
          {
            id: 1,
            name: 'Miami Grand Prix',
            date: new Date(new Date().getTime() + 14 * 24 * 60 * 60 * 1000).toISOString(),
            circuit: 'Miami International Autodrome',
            location: 'Miami, Florida',
            image: '/main/images/circuits/miami.png'
          }
        ]
      };
    }
    // Default empty response
    else {
      return { response: [] };
    }
  },
  
  /**
   * Show error message UI
   * @param {string} message - Error message
   * @param {string} containerSelector - Container selector
   */
  showErrorMessage(message, containerSelector) {
    const container = document.querySelector(containerSelector);
    if (container) {
      container.innerHTML = `
        <div class="error-message">
          <i class="fas fa-exclamation-circle"></i>
          <p>${message}</p>
        </div>
      `;
    }
  },
  
  /**
   * Track error for analytics and logging
   * @param {Object} errorData - Error data
   */
  trackError(errorData) {
    // Add timestamp
    errorData.timestamp = new Date().toISOString();
    
    // Get existing errors from local storage
    const errors = JSON.parse(localStorage.getItem('error_log') || '[]');
    
    // Add new error
    errors.push(errorData);
    
    // Keep only the last 50 errors
    const recentErrors = errors.slice(-50);
    
    // Save to local storage
    localStorage.setItem('error_log', JSON.stringify(recentErrors));
    
    // In a real implementation, you would send this to a server
    if (CONFIG.FEATURES.ERROR_TRACKING) {
      console.log('Error tracked:', errorData);
      // Example server call (commented out)
      // fetch('/api/errors', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(errorData)
      // }).catch(err => console.error('Failed to send error report:', err));
    }
  },
  
  /**
   * Log an error
   * @param {string} errorType - Error type/category
   * @param {Error|object|string} error - Error object or message
   * @param {object} additionalInfo - Additional context information
   */
  logError(errorType, error, additionalInfo = {}) {
    // Format the error
    const errorDetails = this.formatError(error);
    
    // Create error log object
    const errorLog = {
      type: errorType,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      ...errorDetails,
      ...additionalInfo
    };
    
    // Log to console in development
    if (CONFIG.IS_DEVELOPMENT) {
      console.error('Error logged:', errorLog);
      console.error(error);
    }
    
    // Send error to server in production if enabled
    if (CONFIG.ERROR_HANDLING.LOG_ERRORS && !CONFIG.IS_DEVELOPMENT) {
      this.sendErrorToServer(errorLog).catch(err => {
        console.error('Failed to send error to server:', err);
      });
    }
    
    return errorLog;
  },
  
  /**
   * Format an error for logging
   * @param {Error|object|string} error - Error to format
   * @returns {object} - Formatted error object
   */
  formatError(error) {
    if (!error) {
      return { message: 'Unknown error' };
    }
    
    // If error is a string
    if (typeof error === 'string') {
      return { message: error };
    }
    
    // If error is an Error object
    if (error instanceof Error) {
      return {
        message: error.message,
        name: error.name,
        stack: error.stack,
        code: error.code
      };
    }
    
    // If error is a Response object
    if (error instanceof Response) {
      return {
        message: `HTTP Error: ${error.status} ${error.statusText}`,
        status: error.status,
        statusText: error.statusText
      };
    }
    
    // If error is a generic object
    return {
      ...error,
      message: error.message || 'Unknown error'
    };
  },
  
  /**
   * Send error to server for logging
   * @param {object} errorLog - Error log object
   * @returns {Promise} - Server response
   */
  async sendErrorToServer(errorLog) {
    try {
      const response = await fetch(CONFIG.ERROR_HANDLING.ERROR_REPORTING_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': CONFIG.API_KEY
        },
        body: JSON.stringify(errorLog),
        mode: 'cors'
      });
      
      if (!response.ok) {
        throw new Error(`Error reporting failed: ${response.status} ${response.statusText}`);
      }
      
      return await response.json();
    } catch (err) {
      console.error('Error reporting failed:', err);
      return null;
    }
  },
  
  /**
   * Show error message to user
   * @param {string} message - Error message
   * @param {string} type - Error type ('error', 'warning', 'info')
   * @param {boolean} dismissable - Whether user can dismiss the error
   * @param {number} duration - Auto-dismiss duration in ms (0 for no auto-dismiss)
   */
  showError(message, type = 'error', dismissable = true, duration = 5000) {
    // Check if this error has already been displayed
    const errorKey = `${type}:${message}`;
    if (this.displayedErrors.has(errorKey)) {
      return;
    }
    
    // Add to displayed errors
    this.displayedErrors.add(errorKey);
    
    // Create error container if it doesn't exist
    const container = this.getOrCreateErrorContainer();
    
    // Create error element
    const errorElement = document.createElement('div');
    errorElement.className = `error-toast ${type}`;
    errorElement.innerHTML = `
      <div class="error-icon">
        <i class="fas ${this.getErrorIcon(type)}"></i>
      </div>
      <div class="error-content">
        <p>${message}</p>
      </div>
      ${dismissable ? '<button class="error-dismiss"><i class="fas fa-times"></i></button>' : ''}
    `;
    
    // Add to container
    container.appendChild(errorElement);
    
    // Add active class after a short delay (for animation)
    setTimeout(() => {
      errorElement.classList.add('active');
    }, 10);
    
    // Add dismiss button functionality
    if (dismissable) {
      const dismissButton = errorElement.querySelector('.error-dismiss');
      dismissButton.addEventListener('click', () => {
        this.dismissError(errorElement);
      });
    }
    
    // Auto-dismiss after duration if specified
    if (duration > 0) {
      setTimeout(() => {
        this.dismissError(errorElement);
      }, duration);
    }
  },
  
  /**
   * Dismiss an error message
   * @param {HTMLElement} errorElement - Error element to dismiss
   */
  dismissError(errorElement) {
    errorElement.classList.remove('active');
    
    // Remove from DOM after animation
    setTimeout(() => {
      if (errorElement.parentNode) {
        errorElement.parentNode.removeChild(errorElement);
      }
      
      // Remove container if empty
      const errorContainer = document.getElementById('error-toast-container');
      if (errorContainer && errorContainer.children.length === 0) {
        errorContainer.parentNode.removeChild(errorContainer);
      }
    }, 300);
  },
  
  /**
   * Get or create error toast container
   * @returns {HTMLElement} - Error container
   */
  getOrCreateErrorContainer() {
    let container = document.getElementById('error-toast-container');
    
    if (!container) {
      container = document.createElement('div');
      container.id = 'error-toast-container';
      document.body.appendChild(container);
    }
    
    return container;
  },
  
  /**
   * Get icon for error type
   * @param {string} type - Error type
   * @returns {string} - Icon class
   */
  getErrorIcon(type) {
    switch (type) {
      case 'error':
        return 'fa-circle-exclamation';
      case 'warning':
        return 'fa-triangle-exclamation';
      case 'info':
        return 'fa-circle-info';
      case 'success':
        return 'fa-circle-check';
      default:
        return 'fa-circle-exclamation';
    }
  },
  
  /**
   * Show a form validation error
   * @param {HTMLElement} formElement - Form element
   * @param {string} message - Error message
   * @param {string} fieldName - Field name with error
   */
  showFormError(formElement, message, fieldName = null) {
    if (!formElement) return;
    
    // Create error message element
    const errorMessage = document.createElement('div');
    errorMessage.className = 'form-error';
    errorMessage.textContent = message;
    
    if (fieldName) {
      // Find the field
      const field = formElement.querySelector(`[name="${fieldName}"]`);
      
      if (field) {
        // Add error class to field
        field.classList.add('error');
        
        // Add error message after field
        field.parentNode.appendChild(errorMessage);
        
        // Focus the field
        field.focus();
        
        // Remove error when field is changed
        field.addEventListener('input', () => {
          field.classList.remove('error');
          if (errorMessage.parentNode) {
            errorMessage.parentNode.removeChild(errorMessage);
          }
        }, { once: true });
      }
    } else {
      // Add general error message at the top of the form
      formElement.prepend(errorMessage);
    }
  }
};

// Initialize error handler
ErrorHandler.init();

// Export error handler
export default ErrorHandler; 