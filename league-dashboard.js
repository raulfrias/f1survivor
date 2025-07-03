import { leagueManager } from './league-manager.js';
import { leagueModalManager } from './league-modal-manager.js';
import { amplifyDataService } from './amplify-data-service.js';
import { authManager } from './auth-manager.js';
import { loadPicksWithContext, savePickWithContext } from './league-integration.js';

export class LeagueDashboard {
  constructor() {
    this.leagueManager = leagueManager;
    this.modalManager = leagueModalManager;
    this.currentLeague = null;
  }

  async initialize() {
    // Check authentication first
    const isAuthenticated = await authManager.isAuthenticated();
    if (!isAuthenticated) {
      console.log('User not authenticated, skipping league dashboard initialization');
      return;
    }

    // Load current active league
    this.currentLeague = await this.leagueManager.getActiveLeague();
    
    // Add league selector to dashboard
    await this.renderLeagueSelector();
    
    // Update dashboard to show league-specific data if in league mode
    if (this.currentLeague) {
      await this.updateDashboardForLeague();
    }
  }

  async renderLeagueSelector() {
    // Find the dashboard header or create one
    const dashboardContainer = document.querySelector('.dashboard-container');
    if (!dashboardContainer) return;

    // Remove existing selector if present
    const existingSelector = document.querySelector('.league-selector-wrapper');
    if (existingSelector) {
      existingSelector.remove();
    }

    const userLeagues = await this.leagueManager.getUserLeagues();
    const activeLeagueId = await amplifyDataService.getActiveLeagueId();

    const selectorHTML = `
      <div class="league-selector-wrapper">
        <div class="league-selector">
          <label>Current Mode:</label>
          <select id="league-selector">
            <option value="" ${!activeLeagueId ? 'selected' : ''}>Solo Play</option>
            ${userLeagues.map(league => `
              <option value="${league.leagueId}" ${league.leagueId === activeLeagueId ? 'selected' : ''}>
                ${this.escapeHtml(league.name)}
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
      selector.addEventListener('change', async (e) => {
        const leagueId = e.target.value;
        
        if (leagueId) {
          await this.leagueManager.setActiveLeague(leagueId);
        } else {
          await this.leagueManager.setActiveLeague(null);
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

  async updateDashboardForLeague() {
    // Update page title or header to show league mode
    const dashboardTitle = document.querySelector('.dashboard-container h1');
    if (dashboardTitle && this.currentLeague) {
      dashboardTitle.innerHTML = `Dashboard - <span class="league-name">${this.escapeHtml(this.currentLeague.name)}</span>`;
    }

    // Update elimination zone to show league members (async)
    await this.updateEliminationZoneForLeague();
    
    // Update stats to be league-specific (async)
    await this.updateStatsForLeague();
  }

  async updateEliminationZoneForLeague() {
    if (!this.currentLeague) return;

    try {
      // Get league standings and settings
      const standings = await this.leagueManager.getLeagueStandings(this.currentLeague.leagueId);
      const leagueSettings = amplifyDataService.parseLeagueSettings(this.currentLeague);
      const livesEnabled = leagueSettings.livesEnabled || false;
      
      // Get lives status for all members if lives are enabled
      let membersLivesStatus = {};
      if (livesEnabled) {
        const members = await amplifyDataService.getLeagueMembers(this.currentLeague.leagueId);
        for (const member of members) {
          try {
            const livesStatus = await amplifyDataService.getMemberLivesStatus(this.currentLeague.leagueId, member.userId);
            if (livesStatus) {
              membersLivesStatus[member.userId] = livesStatus;
            }
          } catch (error) {
            console.warn(`Failed to get lives status for member ${member.userId}:`, error);
          }
        }
      }
      
      const user = await authManager.getCurrentUser();
      const currentUserId = user?.userId || user?.username;
      
      // Update the elimination zone component if it exists
      const eliminationZone = document.querySelector('.elimination-zone');
      if (eliminationZone) {
        // Find the players list
        const playersList = eliminationZone.querySelector('.players-container');
        if (playersList) {
          playersList.innerHTML = standings.map((player, index) => {
            const memberLives = membersLivesStatus[player.userId];
            const isEliminated = livesEnabled ? (memberLives?.remainingLives === 0) : player.isEliminated;
            
            return `
              <div class="player-card enhanced ${player.userId === currentUserId ? 'current-user' : ''} ${isEliminated ? 'eliminated' : ''}">
                <div class="player-rank ${isEliminated ? 'eliminated' : ''}">${index + 1}</div>
                <div class="player-info">
                  <h3>${this.escapeHtml(player.username)} ${player.isOwner ? '<span class="owner-badge">👑</span>' : ''}</h3>
                  <div class="player-stats">
                    <p class="races-survived">${player.survivedRaces} races survived</p>
                    ${livesEnabled && memberLives ? `
                      <div class="player-lives">
                        <span class="lives-label">Lives:</span>
                        <div class="lives-display-small">
                          ${this.generateLivesDisplayMini(memberLives.remainingLives, memberLives.maxLives)}
                        </div>
                        <span class="lives-count">${memberLives.remainingLives}/${memberLives.maxLives}</span>
                      </div>
                    ` : ''}
                    ${player.lastPick ? `<p class="last-pick">Last pick: ${player.lastPick.driverName}</p>` : ''}
                  </div>
                </div>
                <div class="player-status">
                  ${isEliminated ? '<div class="status eliminated">ELIMINATED</div>' : '<div class="status active">ACTIVE</div>'}
                </div>
              </div>
            `;
          }).join('');
        }

        // Update the title with lives information
        const zoneTitle = eliminationZone.querySelector('h2');
        if (zoneTitle) {
          const activeCount = standings.filter(s => {
            if (livesEnabled) {
              const memberLives = membersLivesStatus[s.userId];
              return memberLives?.remainingLives > 0;
            }
            return !s.isEliminated;
          }).length;
          
          const livesInfo = livesEnabled ? ` (${leagueSettings.maxLives} Lives System)` : '';
          zoneTitle.innerHTML = `League Standings - ${this.escapeHtml(this.currentLeague.name)}${livesInfo}`;
        }

        // Add summary statistics
        await this.addEliminationZoneSummary(standings, membersLivesStatus, livesEnabled);
      }
    } catch (error) {
      console.error('Failed to update elimination zone for league:', error);
    }
  }

  // Add summary statistics to elimination zone
  async addEliminationZoneSummary(standings, membersLivesStatus, livesEnabled) {
    const eliminationZone = document.querySelector('.elimination-zone');
    if (!eliminationZone) return;

    // Remove existing summary
    const existingSummary = eliminationZone.querySelector('.league-summary');
    if (existingSummary) {
      existingSummary.remove();
    }

    const totalMembers = standings.length;
    let activeMembers, eliminatedMembers;

    if (livesEnabled) {
      activeMembers = Object.values(membersLivesStatus).filter(status => status.remainingLives > 0).length;
      eliminatedMembers = Object.values(membersLivesStatus).filter(status => status.remainingLives === 0).length;
    } else {
      activeMembers = standings.filter(s => !s.isEliminated).length;
      eliminatedMembers = standings.filter(s => s.isEliminated).length;
    }

    const summaryHTML = `
      <div class="league-summary">
        <div class="summary-stats">
          <div class="summary-stat">
            <span class="stat-icon">👥</span>
            <span class="stat-label">Total Members</span>
            <span class="stat-value">${totalMembers}</span>
          </div>
          <div class="summary-stat active">
            <span class="stat-icon">🟢</span>
            <span class="stat-label">Active</span>
            <span class="stat-value">${activeMembers}</span>
          </div>
          <div class="summary-stat eliminated">
            <span class="stat-icon">🔴</span>
            <span class="stat-label">Eliminated</span>
            <span class="stat-value">${eliminatedMembers}</span>
          </div>
        </div>
      </div>
    `;

    // Insert summary after the title
    const zoneTitle = eliminationZone.querySelector('h2');
    if (zoneTitle) {
      zoneTitle.insertAdjacentHTML('afterend', summaryHTML);
    }
  }

  async updateStatsForLeague() {
    if (!this.currentLeague) return;

    try {
      // Get current user's picks for this league using AWS backend
      const userPicks = await amplifyDataService.getUserPicks(null, this.currentLeague.leagueId);
      const user = await authManager.getCurrentUser();
      const currentUserId = user?.userId || user?.username;
      
      // Get league settings for lives configuration
      const leagueSettings = amplifyDataService.parseLeagueSettings(this.currentLeague);
      const livesEnabled = leagueSettings.livesEnabled || false;
      
      // Get user's lives status if lives are enabled
      let userLivesStatus = null;
      if (livesEnabled) {
        userLivesStatus = await amplifyDataService.getMemberLivesStatus(this.currentLeague.leagueId, currentUserId);
      }
      
      // Update races survived stat
      const racesSurvivedElement = document.querySelector('[data-stat="races-survived"]');
      if (racesSurvivedElement) {
        racesSurvivedElement.textContent = userPicks.length;
      }

      // Update current standing in league
      const standings = await this.leagueManager.getLeagueStandings(this.currentLeague.leagueId);
      const userStanding = standings.findIndex(s => s.userId === currentUserId) + 1;
      
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

      // Add lives statistics if lives system is enabled
      if (livesEnabled && userLivesStatus) {
        await this.updateLivesStatistics(userLivesStatus, leagueSettings);
      }

      // Add league overview statistics
      await this.updateLeagueOverviewStats(standings, leagueSettings);
      
    } catch (error) {
      console.error('Failed to update league stats:', error);
    }
  }

  // Update lives-specific statistics
  async updateLivesStatistics(userLivesStatus, leagueSettings) {
    const statsGrid = document.querySelector('.stats-grid');
    if (!statsGrid) return;

    // Remove existing lives stats to avoid duplicates
    const existingLivesStats = statsGrid.querySelectorAll('[data-stat-type="lives"]');
    existingLivesStats.forEach(stat => stat.remove());

    // Current Lives stat card
    const livesCard = document.createElement('div');
    livesCard.className = 'stat-card lives-stat';
    livesCard.setAttribute('data-stat-type', 'lives');
    livesCard.innerHTML = `
      <div class="stat-icon">❤️</div>
      <div class="stat-content">
        <h3>Lives Remaining</h3>
        <p class="stat-value" data-stat="lives-remaining">${userLivesStatus.remainingLives}/${userLivesStatus.maxLives}</p>
        <div class="lives-display-mini">
          ${this.generateLivesDisplayMini(userLivesStatus.remainingLives, userLivesStatus.maxLives)}
        </div>
      </div>
    `;
    statsGrid.appendChild(livesCard);

    // Status card (Active/Eliminated)
    const statusCard = document.createElement('div');
    statusCard.className = `stat-card status-stat ${userLivesStatus.status.toLowerCase()}`;
    statusCard.setAttribute('data-stat-type', 'lives');
    statusCard.innerHTML = `
      <div class="stat-icon">${userLivesStatus.status === 'ACTIVE' ? '🟢' : '🔴'}</div>
      <div class="stat-content">
        <h3>Status</h3>
        <p class="stat-value status-${userLivesStatus.status.toLowerCase()}">${userLivesStatus.status}</p>
      </div>
    `;
    statsGrid.appendChild(statusCard);
  }

  // Update league overview statistics
  async updateLeagueOverviewStats(standings, leagueSettings) {
    const statsGrid = document.querySelector('.stats-grid');
    if (!statsGrid) return;

    // Remove existing overview stats
    const existingOverviewStats = statsGrid.querySelectorAll('[data-stat-type="league-overview"]');
    existingOverviewStats.forEach(stat => stat.remove());

    // Active members count
    const activeMembers = standings.filter(s => !s.isEliminated).length;
    const totalMembers = standings.length;

    const membersCard = document.createElement('div');
    membersCard.className = 'stat-card members-stat';
    membersCard.setAttribute('data-stat-type', 'league-overview');
    membersCard.innerHTML = `
      <div class="stat-icon">👥</div>
      <div class="stat-content">
        <h3>Active Members</h3>
        <p class="stat-value">${activeMembers}/${totalMembers}</p>
      </div>
    `;
    statsGrid.appendChild(membersCard);

    // Lives enabled indicator
    if (leagueSettings.livesEnabled) {
      const livesSystemCard = document.createElement('div');
      livesSystemCard.className = 'stat-card lives-system-stat';
      livesSystemCard.setAttribute('data-stat-type', 'league-overview');
      livesSystemCard.innerHTML = `
        <div class="stat-icon">💙</div>
        <div class="stat-content">
          <h3>Lives System</h3>
          <p class="stat-value">${leagueSettings.maxLives} Lives</p>
        </div>
      `;
      statsGrid.appendChild(livesSystemCard);
    }
  }

  // Generate mini lives display for stats
  generateLivesDisplayMini(remainingLives, maxLives) {
    let display = '';
    for (let i = 0; i < maxLives; i++) {
      if (i < remainingLives) {
        display += '<span class="life-mini remaining">❤️</span>';
      } else {
        display += '<span class="life-mini lost">🖤</span>';
      }
    }
    return display;
  }

  // Get pick context (league or solo) - AWS BACKEND
  async getPickContext() {
    const activeLeagueId = await amplifyDataService.getActiveLeagueId();
    return {
      isLeagueMode: !!activeLeagueId,
      leagueId: activeLeagueId,
      league: activeLeagueId ? await this.leagueManager.getLeague(activeLeagueId) : null
    };
  }

  // Save pick with league context - AWS BACKEND  
  async savePickWithContext(driverId, driverInfo) {
    // Use the league integration layer instead of direct methods
    return await savePickWithContext(driverId, driverInfo);
  }

  // Load picks with league context - AWS BACKEND
  async loadPicksWithContext() {
    // Use the league integration layer instead of direct methods
    return await loadPicksWithContext();
  }

  // Check if driver is already picked in current context - AWS BACKEND
  async isDriverAlreadyPickedInContext(driverId) {
    const context = await this.getPickContext();
    
    if (context.isLeagueMode) {
      return await amplifyDataService.isDriverAlreadyPicked(driverId, context.leagueId);
    } else {
      return await amplifyDataService.isDriverAlreadyPicked(driverId);
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