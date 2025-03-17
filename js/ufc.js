/**
 * SMART Live TV - UFC/MMA Page Script
 * 
 * Handles all UFC page specific functionality including:
 * - Loading next event data
 * - Displaying event schedule
 * - Showing fighter rankings
 * - Recent fight results
 * - UFC news
 */

import CONFIG from './config.js';
import ApiService from './api-service.js';
import ReminderService from './reminder-service.js';
import BlogService from './blog-service.js';
import ErrorHandler from './error-handler.js';

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  console.log('UFC page initializing...');
  initUfcPage();
});

/**
 * Initialize UFC page
 */
function initUfcPage() {
  // Initialize UI components
  initMobileMenu();
  initEventTypeFilter();
  initWeightClassSelector();
  
  // Load data
  loadNextEvent();
  loadEventSchedule();
  loadFighterRankings();
  loadRecentResults();
  loadUfcNews();
  
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
 * Initialize event type filter
 */
function initEventTypeFilter() {
  const eventTypeFilter = document.getElementById('event-type-filter');
  
  if (eventTypeFilter) {
    // Add event listener
    eventTypeFilter.addEventListener('change', function() {
      const eventType = this.value;
      loadEventSchedule(eventType);
    });
  }
}

/**
 * Initialize weight class selector
 */
function initWeightClassSelector() {
  const weightClassSelector = document.getElementById('weight-class-selector');
  
  if (weightClassSelector) {
    // Add event listener
    weightClassSelector.addEventListener('change', function() {
      const weightClass = this.value;
      loadFighterRankings(weightClass);
    });
  }
}

/**
 * Initialize load more button
 */
function initLoadMoreButton() {
  const loadMoreButton = document.getElementById('load-more-events');
  
  if (loadMoreButton) {
    loadMoreButton.addEventListener('click', function() {
      // Increase events count
      window.eventsDisplayed += 5;
      
      // Reload event schedule
      const eventTypeFilter = document.getElementById('event-type-filter');
      const eventType = eventTypeFilter ? eventTypeFilter.value : 'all';
      
      loadEventSchedule(eventType, window.eventsDisplayed);
    });
  }
  
  // Initialize events displayed counter
  window.eventsDisplayed = 5;
}

/**
 * Load next event data
 */
async function loadNextEvent() {
  const container = document.querySelector('.next-event-container');
  const countdownContainer = document.getElementById('event-countdown');
  
  if (!container) return;
  
  try {
    // Show loading state
    container.innerHTML = `
      <div class="loading-indicator">
        <div class="spinner"></div>
        <p>Loading next event data...</p>
      </div>
    `;
    
    // Load upcoming events
    const data = await ApiService.getUfcEvents('upcoming', 1);
    
    // Check if we have events
    if (!data.response || data.response.length === 0) {
      container.innerHTML = `
        <div class="no-data-message">
          <p>No upcoming UFC events available.</p>
        </div>
      `;
      return;
    }
    
    // Get next event
    const nextEvent = data.response[0];
    
    // Get main event fight
    const mainEvent = nextEvent.fights && nextEvent.fights.find(fight => fight.isMainEvent) || 
                     (nextEvent.fights && nextEvent.fights.length > 0 ? nextEvent.fights[0] : null);
    
    // Format event time
    const eventDate = new Date(nextEvent.date);
    const formattedDate = eventDate.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
    
    const formattedTime = eventDate.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short'
    });

    // Initialize countdown
    initCountdown(countdownContainer, nextEvent.date);

    // Populate event details
    container.innerHTML = `
      <div class="event-details">
        <h3>${nextEvent.title}</h3>
        <p>${formattedDate} at ${formattedTime}</p>
        <p>${mainEvent ? `Main Event: ${mainEvent.fighters[0].name} vs ${mainEvent.fighters[1].name}` : 'No main event'}</p>
      </div>
    `;
  } catch (error) {
    console.error('Error loading next event:', error);
    container.innerHTML = `
      <div class="error-message">
        <p>An error occurred while loading the next event.</p>
      </div>
    `;
  }
}

