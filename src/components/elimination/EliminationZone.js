// Elimination Zone Component - League Competition Display

import { 
  calculateDangerLevel, 
  formatEliminations, 
  getEliminationForecast,
  calculateLeagueStandings,
  generateStrategicRecommendations
} from '@/utils/EliminationUtils.js';
import { amplifyDataService } from '@/services/aws/AmplifyDataService.js';
import { leagueManager } from '@/services/league/LeagueManager.js';
import { authManager } from '@/services/auth/AuthManager.js';

class EliminationZone {
  constructor(containerElement) {
    this.container = containerElement;
    this.isExpanded = false;
    this.leagueData = null;
    this.userStatus = null;
    this.eliminations = null;
    this.standings = null;
    this.updateInterval = null;
    this.userId = 'user123'; // Default user ID for demo
  }

  async initialize(leagueId = null, userId = null) {
    try {
      console.log('Initializing Elimination Zone...');
      
      // Show loading state
      this.showLoading();
      
      // Wait for authentication to be properly established
      let user = null;
      let attempts = 0;
      const maxAttempts = 10;
      
      while (!user && attempts < maxAttempts) {
        user = await authManager.getCurrentUser();
        if (!user) {
          console.log(`Authentication attempt ${attempts + 1}/${maxAttempts} - waiting for auth...`);
          await new Promise(resolve => setTimeout(resolve, 500)); // Wait 500ms
          attempts++;
        }
      }
      
      if (!user) {
        console.log('Authentication timeout - user not authenticated');
        this.showError('Authentication required to view league data');
        return;
      }
      
      console.log('User authenticated:', user);
      this.userId = userId || user.userId || user.username;
      
      // Get active league if not provided
      if (!leagueId) {
        const activeLeague = await leagueManager.getActiveLeague();
        if (!activeLeague) {
          this.showError('No active league found. Please join or create a league.');
          return;
        }
        this.leagueId = activeLeague.leagueId;
      } else {
        this.leagueId = leagueId;
      }
      
      // Load real league data from AWS
      await this.loadRealData();
      
      // Render the component
      this.render();
      
      // Setup auto-refresh (every 30 seconds during active periods)
      this.setupAutoRefresh();
      
      console.log('Elimination Zone initialized successfully');
      
    } catch (error) {
      console.error('Failed to initialize Elimination Zone:', error);
      this.showError('Failed to load league data. Please try again.');
    }
  }

  async loadRealData() {
    try {
      // Get league details
      const league = await amplifyDataService.getLeague(this.leagueId);
      if (!league) {
        throw new Error('League not found');
      }
      
      // Get league members
      const members = await amplifyDataService.getLeagueMembers(this.leagueId);
      
      // Get league standings
      const standings = await leagueManager.getLeagueStandings(this.leagueId);
      
      // Get user's picks for this league
      const userPicks = await amplifyDataService.getUserPicks(this.userId, this.leagueId);
      
      // Calculate eliminations (for now, we'll use a simplified approach)
      // In a real implementation, this would be based on race results
      const eliminations = this.calculateEliminations(standings, userPicks);
      
      // Build league data structure
      this.leagueData = {
        leagueId: league.leagueId,
        leagueName: league.name,
        lastProcessedRace: {
          raceName: 'Bahrain Grand Prix', // TODO: Get from race results
          processedAt: new Date().toISOString()
        },
        eliminatedPlayers: eliminations.length,
        activePlayers: members.length - eliminations.length
      };
      
      this.userStatus = {
        userId: this.userId,
        isEliminated: eliminations.some(e => e.userId === this.userId),
        survivedRaces: userPicks.length,
        totalPicks: userPicks.length
      };
      
      this.eliminations = eliminations;
      this.standings = standings;
      
      console.log('Real league data loaded:', {
        leagueData: this.leagueData,
        userStatus: this.userStatus,
        eliminations: this.eliminations,
        standings: this.standings
      });
      
    } catch (error) {
      console.error('Failed to load real league data:', error);
      throw error;
    }
  }

  render() {
    if (!this.leagueData || !this.userStatus) {
      this.showError('No league data available');
      return;
    }

    this.container.innerHTML = `
      <div class="elimination-zone">
        ${this.renderHeader()}
        ${this.renderSimpleView()}
        ${this.isExpanded ? this.renderExpandedView() : ''}
        ${this.renderToggleButton()}
      </div>
    `;
    
    this.attachEventListeners();
  }

  renderHeader() {
    return `
      <div class="ez-header">
        <h3 class="ez-title">ELIMINATION ZONE</h3>
        <div class="ez-league-name">League: "${this.leagueData.leagueName}"</div>
      </div>
    `;
  }

  renderSimpleView() {
    const { lastProcessedRace } = this.leagueData;
    const { eliminatedPlayers, activePlayers } = this.leagueData;
    
    return `
      <div class="ez-simple-view">
        <div class="ez-last-race">
          Last Race • ${lastProcessedRace.raceName}
        </div>
        
        <div class="ez-elimination-count">
          ❌ <span class="eliminated">${eliminatedPlayers} ELIMINATED</span> / 
          <span class="remaining">${activePlayers} REMAINING</span>
        </div>
      </div>
    `;
  }

