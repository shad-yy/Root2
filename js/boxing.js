/**
 * SMART Live TV - Boxing Page Script
 * 
 * Handles all boxing page specific functionality including:
 * - Loading live matches
 * - Displaying upcoming fights
 * - Showing weight class rankings
 * - Boxing news
 */

import CONFIG from './config.js';
import ApiService from './api-service.js';
import ReminderService from './reminder-service.js';
import BlogService from './blog-service.js';
import ErrorHandler from './error-handler.js';

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  console.log('Boxing page initializing...');
  initBoxingPage();
});

/**
 * Initialize boxing page
 */
function initBoxingPage() {
  // Initialize UI components
  initMobileMenu();
  initWeightClassFilter();
  
  // Load data
  loadLiveMatches();
  loadUpcomingFights();
  loadRankings();
  loadBoxingNews();
}

/**
 * Initialize mobile menu
 */
function initMobileMenu() {
  const menuButton = document.querySelector('.mobile-menu-btn');
  const mobileMenu = document.querySelector('.mobile-menu');
  
  if (menuButton && mobileMenu) {
    // Toggle mobile menu
    menuButton.addEventListener('click', function() {
      mobileMenu.classList.toggle('active');
      menuButton.classList.toggle('active');
    });
    
    // Close menu when clicking outside
    document.addEventListener('click', function(event) {
      if (mobileMenu.classList.contains('active') && 
          !mobileMenu.contains(event.target) && 
          !menuButton.contains(event.target)) {
        mobileMenu.classList.remove('active');
        menuButton.classList.remove('active');
      }
    });
  }
}

/**
 * Initialize weight class filter
 */
function initWeightClassFilter() {
  const weightClassFilter = document.getElementById('weight-class-filter');
  
  if (weightClassFilter) {
    weightClassFilter.addEventListener('change', function() {
      const selectedWeightClass = this.value;
      loadRankings(selectedWeightClass);
    });
  }
}

/**
 * Load live boxing matches
 */
async function loadLiveMatches() {
  const container = document.getElementById('live-match-container');
  if (!container) return;
  
  try {
    const liveMatches = await ApiService.getLiveMatches('boxing');
    
    // Clear loading spinner
    container.innerHTML = '';
    
    // Check if there are any live matches
    if (!liveMatches || liveMatches.length === 0) {
      container.innerHTML = `
        <div class="no-data-message">
          <i class="fas fa-info-circle"></i>
          <p>No live boxing matches at the moment.</p>
          <p>Check the upcoming fights section for the next scheduled events.</p>
        </div>
      `;
      return;
    }
    
    // Display live matches
    liveMatches.forEach(match => {
      container.innerHTML += `
        <div class="live-match-card" data-match-id="${match.id}">
          <div class="live-indicator">
            <span class="pulse"></span>
            <span class="live-text">LIVE</span>
          </div>
          
          <div class="match-header">
            <span class="match-title">${match.title}</span>
            <span class="match-venue">${match.venue}</span>
          </div>
          
          <div class="match-fighters">
            <div class="fighter fighter-red">
              <div class="fighter-image">
                <img src="${match.redCorner.image}" alt="${match.redCorner.name}">
              </div>
              <div class="fighter-info">
                <h3 class="fighter-name">${match.redCorner.name}</h3>
                <span class="fighter-record">${match.redCorner.record}</span>
              </div>
            </div>
            
            <div class="match-status">
              <div class="round-info">
                <span class="current-round">${match.currentRound}</span>
                <span class="total-rounds">/${match.totalRounds}</span>
              </div>
            </div>
            
            <div class="fighter fighter-blue">
              <div class="fighter-image">
                <img src="${match.blueCorner.image}" alt="${match.blueCorner.name}">
              </div>
              <div class="fighter-info">
                <h3 class="fighter-name">${match.blueCorner.name}</h3>
                <span class="fighter-record">${match.blueCorner.record}</span>
              </div>
            </div>
          </div>
          
          <div class="match-footer">
            <a href="#" class="watch-now-btn">Watch Now</a>
          </div>
        </div>
      `;
    });
    
    // Add click event to watch buttons
    const watchButtons = container.querySelectorAll('.watch-now-btn');
    watchButtons.forEach(button => {
      button.addEventListener('click', function(e) {
        e.preventDefault();
        const matchId = this.closest('.live-match-card').dataset.matchId;
        window.location.href = `/main/watch.html?id=${matchId}&sport=boxing`;
      });
    });
  } catch (error) {
    ErrorHandler.logError('load_live_boxing_matches', error);
    container.innerHTML = `
      <div class="error-message">
        <i class="fas fa-exclamation-circle"></i>
        <p>There was an error loading live matches.</p>
        <button class="retry-btn" onclick="loadLiveMatches()">Retry</button>
      </div>
    `;
  }
}

