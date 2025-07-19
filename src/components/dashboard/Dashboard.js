// Main dashboard JavaScript file

import { getDashboardData, getRaceName, formatDate, addTestDashboardData } from '@/utils/DashboardUtils.js';
import EliminationZone from '@/components/elimination/EliminationZone.js';
import { authManager } from '@/services/auth/AuthManager.js';
import { authUI } from '@/components/auth/AuthUI.js';
import { multiLeagueDashboard } from '@/components/league/MultiLeagueDashboard.js';
// Import multi-league components
import { createLeagueSelector } from '@/components/league/LeagueSelector.js';
import { initializeMultiLeagueSystem } from '@/services/league/LeagueIntegration.js';

// Dashboard state
let dashboardData = null;

// Global multi-league component instances
let leagueSelector = null;

// Debounce mechanism for dashboard refreshes
let dashboardRefreshTimeout = null;
let isRefreshing = false;

// Initialize multi-league UI components for dashboard
async function initializeMultiLeagueUI() {
    try {
        console.log('Initializing multi-league UI components for dashboard...');
        
        // Initialize multi-league system backend
        const multiLeagueContext = await initializeMultiLeagueSystem();
        
        // Make context globally accessible BEFORE initializing UI components
        window.multiLeagueContext = multiLeagueContext;
        
        // Initialize league selector in navigation
        leagueSelector = createLeagueSelector('league-nav-selector');
        await leagueSelector.initialize();
        
        // Make league selector globally accessible for other components
        window.leagueSelector = leagueSelector;
        
        console.log('League selector initialized for dashboard');
        console.log('Multi-league UI components initialized successfully for dashboard');
    } catch (error) {
        console.error('Failed to initialize multi-league UI for dashboard:', error);
        // Graceful fallback - continue without multi-league features
        console.log('Continuing dashboard without multi-league features');
    }
}

// Initialize authentication state management (copied from app.js)
async function initializeAuthState() {
  try {
    console.log('Initializing authentication state management');
    
    // Set up auth state listener
    authManager.onAuthStateChange((isAuthenticated) => {
      updateUIForAuthState(isAuthenticated);
    });
    
    // Check initial auth state
    const isAuthenticated = await authManager.isAuthenticated();
    updateUIForAuthState(isAuthenticated);
    
    console.log('Authentication state management initialized');
  } catch (error) {
    console.error('Failed to initialize authentication state:', error);
  }
}

// Update UI based on authentication state (copied from app.js)
async function updateUIForAuthState(isAuthenticated) {
  console.log('Updating UI for auth state:', isAuthenticated);
  
  const signInLinks = document.querySelectorAll('.sign-in');
  const navLinks = document.querySelectorAll('.nav-link'); // Pick and Dashboard buttons
  
  if (isAuthenticated) {
    try {
      const userInfo = await authManager.getUserDisplayInfo();
      const displayText = userInfo?.displayName || userInfo?.email?.split('@')[0] || userInfo?.username || 'User';
      
      // Update sign in links to show user menu
      signInLinks.forEach(link => {
        link.textContent = displayText; // Show user's actual name or email
        link.onclick = (e) => {
          e.preventDefault();
          e.stopPropagation();
          showUserMenu();
        };
        link.classList.add('authenticated');
      });
      
      // Show navigation links for authenticated users
      navLinks.forEach(link => {
        link.style.display = 'block';
      });
      
      console.log('UI updated for authenticated user:', displayText);
    } catch (error) {
      console.error('Error getting user info:', error);
      // Fallback
      signInLinks.forEach(link => {
        link.textContent = 'User';
        link.onclick = (e) => {
          e.preventDefault();
          e.stopPropagation();
          showUserMenu();
        };
        link.classList.add('authenticated');
      });
      
      // Still show navigation for fallback authenticated state
      navLinks.forEach(link => {
        link.style.display = 'block';
      });
    }
    
    // Refresh multi-league dashboard for authenticated user (debounced)
    debouncedDashboardRefresh();
  } else {
    // Update sign in links to show sign in
    signInLinks.forEach(link => {
      link.textContent = 'Sign In';
      link.onclick = () => showAuthModal('signin');
      link.classList.remove('authenticated');
    });
    
    // Hide navigation links for unauthenticated users
    navLinks.forEach(link => {
      link.style.display = 'none';
    });
    
    console.log('UI updated for unauthenticated user');
      }
}

