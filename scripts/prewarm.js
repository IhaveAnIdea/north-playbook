#!/usr/bin/env node

/**
 * Pre-warm script to compile all main routes during development startup
 * This reduces the on-demand compilation delays when users visit pages
 */

import http from 'http';

const routes = [
  '/',
  '/dashboard',
  '/exercises',
  '/admin',
  '/login',
  '/signup',
];

async function warmRoute(route) {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:3000${route}`, (res) => {
      console.log(`✓ Warmed route: ${route} (${res.statusCode})`);
      resolve();
    });
    
    req.on('error', (err) => {
      console.log(`✗ Failed to warm route: ${route} - ${err.message}`);
      resolve();
    });
    
    // Timeout after 30 seconds
    req.setTimeout(30000, () => {
      req.destroy();
      console.log(`⏱ Timeout warming route: ${route}`);
      resolve();
    });
  });
}

async function prewarmApp() {
  console.log('🔥 Pre-warming application routes...');
  
  // Wait a bit for the server to be ready
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Warm all routes in parallel for faster startup
  await Promise.all(routes.map(warmRoute));
  
  console.log('✅ Pre-warming complete! All routes should now load faster.');
}

// Only run if this script is executed directly
if (process.argv[1] === new URL(import.meta.url).pathname) {
  prewarmApp().catch(console.error);
}

export { prewarmApp }; 