import { leagueManager } from '@/services/league/LeagueManager.js';
import { leagueStorageManager } from '@/services/league/LeagueStorageManager.js';
import { MultiLeagueContext, multiLeagueContext } from '@/services/league/MultiLeagueContext.js';
import { amplifyDataService } from '@/services/aws/AmplifyDataService.js';
import { authManager } from '@/services/auth/AuthManager.js';

/**
 * PHASE 1: Multi-League Integration Layer
 * Refactored to support multi-league functionality
 * Replaces single-league context with multi-league support
 */

// Initialize multi-league system
export async function initializeMultiLeagueSystem() {
  const user = await authManager.getCurrentUser();
  if (!user) {
    console.log('No authenticated user, initializing empty multi-league context');
    return multiLeagueContext;
  }

  try {
    await multiLeagueContext.loadUserLeagues();
    console.log('Multi-league system initialized successfully');
    return multiLeagueContext;
  } catch (error) {
    console.error('Failed to initialize multi-league system:', error);
    return multiLeagueContext;
  }
}

// Get multi-league context (replaces getLeagueContext)
export function getMultiLeagueContext() {
  return multiLeagueContext.getMultiLeagueContext();
}

// Get active league context (backward compatibility)
export function getActiveLeagueContext() {
  return multiLeagueContext.getActiveLeagueContext();
}

// Get all leagues context (for dashboard/UI)
export function getAllLeaguesContext() {
  return multiLeagueContext.getAllLeaguesContext();
}

// Legacy compatibility function (deprecated - use getActiveLeagueContext)
export function getLeagueContext() {
  console.warn('getLeagueContext() is deprecated, use getActiveLeagueContext() instead');
  return getActiveLeagueContext();
}

// Check if we're in league mode (any league)
export function isInLeagueMode() {
  const context = getMultiLeagueContext();
  return context.hasLeagues;
}

// Check if we're in multi-league mode (more than one league)
export function isInMultiLeagueMode() {
  const context = getMultiLeagueContext();
  return context.isMultiLeague;
}

// Set active league ID
export function setActiveLeagueId(leagueId) {
  const success = multiLeagueContext.setActiveLeague(leagueId);
  if (success) {
    // Update UI indicators
    displayLeagueIndicator();
    return true;
  }
  return false;
}

// Save pick with automatic league context detection
export async function savePickWithContext(driverId, driverInfo, targetLeagueId = null) {
  const user = await authManager.getCurrentUser();
  if (!user) {
    throw new Error('Authentication required to save picks');
  }

  const context = getMultiLeagueContext();
  
  // Determine target league
  let leagueId = targetLeagueId;
  if (!leagueId) {
    if (context.hasLeagues) {
      leagueId = context.activeLeague;
      if (!leagueId) {
        throw new Error('No active league selected. Please select a league or specify targetLeagueId.');
      }
    }
    // If no leagues, leagueId remains null for solo mode
  }

  console.log(`Saving pick to ${leagueId ? `league: ${leagueId}` : 'solo mode'}`);

  if (leagueId) {
    // League mode - use existing league storage manager for now
    // TODO: Phase 2 will replace this with unified AWS backend
    return leagueStorageManager.saveLeaguePick(leagueId, driverId, driverInfo);
  } else {
    // Solo mode via AWS backend
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
    
    const result = await amplifyDataService.saveUserPick(pickData);
    
    // Clear pick cache for this league
    multiLeagueContext.clearCache('picks', leagueId);
    
    return result;
  }
}

// Load picks with automatic league context detection
export async function loadPicksWithContext(targetLeagueId = null) {
  const user = await authManager.getCurrentUser();
  if (!user) {
    console.log('No authenticated user, returning empty picks');
    return [];
  }

  const context = getMultiLeagueContext();
  
  // Determine target league
  let leagueId = targetLeagueId;
  if (!leagueId && context.hasLeagues) {
    leagueId = context.activeLeague;
  }

  console.log(`Loading picks from ${leagueId ? `league: ${leagueId}` : 'solo mode'}`);

  if (leagueId) {
    // League mode - use cached method
    const picks = await multiLeagueContext.getLeaguePicks(leagueId);
    return amplifyDataService.transformPicksForUI(picks);
  } else {
    // Solo mode via AWS backend
    const picks = await amplifyDataService.getUserPicks();
    return amplifyDataService.transformPicksForUI(picks);
  }
}

// Check if driver is already picked with league context
export async function isDriverAlreadyPickedWithContext(driverId, targetLeagueId = null) {
  const user = await authManager.getCurrentUser();
  if (!user) return false;

  const context = getMultiLeagueContext();
  
  // Determine target league
  let leagueId = targetLeagueId;
  if (!leagueId && context.hasLeagues) {
    leagueId = context.activeLeague;
  }

  if (leagueId) {
    // Check specific league
    return amplifyDataService.isDriverAlreadyPicked(driverId, leagueId);
  } else {
    // Check solo mode
    return amplifyDataService.isDriverAlreadyPicked(driverId);
  }
}

