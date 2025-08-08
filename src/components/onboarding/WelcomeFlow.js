// WelcomeFlow.js - Improved onboarding experience for new users
// Guides users through initial setup with clear steps and contextual help

import { appStore } from '@/store/AppStore.js';
import ErrorHandler from '@/services/error/ErrorHandler.js';

export class WelcomeFlow {
  constructor() {
    this.currentStep = 0;
    this.totalSteps = 4;
    this.modal = null;
    this.isActive = false;
    this.userData = {};
    this.initialize();
  }
  
  initialize() {
    this.createModal();
    this.setupEventListeners();
  }
  
  createModal() {
    // Create welcome flow modal structure
    const modalHTML = `
      <div class="welcome-flow-modal" id="welcome-flow-modal" style="display: none;">
        <div class="welcome-overlay"></div>
        <div class="welcome-content">
          <div class="welcome-header">
            <div class="welcome-logo">
              <img src="/assets/images/F1-Logo.png" alt="F1 Logo" class="welcome-logo-img">
            </div>
            <button class="welcome-close-btn" id="welcome-close-btn" aria-label="Skip onboarding">&times;</button>
          </div>
          
          <div class="welcome-body" id="welcome-body">
            <!-- Steps populated by JavaScript -->
          </div>
          
          <div class="welcome-footer">
            <div class="step-indicator" id="step-indicator">
              <!-- Step dots populated by JavaScript -->
            </div>
            <div class="welcome-actions">
              <button class="btn secondary" id="welcome-back-btn" style="display: none;">Back</button>
              <button class="btn primary" id="welcome-next-btn">Get Started</button>
              <button class="btn ghost" id="welcome-skip-btn">Skip</button>
            </div>
          </div>
        </div>
      </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    this.modal = document.getElementById('welcome-flow-modal');
  }
  
  setupEventListeners() {
    // Modal controls
    document.getElementById('welcome-close-btn')?.addEventListener('click', () => this.close());
    document.getElementById('welcome-next-btn')?.addEventListener('click', () => this.nextStep());
    document.getElementById('welcome-back-btn')?.addEventListener('click', () => this.previousStep());
    document.getElementById('welcome-skip-btn')?.addEventListener('click', () => this.skip());
    
    // Overlay click to close
    this.modal?.querySelector('.welcome-overlay')?.addEventListener('click', () => this.close());
    
    // Keyboard navigation
    document.addEventListener('keydown', (event) => {
      if (!this.isActive) return;
      
      if (event.key === 'Escape') {
        this.close();
      } else if (event.key === 'ArrowRight' || event.key === 'Enter') {
        event.preventDefault();
        this.nextStep();
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        this.previousStep();
      }
    });
    
    // Listen for auth state changes
    appStore.subscribe((state) => {
      if (state.user && state.onboarding?.showWelcome) {
        this.start();
      }
    });
  }
  
  start(forceShow = false) {
    const state = appStore.getState();
    
    // Check if user should see onboarding
    if (!forceShow && !this.shouldShowOnboarding(state)) {
      return;
    }
    
    console.log('Starting welcome flow');
    
    this.isActive = true;
    this.currentStep = 0;
    this.userData = { ...state.user };
    
    this.updateStepIndicator();
    this.renderCurrentStep();
    this.show();
    
    // Track onboarding start
    this.trackEvent('onboarding_started');
  }
  
  shouldShowOnboarding(state) {
    // Show onboarding if:
    // 1. User is authenticated
    // 2. User hasn't completed onboarding
    // 3. User has no active leagues
    // 4. It's been requested via state
    
    if (!state.user) return false;
    
    if (state.onboarding?.showWelcome) return true;
    if (state.onboarding?.completed) return false;
    if (state.leagues?.length > 0) return false;
    
    // Check if this is a new user (account created recently)
    const accountAge = Date.now() - new Date(state.user.createdAt || 0).getTime();
    const isNewUser = accountAge < (7 * 24 * 60 * 60 * 1000); // 7 days
    
    return isNewUser;
  }
  
  renderCurrentStep() {
    const bodyContainer = document.getElementById('welcome-body');
    if (!bodyContainer) return;
    
    const steps = [
      this.renderWelcomeStep(),
      this.renderHowItWorksStep(),
      this.renderLeagueSetupStep(),
      this.renderReadyStep()
    ];
    
    bodyContainer.innerHTML = steps[this.currentStep];
    
    // Attach step-specific event listeners
    this.attachStepEventListeners();
    
    // Update navigation buttons
    this.updateNavigationButtons();
  }
  
  renderWelcomeStep() {
    return `
      <div class="welcome-step welcome-step-1" data-step="welcome">
        <div class="step-content">
          <div class="step-icon">🏎️</div>
          <h2 class="step-title">Welcome to F1 Survivor!</h2>
          <p class="step-description">
            Join the ultimate Formula 1 prediction game. Pick a different driver for each race, 
            but choose wisely - they must finish in the top 10 for you to survive!
          </p>
          
          <div class="welcome-highlights">
            <div class="highlight">
              <span class="highlight-icon">🎯</span>
              <div class="highlight-content">
                <strong>Pick Strategically</strong>
                <span>Choose a different driver each race</span>
              </div>
            </div>
            <div class="highlight">
              <span class="highlight-icon">🏆</span>
              <div class="highlight-content">
                <strong>Compete & Win</strong>
                <span>Last survivor in your league wins!</span>
              </div>
            </div>
            <div class="highlight">
              <span class="highlight-icon">👥</span>
              <div class="highlight-content">
                <strong>Play with Friends</strong>
                <span>Create or join leagues with anyone</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }
  