// Debounced dashboard refresh to prevent multiple rapid refreshes
function debouncedDashboardRefresh() {
    if (isRefreshing) {
        console.log('🏆 Dashboard refresh already in progress, skipping...');
        return;
    }
    
    // Clear any existing timeout
    if (dashboardRefreshTimeout) {
        clearTimeout(dashboardRefreshTimeout);
    }
    
    // Set new timeout
    dashboardRefreshTimeout = setTimeout(async () => {
        if (!isRefreshing) {
            isRefreshing = true;
            console.log('🏆 Executing debounced dashboard refresh...');
            try {
                await multiLeagueDashboard.refresh();
            } catch (error) {
                console.error('Error in debounced dashboard refresh:', error);
            } finally {
                isRefreshing = false;
            }
        }
    }, 300); // 300ms debounce
}

// Show user menu (copied from app.js)
function showUserMenu() {
  // Remove any existing user menus
  const existingMenus = document.querySelectorAll('.user-menu');
  existingMenus.forEach(menu => menu.remove());
  
  const menu = document.createElement('div');
  menu.className = 'user-menu';
  menu.innerHTML = `
    <div class="user-menu-content">
      <button onclick="handleSignOut()" style="
        background: #ffffff;
        border: 2px solid #dc2626;
        color: #dc2626;
        padding: 0.5rem 1rem;
        border-radius: 4px;
        cursor: pointer;
        font-weight: 600;
        width: 100%;
        transition: all 0.2s ease;
      " 
      onmouseover="this.style.background='#dc2626'; this.style.color='#ffffff'" 
      onmouseout="this.style.background='#ffffff'; this.style.color='#dc2626'">
        Sign Out
      </button>
    </div>
  `;
  
  // Position menu near the user link
  const signInLink = document.querySelector('.sign-in');
  if (signInLink) {
    const rect = signInLink.getBoundingClientRect();
    menu.style.position = 'fixed';
    menu.style.top = `${rect.bottom + 5}px`;
    menu.style.right = '20px';
    menu.style.zIndex = '9999';
    menu.style.background = '#ffffff';
    menu.style.border = '2px solid #374151';
    menu.style.borderRadius = '6px';
    menu.style.padding = '0.5rem';
    menu.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
  }
  
  document.body.appendChild(menu);
  
  // Close menu when clicking outside
  setTimeout(() => {
    document.addEventListener('click', function closeMenu(e) {
      if (!menu.contains(e.target)) {
        menu.remove();
        document.removeEventListener('click', closeMenu);
      }
    });
  }, 100);
}

// Handle sign out
async function handleSignOut() {
  try {
    console.log('Signing out user');
    const result = await authManager.signOut();
    
    if (result.success) {
      console.log('Sign out successful');
      // Remove any user menus
      const userMenus = document.querySelectorAll('.user-menu');
      userMenus.forEach(menu => menu.remove());
      
      // Update UI for unauthenticated state
      updateUIForAuthState(false);
      
      // Redirect to home page
      window.location.href = 'index.html';
    } else {
      console.error('Sign out failed:', result.error);
    }
  } catch (error) {
    console.error('Sign out error:', error);
  }
}

/**
 * Initialize the dashboard
 */