// Check if driver is picked in ANY league (cross-league validation)
export async function isDriverAlreadyPickedInAnyLeague(driverId) {
  return amplifyDataService.isDriverAlreadyPickedInAnyLeague(driverId);
}

// Get current race pick with league context
export async function getCurrentRacePickWithContext(targetLeagueId = null) {
  const user = await authManager.getCurrentUser();
  if (!user) return null;

  const context = getMultiLeagueContext();
  
  // Determine target league
  let leagueId = targetLeagueId;
  if (!leagueId && context.hasLeagues) {
    leagueId = context.activeLeague;
  }

  if (leagueId) {
    // League mode - use existing league storage manager for now
    return leagueStorageManager.getCurrentRacePickForLeague(leagueId);
  } else {
    // Solo mode via AWS backend
    return amplifyDataService.getCurrentRacePick();
  }
}

// Display league indicator in UI (enhanced for multi-league)
export function displayLeagueIndicator() {
  const context = getMultiLeagueContext();
  
  // Remove existing indicators
  const existingIndicators = document.querySelectorAll('.league-indicator');
  existingIndicators.forEach(indicator => indicator.remove());
  
  if (context.hasLeagues) {
    const activeLeagueData = context.activeLeagueData;
    const indicatorText = context.isMultiLeague 
      ? `${activeLeagueData?.name || 'Unknown League'} (${context.leagueCount} leagues)`
      : activeLeagueData?.name || 'Unknown League';
    
    // Add league indicator to driver selection modal
    const modalHeader = document.querySelector('#driver-selection-screen .modal-header');
    if (modalHeader) {
      const indicator = document.createElement('div');
      indicator.className = 'league-indicator';
      indicator.innerHTML = `
        <span class="indicator-label">League:</span>
        <span class="indicator-value">${indicatorText}</span>
      `;
      modalHeader.appendChild(indicator);
    }
    
    // Add league indicator to main page
    const mainHeader = document.querySelector('.hero-section');
    if (mainHeader) {
      const mainIndicator = document.createElement('div');
      mainIndicator.className = 'league-indicator main-page';
      mainIndicator.innerHTML = `
        <span>Playing in: <strong>${indicatorText}</strong></span>
      `;
      mainHeader.appendChild(mainIndicator);
    }
  } else {
    // Solo mode indicator
    const mainHeader = document.querySelector('.hero-section');
    if (mainHeader) {
      const soloIndicator = document.createElement('div');
      soloIndicator.className = 'league-indicator main-page solo-mode';
      soloIndicator.innerHTML = `
        <span>Mode: <strong>Solo</strong></span>
      `;
      mainHeader.appendChild(soloIndicator);
    }
  }
}

// League management functions

// Join a new league and add to context
export async function joinLeagueWithContext(inviteCode) {
  try {
    const league = await amplifyDataService.joinLeague(inviteCode);
    
    // Add to multi-league context
    multiLeagueContext.addLeague(league);
    
    // Update UI
    displayLeagueIndicator();
    
    console.log(`Successfully joined league: ${league.name}`);
    return league;
  } catch (error) {
    console.error('Failed to join league:', error);
    throw error;
  }
}

// Leave a league and remove from context
export async function leaveLeagueWithContext(leagueId) {
  try {
    // TODO: Implement leaveLeague method in amplifyDataService
    // For now, just remove from context
    multiLeagueContext.removeLeague(leagueId);
    
    // Update UI
    displayLeagueIndicator();
    
    console.log(`Left league: ${leagueId}`);
  } catch (error) {
    console.error('Failed to leave league:', error);
    throw error;
  }
}

// Refresh all league data
export async function refreshLeagueData() {
  try {
    await multiLeagueContext.refreshLeagues();
    displayLeagueIndicator();
    console.log('League data refreshed successfully');
  } catch (error) {
    console.error('Failed to refresh league data:', error);
    throw error;
  }
}

// Get cross-league statistics
export async function getCrossLeagueStatistics() {
  return amplifyDataService.getCrossLeagueStatistics();
}

// Get multi-league pick history
export async function getMultiLeaguePickHistory() {
  return amplifyDataService.getMultiLeaguePickHistory();
}

// Event handling for league changes
export function addLeagueChangeListener(callback) {
  multiLeagueContext.addLeagueChangeListener(callback);
}

export function removeLeagueChangeListener(callback) {
  multiLeagueContext.removeLeagueChangeListener(callback);
}

// Initialize multi-league integration
export async function initializeLeagueIntegration() {
  try {
    // Initialize multi-league system
    await initializeMultiLeagueSystem();
    
    // Display appropriate indicator
    displayLeagueIndicator();
    
    // Log current mode
    const context = getMultiLeagueContext();
    if (context.hasLeagues) {
      console.log(`Multi-league mode active: ${context.leagueCount} leagues, active: ${context.activeLeagueData?.name || 'None'}`);
    } else {
      console.log('Solo mode active');
    }
  } catch (error) {
    console.error('Failed to initialize league integration:', error);
  }
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeLeagueIntegration);
} else {
  initializeLeagueIntegration();
}