import { amplifyDataService } from './amplify-data-service.js';
import { authManager } from './auth-manager.js';

/**
 * Multi-League Dashboard Component
 * Part of Phase 2: Multi-League UI Components
 * Provides cross-league statistics and unified league management interface
 */
export class MultiLeagueDashboard {
  constructor() {
    this.leagues = new Map();
    this.crossLeagueStats = null;
    this.currentDashboardLeague = null; // Track dashboard league view (null = all leagues)
    this.isInitialized = false;
  }

  async initialize() {
    if (this.isInitialized) return;
    
    try {
      console.log('🏆 Initializing multi-league dashboard...');
      
      // Check if user is authenticated
      const isAuthenticated = await authManager.isAuthenticated();
      if (!isAuthenticated) {
        console.log('🏆 User not authenticated, showing solo dashboard');
        this.showSoloDashboard();
        return;
      }

      // Get multi-league context
      const context = window.multiLeagueContext ? window.multiLeagueContext.getMultiLeagueContext() : null;
      
      if (!context || context.leagueCount === 0) {
        console.log('🏆 No leagues found, showing solo dashboard');
        this.showSoloDashboard();
        return;
      }

      console.log(`🏆 Enhancing dashboard for ${context.leagueCount} leagues`);
      await this.enhanceExistingDashboard(context);
      this.isInitialized = true;
      
    } catch (error) {
      console.error('Failed to initialize multi-league dashboard:', error);
      this.showSoloDashboard();
    }
  }

  showSoloDashboard() {
    // Hide multi-league elements, show solo mode
    const crossLeagueSection = document.getElementById('cross-league-overview');
    const dashboardTabs = document.getElementById('dashboard-league-tabs');
    
    if (crossLeagueSection) crossLeagueSection.style.display = 'none';
    if (dashboardTabs) dashboardTabs.style.display = 'none';
    
    // Update player status for solo mode
    this.updatePlayerStatusForSolo();
  }

  async enhanceExistingDashboard(context) {
    // Add cross-league stats section
    await this.addCrossLeagueStatsSection(context);
    
    // Add league dashboard tabs
    this.addLeagueDashboardTabs(context);
    
    // Enhance existing sections
    await this.enhancePickHistoryForLeagues(context);
    this.enhancePlayerStatusForLeagues(context);
    
    // Set up event listeners
    this.setupDashboardTabEvents();
  }

  async addCrossLeagueStatsSection(context) {
    // Calculate cross-league statistics
    const stats = await this.calculateCrossLeagueStats(context);
    
    const crossLeagueHTML = `
      <div id="cross-league-overview" class="cross-league-overview">
        <h2>Performance Across All Leagues</h2>
        <div class="cross-league-stats-grid">
          <div class="stat-card">
            <span class="stat-value">${stats.totalLeagues}</span>
            <span class="stat-label">Active Leagues</span>
          </div>
          <div class="stat-card">
            <span class="stat-value">${stats.overallSurvivalRate}%</span>
            <span class="stat-label">Overall Survival Rate</span>
          </div>
          <div class="stat-card">
            <span class="stat-value">${stats.bestLeague}</span>
            <span class="stat-label">Best Performing League</span>
          </div>
          <div class="stat-card">
            <span class="stat-value">${stats.totalPicks}</span>
            <span class="stat-label">Total Picks Made</span>
          </div>
        </div>
      </div>
    `;

    // Insert before the dashboard top row
    const dashboardContainer = document.querySelector('.dashboard-container');
    const topRow = document.querySelector('.dashboard-top-row');
    
    if (dashboardContainer && topRow) {
      topRow.insertAdjacentHTML('beforebegin', crossLeagueHTML);
    }
  }

  addLeagueDashboardTabs(context) {
    const activeLeague = context.activeLeagueData;
    const userLeagues = context.userLeagues || [];
    
    const tabsHTML = `
      <div id="dashboard-league-tabs" class="dashboard-league-tabs">
        <button class="dashboard-tab ${this.currentDashboardLeague === null ? 'active' : ''}" data-league="all">
          All Leagues
        </button>
        ${userLeagues.map(league => `
          <button class="dashboard-tab ${this.currentDashboardLeague === league.leagueId ? 'active' : ''}" 
                  data-league="${league.leagueId}">
            ${league.name}
          </button>
        `).join('')}
      </div>
    `;

    // Insert after cross-league overview
    const crossLeagueSection = document.getElementById('cross-league-overview');
    if (crossLeagueSection) {
      crossLeagueSection.insertAdjacentHTML('afterend', tabsHTML);
    }
  }

  async enhancePickHistoryForLeagues(context) {
    const pickHistorySection = document.querySelector('.pick-history-section h2');
    if (!pickHistorySection) return;

    // Update pick history title to show current league context
    const activeLeague = context.activeLeagueData;
    const leagueName = this.currentDashboardLeague === null ? 'All Leagues' : 
                     (activeLeague ? activeLeague.name : 'Current League');
    
    pickHistorySection.innerHTML = `Pick History - <span id="dashboard-league-name">${leagueName}</span>`;
    
    // Refresh pick history based on current dashboard league filter
    await this.refreshPickHistory();
  }

  enhancePlayerStatusForLeagues(context) {
    const playerNameElement = document.querySelector('.player-name');
    const statusElement = document.querySelector('.survival-status');
    
    if (playerNameElement && context.leagueCount > 0) {
      // Show league context in player status
      const activeLeague = context.activeLeagueData;
      if (activeLeague && this.currentDashboardLeague !== null) {
        playerNameElement.textContent = `${playerNameElement.textContent} - ${activeLeague.name}`;
      }
    }
  }

