/**
 * SMART Live TV - Reminder Service
 * 
 * Manages event reminders, including:
 * - Setting reminders for upcoming events
 * - Sending browser notifications
 * - Managing user's reminder list
 * - Syncing with different reminder methods
 */

import CONFIG from './config.js';

/**
 * ReminderService - Manages sports event reminders
 */
const ReminderService = {
  /**
   * Initialize the reminder service
   */
  init() {
    // Check for reminders every minute
    setInterval(() => this.checkReminders(), 60000);

    // Request notification permission if needed
    this.requestNotificationPermission();

    console.log('Reminder Service initialized');
  },

  /**
   * Request notification permission
   */
  requestNotificationPermission() {
    if (CONFIG.REMINDERS.NOTIFICATION_OPTIONS.BROWSER && 'Notification' in window) {
      if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
        // Wait a bit before asking for permission
        setTimeout(() => {
          Notification.requestPermission();
        }, 10000);
      }
    }
  },

  /**
   * Set reminder for event
   * @param {string} eventId - Event ID
   * @param {string} eventName - Event name
   * @param {string} eventType - Event type (football, ufc, f1)
   * @param {Date} eventDate - Event date
   * @param {number} minutesBefore - Minutes before event to send reminder
   * @returns {string} - Reminder ID
   */
  setReminder(eventId, eventName, eventType, eventDate, minutesBefore = 30) {
    try {
      // Validate inputs
      if (!eventId || !eventName || !eventDate) {
        console.error('Missing required parameters for reminder');
        return null;
      }
      
      // Convert to Date object if string
      const eventDateTime = eventDate instanceof Date ? eventDate : new Date(eventDate);
      
      // Validate event date
      if (isNaN(eventDateTime.getTime())) {
        console.error('Invalid event date');
        return null;
      }
      
      // Create reminder object
      const reminderId = `reminder-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
      const reminder = {
        id: reminderId,
        eventId: eventId,
        eventName: eventName,
        eventType: eventType || 'general',
        eventDate: eventDateTime.toISOString(),
        minutesBefore: minutesBefore,
        created: new Date().toISOString(),
        sent: false
      };
      
      // Get existing reminders
      const reminders = this.getUserReminders();
      
      // Add new reminder
      reminders.push(reminder);
      
      // Save updated reminders
      localStorage.setItem(CONFIG.REMINDERS.STORAGE_KEY, JSON.stringify(reminders));
      
      // Request notification permission if needed
      this.requestNotificationPermission();
      
      // Return reminder ID
      return reminderId;
    } catch (error) {
      console.error('Error setting reminder:', error);
      return null;
    }
  },

  /**
   * Check and send due reminders
   */
  checkReminders() {
    try {
      // Get reminders from localStorage
      const remindersJson = localStorage.getItem(CONFIG.REMINDERS.STORAGE_KEY);
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
      localStorage.setItem(CONFIG.REMINDERS.STORAGE_KEY, JSON.stringify(updatedReminders));
    } catch (error) {
      console.error('Error checking reminders:', error);
    }
  },

  /**
   * Send reminder notification
   * @param {Object} reminder - Reminder object
   */
  sendReminderNotification(reminder) {
    // Browser notification
    if (CONFIG.REMINDERS.NOTIFICATION_OPTIONS.BROWSER && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        const eventDate = new Date(reminder.eventDate);
        const formattedTime = eventDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        const title = `Event Reminder: ${reminder.eventName}`;
        const options = {
          body: `Starting in ${reminder.minutesBefore} minutes at ${formattedTime}!`,
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
          window.location.href = CONFIG.getRelativePath(url);
        };

        console.log(`Notification sent for ${reminder.eventName}`);
      }
    }

    // Add sound effect if enabled
    if (CONFIG.REMINDERS.NOTIFICATION_OPTIONS.SOUND) {
      try {
        const audio = new Audio('/sounds/notification.mp3');
        audio.play();
      } catch (e) {
        console.warn('Could not play notification sound:', e);
      }
    }
  },

  /**
   * Get user reminders
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
   * @param {string} reminderId - Reminder ID
   * @returns {boolean} - Success status
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
   * Format relative time until an event
   * @param {Date|string} eventDate - Event date
   * @returns {string} - Formatted relative time
   */
  formatRelativeTime(eventDate) {
    const timeRemaining = CONFIG.getTimeRemaining(eventDate);

    if (timeRemaining.totalMs <= 0) {
      return 'Starting now';
    }

    if (timeRemaining.days > 0) {
      return `${timeRemaining.days}d ${timeRemaining.hours}h ${timeRemaining.minutes}m`;
    } else if (timeRemaining.hours > 0) {
      return `${timeRemaining.hours}h ${timeRemaining.minutes}m`;
    } else {
      return `${timeRemaining.minutes}m`;
    }
  },

  /**
   * Get upcoming reminders
   * @param {number} limit - Maximum number of reminders to return
   * @returns {Array} - List of upcoming reminders
   */
  getUpcomingReminders(limit = 5) {
    const reminders = this.getUserReminders();
    const now = new Date();

    // Filter for upcoming reminders that haven't been sent yet
    const upcomingReminders = reminders
      .filter(r => {
        const eventDate = new Date(r.eventDate);
        return eventDate > now && !r.sent;
      })
      // Sort by closest first
      .sort((a, b) => new Date(a.eventDate) - new Date(b.eventDate));

    // Limit results
    return upcomingReminders.slice(0, limit);
  },

  /**
   * Update reminder settings
   * @param {string} reminderId - Reminder ID 
   * @param {Object} settings - New settings
   * @returns {boolean} - Success status
   */
  updateReminderSettings(reminderId, settings) {
    try {
      const reminders = this.getUserReminders();
      const reminder = reminders.find(r => r.id === reminderId);

      if (!reminder) {
        return false;
      }

      // Update settings
      if (settings.minutesBefore) {
        reminder.minutesBefore = settings.minutesBefore;
      }

      // Save updated reminders
      localStorage.setItem(CONFIG.REMINDERS.STORAGE_KEY, JSON.stringify(reminders));
      return true;
    } catch (error) {
      console.error('Error updating reminder settings:', error);
      return false;
    }
  },

  /**
   * Clear all reminders
   * @returns {boolean} - Success status
   */
  clearAllReminders() {
    try {
      localStorage.removeItem(CONFIG.REMINDERS.STORAGE_KEY);
      return true;
    } catch (error) {
      console.error('Error clearing reminders:', error);
      return false;
    }
  }
};

// Initialize the service
ReminderService.init();

// Export the service
export default ReminderService;