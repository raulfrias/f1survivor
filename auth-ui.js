// auth-ui.js - Authentication UI management for F1 Survivor
import { authManager } from './auth-manager.js';

class AuthUI {
  constructor() {
    this.modal = null;
    this.currentForm = 'signin';
    this.pendingEmail = '';
    this.isInitialized = false;
    this.init();
  }

  // Initialize the auth UI
  async init() {
    if (this.isInitialized) return;
    
    try {
      // Load the auth modal HTML
      await this.loadAuthModal();
      
      // Set up event listeners
      this.setupEventListeners();
      
      // Set up password validation
      this.setupPasswordValidation();
      
      this.isInitialized = true;
      console.log('Auth UI initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Auth UI:', error);
    }
  }

  // Load the auth modal HTML into the page
  async loadAuthModal() {
    try {
      const response = await fetch('./auth-modal.html');
      const modalHTML = await response.text();
      
      // Create a container for the modal
      const modalContainer = document.createElement('div');
      modalContainer.innerHTML = modalHTML;
      
      // Append to body
      document.body.appendChild(modalContainer.firstElementChild);
      
      this.modal = document.getElementById('auth-modal');
      
      console.log('Auth modal loaded successfully');
    } catch (error) {
      console.error('Failed to load auth modal:', error);
      // Fallback: create a basic modal programmatically
      this.createBasicModal();
    }
  }

  // Create a basic modal if loading from file fails
  createBasicModal() {
    console.log('Creating fallback modal');
    // This is a simplified fallback - in production, you'd include the full HTML here
    const modalHTML = `
      <div id="auth-modal" class="auth-modal">
        <div class="auth-modal-content">
          <button class="close-btn" id="close-auth-modal">&times;</button>
          <div class="auth-tabs">
            <button class="auth-tab active" data-tab="signin">Sign In</button>
            <button class="auth-tab" data-tab="signup">Sign Up</button>
          </div>
          <form id="signin-form" class="auth-form active">
            <h2>Welcome Back</h2>
            <p class="auth-subtitle">Sign in to make your picks</p>
            <div class="form-group">
              <input type="email" id="signin-email" placeholder="Email" required>
            </div>
            <div class="form-group">
              <input type="password" id="signin-password" placeholder="Password" required>
            </div>
            <button type="submit" class="cta-button auth-submit">
              <span class="button-text">Sign In</span>
              <span class="loading-spinner" style="display: none;">⏳</span>
            </button>
            <div class="auth-error" id="signin-error"></div>
          </form>
          <form id="signup-form" class="auth-form">
            <h2>Join F1 Survivor</h2>
            <p class="auth-subtitle">Create an account to start playing</p>
            <div class="form-group">
              <input type="email" id="signup-email" placeholder="Email" required>
            </div>
            <div class="form-group">
              <input type="password" id="signup-password" placeholder="Password" required>
            </div>
            <div class="form-group">
              <input type="password" id="signup-confirm" placeholder="Confirm Password" required>
            </div>
            <button type="submit" class="cta-button auth-submit">
              <span class="button-text">Create Account</span>
              <span class="loading-spinner" style="display: none;">⏳</span>
            </button>
            <div class="auth-error" id="signup-error"></div>
          </form>
        </div>
      </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    this.modal = document.getElementById('auth-modal');
  }

  // Set up all event listeners
  setupEventListeners() {
    if (!this.modal) return;

    // Tab switching
    const tabs = this.modal.querySelectorAll('.auth-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', (e) => {
        e.preventDefault();
        this.switchTab(tab.dataset.tab);
      });
    });

    // Close modal
    const closeBtn = this.modal.querySelector('#close-auth-modal');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.hideModal());
    }

    // Close on backdrop click
    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) {
        this.hideModal();
      }
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.modal.classList.contains('show')) {
        this.hideModal();
      }
    });

    // Form submissions
    const signinForm = this.modal.querySelector('#signin-form');
    const signupForm = this.modal.querySelector('#signup-form');
    const verifyForm = this.modal.querySelector('#verify-form');

    if (signinForm) {
      signinForm.addEventListener('submit', (e) => this.handleSignIn(e));
    }
    
    if (signupForm) {
      signupForm.addEventListener('submit', (e) => this.handleSignUp(e));
    }
    
    if (verifyForm) {
      verifyForm.addEventListener('submit', (e) => this.handleVerification(e));
    }

    // Forgot password link
    const forgotLink = this.modal.querySelector('#forgot-password-link');
    if (forgotLink) {
      forgotLink.addEventListener('click', (e) => {
        e.preventDefault();
        this.switchTab('reset');
      });
    }

    // Resend code link
    const resendLink = this.modal.querySelector('#resend-code-link');
    if (resendLink) {
      resendLink.addEventListener('click', (e) => this.handleResendCode(e));
    }

    // Back to signin link
    const backLink = this.modal.querySelector('#back-to-signin-link');
    if (backLink) {
      backLink.addEventListener('click', (e) => {
        e.preventDefault();
        this.switchTab('signin');
      });
    }
  }

  // Set up password validation
  setupPasswordValidation() {
    const passwordInput = this.modal?.querySelector('#signup-password');
    const requirements = this.modal?.querySelectorAll('.requirement');
    
    if (!passwordInput || !requirements.length) return;

    passwordInput.addEventListener('input', () => {
      const password = passwordInput.value;
      
      requirements.forEach(req => {
        const type = req.dataset.req;
        let isValid = false;
        
        switch (type) {
          case 'length':
            isValid = password.length >= 8;
            break;
          case 'lowercase':
            isValid = /[a-z]/.test(password);
            break;
          case 'uppercase':
            isValid = /[A-Z]/.test(password);
            break;
          case 'number':
            isValid = /\d/.test(password);
            break;
          case 'symbol':
            isValid = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
            break;
        }
        
        req.classList.toggle('valid', isValid);
        req.classList.toggle('invalid', !isValid && password.length > 0);
      });
    });
  }

  // Show the modal
  showModal(tab = 'signin') {
    if (!this.modal) {
      console.error('Auth modal not initialized');
      return;
    }

    this.switchTab(tab);
    this.modal.classList.add('show');
    
    // Focus the first input
    setTimeout(() => {
      const firstInput = this.modal.querySelector('.auth-form.active input');
      if (firstInput) firstInput.focus();
    }, 100);
  }

  // Hide the modal
  hideModal() {
    if (!this.modal) return;
    
    this.modal.classList.remove('show');
    this.clearErrors();
    this.clearForms();
  }

  // Switch between tabs
  switchTab(tabName) {
    if (!this.modal) return;

    this.currentForm = tabName;
    
    // Update tab buttons
    const tabs = this.modal.querySelectorAll('.auth-tab');
    tabs.forEach(tab => {
      tab.classList.toggle('active', tab.dataset.tab === tabName);
    });

    // Update forms
    const forms = this.modal.querySelectorAll('.auth-form');
    forms.forEach(form => {
      form.classList.remove('active');
    });

    const activeForm = this.modal.querySelector(`#${tabName}-form`);
    if (activeForm) {
      activeForm.classList.add('active');
    }

    this.clearErrors();
  }

