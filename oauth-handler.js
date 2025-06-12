// oauth-handler.js - OAuth callback handler
import { authManager } from './auth-manager.js';

export class OAuthHandler {
  constructor() {
    this.initializeHandler();
  }

  async initializeHandler() {
    // Check if current page is OAuth callback
    if (this.isOAuthCallback()) {
      await this.handleCallback();
    }
  }

  isOAuthCallback() {
    const url = window.location.href;
    return url.includes('code=') || url.includes('access_token=') || url.includes('state=');
  }

  async handleCallback() {
    try {
      console.log('Processing OAuth callback...');
      
      // Show loading state
      this.showCallbackLoading();
      
      // Process the callback
      const result = await authManager.handleOAuthCallback();
      
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