import { leagueManager } from './league-manager.js';
import { leagueModalManager } from './league-modal-manager.js';
import { leagueStorageManager } from './league-storage-manager.js';

export class LeagueDashboard {
  constructor() {
    this.leagueManager = leagueManager;
    this.modalManager = leagueModalManager;
    this.storageManager = leagueStorageManager;
    this.currentLeague = null;
  }

  async initialize() {
    // Load current active league
    this.currentLeague = this.leagueManager.getActiveLeague();
    
    // Add league selector to dashboard
    this.renderLeagueSelector();
    
    // Update dashboard to show league-specific data if in league mode
    if (this.currentLeague) {
      this.updateDashboardForLeague();
    }
  }

  renderLeagueSelector() {
    // Find the dashboard header or create one
    const dashboardContainer = document.querySelector('.dashboard-container');
    if (!dashboardContainer) return;

    // Remove existing selector if present
    const existingSelector = document.querySelector('.league-selector-wrapper');
    if (existingSelector) {
      existingSelector.remove();
    }

    const userLeagues = this.leagueManager.getUserLeagues();
    const activeLeagueId = this.storageManager.getActiveLeagueId();

    const selectorHTML = `
      <div class="league-selector-wrapper">
        <div class="league-selector">
          <label>Current Mode:</label>
          <select id="league-selector">
            <option value="" ${!activeLeagueId ? 'selected' : ''}>Solo Play</option>
            ${userLeagues.map(league => `
              <option value="${league.leagueId}" ${league.leagueId === activeLeagueId ? 'selected' : ''}>
                ${this.escapeHtml(league.leagueName)}
              </option>
            `).join('')}
          </select>
          <button id="manage-leagues-btn" class="manage-leagues-btn">
            <span class="icon">⚙️</span>
            Manage Leagues
          </button>
        </div>
      </div>
    `;

    // Insert at the top of dashboard
    dashboardContainer.insertAdjacentHTML('afterbegin', selectorHTML);
    
    this.attachSelectorEvents();
  }

  attachSelectorEvents() {
    const selector = document.getElementById('league-selector');
    const manageBtn = document.getElementById('manage-leagues-btn');

    if (selector) {
      selector.addEventListener('change', (e) => {
        const leagueId = e.target.value;
        
        if (leagueId) {
          this.leagueManager.setActiveLeague(leagueId);
        } else {
          this.leagueManager.setActiveLeague(null);
        }
        
        // Reload the page to update all components
        window.location.reload();
      });
    }

    if (manageBtn) {
      manageBtn.addEventListener('click', () => {
        this.modalManager.showManageLeaguesModal();
      });
    }
  }

  updateDashboardForLeague() {
    // Update page title or header to show league mode
    const dashboardTitle = document.querySelector('.dashboard-container h1');
    if (dashboardTitle && this.currentLeague) {
      dashboardTitle.innerHTML = `Dashboard - <span class="league-name">${this.escapeHtml(this.currentLeague.leagueName)}</span>`;
    }

    // Update elimination zone to show league members
    this.updateEliminationZoneForLeague();
    
    // Update stats to be league-specific
    this.updateStatsForLeague();
  }

  updateEliminationZoneForLeague() {
    if (!this.currentLeague) return;

    // Get league standings
    const standings = this.leagueManager.getLeagueStandings(this.currentLeague.leagueId);
    
    // Update the elimination zone component if it exists
    const eliminationZone = document.querySelector('.elimination-zone');
    if (eliminationZone) {
      // Find the players list
      const playersList = eliminationZone.querySelector('.players-container');
      if (playersList) {
        playersList.innerHTML = standings.map((player, index) => `
          <div class="player-card ${player.userId === this.leagueManager.currentUserId ? 'current-user' : ''} ${player.isEliminated ? 'eliminated' : ''}">
            <div class="player-rank">${index + 1}</div>
            <div class="player-info">
              <h3>${this.escapeHtml(player.username)} ${player.isOwner ? '<span class="owner-badge">Owner</span>' : ''}</h3>
              <p>${player.survivedRaces} races survived</p>
              ${player.lastPick ? `<p class="last-pick">Last pick: ${player.lastPick.driverName}</p>` : ''}
            </div>
            ${player.isEliminated ? '<div class="status eliminated">ELIMINATED</div>' : '<div class="status active">ACTIVE</div>'}
          </div>
        `).join('');
      }

      // Update the title
      const zoneTitle = eliminationZone.querySelector('h2');
      if (zoneTitle) {
        zoneTitle.textContent = `League Standings - ${this.currentLeague.leagueName}`;
      }
    }
  }

  updateStatsForLeague() {
    if (!this.currentLeague) return;

    // Get current user's picks for this league
    const userPicks = this.storageManager.loadLeaguePicks(this.currentLeague.leagueId);
    
    // Update races survived stat
    const racesSurvivedElement = document.querySelector('[data-stat="races-survived"]');
    if (racesSurvivedElement) {
      racesSurvivedElement.textContent = userPicks.length;
    }

    // Update current standing in league
    const standings = this.leagueManager.getLeagueStandings(this.currentLeague.leagueId);
    const userStanding = standings.findIndex(s => s.userId === this.leagueManager.currentUserId) + 1;
    
    const standingElement = document.querySelector('[data-stat="league-position"]');
    if (standingElement) {
      standingElement.textContent = `${userStanding}/${standings.length}`;
    } else {
      // Add league position stat if it doesn't exist
      const statsGrid = document.querySelector('.stats-grid');
      if (statsGrid) {
        const leaguePositionCard = document.createElement('div');
        leaguePositionCard.className = 'stat-card';
        leaguePositionCard.innerHTML = `
          <h3>League Position</h3>
          <p class="stat-value" data-stat="league-position">${userStanding}/${standings.length}</p>
        `;
        statsGrid.appendChild(leaguePositionCard);
      }
    }
  }

  // Get pick context (league or solo)
  getPickContext() {
    const activeLeagueId = this.storageManager.getActiveLeagueId();
    return {
      isLeagueMode: !!activeLeagueId,
      leagueId: activeLeagueId,
      league: activeLeagueId ? this.leagueManager.getLeague(activeLeagueId) : null
    };
  }

  // Save pick with league context
  async savePickWithContext(driverId, driverInfo) {
    const context = this.getPickContext();
    
    if (context.isLeagueMode) {
      return await this.storageManager.saveLeaguePick(context.leagueId, driverId, driverInfo);
    } else {
      // Use the existing solo pick saving method
      const { saveUserPicks } = await import('./storage-utils.js');
      return saveUserPicks(driverId, driverInfo);
    }
  }

  // Load picks with league context
  loadPicksWithContext() {
    const context = this.getPickContext();
    
    if (context.isLeagueMode) {
      return this.storageManager.loadLeaguePicks(context.leagueId);
    } else {
      // Use the existing solo pick loading method
      const { loadUserPicks } = window;
      return loadUserPicks();
    }
  }

  // Check if driver is already picked in current context
  isDriverAlreadyPickedInContext(driverId) {
    const context = this.getPickContext();
    
    if (context.isLeagueMode) {
      return this.storageManager.isDriverAlreadyPickedInLeague(driverId, context.leagueId);
    } else {
      // Use the existing solo check method
      const { isDriverAlreadyPicked } = window;
      return isDriverAlreadyPicked(driverId);
    }
  }

  // Utility: Escape HTML
  escapeHtml(unsafe) {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
}

// Export singleton instance
export const leagueDashboard = new LeagueDashboard();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    leagueDashboard.initialize();
  });
} else {
  leagueDashboard.initialize();
} 