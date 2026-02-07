/**
 * NETWORKS INSIGHTS - AD MANAGEMENT MODULE
 * Agent 5: Ad rotation, targeting, fallback
 * Version: 1.0
 */

const AdManager = {
  config: {
    // AdSense Settings (replace with your IDs when approved)
    adsense: {
      clientId: 'ca-pub-YOUR_PUBLISHER_ID',
      slots: {
        topBanner: 'YOUR_TOP_BANNER_SLOT',
        sidebar: 'YOUR_SIDEBAR_SLOT',
        inline: 'YOUR_INLINE_SLOT'
      }
    },
    
    // Fallback Affiliate Banners (shown until AdSense approved or as backup)
    fallback: {
      enabled: true,
      rotation: true, // Rotate multiple offers
      
      // Top banner offers (728x90)
      topBanner: [
        {
          name: 'MaxBounty',
          image: 'https://cdn.jsdelivr.net/gh/waseyjamal/networks-insights@main/ads/maxbounty-728x90.jpg',
          link: 'https://www.maxbounty.com/index.cfm?referer=networksinsights',
          weight: 40 // 40% chance
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
    
    // Targeting rules
    targeting: {
      // Show specific ads on specific pages
      pageTargeting: {
        'dating-networks': ['dating', 'adult'],
        'gambling-networks': ['gambling', 'casino'],
        'crypto-networks': ['crypto', 'bitcoin'],
        'finance-networks': ['finance', 'loans']
      }
    }
  },

  init() {
    this.detectAdType();
    this.renderAds();
  },

  detectAdType() {
    // Check if AdSense is approved and loading
    this.useAdSense = typeof adsbygoogle !== 'undefined' && 
                      this.config.adsense.clientId !== 'ca-pub-YOUR_PUBLISHER_ID';
    
    console.log('Ad Type:', this.useAdSense ? 'AdSense' : 'Fallback Affiliate');
  },

  renderAds() {
    // Top Banner
    const topBanner = document.getElementById('adTopBanner');
    if (topBanner) {
      if (this.useAdSense) {
        this.renderAdSense(topBanner, 'topBanner', '728x90');
      } else {
        this.renderFallback(topBanner, 'topBanner');
      }
    }

    // Sidebar
    const sidebar = document.getElementById('adSidebar');
    if (sidebar) {
      if (this.useAdSense) {
        this.renderAdSense(sidebar, 'sidebar', '300x250');
      } else {
        this.renderFallback(sidebar, 'sidebar');
      }
    }
  },

  renderAdSense(container, slotKey, size) {
    const [width, height] = size.split('x');
    container.innerHTML = `
      <ins class="adsbygoogle"
           style="display:inline-block;width:${width}px;height:${height}px"
           data-ad-client="${this.config.adsense.clientId}"
           data-ad-slot="${this.config.adsense.slots[slotKey]}"></ins>
    `;
    (adsbygoogle = window.adsbygoogle || []).push({});
  },

  renderFallback(container, position) {
    const offers = this.config.fallback[position];
    if (!offers || offers.length === 0) {
      container.innerHTML = '<!-- No ads configured -->';
      return;
    }

    // Select offer based on weight
    const offer = this.selectByWeight(offers);
    
    // Track impression
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
    container.querySelector('a').addEventListener('click', () => {
      this.trackAdClick(offer.name, position);
    });
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

// Initialize when DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => AdManager.init());
} else {
  AdManager.init();
}
