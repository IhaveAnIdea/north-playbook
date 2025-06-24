# Backup & Deployment System

## 🛡️ Never Lose Data Again!

This system ensures your North Playbook data is always safe and you have proper production environments.

## 🏗️ Environment Strategy

### Development (Sandbox)
- **Purpose**: Local development and testing
- **Command**: `npm run dev` + `npx ampx sandbox`
- **Data**: ⚠️ **EPHEMERAL** - Data is lost when sandbox is deleted
- **Use for**: Testing new features, schema changes

### Production 
- **Purpose**: Live application with persistent data
- **Command**: `npm run deploy:production`
- **Data**: ✅ **PERSISTENT** - Data is never lost
- **Use for**: Real user data, important exercises

## 📦 Backup System

### Automated Daily Backups
- **When**: Every day at 2 AM UTC
- **Where**: GitHub repository + GitHub Actions artifacts
- **What**: All exercises, responses, user profiles, media assets
- **Retention**: 30 days

### Manual Backup
```bash
# Create backup immediately
npm run backup

# List available backups
npm run restore -- --list
```

### Restore from Backup
```bash
# Restore from specific backup
npm run restore -- backups/backup-2024-01-15.json

# Restore from latest backup
npm run restore -- backups/latest-backup.json
```

## 🚀 Production Deployment

### Initial Setup (One Time)
```bash
# 1. Setup environment configurations
npm run setup:envs

# 2. Deploy to production
npm run deploy:production
```

### Regular Deployment
```bash
# Deploy changes to production
npm run deploy:production
```

## 📋 Quick Commands

| Command | Purpose |
|---------|---------|
| `npm run backup` | Create immediate backup |
| `npm run restore -- <file>` | Restore from backup |
| `npm run deploy:production` | Deploy to production |
| `npm run setup:envs` | Setup environment configs |
| `npm run dev` | Start development (sandbox) |

## 🔄 Workflow

### Day-to-Day Development
1. **Use sandbox for testing**: `npm run dev`
2. **Create backup before major changes**: `npm run backup`
3. **Test changes in development**
4. **Deploy to production**: `npm run deploy:production`

### Schema Changes (Like Today's Fix)
1. **Backup first**: `npm run backup`
2. **Test in development sandbox**
3. **Deploy to production** (data persists!)
4. **Restore backup if needed**: `npm run restore`

### Emergency Recovery
1. **List backups**: `npm run restore -- --list`
2. **Restore latest**: `npm run restore -- backups/latest-backup.json`
3. **Verify data integrity**

## 📁 File Structure

```
scripts/
├── backup-data.js          # Creates comprehensive backups
├── restore-data.js         # Restores from backup files
├── production-deploy.js    # Deploys to production
└── init-admin.js          # Creates admin users

backups/
├── backup-2024-01-15.json  # Daily backup files
├── latest-backup.json     # Always points to newest
└── (automatically cleaned, keeps 30 days)

environments/
├── development.json        # Dev environment config
├── staging.json           # Staging environment config
└── production.json        # Production environment config

.github/workflows/
└── backup.yml             # Automated daily backups
```

## ⚙️ GitHub Actions Setup

### Required Secrets
Add these to your GitHub repository secrets:

- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY` 
- `AWS_REGION`

### Automated Backups
- **Runs daily** at 2 AM UTC
- **Uploads to GitHub Actions** artifacts
- **Commits to repository** for version control
- **Retains 30 days** of backups

## 🚨 Emergency Procedures

### If Development Data is Lost
1. **Don't panic** - this is expected with sandboxes
2. **Restore from backup**: `npm run restore -- backups/latest-backup.json`
3. **Continue development**

### If Production Data is Lost
1. **This should never happen** with proper production setup
2. **Restore immediately**: `npm run restore -- backups/latest-backup.json`
3. **Check production deployment** is correct
4. **Review what caused the issue**

### If Backup Fails
1. **Check AWS credentials**
2. **Verify Amplify configuration**
3. **Run manual backup**: `npm run backup`
4. **Check GitHub Actions** for automated backups

## 🔧 Troubleshooting

### Backup Script Fails
```bash
# Check if authenticated
aws sts get-caller-identity

# Check Amplify config
ls -la amplify_outputs.json

# Run with debug
DEBUG=* npm run backup
```

### Restore Script Fails
```bash
# List available backups
npm run restore -- --list

# Check backup file format
cat backups/latest-backup.json | head -20

# Restore with verbose logging
npm run restore -- backups/backup-file.json
```

### Production Deploy Fails
```bash
# Check Git status
git status

# Check AWS CLI
aws sts get-caller-identity

# Check Amplify CLI
npx ampx --version
```

## 📊 Monitoring

### Check Backup Health
- **GitHub Actions** tab shows daily backup status
- **Backups folder** should have recent files
- **File sizes** should be reasonable (not 0 bytes)

### Check Production Health
- **AWS Amplify Console** shows deployment status
- **Application URL** should be accessible
- **Database** should have expected data

## 🎯 Best Practices

1. **Always backup before schema changes**
2. **Test in development first**
3. **Use production for real data only**
4. **Monitor backup success daily**
5. **Test restore procedures monthly**
6. **Keep multiple backup copies**
7. **Document any manual changes**

---

## 🚀 You're Protected!

With this system:
- ✅ **Daily automated backups**
- ✅ **Production environment with persistent data**
- ✅ **Easy restore procedures**
- ✅ **Multi-environment workflow**
- ✅ **GitHub Actions integration**

**Never lose data again!** 🛡️ 