  updatePlayerStatusForSolo() {
    const playerNameElement = document.querySelector('.player-name');
    if (playerNameElement) {
      // Reset to simple player name for solo mode
      playerNameElement.textContent = 'Player 1';
    }
  }

  setupDashboardTabEvents() {
    const tabs = document.querySelectorAll('.dashboard-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', async (e) => {
        const leagueId = e.target.dataset.league;
        await this.switchDashboardLeague(leagueId === 'all' ? null : leagueId);
      });
    });
  }

  async switchDashboardLeague(leagueId) {
    console.log(`🏆 Switching dashboard view to league: ${leagueId || 'all'}`);
    
    this.currentDashboardLeague = leagueId;
    
    // Update active tab
    document.querySelectorAll('.dashboard-tab').forEach(tab => {
      const tabLeagueId = tab.dataset.league === 'all' ? null : tab.dataset.league;
      tab.classList.toggle('active', tabLeagueId === leagueId);
    });
    
    // Update dashboard content for selected league
    await this.refreshDashboardForLeague(leagueId);
  }

  async refreshDashboardForLeague(leagueId) {
    // Update pick history for selected league
    await this.refreshPickHistory();
    
    // Update league name in pick history title
    const leagueNameElement = document.getElementById('dashboard-league-name');
    if (leagueNameElement) {
      if (leagueId === null) {
        leagueNameElement.textContent = 'All Leagues';
      } else {
        const context = window.multiLeagueContext ? window.multiLeagueContext.getMultiLeagueContext() : null;
        const league = context?.userLeagues?.find(l => l.leagueId === leagueId);
        leagueNameElement.textContent = league ? league.name : 'Current League';
      }
    }
    
    console.log(`✅ Dashboard refreshed for league: ${leagueId || 'all'}`);
  }

  async refreshPickHistory() {
    try {
      // Get picks based on current dashboard league filter
      let picks;
      if (this.currentDashboardLeague === null) {
        // Show all picks across all leagues
        const multiLeagueHistory = await amplifyDataService.getMultiLeaguePickHistory();
        picks = multiLeagueHistory.byLeague ? 
          Object.values(multiLeagueHistory.byLeague).flatMap(league => league.picks || []) : [];
      } else {
        // Show picks for specific league
        picks = await amplifyDataService.getUserPicks(null, this.currentDashboardLeague);
      }

      // Update pick history display
      this.updatePickHistoryDisplay(picks);
      
    } catch (error) {
      console.error('Failed to refresh pick history:', error);
    }
  }

  updatePickHistoryDisplay(picks) {
    const pickHistoryBody = document.getElementById('pick-history-body');
    const noPicksMessage = document.getElementById('no-picks-message');
    
    if (!pickHistoryBody) return;

    if (!picks || picks.length === 0) {
      if (noPicksMessage) {
        noPicksMessage.style.display = 'block';
        noPicksMessage.innerHTML = this.currentDashboardLeague === null ? 
          'No picks made yet across any leagues. <a href="index.html">Make your first pick!</a>' :
          'No picks made in this league yet. <a href="index.html">Make your first pick!</a>';
      }
      // Clear any existing pick rows
      const existingRows = pickHistoryBody.querySelectorAll('.pick-row');
      existingRows.forEach(row => row.remove());
      return;
    }

    // Hide no picks message
    if (noPicksMessage) {
      noPicksMessage.style.display = 'none';
    }

    // Clear existing pick rows
    const existingRows = pickHistoryBody.querySelectorAll('.pick-row');
    existingRows.forEach(row => row.remove());

    // Add pick rows
    picks.forEach(pick => {
      const pickRow = this.createPickHistoryRow(pick);
      pickHistoryBody.appendChild(pickRow);
    });
  }

  createPickHistoryRow(pick) {
    const row = document.createElement('div');
    row.className = 'pick-row';
    
    // Show league name in multi-league view
    const leagueInfo = this.currentDashboardLeague === null && pick.leagueName ? 
      ` (${pick.leagueName})` : '';
    
    row.innerHTML = `
      <div class="pick-cell">${pick.raceName || pick.raceId}${leagueInfo}</div>
      <div class="pick-cell">${pick.driverName}</div>
      <div class="pick-cell">${pick.finalPosition || 'TBD'}</div>
      <div class="pick-cell">
        <span class="status-badge ${pick.survived !== false ? 'survived' : 'eliminated'}">
          ${pick.survived !== false ? 'Survived' : 'Eliminated'}
        </span>
      </div>
    `;
    
    return row;
  }

  async calculateCrossLeagueStats(context) {
    try {
      const stats = await amplifyDataService.getCrossLeagueStatistics();
      
      return {
        totalLeagues: context.leagueCount,
        overallSurvivalRate: stats?.overallSurvivalRate || 0,
        bestLeague: stats?.bestLeague || 'N/A',
        totalPicks: stats?.totalPicks || 0
      };
    } catch (error) {
      console.error('Failed to calculate cross-league stats:', error);
      return {
        totalLeagues: context.leagueCount,
        overallSurvivalRate: 0,
        bestLeague: 'N/A',
        totalPicks: 0
      };
    }
  }

  // Public method to refresh dashboard when league context changes
  async refresh() {
    if (!this.isInitialized) return;
    
    const context = window.multiLeagueContext ? window.multiLeagueContext.getMultiLeagueContext() : null;
    if (context && context.leagueCount > 0) {
      await this.enhanceExistingDashboard(context);
    } else {
      this.showSoloDashboard();
    }
  }
}

// Export singleton instance
export const multiLeagueDashboard = new MultiLeagueDashboard(); 