// Breadcrumbs.js - Enhanced navigation breadcrumbs with league context
// Provides clear navigation path with contextual information

import { appStore } from '@/store/AppStore.js';
import ErrorHandler from '@/services/error/ErrorHandler.js';

export class Breadcrumbs {
  constructor(container) {
    this.container = container;
    this.breadcrumbs = [];
    this.initialize();
  }
  
  initialize() {
    this.setupEventListeners();
    this.updateFromCurrentPath();
  }
  
  setupEventListeners() {
    // Listen for navigation changes
    window.addEventListener('popstate', () => {
      this.updateFromCurrentPath();
    });
    
    // Listen for app state changes
    appStore.subscribe((state) => {
      this.updateLeagueContext(state);
    });
    
    // Listen for custom navigation events
    document.addEventListener('breadcrumbUpdate', (event) => {
      this.updateBreadcrumbs(event.detail.breadcrumbs);
    });
  }
  
  updateFromCurrentPath() {
    const path = window.location.pathname;
    const breadcrumbs = this.generateBreadcrumbsFromPath(path);
    this.updateBreadcrumbs(breadcrumbs);
  }
  
  generateBreadcrumbsFromPath(path) {
    const state = appStore.getState();
    const { activeLeague } = state;
    
    const breadcrumbs = [];
    
    // Always start with home
    breadcrumbs.push({
      label: 'F1 Survivor',
      href: '/',
      icon: '🏎️',
      current: path === '/'
    });
    
    // Parse path segments
    const segments = path.split('/').filter(Boolean);
    
    segments.forEach((segment, index) => {
      const isLast = index === segments.length - 1;
      
      switch (segment) {
        case 'dashboard':
          breadcrumbs.push({
            label: activeLeague ? `${activeLeague.name} Dashboard` : 'Dashboard',
            href: '/dashboard',
            icon: '📊',
            current: isLast,
            context: activeLeague ? { type: 'league', data: activeLeague } : null
          });
          break;
          
        case 'driver-selection':
          // Add league context if available
          if (activeLeague) {
            breadcrumbs.push({
              label: activeLeague.name,
              href: `/league/${activeLeague.id}`,
              icon: '🏆',
              current: false,
              context: { type: 'league', data: activeLeague }
            });
          }
          
          breadcrumbs.push({
            label: 'Select Driver',
            href: '/driver-selection',
            icon: '🏁',
            current: isLast,
            urgent: this.isPickUrgent()
          });
          break;
          
        case 'league-hub':
          breadcrumbs.push({
            label: 'My Leagues',
            href: '/league-hub',
            icon: '🏆',
            current: isLast
          });
          break;
          
        case 'race-calendar':
          breadcrumbs.push({
            label: 'Race Calendar',
            href: '/race-calendar',
            icon: '📅',
            current: isLast
          });
          break;
          
        case 'profile':
          breadcrumbs.push({
            label: 'Profile',
            href: '/profile',
            icon: '👤',
            current: isLast
          });
          break;
          
        case 'help':
          breadcrumbs.push({
            label: 'Help',
            href: '/help',
            icon: '❓',
            current: isLast
          });
          break;
          
        case 'admin':
          breadcrumbs.push({
            label: 'Admin',
            href: '/admin',
            icon: '⚙️',
            current: isLast,
            restricted: true
          });
          break;
          
        default:
          // Handle dynamic segments (like league IDs)
          if (segment.match(/^league-/)) {
            const leagueId = segment.replace('league-', '');
            const league = this.findLeagueById(leagueId);
            
            if (league) {
              breadcrumbs.push({
                label: league.name,
                href: `/league/${leagueId}`,
                icon: '🏆',
                current: isLast,
                context: { type: 'league', data: league }
              });
            }
          } else {
            // Generic segment
            breadcrumbs.push({
              label: this.formatSegmentLabel(segment),
              href: this.buildPathUpToIndex(segments, index),
              current: isLast
            });
          }
      }
    });
    
    return breadcrumbs;
  }
  
