// ErrorHandler.js - Centralized error handling system for F1 Survivor
// Provides user-friendly error messages, recovery actions, and logging

import { appStore } from '@/store/AppStore.js';

export class ErrorHandler {
  static errorMessages = {
    // Network errors
    'NetworkError': 'Connection problem. Please check your internet connection and try again.',
    'fetch failed': 'Unable to connect to our servers. Please check your internet connection.',
    'Failed to fetch': 'Network connection failed. Please try again.',
    
    // Authentication errors
    'NotAuthorizedException': 'Invalid email or password. Please try again.',
    'UserNotConfirmedException': 'Please verify your email address before signing in.',
    'UserNotFoundException': 'No account found with this email address.',
    'UsernameExistsException': 'An account with this email already exists.',
    'InvalidPasswordException': 'Password does not meet requirements.',
    'CodeMismatchException': 'Invalid verification code. Please try again.',
    'ExpiredCodeException': 'Verification code has expired. Please request a new one.',
    'LimitExceededException': 'Too many attempts. Please wait before trying again.',
    'TooManyRequestsException': 'Too many requests. Please wait a moment and try again.',
    
    // League errors
    'LeagueNotFound': 'This league no longer exists. Please join a different league.',
    'LeagueAlreadyExists': 'A league with this name already exists in your account.',
    'LeagueInviteInvalid': 'Invalid invite code. Please check the code and try again.',
    'LeagueMaxMembersReached': 'This league is full. Please try joining a different league.',
    'AlreadyMemberOfLeague': 'You are already a member of this league.',
    'NotLeagueOwner': 'Only the league owner can perform this action.',
    'CannotLeaveOwnLeague': 'League owners cannot leave their own league. Transfer ownership or delete the league.',
    
    // Pick errors
    'DriverAlreadyPicked': 'You have already selected this driver in a previous race.',
    'PickDeadlinePassed': 'The deadline for making picks has passed for this race.',
    'NoActiveRace': 'There is no active race to make picks for at this time.',
    'InvalidDriver': 'The selected driver is not valid for this race.',
    'PickNotFound': 'No pick found for the current race.',
    
    // General application errors
    'ValidationError': 'Please check your input and try again.',
    'PermissionDenied': 'You do not have permission to perform this action.',
    'SessionExpired': 'Your session has expired. Please sign in again.',
    'ServerError': 'Something went wrong on our end. Please try again in a moment.',
    'MaintenanceMode': 'F1 Survivor is temporarily down for maintenance. Please try again later.',
    
    // Default fallbacks
    'UnknownError': 'Something unexpected happened. Please try again.',
    'DefaultError': 'An error occurred. Please try again or contact support if the problem continues.'
  };
  
  static recoveryActions = {
    'NetworkError': [
      { label: 'Retry', action: 'retry' },
      { label: 'Check Connection', action: 'checkConnection' }
    ],
    'NotAuthorizedException': [
      { label: 'Try Again', action: 'retry' },
      { label: 'Reset Password', action: 'resetPassword' }
    ],
    'UserNotConfirmedException': [
      { label: 'Resend Code', action: 'resendVerification' },
      { label: 'Check Email', action: 'checkEmail' }
    ],
    'LeagueNotFound': [
      { label: 'View My Leagues', action: 'navigateToLeagues' },
      { label: 'Join New League', action: 'joinLeague' }
    ],
    'DriverAlreadyPicked': [
      { label: 'Choose Different Driver', action: 'selectDifferentDriver' },
      { label: 'View Past Picks', action: 'viewPickHistory' }
    ],
    'PickDeadlinePassed': [
      { label: 'View Current Standings', action: 'viewStandings' },
      { label: 'Prepare for Next Race', action: 'nextRace' }
    ],
    'SessionExpired': [
      { label: 'Sign In Again', action: 'signIn' },
      { label: 'Go to Home', action: 'goHome' }
    ]
  };
  
  static handle(error, context = {}) {
    console.error('ErrorHandler: Handling error', { error, context });
    
    try {
      const errorInfo = this.analyzeError(error);
      const userMessage = this.getUserMessage(errorInfo, context);
      const recoveryActions = this.getRecoveryActions(errorInfo);
      
      // Store error in app state
      appStore.setError({
        id: Date.now(),
        message: userMessage,
        originalError: errorInfo,
        context,
        recoveryActions,
        timestamp: new Date().toISOString()
      });
      
      // Show user notification
      this.showUserNotification(userMessage, 'error', recoveryActions);
      
      // Log error for analytics/debugging
      this.logError(errorInfo, context);
      
      return {
        message: userMessage,
        actions: recoveryActions,
        canRetry: this.canRetry(errorInfo)
      };
      
    } catch (handlerError) {
      console.error('ErrorHandler: Error in error handler', handlerError);
      
      // Fallback error handling
      const fallbackMessage = 'An unexpected error occurred. Please refresh the page and try again.';
      appStore.addNotification({
        type: 'error',
        title: 'Error',
        message: fallbackMessage
      });
      
      return {
        message: fallbackMessage,
        actions: [{ label: 'Refresh Page', action: 'refresh' }],
        canRetry: false
      };
    }
  }
  