  renderHowItWorksStep() {
    return `
      <div class="welcome-step welcome-step-2" data-step="how-it-works">
        <div class="step-content">
          <div class="step-icon">📋</div>
          <h2 class="step-title">How F1 Survivor Works</h2>
          <p class="step-description">
            Follow these simple rules to master the game:
          </p>
          
          <div class="rules-list">
            <div class="rule-item">
              <div class="rule-number">1</div>
              <div class="rule-content">
                <strong>Pick Before the Deadline</strong>
                <p>Select your driver 1 hour before each race starts</p>
              </div>
            </div>
            
            <div class="rule-item">
              <div class="rule-number">2</div>
              <div class="rule-content">
                <strong>Top 10 to Survive</strong>
                <p>Your driver must finish in the points (top 10) for you to advance</p>
              </div>
            </div>
            
            <div class="rule-item">
              <div class="rule-number">3</div>
              <div class="rule-content">
                <strong>One Driver Per Season</strong>
                <p>You can only pick each driver once throughout the entire season</p>
              </div>
            </div>
            
            <div class="rule-item">
              <div class="rule-number">4</div>
              <div class="rule-content">
                <strong>Last One Standing Wins</strong>
                <p>Keep surviving races until you're the last player in your league</p>
              </div>
            </div>
          </div>
          
          <div class="strategy-tip">
            <div class="tip-icon">💡</div>
            <div class="tip-content">
              <strong>Pro Tip:</strong> Save your championship contenders for later races when the competition gets tougher!
            </div>
          </div>
        </div>
      </div>
    `;
  }
  
  renderLeagueSetupStep() {
    return `
      <div class="welcome-step welcome-step-3" data-step="league-setup">
        <div class="step-content">
          <div class="step-icon">🏆</div>
          <h2 class="step-title">Join Your First League</h2>
          <p class="step-description">
            Leagues are where the competition happens. You can join existing leagues or create your own.
          </p>
          
          <div class="league-options">
            <div class="league-option" data-option="join">
              <div class="option-icon">👥</div>
              <div class="option-content">
                <h3>Join Existing League</h3>
                <p>Got an invite code? Join friends and family in their league</p>
                <div class="option-form">
                  <input type="text" id="invite-code-input" placeholder="Enter invite code" class="form-input">
                  <button class="btn primary" id="join-league-btn">Join League</button>
                </div>
              </div>
            </div>
            
            <div class="league-divider">
              <span>or</span>
            </div>
            
            <div class="league-option" data-option="create">
              <div class="option-icon">➕</div>
              <div class="option-content">
                <h3>Create New League</h3>
                <p>Start your own league and invite others to join</p>
                <div class="option-form">
                  <input type="text" id="league-name-input" placeholder="League name" class="form-input">
                  <button class="btn primary" id="create-league-btn">Create League</button>
                </div>
              </div>
            </div>
          </div>
          
          <div class="skip-option">
            <p>Not ready to join a league? You can always do this later from your dashboard.</p>
          </div>
        </div>
      </div>
    `;
  }
  
