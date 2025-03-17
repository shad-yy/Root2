/**
 * SMART Live TV - Enhanced Configuration
 * 
 * This file contains all configurable parameters for the website
 * including API keys, endpoints, refresh intervals, and feature flags.
 * 
 * Enhanced version with better organization, clearer documentation,
 * and expanded configuration options for all website features.
 */

const CONFIG = {
  // Site information
  SITE: {
    NAME: 'SMART Live TV',
    DOMAIN: 'smartlivetv.net',
    BASE_URL: 'https://smartlivetv.net',
    MAIN_PATH: '/main', // Path to main site files
    SHOP_URL: 'https://smartlivetv.net/shop',
    DEFAULT_TITLE: 'SMART Live TV – The Ultimate Sports Streaming & News Hub',
    DEFAULT_DESCRIPTION: 'Watch live sports streaming in HD - football, basketball, UFC, F1 and more. Get real-time scores, rankings and sports news.'
  },
  
  // API configuration
  API: {
    KEY: 'e0d3bf230amsha7e9bcaa7a18fe2p1fb71cjsn8076650ec333', // Replace with your actual API key
    CACHE_DURATION: 3600, // Default cache duration in seconds (1 hour)
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 1000 // Initial retry delay in ms
  },
  
  // API endpoints
  ENDPOINTS: {
    // Base URLs
    BASE_URL: 'https://allsportsapi2.p.rapidapi.com',
    
    // Football API
    FOOTBALL_HOST: 'api-football-v1.p.rapidapi.com',
    FOOTBALL_MATCHES: '/api/matches',
    FOOTBALL_TEAM: '/api/team',
    FOOTBALL_STANDINGS: '/api/tournament',
    
    // UFC/MMA APIs
    UFC_FIGHTERS_HOST: 'ufc-fighters.p.rapidapi.com',
    UFC_RANKINGS: '/rankings',
    UFC_FIGHTER_SEARCH: '/fighters/search',
    UFC_EVENTS: '/events',
    
    // F1 APIs
    F1_HOST: 'formula-1-standings.p.rapidapi.com',
    F1_CALENDAR: '/races',
    F1_DRIVER_STANDINGS: '/driver-standings',
    F1_CONSTRUCTOR_STANDINGS: '/constructor-standings',
    F1_RACE_RESULTS: '/race-results',
    
    // News APIs
    NEWS_HOST: 'sports-news-api.p.rapidapi.com',
    NEWS_HEADLINES: '/headlines',
    TRENDING_TOPICS: '/trending'
  },
  
  // Feature flags
  FEATURES: {
    BLOG_AUTO_GENERATION: true,
    REMINDERS: true,
    LIVE_SCORES: true,
    DARK_MODE: true,
    NEWSLETTER: true
  },
  
  // Blog configuration
  BLOG: {
    POSTS_PER_DAY: 5,
    STORAGE_KEY: 'blogPosts',
    AUTO_PUBLISH: true,
    SEO: {
      TITLE_MAX_LENGTH: 60,
      DESCRIPTION_MAX_LENGTH: 160,
      KEYWORDS_PER_POST: 5
    }
  },
  
  // Reminder configuration
  REMINDERS: {
    STORAGE_KEY: 'eventReminders',
    CHECK_INTERVAL: 60000, // Check every minute
    DEFAULT_MINUTES_BEFORE: 30,
    NOTIFICATION_OPTIONS: {
      BROWSER: true,
      EMAIL: false // Email notifications require backend implementation
    }
  },
  
  // Placeholder images
  PLACEHOLDER_IMAGES: {
    TEAM: '/main/images/placeholder-team.png',
    PLAYER: '/main/images/placeholder-player.png',
    EVENT: '/main/images/placeholder-event.jpg',
    BLOG: '/main/images/placeholder-blog.jpg'
  },

  // Version information
  VERSION: {
    NUMBER: '2.0.0',
    LAST_UPDATED: '2025-03-16'
  },

  // API Headers
  HEADERS: {
    'X-RapidAPI-Key': 'e0d3bf230amsha7e9bcaa7a18fe2p1fb71cjsn8076650ec333',
    'X-RapidAPI-Host': 'allsportsapi2.p.rapidapi.com'
  },

  // Caching duration (in seconds) for different data types
  CACHE_DURATION: {
    MATCHES: 3600 * 6,       // Cache matches for 6 hours
    STANDINGS: 3600 * 12,     // Update standings every 12 hours
    TEAM: 3600 * 24 * 7,     // Cache team info for a week
    UFC_RANKINGS: 3600 * 24,  // Update UFC rankings daily
    UFC_FIGHTERS: 3600 * 24 * 7, // Cache fighter profiles for a week
    UFC_MARKETS: 3600 * 1,    // Update betting markets hourly
    UFC_TOURNAMENTS: 3600 * 12,  // Update UFC events every 12 hours
    F1_SCHEDULE: 3600 * 24,   // Update F1 schedule daily
    F1_STANDINGS: 3600 * 12,  // Update F1 standings every 12 hours
    F1_RESULTS: 3600 * 24 * 7, // Cache race results for a week 
    BOXING_EVENTS: 3600 * 12, // Update boxing events every 12 hours
    BOXING_FIGHTERS: 3600 * 24 * 7, // Cache boxer profiles for a week
    NEWS: 3600 * 2,          // Cache news for 2 hours
    TRENDING: 3600 * 1,      // Cache trending topics for 1 hour
    TWEETS: 3600 * 0.5,      // Cache tweets for 30 minutes
    BLOG_POSTS: 3600 * 24,   // Cache generated blog posts for 24 hours
    API_STATUS: 60           // Cache API status for 1 minute
  },

  // Update times (when scheduled updates occur)
  UPDATE_TIMES: {
    MORNING: 8,   // 8 AM
    AFTERNOON: 14, // 2 PM
    EVENING: 20   // 8 PM
  },

  // API Limits (per day)
  API_LIMITS: {
    DAILY_LIMIT: 100,        // Default API call limit per day
    WARNING_THRESHOLD: 80,   // Percentage at which to start using cached data
    EMERGENCY_THRESHOLD: 95, // Percentage at which to stop making API calls

    // API-specific limits
    FOOTBALL_API: 150,
    UFC_API: 100,
    F1_API: 100,
    NEWS_API: 200,
    TRENDING_API: 50,
    TWITTER_API: 100,
    BOXING_API: 80
  },

  // Leagues configuration
  LEAGUES: {
    PREMIER_LEAGUE: {
      id: 1,
      name: "Premier League",
      tournamentId: 1,
      seasonId: 2025,
      logo: "/images/leagues/premier-league.png",
      teams: 20,
      country: "England",
      countryCode: "GB"
    },
    LA_LIGA: {
      id: 2,
      name: "La Liga",
      tournamentId: 2,
      seasonId: 2025,
      logo: "/images/leagues/la-liga.png",
      teams: 20,
      country: "Spain",
      countryCode: "ES"
    },
    SERIE_A: {
      id: 3,
      name: "Serie A",
      tournamentId: 3,
      seasonId: 2025,
      logo: "/images/leagues/serie-a.png",
      teams: 20,
      country: "Italy",
      countryCode: "IT"
    },
    BUNDESLIGA: {
      id: 4,
      name: "Bundesliga",
      tournamentId: 4,
      seasonId: 2025,
      logo: "/images/leagues/bundesliga.png",
      teams: 18,
      country: "Germany",
      countryCode: "DE"
    },
    LIGUE_1: {
      id: 5,
      name: "Ligue 1",
      tournamentId: 5,
      seasonId: 2025,
      logo: "/images/leagues/ligue-1.png",
      teams: 18,
      country: "France",
      countryCode: "FR"
    },
    CHAMPIONS_LEAGUE: {
      id: 6,
      name: "Champions League",
      tournamentId: 6,
      seasonId: 2025,
      logo: "/images/leagues/champions-league.png",
      teams: 32,
      country: "Europe",
      countryCode: "EU"
    }
  },

  // UFC specific parameters
  UFC: {
    WEIGHT_CLASSES: [
      'Heavyweight',
      'Light Heavyweight',
      'Middleweight',
      'Welterweight',
      'Lightweight',
      'Featherweight',
      'Bantamweight',
      'Flyweight',
      "Women's Strawweight",
      "Women's Flyweight",
      "Women's Bantamweight",
      "Women's Featherweight"
    ],
    DEFAULT_WEIGHT_CLASS: 'Lightweight',
    SPECIAL_MARKETS_PARAMS: {
      league_ids: '1624',
      sport_id: '8'
    },
    TOURNAMENTS_PARAMS: {
      sport: 'UFC'
    },
    CHAMPIONS: {
      // Map of current champions for fallback when API is unavailable
      'Heavyweight': 'Jon Jones',
      'Light Heavyweight': 'Alex Pereira',
      'Middleweight': 'Dricus Du Plessis',
      'Welterweight': 'Leon Edwards',
      'Lightweight': 'Islam Makhachev',
      'Featherweight': 'Ilia Topuria',
      'Bantamweight': 'Sean O\'Malley',
      'Flyweight': 'Alexandre Pantoja',
      "Women's Strawweight": 'Zhang Weili',
      "Women's Flyweight": 'Alexa Grasso',
      "Women's Bantamweight": 'Julianna Peña',
      "Women's Featherweight": 'Amanda Nunes'
    },
    UPCOMING_EVENTS: [
      {
        id: "ufc-307",
        name: "UFC 307: Jones vs Aspinall",
        date: "2025-03-22T22:00:00Z",
        location: "T-Mobile Arena, Las Vegas, NV",
        mainEvent: "Jon Jones vs Tom Aspinall",
        isPPV: true
      },
      {
        id: "ufc-fight-night-whittaker-costa",
        name: "UFC Fight Night: Whittaker vs Costa",
        date: "2025-04-05T20:00:00Z",
        location: "UFC APEX, Las Vegas, NV",
        mainEvent: "Robert Whittaker vs Paulo Costa",
        isPPV: false
      }
    ]
  },

  // F1 specific parameters
  F1: {
    CURRENT_SEASON: 2025,
    DEFAULT_RACE: 'Monaco Grand Prix',
    TEAMS: [
      { name: 'Red Bull Racing', color: '#0600EF', shortName: 'RBR' },
      { name: 'Ferrari', color: '#DC0000', shortName: 'FER' },
      { name: 'Mercedes', color: '#00D2BE', shortName: 'MER' },
      { name: 'McLaren', color: '#FF8700', shortName: 'MCL' },
      { name: 'Aston Martin', color: '#006F62', shortName: 'AST' },
      { name: 'Alpine', color: '#0090FF', shortName: 'ALP' },
      { name: 'Haas F1 Team', color: '#FFFFFF', shortName: 'HAA' },
      { name: 'Alfa Romeo', color: '#900000', shortName: 'ALF' },
      { name: 'Williams', color: '#0082FA', shortName: 'WIL' },
      { name: 'AlphaTauri', color: '#2B4562', shortName: 'APH' }
    ],
    RACE_COUNT: 24,
    CIRCUITS: {
      'Monaco': { layout: '/images/circuits/monaco-layout.jpg', laps: 78, length: 3.337 },
      'Silverstone': { layout: '/images/circuits/silverstone-layout.jpg', laps: 52, length: 5.891 },
      'Monza': { layout: '/images/circuits/monza-layout.jpg', laps: 53, length: 5.793 },
      'Spa': { layout: '/images/circuits/spa-layout.jpg', laps: 44, length: 7.004 }
    },
    UPCOMING_RACES: [
      {
        id: "monaco-gp-2025",
        name: "Monaco Grand Prix",
        circuit: "Circuit de Monaco, Monte Carlo",
        date: "2025-03-25T15:00:00Z",
        country: "Monaco"
      },
      {
        id: "british-gp-2025",
        name: "British Grand Prix",
        circuit: "Silverstone Circuit, Silverstone",
        date: "2025-07-06T15:00:00Z",
        country: "Great Britain"
      }
    ]
  },

  // Boxing specific parameters
  BOXING: {
    WEIGHT_CLASSES: [
      'Heavyweight',
      'Cruiserweight',
      'Light Heavyweight',
      'Super Middleweight',
      'Middleweight',
      'Super Welterweight',
      'Welterweight',
      'Super Lightweight',
      'Lightweight',
      'Super Featherweight',
      'Featherweight',
      'Super Bantamweight',
      'Bantamweight',
      'Super Flyweight',
      'Flyweight'
    ],
    ORGANIZATIONS: [
      { name: 'WBC', fullName: 'World Boxing Council', color: '#00A652' },
      { name: 'WBA', fullName: 'World Boxing Association', color: '#1E4C9B' },
      { name: 'IBF', fullName: 'International Boxing Federation', color: '#D01317' },
      { name: 'WBO', fullName: 'World Boxing Organization', color: '#E99517' }
    ],
    UPCOMING_EVENTS: [
      {
        id: "fury-joshua-2025",
        name: "Fury vs Joshua",
        date: "2025-04-15T21:00:00Z",
        location: "Wembley Stadium, London, UK",
        mainEvent: "Tyson Fury vs Anthony Joshua",
        weightClass: "Heavyweight",
        titles: ["WBC", "WBA", "IBF"]
      }
    ]
  },

  // Social Media URLs
  SOCIAL: {
    FACEBOOK: 'https://www.facebook.com/smartlivetv',
    TWITTER: 'https://www.twitter.com/smartlivetv',
    INSTAGRAM: 'https://www.instagram.com/smartlivetv',
    YOUTUBE: 'https://www.youtube.com/smartlivetv'
  },

  // Subscription plans
  SUBSCRIPTION: {
    BASIC: {
      name: 'Basic',
      price: 9.99,
      billingOptions: ['monthly', 'yearly'],
      yearlyDiscount: 20, // 20% discount for yearly billing
      features: [
        'Standard definition streaming',
        'Access to live scores and stats',
        'Limited replays (24 hours)'
      ]
    },
    STANDARD: {
      name: 'Standard',
      price: 14.99,
      billingOptions: ['monthly', 'yearly'],
      yearlyDiscount: 25, // 25% discount for yearly billing
      features: [
        'HD streaming',
        'Full access to live scores and stats',
        'Extended replays (7 days)',
        'Multiple device support'
      ]
    },
    PREMIUM: {
      name: 'Premium',
      price: 19.99,
      billingOptions: ['monthly', 'yearly'],
      yearlyDiscount: 30, // 30% discount for yearly billing
      features: [
        '4K streaming where available',
        'Full access to all content',
        'Unlimited replays',
        'Exclusive content',
        'No ads',
        'Multiple device support'
      ]
    }
  },

  // Debug settings
  DEBUG: {
    ENABLED: true,
    LOG_API_CALLS: true,
    LOG_CACHE_HITS: true,
    PERFORMANCE_MONITORING: true,
    ERROR_REPORTING: true
  }
};

