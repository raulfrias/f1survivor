import { defineAuth, secret } from '@aws-amplify/backend';

/**
 * Define and configure your auth resource
 * Following AWS best practices for email verification and security
 * Now includes Google OAuth integration for seamless social login
 * @see https://docs.amplify.aws/gen2/build-a-backend/auth
 * @see https://docs.aws.amazon.com/cognito/latest/developerguide/user-pool-settings-email-phone-verification.html
 */
export const auth = defineAuth({
  loginWith: {
    email: true,
    externalProviders: {
      google: {
        clientId: secret('GOOGLE_CLIENT_ID'),
        clientSecret: secret('GOOGLE_CLIENT_SECRET'),
        scopes: ['email', 'profile', 'openid'],
        attributeMapping: {
          email: 'email',
          givenName: 'given_name',
          familyName: 'family_name',
          fullname: 'name'
        }
      },
      callbackUrls: [
        'http://localhost:5173',  // Local development
        'http://localhost:3000',  // Alternative local port
        'https://f1survivor.com',
        'https://www.f1survivor.com'
      ],
      logoutUrls: [
        'http://localhost:5173',
        'http://localhost:3000', 
        'https://f1survivor.com',
        'https://www.f1survivor.com'
      ]
    }
  },
  
  userAttributes: {
    email: {
      required: true,
      mutable: true
    },
    givenName: {
      required: false,
      mutable: true
    },
    familyName: {
      required: false,
      mutable: true
    }
  },

  // AWS Best Practice: Require email verification for account security
  // This ensures users can only sign in after verifying their email address
  accountRecovery: 'EMAIL_ONLY',
  
  // AWS Best Practice: Configure sign-up verification
  // Users must verify their email before they can sign in
  triggers: {
    // Email verification is handled automatically by Cognito
    // Google OAuth users get verified email automatically
  }
  
  // Note: OAuth callback URLs are configured above for Google integration
  // The CORS issue will be resolved by updating the backend deployment
});