  renderReadyStep() {
    const state = appStore.getState();
    const { activeLeague, nextRace } = state;
    
    return `
      <div class="welcome-step welcome-step-4" data-step="ready">
        <div class="step-content">
          <div class="step-icon">🎉</div>
          <h2 class="step-title">You're All Set!</h2>
          <p class="step-description">
            Welcome to F1 Survivor! Here's what you can do next:
          </p>
          
          <div class="next-steps">
            ${activeLeague ? `
              <div class="next-step completed">
                <span class="step-status">✅</span>
                <div class="step-info">
                  <strong>League Joined</strong>
                  <span>You're now part of "${activeLeague.name}"</span>
                </div>
              </div>
            ` : `
              <div class="next-step pending">
                <span class="step-status">📝</span>
                <div class="step-info">
                  <strong>Join a League</strong>
                  <span>Create or join a league to start competing</span>
                </div>
              </div>
            `}
            
            ${nextRace ? `
              <div class="next-step ${activeLeague ? 'pending' : 'disabled'}">
                <span class="step-status">🏎️</span>
                <div class="step-info">
                  <strong>Make Your First Pick</strong>
                  <span>Choose your driver for ${nextRace.name}</span>
                </div>
              </div>
            ` : ''}
            
            <div class="next-step">
              <span class="step-status">📊</span>
              <div class="step-info">
                <strong>Explore Your Dashboard</strong>
                <span>Track your progress and league standings</span>
              </div>
            </div>
            
            <div class="next-step">
              <span class="step-status">👥</span>
              <div class="step-info">
                <strong>Invite Friends</strong>
                <span>Share your league code and compete together</span>
              </div>
            </div>
          </div>
          
          <div class="ready-actions">
            ${activeLeague && nextRace ? `
              <button class="btn primary large" id="make-first-pick-btn">
                <span class="btn-icon">🏁</span>
                Make Your First Pick
              </button>
            ` : !activeLeague ? `
              <button class="btn primary large" id="join-league-now-btn">
                <span class="btn-icon">🏆</span>
                Join a League
              </button>
            ` : ''}
            
            <button class="btn secondary" id="go-to-dashboard-btn">
              <span class="btn-icon">📊</span>
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    `;
  }
  
  attachStepEventListeners() {
    const currentStepEl = this.modal?.querySelector(`[data-step]`);
    if (!currentStepEl) return;
    
    const stepType = currentStepEl.dataset.step;
    
    switch (stepType) {
      case 'league-setup':
        this.attachLeagueSetupListeners();
        break;
      case 'ready':
        this.attachReadyListeners();
        break;
    }
  }
  
