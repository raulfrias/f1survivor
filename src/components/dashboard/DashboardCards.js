// DashboardCards.js - Improved dashboard card components with clear hierarchy
// Provides structured, scannable dashboard information with better visual organization

import { appStore } from '@/store/AppStore.js';
import ErrorHandler from '@/services/error/ErrorHandler.js';

export class DashboardCards {
  constructor() {
    this.cards = new Map();
    this.initialize();
  }
  
  initialize() {
    this.setupEventListeners();
  }
  
  setupEventListeners() {
    // Listen for app state changes to update cards
    appStore.subscribe((state) => {
      this.updateCardsFromState(state);
    });
  }
  
  // Create the main dashboard cards grid
  createCardsGrid(container) {
    if (!container) return;
    
    const state = appStore.getState();
    
    const cardsHTML = `
      <div class="dashboard-cards-grid">
        ${this.createCurrentPickCard(state)}
        ${this.createLeagueStatusCard(state)}
        ${this.createRaceScheduleCard(state)}
        ${this.createSeasonStatsCard(state)}
      </div>
    `;
    
    container.innerHTML = cardsHTML;
    this.attachCardEventListeners(container);
  }
  
  createCurrentPickCard(state) {
    const { user, activeLeague, currentPick, nextRace } = state;
    
    if (!user || !activeLeague) {
      return this.createEmptyCard('current-pick', '🏎️', 'Current Pick', 'Join a league to start making picks');
    }
    
    const hasActivePick = currentPick && currentPick.driver;
    const raceInfo = nextRace || { name: 'Next Race', deadline: 'TBD' };
    
    return `
      <div class="dashboard-card current-pick-card" data-card="current-pick">
        <div class="card-header">
          <div class="card-icon">🏎️</div>
          <div class="card-title-section">
            <h3 class="card-title">Current Pick</h3>
            <div class="card-subtitle">${raceInfo.name}</div>
          </div>
          <div class="card-status ${hasActivePick ? 'status-complete' : 'status-pending'}">
            ${hasActivePick ? '✅' : '⏳'}
          </div>
        </div>
        
        <div class="card-content">
          ${hasActivePick 
            ? this.renderActivePick(currentPick, raceInfo)
            : this.renderNoPick(raceInfo)
          }
        </div>
        
        <div class="card-actions">
          ${hasActivePick
            ? `<button class="btn secondary" data-action="change-pick">Change Pick</button>`
            : `<button class="btn primary" data-action="make-pick">Select Driver</button>`
          }
          <button class="btn ghost" data-action="view-history">Pick History</button>
        </div>
      </div>
    `;
  }
  
  renderActivePick(currentPick, raceInfo) {
    const { driver } = currentPick;
    
    return `
      <div class="active-pick-display">
        <div class="pick-driver-info">
          <div class="driver-avatar">
            <img src="${driver.imageUrl}" 
                 alt="${driver.name}"
                 onerror="this.src='/assets/images/drivers/default.svg'">
            <div class="driver-number" style="background: ${driver.teamColor}">${driver.number}</div>
          </div>
          <div class="driver-details">
            <div class="driver-name">${driver.name}</div>
            <div class="driver-team" style="color: ${driver.teamColor}">${driver.team}</div>
          </div>
        </div>
        
        <div class="pick-deadline-info">
          <div class="deadline-label">Can change until</div>
          <div class="deadline-time" id="pick-deadline-countdown">
            ${this.formatDeadline(raceInfo.deadline)}
          </div>
        </div>
      </div>
    `;
  }
  
  renderNoPick(raceInfo) {
    return `
      <div class="no-pick-display">
        <div class="no-pick-message">
          <div class="message-icon">🎯</div>
          <div class="message-text">Make your pick for ${raceInfo.name}</div>
        </div>
        
        <div class="pick-deadline-info">
          <div class="deadline-label">Deadline</div>
          <div class="deadline-time urgent" id="pick-deadline-countdown">
            ${this.formatDeadline(raceInfo.deadline)}
          </div>
        </div>
      </div>
    `;
  }
  