  static analyzeError(error) {
    // Handle different error types
    if (typeof error === 'string') {
      return {
        type: 'StringError',
        message: error,
        code: null,
        stack: null
      };
    }
    
    if (error instanceof Error) {
      return {
        type: error.name,
        message: error.message,
        code: error.code || null,
        stack: error.stack,
        originalError: error
      };
    }
    
    // Handle Amplify/AWS errors
    if (error && error.__type) {
      return {
        type: error.__type,
        message: error.message || 'AWS service error',
        code: error.code || error.__type,
        stack: null,
        originalError: error
      };
    }
    
    // Handle fetch/network errors
    if (error && error.name === 'TypeError' && error.message.includes('fetch')) {
      return {
        type: 'NetworkError',
        message: 'Network request failed',
        code: 'NETWORK_ERROR',
        stack: error.stack,
        originalError: error
      };
    }
    
    // Handle GraphQL errors
    if (error && error.errors && Array.isArray(error.errors)) {
      const firstError = error.errors[0];
      return {
        type: 'GraphQLError',
        message: firstError?.message || 'GraphQL request failed',
        code: firstError?.extensions?.code || 'GRAPHQL_ERROR',
        stack: null,
        originalError: error
      };
    }
    
    // Default case
    return {
      type: 'UnknownError',
      message: error?.message || 'Unknown error occurred',
      code: null,
      stack: null,
      originalError: error
    };
  }
  
  static getUserMessage(errorInfo, context = {}) {
    const { type, message, code } = errorInfo;
    
    // Check for specific error messages first
    if (this.errorMessages[type]) {
      return this.errorMessages[type];
    }
    
    if (code && this.errorMessages[code]) {
      return this.errorMessages[code];
    }
    
    // Check message content for known patterns
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('network') || lowerMessage.includes('fetch')) {
      return this.errorMessages['NetworkError'];
    }
    
    if (lowerMessage.includes('unauthorized') || lowerMessage.includes('auth')) {
      return this.errorMessages['NotAuthorizedException'];
    }
    
    if (lowerMessage.includes('not found')) {
      return context.type === 'league' 
        ? this.errorMessages['LeagueNotFound']
        : 'The requested item could not be found.';
    }
    
    if (lowerMessage.includes('already exists')) {
      return context.type === 'league'
        ? this.errorMessages['LeagueAlreadyExists']
        : 'This item already exists.';
    }
    
    // Context-specific messages
    if (context.action) {
      const contextMessages = {
        'signIn': 'Sign in failed. Please check your credentials and try again.',
        'signUp': 'Account creation failed. Please check your information and try again.',
        'createLeague': 'League creation failed. Please try again.',
        'joinLeague': 'Failed to join league. Please check the invite code.',
        'makePick': 'Failed to save your pick. Please try again.',
        'loadData': 'Failed to load data. Please refresh the page.'
      };
      
      if (contextMessages[context.action]) {
        return contextMessages[context.action];
      }
    }
    
