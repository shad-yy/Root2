/**
 * SMART Live TV - Football Page Script
 * 
 * Handles all football page specific functionality including:
 * - Loading live matches
 * - Loading upcoming matches
 * - Displaying league standings
 * - Showing top scorers
 * - Football news
 */

import CONFIG from './config.js';
import ApiService from './api-service.js';
import ReminderService from './reminder-service.js';
import BlogService from './blog-service.js';
import ErrorHandler from './error-handler.js';

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  console.log('Football page initializing...');
  initFootballPage();
});

/**
 * Initialize football page
 */
function initFootballPage() {
  // Initialize UI components
  initMobileMenu();
  initLeagueButtons();
  initFilterSelectors();
  
  // Load data
  loadLiveMatches();
  loadUpcomingMatches();
  loadLeagueStandings();
  loadTopScorers();
  loadFootballNews();
  
  // Initialize load more button
  initLoadMoreButton();
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
 * Initialize league buttons
 */
function initLeagueButtons() {
  const leagueButtons = document.querySelectorAll('.league-button');
  
  leagueButtons.forEach(button => {
    button.addEventListener('click', function() {
      // Update active state
      leagueButtons.forEach(btn => btn.classList.remove('active'));
      this.classList.add('active');
      
      // Get league ID
      const leagueId = this.getAttribute('data-league-id');
      
      // Update league selector
      const leagueFilter = document.getElementById('league-filter');
      if (leagueFilter) {
        leagueFilter.value = leagueId;
      }
      
      // Update standings selector
      const standingsFilter = document.getElementById('standings-league-filter');
      if (standingsFilter) {
        standingsFilter.value = leagueId;
      }
      
      // Update scorers selector
      const scorersFilter = document.getElementById('scorers-league-filter');
      if (scorersFilter) {
        scorersFilter.value = leagueId;
      }
      
      // Load data for selected league
      loadUpcomingMatches(leagueId);
      loadLeagueStandings(leagueId);
      loadTopScorers(leagueId);
    });
  });
}

/**
 * Initialize filter selectors
 */
function initFilterSelectors() {
  // League filter for upcoming matches
  const leagueFilter = document.getElementById('league-filter');
  if (leagueFilter) {
    leagueFilter.addEventListener('change', function() {
      loadUpcomingMatches(this.value);
    });
  }
  
  // League filter for standings
  const standingsFilter = document.getElementById('standings-league-filter');
  if (standingsFilter) {
    standingsFilter.addEventListener('change', function() {
      loadLeagueStandings(this.value);
    });
  }
  
  // League filter for top scorers
  const scorersFilter = document.getElementById('scorers-league-filter');
  if (scorersFilter) {
    scorersFilter.addEventListener('change', function() {
      loadTopScorers(this.value);
    });
  }
}

/**
 * Initialize load more button
 */
function initLoadMoreButton() {
  const loadMoreButton = document.getElementById('load-more-matches');
  if (loadMoreButton) {
    loadMoreButton.addEventListener('click', function() {
      const currentPage = parseInt(this.getAttribute('data-page') || '1');
      const nextPage = currentPage + 1;
      const leagueId = document.getElementById('league-filter')?.value || 'all';
      
      loadUpcomingMatches(leagueId, nextPage, true);
      
      // Update current page
      this.setAttribute('data-page', nextPage.toString());
    });
  }
}

/**
 * Load live matches
 */
async function loadLiveMatches() {
  const container = document.querySelector('.live-matches-container');
  if (!container) return;
  
  try {
    // Show loading indicator
    container.innerHTML = `
      <div class="loading-indicator">
        <div class="spinner"></div>
        <p>Loading live matches...</p>
      </div>
    `;
    
    // Get live matches from API
    const data = await ApiService.getFootballLiveMatches();
    
    // Check if we have matches
    if (!data.response || data.response.length === 0) {
      container.innerHTML = `
        <div class="no-data-message">
          <p>No live matches currently in progress.</p>
          <p>Check out the upcoming matches below.</p>
        </div>
      `;
      return;
    }
    
    // Build matches HTML
    let html = '<div class="live-matches-grid">';
    
    data.response.forEach(match => {
      const fixture = match.fixture;
      const teams = match.teams;
      const goals = match.goals;
      const league = match.league;
      const events = match.events;
      
      // Get match status
      const status = fixture.status.short;
      const elapsed = fixture.status.elapsed;
      let statusText = '';
      
      if (status === '1H') {
        statusText = `${elapsed}' - 1st Half`;
      } else if (status === '2H') {
        statusText = `${elapsed}' - 2nd Half`;
      } else if (status === 'HT') {
        statusText = 'Half Time';
      } else if (status === 'FT') {
        statusText = 'Full Time';
      } else if (status === 'ET') {
        statusText = 'Extra Time';
      } else if (status === 'P') {
        statusText = 'Penalty Shootout';
      } else {
        statusText = fixture.status.long;
      }
      
      html += `
        <div class="live-match-card">
          <div class="match-header">
            <div class="league-info">
              <img src="${league.logo}" alt="${league.name}" class="league-logo">
              ${league.name}
            </div>
            <div class="match-status ${status === 'HT' ? 'status-halftime' : ''}">
              <span class="${status !== 'HT' && status !== 'FT' ? 'pulse' : ''}"></span>
              ${statusText}
            </div>
          </div>
          <div class="match-content">
            <div class="team home ${teams.home.winner ? 'winning' : ''}">
              <img src="${teams.home.logo}" alt="${teams.home.name}" class="team-logo">
              <span class="team-name">${teams.home.name}</span>
            </div>
            <div class="match-score">
              <span class="score-number">${goals.home !== null ? goals.home : '-'}</span>
              <span class="score-divider">:</span>
              <span class="score-number">${goals.away !== null ? goals.away : '-'}</span>
            </div>
            <div class="team away ${teams.away.winner ? 'winning' : ''}">
              <img src="${teams.away.logo}" alt="${teams.away.name}" class="team-logo">
              <span class="team-name">${teams.away.name}</span>
            </div>
          </div>
          <div class="match-actions">
            <a href="#" class="watch-btn">Watch Live</a>
          </div>
        </div>
      `;
    });
    
    html += '</div>';
    
    // Update container
    container.innerHTML = html;
    
  } catch (error) {
    console.error('Error loading live matches:', error);
    container.innerHTML = `
      <div class="error-message">
        <i class="fas fa-exclamation-circle"></i>
        <p>Unable to load live matches. Please try again later.</p>
      </div>
    `;
  }
}

/**
 * Load upcoming matches
 * @param {string|number} leagueId - League ID
 * @param {number} page - Page number
 * @param {boolean} append - Whether to append matches or replace existing ones
 */
async function loadUpcomingMatches(leagueId = 'all', page = 1, append = false) {
  const container = document.querySelector('.upcoming-matches-container');
  if (!container) return;
  
  try {
    // If not appending, show loading indicator
    if (!append) {
      container.innerHTML = `
        <div class="loading-indicator">
          <div class="spinner"></div>
          <p>Loading upcoming matches...</p>
        </div>
      `;
    }
    
    // Get upcoming matches from API
    const data = await ApiService.getFootballUpcomingMatches(leagueId, page);
    
    // Check if we have matches
    if (!data.response || data.response.length === 0) {
      if (!append) {
        container.innerHTML = `
          <div class="no-data-message">
            <p>No upcoming matches found for this selection.</p>
          </div>
        `;
      }
      
      // Hide load more button if no more matches
      const loadMoreButton = document.getElementById('load-more-matches');
      if (loadMoreButton) {
        loadMoreButton.style.display = 'none';
      }
      
      return;
    }
    
    // Build matches HTML
    let html = '';
    
    // If appending, get existing content
    if (append) {
      html = container.innerHTML;
      // Remove any error or no data messages
      html = html.replace(/<div class="loading-indicator">[\s\S]*?<\/div>/g, '');
      html = html.replace(/<div class="no-data-message">[\s\S]*?<\/div>/g, '');
      html = html.replace(/<div class="error-message">[\s\S]*?<\/div>/g, '');
    }
    
    // Add upcoming matches
    data.response.forEach(match => {
      const fixture = match.fixture;
      const teams = match.teams;
      const league = match.league;
      
      // Format date
      const matchDate = new Date(fixture.date);
      const formattedDate = matchDate.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      });
      
      // Format time
      const formattedTime = matchDate.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });
      
      html += `
        <div class="match-card">
          <div class="match-header">
            <div class="league-info">
              <img src="${league.logo}" alt="${league.name}" class="league-logo">
              ${league.name}
            </div>
            <div class="match-date-time">
              <i class="far fa-calendar"></i> ${formattedDate} 
              <i class="far fa-clock"></i> ${formattedTime}
            </div>
          </div>
          <div class="match-teams">
            <div class="team left">
              <img src="${teams.home.logo}" alt="${teams.home.name}" class="team-logo">
              <span class="team-name">${teams.home.name}</span>
            </div>
            <div class="vs">VS</div>
            <div class="team right">
              <span class="team-name">${teams.away.name}</span>
              <img src="${teams.away.logo}" alt="${teams.away.name}" class="team-logo">
            </div>
          </div>
          <div class="match-actions">
            <button class="remind-btn" onclick="setReminder('${fixture.id}', '${teams.home.name} vs ${teams.away.name}', '${fixture.date}')">
              <i class="far fa-bell"></i> Set Reminder
            </button>
            <a href="#" class="watch-btn">Watch Live</a>
          </div>
        </div>
      `;
    });
    
    // Update container
    container.innerHTML = html;
    
    // Show load more button
    const loadMoreButton = document.getElementById('load-more-matches');
    if (loadMoreButton) {
      loadMoreButton.style.display = 'block';
    }
    
  } catch (error) {
    console.error('Error loading upcoming matches:', error);
    if (!append) {
      container.innerHTML = `
        <div class="error-message">
          <i class="fas fa-exclamation-circle"></i>
          <p>Unable to load upcoming matches. Please try again later.</p>
        </div>
      `;
    }
  }
}

