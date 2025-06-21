# Admin Password Management Setup

## Overview

The admin panel now supports creating users with passwords directly in AWS Cognito. This allows admins to:

- **Set Custom Passwords**: Manually enter passwords for new users
- **Generate Secure Passwords**: Automatically generate temporary passwords
- **Immediate Access**: Users can sign in immediately with their credentials
- **No Email Signup Required**: Users don't need to go through the signup process

## Features Added

### 🔐 **Password Options**
- **Generate Temporary Password**: Secure 12-character passwords with mixed characters
- **Set Custom Password**: Manually enter passwords that meet Cognito requirements
- **Password Requirements**: 8+ characters with uppercase, lowercase, numbers, and symbols

### 🛡️ **Security Features**
- Passwords are generated server-side for security
- Generated passwords are shown only once to the admin
- All passwords meet AWS Cognito security requirements
- Users are created directly in Cognito with verified email

### 🎯 **Admin Experience**
- Checkbox to toggle between generated and custom passwords
- Password strength requirements displayed in the UI
- Success messages show generated passwords for secure sharing
- Form validation for required fields and password strength

## Setup Instructions

### 1. AWS Credentials Configuration

The admin user creation requires AWS credentials with Cognito admin permissions. You have two options:

#### Option A: Environment Variables (Recommended for Production)
Create a `.env.local` file in your project root:

```bash
# AWS Configuration
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=us-west-2
```

#### Option B: AWS Credentials File (For Development)
Configure AWS credentials using the AWS CLI:

```bash
aws configure
```

Or create `~/.aws/credentials`:

```
[default]
aws_access_key_id = your_access_key
aws_secret_access_key = your_secret_key
```

### 2. Required IAM Permissions

The AWS credentials need the following Cognito permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "cognito-idp:AdminCreateUser",
        "cognito-idp:AdminSetUserPassword",
        "cognito-idp:AdminDeleteUser",
        "cognito-idp:AdminGetUser"
      ],
      "Resource": "arn:aws:cognito-idp:*:*:userpool/*"
    }
  ]
}
```

### 3. User Pool Configuration

The system automatically uses the user pool ID from `amplify_outputs.json`. No additional configuration needed.

## How to Use

### Creating Users with Passwords

1. **Access Admin Panel**: Navigate to `/admin` as an admin user
2. **Click "Add New User"**: Open the user creation modal
3. **Fill User Details**: Enter first name, last name, email, and role
4. **Set Password**:
   - **Auto-Generate**: Check "Generate temporary password" (default)
   - **Custom Password**: Uncheck the box and enter your own password
5. **Create User**: Click "Add User" to create the account

### Password Requirements

- **Minimum Length**: 8 characters
- **Must Include**: Uppercase letter, lowercase letter, number, symbol
- **Auto-Generated**: 12 characters with all requirements met

### After User Creation

- **Generated Password**: Displayed in success message for secure sharing
- **Custom Password**: User can sign in immediately with the password you set
- **User Access**: Users can sign in at the login page with email + password

## API Endpoints

### POST `/api/admin/create-user`

Creates a new user with Cognito authentication.

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe", 
  "email": "john@example.com",
  "role": "user",
  "password": "CustomPass123!",
  "shouldGeneratePassword": false
}
```

**Response:**
```json
{
  "success": true,
  "user": { ... },
  "password": "Generated123!", 
  "message": "User created successfully"
}
```

## Troubleshooting

### "User pool configuration missing"
- Verify `amplify_outputs.json` contains the user pool ID
- Ensure the file is properly imported in the API route

### "Access Denied" or "Unauthorized"
- Check AWS credentials are properly configured
- Verify IAM permissions include Cognito admin actions
- Ensure the user pool allows admin actions

### "User already exists"
- Check if a user with that email already exists in the database
- Try a different email address
- Clean up any duplicate users from the admin panel

### Generated passwords not showing
- Ensure you're using the "Generate temporary password" option
- Check the success message after user creation
- Save the password immediately as it's only shown once

## Security Best Practices

1. **Secure Password Sharing**: Share generated passwords through secure channels
2. **Rotate Credentials**: Regularly update AWS access keys
3. **Monitor Access**: Track admin user creation activities
4. **Force Password Change**: Consider requiring users to change temporary passwords
5. **Audit Permissions**: Regularly review IAM permissions for the admin role

## Future Enhancements

- **Password Reset**: Admin ability to reset user passwords
- **Bulk User Import**: CSV import with auto-generated passwords
- **Email Integration**: Automatic secure password delivery via email
- **Password History**: Track password changes and enforce policies
- **Two-Factor Authentication**: Enhanced security for admin accounts 