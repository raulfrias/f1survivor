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
  async signUp(email, password, userData = {}) {
    try {
      console.log('Attempting to sign up:', email, 'with user data:', userData);
      
      // Store userData temporarily for profile creation after verification
      if (userData.firstName && userData.lastName) {
        sessionStorage.setItem('pendingUserData', JSON.stringify({
          firstName: userData.firstName,
          lastName: userData.lastName,
          email: email
        }));
      }
      
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
      let attributes = cognitoUser.attributes || {};
      
      // console.log('=== PROFILE CREATION DEBUG ===');
      // console.log('User ID:', userId);
      // console.log('Full Cognito User Object:', JSON.stringify(cognitoUser, null, 2));
      // console.log('Initial attributes:', JSON.stringify(attributes, null, 2));
      // console.log('SignInDetails:', JSON.stringify(cognitoUser.signInDetails, null, 2));
      
      // For OAuth users, attributes might not be directly available
      // Try to fetch user attributes explicitly
      if (!attributes || Object.keys(attributes).length === 0) {
        try {
          // console.log('Attempting to fetch user attributes explicitly...');
          const { fetchUserAttributes } = await import('@aws-amplify/auth');
          const fetchedAttributes = await fetchUserAttributes();
          attributes = fetchedAttributes || {};
          // console.log('Fetched user attributes:', JSON.stringify(attributes, null, 2));
        } catch (fetchError) {
          console.log('Could not fetch user attributes:', fetchError);
        }
      }
      
      // Check if profile exists
      // console.log('Checking if profile exists for userId:', userId);
      // Use list() with filter instead of get() since userId is not the primary key
      const existingProfileList = await this.client.models.UserProfile.list({
        filter: { userId: { eq: userId } }
      });
      // console.log('Profile existence check result:', existingProfileList);
      // console.log('Profile data:', existingProfileList.data);
      // console.log('Profile errors:', existingProfileList.errors);
      
      const existingProfile = {
        data: existingProfileList.data && existingProfileList.data.length > 0 ? existingProfileList.data[0] : null
      };

      if (!existingProfile.data) {
        // Create new profile with enhanced Google OAuth data
        const email = attributes.email || cognitoUser.signInDetails?.loginId || userId;
        const username = this.generateUsername(email);

        // console.log('Creating NEW profile with data:');
        
        // Check for stored user data from regular sign-up
        let storedUserData = null;
        try {
          const pendingData = sessionStorage.getItem('pendingUserData');
          if (pendingData) {
            storedUserData = JSON.parse(pendingData);
            // console.log('Found stored user data from sign-up:', storedUserData);
            // Clear it after use
            sessionStorage.removeItem('pendingUserData');
          }
        } catch (e) {
          // console.log('No stored user data found');
        }
        
        const profileData = {
          userId,
          username,
          email,
          // Use stored data for regular users, or Google attributes for OAuth users
          displayName: storedUserData?.firstName && storedUserData?.lastName 
            ? `${storedUserData.firstName} ${storedUserData.lastName}`
            : attributes.name || attributes.given_name || username,
          firstName: storedUserData?.firstName || attributes.given_name || null,
          lastName: storedUserData?.lastName || attributes.family_name || null,
          profilePicture: attributes.picture || null,
          googleId: attributes.sub || null, // Google user ID
          currentSeason: "2025",
          totalSurvivedRaces: 0,
          isEliminated: false,
          notificationsEnabled: true,
          joinedAt: new Date().toISOString()
        };
        // console.log('Profile data to create:', JSON.stringify(profileData, null, 2));

        try {
          const createResult = await this.client.models.UserProfile.create(profileData);
          // console.log('Profile creation result:', createResult);
          // console.log('Profile creation success:', createResult.data);
          
          // Verify the profile was created by trying to retrieve it
          // console.log('Verifying profile creation by retrieving it...');
          const verificationResult = await this.client.models.UserProfile.get({ userId });
          // console.log('Profile verification result:', verificationResult);
          
        } catch (createError) {
          console.error('Profile creation failed:', createError);
          throw createError;
        }

        console.log('Created new user profile with enhanced data');

        // Migrate localStorage picks if any
        await this.migrateLocalStoragePicks(userId);
      } else {
        // Update existing profile with any new Google data and last active
        const updateData = {
          userId,
          lastActiveAt: new Date().toISOString()
        };

        console.log('Existing profile found:', existingProfile.data);
        console.log('Google attributes to update:', attributes);

        // Always update with Google data when available (Google data is more reliable)
        if (attributes.name) {
          updateData.displayName = attributes.name;
          console.log('Updating displayName to:', attributes.name);
        }
        if (attributes.given_name) {
          updateData.firstName = attributes.given_name;
          console.log('Updating firstName to:', attributes.given_name);
        }
        if (attributes.family_name) {
          updateData.lastName = attributes.family_name;
          console.log('Updating lastName to:', attributes.family_name);
        }
        if (attributes.email) {
          updateData.email = attributes.email;
          console.log('Updating email to:', attributes.email);
        }
        if (attributes.picture) {
          updateData.profilePicture = attributes.picture;
          console.log('Updating profilePicture to:', attributes.picture);
        }
        if (attributes.sub) {
          updateData.googleId = attributes.sub;
          console.log('Updating googleId to:', attributes.sub);
        }

        console.log('Final update data:', updateData);
        const updateResult = await this.client.models.UserProfile.update(updateData);
        console.log('Profile update result:', updateResult);
        console.log('Updated existing user profile with enhanced Google data');
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

  // Get user display information (combines Cognito user with profile data)
  async getUserDisplayInfo() {
    try {
      const user = await this.getCurrentUser();
      if (!user) return null;

      await this.ensureInitialized();
      
      // Try to get user profile for enhanced display information
      const userId = user.userId || user.username;
      // console.log('=== USER DISPLAY INFO DEBUG ===');
      // console.log('Getting profile for userId:', userId);
      
      // Try multiple times in case of database timing issues
      let userProfile = null;
      for (let attempt = 1; attempt <= 3; attempt++) {
        // console.log(`Profile retrieval attempt ${attempt}/3`);
        // Use list() with filter instead of get() since userId is not the primary key
        const profileList = await this.client.models.UserProfile.list({
          filter: { userId: { eq: userId } }
        });
        // console.log(`Attempt ${attempt} result:`, profileList);
        
        if (profileList.data && profileList.data.length > 0) {
          userProfile = { data: profileList.data[0] };
          // console.log('Profile found on attempt', attempt);
          break;
        }
        
        if (attempt < 3) {
          // console.log('Profile not found, waiting 1 second before retry...');
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      // console.log('Final retrieved profile data:', userProfile?.data);

      if (userProfile?.data) {
        // Use profile data for better display
        const displayInfo = {
          ...user,
          displayName: userProfile.data.displayName || user.username,
          email: userProfile.data.email || user.signInDetails?.loginId,
          firstName: userProfile.data.firstName,
          lastName: userProfile.data.lastName,
          profilePicture: userProfile.data.profilePicture
        };
        // console.log('Final display info:', displayInfo);
        return displayInfo;
      }

      // Fallback to user object only
      const fallbackInfo = {
        ...user,
        displayName: user.signInDetails?.loginId || user.username,
        email: user.signInDetails?.loginId
      };
      // console.log('Using fallback display info:', fallbackInfo);
      return fallbackInfo;
    } catch (error) {
      console.error('Error getting user display info:', error);
      return null;
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