/**
 * Load league standings
 * @param {string|number} leagueId - League ID
 */
async function loadLeagueStandings(leagueId = 39) {
  const container = document.querySelector('.standings-container');
  if (!container) return;
  
  try {
    // Show loading indicator
    container.innerHTML = `
      <div class="loading-indicator">
        <div class="spinner"></div>
        <p>Loading standings...</p>
      </div>
    `;
    
    // Get current season
    const currentYear = new Date().getFullYear();
    
    // Load standings
    const data = await ApiService.getFootballStandings(leagueId, currentYear);
    
    // Check if we have standings
    if (!data.response || data.response.length === 0) {
      container.innerHTML = `
        <div class="no-data-message">
          <p>No standings data available for this league.</p>
        </div>
      `;
      return;
    }
    
    // Get league and standings
    const league = data.response[0].league;
    
    // Build standings HTML
    let html = `
      <table class="standings-table">
        <thead>
          <tr>
            <th class="rank-column">Pos</th>
            <th class="team-column">Team</th>
            <th>MP</th>
            <th>W</th>
            <th>D</th>
            <th>L</th>
            <th class="hide-mobile">GF</th>
            <th class="hide-mobile">GA</th>
            <th>GD</th>
            <th>Pts</th>
            <th class="hide-mobile">Form</th>
          </tr>
        </thead>
        <tbody>
    `;
    
    // Loop through each team in standings
    league.standings[0].forEach(team => {
      // Process form
      const form = team.form ? team.form.split('') : [];
      const formHTML = form.map(result => {
        let className = '';
        if (result === 'W') className = 'win';
        if (result === 'D') className = 'draw';
        if (result === 'L') className = 'loss';
        return `<span class="form-item ${className}">${result}</span>`;
      }).join('');
      
      // Determine row class (highlight top 4, relegation zone, etc.)
      let rowClass = '';
      if (team.rank <= 4) {
        rowClass = 'champions-league';
      } else if (team.rank === 5 || team.rank === 6) {
        rowClass = 'europa-league';
      } else if (team.rank >= league.standings[0].length - 3) {
        rowClass = 'relegation';
      }
      
      html += `
        <tr class="${rowClass}">
          <td class="rank-column">${team.rank}</td>
          <td class="team-column">
            <div class="team-info-small">
              <img src="${team.team.logo}" alt="${team.team.name}" class="team-logo-small">
              <span class="team-name-small">${team.team.name}</span>
            </div>
          </td>
          <td>${team.all.played}</td>
          <td>${team.all.win}</td>
          <td>${team.all.draw}</td>
          <td>${team.all.lose}</td>
          <td class="hide-mobile">${team.all.goals.for}</td>
          <td class="hide-mobile">${team.all.goals.against}</td>
          <td>${team.goalsDiff}</td>
          <td><strong>${team.points}</strong></td>
          <td class="hide-mobile form-column">${formHTML}</td>
        </tr>
      `;
    });
    
    html += `
        </tbody>
      </table>
      <div class="standings-legend">
        <div class="legend-item champions-league">Champions League</div>
        <div class="legend-item europa-league">Europa League</div>
        <div class="legend-item relegation">Relegation</div>
      </div>
    `;
    
    // Update container
    container.innerHTML = html;
    
  } catch (error) {
    console.error('Error loading standings:', error);
    container.innerHTML = `
      <div class="error-message">
        <i class="fas fa-exclamation-circle"></i>
        <p>Unable to load standings. Please try again later.</p>
      </div>
    `;
  }
}

