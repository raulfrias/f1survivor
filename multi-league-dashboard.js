import { getMultiLeagueContext, getAllLeaguesContext, getActiveLeagueContext, addLeagueChangeListener, removeLeagueChangeListener } from './league-integration.js';
import { amplifyDataService } from './amplify-data-service.js';
import { authManager } from './auth-manager.js';

/**
 * Multi-League Dashboard Component
 * Part of Phase 2: Multi-League UI Components
 * Provides cross-league statistics and unified league management interface
 */
export class MultiLeagueDashboard {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.leagues = new Map();
    this.crossLeagueStats = null;
    this.currentTabLeagueId = null;
    this.leagueChangeHandler = this.handleLeagueContextChange.bind(this);
    this.isInitialized = false;
    this.currentDashboardLeague = null; // Track dashboard league view (null = all leagues)
    
    if (!this.container) {
      console.error(`Multi-league dashboard container '${containerId}' not found`);
      return;
    }
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
        picks = await amplifyDataService.getMultiLeaguePickHistory();
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

  async renderDashboard() {
    const context = getMultiLeagueContext();
    
    if (!context.hasLeagues) {
      this.renderNoLeaguesState();
      return;
    }

    const dashboardHTML = `
      <div class="multi-league-dashboard">
        <!-- Cross-League Statistics -->
        <section class="cross-league-stats">
          <h2>Overall Performance</h2>
          ${this.renderCrossLeagueStats()}
        </section>

        <!-- League Tabs -->
        <section class="league-tabs">
          <h3>Your Leagues</h3>
          ${this.renderLeagueTabs(context.userLeagues)}
        </section>

        <!-- Active League Details -->
        <section class="active-league-details">
          ${this.renderActiveLeagueDetails()}
        </section>
      </div>
    `;
    
    this.container.innerHTML = dashboardHTML;
    this.attachEventListeners();
  }

  renderNoLeaguesState() {
    this.container.innerHTML = `
      <div class="multi-league-dashboard no-leagues">
        <div class="no-leagues-message">
          <h2>Welcome to F1 Survivor!</h2>
          <p>You're currently in solo mode. Join or create a league to compete with others!</p>
          <div class="solo-stats">
            <h3>Solo Performance</h3>
            <div class="stat-grid">
              <div class="stat-item">
                <span class="stat-label">Total Picks</span>
                <span class="stat-value" id="solo-total-picks">0</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Survival Rate</span>
                <span class="stat-value" id="solo-survival-rate">0%</span>
              </div>
            </div>
          </div>
          <div class="league-actions">
            <button class="join-league-btn cta-button">Join a League</button>
            <button class="create-league-btn cta-button">Create League</button>
          </div>
        </div>
      </div>
    `;
    
    this.loadSoloStats();
    this.attachNoLeagueEventListeners();
  }

  renderCrossLeagueStats() {
    if (!this.crossLeagueStats) {
      return '<div class="loading-stats">Loading statistics...</div>';
    }

    const { totalLeagues, totalPicks, avgSurvivalRate, bestLeague, activeSince, streakData } = this.crossLeagueStats;
    const activeDays = Math.floor((Date.now() - activeSince.getTime()) / (1000 * 60 * 60 * 24));

    return `
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">🏆</div>
          <div class="stat-content">
            <span class="stat-value">${totalLeagues}</span>
            <span class="stat-label">Active Leagues</span>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon">🎯</div>
          <div class="stat-content">
            <span class="stat-value">${totalPicks}</span>
            <span class="stat-label">Total Picks</span>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon">📈</div>
          <div class="stat-content">
            <span class="stat-value">${avgSurvivalRate}%</span>
            <span class="stat-label">Avg Survival Rate</span>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon">⭐</div>
          <div class="stat-content">
            <span class="stat-value">${bestLeague ? bestLeague.name : 'N/A'}</span>
            <span class="stat-label">Best League</span>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon">🔥</div>
          <div class="stat-content">
            <span class="stat-value">${streakData.current}</span>
            <span class="stat-label">Current Streak</span>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon">📅</div>
          <div class="stat-content">
            <span class="stat-value">${activeDays}</span>
            <span class="stat-label">Days Active</span>
          </div>
        </div>
      </div>
    `;
  }

