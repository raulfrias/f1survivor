// auth-manager.js - Authentication management for F1 Survivor
import { Amplify } from 'aws-amplify';
import { signIn, signUp, signOut, confirmSignUp, resendSignUpCode, 
         resetPassword, confirmResetPassword, fetchAuthSession,
         getCurrentUser, signInWithRedirect } from 'aws-amplify/auth';
import { generateClient } from 'aws-amplify/data';

class AuthManager {
  constructor() {
    this.client = null;
    this.currentUser = null;
    this.authStateListeners = [];
    this.initializeAmplify();
  }
  
  // Initialize Amplify configuration
  async initializeAmplify() {
    try {
      const amplifyconfig = await import('./amplify_outputs.json');
      console.log('Using Amplify configuration');
      Amplify.configure(amplifyconfig.default || amplifyconfig);
      this.client = generateClient();
      this.initializeAuthState();
    } catch (error) {
      console.error('Failed to load Amplify configuration:', error);
      throw new Error('Amplify configuration required');
    }
  }
  
  // Initialize and monitor auth state
  async initializeAuthState() {
    try {
      const user = await getCurrentUser();
      this.currentUser = user;
      this.notifyAuthStateChange(true);
    } catch {
      this.currentUser = null;
      this.notifyAuthStateChange(false);
    }
  }

  // Ensure Amplify is initialized before operations
  async ensureInitialized() {
    if (!this.client) {
      await this.initializeAmplify();
    }
  }
  
  // Sign in with email/password
  async signIn(email, password, rememberMe = false) {
    try {
      console.log('Attempting to sign in:', email);
      
      const result = await signIn({
        username: email,
        password
      });
      
      console.log('Sign in result:', result);
      
      // Check if the sign in result indicates further steps are needed
      if (result.nextStep) {
        console.log('Sign in requires additional steps:', result.nextStep);
        
        if (result.nextStep.signInStep === 'CONFIRM_SIGN_UP') {
          return {
            success: false,
            error: 'Please verify your email first',
            code: 'UserNotConfirmedException',
            needsVerification: true,
            email: email
          };
        }
        
        // DONE means authentication completed successfully
        if (result.nextStep.signInStep === 'DONE') {
          console.log('Authentication completed successfully');
          // Continue to success flow below
        } else {
          // For other steps that require user intervention
          return {
            success: false,
            error: 'Additional authentication step required: ' + result.nextStep.signInStep,
            nextStep: result.nextStep
          };
        }
      }
      
      // If we get here, sign in was successful
      console.log('Sign in successful, creating user profile...');
      this.currentUser = result;
      await this.createOrUpdateUserProfile(result);
      this.notifyAuthStateChange(true);
      
      return { success: true, user: result };
    } catch (error) {
      console.error('Sign in error:', error);
      return this.handleAuthError(error);
    }
  }
  
  // Sign up new user
  async signUp(email, password) {
    try {
      console.log('Attempting to sign up:', email);
      
      const result = await signUp({
        username: email,
        password,
        options: {
          userAttributes: {
            email
          }
        }
      });
      
      return { 
        success: true, 
        userId: result.userId,
        nextStep: result.nextStep,
        needsVerification: result.nextStep.signUpStep === 'CONFIRM_SIGN_UP'
      };
    } catch (error) {
      console.error('Sign up error:', error);
      return this.handleAuthError(error);
    }
  }
  
  // Confirm sign up with verification code
  async confirmSignUp(email, code) {
    try {
      console.log('Confirming sign up for:', email);
      
      const result = await confirmSignUp({
        username: email,
        confirmationCode: code
      });
      
      if (result.isSignUpComplete) {
        return { success: true, autoSignIn: true };
      }
      
      return { success: true, nextStep: result.nextStep };
    } catch (error) {
      console.error('Confirm sign up error:', error);
      return this.handleAuthError(error);
    }
  }
  
  // Resend verification code
  async resendSignUpCode(email) {
    try {
      console.log('Resending verification code for:', email);
      
      await resendSignUpCode({
        username: email
      });
      
      return { success: true };
    } catch (error) {
      console.error('Resend code error:', error);
      return this.handleAuthError(error);
    }
  }
  
