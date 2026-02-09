/**
 * NETWORKS INSIGHTS - ADVANCED FILTERING & SEARCH
 * Agent 4: Enhanced filtering, URL state, search
 * Version: 2.0 (Defensive Architecture)
 * Dependencies: PageTypeDetector (MUST LOAD FIRST), NetworksApp
 */

const FilterEngine = {
  // Configuration
  config: {
    debounceDelay: 300,
    searchMinChars: 2,
    maxSuggestions: 8
  },

  // Current filter state
  state: {
    filters: {},
    sort: 'rating',
    page: 1,
    searchQuery: '',
    isSearching: false
  },

  // Available filter options
  options: {
    tracking: [],
    payment: [],
    verticals: [],
    types: ['CPA', 'CPI', 'CPL', 'CPS', 'Advertising', 'Influencer', 'Hybrid']
  },

  // Initialization guard
  _initialized: false,

  /**
   * Initialize - DEFENSIVE ENTRY POINT
   */
  init() {
    // Prevent double initialization
    if (this._initialized) {
      console.log('[FilterEngine] Already initialized, skipping');
      return;
    }

    // CRITICAL: Check dependencies
    if (!window.PageTypeDetector) {
      console.error('[FilterEngine] PageTypeDetector not found! Aborting.');
      return;
    }

    // CRITICAL: Only initialize on pages that need filters
    const pageType = PageTypeDetector.detect();
    
    // FILTERS ONLY ALLOWED ON: HOME and LISTING pages
    if (pageType !== PageTypeDetector.TYPES.HOME && 
        pageType !== PageTypeDetector.TYPES.LISTING) {
      console.log(`[FilterEngine] Filters not needed on ${pageType} page - skipping`);
      return;
    }

    // Verify filter elements exist
    const hasFilterElements = document.querySelector('.filter-select') || 
                              document.getElementById('sortSelect') ||
                              document.getElementById('globalSearch');
    
    if (!hasFilterElements) {
      console.log('[FilterEngine] No filter elements found - skipping');
      return;
    }

    console.log('[FilterEngine] Initializing for page type:', pageType);

    try {
      this.parseURLParams();
      this.setupEventListeners();
      
      // Only populate filter options if we have filter dropdowns
      if (document.querySelector('.filter-select')) {
        this.populateFilterOptions();
      }
      
      this.renderActiveFilters();
      this.enhanceSearch();
      
      this._initialized = true;
      console.log('[FilterEngine] Initialization complete');
    } catch (error) {
      console.error('[FilterEngine] Initialization error:', error);
    }
  },

  // ================= URL STATE MANAGEMENT =================

  parseURLParams() {
    const params = new URLSearchParams(window.location.search);
    
    // Parse filters
    this.state.filters = {};
    if (params.get('tracking')) this.state.filters.tracking = params.get('tracking');
    if (params.get('payment')) this.state.filters.payment = params.get('payment');
    if (params.get('type')) this.state.filters.type = params.get('type');
    if (params.get('vertical')) this.state.filters.vertical = params.get('vertical');
    
    // Parse sort
    this.state.sort = params.get('sort') || 'rating';
    
    // Parse page
    this.state.page = parseInt(params.get('page')) || 1;
    
    // Parse search
    this.state.searchQuery = params.get('q') || '';
    
    // Apply to UI
    this.applyFiltersToUI();
  },

  updateURL() {
    const params = new URLSearchParams();
    
    // Add filters
    Object.entries(this.state.filters).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    
    // Add sort if not default
    if (this.state.sort !== 'rating') params.set('sort', this.state.sort);
    
    // Add page if not 1
    if (this.state.page > 1) params.set('page', this.state.page);
    
    // Add search
    if (this.state.searchQuery) params.set('q', this.state.searchQuery);
    
    // Update URL without reload
    const newURL = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
    window.history.replaceState({}, '', newURL);
    
    // Update page title for SEO
    this.updatePageTitle();
  },

  updatePageTitle() {
    let title = 'Networks Insights';
    
    if (this.state.searchQuery) {
      title = `"${this.state.searchQuery}" Search Results | ${title}`;
    } else if (Object.keys(this.state.filters).length > 0) {
      const filterText = Object.values(this.state.filters).join(', ');
      title = `${filterText} Networks | ${title}`;
    } else if (this.state.sort !== 'rating') {
      title = `Networks by ${this.state.sort.charAt(0).toUpperCase() + this.state.sort.slice(1)} | ${title}`;
    }
    
    document.title = title;
  },

  // ================= UI SETUP =================

  setupEventListeners() {
    // Filter dropdown changes
    document.addEventListener('change', (e) => {
      if (e.target.matches('.filter-select')) {
        const filterType = e.target.dataset.filter || e.target.id.replace('Filter', '').toLowerCase();
        const value = e.target.value;
        
        if (value) {
          this.addFilter(filterType, value);
        } else {
          this.removeFilter(filterType);
        }
      }
    });

    // Sort change
    document.addEventListener('change', (e) => {
      if (e.target.matches('#sortSelect')) {
        this.state.sort = e.target.value;
        this.state.page = 1;
        this.updateURL();
        this.applyFilters();
      }
    });

    // Remove filter button clicks
    document.addEventListener('click', (e) => {
      if (e.target.matches('.filter-remove') || e.target.closest('.filter-remove')) {
        const filterTag = e.target.closest('.filter-tag');
        if (filterTag) {
          const filterType = filterTag.dataset.filter;
          this.removeFilter(filterType);
        }
      }
    });

    // Clear all filters
    document.addEventListener('click', (e) => {
      if (e.target.matches('.clear-all-filters')) {
        this.clearAllFilters();
      }
    });

    // Pagination clicks (enhanced)
    document.addEventListener('click', (e) => {
      if (e.target.matches('.pagination-btn') || e.target.closest('.pagination-btn')) {
        const btn = e.target.closest('.pagination-btn');
        const page = parseInt(btn.dataset.page);
        if (page && !isNaN(page)) {
          this.state.page = page;
          this.updateURL();
          this.applyFilters();
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }
    });
  },

  applyFiltersToUI() {
    // Set dropdown values
    Object.entries(this.state.filters).forEach(([type, value]) => {
      const select = document.querySelector(`[data-filter="${type}"], #${type}Filter`);
      if (select) select.value = value;
    });
    
    // Set sort
    const sortSelect = document.getElementById('sortSelect');
    if (sortSelect) sortSelect.value = this.state.sort;
    
    // Set search
    const searchInput = document.getElementById('globalSearch');
    if (searchInput && this.state.searchQuery) {
      searchInput.value = this.state.searchQuery;
    }
  },

  // ================= FILTER LOGIC =================

  addFilter(type, value) {
    this.state.filters[type] = value;
    this.state.page = 1;
    this.updateURL();
    this.renderActiveFilters();
    this.applyFilters();
  },

  removeFilter(type) {
    delete this.state.filters[type];
    
    // Reset dropdown
    const select = document.querySelector(`[data-filter="${type}"], #${type}Filter`);
    if (select) select.value = '';
    
    this.state.page = 1;
    this.updateURL();
    this.renderActiveFilters();
    this.applyFilters();
  },

  clearAllFilters() {
    this.state.filters = {};
    this.state.searchQuery = '';
    this.state.page = 1;
    
    // Reset all dropdowns
    document.querySelectorAll('.filter-select').forEach(select => {
      select.value = '';
    });
    
    // Reset search
    const searchInput = document.getElementById('globalSearch');
    if (searchInput) searchInput.value = '';
    
    this.updateURL();
    this.renderActiveFilters();
    this.applyFilters();
  },

  renderActiveFilters() {
    const container = document.getElementById('activeFilters');
    if (!container) return;
    
    const filters = Object.entries(this.state.filters);
    const hasSearch = this.state.searchQuery;
    
    if (filters.length === 0 && !hasSearch) {
      container.innerHTML = '';
      return;
    }
    
    let html = '';
    
    // Search pill
    if (hasSearch) {
      html += `
        <span class="filter-tag" data-filter="search">
          🔍 "${this.state.searchQuery}"
          <button class="filter-remove">×</button>
        </span>
      `;
    }
    
    // Filter pills
    filters.forEach(([type, value]) => {
      const label = this.getFilterLabel(type, value);
      html += `
        <span class="filter-tag" data-filter="${type}">
          ${label}
          <button class="filter-remove">×</button>
        </span>
      `;
    });
    
    // Clear all button
    html += `<button class="clear-all-filters" style="background: none; border: none; color: var(--primary); cursor: pointer; font-size: 0.875rem; margin-left: 0.5rem;">Clear all</button>`;
    
    container.innerHTML = html;
  },

  getFilterLabel(type, value) {
    const labels = {
      tracking: `📊 ${value}`,
      payment: `💳 ${value}`,
      type: `🏷️ ${value}`,
      vertical: `🎯 ${value}`,
      sponsored: '⭐ Sponsored',
      featured: '💎 Featured'
    };
    return labels[type] || `${type}: ${value}`;
  },

  // ================= DATA FILTERING =================

  async applyFilters() {
    // Guard: Only apply if we have active filters/search
    const hasActiveFilters = Object.keys(this.state.filters).length > 0 || this.state.searchQuery;
    const isHomepage = window.location.pathname === '/' || window.location.pathname === '/index.html';
    
    // On homepage with no filters, let NetworksApp handle it
    if (isHomepage && !hasActiveFilters) {
      return; 
    }

    const container = document.getElementById('networks-grid');
    if (!container) return;
    
    // Show loading
    container.innerHTML = '<div class="loading-spinner"><div class="spinner"></div></div>';
    
    // Safety timeout
    const loadingTimeout = setTimeout(() => {
      if (container.innerHTML.includes('loading-spinner')) {
        container.innerHTML = `
          <div class="empty-state">
            <div class="empty-icon">⚠️</div>
            <h3>Loading timed out</h3>
            <p>Please try refreshing the page</p>
          </div>
        `;
      }
    }, 30000);
    
    // Hide Featured Section if we are filtering
    const featuredSection = document.getElementById('featured-carousel');
    if (featuredSection) {
      featuredSection.style.display = 'none';
    }
    
    let networks = [];
    let pagination = null;
    
    try {
      // Check if NetworksApp is available
      if (!window.NetworksApp) {
        throw new Error('NetworksApp not available');
      }

      // If search query, use search endpoint
      if (this.state.searchQuery) {
        const result = await NetworksApp.fetchAPI('searchNetworks', { 
          q: this.state.searchQuery,
          page: this.state.page,
          limit: NetworksApp.config.ITEMS_PER_PAGE
        });
        networks = result?.results || [];
        pagination = this.createPagination(result?.count || 0);
      } else {
        // Use getNetworks with filters
        const params = {
          page: this.state.page,
          limit: NetworksApp.config.ITEMS_PER_PAGE,
          sort: this.state.sort
        };
        
        // Add filter params
        Object.entries(this.state.filters).forEach(([key, value]) => {
          params[key] = value;
        });
        
        const result = await NetworksApp.fetchAPI('getNetworks', params);
        networks = result?.networks || [];
        pagination = result?.pagination;
      }
      
      // Client-side filtering for verticals (if API doesn't support)
      if (this.state.filters.vertical && networks.length > 0) {
        networks = networks.filter(n => 
          n.verticals && n.verticals.includes(this.state.filters.vertical)
        );
      }
      
      clearTimeout(loadingTimeout);
      
      // Render results
      container.innerHTML = NetworksApp.templates.networkGrid(networks);
      
      // Update pagination
      const paginationContainer = document.getElementById('pagination-container');
      if (paginationContainer && pagination) {
        paginationContainer.innerHTML = NetworksApp.templates.pagination(pagination);
      }
      
      // Update result count
      this.updateResultCount(networks.length, pagination?.total);
      
    } catch (error) {
      clearTimeout(loadingTimeout);
      console.error('[FilterEngine] Filter error:', error);
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">⚠️</div>
          <h3>Failed to load networks</h3>
          <p>Please try again later</p>
        </div>
      `;
    }
  },

  createPagination(totalItems) {
    const totalPages = Math.ceil(totalItems / NetworksApp.config.ITEMS_PER_PAGE);
    return {
      page: this.state.page,
      limit: NetworksApp.config.ITEMS_PER_PAGE,
      total: totalItems,
      totalPages: totalPages,
      hasNext: this.state.page < totalPages,
      hasPrev: this.state.page > 1
    };
  },

  updateResultCount(showing, total) {
    const header = document.querySelector('.page-header h1');
    if (header && total !== undefined) {
      const existingCount = header.querySelector('.result-count');
      if (existingCount) existingCount.remove();
      
      const countSpan = document.createElement('span');
      countSpan.className = 'result-count';
      countSpan.style.cssText = 'font-size: 1rem; color: var(--text-muted); font-weight: 400; margin-left: 0.5rem;';
      countSpan.textContent = `(${total} networks)`;
      header.appendChild(countSpan);
    }
  },

  // ================= SEARCH ENHANCEMENT =================

  enhanceSearch() {
    const searchInput = document.getElementById('globalSearch');
    if (!searchInput) return;
    
    // Create suggestions container
    const suggestionsContainer = document.createElement('div');
    suggestionsContainer.id = 'searchSuggestions';
    suggestionsContainer.className = 'search-suggestions';
    suggestionsContainer.style.cssText = `
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      background: var(--card-bg);
      border: 1px solid var(--border-color);
      border-radius: 0.5rem;
      box-shadow: var(--card-shadow-hover);
      margin-top: 0.5rem;
      max-height: 300px;
      overflow-y: auto;
      z-index: 1000;
      display: none;
    `;
    
    searchInput.parentNode.style.position = 'relative';
    searchInput.parentNode.appendChild(suggestionsContainer);
    
    // Debounced input handler
    let debounceTimer;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(debounceTimer);
      const query = e.target.value.trim();
      
      if (query.length >= this.config.searchMinChars) {
        debounceTimer = setTimeout(() => {
          this.fetchSearchSuggestions(query);
        }, this.config.debounceDelay);
      } else {
        suggestionsContainer.style.display = 'none';
      }
    });
    
    // Handle enter key
    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const query = searchInput.value.trim();
        if (query) {
          this.executeSearch(query);
          suggestionsContainer.style.display = 'none';
        }
      }
    });
    
    // Close suggestions on click outside
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.header-search')) {
        suggestionsContainer.style.display = 'none';
      }
    });
  },

  async fetchSearchSuggestions(query) {
    try {
      if (!window.NetworksApp) return;
      
      const result = await NetworksApp.fetchAPI('searchNetworks', { 
        q: query, 
        limit: this.config.maxSuggestions 
      });
      const networks = result?.results || [];
      
      this.renderSuggestions(networks, query);
    } catch (error) {
      console.error('[FilterEngine] Search suggestions error:', error);
    }
  },

  renderSuggestions(networks, query) {
    const container = document.getElementById('searchSuggestions');
    if (!container) return;
    
    if (networks.length === 0) {
      container.innerHTML = '<div style="padding: 1rem; color: var(--text-muted); text-align: center;">No results found</div>';
      container.style.display = 'block';
      return;
    }
    
    const html = networks.map(n => `
      <div class="search-suggestion-item" data-slug="${n.slug}" style="
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.75rem 1rem;
        cursor: pointer;
        transition: background 0.2s;
      " onmouseover="this.style.background='var(--bg-secondary)'" onmouseout="this.style.background='transparent'">
        <img src="${n.logo_url || 'https://via.placeholder.com/32'}" alt="${n.name}" style="width: 32px; height: 32px; border-radius: 6px; object-fit: cover;">
        <div style="flex: 1;">
          <div style="font-weight: 600; font-size: 0.875rem;">${n.name}</div>
          <div style="font-size: 0.75rem; color: var(--text-muted);">${n.type} • ⭐ ${n.ratings?.overall || '0.0'}</div>
        </div>
      </div>
    `).join('');
    
    // Add "View all results" option
    const viewAllHtml = `
      <div class="search-view-all" style="
        padding: 0.75rem 1rem;
        text-align: center;
        border-top: 1px solid var(--border-color);
        color: var(--primary);
        font-weight: 600;
        cursor: pointer;
        font-size: 0.875rem;
        " onmouseover="this.style.background='var(--bg-secondary)'" onmouseout="this.style.background='transparent'">
        View all results for "${query}"
      </div>
    `;
    
    container.innerHTML = html + viewAllHtml;
    container.style.display = 'block';
    
    // Add click handlers
    container.querySelectorAll('.search-suggestion-item').forEach(item => {
      item.addEventListener('click', () => {
        window.location.href = `/p/${item.dataset.slug}.html`;
      });
    });
    
    container.querySelector('.search-view-all')?.addEventListener('click', () => {
      this.executeSearch(query);
      container.style.display = 'none';
    });
  },

  executeSearch(query) {
    this.state.searchQuery = query;
    this.state.page = 1;
    this.updateURL();
    
    // If on search page, apply filters
    if (window.location.pathname.includes('/search') || window.location.pathname === '/') {
      this.renderActiveFilters();
      this.applyFilters();
    } else {
      // Navigate to homepage with search
      window.location.href = `/?q=${encodeURIComponent(query)}`;
    }
  },

  // ================= FILTER OPTIONS POPULATION =================

  async populateFilterOptions() {
    // Guard: Only populate if NetworksApp is available
    if (!window.NetworksApp) {
      console.log('[FilterEngine] NetworksApp not available - skipping filter population');
      return;
    }

    try {
      const result = await NetworksApp.fetchAPI('getNetworks', { limit: 100 });
      const networks = result?.networks || [];
      
      // Extract unique values
      const tracking = new Set();
      const payment = new Set();
      const verticals = new Set();
      
      networks.forEach(n => {
        if (n.tracking_software) tracking.add(n.tracking_software);
        if (n.payment_methods) n.payment_methods.forEach(p => payment.add(p));
        if (n.verticals) n.verticals.forEach(v => verticals.add(v));
      });
      
      this.options.tracking = Array.from(tracking).sort();
      this.options.payment = Array.from(payment).sort();
      this.options.verticals = Array.from(verticals).sort();
      
      // Update dropdown options
      this.updateFilterDropdowns();
      
    } catch (error) {
      console.error('[FilterEngine] Failed to populate filter options:', error);
    }
  },

  updateFilterDropdowns() {
    // Update tracking dropdown
    const trackingSelect = document.querySelector('[data-filter="tracking"], #trackingFilter');
    if (trackingSelect) {
      const currentValue = trackingSelect.value;
      trackingSelect.innerHTML = '<option value="">All Software</option>' + 
        this.options.tracking.map(t => `<option value="${t}">${t}</option>`).join('');
      trackingSelect.value = currentValue;
    }

    // Update payment dropdown
    const paymentSelect = document.querySelector('[data-filter="payment"], #paymentFilter');
    if (paymentSelect) {
      const currentValue = paymentSelect.value;
      paymentSelect.innerHTML = '<option value="">All Methods</option>' + 
        this.options.payment.map(p => `<option value="${p}">${p}</option>`).join('');
      paymentSelect.value = currentValue;
    }
  }
};

// ================= SAFE INITIALIZATION =================

// Only initialize when DOM is ready AND dependencies are available
function initializeFilterEngine() {
  if (typeof PageTypeDetector === 'undefined') {
    console.log('[FilterEngine] PageTypeDetector not loaded. Retrying in 200ms...');
    setTimeout(initializeFilterEngine, 200);
    return;
  }
  
  // Wait for NetworksApp to be ready (it loads after PageTypeDetector)
  if (typeof NetworksApp === 'undefined') {
    console.log('[FilterEngine] NetworksApp not loaded. Retrying in 200ms...');
    setTimeout(initializeFilterEngine, 200);
    return;
  }
  
  FilterEngine.init();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeFilterEngine);
} else {
  // Small delay to ensure NetworksApp is ready
  setTimeout(initializeFilterEngine, 150);
}
