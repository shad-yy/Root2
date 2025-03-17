/**
 * SMART Live TV - Blog Service
 * 
 * Handles blog-related functionality:
 * - Fetching blog posts
 * - Searching and filtering
 * - Generating formatted HTML for posts
 */

import CONFIG from './config.js';
import ApiService from './api-service.js';
import ErrorHandler from './error-handler.js';

const BlogService = {
  /**
   * Store for current blogs state
   */
  state: {
    posts: [],
    categories: [],
    tags: [],
    popularPosts: [],
    totalPosts: 0,
    currentPage: 1,
    totalPages: 1,
    postsPerPage: CONFIG.CONTENT.MAX_BLOG_POSTS_PER_PAGE,
    currentCategory: 'all'
  },
  
  /**
   * Get blog posts
   * @param {string} category - Category filter
   * @param {number} page - Page number
   * @param {number} limit - Posts per page
   * @returns {Promise} - Blog posts with metadata
   */
  async getPosts(category = 'all', page = 1, limit = CONFIG.CONTENT.MAX_BLOG_POSTS_PER_PAGE) {
    try {
      const response = await ApiService.getBlogPosts(category, limit, page);
      
      // Update state
      this.state.posts = response.posts;
      this.state.totalPosts = response.total;
      this.state.currentPage = page;
      this.state.totalPages = response.totalPages;
      this.state.postsPerPage = limit;
      this.state.currentCategory = category;
      
      return response;
    } catch (error) {
      ErrorHandler.logError('blog_get_posts', error);
      throw error;
    }
  },
  
  /**
   * Get a single blog post by ID
   * @param {string} postId - Post ID
   * @returns {Promise} - Blog post
   */
  async getPost(postId) {
    try {
      return await ApiService.getBlogPost(postId);
    } catch (error) {
      ErrorHandler.logError('blog_get_post', error, { postId });
      throw error;
    }
  },
  
  /**
   * Search blog posts
   * @param {string} query - Search query
   * @param {number} page - Page number
   * @param {number} limit - Posts per page
   * @returns {Promise} - Search results
   */
  async searchPosts(query, page = 1, limit = CONFIG.CONTENT.MAX_BLOG_POSTS_PER_PAGE) {
    try {
      const response = await ApiService.searchBlogPosts(query, limit, page);
      
      // Update state but keep category as 'search'
      this.state.posts = response.posts;
      this.state.totalPosts = response.total;
      this.state.currentPage = page;
      this.state.totalPages = response.totalPages;
      this.state.postsPerPage = limit;
      this.state.currentCategory = 'search';
      
      return response;
    } catch (error) {
      ErrorHandler.logError('blog_search_posts', error, { query });
      throw error;
    }
  },
  
  /**
   * Get posts by tag
   * @param {string} tag - Tag to filter by
   * @param {number} page - Page number
   * @param {number} limit - Posts per page
   * @returns {Promise} - Posts with tag
   */
  async getPostsByTag(tag, page = 1, limit = CONFIG.CONTENT.MAX_BLOG_POSTS_PER_PAGE) {
    try {
      const response = await ApiService.request(`blog/tags/${encodeURIComponent(tag)}?page=${page}&limit=${limit}`);
      
      // Update state but keep category as 'tag'
      this.state.posts = response.posts;
      this.state.totalPosts = response.total;
      this.state.currentPage = page;
      this.state.totalPages = response.totalPages;
      this.state.postsPerPage = limit;
      this.state.currentCategory = 'tag';
      
      return response.posts;
    } catch (error) {
      ErrorHandler.logError('blog_get_posts_by_tag', error, { tag });
      throw error;
    }
  },
  
  /**
   * Get popular posts
   * @param {number} limit - Number of posts to return
   * @returns {Promise} - Popular posts
   */
  async getPopularPosts(limit = 4) {
    try {
      const posts = await ApiService.getPopularBlogPosts(limit);
      this.state.popularPosts = posts;
      return posts;
    } catch (error) {
      ErrorHandler.logError('blog_get_popular_posts', error);
      throw error;
    }
  },
  
  /**
   * Get blog categories
   * @returns {Promise} - Blog categories
   */
  async getCategories() {
    try {
      const categories = await ApiService.getBlogCategories();
      this.state.categories = categories;
      return categories;
    } catch (error) {
      ErrorHandler.logError('blog_get_categories', error);
      throw error;
    }
  },
  
  /**
   * Get blog tags
   * @param {number} limit - Number of tags to return
   * @returns {Promise} - Blog tags
   */
  async getTags(limit = 20) {
    try {
      const tags = await ApiService.getBlogTags(limit);
      this.state.tags = tags;
      return tags;
    } catch (error) {
      ErrorHandler.logError('blog_get_tags', error);
      throw error;
    }
  },
  
  /**
   * Format post date
   * @param {string} dateString - ISO date string
   * @returns {string} - Formatted date
   */
  formatPostDate(dateString) {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return dateString;
    }
  },
  
  /**
   * Generate HTML for blog post card
   * @param {object} post - Blog post
   * @returns {string} - HTML for blog post card
   */
  generatePostCardHTML(post) {
    const formattedDate = this.formatPostDate(post.date);
    const excerpt = post.excerpt || post.content.substring(0, 150) + '...';
    
    return `
      <article class="blog-card">
        <div class="blog-card-image">
          <a href="/main/blog-post.html?id=${post.id}">
            <img src="${post.image}" alt="${post.title}" loading="lazy">
          </a>
        </div>
        <div class="blog-card-content">
          <div class="blog-card-meta">
            <span class="blog-card-category">
              <a href="#" data-category="${post.category.slug}">${post.category.name}</a>
            </span>
            <span class="blog-card-date">
              <i class="fas fa-calendar-alt"></i> ${formattedDate}
            </span>
          </div>
          <h2 class="blog-card-title">
            <a href="/main/blog-post.html?id=${post.id}">${post.title}</a>
          </h2>
          <div class="blog-card-excerpt">
            <p>${excerpt}</p>
          </div>
          <a href="/main/blog-post.html?id=${post.id}" class="read-more">
            Read More <i class="fas fa-arrow-right"></i>
          </a>
        </div>
      </article>
    `;
  },
  
  /**
   * Generate HTML for popular post
   * @param {object} post - Blog post
   * @param {number} index - Post index
   * @returns {string} - HTML for popular post
   */
  generatePopularPostHTML(post, index) {
    const formattedDate = this.formatPostDate(post.date);
    
    return `
      <div class="popular-post">
        <span class="popular-post-number">${index + 1}</span>
        <div class="popular-post-content">
          <h3 class="popular-post-title">
            <a href="/main/blog-post.html?id=${post.id}">${post.title}</a>
          </h3>
          <div class="popular-post-meta">
            <span class="popular-post-date">
              <i class="fas fa-calendar-alt"></i> ${formattedDate}
            </span>
          </div>
        </div>
      </div>
    `;
  },
  
  /**
   * Generate HTML for category list
   * @param {array} categories - List of categories
   * @param {string} currentCategory - Currently selected category
   * @returns {string} - HTML for category list
   */
  generateCategoriesHTML(categories, currentCategory = 'all') {
    let html = `
      <option value="all" ${currentCategory === 'all' ? 'selected' : ''}>All Categories</option>
    `;
    
    categories.forEach(category => {
      html += `
        <option value="${category.slug}" ${currentCategory === category.slug ? 'selected' : ''}>
          ${category.name} (${category.count})
        </option>
      `;
    });
    
    return html;
  },
  
  /**
   * Generate HTML for tag cloud
   * @param {array} tags - List of tags
   * @returns {string} - HTML for tag cloud
   */
  generateTagCloudHTML(tags) {
    let html = '';
    
    tags.forEach(tag => {
      // Calculate tag size based on count (1-5)
      const size = Math.max(1, Math.min(5, Math.floor(tag.count / 5) + 1));
      
      html += `
        <a href="#" class="tag tag-size-${size}" data-tag="${tag.slug}">
          ${tag.name}
        </a>
      `;
    });
    
    return html;
  },
  
  /**
   * Share blog post
   * @param {string} platform - Social platform
   * @param {object} post - Blog post
   */
  sharePost(platform, post) {
    const shareUrl = encodeURIComponent(window.location.href);
    const shareTitle = encodeURIComponent(post.title);
    const shareText = encodeURIComponent(`Check out this article: ${post.title}`);
    
    let shareLink = '';
    
    switch (platform) {
      case 'facebook':
        shareLink = `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`;
        break;
      case 'twitter':
        shareLink = `https://twitter.com/intent/tweet?url=${shareUrl}&text=${shareText}`;
        break;
      case 'linkedin':
        shareLink = `https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`;
        break;
      case 'email':
        shareLink = `mailto:?subject=${shareTitle}&body=${shareText}%0A%0A${shareUrl}`;
        break;
      default:
        shareLink = '';
    }
    
    if (shareLink) {
      // Open share window or use native share if available
      if (navigator.share && platform !== 'email') {
        navigator.share({
          title: post.title,
          text: `Check out this article: ${post.title}`,
          url: window.location.href
        }).catch(error => {
          console.log('Error sharing:', error);
          window.open(shareLink, '_blank');
        });
      } else {
        window.open(shareLink, '_blank');
      }
    }
  }
};

export default BlogService;