  // Reset password - send reset code to email
  async resetPassword(email) {
    try {
      console.log('Initiating password reset for:', email);
      
      const result = await resetPassword({
        username: email
      });
      
      console.log('Password reset initiated:', result);
      return { 
        success: true, 
        nextStep: result.nextStep,
        codeDeliveryDetails: result.nextStep.resetPasswordStep === 'CONFIRM_RESET_PASSWORD_WITH_CODE' 
          ? result.nextStep.codeDeliveryDetails 
          : null
      };
    } catch (error) {
      console.error('Reset password error:', error);
      
      // Special handling for common reset password errors
      if (error.name === 'UserNotFoundException') {
        return {
          success: false,
          error: 'No account found with this email address',
          code: error.name
        };
      }
      
      if (error.name === 'InvalidParameterException') {
        return {
          success: false,
          error: 'Please enter a valid email address',
          code: error.name
        };
      }
      
      return this.handleAuthError(error);
    }
  }
  
  // Confirm password reset with code and new password
  async confirmResetPassword(email, confirmationCode, newPassword) {
    try {
      console.log('Confirming password reset for:', email);
      
      await confirmResetPassword({
        username: email,
        confirmationCode,
        newPassword
      });
      
      console.log('Password reset successful');
      return { success: true };
    } catch (error) {
      console.error('Confirm reset password error:', error);
      return this.handleAuthError(error);
    }
  }
  
  // ENHANCED: Create or update user profile in DynamoDB with Google OAuth data
  async createOrUpdateUserProfile(cognitoUser) {
    try {
      await this.ensureInitialized();
      
      const userId = cognitoUser.userId || cognitoUser.username;
      const attributes = cognitoUser.attributes || {};
      console.log('Creating/updating user profile for:', userId, 'with attributes:', attributes);
      
      // Check if profile exists
      const existingProfile = await this.client.models.UserProfile.get({ userId });
      
      if (!existingProfile.data) {
        // Create new profile with enhanced Google OAuth data
        const email = attributes.email || cognitoUser.signInDetails?.loginId || userId;
        const username = this.generateUsername(email);
        
        await this.client.models.UserProfile.create({
          userId,
          username,
          email,
          displayName: attributes.name || attributes.given_name || username,
          firstName: attributes.given_name || null,
          lastName: attributes.family_name || null,
          profilePicture: attributes.picture || null,
          googleId: attributes.sub || null, // Google user ID
          currentSeason: "2025",
          totalSurvivedRaces: 0,
          isEliminated: false,
          notificationsEnabled: true,
          joinedAt: new Date().toISOString()
        });
        
        console.log('Created new user profile with enhanced data');
        
        // Migrate localStorage picks if any
        await this.migrateLocalStoragePicks(userId);
      } else {
        // Update existing profile with any new Google data and last active
        const updateData = {
          userId,
          lastActiveAt: new Date().toISOString()
        };
        
        // Only update Google data if it's available and not already set
        if (attributes.name && !existingProfile.data.displayName) {
          updateData.displayName = attributes.name;
        }
        if (attributes.given_name && !existingProfile.data.firstName) {
          updateData.firstName = attributes.given_name;
        }
        if (attributes.family_name && !existingProfile.data.lastName) {
          updateData.lastName = attributes.family_name;
        }
        if (attributes.picture && !existingProfile.data.profilePicture) {
          updateData.profilePicture = attributes.picture;
        }
        if (attributes.sub && !existingProfile.data.googleId) {
          updateData.googleId = attributes.sub;
        }
        
        await this.client.models.UserProfile.update(updateData);
        console.log('Updated existing user profile with enhanced data');
      }
    } catch (error) {
      console.error('Error managing user profile:', error);
    }
  }
  
  // Generate username from email
  generateUsername(email) {
    if (!email) return `Player${Math.floor(Math.random() * 10000)}`;
    const baseUsername = email.split('@')[0];
    return baseUsername.replace(/[^a-zA-Z0-9]/g, '');
  }
  
  // Migrate picks from localStorage to authenticated user
  async migrateLocalStoragePicks(userId) {
    try {
      await this.ensureInitialized();
      
      const localPicks = JSON.parse(localStorage.getItem('f1survivor_user_picks') || '{}');
      
      if (localPicks.picks && localPicks.picks.length > 0) {
        console.log('Migrating picks from localStorage:', localPicks.picks.length);
        
        for (const pick of localPicks.picks) {
          // Check if pick already exists for this user
          const existingPick = await this.client.models.DriverPick.list({
            filter: {
              userId: { eq: userId },
              raceId: { eq: pick.raceId }
            }
          });
          
          if (existingPick.data.length === 0) {
            // Migrate the pick
            await this.client.models.DriverPick.create({
              userId,
              seasonId: "2025", // Current season
              raceId: pick.raceId,
              driverId: pick.driverId.toString(),
              driverName: pick.driverName,
              teamName: pick.teamName,
              raceName: pick.raceName || '',
              submittedAt: pick.timestamp,
              pickDeadline: new Date(pick.timestamp).toISOString(),
              isAutoPick: pick.isAutoPick || false
            });
          }
        }
        
        // Clear localStorage after successful migration
        localStorage.removeItem('f1survivor_user_picks');
        console.log('Successfully migrated picks from localStorage');
      }
    } catch (error) {
      console.error('Error migrating picks:', error);
    }
  }
  