/**
 * Load upcoming boxing fights
 */
async function loadUpcomingFights() {
  const container = document.getElementById('upcoming-events');
  if (!container) return;
  
  try {
    const upcomingFights = await ApiService.getUpcomingMatches('boxing', 6);
    
    // Clear loading spinner
    container.innerHTML = '';
    
    // Check if there are any upcoming fights
    if (!upcomingFights || upcomingFights.length === 0) {
      container.innerHTML = `
        <div class="no-data-message">
          <i class="fas fa-info-circle"></i>
          <p>No upcoming boxing fights scheduled at the moment.</p>
        </div>
      `;
      return;
    }
    
    // Display upcoming fights
    upcomingFights.forEach(fight => {
      const fightDate = new Date(fight.date);
      const formattedDate = fightDate.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      
      const formattedTime = fightDate.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
      
      container.innerHTML += `
        <div class="event-card">
          <div class="event-date">
            <span class="event-day">${fightDate.getDate()}</span>
            <span class="event-month">${fightDate.toLocaleDateString('en-US', { month: 'short' })}</span>
          </div>
          
          <div class="event-details">
            <h3 class="event-title">${fight.title}</h3>
            <div class="event-meta">
              <span class="event-time"><i class="far fa-clock"></i> ${formattedTime}</span>
              <span class="event-location"><i class="fas fa-map-marker-alt"></i> ${fight.venue}</span>
            </div>
            
            <div class="event-fighters">
              <div class="event-fighter">
                <span class="fighter-name">${fight.redCorner.name}</span>
                <span class="fighter-record">${fight.redCorner.record}</span>
              </div>
              <span class="vs">vs</span>
              <div class="event-fighter">
                <span class="fighter-name">${fight.blueCorner.name}</span>
                <span class="fighter-record">${fight.blueCorner.record}</span>
              </div>
            </div>
            
            <div class="event-actions">
              <button class="reminder-btn" onclick="setEventReminder('${fight.id}', '${fight.title}', '${fight.date}')">
                <i class="far fa-bell"></i> Set Reminder
              </button>
              <button class="info-btn" data-fight-id="${fight.id}">
                <i class="fas fa-info-circle"></i> More Info
              </button>
            </div>
          </div>
        </div>
      `;
    });
    
    // Add click events to more info buttons
    const infoButtons = container.querySelectorAll('.info-btn');
    infoButtons.forEach(button => {
      button.addEventListener('click', function() {
        const fightId = this.dataset.fightId;
        window.location.href = `/main/boxing-fight.html?id=${fightId}`;
      });
    });
  } catch (error) {
    ErrorHandler.logError('load_upcoming_boxing_fights', error);
    container.innerHTML = `
      <div class="error-message">
        <i class="fas fa-exclamation-circle"></i>
        <p>There was an error loading upcoming fights.</p>
        <button class="retry-btn" onclick="loadUpcomingFights()">Retry</button>
      </div>
    `;
  }
}

/**
 * Load boxing rankings
 * @param {string} weightClass - Weight class to show rankings for
 */
