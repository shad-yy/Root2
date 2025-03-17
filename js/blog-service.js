/**
 * SMART Live TV - Blog Service
 * 
 * Handles automated blog post generation, publishing, and management.
 * Uses trending keywords and sports news APIs to create dynamic content.
 */

const BlogService = {
  /**
   * Initialize the blog service
   */
  init() {
    // Set up scheduled updates for blog posts
    this.schedulePostGeneration();

    console.log('Blog service initialized');
  },

  /**
   * Schedule regular post generation
   */
  schedulePostGeneration() {
    // Generate posts immediately on startup
    this.generateNewPosts();

    // Then schedule to run twice daily
    const now = new Date();

    // Morning update (10 AM)
    let morningUpdate = new Date(now);
    morningUpdate.setHours(10, 0, 0, 0);
    if (morningUpdate < now) {
      morningUpdate.setDate(morningUpdate.getDate() + 1);
    }

    // Evening update (6 PM)
    let eveningUpdate = new Date(now);
    eveningUpdate.setHours(18, 0, 0, 0);
    if (eveningUpdate < now) {
      eveningUpdate.setDate(eveningUpdate.getDate() + 1);
    }

    // Set timers
    const msUntilMorning = morningUpdate - now;
    const msUntilEvening = eveningUpdate - now;

    setTimeout(() => this.generateNewPosts(), msUntilMorning);
    setTimeout(() => this.generateNewPosts(), msUntilEvening);

    console.log(`Blog post generation scheduled for ${morningUpdate.toLocaleString()} and ${eveningUpdate.toLocaleString()}`);
  },

  /**
   * Generate new blog posts based on trending keywords
   */
  async generateNewPosts() {
    try {
      // Use the ApiService to generate posts
      if (typeof ApiService !== 'undefined' && ApiService.generateAutomatedBlogPosts) {
        const posts = await ApiService.generateAutomatedBlogPosts(10);

        // Save posts to localStorage (in a real app, these would go to a database)
        this.savePosts(posts);

        console.log(`Generated ${posts.length} new blog posts`);
        return posts;
      }
    } catch (error) {
      console.error('Error generating blog posts:', error);
    }

    return [];
  },

  /**
   * Save posts to localStorage
   * @param {Array} newPosts - The posts to save
   */
  savePosts(newPosts) {
    if (!newPosts || newPosts.length === 0) return;

    try {
      // Get existing posts
      const existingPosts = this.getPosts();

      // Combine posts, avoiding duplicates by slug
      const slugs = new Set(existingPosts.map(post => post.slug));
      const uniqueNewPosts = newPosts.filter(post => !slugs.has(post.slug));

      // Combine and sort by date (newest first)
      const allPosts = [...uniqueNewPosts, ...existingPosts]
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 100); // Keep only the most recent 100 posts

      // Save to localStorage
      localStorage.setItem('blogPosts', JSON.stringify(allPosts));
    } catch (error) {
      console.error('Error saving blog posts:', error);
    }
  },

  /**
   * Get all blog posts
   * @returns {Array} - The list of blog posts
   */
  getPosts() {
    try {
      const postsJson = localStorage.getItem('blogPosts');
      return postsJson ? JSON.parse(postsJson) : [];
    } catch (error) {
      console.error('Error getting blog posts:', error);
      return [];
    }
  },

  /**
   * Get a single blog post by slug
   * @param {string} slug - The post slug
   * @returns {Object|null} - The blog post or null if not found
   */
  getPostBySlug(slug) {
    const posts = this.getPosts();
    return posts.find(post => post.slug === slug) || null;
  },

  /**
   * Get posts by keyword/tag
   * @param {string} keyword - The keyword to filter by
   * @returns {Array} - The filtered posts
   */
  getPostsByKeyword(keyword) {
    if (!keyword) return [];

    const normalizedKeyword = keyword.toLowerCase();
    const posts = this.getPosts();

    return posts.filter(post => {
      // Check if keyword appears in post keyword, title or content
      return post.keyword?.toLowerCase().includes(normalizedKeyword) ||
        post.title?.toLowerCase().includes(normalizedKeyword) ||
        post.content?.toLowerCase().includes(normalizedKeyword);
    });
  },

  /**
   * Render blog posts to the page
   * @param {string} containerId - The ID of the container element
   * @param {number} limit - Maximum number of posts to show
   */
  renderPosts(containerId = '.news-container', limit = 4) {
    const container = document.querySelector(containerId);
    if (!container) return;

    // Get posts
    const posts = this.getPosts().slice(0, limit);

    // Clear loading state
    container.querySelectorAll('.loading').forEach(el => el.remove());

    if (posts.length === 0) {
      container.innerHTML += '<div class="error-message">No blog posts available at this time.</div>';
      return;
    }

    // Render each post
    posts.forEach(post => {
      const postCard = document.createElement('div');
      postCard.className = 'news-card';

      // Create placeholder image
      const imagePath = `/images/news/automated-${Math.floor(Math.random() * 5) + 1}.jpg`;

      postCard.innerHTML = `
        <img src="${imagePath}" alt="${post.title}" class="news-image">
        <div class="news-content">
          <div class="news-meta">
            <span>${post.keyword}</span>
            <span>${post.formattedDate || 'Recently'}</span>
          </div>
          <h3 class="news-title">${post.title}</h3>
          <p class="news-excerpt">${post.summary}</p>
          <a href="blog/${post.slug}" class="read-more">Read Full Story</a>
        </div>
      `;

      container.appendChild(postCard);
    });
  }
};

// Initialize the blog service on DOM content loaded
document.addEventListener('DOMContentLoaded', () => {
  if (typeof BlogService !== 'undefined') {
    BlogService.init();

    // Render blog posts on blog page
    if (window.location.pathname.includes('/blog') ||
      window.location.pathname === '/' ||
      window.location.pathname.endsWith('/')) {
      BlogService.renderPosts();
    }
  }
});