  renderExpandedView() {
    return `
      <div class="ez-expanded-view">
        ${this.renderEliminationDetails()}
        ${this.renderStandings()}
      </div>
    `;
  }

  renderEliminationDetails() {
    if (!this.eliminations || this.eliminations.length === 0) {
      return `
        <div class="ez-eliminations">
          <h4>❌ ELIMINATED (0 players)</h4>
          <p>No eliminations yet this season.</p>
        </div>
      `;
    }

    const formattedEliminations = formatEliminations(this.eliminations, this.userId);
    
    return `
      <div class="ez-eliminations">
        <h4>❌ ELIMINATED (${this.eliminations.length} players)</h4>
        ${formattedEliminations.map(e => `
          <div class="ez-elimination-item">
            <div class="ez-elimination-player-pick">
              <span class="ez-elimination-player">${e.username}</span>
              <span class="ez-elimination-pick">Picked: ${e.driverName}</span>
            </div>
            <div class="ez-elimination-position">${e.position}</div>
          </div>
        `).join('')}
      </div>
    `;
  }

  renderStandings() {
    const standings = calculateLeagueStandings(this.standings, this.userId);
    const topStandings = standings.slice(0, 5); // Show top 5
    const userStanding = standings.find(s => s.userId === this.userId);
    
    return `
      <div class="ez-standings">
        <h4>Remaining Players</h4>
        <div class="ez-standings-list">
          ${topStandings.map(standing => `
            <div class="ez-standing-item ${standing.isCurrentUser ? 'current-user' : ''}">
              <div class="ez-standing-rank">${standing.rank}</div>
              <div class="ez-standing-name-pick">
                <span class="ez-standing-name">${standing.username}</span>
                <span class="ez-standing-pick">Last: ${this.getLastPickForPlayer(standing.username)}</span>
              </div>
              <div class="ez-standing-stats">${standing.status}</div>
            </div>
          `).join('')}
          
          ${userStanding && userStanding.rank > 5 ? `
            <div class="ez-standing-item current-user">
              <div class="ez-standing-rank">${userStanding.rank}</div>
              <div class="ez-standing-name-pick">
                <span class="ez-standing-name">${userStanding.username}</span>
                <span class="ez-standing-pick">Last: ${this.getLastPickForPlayer(userStanding.username)}</span>
              </div>
              <div class="ez-standing-stats">${userStanding.status}</div>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }

  renderToggleButton() {
    return `
      <button class="ez-toggle-btn ${this.isExpanded ? 'expanded' : ''}">
        ${this.isExpanded ? '▲ Hide Details' : '▼ Show Elimination Details'}
      </button>
    `;
  }

  attachEventListeners() {
    const toggleBtn = this.container.querySelector('.ez-toggle-btn');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        this.isExpanded = !this.isExpanded;
        this.render();
      });
    }
  }

  showLoading() {
    this.container.innerHTML = `
      <div class="elimination-zone">
        <div class="ez-loading">
          <div class="ez-loading-spinner"></div>
          Loading league data...
        </div>
      </div>
    `;
  }

  showError(message) {
    this.container.innerHTML = `
      <div class="elimination-zone">
        <div class="ez-error">
          <h4>Error</h4>
          <p>${message}</p>
        </div>
      </div>
    `;
  }

  setupAutoRefresh() {
    // Refresh every 30 seconds during active periods
    this.updateInterval = setInterval(() => {
      if (this.shouldAutoRefresh()) {
        console.log('Auto-refreshing elimination zone...');
        this.refresh();
      }
    }, 30000);
  }

  shouldAutoRefresh() {
    // Only auto-refresh if race results might be updating
    const now = new Date();
    const lastRaceTime = new Date(this.leagueData.lastProcessedRace.processedAt);
    const timeSinceRace = now.getTime() - lastRaceTime.getTime();
    
    // Refresh for 2 hours after race processing
    return timeSinceRace < 2 * 60 * 60 * 1000;
  }

  async refresh() {
    try {
      await this.loadRealData();
      this.render();
    } catch (error) {
      console.error('Failed to refresh elimination zone:', error);
    }
  }

  getOrdinalSuffix(num) {
    const j = num % 10;
    const k = num % 100;
    if (j === 1 && k !== 11) return 'st';
    if (j === 2 && k !== 12) return 'nd';
    if (j === 3 && k !== 13) return 'rd';
    return 'th';
  }

  calculateEliminations(standings, userPicks) {
    // For now, return empty eliminations since we don't have race results yet
    // In a real implementation, this would be based on actual race results
    // and would check if drivers finished outside the top 10
    return [];
  }

  getLastPickForPlayer(username) {
    // Find the player's last pick from standings
    const player = this.standings.find(s => s.username === username);
    if (player && player.lastPick) {
      return player.lastPick.driverName;
    }
    return 'No pick';
  }

  destroy() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
  }
}

export default EliminationZone; 