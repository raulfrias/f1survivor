// EmptyStates.js - Consistent empty state components with clear next steps
// Provides helpful guidance when users encounter empty data or need to take action

import { appStore } from '@/store/AppStore.js';
import ErrorHandler from '@/services/error/ErrorHandler.js';

export class EmptyStates {
  
  // Main empty state factory method
  static create(type, options = {}) {
    const config = {
      container: null,
      showActions: true,
      context: {},
      ...options
    };
    
    let emptyStateHTML = '';
    
    switch (type) {
      case 'no-leagues':
        emptyStateHTML = this.createNoLeaguesState(config);
        break;
      case 'no-picks':
        emptyStateHTML = this.createNoPicksState(config);
        break;
      case 'no-race-active':
        emptyStateHTML = this.createNoActiveRaceState(config);
        break;
      case 'league-empty':
        emptyStateHTML = this.createLeagueEmptyState(config);
        break;
      case 'pick-history-empty':
        emptyStateHTML = this.createPickHistoryEmptyState(config);
        break;
      case 'search-no-results':
        emptyStateHTML = this.createSearchNoResultsState(config);
        break;
      case 'eliminated':
        emptyStateHTML = this.createEliminatedState(config);
        break;
      case 'season-complete':
        emptyStateHTML = this.createSeasonCompleteState(config);
        break;
      case 'loading-error':
        emptyStateHTML = this.createLoadingErrorState(config);
        break;
      default:
        emptyStateHTML = this.createGenericEmptyState(config);
    }
    
    if (config.container) {
      config.container.innerHTML = emptyStateHTML;
      this.attachEventListeners(config.container, type);
    }
    
    return emptyStateHTML;
  }
  
  static createNoLeaguesState(config) {
    const { context } = config;
    const isAuthenticated = context.user;
    
    return `
      <div class="empty-state no-leagues-empty" data-empty-state="no-leagues">
        <div class="empty-icon">
          <img src="/assets/images/empty-states/no-leagues.svg" 
               alt="No leagues" 
               class="empty-illustration"
               onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
          <div class="empty-icon-fallback" style="display: none;">🏆</div>
        </div>
        
        <div class="empty-content">
          <h3 class="empty-title">No Leagues Yet</h3>
          <p class="empty-description">
            ${isAuthenticated 
              ? "You're not part of any leagues yet. Join an existing league or create your own to start competing with friends!"
              : "Sign in to join leagues and compete in F1 Survivor with friends and family."
            }
          </p>
          
          ${config.showActions ? `
            <div class="empty-actions">
              ${isAuthenticated ? `
                <button class="btn primary" data-action="create-league">
                  <span class="btn-icon">➕</span>
                  Create League
                </button>
                <button class="btn secondary" data-action="join-league">
                  <span class="btn-icon">🎫</span>
                  Join with Code
                </button>
              ` : `
                <button class="btn primary" data-action="sign-in">
                  <span class="btn-icon">👤</span>
                  Sign In to Get Started
                </button>
              `}
            </div>
          ` : ''}
          
          <div class="empty-help">
            <details class="help-details">
              <summary class="help-summary">
                <span class="help-icon">❓</span>
                How do leagues work?
              </summary>
              <div class="help-content">
                <p>Leagues are groups where you compete with friends:</p>
                <ul>
                  <li>Create a league and share the invite code</li>
                  <li>Everyone makes picks for each F1 race</li>
                  <li>Last player surviving wins the league</li>
                  <li>You can be in multiple leagues at once</li>
                </ul>
              </div>
            </details>
          </div>
        </div>
      </div>
    `;
  }
  