// Prevent accidental modification of configuration
Object.freeze(CONFIG.ENDPOINTS);
Object.freeze(CONFIG.CACHE_DURATION);
Object.freeze(CONFIG.UPDATE_TIMES);
Object.freeze(CONFIG.LEAGUES);
Object.freeze(CONFIG.UFC);
Object.freeze(CONFIG.F1);
Object.freeze(CONFIG.BOXING);
Object.freeze(CONFIG.BLOG);
Object.freeze(CONFIG.FEATURES);
Object.freeze(CONFIG.REMINDERS);
Object.freeze(CONFIG.PLACEHOLDER_IMAGES);
Object.freeze(CONFIG.SOCIAL);
Object.freeze(CONFIG.SUBSCRIPTION);
Object.freeze(CONFIG.DEBUG);

// Add unfrozen utility methods to CONFIG
/**
 * Get league information by ID
 * @param {number|string} id - League ID
 * @returns {Object|null} - League information or null if not found
 */
CONFIG.getLeagueById = function (id) {
  if (!id) return null;

  // Convert ID to string for comparison
  const idStr = id.toString();

  for (const key in this.LEAGUES) {
    if (this.LEAGUES[key].tournamentId.toString() === idStr ||
      this.LEAGUES[key].id.toString() === idStr) {
      return this.LEAGUES[key];
    }
  }
  return null;
};

