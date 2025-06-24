# Production Deployment & Data Backup Strategy

## Current Problem
- Using `npx ampx sandbox` creates **ephemeral development environments**
- Data gets wiped when sandbox is deleted/recreated
- No proper production environment with persistent data

## Solution: Multi-Environment Setup

### 1. **Production Environment Setup**

#### Option A: AWS Amplify Hosting (Recommended)
```bash
# Deploy to production branch
git checkout -b production
git push origin production

# In AWS Amplify Console:
# 1. Connect your GitHub repo
# 2. Set production branch as main deployment
# 3. Enable auto-deploy on push to production
```

#### Option B: Manual Production Deployment
```bash
# Deploy to AWS (persistent environment)
npx ampx pipeline deploy --branch production
```

### 2. **Environment Strategy**

```
📁 Environments:
├── 🔧 Development (sandbox) - ampx sandbox
├── 🧪 Staging - ampx pipeline deploy --branch staging  
└── 🚀 Production - AWS Amplify Hosting or pipeline deploy --branch production
```

### 3. **Data Backup Strategy**

#### A. **Automated Database Exports**
Create a backup script that runs daily:

```javascript
// scripts/backup-data.js
const { generateClient } = require('aws-amplify/api');
const fs = require('fs');

async function backupAllData() {
  const timestamp = new Date().toISOString().split('T')[0];
  
  // Export all models
  const exercises = await client.models.Exercise.list();
  const responses = await client.models.ExerciseResponse.list();
  const playbook = await client.models.PlaybookEntry.list();
  const profiles = await client.models.UserProfile.list();
  
  const backup = {
    timestamp,
    exercises: exercises.data,
    responses: responses.data,
    playbook: playbook.data,
    profiles: profiles.data
  };
  
  fs.writeFileSync(`backups/backup-${timestamp}.json`, JSON.stringify(backup, null, 2));
}
```

#### B. **S3 Media Backup**
```javascript
// Backup all S3 media files
const mediaAssets = await client.models.MediaAsset.list();
// Copy to backup S3 bucket
```

### 4. **Data Restoration Script**
```javascript
// scripts/restore-data.js
async function restoreFromBackup(backupFile) {
  const backup = JSON.parse(fs.readFileSync(backupFile));
  
  // Restore exercises
  for (const exercise of backup.exercises) {
    await client.models.Exercise.create(exercise);
  }
  
  // Restore other data...
}
```

## Implementation Plan

### Phase 1: Immediate Protection (Today)
1. **Backup current data** before any changes
2. **Set up production environment** 
3. **Create backup scripts**

### Phase 2: Automated Backups (This Week)
1. **Daily automated backups** to S3
2. **GitHub Actions** for backup automation
3. **Restore testing** procedures

### Phase 3: Production Ready (Next Week)  
1. **Production deployment** pipeline
2. **Staging environment** for testing
3. **Data migration** tools

## File Structure
```
scripts/
├── backup-data.js          # Daily backup script
├── restore-data.js         # Data restoration
├── migrate-data.js         # Schema migrations
└── production-deploy.js    # Production deployment

backups/
├── backup-2024-01-15.json  # Daily backups
├── media-backup/           # S3 media backups
└── schema-versions/        # Schema change history

environments/
├── development.json        # Dev config
├── staging.json           # Staging config  
└── production.json        # Prod config
```

## Next Steps

1. **Stop using sandbox for important data**
2. **Set up production environment immediately** 
3. **Create backup before any schema changes**
4. **Test restore procedures regularly**

---
**Never lose data again! 🛡️** 