import { leagueStorageManager } from './league-storage-manager.js';
import { amplifyDataService } from './amplify-data-service.js';
import { authManager } from './auth-manager.js';
import { 
  multiLeagueContext, 
  initializeMultiLeagueSystem,
  getMultiLeagueContext,
  getActiveLeagueContext,
  getAllLeaguesContext,
  setActiveLeague
} from './multi-league-context.js';

/**
 * League Integration Module
 * Enhanced to support multi-league functionality while maintaining
 * backward compatibility with existing single-league code
 */

// ============================================================================
// BACKWARD COMPATIBILITY FUNCTIONS (Enhanced for Multi-League)
// ============================================================================

// Check if we're in league mode
export function isInLeagueMode() {
  const activeContext = getActiveLeagueContext();
  return !!activeContext?.isLeagueMode;
}

// Get current league context (enhanced for multi-league)
export function getLeagueContext() {
  const activeContext = getActiveLeagueContext();
  
  if (!activeContext) {
    return { isLeagueMode: false, leagueId: null, league: null };
  }
  
  return {
    isLeagueMode: true,
    leagueId: activeContext.leagueId,
    league: activeContext.league
  };
}

// Set active league ID (now uses multi-league context)
export function setActiveLeagueId(leagueId) {
  return setActiveLeague(leagueId);
}

// ============================================================================
// ENHANCED MULTI-LEAGUE FUNCTIONS
// ============================================================================

/**
 * Initialize the multi-league integration system
 * @returns {Promise<void>}
 */
export async function initializeMultiLeagueIntegration() {
  try {
    await initializeMultiLeagueSystem();
    displayLeagueIndicator(); // Update UI indicators
    setupLeagueChangeListeners();
    
    const context = getMultiLeagueContext();
    console.log(`Multi-league integration initialized: ${context.leagueCount} leagues, active: ${context.activeLeague || 'solo mode'}`);
  } catch (error) {
    console.error('Failed to initialize multi-league integration:', error);
    throw error;
  }
}

/**
 * Setup event listeners for league changes
 */
function setupLeagueChangeListeners() {
  multiLeagueContext.addEventListener((eventType, eventData) => {
    switch (eventType) {
      case 'league-change':
        handleLeagueChange(eventData);
        break;
      case 'league-list-change':
        handleLeagueListChange(eventData);
        break;
    }
  });
}

/**
 * Handle league change events
 * @param {Object} eventData - League change event data
 */
function handleLeagueChange(eventData) {
  const { newLeagueId, previousLeagueId, context } = eventData;
  
  // Update UI indicators
  displayLeagueIndicator();
  
  // Refresh pick interface for new league
  refreshPickInterface(newLeagueId);
  
  // Dispatch custom event for other components
  window.dispatchEvent(new CustomEvent('league-changed', {
    detail: { newLeagueId, previousLeagueId, context }
  }));
  
  console.log(`League changed: ${previousLeagueId || 'solo'} -> ${newLeagueId || 'solo'}`);
}

/**
 * Handle league list change events
 * @param {Object} eventData - League list change event data
 */
function handleLeagueListChange(eventData) {
  const { context, leagueCount } = eventData;
  
  // Update league selector if it exists
  updateLeagueSelector();
  
  // Dispatch custom event for other components
  window.dispatchEvent(new CustomEvent('league-list-changed', {
    detail: { context, leagueCount }
  }));
  
  console.log(`League list updated: ${leagueCount} leagues`);
}

/**
 * Refresh pick interface for league change
 * @param {string|null} leagueId - New active league ID
 */
function refreshPickInterface(leagueId) {
  // Clear any cached pick data
  const pickDisplay = document.querySelector('.current-pick');
  if (pickDisplay) {
    pickDisplay.textContent = 'Loading...';
  }
  
  // Trigger pick data refresh in main app
  if (window.refreshCurrentPick) {
    window.refreshCurrentPick();
  }
}

/**
 * Update league selector component if it exists
 */
function updateLeagueSelector() {
  const selectorElement = document.querySelector('.league-selector');
  if (selectorElement && window.leagueSelector) {
    window.leagueSelector.updateLeagueList();
  }
}

// ============================================================================
// ENHANCED PICK OPERATIONS (Multi-League Aware)
// ============================================================================

