// Main dashboard JavaScript file

import { getDashboardData, getRaceName, formatDate, addTestDashboardData } from './dashboard-utils.js';
import EliminationZone from './elimination-zone.js';

// Dashboard state
let dashboardData = null;

/**
 * Initialize the dashboard
 */
async function initializeDashboard() {
  try {
    console.log('Initializing dashboard...');
    
    // Show loading overlay
    showLoading();
    
    // Add test data if needed (for demonstration)
    addTestDashboardData();
    
    // Load dashboard data
    dashboardData = await getDashboardData();
    console.log('Dashboard data loaded:', dashboardData);
    
    // Initialize Elimination Zone
    const eliminationZoneContainer = document.getElementById('elimination-zone-container');
    if (eliminationZoneContainer) {
      const eliminationZone = new EliminationZone(eliminationZoneContainer);
      await eliminationZone.initialize('league-demo', 'user123');
    }
    
    // Update all dashboard sections
    updatePlayerStatus(dashboardData.stats);
    updateSeasonProgress(dashboardData.stats);
    updatePickHistory(dashboardData.userPicks);
    
    // Hide loading overlay
    hideLoading();
    
    console.log('Dashboard initialized successfully');
  } catch (error) {
    console.error('Error initializing dashboard:', error);
    hideLoading();
    showError('Failed to load dashboard data. Please try refreshing the page.');
  }
}

/**
 * Update player status card
 * @param {Object} stats - Dashboard statistics
 */
function updatePlayerStatus(stats) {
  try {
    // Update survival status
    const survivalStatusElement = document.getElementById('survival-status');
    const statusIndicator = survivalStatusElement.querySelector('.status-indicator');
    const statusText = survivalStatusElement.querySelector('.status-text');
    
    // Remove existing status classes
    statusIndicator.classList.remove('alive', 'eliminated', 'pending');
    
    if (stats.playerStatus === 'ALIVE') {
      statusIndicator.classList.add('alive');
      statusText.textContent = 'ALIVE';
    } else {
      statusIndicator.classList.add('eliminated');
      statusText.textContent = 'ELIMINATED';
    }
    
    console.log('Player status updated');
  } catch (error) {
    console.error('Error updating player status:', error);
  }
}

/**
 * Update season progress card
 * @param {Object} stats - Dashboard statistics
 */
function updateSeasonProgress(stats) {
  try {
    // Update race counter
    document.getElementById('races-completed').textContent = stats.racesCompleted;
    document.getElementById('total-races').textContent = stats.totalRaces;
    
    // Update remaining drivers
    document.getElementById('remaining-drivers').textContent = stats.remainingDrivers;
    
    // Update next race (this would come from upcoming races data)
    const nextRaceElement = document.getElementById('next-race-name');
    if (nextRaceElement) {
      nextRaceElement.textContent = 'Australian GP'; // This would be dynamic
    }
    
    console.log('Season progress updated');
  } catch (error) {
    console.error('Error updating season progress:', error);
  }
}

/**
 * Update pick history section
 * @param {Array} userPicks - Array of user picks with results
 */
function updatePickHistory(userPicks) {
  try {
    const pickHistoryBody = document.getElementById('pick-history-body');
    const noPicksMessage = document.getElementById('no-picks-message');
    
    if (!userPicks || userPicks.length === 0) {
      noPicksMessage.style.display = 'block';
      return;
    }
    
    // Hide no picks message
    noPicksMessage.style.display = 'none';
    
    // Clear existing content
    pickHistoryBody.innerHTML = '';
    
    // Sort picks by timestamp (most recent first)
    const sortedPicks = [...userPicks].sort((a, b) => 
      new Date(b.timestamp) - new Date(a.timestamp)
    );
    
    // Create pick history rows
    sortedPicks.forEach(pick => {
      const row = createPickHistoryRow(pick);
      pickHistoryBody.appendChild(row);
    });
    
    console.log('Pick history updated');
  } catch (error) {
    console.error('Error updating pick history:', error);
  }
}

/**
 * Create a pick history row
 * @param {Object} pick - Pick object with results
 * @returns {HTMLElement} Pick history row element
 */
function createPickHistoryRow(pick) {
  const row = document.createElement('div');
  row.className = 'pick-history-row';
  
  // Race name cell
  const raceCell = document.createElement('div');
  raceCell.className = 'pick-history-cell';
  raceCell.innerHTML = `<span class="race-name">${getRaceName(pick.raceId)}</span>`;
  
  // Driver info cell
  const driverCell = document.createElement('div');
  driverCell.className = 'pick-history-cell';
  driverCell.innerHTML = `
    <div class="driver-info">
      <span class="driver-name">${pick.driverName || 'Unknown Driver'}</span>
      <span class="team-name">${pick.teamName || 'Unknown Team'}</span>
      ${pick.isAutoPick ? '<span class="auto-pick-indicator">AUTO</span>' : ''}
    </div>
  `;
  
  // Position cell
  const positionCell = document.createElement('div');
  positionCell.className = 'pick-history-cell';
  const position = pick.survivalStatus?.position || 'TBD';
  positionCell.innerHTML = `<span class="position">${position}</span>`;
  
  // Status cell
  const statusCell = document.createElement('div');
  statusCell.className = 'pick-history-cell';
  const status = pick.survivalStatus?.status || 'PENDING';
  const statusClass = status.toLowerCase();
  statusCell.innerHTML = `<span class="status-badge ${statusClass}">${status}</span>`;
  
  row.appendChild(raceCell);
  row.appendChild(driverCell);
  row.appendChild(positionCell);
  row.appendChild(statusCell);
  
  return row;
}

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

// Initialize dashboard when page loads
document.addEventListener('DOMContentLoaded', initializeDashboard);

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
  refreshDashboard,
  updatePlayerStatus,
  updateSeasonProgress,
  updatePickHistory
}; 