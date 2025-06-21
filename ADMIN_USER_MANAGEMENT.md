# Admin User Management System

## Overview

The North Playbook application includes a comprehensive admin user management system that allows administrators to:

- **Manage Users**: Create, view, edit, and delete user accounts
- **Role Management**: Assign and change user roles (user/admin)
- **User Oversight**: Monitor user activity and manage access
- **Admin Controls**: Prevent deletion of the last admin, secure role changes

## Admin Features

### 🔧 **User Management**
- **View All Users**: Complete user directory with profiles, emails, and roles
- **Add New Users**: Create user profiles directly from admin panel
- **Role Assignment**: Change user roles between 'user' and 'admin'
- **User Deletion**: Remove users with confirmation and safety checks
- **Last Admin Protection**: System prevents deletion/demotion of the last admin

### 📊 **Admin Dashboard**
- **User Statistics**: Total users, admin count, system metrics  
- **Quick Actions**: Streamlined user management interface
- **Success/Error Messaging**: Clear feedback for all actions
- **Responsive Design**: Works on desktop and mobile devices

## Setup Instructions

### 1. Initialize Craig as Admin

Craig Winter (craig@craigwinter.com) has been pre-configured as an admin. To activate:

```bash
# Run the admin initialization script
npm run admin:init

# Or manually via the admin page
# - Navigate to /admin when logged in as Craig
# - The system will automatically promote Craig to admin
```

### 2. Admin Access

Once Craig is an admin, he can:
- Access the Admin Dashboard at `/admin`
- Manage exercises at `/exercises/manage`  
- See admin-only navigation items
- Create and manage other admin accounts

### 3. Creating Additional Admins

From the Admin Dashboard:
1. Click "Add New User"
2. Fill in user details
3. Set Role to "Admin"
4. Click "Add User"

The user will need to sign up with the specified email to activate their account.

## Admin Panel Features

### User Management Table

| Column | Description |
|--------|-------------|
| **User** | Name, initials avatar, and user ID |
| **Email** | User's email address |
| **Role** | Current role with color-coded badge |
| **Joined** | Account creation date |
| **Actions** | Role dropdown and delete button |

### Safety Features

- **Last Admin Protection**: Cannot delete or demote the last admin
- **Confirmation Dialogs**: Require typing "DELETE" to confirm user deletion
- **Role Change Validation**: Prevents removing the last admin role
- **Clear Messaging**: Success and error messages for all actions

## Technical Implementation

### Database Schema

```typescript
UserProfile: {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'user' | 'admin';
  createdAt: string;
  updatedAt: string;
}
```

### Authorization Rules

```typescript
UserProfile.authorization([
  allow.owner(),                    // Users can manage their own profile
  allow.authenticated().to(['read']), // All users can read profiles
  allow.groups(['admin']).to(['read', 'update', 'delete']) // Admins can manage all
])
```

### Admin Detection

The system uses the `useUserRole()` hook to detect admin status:

```typescript
const { isAdmin, isLoading } = useUserRole();
```

This hook:
- Caches results for 5 minutes
- Debounces API calls by 100ms
- Automatically creates user profiles for new users
- Provides real-time admin status updates

## Navigation & Access Control

### Admin-Only Routes
- `/admin` - Admin Dashboard
- `/exercises/manage` - Exercise Template Management  
- `/exercises/new` - Create New Exercise Templates

### Navigation Items
Admins see additional navigation items:
- **Admin Panel** - Access to user management
- **Manage Exercises** - Exercise template management

### Role-Based Features
- **Exercise Pages**: Admins see template management, users see personal tracking
- **Dashboard Access**: Different views for admins vs regular users
- **User Menus**: Admin-specific options in navigation

## User Workflow

### For Craig (Initial Admin)
1. Sign up at the application with craig@craigwinter.com
2. System automatically detects and grants admin privileges
3. Access admin features immediately
4. Can create additional admin users

### For Additional Admins
1. Admin creates their profile via Admin Dashboard
2. User signs up with the specified email
3. System links their Cognito account to the pre-created profile
4. Admin privileges activate automatically

### For Regular Users
1. Sign up normally through the application
2. System creates a basic user profile
3. Can be promoted to admin by existing admins
4. Access role-appropriate features only

## Security Considerations

### Admin Creation
- Only existing admins can create new admin accounts
- Email validation prevents duplicate accounts
- Temporary user IDs until account activation

### Role Management
- Cannot demote the last admin (system protection)
- Role changes are logged and validated
- Clear audit trail of admin actions

### Data Access
- Admins can read all user profiles
- Users can only access their own data
- Admin actions require proper authentication

## Troubleshooting

### Craig Cannot Access Admin Features
1. Ensure Craig signed up with craig@craigwinter.com
2. Run `npm run admin:init` to manually initialize
3. Check browser console for authentication errors
4. Verify database connection

### Users Not Showing in Admin Panel  
1. Check authentication status
2. Verify database permissions
3. Ensure proper role assignment
4. Check browser console for API errors

### Cannot Create New Users
1. Verify admin permissions
2. Check for duplicate email addresses
3. Ensure database write permissions
4. Validate form inputs

## API Endpoints

### User Management
- `client.models.UserProfile.list()` - Get all users
- `client.models.UserProfile.create()` - Create new user
- `client.models.UserProfile.update()` - Update user role
- `client.models.UserProfile.delete()` - Delete user

### Admin Utilities
- `initializeCraigAsAdmin()` - Set Craig as admin
- `makeUserAdminByEmail()` - Promote user by email  
- `hasAdminUsers()` - Check if any admins exist
- `ensureAdminExists()` - Guarantee admin presence

## Performance Optimizations

- **Role Caching**: 5-minute cache for user roles
- **Debounced Queries**: 100ms debounce on role checks
- **Lazy Loading**: Admin features load only when needed
- **Optimistic Updates**: UI updates before API confirmation

## Best Practices

1. **Always maintain at least one admin account**
2. **Use real email addresses for user creation**
3. **Regularly audit admin permissions**
4. **Monitor user creation and deletion activities**
5. **Test admin functionality in staging before production**

## Future Enhancements

- **Bulk User Operations**: Import/export user lists
- **Advanced User Filtering**: Search and filter capabilities
- **Audit Logging**: Detailed admin action tracking
- **Role Templates**: Predefined permission sets
- **User Invitation System**: Email-based user invitations 