    // Final fallback
    return this.errorMessages['DefaultError'];
  }
  
  static getRecoveryActions(errorInfo) {
    const { type, code } = errorInfo;
    
    // Check specific error types first
    if (this.recoveryActions[type]) {
      return this.recoveryActions[type];
    }
    
    if (code && this.recoveryActions[code]) {
      return this.recoveryActions[code];
    }
    
    // Default recovery actions
    return [
      { label: 'Try Again', action: 'retry' },
      { label: 'Go Back', action: 'goBack' }
    ];
  }
  
  static showUserNotification(message, type = 'error', actions = []) {
    appStore.addNotification({
      type,
      title: type === 'error' ? 'Error' : 'Notice',
      message,
      actions,
      persistent: type === 'error' // Error notifications stay longer
    });
  }
  
  static canRetry(errorInfo) {
    const nonRetryableErrors = [
      'UserNotFoundException',
      'UsernameExistsException', 
      'LeagueNotFound',
      'DriverAlreadyPicked',
      'PickDeadlinePassed',
      'PermissionDenied',
      'ValidationError'
    ];
    
    return !nonRetryableErrors.includes(errorInfo.type) && 
           !nonRetryableErrors.includes(errorInfo.code);
  }
  
  static logError(errorInfo, context = {}) {
    // Log to console for development
    console.group('🚨 F1 Survivor Error');
    console.error('Error Info:', errorInfo);
    console.error('Context:', context);
    console.error('User Agent:', navigator.userAgent);
    console.error('URL:', window.location.href);
    console.error('Timestamp:', new Date().toISOString());
    console.groupEnd();
    
    // In production, you might want to send to an error tracking service
    if (process.env.NODE_ENV === 'production') {
      // Example: Send to error tracking service
      // this.sendToErrorTracking(errorInfo, context);
    }
  }
  
  static async executeRecoveryAction(action, context = {}) {
    console.log('Executing recovery action:', action, context);
    
    try {
      switch (action) {
        case 'retry':
          if (context.retryFunction && typeof context.retryFunction === 'function') {
            await context.retryFunction();
          } else {
            window.location.reload();
          }
          break;
          
        case 'refresh':
          window.location.reload();
          break;
          
        case 'goBack':
          if (window.history.length > 1) {
            window.history.back();
          } else {
            window.location.href = '/';
          }
          break;
          
        case 'goHome':
          window.location.href = '/';
          break;
          
        case 'signIn':
          // Trigger sign in modal or redirect
          if (window.showAuthModal) {
            window.showAuthModal('signin');
          }
          break;
          
        case 'resetPassword':
          // Trigger password reset modal
          if (window.showAuthModal) {
            window.showAuthModal('reset');
          }
          break;
          
        case 'resendVerification':
          // Trigger resend verification
          if (window.resendVerificationCode) {
            window.resendVerificationCode();
          }
          break;
          
        case 'navigateToLeagues':
          window.location.href = '/league-hub';
          break;
          
        case 'joinLeague':
          // Trigger join league modal
          if (window.showJoinLeagueModal) {
            window.showJoinLeagueModal();
          }
          break;
          
        case 'selectDifferentDriver':
          // Stay on driver selection page or refresh it
          if (window.location.pathname === '/driver-selection') {
            appStore.clearError();
          } else {
            window.location.href = '/driver-selection';
          }
          break;
          
        case 'viewStandings':
          window.location.href = '/dashboard';
          break;
          
        case 'viewPickHistory':
          window.location.href = '/dashboard#pick-history';
          break;
          
        case 'nextRace':
          // Clear error and show next race info
          appStore.clearError();
          appStore.addNotification({
            type: 'info',
            title: 'Next Race',
            message: 'Get ready for the next race! Pick deadline information will be available soon.'
          });
          break;
          
        case 'checkConnection':
          // Show connection troubleshooting info
          appStore.addNotification({
            type: 'info',
            title: 'Connection Help',
            message: 'Try refreshing the page, checking your WiFi connection, or switching networks.'
          });
          break;
          
        case 'checkEmail':
          appStore.addNotification({
            type: 'info', 
            title: 'Check Your Email',
            message: 'Please check your email (including spam/junk folders) for the verification code.'
          });
          break;
          
        default:
          console.warn('Unknown recovery action:', action);
          appStore.addNotification({
            type: 'warning',
            title: 'Action Not Available',
            message: 'This action is not currently available. Please try refreshing the page.'
          });
      }
    } catch (actionError) {
      console.error('Error executing recovery action:', actionError);
      appStore.addNotification({
        type: 'error',
        title: 'Action Failed',
        message: 'The recovery action failed. Please try refreshing the page.'
      });
    }
  }
  
  // Utility methods for common error scenarios
  static handleAuthError(error, context = {}) {
    return this.handle(error, { ...context, type: 'auth' });
  }
  
  static handleLeagueError(error, context = {}) {
    return this.handle(error, { ...context, type: 'league' });
  }
  
  static handlePickError(error, context = {}) {
    return this.handle(error, { ...context, type: 'pick' });
  }
  
  static handleNetworkError(error, context = {}) {
    return this.handle(error, { ...context, type: 'network' });
  }
  
  // Clear all errors (useful for cleanup)
  static clearAllErrors() {
    appStore.clearError();
    appStore.clearAllNotifications();
  }
}

// Create global error handler for unhandled promises
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  ErrorHandler.handle(event.reason, { type: 'unhandledrejection' });
});

// Create global error handler for JavaScript errors  
window.addEventListener('error', (event) => {
  console.error('Global JavaScript error:', event.error);
  ErrorHandler.handle(event.error, { 
    type: 'javascript',
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno
  });
});

export default ErrorHandler;