async function initializeDashboard() {
  try {
    console.log('Initializing dashboard...');
    
    // Show loading overlay
    showLoading();
    
    // Initialize authentication state first
    await initializeAuthState();
    
    // Initialize multi-league dashboard (will handle timing internally)
    await multiLeagueDashboard.initialize();
    
    // Set up global listener for when multi-league context becomes available
    const setupMultiLeagueListener = () => {
      if (window.multiLeagueContext) {
        // Check if context actually has leagues loaded
        const context = window.multiLeagueContext.getMultiLeagueContext();
        if (context && context.leagueCount > 0) {
          console.log('🔄 Multi-league context available with leagues, refreshing dashboard...');
          debouncedDashboardRefresh();
        } else {
          console.log('🔄 Multi-league context available but no leagues yet, waiting...');
        }
        
        // Add listener for future changes (always add this)
        window.multiLeagueContext.addLeagueChangeListener((event) => {
          console.log('🔄 Multi-league context changed, refreshing dashboard...', event);
          debouncedDashboardRefresh();
        });
        return true;
      }
      return false;
    };
    
    // Also listen for league change events from league selector (only once)
    if (!window.dashboardLeagueChangeListenerAdded) {
      document.addEventListener('leagueChanged', (event) => {
        console.log('🔄 League changed event received:', event.detail);
        setTimeout(() => {
          debouncedDashboardRefresh();
        }, 100); // Small delay to ensure context is updated
      });
      window.dashboardLeagueChangeListenerAdded = true;
    }
    
    // Try to set up listener immediately
    if (!setupMultiLeagueListener()) {
      // If not available yet, poll for it (but don't block initialization)
      let hasSetupListener = false;
      const checkInterval = setInterval(() => {
        if (!hasSetupListener && setupMultiLeagueListener()) {
          hasSetupListener = true;
          clearInterval(checkInterval);
        }
      }, 200); // Check every 200ms (less frequent to avoid spam)
      
      // Clear interval after 10 seconds to prevent infinite polling
      setTimeout(() => {
        if (!hasSetupListener) {
          console.log('🔄 Multi-league context setup timed out, continuing with solo mode');
        }
        clearInterval(checkInterval);
      }, 10000);
    }
    
    // Add test data if needed (for demonstration)
    addTestDashboardData();
    
    // Load dashboard data
    dashboardData = await getDashboardData();
    console.log('Dashboard data loaded:', dashboardData);
    
    // Initialize Elimination Zone
    const eliminationZoneContainer = document.getElementById('elimination-zone-container');
    if (eliminationZoneContainer) {
      const eliminationZone = new EliminationZone(eliminationZoneContainer);
      await eliminationZone.initialize(); // Will use current user and active league
    }
    
    // REMOVED: Static element updates - now handled by MultiLeagueDashboard.js
    
    // Hide loading overlay
    hideLoading();
    
    console.log('Dashboard initialized successfully');
  } catch (error) {
    console.error('Error initializing dashboard:', error);
    hideLoading();
    showError('Failed to load dashboard data. Please try refreshing the page.');
  }
}

// REMOVED: Static element update methods - now handled by MultiLeagueDashboard.js

/**
 * Show loading overlay
 */
function showLoading() {
  const loadingOverlay = document.getElementById('dashboard-loading');
  if (loadingOverlay) {
    loadingOverlay.classList.add('active');
  }
}

/**
 * Hide loading overlay
 */
function hideLoading() {
  const loadingOverlay = document.getElementById('dashboard-loading');
  if (loadingOverlay) {
    loadingOverlay.classList.remove('active');
  }
}

/**
 * Show error message
 * @param {string} message - Error message to display
 */
function showError(message) {
  // Create error notification
  const errorDiv = document.createElement('div');
  errorDiv.className = 'error-notification';
  errorDiv.innerHTML = `
    <div class="error-content">
      <h3>Error</h3>
      <p>${message}</p>
      <button onclick="this.parentElement.parentElement.remove()">Close</button>
    </div>
  `;
  
  // Add to page
  document.body.appendChild(errorDiv);
  
  // Auto-remove after 5 seconds
  setTimeout(() => {
    if (errorDiv.parentElement) {
      errorDiv.remove();
    }
  }, 5000);
}

/**
 * Refresh dashboard data
 */
async function refreshDashboard() {
  console.log('Refreshing dashboard...');
  await initializeDashboard();
}

// Make functions available globally
window.showAuthModal = async (tab = 'signin') => {
  await authUI.showModal(tab);
};

window.handleSignOut = handleSignOut;

// Initialize dashboard when page loads
document.addEventListener('DOMContentLoaded', async () => {
    // Initialize multi-league system first
    await initializeMultiLeagueUI();
    
    // Then initialize dashboard
    await initializeDashboard();
});

// Listen for storage changes to update dashboard in real-time
window.addEventListener('storage', (event) => {
  if (event.key === 'f1survivor_user_picks') {
    console.log('User picks changed, refreshing dashboard...');
    refreshDashboard();
  }
});

// Export functions for testing
export {
  initializeDashboard,
  refreshDashboard
}; 