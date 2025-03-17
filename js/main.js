/**
 * SMART Live TV - Main JavaScript
 * 
 * Handles all front-end functionality including:
 * - Mobile menu
 * - UI interactions
 * - Page-specific behaviors
 */

// Import dependencies
import CONFIG from './config.js';
import ApiService from './api-service.js';
import ErrorHandler from './error-handler.js';

// Main initialization function
document.addEventListener('DOMContentLoaded', function() {
  console.log('SMART Live TV - Initializing site...');
  initializeSite();
});

/**
 * Initialize the site
 */
function initializeSite() {
  // Set up mobile menu
  setupMobileMenu();
  
  // Set up dark mode toggle
  setupDarkModeToggle();
  
  // Set up page-specific behaviors
  setupPageSpecificBehaviors();
  
  // Set up category buttons on homepage
  setupCategoryButtons();
  
  // Set up event promotion
  updateEventPromotion();
  
  // Set up reminder buttons
  setupReminderButtons();
  
  console.log('Site initialization complete');
}

/**
 * Set up mobile menu
 */
function setupMobileMenu() {
  const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
  const mobileMenu = document.querySelector('.mobile-menu');
  const mobileMenuClose = document.querySelector('.mobile-menu-close');
  
  if (mobileMenuBtn && mobileMenu) {
    mobileMenuBtn.addEventListener('click', function() {
      mobileMenu.classList.add('active');
      document.body.style.overflow = 'hidden';
    });
    
    if (mobileMenuClose) {
      mobileMenuClose.addEventListener('click', function() {
        mobileMenu.classList.remove('active');
        document.body.style.overflow = '';
      });
    }
    
    // Close menu when clicking outside
    document.addEventListener('click', function(event) {
      if (mobileMenu.classList.contains('active') && 
          !mobileMenu.contains(event.target) && 
          event.target !== mobileMenuBtn) {
        mobileMenu.classList.remove('active');
        document.body.style.overflow = '';
      }
    });
  }
}

/**
 * Set up dark mode toggle
 */
function setupDarkModeToggle() {
  const darkModeToggle = document.querySelector('.dark-mode-toggle');
  
  if (darkModeToggle) {
    // Check for saved theme preference or use device preference
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      document.documentElement.setAttribute('data-theme', 'dark');
      darkModeToggle.classList.add('active');
    }
    
    // Toggle dark mode on click
    darkModeToggle.addEventListener('click', function() {
      if (document.documentElement.getAttribute('data-theme') === 'dark') {
        document.documentElement.setAttribute('data-theme', 'light');
        localStorage.setItem('theme', 'light');
        darkModeToggle.classList.remove('active');
      } else {
        document.documentElement.setAttribute('data-theme', 'dark');
        localStorage.setItem('theme', 'dark');
        darkModeToggle.classList.add('active');
      }
    });
  }
}

/**
 * Set up category buttons on homepage
 */
function setupCategoryButtons() {
  const sportCategoryButtons = document.querySelectorAll('.category');
  const contentSections = document.querySelectorAll('.content-section');
  
  if (sportCategoryButtons.length > 0) {
    console.log('Setting up category buttons:', sportCategoryButtons.length);
    
    // Set first category as active by default
    if (!document.querySelector('.category.active')) {
      sportCategoryButtons[0].classList.add('active');
      const defaultCategory = sportCategoryButtons[0].getAttribute('data-category');
      
      // Show corresponding content section
      contentSections.forEach(section => {
        if (section.getAttribute('data-category') === defaultCategory) {
          section.classList.add('active');
        } else {
          section.classList.remove('active');
        }
      });
    }
    
    // Add click event listeners to category buttons
    sportCategoryButtons.forEach(button => {
      button.addEventListener('click', function() {
        console.log('Category button clicked:', this.getAttribute('data-category'));
        
        // Remove active class from all buttons
        sportCategoryButtons.forEach(btn => btn.classList.remove('active'));
        
        // Add active class to clicked button
        this.classList.add('active');
        
        // Get category from data attribute
        const category = this.getAttribute('data-category');
        
        // Show corresponding content section
        contentSections.forEach(section => {
          if (section.getAttribute('data-category') === category) {
            section.classList.add('active');
          } else {
            section.classList.remove('active');
          }
        });
        
        // Load content for selected category
        if (category === 'football') {
          loadMatchSchedule('football', 'match-schedule');
          loadLeagueStandings('39', 'league-standings');
        } else if (category === 'ufc') {
          loadMatchSchedule('ufc', 'match-schedule');
        } else if (category === 'f1') {
          loadMatchSchedule('f1', 'match-schedule');
        } else if (category === 'boxing') {
          loadMatchSchedule('boxing', 'match-schedule');
        }
      });
    });
    
    // Trigger click on default category to load content
    const activeCategory = document.querySelector('.category.active');
    if (activeCategory) {
      activeCategory.click();
    } else if (sportCategoryButtons[0]) {
      sportCategoryButtons[0].click();
    }
  }
}

