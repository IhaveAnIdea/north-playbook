import { defineStorage } from '@aws-amplify/backend';

export const storage = defineStorage({
  name: 'north-playbook-storage',
  access: (allow) => ({
    // Public assets (app-wide resources)
    'public/*': [
      allow.guest.to(['read']),
      allow.authenticated.to(['read', 'write'])
    ],
    
    // User-specific playbook assets
    'users/playbook/{entity_id}/*': [
      allow.entity('identity').to(['read', 'write', 'delete'])
    ],
    
    // User profile assets
    'users/profile/{entity_id}/*': [
      allow.entity('identity').to(['read', 'write', 'delete'])
    ],
    
    // Exercise response assets - user-specific
    'exercise-responses/images/{entity_id}/*': [
      allow.entity('identity').to(['read', 'write', 'delete'])
    ],
    
    'exercise-responses/audio/{entity_id}/*': [
      allow.entity('identity').to(['read', 'write', 'delete'])
    ],
    
    'exercise-responses/video/{entity_id}/*': [
      allow.entity('identity').to(['read', 'write', 'delete'])
    ],
    
    'exercise-responses/documents/{entity_id}/*': [
      allow.entity('identity').to(['read', 'write', 'delete'])
    ],
    
    // Temporary uploads (for processing)
    'temp/{entity_id}/*': [
      allow.entity('identity').to(['read', 'write', 'delete'])
    ]
  })
}); 