  createLeagueStatusCard(state) {
    const { user, activeLeague, leagueStandings } = state;
    
    if (!user || !activeLeague) {
      return this.createEmptyCard('league-status', '🏆', 'League Status', 'Join a league to compete with friends');
    }
    
    const userStanding = leagueStandings?.find(s => s.userId === user.id);
    const position = userStanding?.position || 'N/A';
    const totalMembers = leagueStandings?.length || 0;
    const isEliminated = userStanding?.status === 'eliminated';
    
    return `
      <div class="dashboard-card league-status-card" data-card="league-status">
        <div class="card-header">
          <div class="card-icon">🏆</div>
          <div class="card-title-section">
            <h3 class="card-title">${activeLeague.name}</h3>
            <div class="card-subtitle">${totalMembers} members</div>
          </div>
          <div class="card-status ${isEliminated ? 'status-eliminated' : 'status-active'}">
            ${isEliminated ? '❌' : '🏁'}
          </div>
        </div>
        
        <div class="card-content">
          <div class="league-standing-display">
            <div class="standing-position">
              <div class="position-number ${this.getPositionClass(position, totalMembers)}">${position}</div>
              <div class="position-label">of ${totalMembers}</div>
            </div>
            
            <div class="league-stats">
              <div class="stat">
                <span class="stat-label">Survival Rate</span>
                <span class="stat-value">${this.calculateSurvivalRate(userStanding)}%</span>
              </div>
              <div class="stat">
                <span class="stat-label">Races Left</span>
                <span class="stat-value">${userStanding?.racesRemaining || 0}</span>
              </div>
            </div>
          </div>
          
          ${isEliminated ? `
            <div class="elimination-notice">
              <span class="elimination-icon">💀</span>
              <span class="elimination-text">Eliminated in Race ${userStanding.eliminatedRace}</span>
            </div>
          ` : ''}
        </div>
        
        <div class="card-actions">
          <button class="btn primary" data-action="view-standings">Full Standings</button>
          <button class="btn ghost" data-action="league-details">League Info</button>
        </div>
      </div>
    `;
  }
  
