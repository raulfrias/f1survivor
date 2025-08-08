// AccessibilityEnhancer.js - Comprehensive accessibility improvements for F1 Survivor
// Provides WCAG 2.1 AA compliance features and enhanced keyboard navigation

import { appStore } from '@/store/AppStore.js';
import ErrorHandler from '@/services/error/ErrorHandler.js';

export class AccessibilityEnhancer {
  constructor() {
    this.focusTrap = null;
    this.announcer = null;
    this.skipLinks = [];
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    this.highContrast = window.matchMedia('(prefers-contrast: high)');
    this.initialize();
  }
  
  initialize() {
    this.createAnnouncer();
    this.createSkipLinks();
    this.setupKeyboardNavigation();
    this.setupFocusManagement();
    this.setupMotionPreferences();
    this.setupColorSchemePreferences();
    this.enhanceExistingElements();
    this.setupEventListeners();
  }
  
  // Screen reader announcements
  createAnnouncer() {
    this.announcer = document.createElement('div');
    this.announcer.id = 'sr-announcer';
    this.announcer.className = 'sr-only';
    this.announcer.setAttribute('aria-live', 'polite');
    this.announcer.setAttribute('aria-atomic', 'true');
    document.body.appendChild(this.announcer);
    
    // Create urgent announcer for important updates
    this.urgentAnnouncer = document.createElement('div');
    this.urgentAnnouncer.id = 'sr-announcer-urgent';
    this.urgentAnnouncer.className = 'sr-only';
    this.urgentAnnouncer.setAttribute('aria-live', 'assertive');
    this.urgentAnnouncer.setAttribute('aria-atomic', 'true');
    document.body.appendChild(this.urgentAnnouncer);
  }
  
  // Skip navigation links
  createSkipLinks() {
    const skipLinksHTML = `
      <div class="skip-links" id="skip-links">
        <a href="#main-content" class="skip-link">Skip to main content</a>
        <a href="#main-nav" class="skip-link">Skip to navigation</a>
        <a href="#league-selector" class="skip-link">Skip to league selector</a>
        <a href="#driver-grid" class="skip-link">Skip to driver selection</a>
      </div>
    `;
    
    document.body.insertAdjacentHTML('afterbegin', skipLinksHTML);
    
    // Handle skip link clicks
    document.getElementById('skip-links').addEventListener('click', (event) => {
      const link = event.target.closest('.skip-link');
      if (link) {
        event.preventDefault();
        const targetId = link.getAttribute('href').substring(1);
        const target = document.getElementById(targetId);
        
        if (target) {
          target.focus();
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
          this.announce(`Skipped to ${this.getReadableLabel(targetId)}`);
        }
      }
    });
  }
  
  // Enhanced keyboard navigation
  setupKeyboardNavigation() {
    // Global keyboard shortcuts
    document.addEventListener('keydown', (event) => {
      // Alt + 1: Skip to main content
      if (event.altKey && event.key === '1') {
        event.preventDefault();
        const mainContent = document.getElementById('main-content');
        if (mainContent) {
          mainContent.focus();
          this.announce('Moved to main content');
        }
      }
      
      // Alt + 2: Skip to navigation
      if (event.altKey && event.key === '2') {
        event.preventDefault();
        const mainNav = document.getElementById('main-nav');
        if (mainNav) {
          mainNav.focus();
          this.announce('Moved to main navigation');
        }
      }
      
      // Alt + 3: Skip to league selector
      if (event.altKey && event.key === '3') {
        event.preventDefault();
        const leagueSelector = document.getElementById('league-selector');
        if (leagueSelector) {
          leagueSelector.focus();
          this.announce('Moved to league selector');
        }
      }
      
      // Escape: Close modals/overlays
      if (event.key === 'Escape') {
        this.handleEscapeKey();
      }
      
      // Arrow key navigation for grids
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
        this.handleArrowNavigation(event);
      }
    });
    