/**
 * Get UFC champion by weight class
 * @param {string} weightClass - Weight class
 * @returns {string|null} - Champion name or null if not found
 */
CONFIG.getUFCChampion = function (weightClass) {
  return this.UFC.CHAMPIONS[weightClass] || null;
};

/**
 * Get F1 team by name or short name
 * @param {string} name - Team name or short name
 * @returns {Object|null} - Team information or null if not found
 */
CONFIG.getF1Team = function (name) {
  if (!name) return null;

  // Try exact match first
  const exactMatch = this.F1.TEAMS.find(team =>
    team.name.toLowerCase() === name.toLowerCase() ||
    team.shortName.toLowerCase() === name.toLowerCase());

  if (exactMatch) return exactMatch;

  // Try partial match
  return this.F1.TEAMS.find(team =>
    team.name.toLowerCase().includes(name.toLowerCase()) ||
    team.shortName.toLowerCase().includes(name.toLowerCase()));
};

/**
 * Check if a feature is enabled
 * @param {string} featureName - Feature name
 * @returns {boolean} - True if feature is enabled
 */
CONFIG.isFeatureEnabled = function (featureName) {
  return this.FEATURES[featureName] === true;
};

/**
 * Get the next big sports event
 * @returns {Object|null} - Next event information or null if none
 */
