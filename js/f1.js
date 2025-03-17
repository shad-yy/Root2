/**
 * SMART Live TV - Formula 1 Page Script
 * 
 * Handles all Formula 1 page specific functionality including:
 * - Loading next race data
 * - Displaying race calendar
 * - Showing driver standings
 * - Showing constructor standings
 * - Recent race results
 * - F1 news
 */

import CONFIG from './config.js';
import ApiService from './api-service.js';
import ReminderService from './reminder-service.js';
import BlogService from './blog-service.js';
import ErrorHandler from './error-handler.js';

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  console.log('Formula 1 page initializing...');
  initF1Page();
});

/**
 * Initialize F1 page
 */
function initF1Page() {
  // Initialize UI components
  initMobileMenu();
  initSeasonSelector();
  
  // Load data
  loadNextRace();
  loadRaceCalendar();
  loadDriverStandings();
  loadConstructorStandings();
  loadRecentResults();
  loadF1News();
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
 * Initialize season selector
 */
function initSeasonSelector() {
  const seasonSelector = document.getElementById('season-selector');
  
  if (seasonSelector) {
    // Add event listener
    seasonSelector.addEventListener('change', function() {
      const season = this.value;
      loadRaceCalendar(season);
    });
  }
}

/**
 * Load next race data
 */
async function loadNextRace() {
  const container = document.querySelector('.next-race-container');
  const countdownContainer = document.getElementById('race-countdown');
  
  if (!container) return;
  
  try {
    // Show loading state
    container.innerHTML = `
      <div class="loading-indicator">
        <div class="spinner"></div>
        <p>Loading next race data...</p>
      </div>
    `;
    
    // Get current year
    const currentYear = new Date().getFullYear();
    
    // Get race calendar for current year
    const data = await ApiService.getF1Calendar(currentYear);
    
    // Check if we have races
    if (!data.response || data.response.length === 0) {
      container.innerHTML = `
        <div class="no-data-message">
          <p>No race data available for the current season.</p>
        </div>
      `;
      return;
    }
    
    // Find next race
    const now = new Date();
    const nextRace = data.response.find(race => new Date(race.date) > now) || data.response[0];
    
    // Calculate time until race
    const raceDate = new Date(nextRace.date);
    const timeUntilRace = raceDate - now;
    
    // Format countdown
    let countdownHtml = '';
    if (timeUntilRace > 0) {
      const days = Math.floor(timeUntilRace / (1000 * 60 * 60 * 24));
      const hours = Math.floor((timeUntilRace % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((timeUntilRace % (1000 * 60 * 60)) / (1000 * 60));
      
      countdownHtml = `
        <div class="countdown">
          <div class="countdown-item">
            <span class="countdown-value">${days}</span>
            <span class="countdown-label">days</span>
          </div>
          <div class="countdown-item">
            <span class="countdown-value">${hours}</span>
            <span class="countdown-label">hours</span>
          </div>
          <div class="countdown-item">
            <span class="countdown-value">${minutes}</span>
            <span class="countdown-label">minutes</span>
          </div>
        </div>
      `;
      
      // Update countdown every minute
      setInterval(() => {
        updateNextRaceCountdown(nextRace.date, countdownContainer);
      }, 60 * 1000);
    } else {
      countdownHtml = `
        <div class="race-live">
          <span class="pulse"></span> RACE WEEKEND LIVE
        </div>
      `;
    }
    
    // Update countdown container
    if (countdownContainer) {
      countdownContainer.innerHTML = countdownHtml;
    }
    
    // Format date
    const formattedDate = new Date(nextRace.date).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
    
    // Format time
    const formattedTime = new Date(nextRace.date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    });
    
    // Build next race HTML
    const html = `
      <div class="next-race">
        <div class="race-info">
          <h3>${nextRace.name}</h3>
          <div class="race-details">
            <div class="race-detail">
              <i class="fas fa-map-marker-alt"></i>
              <span>${nextRace.circuit}, ${nextRace.location}</span>
            </div>
            <div class="race-detail">
              <i class="far fa-calendar-alt"></i>
              <span>${formattedDate}</span>
            </div>
            <div class="race-detail">
              <i class="far fa-clock"></i>
              <span>${formattedTime}</span>
            </div>
          </div>
        </div>
        
        <div class="race-circuit">
          <img src="${nextRace.image || '/main/images/circuits/default-circuit.png'}" alt="${nextRace.circuit}">
        </div>
        
        <div class="race-actions">
          <button class="remind-btn" onclick="setRaceReminder('${nextRace.id}', '${nextRace.name}', '${nextRace.date}')">
            <i class="far fa-bell"></i> Set Reminder
          </button>
          <a href="#" class="watch-btn">Watch Live</a>
        </div>
      </div>
    `;
    
    // Update container
    container.innerHTML = html;
    
  } catch (error) {
    console.error('Error loading next race:', error);
    
    container.innerHTML = `
      <div class="error-message">
        <i class="fas fa-exclamation-circle"></i>
        <p>Unable to load next race data. Please try again later.</p>
      </div>
    `;
  }
}

/**
 * Update next race countdown
 * @param {string} raceDate - Race date
 * @param {HTMLElement} container - Countdown container
 */
function updateNextRaceCountdown(raceDate, container) {
  if (!container) return;
  
  const now = new Date();
  const race = new Date(raceDate);
  const timeUntilRace = race - now;
  
  // Check if race is in the future
  if (timeUntilRace > 0) {
    const days = Math.floor(timeUntilRace / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeUntilRace % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeUntilRace % (1000 * 60 * 60)) / (1000 * 60));
    
    const countdownHtml = `
      <div class="countdown">
        <div class="countdown-item">
          <span class="countdown-value">${days}</span>
          <span class="countdown-label">days</span>
        </div>
        <div class="countdown-item">
          <span class="countdown-value">${hours}</span>
          <span class="countdown-label">hours</span>
        </div>
        <div class="countdown-item">
          <span class="countdown-value">${minutes}</span>
          <span class="countdown-label">minutes</span>
        </div>
      </div>
    `;
    
    container.innerHTML = countdownHtml;
  } else {
    container.innerHTML = `
      <div class="race-live">
        <span class="pulse"></span> RACE WEEKEND LIVE
      </div>
    `;
  }
}

/**
 * Load race calendar
 * @param {string} season - Season year
 */
async function loadRaceCalendar(season = new Date().getFullYear()) {
  const container = document.querySelector('.race-calendar-container');
  if (!container) return;
  
  try {
    // Show loading state
    container.innerHTML = `
      <div class="loading-indicator">
        <div class="spinner"></div>
        <p>Loading race calendar...</p>
      </div>
    `;
    
    // Get race calendar
    const data = await ApiService.getF1Calendar(season);
    
    // Check if we have races
    if (!data.response || data.response.length === 0) {
      container.innerHTML = `
        <div class="no-data-message">
          <p>No race calendar data available for ${season}.</p>
        </div>
      `;
      return;
    }
    
    // Build race calendar HTML
    let html = `
      <div class="race-calendar">
        <div class="race-calendar-header">
          <div class="race-round">Round</div>
          <div class="race-name">Grand Prix</div>
          <div class="race-circuit">Circuit</div>
          <div class="race-date">Date</div>
          <div class="race-actions">Actions</div>
        </div>
    `;
    
    // Sort races by date
    const sortedRaces = [...data.response].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // Current date for highlighting
    const now = new Date();
    
    // Add races
    sortedRaces.forEach((race, index) => {
      const raceDate = new Date(race.date);
      
      // Determine if race is past, current, or future
      const isPast = raceDate < now;
      const isCurrent = raceDate.toDateString() === now.toDateString();
      const statusClass = isPast ? 'past-race' : (isCurrent ? 'current-race' : 'future-race');
      
      // Format date
      const formattedDate = raceDate.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      });
      
      html += `
        <div class="race-calendar-row ${statusClass}">
          <div class="race-round">${index + 1}</div>
          <div class="race-name">${race.name}</div>
          <div class="race-circuit">${race.circuit}</div>
          <div class="race-date">${formattedDate}</div>
          <div class="race-actions">
            ${isPast ? `
              <a href="#recent-results" class="results-btn">Results</a>
            ` : `
              <button class="remind-btn" onclick="setRaceReminder('${race.id}', '${race.name}', '${race.date}')">
                <i class="far fa-bell"></i> Remind
              </button>
            `}
          </div>
        </div>
      `;
    });
    
    html += `</div>`;
    
    // Update container
    container.innerHTML = html;
    
  } catch (error) {
    console.error('Error loading race calendar:', error);
    
    container.innerHTML = `
      <div class="error-message">
        <i class="fas fa-exclamation-circle"></i>
        <p>Unable to load race calendar. Please try again later.</p>
      </div>
    `;
  }
}

