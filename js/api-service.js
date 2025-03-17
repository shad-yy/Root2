/**
 * SMART Live TV - Enhanced API Service
 * 
 * This service handles all API interactions with sports data providers.
 * It implements robust caching, error handling, and rate limiting to 
 * ensure reliable data delivery while optimizing API usage.
 * 
 * Key features:
 * - Intelligent caching with fallback to stale data
 * - Automatic retry with exponential backoff
 * - Rate limiting protection to prevent API quota exhaustion
 * - Graceful degradation when APIs are unavailable
 */

// Import the configuration
import CONFIG from './config.js';
import DataProcessor from './data-processor.js';

/**
 * Cache manager for sports data
 * Handles storing and retrieving data with expiration
 */
class DataCache {
  constructor() {
    this.cache = {};
    this.loadFromStorage();

    // Clean expired cache every hour
    setInterval(() => this.cleanExpired(), 3600000);
  }

  // Load cache from localStorage
  loadFromStorage() {
    try {
      const savedCache = localStorage.getItem('sportsDataCache');
      if (savedCache) {
        this.cache = JSON.parse(savedCache);
      }
    } catch (err) {
      console.error('Error loading cache from localStorage:', err);
      // Reset cache if corrupted
      this.cache = {};
      this.saveToStorage();
    }
  }

  // Save cache to localStorage
  saveToStorage() {
    try {
      localStorage.setItem('sportsDataCache', JSON.stringify(this.cache));
    } catch (err) {
      console.warn('Could not save cache to localStorage:', err);

      // Handle storage quota exceeded
      if (err.name === 'QuotaExceededError') {
        this.clearOldest(10); // Clear 10 oldest items
        // Try saving again
        try {
          localStorage.setItem('sportsDataCache', JSON.stringify(this.cache));
        } catch (retryErr) {
          console.error('Still unable to save cache after clearing old items');
        }
      }
    }
  }

  // Get cached data if not expired
  get(key) {
    const cached = this.cache[key];
    if (!cached) return null;

    if (cached.expiresAt < Date.now()) {
      delete this.cache[key];
      this.saveToStorage();
      return null;
    }

    // Log cache hit if debugging is enabled
    if (CONFIG.DEBUG.ENABLED && CONFIG.DEBUG.LOG_CACHE_HITS) {
      console.log(`Cache hit for: ${key}`);
    }

    return cached.data;
  }

  // Store data with expiration
  set(key, data, expirationSeconds) {
    const expiresAt = Date.now() + (expirationSeconds * 1000);

    this.cache[key] = {
      data,
      timestamp: Date.now(),
      expiresAt
    };

    // Also store as stale data for emergency fallback
    try {
      localStorage.setItem(`stale_${key}`, JSON.stringify(data));
    } catch (err) {
      // Ignore storage errors for stale data
    }

    this.saveToStorage();
  }

  // Delete all expired cache items
  cleanExpired() {
    let cleaned = false;
    Object.keys(this.cache).forEach(key => {
      if (this.cache[key].expiresAt < Date.now()) {
        delete this.cache[key];
        cleaned = true;
      }
    });

    if (cleaned) {
      this.saveToStorage();
    }
  }

  // Clear oldest cache items when storage is full
  clearOldest(count) {
    const items = Object.keys(this.cache).map(key => ({
      key,
      timestamp: this.cache[key].timestamp
    }));

    // Sort by timestamp (oldest first)
    items.sort((a, b) => a.timestamp - b.timestamp);

    // Remove oldest items
    items.slice(0, count).forEach(item => {
      delete this.cache[item.key];
    });

    this.saveToStorage();
  }

  // Get all stale data keys
  getStaleDataKeys() {
    const keys = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith('stale_')) {
        keys.push(key.replace('stale_', ''));
      }
    }

    return keys;
  }

  // Clear all cache
  clearAll() {
    this.cache = {};
    this.saveToStorage();
  }
}

// Create singleton cache instance
const sportsCache = new DataCache();

/**
 * API Service for sports data
 * Handles fetching, caching, and API rate limiting
 */
