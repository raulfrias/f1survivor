// oauth-handler.js - OAuth callback handler
import { authManager } from './auth-manager.js';

export class OAuthHandler {
  constructor() {
    this.initializeHandler();
  }

  async initializeHandler() {
    console.log('OAuthHandler: Initializing...');
    
    // Check if current page is OAuth callback
    if (this.isOAuthCallback()) {
      console.log('OAuthHandler: OAuth callback detected, processing...');
      await this.handleCallback();
    } else {
      console.log('OAuthHandler: No OAuth callback detected, ready for normal flow');
    }
  }

  isOAuthCallback() {
    const url = new URL(window.location.href);
    const searchParams = url.searchParams;
    
    // More specific OAuth callback detection
    const hasAuthCode = searchParams.has('code');
    const hasAccessToken = url.hash.includes('access_token=');
    const hasState = searchParams.has('state');
    
    // Cognito OAuth typically includes both code and state parameters
    const isCognitoCallback = hasAuthCode && hasState;
    
    console.log('OAuth detection:', { hasAuthCode, hasAccessToken, hasState, isCognitoCallback });
    
    return isCognitoCallback || hasAccessToken;
  }

  async handleCallback() {
    try {
      console.log('Processing OAuth callback...');
      
      // Show loading state
      this.showCallbackLoading();
      
      // Wait for Amplify to process OAuth callback with retry logic
      const result = await this.waitForOAuthCompletion();
      
      if (result.success) {
        console.log('OAuth authentication successful');
        
        // Clear URL parameters
        this.cleanUpURL();
        
        // Handle post-auth flow
        this.handlePostAuthFlow(result.user);
        
      } else {
        console.error('OAuth callback failed:', result.error);
        this.showCallbackError(result.error);
      }
      
    } catch (error) {
      console.error('OAuth callback processing error:', error);
      this.showCallbackError('Authentication failed. Please try again.');
    }
  }

  // NEW: Wait for OAuth completion with retry logic
  async waitForOAuthCompletion(maxRetries = 10, delay = 500) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`OAuth completion attempt ${attempt}/${maxRetries}`);
        
        // Add a small delay to let Amplify process the callback
        if (attempt > 1) {
          await new Promise(resolve => setTimeout(resolve, delay));
        }
        
        // Try to get the current user
        const result = await authManager.handleOAuthCallback();
        
        if (result.success) {
          console.log('OAuth callback completed successfully');
          return result;
        }
        
        // If not successful but no error, continue retrying
        console.log('OAuth not ready yet, retrying...');
        
      } catch (error) {
        console.log(`OAuth attempt ${attempt} failed:`, error.message);
        
        // If this is the last attempt, return the error
        if (attempt === maxRetries) {
          return {
            success: false,
            error: 'OAuth authentication timed out. Please try again.'
          };
        }
        
        // For auth errors that suggest the session isn't ready yet, continue retrying
        if (error.message && (
          error.message.includes('Auth UserPool not configured') ||
          error.message.includes('No current user') ||
          error.message.includes('User not authenticated')
        )) {
          console.log('Auth not ready, will retry...');
          continue;
        }
        
        // For other errors, return immediately
        return {
          success: false,
          error: error.message || 'OAuth authentication failed'
        };
      }
    }
    
    return {
      success: false,
      error: 'OAuth authentication timed out after multiple attempts'
    };
  }

  showCallbackLoading() {
    // Show a full-page loading overlay
    const overlay = document.createElement('div');
    overlay.id = 'oauth-loading-overlay';
    overlay.innerHTML = `
      <div class="oauth-loading-content">
        <div class="oauth-spinner"></div>
        <h3>Completing sign-in...</h3>
        <p>Please wait while we set up your account.</p>
      </div>
    `;
    
    // Add CSS styles for the overlay
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
      z-index: 10001;
      color: white;
      font-family: Arial, sans-serif;
    `;
    
    // Style the content
    const content = overlay.querySelector('.oauth-loading-content');
    content.style.cssText = `
      text-align: center;
      padding: 2rem;
    `;
    
    // Style the spinner
    const spinner = overlay.querySelector('.oauth-spinner');
    spinner.style.cssText = `
      width: 40px;
      height: 40px;
      border: 4px solid #f3f3f3;
      border-top: 4px solid #dc2626;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 1rem;
    `;
    
    // Add spinner animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(overlay);
  }

  hideCallbackLoading() {
    const overlay = document.getElementById('oauth-loading-overlay');
    if (overlay) {
      overlay.remove();
    }
  }

  showCallbackError(message) {
    this.hideCallbackLoading();
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'oauth-error-overlay';
    errorDiv.innerHTML = `
      <div class="oauth-error-content">
        <h3>Authentication Error</h3>
        <p>${message}</p>
        <button onclick="window.location.href='/'">Return to Home</button>
      </div>
    `;
    
    // Add CSS styles for the error overlay
    errorDiv.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.9);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10001;
      color: white;
      font-family: Arial, sans-serif;
    `;
    
    // Style the error content
    const content = errorDiv.querySelector('.oauth-error-content');
    content.style.cssText = `
      text-align: center;
      padding: 2rem;
      background: #1f2937;
      border-radius: 8px;
      border: 2px solid #dc2626;
    `;
    
    // Style the button
    const button = errorDiv.querySelector('button');
    button.style.cssText = `
      background: #dc2626;
      color: white;
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: 4px;
      cursor: pointer;
      font-size: 1rem;
      margin-top: 1rem;
    `;
    
    document.body.appendChild(errorDiv);
  }

  cleanUpURL() {
    // Remove OAuth parameters from URL
    const url = new URL(window.location);
    url.searchParams.delete('code');
    url.searchParams.delete('state');
    url.hash = '';
    window.history.replaceState({}, document.title, url.pathname);
  }

  handlePostAuthFlow(user) {
    this.hideCallbackLoading();
    
    // Redirect to appropriate page based on stored state
    const redirectPath = sessionStorage.getItem('redirectAfterAuth') || '/';
    sessionStorage.removeItem('redirectAfterAuth');
    
    // Small delay to ensure everything is processed
    setTimeout(() => {
      window.location.href = redirectPath;
    }, 1000);
  }
}

// Initialize on page load
export const oAuthHandler = new OAuthHandler(); 