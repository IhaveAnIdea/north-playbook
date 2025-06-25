'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useUserRole } from '@/hooks/useUserRole';
import { generateClient } from 'aws-amplify/api';
import { initializeCraigAsAdmin } from '@/utils/adminSeeder';
import type { Schema } from '../../../amplify/data/resource';

const client = generateClient<Schema>();

interface UserProfile {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'user' | 'admin';
  createdAt: string;
}

interface NewUserForm {
  firstName: string;
  lastName: string;
  email: string;
  role: 'user' | 'admin';
  password: string;
  shouldGeneratePassword: boolean;
}

export default function AdminPage() {
  const { isAdmin, isLoading: roleLoading } = useUserRole();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showAddUserForm, setShowAddUserForm] = useState(false);
  const [newUserForm, setNewUserForm] = useState<NewUserForm>({
    firstName: '',
    lastName: '',
    email: '',
    role: 'user',
    password: '',
    shouldGeneratePassword: true
  });
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    user: UserProfile | null;
    confirmText: string;
  }>({
    isOpen: false,
    user: null,
    confirmText: '',
  });

  useEffect(() => {
    if (isAdmin) {
      loadUsers();
      // Initialize craig@craigwinter.com as admin on page load
      initializeCraigAsAdmin().then((success) => {
        if (success) {
          console.log('Craig initialized as admin');
          // Reload users to reflect changes
          setTimeout(() => loadUsers(), 1000);
        }
      });
    }
  }, [isAdmin]);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const { data } = await client.models.UserProfile.list();
      
      // Deduplicate users by email, keeping the most recent one with admin preference
      const deduplicatedUsers = deduplicateUsers(data as UserProfile[]);
      setUsers(deduplicatedUsers);
      
      // Check for duplicates and offer cleanup
      const originalCount = data?.length || 0;
      const deduplicatedCount = deduplicatedUsers.length;
      
      if (originalCount > deduplicatedCount) {
        const duplicateCount = originalCount - deduplicatedCount;
        console.log(`Found ${duplicateCount} duplicate user(s). Consider running cleanup.`);
      }
    } catch (error) {
      console.error('Error loading users:', error);
      setError('Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  // Function to deduplicate users by email
  const deduplicateUsers = (users: UserProfile[]): UserProfile[] => {
    const emailMap = new Map<string, UserProfile>();
    
    users.forEach(user => {
      const existingUser = emailMap.get(user.email);
      
      if (!existingUser) {
        // First user with this email
        emailMap.set(user.email, user);
      } else {
        // User with this email already exists, decide which one to keep
        let userToKeep = existingUser;
        
        // Prefer admin users
        if (user.role === 'admin' && existingUser.role !== 'admin') {
          userToKeep = user;
        }
        // If both or neither are admin, prefer the more recent one
        else if (user.role === existingUser.role) {
          const userDate = new Date(user.createdAt || 0);
          const existingDate = new Date(existingUser.createdAt || 0);
          if (userDate > existingDate) {
            userToKeep = user;
          }
        }
        // Prefer users with real userId over temp ones
        else if (!user.userId.startsWith('temp-') && existingUser.userId.startsWith('temp-')) {
          userToKeep = user;
        }
        
        emailMap.set(user.email, userToKeep);
      }
    });
    
    return Array.from(emailMap.values());
  };

  // Function to clean up duplicate user profiles
  const cleanupDuplicateUsers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const { data } = await client.models.UserProfile.list();
      const allUsers = data as UserProfile[];
      const deduplicatedUsers = deduplicateUsers(allUsers);
      
      // Find users to delete (duplicates)
      const usersToKeep = new Set(deduplicatedUsers.map(u => u.id));
      const usersToDelete = allUsers.filter(u => !usersToKeep.has(u.id));
      
      if (usersToDelete.length === 0) {
        setSuccessMessage('No duplicate users found to clean up.');
        return;
      }
      
      // Delete duplicate users
      const deletePromises = usersToDelete.map(user => 
        client.models.UserProfile.delete({ id: user.id })
      );
      
      await Promise.all(deletePromises);
      
      // Reload users
      await loadUsers();
      
      setSuccessMessage(`Successfully cleaned up ${usersToDelete.length} duplicate user(s).`);
      console.log('Deleted duplicate users:', usersToDelete.map(u => `${u.email} (${u.id})`));
      
    } catch (error) {
      console.error('Error cleaning up duplicate users:', error);
      setError('Failed to clean up duplicate users. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const addNewUser = async () => {
    try {
      setError(null);
      setSuccessMessage(null);

      // Validate form
      if (!newUserForm.firstName || !newUserForm.lastName || !newUserForm.email) {
        setError('Please fill in all required fields');
        return;
      }

      // Validate password if not auto-generating
      if (!newUserForm.shouldGeneratePassword && !newUserForm.password) {
        setError('Please enter a password or enable auto-generation');
        return;
      }

      // Check if user already exists in database first
      const { data: existingProfiles } = await client.models.UserProfile.list({
        filter: { email: { eq: newUserForm.email } }
      });

      if (existingProfiles && existingProfiles.length > 0) {
        setError('A user with this email already exists');
        return;
      }

      // Step 1: Create Cognito user via API
      const response = await fetch('/api/admin/create-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: newUserForm.firstName,
          lastName: newUserForm.lastName,
          email: newUserForm.email,
          password: newUserForm.password,
          shouldGeneratePassword: newUserForm.shouldGeneratePassword,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || 'Failed to create user');
        return;
      }

      // Step 2: Create user profile in database with authenticated client
      const newProfile = await client.models.UserProfile.create({
        userId: result.cognitoUserId || newUserForm.email,
        firstName: newUserForm.firstName,
        lastName: newUserForm.lastName,
        email: newUserForm.email,
        role: newUserForm.role,
      });

      if (!newProfile.data) {
        setError('Failed to create user profile in database');
        return;
      }

      // Success - update UI
      setUsers(prev => [...prev, newProfile.data as UserProfile]);
      
      // Show success message with password if generated
      let message = `User ${newUserForm.firstName} ${newUserForm.lastName} created successfully`;
      if (result.password) {
        message += `\n\nGenerated password: ${result.password}\n\nPlease save this password and share it securely with the user.`;
      }
      
      setSuccessMessage(message);
      setNewUserForm({ firstName: '', lastName: '', email: '', role: 'user', password: '', shouldGeneratePassword: true });
      setShowAddUserForm(false);

    } catch (error) {
      console.error('Error adding user:', error);
      setError('Failed to add user. Please try again.');
    }
  };

  const updateUserRole = async (userId: string, newRole: 'user' | 'admin') => {
    try {
      setError(null);
      const user = users.find(u => u.id === userId);
      if (!user) return;

      // Prevent removing the last admin
      if (user.role === 'admin' && newRole === 'user') {
        const adminCount = users.filter(u => u.role === 'admin').length;
        if (adminCount <= 1) {
          setError('Cannot remove the last administrator. Promote another user to admin first.');
          return;
        }
      }

      await client.models.UserProfile.update({
        id: userId,
        role: newRole,
      });

      setUsers(prev => prev.map(u => 
        u.id === userId ? { ...u, role: newRole } : u
      ));
      
      setSuccessMessage(`User role updated to ${newRole} successfully`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error('Error updating user role:', error);
      setError('Failed to update user role');
    }
  };

  const initiateDeleteUser = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    // Prevent deleting the last admin
    const adminCount = users.filter(u => u.role === 'admin').length;
    if (user.role === 'admin' && adminCount <= 1) {
      setError('Cannot delete the last administrator. Promote another user to admin first.');
      return;
    }

    setDeleteConfirm({
      isOpen: true,
      user,
      confirmText: '',
    });
  };

  const confirmDeleteUser = async () => {
    if (!deleteConfirm.user || deleteConfirm.confirmText !== 'DELETE') {
      return;
    }

    try {
      setIsLoading(true);
      
      // Delete user profile
      await client.models.UserProfile.delete({ id: deleteConfirm.user.id });
      
      // Remove from local state
      setUsers(prev => prev.filter(u => u.id !== deleteConfirm.user!.id));
      
      // Clear any error messages
      setError(null);
      setSuccessMessage(`User ${deleteConfirm.user.firstName} ${deleteConfirm.user.lastName} deleted successfully`);
      setTimeout(() => setSuccessMessage(null), 3000);
      
      // Close modal
      setDeleteConfirm({ isOpen: false, user: null, confirmText: '' });
    } catch (error) {
      console.error('Error deleting user:', error);
      setError('Failed to delete user. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const cancelDelete = () => {
    setDeleteConfirm({ isOpen: false, user: null, confirmText: '' });
  };

  const clearMessages = () => {
    setError(null);
    setSuccessMessage(null);
  };

  if (roleLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-6">You need administrator privileges to access this page.</p>
          <Link
            href="/exercises"
            className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Back to Assignments
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Manage users, exercises, and system settings
          </p>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md flex justify-between items-center">
            <p className="text-green-800">{successMessage}</p>
            <button onClick={clearMessages} className="text-green-600 hover:text-green-800">
              ✕
            </button>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md flex justify-between items-center">
            <p className="text-red-800">{error}</p>
            <button onClick={clearMessages} className="text-red-600 hover:text-red-800">
              ✕
            </button>
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="text-3xl mr-4">👥</div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{users.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="text-3xl mr-4">👑</div>
              <div>
                <p className="text-sm font-medium text-gray-600">Admins</p>
                <p className="text-2xl font-bold text-gray-900">
                  {users.filter(u => u.role === 'admin').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="text-3xl mr-4">📝</div>
              <div>
                <p className="text-sm font-medium text-gray-600">Exercises</p>
                <p className="text-2xl font-bold text-gray-900">-</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="text-3xl mr-4">📊</div>
              <div>
                <p className="text-sm font-medium text-gray-600">Responses</p>
                <p className="text-2xl font-bold text-gray-900">-</p>
              </div>
            </div>
          </div>
        </div>

        {/* User Management */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">User Management</h2>
            <div className="flex space-x-3">
              <button
                onClick={cleanupDuplicateUsers}
                className="bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                title="Remove duplicate users with the same email"
              >
                Clean Duplicates
              </button>
              <button
                onClick={() => setShowAddUserForm(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Add New User
              </button>
            </div>
          </div>
          
          {isLoading ? (
            <div className="p-6 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-2">Loading users...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Joined
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-700">
                              {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {user.firstName} {user.lastName}
                            </div>
                            <div className="text-sm text-gray-500">
                              ID: {user.userId.slice(0, 8)}...
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.role === 'admin' 
                            ? 'bg-purple-100 text-purple-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-3">
                          <select
                            value={user.role}
                            onChange={(e) => updateUserRole(user.id, e.target.value as 'user' | 'admin')}
                            className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                          </select>
                          <button
                            onClick={() => initiateDeleteUser(user.id)}
                            className="text-red-600 hover:text-red-800 text-sm font-medium px-2 py-1 rounded border border-red-300 hover:border-red-500 transition-colors"
                            title={`Delete ${user.firstName} ${user.lastName}`}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Add New User Modal */}
        {showAddUserForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Add New User
                </h3>
                <p className="text-gray-600 mb-4">
                  Create a new user account with Cognito authentication. The user will be able to sign in immediately with their email and the password you set.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name *
                  </label>
                  <input
                    type="text"
                    value={newUserForm.firstName}
                    onChange={(e) => setNewUserForm(prev => ({ ...prev, firstName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter first name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    value={newUserForm.lastName}
                    onChange={(e) => setNewUserForm(prev => ({ ...prev, lastName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter last name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={newUserForm.email}
                    onChange={(e) => setNewUserForm(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter email address"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role
                  </label>
                  <select
                    value={newUserForm.role}
                    onChange={(e) => setNewUserForm(prev => ({ ...prev, role: e.target.value as 'user' | 'admin' }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                {/* Password Section */}
                <div className="border-t pt-4">
                  <div className="mb-3">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={newUserForm.shouldGeneratePassword}
                        onChange={(e) => setNewUserForm(prev => ({ 
                          ...prev, 
                          shouldGeneratePassword: e.target.checked,
                          password: e.target.checked ? '' : prev.password
                        }))}
                        className="mr-2"
                      />
                      <span className="text-sm font-medium text-gray-700">Generate temporary password</span>
                    </label>
                    <p className="text-xs text-gray-500 mt-1">
                      If checked, a secure temporary password will be generated automatically
                    </p>
                  </div>

                  {!newUserForm.shouldGeneratePassword && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Password *
                      </label>
                      <input
                        type="password"
                        value={newUserForm.password}
                        onChange={(e) => setNewUserForm(prev => ({ ...prev, password: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter password"
                        minLength={8}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Must be at least 8 characters with uppercase, lowercase, numbers, and symbols
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowAddUserForm(false);
                    setNewUserForm({ firstName: '', lastName: '', email: '', role: 'user', password: '', shouldGeneratePassword: true });
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
                <button
                  onClick={addNewUser}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Add User
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteConfirm.isOpen && deleteConfirm.user && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Delete User Account
                </h3>
                <p className="text-gray-600 mb-4">
                  Are you sure you want to delete <strong>{deleteConfirm.user.firstName} {deleteConfirm.user.lastName}</strong>? 
                  This action cannot be undone and will permanently remove:
                </p>
                <ul className="text-gray-600 mb-4 list-disc list-inside space-y-1">
                  <li>Their user profile and account</li>
                  <li>All their exercise responses</li>
                  <li>All their personal data</li>
                </ul>
                <p className="text-red-600 font-medium mb-4">
                  Type &quot;DELETE&quot; to confirm this action:
                </p>
                <input
                  type="text"
                  value={deleteConfirm.confirmText}
                  onChange={(e) => setDeleteConfirm(prev => ({ ...prev, confirmText: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="Type DELETE to confirm"
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={cancelDelete}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteUser}
                  disabled={deleteConfirm.confirmText !== 'DELETE'}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Delete User
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 