CONFIG.getNextBigEvent = function () {
  const now = new Date();

  // Collect upcoming events from all sports
  const allEvents = [
    // UFC events
    ...this.UFC.UPCOMING_EVENTS.map(event => ({
      type: 'ufc',
      id: event.id,
      name: event.name,
      date: new Date(event.date),
      isPremium: event.isPPV,
      mainEvent: event.mainEvent,
      location: event.location
    })),

    // F1 races
    ...this.F1.UPCOMING_RACES.map(race => ({
      type: 'f1',
      id: race.id,
      name: race.name,
      date: new Date(race.date),
      isPremium: false,
      circuit: race.circuit,
      country: race.country
    })),

    // Boxing events
    ...this.BOXING.UPCOMING_EVENTS.map(event => ({
      type: 'boxing',
      id: event.id,
      name: event.name,
      date: new Date(event.date),
      isPremium: true,
      mainEvent: event.mainEvent,
      location: event.location
    }))
  ];

  // Filter for upcoming events and sort by date
  const upcomingEvents = allEvents
    .filter(event => event.date > now)
    .sort((a, b) => a.date - b.date);

  // Return the next event or null if none
  return upcomingEvents.length > 0 ? upcomingEvents[0] : null;
};

/**
 * Format date for display
 * @param {Date} date - Date to format
 * @param {Object} options - Formatting options
 * @returns {string} - Formatted date
 */