  updateBreadcrumbs(breadcrumbs) {
    this.breadcrumbs = breadcrumbs;
    this.render();
  }
  
  render() {
    if (!this.container) return;
    
    const breadcrumbsHTML = `
      <nav class="breadcrumbs" aria-label="Breadcrumb navigation">
        <ol class="breadcrumbs-list">
          ${this.breadcrumbs.map((crumb, index) => this.renderBreadcrumb(crumb, index)).join('')}
        </ol>
        ${this.renderContextInfo()}
      </nav>
    `;
    
    this.container.innerHTML = breadcrumbsHTML;
    this.attachEventListeners();
  }
  
  renderBreadcrumb(crumb, index) {
    const isLast = index === this.breadcrumbs.length - 1;
    const classes = [
      'breadcrumb-item',
      crumb.current ? 'current' : '',
      crumb.urgent ? 'urgent' : '',
      crumb.restricted ? 'restricted' : ''
    ].filter(Boolean).join(' ');
    
    return `
      <li class="${classes}">
        ${!isLast ? `
          <a href="${crumb.href}" class="breadcrumb-link" data-breadcrumb-nav="${crumb.href}">
            ${crumb.icon ? `<span class="breadcrumb-icon">${crumb.icon}</span>` : ''}
            <span class="breadcrumb-label">${crumb.label}</span>
          </a>
        ` : `
          <span class="breadcrumb-current" aria-current="page">
            ${crumb.icon ? `<span class="breadcrumb-icon">${crumb.icon}</span>` : ''}
            <span class="breadcrumb-label">${crumb.label}</span>
            ${crumb.urgent ? '<span class="urgent-indicator" title="Action required">⚠️</span>' : ''}
          </span>
        `}
        ${!isLast ? '<span class="breadcrumb-separator" aria-hidden="true">/</span>' : ''}
      </li>
    `;
  }
  
  renderContextInfo() {
    const state = appStore.getState();
    const { activeLeague, nextRace, currentPick } = state;
    
    if (!activeLeague) return '';
    
    const contextItems = [];
    
    // League context
    if (activeLeague) {
      contextItems.push(`
        <div class="context-item league-context">
          <span class="context-icon">🏆</span>
          <span class="context-label">${activeLeague.name}</span>
          <span class="context-detail">${activeLeague.memberCount || 0} members</span>
        </div>
      `);
    }
    
    // Race context
    if (nextRace) {
      const hasCurrentPick = currentPick && currentPick.driver;
      contextItems.push(`
        <div class="context-item race-context">
          <span class="context-icon">🏁</span>
          <span class="context-label">${nextRace.name}</span>
          <span class="context-detail ${hasCurrentPick ? 'pick-complete' : 'pick-pending'}">
            ${hasCurrentPick ? '✅ Pick made' : '⏳ Pick needed'}
          </span>
        </div>
      `);
    }
    
    if (contextItems.length === 0) return '';
    
    return `
      <div class="breadcrumb-context">
        ${contextItems.join('')}
      </div>
    `;
  }
  
  attachEventListeners() {
    if (!this.container) return;
    
    // Handle breadcrumb navigation
    this.container.addEventListener('click', (event) => {
      const link = event.target.closest('[data-breadcrumb-nav]');
      if (link) {
        event.preventDefault();
        const href = link.dataset.breadcrumbNav;
        this.navigateTo(href);
      }
    });
  }
  
  navigateTo(href) {
    try {
      // Use history API for smoother navigation
      if (href !== window.location.pathname) {
        window.history.pushState(null, '', href);
        
        // Dispatch custom navigation event
        window.dispatchEvent(new CustomEvent('breadcrumbNavigation', {
          detail: { href }
        }));
        
        // Update breadcrumbs immediately
        this.updateFromCurrentPath();
      }
    } catch (error) {
      // Fallback to regular navigation
      window.location.href = href;
    }
  }
  
