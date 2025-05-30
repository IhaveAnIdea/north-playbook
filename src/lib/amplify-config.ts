import { Amplify } from 'aws-amplify';

// Configuration using existing Cognito resources
const amplifyConfig = {
  Auth: {
    Cognito: {
      userPoolId: 'us-west-2_qouweUIhn',
      userPoolClientId: '1hj3djevgisa949h2mtivirgaj',
      identityPoolId: 'us-west-2:953189a1-ed24-4504-98ee-0b2ee6e1f942',
      loginWith: {
        email: true,
      },
      signUpVerificationMethod: 'code' as const,
      userAttributes: {
        email: {
          required: true,
        },
        given_name: {
          required: true,
        },
        family_name: {
          required: true,
        },
      },
      allowGuestAccess: true,
      passwordFormat: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireNumbers: true,
        requireSpecialCharacters: true,
      },
    },
  },
  Storage: {
    S3: {
      bucket: 'north-playbook-storage-bucket',
      region: 'us-west-2',
    },
  },
  API: {
    GraphQL: {
      endpoint: 'https://your-api-endpoint.appsync-api.us-west-2.amazonaws.com/graphql',
      region: 'us-west-2',
      defaultAuthMode: 'userPool' as const,
    },
  },
};

// Configure Amplify
Amplify.configure(amplifyConfig);

export default amplifyConfig; 