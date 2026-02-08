/**
 * NETWORKS INSIGHTS - CORE APPLICATION
 * Version: 2.0 (Fixed: Static Pages Support + Footer Pages)
 * Date: February 9, 2026
 * Dependencies: Theme, API
 */

const NetworksApp = {
  // Configuration from theme
  config: window.NI_CONFIG || {
    API_BASE_URL: 'https://script.google.com/macros/s/AKfycbw3Wiegd0Ni7jFKM_-9PFfhCBLFsDzueCJCObXqphRK5RUjZ99wjaFZVA2UhTGchwKM/exec',
    CACHE_DURATION: 5 * 60 * 1000,
    ITEMS_PER_PAGE: 20
  },

  // State management
  state: {
    networks: [],
    categories: [],
    currentPage: 1,
    totalPages: 1,
    currentFilters: {},
    isLoading: false,
    cache: new Map()
  },

  // Static pages configuration with their content
  staticPages: {
    'about': { title: 'About Us', handler: 'renderAboutPage' },
    'about_1': { title: 'About Us', handler: 'renderAboutPage' },
    'contact-us_7': { title: 'Contact Us', handler: 'renderContactPage' },
    'contact': { title: 'Contact Us', handler: 'renderContactPage' },
    'resources_33': { title: 'Resources', handler: 'renderResourcesPage' },
    'resources': { title: 'Resources', handler: 'renderResourcesPage' },
    'affiliate-resources': { title: 'Affiliate Resources', handler: 'renderResourcesPage' },
    'privacy-policy_56': { title: 'Privacy Policy', handler: 'renderPrivacyPage' },
    'privacy-policy': { title: 'Privacy Policy', handler: 'renderPrivacyPage' },
    'terms-of-service_7': { title: 'Terms of Service', handler: 'renderTermsPage' },
    'terms': { title: 'Terms of Service', handler: 'renderTermsPage' },
    'terms-of-service': { title: 'Terms of Service', handler: 'renderTermsPage' }
  },

  // Initialize application
  init() {
    console.log('NetworksApp initializing...');
    
    const dynamicContent = document.getElementById('dynamic-content');
    const path = window.location.pathname;
    const pageSlug = path.split('/').pop().replace('.html', '');
    
    console.log('Current path:', path, 'Page slug:', pageSlug);
    
    // Check if this is a static page
    if (this.staticPages[pageSlug]) {
      console.log('Static page detected:', pageSlug);
      if (dynamicContent) {
        // Render static content into the dynamic-content div
        this.renderStaticPage(pageSlug);
      }
      // Always load sidebar data for static pages
      this.loadSidebarData();
      this.bindEvents();
      return;
    }
    
    // If no dynamic-content div and not a static page, exit
    if (!dynamicContent) {
      console.log('No dynamic-content div found, exiting');
      return;
    }

    // Regular dynamic page handling
    this.detectPageType();
    this.loadSidebarData();
    this.bindEvents();
  },

  // Render static page content
  renderStaticPage(slug) {
    const container = document.getElementById('dynamic-content');
    const pageConfig = this.staticPages[slug];
    
    if (!pageConfig || !this.templates[pageConfig.handler]) {
      console.error('No handler found for static page:', slug);
      container.innerHTML = this.templates.error('Page content not found');
      return;
    }
    
    console.log('Rendering static page:', slug, 'with handler:', pageConfig.handler);
    container.innerHTML = this.templates[pageConfig.handler]();
    
    // Update page title
    document.title = `${pageConfig.title} | Networks Insights`;
  },

  // Detect which page we're on
  detectPageType() {
    const path = window.location.pathname;
    const urlParams = new URLSearchParams(window.location.search);
    
    console.log('Detecting page type for:', path);
    
    if (path === '/' || path === '/index.html') {
      this.renderHomepage();
    } else if (path.includes('/p/affiliate-networks.html')) {
      this.renderCategoryPage('all');
    } else if (path.match(/\/p\/(\w+)-networks\.html/)) {
      const vertical = path.match(/\/p\/(\w+)-networks\.html/)[1];
      this.renderCategoryPage(vertical);
    } else if (path.includes('/p/reviews.html') || path.includes('/p/reviews_')) {
      this.renderReviewsPage();
    } else if (path.includes('/p/resources.html') || path.includes('/p/resources_') || path.includes('/p/affiliate-resources')) {
      this.renderResourcesPage();
    } else if (urlParams.get('network')) {
      this.renderNetworkDetail(urlParams.get('network'));
    } else if (path.match(/\/p\/(\w+)\.html/)) {
      const slug = path.match(/\/p\/(\w+)\.html/)[1];
      // Check if it's a network detail page or static page
      if (!this.staticPages[slug]) {
        this.renderNetworkDetail(slug);
      }
    }
  },

  // ================= API METHODS =================

  async fetchAPI(action, params = {}) {
    const cacheKey = `${action}_${JSON.stringify(params)}`;
    const cached = this.getCache(cacheKey);
    
    if (cached) {
      console.log('Cache hit:', cacheKey);
      return cached;
    }

    const queryString = new URLSearchParams({ action, ...params }).toString();
    const url = `${this.config.API_BASE_URL}?${queryString}`;
    
    console.log('API Request:', url);
    
    try {
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.success) {
        this.setCache(cacheKey, data.data);
        return data.data;
      } else {
        throw new Error(data.error?.message || 'API Error');
      }
    } catch (error) {
      console.error('API Error:', error);
      this.showError('Failed to load data. Please try again.');
      return null;
    }
  },

  async postAPI(action, data) {
    const formData = new FormData();
    formData.append('action', action);
    Object.keys(data).forEach(key => formData.append(key, data[key]));

    try {
      const response = await fetch(this.config.API_BASE_URL, {
        method: 'POST',
        body: formData
      });
      const result = await response.json();
      return result;
    } catch (error) {
      console.error('POST Error:', error);
      return { success: false, error: { message: 'Submission failed' } };
    }
  },

  // ================= CACHE METHODS =================

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

  // ================= RENDER METHODS =================

  // Homepage renderer
  async renderHomepage() {
    const container = document.getElementById('dynamic-content');
    if (!container) return;
    
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
      
    } catch (error) {
      container.innerHTML = this.templates.error('Failed to load networks');
    }
  },

  // Category/Vertical page renderer
  async renderCategoryPage(vertical) {
    const container = document.getElementById('dynamic-content');
    if (!container) return;
    
    container.innerHTML = this.templates.loading();

    const params = {
      page: this.state.currentPage,
      limit: this.config.ITEMS_PER_PAGE,
      sort: 'rating'
    };

    if (vertical !== 'all') {
      params.vertical = vertical.charAt(0).toUpperCase() + vertical.slice(1);
    }

    try {
      const data = await this.fetchAPI('getNetworksByVertical', params);
      
      const title = vertical === 'all' ? 'All Networks' : 
        `${vertical.charAt(0).toUpperCase() + vertical.slice(1)} Networks`;
      
      const html = `
        <div class="page-header">
          <h1 class="page-title">${title}</h1>
          <p class="page-subtitle">Find the best ${vertical === 'all' ? 'affiliate' : vertical} networks with real reviews</p>
        </div>
        <div id="networks-grid">
          ${this.templates.networkGrid(data?.networks || [])}
        </div>
        ${this.templates.pagination(data)}
      `;
      
      container.innerHTML = html;
      this.state.networks = data?.networks || [];
      
    } catch (error) {
      container.innerHTML = this.templates.error('Failed to load networks');
    }
  },

  // Network detail page renderer
  async renderNetworkDetail(slug) {
    const container = document.getElementById('dynamic-content');
    if (!container) return;
    
    container.innerHTML = this.templates.loading();

    try {
      const data = await this.fetchAPI('getNetwork', { slug });
      
      if (!data || !data.network) {
        container.innerHTML = this.templates.error('Network not found');
        return;
      }

      const html = `
        ${this.templates.networkDetail(data.network)}
        ${this.templates.reviewsSection(data.reviews, data.reviewStats)}
        ${this.templates.reviewForm(data.network.slug)}
      `;
      
      container.innerHTML = html;
      
      // Update page title
      document.title = `${data.network.name} Reviews | ${data.network.ratings?.overall || '0.0'} Stars | Networks Insights`;
      
    } catch (error) {
      container.innerHTML = this.templates.error('Failed to load network details');
    }
  },

  // Reviews page renderer
  async renderReviewsPage() {
    const container = document.getElementById('dynamic-content');
    if (!container) return;
    
    container.innerHTML = this.templates.loading();

    try {
      // Fetch recent reviews from all networks
      const networksData = await this.fetchAPI('getNetworks', { limit: 50, sort: 'newest' });
      const networks = networksData?.networks || [];
      
      // Collect reviews from top networks
      const allReviews = [];
      for (const network of networks.slice(0, 10)) {
        const data = await this.fetchAPI('getNetwork', { slug: network.slug });
        if (data?.reviews) {
          allReviews.push(...data.reviews.map(r => ({ ...r, networkName: network.name, networkSlug: network.slug })));
        }
      }
      
      // Sort by date
      allReviews.sort((a, b) => new Date(b.date_posted) - new Date(a.date_posted));
      
      const html = `
        <div class="page-header">
          <h1 class="page-title">Recent Reviews</h1>
          <p class="page-subtitle">Real feedback from affiliate marketers</p>
        </div>
        <div class="reviews-feed">
          ${allReviews.slice(0, 20).map(review => this.templates.reviewCard(review, true)).join('')}
        </div>
      `;
      
      container.innerHTML = html;
    } catch (error) {
      container.innerHTML = this.templates.error('Failed to load reviews');
    }
  },

  // Resources page renderer
  renderResourcesPage() {
    const container = document.getElementById('dynamic-content');
    if (!container) return;
    
    container.innerHTML = this.templates.renderResourcesPage();
    document.title = 'Affiliate Resources | Networks Insights';
  },

  // Load sidebar widgets data
  async loadSidebarData() {
    try {
      // Network of the Month
      const notmData = await this.fetchAPI('getNetworks', { limit: 1, network_of_month: 'true' });
      const notmContainer = document.getElementById('notmContent');
      if (notmContainer && notmData?.networks?.[0]) {
        notmContainer.innerHTML = this.templates.notmWidget(notmData.networks[0]);
      }

      // Featured sidebar
      const featuredData = await this.fetchAPI('getNetworks', { limit: 3, featured: 'true' });
      const featuredContainer = document.getElementById('featuredSidebarList');
      if (featuredContainer && featuredData?.networks) {
        featuredContainer.innerHTML = 
          featuredData.networks.map(n => this.templates.sidebarNetworkItem(n)).join('');
      }

      // Update category counts
      const categories = await this.fetchAPI('getCategories');
      if (categories?.categories) {
        this.updateCategoryDropdown(categories.categories);
      }
    } catch (error) {
      console.error('Sidebar data loading error:', error);
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
        <span class="dropdown-count">${cat.count}</span>
      </a>
    `).join('');
  },

  // ================= EVENT HANDLERS =================

  bindEvents() {
    // Pagination clicks (delegated)
    document.addEventListener('click', (e) => {
      if (e.target.matches('.pagination-btn') || e.target.closest('.pagination-btn')) {
        const btn = e.target.closest('.pagination-btn');
        const page = parseInt(btn.dataset.page);
        if (page) {
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

  trackOutboundClick(url) {
    if (window.gtag) {
      gtag('event', 'click', {
        event_category: 'outbound',
        event_label: url
      });
    }
  },

  showError(message) {
    const container = document.getElementById('dynamic-content');
    if (container) {
      container.innerHTML = this.templates.error(message);
    }
  },

  // ================= HTML TEMPLATES =================

  templates: {
    loading() {
      return `
        <div class="loading-spinner">
          <div class="spinner"></div>
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
            <a href="/p/affiliate-networks.html" class="btn btn-primary" style="margin-top: 1rem;">Browse All Networks</a>
          </div>
        `;
      }
      
      return networks.map(n => this.networkCard(n)).join('');
    },

    networkCard(network, featured = false) {
      const sponsoredBadge = network.sponsored ? '<span class="sponsored-badge">SPONSORED</span>' : '';
      const featuredClass = featured || network.featured ? 'featured' : '';
      
      return `
        <article class="network-card ${featuredClass}" data-slug="${network.slug}">
          ${sponsoredBadge}
          <div class="card-header">
            <img src="${network.logo_url || 'https://via.placeholder.com/64?text=' + encodeURIComponent(network.name.charAt(0))}" 
                 alt="${network.name}" class="network-logo" loading="lazy"
                 onerror="this.src='https://via.placeholder.com/64?text=${encodeURIComponent(network.name.charAt(0))}'">
            <div class="network-meta">
              <h3 class="network-name">${network.name}</h3>
              <span class="network-type">${network.type}</span>
            </div>
            <div class="rating-badge">
              ⭐ ${network.ratings?.overall || '0.0'}
            </div>
          </div>
          
          <div class="card-body">
            <p class="network-description">${network.short_desc || network.description?.substring(0, 150) + '...'}</p>
            
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
            <a href="/p/${network.slug}.html" class="btn-details">View Details</a>
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
              <img src="${network.logo_url || 'https://via.placeholder.com/120?text=' + encodeURIComponent(network.name.charAt(0))}" 
                   alt="${network.name}" 
                   style="width: 120px; height: 120px; border-radius: 16px; border: 2px solid var(--border-color);"
                   onerror="this.src='https://via.placeholder.com/120?text=${encodeURIComponent(network.name.charAt(0))}'">
              
              <div style="flex: 1; min-width: 250px;">
                <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 0.5rem; flex-wrap: wrap;">
                  <h1 style="font-size: 2rem; font-weight: 800;">${network.name}</h1>
                  ${network.sponsored ? '<span style="background: var(--accent); color: white; padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 700;">SPONSORED</span>' : ''}
                </div>
                
                <p style="color: var(--text-secondary); margin-bottom: 1rem;">${network.description}</p>
                
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
              ${this.ratingBar('Offers', network.ratings?.offers)}
              ${this.ratingBar('Payout', network.ratings?.payout)}
              ${this.ratingBar('Tracking', network.ratings?.tracking)}
              ${this.ratingBar('Support', network.ratings?.support)}
            </div>
          </div>
        </div>
      `;
    },

    ratingBar(label, value) {
      const percentage = ((value || 0) / 5) * 100;
      return `
        <div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 0.25rem;">
            <span style="font-size: 0.875rem; font-weight: 500;">${label}</span>
            <span style="font-size: 0.875rem; font-weight: 600;">${value || '0.0'}/5</span>
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
              ${showNetwork ? `<div style="font-size: 0.875rem;"><a href="/p/${review.networkSlug}.html" style="color: var(--primary); text-decoration: none;">${review.networkName}</a></div>` : ''}
            </div>
            <div style="margin-left: auto; text-align: right;">
              <div style="font-size: 1.5rem; font-weight: 800; color: var(--success);">⭐ ${review.ratings?.overall || '0.0'}</div>
            </div>
          </div>
          
          <div style="display: flex; gap: 1rem; margin-bottom: 1rem; flex-wrap: wrap;">
            <span style="font-size: 0.875rem; color: var(--text-muted);">Offers: ${'★'.repeat(review.ratings?.offers || 0)}${'☆'.repeat(5 - (review.ratings?.offers || 0))}</span>
            <span style="font-size: 0.875rem; color: var(--text-muted);">Payout: ${'★'.repeat(review.ratings?.payout || 0)}${'☆'.repeat(5 - (review.ratings?.payout || 0))}</span>
            <span style="font-size: 0.875rem; color: var(--text-muted);">Tracking: ${'★'.repeat(review.ratings?.tracking || 0)}${'☆'.repeat(5 - (review.ratings?.tracking || 0))}</span>
            <span style="font-size: 0.875rem; color: var(--text-muted);">Support: ${'★'.repeat(review.ratings?.support || 0)}${'☆'.repeat(5 - (review.ratings?.support || 0))}</span>
          </div>
          
          <p style="line-height: 1.6; color: var(--text-secondary);">${review.comment}</p>
          
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
      return `
        <div class="notm-card">
          <img src="${network.logo_url || 'https://via.placeholder.com/80?text=' + encodeURIComponent(network.name.charAt(0))}" 
               alt="${network.name}" class="notm-logo"
               onerror="this.src='https://via.placeholder.com/80?text=${encodeURIComponent(network.name.charAt(0))}'">
          <div class="notm-name">${network.name}</div>
          <div class="notm-badge">NETWORK OF THE MONTH</div>
          <div class="notm-rating">
            ${'★'.repeat(Math.round(network.ratings?.overall || 0))}${'☆'.repeat(5 - Math.round(network.ratings?.overall || 0))}
          </div>
          <p style="font-size: 0.875rem; color: var(--text-secondary); margin-bottom: 1rem;">
            ${network.short_desc?.substring(0, 100) || 'Top rated affiliate network'}...
          </p>
          <a href="/p/${network.slug}.html" class="btn btn-primary btn-full">View Profile</a>
        </div>
      `;
    },

    sidebarNetworkItem(network) {
      return `
        <div style="display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem; border-radius: 0.5rem; transition: background 0.2s; cursor: pointer;" 
             onmouseover="this.style.background='var(--bg-secondary)'" 
             onmouseout="this.style.background='transparent'"
             onclick="window.location.href='/p/${network.slug}.html'">
          <img src="${network.logo_url || 'https://via.placeholder.com/40?text=' + encodeURIComponent(network.name.charAt(0))}" 
               alt="${network.name}" style="width: 40px; height: 40px; border-radius: 8px; object-fit: cover;"
               onerror="this.src='https://via.placeholder.com/40?text=${encodeURIComponent(network.name.charAt(0))}'">
          <div style="flex: 1; min-width: 0;">
            <div style="font-weight: 600; font-size: 0.875rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${network.name}</div>
            <div style="font-size: 0.75rem; color: var(--text-muted);">⭐ ${network.ratings?.overall || '0.0'} • ${network.review_count || 0} reviews</div>
          </div>
        </div>
      `;
    },

    // ================= STATIC PAGE TEMPLATES =================

    renderAboutPage() {
      return `
        <div class="page-header">
          <h1 class="page-title">About Networks Insights</h1>
          <p class="page-subtitle">Your trusted affiliate network directory</p>
        </div>
        
        <div class="widget" style="margin-bottom: 2rem;">
          <h2>Who We Are</h2>
          <p style="line-height: 1.8; margin-top: 1rem;">
            Networks Insights is the most comprehensive affiliate network directory, helping affiliate marketers 
            discover, compare, and review CPA, CPL, CPS, and CPI networks worldwide. Founded in 2025, we've grown 
            to become a trusted resource for both beginners and experienced affiliates.
          </p>
          <p style="line-height: 1.8; margin-top: 1rem;">
            Our platform features real reviews from actual affiliates, detailed network profiles, payment proofs, 
            and comprehensive filtering tools to help you find the perfect network for your marketing needs.
          </p>
        </div>
        
        <div class="widget" style="margin-bottom: 2rem;">
          <h2>What We Offer</h2>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.5rem; margin-top: 1.5rem;">
            <div style="text-align: center; padding: 1.5rem; background: var(--bg-secondary); border-radius: 0.75rem;">
              <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">📊</div>
              <h4>Network Directory</h4>
              <p style="font-size: 0.875rem; color: var(--text-muted);">Browse 1000+ affiliate networks with detailed profiles</p>
            </div>
            <div style="text-align: center; padding: 1.5rem; background: var(--bg-secondary); border-radius: 0.75rem;">
              <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">⭐</div>
              <h4>Real Reviews</h4>
              <p style="font-size: 0.875rem; color: var(--text-muted);">Read authentic reviews from fellow affiliates</p>
            </div>
            <div style="text-align: center; padding: 1.5rem; background: var(--bg-secondary); border-radius: 0.75rem;">
              <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">🔍</div>
              <h4>Advanced Filters</h4>
              <p style="font-size: 0.875rem; color: var(--text-muted);">Filter by vertical, payment, tracking & more</p>
            </div>
            <div style="text-align: center; padding: 1.5rem; background: var(--bg-secondary); border-radius: 0.75rem;">
              <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">💰</div>
              <h4>Payment Proofs</h4>
              <p style="font-size: 0.875rem; color: var(--text-muted);">View verified payment screenshots</p>
            </div>
          </div>
        </div>
        
        <div class="widget">
          <h2>Our Mission</h2>
          <p style="line-height: 1.8; margin-top: 1rem;">
            We believe in transparency and trust in the affiliate marketing industry. Our mission is to empower 
            affiliates with the information they need to make informed decisions about which networks to work with. 
            By providing a platform for honest reviews and detailed comparisons, we help build a more trustworthy 
            affiliate ecosystem for everyone.
          </p>
        </div>
      `;
    },

    renderContactPage() {
      return `
        <div class="page-header">
          <h1 class="page-title">Contact Us</h1>
          <p class="page-subtitle">We'd love to hear from you</p>
        </div>
        
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem;">
          <div class="widget">
            <h2>Get in Touch</h2>
            <p style="margin-top: 1rem; line-height: 1.6;">
              Have a question, suggestion, or want to list your network? Reach out to us using the form or contact methods below.
            </p>
            
            <div style="margin-top: 2rem;">
              <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem;">
                <div style="width: 48px; height: 48px; background: var(--primary-light); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.25rem;">📧</div>
                <div>
                  <div style="font-weight: 600;">Email</div>
                  <a href="mailto:admin@networksinsights.com" style="color: var(--primary); text-decoration: none;">admin@networksinsights.com</a>
                </div>
              </div>
              
              <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem;">
                <div style="width: 48px; height: 48px; background: var(--primary-light); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.25rem;">💬</div>
                <div>
                  <div style="font-weight: 600;">Telegram</div>
                  <a href="https://t.me/networksinsights" target="_blank" style="color: var(--primary); text-decoration: none;">@networksinsights</a>
                </div>
              </div>
              
              <div style="display: flex; align-items: center; gap: 1rem;">
                <div style="width: 48px; height: 48px; background: var(--primary-light); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.25rem;">🐦</div>
                <div>
                  <div style="font-weight: 600;">Twitter</div>
                  <a href="https://twitter.com/networksinsights" target="_blank" style="color: var(--primary); text-decoration: none;">@networksinsights</a>
                </div>
              </div>
            </div>
          </div>
          
          <div class="widget">
            <h2>Send a Message</h2>
            <form action="https://formspree.io/f/YOUR_FORM_ID" method="POST" style="display: flex; flex-direction: column; gap: 1rem; margin-top: 1rem;">
              <div>
                <label style="display: block; font-size: 0.875rem; font-weight: 500; margin-bottom: 0.5rem;">Your Name</label>
                <input type="text" name="name" required class="form-input" placeholder="John Doe">
              </div>
              <div>
                <label style="display: block; font-size: 0.875rem; font-weight: 500; margin-bottom: 0.5rem;">Email</label>
                <input type="email" name="email" required class="form-input" placeholder="john@example.com">
              </div>
              <div>
                <label style="display: block; font-size: 0.875rem; font-weight: 500; margin-bottom: 0.5rem;">Subject</label>
                <select name="subject" class="filter-select" style="width: 100%;">
                  <option value="general">General Inquiry</option>
                  <option value="advertise">Advertising</option>
                  <option value="list-network">List My Network</option>
                  <option value="report">Report an Issue</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label style="display: block; font-size: 0.875rem; font-weight: 500; margin-bottom: 0.5rem;">Message</label>
                <textarea name="message" required class="form-input" rows="4" placeholder="Your message..." style="resize: vertical;"></textarea>
              </div>
              <button type="submit" class="btn btn-primary">Send Message</button>
            </form>
            <p style="font-size: 0.75rem; color: var(--text-muted); margin-top: 1rem;">
              * For network submissions, please use our <a href="/p/add-network.html" style="color: var(--primary);">Add Network</a> page.
            </p>
          </div>
        </div>
      `;
    },

    renderResourcesPage() {
      const resources = [
        { 
          category: 'Traffic Sources', 
          icon: '🚀',
          items: [
            { name: 'PropellerAds', desc: 'Push notifications & pop traffic', url: 'https://propellerads.com' },
            { name: 'MegaPush', desc: 'Push notification advertising', url: 'https://megapush.com' },
            { name: 'ZeroPark', desc: 'Domain & pop traffic', url: 'https://zeropark.com' },
            { name: 'Taboola', desc: 'Native advertising platform', url: 'https://taboola.com' },
            { name: 'Outbrain', desc: 'Content discovery network', url: 'https://outbrain.com' }
          ]
        },
        { 
          category: 'Spy Tools', 
          icon: '🔍',
          items: [
            { name: 'AdPlexity', desc: 'Ad intelligence platform', url: 'https://adplexity.com' },
            { name: 'Anstrex', desc: 'Native & push ad spy tool', url: 'https://anstrex.com' },
            { name: 'SpyOver', desc: 'Native ad monitoring', url: 'https://spyover.com' },
            { name: 'AdBeat', desc: 'Competitive intelligence', url: 'https://adbeat.com' }
          ]
        },
        { 
          category: 'Tracking', 
          icon: '📊',
          items: [
            { name: 'Voluum', desc: 'Performance tracking platform', url: 'https://voluum.com' },
            { name: 'Binom', desc: 'Self-hosted tracker', url: 'https://binom.org' },
            { name: 'RedTrack', desc: 'Cloud-based tracker', url: 'https://redtrack.io' },
            { name: 'BeMob', desc: 'Free cloud tracker', url: 'https://bemob.com' }
          ]
        },
        { 
          category: 'Landing Page Builders', 
          icon: '🛠️',
          items: [
            { name: 'Unbounce', desc: 'Landing page builder', url: 'https://unbounce.com' },
            { name: 'Instapage', desc: 'Post-click optimization', url: 'https://instapage.com' },
            { name: 'ClickFunnels', desc: 'Sales funnel builder', url: 'https://clickfunnels.com' },
            { name: 'Leadpages', desc: 'Landing page creator', url: 'https://leadpages.com' }
          ]
        },
        { 
          category: 'Design Tools', 
          icon: '🎨',
          items: [
            { name: 'Canva', desc: 'Graphic design tool', url: 'https://canva.com' },
            { name: 'Figma', desc: 'UI/UX design platform', url: 'https://figma.com' },
            { name: 'Photopea', desc: 'Free Photoshop alternative', url: 'https://photopea.com' }
          ]
        },
        { 
          category: 'Learning Resources', 
          icon: '📚',
          items: [
            { name: 'AffFix', desc: 'Affiliate marketing forum', url: 'https://afffix.com' },
            { name: 'STM Forum', desc: 'Premium affiliate forum', url: 'https://stmforum.com' },
            { name: 'AffiliateFix', desc: 'Affiliate community', url: 'https://affiliatefix.com' },
            { name: 'CharlesNgo', desc: 'Affiliate marketing blog', url: 'https://charlesngo.com' }
          ]
        }
      ];

      return `
        <div class="page-header">
          <h1 class="page-title">Affiliate Resources</h1>
          <p class="page-subtitle">Essential tools and traffic sources for affiliate marketers</p>
        </div>
        
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); gap: 1.5rem;">
          ${resources.map(cat => `
            <div class="widget">
              <h3 style="margin-bottom: 1rem; color: var(--primary);">${cat.icon} ${cat.category}</h3>
              <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                ${cat.items.map(item => `
                  <a href="${item.url}" target="_blank" rel="noopener noreferrer nofollow" 
                     style="display: block; padding: 1rem; background: var(--bg-secondary); border-radius: 0.5rem; text-decoration: none; color: inherit; transition: all 0.2s;"
                     onmouseover="this.style.background='var(--primary-light)'" 
                     onmouseout="this.style.background='var(--bg-secondary)'">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                      <div>
                        <div style="font-weight: 600; margin-bottom: 0.25rem;">${item.name}</div>
                        <div style="font-size: 0.875rem; color: var(--text-muted);">${item.desc}</div>
                      </div>
                      <span style="color: var(--primary);">→</span>
                    </div>
                  </a>
                `).join('')}
              </div>
            </div>
          `).join('')}
        </div>
        
        <div class="widget" style="margin-top: 2rem; text-align: center;">
          <h3>Want to suggest a resource?</h3>
          <p style="color: var(--text-muted); margin: 1rem 0;">If you know a great tool that should be listed here, let us know!</p>
          <a href="/p/contact-us_7.html" class="btn btn-primary">Suggest a Resource</a>
        </div>
      `;
    },

    renderPrivacyPage() {
      return `
        <div class="page-header">
          <h1 class="page-title">Privacy Policy</h1>
          <p class="page-subtitle">How we handle your data</p>
        </div>
        
        <div class="widget" style="margin-bottom: 2rem;">
          <p style="line-height: 1.8;">
            At Networks Insights, we take your privacy seriously. This Privacy Policy explains how we collect, 
            use, and protect your personal information when you use our website.
          </p>
          <p style="margin-top: 1rem; color: var(--text-muted);">Last updated: February 2026</p>
        </div>
        
        <div class="widget" style="margin-bottom: 2rem;">
          <h2>Information We Collect</h2>
          <ul style="margin-top: 1rem; padding-left: 1.5rem; line-height: 2;">
            <li><strong>Personal Information:</strong> Name, email address when you submit reviews or contact us</li>
            <li><strong>Usage Data:</strong> Pages visited, time spent, clicks (via Google Analytics)</li>
            <li><strong>Device Information:</strong> Browser type, IP address, operating system</li>
            <li><strong>Cookies:</strong> Small files stored on your device to enhance user experience</li>
          </ul>
        </div>
        
        <div class="widget" style="margin-bottom: 2rem;">
          <h2>How We Use Your Information</h2>
          <ul style="margin-top: 1rem; padding-left: 1.5rem; line-height: 2;">
            <li>To provide and maintain our services</li>
            <li>To process and display your reviews</li>
            <li>To communicate with you about your inquiries</li>
            <li>To improve our website and user experience</li>
            <li>To detect and prevent fraud or abuse</li>
          </ul>
        </div>
        
        <div class="widget" style="margin-bottom: 2rem;">
          <h2>Data Protection</h2>
          <p style="line-height: 1.8; margin-top: 1rem;">
            We implement appropriate security measures to protect your personal information. However, no method 
            of transmission over the internet is 100% secure, and we cannot guarantee absolute security.
          </p>
        </div>
        
        <div class="widget" style="margin-bottom: 2rem;">
          <h2>Third-Party Services</h2>
          <p style="line-height: 1.8; margin-top: 1rem;">
            We use third-party services including Google Analytics for usage tracking and Google Sheets for data storage. 
            These services may collect information according to their own privacy policies.
          </p>
        </div>
        
        <div class="widget" style="margin-bottom: 2rem;">
          <h2>Your Rights</h2>
          <ul style="margin-top: 1rem; padding-left: 1.5rem; line-height: 2;">
            <li>Request access to your personal data</li>
            <li>Request correction of inaccurate data</li>
            <li>Request deletion of your data</li>
            <li>Opt-out of marketing communications</li>
          </ul>
        </div>
        
        <div class="widget">
          <h2>Contact Us</h2>
          <p style="line-height: 1.8; margin-top: 1rem;">
            If you have any questions about this Privacy Policy, please contact us at 
            <a href="mailto:admin@networksinsights.com" style="color: var(--primary);">admin@networksinsights.com</a>.
          </p>
        </div>
      `;
    },

    renderTermsPage() {
      return `
        <div class="page-header">
          <h1 class="page-title">Terms of Service</h1>
          <p class="page-subtitle">Rules and guidelines for using our platform</p>
        </div>
        
        <div class="widget" style="margin-bottom: 2rem;">
          <p style="line-height: 1.8;">
            By accessing and using Networks Insights, you agree to comply with and be bound by the following 
            terms and conditions. Please read these terms carefully before using our website.
          </p>
          <p style="margin-top: 1rem; color: var(--text-muted);">Last updated: February 2026</p>
        </div>
        
        <div class="widget" style="margin-bottom: 2rem;">
          <h2>1. Acceptance of Terms</h2>
          <p style="line-height: 1.8; margin-top: 1rem;">
            By accessing this website, you accept these Terms of Service in full. If you disagree with any part 
            of these terms, you must not use our website.
          </p>
        </div>
        
        <div class="widget" style="margin-bottom: 2rem;">
          <h2>2. User Conduct</h2>
          <p style="line-height: 1.8; margin-top: 1rem;">When using our platform, you agree NOT to:</p>
          <ul style="margin-top: 1rem; padding-left: 1.5rem; line-height: 2;">
            <li>Submit false or misleading reviews</li>
            <li>Use offensive, abusive, or inappropriate language</li>
            <li>Attempt to manipulate ratings or reviews</li>
            <li>Post spam or promotional content without authorization</li>
            <li>Violate any applicable laws or regulations</li>
            <li>Attempt to gain unauthorized access to our systems</li>
          </ul>
        </div>
        
        <div class="widget" style="margin-bottom: 2rem;">
          <h2>3. Reviews and Content</h2>
          <p style="line-height: 1.8; margin-top: 1rem;">
            By submitting reviews or other content to Networks Insights, you grant us a non-exclusive, 
            royalty-free license to use, modify, and display that content. You represent that you have the 
            right to submit such content and that it does not violate any third-party rights.
          </p>
          <p style="line-height: 1.8; margin-top: 1rem;">
            We reserve the right to remove any content that violates these terms or that we deem inappropriate 
            at our sole discretion.
          </p>
        </div>
        
        <div class="widget" style="margin-bottom: 2rem;">
          <h2>4. Disclaimer</h2>
          <p style="line-height: 1.8; margin-top: 1rem;">
            Networks Insights provides information and reviews for informational purposes only. We do not 
            endorse any specific affiliate network and are not responsible for any business relationships 
            formed through our platform.
          </p>
          <p style="line-height: 1.8; margin-top: 1rem;">
            Reviews reflect the opinions of individual users and not necessarily those of Networks Insights. 
            We make no warranties about the accuracy or completeness of any information on our site.
          </p>
        </div>
        
        <div class="widget" style="margin-bottom: 2rem;">
          <h2>5. Limitation of Liability</h2>
          <p style="line-height: 1.8; margin-top: 1rem;">
            Networks Insights shall not be liable for any direct, indirect, incidental, consequential, or 
            punitive damages arising from your use of or inability to use our website.
          </p>
        </div>
        
        <div class="widget" style="margin-bottom: 2rem;">
          <h2>6. Changes to Terms</h2>
          <p style="line-height: 1.8; margin-top: 1rem;">
            We reserve the right to modify these Terms of Service at any time. Changes will be effective 
            immediately upon posting. Your continued use of the website constitutes acceptance of the modified terms.
          </p>
        </div>
        
        <div class="widget">
          <h2>7. Contact Information</h2>
          <p style="line-height: 1.8; margin-top: 1rem;">
            For questions about these Terms of Service, please contact us at 
            <a href="mailto:admin@networksinsights.com" style="color: var(--primary);">admin@networksinsights.com</a>.
          </p>
        </div>
      `;
    }
  },

  // ================= FILTER HANDLERS =================

  handleSort(sortBy) {
    this.state.currentFilters.sort = sortBy;
    this.state.currentPage = 1;
    this.detectPageType();
  },

  handleFilter(type, value) {
    if (value) {
      this.state.currentFilters[type] = value;
    } else {
      delete this.state.currentFilters[type];
    }
    this.state.currentPage = 1;
    this.detectPageType();
  }
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => NetworksApp.init());
} else {
  NetworksApp.init();
}
