/**
 * NETWORKS INSIGHTS - SEO & ANALYTICS MODULE
 * Agent 5: Complete SEO, Schema, Tracking
 * Version: 1.0
 */

const SEOModule = {
  config: {
    siteName: 'Networks Insights',
    siteUrl: 'https://www.networksinsights.com',
    logoUrl: 'logoUrl: 'https://cdn.jsdelivr.net/gh/waseyjamal/networks-insights@main/logo.png',',
    twitterHandle: '@networksinsights',
    fbAppId: '', // Add if you have Facebook App
    gaMeasurementId: 'G-09Y5SL0JR6' // Replace with your GA4 ID
  },

  // Initialize SEO module
  init() {
    this.detectPageAndUpdateSEO();
    this.initAnalytics();
    this.trackEvents();
  },

  // ================= PAGE DETECTION & SEO =================

  detectPageAndUpdateSEO() {
    const path = window.location.pathname;
    const params = new URLSearchParams(window.location.search);
    const slug = path.match(/\/p\/([^.]+)\.html/)?.[1];

    // Homepage
    if (path === '/' || path === '/index.html') {
      if (params.get('q')) {
        this.setSearchSEO(params.get('q'));
      } else if (params.get('tracking') || params.get('payment') || params.get('vertical')) {
        this.setFilteredSEO(params);
      } else {
        this.setHomepageSEO();
      }
      return;
    }

    // Network Detail Page
    if (slug && !['affiliate-networks', 'dating-networks', 'gambling-networks', 'finance-networks', 'crypto-networks', 'health-networks', 'reviews', 'resources', 'blog', 'about', 'contact', 'advertise', 'add-network', 'privacy-policy', 'terms', 'disclaimer'].includes(slug)) {
      this.loadNetworkSEO(slug);
      return;
    }

    // Category Pages
    if (path.includes('/p/affiliate-networks.html')) {
      this.setCategorySEO('Affiliate Networks', 'Find the best CPA, CPL, and CPS affiliate networks with real reviews and ratings.');
    } else if (path.includes('/p/dating-networks.html')) {
      this.setCategorySEO('Dating Affiliate Networks', 'Top dating affiliate networks with high-converting offers. Compare payouts, reviews, and ratings.');
    } else if (path.includes('/p/gambling-networks.html')) {
      this.setCategorySEO('Gambling Affiliate Networks', 'Best casino, sports betting, and iGaming affiliate networks. Real reviews from affiliates.');
    } else if (path.includes('/p/finance-networks.html')) {
      this.setCategorySEO('Finance Affiliate Networks', 'Finance, loan, and credit card affiliate networks. Compare commission rates and reviews.');
    } else if (path.includes('/p/crypto-networks.html')) {
      this.setCategorySEO('Crypto Affiliate Networks', 'Cryptocurrency and bitcoin affiliate networks. Find the best crypto offers and exchanges.');
    } else if (path.includes('/p/health-networks.html')) {
      this.setCategorySEO('Health & Beauty Networks', 'Health, wellness, and beauty affiliate networks. Nutra and supplement offers.');
    }

    // Static Pages
    else if (path.includes('/p/reviews.html')) {
      this.setStaticPageSEO('Recent Reviews', 'Read the latest reviews from affiliate marketers. Real feedback on networks, payments, and support.');
    } else if (path.includes('/p/resources.html')) {
      this.setStaticPageSEO('Affiliate Marketing Resources', 'Essential tools, traffic sources, and spy tools for affiliate marketers.');
    } else if (path.includes('/p/about.html')) {
      this.setStaticPageSEO('About Us', 'Learn about Networks Insights - the most comprehensive affiliate network directory.');
    } else if (path.includes('/p/contact.html')) {
      this.setStaticPageSEO('Contact Us', 'Get in touch with Networks Insights. Advertise, add your network, or report an issue.');
    } else if (path.includes('/p/advertise.html')) {
      this.setStaticPageSEO('Advertise With Us', 'Promote your affiliate network to thousands of marketers. Featured listings, banners, and sponsored reviews.');
    } else if (path.includes('/p/add-network.html')) {
      this.setStaticPageSEO('Add Your Network', 'Submit your affiliate network to our directory. Get discovered by thousands of affiliates.');
    } else if (path.includes('/p/privacy-policy.html')) {
      this.setStaticPageSEO('Privacy Policy', 'Networks Insights privacy policy. How we handle your data and protect your information.');
    } else if (path.includes('/p/terms.html')) {
      this.setStaticPageSEO('Terms of Service', 'Terms and conditions for using Networks Insights affiliate network directory.');
    }
  },

  // ================= SEO SETTERS =================

  setHomepageSEO() {
    const title = 'Networks Insights | Affiliate Network Directory & Reviews 2026';
    const description = 'Discover 1000+ affiliate networks with real reviews. Compare CPA networks by vertical, payment terms, and ratings. Find the best affiliate programs.';
    
    this.updateMetaTags({
      title,
      description,
      url: this.config.siteUrl,
      type: 'website'
    });

    this.injectSchema({
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: this.config.siteName,
      url: this.config.siteUrl,
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: `${this.config.siteUrl}/?q={search_term_string}`
        },
        'query-input': 'required name=search_term_string'
      }
    });

    this.injectSchema({
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: this.config.siteName,
      url: this.config.siteUrl,
      logo: this.config.logoUrl,
      sameAs: [
        'https://twitter.com/networksinsights',
        'https://linkedin.com/company/networksinsights'
      ]
    });
  },

  setSearchSEO(query) {
    const title = `"${query}" Search Results | ${this.config.siteName}`;
    const description = `Find affiliate networks matching "${query}". Compare ratings, reviews, and payment terms.`;
    
    this.updateMetaTags({
      title,
      description,
      url: window.location.href,
      type: 'website',
      noindex: true // Search results shouldn't be indexed
    });

    this.injectSchema({
      '@context': 'https://schema.org',
      '@type': 'SearchResultsPage',
      name: `Search: ${query}`,
      url: window.location.href
    });
  },

  setFilteredSEO(params) {
    const filters = [];
    if (params.get('tracking')) filters.push(params.get('tracking'));
    if (params.get('payment')) filters.push(params.get('payment'));
    if (params.get('vertical')) filters.push(params.get('vertical'));
    
    const filterText = filters.join(', ');
    const title = `${filterText} Networks | ${this.config.siteName}`;
    const description = `Find the best ${filterText} affiliate networks. Compare ${filters[0]} networks by ratings, reviews, and payment terms.`;
    
    this.updateMetaTags({
      title,
      description,
      url: window.location.href,
      type: 'website'
    });

    this.injectSchema({
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: `${filterText} Networks`,
      description: description,
      url: window.location.href
    });
  },

  setCategorySEO(categoryName, description) {
    const title = `Top ${categoryName} 2026 | Compare & Review | ${this.config.siteName}`;
    
    this.updateMetaTags({
      title,
      description,
      url: window.location.href,
      type: 'website'
    });

    this.injectSchema({
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: categoryName,
      description: description,
      url: window.location.href,
      breadcrumb: {
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: this.config.siteUrl
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: categoryName,
            item: window.location.href
          }
        ]
      }
    });
  },

  setStaticPageSEO(pageName, description) {
    const title = `${pageName} | ${this.config.siteName}`;
    
    this.updateMetaTags({
      title,
      description,
      url: window.location.href,
      type: 'article'
    });

    this.injectSchema({
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: pageName,
      description: description,
      url: window.location.href
    });
  },

  async loadNetworkSEO(slug) {
    // Fetch network data for rich SEO
    try {
      const data = await NetworksApp.fetchAPI('getNetwork', { slug });
      if (!data || !data.network) {
        this.setStaticPageSEO('Network Not Found', 'The requested network could not be found.');
        return;
      }

      const network = data.network;
      const title = `${network.name} Reviews | ${network.ratings?.overall || '0.0'} Stars | ${this.config.siteName}`;
      const description = `${network.short_desc || network.description?.substring(0, 160)} Read ${network.review_count} real reviews, view payment proofs, and compare ratings.`;
      
      this.updateMetaTags({
        title,
        description,
        url: `${this.config.siteUrl}/p/${slug}.html`,
        type: 'article',
        image: network.logo_url
      });

      // Network Schema
      this.injectSchema({
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: network.name,
        description: network.description,
        url: `${this.config.siteUrl}/p/${slug}.html`,
        logo: network.logo_url,
        aggregateRating: network.ratings ? {
          '@type': 'AggregateRating',
          ratingValue: network.ratings.overall,
          reviewCount: network.review_count,
          bestRating: 5,
          worstRating: 1
        } : undefined,
        sameAs: [
          network.social_links?.facebook,
          network.social_links?.twitter,
          network.social_links?.linkedin
        ].filter(Boolean)
      });

      // Review Schema (if reviews exist)
      if (data.reviews && data.reviews.length > 0) {
        const reviewSchema = data.reviews.slice(0, 10).map(review => ({
          '@type': 'Review',
          author: {
            '@type': 'Person',
            name: review.reviewer_name || 'Anonymous'
          },
          datePublished: review.date_posted,
          reviewRating: {
            '@type': 'Rating',
            ratingValue: review.ratings?.overall
          },
          reviewBody: review.comment
        }));

        this.injectSchema({
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          itemListElement: reviewSchema
        });
      }

      // Breadcrumb Schema
      this.injectSchema({
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: this.config.siteUrl
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'Networks',
            item: `${this.config.siteUrl}/p/affiliate-networks.html`
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: network.name,
            item: `${this.config.siteUrl}/p/${slug}.html`
          }
        ]
      });

    } catch (error) {
      console.error('SEO load error:', error);
      this.setStaticPageSEO('Network Details', 'View affiliate network details, reviews, and ratings.');
    }
  },

  // ================= META TAG UPDATES =================

  updateMetaTags({ title, description, url, type = 'website', image, noindex = false }) {
    // Title
    document.title = title;

    // Standard Meta
    this.setMeta('description', description);
    this.setMeta('robots', noindex ? 'noindex, follow' : 'index, follow');

    // Canonical
    this.setLink('canonical', url);

    // Open Graph
    this.setMetaProperty('og:title', title);
    this.setMetaProperty('og:description', description);
    this.setMetaProperty('og:url', url);
    this.setMetaProperty('og:type', type);
    this.setMetaProperty('og:site_name', this.config.siteName);
    if (image) this.setMetaProperty('og:image', image);

    // Twitter Cards
    this.setMetaName('twitter:card', 'summary_large_image');
    this.setMetaName('twitter:title', title);
    this.setMetaName('twitter:description', description);
    this.setMetaName('twitter:site', this.config.twitterHandle);
    if (image) this.setMetaName('twitter:image', image);
  },

  setMeta(name, content) {
    let meta = document.querySelector(`meta[name="${name}"]`);
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = name;
      document.head.appendChild(meta);
    }
    meta.content = content;
  },

  setMetaProperty(property, content) {
    let meta = document.querySelector(`meta[property="${property}"]`);
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('property', property);
      document.head.appendChild(meta);
    }
    meta.content = content;
  },

  setMetaName(name, content) {
    let meta = document.querySelector(`meta[name="${name}"]`);
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = name;
      document.head.appendChild(meta);
    }
    meta.content = content;
  },

  setLink(rel, href) {
    let link = document.querySelector(`link[rel="${rel}"]`);
    if (!link) {
      link = document.createElement('link');
      link.rel = rel;
      document.head.appendChild(link);
    }
    link.href = href;
  },

  // ================= SCHEMA.ORG INJECTION =================

  injectSchema(schemaData) {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(schemaData);
    document.head.appendChild(script);
  },

  // ================= ANALYTICS =================

  initAnalytics() {
    // Google Analytics 4
    if (this.config.gaMeasurementId && this.config.gaMeasurementId !== 'G-YOUR_MEASUREMENT_ID') {
      const gaScript = document.createElement('script');
      gaScript.async = true;
      gaScript.src = `https://www.googletagmanager.com/gtag/js?id=${this.config.gaMeasurementId}`;
      document.head.appendChild(gaScript);

      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', this.config.gaMeasurementId, {
        send_page_view: true,
        custom_map: {
          'dimension1': 'network_name',
          'dimension2': 'filter_type'
        }
      });
      window.gtag = gtag;
    }
  },

  trackEvents() {
    // Outbound link tracking (affiliate clicks)
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a');
      if (!link || !link.href) return;

      // Affiliate link click
      if (link.classList.contains('btn-join') || link.href.includes('ref=') || link.href.includes('utm_')) {
        this.trackEvent('affiliate_click', {
          network_name: link.closest('.network-card')?.dataset?.slug || 'unknown',
          destination: link.href
        });
      }

      // External link click
      if (!link.href.includes('networksinsights.com') && !link.href.startsWith('/')) {
        this.trackEvent('outbound_click', {
          destination: link.href
        });
      }
    });

    // Filter usage tracking
    document.addEventListener('change', (e) => {
      if (e.target.matches('.filter-select')) {
        this.trackEvent('filter_used', {
          filter_type: e.target.dataset.filter || e.target.id,
          filter_value: e.target.value
        });
      }
    });

    // Search tracking
    document.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && e.target.id === 'globalSearch') {
        this.trackEvent('search', {
          search_term: e.target.value
        });
      }
    });

    // Review submission tracking
    document.addEventListener('submit', (e) => {
      if (e.target.id === 'reviewForm') {
        this.trackEvent('review_submit_attempt', {
          network_slug: e.target.querySelector('[name="network_slug"]')?.value
        });
      }
    });
  },

  trackEvent(eventName, params = {}) {
    if (window.gtag) {
      gtag('event', eventName, params);
    }
    console.log('Track:', eventName, params);
  }
};

// Initialize
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => SEOModule.init());
} else {
  SEOModule.init();
}
