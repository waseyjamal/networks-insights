/**
 * NETWORKS INSIGHTS - DATA PROVIDER
 * Thin abstraction layer between UI modules and data source
 * Phase 2 Architecture Hardening
 */

const DataProvider = {
  /**
   * Fetch data (GET)
   */
  async fetch(action, params = {}) {
    if (!window.NetworksApp || typeof NetworksApp.fetchAPI !== 'function') {
      console.error('[DataProvider] NetworksApp not available');
      return null;
    }

    return await NetworksApp.fetchAPI(action, params);
  },

  /**
   * Submit data (POST)
   */
  async post(action, data = {}) {
    if (!window.NetworksApp || typeof NetworksApp.postAPI !== 'function') {
      console.error('[DataProvider] NetworksApp not available');
      return { success: false };
    }

    return await NetworksApp.postAPI(action, data);
  }
};

// Global availability
window.DataProvider = DataProvider;