/**
 * Set up page-specific behaviors
 */
function setupPageSpecificBehaviors() {
  // Get current page path
  const path = window.location.pathname;
  
  console.log('Current page path:', path);
  
  // Set up specific page behaviors based on URL
  if (path.includes('/football') || path === '/' || path.endsWith('/main/') || path.endsWith('/main/index.html')) {
    setupFootballPage();
  } else if (path.includes('/ufc')) {
    setupUFCPage();
  } else if (path.includes('/f1')) {
    setupF1Page();
  } else if (path.includes('/team')) {
    setupTeamPage();
  } else if (path.includes('/blog')) {
    setupBlogPage();
  }
  
  // Set up shop redirect tracking
  setupShopRedirectTracking();
}

/**
 * Football page specific setup
 */
function setupFootballPage() {
  console.log('Setting up football page');
  
  // Load match schedule
  loadMatchSchedule('football', 'match-schedule');
  
  // Load league standings
  loadLeagueStandings('39', 'league-standings');
  
  // Set up league selector
  const leagueSelector = document.getElementById('league-selector');
  if (leagueSelector) {
    leagueSelector.addEventListener('change', function() {
      const leagueId = this.value;
      loadLeagueStandings(leagueId, 'league-standings');
    });
  }
}

/**
 * UFC page specific setup
 */
function setupUFCPage() {
  console.log('Setting up UFC page');
  
  // Load UFC events
  loadMatchSchedule('ufc', 'ufc-events');
  
  // Load UFC rankings
  loadUFCRankings('ufc-rankings');
  
  // Set up fighter search
  setupFighterSearch();
}

/**
 * F1 page specific setup
 */
function setupF1Page() {
  console.log('Setting up F1 page');
  
  // Set up race calendar
  setupRaceCalendar();
  
  // Set up driver standings
  setupDriverStandings();
  
  // Set up constructor standings
  setupConstructorStandings();
  
  // Set up race results
  setupRaceResults();
  
  // Set up countdown for next race
  setupNextRaceCountdown();
}

/**
 * Team page specific setup
 */
function setupTeamPage() {
  console.log('Setting up team page');
  
  // Get team ID from URL
  const urlParams = new URLSearchParams(window.location.search);
  const teamId = urlParams.get('id');
  
  if (teamId) {
    // Load team data
    loadTeamData(teamId);
  } else {
    // Show error message
    const teamContainer = document.querySelector('.team-container');
    if (teamContainer) {
      teamContainer.innerHTML = 
        '<div class="error-message" style="padding: 30px;">Team ID not provided. Please select a team from the football section.</div>';
    }
  }
}

/**
 * Blog page specific setup
 */
function setupBlogPage() {
  console.log('Setting up blog page');
  
  // Check if we're on a specific blog post
  const urlParams = new URLSearchParams(window.location.search);
  const postSlug = urlParams.get('post');
  
  if (postSlug) {
    // Load specific blog post
    loadBlogPost(postSlug);
  } else {
    // Load blog posts list
    loadBlogPosts();
  }
}

/**
 * Load match schedule
 * @param {string} sportType - Type of sport (football, ufc, f1)
 * @param {string} containerId - ID of container element
 */
