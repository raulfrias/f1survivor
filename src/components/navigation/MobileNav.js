// MobileNav.js - Enhanced mobile navigation with contextual information
// Provides improved mobile navigation experience with league context and quick actions

import { appStore } from '@/store/AppStore.js';
import ErrorHandler from '@/services/error/ErrorHandler.js';

export class MobileNav {
  constructor() {
    this.isOpen = false;
    this.overlay = null;
    this.menuButton = null;
    this.closeButton = null;
    this.navContent = null;
    this.initialize();
  }
  
  initialize() {
    this.findElements();
    this.setupEventListeners();
    this.updateFromState();
  }
  
  findElements() {
    this.overlay = document.getElementById('mobile-nav-overlay');
    this.menuButton = document.getElementById('mobile-menu-btn');
    this.closeButton = document.getElementById('mobile-close-btn');
    this.navContent = this.overlay?.querySelector('.mobile-nav-content');
    
    if (!this.overlay || !this.menuButton) {
      console.warn('MobileNav: Required elements not found');
      return;
    }
  }
  
  setupEventListeners() {
    // Menu toggle button
    this.menuButton?.addEventListener('click', (event) => {
      event.preventDefault();
      this.toggle();
    });
    
    // Close button
    this.closeButton?.addEventListener('click', (event) => {
      event.preventDefault();
      this.close();
    });
    
    // Overlay click to close
    this.overlay?.addEventListener('click', (event) => {
      if (event.target === this.overlay) {
        this.close();
      }
    });
    
    // Keyboard navigation
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && this.isOpen) {
        this.close();
      }
    });
    
    // State updates
    appStore.subscribe((state) => {
      this.updateFromState(state);
    });
    
    // Handle navigation clicks
    this.overlay?.addEventListener('click', (event) => {
      const navLink = event.target.closest('.mobile-nav-link');
      const actionBtn = event.target.closest('[data-mobile-action]');
      
      if (navLink) {
        event.preventDefault();
        this.handleNavigation(navLink.href);
      } else if (actionBtn) {
        event.preventDefault();
        this.handleAction(actionBtn.dataset.mobileAction);
      }
    });
    
    // Handle window resize
    window.addEventListener('resize', () => {
      if (window.innerWidth > 768 && this.isOpen) {
        this.close();
      }
    });
  }
  
  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }
  
  open() {
    if (this.isOpen) return;
    
    this.isOpen = true;
    this.overlay.classList.add('active');
    document.body.classList.add('mobile-nav-open');
    
    // Update hamburger icon
    this.menuButton.classList.add('active');
    this.menuButton.setAttribute('aria-expanded', 'true');
    
    // Focus management
    setTimeout(() => {
      const firstLink = this.navContent?.querySelector('.mobile-nav-link');
      firstLink?.focus();
    }, 150);
    
    // Update navigation content
    this.updateNavContent();
  }
  
  close() {
    if (!this.isOpen) return;
    
    this.isOpen = false;
    this.overlay.classList.remove('active');
    document.body.classList.remove('mobile-nav-open');
    
    // Update hamburger icon
    this.menuButton.classList.remove('active');
    this.menuButton.setAttribute('aria-expanded', 'false');
    
    // Return focus to menu button
    this.menuButton?.focus();
  }
  
  updateNavContent() {
    if (!this.navContent) return;
    
    const state = appStore.getState();
    const { user, activeLeague, nextRace, currentPick } = state;
    
    const linksContainer = this.navContent.querySelector('.mobile-nav-links');
    if (!linksContainer) return;
    
    // Generate navigation links based on current state
    const navigationHTML = this.generateNavigationHTML(state);
    linksContainer.innerHTML = navigationHTML;
  }
  
  generateNavigationHTML(state) {
    const { user, activeLeague, nextRace, currentPick } = state;
    const currentPath = window.location.pathname;
    
    const links = [];
    
    // Dashboard - always available if authenticated
    if (user) {
      links.push({
        href: '/dashboard',
        icon: '📊',
        label: 'Dashboard',
        active: currentPath === '/dashboard',
        context: activeLeague ? `${activeLeague.name}` : null
      });
    }
    
    // Driver Selection - show if there's an active league and upcoming race
    if (user && activeLeague && nextRace) {
      const hasCurrentPick = currentPick && currentPick.driver;
      links.push({
        href: '/driver-selection',
        icon: '🏎️',
        label: 'Select Driver',
        active: currentPath === '/driver-selection',
        status: hasCurrentPick ? 'complete' : 'pending',
        urgent: this.isPickUrgent(nextRace),
        context: hasCurrentPick ? `${currentPick.driver.name}` : 'No pick yet'
      });
    }
    
    // My Leagues
    if (user) {
      links.push({
        href: '/league-hub',
        icon: '🏆',
        label: 'My Leagues',
        active: currentPath === '/league-hub',
        context: activeLeague ? `Active: ${activeLeague.name}` : 'No active league'
      });
    }
    
    // Race Calendar
    links.push({
      href: '/race-calendar',
      icon: '📅',
      label: 'Race Calendar',
      active: currentPath === '/race-calendar',
      context: nextRace ? `Next: ${nextRace.name}` : null
    });
    
    // Profile - if authenticated
    if (user) {
      links.push({
        href: '/profile',
        icon: '👤',
        label: 'Profile',
        active: currentPath === '/profile',
        context: user.email
      });
    }
    
    // Help
    links.push({
      href: '/help',
      icon: '❓',
      label: 'Help & Rules',
      active: currentPath === '/help'
    });
    
    // Convert to HTML
    const linksHTML = links.map(link => this.renderNavLink(link)).join('');
    
    // Add quick actions section
    const quickActionsHTML = this.renderQuickActions(state);
    
    // Add league context section
    const leagueContextHTML = this.renderLeagueContext(state);
    
    return `
      ${leagueContextHTML}
      ${linksHTML}
      ${quickActionsHTML}
      ${this.renderAuthSection(state)}
    `;
  }
  
  renderNavLink(link) {
    const classes = [
      'mobile-nav-link',
      link.active ? 'active' : '',
      link.status ? `status-${link.status}` : '',
      link.urgent ? 'urgent' : ''
    ].filter(Boolean).join(' ');
    
    return `
      <a href="${link.href}" class="${classes}">
        <div class="nav-link-main">
          <span class="nav-link-icon">${link.icon}</span>
          <span class="nav-link-label">${link.label}</span>
          ${link.status === 'complete' ? '<span class="status-indicator complete">✅</span>' : ''}
          ${link.status === 'pending' ? '<span class="status-indicator pending">⏳</span>' : ''}
          ${link.urgent ? '<span class="urgent-indicator">⚠️</span>' : ''}
        </div>
        ${link.context ? `<div class="nav-link-context">${link.context}</div>` : ''}
      </a>
    `;
  }
  
  renderLeagueContext(state) {
    const { user, activeLeague, nextRace } = state;
    
    if (!user || !activeLeague) return '';
    
    return `
      <div class="mobile-nav-section league-context-section">
        <div class="section-header">
          <span class="section-icon">🏆</span>
          <span class="section-title">Current League</span>
        </div>
        <div class="league-info">
          <div class="league-name">${activeLeague.name}</div>
          <div class="league-details">
            <span class="member-count">${activeLeague.memberCount || 0} members</span>
            ${nextRace ? `<span class="next-race">Next: ${nextRace.name}</span>` : ''}
          </div>
        </div>
      </div>
    `;
  }
  
  renderQuickActions(state) {
    const { user, activeLeague, nextRace, currentPick } = state;
    
    if (!user) return '';
    
    const actions = [];
    
    // Quick pick action
    if (activeLeague && nextRace && !(currentPick && currentPick.driver)) {
      actions.push({
        action: 'quick-pick',
        icon: '⚡',
        label: 'Quick Pick',
        description: 'Make your driver selection',
        urgent: this.isPickUrgent(nextRace)
      });
    }
    
    // View standings
    if (activeLeague) {
      actions.push({
        action: 'view-standings',
        icon: '📊',
        label: 'League Standings',
        description: 'Check your position'
      });
    }
    
    // Join league (if no active league)
    if (!activeLeague) {
      actions.push({
        action: 'join-league',
        icon: '➕',
        label: 'Join League',
        description: 'Start competing with friends'
      });
    }
    
    if (actions.length === 0) return '';
    
    return `
      <div class="mobile-nav-section quick-actions-section">
        <div class="section-header">
          <span class="section-icon">⚡</span>
          <span class="section-title">Quick Actions</span>
        </div>
        <div class="quick-actions">
          ${actions.map(action => `
            <button class="quick-action-btn ${action.urgent ? 'urgent' : ''}" data-mobile-action="${action.action}">
              <span class="action-icon">${action.icon}</span>
              <div class="action-content">
                <div class="action-label">${action.label}</div>
                <div class="action-description">${action.description}</div>
              </div>
              ${action.urgent ? '<span class="urgent-indicator">⚠️</span>' : ''}
            </button>
          `).join('')}
        </div>
      </div>
    `;
  }
  
  renderAuthSection(state) {
    const { user } = state;
    
    if (user) {
      return `
        <div class="mobile-nav-section auth-section">
          <div class="user-info">
            <div class="user-avatar">
              <img src="${user.profileImage || '/assets/images/default-avatar.svg'}" 
                   alt="${user.name || user.email}"
                   onerror="this.src='/assets/images/default-avatar.svg'">
            </div>
            <div class="user-details">
              <div class="user-name">${user.name || 'F1 Fan'}</div>
              <div class="user-email">${user.email}</div>
            </div>
          </div>
          <button class="auth-action-btn" data-mobile-action="sign-out">
            <span class="action-icon">🚪</span>
            <span class="action-label">Sign Out</span>
          </button>
        </div>
      `;
    } else {
      return `
        <div class="mobile-nav-section auth-section">
          <button class="auth-action-btn primary" data-mobile-action="sign-in">
            <span class="action-icon">👤</span>
            <span class="action-label">Sign In</span>
          </button>
          <button class="auth-action-btn secondary" data-mobile-action="sign-up">
            <span class="action-icon">✨</span>
            <span class="action-label">Create Account</span>
          </button>
        </div>
      `;
    }
  }
  
  handleNavigation(href) {
    try {
      this.close();
      
      // Small delay to let close animation start
      setTimeout(() => {
        window.location.href = href;
      }, 100);
      
    } catch (error) {
      ErrorHandler.handle(error, {
        action: 'mobileNavigation',
        href
      });
    }
  }
  
  handleAction(action) {
    try {
      console.log('Handling mobile nav action:', action);
      
      switch (action) {
        case 'quick-pick':
          this.close();
          setTimeout(() => window.location.href = '/driver-selection', 100);
          break;
          
        case 'view-standings':
          this.close();
          setTimeout(() => window.location.href = '/league-hub#standings', 100);
          break;
          
        case 'join-league':
          this.close();
          if (window.showJoinLeagueModal) {
            setTimeout(() => window.showJoinLeagueModal(), 150);
          } else {
            setTimeout(() => window.location.href = '/league-hub#join', 100);
          }
          break;
          
        case 'sign-in':
          this.close();
          if (window.showAuthModal) {
            setTimeout(() => window.showAuthModal('signin'), 150);
          }
          break;
          
        case 'sign-up':
          this.close();
          if (window.showAuthModal) {
            setTimeout(() => window.showAuthModal('signup'), 150);
          }
          break;
          
        case 'sign-out':
          this.close();
          if (window.signOut) {
            setTimeout(() => window.signOut(), 100);
          }
          break;
          
        default:
          console.warn('Unknown mobile nav action:', action);
      }
      
    } catch (error) {
      ErrorHandler.handle(error, {
        action: 'mobileNavAction',
        navAction: action
      });
    }
  }
  
  updateFromState(state) {
    if (!state) {
      state = appStore.getState();
    }
    
    // Update badge indicators on menu button
    this.updateMenuButtonBadges(state);
    
    // Update nav content if open
    if (this.isOpen) {
      this.updateNavContent();
    }
  }
  
  updateMenuButtonBadges(state) {
    const { currentPick, nextRace } = state;
    
    // Remove existing badges
    const existingBadges = this.menuButton?.querySelectorAll('.nav-badge');
    existingBadges?.forEach(badge => badge.remove());
    
    // Add urgent pick badge if needed
    if (nextRace && !(currentPick && currentPick.driver)) {
      if (this.isPickUrgent(nextRace)) {
        const badge = document.createElement('div');
        badge.className = 'nav-badge urgent';
        badge.textContent = '!';
        badge.title = 'Pick deadline approaching';
        this.menuButton?.appendChild(badge);
      }
    }
  }
  
  isPickUrgent(nextRace) {
    if (!nextRace || !nextRace.pickDeadline) return false;
    
    const deadline = new Date(nextRace.pickDeadline);
    const now = new Date();
    const hoursUntilDeadline = (deadline - now) / (1000 * 60 * 60);
    
    return hoursUntilDeadline <= 24; // Urgent if less than 24 hours
  }
  
  // Public API methods
  forceUpdate() {
    this.updateFromState();
  }
  
  closeMenu() {
    this.close();
  }
  
  destroy() {
    // Clean up event listeners and reset state
    this.close();
    
    const elements = [this.menuButton, this.closeButton, this.overlay];
    elements.forEach(el => {
      if (el) {
        const clone = el.cloneNode(true);
        el.parentNode?.replaceChild(clone, el);
      }
    });
  }
}

export default MobileNav;