/**
 * Load driver standings
 */
async function loadDriverStandings() {
  const container = document.querySelector('.driver-standings-container');
  if (!container) return;
  
  try {
    // Show loading state
    container.innerHTML = `
      <div class="loading-indicator">
        <div class="spinner"></div>
        <p>Loading driver standings...</p>
      </div>
    `;
    
    // Get current year
    const currentYear = new Date().getFullYear();
    
    // Get driver standings
    const data = await ApiService.getF1DriverStandings(currentYear);
    
    // Check if we have standings
    if (!data.response || data.response.length === 0) {
      container.innerHTML = `
        <div class="no-data-message">
          <p>No driver standings data available for the current season.</p>
        </div>
      `;
      return;
    }
    
    // Build driver standings HTML
    let html = `
      <div class="standings-table">
        <div class="standings-header">
          <div class="position">#</div>
          <div class="driver-info">Driver</div>
          <div class="team">Team</div>
          <div class="points">Points</div>
        </div>
    `;
    
    // Add drivers
    data.response.forEach(driver => {
      // Get team color
      const teamColor = getTeamColor(driver.team);
      
      html += `
        <div class="standings-row">
          <div class="position">${driver.position}</div>
          <div class="driver-info">
            <div class="driver-flag">
              <img src="/main/images/flags/${driver.nationality.toLowerCase()}.png" alt="${driver.nationality}" onerror="this.src='/main/images/flags/default.png'">
            </div>
            <div class="driver-name">
              <span class="full-name">${driver.firstname} ${driver.lastname}</span>
              <span class="short-name">${driver.abbreviation}</span>
            </div>
          </div>
          <div class="team">
            <span class="team-color" style="background-color: ${teamColor}"></span>
            ${driver.team}
          </div>
          <div class="points">${driver.points}</div>
        </div>
      `;
    });
    
    html += `</div>`;
    
    // Update container
    container.innerHTML = html;
    
  } catch (error) {
    console.error('Error loading driver standings:', error);
    
    container.innerHTML = `
      <div class="error-message">
        <i class="fas fa-exclamation-circle"></i>
        <p>Unable to load driver standings. Please try again later.</p>
      </div>
    `;
  }
}

