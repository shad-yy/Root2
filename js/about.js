/**
 * SMART Live TV - About Page Script
 * 
 * Handles functionality for the About Us page
 */

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  console.log('About page initializing...');
  initAboutPage();
});

/**
 * Initialize about page
 */
function initAboutPage() {
  // Initialize mobile menu
  initMobileMenu();
  
  // Initialize any animations or interactive elements
  initAnimations();
  
  // Initialize team member interactions
  initTeamInteractions();
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
 * Initialize animations for elements as they scroll into view
 */
function initAnimations() {
  // Select elements to animate
  const animatedElements = document.querySelectorAll('.about-section, .value-card, .team-member, .stat-card');
  
  // Check if IntersectionObserver is supported
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animated');
          // Stop observing after animation has been triggered
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1  // Trigger when at least 10% of the element is visible
    });
    
    // Observe each element
    animatedElements.forEach(element => {
      observer.observe(element);
    });
  } else {
    // Fallback for browsers that don't support IntersectionObserver
    animatedElements.forEach(element => {
      element.classList.add('animated');
    });
  }
}

/**
 * Initialize team member interactions
 */
function initTeamInteractions() {
  const teamMembers = document.querySelectorAll('.team-member');
  
  teamMembers.forEach(member => {
    // Add hover effect
    member.addEventListener('mouseenter', function() {
      this.classList.add('hovered');
    });
    
    member.addEventListener('mouseleave', function() {
      this.classList.remove('hovered');
    });
    
    // Add click effect for mobile
    member.addEventListener('click', function() {
      // Remove active class from all members
      teamMembers.forEach(m => {
        if (m !== this) {
          m.classList.remove('active');
        }
      });
      
      // Toggle active class on clicked member
      this.classList.toggle('active');
    });
  });
} 