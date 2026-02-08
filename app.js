/**
 * NETWORKS INSIGHTS - CORE APPLICATION (PRODUCTION VERSION)
 * Architecture: Proper query-param based routing
 * Version: 2.0 (Production-Ready)
 * 
 * This version follows industry best practices:
 * - Clean separation of static vs dynamic pages
 * - Query parameter routing (no regex hell)
 * - Zero maintenance for new static pages
 * - Scales to unlimited networks
 * - SEO-friendly
 * - Future-proof
 */

const NetworksApp = {
  
  // ============================================
  // CONFIGURATION
  // ============================================
  
  config: window.NI_CONFIG || {
    API_BASE_URL: 'https://script.google.com/macros/s/AKfycbw3Wiegd0Ni7jFKM_-9PFfhCBLFsDzueCJCObXqphRK5RUjZ99wjaFZVA2UhTGchwKM/exec',
    CACHE_DURATION: 5 * 60 * 1000, // 5 minutes
    ITEMS_PER_PAGE: 20
  },

  // ============================================
  // BLOGGER NATIVE PAGES (SKIP APP)
  // ============================================
  // These are real Blogger pages with static HTML content
  // The app should NOT run on these pages
  
  BLOGGER_NATIVE_PAGES: [
  'about',
  'contact-us_7',
  'privacy-policy_56',
  'terms-of-service_7',
  'resources_33'
],

  // ============================================
  // STATE MANAGEMENT
  // ============================================
  
  state: {
    networks: [],
    categories: [],
    currentPage: 1,
    totalPages: 1,
    currentFilters: {},
    isLoading: false,
    cache: new Map()
  },

  // ============================================
  // INITIALIZATION
  // ============================================
  
  init() {
    console.log('🚀 Networks Insights App v2.0 initializing...');
    
    // Step 1: Check if we should run the app
    if (!this.shouldRunApp()) {
      console.log('⏹️ App disabled for this page');
      return;
    }
    
    // Step 2: App is enabled - run it
    console.log('✅ App enabled - detecting page type...');
    this.detectPageType();
    this.loadSidebarData();
    this.bindEvents();
  },

  /**
   * Determine if the app should run on the current page
   * Returns false for Blogger native pages with static content
   */
  shouldRunApp() {
    const path = window.location.pathname;
    const pageName = path.split('/').pop().replace('.html', '');
    
    // Check if this is a Blogger native page
    if (this.BLOGGER_NATIVE_PAGES.includes(pageName)) {
      console.log(`📄 Blogger native page detected: ${pageName}`);
      return false;
    }
    
    // Check if dynamic-content div exists (required for app)
    const container = document.getElementById('dynamic-content');
    if (!container) {
      console.log('❌ No dynamic-content container found');
      return false;
    }
    
    return true;
  },

  // ============================================
  // PAGE ROUTING (CLEAN & SIMPLE)
  // ============================================
  
  detectPageType() {
    const path = window.location.pathname;
    const params = new URLSearchParams(window.location.search);
    
    console.log('🔍 Routing:', { path, query: params.toString() });
    
    // ----------------------------------------
    // HOMEPAGE
    // ----------------------------------------
    if (path === '/' || path === '/index.html') {
      console.log('📍 Page Type: Homepage');
      this.renderHomepage();
      return;
    }
    
    // ----------------------------------------
    // NETWORK DETAIL (Query Parameter)
    // Example: /p/network-detail.html?network=maxbounty
    // ----------------------------------------
    const networkSlug = params.get('network');
    if (networkSlug) {
      console.log('📍 Page Type: Network Detail -', networkSlug);
      this.renderNetworkDetail(networkSlug);
      return;
    }
    
    // ----------------------------------------
    // ALL NETWORKS LISTING
    // ----------------------------------------
    if (path.includes('/p/affiliate-networks.html')) {
      console.log('📍 Page Type: All Networks');
      this.renderCategoryPage('all');
      return;
    }
    
    // ----------------------------------------
    // VERTICAL CATEGORY PAGES
    // Examples: /p/dating-networks.html, /p/gambling-networks.html
    // ----------------------------------------
    const verticalMatch = path.match(/\/p\/(\w+)-networks\.html$/);
    if (verticalMatch) {
      const vertical = verticalMatch[1];
      console.log('📍 Page Type: Vertical Category -', vertical);
      this.renderCategoryPage(vertical);
      return;
    }
    
    // ----------------------------------------
    // REVIEWS PAGE
    // ----------------------------------------
    if (path.includes('/p/reviews.html')) {
      console.log('📍 Page Type: Reviews');
      this.renderReviewsPage();
      return;
    }
    
    // ----------------------------------------
    // RESOURCES PAGE (Dynamic Version)
    // ----------------------------------------
    if (path === '/p/resources.html') {
      console.log('📍 Page Type: Resources');
      this.renderResourcesPage();
      return;
    }
    
    // ----------------------------------------
    // BLOG PAGE
    // ----------------------------------------
    if (path.includes('/p/blog.html')) {
      console.log('📍 Page Type: Blog');
      this.renderBlogPage();
      return;
    }
    
    // ----------------------------------------
    // UNKNOWN / UNHANDLED PAGE
    // ----------------------------------------
    console.log('❓ Unknown page type - no action taken');
    const container = document.getElementById('dynamic-content');
    if (container) {
      container.innerHTML = ''; // Clear loading spinner
    }
  },

  // ============================================
  // API METHODS
  // ============================================
  
  async fetchAPI(action, params = {}) {
    const cacheKey = `${action}_${JSON.stringify(params)}`;
    const cached = this.getCache(cacheKey);
    
    if (cached) {
      console.log('💾 Cache hit:', cacheKey);
      return cached;
    }

    const queryString = new URLSearchParams({ action, ...params }).toString();
    const url = `${this.config.API_BASE_URL}?${queryString}`;
    
    try {
      console.log('🌐 API Request:', action, params);
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.success) {
        this.setCache(cacheKey, data.data);
        console.log('✅ API Success:', action);
        return data.data;
      } else {
        throw new Error(data.error?.message || 'API Error');
      }
    } catch (error) {
      console.error('❌ API Error:', error);
      this.showError('Failed to load data. Please try again.');
      return null;
    }
  },

  async postAPI(action, data) {
    const formData = new FormData();
    formData.append('action', action);
    Object.keys(data).forEach(key => formData.append(key, data[key]));

    try {
      console.log('📤 POST Request:', action);
      const response = await fetch(this.config.API_BASE_URL, {
        method: 'POST',
        body: formData
      });
      const result = await response.json();
      console.log('✅ POST Success:', action);
      return result;
    } catch (error) {
      console.error('❌ POST Error:', error);
      return { success: false, error: { message: 'Submission failed' } };
    }
  },

  // ============================================
  // CACHE MANAGEMENT
  // ============================================
  
  getCache(key) {
    const item = this.state.cache.get(key);
    if (!item) return null;
    
    if (Date.now() - item.timestamp > this.config.CACHE_DURATION) {
      this.state.cache.delete(key);
      return null;
    }
    return item.data;
  },

  setCache(key, data) {
    this.state.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  },

  clearCache() {
    this.state.cache.clear();
    console.log('🗑️ Cache cleared');
  },

  // ============================================
  // RENDER METHODS
  // ============================================
  
  async renderHomepage() {
    const container = document.getElementById('dynamic-content');
    container.innerHTML = this.templates.loading();

    try {
      const [networksData, categories] = await Promise.all([
        this.fetchAPI('getNetworks', { limit: 6, featured: 'true' }),
        this.fetchAPI('getCategories')
      ]);

      const html = `
        ${this.templates.featuredSection(networksData?.networks || [])}
        <div id="networks-grid">
          ${this.templates.networkGrid(networksData?.networks || [])}
        </div>
        ${this.templates.pagination(networksData?.pagination)}
      `;
      
      container.innerHTML = html;
      this.state.networks = networksData?.networks || [];
      
      // Update page title
      document.title = 'Networks Insights | Top Affiliate Networks with Real Reviews';
      
    } catch (error) {
      console.error('Homepage render error:', error);
      container.innerHTML = this.templates.error('Failed to load homepage');
    }
  },

  async renderCategoryPage(vertical) {
    const container = document.getElementById('dynamic-content');
    container.innerHTML = this.templates.loading();

    const params = {
      page: this.state.currentPage,
      limit: this.config.ITEMS_PER_PAGE,
      sort: this.state.currentFilters.sort || 'rating'
    };

    if (vertical !== 'all') {
      params.vertical = vertical.charAt(0).toUpperCase() + vertical.slice(1);
    }

    // Add filter params
    Object.keys(this.state.currentFilters).forEach(key => {
      if (key !== 'sort' && this.state.currentFilters[key]) {
        params[key] = this.state.currentFilters[key];
      }
    });

    try {
      const data = await this.fetchAPI('getNetworksByVertical', params);
      
      const title = vertical === 'all' ? 'All Affiliate Networks' : 
        `${vertical.charAt(0).toUpperCase() + vertical.slice(1)} Affiliate Networks`;
      
      const html = `
        <div class="page-header">
          <h1 class="page-title">${title}</h1>
          <p class="page-subtitle">
            ${data?.networks?.length || 0} networks found - 
            Compare features, read reviews, and find the best fit
          </p>
        </div>
        <div id="networks-grid">
          ${this.templates.networkGrid(data?.networks || [])}
        </div>
        ${this.templates.pagination(data)}
      `;
      
      container.innerHTML = html;
      this.state.networks = data?.networks || [];
      
      // Update page title
      document.title = `${title} | Networks Insights`;
      
    } catch (error) {
      console.error('Category page render error:', error);
      container.innerHTML = this.templates.error('Failed to load networks');
    }
  },

  async renderNetworkDetail(slug) {
    const container = document.getElementById('dynamic-content');
    container.innerHTML = this.templates.loading();

    try {
      const data = await this.fetchAPI('getNetwork', { slug });
      
      if (!data || !data.network) {
        container.innerHTML = this.templates.error('Network not found');
        console.error('Network not found:', slug);
        return;
      }

      const network = data.network;
      const html = `
        ${this.templates.networkDetail(network)}
        ${this.templates.reviewsSection(data.reviews, data.reviewStats)}
        ${this.templates.reviewForm(network.slug)}
      `;
      
      container.innerHTML = html;
      
      // Update SEO meta tags
      document.title = `${network.name} Review | ${network.ratings?.overall || 'N/A'} Stars | Networks Insights`;
      
      // Update canonical URL
      const canonical = document.querySelector('link[rel="canonical"]');
      if (canonical) {
        canonical.href = `https://www.networksinsights.com/p/network-detail.html?network=${slug}`;
      }
      
    } catch (error) {
      console.error('Network detail render error:', error);
      container.innerHTML = this.templates.error('Failed to load network details');
    }
  },

  async renderReviewsPage() {
    const container = document.getElementById('dynamic-content');
    container.innerHTML = this.templates.loading();

    try {
      const networksData = await this.fetchAPI('getNetworks', { limit: 50, sort: 'newest' });
      const networks = networksData?.networks || [];
      
      // Collect reviews from top networks
      const allReviews = [];
      for (const network of networks.slice(0, 10)) {
        const data = await this.fetchAPI('getNetwork', { slug: network.slug });
        if (data?.reviews) {
          allReviews.push(...data.reviews.map(r => ({ 
            ...r, 
            networkName: network.name, 
            networkSlug: network.slug 
          })));
        }
      }
      
      // Sort by date
      allReviews.sort((a, b) => new Date(b.date_posted) - new Date(a.date_posted));
      
      const html = `
        <div class="page-header">
          <h1 class="page-title">Recent Reviews</h1>
          <p class="page-subtitle">
            Real feedback from ${allReviews.length} affiliate marketers
          </p>
        </div>
        <div class="reviews-feed">
          ${allReviews.slice(0, 20).map(review => this.templates.reviewCard(review, true)).join('')}
        </div>
      `;
      
      container.innerHTML = html;
      document.title = 'Recent Reviews | Networks Insights';
      
    } catch (error) {
      console.error('Reviews page render error:', error);
      container.innerHTML = this.templates.error('Failed to load reviews');
    }
  },

  renderResourcesPage() {
    const container = document.getElementById('dynamic-content');
    container.innerHTML = this.templates.resourcesPage();
    document.title = 'Affiliate Marketing Resources | Networks Insights';
  },

  renderBlogPage() {
    const container = document.getElementById('dynamic-content');
    container.innerHTML = `
      <div class="page-header">
        <h1 class="page-title">Blog</h1>
        <p class="page-subtitle">Industry news, tips, and insights</p>
      </div>
      <p style="text-align: center; padding: 4rem; color: var(--text-muted);">
        Blog posts will appear here. Create posts in Blogger dashboard.
      </p>
    `;
    document.title = 'Blog | Networks Insights';
  },

  // ============================================
  // SIDEBAR DATA LOADING
  // ============================================
  
  async loadSidebarData() {
    try {
      // Network of the Month
      const notmData = await this.fetchAPI('getNetworks', { limit: 1, network_of_month: 'true' });
      if (notmData?.networks?.[0]) {
        const notmEl = document.getElementById('notmContent');
        if (notmEl) {
          notmEl.innerHTML = this.templates.notmWidget(notmData.networks[0]);
        }
      }

      // Featured sidebar networks
      const featuredData = await this.fetchAPI('getNetworks', { limit: 3, featured: 'true' });
      if (featuredData?.networks) {
        const featuredEl = document.getElementById('featuredSidebarList');
        if (featuredEl) {
          featuredEl.innerHTML = featuredData.networks.map(n => this.templates.sidebarNetworkItem(n)).join('');
        }
      }

      // Category dropdown
      const categories = await this.fetchAPI('getCategories');
      if (categories?.categories) {
        this.updateCategoryDropdown(categories.categories);
      }
      
    } catch (error) {
      console.error('Sidebar data load error:', error);
    }
  },

  updateCategoryDropdown(categories) {
    const dropdown = document.getElementById('categoryDropdown');
    if (!dropdown) return;
    
    const verticals = categories.filter(c => c.parent_slug);
    dropdown.innerHTML = verticals.map(cat => `
      <a class="dropdown-item" href="/p/${cat.slug}.html">
        <div class="dropdown-icon">${cat.icon || '📊'}</div>
        <span class="dropdown-text">${cat.name.replace(' Networks', '')}</span>
        <span class="dropdown-count">${cat.count || 0}</span>
      </a>
    `).join('');
  },

  // ============================================
  // EVENT HANDLERS
  // ============================================
  
  bindEvents() {
    // Pagination clicks
    document.addEventListener('click', (e) => {
      if (e.target.matches('.pagination-btn') || e.target.closest('.pagination-btn')) {
        const btn = e.target.closest('.pagination-btn');
        const page = parseInt(btn.dataset.page);
        if (page && !isNaN(page)) {
          this.state.currentPage = page;
          this.detectPageType();
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }
      
      // Join button tracking
      if (e.target.matches('.btn-join') || e.target.closest('.btn-join')) {
        const url = e.target.closest('.btn-join').href;
        this.trackOutboundClick(url);
      }
    });

    // Review form submission
    document.addEventListener('submit', async (e) => {
      if (e.target.matches('#reviewForm')) {
        e.preventDefault();
        await this.handleReviewSubmit(e.target);
      }
    });

    // Filter changes (handled by filters.js if loaded)
    document.addEventListener('filterChange', (e) => {
      this.handleFilterChange(e.detail);
    });
  },

  async handleReviewSubmit(form) {
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);
    
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Submitting...';
    submitBtn.disabled = true;

    const result = await this.postAPI('submitReview', data);
    
    if (result.success) {
      form.innerHTML = `
        <div class="success-message" style="text-align: center; padding: 2rem;">
          <div style="font-size: 3rem; margin-bottom: 1rem;">✅</div>
          <h3>Review Submitted!</h3>
          <p>Your review is pending moderation and will appear soon.</p>
        </div>
      `;
    } else {
      alert('Error: ' + (result.error?.message || 'Failed to submit review'));
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
    }
  },

  handleFilterChange(filters) {
    this.state.currentFilters = { ...this.state.currentFilters, ...filters };
    this.state.currentPage = 1;
    this.detectPageType();
  },

  trackOutboundClick(url) {
    if (window.gtag) {
      gtag('event', 'click', {
        event_category: 'outbound',
        event_label: url
      });
    }
    console.log('📊 Outbound click:', url);
  },

  showError(message) {
    const container = document.getElementById('dynamic-content');
    if (container) {
      container.innerHTML = this.templates.error(message);
    }
  },

  // ============================================
  // HTML TEMPLATES
  // ============================================
  
  templates: {
    loading() {
      return `
        <div class="loading-spinner">
          <div class="spinner"></div>
          <p style="text-align: center; margin-top: 1rem; color: var(--text-muted);">Loading...</p>
        </div>
      `;
    },

    error(message) {
      return `
        <div class="empty-state">
          <div class="empty-icon">⚠️</div>
          <h3>Oops! Something went wrong</h3>
          <p>${message}</p>
          <button onclick="location.reload()" class="btn btn-primary" style="margin-top: 1rem;">
            Try Again
          </button>
        </div>
      `;
    },

    featuredSection(networks) {
      if (!networks.length) return '';
      
      return `
        <section id="featured-carousel" style="margin-bottom: 2rem;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem;">
            <h2 style="font-size: 1.5rem; font-weight: 700;">⭐ Featured Networks</h2>
            <a href="/p/affiliate-networks.html" class="btn btn-secondary" style="font-size: 0.875rem;">
              View All →
            </a>
          </div>
          <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1rem;">
            ${networks.slice(0, 3).map(n => this.networkCard(n, true)).join('')}
          </div>
        </section>
      `;
    },

    networkGrid(networks) {
      if (!networks.length) {
        return `
          <div class="empty-state">
            <div class="empty-icon">🔍</div>
            <h3>No networks found</h3>
            <p>Try adjusting your filters or search criteria</p>
          </div>
        `;
      }
      
      return networks.map(n => this.networkCard(n)).join('');
    },

    networkCard(network, featured = false) {
      const sponsoredBadge = network.sponsored ? '<span class="sponsored-badge">SPONSORED</span>' : '';
      const featuredClass = featured || network.featured ? 'featured' : '';
      
      // ✅ PROPER URL: Query parameter
      const detailUrl = `/p/network-detail.html?network=${network.slug}`;
      
      return `
        <article class="network-card ${featuredClass}" data-slug="${network.slug}">
          ${sponsoredBadge}
          <div class="card-header">
            <img src="${network.logo_url || 'https://via.placeholder.com/64'}" 
                 alt="${network.name}" 
                 class="network-logo" 
                 loading="lazy">
            <div class="network-meta">
              <h3 class="network-name">${network.name}</h3>
              <span class="network-type">${network.type || 'CPA Network'}</span>
            </div>
            <div class="rating-badge">
              ⭐ ${network.ratings?.overall || '0.0'}
            </div>
          </div>
          
          <div class="card-body">
            <p class="network-description">
              ${network.short_desc || network.description?.substring(0, 150) + '...' || 'No description available'}
            </p>
            
            <div class="network-stats">
              <div class="stat">
                <span class="stat-value">${network.offer_count?.toLocaleString() || '0'}</span>
                <span class="stat-label">Offers</span>
              </div>
              <div class="stat">
                <span class="stat-value">${network.review_count || '0'}</span>
                <span class="stat-label">Reviews</span>
              </div>
              <div class="stat">
                <span class="stat-value">${network.min_payment || 'N/A'}</span>
                <span class="stat-label">Min Payout</span>
              </div>
            </div>
          </div>
          
          <div class="card-footer">
            <a href="${detailUrl}" class="btn btn-secondary">View Details</a>
            <a href="${network.join_url}" class="btn btn-primary btn-join" target="_blank" rel="noopener">
              Join Network
            </a>
          </div>
        </article>
      `;
    },

    networkDetail(network) {
      return `
        <div class="network-detail">
          <div class="page-header" style="background: var(--card-bg); padding: 2rem; border-radius: 1rem; margin-bottom: 2rem;">
            <div style="display: flex; gap: 2rem; align-items: flex-start; flex-wrap: wrap;">
              <img src="${network.logo_url || 'https://via.placeholder.com/120'}" 
                   alt="${network.name}" 
                   style="width: 120px; height: 120px; border-radius: 16px; border: 2px solid var(--border-color);">
              
              <div style="flex: 1; min-width: 250px;">
                <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 0.5rem; flex-wrap: wrap;">
                  <h1 style="font-size: 2rem; font-weight: 800;">${network.name}</h1>
                  ${network.sponsored ? '<span style="background: var(--accent); color: white; padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 700;">SPONSORED</span>' : ''}
                </div>
                
                <p style="color: var(--text-secondary); margin-bottom: 1rem;">${network.description || 'No description available'}</p>
                
                <div style="display: flex; gap: 2rem; flex-wrap: wrap;">
                  <div>
                    <div style="font-size: 2rem; font-weight: 800; color: var(--success);">⭐ ${network.ratings?.overall || '0.0'}</div>
                    <div style="font-size: 0.875rem; color: var(--text-muted);">${network.review_count || 0} reviews</div>
                  </div>
                  
                  <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
                    <a href="${network.join_url}" class="btn btn-primary" style="padding: 0.75rem 2rem;" target="_blank" rel="noopener">
                      Join Now
                    </a>
                    <a href="${network.website_url}" class="btn btn-secondary" target="_blank" rel="noopener">
                      Visit Website
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.5rem; margin-bottom: 2rem;">
            <div class="widget">
              <h4>📊 Tracking</h4>
              <p style="font-size: 1.25rem; font-weight: 600; margin-top: 0.5rem;">${network.tracking_software || 'N/A'}</p>
            </div>
            
            <div class="widget">
              <h4>💰 Commission</h4>
              <p style="font-size: 1.25rem; font-weight: 600; margin-top: 0.5rem;">${network.commission_types?.join(', ') || 'N/A'}</p>
            </div>
            
            <div class="widget">
              <h4>💳 Payment</h4>
              <p style="font-size: 1.25rem; font-weight: 600; margin-top: 0.5rem;">${network.payment_methods?.join(', ') || 'N/A'}</p>
              <p style="font-size: 0.875rem; color: var(--text-muted); margin-top: 0.25rem;">
                Min: ${network.min_payment || 'N/A'} | ${network.payment_frequency?.join(', ') || 'N/A'}
              </p>
            </div>
            
            <div class="widget">
              <h4>🎯 Verticals</h4>
              <div style="display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 0.5rem;">
                ${network.verticals?.map(v => `<span style="background: var(--primary-light); color: var(--primary); padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.875rem;">${v}</span>`).join('') || 'N/A'}
              </div>
            </div>
          </div>
          
          <div class="widget" style="margin-bottom: 2rem;">
            <h4>📋 Rating Breakdown</h4>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-top: 1rem;">
              ${this.ratingBar('Offers', network.ratings?.offers || 0)}
              ${this.ratingBar('Payout', network.ratings?.payout || 0)}
              ${this.ratingBar('Tracking', network.ratings?.tracking || 0)}
              ${this.ratingBar('Support', network.ratings?.support || 0)}
            </div>
          </div>
        </div>
      `;
    },

    ratingBar(label, value) {
      const percentage = (value / 5) * 100;
      return `
        <div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 0.25rem;">
            <span style="font-size: 0.875rem; font-weight: 500;">${label}</span>
            <span style="font-size: 0.875rem; font-weight: 600;">${value}/5</span>
          </div>
          <div style="background: var(--bg-tertiary); height: 8px; border-radius: 4px; overflow: hidden;">
            <div style="background: linear-gradient(90deg, var(--primary) 0%, var(--secondary) 100%); 
                        width: ${percentage}%; height: 100%; border-radius: 4px; transition: width 0.5s ease;">
            </div>
          </div>
        </div>
      `;
    },

    reviewsSection(reviews, stats) {
      return `
        <div class="reviews-section" style="margin-bottom: 2rem;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem;">
            <h2 style="font-size: 1.5rem; font-weight: 700;">Reviews (${stats?.total || 0})</h2>
            <button onclick="document.getElementById('reviewForm').scrollIntoView({behavior: 'smooth'})" class="btn btn-primary">
              Write a Review
            </button>
          </div>
          
          ${stats?.distribution ? `
            <div class="widget" style="margin-bottom: 1.5rem;">
              <h4>Rating Distribution</h4>
              <div style="margin-top: 1rem;">
                ${[5, 4, 3, 2, 1].map(star => {
                  const count = stats.distribution[star] || 0;
                  const pct = stats.total ? (count / stats.total) * 100 : 0;
                  return `
                    <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 0.5rem;">
                      <span style="width: 3rem; font-size: 0.875rem;">${star} ★</span>
                      <div style="flex: 1; background: var(--bg-tertiary); height: 8px; border-radius: 4px;">
                        <div style="background: var(--accent); width: ${pct}%; height: 100%; border-radius: 4px;"></div>
                      </div>
                      <span style="width: 3rem; text-align: right; font-size: 0.875rem; color: var(--text-muted);">${count}</span>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>
          ` : ''}
          
          <div class="reviews-list" style="display: flex; flex-direction: column; gap: 1rem;">
            ${reviews?.length ? reviews.map(r => this.reviewCard(r)).join('') : '<p style="text-align: center; color: var(--text-muted); padding: 2rem;">No reviews yet. Be the first to review!</p>'}
          </div>
        </div>
      `;
    },

    reviewCard(review, showNetwork = false) {
      const date = new Date(review.date_posted).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
      
      return `
        <div class="widget review-card" style="position: relative;">
          ${review.verified ? '<span style="position: absolute; top: 1rem; right: 1rem; background: var(--success); color: white; padding: 0.25rem 0.5rem; border-radius: 0.375rem; font-size: 0.75rem; font-weight: 600;">✓ Verified</span>' : ''}
          
          <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem;">
            <div style="width: 48px; height: 48px; background: var(--primary); color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 1.25rem;">
              ${review.reviewer_name?.charAt(0).toUpperCase() || '?'}
            </div>
            <div>
              <div style="font-weight: 600;">${review.reviewer_name || 'Anonymous'}</div>
              <div style="font-size: 0.875rem; color: var(--text-muted);">${date}</div>
              ${showNetwork ? `<div style="font-size: 0.875rem;"><a href="/p/network-detail.html?network=${review.networkSlug}" style="color: var(--primary); text-decoration: none;">${review.networkName}</a></div>` : ''}
            </div>
            <div style="margin-left: auto; text-align: right;">
              <div style="font-size: 1.5rem; font-weight: 800; color: var(--success);">⭐ ${review.ratings?.overall || 'N/A'}</div>
            </div>
          </div>
          
          <div style="display: flex; gap: 1rem; margin-bottom: 1rem; flex-wrap: wrap;">
            <span style="font-size: 0.875rem; color: var(--text-muted);">Offers: ${'★'.repeat(review.ratings?.offers || 0)}${'☆'.repeat(5 - (review.ratings?.offers || 0))}</span>
            <span style="font-size: 0.875rem; color: var(--text-muted);">Payout: ${'★'.repeat(review.ratings?.payout || 0)}${'☆'.repeat(5 - (review.ratings?.payout || 0))}</span>
            <span style="font-size: 0.875rem; color: var(--text-muted);">Tracking: ${'★'.repeat(review.ratings?.tracking || 0)}${'☆'.repeat(5 - (review.ratings?.tracking || 0))}</span>
            <span style="font-size: 0.875rem; color: var(--text-muted);">Support: ${'★'.repeat(review.ratings?.support || 0)}${'☆'.repeat(5 - (review.ratings?.support || 0))}</span>
          </div>
          
          <p style="line-height: 1.6; color: var(--text-secondary);">${review.comment || 'No comment provided'}</p>
          
          <div style="display: flex; gap: 1rem; margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--border-color);">
            <button style="background: none; border: none; color: var(--text-muted); cursor: pointer; display: flex; align-items: center; gap: 0.25rem;" onclick="this.style.color='var(--success)'">
              👍 Helpful (${review.likes || 0})
            </button>
            <button style="background: none; border: none; color: var(--text-muted); cursor: pointer; display: flex; align-items: center; gap: 0.25rem;">
              👎 (${review.dislikes || 0})
            </button>
          </div>
        </div>
      `;
    },

    reviewForm(networkSlug) {
      return `
        <div class="widget" id="reviewForm" style="background: linear-gradient(135deg, var(--primary-light) 0%, var(--bg-secondary) 100%);">
          <h3 style="margin-bottom: 1.5rem;">📝 Write a Review</h3>
          <form id="reviewForm" style="display: flex; flex-direction: column; gap: 1.25rem;">
            <input type="hidden" name="network_slug" value="${networkSlug}">
            
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
              <div>
                <label style="display: block; font-size: 0.875rem; font-weight: 500; margin-bottom: 0.5rem;">Your Name</label>
                <input type="text" name="reviewer_name" required class="form-input" placeholder="John Doe">
              </div>
              <div>
                <label style="display: block; font-size: 0.875rem; font-weight: 500; margin-bottom: 0.5rem;">Email (private)</label>
                <input type="email" name="reviewer_email" required class="form-input" placeholder="john@example.com">
              </div>
            </div>
            
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 1rem;">
              ${['offers', 'payout', 'tracking', 'support'].map(type => `
                <div>
                  <label style="display: block; font-size: 0.875rem; font-weight: 500; margin-bottom: 0.5rem; text-transform: capitalize;">${type} Rating</label>
                  <select name="rating_${type}" required class="filter-select" style="width: 100%;">
                    <option value="5">★★★★★ (Excellent)</option>
                    <option value="4">★★★★☆ (Good)</option>
                    <option value="3">★★★☆☆ (Average)</option>
                    <option value="2">★★☆☆☆ (Poor)</option>
                    <option value="1">★☆☆☆☆ (Terrible)</option>
                  </select>
                </div>
              `).join('')}
            </div>
            
            <div>
              <label style="display: block; font-size: 0.875rem; font-weight: 500; margin-bottom: 0.5rem;">Your Review</label>
              <textarea name="comment" required class="form-input" rows="4" placeholder="Share your experience with this network..." style="resize: vertical;"></textarea>
            </div>
            
            <button type="submit" class="btn btn-primary" style="align-self: flex-start; padding: 0.75rem 2rem;">
              Submit Review
            </button>
          </form>
        </div>
      `;
    },

    pagination(data) {
      if (!data || data.totalPages <= 1) return '';
      
      const pages = [];
      for (let i = 1; i <= data.totalPages; i++) {
        if (
          i === 1 || 
          i === data.totalPages || 
          (i >= data.page - 1 && i <= data.page + 1)
        ) {
          pages.push(i);
        } else if (pages[pages.length - 1] !== '...') {
          pages.push('...');
        }
      }
      
      return `
        <div class="pagination" style="display: flex; gap: 0.5rem; justify-content: center; margin-top: 2rem;">
          <button class="pagination-btn btn btn-secondary" data-page="${data.page - 1}" ${!data.hasPrev ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : ''}>
            ← Previous
          </button>
          
          ${pages.map(p => {
            if (p === '...') return '<span style="padding: 0.5rem;">...</span>';
            const active = p === data.page ? 'btn-primary' : 'btn-secondary';
            return `<button class="pagination-btn btn ${active}" data-page="${p}">${p}</button>`;
          }).join('')}
          
          <button class="pagination-btn btn btn-secondary" data-page="${data.page + 1}" ${!data.hasNext ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : ''}>
            Next →
          </button>
        </div>
      `;
    },

    notmWidget(network) {
      const detailUrl = `/p/network-detail.html?network=${network.slug}`;
      return `
        <div class="notm-card">
          <img src="${network.logo_url}" alt="${network.name}" class="notm-logo">
          <div class="notm-name">${network.name}</div>
          <div class="notm-badge">NETWORK OF THE MONTH</div>
          <div class="notm-rating">
            ${'★'.repeat(Math.round(network.ratings?.overall || 0))}${'☆'.repeat(5 - Math.round(network.ratings?.overall || 0))}
          </div>
          <p style="font-size: 0.875rem; color: var(--text-secondary); margin-bottom: 1rem;">
            ${network.short_desc?.substring(0, 100) || 'No description'}...
          </p>
          <a href="${detailUrl}" class="btn btn-primary btn-full">View Profile</a>
        </div>
      `;
    },

    sidebarNetworkItem(network) {
      const detailUrl = `/p/network-detail.html?network=${network.slug}`;
      return `
        <div style="display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem; border-radius: 0.5rem; transition: background 0.2s; cursor: pointer;" 
             onmouseover="this.style.background='var(--bg-secondary)'" 
             onmouseout="this.style.background='transparent'"
             onclick="window.location.href='${detailUrl}'">
          <img src="${network.logo_url}" alt="${network.name}" style="width: 40px; height: 40px; border-radius: 8px; object-fit: cover;">
          <div style="flex: 1; min-width: 0;">
            <div style="font-weight: 600; font-size: 0.875rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${network.name}</div>
            <div style="font-size: 0.75rem; color: var(--text-muted);">⭐ ${network.ratings?.overall || 'N/A'} • ${network.review_count || 0} reviews</div>
          </div>
        </div>
      `;
    },

    resourcesPage() {
      const resources = [
        { category: 'Traffic Sources', items: [
          { name: 'PropellerAds', desc: 'Push notifications & pop traffic', url: '#' },
          { name: 'MegaPush', desc: 'Push notification advertising', url: '#' },
          { name: 'ZeroPark', desc: 'Domain & pop traffic', url: '#' }
        ]},
        { category: 'Spy Tools', items: [
          { name: 'AdPlexity', desc: 'Ad intelligence platform', url: '#' },
          { name: 'Anstrex', desc: 'Native & push ad spy tool', url: '#' },
          { name: 'SpyOver', desc: 'Native ad monitoring', url: '#' }
        ]},
        { category: 'Tracking', items: [
          { name: 'Voluum', desc: 'Performance tracking platform', url: '#' },
          { name: 'Binom', desc: 'Self-hosted tracker', url: '#' },
          { name: 'RedTrack', desc: 'Cloud-based tracker', url: '#' }
        ]}
      ];

      return `
        <div class="page-header">
          <h1 class="page-title">Affiliate Resources</h1>
          <p class="page-subtitle">Essential tools and traffic sources for affiliate marketers</p>
        </div>
        
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem;">
          ${resources.map(cat => `
            <div class="widget">
              <h3 style="margin-bottom: 1rem; color: var(--primary);">${cat.category}</h3>
              <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                ${cat.items.map(item => `
                  <a href="${item.url}" target="_blank" rel="noopener" 
                     style="display: block; padding: 1rem; background: var(--bg-secondary); border-radius: 0.5rem; text-decoration: none; color: inherit; transition: all 0.2s;"
                     onmouseover="this.style.background='var(--primary-light)'" 
                     onmouseout="this.style.background='var(--bg-secondary)'">
                    <div style="font-weight: 600; margin-bottom: 0.25rem;">${item.name}</div>
                    <div style="font-size: 0.875rem; color: var(--text-muted);">${item.desc}</div>
                  </a>
                `).join('')}
              </div>
            </div>
          `).join('')}
        </div>
      `;
    }
  }
};

// ============================================
// AUTO-INITIALIZE
// ============================================

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    NetworksApp.init();
  });
} else {
  NetworksApp.init();
}

// Export for debugging
window.NetworksApp = NetworksApp;
console.log('✅ Networks Insights App v2.0 loaded');