async function loadRankings(weightClass = 'heavyweight') {
  const container = document.getElementById('rankings-container');
  if (!container) return;
  
  try {
    // Show loading state
    container.innerHTML = `
      <div class="loading-spinner">
        <i class="fas fa-spinner fa-spin"></i>
        <span>Loading rankings...</span>
      </div>
    `;
    
    const rankings = await ApiService.request(`boxing/rankings/${weightClass}`);
    
    // Clear loading spinner
    container.innerHTML = '';
    
    // Check if there are rankings
    if (!rankings || !rankings.fighters || rankings.fighters.length === 0) {
      container.innerHTML = `
        <div class="no-data-message">
          <i class="fas fa-info-circle"></i>
          <p>No rankings available for this weight class.</p>
        </div>
      `;
      return;
    }
    
    // Display champion
    if (rankings.champion) {
      container.innerHTML += `
        <div class="champion-card">
          <div class="champion-badge">
            <i class="fas fa-crown"></i> CHAMPION
          </div>
          
          <div class="champion-image">
            <img src="${rankings.champion.image}" alt="${rankings.champion.name}">
          </div>
          
          <div class="champion-info">
            <h3 class="champion-name">${rankings.champion.name}</h3>
            <span class="champion-record">${rankings.champion.record}</span>
            <span class="champion-country">${rankings.champion.country}</span>
          </div>
        </div>
      `;
    }
    
    // Create rankings table
    let rankingsHTML = `
      <table class="rankings-table">
        <thead>
          <tr>
            <th>Rank</th>
            <th>Fighter</th>
            <th>Record</th>
            <th>Last Fight</th>
          </tr>
        </thead>
        <tbody>
    `;
    
    // Add fighters
    rankings.fighters.forEach((fighter, index) => {
      rankingsHTML += `
        <tr>
          <td class="fighter-rank">${index + 1}</td>
          <td class="fighter-name-cell">
            <div class="fighter-profile">
              <div class="profile-img">
                <img src="${fighter.image}" alt="${fighter.name}">
              </div>
              <div class="profile-info">
                <span class="fighter-name">${fighter.name}</span>
                <span class="fighter-country">${fighter.country}</span>
              </div>
            </div>
          </td>
          <td class="fighter-record">${fighter.record}</td>
          <td class="fighter-last-fight">${fighter.lastFight}</td>
        </tr>
      `;
    });
    
    rankingsHTML += `
        </tbody>
      </table>
    `;
    
    // Add rankings to container
    container.innerHTML += rankingsHTML;
  } catch (error) {
    ErrorHandler.logError('load_boxing_rankings', error, { weightClass });
    container.innerHTML = `
      <div class="error-message">
        <i class="fas fa-exclamation-circle"></i>
        <p>There was an error loading rankings.</p>
        <button class="retry-btn" onclick="loadRankings('${weightClass}')">Retry</button>
      </div>
    `;
  }
}

/**
 * Load boxing news
 */
async function loadBoxingNews() {
  const container = document.getElementById('news-container');
  if (!container) return;
  
  try {
    const newsArticles = await BlogService.getPostsByCategory('boxing', 1, 6);
    
    // Clear loading spinner
    container.innerHTML = '';
    
    // Check if there are any news articles
    if (!newsArticles || newsArticles.length === 0) {
      container.innerHTML = `
        <div class="no-data-message">
          <i class="fas fa-info-circle"></i>
          <p>No boxing news available at the moment.</p>
        </div>
      `;
      return;
    }
    
    // Display news articles
    newsArticles.forEach(article => {
      container.innerHTML += BlogService.generatePostCardHTML(article);
    });
  } catch (error) {
    ErrorHandler.logError('load_boxing_news', error);
    container.innerHTML = `
      <div class="error-message">
        <i class="fas fa-exclamation-circle"></i>
        <p>There was an error loading news.</p>
        <button class="retry-btn" onclick="loadBoxingNews()">Retry</button>
      </div>
    `;
  }
}

/**
 * Set event reminder
 * @param {string} id - Event ID
 * @param {string} title - Event title
 * @param {string} time - Event time
 */
function setEventReminder(id, title, time) {
  const event = {
    id: id,
    title: title,
    time: time
  };
  
  ReminderService.setReminder(event);
  ReminderService.showConfirmation(title, 30);
}

// Export functions that need to be available globally
window.setEventReminder = setEventReminder;
window.loadRankings = loadRankings;
window.loadUpcomingFights = loadUpcomingFights;
window.loadBoxingNews = loadBoxingNews;
window.loadLiveMatches = loadLiveMatches; 