/**
 * SMART Live TV - Blog Page Script
 * 
 * Handles all blog page specific functionality including:
 * - Loading blog posts
 * - Filtering by category
 * - Searching posts
 * - Pagination
 * - Category and tag display
 */

import CONFIG from './config.js';
import BlogService from './blog-service.js';
import ErrorHandler from './error-handler.js';

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  console.log('Blog page initializing...');
  initBlogPage();
});

/**
 * Initialize blog page
 */
function initBlogPage() {
  // Initialize UI components
  initMobileMenu();
  initCategoryFilter();
  initSearchFunctionality();
  
  // Load data
  loadFeaturedArticle();
  loadBlogPosts();
  loadPopularPosts();
  loadCategories();
  loadTagCloud();
  
  // Check for URL parameters
  checkUrlParameters();
  
  // Initialize newsletter forms
  initNewsletterForms();
}

/**
 * Search posts by tag
 * @param {string} tag - Tag to search for
 */
async function searchPostsByTag(tag) {
  const container = document.getElementById('blog-posts');
  if (!container || !tag) return;
  
  try {
    // Show loading indicator
    container.innerHTML = `
      <div class="loading-indicator">
        <div class="spinner"></div>
        <p>Searching for posts with tag "${tag}"...</p>
      </div>
    `;
    
    // Search posts by tag
    const tagResults = await BlogService.getPostsByTag(tag);
    
    // Check if we have results
    if (!tagResults || tagResults.length === 0) {
      container.innerHTML = `
        <div class="no-data-message">
          <p>No articles found with tag "${tag}".</p>
          <a href="#" id="clear-tag-search" class="clear-search">Clear Search</a>
        </div>
      `;
      
      // Add event listener to clear search
      const clearTagSearch = document.getElementById('clear-tag-search');
      if (clearTagSearch) {
        clearTagSearch.addEventListener('click', function(e) {
          e.preventDefault();
          
          // Reset posts
          loadBlogPosts('all', 1);
        });
      }
      
      // Hide pagination
      const paginationContainer = document.getElementById('blog-pagination');
      if (paginationContainer) {
        paginationContainer.innerHTML = '';
      }
      
      return;
    }
    
    // Display results
    displayBlogPosts(tagResults);
    
    // Update category filter to show "All Categories"
    const categoryFilter = document.getElementById('category-filter');
    if (categoryFilter) {
      categoryFilter.value = 'all';
    }
    
    // Update blog heading
    const blogFiltersHeading = document.querySelector('.filter-header h2');
    if (blogFiltersHeading) {
      blogFiltersHeading.textContent = `Articles Tagged: "${tag}"`;
    }
    
    // Hide pagination for tag search
    const paginationContainer = document.getElementById('blog-pagination');
    if (paginationContainer) {
      paginationContainer.innerHTML = `
        <div class="pagination-info">
          <p>Showing ${tagResults.length} results for tag "${tag}"</p>
          <a href="#" id="clear-tag-filter" class="clear-filter">Clear Filter</a>
        </div>
      `;
      
      // Add event listener to clear filter
      const clearTagFilter = document.getElementById('clear-tag-filter');
      if (clearTagFilter) {
        clearTagFilter.addEventListener('click', function(e) {
          e.preventDefault();
          
          // Reset posts
          loadBlogPosts('all', 1);
          
          // Reset heading
          if (blogFiltersHeading) {
            blogFiltersHeading.textContent = 'Latest Articles';
          }
        });
      }
    }
    
  } catch (error) {
    console.error('Error searching posts by tag:', error);
    container.innerHTML = `
      <div class="error-message">
        <i class="fas fa-exclamation-circle"></i>
        <p>Unable to search posts. Please try again later.</p>
      </div>
    `;
  }
}

/**
 * Check URL parameters for category or search query
 */
function checkUrlParameters() {
  // Get URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const category = urlParams.get('category');
  const query = urlParams.get('query');
  const tag = urlParams.get('tag');
  
  // If category parameter exists
  if (category) {
    // Update category filter
    const categoryFilter = document.getElementById('category-filter');
    if (categoryFilter) {
      const categoryOption = Array.from(categoryFilter.options).find(option => 
        option.value.toLowerCase() === category.toLowerCase()
      );
      
      if (categoryOption) {
        categoryFilter.value = categoryOption.value;
        loadBlogPosts(categoryOption.value, 1);
      } else {
        // If category not found in options, load all posts
        loadBlogPosts('all', 1);
      }
    }
  }
  // If search query parameter exists
  else if (query) {
    // Update search input
    const searchInput = document.getElementById('blog-search-input');
    if (searchInput) {
      searchInput.value = query;
      searchPosts(query);
    }
  }
  // If tag parameter exists
  else if (tag) {
    searchPostsByTag(tag);
  }
}

/**
 * Create a blog post card
 * @param {Object} post - Blog post data
 * @returns {string} - HTML for the blog post card
 */
