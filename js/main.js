/**
 * SMART Live TV - Main JavaScript
 * 
 * Handles all front-end functionality including:
 * - Mobile menu
 * - UI interactions
 * - Page-specific behaviors
 */

// DOM elements
const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
const mobileMenuClose = document.querySelector('.mobile-menu-close');
const mobileMenu = document.querySelector('.mobile-menu');
const sportCategoryButtons = document.querySelectorAll('.category');

/**
 * Initialize the website
 */
function initializeSite() {
  // Set up mobile menu
  setupMobileMenu();

  // Set up time display updates
  setupTimeDisplays();

  // Set up page-specific behaviors
  setupPageSpecificBehaviors();

  // Set up cookie consent
  setupCookieConsent();

  // Set up theme toggle
  setupThemeToggle();

  // Set up newsletter signup if feature is enabled
  if (CONFIG.isFeatureEnabled && CONFIG.isFeatureEnabled('NEWSLETTER')) {
    setupNewsletterSignup();
  }
}

/**
 * Set up mobile menu functionality
 */
function setupMobileMenu() {
  if (mobileMenuBtn && mobileMenuClose && mobileMenu) {
    mobileMenuBtn.addEventListener('click', function () {
      mobileMenu.classList.add('active');
      document.body.style.overflow = 'hidden'; // Prevent scrolling when menu is open
    });

    mobileMenuClose.addEventListener('click', function () {
      mobileMenu.classList.remove('active');
      document.body.style.overflow = ''; // Restore scrolling
    });

    // Close menu when clicking on a link
    const mobileMenuLinks = mobileMenu.querySelectorAll('a');
    if (mobileMenuLinks) {
      mobileMenuLinks.forEach(link => {
        link.addEventListener('click', function () {
          mobileMenu.classList.remove('active');
          document.body.style.overflow = '';
        });
      });
    }
  }
}

/**
 * Set up time displays to show real time
 */
function setupTimeDisplays() {
  // Update any elements with class 'real-time' every minute
  setInterval(updateTimeDisplays, 60000);

  // Initial update
  updateTimeDisplays();
}

/**
 * Update all time displays on the page
 */
function updateTimeDisplays() {
  const timeDisplays = document.querySelectorAll('.real-time');
  const now = new Date();

  if (timeDisplays) {
    timeDisplays.forEach(display => {
      display.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    });
  }
}

/**
 * Set up page-specific behaviors
 */
function setupPageSpecificBehaviors() {
  // Get current page
  const path = window.location.pathname;

  // Homepage specific
  if (path === '/' || path.includes('index') || path.endsWith('/')) {
    setupHomePage();
  }

  // Football page specific
  if (path.includes('/football')) {
    setupFootballPage();
  }

  // UFC page specific
  if (path.includes('/ufc')) {
    setupUFCPage();
  }

  // F1 page specific
  if (path.includes('/f1')) {
    setupF1Page();
  }

  // Blog page specific
  if (path.includes('/blog')) {
    setupBlogPage();
  }
}

/**
 * Homepage specific setup
 */
function setupHomePage() {
  // Set up trending topics rollover
  setupTrendingTopics();

  // Set up upcoming matches timers
  setupUpcomingMatches();

  // Set up category switcher on homepage
  setupCategorySwitcher();

  // Load automated blog posts if available
  if (typeof BlogService !== 'undefined') {
    BlogService.renderPosts('.news-container');
  }
}

/**
 * Football page specific setup
 */
function setupFootballPage() {
  // Set up league selector if present
  setupLeagueSelector();
}

/**
 * UFC page specific setup
 */
function setupUFCPage() {
  console.log('Setting up UFC page');

  // Set up weight class selector
  setupWeightClassSelector();

  // Add UFC-specific styles if not already present
  addUFCStyles();

  // Setup fighter search functionality
  setupFighterSearch();
}

/**
 * Set up weight class selector in UFC page
 */
