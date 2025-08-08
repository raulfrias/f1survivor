// LoadingStates.js - Consistent loading feedback components
// Provides skeleton screens and loading indicators across the application

export class LoadingStates {
  
  // Dashboard skeleton loader
  static createDashboardSkeleton() {
    return `
      <div class="dashboard-skeleton" aria-label="Loading dashboard">
        <div class="skeleton-header">
          <div class="skeleton-text skeleton-title"></div>
          <div class="skeleton-text skeleton-subtitle"></div>
        </div>
        
        <div class="skeleton-cards-grid">
          <div class="skeleton-card">
            <div class="skeleton-text skeleton-card-title"></div>
            <div class="skeleton-text skeleton-card-value"></div>
            <div class="skeleton-text skeleton-card-detail"></div>
          </div>
          <div class="skeleton-card">
            <div class="skeleton-text skeleton-card-title"></div>
            <div class="skeleton-text skeleton-card-value"></div>
            <div class="skeleton-text skeleton-card-detail"></div>
          </div>
          <div class="skeleton-card">
            <div class="skeleton-text skeleton-card-title"></div>
            <div class="skeleton-text skeleton-card-value"></div>
            <div class="skeleton-text skeleton-card-detail"></div>
          </div>
          <div class="skeleton-card">
            <div class="skeleton-text skeleton-card-title"></div>
            <div class="skeleton-text skeleton-card-value"></div>
            <div class="skeleton-text skeleton-card-detail"></div>
          </div>
        </div>
        
        <div class="skeleton-league-standings">
          <div class="skeleton-text skeleton-section-title"></div>
          <div class="skeleton-player-list">
            ${Array.from({ length: 6 }, () => `
              <div class="skeleton-player">
                <div class="skeleton-avatar"></div>
                <div class="skeleton-player-info">
                  <div class="skeleton-text skeleton-player-name"></div>
                  <div class="skeleton-text skeleton-player-stats"></div>
                </div>
                <div class="skeleton-text skeleton-player-status"></div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  }
  
  // Driver grid skeleton loader  
  static createDriverGridSkeleton() {
    return `
      <div class="driver-grid-skeleton" aria-label="Loading driver selection">
        <div class="skeleton-header">
          <div class="skeleton-text skeleton-race-title"></div>
          <div class="skeleton-text skeleton-deadline"></div>
        </div>
        
        <div class="skeleton-driver-grid">
          ${Array.from({ length: 20 }, () => `
            <div class="skeleton-driver-card">
              <div class="skeleton-driver-image"></div>
              <div class="skeleton-text skeleton-driver-name"></div>
              <div class="skeleton-text skeleton-team-name"></div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }
  
  // League list skeleton loader
  static createLeagueListSkeleton() {
    return `
      <div class="league-list-skeleton" aria-label="Loading leagues">
        ${Array.from({ length: 3 }, () => `
          <div class="skeleton-league-card">
            <div class="skeleton-league-header">
              <div class="skeleton-text skeleton-league-name"></div>
              <div class="skeleton-text skeleton-member-count"></div>
            </div>
            <div class="skeleton-league-stats">
              <div class="skeleton-text skeleton-stat"></div>
              <div class="skeleton-text skeleton-stat"></div>
              <div class="skeleton-text skeleton-stat"></div>
            </div>
            <div class="skeleton-league-actions">
              <div class="skeleton-button"></div>
              <div class="skeleton-button"></div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }
  
  // Spinner component for smaller loading states
  static createSpinner(size = 'medium', label = 'Loading...') {
    const sizeClass = `spinner-${size}`;
    return `
      <div class="loading-spinner-container" role="status" aria-label="${label}">
        <div class="loading-spinner ${sizeClass}"></div>
        <span class="loading-text">${label}</span>
        <span class="sr-only">${label}</span>
      </div>
    `;
  }
  
  // Inline loading indicator for buttons
  static createButtonSpinner() {
    return `
      <div class="button-spinner" role="status" aria-hidden="true">
        <div class="button-spinner-circle"></div>
      </div>
    `;
  }
  