function createBlogPostCard(post) {
  // Format date
  const postDate = new Date(post.date);
  const formattedDate = postDate.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
  
  // Create tag links
  let tagLinks = '';
  if (post.tags && post.tags.length > 0) {
    tagLinks = post.tags.map(tag => 
      `<a href="/main/blog.html?tag=${encodeURIComponent(tag)}" class="post-tag">${tag}</a>`
    ).join('');
  }
  
  // Return HTML for blog post card
  return `
    <article class="blog-card">
      <div class="blog-image">
        <a href="/main/blog/${post.slug}.html">
          <img src="${post.image}" alt="${post.title}">
        </a>
      </div>
      <div class="blog-content">
        <div class="blog-meta">
          <span class="category"><a href="/main/blog.html?category=${encodeURIComponent(post.category)}">${post.category}</a></span>
          <span class="date">${formattedDate}</span>
        </div>
        <h3><a href="/main/blog/${post.slug}.html">${post.title}</a></h3>
        <p>${post.summary}</p>
        <div class="blog-footer">
          <a href="/main/blog/${post.slug}.html" class="read-more">Read More</a>
          <div class="post-tags">
            ${tagLinks}
          </div>
        </div>
      </div>
    </article>
  `;
}

/**
 * Generate pagination controls
 * @param {number} currentPage - Current page number
 * @param {number} totalPages - Total number of pages
 * @param {string} category - Current category filter
 * @returns {string} - HTML for pagination controls
 */
function generatePagination(currentPage, totalPages, category = 'all') {
  if (totalPages <= 1) {
    return '';
  }
  
  let paginationHTML = '<div class="pagination-controls">';
  
  // Previous page button
  if (currentPage > 1) {
    paginationHTML += `
      <a href="#" class="pagination-prev" data-page="${currentPage - 1}" data-category="${category}">
        <i class="fas fa-chevron-left"></i> Previous
      </a>
    `;
  } else {
    paginationHTML += `
      <span class="pagination-prev disabled">
        <i class="fas fa-chevron-left"></i> Previous
      </span>
    `;
  }
  
  // Page numbers
  paginationHTML += '<div class="pagination-numbers">';
  
  // Determine range of page numbers to show
  let startPage = Math.max(1, currentPage - 2);
  let endPage = Math.min(totalPages, startPage + 4);
  
  // Adjust start page if end page is at max
  if (endPage === totalPages) {
    startPage = Math.max(1, endPage - 4);
  }
  
  // First page
  if (startPage > 1) {
    paginationHTML += `
      <a href="#" class="pagination-number" data-page="1" data-category="${category}">1</a>
    `;
    
    if (startPage > 2) {
      paginationHTML += '<span class="pagination-ellipsis">...</span>';
    }
  }
  
  // Page numbers
  for (let i = startPage; i <= endPage; i++) {
    if (i === currentPage) {
      paginationHTML += `<span class="pagination-number active">${i}</span>`;
    } else {
      paginationHTML += `
        <a href="#" class="pagination-number" data-page="${i}" data-category="${category}">${i}</a>
      `;
    }
  }
  
  // Last page
  if (endPage < totalPages) {
    if (endPage < totalPages - 1) {
      paginationHTML += '<span class="pagination-ellipsis">...</span>';
    }
    
    paginationHTML += `
      <a href="#" class="pagination-number" data-page="${totalPages}" data-category="${category}">${totalPages}</a>
    `;
  }
  
  paginationHTML += '</div>';
  
  // Next page button
  if (currentPage < totalPages) {
    paginationHTML += `
      <a href="#" class="pagination-next" data-page="${currentPage + 1}" data-category="${category}">
        Next <i class="fas fa-chevron-right"></i>
      </a>
    `;
  } else {
    paginationHTML += `
      <span class="pagination-next disabled">
        Next <i class="fas fa-chevron-right"></i>
      </span>
    `;
  }
  
  paginationHTML += '</div>';
  
  return paginationHTML;
}

/**
 * Add pagination event listeners
 * @param {string} category - Current category filter
 */
function addPaginationEventListeners(category = 'all') {
  const paginationLinks = document.querySelectorAll('.pagination-prev, .pagination-next, .pagination-number');
  
  paginationLinks.forEach(link => {
    if (!link.classList.contains('disabled') && !link.classList.contains('active')) {
      link.addEventListener('click', function(e) {
        e.preventDefault();
        
        const page = parseInt(this.getAttribute('data-page'));
        const category = this.getAttribute('data-category');
        
        // Load blog posts for the selected page
        loadBlogPosts(category, page);
        
        // Scroll to top of blog posts
        const blogPostsElement = document.getElementById('blog-posts');
        if (blogPostsElement) {
          blogPostsElement.scrollIntoView({ behavior: 'smooth' });
        }
      });
    }
  });
}

/**
 * Show confirmation message for newsletter subscription
 * @param {string} email - Subscribed email address
 */
function showSubscriptionConfirmation(email) {
  const container = document.createElement('div');
  container.className = 'subscription-confirmation';
  container.innerHTML = `
    <div class="confirmation-inner">
      <i class="fas fa-check-circle"></i>
      <h3>Thank You!</h3>
      <p>Your email address <strong>${email}</strong> has been successfully subscribed to our newsletter.</p>
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