  static createNoPicksState(config) {
    const { context } = config;
    const nextRace = context.nextRace;
    const activeLeague = context.activeLeague;
    
    return `
      <div class="empty-state no-picks-empty" data-empty-state="no-picks">
        <div class="empty-icon">
          <img src="/assets/images/empty-states/no-picks.svg" 
               alt="No picks yet" 
               class="empty-illustration"
               onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
          <div class="empty-icon-fallback" style="display: none;">🏎️</div>
        </div>
        
        <div class="empty-content">
          <h3 class="empty-title">Ready to Make Your Pick?</h3>
          <p class="empty-description">
            ${nextRace 
              ? `The ${nextRace.name} is coming up! Choose your driver wisely - they must finish in the top 10 for you to survive.`
              : "No active race right now, but get ready for the next one!"
            }
          </p>
          
          ${nextRace ? `
            <div class="race-info-card">
              <div class="race-header">
                <span class="race-name">${nextRace.name}</span>
                <span class="race-date">${this.formatRaceDate(nextRace.date)}</span>
              </div>
              <div class="deadline-info">
                <span class="deadline-label">Pick deadline:</span>
                <span class="deadline-time" data-deadline="${nextRace.pickDeadline}">
                  ${this.formatDeadline(nextRace.pickDeadline)}
                </span>
              </div>
            </div>
          ` : ''}
          
          ${config.showActions && activeLeague && nextRace ? `
            <div class="empty-actions">
              <button class="btn primary large" data-action="make-pick">
                <span class="btn-icon">🏁</span>
                Select Your Driver
              </button>
              <button class="btn ghost" data-action="view-drivers">
                <span class="btn-icon">👥</span>
                View Driver Stats
              </button>
            </div>
          ` : !activeLeague ? `
            <div class="empty-actions">
              <button class="btn primary" data-action="join-league">
                <span class="btn-icon">🏆</span>
                Join a League First
              </button>
            </div>
          ` : ''}
          
          <div class="strategy-tip">
            <div class="tip-icon">💡</div>
            <div class="tip-content">
              <strong>Strategy Tip:</strong> Remember, you can only pick each driver once per season. Save the championship leaders for crucial races!
            </div>
          </div>
        </div>
      </div>
    `;
  }
  
  static createNoActiveRaceState(config) {
    const { context } = config;
    const nextRace = context.nextRace;
    const lastRace = context.lastRace;
    
    return `
      <div class="empty-state no-race-empty" data-empty-state="no-race">
        <div class="empty-icon">
          <img src="/assets/images/empty-states/off-season.svg" 
               alt="No active race" 
               class="empty-illustration"
               onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
          <div class="empty-icon-fallback" style="display: none;">🏁</div>
        </div>
        
        <div class="empty-content">
          <h3 class="empty-title">
            ${nextRace ? 'Between Races' : 'Season Break'}
          </h3>
          <p class="empty-description">
            ${nextRace 
              ? `The next race is ${nextRace.name} on ${this.formatRaceDate(nextRace.date)}. Use this time to plan your strategy!`
              : "The F1 season is currently on break. Check back when the new season begins!"
            }
          </p>
          
          ${lastRace ? `
            <div class="last-race-recap">
              <h4>Last Race: ${lastRace.name}</h4>
              <div class="recap-stats">
                ${lastRace.winner ? `
                  <div class="recap-stat">
                    <span class="stat-label">Winner:</span>
                    <span class="stat-value">${lastRace.winner}</span>
                  </div>
                ` : ''}
                ${context.userResult ? `
                  <div class="recap-stat">
                    <span class="stat-label">Your Pick:</span>
                    <span class="stat-value ${context.userResult.survived ? 'survived' : 'eliminated'}">
                      ${context.userResult.driver} - ${context.userResult.survived ? 'Survived' : 'Eliminated'}
                    </span>
                  </div>
                ` : ''}
              </div>
            </div>
          ` : ''}
          
          ${config.showActions ? `
            <div class="empty-actions">
              ${nextRace ? `
                <button class="btn primary" data-action="view-calendar">
                  <span class="btn-icon">📅</span>
                  View Race Calendar
                </button>
              ` : ''}
              <button class="btn secondary" data-action="view-standings">
                <span class="btn-icon">📊</span>
                View League Standings
              </button>
              ${context.activeLeague ? `
                <button class="btn ghost" data-action="invite-friends">
                  <span class="btn-icon">👥</span>
                  Invite More Friends
                </button>
              ` : ''}
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }
  
