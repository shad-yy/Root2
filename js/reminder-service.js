/**
 * SMART Live TV - Reminder Service
 * 
 * Handles setting, displaying, and managing reminders for upcoming events
 */

import CONFIG from './config.js';
import ErrorHandler from './error-handler.js';

const ReminderService = {
  /**
   * Storage key for reminders
   */
  STORAGE_KEY: 'smart_live_tv_reminders',
  
  /**
   * Initialize reminder service
   */
  init() {
    console.log('Reminder service initialized');
    
    // Check if notifications are supported
    this.checkNotificationSupport();
    
    // Check for upcoming reminders on page load
    if (CONFIG.FEATURES.ENABLE_NOTIFICATIONS) {
      this.checkUpcomingReminders();
      
      // Set interval to check for reminders every minute
      setInterval(() => this.checkUpcomingReminders(), 60000);
    }
  },
  
  /**
   * Check if notifications are supported
   */
  checkNotificationSupport() {
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return false;
    }
    
    return true;
  },
  
  /**
   * Request notification permission if needed
   * @returns {Promise} - Permission result
   */
  async requestPermission() {
    if (!this.checkNotificationSupport()) {
      return 'denied';
    }
    
    if (Notification.permission === 'granted') {
      return 'granted';
    }
    
    if (Notification.permission !== 'denied') {
      try {
        const permission = await Notification.requestPermission();
        return permission;
      } catch (error) {
        ErrorHandler.logError('notification_permission_request', error);
        return 'denied';
      }
    }
    
    return Notification.permission;
  },
  
  /**
   * Set a reminder for an event
   * @param {object} event - Event to set reminder for
   * @param {string} event.id - Event ID
   * @param {string} event.title - Event title
   * @param {string} event.time - Event time (ISO string)
   * @returns {boolean} - Success state
   */
  async setReminder(event) {
    try {
      // Request permission first
      const permission = await this.requestPermission();
      
      if (permission !== 'granted') {
        ErrorHandler.showError(
          'Notification permission is required to set reminders. Please enable notifications in your browser settings.',
          'warning'
        );
        return false;
      }
      
      // Get existing reminders
      const reminders = this.getReminders();
      
      // Check if reminder already exists
      const existingIndex = reminders.findIndex(r => r.id === event.id);
      
      if (existingIndex !== -1) {
        // Update existing reminder
        reminders[existingIndex] = {
          ...event,
          createdAt: reminders[existingIndex].createdAt,
          updatedAt: new Date().toISOString()
        };
      } else {
        // Add new reminder
        reminders.push({
          ...event,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
      
      // Save reminders
      this.saveReminders(reminders);
      
      return true;
    } catch (error) {
      ErrorHandler.logError('set_reminder', error, { event });
      ErrorHandler.showError('Failed to set reminder. Please try again.');
      return false;
    }
  },
  
  /**
   * Remove a reminder
   * @param {string} eventId - Event ID to remove reminder for
   * @returns {boolean} - Success state
   */
  removeReminder(eventId) {
    try {
      // Get existing reminders
      const reminders = this.getReminders();
      
      // Filter out the reminder to remove
      const filteredReminders = reminders.filter(r => r.id !== eventId);
      
      // Save reminders
      this.saveReminders(filteredReminders);
      
      return true;
    } catch (error) {
      ErrorHandler.logError('remove_reminder', error, { eventId });
      return false;
    }
  },
  
  /**
   * Get all reminders
   * @returns {array} - List of reminders
   */
  getReminders() {
    try {
      const remindersJson = localStorage.getItem(this.STORAGE_KEY);
      return remindersJson ? JSON.parse(remindersJson) : [];
    } catch (error) {
      ErrorHandler.logError('get_reminders', error);
      return [];
    }
  },
  
  /**
   * Save reminders to local storage
   * @param {array} reminders - List of reminders
   */
  saveReminders(reminders) {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(reminders));
    } catch (error) {
      ErrorHandler.logError('save_reminders', error);
    }
  },
  
  /**
   * Check for upcoming reminders
   */
  checkUpcomingReminders() {
    try {
      const reminders = this.getReminders();
      const now = new Date();
      
      // Check each reminder
      reminders.forEach(reminder => {
        const eventTime = new Date(reminder.time);
        const timeDiff = eventTime - now;
        
        // If event is within 30 minutes and not in the past
        if (timeDiff > 0 && timeDiff <= 30 * 60 * 1000) {
          // Send notification
          this.sendNotification(reminder);
          
          // Remove reminder after notification is sent
          this.removeReminder(reminder.id);
        }
      });
    } catch (error) {
      ErrorHandler.logError('check_upcoming_reminders', error);
    }
  },
  
  /**
   * Send notification for a reminder
   * @param {object} reminder - Reminder to notify about
   */
  sendNotification(reminder) {
    if (!this.checkNotificationSupport() || Notification.permission !== 'granted') {
      return;
    }
    
    try {
      const minutes = Math.round((new Date(reminder.time) - new Date()) / (60 * 1000));
      
      const notification = new Notification('Event Reminder', {
        body: `${reminder.title} starts in ${minutes} minutes`,
        icon: '/main/images/favicon.png',
        badge: '/main/images/favicon.png',
        tag: `reminder-${reminder.id}`,
        requireInteraction: true
      });
      
      // Handle notification click
      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    } catch (error) {
      ErrorHandler.logError('send_notification', error, { reminder });
    }
  },
  
  /**
   * Show confirmation message for set reminder
   * @param {string} eventTitle - Event title
   * @param {number} minutes - Minutes before event
   */
  showConfirmation(eventTitle, minutes = 30) {
    const container = document.createElement('div');
    container.className = 'reminder-confirmation';
    container.innerHTML = `
      <div class="confirmation-inner">
        <i class="fas fa-bell"></i>
        <h3>Reminder Set</h3>
        <p>You will be notified ${minutes} minutes before <strong>${eventTitle}</strong> starts.</p>
        <button class="close-btn">OK</button>
      </div>
    `;
    
    // Add to document
    document.body.appendChild(container);
    
    // Add active class after a short delay (for animation)
    setTimeout(() => {
      container.classList.add('active');
    }, 10);
    
    // Add close button functionality
    const closeBtn = container.querySelector('.close-btn');
    closeBtn.addEventListener('click', () => {
      container.classList.remove('active');
      
      // Remove from DOM after animation
      setTimeout(() => {
        document.body.removeChild(container);
      }, 300);
    });
    
    // Auto-close after 5 seconds
    setTimeout(() => {
      if (document.body.contains(container)) {
        container.classList.remove('active');
        
        // Remove from DOM after animation
        setTimeout(() => {
          if (document.body.contains(container)) {
            document.body.removeChild(container);
          }
        }, 300);
      }
    }, 5000);
  }
};

// Initialize reminder service
ReminderService.init();

// Export reminder service
export default ReminderService;