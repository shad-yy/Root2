/**
 * SMART Live TV - Core Application
 * 
 * This file serves as the main entry point for the application,
 * connecting the UI components with the data layer.
 * It manages the application state and orchestrates data flow.
 */

import CONFIG from './config.js';
import ApiService from './api-service.js';
import app from './main.js';

// Import optional services if available
let BlogService;
try {
  BlogService = (await import('./blog-service.js')).default;
} catch (e) {
  console.warn('Blog service not available:', e);
}

/**
 * SportsApp - Main application controller
 * 
 * Connects all the parts of the application and provides 
 * a simple interface for page-specific scripts.
 */
class SportsApp {
  constructor() {
    // Reference to main app instance
    this.app = app;
    
    // Initialize services
    this.initServices();
    
    // Log initialization
    console.log('SportsApp initialized with services');
  }
  
  /**
   * Initialize all services
   */
  initServices() {
    // Initialize BlogService if available
    if (BlogService && typeof BlogService.init === 'function') {
      BlogService.init();
    }
  }
  
  /**
   * Load home page data
   */
  loadHomePageData() {
    return this.app.loadHomePageData();
  }
  
  /**
   * Switch to a different football league
   * @param {Object} league - League configuration
   */
  switchLeague(league) {
    return this.app.switchLeague(league);
  }
  
  /**
   * Load football page data
   */
  loadFootballPageData() {
    return this.app.loadFootballPageData();
  }
  
  /**
   * Load UFC page data
   * @param {string} weightClass - Weight class to filter by
   */
  loadUFCPageData(weightClass) {
    return this.app.loadUFCPageData(weightClass);
  }
  
  /**
   * Load F1 page data
   * @param {number} season - Season year
   */
  loadF1PageData(season) {
    return this.app.loadF1PageData(season);
  }
  
  /**
   * Load team page data
   * @param {number} teamId - Team ID
   */
  loadTeamPageData(teamId) {
    return this.app.loadTeamData(teamId);
  }
  
  /**
   * Set a reminder for an event
   * @param {string} eventId - Event ID
   * @param {string} eventName - Event name
   * @param {Date|string} eventDate - Event date
   * @param {string} eventType - Event type (football, ufc, f1, etc.)
   * @param {number} minutesBefore - Minutes before to remind (optional)
   * @returns {boolean} - Success status
   */
  setEventReminder(eventId, eventName, eventDate, eventType, minutesBefore) {
    return ApiService.setEventReminder(eventId, eventName, eventDate, eventType, minutesBefore);
  }
  
  /**
   * Search for a UFC fighter
   * @param {string} query - Search query
   * @returns {Promise<Array>} - Search results
   */
  searchFighter(query) {
    return ApiService.searchUFCFighter(query);
  }
  
  /**
   * Get the next big sporting event
   * @returns {Object|null} - Next event or null if none
   */
  getNextBigEvent() {
    return CONFIG.getNextBigEvent();
  }
  
  /**
   * Show a notification to the user
   * @param {string} message - Notification message
   * @param {string} type - Notification type (success, error, info)
   */
  showNotification(message, type) {
    return this.app.showNotification(message, type);
  }
  
  /**
   * Check API status
   * @returns {Object} - API status object
   */
  checkApiStatus() {
    return ApiService.checkApiStatus();
  }
  
  /**
   * Get F1 calendar
   * @returns {Promise<Array>} - F1 race calendar
   */
  getF1Calendar() {
    return ApiService.getF1Calendar();
  }
  
  /**
   * Get F1 driver standings
   * @param {number} season - Season year
   * @returns {Promise<Array>} - Driver standings
   */
  getF1DriverStandings(season) {
    return ApiService.getF1DriverStandings(season);
  }
  
  /**
   * Get F1 constructor standings
   * @param {number} season - Season year
   * @returns {Promise<Array>} - Constructor standings
   */
  getF1ConstructorStandings(season) {
    return ApiService.getF1ConstructorStandings(season);
  }
  
  /**
   * Get F1 race results
   * @param {string} raceId - Race ID
   * @param {number} season - Season year
   * @returns {Promise<Object>} - Race results
   */
  getF1RaceResults(raceId, season) {
    return ApiService.getF1RaceResults(raceId, season);
  }
}

// Create and export singleton instance
const instance = new SportsApp();
export default instance;