CONFIG.formatDate = function (date, options = {}) {
  if (!date) return '';

  const defaultOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  };

  const mergedOptions = { ...defaultOptions, ...options };
  return new Date(date).toLocaleDateString(undefined, mergedOptions);
};

/**
 * Format time for display
 * @param {Date} date - Date to format time from
 * @returns {string} - Formatted time
 */
CONFIG.formatTime = function (date) {
  if (!date) return '';

  return new Date(date).toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Calculate time remaining until an event
 * @param {Date|string} eventDate - Event date
 * @returns {Object} - Time remaining in days, hours, minutes
 */
CONFIG.getTimeRemaining = function (eventDate) {
  const targetDate = new Date(eventDate);
  const now = new Date();

  // Get difference in milliseconds
  const diff = targetDate - now;

  // If event is in the past, return zeros
  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, totalMs: 0 };
  }

  // Calculate time units
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return {
    days,
    hours,
    minutes,
    seconds,
    totalMs: diff
  };
};

/**
 * Get relative path to fix 404 errors
 * @param {string} path - Path to convert
 * @returns {string} - Converted path
 */
CONFIG.getRelativePath = function (path) {
  // Check if in WordPress directory structure
  const inWordPress = window.location.pathname.includes('/main/');

  // If we're in the WordPress directory structure, adjust paths
  if (inWordPress) {
    // Add /main prefix to paths that don't already have it
    if (path.startsWith('/') && !path.startsWith('/main/')) {
      return '/main' + path;
    }
  }

  return path;
};

/**
 * Load script dynamically
 * @param {string} src - Script source URL
 * @param {function} callback - Callback function
 */
CONFIG.loadScript = function (src, callback) {
  const script = document.createElement('script');
  script.type = 'text/javascript';
  script.src = this.getRelativePath(src);
  script.async = true;

  if (callback) {
    script.onload = callback;
  }

  document.head.appendChild(script);
};