/**
 * Load top scorers
 * @param {string|number} leagueId - League ID
 */
async function loadTopScorers(leagueId = 39) {
  const container = document.querySelector('.top-scorers-container');
  if (!container) return;
  
  try {
    // Show loading indicator
    container.innerHTML = `
      <div class="loading-indicator">
        <div class="spinner"></div>
        <p>Loading top scorers...</p>
      </div>
    `;
    
    // Get current season
    const currentYear = new Date().getFullYear();
    
    // Load top scorers
    const data = await ApiService.getFootballTopScorers(leagueId, currentYear);
    
    // Check if we have data
    if (!data.response || data.response.length === 0) {
      container.innerHTML = `
        <div class="no-data-message">
          <p>No top scorers data available for this league.</p>
        </div>
      `;
      return;
    }
    
    // Build top scorers HTML
    let html = '<div class="scorers-grid">';
    
    // Loop through each player
    data.response.slice(0, 10).forEach((item, index) => {
      const player = item.player;
      const statistics = item.statistics[0];
      
      html += `
        <div class="scorer-card">
          <div class="scorer-rank">${index + 1}</div>
          <div class="scorer-info">
            <img src="${player.photo}" alt="${player.name}" class="scorer-photo">
            <div class="scorer-details">
              <div class="scorer-name">${player.name}</div>
              <div class="scorer-team">
                <img src="${statistics.team.logo}" alt="${statistics.team.name}" class="team-logo-small">
                ${statistics.team.name}
              </div>
            </div>
          </div>
          <div class="scorer-stats">
            <div class="stat-item">
              <span class="stat-label">Goals</span>
              <span class="stat-value">${statistics.goals.total}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Games</span>
              <span class="stat-value">${statistics.games.appearences}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Ratio</span>
              <span class="stat-value">${(statistics.goals.total / statistics.games.appearences).toFixed(2)}</span>
            </div>
          </div>
        </div>
      `;
    });
    
    html += '</div>';
    
    // Update container
    container.innerHTML = html;
    
  } catch (error) {
    console.error('Error loading top scorers:', error);
    container.innerHTML = `
      <div class="error-message">
        <i class="fas fa-exclamation-circle"></i>
        <p>Unable to load top scorers. Please try again later.</p>
      </div>
    `;
  }
}

/**
 * Load football news
 */
async function loadFootballNews() {
  const container = document.querySelector('.football-news');
  if (!container) return;
  
  try {
    // Show loading indicator
    container.innerHTML = `
      <div class="loading-indicator">
        <div class="spinner"></div>
        <p>Loading news...</p>
      </div>
    `;
    
    // Get football news from blog service
    const posts = BlogService.getPostsByCategory('Football').slice(0, 3);
    
    // Check if we have posts
    if (!posts || posts.length === 0) {
      container.innerHTML = `
        <div class="no-data-message">
          <p>No football news articles available.</p>
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
    console.error('Error loading football news:', error);
    container.innerHTML = `
      <div class="error-message">
        <i class="fas fa-exclamation-circle"></i>
        <p>Unable to load news. Please try again later.</p>
      </div>
    `;
  }
}

/**
 * Set a reminder for a match
 * @param {string} id - Match ID
 * @param {string} title - Match title
 * @param {string} time - Match time
 */
function setReminder(id, title, time) {
  const event = {
    id: id,
    title: title,
    time: time
  };
  
  ReminderService.setReminder(event);
  ReminderService.showConfirmation(title, 30);
}

// Export functions that need to be available globally
window.setReminder = setReminder; 