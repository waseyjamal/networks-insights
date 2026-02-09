/**
 * NETWORKS INSIGHTS - FOOTER ENHANCEMENT MODULE
 * Safe, non-blocking footer enhancements
 * Version: 2.0 (Defensive Architecture)
 * 
 * RULES:
 * - Footer HTML is rendered by the theme (static)
 * - This module ONLY enhances (never required for display)
 * - All enhancements are cosmetic/non-critical
 * - Must never block page rendering
 */

const FooterEnhancer = {
  config: {
    // Copyright year update
    autoUpdateYear: true,
    yearSelector: '.footer-year',
    
    // Theme sync (optional)
    syncTheme: true,
    
    // Smooth scroll for footer anchor links
    smoothScroll: true
  },

  // Initialization guard
  _initialized: false,

  /**
   * Initialize - DEFENSIVE ENTRY POINT
   * Runs on ALL page types
   */
  init() {
    // Prevent double initialization
    if (this._initialized) {
      return;
    }

    console.log('[FooterEnhancer] Initializing...');

    try {
      // Update copyright year
      if (this.config.autoUpdateYear) {
        this.updateYear();
      }

      // Sync theme (dark/light mode indicator in footer if needed)
      if (this.config.syncTheme) {
        this.syncTheme();
      }

      // Add smooth scroll to footer links
      if (this.config.smoothScroll) {
        this.enableSmoothScroll();
      }

      this._initialized = true;
      console.log('[FooterEnhancer] Initialization complete');
    } catch (error) {
      // Footer errors are completely non-fatal
      console.log('[FooterEnhancer] Non-critical error:', error);
    }
  },

  /**
   * Update copyright year to current year
   */
  updateYear() {
    try {
      const yearElements = document.querySelectorAll(this.config.yearSelector);
      const currentYear = new Date().getFullYear();
      
      yearElements.forEach(el => {
        el.textContent = currentYear;
      });

      // Also update common footer year patterns
      const footerText = document.querySelector('.footer-bottom, .footer-copyright');
      if (footerText && footerText.textContent.includes('2025')) {
        footerText.textContent = footerText.textContent.replace('2025', currentYear);
      }
    } catch (error) {
      // Non-critical
    }
  },

  /**
   * Sync footer with current theme
   */
  syncTheme() {
    try {
      const footer = document.querySelector('.site-footer');
      if (!footer) return;

      // Listen for theme changes (if theme toggle exists)
      const themeToggle = document.querySelector('.theme-toggle, [data-theme-toggle]');
      if (themeToggle) {
        themeToggle.addEventListener('click', () => {
          // Footer will automatically adapt via CSS variables
          // This is just a hook for any additional footer theme logic
          this.onThemeChange();
        });
      }
    } catch (error) {
      // Non-critical
    }
  },

  onThemeChange() {
    // Hook for future footer theme-specific enhancements
    // Currently footer uses CSS variables that auto-update
  },

  /**
   * Enable smooth scroll for footer anchor links
   */
  enableSmoothScroll() {
    try {
      document.querySelectorAll('.site-footer a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', (e) => {
          const targetId = anchor.getAttribute('href');
          if (targetId === '#') return;
          
          const targetElement = document.querySelector(targetId);
          if (targetElement) {
            e.preventDefault();
            targetElement.scrollIntoView({
              behavior: 'smooth',
              block: 'start'
            });
          }
        });
      });
    } catch (error) {
      // Non-critical
    }
  },

  /**
   * Add external link indicators (optional enhancement)
   */
  markExternalLinks() {
    try {
      document.querySelectorAll('.site-footer a').forEach(link => {
        const href = link.getAttribute('href') || '';
        
        // Mark external links
        if (href.startsWith('http') && !href.includes('networksinsights.com')) {
          link.setAttribute('rel', 'noopener noreferrer');
          link.setAttribute('target', '_blank');
          
          // Add external link icon if not present
          if (!link.querySelector('.external-icon')) {
            const icon = document.createElement('span');
            icon.className = 'external-icon';
            icon.textContent = ' ↗';
            icon.style.fontSize = '0.75em';
            link.appendChild(icon);
          }
        }
      });
    } catch (error) {
      // Non-critical
    }
  }
};

// ================= SAFE INITIALIZATION =================

// Footer enhancer runs on ALL pages
function initializeFooterEnhancer() {
  FooterEnhancer.init();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeFooterEnhancer);
} else {
  initializeFooterEnhancer();
}
