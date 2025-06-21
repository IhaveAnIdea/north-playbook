import { defineBackend } from '@aws-amplify/backend';
import { storage } from './storage/resource';
import { auth } from './auth/resource';
import { data } from './data/resource';
// import { createAuroraDatabase } from './database/resource';

export const backend = defineBackend({
  storage,
  auth,
  data,
});

// Temporarily disabled Aurora database to fix deployment issues
// Add Aurora Serverless v2 database
// const database = createAuroraDatabase(backend);

// Export database for use in other parts of the application
// export { database }; 