  static createLeagueEmptyState(config) {
    const { context } = config;
    const league = context.league;
    const isOwner = context.isOwner;
    
    return `
      <div class="empty-state league-empty" data-empty-state="league-empty">
        <div class="empty-icon">
          <div class="empty-icon-fallback">👥</div>
        </div>
        
        <div class="empty-content">
          <h3 class="empty-title">
            ${isOwner ? 'Invite Friends to Join' : 'Waiting for More Players'}
          </h3>
          <p class="empty-description">
            ${isOwner 
              ? `You're the only member of "${league?.name || 'this league'}". Share your invite code to get friends involved!`
              : `"${league?.name || 'This league'}" is waiting for more members to make it competitive.`
            }
          </p>
          
          ${isOwner && league ? `
            <div class="invite-code-display">
              <div class="invite-label">Your League Invite Code:</div>
              <div class="invite-code-box">
                <code class="invite-code" id="league-invite-code">${league.inviteCode}</code>
                <button class="copy-btn" data-action="copy-invite" title="Copy to clipboard">📋</button>
              </div>
              <div class="invite-help">Share this code with friends so they can join your league</div>
            </div>
          ` : ''}
          
          ${config.showActions ? `
            <div class="empty-actions">
              ${isOwner ? `
                <button class="btn primary" data-action="invite-friends">
                  <span class="btn-icon">📤</span>
                  Invite Friends
                </button>
                <button class="btn secondary" data-action="share-league">
                  <span class="btn-icon">🔗</span>
                  Share League
                </button>
              ` : `
                <button class="btn primary" data-action="invite-friends">
                  <span class="btn-icon">👥</span>
                  Invite Others
                </button>
              `}
            </div>
          ` : ''}
          
          <div class="league-tip">
            <div class="tip-icon">💡</div>
            <div class="tip-content">
              <strong>Pro Tip:</strong> Leagues are more fun with 4-10 players. The competition gets intense as the season progresses!
            </div>
          </div>
        </div>
      </div>
    `;
  }
  
  static createPickHistoryEmptyState(config) {
    const { context } = config;
    const isNewUser = context.isNewUser;
    
    return `
      <div class="empty-state pick-history-empty" data-empty-state="pick-history">
        <div class="empty-icon">
          <div class="empty-icon-fallback">📊</div>
        </div>
        
        <div class="empty-content">
          <h3 class="empty-title">No Pick History Yet</h3>
          <p class="empty-description">
            ${isNewUser 
              ? "You haven't made any picks yet. Start by joining a league and making your first driver selection!"
              : "Your pick history will appear here once you start making selections for races."
            }
          </p>
          
