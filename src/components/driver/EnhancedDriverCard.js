// EnhancedDriverCard.js - Enhanced driver selection cards with performance data
// Provides rich driver information and clear selection states

import { appStore } from '@/store/AppStore.js';
import ErrorHandler from '@/services/error/ErrorHandler.js';

export class EnhancedDriverCard {
  constructor(driver, options = {}) {
    this.driver = driver;
    this.options = {
      showPerformance: true,
      showTeamInfo: true,
      showPickability: true,
      clickable: true,
      ...options
    };
    
    this.element = null;
    this.isSelected = false;
    this.isDisabled = false;
    this.clickHandler = null;
  }
  
  // Create the enhanced driver card HTML
  render() {
    const {
      id,
      number,
      name,
      team,
      teamColor,
      imageUrl,
      isAlreadyPicked,
      championship = {},
      recentForm = [],
      teamStanding = null
    } = this.driver;
    
    const cardClasses = [
      'enhanced-driver-card',
      isAlreadyPicked ? 'already-picked' : 'available',
      this.isSelected ? 'selected' : '',
      this.isDisabled ? 'disabled' : '',
      this.options.clickable ? 'clickable' : ''
    ].filter(Boolean).join(' ');
    
    const cardHTML = `
      <div class="${cardClasses}" 
           data-driver-id="${id}"
           data-driver-name="${name}"
           data-team="${team}"
           role="${this.options.clickable ? 'button' : 'article'}"
           tabindex="${this.options.clickable && !isAlreadyPicked ? '0' : '-1'}"
           aria-label="Driver: ${name}, Team: ${team}${isAlreadyPicked ? ', Already picked' : ', Available for selection'}"
           style="--team-color: ${teamColor}; --team-color-alpha: ${this.hexToRgba(teamColor, 0.1)}">
        
        <!-- Selection indicator -->
        <div class="selection-indicator" aria-hidden="true">
          <div class="selection-check">✓</div>
        </div>
        
        <!-- Driver number badge -->
        <div class="driver-number-badge" style="background: ${teamColor}">
          ${number}
        </div>
        
        <!-- Driver image -->
        <div class="driver-image-container">
          <img src="${imageUrl}" 
               alt="${name} portrait" 
               class="driver-image"
               onerror="this.src='/assets/images/drivers/default.svg'; this.classList.add('fallback-image');">
          
          ${isAlreadyPicked ? `
            <div class="picked-overlay">
              <div class="picked-icon">🚫</div>
              <div class="picked-text">Already Picked</div>
            </div>
          ` : ''}
        </div>
        
        <!-- Driver info -->
        <div class="driver-info">
          <h3 class="driver-name">${name}</h3>
          <div class="team-info" style="color: ${teamColor}">
            <span class="team-name">${team}</span>
            ${teamStanding ? `<span class="team-standing">#${teamStanding}</span>` : ''}
          </div>
        </div>
        
        ${this.options.showPerformance ? this.renderPerformanceInfo(championship, recentForm) : ''}
        
        <!-- Availability status -->
        <div class="availability-status">
          ${this.renderAvailabilityStatus()}
        </div>
        
        <!-- Action button -->
        ${this.options.clickable ? this.renderActionButton() : ''}
        
        <!-- Tooltip for additional info -->
        ${this.renderTooltip()}
      </div>
    `;
    
    // Create element from HTML
    const container = document.createElement('div');
    container.innerHTML = cardHTML;
    this.element = container.firstElementChild;
    
    // Attach event listeners
    this.attachEventListeners();
    
    return this.element;
  }
  
  renderPerformanceInfo(championship, recentForm) {
    const { position = 'N/A', points = 0 } = championship;
    
    return `
      <div class="performance-info">
        <div class="championship-info">
          <div class="championship-stat">
            <span class="stat-label">Championship</span>
            <span class="stat-value">${position === 'N/A' ? 'N/A' : `P${position}`}</span>
          </div>
          <div class="points-stat">
            <span class="stat-label">Points</span>
            <span class="stat-value">${points}</span>
          </div>
        </div>
        
        ${recentForm.length > 0 ? `
          <div class="recent-form">
            <span class="form-label">Last 5 races:</span>
            <div class="form-results">
              ${recentForm.slice(0, 5).map(result => `
                <span class="form-result ${this.getResultClass(result)}" title="${result.raceName}: P${result.position}">
                  ${result.position}
                </span>
              `).join('')}
            </div>
          </div>
        ` : ''}
      </div>
    `;
  }
  
  renderAvailabilityStatus() {
    if (this.driver.isAlreadyPicked) {
      return `
        <div class="status-unavailable">
          <span class="status-icon">🚫</span>
          <span class="status-text">Previously Selected</span>
        </div>
      `;
    }
    
    if (this.isDisabled) {
      return `
        <div class="status-disabled">
          <span class="status-icon">⏸️</span>
          <span class="status-text">Selection Locked</span>
        </div>
      `;
    }
    
    return `
      <div class="status-available">
        <span class="status-icon">✅</span>
        <span class="status-text">Available</span>
      </div>
    `;
  }
  
  renderActionButton() {
    if (this.driver.isAlreadyPicked) {
      return `
        <button class="driver-action-btn unavailable" disabled>
          <span class="btn-icon">🚫</span>
          <span class="btn-text">Already Picked</span>
        </button>
      `;
    }
    
    if (this.isSelected) {
      return `
        <button class="driver-action-btn selected">
          <span class="btn-icon">✓</span>
          <span class="btn-text">Selected</span>
        </button>
      `;
    }
    
    return `
      <button class="driver-action-btn available">
        <span class="btn-icon">🏎️</span>
        <span class="btn-text">Select Driver</span>
      </button>
    `;
  }
  
  renderTooltip() {
    if (this.driver.isAlreadyPicked) {
      return `
        <div class="driver-tooltip">
          You selected ${this.driver.name} in a previous race and cannot pick them again this season.
        </div>
      `;
    }
    
    const { championship, recentForm } = this.driver;
    const avgFinish = recentForm.length > 0 
      ? (recentForm.reduce((sum, r) => sum + r.position, 0) / recentForm.length).toFixed(1)
      : 'N/A';
    
    return `
      <div class="driver-tooltip">
        <div class="tooltip-header">
          <strong>${this.driver.name}</strong>
          <span class="tooltip-team">${this.driver.team}</span>
        </div>
        <div class="tooltip-stats">
          <div class="tooltip-stat">Championship: ${championship.position ? `P${championship.position}` : 'N/A'}</div>
          <div class="tooltip-stat">Points: ${championship.points || 0}</div>
          ${avgFinish !== 'N/A' ? `<div class="tooltip-stat">Avg. Finish: P${avgFinish}</div>` : ''}
        </div>
        <div class="tooltip-tip">
          ${this.getDriverTip()}
        </div>
      </div>
    `;
  }
  
  getDriverTip() {
    const { championship, recentForm } = this.driver;
    
    if (championship.position && championship.position <= 3) {
      return "🏆 Championship contender - High risk, high reward!";
    }
    
    if (recentForm.length > 0) {
      const topTenFinishes = recentForm.filter(r => r.position <= 10).length;
      const ratio = topTenFinishes / recentForm.length;
      
      if (ratio >= 0.8) {
        return "🎯 Consistently finishes in points - Safe choice!";
      } else if (ratio >= 0.6) {
        return "⚖️ Solid midfield option - Moderate risk";
      } else {
        return "🎲 Risky pick - Could pay off or eliminate you";
      }
    }
    
    return "📊 Limited data available - Consider recent team performance";
  }
  
  getResultClass(result) {
    if (result.position <= 3) return 'podium';
    if (result.position <= 10) return 'points';
    if (result.position <= 15) return 'midfield';
    return 'back';
  }
  
  // Attach event listeners to the card
  attachEventListeners() {
    if (!this.options.clickable || this.driver.isAlreadyPicked) return;
    
    this.clickHandler = (event) => {
      event.preventDefault();
      event.stopPropagation();
      
      if (this.isDisabled) return;
      
      this.handleSelection();
    };
    
    // Click handler
    this.element.addEventListener('click', this.clickHandler);
    
    // Keyboard handler
    this.element.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        this.clickHandler(event);
      }
    });
    
    // Hover effects
    this.element.addEventListener('mouseenter', () => {
      if (!this.isDisabled && !this.driver.isAlreadyPicked) {
        this.element.classList.add('hover');
      }
    });
    
    this.element.addEventListener('mouseleave', () => {
      this.element.classList.remove('hover');
    });
    
    // Focus effects
    this.element.addEventListener('focus', () => {
      this.element.classList.add('focused');
    });
    
    this.element.addEventListener('blur', () => {
      this.element.classList.remove('focused');
    });
  }
  
  handleSelection() {
    try {
      console.log('Driver card selected:', this.driver.name);
      
      // Update visual state
      this.setSelected(true);
      
      // Dispatch selection event
      const selectionEvent = new CustomEvent('driverSelected', {
        detail: {
          driver: this.driver,
          card: this
        },
        bubbles: true
      });
      
      this.element.dispatchEvent(selectionEvent);
      
    } catch (error) {
      ErrorHandler.handle(error, {
        action: 'selectDriver',
        driverId: this.driver.id,
        driverName: this.driver.name
      });
    }
  }
  
  // Update card selection state
  setSelected(selected) {
    this.isSelected = selected;
    
    if (selected) {
      this.element.classList.add('selected');
      this.element.setAttribute('aria-pressed', 'true');
      
      // Update button
      const actionBtn = this.element.querySelector('.driver-action-btn');
      if (actionBtn) {
        actionBtn.className = 'driver-action-btn selected';
        actionBtn.innerHTML = `
          <span class="btn-icon">✓</span>
          <span class="btn-text">Selected</span>
        `;
      }
    } else {
      this.element.classList.remove('selected');
      this.element.setAttribute('aria-pressed', 'false');
      
      // Update button
      const actionBtn = this.element.querySelector('.driver-action-btn');
      if (actionBtn) {
        actionBtn.className = 'driver-action-btn available';
        actionBtn.innerHTML = `
          <span class="btn-icon">🏎️</span>
          <span class="btn-text">Select Driver</span>
        `;
      }
    }
  }
  
  // Disable/enable the card
  setDisabled(disabled) {
    this.isDisabled = disabled;
    
    if (disabled) {
      this.element.classList.add('disabled');
      this.element.setAttribute('tabindex', '-1');
      this.element.setAttribute('aria-disabled', 'true');
    } else {
      this.element.classList.remove('disabled');
      if (this.options.clickable && !this.driver.isAlreadyPicked) {
        this.element.setAttribute('tabindex', '0');
      }
      this.element.removeAttribute('aria-disabled');
    }
  }
  
  // Update driver data (for live updates)
  updateDriver(newDriverData) {
    this.driver = { ...this.driver, ...newDriverData };
    
    // Re-render the card
    const parent = this.element.parentNode;
    const newElement = this.render();
    
    if (parent) {
      parent.replaceChild(newElement, this.element);
    }
  }
  
  // Cleanup
  destroy() {
    if (this.clickHandler) {
      this.element.removeEventListener('click', this.clickHandler);
    }
    
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
    
    this.element = null;
    this.clickHandler = null;
  }
  
  // Utility methods
  hexToRgba(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  
  // Static method to create cards from driver data
  static createCards(drivers, options = {}) {
    return drivers.map(driver => new EnhancedDriverCard(driver, options));
  }
  
  // Static method to render cards into container
  static renderCardsIntoContainer(drivers, container, options = {}) {
    // Clear container
    container.innerHTML = '';
    
    // Create and render cards
    const cards = this.createCards(drivers, options);
    const fragment = document.createDocumentFragment();
    
    cards.forEach(card => {
      fragment.appendChild(card.render());
    });
    
    container.appendChild(fragment);
    
    return cards;
  }
}

export default EnhancedDriverCard;