  createRaceScheduleCard(state) {
    const { raceCalendar, nextRace, currentRace } = state;
    
    const upcomingRaces = raceCalendar?.upcoming?.slice(0, 3) || [];
    const activeRace = currentRace || nextRace;
    
    return `
      <div class="dashboard-card race-schedule-card" data-card="race-schedule">
        <div class="card-header">
          <div class="card-icon">🏁</div>
          <div class="card-title-section">
            <h3 class="card-title">Race Schedule</h3>
            <div class="card-subtitle">2025 Season</div>
          </div>
          <div class="card-status status-info">📅</div>
        </div>
        
        <div class="card-content">
          ${activeRace ? `
            <div class="next-race-highlight">
              <div class="race-info">
                <div class="race-name">${activeRace.name}</div>
                <div class="race-location">${activeRace.location}</div>
                <div class="race-date">${this.formatRaceDate(activeRace.date)}</div>
              </div>
              <div class="race-countdown">
                <div class="countdown-value" id="race-countdown">
                  ${this.formatCountdown(activeRace.date)}
                </div>
                <div class="countdown-label">until race</div>
              </div>
            </div>
          ` : ''}
          
          ${upcomingRaces.length > 0 ? `
            <div class="upcoming-races">
              <div class="upcoming-header">Next Races</div>
              <div class="upcoming-list">
                ${upcomingRaces.map(race => `
                  <div class="upcoming-race">
                    <div class="race-date">${this.formatShortDate(race.date)}</div>
                    <div class="race-name">${race.name}</div>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}
        </div>
        
        <div class="card-actions">
          <button class="btn primary" data-action="view-calendar">Full Calendar</button>
          <button class="btn ghost" data-action="race-info">Race Details</button>
        </div>
      </div>
    `;
  }
  
  createSeasonStatsCard(state) {
    const { user, seasonStats } = state;
    
    const stats = seasonStats || {
      correctPicks: 0,
      totalPicks: 0,
      bestFinish: 'N/A',
      racesEliminated: 0
    };
    
    const accuracy = stats.totalPicks > 0 
      ? Math.round((stats.correctPicks / stats.totalPicks) * 100)
      : 0;
    
    return `
      <div class="dashboard-card season-stats-card" data-card="season-stats">
        <div class="card-header">
          <div class="card-icon">📊</div>
          <div class="card-title-section">
            <h3 class="card-title">Season Stats</h3>
            <div class="card-subtitle">Your Performance</div>
          </div>
          <div class="card-status status-neutral">📈</div>
        </div>
        
        <div class="card-content">
          <div class="stats-grid">
            <div class="stat-item primary">
              <div class="stat-value">${accuracy}%</div>
              <div class="stat-label">Pick Accuracy</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">${stats.correctPicks}</div>
              <div class="stat-label">Successful Picks</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">${stats.bestFinish}</div>
              <div class="stat-label">Best Finish</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">${stats.racesEliminated}</div>
              <div class="stat-label">Times Eliminated</div>
            </div>
          </div>
          
          <div class="performance-indicator">
            <div class="performance-bar">
              <div class="performance-fill" style="width: ${accuracy}%"></div>
            </div>
            <div class="performance-text">
              ${this.getPerformanceText(accuracy)}
            </div>
          </div>
        </div>
        
        <div class="card-actions">
          <button class="btn primary" data-action="detailed-stats">Detailed Stats</button>
          <button class="btn ghost" data-action="compare-stats">Compare</button>
        </div>
      </div>
    `;
  }
  
  createEmptyCard(cardType, icon, title, message) {
    return `
      <div class="dashboard-card empty-card" data-card="${cardType}">
        <div class="card-header">
          <div class="card-icon">${icon}</div>
          <div class="card-title-section">
            <h3 class="card-title">${title}</h3>
          </div>
        </div>
        
        <div class="card-content">
          <div class="empty-state">
            <div class="empty-message">${message}</div>
          </div>
        </div>
        
        <div class="card-actions">
          ${cardType === 'current-pick' 
            ? `<button class="btn primary" data-action="join-league">Join League</button>`
            : cardType === 'league-status'
            ? `<button class="btn primary" data-action="join-league">Join League</button>`
            : `<button class="btn primary" data-action="get-started">Get Started</button>`
          }
        </div>
      </div>
    `;
  }
  
  attachCardEventListeners(container) {
    // Card action buttons
    container.addEventListener('click', (event) => {
      const actionBtn = event.target.closest('[data-action]');
      if (actionBtn) {
        event.preventDefault();
        const action = actionBtn.dataset.action;
        const card = actionBtn.closest('[data-card]');
        this.handleCardAction(action, card?.dataset.card);
      }
    });
    
    // Card click for navigation (excluding buttons)
    container.addEventListener('click', (event) => {
      const card = event.target.closest('.dashboard-card');
      const isButton = event.target.closest('button');
      
      if (card && !isButton) {
        this.handleCardClick(card.dataset.card);
      }
    });
  }
  
  async handleCardAction(action, cardType) {
    try {
      console.log('Handling card action:', action, 'for card:', cardType);
      
      switch (action) {
        case 'make-pick':
        case 'change-pick':
          window.location.href = '/driver-selection';
          break;
          
        case 'view-history':
          window.location.href = '/dashboard#pick-history';
          break;
          
        case 'view-standings':
          window.location.href = '/league-hub#standings';
          break;
          
        case 'league-details':
          // Show league details modal or navigate
          if (window.showLeagueDetailsModal) {
            window.showLeagueDetailsModal();
          }
          break;
          
        case 'view-calendar':
          window.location.href = '/race-calendar';
          break;
          
        case 'race-info':
          // Show race details modal
          if (window.showRaceDetailsModal) {
            window.showRaceDetailsModal();
          }
          break;
          
        case 'detailed-stats':
          window.location.href = '/dashboard#detailed-stats';
          break;
          
        case 'compare-stats':
          // Show stats comparison modal
          if (window.showStatsComparisonModal) {
            window.showStatsComparisonModal();
          }
          break;
          
        case 'join-league':
          if (window.showJoinLeagueModal) {
            window.showJoinLeagueModal();
          } else {
            window.location.href = '/league-hub#join';
          }
          break;
          
        case 'get-started':
          // Show onboarding flow
          if (window.showOnboardingFlow) {
            window.showOnboardingFlow();
          } else {
            window.location.href = '/league-hub';
          }
          break;
          
        default:
          console.warn('Unknown card action:', action);
      }
      
    } catch (error) {
      ErrorHandler.handle(error, {
        action: 'handleCardAction',
        cardAction: action,
        cardType
      });
    }
  }
  
  handleCardClick(cardType) {
    // Default navigation for card clicks
    switch (cardType) {
      case 'current-pick':
        window.location.href = '/driver-selection';
        break;
      case 'league-status':
        window.location.href = '/league-hub';
        break;
      case 'race-schedule':
        window.location.href = '/race-calendar';
        break;
      case 'season-stats':
        window.location.href = '/dashboard#stats';
        break;
    }
  }
  
  updateCardsFromState(state) {
    // Update dynamic content without full re-render
    this.updateCountdowns();
    this.updatePickStatus(state);
    this.updateLeagueStatus(state);
  }
  
  updateCountdowns() {
    // Update deadline countdowns
    const deadlineElements = document.querySelectorAll('#pick-deadline-countdown');
    deadlineElements.forEach(el => {
      const deadline = el.dataset.deadline;
      if (deadline) {
        el.textContent = this.formatDeadline(deadline);
      }
    });
    
    // Update race countdowns
    const raceCountdowns = document.querySelectorAll('#race-countdown');
    raceCountdowns.forEach(el => {
      const raceDate = el.dataset.raceDate;
      if (raceDate) {
        el.textContent = this.formatCountdown(raceDate);
      }
    });
  }
  
  updatePickStatus(state) {
    const { currentPick } = state;
    const pickCards = document.querySelectorAll('[data-card="current-pick"]');
    
    pickCards.forEach(card => {
      const statusEl = card.querySelector('.card-status');
      if (statusEl) {
        const hasActivePick = currentPick && currentPick.driver;
        statusEl.className = `card-status ${hasActivePick ? 'status-complete' : 'status-pending'}`;
        statusEl.textContent = hasActivePick ? '✅' : '⏳';
      }
    });
  }
  
  updateLeagueStatus(state) {
    const { activeLeague, leagueStandings } = state;
    if (!activeLeague) return;
    
    const leagueCards = document.querySelectorAll('[data-card="league-status"]');
    leagueCards.forEach(card => {
      const memberCountEl = card.querySelector('.card-subtitle');
      if (memberCountEl && leagueStandings) {
        memberCountEl.textContent = `${leagueStandings.length} members`;
      }
    });
  }
  
  // Utility methods
  formatDeadline(deadline) {
    if (!deadline) return 'TBD';
    
    const deadlineDate = new Date(deadline);
    const now = new Date();
    const timeDiff = deadlineDate - now;
    
    if (timeDiff <= 0) return 'Deadline passed';
    
    const hours = Math.floor(timeDiff / (1000 * 60 * 60));
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  }
  
  formatCountdown(raceDate) {
    if (!raceDate) return 'TBD';
    
    const race = new Date(raceDate);
    const now = new Date();
    const timeDiff = race - now;
    
    if (timeDiff <= 0) return 'Race started';
    
    const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    if (days > 0) {
      return `${days} days`;
    }
    
    const hours = Math.floor(timeDiff / (1000 * 60 * 60));
    return `${hours} hours`;
  }
  
  formatRaceDate(date) {
    if (!date) return 'TBD';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  }
  
  formatShortDate(date) {
    if (!date) return 'TBD';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  }
  
  getPositionClass(position, total) {
    if (position === 1) return 'position-first';
    if (position <= Math.ceil(total * 0.25)) return 'position-top';
    if (position <= Math.ceil(total * 0.5)) return 'position-mid';
    return 'position-bottom';
  }
  
  calculateSurvivalRate(userStanding) {
    if (!userStanding) return 0;
    
    const { racesCompleted = 0, racesEliminated = 0 } = userStanding;
    if (racesCompleted === 0) return 100;
    
    const survivedRaces = racesCompleted - racesEliminated;
    return Math.round((survivedRaces / racesCompleted) * 100);
  }
  
  getPerformanceText(accuracy) {
    if (accuracy >= 80) return 'Excellent performance! 🏆';
    if (accuracy >= 60) return 'Good job! Keep it up 👍';
    if (accuracy >= 40) return 'Room for improvement 📈';
    return 'Focus on strategy 🎯';
  }
  
  // Cleanup
  destroy() {
    this.cards.clear();
  }
}

export default DashboardCards;