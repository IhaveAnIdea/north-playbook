import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuthenticator } from '@aws-amplify/ui-react';
import { generateClient } from 'aws-amplify/api';
import type { Schema } from '../../amplify/data/resource';

const client = generateClient<Schema>();

export type UserRole = 'user' | 'admin';

interface UserRoleData {
  role: UserRole;
  isAdmin: boolean;
  isLoading: boolean;
  error: string | null;
}

// Simple in-memory cache to avoid repeated API calls
const roleCache = new Map<string, { role: UserRole; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export function useUserRole(): UserRoleData {
  const { user, authStatus } = useAuthenticator((context) => [context.user, context.authStatus]);
  const [role, setRole] = useState<UserRole>('user');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const loadUserRole = useCallback(async () => {
    if (!user?.userId) {
      setIsLoading(false);
      return;
    }

    try {
      setError(null);
      const userEmail = user.signInDetails?.loginId || '';

      console.log('🔍 Loading user role for:', userEmail);

      // Check cache first
      const cached = roleCache.get(user.userId);
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        console.log('📋 Using cached role:', cached.role);
        setRole(cached.role);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      // Try to get existing user profile by userId first
      let { data: profiles } = await client.models.UserProfile.list({
        filter: { userId: { eq: user.userId } },
        limit: 1
      });

      // If no profile found by userId, try by email (for cases where profile exists but userId doesn't match)
      if (!profiles || profiles.length === 0) {
        console.log('🔍 No profile found by userId, searching by email:', userEmail);
        const { data: emailProfiles } = await client.models.UserProfile.list({
          filter: { email: { eq: userEmail } },
          limit: 1
        });
        profiles = emailProfiles;
      }

      let userRole: UserRole = 'user';

      if (profiles && profiles.length > 0) {
        const userProfile = profiles[0];
        userRole = (userProfile.role as UserRole) || 'user';
        console.log('👤 Found existing profile with role:', userRole);

        // If this is Craig and he's not admin, make him admin
        if (userEmail === 'craig@craigwinter.com' && userRole !== 'admin') {
          console.log('👑 Craig detected - upgrading to admin...');
          try {
            await client.models.UserProfile.update({
              id: userProfile.id,
              role: 'admin',
            });
            userRole = 'admin';
            console.log('✅ Craig upgraded to admin successfully');
          } catch (upgradeError) {
            console.error('❌ Failed to upgrade Craig to admin:', upgradeError);
          }
        }

        // Update userId if it doesn't match (in case profile was created with temp ID)
        if (userProfile.userId !== user.userId) {
          console.log('🔄 Updating userId in profile...');
          try {
            await client.models.UserProfile.update({
              id: userProfile.id,
              userId: user.userId,
            });
            console.log('✅ UserId updated in profile');
          } catch (updateError) {
            console.error('❌ Failed to update userId:', updateError);
          }
        }
      } else {
        // Double-check for any existing profiles with this email before creating
        console.log('🔍 Double-checking for existing profiles with email:', userEmail);
        const { data: finalCheck } = await client.models.UserProfile.list({
          filter: { email: { eq: userEmail } }
        });

        if (finalCheck && finalCheck.length > 0) {
          console.log('⚠️ Found existing profile during final check, using it instead of creating new one');
          const existingProfile = finalCheck[0];
          userRole = (existingProfile.role as UserRole) || 'user';
          
          // Update the existing profile's userId if needed
          if (existingProfile.userId !== user.userId) {
            try {
              await client.models.UserProfile.update({
                id: existingProfile.id,
                userId: user.userId,
              });
              console.log('✅ Updated existing profile userId');
            } catch (updateError) {
              console.error('❌ Failed to update existing profile userId:', updateError);
            }
          }
        } else {
          // Create new user profile only if none exists
          console.log('➕ Creating new user profile...');
          
          // If this is Craig, make him admin from the start
          const newRole: UserRole = userEmail === 'craig@craigwinter.com' ? 'admin' : 'user';
          
          try {
            await client.models.UserProfile.create({
              userId: user.userId,
              firstName: userEmail.split('@')[0] || 'User',
              lastName: userEmail === 'craig@craigwinter.com' ? 'Winter' : '',
              email: userEmail,
              role: newRole,
            });
            
            userRole = newRole;
            console.log(`✅ Created new ${newRole} profile for:`, userEmail);
          } catch (createError) {
            console.error('❌ Failed to create user profile:', createError);
            userRole = 'user'; // Default fallback
          }
        }
      }

      // Cache the result
      roleCache.set(user.userId, { role: userRole, timestamp: Date.now() });
      setRole(userRole);

      console.log('🎯 Final user role:', userRole, 'for email:', userEmail);

    } catch (error) {
      console.error('💥 Error loading user role:', error);
      setError('Failed to load user role');
      setRole('user'); // Default to user role on error
    } finally {
      setIsLoading(false);
    }
  }, [user?.userId, user?.signInDetails?.loginId]);

  useEffect(() => {
    // Clear any existing timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    if (authStatus === 'authenticated' && user) {
      // Debounce the role loading to prevent excessive API calls
      debounceTimeoutRef.current = setTimeout(() => {
        loadUserRole();
      }, 100);
    } else {
      setIsLoading(false);
      setRole('user');
    }

    // Cleanup
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [authStatus, user, loadUserRole]);

  return {
    role,
    isAdmin: role === 'admin',
    isLoading,
    error,
  };
} 