  // Progress bar for multi-step operations
  static createProgressBar(current, total, label = '') {
    const percentage = Math.round((current / total) * 100);
    return `
      <div class="progress-container" role="progressbar" aria-valuenow="${current}" aria-valuemin="0" aria-valuemax="${total}" aria-label="${label}">
        <div class="progress-label">${label}</div>
        <div class="progress-bar-track">
          <div class="progress-bar-fill" style="width: ${percentage}%"></div>
        </div>
        <div class="progress-text">${current} of ${total}</div>
      </div>
    `;
  }
  
  // Skeleton for pick history table
  static createPickHistorySkeleton() {
    return `
      <div class="pick-history-skeleton" aria-label="Loading pick history">
        <div class="skeleton-table-header">
          <div class="skeleton-text skeleton-header-cell"></div>
          <div class="skeleton-text skeleton-header-cell"></div>
          <div class="skeleton-text skeleton-header-cell"></div>
          <div class="skeleton-text skeleton-header-cell"></div>
        </div>
        <div class="skeleton-table-body">
          ${Array.from({ length: 5 }, () => `
            <div class="skeleton-table-row">
              <div class="skeleton-text skeleton-cell"></div>
              <div class="skeleton-text skeleton-cell"></div>
              <div class="skeleton-text skeleton-cell"></div>
              <div class="skeleton-text skeleton-cell"></div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }
  
  // Navigation breadcrumb skeleton
  static createBreadcrumbSkeleton() {
    return `
      <div class="breadcrumb-skeleton" aria-label="Loading navigation">
        <div class="skeleton-text skeleton-breadcrumb"></div>
        <span class="breadcrumb-separator">/</span>
        <div class="skeleton-text skeleton-breadcrumb"></div>
        <span class="breadcrumb-separator">/</span>
        <div class="skeleton-text skeleton-breadcrumb"></div>
      </div>
    `;
  }
  
  // Form loading overlay
  static createFormLoadingOverlay(message = 'Processing...') {
    return `
      <div class="form-loading-overlay" role="status">
        <div class="form-loading-content">
          ${this.createSpinner('large', message)}
        </div>
      </div>
    `;
  }
  
  // Page-level loading overlay
  static createPageLoadingOverlay(message = 'Loading F1 Survivor...') {
    return `
      <div class="page-loading-overlay" role="status">
        <div class="page-loading-content">
          <div class="loading-logo">
            <img src="/assets/images/F1-Logo.png" alt="F1 Logo" class="loading-logo-img">
          </div>
          ${this.createSpinner('large', message)}
          <div class="loading-tips">
            <p class="loading-tip">💡 Tip: You can change your pick until 1 hour before the race starts!</p>
          </div>
        </div>
      </div>
    `;
  }
  
  // Show loading state in a container
  static showLoading(container, type = 'spinner', options = {}) {
    if (!container) return;
    
    const defaultOptions = {
      message: 'Loading...',
      size: 'medium',
      replace: true
    };
    
    const config = { ...defaultOptions, ...options };
    
    let loadingHTML = '';
    
    switch (type) {
      case 'dashboard':
        loadingHTML = this.createDashboardSkeleton();
        break;
      case 'driver-grid':
        loadingHTML = this.createDriverGridSkeleton();
        break;
      case 'league-list':
        loadingHTML = this.createLeagueListSkeleton();
        break;
      case 'pick-history':
        loadingHTML = this.createPickHistorySkeleton();
        break;
      case 'breadcrumb':
        loadingHTML = this.createBreadcrumbSkeleton();
        break;
      case 'form-overlay':
        loadingHTML = this.createFormLoadingOverlay(config.message);
        break;
      case 'page-overlay':
        loadingHTML = this.createPageLoadingOverlay(config.message);
        break;
      case 'progress':
        loadingHTML = this.createProgressBar(config.current || 0, config.total || 100, config.message);
        break;
      default:
        loadingHTML = this.createSpinner(config.size, config.message);
    }
    
    if (config.replace) {
      container.innerHTML = loadingHTML;
    } else {
      container.insertAdjacentHTML('beforeend', loadingHTML);
    }
    
    // Return cleanup function
    return () => {
      const loadingElements = container.querySelectorAll('.skeleton-*, .loading-spinner-container, .form-loading-overlay, .page-loading-overlay, .progress-container');
      loadingElements.forEach(el => el.remove());
    };
  }
  
