'use client';

import React from 'react';
import Link from 'next/link';
import { useUserRole } from '@/hooks/useUserRole';

export default function Home() {
  const { isAdmin } = useUserRole();
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              North Playbook
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
              {isAdmin 
                ? 'Create and manage personal development exercises for your community'
                : 'Transform your life with guided personal development exercises and insights'
              }
            </p>
            <p className="text-lg text-gray-500 mb-12 max-w-2xl mx-auto">
              {isAdmin
                ? 'Design exercise templates, manage content, and help users build their personal development journey.'
                : 'Complete guided exercises, track your responses, and build your personal playbook for growth.'
              }
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/exercises"
                className="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors shadow-lg"
              >
                {isAdmin ? 'Manage Exercises' : 'Browse Exercises'}
              </Link>
              {isAdmin ? (
                <Link
                  href="/exercises/manage"
                  className="bg-white text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-50 transition-colors shadow-lg border border-blue-200"
                >
                  Create New Template
                </Link>
              ) : (
                <Link
                  href="/my-responses"
                  className="bg-white text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-50 transition-colors shadow-lg border border-blue-200"
                >
                  My Responses
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Powerful Features for Personal Growth
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Everything you need to create meaningful personal development experiences
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-8 rounded-lg bg-gray-50">
              <div className="text-4xl mb-4">📝</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                {isAdmin ? 'Exercise Templates' : 'Personal Growth'}
              </h3>
              <p className="text-gray-600">
                {isAdmin 
                  ? 'Create and manage exercise templates with rich narratives, questions, and media assets.'
                  : 'Complete guided exercises and track your personal development journey over time.'
                }
              </p>
            </div>

            <div className="text-center p-8 rounded-lg bg-gray-50">
              <div className="text-4xl mb-4">🎵</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Media Assets</h3>
              <p className="text-gray-600">
                Upload and manage images, audio, video, and documents to enhance your exercises.
              </p>
            </div>

            <div className="text-center p-8 rounded-lg bg-gray-50">
              <div className="text-4xl mb-4">{isAdmin ? '👥' : '🔒'}</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                {isAdmin ? 'User Management' : 'Privacy & Security'}
              </h3>
              <p className="text-gray-600">
                {isAdmin
                  ? 'Manage user roles, monitor progress, and ensure quality exercise experiences.'
                  : 'Your responses and progress are private and secure, accessible only to you.'
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-24 bg-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Start Your Journey?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Begin creating your personal development exercises today and transform your life one step at a time.
          </p>
          <Link
            href="/exercises"
            className="bg-white text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-colors shadow-lg"
          >
            Get Started Now
          </Link>
        </div>
      </div>
    </div>
  );
}
