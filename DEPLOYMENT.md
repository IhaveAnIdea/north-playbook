# 🚀 North Playbook Production Deployment Guide

This guide will help you deploy the North Playbook application to AWS Amplify with full S3 storage functionality.

## Prerequisites

1. **AWS Account**: You need an active AWS account
2. **AWS CLI**: Install and configure AWS CLI with your credentials
3. **Amplify CLI**: Will be installed automatically during deployment
4. **Node.js**: Version 18 or higher

## Quick Deployment

### Option 1: Automated Deployment (Recommended)

```bash
# Build and deploy in one command
npm run deploy:build
```

### Option 2: Manual Step-by-Step

```bash
# 1. Build the application
npm run build

# 2. Deploy to Amplify
npm run deploy
```

## First-Time Setup

If this is your first deployment, you'll need to initialize Amplify:

```bash
# Initialize Amplify (only needed once)
amplify init

# Follow the prompts:
# - Project name: north-playbook
# - Environment: prod
# - Default editor: Visual Studio Code (or your preference)
# - App type: javascript
# - Framework: react
# - Source directory: src
# - Build directory: .next
# - Build command: npm run build
# - Start command: npm start
```

## Environment Configuration

### AWS Credentials Setup

1. **Install AWS CLI** (if not already installed):
   ```bash
   # Windows
   winget install Amazon.AWSCLI
   
   # macOS
   brew install awscli
   
   # Linux
   curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
   unzip awscliv2.zip
   sudo ./aws/install
   ```

2. **Configure AWS credentials**:
   ```bash
   aws configure
   ```
   
   Enter your:
   - AWS Access Key ID
   - AWS Secret Access Key
   - Default region (e.g., us-west-2)
   - Default output format (json)

### Amplify Configuration

The application will automatically:
- Create an S3 bucket for file storage
- Set up Cognito for user authentication
- Configure proper CORS settings
- Create user-specific folder structures

## Storage Configuration

The production deployment includes:

### S3 Bucket Structure
```
north-playbook-storage/
├── users/
│   └── {user-id}/
│       ├── playbook/
│       │   ├── {category}/
│       │   │   └── {exercise-id}/
│       │   │       └── {timestamp}_{filename}
│       │   └── profile/
│       │       └── {timestamp}_{filename}
│       └── temp/
│           └── {timestamp}_{filename}
└── public/
    └── app-assets/
```

### Access Permissions
- **Users**: Can read/write/delete their own files only
- **Public**: Read-only access to public assets
- **Guests**: Read-only access to public assets

## Deployment Process

### What Happens During Deployment

1. **Build Process**:
   - Next.js builds the application
   - TypeScript compilation
   - Asset optimization

2. **Amplify Push**:
   - Creates/updates AWS resources
   - Deploys backend (Auth, Storage, Data)
   - Updates frontend hosting

3. **Resource Creation**:
   - S3 bucket with proper CORS
   - Cognito User Pool
   - IAM roles and policies
   - CloudFront distribution

### Expected Output

After successful deployment, you'll see:
```
✅ Successfully created/updated resources in cloud.
✅ All resources are updated in the cloud

Amplify hosting urls: 
┌──────────────┬──────────────────────────────────────────────┐
│ FrontEnd Env │ Domain                                       │
├──────────────┼──────────────────────────────────────────────┤
│ prod         │ https://main.d1234567890.amplifyapp.com     │
└──────────────┴──────────────────────────────────────────────┘
```

## Post-Deployment Verification

### 1. Test Authentication
- Visit your deployed URL
- Sign up for a new account
- Verify email confirmation works

### 2. Test File Upload
- Navigate to an exercise page
- Upload an image
- Verify it appears correctly
- Check S3 bucket in AWS Console

### 3. Test Storage Permissions
- Upload files as different users
- Verify users can only access their own files

## Monitoring and Maintenance

### Check Deployment Status
```bash
npm run amplify:status
```

### View Amplify Console
```bash
npm run amplify:console
```

### Update Production
```bash
# After making changes
npm run deploy:build
```

## Troubleshooting

### Common Issues

1. **Build Failures**:
   ```bash
   # Check for TypeScript errors
   npm run lint
   
   # Fix and rebuild
   npm run build
   ```

2. **Authentication Issues**:
   - Check Cognito configuration in AWS Console
   - Verify email settings
   - Check user pool policies

3. **Storage Issues**:
   - Verify S3 bucket permissions
   - Check CORS configuration
   - Ensure IAM roles are correct

4. **CORS Errors in Production**:
   - Usually auto-resolved by Amplify
   - Check S3 bucket CORS settings
   - Verify CloudFront configuration

### Getting Help

- **Amplify Docs**: https://docs.amplify.aws/
- **AWS Support**: https://aws.amazon.com/support/
- **GitHub Issues**: Create an issue in the repository

## Security Considerations

### Production Security Features

1. **User Isolation**: Each user can only access their own files
2. **Encrypted Storage**: S3 encryption at rest
3. **HTTPS Only**: All traffic encrypted in transit
4. **IAM Policies**: Least privilege access
5. **CORS Protection**: Proper origin restrictions

### Best Practices

- Regularly update dependencies
- Monitor AWS costs
- Review access logs
- Keep Amplify CLI updated
- Use environment-specific configurations

## Cost Optimization

### AWS Free Tier Includes:
- 5GB S3 storage
- 20,000 GET requests
- 2,000 PUT requests
- Cognito: 50,000 MAUs

### Monitoring Costs:
- Set up billing alerts
- Use AWS Cost Explorer
- Monitor S3 usage
- Review CloudFront usage

---

## Quick Commands Reference

```bash
# Deployment
npm run deploy:build          # Build and deploy
npm run deploy               # Deploy only
npm run build               # Build only

# Amplify Management
npm run amplify:status      # Check status
npm run amplify:console     # Open console
amplify env list           # List environments
amplify env checkout prod  # Switch environment

# Development
npm run dev                # Local development
npm run lint              # Check for errors
```

🎉 **Congratulations!** Your North Playbook application is now running in production with full S3 storage capabilities! 