const ApiService = {
  // Track daily API usage by host
  _apiUsage: {},
  _apiStatus: {},
  _lastStatusCheck: 0,

  // Initialize API usage tracking from localStorage
  init() {
    this.initApiUsage();
    this.checkApiStatus();

    // Set up regular status checks
    setInterval(() => this.checkApiStatus(), 60000); // Every minute
  },

  // Initialize API usage tracking from localStorage
  initApiUsage() {
    try {
      const storedUsage = localStorage.getItem('apiDailyUsage');
      if (storedUsage) {
        this._apiUsage = JSON.parse(storedUsage);
      }

      // Clean up old dates
      this._cleanupApiUsage();
    } catch (error) {
      console.error('Error initializing API usage tracking:', error);
      this._apiUsage = {};
    }
  },

  // Clean up old API usage data (older than 7 days)
  _cleanupApiUsage() {
    const today = new Date();
    const cutoffDate = new Date(today);
    cutoffDate.setDate(today.getDate() - 7);

    Object.keys(this._apiUsage).forEach(dateStr => {
      const date = new Date(dateStr);
      if (date < cutoffDate) {
        delete this._apiUsage[dateStr];
      }
    });

    localStorage.setItem('apiDailyUsage', JSON.stringify(this._apiUsage));
  },

  // Track daily API usage
  trackApiCall(host) {
    const today = new Date().toISOString().split('T')[0];

    // Initialize tracking for today if needed
    if (!this._apiUsage[today]) {
      this._apiUsage[today] = {};
    }

    // Track usage by host
    if (!this._apiUsage[today][host]) {
      this._apiUsage[today][host] = 1;
    } else {
      this._apiUsage[today][host]++;
    }

    // Save to localStorage
    localStorage.setItem('apiDailyUsage', JSON.stringify(this._apiUsage));

    // Log if debugging is enabled
    if (CONFIG.DEBUG.ENABLED && CONFIG.DEBUG.LOG_API_CALLS) {
      console.log(`API call to ${host}: #${this._apiUsage[today][host]} today`);
    }

    return this._apiUsage[today][host];
  },

  // Check if we're approaching API limit for a specific host
  isApproachingLimit(host) {
    const today = new Date().toISOString().split('T')[0];

    if (!this._apiUsage[today] || !this._apiUsage[today][host]) {
      return false;
    }

    // Get the limit for this host from config or use default
    const hostLimit = CONFIG.API_LIMITS[host.toUpperCase() + '_API'] || CONFIG.API_LIMITS.DAILY_LIMIT;
    const warningThreshold = CONFIG.API_LIMITS.WARNING_THRESHOLD;

    // Calculate percentage of limit used
    const percentUsed = (this._apiUsage[today][host] / hostLimit) * 100;

    return percentUsed >= warningThreshold;
  },

  // Check if we've exceeded the API limit for a host
  hasExceededLimit(host) {
    const today = new Date().toISOString().split('T')[0];

    if (!this._apiUsage[today] || !this._apiUsage[today][host]) {
      return false;
    }

    // Get the limit for this host from config or use default
    const hostLimit = CONFIG.API_LIMITS[host.toUpperCase() + '_API'] || CONFIG.API_LIMITS.DAILY_LIMIT;
    const emergencyThreshold = CONFIG.API_LIMITS.EMERGENCY_THRESHOLD;

    // Calculate percentage of limit used
    const percentUsed = (this._apiUsage[today][host] / hostLimit) * 100;

    return percentUsed >= emergencyThreshold;
  },

  // Get API status for each API
  getApiStatus() {
    // Return cached status if it's recent enough
    const now = Date.now();
    if (now - this._lastStatusCheck < (CONFIG.CACHE_DURATION.API_STATUS * 1000)) {
      return this._apiStatus;
    }

    this._lastStatusCheck = now;
    const today = new Date().toISOString().split('T')[0];
    const statuses = {};

    // Check status for each API
    const apiHosts = [
      'FOOTBALL',
      'UFC',
      'F1',
      'NEWS',
      'TRENDING',
      'TWITTER',
      'BOXING'
    ];

    apiHosts.forEach(apiName => {
      const hostUsage = this._apiUsage[today] && this._apiUsage[today][apiName.toLowerCase()];
      const hostLimit = CONFIG.API_LIMITS[apiName + '_API'] || CONFIG.API_LIMITS.DAILY_LIMIT;

      let status = 'green';
      let percentUsed = 0;

      if (hostUsage) {
        percentUsed = Math.round((hostUsage / hostLimit) * 100);

        if (percentUsed >= CONFIG.API_LIMITS.EMERGENCY_THRESHOLD) {
          status = 'red';
        } else if (percentUsed >= CONFIG.API_LIMITS.WARNING_THRESHOLD) {
          status = 'yellow';
        }
      }

      statuses[apiName] = {
        status,
        used: hostUsage || 0,
        limit: hostLimit,
        percentUsed
      };
    });

    this._apiStatus = statuses;
    return statuses;
  },

  // Check API status and update status indicators
  checkApiStatus() {
    const statuses = this.getApiStatus();

    // Update status indicators if they exist
    const statusIndicator = document.querySelector('.api-status-indicator');
    if (statusIndicator) {
      // Determine overall status
      const overallStatus = Object.values(statuses).some(s => s.status === 'red') ? 'red' :
        Object.values(statuses).some(s => s.status === 'yellow') ? 'yellow' : 'green';

      // Update indicator
      statusIndicator.className = `api-status-indicator ${overallStatus}`;
      statusIndicator.setAttribute('title', `API Status: ${overallStatus.toUpperCase()}`);
    }

    return statuses;
  },

  // Generic fetch function with caching
  /**
   * Fetches data from an API with caching support
   * 
   * @param {string} endpoint - The API endpoint to fetch data from
   * @param {Object} params - Query parameters to add to the request
   * @param {string} cacheKey - Unique key to use for caching the response
   * @param {number} cacheDuration - How long to cache the response in seconds
   * @param {Object} customHeaders - Custom headers to send with the request
   * @returns {Promise<Object>} - The API response data
   */
  async fetchWithCache(endpoint, params = {}, cacheKey, cacheDuration, customHeaders = null) {
    // Check cache first
    const cachedData = sportsCache.get(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    // Determine the host from endpoint or headers
    let host = '';
    if (customHeaders && customHeaders['X-RapidAPI-Host']) {
      host = customHeaders['X-RapidAPI-Host'].split('.')[0];
    } else {
      try {
        const urlObj = new URL(endpoint.startsWith('http') ? endpoint : `https://${endpoint}`);
        host = urlObj.hostname.split('.')[0];
      } catch (error) {
        host = 'unknown';
      }
    }

    // Check if approaching API limit and extend cache for non-critical data
    if (this.isApproachingLimit(host) && !endpoint.includes('matches') && !endpoint.includes('live')) {
      // For non-match data, try to return stale data if available
      const staleData = localStorage.getItem(`stale_${cacheKey}`);
      if (staleData) {
        console.warn(`Approaching API limit for ${host} - using stale data`);
        return JSON.parse(staleData);
      }
    }

    // Check if exceeded limit - only use stale data
    if (this.hasExceededLimit(host)) {
      console.error(`API limit exceeded for ${host}`);

      // Try to use stale data
      const staleData = localStorage.getItem(`stale_${cacheKey}`);
      if (staleData) {
        return JSON.parse(staleData);
      }

      throw new Error(`API limit exceeded for ${host} and no stale data available`);
    }

    // Build URL - check if it's already a complete URL
    let url = endpoint.startsWith('http') ? endpoint : `${CONFIG.ENDPOINTS.BASE_URL}${endpoint}`;

    // Add path parameters if any
    if (params.pathParams) {
      for (const key in params.pathParams) {
        url = url.replace(`:${key}`, encodeURIComponent(params.pathParams[key]));
      }
      delete params.pathParams;
    }

    // Add query parameters if any
    if (Object.keys(params).length > 0) {
      const queryParams = new URLSearchParams();
      for (const key in params) {
        queryParams.append(key, params[key]);
      }
      const queryString = queryParams.toString();
      url += (url.includes('?') ? '&' : '?') + queryString;
    }

    try {
      // Track API usage
      this.trackApiCall(host);

      // Use custom headers if provided, otherwise use default
      const headers = customHeaders || CONFIG.HEADERS;

      // Implement retry logic for network errors
      let retries = 0;
      const maxRetries = 3;

      while (retries < maxRetries) {
        try {
          const response = await fetch(url, {
            method: 'GET',
            headers: headers
          });

          if (!response.ok) {
            // If rate limited (429), wait and retry
            if (response.status === 429) {
              retries++;
              if (retries < maxRetries) {
                // Exponential backoff: 1s, 2s, 4s
                const backoffMs = Math.pow(2, retries) * 1000;
                console.warn(`Rate limited, retrying in ${backoffMs / 1000}s...`);
                await new Promise(resolve => setTimeout(resolve, backoffMs));
                continue;
              }
            }

            throw new Error(`API request failed: ${response.status} - ${response.statusText}`);
          }

          // Parse the JSON response
          let data;
          try {
            data = await response.json();
          } catch (jsonError) {
            console.error('Error parsing JSON response:', jsonError);
            throw new Error('Invalid JSON response from API');
          }

          // Validate the response data
          if (!data) {
            throw new Error('Empty response from API');
          }

          // Cache the result
          sportsCache.set(cacheKey, data, cacheDuration);

          // Update last update time
          localStorage.setItem('lastDataUpdate', new Date().toISOString());

          return data;
        } catch (fetchError) {
          // If it's a network error (like disconnection), retry
          if ((fetchError.name === 'TypeError' ||
            fetchError.message.includes('NetworkError') ||
            fetchError.message.includes('Failed to fetch')) &&
            retries < maxRetries) {
            retries++;
            const backoffMs = Math.pow(2, retries) * 1000;
            console.warn(`Network error, retrying in ${backoffMs / 1000}s...`, fetchError);
            await new Promise(resolve => setTimeout(resolve, backoffMs));
            continue;
          }

          throw fetchError;
        }
      }
    } catch (error) {
      console.error(`API request error for ${url}:`, error);

      // Return stale cache as fallback
      const staleData = localStorage.getItem(`stale_${cacheKey}`);
      if (staleData) {
        console.warn(`Using stale data for ${cacheKey} after API error`);
        try {
          return JSON.parse(staleData);
        } catch (parseError) {
          console.error('Error parsing stale data:', parseError);
        }
      }

      // If no stale data, return an empty fallback structure based on the endpoint
      // This helps prevent UI errors when data is unavailable
      if (endpoint.includes('matches')) {
        return { events: [] };
      } else if (endpoint.includes('standings')) {
        return { standings: [] };
      } else if (endpoint.includes('rankings')) {
        return [];
      }

      // If no fallback structure is defined, reject with the error
      throw error;
    }
  },

  // ========== FOOTBALL/SOCCER API METHODS ==========

  /**
   * Get football matches for a specific league, month and year
   * 
   * @param {number} leagueId - Tournament ID
   * @param {number} month - Month (1-12)
   * @param {number} year - Year (YYYY)
   * @returns {Promise<Object>} - Matches data
   */
  async getFootballMatches(leagueId, month, year) {
    if (!leagueId) {
      throw new Error('League ID is required');
    }

    // Default to current month/year if not provided
    if (!month || !year) {
      const now = new Date();
      month = month || now.getMonth() + 1;
      year = year || now.getFullYear();
    }

    const cacheKey = `matches_${leagueId}_${month}_${year}`;

    // Calculate appropriate cache duration based on how soon matches are
    const now = new Date();
    const requestedMonth = new Date(year, month - 1);
    const monthDiff = (requestedMonth.getFullYear() - now.getFullYear()) * 12 +
      requestedMonth.getMonth() - now.getMonth();

    // Shorter cache for current month, longer for past/future
    const cacheDuration = monthDiff === 0 ?
      CONFIG.CACHE_DURATION.MATCHES : // Current month
      CONFIG.CACHE_DURATION.MATCHES * 2; // Past or future month

    try {
      const data = await this.fetchWithCache(
        `${CONFIG.ENDPOINTS.MATCHES}/${leagueId}/${month}/${year}`,
        {},
        cacheKey,
        cacheDuration,
        {
          'X-RapidAPI-Key': CONFIG.API_KEY,
          'X-RapidAPI-Host': CONFIG.ENDPOINTS.FOOTBALL_HOST
        }
      );

      return DataProcessor.processMatches(data);
    } catch (error) {
      console.error(`Error fetching matches for league ${leagueId}:`, error);

      // Return empty data structure for graceful failure
      return { events: [] };
    }
  },

  /**
   * Get league standings
   * 
   * @param {number} tournamentId - Tournament ID
   * @param {number} seasonId - Season ID
   * @returns {Promise<Object>} - Standings data
   */
  async getLeagueStandings(tournamentId, seasonId) {
    if (!tournamentId || !seasonId) {
      throw new Error('Tournament ID and Season ID are required');
    }

    const cacheKey = `standings_${tournamentId}_${seasonId}`;

    try {
      const data = await this.fetchWithCache(
        `${CONFIG.ENDPOINTS.STANDINGS}/${tournamentId}/season/${seasonId}/standings/total`,
        {},
        cacheKey,
        CONFIG.CACHE_DURATION.STANDINGS,
        {
          'X-RapidAPI-Key': CONFIG.API_KEY,
          'X-RapidAPI-Host': CONFIG.ENDPOINTS.FOOTBALL_HOST
        }
      );

      return DataProcessor.processStandings(data);
    } catch (error) {
      console.error(`Error fetching standings for tournament ${tournamentId}:`, error);

      // Return empty data structure
      return { standings: [] };
    }
  },

  /**
   * Get team details
   * 
   * @param {number} teamId - Team ID
   * @returns {Promise<Object>} - Team details
   */
  async getTeamDetails(teamId) {
    if (!teamId) {
      throw new Error('Team ID is required');
    }

    const cacheKey = `team_${teamId}`;

    try {
      const data = await this.fetchWithCache(
        `${CONFIG.ENDPOINTS.TEAM}/${teamId}`,
        {},
        cacheKey,
        CONFIG.CACHE_DURATION.TEAM,
        {
          'X-RapidAPI-Key': CONFIG.API_KEY,
          'X-RapidAPI-Host': CONFIG.ENDPOINTS.FOOTBALL_HOST
        }
      );

      return DataProcessor.processTeamData(data);
    } catch (error) {
      console.error(`Error fetching team details for team ${teamId}:`, error);

      // Return empty data structure
      return null;
    }
  },

  // ========== UFC/MMA API METHODS ==========

  /**
   * Get UFC rankings for a specific weight class
   * 
   * @param {string} weightClass - Weight class to get rankings for
   * @returns {Promise<Object>} - Rankings data
   */
  async getUFCRankings(weightClass = '') {
    const normalizedWeightClass = weightClass.replace(/\s+/g, '-').toLowerCase();
    const cacheKey = `ufc_rankings_${normalizedWeightClass || 'all'}`;

    try {
      let endpoint = CONFIG.ENDPOINTS.UFC_RANKINGS;
      if (normalizedWeightClass) {
        endpoint += `/${normalizedWeightClass}`;
      }

      const data = await this.fetchWithCache(
        endpoint,
        {},
        cacheKey,
        CONFIG.CACHE_DURATION.UFC_RANKINGS,
        {
          'X-RapidAPI-Key': CONFIG.API_KEY,
          'X-RapidAPI-Host': CONFIG.ENDPOINTS.UFC_FIGHTERS_HOST
        }
      );

      return DataProcessor.processUFCRankings(data);
    } catch (error) {
      console.error(`Error fetching UFC rankings for ${weightClass || 'all'}:`, error);

      // Return fallback data using static champions from config
      const fallbackResponse = [];

      if (weightClass) {
        // Return specific weight class
        const champion = CONFIG.getUFCChampion(weightClass);
        if (champion) {
          fallbackResponse.push({
            weight_class: weightClass,
            champion: champion,
            contenders: {}
          });
        }
      } else {
        // Return all weight classes
        Object.entries(CONFIG.UFC.CHAMPIONS).forEach(([weightClass, champion]) => {
          fallbackResponse.push({
            weight_class: weightClass,
            champion: champion,
            contenders: {}
          });
        });
      }

      return DataProcessor.processUFCRankings(fallbackResponse);
    }
  },

  /**
   * Search for UFC fighters
   * 
   * @param {string} query - Search query
   * @returns {Promise<Array>} - List of fighters
   */
  async searchUFCFighter(query) {
    if (!query || query.length < 2) {
      throw new Error('Search query must be at least 2 characters');
    }

    const cacheKey = `ufc_fighter_search_${query.toLowerCase()}`;

    try {
      const data = await this.fetchWithCache(
        `${CONFIG.ENDPOINTS.UFC_FIGHTER_SEARCH}/${encodeURIComponent(query)}`,
        {},
        cacheKey,
        CONFIG.CACHE_DURATION.UFC_FIGHTERS,
        {
          'X-RapidAPI-Key': CONFIG.API_KEY,
          'X-RapidAPI-Host': CONFIG.ENDPOINTS.UFC_FIGHTERS_HOST
        }
      );

      return DataProcessor.processFighterData(data);
    } catch (error) {
      console.error(`Error searching UFC fighters for "${query}":`, error);
      return [];
    }
  },

  /**
   * Get UFC upcoming events
   * 
   * @returns {Promise<Array>} - List of upcoming events
   */
  async getUFCEvents() {
    const cacheKey = 'ufc_events';

    try {
      const data = await this.fetchWithCache(
        CONFIG.ENDPOINTS.UFC_TOURNAMENTS,
        CONFIG.UFC.TOURNAMENTS_PARAMS,
        cacheKey,
        CONFIG.CACHE_DURATION.UFC_TOURNAMENTS,
        {
          'X-RapidAPI-Key': CONFIG.API_KEY,
          'X-RapidAPI-Host': CONFIG.ENDPOINTS.UFC_TOURNAMENTS_HOST
        }
      );

      return DataProcessor.processTournaments(data);
    } catch (error) {
      console.error('Error fetching UFC events:', error);

      // Return fallback data from config
      return CONFIG.UFC.UPCOMING_EVENTS.map(event => ({
        id: event.id,
        name: event.name,
        mainEvent: event.mainEvent,
        location: event.location,
        startDate: event.date,
        sportName: 'UFC'
      }));
    }
  },

  /**
   * Get UFC betting markets
   * 
   * @returns {Promise<Array>} - List of betting markets
   */
  async getUFCMarkets() {
    const cacheKey = 'ufc_markets';

    try {
      const data = await this.fetchWithCache(
        CONFIG.ENDPOINTS.UFC_SPECIAL_MARKETS,
        CONFIG.UFC.SPECIAL_MARKETS_PARAMS,
        cacheKey,
        CONFIG.CACHE_DURATION.UFC_MARKETS,
        {
          'X-RapidAPI-Key': CONFIG.API_KEY,
          'X-RapidAPI-Host': CONFIG.ENDPOINTS.UFC_ODDS_HOST
        }
      );

      return DataProcessor.processSpecialMarkets(data);
    } catch (error) {
      console.error('Error fetching UFC markets:', error);
      return [];
    }
  },

  // ========== FORMULA 1 API METHODS ==========

  /**
   * Get F1 races for a specific season
   * 
   * @param {number} season - Season year
   * @returns {Promise<Array>} - List of races
   */
  async getF1Races(season = CONFIG.F1.CURRENT_SEASON) {
    const cacheKey = `f1_races_${season}`;

    try {
      const data = await this.fetchWithCache(
        `${CONFIG.ENDPOINTS.F1_RACES}?season=${season}`,
        {},
        cacheKey,
        CONFIG.CACHE_DURATION.F1_SCHEDULE,
        {
          'X-RapidAPI-Key': CONFIG.API_KEY,
          'X-RapidAPI-Host': CONFIG.ENDPOINTS.F1_HOST
        }
      );

      return DataProcessor.processF1Races(data);
    } catch (error) {
      console.error(`Error fetching F1 races for season ${season}:`, error);

      // Return fallback data from config
      return CONFIG.F1.UPCOMING_RACES.map(race => ({
        round: 0,
        name: race.name,
        circuit: race.circuit,
        date: race.date,
        completed: false
      }));
    }
  },

  /**
   * Get F1 driver standings
   * 
   * @param {number} season - Season year
   * @returns {Promise<Array>} - Driver standings
   */
  async getF1DriverStandings(season = CONFIG.F1.CURRENT_SEASON) {
    const cacheKey = `f1_driver_standings_${season}`;

    try {
      const data = await this.fetchWithCache(
        `${CONFIG.ENDPOINTS.F1_DRIVERS}/standings?season=${season}`,
        {},
        cacheKey,
        CONFIG.CACHE_DURATION.F1_STANDINGS,
        {
          'X-RapidAPI-Key': CONFIG.API_KEY,
          'X-RapidAPI-Host': CONFIG.ENDPOINTS.F1_HOST
        }
      );

      return DataProcessor.processF1DriverStandings(data);
    } catch (error) {
      console.error(`Error fetching F1 driver standings for season ${season}:`, error);
      return [];
    }
  },

  /**
   * Get F1 constructor standings
   * 
   * @param {number} season - Season year
   * @returns {Promise<Array>} - Constructor standings
   */
  async getF1ConstructorStandings(season = CONFIG.F1.CURRENT_SEASON) {
    const cacheKey = `f1_constructor_standings_${season}`;

    try {
      const data = await this.fetchWithCache(
        `${CONFIG.ENDPOINTS.F1_CONSTRUCTORS}/standings?season=${season}`,
        {},
        cacheKey,
        CONFIG.CACHE_DURATION.F1_STANDINGS,
        {
          'X-RapidAPI-Key': CONFIG.API_KEY,
          'X-RapidAPI-Host': CONFIG.ENDPOINTS.F1_HOST
        }
      );

      return DataProcessor.processF1ConstructorStandings(data);
    } catch (error) {
      console.error(`Error fetching F1 constructor standings for season ${season}:`, error);
      return [];
    }
  },

  /**
   * Get F1 race results
   * 
   * @param {number} raceId - Race ID
   * @param {number} season - Season year
   * @returns {Promise<Array>} - Race results
   */
  async getF1RaceResults(raceId, season = CONFIG.F1.CURRENT_SEASON) {
    if (!raceId) {
      throw new Error('Race ID is required');
    }

    const cacheKey = `f1_race_results_${season}_${raceId}`;

    try {
      const data = await this.fetchWithCache(
        `${CONFIG.ENDPOINTS.F1_RESULTS}?race=${raceId}&season=${season}`,
        {},
        cacheKey,
        CONFIG.CACHE_DURATION.F1_RESULTS,
        {
          'X-RapidAPI-Key': CONFIG.API_KEY,
          'X-RapidAPI-Host': CONFIG.ENDPOINTS.F1_HOST
        }
      );

      return DataProcessor.processF1RaceResults(data);
    } catch (error) {
      console.error(`Error fetching F1 race results for race ${raceId}, season ${season}:`, error);
      return [];
    }
  },

  // ========== NEWS AND TRENDING API METHODS ==========

  /**
   * Get sports news
   * 
   * @param {string} keyword - Keyword to search for
   * @param {number} limit - Maximum number of articles to return
   * @returns {Promise<Object>} - News data
   */
  async getSportsNews(keyword = '', limit = 10) {
    const params = { limit };
    if (keyword) {
      params.q = keyword;
    }

    const cacheKey = `news_${keyword || 'latest'}_${limit}`;

    try {
      const data = await this.fetchWithCache(
        CONFIG.ENDPOINTS.NEWS_HEADLINES,
        params,
        cacheKey,
        CONFIG.CACHE_DURATION.NEWS,
        {
          'X-RapidAPI-Key': CONFIG.API_KEY,
          'X-RapidAPI-Host': CONFIG.ENDPOINTS.NEWS_HOST
        }
      );

      return data;
    } catch (error) {
      console.error(`Error fetching sports news for "${keyword || 'latest'}":`, error);
      return { articles: [] };
    }
  },

  /**
   * Get trending keywords
   * 
   * @param {number} limit - Maximum number of keywords to return
   * @returns {Promise<Object>} - Trending keywords
   */
  async getTrendingKeywords(limit = 10) {
    const cacheKey = `trending_${limit}`;

    try {
      const data = await this.fetchWithCache(
        CONFIG.ENDPOINTS.TRENDING_TOPICS,
        { limit },
        cacheKey,
        CONFIG.CACHE_DURATION.TRENDING,
        {
          'X-RapidAPI-Key': CONFIG.API_KEY,
          'X-RapidAPI-Host': CONFIG.ENDPOINTS.TRENDING_HOST
        }
      );

      return data;
    } catch (error) {
      console.error('Error fetching trending keywords:', error);

      // Return fallback data based on sports keywords
      return {
        topics: CONFIG.BLOG.PRIORITY_KEYWORDS.slice(0, limit)
      };
    }
  },

  /**
   * Search Twitter for sports tweets
   * 
   * @param {string} query - Search query
   * @param {number} count - Maximum number of tweets to return
   * @returns {Promise<Object>} - Twitter search results
   */
  async searchTwitter(query, count = 10) {
    if (!query) {
      throw new Error('Search query is required');
    }

    const cacheKey = `twitter_${query.toLowerCase()}_${count}`;

    try {
      const data = await this.fetchWithCache(
        CONFIG.ENDPOINTS.TWITTER_SEARCH,
        { q: query, count },
        cacheKey,
        CONFIG.CACHE_DURATION.TWEETS,
        {
          'X-RapidAPI-Key': CONFIG.API_KEY,
          'X-RapidAPI-Host': CONFIG.ENDPOINTS.TWITTER_HOST
        }
      );

      return data;
    } catch (error) {
      console.error(`Error searching Twitter for "${query}":`, error);
      return { statuses: [] };
    }
  },

  // ========== BLOG GENERATION METHODS ==========

  /**
   * Generate automated blog posts
   * 
   * @param {number} count - Number of posts to generate
   * @returns {Promise<Array>} - Generated blog posts
   */
  async generateAutomatedBlogPosts(count = CONFIG.BLOG.POSTS_PER_DAY) {
    try {
      // Get trending keywords
      const trendingData = await this.getTrendingKeywords(count * 2);
      let keywords = [];

      if (trendingData && trendingData.topics && trendingData.topics.length) {
        keywords = trendingData.topics
          .map(topic => typeof topic === 'string' ? topic : (topic.name || ''))
          .filter(keyword => keyword.length > 0);
      }

      // If no keywords from API, use default ones
      if (keywords.length === 0) {
        keywords = CONFIG.BLOG.PRIORITY_KEYWORDS;
      }

      // Prioritize sports-related keywords
      keywords.sort((a, b) => {
        const isSportsRelatedA = CONFIG.BLOG.PRIORITY_KEYWORDS.some(k =>
          a.toLowerCase().includes(k.toLowerCase()));
        const isSportsRelatedB = CONFIG.BLOG.PRIORITY_KEYWORDS.some(k =>
          b.toLowerCase().includes(k.toLowerCase()));

        if (isSportsRelatedA && !isSportsRelatedB) return -1;
        if (!isSportsRelatedA && isSportsRelatedB) return 1;
        return 0;
      });

      // Limit to requested count
      keywords = keywords.slice(0, count);

      // Generate posts from keywords
      const posts = [];

      for (const keyword of keywords) {
        // Get news related to this keyword
        const newsData = await this.getSportsNews(keyword, 1);

        if (newsData && newsData.articles && newsData.articles.length > 0) {
          // Generate post from news item
          const post = DataProcessor.generateBlogPost(newsData.articles[0], keyword);

          if (post) {
            posts.push(post);
          }
        }
      }

      return posts;
    } catch (error) {
      console.error('Error generating automated blog posts:', error);
      return [];
    }
  },

  // ========== REMINDER SYSTEM METHODS ==========

  /**
   * Set reminder for event
   * 
   * @param {string} eventId - Event ID
   * @param {string} eventName - Event name
   * @param {Date|string} eventDate - Event date
   * @param {string} eventType - Event type (ufc, football, f1)
   * @param {number} minutesBefore - Minutes before to remind
   * @returns {boolean} - Whether reminder was set successfully
   */
  setEventReminder(eventId, eventName, eventDate, eventType, minutesBefore = null) {
    return CONFIG.setEventReminder(eventId, eventName, eventDate, eventType, minutesBefore);
  },

  /**
   * Get user reminders
   * 
   * @returns {Array} - User reminders
   */
  getUserReminders() {
    try {
      const remindersJson = localStorage.getItem(CONFIG.REMINDERS.STORAGE_KEY);
      return remindersJson ? JSON.parse(remindersJson) : [];
    } catch (error) {
      console.error('Error getting user reminders:', error);
      return [];
    }
  },

  /**
   * Delete reminder
   * 
   * @param {string} reminderId - Reminder ID
   * @returns {boolean} - Whether reminder was deleted successfully
   */
  deleteReminder(reminderId) {
    try {
      const reminders = this.getUserReminders();
      const updatedReminders = reminders.filter(r => r.id !== reminderId);

      if (updatedReminders.length === reminders.length) {
        // No reminder found with this ID
        return false;
      }

      // Save updated reminders
      localStorage.setItem(CONFIG.REMINDERS.STORAGE_KEY, JSON.stringify(updatedReminders));
      return true;
    } catch (error) {
      console.error('Error deleting reminder:', error);
      return false;
    }
  },

  /**
   * Get F1 calendar
   * @param {number} season - Season year (defaults to current year)
   * @returns {Promise<Array>} - F1 race calendar
   */
  getF1Calendar(season = new Date().getFullYear()) {
    const cacheKey = `f1_calendar_${season}`;
    
    // Check cache first
    const cachedData = this.dataCache.get(cacheKey);
    if (cachedData) {
      return Promise.resolve(cachedData);
    }
    
    const endpoint = `${CONFIG.ENDPOINTS.BASE_URL}${CONFIG.ENDPOINTS.F1_CALENDAR}?season=${season}`;
    const options = {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': CONFIG.API.KEY,
        'X-RapidAPI-Host': CONFIG.ENDPOINTS.F1_HOST
      }
    };
    
    return this.fetchWithRetry(endpoint, options)
      .then(data => {
        // Process F1 calendar data
        const processedData = DataProcessor.processF1Calendar(data);
        
        // Cache the processed data
        this.dataCache.set(cacheKey, processedData, CONFIG.API.CACHE_DURATION);
        
        return processedData;
      })
      .catch(error => {
        console.error('Error fetching F1 calendar:', error);
        
        // Return dummy data as fallback
        return this.getDummyF1Calendar(season);
      });
  },

  /**
   * Get F1 driver standings
   * @param {number} season - Season year (defaults to current year)
   * @returns {Promise<Array>} - Driver standings
   */
  getF1DriverStandings(season = new Date().getFullYear()) {
    const cacheKey = `f1_driver_standings_${season}`;
    
    // Check cache first
    const cachedData = this.dataCache.get(cacheKey);
    if (cachedData) {
      return Promise.resolve(cachedData);
    }
    
    const endpoint = `${CONFIG.ENDPOINTS.BASE_URL}${CONFIG.ENDPOINTS.F1_DRIVER_STANDINGS}?season=${season}`;
    const options = {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': CONFIG.API.KEY,
        'X-RapidAPI-Host': CONFIG.ENDPOINTS.F1_HOST
      }
    };
    
    return this.fetchWithRetry(endpoint, options)
      .then(data => {
        // Process F1 driver standings data
        const processedData = DataProcessor.processF1DriverStandings(data);
        
        // Cache the processed data
        this.dataCache.set(cacheKey, processedData, CONFIG.API.CACHE_DURATION);
        
        return processedData;
      })
      .catch(error => {
        console.error('Error fetching F1 driver standings:', error);
        
        // Return dummy data as fallback
        return this.getDummyF1DriverStandings(season);
      });
  },

  /**
   * Get F1 constructor standings
   * @param {number} season - Season year (defaults to current year)
   * @returns {Promise<Array>} - Constructor standings
   */
  getF1ConstructorStandings(season = new Date().getFullYear()) {
    const cacheKey = `f1_constructor_standings_${season}`;
    
    // Check cache first
    const cachedData = this.dataCache.get(cacheKey);
    if (cachedData) {
      return Promise.resolve(cachedData);
    }
    
    const endpoint = `${CONFIG.ENDPOINTS.BASE_URL}${CONFIG.ENDPOINTS.F1_CONSTRUCTOR_STANDINGS}?season=${season}`;
    const options = {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': CONFIG.API.KEY,
        'X-RapidAPI-Host': CONFIG.ENDPOINTS.F1_HOST
      }
    };
    
    return this.fetchWithRetry(endpoint, options)
      .then(data => {
        // Process F1 constructor standings data
        const processedData = DataProcessor.processF1ConstructorStandings(data);
        
        // Cache the processed data
        this.dataCache.set(cacheKey, processedData, CONFIG.API.CACHE_DURATION);
        
        return processedData;
      })
      .catch(error => {
        console.error('Error fetching F1 constructor standings:', error);
        
        // Return dummy data as fallback
        return this.getDummyF1ConstructorStandings(season);
      });
  }
};

// Initialize the API service when imported
ApiService.init();

// Export the API service
export default ApiService;