/**
 * NETWORKS INSIGHTS - PAGE TYPE DETECTOR
 * Central Authority for Page Classification
 * Version: 2.1 (Phase 1 hardened)
 *
 * THIS MODULE MUST LOAD FIRST
 */

const PageTypeDetector = {
  TYPES: {
    HOME: 'HOME',
    LISTING: 'LISTING',
    DETAIL: 'DETAIL',
    STATIC: 'STATIC',
    UNKNOWN: 'UNKNOWN'
  },

  // ✅ Explicit static page slugs (AUTHORITATIVE)
  STATIC_SLUGS: [
    'about',
    'contact',
    'resources',
    'privacy-policy',
    'terms',
    'terms-of-service',
    'disclaimer',
    'advertise',
    'add-network'
  ],

  // Cache
  _cachedType: null,
  _cachedConfig: null,

  detect() {
    if (this._cachedType) return this._cachedType;

    const path = window.location.pathname;
    const params = new URLSearchParams(window.location.search);
    const slug = path.match(/\/p\/([^.]+)\.html$/)?.[1] || null;

    const hasDynamicContent = !!document.getElementById('dynamic-content');
    const hasNetworksGrid = !!document.getElementById('networks-grid');

    /* =========================
       1️⃣ STATIC (URL FIRST)
       ========================= */
    if (slug && this.STATIC_SLUGS.includes(slug)) {
      this._cachedType = this.TYPES.STATIC;
      console.log('[PageTypeDetector] STATIC (explicit slug)');
      return this._cachedType;
    }

    /* =========================
       2️⃣ HOME
       ========================= */
    if (path === '/' || path === '/index.html') {
      this._cachedType = this.TYPES.HOME;
      console.log('[PageTypeDetector] HOME');
      return this._cachedType;
    }

    /* =========================
       3️⃣ DETAIL (EXPLICIT ONLY)
       ========================= */
    if (params.get('network')) {
      this._cachedType = this.TYPES.DETAIL;
      console.log('[PageTypeDetector] DETAIL (network param)');
      return this._cachedType;
    }

    /* =========================
       4️⃣ LISTING (KNOWN)
       ========================= */
    const listingSlugs = [
      'affiliate-networks',
      'dating-networks',
      'gambling-networks',
      'finance-networks',
      'crypto-networks',
      'health-networks',
      'advertising-networks',
      'reviews'
    ];

    if (slug && listingSlugs.includes(slug)) {
      this._cachedType = this.TYPES.LISTING;
      console.log('[PageTypeDetector] LISTING (known slug)');
      return this._cachedType;
    }

    /* =========================
       5️⃣ SAFE FALLBACKS
       ========================= */
    if (hasDynamicContent || hasNetworksGrid) {
      this._cachedType = this.TYPES.LISTING;
      console.log('[PageTypeDetector] LISTING (DOM fallback)');
      return this._cachedType;
    }

    this._cachedType = this.TYPES.UNKNOWN;
    console.log('[PageTypeDetector] UNKNOWN');
    return this._cachedType;
  },

  getConfig() {
    if (this._cachedConfig) return this._cachedConfig;

    const type = this.detect();
    const path = window.location.pathname;
    const params = new URLSearchParams(window.location.search);

    this._cachedConfig = {
      type,
      path,
      params,
      slug: path.match(/\/p\/([^.]+)\.html$/)?.[1] || null,
      networkSlug: params.get('network'),

      features: {
        dynamicContent: type !== this.TYPES.STATIC,
        sidebarWidgets: type !== this.TYPES.STATIC,
        filters: type === this.TYPES.HOME || type === this.TYPES.LISTING,
        ads: type !== this.TYPES.STATIC,
        apiCalls: type !== this.TYPES.STATIC,
        search: type !== this.TYPES.STATIC,
        seo: true,
        footer: true
      }
    };

    return this._cachedConfig;
  },

  is(type) {
    return this.detect() === type;
  },

  isFeatureAllowed(feature) {
    return this.getConfig().features[feature] === true;
  },

  reset() {
    this._cachedType = null;
    this._cachedConfig = null;
  }
};

// Auto-run
PageTypeDetector.detect();