/**
 * Register event reminder
 * @param {string} eventId - Event ID
 * @param {string} eventName - Event name
 * @param {Date|string} eventDate - Event date
 * @param {string} eventType - Event type (ufc, football, f1, etc.)
 * @param {number} minutesBefore - Minutes before event to send reminder
 * @returns {boolean} - True if reminder was set successfully
 */
CONFIG.setEventReminder = function (eventId, eventName, eventDate, eventType, minutesBefore = null) {
  // Use default reminder time if not specified
  const reminderTime = minutesBefore || this.REMINDERS.DEFAULT_MINUTES_BEFORE;

  // Create reminder object
  const reminder = {
    id: `${eventType}-${eventId}-${Date.now()}`, // Unique ID
    eventId: eventId,
    eventName: eventName,
    eventDate: new Date(eventDate).toISOString(),
    eventType: eventType,
    minutesBefore: reminderTime,
    createdAt: new Date().toISOString()
  };

  try {
    // Get existing reminders
    const remindersJson = localStorage.getItem(this.REMINDERS.STORAGE_KEY);
    const reminders = remindersJson ? JSON.parse(remindersJson) : [];

    // Check if maximum number of reminders reached
    if (reminders.length >= this.REMINDERS.MAX_REMINDERS_PER_USER) {
      console.warn('Maximum number of reminders reached');
      return false;
    }

    // Check if reminder already exists for this event
    const exists = reminders.some(r => r.eventId === eventId && r.eventType === eventType);
    if (exists) {
      console.warn('Reminder already exists for this event');
      return false;
    }

    // Add new reminder
    reminders.push(reminder);

    // Save to localStorage
    localStorage.setItem(this.REMINDERS.STORAGE_KEY, JSON.stringify(reminders));

    // Request notification permission if needed
    if (this.REMINDERS.NOTIFICATION_OPTIONS.BROWSER && 'Notification' in window) {
      if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
        Notification.requestPermission();
      }
    }

    return true;
  } catch (error) {
    console.error('Error setting event reminder:', error);
    return false;
  }
};

/**
 * Check and send due reminders
 */
CONFIG.checkReminders = function () {
  try {
    // Get reminders from localStorage
    const remindersJson = localStorage.getItem(this.REMINDERS.STORAGE_KEY);
    if (!remindersJson) return;

    const reminders = JSON.parse(remindersJson);
    const now = new Date();
    const updatedReminders = [];

    reminders.forEach(reminder => {
      const eventDate = new Date(reminder.eventDate);
      const reminderTime = new Date(eventDate.getTime() - (reminder.minutesBefore * 60 * 1000));

      // If reminder is due (current time is past reminder time)
      if (now >= reminderTime && !reminder.sent) {
        // Send notification
        this.sendReminderNotification(reminder);

        // Mark as sent
        reminder.sent = true;
        reminder.sentAt = now.toISOString();
      }

      // Keep reminder if event hasn't passed yet or recently sent (for history)
      if (eventDate > now || (reminder.sent && (now - eventDate) < 86400000)) { // Keep for 24 hours after event
        updatedReminders.push(reminder);
      }
    });

    // Save updated reminders back to localStorage
    localStorage.setItem(this.REMINDERS.STORAGE_KEY, JSON.stringify(updatedReminders));
  } catch (error) {
    console.error('Error checking reminders:', error);
  }
};

/**
 * Send reminder notification
 * @param {Object} reminder - Reminder object
 */
CONFIG.sendReminderNotification = function (reminder) {
  // Browser notification
  if (this.REMINDERS.NOTIFICATION_OPTIONS.BROWSER && 'Notification' in window) {
    if (Notification.permission === 'granted') {
      const title = `Event Reminder: ${reminder.eventName}`;
      const options = {
        body: `Starting in ${reminder.minutesBefore} minutes!`,
        icon: '/images/notification-icon.png',
        tag: reminder.id,
        data: {
          eventId: reminder.eventId,
          eventType: reminder.eventType
        }
      };

      const notification = new Notification(title, options);

      // Handle notification click
      notification.onclick = function () {
        window.focus();
        const url = `/watch/${reminder.eventType}/${reminder.eventId}`;
        window.location.href = url;
      };
    }
  }
};

// Export CONFIG for use in modules
export default CONFIG;