function loadMatchSchedule(sportType = 'football', containerId = 'match-schedule') {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  // Show loading state
  container.innerHTML = `
    <div class="loading-container">
      <div class="loading-spinner"></div>
    </div>
  `;
  
  // Get upcoming matches from API
  ApiService.getUpcomingMatches(sportType, 10)
    .then(matches => {
      // Check if we have matches
      if (!matches || matches.length === 0) {
        container.innerHTML = `
          <div class="no-data-message">
            <i class="fas fa-calendar-times"></i>
            <p>No upcoming matches found</p>
          </div>
        `;
        return;
      }
      
      // Create HTML for matches
      let matchesHTML = '';
      
      matches.forEach(match => {
        // Format date and time
        const matchDate = new Date(match.date || match.startTime || match.startDate);
        const formattedDate = matchDate.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric'
        });
        const formattedTime = matchDate.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit'
        });
        
        // Create match card HTML based on sport type
        if (sportType === 'football') {
          matchesHTML += `
            <div class="match-card">
              <div class="match-date">${formattedDate} | ${formattedTime}</div>
              <div class="match-teams">
                <div class="team-info">
                  <img src="${match.homeTeam?.logo || CONFIG.PLACEHOLDER_IMAGES.TEAM}" alt="${match.homeTeam?.name || 'Home Team'}" class="team-logo">
                  <span class="team-name">${match.homeTeam?.name || 'Home Team'}</span>
                </div>
                <div class="vs">VS</div>
                <div class="team-info">
                  <img src="${match.awayTeam?.logo || CONFIG.PLACEHOLDER_IMAGES.TEAM}" alt="${match.awayTeam?.name || 'Away Team'}" class="team-logo">
                  <span class="team-name">${match.awayTeam?.name || 'Away Team'}</span>
                </div>
              </div>
              <div class="match-league">${match.league?.name || 'League'}</div>
              <button class="reminder-btn" data-event-id="${match.id}" data-event-name="${match.homeTeam?.name || 'Home'} vs ${match.awayTeam?.name || 'Away'}" data-event-date="${match.date || match.startTime}" data-event-type="football">
                <i class="far fa-bell"></i> Set Reminder
              </button>
            </div>
          `;
        } else if (sportType === 'ufc') {
          matchesHTML += `
            <div class="match-card">
              <div class="match-date">${formattedDate} | ${formattedTime}</div>
              <div class="event-title">${match.title || 'UFC Event'}</div>
              <div class="event-location">${match.location || 'Location TBA'}</div>
              <div class="main-event">
                ${match.mainEvent ? `
                  <div class="fighters">
                    <div class="fighter">
                      <img src="${match.mainEvent.fighter1?.image || CONFIG.PLACEHOLDER_IMAGES.PLAYER}" alt="${match.mainEvent.fighter1?.name || 'Fighter 1'}" class="fighter-image">
                      <span class="fighter-name">${match.mainEvent.fighter1?.name || 'Fighter 1'}</span>
                    </div>
                    <div class="vs">VS</div>
                    <div class="fighter">
                      <img src="${match.mainEvent.fighter2?.image || CONFIG.PLACEHOLDER_IMAGES.PLAYER}" alt="${match.mainEvent.fighter2?.name || 'Fighter 2'}" class="fighter-image">
                      <span class="fighter-name">${match.mainEvent.fighter2?.name || 'Fighter 2'}</span>
                    </div>
                  </div>
                ` : 'Main Event TBA'}
              </div>
              <button class="reminder-btn" data-event-id="${match.id}" data-event-name="${match.title || 'UFC Event'}" data-event-date="${match.date || match.startTime}" data-event-type="ufc">
                <i class="far fa-bell"></i> Set Reminder
              </button>
            </div>
          `;
        } else if (sportType === 'f1') {
          matchesHTML += `
            <div class="match-card">
              <div class="match-date">${formattedDate} | ${formattedTime}</div>
              <div class="event-title">${match.name || 'F1 Race'}</div>
              <div class="event-location">${match.circuit?.name || ''} - ${match.circuit?.location || ''}, ${match.circuit?.country || ''}</div>
              <div class="race-round">Round ${match.round || '?'}</div>
              <button class="reminder-btn" data-event-id="${match.id}" data-event-name="${match.name || 'F1 Race'}" data-event-date="${match.date}T${match.time || '00:00:00Z'}" data-event-type="f1">
                <i class="far fa-bell"></i> Set Reminder
              </button>
            </div>
          `;
        }
      });
      
      // Update container with matches
      container.innerHTML = matchesHTML;
      
      // Set up reminder buttons
      setupReminderButtons();
    })
    .catch(error => {
      console.error(`Error loading ${sportType} match schedule:`, error);
      
      // Show error message
      container.innerHTML = `
        <div class="error-message">
          <i class="fas fa-exclamation-circle"></i>
          <p>Unable to load match schedule. Please try again later.</p>
        </div>
      `;
    });
}

