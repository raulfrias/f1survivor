// auth-ui.js - Authentication UI management for F1 Survivor
import { authManager } from './auth-manager.js';
import { oAuthHandler } from './oauth-handler.js';

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
      const response = await fetch('/auth-modal.html');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
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
      console.log('Using fallback modal creation');
      // Fallback: create a comprehensive modal programmatically
      this.createComprehensiveModal();
    }
  }

  // Create a comprehensive modal if loading from file fails
  createComprehensiveModal() {
    console.log('Creating comprehensive fallback modal');
    const modalHTML = `
      <div id="auth-modal" class="auth-modal">
        <div class="auth-modal-content">
          <button class="close-btn" id="close-auth-modal">&times;</button>
          
          <!-- Tab Navigation -->
          <div class="auth-tabs">
            <button class="auth-tab active" data-tab="signin">Sign In</button>
            <button class="auth-tab" data-tab="signup">Sign Up</button>
          </div>
          
          <!-- Sign In Form -->
          <form id="signin-form" class="auth-form active">
            <h2>Welcome Back</h2>
            <p class="auth-subtitle">Sign in to make your picks</p>
            
            <div class="form-group">
              <input type="email" id="signin-email" placeholder="Email" required>
            </div>
            
            <div class="form-group">
              <input type="password" id="signin-password" placeholder="Password" required>
            </div>
            
            <div class="form-options">
              <label>
                <input type="checkbox" id="remember-me"> Remember me
              </label>
              <a href="#" id="forgot-password-link">Forgot password?</a>
            </div>
            
            <button type="submit" class="cta-button auth-submit">
              <span class="button-text">Sign In</span>
              <span class="loading-spinner" style="display: none;">⏳</span>
            </button>
            
            <div class="auth-error" id="signin-error"></div>
          </form>
          
          <!-- Sign Up Form -->
          <form id="signup-form" class="auth-form">
            <h2>Join F1 Survivor</h2>
            <p class="auth-subtitle">Create an account to start playing</p>
            
            <div class="form-group">
              <input type="email" id="signup-email" placeholder="Email" required>
            </div>
            
            <div class="form-group">
              <input type="password" id="signup-password" placeholder="Password" required>
              <div class="password-requirements">
                <span class="requirement" data-req="length">8+ characters</span>
                <span class="requirement" data-req="lowercase">Lowercase</span>
                <span class="requirement" data-req="uppercase">Uppercase</span>
                <span class="requirement" data-req="number">Number</span>
                <span class="requirement" data-req="symbol">Symbol</span>
              </div>
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
          
          <!-- Email Verification Form -->
          <form id="verify-form" class="auth-form" style="display: none;">
            <h2>Verify Your Email</h2>
            <p class="auth-subtitle">We sent a verification code to <span id="verify-email"></span></p>
            
            <div class="form-group">
              <input type="text" id="verification-code" placeholder="Enter 6-digit code" maxlength="6" required>
            </div>
            
            <button type="submit" class="cta-button auth-submit">
              <span class="button-text">Verify Email</span>
              <span class="loading-spinner" style="display: none;">⏳</span>
            </button>
            
            <div class="form-options">
              <a href="#" id="resend-code-link">Resend code</a>
            </div>
            
            <div class="auth-error" id="verify-error"></div>
          </form>

          <!-- Password Reset Form -->
          <form id="reset-form" class="auth-form" style="display: none;">
            <h2>Reset Password</h2>
            <p class="auth-subtitle">Enter your email to reset your password</p>
            
            <div class="form-group">
              <input type="email" id="reset-email" placeholder="Email" required>
            </div>
            
            <button type="submit" class="cta-button auth-submit">
              <span class="button-text">Send Reset Code</span>
              <span class="loading-spinner" style="display: none;">⏳</span>
            </button>
            
            <div class="form-options">
              <a href="#" id="back-to-signin-link">Back to Sign In</a>
            </div>
            
            <div class="auth-error" id="reset-error"></div>
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
    const resetForm = this.modal.querySelector('#reset-form');
    const confirmResetForm = this.modal.querySelector('#confirm-reset-form');

    if (signinForm) {
      signinForm.addEventListener('submit', (e) => this.handleSignIn(e));
    }
    
    if (signupForm) {
      signupForm.addEventListener('submit', (e) => this.handleSignUp(e));
    }
    
    if (verifyForm) {
      verifyForm.addEventListener('submit', (e) => this.handleVerification(e));
    }
    
    if (resetForm) {
      resetForm.addEventListener('submit', (e) => this.handlePasswordReset(e));
    }
    
    if (confirmResetForm) {
      confirmResetForm.addEventListener('submit', (e) => this.handleConfirmPasswordReset(e));
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

    // Back to reset link (from confirm reset form)
    const backToResetLink = this.modal.querySelector('#back-to-reset-link');
    if (backToResetLink) {
      backToResetLink.addEventListener('click', (e) => {
        e.preventDefault();
        this.switchTab('reset');
      });
    }

    // NEW: Google OAuth buttons
    const googleSigninBtn = this.modal.querySelector('#google-signin-btn');
    const googleSignupBtn = this.modal.querySelector('#google-signup-btn');
    
    if (googleSigninBtn) {
      googleSigninBtn.addEventListener('click', (e) => this.handleGoogleAuth(e));
    }
    
    if (googleSignupBtn) {
      googleSignupBtn.addEventListener('click', (e) => this.handleGoogleAuth(e));
    }
  }

  // Set up password validation
  setupPasswordValidation() {
    // Setup validation for signup form
    this.setupPasswordValidationForForm('#signup-password', '#signup-form');
    
    // Setup validation for confirm reset form  
    this.setupPasswordValidationForForm('#new-password', '#confirm-reset-form');
  }

  // Setup password validation for a specific form
  setupPasswordValidationForForm(passwordSelector, formSelector) {
    const passwordInput = this.modal?.querySelector(passwordSelector);
    const form = this.modal?.querySelector(formSelector);
    const requirements = form?.querySelectorAll('.requirement');
    
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
  async showModal(tab = 'signin') {
    // Ensure modal is initialized
    if (!this.modal) {
      console.log('Modal not ready, initializing...');
      await this.init();
    }
    
    if (!this.modal) {
      console.error('Auth modal could not be initialized');
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

    console.log('Switching to tab:', tabName);
    this.currentForm = tabName;
    
    // Update tab buttons
    const tabs = this.modal.querySelectorAll('.auth-tab');
    tabs.forEach(tab => {
      tab.classList.toggle('active', tab.dataset.tab === tabName);
    });

    // Update forms - use inline styles to override any existing inline styles
    const forms = this.modal.querySelectorAll('.auth-form');
    forms.forEach(form => {
      form.style.display = 'none';
      form.classList.remove('active');
    });

    const activeForm = this.modal.querySelector(`#${tabName}-form`);
    if (activeForm) {
      activeForm.style.display = 'block';
      activeForm.classList.add('active');
      console.log('Form displayed:', tabName, activeForm);
    } else {
      console.error('Form not found:', `#${tabName}-form`);
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
        console.log('Sign in failed:', result);
        
        // Handle unverified user case
        if (result.needsVerification) {
          console.log('User needs email verification');
          this.pendingEmail = result.email || email;
          this.showError('signin', result.error + ' Redirecting to verification...');
          
          // Switch to verification tab after a short delay
          setTimeout(() => {
            this.switchTab('verify');
            this.modal.querySelector('#verify-email').textContent = this.pendingEmail;
            this.clearErrors(); // Clear the error message in the new tab
          }, 2000);
        } else {
          this.showError('signin', result.error);
        }
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
        console.log('Sign up successful, result:', result);
        console.log('needsVerification:', result.needsVerification);
        console.log('nextStep:', result.nextStep);
        this.pendingEmail = email;
        
        // Always show verification step for now (for debugging)
        if (result.needsVerification !== false) {
          console.log('Switching to verification tab');
          this.switchTab('verify');
          this.modal.querySelector('#verify-email').textContent = email;
        } else {
          console.log('Auto-confirmed user, showing success');
          this.showSuccess('signup', 'Account created and confirmed successfully!');
          setTimeout(() => this.switchTab('signin'), 3000);
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

  // Handle password reset form submission
  async handlePasswordReset(e) {
    e.preventDefault();
    
    const email = this.modal.querySelector('#reset-email').value;

    if (!email) {
      this.showError('reset', 'Please enter your email address');
      return;
    }

    this.setLoading('reset', true);
    this.clearErrors();

    try {
      console.log('Initiating password reset for:', email);
      const result = await authManager.resetPassword(email);
      
      if (result.success) {
        this.pendingEmail = email;
        this.showSuccess('reset', 'If an account with this email exists, you will receive a reset code shortly.');
        
        // Switch to confirm reset form after showing success
        setTimeout(() => {
          this.switchTab('confirm-reset');
          this.modal.querySelector('#confirm-reset-email').textContent = email;
          this.clearErrors();
        }, 2000);
      } else {
        this.showError('reset', result.error);
      }
    } catch (error) {
      console.error('Password reset error:', error);
      this.showError('reset', 'An unexpected error occurred. Please try again.');
    } finally {
      this.setLoading('reset', false);
    }
  }

  // Handle confirm password reset form submission
  async handleConfirmPasswordReset(e) {
    e.preventDefault();
    
    const code = this.modal.querySelector('#reset-code').value;
    const newPassword = this.modal.querySelector('#new-password').value;
    const confirmPassword = this.modal.querySelector('#confirm-new-password').value;

    // Validate inputs
    if (!code || code.length !== 6) {
      this.showError('confirm-reset', 'Please enter a valid 6-digit code');
      return;
    }

    if (!newPassword) {
      this.showError('confirm-reset', 'Please enter a new password');
      return;
    }

    if (!this.validatePassword(newPassword)) {
      this.showError('confirm-reset', 'Password does not meet requirements');
      return;
    }

    if (newPassword !== confirmPassword) {
      this.showError('confirm-reset', 'Passwords do not match');
      return;
    }

    this.setLoading('confirm-reset', true);
    this.clearErrors();

    try {
      console.log('Confirming password reset');
      const result = await authManager.confirmResetPassword(this.pendingEmail, code, newPassword);
      
      if (result.success) {
        this.showSuccess('confirm-reset', 'Password reset successful! You can now sign in.');
        
        // Switch to sign in form after success
        setTimeout(() => {
          this.switchTab('signin');
          this.modal.querySelector('#signin-email').value = this.pendingEmail;
          this.clearForms();
        }, 2000);
      } else {
        this.showError('confirm-reset', result.error);
      }
    } catch (error) {
      console.error('Confirm password reset error:', error);
      this.showError('confirm-reset', 'An unexpected error occurred. Please try again.');
    } finally {
      this.setLoading('confirm-reset', false);
    }
  }

  // NEW: Handle Google OAuth
  async handleGoogleAuth(e) {
    e.preventDefault();
    
    try {
      console.log('Starting Google OAuth flow');
      
      // Show loading state on the button
      this.setGoogleLoading(e.target, true);
      
      // Store current page for redirect after auth
      sessionStorage.setItem('redirectAfterAuth', window.location.pathname);
      
      // Initiate Google OAuth
      const result = await authManager.signInWithGoogle();
      
      if (result.success) {
        // OAuth redirect will happen automatically
        console.log('Google OAuth initiated successfully');
        
        // Show loading message
        this.showGoogleLoadingMessage();
      } else {
        this.showError('signin', result.error || 'Google sign-in failed');
        this.setGoogleLoading(e.target, false);
      }
      
    } catch (error) {
      console.error('Google OAuth error:', error);
      this.showError('signin', 'Google sign-in failed. Please try again.');
      this.setGoogleLoading(e.target, false);
    }
  }

  // NEW: Show Google loading message
  showGoogleLoadingMessage() {
    const overlay = document.createElement('div');
    overlay.id = 'google-auth-loading';
    overlay.innerHTML = `
      <div class="google-loading-content">
        <div class="spinner-ring large"></div>
        <h3>Redirecting to Google...</h3>
        <p>You'll be redirected back after signing in with Google.</p>
      </div>
    `;
    
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.9);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10002;
      color: white;
      font-family: Arial, sans-serif;
    `;
    
    const content = overlay.querySelector('.google-loading-content');
    content.style.cssText = `
      text-align: center;
      padding: 2rem;
    `;
    
    document.body.appendChild(overlay);
  }

  // NEW: Set loading state for Google buttons
  setGoogleLoading(button, isLoading) {
    if (isLoading) {
      button.disabled = true;
      button.style.opacity = '0.7';
      const originalText = button.innerHTML;
      button.dataset.originalText = originalText;
      button.innerHTML = `
        <div class="spinner-ring small"></div>
        Connecting to Google...
      `;
    } else {
      button.disabled = false;
      button.style.opacity = '1';
      if (button.dataset.originalText) {
        button.innerHTML = button.dataset.originalText;
      }
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
window.showAuthModal = async (tab = 'signin') => {
  await authUI.showModal(tab);
}; 