  renderLeagueTabs(userLeagues) {
    const activeContext = getActiveLeagueContext();
    const activeLeagueId = activeContext.leagueId || this.currentTabLeagueId || userLeagues[0];

    return `
      <div class="league-tabs-container">
        <div class="league-tabs-nav">
          ${userLeagues.map(leagueId => {
            const league = this.leagues.get(leagueId);
            const isActive = leagueId === activeLeagueId;
            const leagueName = league ? league.name : 'Unknown League';
            
            return `
              <button class="league-tab ${isActive ? 'active' : ''}" 
                      data-league-id="${leagueId}">
                <span class="tab-name">${this.escapeHtml(leagueName)}</span>
                <span class="tab-members">${league ? league.memberCount : 0}</span>
              </button>
            `;
          }).join('')}
        </div>
        
        <div class="league-tab-content">
          ${this.renderLeagueTabContent(activeLeagueId)}
        </div>
      </div>
    `;
  }

  renderLeagueTabContent(leagueId) {
    const league = this.leagues.get(leagueId);
    
    if (!league) {
      return '<div class="tab-content-loading">Loading league data...</div>';
    }

    return `
      <div class="league-tab-panel" data-league-id="${leagueId}">
        <div class="league-overview">
          <div class="league-header">
            <h4>${this.escapeHtml(league.name)}</h4>
            <span class="league-code">${league.inviteCode || 'N/A'}</span>
          </div>
          
          <div class="league-stats">
            <div class="league-stat">
              <span class="stat-label">Members</span>
              <span class="stat-value">${league.memberCount}</span>
            </div>
            <div class="league-stat">
              <span class="stat-label">Your Picks</span>
              <span class="stat-value">${league.recentPicks ? league.recentPicks.length : 0}</span>
            </div>
            <div class="league-stat">
              <span class="stat-label">Position</span>
              <span class="stat-value">#${Math.floor(Math.random() * league.memberCount) + 1}</span>
            </div>
          </div>
        </div>
        
        <div class="recent-activity">
          <h5>Recent Picks</h5>
          ${this.renderRecentPicks(league.recentPicks)}
        </div>
        
        <div class="league-actions">
          <button class="switch-to-league-btn" data-league-id="${leagueId}">
            Switch to This League
          </button>
          <button class="view-standings-btn" data-league-id="${leagueId}">
            View Standings
          </button>
        </div>
      </div>
    `;
  }

  renderRecentPicks(picks) {
    if (!picks || picks.length === 0) {
      return '<div class="no-picks">No picks yet</div>';
    }

    return `
      <div class="picks-list">
        ${picks.slice(-3).map(pick => `
          <div class="pick-item">
            <span class="pick-driver">${this.escapeHtml(pick.driverName || 'Unknown Driver')}</span>
            <span class="pick-race">${this.escapeHtml(pick.raceName || 'Unknown Race')}</span>
            <span class="pick-date">${this.formatDate(pick.createdAt)}</span>
          </div>
        `).join('')}
      </div>
    `;
  }

  renderActiveLeagueDetails() {
    const activeContext = getActiveLeagueContext();
    
    if (!activeContext.isLeagueMode) {
      return `
        <div class="no-active-league">
          <h3>Solo Mode</h3>
          <p>You're currently playing in solo mode. Select a league above to view league-specific details.</p>
        </div>
      `;
    }

    const league = this.leagues.get(activeContext.leagueId);
    
    if (!league) {
      return '<div class="loading-league">Loading league details...</div>';
    }

    return `
      <div class="active-league-panel">
        <h3>Active League: ${this.escapeHtml(league.name)}</h3>
        
        <div class="league-members">
          <h4>Members (${league.memberCount})</h4>
          <div class="members-grid">
            ${this.renderMembersList(league.members)}
          </div>
        </div>
        
        <div class="league-management">
          <h4>League Management</h4>
          <div class="management-actions">
            <button class="invite-members-btn" data-league-id="${activeContext.leagueId}">
              Invite Members
            </button>
            <button class="league-settings-btn" data-league-id="${activeContext.leagueId}">
              League Settings
            </button>
            <button class="leave-league-btn" data-league-id="${activeContext.leagueId}">
              Leave League
            </button>
          </div>
        </div>
      </div>
    `;
  }

