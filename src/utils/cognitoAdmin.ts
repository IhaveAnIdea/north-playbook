import { CognitoIdentityProviderClient, AdminCreateUserCommand, AdminSetUserPasswordCommand, AdminDeleteUserCommand } from '@aws-sdk/client-cognito-identity-provider';
import outputs from '../../amplify_outputs.json';

// Configure AWS SDK v3 client
const cognitoClient = new CognitoIdentityProviderClient({
  region: outputs.auth.aws_region || 'us-west-2'
});

interface CreateUserWithPasswordParams {
  email: string;
  firstName: string;
  lastName: string;
  temporaryPassword: string;
  userPoolId: string;
  messageAction?: 'SUPPRESS' | 'RESEND';
}

export async function createCognitoUserWithPassword({
  email,
  firstName,
  lastName,
  temporaryPassword,
  userPoolId,
  messageAction = 'SUPPRESS'
}: CreateUserWithPasswordParams) {
  try {
    const command = new AdminCreateUserCommand({
      UserPoolId: userPoolId,
      Username: email,
      UserAttributes: [
        {
          Name: 'email',
          Value: email
        },
        {
          Name: 'given_name',
          Value: firstName
        },
        {
          Name: 'family_name',
          Value: lastName
        },
        {
          Name: 'email_verified',
          Value: 'true'
        }
      ],
      TemporaryPassword: temporaryPassword,
      MessageAction: messageAction,
      ForceAliasCreation: false
    });

    const result = await cognitoClient.send(command);
    
    return {
      success: true,
      user: result.User,
      userId: result.User?.Username
    };
  } catch (error: unknown) {
    console.error('Error creating Cognito user:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorCode = (error as any)?.name || (error as any)?.code;
    
    return {
      success: false,
      error: errorMessage || 'Failed to create user',
      code: errorCode
    };
  }
}

interface SetUserPasswordParams {
  email: string;
  password: string;
  userPoolId: string;
  permanent?: boolean;
}

export async function setUserPassword({
  email,
  password,
  userPoolId,
  permanent = false
}: SetUserPasswordParams) {
  try {
    const command = new AdminSetUserPasswordCommand({
      UserPoolId: userPoolId,
      Username: email,
      Password: password,
      Permanent: permanent
    });

    await cognitoClient.send(command);
    
    return {
      success: true
    };
  } catch (error: unknown) {
    console.error('Error setting user password:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorCode = (error as any)?.name || (error as any)?.code;
    
    return {
      success: false,
      error: errorMessage || 'Failed to set password',
      code: errorCode
    };
  }
}

interface DeleteCognitoUserParams {
  email: string;
  userPoolId: string;
}

export async function deleteCognitoUser({
  email,
  userPoolId
}: DeleteCognitoUserParams) {
  try {
    const command = new AdminDeleteUserCommand({
      UserPoolId: userPoolId,
      Username: email
    });

    await cognitoClient.send(command);
    
    return {
      success: true
    };
  } catch (error: unknown) {
    console.error('Error deleting Cognito user:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorCode = (error as any)?.name || (error as any)?.code;
    
    return {
      success: false,
      error: errorMessage || 'Failed to delete user',
      code: errorCode
    };
  }
}

export function generateTemporaryPassword(): string {
  // Generate a secure temporary password that meets Cognito requirements
  // At least 8 characters, with uppercase, lowercase, numbers, and symbols
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const symbols = '!@#$%&*';
  
  let password = '';
  
  // Ensure at least one character from each required set
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];
  
  // Fill the rest with random characters
  const allChars = lowercase + uppercase + numbers + symbols;
  for (let i = 4; i < 12; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
} 