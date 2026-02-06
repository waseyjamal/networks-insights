/**
 * NETWORKS INSIGHTS - CORE APPLICATION
 * Agent 3: JavaScript + HTML Templates
 * Version: 1.1 (Updated: Filters Removed)
 * Dependencies: Agent 2 (Theme), Agent 1 (API)
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

  // Initialize application
  init() {
    this.detectPageType();
    this.loadSidebarData();
    this.bindEvents();
  },

  // Detect which page we're on
  detectPageType() {
    const path = window.location.pathname;
    const urlParams = new URLSearchParams(window.location.search);
    
    if (path === '/' || path === '/index.html') {
      this.renderHomepage();
    } else if (path.includes('/p/affiliate-networks.html')) {
      this.renderCategoryPage('all');
    } else if (path.match(/\/p\/(\w+)-networks\.html/)) {
      const vertical = path.match(/\/p\/(\w+)-networks\.html/)[1];
      this.renderCategoryPage(vertical);
    } else if (path.includes('/p/reviews.html')) {
      this.renderReviewsPage();
    } else if (path.includes('/p/resources.html')) {
      this.renderResourcesPage();
    } else if (urlParams.get('network')) {
      this.renderNetworkDetail(urlParams.get('network'));
    } else if (path.match(/\/p\/(\w+)\.html/)) {
      // Try to load as network detail by slug
      const slug = path.match(/\/p\/(\w+)\.html/)[1];
      this.renderNetworkDetail(slug);
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
    container.innerHTML = this.templates.loading();

    try {
      const [networksData, categories] = await Promise.all([
        this.fetchAPI('getNetworks', { limit: 6, featured: 'true' }),
        this.fetchAPI('getCategories')
      ]);

      // MODIFIED: Removed this.templates.filtersBar()
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
      
      // MODIFIED: Removed this.templates.filtersBar()
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
      document.title = `${data.network.name} Reviews | ${data.network.ratings.overall} Stars | Networks Insights`;
      
    } catch (error) {
      container.innerHTML = this.templates.error('Failed to load network details');
    }
  },

  // Reviews page renderer
  async renderReviewsPage() {
    const container = document.getElementById('dynamic-content');
    container.innerHTML = this.templates.loading();

    // Fetch recent reviews from all networks (simplified - in production, add dedicated endpoint)
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
  },

  // Resources page renderer
  renderResourcesPage() {
    const container = document.getElementById('dynamic-content');
    container.innerHTML = this.templates.resourcesPage();
  },

  // Load sidebar widgets data
  async loadSidebarData() {
    // Network of the Month
    const notmData = await this.fetchAPI('getNetworks', { limit: 1, network_of_month: 'true' });
    if (notmData?.networks?.[0]) {
      document.getElementById('notmContent').innerHTML = this.templates.notmWidget(notmData.networks[0]);
    }

    // Featured sidebar
    const featuredData = await this.fetchAPI('getNetworks', { limit: 3, featured: 'true' });
    if (featuredData?.networks) {
      document.getElementById('featuredSidebarList').innerHTML = 
        featuredData.networks.map(n => this.templates.sidebarNetworkItem(n)).join('');
    }

    // Update category counts
    const categories = await this.fetchAPI('getCategories');
    if (categories?.categories) {
      this.updateCategoryDropdown(categories.categories);
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
          this.detectPageType(); // Re-render
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
    
    // Show loading state
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
    // Google Analytics tracking
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
    // MODIFIED: filtersBar() function DELETED

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
            <img src="${network.logo_url || 'https://via.placeholder.com/64'}" alt="${network.name}" class="network-logo" loading="lazy">
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
            <a href="/p/${network.slug}.html" class="btn btn-secondary">Details</a>
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
                
                <p style="color: var(--text-secondary); margin-bottom: 1rem;">${network.description}</p>
                
                <div style="display: flex; gap: 2rem; flex-wrap: wrap;">
                  <div>
                    <div style="font-size: 2rem; font-weight: 800; color: var(--success);">⭐ ${network.ratings?.overall}</div>
                    <div style="font-size: 0.875rem; color: var(--text-muted);">${network.review_count} reviews</div>
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
              ${showNetwork ? `<div style="font-size: 0.875rem;"><a href="/p/${review.networkSlug}.html" style="color: var(--primary); text-decoration: none;">${review.networkName}</a></div>` : ''}
            </div>
            <div style="margin-left: auto; text-align: right;">
              <div style="font-size: 1.5rem; font-weight: 800; color: var(--success);">⭐ ${review.ratings?.overall}</div>
            </div>
          </div>
          
          <div style="display: flex; gap: 1rem; margin-bottom: 1rem; flex-wrap: wrap;">
            <span style="font-size: 0.875rem; color: var(--text-muted);">Offers: ${'★'.repeat(review.ratings?.offers)}${'☆'.repeat(5 - review.ratings?.offers)}</span>
            <span style="font-size: 0.875rem; color: var(--text-muted);">Payout: ${'★'.repeat(review.ratings?.payout)}${'☆'.repeat(5 - review.ratings?.payout)}</span>
            <span style="font-size: 0.875rem; color: var(--text-muted);">Tracking: ${'★'.repeat(review.ratings?.tracking)}${'☆'.repeat(5 - review.ratings?.tracking)}</span>
            <span style="font-size: 0.875rem; color: var(--text-muted);">Support: ${'★'.repeat(review.ratings?.support)}${'☆'.repeat(5 - review.ratings?.support)}</span>
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
          <img src="${network.logo_url}" alt="${network.name}" class="notm-logo">
          <div class="notm-name">${network.name}</div>
          <div class="notm-badge">NETWORK OF THE MONTH</div>
          <div class="notm-rating">
            ${'★'.repeat(Math.round(network.ratings?.overall || 0))}${'☆'.repeat(5 - Math.round(network.ratings?.overall || 0))}
          </div>
          <p style="font-size: 0.875rem; color: var(--text-secondary); margin-bottom: 1rem;">
            ${network.short_desc?.substring(0, 100)}...
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
          <img src="${network.logo_url}" alt="${network.name}" style="width: 40px; height: 40px; border-radius: 8px; object-fit: cover;">
          <div style="flex: 1; min-width: 0;">
            <div style="font-weight: 600; font-size: 0.875rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${network.name}</div>
            <div style="font-size: 0.75rem; color: var(--text-muted);">⭐ ${network.ratings?.overall} • ${network.review_count} reviews</div>
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
  },

  // ================= FILTER HANDLERS (Agent 4 extends these) =================

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