  // Handle sign in form submission
  async handleSignIn(e) {
    e.preventDefault();
    
    const email = this.modal.querySelector('#signin-email').value;
    const password = this.modal.querySelector('#signin-password').value;
    const rememberMe = this.modal.querySelector('#remember-me')?.checked || false;

    this.setLoading('signin', true);
    this.clearErrors();

    try {
      const result = await authManager.signIn(email, password, rememberMe);
      
      if (result.success) {
        console.log('Sign in successful');
        this.showSuccess('signin', 'Sign in successful!');
        
        // Close modal after a short delay
        setTimeout(() => {
          this.hideModal();
          this.handleSuccessfulAuth();
        }, 1000);
      } else {
        this.showError('signin', result.error);
      }
    } catch (error) {
      console.error('Sign in error:', error);
      this.showError('signin', 'An unexpected error occurred. Please try again.');
    } finally {
      this.setLoading('signin', false);
    }
  }

  // Handle sign up form submission
  async handleSignUp(e) {
    e.preventDefault();
    
    const email = this.modal.querySelector('#signup-email').value;
    const password = this.modal.querySelector('#signup-password').value;
    const confirmPassword = this.modal.querySelector('#signup-confirm').value;

    // Validate passwords match
    if (password !== confirmPassword) {
      this.showError('signup', 'Passwords do not match');
      return;
    }

    // Validate password requirements
    if (!this.validatePassword(password)) {
      this.showError('signup', 'Password does not meet requirements');
      return;
    }

    this.setLoading('signup', true);
    this.clearErrors();

    try {
      const result = await authManager.signUp(email, password);
      
      if (result.success) {
        console.log('Sign up successful');
        this.pendingEmail = email;
        
        if (result.needsVerification) {
          this.switchTab('verify');
          this.modal.querySelector('#verify-email').textContent = email;
        } else {
          this.showSuccess('signup', 'Account created successfully!');
          setTimeout(() => this.switchTab('signin'), 2000);
        }
      } else {
        this.showError('signup', result.error);
      }
    } catch (error) {
      console.error('Sign up error:', error);
      this.showError('signup', 'An unexpected error occurred. Please try again.');
    } finally {
      this.setLoading('signup', false);
    }
  }

