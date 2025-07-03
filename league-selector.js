import { getMultiLeagueContext, setActiveLeagueId, addLeagueChangeListener, removeLeagueChangeListener } from './league-integration.js';
import { amplifyDataService } from './amplify-data-service.js';
import { leagueModalManager } from './league-modal-manager.js';
import { authManager } from './auth-manager.js';

/**
 * League Selector Component
 * Part of Phase 2: Multi-League UI Components
 * Provides dropdown interface for league selection and management
 */
export class LeagueSelector {
  constructor(containerId) {
    this.containerId = containerId;
    this.container = document.getElementById(containerId);
    this.isDropdownOpen = false;
    this.currentContext = null;
    
    // Close dropdown when clicking outside
    document.addEventListener('click', this.handleClickOutside.bind(this));
  }

  async initialize() {
    console.log(`🔍 League selector initializing with container ID: ${this.containerId}`);
    
    if (!this.container) {
      console.warn(`❌ League selector container '${this.containerId}' not found in DOM`);
      return;
    }
    
    console.log(`✅ League selector container found:`, this.container);

    // Listen for league context changes
    if (window.multiLeagueContext) {
      window.multiLeagueContext.addLeagueChangeListener(this.handleLeagueContextChange.bind(this));
      console.log(`✅ League context listener added`);
    } else {
      console.warn(`⚠️ No multiLeagueContext available during initialization`);
    }

    await this.render();
    console.log(`✅ League selector render completed`);
  }

  async render() {
    // Check if user is authenticated first
    const isAuthenticated = await authManager.isAuthenticated();
    
    if (!isAuthenticated) {
      console.log('🔍 League nav selector - user not authenticated, hiding selector');
      this.renderHidden();
      return;
    }

    if (!window.multiLeagueContext) {
      console.log('🔍 League nav selector - no multiLeagueContext available');
      this.renderHidden();
      return;
    }

    const context = window.multiLeagueContext.getMultiLeagueContext();
    console.log('🔍 League nav selector - render context:', context);
    this.currentContext = context;
    
    // Always render the dropdown for authenticated users, even with 0 leagues
    // This allows users to create or join leagues
    console.log(`🔍 League nav selector - rendering dropdown (${context.leagueCount} leagues)`);
    this.renderNavDropdown(context);
  }

  renderHidden() {
    // Don't show anything when no leagues - keeps nav clean
    this.container.innerHTML = '';
  }

  renderNavDropdown(context) {
    console.log(`🎨 Rendering nav dropdown for context:`, context);
    
    const activeLeague = context.activeLeagueData;
    // Update the default text when user has no leagues
    const leagueName = activeLeague ? activeLeague.name : (context.leagueCount === 0 ? 'Leagues' : 'Select League');
    
    console.log(`🏆 Active league: ${leagueName}`, activeLeague);
    
    // Get all leagues for dropdown
    const multiLeagueContext = window.multiLeagueContext;
    const allLeaguesContext = multiLeagueContext.getAllLeaguesContext();
    const allLeagues = allLeaguesContext.leagues || [];
    
    console.log(`📋 All leagues for dropdown:`, allLeagues);
    
    const html = `
      <div class="league-nav-dropdown ${this.isDropdownOpen ? 'active' : ''}">
        <button class="league-nav-trigger" data-action="toggle">
              <span class="league-icon">🏆</span>
                <span class="league-name">${this.escapeHtml(leagueName)}</span>
          <span class="nav-arrow ${this.isDropdownOpen ? 'up' : 'down'}">▼</span>
        </button>
        
        <div class="league-nav-menu ${this.isDropdownOpen ? 'open' : ''}">
          <div class="league-nav-header">
            <span class="menu-title">Your Leagues</span>
              </div>
          
          <div class="league-nav-list">
            ${this.renderNavLeagueList(allLeagues, context.activeLeague)}
            </div>
          
          <div class="league-nav-actions">
            <button class="nav-action-btn" data-action="create">
              <span class="action-icon">+</span>
              Create League
            </button>
            <button class="nav-action-btn" data-action="join">
              <span class="action-icon">🔗</span>
              Join League
            </button>
            <button class="nav-action-btn" data-action="manage">
              <span class="action-icon">⚙️</span>
              Manage Leagues
            </button>
          </div>
        </div>
      </div>
    `;
    
    console.log(`📝 Generated HTML for nav dropdown:`, html);
    
    this.container.innerHTML = html;
    
    console.log(`✅ HTML set to container, attaching event listeners...`);
    this.attachNavEventListeners();
    console.log(`✅ Nav dropdown rendering completed`);
  }

