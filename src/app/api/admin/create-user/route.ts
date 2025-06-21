import { NextRequest, NextResponse } from 'next/server';
import { createCognitoUserWithPassword, generateTemporaryPassword } from '@/utils/cognitoAdmin';
import outputs from '../../../../amplify_outputs.json';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { firstName, lastName, email, password, shouldGeneratePassword } = body;

    // Validate required fields
    if (!firstName || !lastName || !email) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get user pool ID from amplify outputs
    const userPoolId = outputs.auth.user_pool_id;
    if (!userPoolId) {
      return NextResponse.json(
        { error: 'User pool configuration missing' },
        { status: 500 }
      );
    }

    // Determine the password to use
    let userPassword: string;
    if (shouldGeneratePassword) {
      userPassword = generateTemporaryPassword();
    } else if (password) {
      userPassword = password;
    } else {
      return NextResponse.json(
        { error: 'Password is required when not generating automatically' },
        { status: 400 }
      );
    }

    // Create user in Cognito
    const cognitoResult = await createCognitoUserWithPassword({
      email,
      firstName,
      lastName,
      temporaryPassword: userPassword,
      userPoolId,
      messageAction: 'SUPPRESS' // Don't send welcome email since admin is setting password
    });

    if (!cognitoResult.success) {
      return NextResponse.json(
        { error: `Failed to create user: ${cognitoResult.error}` },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      cognitoUserId: cognitoResult.userId,
      password: shouldGeneratePassword ? userPassword : undefined,
      message: `Cognito user created successfully${shouldGeneratePassword ? ' with generated password' : ''}`
    });

  } catch (error) {
    console.error('Error in create-user API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 