  // Hide loading state
  static hideLoading(container) {
    if (!container) return;
    
    const loadingElements = container.querySelectorAll('.skeleton-*, .loading-spinner-container, .form-loading-overlay, .page-loading-overlay, .progress-container');
    loadingElements.forEach(el => {
      el.style.opacity = '0';
      el.style.transform = 'scale(0.95)';
      setTimeout(() => el.remove(), 200);
    });
  }
  
  // Show loading state for a specific element with automatic cleanup
  static async withLoading(element, asyncOperation, options = {}) {
    const cleanup = this.showLoading(element, options.type || 'spinner', options);
    
    try {
      const result = await asyncOperation();
      return result;
    } finally {
      if (cleanup) cleanup();
    }
  }
  
  // Apply loading styles to existing elements
  static applyLoadingCSS() {
    if (document.getElementById('loading-states-css')) return;
    
    const css = `
      /* Loading States CSS */
      .skeleton-text {
        background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
        background-size: 200% 100%;
        animation: skeleton-loading 1.5s infinite;
        border-radius: 4px;
        height: 1em;
        margin: 0.25em 0;
      }
      
      .skeleton-title { height: 1.5em; width: 60%; }
      .skeleton-subtitle { height: 1em; width: 40%; }
      .skeleton-card-title { height: 1em; width: 70%; }
      .skeleton-card-value { height: 1.2em; width: 50%; }
      .skeleton-card-detail { height: 0.8em; width: 80%; }
      .skeleton-section-title { height: 1.3em; width: 50%; }
      .skeleton-player-name { height: 1em; width: 60%; }
      .skeleton-player-stats { height: 0.8em; width: 40%; }
      .skeleton-player-status { height: 0.9em; width: 30%; }
      .skeleton-race-title { height: 1.5em; width: 70%; }
      .skeleton-deadline { height: 1em; width: 50%; }
      .skeleton-driver-name { height: 1em; width: 80%; }
      .skeleton-team-name { height: 0.8em; width: 60%; }
      .skeleton-league-name { height: 1.2em; width: 70%; }
      .skeleton-member-count { height: 0.9em; width: 30%; }
      .skeleton-stat { height: 0.8em; width: 25%; }
      .skeleton-header-cell { height: 1em; width: 80%; }
      .skeleton-cell { height: 0.9em; width: 70%; }
      .skeleton-breadcrumb { height: 1em; width: 60px; }
      
      .skeleton-card {
        background: #fafafa;
        border: 1px solid #e0e0e0;
        border-radius: 8px;
        padding: 1rem;
        margin-bottom: 1rem;
      }
      
      .skeleton-driver-card {
        background: #fafafa;
        border: 1px solid #e0e0e0;
        border-radius: 8px;
        padding: 1rem;
        text-align: center;
        display: flex;
        flex-direction: column;
        align-items: center;
      }
      
      .skeleton-driver-image {
        width: 80px;
        height: 80px;
        border-radius: 50%;
        background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
        background-size: 200% 100%;
        animation: skeleton-loading 1.5s infinite;
        margin-bottom: 0.5rem;
      }
      
      .skeleton-avatar {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
        background-size: 200% 100%;
        animation: skeleton-loading 1.5s infinite;
      }
      
      .skeleton-player {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 0.5rem 0;
        border-bottom: 1px solid #f0f0f0;
      }
      
      .skeleton-player-info {
        flex: 1;
      }
      
      .skeleton-button {
        height: 36px;
        width: 80px;
        background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
        background-size: 200% 100%;
        animation: skeleton-loading 1.5s infinite;
        border-radius: 4px;
        margin: 0.25rem;
      }
      
      .skeleton-cards-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 1rem;
        margin: 2rem 0;
      }
      
      .skeleton-driver-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
        gap: 1rem;
        margin: 2rem 0;
      }
      
      .skeleton-table-header,
      .skeleton-table-row {
        display: grid;
        grid-template-columns: 2fr 2fr 1fr 1fr;
        gap: 1rem;
        padding: 0.5rem;
        border-bottom: 1px solid #f0f0f0;
      }
      
      @keyframes skeleton-loading {
        0% { background-position: -200% 0; }
        100% { background-position: 200% 0; }
      }
      
      /* Spinner styles */
      .loading-spinner-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 2rem;
      }
      
      .loading-spinner {
        border: 3px solid #f3f3f3;
        border-top: 3px solid #E10600;
        border-radius: 50%;
        animation: spinner-rotate 1s linear infinite;
      }
      
      .spinner-small { width: 20px; height: 20px; }
      .spinner-medium { width: 40px; height: 40px; }
      .spinner-large { width: 60px; height: 60px; }
      
      .loading-text {
        margin-top: 1rem;
        color: #666;
        font-size: 0.9rem;
      }
      
      .button-spinner {
        display: inline-flex;
        align-items: center;
        margin-right: 0.5rem;
      }
      
      .button-spinner-circle {
        width: 16px;
        height: 16px;
        border: 2px solid transparent;
        border-top: 2px solid currentColor;
        border-radius: 50%;
        animation: spinner-rotate 1s linear infinite;
      }
      
      @keyframes spinner-rotate {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      
      /* Progress bar styles */
      .progress-container {
        width: 100%;
        margin: 1rem 0;
      }
      
      .progress-label {
        font-weight: 600;
        margin-bottom: 0.5rem;
        color: #333;
      }
      
      .progress-bar-track {
        width: 100%;
        height: 8px;
        background-color: #f0f0f0;
        border-radius: 4px;
        overflow: hidden;
      }
      
      .progress-bar-fill {
        height: 100%;
        background: linear-gradient(90deg, #E10600, #ff4444);
        transition: width 0.3s ease;
      }
      
      .progress-text {
        font-size: 0.8rem;
        color: #666;
        margin-top: 0.25rem;
      }
      
      /* Overlay styles */
      .form-loading-overlay,
      .page-loading-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(255, 255, 255, 0.9);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
      }
      
      .page-loading-content {
        text-align: center;
        padding: 2rem;
      }
      
      .loading-logo {
        margin-bottom: 2rem;
      }
      
      .loading-logo-img {
        width: 80px;
        height: auto;
        filter: drop-shadow(0 4px 8px rgba(225, 6, 0, 0.2));
      }
      
      .loading-tips {
        margin-top: 2rem;
        max-width: 400px;
      }
      
      .loading-tip {
        font-size: 0.9rem;
        color: #666;
        font-style: italic;
      }
      
      /* Accessibility */
      .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
      }
      
      /* Dark theme support */
      @media (prefers-color-scheme: dark) {
        .skeleton-text,
        .skeleton-driver-image,
        .skeleton-avatar {
          background: linear-gradient(90deg, #2a2a2a 25%, #3a3a3a 50%, #2a2a2a 75%);
          background-size: 200% 100%;
        }
        
        .skeleton-card,
        .skeleton-driver-card {
          background: #1a1a1a;
          border-color: #333;
        }
        
        .loading-text,
        .progress-text,
        .loading-tip {
          color: #ccc;
        }
        
        .form-loading-overlay,
        .page-loading-overlay {
          background: rgba(0, 0, 0, 0.9);
        }
      }
      
      /* Reduced motion */
      @media (prefers-reduced-motion: reduce) {
        .skeleton-text,
        .skeleton-driver-image,
        .skeleton-avatar,
        .loading-spinner,
        .button-spinner-circle {
          animation: none;
        }
        
        .progress-bar-fill {
          transition: none;
        }
      }
    `;
    
    const style = document.createElement('style');
    style.id = 'loading-states-css';
    style.textContent = css;
    document.head.appendChild(style);
  }
}

// Initialize loading CSS when module loads
if (typeof document !== 'undefined') {
  LoadingStates.applyLoadingCSS();
}

export default LoadingStates;