function setupWeightClassSelector() {
  const weightClassButtons = document.querySelectorAll('.weight-class-button');
  if (!weightClassButtons.length) return;

  weightClassButtons.forEach(button => {
    button.addEventListener('click', function () {
      // Already active
      if (this.classList.contains('active')) return;

      // Remove active class from all buttons
      weightClassButtons.forEach(btn => btn.classList.remove('active'));

      // Add active class to clicked button
      this.classList.add('active');

      // Get weight class
      const weightClass = this.getAttribute('data-weight-class');

      if (weightClass === 'all') {
        // Reload all data with default weight class
        if (typeof SportsApp !== 'undefined' && SportsApp.loadUFCPageData) {
          SportsApp.loadUFCPageData();
        }
      } else {
        // Load specific weight class data
        if (typeof SportsApp !== 'undefined' && SportsApp.loadUFCPageData) {
          SportsApp.loadUFCPageData(weightClass);
        }
      }
    });
  });
}

/**
 * Setup fighter search functionality
 */
function setupFighterSearch() {
  const searchInput = document.getElementById('fighter-search-input');
  const searchButton = document.getElementById('fighter-search-button');
  const resultsContainer = document.getElementById('fighter-search-results');

  if (!searchInput || !searchButton || !resultsContainer) return;

  searchButton.addEventListener('click', function () {
    const query = searchInput.value.trim();
    if (query.length < 3) {
      resultsContainer.innerHTML = '<p>Please enter at least 3 characters.</p>';
      return;
    }

    resultsContainer.innerHTML = '<div class="loading" style="min-height: 100px;"></div>';

    // Search for fighter
    if (typeof ApiService !== 'undefined' && ApiService.searchUFCFighter) {
      ApiService.searchUFCFighter(query)
        .then(data => {
          if (!data || data.length === 0) {
            resultsContainer.innerHTML = '<p>No fighters found. Try another name.</p>';
            return;
          }

          const processedData = DataProcessor.processFighterData(data);

          let resultsHTML = '<div class="fighter-results">';
          processedData.forEach(fighter => {
            const fighterImg = fighter.name.toLowerCase().replace(/\s+/g, '-');

            resultsHTML += `
              <div class="fighter-result-item">
                <img src="/images/fighters/${fighterImg}.png" alt="${fighter.name}" 
                     class="fighter-result-img" onerror="this.src='${CONFIG.PLACEHOLDER_IMAGES.FIGHTER}'">
                <div class="fighter-result-info">
                  <h4>${fighter.name}</h4>
                  <p>${fighter.weightClass} (${fighter.record.wins}-${fighter.record.losses}-${fighter.record.draws})</p>
                </div>
              </div>
            `;
          });

          resultsHTML += '</div>';
          resultsContainer.innerHTML = resultsHTML;
        })
        .catch(error => {
          console.error('Error searching for fighter:', error);
          resultsContainer.innerHTML = '<p>Error searching for fighter. Please try again.</p>';
        });
    } else {
      resultsContainer.innerHTML = '<p>Fighter search is not available at this time.</p>';
    }
  });

  // Also trigger search on Enter key press
  searchInput.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
      searchButton.click();
    }
  });
}

/**
 * Add UFC-specific styles to the page
 */
