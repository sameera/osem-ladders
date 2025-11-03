/**
 * AWS Cognito Configuration
 *
 * Set up environment variables in .env file:
 * - VITE_COGNITO_REGION
 * - VITE_COGNITO_USER_POOL_ID
 * - VITE_COGNITO_USER_POOL_CLIENT_ID
 * - VITE_COGNITO_DOMAIN
 */

import { Amplify } from 'aws-amplify';

const cognitoConfig = {
  Auth: {
    Cognito: {
      userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID || '',
      userPoolClientId: import.meta.env.VITE_COGNITO_USER_POOL_CLIENT_ID || '',
      loginWith: {
        oauth: {
          domain: import.meta.env.VITE_COGNITO_DOMAIN || '',
          scopes: ['openid', 'email', 'profile'],
          redirectSignIn: [window.location.origin],
          redirectSignOut: [window.location.origin],
          responseType: 'code',
        },
      },
    },
  },
};

export const configureCognito = () => {
  Amplify.configure(cognitoConfig);
};

export default cognitoConfig;