/**
 * Load constructor standings
 */
async function loadConstructorStandings() {
  const container = document.querySelector('.constructor-standings-container');
  if (!container) return;
  
  try {
    // Show loading state
    container.innerHTML = `
      <div class="loading-indicator">
        <div class="spinner"></div>
        <p>Loading constructor standings...</p>
      </div>
    `;
    
    // Get current year
    const currentYear = new Date().getFullYear();
    
    // Get constructor standings
    const data = await ApiService.getF1ConstructorStandings(currentYear);
    
    // Check if we have standings
    if (!data.response || data.response.length === 0) {
      container.innerHTML = `
        <div class="no-data-message">
          <p>No constructor standings data available for the current season.</p>
        </div>
      `;
      return;
    }
    
    // Build constructor standings HTML
    let html = `
      <div class="standings-table constructor-table">
        <div class="standings-header">
          <div class="position">#</div>
          <div class="team-info">Team</div>
          <div class="wins">Wins</div>
          <div class="points">Points</div>
        </div>
    `;
    
    // Add teams
    data.response.forEach(team => {
      // Get team color
      const teamColor = getTeamColor(team.name);
      
      html += `
        <div class="standings-row">
          <div class="position">${team.position}</div>
          <div class="team-info">
            <span class="team-color" style="background-color: ${teamColor}"></span>
            <span class="team-name">${team.name}</span>
          </div>
          <div class="wins">${team.wins}</div>
          <div class="points">${team.points}</div>
        </div>
      `;
    });
    
    html += `</div>`;
    
    // Update container
    container.innerHTML = html;
    
  } catch (error) {
    console.error('Error loading constructor standings:', error);
    
    container.innerHTML = `
      <div class="error-message">
        <i class="fas fa-exclamation-circle"></i>
        <p>Unable to load constructor standings. Please try again later.</p>
      </div>
    `;
  }
}

/**
 * Load recent race results
 */
