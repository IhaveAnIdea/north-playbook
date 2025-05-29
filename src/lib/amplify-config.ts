import { Amplify } from 'aws-amplify';

// Configuration using existing Cognito resources
const amplifyConfig = {
  Auth: {
    Cognito: {
      userPoolId: 'us-west-2_8Z8laebmh',
      userPoolClientId: '7ej6vdok2mbsgnsksamul54i2h',
      identityPoolId: 'us-west-2:3b6a56ad-d987-415b-948a-7bd1149d0501',
      loginWith: {
        email: true,
      },
      signUpVerificationMethod: 'code',
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
      defaultAuthMode: 'userPool',
    },
  },
};

// Configure Amplify
Amplify.configure(amplifyConfig);

export default amplifyConfig; 