  attachLeagueSetupListeners() {
    // Join league functionality
    const joinBtn = document.getElementById('join-league-btn');
    const inviteInput = document.getElementById('invite-code-input');
    
    joinBtn?.addEventListener('click', async () => {
      const inviteCode = inviteInput?.value.trim();
      if (!inviteCode) {
        this.showStepError('Please enter an invite code');
        return;
      }
      
      try {
        await this.joinLeague(inviteCode);
      } catch (error) {
        this.showStepError('Invalid invite code. Please check and try again.');
      }
    });
    
    inviteInput?.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        joinBtn?.click();
      }
    });
    
    // Create league functionality
    const createBtn = document.getElementById('create-league-btn');
    const nameInput = document.getElementById('league-name-input');
    
    createBtn?.addEventListener('click', async () => {
      const leagueName = nameInput?.value.trim();
      if (!leagueName) {
        this.showStepError('Please enter a league name');
        return;
      }
      
      try {
        await this.createLeague(leagueName);
      } catch (error) {
        this.showStepError('Failed to create league. Please try again.');
      }
    });
    
    nameInput?.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        createBtn?.click();
      }
    });
  }
  
  attachReadyListeners() {
    document.getElementById('make-first-pick-btn')?.addEventListener('click', () => {
      this.complete();
      window.location.href = '/driver-selection';
    });
    
    document.getElementById('join-league-now-btn')?.addEventListener('click', () => {
      this.complete();
      window.location.href = '/league-hub';
    });
    
    document.getElementById('go-to-dashboard-btn')?.addEventListener('click', () => {
      this.complete();
      window.location.href = '/dashboard';
    });
  }
  
  async joinLeague(inviteCode) {
    // Simulate league joining - replace with actual implementation
    console.log('Joining league with code:', inviteCode);
    
    // Mock successful join
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    appStore.setState({
      activeLeague: {
        id: 'mock-league-id',
        name: 'Friends League',
        memberCount: 5
      }
    });
    
    this.showStepSuccess('Successfully joined league!');
    setTimeout(() => this.nextStep(), 1500);
  }
  
  async createLeague(leagueName) {
    // Simulate league creation - replace with actual implementation
    console.log('Creating league:', leagueName);
    
    // Mock successful creation
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    appStore.setState({
      activeLeague: {
        id: 'new-league-id',
        name: leagueName,
        memberCount: 1
      }
    });
    
    this.showStepSuccess('League created successfully!');
    setTimeout(() => this.nextStep(), 1500);
  }
  
  nextStep() {
    if (this.currentStep < this.totalSteps - 1) {
      this.currentStep++;
      this.updateStepIndicator();
      this.renderCurrentStep();
      this.trackEvent('onboarding_step_completed', { step: this.currentStep });
    } else {
      this.complete();
    }
  }
  
  previousStep() {
    if (this.currentStep > 0) {
      this.currentStep--;
      this.updateStepIndicator();
      this.renderCurrentStep();
    }
  }
  
  skip() {
    this.trackEvent('onboarding_skipped', { step: this.currentStep });
    this.close();
  }
  
  complete() {
    this.trackEvent('onboarding_completed');
    
    // Mark onboarding as completed
    appStore.setState({
      onboarding: {
        completed: true,
        completedAt: new Date().toISOString()
      }
    });
    
    this.close();
  }
  
  updateStepIndicator() {
    const indicator = document.getElementById('step-indicator');
    if (!indicator) return;
    
    const dots = Array.from({ length: this.totalSteps }, (_, i) => {
      const isActive = i === this.currentStep;
      const isCompleted = i < this.currentStep;
      
      return `
        <div class="step-dot ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}"
             data-step="${i}"
             aria-label="Step ${i + 1}${isActive ? ' (current)' : ''}${isCompleted ? ' (completed)' : ''}">
        </div>
      `;
    }).join('');
    
    indicator.innerHTML = dots;
  }
  
  updateNavigationButtons() {
    const nextBtn = document.getElementById('welcome-next-btn');
    const backBtn = document.getElementById('welcome-back-btn');
    const skipBtn = document.getElementById('welcome-skip-btn');
    
    if (!nextBtn || !backBtn || !skipBtn) return;
    
    // Back button
    if (this.currentStep === 0) {
      backBtn.style.display = 'none';
    } else {
      backBtn.style.display = 'inline-block';
    }
    
    // Next button text
    const nextLabels = ['Continue', 'Got It', 'Continue', 'Finish'];
    nextBtn.textContent = nextLabels[this.currentStep] || 'Next';
    
    // Skip button
    if (this.currentStep === this.totalSteps - 1) {
      skipBtn.style.display = 'none';
    } else {
      skipBtn.style.display = 'inline-block';
    }
  }
  
  show() {
    if (this.modal) {
      this.modal.style.display = 'flex';
      document.body.classList.add('welcome-modal-open');
      
      // Focus management
      setTimeout(() => {
        const nextBtn = document.getElementById('welcome-next-btn');
        nextBtn?.focus();
      }, 100);
    }
  }
  
  close() {
    if (this.modal) {
      this.modal.style.display = 'none';
      document.body.classList.remove('welcome-modal-open');
      this.isActive = false;
    }
  }
  
  showStepError(message) {
    // Remove existing error
    const existingError = this.modal?.querySelector('.step-error');
    existingError?.remove();
    
    // Add new error
    const stepContent = this.modal?.querySelector('.step-content');
    if (stepContent) {
      const errorEl = document.createElement('div');
      errorEl.className = 'step-error';
      errorEl.innerHTML = `
        <span class="error-icon">⚠️</span>
        <span class="error-message">${message}</span>
      `;
      stepContent.appendChild(errorEl);
      
      // Auto-remove after 5 seconds
      setTimeout(() => errorEl.remove(), 5000);
    }
  }
  
  showStepSuccess(message) {
    // Remove existing messages
    const existingMessages = this.modal?.querySelectorAll('.step-error, .step-success');
    existingMessages?.forEach(msg => msg.remove());
    
    // Add success message
    const stepContent = this.modal?.querySelector('.step-content');
    if (stepContent) {
      const successEl = document.createElement('div');
      successEl.className = 'step-success';
      successEl.innerHTML = `
        <span class="success-icon">✅</span>
        <span class="success-message">${message}</span>
      `;
      stepContent.appendChild(successEl);
    }
  }
  
  trackEvent(eventName, data = {}) {
    console.log('Welcome Flow Event:', eventName, data);
    
    // In production, send to analytics service
    if (typeof window.gtag === 'function') {
      window.gtag('event', eventName, {
        event_category: 'onboarding',
        ...data
      });
    }
  }
  
  // Public methods
  static show() {
    const instance = new WelcomeFlow();
    instance.start(true);
    return instance;
  }
  
  destroy() {
    this.close();
    this.modal?.remove();
  }
}

export default WelcomeFlow;