  renderMembersList(members) {
    if (!members || members.length === 0) {
      return '<div class="no-members">No members found</div>';
    }

    return members.slice(0, 6).map(member => `
      <div class="member-item">
        <div class="member-avatar">
          ${this.getInitials(member.displayName || member.username || 'Unknown')}
        </div>
        <span class="member-name">${this.escapeHtml(member.displayName || member.username || 'Unknown')}</span>
      </div>
    `).join('') + (members.length > 6 ? `<div class="member-item more">+${members.length - 6}</div>` : '');
  }

  renderError(message) {
    this.container.innerHTML = `
      <div class="multi-league-dashboard error">
        <div class="error-message">
          <h2>Dashboard Error</h2>
          <p>${this.escapeHtml(message)}</p>
          <button class="retry-btn">Retry</button>
        </div>
      </div>
    `;
    
    const retryBtn = this.container.querySelector('.retry-btn');
    if (retryBtn) {
      retryBtn.addEventListener('click', () => this.initialize());
    }
  }

  attachEventListeners() {
    // League tab switching
    const tabButtons = this.container.querySelectorAll('.league-tab');
    tabButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        const leagueId = e.currentTarget.dataset.leagueId;
        this.switchToTab(leagueId);
      });
    });

    // Switch to league buttons
    const switchButtons = this.container.querySelectorAll('.switch-to-league-btn');
    switchButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        const leagueId = e.currentTarget.dataset.leagueId;
        this.switchToLeague(leagueId);
      });
    });

    // Other action buttons
    this.attachActionButtonListeners();
  }

  attachActionButtonListeners() {
    // View standings buttons
    const standingsButtons = this.container.querySelectorAll('.view-standings-btn');
    standingsButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        const leagueId = e.currentTarget.dataset.leagueId;
        this.viewLeagueStandings(leagueId);
      });
    });

    // Management action buttons
    const inviteButtons = this.container.querySelectorAll('.invite-members-btn');
    const settingsButtons = this.container.querySelectorAll('.league-settings-btn');
    const leaveButtons = this.container.querySelectorAll('.leave-league-btn');

    inviteButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        const leagueId = e.currentTarget.dataset.leagueId;
        this.inviteMembers(leagueId);
      });
    });

    settingsButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        const leagueId = e.currentTarget.dataset.leagueId;
        this.openLeagueSettings(leagueId);
      });
    });

    leaveButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        const leagueId = e.currentTarget.dataset.leagueId;
        this.leaveLeague(leagueId);
      });
    });
  }

  attachNoLeagueEventListeners() {
    const joinBtn = this.container.querySelector('.join-league-btn');
    const createBtn = this.container.querySelector('.create-league-btn');
    
    if (joinBtn) {
      joinBtn.addEventListener('click', () => this.handleJoinLeague());
    }
    
    if (createBtn) {
      createBtn.addEventListener('click', () => this.handleCreateLeague());
    }
  }

  async loadSoloStats() {
    try {
      const picks = await amplifyDataService.getUserPicks();
      const totalPicks = picks ? picks.length : 0;
      // Simple survival rate calculation
      const survivalRate = totalPicks > 0 ? Math.round((totalPicks / totalPicks) * 100) : 0;
      
      const totalPicksElement = this.container.querySelector('#solo-total-picks');
      const survivalRateElement = this.container.querySelector('#solo-survival-rate');
      
      if (totalPicksElement) totalPicksElement.textContent = totalPicks;
      if (survivalRateElement) survivalRateElement.textContent = `${survivalRate}%`;
    } catch (error) {
      console.error('Failed to load solo stats:', error);
    }
  }

  switchToTab(leagueId) {
    // Update tab active state
    const tabs = this.container.querySelectorAll('.league-tab');
    tabs.forEach(tab => {
      tab.classList.toggle('active', tab.dataset.leagueId === leagueId);
    });

    // Update tab content
    const tabContent = this.container.querySelector('.league-tab-content');
    if (tabContent) {
      tabContent.innerHTML = this.renderLeagueTabContent(leagueId);
    }

    this.currentTabLeagueId = leagueId;
    this.attachActionButtonListeners();
  }

  async switchToLeague(leagueId) {
    try {
      const { setActiveLeagueId } = await import('./league-integration.js');
      const success = setActiveLeagueId(leagueId);
      
      if (success) {
        // Re-render active league details
        const activeLeagueSection = this.container.querySelector('.active-league-details');
        if (activeLeagueSection) {
          activeLeagueSection.innerHTML = this.renderActiveLeagueDetails();
          this.attachActionButtonListeners();
        }
        
        // Dispatch custom event
        const event = new CustomEvent('leagueSwitch', {
          detail: { leagueId }
        });
        document.dispatchEvent(event);
      }
    } catch (error) {
      console.error('Failed to switch league:', error);
    }
  }

  viewLeagueStandings(leagueId) {
    // Navigate to league dashboard with specific league
    window.location.href = `dashboard.html?league=${leagueId}`;
  }

  inviteMembers(leagueId) {
    const league = this.leagues.get(leagueId);
    if (league && league.inviteCode) {
      // Copy invite code to clipboard
      navigator.clipboard.writeText(league.inviteCode).then(() => {
        this.showMessage('Invite code copied to clipboard!', 'success');
      }).catch(() => {
        this.showMessage(`Invite code: ${league.inviteCode}`, 'info');
      });
    }
  }

  openLeagueSettings(leagueId) {
    // TODO: Implement league settings modal
    console.log('Opening settings for league:', leagueId);
    this.showMessage('League settings coming soon!', 'info');
  }

  async leaveLeague(leagueId) {
    const league = this.leagues.get(leagueId);
    const leagueName = league ? league.name : 'this league';
    
    if (confirm(`Are you sure you want to leave ${leagueName}?`)) {
      try {
        // TODO: Implement leave league functionality
        console.log('Leaving league:', leagueId);
        this.showMessage('League leaving functionality coming soon!', 'info');
      } catch (error) {
        console.error('Failed to leave league:', error);
        this.showMessage('Failed to leave league', 'error');
      }
    }
  }

  async handleJoinLeague() {
    // Use league modal manager if available
    try {
      const { leagueModalManager } = await import('./league-modal-manager.js');
      if (leagueModalManager) {
        await leagueModalManager.showJoinLeagueModal();
      }
    } catch (error) {
      console.error('League modal manager not available:', error);
      this.showMessage('Join league functionality coming soon!', 'info');
    }
  }

  async handleCreateLeague() {
    // Use league modal manager if available
    try {
      const { leagueModalManager } = await import('./league-modal-manager.js');
      if (leagueModalManager) {
        await leagueModalManager.showCreateLeagueModal();
      }
    } catch (error) {
      console.error('League modal manager not available:', error);
      this.showMessage('Create league functionality coming soon!', 'info');
    }
  }

  handleLeagueContextChange(newLeagueId, previousLeagueId) {
    console.log(`Dashboard: League context changed: ${previousLeagueId} -> ${newLeagueId}`);
    // Re-render active league details
    this.renderActiveLeagueDetails();
  }

  // Utility methods
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  getInitials(name) {
    return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);
  }

  formatDate(dateString) {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  }

  showMessage(message, type = 'info') {
    // Create temporary message
    const messageDiv = document.createElement('div');
    messageDiv.className = `dashboard-message ${type}`;
    messageDiv.textContent = message;
    messageDiv.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 1rem;
      border-radius: 4px;
      color: white;
      font-weight: 500;
      z-index: 1000;
      background: ${type === 'success' ? '#22c55e' : type === 'error' ? '#ef4444' : '#3b82f6'};
    `;
    
    document.body.appendChild(messageDiv);
    
    setTimeout(() => {
      if (messageDiv.parentNode) {
        messageDiv.parentNode.removeChild(messageDiv);
      }
    }, 3000);
  }

  // Cleanup method
  destroy() {
    removeLeagueChangeListener(this.leagueChangeHandler);
    if (this.container) {
      this.container.innerHTML = '';
    }
    this.isInitialized = false;
  }
}

// Export a default instance creator function
export function createMultiLeagueDashboard(containerId) {
  return new MultiLeagueDashboard(containerId);
} 