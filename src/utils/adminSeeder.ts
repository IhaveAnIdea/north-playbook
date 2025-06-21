import { generateClient } from 'aws-amplify/api';
import { getCurrentUser } from 'aws-amplify/auth';
import type { Schema } from '../../amplify/data/resource';

const client = generateClient<Schema>();

export async function makeCurrentUserAdmin() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error('No authenticated user found');
    }

    // Check if user profile exists
    const { data: profiles } = await client.models.UserProfile.list({
      filter: { userId: { eq: user.userId } }
    });

    if (profiles && profiles.length > 0) {
      // Update existing profile to admin
      const profile = profiles[0];
      await client.models.UserProfile.update({
        id: profile.id,
        role: 'admin',
      });
      console.log('User role updated to admin');
    } else {
      // Create new admin profile
      await client.models.UserProfile.create({
        userId: user.userId,
        firstName: user.signInDetails?.loginId?.split('@')[0] || 'Admin',
        lastName: 'User',
        email: user.signInDetails?.loginId || '',
        role: 'admin',
      });
      console.log('Admin profile created');
    }

    return true;
  } catch (error) {
    console.error('Error making user admin:', error);
    return false;
  }
}

// Function to make specific user admin by email
export async function makeUserAdminByEmail(email: string) {
  try {
    // Find user profile by email
    const { data: profiles } = await client.models.UserProfile.list({
      filter: { email: { eq: email } }
    });

    if (profiles && profiles.length > 0) {
      const profile = profiles[0];
      await client.models.UserProfile.update({
        id: profile.id,
        role: 'admin',
      });
      console.log(`User ${email} role updated to admin`);
      return true;
    } else {
      console.log(`No user profile found for email: ${email}`);
      return false;
    }
  } catch (error) {
    console.error(`Error making user ${email} admin:`, error);
    return false;
  }
}

// Initialize craig@craigwinter.com as admin
export async function initializeCraigAsAdmin() {
  return await makeUserAdminByEmail('craig@craigwinter.com');
}

// Helper function to check if any admin exists
export async function hasAdminUsers() {
  try {
    const { data: profiles } = await client.models.UserProfile.list({
      filter: { role: { eq: 'admin' } }
    });
    return profiles && profiles.length > 0;
  } catch (error) {
    console.error('Error checking for admin users:', error);
    return false;
  }
}

// Function to ensure at least one admin exists
export async function ensureAdminExists() {
  try {
    const hasAdmin = await hasAdminUsers();
    if (!hasAdmin) {
      // If no admin exists, make the current user admin
      return await makeCurrentUserAdmin();
    }
    return true;
  } catch (error) {
    console.error('Error ensuring admin exists:', error);
    return false;
  }
} 