/**
 * Initialize countdown
 */
function initCountdown(container, targetDate) {
  if (!container) return;
  
  // Set the date we're counting down to
  const countDownDate = new Date(targetDate).getTime();
  
  // Update the countdown every 1 second
  const countdownInterval = setInterval(function() {
    // Get current date and time
    const now = new Date().getTime();
    
    // Find the time difference between now and the countdown date
    const distance = countDownDate - now;
    
    // If the countdown is over, clear interval and show expired message
    if (distance < 0) {
      clearInterval(countdownInterval);
      container.innerHTML = '<span class="happening-now">Happening Now!</span>';
      return;
    }
    
    // Time calculations for days, hours, minutes and seconds
    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);
    
    // Display the countdown
    container.innerHTML = `
      <div class="countdown">
        <div class="countdown-item">
          <span class="countdown-value">${days}</span>
          <span class="countdown-label">Days</span>
        </div>
        <div class="countdown-item">
          <span class="countdown-value">${hours}</span>
          <span class="countdown-label">Hours</span>
        </div>
        <div class="countdown-item">
          <span class="countdown-value">${minutes}</span>
          <span class="countdown-label">Minutes</span>
        </div>
        <div class="countdown-item">
          <span class="countdown-value">${seconds}</span>
          <span class="countdown-label">Seconds</span>
        </div>
      </div>
    `;
  }, 1000);
}

/**
 * Load event schedule
 */
async function loadEventSchedule(eventType = 'all', start = 0) {
  const container = document.querySelector('.event-schedule-container');
  
  if (!container) return;
  
  try {
    // Show loading state
    container.innerHTML = `
      <div class="loading-indicator">
        <div class="spinner"></div>
        <p>Loading event schedule...</p>
      </div>
    `;
    
    // Load event schedule
    const data = await ApiService.getUfcEvents('schedule', { eventType, start });
    
    // Check if we have events
    if (!data.response || data.response.length === 0) {
      container.innerHTML = `
        <div class="no-data-message">
          <p>No upcoming UFC events available.</p>
        </div>
      `;
      return;
    }
    
    // Populate event schedule
    container.innerHTML = `
      <div class="event-schedule">
        ${data.response.map(event => `
          <div class="event-item">
            <h3>${event.title}</h3>
            <p>${event.date}</p>
            <p>${event.type}</p>
            <button class="reminder-button" data-id="${event.id}">Set Reminder</button>
          </div>
        `).join('')}
      </div>
    `;
    
    // Initialize reminder buttons
    const reminderButtons = document.querySelectorAll('.reminder-button');
    reminderButtons.forEach(button => {
      button.addEventListener('click', function() {
        const eventId = this.getAttribute('data-id');
        loadEventDetails(eventId);
      });
    });
  } catch (error) {
    console.error('Error loading event schedule:', error);
    container.innerHTML = `
      <div class="error-message">
        <p>An error occurred while loading the event schedule.</p>
      </div>
    `;
  }
}

/**
 * Load event details
 */
async function loadEventDetails(eventId) {
  const container = document.querySelector('.event-details-container');
  
  if (!container) return;
  
  try {
    // Show loading state
    container.innerHTML = `
      <div class="loading-indicator">
        <div class="spinner"></div>
        <p>Loading event details...</p>
      </div>
    `;
    
    // Load event details
    const data = await ApiService.getUfcEventDetails(eventId);
    
    // Populate event details
    container.innerHTML = `
      <div class="event-details">
        <h2>${data.title}</h2>
        <p>${data.date}</p>
        <p>${data.type}</p>
        <p>${data.description}</p>
        <button class="reminder-button" data-id="${data.id}">Set Reminder</button>
      </div>
    `;
    
    // Initialize reminder button
    const reminderButton = document.querySelector('.reminder-button');
    if (reminderButton) {
      reminderButton.addEventListener('click', function() {
        setEventReminder(data.id, data.title, data.date);
      });
    }
  } catch (error) {
    console.error('Error loading event details:', error);
    container.innerHTML = `
      <div class="error-message">
        <p>An error occurred while loading the event details.</p>
      </div>
    `;
  }
}

