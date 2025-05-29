#!/usr/bin/env node

/**
 * Production Deployment Script for North Playbook
 * 
 * This script helps deploy the application to AWS Amplify with proper configuration.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting North Playbook Production Deployment...\n');

// Check if we're in the right directory
if (!fs.existsSync('package.json')) {
  console.error('❌ Error: Please run this script from the project root directory');
  process.exit(1);
}

// Check if Amplify CLI is installed
try {
  execSync('amplify --version', { stdio: 'ignore' });
} catch (error) {
  console.log('📦 Installing Amplify CLI...');
  execSync('npm install -g @aws-amplify/cli', { stdio: 'inherit' });
}

console.log('✅ Amplify CLI is ready\n');

// Build the application
console.log('🔨 Building the application...');
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✅ Build completed successfully\n');
} catch (error) {
  console.error('❌ Build failed. Please fix build errors before deploying.');
  process.exit(1);
}

// Deploy to Amplify
console.log('🌐 Deploying to AWS Amplify...');
try {
  execSync('amplify push --yes', { stdio: 'inherit' });
  console.log('✅ Deployment completed successfully!\n');
} catch (error) {
  console.error('❌ Deployment failed. Please check your AWS credentials and try again.');
  process.exit(1);
}

console.log('🎉 North Playbook has been successfully deployed to production!');
console.log('📝 Next steps:');
console.log('   1. Check the Amplify console for your app URL');
console.log('   2. Test the image upload functionality');
console.log('   3. Verify S3 storage is working correctly');
console.log('   4. Monitor the application logs\n'); 