// Save pick with automatic league context - AWS BACKEND ONLY
export async function savePickWithContext(driverId, driverInfo) {
  // Ensure user is authenticated
  const user = await authManager.getCurrentUser();
  if (!user) {
    throw new Error('Authentication required to save picks');
  }

  const context = getLeagueContext();
  
  if (context.isLeagueMode) {
    console.log(`Saving pick to league: ${context.league.name || context.league.leagueName}`);
    
    // Use AWS backend for league picks
    const raceData = JSON.parse(localStorage.getItem('nextRaceData'));
    if (!raceData || !raceData.raceId) {
      throw new Error('No valid race data found. Cannot save pick.');
    }
    
    const pickData = {
      raceId: raceData.raceId,
      driverId: parseInt(driverId),
      driverName: driverInfo?.driverName || null,
      teamName: driverInfo?.teamName || null,
      raceName: raceData.raceName || 'Unknown Race',
      isAutoPick: driverInfo?.isAutoPick || false,
      leagueId: context.leagueId // Include league ID
    };
    
    return amplifyDataService.saveUserPick(pickData);
  } else {
    console.log('Saving pick in solo mode via AWS backend');
    
    // Get race data from cache (this is application state, not user data)
    const raceData = JSON.parse(localStorage.getItem('nextRaceData'));
    if (!raceData || !raceData.raceId) {
      throw new Error('No valid race data found. Cannot save pick.');
    }
    
    const pickData = {
      raceId: raceData.raceId,
      driverId: parseInt(driverId),
      driverName: driverInfo?.driverName || null,
      teamName: driverInfo?.teamName || null,
      raceName: raceData.raceName || 'Unknown Race',
      isAutoPick: driverInfo?.isAutoPick || false
      // No leagueId for solo mode
    };
    
    return amplifyDataService.saveUserPick(pickData);
  }
}

// Load picks with automatic league context - AWS BACKEND ONLY
export async function loadPicksWithContext() {
  // Ensure user is authenticated
  const user = await authManager.getCurrentUser();
  if (!user) {
    console.log('No authenticated user, returning empty picks');
    return [];
  }

  const context = getLeagueContext();
  
  if (context.isLeagueMode) {
    console.log(`Loading picks from league: ${context.league.name || context.league.leagueName}`);
    const picks = await amplifyDataService.getUserPicks(null, context.leagueId);
    return amplifyDataService.transformPicksForUI(picks);
  } else {
    console.log('Loading picks in solo mode via AWS backend');
    const picks = await amplifyDataService.getUserPicks();
    return amplifyDataService.transformPicksForUI(picks);
  }
}

// Check if driver is already picked with automatic league context - AWS BACKEND ONLY
export async function isDriverAlreadyPickedWithContext(driverId) {
  // Ensure user is authenticated
  const user = await authManager.getCurrentUser();
  if (!user) {
    return false;
  }

  const context = getLeagueContext();
  
  if (context.isLeagueMode) {
    return amplifyDataService.isDriverAlreadyPicked(driverId, context.leagueId);
  } else {
    return amplifyDataService.isDriverAlreadyPicked(driverId);
  }
}

// Get current race pick with automatic league context - AWS BACKEND ONLY
export async function getCurrentRacePickWithContext() {
  // Ensure user is authenticated
  const user = await authManager.getCurrentUser();
  if (!user) {
    return null;
  }

  const context = getLeagueContext();
  
  if (context.isLeagueMode) {
    return amplifyDataService.getCurrentRacePick(context.leagueId);
  } else {
    return amplifyDataService.getCurrentRacePick();
  }
}

// ============================================================================
// MULTI-LEAGUE SPECIFIC OPERATIONS
// ============================================================================

/**
 * Save pick to a specific league
 * @param {string} leagueId - Target league ID
 * @param {number} driverId - Driver ID
 * @param {Object} driverInfo - Driver information
 * @returns {Promise} Save result
 */
export async function savePickToLeague(leagueId, driverId, driverInfo) {
  const user = await authManager.getCurrentUser();
  if (!user) {
    throw new Error('Authentication required to save picks');
  }

  const raceData = JSON.parse(localStorage.getItem('nextRaceData'));
  if (!raceData || !raceData.raceId) {
    throw new Error('No valid race data found. Cannot save pick.');
  }
  
  const pickData = {
    raceId: raceData.raceId,
    driverId: parseInt(driverId),
    driverName: driverInfo?.driverName || null,
    teamName: driverInfo?.teamName || null,
    raceName: raceData.raceName || 'Unknown Race',
    isAutoPick: driverInfo?.isAutoPick || false,
    leagueId: leagueId
  };
  
  return amplifyDataService.saveUserPick(pickData);
}

/**
 * Get picks for all user leagues
 * @returns {Promise<Object>} Picks grouped by league
 */
export async function getAllLeaguePicks() {
  const user = await authManager.getCurrentUser();
  if (!user) {
    return { leaguePicks: {}, soloPicks: [] };
  }

  return amplifyDataService.getMultiLeaguePickHistory();
}

/**
 * Get cross-league statistics for current user
 * @returns {Promise<Object>} Cross-league statistics
 */