function addUFCStyles() {
  if (!document.getElementById('ufc-enhanced-styles')) {
    const style = document.createElement('style');
    style.id = 'ufc-enhanced-styles';
    style.textContent = `
      /* UFC page enhanced styles */
      .market-item {
        background-color: var(--bg-tertiary);
        padding: 12px 15px;
        margin-bottom: 10px;
        border-radius: 6px;
      }
      
      .market-name {
        font-weight: bold;
        margin-bottom: 8px;
      }
      
      .market-odds {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
      }
      
      .odd-option {
        background-color: var(--bg-secondary);
        padding: 8px 12px;
        border-radius: 4px;
        display: flex;
        justify-content: space-between;
        min-width: 100px;
        flex: 1;
      }
      
      .odd-price {
        font-weight: bold;
        color: var(--accent);
      }
      
      .markets-list {
        margin: 15px 0;
      }
      
      /* Loading indicator */
      .loading {
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 200px;
      }
      
      .loading::after {
        content: "";
        width: 50px;
        height: 50px;
        border: 5px solid var(--border);
        border-top-color: var(--accent);
        border-radius: 50%;
        animation: spinner 1s linear infinite;
      }
      
      @keyframes spinner {
        to { transform: rotate(360deg); }
      }
      
      /* Error message styling */
      .error-message {
        background-color: rgba(230, 0, 0, 0.1);
        color: var(--accent);
        padding: 15px;
        border-radius: 8px;
        text-align: center;
        margin: 20px 0;
      }
      
      /* Fighter search styles */
      .search-input {
        padding: 10px;
        border-radius: 4px;
        border: 1px solid var(--border);
        background-color: var(--bg-tertiary);
        color: var(--text-primary);
        width: 70%;
        margin-right: 10px;
      }
      
      .search-btn {
        padding: 10px 15px;
        background-color: var(--accent);
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
      }
      
      .search-form {
        display: flex;
        margin-bottom: 15px;
      }
      
      .fighter-result-item {
        display: flex;
        align-items: center;
        padding: 10px;
        border-bottom: 1px solid var(--border);
        background-color: var(--bg-tertiary);
        margin-bottom: 10px;
        border-radius: 4px;
      }
      
      .fighter-result-img {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        margin-right: 10px;
        object-fit: cover;
      }
      
      .fighter-result-info h4 {
        margin: 0 0 5px 0;
        font-size: 16px;
      }
      
      .fighter-result-info p {
        margin: 0;
        font-size: 14px;
        color: var(--text-secondary);
      }
    `;
    document.head.appendChild(style);
  }
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
 * Set up F1 race calendar
 */
function setupRaceCalendar() {
  const calendarContainer = document.querySelector('.race-calendar');
  if (!calendarContainer) return;

  // Check if we have SportsApp available
  if (typeof SportsApp !== 'undefined') {
    SportsApp.getF1Calendar()
      .then(races => {
        if (!races || races.length === 0) {
          calendarContainer.innerHTML = '<p class="no-data">No upcoming races found</p>';
          return;
        }

        // Update the calendar with race data
        updateRaceCalendar(races);
      })
      .catch(error => {
        console.error('Error loading F1 calendar:', error);
        calendarContainer.innerHTML = '<p class="error-message">Unable to load race calendar</p>';
      });
  }
}

/**
 * Set up F1 driver standings
 */
function setupDriverStandings() {
  const standingsContainer = document.querySelector('.driver-standings-table');
  if (!standingsContainer) return;

  if (typeof SportsApp !== 'undefined') {
    SportsApp.getF1DriverStandings()
      .then(standings => {
        if (!standings || standings.length === 0) {
          standingsContainer.innerHTML = '<p class="no-data">No driver standings available</p>';
          return;
        }

        // Update the standings table
        updateDriverStandings(standings);
      })
      .catch(error => {
        console.error('Error loading F1 driver standings:', error);
        standingsContainer.innerHTML = '<p class="error-message">Unable to load driver standings</p>';
      });
  }
}

/**
 * Set up F1 constructor standings
 */
function setupConstructorStandings() {
  const standingsContainer = document.querySelector('.constructor-standings-table');
  if (!standingsContainer) return;

  if (typeof SportsApp !== 'undefined') {
    SportsApp.getF1ConstructorStandings()
      .then(standings => {
        if (!standings || standings.length === 0) {
          standingsContainer.innerHTML = '<p class="no-data">No constructor standings available</p>';
          return;
        }

        // Update the standings table
        updateConstructorStandings(standings);
      })
      .catch(error => {
        console.error('Error loading F1 constructor standings:', error);
        standingsContainer.innerHTML = '<p class="error-message">Unable to load constructor standings</p>';
      });
  }
}

/**
 * Set up F1 race results
 */
function setupRaceResults() {
  const resultsContainer = document.querySelector('.race-results');
  if (!resultsContainer) return;

  // Get race ID from URL or use latest race
  const urlParams = new URLSearchParams(window.location.search);
  const raceId = urlParams.get('race');

  if (typeof SportsApp !== 'undefined') {
    SportsApp.getF1RaceResults(raceId)
      .then(results => {
        if (!results || results.length === 0) {
          resultsContainer.innerHTML = '<p class="no-data">No race results available</p>';
          return;
        }

        // Update the results container
        updateRaceResults(results);
      })
      .catch(error => {
        console.error('Error loading F1 race results:', error);
        resultsContainer.innerHTML = '<p class="error-message">Unable to load race results</p>';
      });
  }
}

/**
 * Set up countdown for next F1 race
 */
function setupNextRaceCountdown() {
  const countdownContainer = document.querySelector('.next-race-countdown');
  if (!countdownContainer) return;

  // Get next race from CONFIG
  const nextRace = CONFIG.F1.UPCOMING_RACES.find(race => new Date(race.date) > new Date());
  
  if (!nextRace) {
    countdownContainer.innerHTML = '<p>No upcoming races scheduled</p>';
    return;
  }

  // Set race details
  const raceInfoContainer = document.querySelector('.next-race-info');
  if (raceInfoContainer) {
    raceInfoContainer.innerHTML = `
      <h3 class="race-title">${nextRace.name}</h3>
      <p class="race-circuit">${nextRace.circuit}</p>
      <p class="race-date">${new Date(nextRace.date).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p>
    `;
  }

  // Set up countdown timer
  updateF1Countdown(countdownContainer, nextRace.date);
  
  // Update countdown every minute
  setInterval(() => {
    updateF1Countdown(countdownContainer, nextRace.date);
  }, 60000);
}

/**
 * Update F1 countdown timer
 * @param {HTMLElement} container - Countdown container element
 * @param {string} raceDate - Race date string
 */
function updateF1Countdown(container, raceDate) {
  const now = new Date();
  const raceTime = new Date(raceDate);
  const diff = raceTime - now;

  if (diff <= 0) {
    container.innerHTML = '<div class="countdown-live">LIVE NOW</div>';
    return;
  }

  // Calculate time units
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  container.innerHTML = `
    <div class="countdown-unit">
      <span class="countdown-value">${days}</span>
      <span class="countdown-label">Days</span>
    </div>
    <div class="countdown-unit">
      <span class="countdown-value">${hours}</span>
      <span class="countdown-label">Hours</span>
    </div>
    <div class="countdown-unit">
      <span class="countdown-value">${minutes}</span>
      <span class="countdown-label">Minutes</span>
    </div>
  `;
}

/**
 * Update race calendar with data
 * @param {Array} races - Array of race objects
 */
function updateRaceCalendar(races) {
  const calendarContainer = document.querySelector('.race-calendar');
  if (!calendarContainer) return;

  let html = '';
  
  races.forEach(race => {
    const raceDate = new Date(race.date);
    const isPast = raceDate < new Date();
    
    html += `
      <div class="race-card ${isPast ? 'past-race' : ''}">
        <div class="race-flag">
          <img src="/images/flags/${race.country.toLowerCase().replace(/\s+/g, '-')}.png" alt="${race.country} flag" onerror="this.src='/images/flags/default.png'">
        </div>
        <div class="race-info">
          <h3 class="race-title">${race.name}</h3>
          <p class="race-circuit">${race.circuit}</p>
          <p class="race-date">${raceDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</p>
          ${!isPast ? `<div class="countdown" data-date="${race.date}"></div>` : '<div class="race-completed">Completed</div>'}
        </div>
      </div>
    `;
  });

  calendarContainer.innerHTML = html;
  
  // Initialize countdowns for each race
  document.querySelectorAll('.countdown').forEach(countdown => {
    const raceDate = countdown.getAttribute('data-date');
    updateF1Countdown(countdown, raceDate);
  });
}

/**
 * Update driver standings table
 * @param {Array} standings - Array of driver standing objects
 */
function updateDriverStandings(standings) {
  const standingsContainer = document.querySelector('.driver-standings-table');
  if (!standingsContainer) return;

  let html = `
    <table>
      <thead>
        <tr>
          <th>Pos</th>
          <th>Driver</th>
          <th>Team</th>
          <th>Points</th>
        </tr>
      </thead>
      <tbody>
  `;
  
  standings.forEach(driver => {
    const teamConfig = CONFIG.F1.TEAMS.find(team => team.name === driver.team);
    const teamColor = teamConfig ? teamConfig.color : '#333333';
    
    html += `
      <tr>
        <td>${driver.position}</td>
        <td>
          <div class="driver-info">
            <span class="driver-number" style="background-color: ${teamColor}">${driver.number}</span>
            <span class="driver-name">${driver.name}</span>
          </div>
        </td>
        <td>${driver.team}</td>
        <td class="points">${driver.points}</td>
      </tr>
    `;
  });
  
  html += `
      </tbody>
    </table>
  `;
  
  standingsContainer.innerHTML = html;
}

/**
 * Update constructor standings table
 * @param {Array} standings - Array of constructor standing objects
 */
function updateConstructorStandings(standings) {
  const standingsContainer = document.querySelector('.constructor-standings-table');
  if (!standingsContainer) return;

  let html = `
    <table>
      <thead>
        <tr>
          <th>Pos</th>
          <th>Team</th>
          <th>Points</th>
        </tr>
      </thead>
      <tbody>
  `;
  
  standings.forEach(team => {
    const teamConfig = CONFIG.F1.TEAMS.find(t => t.name === team.name);
    const teamColor = teamConfig ? teamConfig.color : '#333333';
    
    html += `
      <tr>
        <td>${team.position}</td>
        <td>
          <div class="team-info">
            <span class="team-color" style="background-color: ${teamColor}"></span>
            <span class="team-name">${team.name}</span>
          </div>
        </td>
        <td class="points">${team.points}</td>
      </tr>
    `;
  });
  
  html += `
      </tbody>
    </table>
  `;
  
  standingsContainer.innerHTML = html;
}

/**
 * Update race results
 * @param {Array} results - Array of race result objects
 */
function updateRaceResults(results) {
  const resultsContainer = document.querySelector('.race-results');
  if (!resultsContainer) return;

  // Get race info
  const raceInfo = results.raceInfo || {};
  
  let html = `
    <div class="race-result-header">
      <div class="race-result-title">${raceInfo.name || 'Race Results'}</div>
      <div class="race-result-date">${raceInfo.date ? new Date(raceInfo.date).toLocaleDateString() : ''}</div>
    </div>
    <table>
      <thead>
        <tr>
          <th>Pos</th>
          <th>Driver</th>
          <th>Team</th>
          <th>Time/Status</th>
          <th>Points</th>
        </tr>
      </thead>
      <tbody>
  `;
  
  (results.results || []).forEach(result => {
    const teamConfig = CONFIG.F1.TEAMS.find(team => team.name === result.team);
    const teamColor = teamConfig ? teamConfig.color : '#333333';
    
    html += `
      <tr>
        <td>${result.position}</td>
        <td>
          <div class="driver-info">
            <span class="driver-number" style="background-color: ${teamColor}">${result.number}</span>
            <span class="driver-name">${result.driver}</span>
          </div>
        </td>
        <td>${result.team}</td>
        <td>${result.time || result.status || ''}</td>
        <td class="points">${result.points}</td>
      </tr>
    `;
  });
  
  html += `
      </tbody>
    </table>
  `;
  
  resultsContainer.innerHTML = html;
}

/**
 * Blog page specific setup
 */
function setupBlogPage() {
  // Render blog posts if BlogService is available
  if (typeof BlogService !== 'undefined') {
    BlogService.renderPosts('.news-container', 10);

    // Populate trending stories sidebar
    const trendingContainer = document.querySelector('.trending-list');
    if (trendingContainer) {
      // Clear loading state
      trendingContainer.querySelectorAll('.loading').forEach(el => el.remove());

      // Load trending posts
      const trendingPosts = BlogService.getPosts().slice(0, 5);

      trendingPosts.forEach(post => {
        const item = document.createElement('div');
        item.className = 'trending-item';
        item.innerHTML = `
          <strong>${post.title}</strong>
          <p>${post.formattedDate || 'Recently'}</p>
          <a href="blog/${post.slug}" class="read-more">Read More</a>
        `;
        trendingContainer.appendChild(item);
      });
    }
  }
}

/**
 * Set up trending topics animation
 */
function setupTrendingTopics() {
  const trendingList = document.querySelector('.trending-list');
  if (!trendingList) return;

  // Add a subtle animation to trending items
  const items = trendingList.querySelectorAll('.trending-item');
  if (items.length > 0) {
    let index = 0;
    setInterval(() => {
      // Remove highlight from all items
      items.forEach(item => item.classList.remove('highlight'));

      // Add highlight to current item
      items[index].classList.add('highlight');

      // Increment index
      index = (index + 1) % items.length;
    }, 5000);

    // Add CSS for highlight animation if not already present
    if (!document.getElementById('trending-styles')) {
      const style = document.createElement('style');
      style.id = 'trending-styles';
      style.textContent = `
        .trending-item {
          transition: background-color 0.5s ease;
        }
        .trending-item.highlight {
          background-color: rgba(230, 0, 0, 0.1);
        }
      `;
      document.head.appendChild(style);
    }
  }
}

/**
 * Set up upcoming matches countdown timers
 */
function setupUpcomingMatches() {
  const upcomingItems = document.querySelectorAll('.upcoming-match');
  if (!upcomingItems.length) return;

  upcomingItems.forEach(item => {
    const timestampAttr = item.getAttribute('data-timestamp');
    if (!timestampAttr) return;

    const timestamp = parseInt(timestampAttr);
    if (isNaN(timestamp)) return;

    const matchTime = new Date(timestamp);

    // Update countdown every minute
    const countdownElement = item.querySelector('.match-countdown');
    if (countdownElement) {
      updateCountdown(countdownElement, matchTime);
      setInterval(() => updateCountdown(countdownElement, matchTime), 60000);
    }
  });
}

/**
 * Update a countdown element with time remaining
 * @param {HTMLElement} element - The countdown element
 * @param {Date} targetTime - The target time
 */
function updateCountdown(element, targetTime) {
  const now = new Date();
  const diff = targetTime - now;

  if (diff <= 0) {
    element.textContent = 'Starting now';
    element.classList.add('live');
    return;
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) {
    element.textContent = `${days}d ${hours}h ${minutes}m`;
  } else if (hours > 0) {
    element.textContent = `${hours}h ${minutes}m`;
  } else {
    element.textContent = `${minutes}m`;
  }
}

/**
 * Set up league selector in football page
 */
function setupLeagueSelector() {
  const leagueSelector = document.querySelector('.league-selector');
  if (!leagueSelector) return;

  const leagueButtons = leagueSelector.querySelectorAll('.league-button');
  if (!leagueButtons.length) return;

  leagueButtons.forEach(button => {
    button.addEventListener('click', function () {
      // Remove active class from all buttons
      leagueButtons.forEach(btn => btn.classList.remove('active'));

      // Add active class to clicked button
      this.classList.add('active');

      // Get league ID from data attribute
      const leagueId = this.getAttribute('data-league-id');
      if (!leagueId) return;

      // Find the league config
      let leagueConfig = null;
      for (const [key, config] of Object.entries(CONFIG.LEAGUES)) {
        if (config.tournamentId.toString() === leagueId) {
          leagueConfig = config;
          break;
        }
      }

      if (leagueConfig && typeof SportsApp !== 'undefined') {
        // Use SportsApp to switch league
        SportsApp.switchLeague(leagueConfig);
      }
    });
  });
}

/**
 * Set up category switcher on homepage
 */
function setupCategorySwitcher() {
  const categories = document.querySelectorAll('.category');
  if (!categories.length) return;

  categories.forEach(category => {
    category.addEventListener('click', function () {
      // Already active
      if (this.classList.contains('active')) return;

      // Update active state
      categories.forEach(c => c.classList.remove('active'));
      this.classList.add('active');

      // Get category name
      const categoryName = this.textContent.trim().toLowerCase();

      // Handle category change
      switch (categoryName) {
        case 'football':
          if (typeof SportsApp !== 'undefined') {
            const league = CONFIG.LEAGUES.PREMIER_LEAGUE;
            SportsApp.switchLeague(league);
          }
          break;

        case 'ufc':
          if (typeof SportsApp !== 'undefined' && SportsApp.loadUFCPageData) {
            SportsApp.loadUFCPageData();
          }
          break;

        case 'all sports':
          if (typeof SportsApp !== 'undefined') {
            SportsApp.loadHomePageData();
          }
          break;

        default:
          console.log(`Category ${categoryName} not yet implemented`);
      }
    });
  });
}

/**
 * Set up cookie consent banner
 */
function setupCookieConsent() {
  if (localStorage.getItem('cookieConsent') === 'true') return;

  const cookieBanner = document.createElement('div');
  cookieBanner.className = 'cookie-consent';
  cookieBanner.innerHTML = `
    <div class="container">
      <div class="cookie-content">
        <div class="cookie-text">
          <p>We use cookies to improve your experience on our site. By continuing to use our site, you consent to our use of cookies.</p>
        </div>
        <div class="cookie-buttons">
          <button class="cta-button cookie-accept">Accept</button>
          <button class="cta-button cta-secondary cookie-settings">Cookie Settings</button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(cookieBanner);

  // Show banner after a slight delay
  setTimeout(() => {
    cookieBanner.classList.add('visible');
  }, 1000);

  // Add button handlers
  cookieBanner.querySelector('.cookie-accept').addEventListener('click', () => {
    localStorage.setItem('cookieConsent', 'true');
    cookieBanner.classList.remove('visible');
  });

  cookieBanner.querySelector('.cookie-settings').addEventListener('click', () => {
    // Redirect to cookie settings page or open modal
    localStorage.setItem('cookieConsent', 'true');
    cookieBanner.classList.remove('visible');
    window.location.href = 'cookies';
  });
}

/**
 * Set up theme toggle functionality
 */
function setupThemeToggle() {
  // Only create if feature is enabled in config
  if (!CONFIG.isFeatureEnabled || !CONFIG.isFeatureEnabled('THEME_TOGGLE')) return;

  // Create toggle button if not present
  if (!document.querySelector('.theme-toggle')) {
    const themeToggle = document.createElement('button');
    themeToggle.className = 'theme-toggle';
    themeToggle.setAttribute('aria-label', 'Toggle Theme');
    themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
    document.body.appendChild(themeToggle);
  }

  const themeToggle = document.querySelector('.theme-toggle');
  if (!themeToggle) return;

  // Check for saved preference
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const savedTheme = localStorage.getItem('theme');

  // Apply theme based on saved preference or system preference
  if (savedTheme === 'light' || (!savedTheme && !prefersDark)) {
    document.body.classList.add('light-theme');
    themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
  }

  // Toggle theme on click
  themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('light-theme');
    const isLight = document.body.classList.contains('light-theme');

    // Update icon
    themeToggle.innerHTML = isLight ?
      '<i class="fas fa-sun"></i>' :
      '<i class="fas fa-moon"></i>';

    // Save preference
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
  });
}

/**
 * Set up newsletter signup
 */
function setupNewsletterSignup() {
  const newsletterForms = document.querySelectorAll('.newsletter-form');
  if (!newsletterForms.length) return;

  newsletterForms.forEach(form => {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      const emailInput = this.querySelector('input[type="email"]');
      if (!emailInput) return;

      const email = emailInput.value.trim();
      if (!email || !isValidEmail(email)) {
        // Show error
        showFormMessage(this, 'Please enter a valid email address.', 'error');
        return;
      }

      // In a real app, this would make an API call to subscribe the email
      console.log('Newsletter signup:', email);

      // Store in localStorage for demo
      const subscribers = JSON.parse(localStorage.getItem('newsletter_subscribers') || '[]');
      if (!subscribers.includes(email)) {
        subscribers.push(email);
        localStorage.setItem('newsletter_subscribers', JSON.stringify(subscribers));
      }

      // Show success message
      showFormMessage(this, 'Thanks for subscribing!', 'success');

      // Clear the form
      emailInput.value = '';
    });
  });
}

/**
 * Show a message in a form
 * @param {HTMLElement} form - The form element
 * @param {string} message - The message to display
 * @param {string} type - The message type (success, error, info)
 */
function showFormMessage(form, message, type = 'info') {
  // Check if a message already exists
  let messageEl = form.querySelector('.form-message');

  if (!messageEl) {
    // Create message element
    messageEl = document.createElement('div');
    messageEl.className = 'form-message';
    form.appendChild(messageEl);
  }

  // Set message content and class
  messageEl.textContent = message;
  messageEl.className = `form-message form-message-${type}`;

  // Clear message after 5 seconds for success and info messages
  if (type !== 'error') {
    setTimeout(() => {
      messageEl.remove();
    }, 5000);
  }
}

/**
 * Validate email format
 * @param {string} email - The email to validate
 * @returns {boolean} - True if valid
 */
function isValidEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

// Initialize site when DOM is fully loaded
document.addEventListener('DOMContentLoaded', initializeSite);

// Add to main.js
function trackShopRedirect(source) {
  // Track the source of the shop redirect
  const redirectData = {
    source: source,
    page: window.location.pathname,
    timestamp: new Date().toISOString()
  };

  // Store analytics data
  const redirects = JSON.parse(localStorage.getItem('shop_redirects') || '[]');
  redirects.push(redirectData);
  localStorage.setItem('shop_redirects', JSON.stringify(redirects));

  // Redirect with UTM parameters
  window.location.href = `https://smartlivetv.net/shop?utm_source=mainsite&utm_medium=cta&utm_campaign=${source}`;
}

// Then update your buttons:
<button class="cta-button" onclick="trackShopRedirect('header')">
  Watch Live
</button>

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