  // Handle email verification
  async handleVerification(e) {
    e.preventDefault();
    
    const code = this.modal.querySelector('#verification-code').value;

    if (!code || code.length !== 6) {
      this.showError('verify', 'Please enter a valid 6-digit code');
      return;
    }

    this.setLoading('verify', true);
    this.clearErrors();

    try {
      const result = await authManager.confirmSignUp(this.pendingEmail, code);
      
      if (result.success) {
        console.log('Email verification successful');
        this.showSuccess('verify', 'Email verified successfully!');
        
        if (result.autoSignIn) {
          // Try to auto sign in
          setTimeout(async () => {
            const password = this.modal.querySelector('#signup-password').value;
            const signInResult = await authManager.signIn(this.pendingEmail, password);
            
            if (signInResult.success) {
              this.hideModal();
              this.handleSuccessfulAuth();
            } else {
              this.switchTab('signin');
            }
          }, 1000);
        } else {
          setTimeout(() => this.switchTab('signin'), 2000);
        }
      } else {
        this.showError('verify', result.error);
      }
    } catch (error) {
      console.error('Verification error:', error);
      this.showError('verify', 'An unexpected error occurred. Please try again.');
    } finally {
      this.setLoading('verify', false);
    }
  }

  // Handle resend verification code
  async handleResendCode(e) {
    e.preventDefault();
    
    try {
      const result = await authManager.resendSignUpCode(this.pendingEmail);
      
      if (result.success) {
        this.showSuccess('verify', 'Verification code sent!');
      } else {
        this.showError('verify', result.error);
      }
    } catch (error) {
      console.error('Resend code error:', error);
      this.showError('verify', 'Failed to resend code. Please try again.');
    }
  }

  // Validate password meets requirements
  validatePassword(password) {
    return password.length >= 8 &&
           /[a-z]/.test(password) &&
           /[A-Z]/.test(password) &&
           /\d/.test(password) &&
           /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
  }

  // Show loading state
  setLoading(form, isLoading) {
    const submitBtn = this.modal.querySelector(`#${form}-form .auth-submit`);
    const buttonText = submitBtn?.querySelector('.button-text');
    const spinner = submitBtn?.querySelector('.loading-spinner');
    
    if (submitBtn) {
      submitBtn.disabled = isLoading;
    }
    
    if (buttonText && spinner) {
      buttonText.style.display = isLoading ? 'none' : 'inline';
      spinner.style.display = isLoading ? 'inline' : 'none';
    }
  }

  // Show error message
  showError(form, message) {
    const errorElement = this.modal.querySelector(`#${form}-error`);
    if (errorElement) {
      errorElement.textContent = message;
      errorElement.classList.add('show');
    }
  }

  // Show success message
  showSuccess(form, message) {
    // Remove existing success elements
    const existingSuccess = this.modal.querySelector('.auth-success');
    if (existingSuccess) {
      existingSuccess.remove();
    }

    // Create success message
    const successElement = document.createElement('div');
    successElement.className = 'auth-success show';
    successElement.textContent = message;
    
    const form_element = this.modal.querySelector(`#${form}-form`);
    if (form_element) {
      form_element.appendChild(successElement);
    }
  }

  // Clear all error messages
  clearErrors() {
    const errors = this.modal.querySelectorAll('.auth-error');
    errors.forEach(error => {
      error.classList.remove('show');
      error.textContent = '';
    });

    const successes = this.modal.querySelectorAll('.auth-success');
    successes.forEach(success => success.remove());
  }

  // Clear all form fields
  clearForms() {
    const forms = this.modal.querySelectorAll('form');
    forms.forEach(form => form.reset());
    
    // Clear password requirements
    const requirements = this.modal.querySelectorAll('.requirement');
    requirements.forEach(req => {
      req.classList.remove('valid', 'invalid');
    });
  }

  // Handle successful authentication
  handleSuccessfulAuth() {
    // Check if we have a redirect URL
    const redirectUrl = sessionStorage.getItem('redirectAfterAuth');
    
    if (redirectUrl) {
      sessionStorage.removeItem('redirectAfterAuth');
      window.location.href = redirectUrl;
    } else {
      // Reload to update auth state
      window.location.reload();
    }
  }
}

// Export singleton instance
export const authUI = new AuthUI();

// Global function to show auth modal (for compatibility)
window.showAuthModal = (tab = 'signin') => {
  authUI.showModal(tab);
}; 