export async function getCrossLeagueStatistics() {
  const user = await authManager.getCurrentUser();
  if (!user) {
    return { totalLeagues: 0, totalPicks: 0 };
  }

  return amplifyDataService.getCrossLeagueStatistics();
}

/**
 * Switch to a different league
 * @param {string|null} leagueId - League ID to switch to (null for solo mode)
 * @returns {boolean} Success status
 */
export async function switchToLeague(leagueId) {
  const success = setActiveLeague(leagueId);
  
  if (success) {
    // Refresh UI components
    displayLeagueIndicator();
    refreshPickInterface(leagueId);
  }
  
  return success;
}

/**
 * Join a new league and optionally make it active
 * @param {string} inviteCode - League invite code
 * @param {boolean} makeActive - Whether to make this the active league
 * @returns {Promise<Object>} Join result
 */
export async function joinLeagueAndActivate(inviteCode, makeActive = true) {
  try {
    const league = await amplifyDataService.joinLeague(inviteCode);
    
    // Add to multi-league context
    await multiLeagueContext.addLeague(league);
    
    // Make active if requested
    if (makeActive) {
      setActiveLeague(league.leagueId);
    }
    
    return { success: true, league };
  } catch (error) {
    console.error('Failed to join league:', error);
    return { success: false, error };
  }
}

// ============================================================================
// UI INDICATORS AND DISPLAY
// ============================================================================

// Display league indicator in UI (enhanced for multi-league)
export function displayLeagueIndicator() {
  const context = getLeagueContext();
  const multiContext = getMultiLeagueContext();
  
  // Remove existing indicators
  const existingIndicators = document.querySelectorAll('.league-indicator');
  existingIndicators.forEach(indicator => indicator.remove());
  
  if (context.isLeagueMode) {
    // Add league indicator to driver selection modal
    const modalHeader = document.querySelector('#driver-selection-screen .modal-header');
    if (modalHeader) {
      const indicator = document.createElement('div');
      indicator.className = 'league-indicator';
      indicator.innerHTML = `
        <span class="indicator-label">League:</span>
        <span class="indicator-value">${context.league.name || context.league.leagueName}</span>
        ${multiContext.hasMultipleLeagues ? `<span class="indicator-count">(${multiContext.leagueCount} total)</span>` : ''}
      `;
      modalHeader.appendChild(indicator);
    }
    
    // Add league indicator to main page
    const mainHeader = document.querySelector('.hero-section');
    if (mainHeader) {
      const mainIndicator = document.createElement('div');
      mainIndicator.className = 'league-indicator main-page';
      mainIndicator.innerHTML = `
        <span>Playing in: <strong>${context.league.name || context.league.leagueName}</strong></span>
        ${multiContext.hasMultipleLeagues ? `<span class="league-count">${multiContext.leagueCount} leagues</span>` : ''}
      `;
      mainHeader.appendChild(mainIndicator);
    }
  } else if (multiContext.leagueCount > 0) {
    // Show that user has leagues but is in solo mode
    const mainHeader = document.querySelector('.hero-section');
    if (mainHeader) {
      const mainIndicator = document.createElement('div');
      mainIndicator.className = 'league-indicator main-page solo-mode';
      mainIndicator.innerHTML = `
        <span>Solo Mode</span>
        <span class="league-count">${multiContext.leagueCount} leagues available</span>
      `;
      mainHeader.appendChild(mainIndicator);
    }
  }
}

/**
 * Get league display information for UI components
 * @returns {Object} League display information
 */
export function getLeagueDisplayInfo() {
  const context = getLeagueContext();
  const multiContext = getMultiLeagueContext();
  
  return {
    isLeagueMode: context.isLeagueMode,
    activeLeague: context.league,
    leagueCount: multiContext.leagueCount,
    hasMultipleLeagues: multiContext.hasMultipleLeagues,
    soloMode: multiContext.soloMode,
    allLeagues: multiContext.leagues
  };
}

// ============================================================================
// INITIALIZATION AND SETUP
// ============================================================================

// Initialize league integration (enhanced for multi-league)
export function initializeLeagueIntegration() {
  // Initialize multi-league system asynchronously
  initializeMultiLeagueIntegration().catch(error => {
    console.error('Multi-league initialization failed, falling back to basic mode:', error);
    
    // Fallback to basic display
    displayLeagueIndicator();
    
    const context = getLeagueContext();
    if (context.isLeagueMode) {
      console.log(`Basic league mode active: ${context.league?.name || context.league?.leagueName}`);
    } else {
      console.log('Solo mode active');
    }
  });
}

// Export the multi-league context for direct access
export { multiLeagueContext };

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeLeagueIntegration);
} else {
  initializeLeagueIntegration();
}