/**
 * Load league standings
 * @param {string} leagueId - League ID
 * @param {string} containerId - ID of container element
 */
function loadLeagueStandings(leagueId = '39', containerId = 'league-standings') {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  // Show loading state
  container.innerHTML = `
    <div class="loading-container">
      <div class="loading-spinner"></div>
    </div>
  `;
  
  // Get league standings from API
  ApiService.getLeagueStandings(leagueId)
    .then(standings => {
      // Check if we have standings
      if (!standings || !standings.league || !standings.league.standings || standings.league.standings.length === 0) {
        container.innerHTML = `
          <div class="no-data-message">
            <i class="fas fa-table"></i>
            <p>No standings data available</p>
          </div>
        `;
        return;
      }
      
      // Get league info
      const league = standings.league;
      
      // Create HTML for standings table
      let standingsHTML = `
        <div class="standings-header">
          <img src="${league.logo || CONFIG.PLACEHOLDER_IMAGES.TEAM}" alt="${league.name || 'League'}" class="league-logo">
          <h3>${league.name || 'League Standings'}</h3>
        </div>
        <table class="standings-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Team</th>
              <th>P</th>
              <th>W</th>
              <th>D</th>
              <th>L</th>
              <th>GD</th>
              <th>Pts</th>
            </tr>
          </thead>
          <tbody>
      `;
      
      // Add rows for each team
      league.standings[0].forEach(team => {
        standingsHTML += `
          <tr>
            <td>${team.rank}</td>
            <td>
              <div class="team-info-small">
                <img src="${team.team.logo || CONFIG.PLACEHOLDER_IMAGES.TEAM}" alt="${team.team.name}" class="team-logo-small">
                <span>${team.team.name}</span>
              </div>
            </td>
            <td>${team.all.played}</td>
            <td>${team.all.win}</td>
            <td>${team.all.draw}</td>
            <td>${team.all.lose}</td>
            <td>${team.goalsDiff}</td>
            <td><strong>${team.points}</strong></td>
          </tr>
        `;
      });
      
      // Close table
      standingsHTML += `
          </tbody>
        </table>
      `;
      
      // Update container with standings
      container.innerHTML = standingsHTML;
    })
    .catch(error => {
      console.error(`Error loading league standings:`, error);
      
      // Show error message
      container.innerHTML = `
        <div class="error-message">
          <i class="fas fa-exclamation-circle"></i>
          <p>Unable to load league standings. Please try again later.</p>
        </div>
      `;
    });
}

/**
 * Update event promotion banner with closest upcoming event
 */
function updateEventPromotion() {
  const promotionBanner = document.querySelector('.event-promotion');
  if (!promotionBanner) return;
  
  console.log('Updating event promotion banner');
  
  // Get upcoming events from all sports
  Promise.all([
    ApiService.getUpcomingMatches('ufc', 1),
    ApiService.getUpcomingMatches('football', 1),
    ApiService.getUpcomingMatches('f1', 1)
  ])
  .then(([ufcEvents, footballMatches, f1Races]) => {
    // Combine all events
    const allEvents = [
      ...(ufcEvents || []).map(event => ({...event, type: 'ufc'})),
      ...(footballMatches || []).map(match => ({...match, type: 'football'})),
      ...(f1Races || []).map(race => ({...race, type: 'f1'}))
    ];
    
    // Sort by date (closest first)
    allEvents.sort((a, b) => {
      const dateA = new Date(a.date || a.startTime || a.startDate);
      const dateB = new Date(b.date || b.startTime || b.startDate);
      return dateA - dateB;
    });
    
    // Get closest event
    const closestEvent = allEvents[0];
    
    if (closestEvent) {
      // Format date
      const eventDate = new Date(closestEvent.date || closestEvent.startTime || closestEvent.startDate);
      const formattedDate = eventDate.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric'
      });
      
      // Update banner content based on event type
      let bannerHTML = '';
      let linkUrl = '';
      
      switch(closestEvent.type) {
        case 'ufc':
          bannerHTML = `UFC ${closestEvent.eventNumber || ''}: ${closestEvent.title || 'Live Event'} - Watch Live ${formattedDate}!`;
          linkUrl = `/main/ufc.html?event=${closestEvent.id}`;
          break;
        case 'football':
          bannerHTML = `${closestEvent.homeTeam?.name || 'Home'} vs ${closestEvent.awayTeam?.name || 'Away'} - Watch Live ${formattedDate}!`;
          linkUrl = `/main/football.html?match=${closestEvent.id}`;
          break;
        case 'f1':
          bannerHTML = `F1 ${closestEvent.name || 'Grand Prix'} - Watch Live ${formattedDate}!`;
          linkUrl = `/main/f1.html?race=${closestEvent.id}`;
          break;
      }
      
      // Update banner
      promotionBanner.innerHTML = `
        <a href="${linkUrl}" onclick="trackShopRedirect('promotion_banner')">
          ${bannerHTML}
        </a>
      `;
    }
  })
  .catch(error => {
    console.error('Error updating event promotion:', error);
    
    // Fallback to default promotion
    promotionBanner.innerHTML = `
      <a href="/main/shop.html" onclick="trackShopRedirect('promotion_banner')">
        Watch Live Sports - Subscribe Now for Premium Access!
      </a>
    `;
  });
}

