/**
 * NETWORKS INSIGHTS - AD MANAGEMENT MODULE
 * Agent 5: Ad rotation, targeting, fallback
 * Version: 2.0 (Defensive Architecture)
 * Dependencies: PageTypeDetector (MUST LOAD FIRST)
 */

const AdManager = {
  config: {
    // AdSense Settings (replace with your IDs when approved)
    adsense: {
      clientId: 'ca-pub-0000000000000000', // ⚠️ Replace when AdSense approved
      slots: {
        topBanner: '0000000000',
        sidebar: '0000000000',
        inline: '0000000000'
      }
    },
    
    // Fallback Affiliate Banners (shown until AdSense approved or as backup)
    fallback: {
      enabled: true,
      rotation: true,
      
      // Top banner offers (728x90)
      topBanner: [
        {
          name: 'MaxBounty',
          image: 'https://cdn.jsdelivr.net/gh/waseyjamal/networks-insights@main/ads/maxbounty-728x90.jpg',
          link: 'https://www.maxbounty.com/index.cfm?referer=networksinsights',
          weight: 40
        },
        {
          name: 'CJ Affiliate',
          image: 'https://cdn.jsdelivr.net/gh/waseyjamal/networks-insights@main/ads/cj-728x90.jpg',
          link: 'https://signup.cj.com/member/signup/publisher/?cid=networksinsights',
          weight: 30
        },
        {
          name: 'MyLead',
          image: 'https://cdn.jsdelivr.net/gh/waseyjamal/networks-insights@main/ads/mylead-728x90.jpg',
          link: 'https://mylead.global/ref/networksinsights',
          weight: 30
        }
      ],
      
      // Sidebar offers (300x250)
      sidebar: [
        {
          name: 'PropellerAds',
          image: 'https://cdn.jsdelivr.net/gh/waseyjamal/networks-insights@main/ads/propeller-300x250.jpg',
          link: 'https://propellerads.com/?ref=networksinsights',
          weight: 50
        },
        {
          name: 'AdPlexity',
          image: 'https://cdn.jsdelivr.net/gh/waseyjamal/networks-insights@main/ads/adplexity-300x250.jpg',
          link: 'https://adplexity.com/?ref=networksinsights',
          weight: 50
        }
      ]
    },
    
    targeting: {
      pageTargeting: {
        'dating-networks': ['dating', 'adult'],
        'gambling-networks': ['gambling', 'casino'],
        'crypto-networks': ['crypto', 'bitcoin'],
        'finance-networks': ['finance', 'loans']
      }
    }
  },

  // Initialization guard
  _initialized: false,

  /**
   * Initialize - DEFENSIVE ENTRY POINT
   */
  init() {
    // Prevent double initialization
    if (this._initialized) {
      console.log('[AdManager] Already initialized, skipping');
      return;
    }

    // CRITICAL: Check dependencies
    if (!window.PageTypeDetector) {
      console.error('[AdManager] PageTypeDetector not found! Aborting.');
      return;
    }

    // CRITICAL: Ads NOT allowed on static pages
    if (!PageTypeDetector.isFeatureAllowed('ads')) {
      console.log('[AdManager] Ads not allowed on this page type - skipping');
      return;
    }

    console.log('[AdManager] Initializing...');

    try {
      this.detectAdType();
      this.renderAds();
      this._initialized = true;
      console.log('[AdManager] Initialization complete');
    } catch (error) {
      console.error('[AdManager] Initialization error:', error);
    }
  },

  detectAdType() {
    this.useAdSense = typeof adsbygoogle !== 'undefined' && 
                      this.config.adsense.clientId !== 'ca-pub-0000000000000000';
    
    console.log('[AdManager] Ad Type:', this.useAdSense ? 'AdSense' : 'Fallback Affiliate');
  },

  renderAds() {
    // Top Banner - with element check
    const topBanner = document.getElementById('adTopBanner');
    if (topBanner) {
      if (this.useAdSense) {
        this.renderAdSense(topBanner, 'topBanner', '728x90');
      } else {
        this.renderFallback(topBanner, 'topBanner');
      }
    } else {
      console.log('[AdManager] adTopBanner element not found - skipping');
    }

    // Sidebar - with element check
    const sidebar = document.getElementById('adSidebar');
    if (sidebar) {
      if (this.useAdSense) {
        this.renderAdSense(sidebar, 'sidebar', '300x250');
      } else {
        this.renderFallback(sidebar, 'sidebar');
      }
    } else {
      console.log('[AdManager] adSidebar element not found - skipping');
    }

    // Inline ads - with element check
    const inlineAds = document.querySelectorAll('.ad-inline');
    if (inlineAds.length > 0) {
      inlineAds.forEach((container, index) => {
        if (this.useAdSense) {
          this.renderAdSense(container, 'inline', '468x60');
        } else {
          // Rotate fallback for inline
          this.renderFallback(container, 'sidebar'); // Use sidebar size for inline
        }
      });
    }
  },

  renderAdSense(container, slotKey, size) {
    // Guard: Check if container exists and is empty
    if (!container) return;
    if (container.innerHTML.trim() !== '') {
      console.log(`[AdManager] Container ${slotKey} not empty - skipping AdSense render`);
      return;
    }

    const [width, height] = size.split('x');
    
    try {
      container.innerHTML = `
        <ins class="adsbygoogle"
             style="display:inline-block;width:${width}px;height:${height}px"
             data-ad-client="${this.config.adsense.clientId}"
             data-ad-slot="${this.config.adsense.slots[slotKey]}"></ins>
      `;
      
      // Push to adsbygoogle if available
      if (window.adsbygoogle) {
        (adsbygoogle = window.adsbygoogle || []).push({});
      }
    } catch (error) {
      console.error('[AdManager] AdSense render error:', error);
      // Fallback to affiliate ad on error
      this.renderFallback(container, slotKey);
    }
  },

  renderFallback(container, position) {
    // Guard: Check if container exists
    if (!container) return;

    const offers = this.config.fallback[position];
    if (!offers || offers.length === 0) {
      container.innerHTML = '<!-- No ads configured -->';
      return;
    }

    try {
      const offer = this.selectByWeight(offers);
      this.trackAdImpression(offer.name, position);

      container.innerHTML = `
        <a href="${offer.link}" 
           target="_blank" 
           rel="noopener sponsored"
           class="ad-link-${position}"
           data-ad-name="${offer.name}"
           data-ad-position="${position}">
          <img src="${offer.image}" 
               alt="${offer.name} - Recommended Affiliate Network"
               style="max-width:100%; height:auto; border-radius:8px; display:block;"
               loading="lazy"
               onerror="this.src='https://via.placeholder.com/${position === 'topBanner' ? '728x90' : '300x250'}?text=${offer.name}'">
        </a>
      `;

      // Add click tracking
      const link = container.querySelector('a');
      if (link) {
        link.addEventListener('click', () => {
          this.trackAdClick(offer.name, position);
        });
      }
    } catch (error) {
      console.error('[AdManager] Fallback render error:', error);
      container.innerHTML = '<!-- Ad render error -->';
    }
  },

  selectByWeight(offers) {
    const totalWeight = offers.reduce((sum, o) => sum + o.weight, 0);
    let random = Math.random() * totalWeight;
    
    for (const offer of offers) {
      random -= offer.weight;
      if (random <= 0) return offer;
    }
    
    return offers[0];
  },

  trackAdImpression(adName, position) {
    if (window.gtag) {
      gtag('event', 'ad_impression', {
        ad_name: adName,
        ad_position: position,
        ad_type: 'fallback'
      });
    }
  },

  trackAdClick(adName, position) {
    if (window.gtag) {
      gtag('event', 'ad_click', {
        ad_name: adName,
        ad_position: position,
        ad_type: 'fallback'
      });
    }
  }
};

// ================= SAFE INITIALIZATION =================

// Only initialize when DOM is ready AND PageTypeDetector is available
function initializeAdManager() {
  if (typeof PageTypeDetector === 'undefined') {
    console.log('[AdManager] PageTypeDetector not loaded. Retrying in 100ms...');
    setTimeout(initializeAdManager, 100);
    return;
  }
  AdManager.init();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeAdManager);
} else {
  initializeAdManager();
}
