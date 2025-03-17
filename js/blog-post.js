/**
 * SMART Live TV - Blog Post Page Script
 * 
 * Handles functionality for individual blog post pages including:
 * - Loading post content
 * - Related posts
 * - Social sharing
 * - Comments
 */

import CONFIG from './config.js';
import ApiService from './api-service.js';
import BlogService from './blog-service.js';
import ErrorHandler from './error-handler.js';

// Store post data globally for sharing functions
let currentPost = null;

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  console.log('Blog post page initializing...');
  initBlogPostPage();
});

/**
 * Initialize blog post page
 */
function initBlogPostPage() {
  // Initialize UI components
  initMobileMenu();
  initNewsletterForm();
  
  // Get post ID from URL
  const postId = getPostIdFromUrl();
  
  if (postId) {
    // Load post data
    loadBlogPost(postId);
    
    // Load sidebar content
    loadPopularPosts();
    loadCategories();
    loadTagCloud();
  } else {
    // No post ID in URL
    showError('No post ID specified in the URL.');
  }
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
 * Get post ID from URL query parameters
 * @returns {string|null} - Post ID or null if not found
 */
function getPostIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get('id');
}

/**
 * Load blog post data
 * @param {string} postId - Post ID
 */
async function loadBlogPost(postId) {
  // Show loading state
  const loadingEl = document.getElementById('blog-post-loading');
  const contentEl = document.getElementById('blog-post-content');
  const errorEl = document.getElementById('blog-post-error');
  const relatedPostsSection = document.getElementById('related-posts-section');
  
  if (loadingEl) loadingEl.style.display = 'flex';
  if (contentEl) contentEl.style.display = 'none';
  if (errorEl) errorEl.style.display = 'none';
  if (relatedPostsSection) relatedPostsSection.style.display = 'none';
  
  try {
    // Load post data
    const post = await BlogService.getPost(postId);
    currentPost = post;
    
    if (!post) {
      throw new Error('Post not found');
    }
    
    // Update page metadata
    updatePageMetadata(post);
    
    // Render post content
    renderPostContent(post);
    
    // Load related posts
    loadRelatedPosts(post.category, post.id);
    
    // Hide loading, show content
    if (loadingEl) loadingEl.style.display = 'none';
    if (contentEl) contentEl.style.display = 'block';
    
    // Add retry button handler
    const retryBtn = document.getElementById('retry-load-post');
    if (retryBtn) {
      retryBtn.addEventListener('click', () => loadBlogPost(postId));
    }
  } catch (error) {
    ErrorHandler.logError('load_blog_post', error, { postId });
    
    // Hide loading, show error
    if (loadingEl) loadingEl.style.display = 'none';
    if (errorEl) {
      errorEl.style.display = 'block';
      errorEl.querySelector('p').textContent = 'There was an error loading the article. It may not exist or there might be a temporary issue.';
    }
  }
}

/**
 * Update page metadata with post data
 * @param {object} post - Post data
 */
function updatePageMetadata(post) {
  // Update page title
  document.title = `${post.title} - SMART Live TV`;
  
  // Update meta description
  const metaDescription = document.querySelector('meta[name="description"]');
  if (metaDescription) {
    metaDescription.setAttribute('content', post.excerpt);
  }
  
  // Update meta keywords
  const metaKeywords = document.querySelector('meta[name="keywords"]');
  if (metaKeywords) {
    const keywords = post.tags.map(tag => tag.name).join(', ');
    metaKeywords.setAttribute('content', `${keywords}, sports news, sports article`);
  }
  
  // Add or update Open Graph tags
  updateOpenGraphTag('og:title', post.title);
  updateOpenGraphTag('og:description', post.excerpt);
  updateOpenGraphTag('og:image', post.featuredImage);
  updateOpenGraphTag('og:url', window.location.href);
  updateOpenGraphTag('og:type', 'article');
}

/**
 * Update or create an Open Graph meta tag
 * @param {string} property - OG property
 * @param {string} content - OG content
 */
function updateOpenGraphTag(property, content) {
  let metaTag = document.querySelector(`meta[property="${property}"]`);
  
  if (!metaTag) {
    metaTag = document.createElement('meta');
    metaTag.setAttribute('property', property);
    document.head.appendChild(metaTag);
  }
  
  metaTag.setAttribute('content', content);
}

/**
 * Render post content
 * @param {object} post - Post data
 */
