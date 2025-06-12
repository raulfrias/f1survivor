import { leagueStorageManager } from './league-storage-manager.js';
import { amplifyDataService } from './amplify-data-service.js';
import { authManager } from './auth-manager.js';

/**
 * League Integration Module
 * Provides wrapper functions that automatically handle league context
 * for pick operations
 */

// Check if we're in league mode
export function isInLeagueMode() {
  const activeLeagueId = leagueStorageManager.getActiveLeagueId();
  return !!activeLeagueId;
}

// Get current league context
export function getLeagueContext() {
  const activeLeagueId = leagueStorageManager.getActiveLeagueId();
  if (!activeLeagueId) {
    return { isLeagueMode: false, leagueId: null, league: null };
  }
  
  const league = leagueStorageManager.getLeague(activeLeagueId);
  return {
    isLeagueMode: true,
    leagueId: activeLeagueId,
    league: league
  };
}

// Set active league ID
export function setActiveLeagueId(leagueId) {
  return leagueStorageManager.setActiveLeagueId(leagueId);
}

// Save pick with automatic league context - AWS BACKEND ONLY
export async function savePickWithContext(driverId, driverInfo) {
  // Ensure user is authenticated
  const user = await authManager.getCurrentUser();
  if (!user) {
    throw new Error('Authentication required to save picks');
  }

  const context = getLeagueContext();
  
  if (context.isLeagueMode) {
    console.log(`Saving pick to league: ${context.league.leagueName}`);
    return leagueStorageManager.saveLeaguePick(context.leagueId, driverId, driverInfo);
  } else {
    console.log('Saving pick in solo mode via AWS backend');
    
    // Get race data from cache (this is application state, not user data)
    // Race data comes from F1 calendar APIs and is cached in localStorage
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
    console.log(`Loading picks from league: ${context.league.leagueName}`);
    return leagueStorageManager.loadLeaguePicks(context.leagueId);
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
    return leagueStorageManager.isDriverAlreadyPickedInLeague(driverId, context.leagueId);
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
    return leagueStorageManager.getCurrentRacePickForLeague(context.leagueId);
  } else {
    return amplifyDataService.getCurrentRacePick();
  }
}

// Display league indicator in UI
export function displayLeagueIndicator() {
  const context = getLeagueContext();
  
  // Remove existing indicator
  const existingIndicator = document.querySelector('.league-indicator');
  if (existingIndicator) {
    existingIndicator.remove();
  }
  
  if (context.isLeagueMode) {
    // Add league indicator to driver selection modal
    const modalHeader = document.querySelector('#driver-selection-screen .modal-header');
    if (modalHeader) {
      const indicator = document.createElement('div');
      indicator.className = 'league-indicator';
      indicator.innerHTML = `
        <span class="indicator-label">League:</span>
        <span class="indicator-value">${context.league.leagueName}</span>
      `;
      modalHeader.appendChild(indicator);
    }
    
    // Add league indicator to main page
    const mainHeader = document.querySelector('.hero-section');
    if (mainHeader) {
      const mainIndicator = document.createElement('div');
      mainIndicator.className = 'league-indicator main-page';
      mainIndicator.innerHTML = `
        <span>Playing in: <strong>${context.league.leagueName}</strong></span>
      `;
      mainHeader.appendChild(mainIndicator);
    }
  }
}

// Initialize league integration
export function initializeLeagueIntegration() {
  // Display league indicator if in league mode
  displayLeagueIndicator();
  
  // Log current mode
  const context = getLeagueContext();
  if (context.isLeagueMode) {
    console.log(`League mode active: ${context.league.leagueName}`);
  } else {
    console.log('Solo mode active');
  }
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeLeagueIntegration);
} else {
  initializeLeagueIntegration();
}