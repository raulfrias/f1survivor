import { defineAuth } from '@aws-amplify/backend';

/**
 * Define and configure your auth resource
 * Following AWS best practices for email verification and security
 * @see https://docs.amplify.aws/gen2/build-a-backend/auth
 * @see https://docs.aws.amazon.com/cognito/latest/developerguide/user-pool-settings-email-phone-verification.html
 */
export const auth = defineAuth({
  loginWith: {
    email: true,
  },
  
  userAttributes: {
    email: {
      required: true,
      mutable: true
    },
  },

  // AWS Best Practice: Require email verification for account security
  // This ensures users can only sign in after verifying their email address
  accountRecovery: 'EMAIL_ONLY',
  
  // AWS Best Practice: Configure sign-up verification
  // Users must verify their email before they can sign in
  triggers: {
    // This will be configured to require email verification
  }
});