/**
 * Load fighter rankings
 */
async function loadFighterRankings(weightClass = 'pound-for-pound') {
  const container = document.querySelector('.rankings-container');
  
  if (!container) return;
  
  try {
    // Show loading state
    container.innerHTML = `
      <div class="loading-indicator">
        <div class="spinner"></div>
        <p>Loading fighter rankings...</p>
      </div>
    `;
    
    // Load fighter rankings
    const data = await ApiService.getUfcFighterRankings(weightClass);
    
    // Check if we have fighters
    if (!data.response || data.response.length === 0) {
      container.innerHTML = `
        <div class="no-data-message">
          <p>No fighters found for the selected weight class.</p>
        </div>
      `;
      return;
    }
    
    // Populate fighter rankings
    container.innerHTML = `
      <div class="fighter-rankings">
        ${data.response.map(fighter => `
          <div class="fighter-item">
            <h3>${fighter.name}</h3>
            <p>${fighter.weightClass}</p>
          </div>
        `).join('')}
      </div>
    `;
  } catch (error) {
    console.error('Error loading fighter rankings:', error);
    container.innerHTML = `
      <div class="error-message">
        <p>An error occurred while loading the fighter rankings.</p>
      </div>
    `;
  }
}

/**
 * Load recent fight results
 */
async function loadRecentResults() {
  const container = document.querySelector('.recent-results-container');
  
  if (!container) return;
  
  try {
    // Show loading state
    container.innerHTML = `
      <div class="loading-indicator">
        <div class="spinner"></div>
        <p>Loading recent results...</p>
      </div>
    `;
    
    // Load recent fight results
    const data = await ApiService.getUfcRecentResults();
    
    // Check if we have results
    if (!data.response || data.response.length === 0) {
      container.innerHTML = `
        <div class="no-data-message">
          <p>No recent fight results available.</p>
        </div>
      `;
      return;
    }
    
    // Populate recent results
    container.innerHTML = `
      <div class="recent-results">
        ${data.response.map(result => `
          <div class="result-item">
            <h3>${result.eventTitle}</h3>
            <p>${result.date}</p>
            <p>${result.result}</p>
          </div>
        `).join('')}
      </div>
    `;
  } catch (error) {
    console.error('Error loading recent results:', error);
    container.innerHTML = `
      <div class="error-message">
        <p>An error occurred while loading the recent results.</p>
      </div>
    `;
  }
}

/**
 * Load UFC news
 */
async function loadUfcNews() {
  const container = document.querySelector('.ufc-news');
  
  if (!container) return;
  
  try {
    // Show loading state
    container.innerHTML = `
      <div class="loading-indicator">
        <div class="spinner"></div>
        <p>Loading news...</p>
      </div>
    `;
    
    // Load UFC news
    const data = await ApiService.getUfcNews();
    
    // Check if we have news
    if (!data.response || data.response.length === 0) {
      container.innerHTML = `
        <div class="no-data-message">
          <p>No news available.</p>
        </div>
      `;
      return;
    }
    
    // Populate news
    container.innerHTML = `
      <div class="news-grid">
        ${data.response.map(news => `
          <div class="news-item">
            <h3>${news.title}</h3>
            <p>${news.summary}</p>
            <a href="${news.url}" target="_blank">Read More</a>
          </div>
        `).join('')}
      </div>
    `;
  } catch (error) {
    console.error('Error loading UFC news:', error);
    container.innerHTML = `
      <div class="error-message">
        <p>An error occurred while loading the UFC news.</p>
      </div>
    `;
  }
}

/**
 * Set a reminder for a UFC event
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