function renderPostContent(post) {
  const contentEl = document.getElementById('blog-post-content');
  if (!contentEl) return;
  
  // Calculate reading time
  const readingTime = Math.max(1, Math.floor(post.content.split(' ').length / 200));
  
  // Format post date
  const postDate = new Date(post.publishedAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  // Generate HTML for author
  const authorHTML = post.author ? `
    <div class="post-author-info">
      <div class="author-avatar">
        <img src="${post.author.avatar}" alt="${post.author.name}">
      </div>
      <div class="author-details">
        <span class="author-name">${post.author.name}</span>
        <span class="author-role">${post.author.role || 'Author'}</span>
      </div>
    </div>
  ` : '';
  
  // Generate HTML for tags
  const tagsHTML = post.tags.length > 0 ? `
    <div class="post-tags">
      ${post.tags.map(tag => `<a href="/main/blog.html?tag=${tag.slug}" class="tag">${tag.name}</a>`).join('')}
    </div>
  ` : '';
  
  // Generate HTML for post content
  contentEl.innerHTML = `
    <header class="post-header">
      <h1 class="post-title">${post.title}</h1>
      
      <div class="post-meta">
        <span class="post-date">
          <i class="far fa-calendar-alt"></i> ${postDate}
        </span>
        <span class="post-category">
          <i class="far fa-folder"></i>
          <a href="/main/blog.html?category=${post.category.slug}">${post.category.name}</a>
        </span>
        <span class="post-reading-time">
          <i class="far fa-clock"></i> ${readingTime} min read
        </span>
      </div>
    </header>
    
    <div class="featured-image">
      <img src="${post.featuredImage}" alt="${post.title}">
    </div>
    
    <div class="post-content">
      ${post.content}
    </div>
    
    <footer class="post-footer">
      ${authorHTML}
      
      ${tagsHTML}
      
      <div class="post-share">
        <span class="share-label">Share:</span>
        <div class="share-buttons">
          <button class="share-btn facebook" onclick="sharePost('facebook')">
            <i class="fab fa-facebook-f"></i>
          </button>
          <button class="share-btn twitter" onclick="sharePost('twitter')">
            <i class="fab fa-twitter"></i>
          </button>
          <button class="share-btn linkedin" onclick="sharePost('linkedin')">
            <i class="fab fa-linkedin-in"></i>
          </button>
          <button class="share-btn email" onclick="sharePost('email')">
            <i class="far fa-envelope"></i>
          </button>
        </div>
      </div>
    </footer>
  `;
}

/**
 * Load related posts
 * @param {object} category - Post category
 * @param {string} currentPostId - Current post ID to exclude
 */
async function loadRelatedPosts(category, currentPostId) {
  const relatedPostsSection = document.getElementById('related-posts-section');
  const relatedPostsContainer = document.getElementById('related-posts');
  
  if (!relatedPostsContainer || !relatedPostsSection) return;
  
  try {
    // Load related posts (same category, excluding current)
    const posts = await BlogService.getRelatedPosts(category.slug, currentPostId, 3);
    
    if (!posts || posts.length === 0) {
      // No related posts to show
      return;
    }
    
    // Clear container
    relatedPostsContainer.innerHTML = '';
    
    // Add related posts
    posts.forEach(post => {
      relatedPostsContainer.innerHTML += BlogService.generatePostCardHTML(post, 'compact');
    });
    
    // Show section
    relatedPostsSection.style.display = 'block';
  } catch (error) {
    ErrorHandler.logError('load_related_posts', error, { categorySlug: category.slug });
    // Don't show section on error
  }
}

/**
 * Load popular posts for sidebar
 */
async function loadPopularPosts() {
  const container = document.getElementById('popular-posts');
  if (!container) return;
  
  try {
    const posts = await BlogService.getPopularPosts(5);
    
    // Clear container
    container.innerHTML = '';
    
    // Check if there are posts
    if (!posts || posts.length === 0) {
      container.innerHTML = '<p>No popular posts found.</p>';
      return;
    }
    
    // Add posts
    posts.forEach(post => {
      container.innerHTML += `
        <div class="sidebar-post">
          <a href="/main/blog-post.html?id=${post.id}" class="post-thumbnail">
            <img src="${post.thumbnailImage}" alt="${post.title}">
          </a>
          <div class="post-info">
            <h4><a href="/main/blog-post.html?id=${post.id}">${post.title}</a></h4>
            <span class="post-date">${new Date(post.publishedAt).toLocaleDateString()}</span>
          </div>
        </div>
      `;
    });
  } catch (error) {
    ErrorHandler.logError('load_popular_posts', error);
    container.innerHTML = '<p>Failed to load popular posts.</p>';
  }
}

/**
 * Load categories for sidebar
 */
async function loadCategories() {
  const container = document.getElementById('categories-list');
  if (!container) return;
  
  try {
    const categories = await BlogService.getCategories();
    
    // Clear container
    container.innerHTML = '';
    
    // Check if there are categories
    if (!categories || categories.length === 0) {
      container.innerHTML = '<p>No categories found.</p>';
      return;
    }
    
    // Add categories as list
    let html = '<ul class="categories">';
    
    categories.forEach(category => {
      html += `
        <li>
          <a href="/main/blog.html?category=${category.slug}">
            ${category.name} <span class="count">(${category.count})</span>
          </a>
        </li>
      `;
    });
    
    html += '</ul>';
    container.innerHTML = html;
  } catch (error) {
    ErrorHandler.logError('load_categories', error);
    container.innerHTML = '<p>Failed to load categories.</p>';
  }
}

/**
 * Load tag cloud for sidebar
 */
async function loadTagCloud() {
  const container = document.getElementById('tags-cloud');
  if (!container) return;
  
  try {
    const tags = await BlogService.getTags(30);
    
    // Clear container
    container.innerHTML = '';
    
    // Check if there are tags
    if (!tags || tags.length === 0) {
      container.innerHTML = '<p>No tags found.</p>';
      return;
    }
    
    // Add tags as cloud
    container.innerHTML = BlogService.generateTagCloudHTML(tags);
    
    // Add click event to tags
    const tagLinks = container.querySelectorAll('.tag');
    tagLinks.forEach(link => {
      link.addEventListener('click', function(e) {
        e.preventDefault();
        const tag = this.getAttribute('data-tag');
        window.location.href = `/main/blog.html?tag=${tag}`;
      });
    });
  } catch (error) {
    ErrorHandler.logError('load_tag_cloud', error);
    container.innerHTML = '<p>Failed to load tags.</p>';
  }
}

/**
 * Initialize newsletter form
 */
function initNewsletterForm() {
  const form = document.getElementById('newsletter-form');
  const statusEl = document.getElementById('newsletter-status');
  
  if (form) {
    form.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      const email = document.getElementById('newsletter-email').value;
      
      if (!email) {
        if (statusEl) {
          statusEl.innerHTML = '<div class="error-message">Please enter your email address.</div>';
        }
        return;
      }
      
      try {
        // Show loading state
        if (statusEl) {
          statusEl.innerHTML = '<div class="loading-message">Subscribing...</div>';
        }
        
        // Submit newsletter subscription
        await ApiService.subscribeToNewsletter({ email });
        
        // Show success message
        if (statusEl) {
          statusEl.innerHTML = '<div class="success-message">Thank you for subscribing!</div>';
        }
        
        // Clear the form
        form.reset();
        
        // Clear status after 3 seconds
        setTimeout(() => {
          if (statusEl) {
            statusEl.innerHTML = '';
          }
        }, 3000);
      } catch (error) {
        ErrorHandler.logError('newsletter_subscribe', error);
        
        // Show error message
        if (statusEl) {
          statusEl.innerHTML = '<div class="error-message">There was an error processing your subscription. Please try again.</div>';
        }
      }
    });
  }
}

/**
 * Show error message
 * @param {string} message - Error message
 */
function showError(message) {
  const loadingEl = document.getElementById('blog-post-loading');
  const contentEl = document.getElementById('blog-post-content');
  const errorEl = document.getElementById('blog-post-error');
  
  if (loadingEl) loadingEl.style.display = 'none';
  if (contentEl) contentEl.style.display = 'none';
  
  if (errorEl) {
    errorEl.style.display = 'block';
    const errorMessage = errorEl.querySelector('p');
    if (errorMessage) {
      errorMessage.textContent = message;
    }
  }
}

/**
 * Share current post on social media
 * @param {string} platform - Social platform
 */
function sharePost(platform) {
  if (!currentPost) return;
  
  BlogService.sharePost(platform, currentPost);
}

// Export functions that need to be available globally
window.sharePost = sharePost; 