    // Tab trapping for modals
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Tab') {
        this.handleTabTrapping(event);
      }
    });
  }
  
  setupFocusManagement() {
    // Focus visible indicators for keyboard users
    let usingMouse = false;
    
    document.addEventListener('mousedown', () => {
      usingMouse = true;
    });
    
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Tab') {
        usingMouse = false;
      }
    });
    
    // Enhanced focus visibility
    document.addEventListener('focusin', (event) => {
      if (!usingMouse) {
        event.target.classList.add('keyboard-focus');
        document.body.classList.add('using-keyboard');
      }
    });
    
    document.addEventListener('focusout', (event) => {
      event.target.classList.remove('keyboard-focus');
    });
    
    // Focus restoration for dynamic content changes
    appStore.subscribe((state) => {
      this.restoreFocusAfterStateChange(state);
    });
  }
  
  setupMotionPreferences() {
    this.reducedMotion.addEventListener('change', () => {
      this.applyMotionPreferences();
    });
    
    this.applyMotionPreferences();
  }
  
  applyMotionPreferences() {
    const body = document.body;
    
    if (this.reducedMotion.matches) {
      body.classList.add('reduce-motion');
      // Disable auto-playing animations
      const autoplayElements = document.querySelectorAll('[data-autoplay]');
      autoplayElements.forEach(el => {
        el.removeAttribute('data-autoplay');
        el.classList.add('motion-reduced');
      });
    } else {
      body.classList.remove('reduce-motion');
    }
  }
  
  setupColorSchemePreferences() {
    this.highContrast.addEventListener('change', () => {
      this.applyContrastPreferences();
    });
    
    this.applyContrastPreferences();
  }
  
  applyContrastPreferences() {
    const body = document.body;
    
    if (this.highContrast.matches) {
      body.classList.add('high-contrast');
      this.announce('High contrast mode enabled');
    } else {
      body.classList.remove('high-contrast');
    }
  }
  
  enhanceExistingElements() {
    // Add missing ARIA labels
    this.addMissingAriaLabels();
    
    // Enhance form elements
    this.enhanceFormElements();
    
    // Enhance interactive elements
    this.enhanceInteractiveElements();
    
    // Add landmark roles
    this.addLandmarkRoles();
    
    // Enhance dynamic content areas
    this.enhanceDynamicContent();
  }
  
  addMissingAriaLabels() {
    // Driver cards
    const driverCards = document.querySelectorAll('.driver-card, .enhanced-driver-card');
    driverCards.forEach(card => {
      if (!card.getAttribute('aria-label')) {
        const driverName = card.querySelector('.driver-name')?.textContent || 'Unknown driver';
        const teamName = card.querySelector('.team-name, .driver-team')?.textContent || '';
        const isAvailable = !card.classList.contains('already-picked');
        
        card.setAttribute('aria-label', 
          `${driverName}${teamName ? `, ${teamName}` : ''}${isAvailable ? ', available for selection' : ', already picked'}`
        );
      }
    });
    
    // Navigation items
    const navItems = document.querySelectorAll('nav a, .nav-link');
    navItems.forEach(item => {
      if (!item.getAttribute('aria-label') && !item.getAttribute('aria-labelledby')) {
        const text = item.textContent.trim();
        if (text) {
          const icon = item.querySelector('.icon, .nav-icon')?.textContent || '';
          item.setAttribute('aria-label', `${text}${icon ? ` ${icon}` : ''}`);
        }
      }
    });
    
    // Buttons without labels
    const buttons = document.querySelectorAll('button:not([aria-label]):not([aria-labelledby])');
    buttons.forEach(button => {
      const text = button.textContent.trim();
      if (!text) {
        const icon = button.querySelector('.icon, .btn-icon')?.textContent || '';
        if (icon) {
          button.setAttribute('aria-label', this.getButtonLabelFromIcon(icon));
        }
      }
    });
  }
  
  enhanceFormElements() {
    // Add form validation announcements
    const formInputs = document.querySelectorAll('input, textarea, select');
    formInputs.forEach(input => {
      // Add live region for validation messages
      if (!input.getAttribute('aria-describedby')) {
        const errorId = `${input.id || 'input'}-error`;
        const errorEl = document.createElement('div');
        errorEl.id = errorId;
        errorEl.className = 'field-error sr-only';
        errorEl.setAttribute('aria-live', 'polite');
        input.parentNode.insertBefore(errorEl, input.nextSibling);
        input.setAttribute('aria-describedby', errorId);
      }
      
      // Enhanced focus/blur handling
      input.addEventListener('focus', () => {
        const label = this.getInputLabel(input);
        if (label) {
          this.announce(`Focused on ${label}`);
        }
      });
      
      input.addEventListener('invalid', (event) => {
        const message = event.target.validationMessage;
        const errorEl = document.getElementById(event.target.getAttribute('aria-describedby'));
        if (errorEl) {
          errorEl.textContent = message;
          errorEl.className = 'field-error';
        }
        this.announce(`Error: ${message}`, true);
      });
    });
  }
  
  enhanceInteractiveElements() {
    // Enhanced button states
    const toggleButtons = document.querySelectorAll('[data-toggle], .toggle-btn');
    toggleButtons.forEach(button => {
      if (!button.getAttribute('aria-pressed')) {
        const isPressed = button.classList.contains('active') || 
                         button.classList.contains('selected') ||
                         button.getAttribute('data-state') === 'active';
        button.setAttribute('aria-pressed', isPressed.toString());
      }
    });
    
    // Expandable content
    const expandableElements = document.querySelectorAll('[data-expandable], .expandable');
    expandableElements.forEach(element => {
      const trigger = element.querySelector('[data-toggle-expand], .expand-trigger');
      const content = element.querySelector('[data-expand-content], .expand-content');
      
      if (trigger && content) {
        const contentId = content.id || `expandable-content-${Date.now()}`;
        content.id = contentId;
        trigger.setAttribute('aria-controls', contentId);
        trigger.setAttribute('aria-expanded', 'false');
        
        trigger.addEventListener('click', () => {
          const isExpanded = trigger.getAttribute('aria-expanded') === 'true';
          trigger.setAttribute('aria-expanded', (!isExpanded).toString());
          this.announce(`${isExpanded ? 'Collapsed' : 'Expanded'} ${this.getReadableLabel(trigger)}`);
        });
      }
    });
  }
  
  addLandmarkRoles() {
    // Main content
    const main = document.querySelector('main');
    if (main && !main.getAttribute('role')) {
      main.setAttribute('role', 'main');
      main.id = main.id || 'main-content';
    }
    
    // Navigation
    const nav = document.querySelector('nav');
    if (nav && !nav.getAttribute('role')) {
      nav.setAttribute('role', 'navigation');
      nav.id = nav.id || 'main-nav';
      if (!nav.getAttribute('aria-label')) {
        nav.setAttribute('aria-label', 'Main navigation');
      }
    }
    
    // Complementary content
    const sidebars = document.querySelectorAll('.sidebar, aside');
    sidebars.forEach((sidebar, index) => {
      if (!sidebar.getAttribute('role')) {
        sidebar.setAttribute('role', 'complementary');
        sidebar.setAttribute('aria-label', `Sidebar ${index + 1}`);
      }
    });
    
    // Search
    const searchForms = document.querySelectorAll('form[role="search"], .search-form');
    searchForms.forEach(form => {
      if (!form.getAttribute('role')) {
        form.setAttribute('role', 'search');
      }
      if (!form.getAttribute('aria-label')) {
        form.setAttribute('aria-label', 'Search form');
      }
    });
  }
  
  enhanceDynamicContent() {
    // Live regions for dynamic updates
    const dynamicAreas = [
      { selector: '#driver-grid, .driver-grid', label: 'Driver selection grid' },
      { selector: '#league-standings, .league-standings', label: 'League standings' },
      { selector: '#countdown, .countdown', label: 'Countdown timer' },
      { selector: '#notifications, .notifications', label: 'Notifications' }
    ];
    
    dynamicAreas.forEach(({ selector, label }) => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(element => {
        if (!element.getAttribute('aria-live')) {
          element.setAttribute('aria-live', 'polite');
          element.setAttribute('aria-label', label);
        }
      });
    });
  }
  
  setupEventListeners() {
    // App state changes
    appStore.subscribe((state) => {
      this.announceStateChanges(state);
    });
    
    // Page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        const activeElement = document.activeElement;
        if (activeElement && activeElement !== document.body) {
          this.announce('Page is now visible');
        }
      }
    });
    
    // Navigation changes
    window.addEventListener('popstate', () => {
      const pageTitle = document.title;
      this.announce(`Navigated to ${pageTitle}`, false, 1000);
    });
  }
  
  // Handle keyboard events
  handleEscapeKey() {
    // Close modal dialogs
    const openModals = document.querySelectorAll('.modal.active, .overlay.active, [role="dialog"][aria-hidden="false"]');
    if (openModals.length > 0) {
      const lastModal = openModals[openModals.length - 1];
      const closeButton = lastModal.querySelector('.close-btn, [data-dismiss], [aria-label*="close" i]');
      if (closeButton) {
        closeButton.click();
      }
      return;
    }
    
    // Clear focus from search inputs
    const activeElement = document.activeElement;
    if (activeElement && (activeElement.type === 'search' || activeElement.classList.contains('search-input'))) {
      activeElement.blur();
      this.announce('Search cancelled');
    }
  }
  
  handleArrowNavigation(event) {
    const activeElement = document.activeElement;
    if (!activeElement) return;
    
    // Grid navigation
    const gridParent = activeElement.closest('.driver-grid, .cards-grid, [role="grid"]');
    if (gridParent) {
      event.preventDefault();
      this.navigateGrid(activeElement, event.key, gridParent);
    }
    
    // Menu navigation
    const menuParent = activeElement.closest('[role="menu"], [role="menubar"], .menu-list');
    if (menuParent) {
      event.preventDefault();
      this.navigateMenu(activeElement, event.key, menuParent);
    }
  }
  
  navigateGrid(currentElement, direction, gridContainer) {
    const focusableElements = Array.from(
      gridContainer.querySelectorAll('button:not([disabled]), [tabindex="0"], a[href]')
    );
    const currentIndex = focusableElements.indexOf(currentElement);
    if (currentIndex === -1) return;
    
    const columns = this.getGridColumns(gridContainer);
    let newIndex = currentIndex;
    
    switch (direction) {
      case 'ArrowRight':
        newIndex = Math.min(currentIndex + 1, focusableElements.length - 1);
        break;
      case 'ArrowLeft':
        newIndex = Math.max(currentIndex - 1, 0);
        break;
      case 'ArrowDown':
        newIndex = Math.min(currentIndex + columns, focusableElements.length - 1);
        break;
      case 'ArrowUp':
        newIndex = Math.max(currentIndex - columns, 0);
        break;
    }
    
    if (newIndex !== currentIndex) {
      focusableElements[newIndex].focus();
      const label = this.getElementLabel(focusableElements[newIndex]);
      this.announce(`Moved to ${label}`);
    }
  }
  
  navigateMenu(currentElement, direction, menuContainer) {
    const menuItems = Array.from(
      menuContainer.querySelectorAll('[role="menuitem"], .menu-item, a, button')
    );
    const currentIndex = menuItems.indexOf(currentElement);
    if (currentIndex === -1) return;
    
    let newIndex = currentIndex;
    
    switch (direction) {
      case 'ArrowDown':
        newIndex = (currentIndex + 1) % menuItems.length;
        break;
      case 'ArrowUp':
        newIndex = currentIndex === 0 ? menuItems.length - 1 : currentIndex - 1;
        break;
      case 'Home':
        newIndex = 0;
        break;
      case 'End':
        newIndex = menuItems.length - 1;
        break;
    }
    
    if (newIndex !== currentIndex) {
      menuItems[newIndex].focus();
      const label = this.getElementLabel(menuItems[newIndex]);
      this.announce(`Moved to ${label}`);
    }
  }
  
  handleTabTrapping(event) {
    const activeModal = document.querySelector('.modal.active, [role="dialog"][aria-hidden="false"]');
    if (!activeModal) return;
    
    const focusableElements = Array.from(
      activeModal.querySelectorAll(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    );
    
    if (focusableElements.length === 0) return;
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    
    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
    } else if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  }
  
  // Announcement methods
  announce(message, urgent = false, delay = 100) {
    if (!message) return;
    
    const announcer = urgent ? this.urgentAnnouncer : this.announcer;
    
    setTimeout(() => {
      announcer.textContent = message;
      
      // Clear after announcement to allow repeated messages
      setTimeout(() => {
        announcer.textContent = '';
      }, 1000);
    }, delay);
  }
  
  announceStateChanges(state) {
    const previousState = this.previousState || {};
    
    // League changes
    if (state.activeLeague && state.activeLeague !== previousState.activeLeague) {
      this.announce(`Switched to ${state.activeLeague.name} league`);
    }
    
    // Pick changes
    if (state.currentPick && state.currentPick !== previousState.currentPick) {
      const driver = state.currentPick.driver;
      if (driver) {
        this.announce(`Selected ${driver.name} for your pick`);
      }
    }
    
    // Error announcements
    if (state.error && state.error !== previousState.error) {
      this.announce(`Error: ${state.error.message}`, true);
    }
    
    // Loading state changes
    if (state.isLoading !== previousState.isLoading) {
      if (state.isLoading) {
        this.announce('Loading content');
      } else {
        this.announce('Content loaded');
      }
    }
    
    this.previousState = { ...state };
  }
  
  restoreFocusAfterStateChange(state) {
    // Restore focus to logical element after dynamic content changes
    const activeElement = document.activeElement;
    if (activeElement === document.body) {
      // Try to restore focus to a meaningful element
      const candidates = [
        document.querySelector('.driver-card.selected'),
        document.querySelector('[data-auto-focus]'),
        document.querySelector('h1, h2'),
        document.querySelector('main')
      ];
      
      const targetElement = candidates.find(el => el && el.offsetParent !== null);
      if (targetElement) {
        targetElement.focus();
      }
    }
  }
  
  // Utility methods
  getGridColumns(gridContainer) {
    const computedStyle = window.getComputedStyle(gridContainer);
    const gridTemplateColumns = computedStyle.gridTemplateColumns;
    
    if (gridTemplateColumns && gridTemplateColumns !== 'none') {
      return gridTemplateColumns.split(' ').length;
    }
    
    // Fallback: estimate based on container width and item width
    const firstChild = gridContainer.firstElementChild;
    if (firstChild) {
      const containerWidth = gridContainer.offsetWidth;
      const itemWidth = firstChild.offsetWidth;
      return Math.floor(containerWidth / itemWidth) || 1;
    }
    
    return 4; // Default fallback
  }
  
  getElementLabel(element) {
    return element.getAttribute('aria-label') ||
           element.getAttribute('title') ||
           element.textContent.trim() ||
           element.tagName.toLowerCase();
  }
  
  getInputLabel(input) {
    const id = input.id;
    if (id) {
      const label = document.querySelector(`label[for="${id}"]`);
      if (label) return label.textContent.trim();
    }
    
    return input.getAttribute('placeholder') ||
           input.getAttribute('aria-label') ||
           input.name ||
           'input field';
  }
  
  getReadableLabel(text) {
    return text.replace(/[-_]/g, ' ')
              .replace(/([a-z])([A-Z])/g, '$1 $2')
              .toLowerCase();
  }
  
  getButtonLabelFromIcon(icon) {
    const iconLabels = {
      '✕': 'Close',
      '×': 'Close',
      '⚙️': 'Settings',
      '📊': 'Dashboard',
      '🏆': 'Leagues',
      '🏎️': 'Select driver',
      '👤': 'Profile',
      '🔍': 'Search',
      '📅': 'Calendar',
      '❓': 'Help',
      '🔔': 'Notifications',
      '⏰': 'Deadline',
      '🎯': 'Pick',
      '📈': 'Statistics'
    };
    
    return iconLabels[icon] || 'Button';
  }
  
  // Public methods for enhanced accessibility features
  focusFirstInContainer(container) {
    if (!container) return;
    
    const focusableElement = container.querySelector(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    
    if (focusableElement) {
      focusableElement.focus();
      return true;
    }
    return false;
  }
  
  announcePageChange(pageTitle) {
    this.announce(`Navigated to ${pageTitle}`, false, 500);
  }
  
  announceError(errorMessage) {
    this.announce(`Error: ${errorMessage}`, true);
  }
  
  announceSuccess(successMessage) {
    this.announce(successMessage);
  }
  
  // Cleanup
  destroy() {
    // Remove created elements
    this.announcer?.remove();
    this.urgentAnnouncer?.remove();
    document.getElementById('skip-links')?.remove();
    
    // Remove event listeners would require storing references
    // For now, just clear references
    this.announcer = null;
    this.urgentAnnouncer = null;
    this.focusTrap = null;
  }
}

// Global instance for easy access
let globalAccessibilityEnhancer = null;

// Initialize accessibility enhancements when DOM is ready
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      globalAccessibilityEnhancer = new AccessibilityEnhancer();
    });
  } else {
    globalAccessibilityEnhancer = new AccessibilityEnhancer();
  }
}

// Export both the class and global instance
export { AccessibilityEnhancer, globalAccessibilityEnhancer as accessibility };
export default AccessibilityEnhancer;