/**
 * Set up reminder buttons
 */
function setupReminderButtons() {
  const reminderButtons = document.querySelectorAll('.reminder-btn');
  
  reminderButtons.forEach(button => {
    button.addEventListener('click', function() {
      const eventId = this.getAttribute('data-event-id');
      const eventName = this.getAttribute('data-event-name');
      const eventDate = this.getAttribute('data-event-date');
      const eventType = this.getAttribute('data-event-type');
      
      // Set reminder
      if (window.ReminderService) {
        const reminderId = window.ReminderService.setReminder(eventId, eventName, eventType, eventDate);
        
        if (reminderId) {
          // Update button to show reminder is set
          this.innerHTML = '<i class="fas fa-bell"></i> Reminder Set';
          this.classList.add('reminder-set');
          this.disabled = true;
          
          // Show confirmation message
          showNotification('Reminder set for ' + eventName);
        } else {
          // Show error message
          showNotification('Failed to set reminder', 'error');
        }
      } else {
        console.error('ReminderService not available');
        showNotification('Reminder service not available', 'error');
      }
    });
  });
}

/**
 * Show notification
 * @param {string} message - Notification message
 * @param {string} type - Notification type (success, error, info)
 */
function showNotification(message, type = 'success') {
  // Create notification element
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.innerHTML = `
    <div class="notification-content">
      <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
      <span>${message}</span>
    </div>
    <button class="notification-close"><i class="fas fa-times"></i></button>
  `;
  
  // Add to document
  document.body.appendChild(notification);
  
  // Show notification
  setTimeout(() => {
    notification.classList.add('show');
  }, 10);
  
  // Set up close button
  const closeButton = notification.querySelector('.notification-close');
  if (closeButton) {
    closeButton.addEventListener('click', function() {
      notification.classList.remove('show');
      setTimeout(() => {
        notification.remove();
      }, 300);
    });
  }
  
  // Auto-hide after 5 seconds
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => {
      notification.remove();
    }, 300);
  }, 5000);
}

/**
 * Set up shop redirect tracking
 */
function setupShopRedirectTracking() {
  const shopButtons = document.querySelectorAll('[onclick*="trackShopRedirect"]');
  
  shopButtons.forEach(button => {
    button.addEventListener('click', function(event) {
      // Prevent default action
      event.preventDefault();
      
      // Get source from onclick attribute
      const onclickAttr = this.getAttribute('onclick');
      const sourceMatch = onclickAttr.match(/trackShopRedirect\(['"]([^'"]+)['"]\)/);
      const source = sourceMatch ? sourceMatch[1] : 'unknown';
      
      // Track redirect
      trackShopRedirect(source);
    });
  });
}

/**
 * Track shop redirect
 * @param {string} source - Source of redirect
 */
function trackShopRedirect(source) {
  console.log(`Tracking shop redirect from: ${source}`);
  
  // In a real implementation, you would send analytics data here
  
  // Redirect to shop
  window.location.href = `https://smartlivetv.net/shop?utm_source=mainsite&utm_medium=cta&utm_campaign=${source}`;
}

// Export functions for use in other modules
export {
  initializeSite,
  setupMobileMenu,
  setupCategoryButtons,
  loadMatchSchedule,
  loadLeagueStandings,
  showNotification,
  trackShopRedirect
};