  updateLeagueContext(state) {
    const { activeLeague } = state;
    
    // Update league context in existing breadcrumbs
    const leagueContexts = this.container?.querySelectorAll('.league-context .context-label');
    leagueContexts?.forEach(el => {
      if (activeLeague) {
        el.textContent = activeLeague.name;
        const detailEl = el.parentElement.querySelector('.context-detail');
        if (detailEl) {
          detailEl.textContent = `${activeLeague.memberCount || 0} members`;
        }
      }
    });
    
    // Update pick context
    const pickContexts = this.container?.querySelectorAll('.race-context .context-detail');
    pickContexts?.forEach(el => {
      const hasCurrentPick = state.currentPick && state.currentPick.driver;
      el.className = `context-detail ${hasCurrentPick ? 'pick-complete' : 'pick-pending'}`;
      el.textContent = hasCurrentPick ? '✅ Pick made' : '⏳ Pick needed';
    });
  }
  
  // Public methods for manual breadcrumb updates
  setBreadcrumbs(breadcrumbs) {
    this.updateBreadcrumbs(breadcrumbs);
  }
  
  addBreadcrumb(breadcrumb) {
    this.breadcrumbs.push(breadcrumb);
    this.render();
  }
  
  removeBreadcrumb(index) {
    if (index >= 0 && index < this.breadcrumbs.length) {
      this.breadcrumbs.splice(index, 1);
      this.render();
    }
  }
  
  updateBreadcrumb(index, updates) {
    if (index >= 0 && index < this.breadcrumbs.length) {
      this.breadcrumbs[index] = { ...this.breadcrumbs[index], ...updates };
      this.render();
    }
  }
  
  // Utility methods
  isPickUrgent() {
    const state = appStore.getState();
    const { nextRace } = state;
    
    if (!nextRace || !nextRace.pickDeadline) return false;
    
    const deadline = new Date(nextRace.pickDeadline);
    const now = new Date();
    const hoursUntilDeadline = (deadline - now) / (1000 * 60 * 60);
    
    return hoursUntilDeadline <= 24; // Urgent if less than 24 hours
  }
  
  findLeagueById(leagueId) {
    const state = appStore.getState();
    return state.leagues?.find(league => league.id === leagueId);
  }
  
  formatSegmentLabel(segment) {
    return segment
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
  
  buildPathUpToIndex(segments, index) {
    return '/' + segments.slice(0, index + 1).join('/');
  }
  
  // Static method to create breadcrumbs for specific pages
  static createFor(page, options = {}) {
    switch (page) {
      case 'dashboard':
        return [
          { label: 'F1 Survivor', href: '/', icon: '🏎️' },
          { label: 'Dashboard', href: '/dashboard', icon: '📊', current: true }
        ];
        
      case 'driver-selection':
        const breadcrumbs = [
          { label: 'F1 Survivor', href: '/', icon: '🏎️' },
          { label: 'Dashboard', href: '/dashboard', icon: '📊' }
        ];
        
        if (options.league) {
          breadcrumbs.push({
            label: options.league.name,
            href: `/league/${options.league.id}`,
            icon: '🏆'
          });
        }
        
        breadcrumbs.push({
          label: 'Select Driver',
          href: '/driver-selection',
          icon: '🏁',
          current: true,
          urgent: options.urgent
        });
        
        return breadcrumbs;
        
      case 'league-hub':
        return [
          { label: 'F1 Survivor', href: '/', icon: '🏎️' },
          { label: 'My Leagues', href: '/league-hub', icon: '🏆', current: true }
        ];
        
      default:
        return [
          { label: 'F1 Survivor', href: '/', icon: '🏎️' },
          { label: page, href: `/${page}`, current: true }
        ];
    }
  }
  
  destroy() {
    if (this.container) {
      this.container.innerHTML = '';
    }
  }
}

export default Breadcrumbs;