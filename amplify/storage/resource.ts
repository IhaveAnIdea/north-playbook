import { defineStorage } from '@aws-amplify/backend';

export const storage = defineStorage({
  name: 'north-playbook-storage',
  access: (allow) => ({
    // Public assets (app-wide resources)
    'public/*': [
      allow.guest.to(['read']),
      allow.authenticated.to(['read'])
    ],
    
    // User-specific playbook assets
    'users/{entity_id}/playbook/*': [
      allow.entity('identity').to(['read', 'write', 'delete'])
    ],
    
    // User profile assets
    'users/{entity_id}/profile/*': [
      allow.entity('identity').to(['read', 'write', 'delete'])
    ],
    
    // Temporary uploads (for processing)
    'temp/{entity_id}/*': [
      allow.entity('identity').to(['read', 'write', 'delete'])
    ]
  })
}); 