          ${config.showActions ? `
            <div class="empty-actions">
              ${context.activeLeague ? `
                <button class="btn primary" data-action="make-pick">
                  <span class="btn-icon">🏎️</span>
                  Make Your First Pick
                </button>
              ` : `
                <button class="btn primary" data-action="join-league">
                  <span class="btn-icon">🏆</span>
                  Join a League
                </button>
              `}
              <button class="btn ghost" data-action="how-it-works">
                <span class="btn-icon">❓</span>
                How It Works
              </button>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }
  
  static createEliminatedState(config) {
    const { context } = config;
    const eliminationInfo = context.elimination;
    
    return `
      <div class="empty-state eliminated" data-empty-state="eliminated">
        <div class="empty-icon">
          <div class="empty-icon-fallback eliminated-icon">💀</div>
        </div>
        
        <div class="empty-content">
          <h3 class="empty-title">You've Been Eliminated</h3>
          <p class="empty-description">
            ${eliminationInfo?.reason || "Your driver didn't finish in the top 10, ending your run in this league."}
          </p>
          
          ${eliminationInfo ? `
            <div class="elimination-details">
              <div class="elimination-race">
                <strong>Race:</strong> ${eliminationInfo.raceName}
              </div>
              <div class="elimination-pick">
                <strong>Your Pick:</strong> ${eliminationInfo.driverName}
              </div>
              <div class="elimination-result">
                <strong>Finish Position:</strong> P${eliminationInfo.finishPosition}
              </div>
            </div>
          ` : ''}
          
          <div class="elimination-encouragement">
            <p>Don't worry! You can:</p>
            <ul>
              <li>Watch the rest of the season unfold</li>
              <li>Join other leagues that are still active</li>
              <li>Start fresh next season</li>
            </ul>
          </div>
          
          ${config.showActions ? `
            <div class="empty-actions">
              <button class="btn primary" data-action="join-new-league">
                <span class="btn-icon">🏆</span>
                Join Another League
              </button>
              <button class="btn secondary" data-action="view-standings">
                <span class="btn-icon">📊</span>
                Watch Final Standings
              </button>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }
  
  static createSearchNoResultsState(config) {
    const { context } = config;
    const query = context.query || '';
    
    return `
      <div class="empty-state search-no-results" data-empty-state="search-no-results">
        <div class="empty-icon">
          <div class="empty-icon-fallback">🔍</div>
        </div>
        
        <div class="empty-content">
          <h3 class="empty-title">No Results Found</h3>
          <p class="empty-description">
            ${query 
              ? `We couldn't find anything matching "${query}". Try adjusting your search terms.`
              : "No results found for your search. Try different keywords."
            }
          </p>
          
          <div class="search-suggestions">
            <h4>Try searching for:</h4>
            <ul>
              <li>Driver names (e.g., "Hamilton", "Verstappen")</li>
              <li>Team names (e.g., "Mercedes", "Red Bull")</li>
              <li>League names</li>
              <li>Race locations</li>
            </ul>
          </div>
          
          ${config.showActions ? `
            <div class="empty-actions">
              <button class="btn secondary" data-action="clear-search">
                <span class="btn-icon">✖️</span>
                Clear Search
              </button>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }
  
  static createLoadingErrorState(config) {
    const { context } = config;
    const errorMessage = context.error?.message || 'Failed to load data';
    
    return `
      <div class="empty-state loading-error" data-empty-state="loading-error">
        <div class="empty-icon">
          <div class="empty-icon-fallback error-icon">⚠️</div>
        </div>
        
        <div class="empty-content">
          <h3 class="empty-title">Something Went Wrong</h3>
          <p class="empty-description">
            ${errorMessage}. Please try again or contact support if the problem continues.
          </p>
          
          ${config.showActions ? `
            <div class="empty-actions">
              <button class="btn primary" data-action="retry-loading">
                <span class="btn-icon">🔄</span>
                Try Again
              </button>
              <button class="btn secondary" data-action="refresh-page">
                <span class="btn-icon">↻</span>
                Refresh Page
              </button>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }
  
  static createGenericEmptyState(config) {
    const { context } = config;
    
    return `
      <div class="empty-state generic-empty" data-empty-state="generic">
        <div class="empty-icon">
          <div class="empty-icon-fallback">📦</div>
        </div>
        
        <div class="empty-content">
          <h3 class="empty-title">${context.title || 'No Data Available'}</h3>
          <p class="empty-description">
            ${context.description || 'There\'s nothing to show here right now.'}
          </p>
          
          ${config.showActions && context.actions ? `
            <div class="empty-actions">
              ${context.actions.map(action => `
                <button class="btn ${action.primary ? 'primary' : 'secondary'}" data-action="${action.action}">
                  ${action.icon ? `<span class="btn-icon">${action.icon}</span>` : ''}
                  ${action.label}
                </button>
              `).join('')}
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }
  
  static attachEventListeners(container, emptyStateType) {
    if (!container) return;
    
    container.addEventListener('click', (event) => {
      const actionBtn = event.target.closest('[data-action]');
      if (actionBtn) {
        event.preventDefault();
        const action = actionBtn.dataset.action;
        this.handleEmptyStateAction(action, emptyStateType, actionBtn);
      }
    });
  }
  
  static async handleEmptyStateAction(action, emptyStateType, buttonEl) {
    try {
      console.log('Handling empty state action:', action, 'for type:', emptyStateType);
      
      switch (action) {
        case 'create-league':
          if (window.showCreateLeagueModal) {
            window.showCreateLeagueModal();
          } else {
            window.location.href = '/league-hub#create';
          }
          break;
          
        case 'join-league':
          if (window.showJoinLeagueModal) {
            window.showJoinLeagueModal();
          } else {
            window.location.href = '/league-hub#join';
          }
          break;
          
        case 'sign-in':
          if (window.showAuthModal) {
            window.showAuthModal('signin');
          }
          break;
          
        case 'make-pick':
          window.location.href = '/driver-selection';
          break;
          
        case 'view-drivers':
          window.location.href = '/drivers';
          break;
          
        case 'view-calendar':
          window.location.href = '/race-calendar';
          break;
          
        case 'view-standings':
          window.location.href = '/league-hub#standings';
          break;
          
        case 'invite-friends':
          if (window.showInviteFriendsModal) {
            window.showInviteFriendsModal();
          }
          break;
          
        case 'copy-invite':
          await this.copyInviteCode();
          this.showCopySuccess(buttonEl);
          break;
          
        case 'share-league':
          if (window.shareLeague) {
            window.shareLeague();
          }
          break;
          
        case 'how-it-works':
          if (window.showHowItWorksModal) {
            window.showHowItWorksModal();
          } else {
            window.location.href = '/help#how-it-works';
          }
          break;
          
        case 'join-new-league':
          window.location.href = '/league-hub';
          break;
          
        case 'clear-search':
          const searchInput = document.querySelector('input[type="search"], .search-input');
          if (searchInput) {
            searchInput.value = '';
            searchInput.dispatchEvent(new Event('input'));
          }
          break;
          
        case 'retry-loading':
          window.location.reload();
          break;
          
        case 'refresh-page':
          window.location.reload();
          break;
          
        default:
          console.warn('Unknown empty state action:', action);
      }
      
    } catch (error) {
      ErrorHandler.handle(error, {
        action: 'emptyStateAction',
        emptyStateType,
        actionType: action
      });
    }
  }
  
  static async copyInviteCode() {
    const codeEl = document.getElementById('league-invite-code');
    if (!codeEl) return;
    
    const code = codeEl.textContent;
    
    try {
      await navigator.clipboard.writeText(code);
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = code;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
  }
  
  static showCopySuccess(buttonEl) {
    const originalContent = buttonEl.innerHTML;
    buttonEl.innerHTML = '✅';
    buttonEl.disabled = true;
    
    setTimeout(() => {
      buttonEl.innerHTML = originalContent;
      buttonEl.disabled = false;
    }, 2000);
  }
  
  // Utility methods
  static formatRaceDate(date) {
    if (!date) return 'TBD';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  }
  
  static formatDeadline(deadline) {
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
  
  // Method to update existing empty states with new data
  static update(container, type, newOptions = {}) {
    if (container && container.querySelector(`[data-empty-state="${type}"]`)) {
      this.create(type, { ...newOptions, container });
    }
  }
  
  // Method to check if an element contains an empty state
  static hasEmptyState(container) {
    return container ? container.querySelector('[data-empty-state]') !== null : false;
  }
  
  // Method to remove empty state from container
  static clear(container) {
    if (container) {
      const emptyStates = container.querySelectorAll('[data-empty-state]');
      emptyStates.forEach(state => state.remove());
    }
  }
}

export default EmptyStates;