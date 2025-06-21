#!/usr/bin/env node

/**
 * Script to initialize craig@craigwinter.com as an admin user
 * This creates a user profile directly in the database
 */

const { generateClient } = require('aws-amplify/api');
const { Amplify } = require('aws-amplify');
// Import your amplify config - adjust path as needed
const outputs = require('../amplify_outputs.json');

// Configure Amplify
Amplify.configure(outputs);

const client = generateClient();

async function initializeCraigAsAdmin() {
  try {
    console.log('🔧 Initializing craig@craigwinter.com as admin...');

    // Check if user profile already exists
    const { data: existingProfiles } = await client.models.UserProfile.list({
      filter: { email: { eq: 'craig@craigwinter.com' } }
    });

    if (existingProfiles && existingProfiles.length > 0) {
      // Update existing profile to admin
      const profile = existingProfiles[0];
      await client.models.UserProfile.update({
        id: profile.id,
        role: 'admin',
      });
      console.log('✅ Updated existing craig@craigwinter.com profile to admin role');
    } else {
      // Create new admin profile
      await client.models.UserProfile.create({
        userId: `craig-admin-${Date.now()}`, // Temporary ID until Craig signs up
        firstName: 'Craig',
        lastName: 'Winter',
        email: 'craig@craigwinter.com',
        role: 'admin',
      });
      console.log('✅ Created new admin profile for craig@craigwinter.com');
    }

    console.log('🎉 Craig is now configured as an admin!');
    console.log('📝 Note: Craig will need to sign up with craig@craigwinter.com to activate the account');
    
    return true;
  } catch (error) {
    console.error('❌ Error initializing Craig as admin:', error);
    return false;
  }
}

// Run the script
initializeCraigAsAdmin()
  .then((success) => {
    if (success) {
      console.log('✨ Admin initialization completed successfully!');
      process.exit(0);
    } else {
      console.log('⚠️ Admin initialization failed!');
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error('💥 Unexpected error:', error);
    process.exit(1);
  }); 