  renderNavLeagueList(leagues, activeLeagueId) {
    if (leagues.length === 0) {
      return '<div class="no-leagues-nav">Ready to join your first league?</div>';
    }

    return leagues.map(league => {
      const isActive = league.leagueId === activeLeagueId;
      const memberCount = league.memberCount || 0;
      
      return `
        <button class="league-nav-option ${isActive ? 'active' : ''}" data-league-id="${league.leagueId}">
          <div class="league-nav-info">
            <span class="nav-league-name">${this.escapeHtml(league.name)}</span>
            <span class="nav-league-members">${memberCount} members</span>
          </div>
          ${isActive ? '<span class="nav-active-indicator">✓</span>' : ''}
        </button>
      `;
    }).join('');
  }

  attachNavEventListeners() {
    // Toggle dropdown
    const toggleBtn = this.container.querySelector('[data-action="toggle"]');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleDropdown();
      });
    }

    // League selection
    const leagueOptions = this.container.querySelectorAll('.league-nav-option');
    leagueOptions.forEach(option => {
      option.addEventListener('click', (e) => {
        e.stopPropagation();
        const leagueId = option.dataset.leagueId;
        this.handleLeagueSwitch(leagueId);
      });
    });

    // Action buttons
    const createBtn = this.container.querySelector('[data-action="create"]');
    const joinBtn = this.container.querySelector('[data-action="join"]');
    const manageBtn = this.container.querySelector('[data-action="manage"]');
    
    if (createBtn) {
      createBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.closeDropdown();
        this.handleCreateLeague();
      });
    }
    
    if (joinBtn) {
      joinBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.closeDropdown();
        this.handleJoinLeague();
      });
    }
    
    if (manageBtn) {
      manageBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.closeDropdown();
        this.handleManageLeagues();
      });
    }
  }

  toggleDropdown() {
    this.isDropdownOpen = !this.isDropdownOpen;
    this.updateDropdownState();
  }

  closeDropdown() {
    if (this.isDropdownOpen) {
      this.isDropdownOpen = false;
      this.updateDropdownState();
    }
  }

  updateDropdownState() {
    const dropdown = this.container.querySelector('.league-nav-dropdown');
    const menu = this.container.querySelector('.league-nav-menu');
    const arrow = this.container.querySelector('.nav-arrow');
    
    if (dropdown && menu && arrow) {
      if (this.isDropdownOpen) {
        dropdown.classList.add('active');
        menu.classList.add('open');
        arrow.classList.remove('down');
        arrow.classList.add('up');
      } else {
        dropdown.classList.remove('active');
        menu.classList.remove('open');
        arrow.classList.remove('up');
        arrow.classList.add('down');
      }
    }
  }

  async handleLeagueSwitch(leagueId) {
    if (!leagueId) return;
    
    console.log(`Switching to league: ${leagueId}`);
    
    try {
      // Close dropdown immediately for better UX
      this.closeDropdown();
      
      // Switch league
      const success = setActiveLeagueId(leagueId);
      
      if (success) {
        // Re-render with new active league
        await this.render();
        
        // Notify other components of league change
        this.notifyLeagueSwitch(leagueId);
      } else {
        throw new Error('Failed to switch league');
      }
    } catch (error) {
      console.error('League switch failed:', error);
      this.showError('Failed to switch leagues. Please try again.');
    }
  }

  async handleJoinLeague() {
    try {
      if (leagueModalManager && leagueModalManager.showJoinLeagueModal) {
        await leagueModalManager.showJoinLeagueModal();
      } else {
        // Fallback: prompt for invite code
        const inviteCode = prompt('Enter League Invite Code:');
        if (inviteCode) {
          await this.joinLeagueByCode(inviteCode);
        }
      }
    } catch (error) {
      console.error('Join league failed:', error);
      this.showError('Failed to join league. Please try again.');
    }
  }

  async handleCreateLeague() {
    try {
      if (leagueModalManager && leagueModalManager.showCreateLeagueModal) {
        await leagueModalManager.showCreateLeagueModal();
      } else {
        // Fallback: prompt for league name
        const leagueName = prompt('Enter League Name:');
        if (leagueName) {
          await this.createLeague(leagueName);
        }
      }
    } catch (error) {
      console.error('Create league failed:', error);
      this.showError('Failed to create league. Please try again.');
    }
  }

  async handleManageLeagues() {
    try {
      if (leagueModalManager && leagueModalManager.showManageLeaguesModal) {
        await leagueModalManager.showManageLeaguesModal();
      } else {
        this.showError('League management not available');
      }
    } catch (error) {
      console.error('Manage leagues failed:', error);
      this.showError('Failed to open league management. Please try again.');
    }
  }

  async joinLeagueByCode(inviteCode) {
    try {
      console.log('Joining league with code:', inviteCode);
      
      // Use the amplify data service to join the league
    const result = await amplifyDataService.joinLeague(inviteCode);
      
    if (result.success) {
        console.log('✅ Successfully joined league');
        // Refresh the league selector to show the new league
      await this.refreshAndRender();
        alert('Successfully joined league!');
    } else {
      throw new Error(result.error || 'Failed to join league');
      }
    } catch (error) {
      console.error('Failed to join league:', error);
      alert(`Failed to join league: ${error.message}`);
    }
  }

  async createLeague(leagueName) {
    try {
      console.log('Creating league:', leagueName);
      
      // Create basic league data
    const leagueData = {
      name: leagueName,
      description: '',
        maxMembers: 20,
        isPrivate: true,
        autoPickEnabled: true
    };
    
      // Use the amplify data service to create the league
    const result = await amplifyDataService.createLeague(leagueData);
      
    if (result.success) {
        console.log('✅ Successfully created league');
        // Refresh the league selector to show the new league
      await this.refreshAndRender();
        alert(`Successfully created league "${leagueName}"!`);
    } else {
      throw new Error(result.error || 'Failed to create league');
      }
    } catch (error) {
      console.error('Failed to create league:', error);
      alert(`Failed to create league: ${error.message}`);
    }
  }

  async refreshAndRender() {
    if (window.multiLeagueContext) {
      await window.multiLeagueContext.refreshLeagues();
    }
    await this.render();
  }

  handleLeagueContextChange(newLeagueId, previousLeagueId) {
    console.log('League context changed:', previousLeagueId, '->', newLeagueId);
    this.render();
  }

  handleClickOutside(event) {
    if (!this.container.contains(event.target)) {
      this.closeDropdown();
    }
  }

  showError(message) {
    // Simple error display - could be enhanced
    console.error(message);
    // Could show a toast notification here
  }

  notifyLeagueSwitch(leagueId) {
    // Notify other components of league change
    const event = new CustomEvent('leagueChanged', {
      detail: { leagueId }
    });
    document.dispatchEvent(event);
  }

  escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  destroy() {
    document.removeEventListener('click', this.handleClickOutside.bind(this));
    if (window.multiLeagueContext) {
      window.multiLeagueContext.removeLeagueChangeListener(this.handleLeagueContextChange.bind(this));
    }
  }
}

// Factory function for creating league selector
export function createLeagueSelector(containerId) {
  return new LeagueSelector(containerId);
} 