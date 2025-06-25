'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useUserRole } from '@/hooks/useUserRole';
import { useAuthenticator } from '@aws-amplify/ui-react';
import { useState, useRef, useEffect, useMemo } from 'react';

export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const { isAdmin, isLoading: roleLoading, role, error } = useUserRole();
  const { user, signOut } = useAuthenticator((context) => [context.user]);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  // Debug logging
  useEffect(() => {
    console.log('Navigation Debug:', {
      isAdmin,
      roleLoading,
      role,
      error,
      userEmail: user?.signInDetails?.loginId
    });
  }, [isAdmin, roleLoading, role, error, user?.signInDetails?.loginId]);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const handleSignOut = async () => {
    await signOut();
    setIsUserMenuOpen(false);
    setIsMobileMenuOpen(false);
    router.push('/');
  };

  const getUserInitials = useMemo(() => {
    if (!user?.signInDetails?.loginId) return 'U';
    const email = user.signInDetails.loginId;
    const name = email.split('@')[0];
    return name.slice(0, 2).toUpperCase();
  }, [user?.signInDetails?.loginId]);

  const navItems = useMemo(() => {
    const baseNavItems: Array<{ href: string; label: string; isAdmin?: boolean }> = [
      { href: '/', label: 'Home' },
      { href: '/dashboard', label: 'Dashboard' },
      { href: '/exercises', label: 'Assignments' },
      { href: '/playbook', label: 'Playbook' },
      { href: '/insights', label: 'Insights' },
    ];

    const adminNavItems: Array<{ href: string; label: string; isAdmin?: boolean }> = [
      { href: '/admin', label: '🔧 Admin Panel', isAdmin: true },
      { href: '/exercises/manage', label: '⚙️ Manage Assignments', isAdmin: true },
    ];

    console.log('NavItems calculation:', { isAdmin, roleLoading });
    return isAdmin ? [...baseNavItems, ...adminNavItems] : baseNavItems;
  }, [isAdmin, roleLoading]);

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Left side - Logo and Desktop Navigation */}
          <div className="flex items-center">
            <Link href="/" className="text-lg sm:text-xl font-bold text-gray-900 flex-shrink-0">
              North Playbook
            </Link>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex ml-6 lg:ml-8 space-x-4 lg:space-x-6">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-2 text-sm font-medium rounded-md transition-colors touch-manipulation ${
                    pathname === item.href
                      ? 'bg-blue-100 text-blue-700'
                      : item.isAdmin
                      ? 'text-purple-600 hover:text-purple-800 hover:bg-purple-50 font-semibold'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Right side - User Menu and Mobile Menu Button */}
          <div className="flex items-center space-x-2">
            {/* Debug info (remove in production) */}
            {process.env.NODE_ENV === 'development' && user && (
              <div className="hidden lg:flex items-center text-xs text-gray-500 mr-2">
                Role: {role} | Admin: {isAdmin ? 'Yes' : 'No'} | Loading: {roleLoading ? 'Yes' : 'No'}
              </div>
            )}

            {/* User Menu */}
            <div className="flex items-center">
              {roleLoading ? (
                <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
              ) : user ? (
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className={`flex items-center space-x-1 sm:space-x-2 p-2 rounded-full transition-colors touch-manipulation ${
                      isAdmin 
                        ? 'hover:bg-purple-100 border-2 border-purple-200' 
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    <div className={`w-8 h-8 text-white rounded-full flex items-center justify-center text-sm font-medium ${
                      isAdmin ? 'bg-purple-600' : 'bg-blue-600'
                    }`}>
                      {getUserInitials}
                    </div>
                    {isAdmin && (
                      <span className="hidden sm:inline text-xs font-medium text-purple-600">Admin</span>
                    )}
                    <svg
                      className={`w-4 h-4 text-gray-500 transition-transform ${
                        isUserMenuOpen ? 'rotate-180' : ''
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* User Dropdown Menu */}
                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="text-sm font-medium text-gray-900 break-words">
                          {user.signInDetails?.loginId?.split('@')[0] || 'User'}
                        </p>
                        <p className="text-xs text-gray-500 break-all">{user.signInDetails?.loginId}</p>
                        {isAdmin && (
                          <p className="text-xs text-purple-600 font-medium">Administrator</p>
                        )}
                      </div>
                      
                      {/* Admin Links in Dropdown for easy access */}
                      {isAdmin && (
                        <>
                          <Link
                            href="/admin"
                            className="block px-4 py-2 text-sm text-purple-700 hover:bg-purple-50 transition-colors font-medium touch-manipulation"
                            onClick={() => setIsUserMenuOpen(false)}
                          >
                            <div className="flex items-center space-x-2">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                              </svg>
                              <span>Admin Panel</span>
                            </div>
                          </Link>
                          
                          <Link
                            href="/exercises/manage"
                            className="block px-4 py-2 text-sm text-purple-700 hover:bg-purple-50 transition-colors font-medium touch-manipulation"
                            onClick={() => setIsUserMenuOpen(false)}
                          >
                            <div className="flex items-center space-x-2">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                              </svg>
                              <span>Manage Assignments</span>
                            </div>
                          </Link>
                          
                          <div className="border-t border-gray-100 my-1"></div>
                        </>
                      )}
                      
                      <Link
                        href="/profile"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors touch-manipulation"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <div className="flex items-center space-x-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          <span>Profile</span>
                        </div>
                      </Link>
                      
                      <Link
                        href="/settings"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors touch-manipulation"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <div className="flex items-center space-x-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span>Settings</span>
                        </div>
                      </Link>

                      <div className="border-t border-gray-100 mt-1 pt-1">
                        <button
                          onClick={handleSignOut}
                          className="w-full text-left px-4 py-2 text-sm text-red-700 hover:bg-red-50 transition-colors touch-manipulation"
                        >
                          <div className="flex items-center space-x-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            <span>Sign Out</span>
                          </div>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  href="/auth"
                  className="bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors touch-manipulation"
                >
                  Sign In
                </Link>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden" ref={mobileMenuRef}>
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors touch-manipulation"
                aria-label="Toggle mobile menu"
              >
                <svg
                  className={`w-6 h-6 transition-transform ${isMobileMenuOpen ? 'rotate-90' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  {isMobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>

              {/* Mobile Navigation Menu */}
              {isMobileMenuOpen && (
                <div className="absolute right-3 mt-2 w-56 bg-white rounded-md shadow-lg py-2 z-50 border border-gray-200">
                  <div className="px-4 py-2 border-b border-gray-100 mb-2">
                    <p className="text-sm font-medium text-gray-900">Navigation</p>
                  </div>
                  
                  {navItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`block px-4 py-3 text-sm font-medium transition-colors touch-manipulation ${
                        pathname === item.href
                          ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600'
                          : item.isAdmin
                          ? 'text-purple-600 hover:bg-purple-50 font-semibold'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
} 