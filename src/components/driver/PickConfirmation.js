// PickConfirmation.js - Progressive pick confirmation flow
// Handles driver selection confirmation with clear steps and validation

import { appStore } from '@/store/AppStore.js';
import ErrorHandler from '@/services/error/ErrorHandler.js';

export class PickConfirmation {
  constructor() {
    this.selectedDriver = null;
    this.confirmationModal = null;
    this.successModal = null;
    this.currentStep = 1;
    this.isProcessing = false;
    
    this.initialize();
  }
  
  initialize() {
    this.setupModals();
    this.setupEventListeners();
  }
  
  setupModals() {
    this.confirmationModal = document.getElementById('pick-confirmation-modal');
    this.successModal = document.getElementById('pick-success-modal');
    
    if (!this.confirmationModal || !this.successModal) {
      console.error('Pick confirmation modals not found in DOM');
      return;
    }
  }
  
  setupEventListeners() {
    // Listen for driver selection events
    document.addEventListener('driverSelected', (event) => {
      this.handleDriverSelection(event.detail);
    });
    
    // Confirmation modal events
    this.setupConfirmationEvents();
    this.setupSuccessEvents();
    
    // Global escape key handler
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        if (this.isModalOpen()) {
          this.closeAllModals();
        }
      }
    });
  }
  
  setupConfirmationEvents() {
    const modal = this.confirmationModal;
    if (!modal) return;
    
    // Close button
    const closeBtn = modal.querySelector('#confirmation-close-btn');
    closeBtn?.addEventListener('click', () => this.closeConfirmation());
    
    // Cancel button
    const cancelBtn = modal.querySelector('#confirmation-cancel-btn');
    cancelBtn?.addEventListener('click', () => this.closeConfirmation());
    
    // Confirm button
    const confirmBtn = modal.querySelector('#confirmation-confirm-btn');
    confirmBtn?.addEventListener('click', () => this.confirmPick());
    
    // Overlay click to close
    const overlay = modal.querySelector('#confirmation-overlay');
    overlay?.addEventListener('click', () => this.closeConfirmation());
    
    // Prevent modal content clicks from closing
    const content = modal.querySelector('.modal-content');
    content?.addEventListener('click', (event) => event.stopPropagation());
  }
  
  setupSuccessEvents() {
    const modal = this.successModal;
    if (!modal) return;
    
    // Dashboard button
    const dashboardBtn = modal.querySelector('#success-dashboard-btn');
    dashboardBtn?.addEventListener('click', () => {
      this.closeAllModals();
      window.location.href = '/dashboard';
    });
    
    // Close button
    const closeBtn = modal.querySelector('#success-close-btn');
    closeBtn?.addEventListener('click', () => {
      this.closeAllModals();
    });
    
    // Overlay click to close
    modal.addEventListener('click', (event) => {
      if (event.target === modal) {
        this.closeAllModals();
      }
    });
  }
  
  async handleDriverSelection(selectionDetail) {
    try {
      console.log('Handling driver selection:', selectionDetail);
      
      this.selectedDriver = selectionDetail.driver;
      
      // Validate selection
      const validation = await this.validateSelection(this.selectedDriver);
      
      if (!validation.valid) {
        this.showValidationError(validation.error);
        return;
      }
      
      // Show confirmation modal
      this.showConfirmation();
      
    } catch (error) {
      ErrorHandler.handle(error, {
        action: 'handleDriverSelection',
        driverId: selectionDetail.driver?.id
      });
    }
  }
  
  async validateSelection(driver) {
    try {
      // Check if driver is available
      if (driver.isAlreadyPicked) {
        return {
          valid: false,
          error: {
            type: 'DriverAlreadyPicked',
            message: `You have already selected ${driver.name} in a previous race.`,
            actions: [
              { label: 'Choose Different Driver', action: 'selectDifferentDriver' }
            ]
          }
        };
      }
      
      // Check deadline
      const deadlineCheck = await this.checkPickDeadline();
      if (!deadlineCheck.valid) {
        return {
          valid: false,
          error: deadlineCheck.error
        };
      }
      
      // Check league context
      const state = appStore.getState();
      if (!state.activeLeague) {
        return {
          valid: false,
          error: {
            type: 'NoActiveLeague',
            message: 'Please select a league before making your pick.',
            actions: [
              { label: 'Select League', action: 'selectLeague' }
            ]
          }
        };
      }
      
      return { valid: true };
      
    } catch (error) {
      return {
        valid: false,
        error: {
          type: 'ValidationError',
          message: 'Unable to validate selection. Please try again.',
          actions: [
            { label: 'Try Again', action: 'retry' }
          ]
        }
      };
    }
  }
  
  async checkPickDeadline() {
    // This would integrate with DeadlineManager
    // For now, return valid
    return { valid: true };
  }
  
  showValidationError(error) {
    ErrorHandler.handle(error, {
      action: 'validateDriverSelection',
      driverId: this.selectedDriver?.id
    });
  }
  
  showConfirmation() {
    if (!this.confirmationModal || !this.selectedDriver) return;
    
    // Populate confirmation content
    this.populateConfirmationContent();
    
    // Show modal
    this.confirmationModal.style.display = 'flex';
    this.confirmationModal.classList.add('active');
    
    // Focus management
    const confirmBtn = this.confirmationModal.querySelector('#confirmation-confirm-btn');
    setTimeout(() => confirmBtn?.focus(), 100);
    
    // Prevent body scroll
    document.body.classList.add('modal-open');
  }
  
  populateConfirmationContent() {
    const bodyContainer = this.confirmationModal.querySelector('#confirmation-body');
    if (!bodyContainer) return;
    
    const driver = this.selectedDriver;
    const state = appStore.getState();
    const league = state.activeLeague;
    
    bodyContainer.innerHTML = `
      <div class="confirmation-content">
        <!-- Driver summary -->
        <div class="driver-summary">
          <div class="driver-summary-image">
            <img src="${driver.imageUrl}" 
                 alt="${driver.name}" 
                 onerror="this.src='/assets/images/drivers/default.svg'">
          </div>
          <div class="driver-summary-info">
            <h4 class="driver-summary-name">${driver.name}</h4>
            <div class="driver-summary-team" style="color: ${driver.teamColor}">${driver.team}</div>
            <div class="driver-summary-number">Car #${driver.number}</div>
          </div>
        </div>
        
        <!-- Race context -->
        <div class="race-context">
          <div class="context-item">
            <span class="context-label">Race:</span>
            <span class="context-value" id="race-name">Loading...</span>
          </div>
          <div class="context-item">
            <span class="context-label">League:</span>
            <span class="context-value">${league?.name || 'No league selected'}</span>
          </div>
          <div class="context-item">
            <span class="context-label">Deadline:</span>
            <span class="context-value" id="deadline-display">Loading...</span>
          </div>
        </div>
        
        <!-- Pick strategy info -->
        <div class="pick-strategy">
          <div class="strategy-header">
            <span class="strategy-icon">💡</span>
            <span class="strategy-title">Pick Strategy</span>
          </div>
          <div class="strategy-content">
            ${this.getPickStrategy(driver)}
          </div>
        </div>
        
        <!-- Important reminders -->
        <div class="confirmation-reminders">
          <div class="reminder">
            <span class="reminder-icon">⚠️</span>
            <span class="reminder-text">You can only pick each driver once per season</span>
          </div>
          <div class="reminder">
            <span class="reminder-icon">🏁</span>
            <span class="reminder-text">Driver must finish in top 10 to survive</span>
          </div>
          <div class="reminder">
            <span class="reminder-icon">⏰</span>
            <span class="reminder-text">You can change this pick until 1 hour before the race</span>
          </div>
        </div>
      </div>
    `;
    
    // Load dynamic content
    this.loadRaceContext();
    this.loadDeadlineInfo();
  }
  
  getPickStrategy(driver) {
    const { championship, recentForm } = driver;
    
    if (championship?.position <= 3) {
      return `
        <div class="strategy-point high-reward">
          🏆 <strong>High Risk, High Reward:</strong> Championship contender with excellent pace, but higher chance of incidents or strategic risks.
        </div>
      `;
    }
    
    if (recentForm?.length > 0) {
      const topTenFinishes = recentForm.filter(r => r.position <= 10).length;
      const ratio = topTenFinishes / recentForm.length;
      
      if (ratio >= 0.8) {
        return `
          <div class="strategy-point safe-choice">
            🎯 <strong>Safe Choice:</strong> Consistently finishes in the points (${topTenFinishes}/${recentForm.length} recent races). Reliable option for survival.
          </div>
        `;
      } else if (ratio >= 0.6) {
        return `
          <div class="strategy-point moderate-risk">
            ⚖️ <strong>Moderate Risk:</strong> Solid midfield performance (${topTenFinishes}/${recentForm.length} recent points finishes). Balanced risk/reward.
          </div>
        `;
      } else {
        return `
          <div class="strategy-point high-risk">
            🎲 <strong>Risky Pick:</strong> Inconsistent recent performance (${topTenFinishes}/${recentForm.length} recent points finishes). Could pay off big or eliminate you.
          </div>
        `;
      }
    }
    
    return `
      <div class="strategy-point unknown">
        📊 <strong>Limited Data:</strong> Consider recent team performance and qualifying position when available.
      </div>
    `;
  }
  
  async loadRaceContext() {
    try {
      // This would load current race information
      // For now, use placeholder
      const raceElement = document.getElementById('race-name');
      if (raceElement) {
        raceElement.textContent = 'Australian Grand Prix'; // Placeholder
      }
    } catch (error) {
      console.warn('Failed to load race context:', error);
    }
  }
  
  async loadDeadlineInfo() {
    try {
      // This would load deadline information  
      // For now, use placeholder
      const deadlineElement = document.getElementById('deadline-display');
      if (deadlineElement) {
        deadlineElement.textContent = '2 hours 34 minutes'; // Placeholder
      }
    } catch (error) {
      console.warn('Failed to load deadline info:', error);
    }
  }
  
  async confirmPick() {
    if (this.isProcessing || !this.selectedDriver) return;
    
    try {
      this.isProcessing = true;
      this.updateConfirmButton(true);
      
      console.log('Confirming pick for:', this.selectedDriver.name);
      
      // Save the pick (this would integrate with your pick saving logic)
      const result = await this.savePick(this.selectedDriver);
      
      if (result.success) {
        this.showSuccess(result);
      } else {
        throw new Error(result.error || 'Failed to save pick');
      }
      
    } catch (error) {
      console.error('Failed to confirm pick:', error);
      
      ErrorHandler.handle(error, {
        action: 'confirmPick',
        driverId: this.selectedDriver.id,
        driverName: this.selectedDriver.name,
        retryFunction: () => this.confirmPick()
      });
      
    } finally {
      this.isProcessing = false;
      this.updateConfirmButton(false);
    }
  }
  
  updateConfirmButton(processing) {
    const confirmBtn = this.confirmationModal?.querySelector('#confirmation-confirm-btn');
    if (!confirmBtn) return;
    
    const btnText = confirmBtn.querySelector('.btn-text');
    const btnSpinner = confirmBtn.querySelector('.btn-spinner');
    
    if (processing) {
      confirmBtn.disabled = true;
      confirmBtn.classList.add('processing');
      if (btnText) btnText.textContent = 'Confirming Pick...';
      if (btnSpinner) btnSpinner.style.display = 'inline';
    } else {
      confirmBtn.disabled = false;
      confirmBtn.classList.remove('processing');
      if (btnText) btnText.textContent = 'Confirm Pick';
      if (btnSpinner) btnSpinner.style.display = 'none';
    }
  }
  
  async savePick(driver) {
    // This would integrate with your actual pick saving logic
    // For now, simulate the API call
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          pickId: `pick_${Date.now()}`,
          message: 'Pick saved successfully'
        });
      }, 2000);
    });
  }
  
  showSuccess(result) {
    // Close confirmation modal
    this.closeConfirmation();
    
    // Populate success content
    this.populateSuccessContent(result);
    
    // Show success modal
    this.successModal.style.display = 'flex';
    this.successModal.classList.add('active');
    
    // Focus management
    const closeBtn = this.successModal.querySelector('#success-close-btn');
    setTimeout(() => closeBtn?.focus(), 100);
  }
  
  populateSuccessContent(result) {
    const bodyContainer = this.successModal.querySelector('#success-body');
    if (!bodyContainer || !this.selectedDriver) return;
    
    const driver = this.selectedDriver;
    const state = appStore.getState();
    const league = state.activeLeague;
    
    bodyContainer.innerHTML = `
      <div class="success-content">
        <div class="success-summary">
          <div class="success-driver">
            <img src="${driver.imageUrl}" 
                 alt="${driver.name}"
                 onerror="this.src='/assets/images/drivers/default.svg'">
            <div class="success-driver-info">
              <h4>${driver.name}</h4>
              <div class="success-team" style="color: ${driver.teamColor}">${driver.team}</div>
            </div>
          </div>
          
          <div class="success-message">
            Your pick for <strong>${league?.name || 'the current league'}</strong> has been confirmed!
          </div>
        </div>
        
        <div class="success-details">
          <div class="success-tip">
            <span class="tip-icon">💡</span>
            <span class="tip-text">You can change your pick until 1 hour before the race starts.</span>
          </div>
          
          <div class="success-reminder">
            <span class="reminder-icon">🏁</span>
            <span class="reminder-text">Good luck! ${driver.name} needs to finish in the top 10 for you to survive.</span>
          </div>
        </div>
        
        <div class="next-steps">
          <h5>What's next?</h5>
          <ul class="next-steps-list">
            <li>Watch the race and cheer for ${driver.name}!</li>
            <li>Check your league standings after the race</li>
            <li>Prepare your strategy for the next race</li>
          </ul>
        </div>
      </div>
    `;
  }
  
  closeConfirmation() {
    if (!this.confirmationModal) return;
    
    this.confirmationModal.style.display = 'none';
    this.confirmationModal.classList.remove('active');
    document.body.classList.remove('modal-open');
    
    // Clear selected driver visual state
    this.clearDriverSelection();
  }
  
  closeAllModals() {
    this.closeConfirmation();
    
    if (this.successModal) {
      this.successModal.style.display = 'none';
      this.successModal.classList.remove('active');
    }
    
    document.body.classList.remove('modal-open');
  }
  
  clearDriverSelection() {
    // Remove selection from all driver cards
    const selectedCards = document.querySelectorAll('.enhanced-driver-card.selected');
    selectedCards.forEach(card => {
      card.classList.remove('selected');
      card.setAttribute('aria-pressed', 'false');
      
      const actionBtn = card.querySelector('.driver-action-btn');
      if (actionBtn && !card.classList.contains('already-picked')) {
        actionBtn.className = 'driver-action-btn available';
        actionBtn.innerHTML = `
          <span class="btn-icon">🏎️</span>
          <span class="btn-text">Select Driver</span>
        `;
      }
    });
    
    this.selectedDriver = null;
  }
  
  isModalOpen() {
    return (this.confirmationModal?.style.display === 'flex') || 
           (this.successModal?.style.display === 'flex');
  }
  
  // Public method to handle existing picks
  showExistingPick(pickData) {
    // This would be called if user already has a pick for this race
    // Show different UI flow for changing existing pick
    console.log('Showing existing pick flow:', pickData);
  }
  
  destroy() {
    // Cleanup event listeners and references
    document.removeEventListener('driverSelected', this.handleDriverSelection);
    this.selectedDriver = null;
    this.confirmationModal = null;
    this.successModal = null;
  }
}

export default PickConfirmation;