/**
 * SMART Live TV - Blog Router
 * 
 * Handles dynamic routing for blog post URLs
 * Allows for dynamically loading blog post content without generating static files
 */

const BlogRouter = {
  /**
   * Initialize the blog router
   */
  init() {
    // Check if we're on a blog post page
    this.checkForBlogPostURL();

    // Handle popstate for browser back/forward navigation
    window.addEventListener('popstate', (event) => {
      this.checkForBlogPostURL();
    });

    // Intercept blog post links
    this.interceptBlogLinks();

    console.log('Blog Router initialized');
  },

  /**
   * Check if the current URL is a blog post
   */
  checkForBlogPostURL() {
    const path = window.location.pathname;

    // Check if we're on a blog post page
    if (path.match(/\/blog\/([^/]+)(\)?$/)) {
      const slug = path.split('/').pop().replace('', '');

      // Skip the blog index page
      if (slug === 'blog' || slug === 'index') return;

      // Load post content
      this.loadBlogPost(slug);
    }
  },

  /**
   * Intercept clicks on blog post links to handle them with JavaScript
   */
  interceptBlogLinks() {
    document.addEventListener('click', (event) => {
      // Find closest link element
      let link = event.target.closest('a');

      if (!link) return;

      // Check if it's a blog post link
      const href = link.getAttribute('href');
      if (!href) return;

      // Match blog post links
      const match = href.match(/\/blog\/([^/]+)(\)?$/);
      if (!match) return;

      // Prevent default navigation
      event.preventDefault();

      // Extract slug
      const slug = match[1];

      // Skip the blog index page
      if (slug === 'blog' || slug === 'index') {
        window.location.href = href;
        return;
      }

      // Update URL
      window.history.pushState({ slug }, '', href);

      // Load post content
      this.loadBlogPost(slug);

      // Scroll to top
      window.scrollTo(0, 0);
    });
  },

  /**
   * Load a blog post by slug
   * @param {string} slug - The post slug to load
   */
  loadBlogPost(slug) {
    // Get post from BlogService
    if (typeof BlogService === 'undefined') {
      console.error('BlogService not available');
      this.showErrorPage('Service Unavailable', 'The blog service is currently unavailable. Please try again later.');
      return;
    }

    const post = BlogService.getPostBySlug(slug);

    if (!post) {
      console.error(`Blog post not found: ${slug}`);
      this.showErrorPage('Post Not Found', 'The blog post you\'re looking for could not be found. It may have been removed or the URL is incorrect.');
      return;
    }

    // Check if we're on the post template page
    if (document.querySelector('.blog-post')) {
      // We're already on a post page, just update the content
      this.updatePostContent(post);
    } else {
      // We need to load the post template and then update the content
      this.loadPostTemplate(post);
    }
  },

  /**
   * Load the post template HTML
   * @param {Object} post - The post data
   */
  async loadPostTemplate(post) {
    try {
      // Fetch the blog post template
      const response = await fetch('/blog/template');

      if (!response.ok) {
        throw new Error(`Failed to load blog post template: ${response.status}`);
      }

      const template = await response.text();

      // Replace the content of the main element with the template
      const main = document.querySelector('main');
      if (!main) {
        throw new Error('Main element not found');
      }

      main.innerHTML = template;

      // Update the template with post content
      this.updatePostContent(post);

    } catch (error) {
      console.error('Error loading post template:', error);
      this.showErrorPage('Error Loading Page', 'There was an error loading the blog post. Please try again later.');
    }
  },

  /**
   * Update the post content on the page
   * @param {Object} post - The post data
   */
  updatePostContent(post) {
    // Update page title
    document.title = `${post.title} – SMART Live TV`;

    // Update meta tags
    document.querySelector('meta[name="description"]')?.setAttribute('content', post.summary);
    document.querySelector('meta[name="keywords"]')?.setAttribute('content', `${post.keyword}, sports news, sports blog`);

    // Update Open Graph tags
    document.querySelector('meta[property="og:title"]')?.setAttribute('content', `${post.title} – SMART Live TV`);
    document.querySelector('meta[property="og:description"]')?.setAttribute('content', post.summary);
    document.querySelector('meta[property="article:published_time"]')?.setAttribute('content', post.date);
    document.querySelector('meta[property="article:tag"]')?.setAttribute('content', post.keyword);

    // Update Twitter tags
    document.querySelector('meta[property="twitter:title"]')?.setAttribute('content', `${post.title} – SMART Live TV`);
    document.querySelector('meta[property="twitter:description"]')?.setAttribute('content', post.summary);

    // Update page content
    document.querySelector('.blog-post-title')?.replaceWith(post.title);
    document.querySelector('.blog-post-date span')?.replaceWith(post.formattedDate);
    document.querySelector('.blog-post-keyword span')?.replaceWith(post.keyword);
    document.querySelector('.blog-post-source span')?.replaceWith(`Source: ${post.source}`);

    // Update breadcrumbs
    document.querySelector('.breadcrumbs li:last-child')?.replaceWith(post.title);

    // Render Markdown content
    const contentEl = document.getElementById('blog-content');
    if (contentEl) {
      if (typeof marked !== 'undefined') {
        contentEl.innerHTML = marked.parse(post.content);
      } else {
        // Fallback to basic formatting if marked is not available
        contentEl.innerHTML = post.content
          .replace(/\n\n/g, '<br><br>')
          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
          .replace(/\*(.*?)\*/g, '<em>$1</em>')
          .replace(/# (.*?)(\n|$)/g, '<h1>$1</h1>')
          .replace(/## (.*?)(\n|$)/g, '<h2>$1</h2>')
          .replace(/### (.*?)(\n|$)/g, '<h3>$1</h3>');
      }
    }

    // Load related posts (posts with same keyword)
    const relatedPostsContainer = document.getElementById('related-posts');
    if (relatedPostsContainer) {
      const relatedPosts = BlogService.getPostsByKeyword(post.keyword)
        .filter(p => p.slug !== post.slug)
        .slice(0, 3);

      relatedPostsContainer.innerHTML = '';

      if (relatedPosts.length === 0) {
        relatedPostsContainer.innerHTML = '<p>No related articles found.</p>';
      } else {
        relatedPosts.forEach(relatedPost => {
          const postItem = document.createElement('div');
          postItem.className = 'blog-post-related-item';
          postItem.innerHTML = `
            <h4><a href="/blog.html/${relatedPost.slug}">${relatedPost.title}</a></h4>
            <p>${relatedPost.formattedDate || 'Recently'}</p>
          `;
          relatedPostsContainer.appendChild(postItem);
        });
      }
    }

    // Load latest posts for sidebar
    const latestPostsContainer = document.getElementById('latest-posts');
    if (latestPostsContainer) {
      const latestPosts = BlogService.getPosts()
        .filter(p => p.slug !== post.slug)
        .slice(0, 5);

      latestPostsContainer.innerHTML = '';

      latestPosts.forEach(latestPost => {
        const postItem = document.createElement('div');
        postItem.className = 'trending-item';
        postItem.innerHTML = `
          <strong>${latestPost.title}</strong>
          <p>${latestPost.formattedDate || 'Recently'}</p>
          <a href="/blog.html/${latestPost.slug}" class="read-more">Read More</a>
        `;
        latestPostsContainer.appendChild(postItem);
      });
    }
  },

  /**
   * Show an error page
   * @param {string} title - The error title
   * @param {string} message - The error message
   */
  showErrorPage(title, message) {
    const blogPost = document.querySelector('.blog-post');

    if (blogPost) {
      blogPost.innerHTML = `
        <div class="error-message">
          <h2>${title}</h2>
          <p>${message}</p>
          <p><a href="/blog.html" class="cta-button" style="margin-top: 20px;">View All Blog Posts</a></p>
        </div>
      `;
    } else {
      // If we're not on a blog page, redirect to the blog index
      window.location.href = '/blog';
    }
  }
};

// Initialize the router
document.addEventListener('DOMContentLoaded', () => {
  BlogRouter.init();
});