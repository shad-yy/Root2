/**
 * SMART Live TV - Contact Page Script
 * 
 * Handles functionality for the Contact page including:
 * - Contact form submission
 * - Form validation
 * - FAQ accordion
 */

import CONFIG from './config.js';
import ErrorHandler from './error-handler.js';

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  console.log('Contact page initializing...');
  initContactPage();
});

/**
 * Initialize contact page
 */
function initContactPage() {
  // Initialize mobile menu
  initMobileMenu();
  
  // Initialize contact form
  initContactForm();
  
  // Initialize FAQ accordion
  initFaqAccordion();
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
 * Initialize contact form
 */
function initContactForm() {
  const contactForm = document.getElementById('contact-form');
  const formStatus = document.getElementById('form-status');
  
  if (contactForm) {
    // Add submit event listener
    contactForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      // Get form data
      const formData = new FormData(contactForm);
      const formObject = {};
      
      formData.forEach((value, key) => {
        formObject[key] = value;
      });
      
      // Validate form data
      const validationResult = validateForm(formObject);
      
      if (!validationResult.valid) {
        // Show validation error
        showFormError(formStatus, validationResult.message);
        return;
      }
      
      // Show loading state
      showFormLoading(formStatus);
      
      // Submit form
      submitContactForm(formObject)
        .then(response => {
          // Show success message
          showFormSuccess(formStatus);
          // Reset form
          contactForm.reset();
        })
        .catch(error => {
          // Show error message
          showFormError(formStatus, error.message || 'An error occurred. Please try again later.');
          ErrorHandler.logError('contact_form_submit', error);
        });
    });
  }
}

/**
 * Validate form data
 * @param {object} formData - Form data object
 * @returns {object} - Validation result with valid status and message
 */
function validateForm(formData) {
  // Check if all required fields are filled
  if (!formData.name || !formData.email || !formData.subject || !formData.message) {
    return {
      valid: false,
      message: 'Please fill in all required fields.'
    };
  }
  
  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(formData.email)) {
    return {
      valid: false,
      message: 'Please enter a valid email address.'
    };
  }
  
  // Validate message length
  if (formData.message.length < 10) {
    return {
      valid: false,
      message: 'Your message is too short. Please provide more details.'
    };
  }
  
  // Validation passed
  return {
    valid: true,
    message: ''
  };
}

/**
 * Submit contact form data to the server
 * @param {object} formData - Form data object
 * @returns {Promise} - Promise resolving to the server response
 */
async function submitContactForm(formData) {
  try {
    // For demonstration purposes, simulate a successful form submission after a delay
    // In a real application, this would be an API call to your backend
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (Math.random() > 0.1) {  // 90% success rate for demo
          resolve({ success: true, message: 'Your message has been sent successfully.' });
        } else {
          reject(new Error('Connection error. Please try again.'));
        }
      }, 1500);  // Simulate network delay
    });
    
    /* 
    // Actual API call implementation for a real application
    const response = await fetch(`${CONFIG.API_BASE_URL}/contact`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': CONFIG.API_KEY
      },
      body: JSON.stringify(formData)
    });
    
    if (!response.ok) {
      throw new Error('Server error. Please try again later.');
    }
    
    return await response.json();
    */
  } catch (error) {
    console.error('Error submitting form:', error);
    throw error;
  }
}

/**
 * Show form loading state
 * @param {HTMLElement} statusElement - Form status element
 */
function showFormLoading(statusElement) {
  if (!statusElement) return;
  
  statusElement.className = 'form-status loading';
  statusElement.innerHTML = `
    <div class="form-status-message">
      <div class="spinner"></div>
      <p>Sending your message...</p>
    </div>
  `;
}

/**
 * Show form success message
 * @param {HTMLElement} statusElement - Form status element
 */
function showFormSuccess(statusElement) {
  if (!statusElement) return;
  
  statusElement.className = 'form-status success';
  statusElement.innerHTML = `
    <div class="form-status-message">
      <i class="fas fa-check-circle"></i>
      <p>Thank you! Your message has been sent successfully.</p>
      <p class="form-status-details">We'll get back to you as soon as possible.</p>
    </div>
  `;
  
  // Clear success message after a delay
  setTimeout(() => {
    statusElement.className = 'form-status';
    statusElement.innerHTML = '';
  }, 5000);
}

/**
 * Show form error message
 * @param {HTMLElement} statusElement - Form status element
 * @param {string} message - Error message
 */
function showFormError(statusElement, message) {
  if (!statusElement) return;
  
  statusElement.className = 'form-status error';
  statusElement.innerHTML = `
    <div class="form-status-message">
      <i class="fas fa-exclamation-circle"></i>
      <p>Error: ${message}</p>
    </div>
  `;
}

/**
 * Initialize FAQ accordion
 */
function initFaqAccordion() {
  const faqItems = document.querySelectorAll('.faq-item');
  
  faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');
    const answer = item.querySelector('.faq-answer');
    const toggle = item.querySelector('.faq-toggle');
    
    if (question && answer && toggle) {
      // Add click event listener
      question.addEventListener('click', function() {
        // Check if already active
        const isActive = item.classList.contains('active');
        
        // Close all other items
        faqItems.forEach(otherItem => {
          if (otherItem !== item) {
            otherItem.classList.remove('active');
            const otherToggle = otherItem.querySelector('.faq-toggle i');
            if (otherToggle) {
              otherToggle.className = 'fas fa-plus';
            }
          }
        });
        
        // Toggle active state
        item.classList.toggle('active');
        
        // Update toggle icon
        if (toggle.querySelector('i')) {
          toggle.querySelector('i').className = isActive ? 'fas fa-plus' : 'fas fa-minus';
        }
      });
    }
  });
} 