async function loadRecentResults() {
  const container = document.querySelector('.recent-results-container');
  if (!container) return;
  
  try {
    // Show loading state
    container.innerHTML = `
      <div class="loading-indicator">
        <div class="spinner"></div>
        <p>Loading recent race results...</p>
      </div>
    `;
    
    // Get current year
    const currentYear = new Date().getFullYear();
    
    // Get race calendar
    const calendarData = await ApiService.getF1Calendar(currentYear);
    
    // Find most recent race
    const now = new Date();
    const pastRaces = calendarData.response.filter(race => new Date(race.date) < now);
    
    if (pastRaces.length === 0) {
      container.innerHTML = `
        <div class="no-data-message">
          <p>No race results available yet for the current season.</p>
        </div>
      `;
      return;
    }
    
    // Sort by date (most recent first) and get the last race
    const mostRecentRace = pastRaces.sort((a, b) => new Date(b.date) - new Date(a.date))[0];
    
    // Get race results
    const resultsData = await ApiService.getF1RaceResults(currentYear, mostRecentRace.round);
    
    // Check if we have results
    if (!resultsData.response || resultsData.response.length === 0) {
      container.innerHTML = `
        <div class="no-data-message">
          <p>No results available for the most recent race.</p>
        </div>
      `;
      return;
    }
    
    // Build race results HTML
    let html = `
      <div class="race-results">
        <h3>${mostRecentRace.name} Results</h3>
        <div class="race-date">
          ${new Date(mostRecentRace.date).toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric'
          })}
        </div>
        
        <div class="results-table">
          <div class="results-header">
            <div class="position">Pos</div>
            <div class="driver-info">Driver</div>
            <div class="team">Team</div>
            <div class="time">Time/Status</div>
            <div class="points">Pts</div>
          </div>
    `;
    
    // Add results
    resultsData.response.forEach(result => {
      // Get team color
      const teamColor = getTeamColor(result.team);
      
      html += `
        <div class="results-row">
          <div class="position">${result.position}</div>
          <div class="driver-info">
            <div class="driver-flag">
              <img src="/main/images/flags/${result.nationality.toLowerCase()}.png" alt="${result.nationality}" onerror="this.src='/main/images/flags/default.png'">
            </div>
            <div class="driver-name">
              <span class="full-name">${result.firstname} ${result.lastname}</span>
              <span class="short-name">${result.abbreviation}</span>
            </div>
          </div>
          <div class="team">
            <span class="team-color" style="background-color: ${teamColor}"></span>
            ${result.team}
          </div>
          <div class="time">${result.time || result.status}</div>
          <div class="points">${result.points}</div>
        </div>
      `;
    });
    
    html += `
        </div>
        <div class="view-more-link">
          <a href="/main/f1-results.html?year=${currentYear}&race=${mostRecentRace.round}">Full Race Details</a>
        </div>
      </div>
    `;
    
    // Update container
    container.innerHTML = html;
    
  } catch (error) {
    console.error('Error loading recent race results:', error);
    
    container.innerHTML = `
      <div class="error-message">
        <i class="fas fa-exclamation-circle"></i>
        <p>Unable to load race results. Please try again later.</p>
      </div>
    `;
  }
}

/**
 * Load F1 news
 */
async function loadF1News() {
  const container = document.querySelector('.f1-news');
  if (!container) return;
  
  try {
    // Show loading indicator
    container.innerHTML = `
      <div class="loading-indicator">
        <div class="spinner"></div>
        <p>Loading news...</p>
      </div>
    `;
    
    // Get F1 news from blog service
    const posts = BlogService.getPostsByCategory('Formula 1').slice(0, 3);
    
    // Check if we have posts
    if (!posts || posts.length === 0) {
      container.innerHTML = `
        <div class="no-data-message">
          <p>No Formula 1 news articles available.</p>
        </div>
      `;
      return;
    }
    
    // Build news HTML
    let html = '';
    
    posts.forEach(post => {
      html += `
        <article class="news-card">
          <div class="news-image">
            <img src="${post.image}" alt="${post.title}">
          </div>
          <div class="news-content">
            <div class="news-meta">
              <span class="category">${post.category}</span>
              <span class="date">${new Date(post.date).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric'
              })}</span>
            </div>
            <h3>${post.title}</h3>
            <p>${post.summary}</p>
            <a href="/main/blog/${post.slug}.html" class="read-more">Read More</a>
          </div>
        </article>
      `;
    });
    
    // Update container
    container.innerHTML = html;
    
  } catch (error) {
    console.error('Error loading F1 news:', error);
    container.innerHTML = `
      <div class="error-message">
        <i class="fas fa-exclamation-circle"></i>
        <p>Unable to load news. Please try again later.</p>
      </div>
    `;
  }
}

/**
 * Get team color based on team name
 * @param {string} team - Team name
 * @returns {string} - Team color hex code
 */
function getTeamColor(team) {
  const teamColors = {
    'Red Bull Racing': '#0600EF',
    'Ferrari': '#DC0000',
    'Mercedes': '#00D2BE',
    'McLaren': '#FF8700',
    'Aston Martin': '#006F62',
    'Alpine': '#0090FF',
    'Williams': '#005AFF',
    'AlphaTauri': '#2B4562',
    'Alfa Romeo': '#900000',
    'Haas F1 Team': '#FFFFFF'
  };
  
  // Try to find exact match
  if (teamColors[team]) {
    return teamColors[team];
  }
  
  // Try to find partial match
  for (const knownTeam in teamColors) {
    if (team.includes(knownTeam) || knownTeam.includes(team)) {
      return teamColors[knownTeam];
    }
  }
  
  // Default color
  return '#333333';
}

/**
 * Set a reminder for a race
 * @param {string} id - Race ID
 * @param {string} title - Race title
 * @param {string} time - Race time
 */
function setRaceReminder(id, title, time) {
  const event = {
    id: id,
    title: title,
    time: time
  };
  
  ReminderService.setReminder(event);
  ReminderService.showConfirmation(title, 30);
}

// Export functions that need to be available globally
window.setRaceReminder = setRaceReminder; 