  // Sign out
  async signOut() {
    try {
      console.log('Signing out user');
      
      await signOut();
      this.currentUser = null;
      this.notifyAuthStateChange(false);
      
      // Clear any cached data
      sessionStorage.clear();
      
      return { success: true };
    } catch (error) {
      console.error('Sign out error:', error);
      return this.handleAuthError(error);
    }
  }
  
  // Get current authenticated user
  async getCurrentUser() {
    try {
      if (this.currentUser) return this.currentUser;
      
      const user = await getCurrentUser();
      this.currentUser = user;
      return user;
    } catch {
      return null;
    }
  }
  
  // Check if user is authenticated
  async isAuthenticated() {
    try {
      await getCurrentUser();
      return true;
    } catch {
      return false;
    }
  }

  // NEW: Google OAuth sign-in
  async signInWithGoogle() {
    try {
      console.log('Initiating Google OAuth flow');
      
      await signInWithRedirect({ 
        provider: 'Google',
        customState: 'f1survivor-google-auth'
      });
      
      return { success: true, provider: 'Google' };
    } catch (error) {
      console.error('Google sign-in error:', error);
      return this.handleAuthError(error);
    }
  }

  // ENHANCED: Handle OAuth callback with better error handling
  async handleOAuthCallback() {
    try {
      // Ensure Amplify is initialized
      await this.ensureInitialized();
      
      // Get current user from Amplify
      const user = await getCurrentUser();
      console.log('OAuth callback successful:', user);
      
      // Update our internal state
      this.currentUser = user;
      
      // Create/update user profile with Google data
      await this.createOrUpdateUserProfile(user);
      
      // Notify listeners of auth state change
      this.notifyAuthStateChange(true);
      
      return { success: true, user };
    } catch (error) {
      console.error('OAuth callback error:', error);
      
      // Don't set currentUser to null here as OAuth might still be processing
      // Let the retry mechanism handle it
      
      return this.handleAuthError(error);
    }
  }

  // NEW: Enhanced session management
  async refreshSession() {
    try {
      const session = await fetchAuthSession({ forceRefresh: true });
      return session;
    } catch (error) {
      console.error('Session refresh failed:', error);
      this.notifyAuthStateChange(false);
      throw error;
    }
  }

  // NEW: Session monitoring
  startSessionMonitoring() {
    setInterval(async () => {
      try {
        await this.refreshSession();
      } catch (error) {
        console.log('Session expired, user needs to re-authenticate');
      }
    }, 15 * 60 * 1000); // Check every 15 minutes
  }
  
  // Get auth session (tokens)
  async getSession() {
    try {
      const session = await fetchAuthSession();
      return session;
    } catch {
      return null;
    }
  }
  
  // Subscribe to auth state changes
  onAuthStateChange(callback) {
    this.authStateListeners.push(callback);
    // Call immediately with current state
    this.isAuthenticated().then(isAuth => callback(isAuth));
    
    // Return unsubscribe function
    return () => {
      const index = this.authStateListeners.indexOf(callback);
      if (index > -1) {
        this.authStateListeners.splice(index, 1);
      }
    };
  }
  
  // Notify all listeners of auth state change
  notifyAuthStateChange(isAuthenticated) {
    this.authStateListeners.forEach(callback => {
      callback(isAuthenticated);
    });
  }
  
  // Handle auth errors
  handleAuthError(error) {
    const errorMap = {
      'UserNotFoundException': 'No account found with this email',
      'NotAuthorizedException': 'Incorrect email or password',
      'UserNotConfirmedException': 'Please verify your email first',
      'UsernameExistsException': 'An account with this email already exists',
      'InvalidPasswordException': 'Password does not meet requirements',
      'LimitExceededException': 'Too many attempts. Please try again later',
      'NetworkError': 'Network error. Please check your connection',
      'CodeMismatchException': 'Invalid verification code',
      'ExpiredCodeException': 'Verification code has expired',
      'InvalidParameterException': 'Please check your input and try again'
    };
    
    const message = errorMap[error.name] || error.message || 'Authentication failed';
    
    return {
      success: false,
      error: message,
      code: error.name
    };
  }
}

// Export singleton instance
export const authManager = new AuthManager(); 