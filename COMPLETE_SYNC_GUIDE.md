# Complete Development → Production Sync Guide 🚀

## 📋 **What We're Syncing**
1. **Exercises** (Configuration/Templates) - Important to preserve
2. **Users** (Admin accounts) - Need to recreate
3. **User Data** (Responses, playbook entries) - Will be lost but can be recreated

## 🎯 **Two-Phase Sync Process**

### **Phase 1: Deploy Production Environment**
### **Phase 2: Sync Data to Production**

---

## 🚀 **Phase 1: Deploy Production Environment**

### Step 1: Deploy to Production
```bash
# Deploy persistent production environment
npm run deploy:production
```

This will:
- Create production branch
- Deploy to AWS with persistent data
- Give you a production URL

### Step 2: Note Your Production URL
After deployment, you'll get a production URL like:
- `https://your-app-id.amplifyapp.com`
- Or your custom domain

---

## 📦 **Phase 2: Sync Data to Production**

### **A. Sync Exercises (Configuration Data)**

#### Step 1: Collect Exercise Data
1. **Go to your development UI**: `http://localhost:3000/exercises/manage`
2. **For each exercise, copy**:
   - Title
   - Description
   - Category
   - Question
   - Instructions
   - Required response types (📝🖼️🎵🎥📄)
   - Any OR requirements

#### Step 2: Edit Exercise Template
```bash
# The template is already created
# Edit: exercises-export/manual-exercises-2025-06-24.json
```

**Open the file and replace the examples with your actual exercises:**

```json
{
  "exercises": [
    {
      "title": "Your Actual Exercise Title",
      "description": "Your actual description",
      "category": "self_awareness", // Use valid category
      "question": "Your actual question",
      "instructions": "Your actual instructions",
      
      // Set requirements based on your exercise
      "requireText": "required",     // or "not_required" or "or"
      "requireImage": "not_required", // or "required" or "or"
      "requireAudio": "not_required", // or "required" or "or"
      "requireVideo": "not_required", // or "required" or "or"
      "requireDocument": "not_required", // or "required" or "or"
      
      "textPrompt": "Your custom prompt",
      "maxTextLength": 1000,
      "allowMultipleImages": false,
      "allowMultipleDocuments": false,
      "allowEditingCompleted": true,
      "isActive": true,
      "order": 1
    }
    // Add more exercises...
  ]
}
```

#### Step 3: Import Exercises to Production
```bash
# Import exercises to production
npm run import-exercises -- manual-exercises-2025-06-24.json
```

### **B. Sync Users (Admin Accounts)**

#### Step 1: Create Admin Account in Production
1. **Go to production URL**: `https://your-production-url.com/auth`
2. **Sign up** with your admin email
3. **Verify email** and **sign in**

#### Step 2: Grant Admin Access
```bash
# Create admin user in production
npm run admin:init
```

Or manually in AWS Cognito:
1. Go to AWS Cognito Console
2. Find your production user pool
3. Add user to `admin` group

### **C. What About User Data?**

#### User Responses & Playbook Entries
**Unfortunately, these will be lost** because:
- They're tied to specific user IDs
- User IDs change between environments
- These are personal data, not configuration

#### Recovery Options:
1. **Screenshots** of important playbook entries
2. **Manual recreation** of key responses
3. **Fresh start** with the new OR logic system

---

## 🛠️ **Troubleshooting**

### If Exercise Import Fails
```bash
# Check the JSON syntax
cat exercises-export/manual-exercises-2025-06-24.json

# Try importing individual exercises via UI
# Go to production URL + /exercises/new
```

### If Production Deploy Fails
```bash
# Check Git status
git status

# Try manual AWS Amplify setup
# Go to AWS Amplify Console
# Connect GitHub repo
# Set production branch
```

### If Admin Creation Fails
```bash
# Check AWS Cognito Console
# Manually add user to admin group
# Or recreate user pool if needed
```

---

## 📊 **Sync Checklist**

### ✅ **Before Starting**
- [ ] Development server running (`npm run dev`)
- [ ] Exercise data collected from `/exercises/manage`
- [ ] Template file ready (`manual-exercises-2025-06-24.json`)

### ✅ **Production Deployment**
- [ ] Run `npm run deploy:production`
- [ ] Note production URL
- [ ] Verify deployment in AWS Console

### ✅ **Exercise Sync**
- [ ] Edit template with actual exercises
- [ ] Run `npm run import-exercises -- manual-exercises-2025-06-24.json`
- [ ] Verify exercises appear in production
- [ ] Test OR logic works correctly

### ✅ **User Setup**
- [ ] Sign up admin account in production
- [ ] Verify email
- [ ] Run `npm run admin:init` or manually set admin
- [ ] Test admin access to `/exercises/manage`

### ✅ **Testing**
- [ ] Create test exercise in production
- [ ] Test exercise with OR requirements
- [ ] Verify all functionality works
- [ ] Take backup of production data

---

## 🎯 **Quick Commands Reference**

| Task | Command |
|------|---------|
| Deploy Production | `npm run deploy:production` |
| Edit Exercise Template | Edit `exercises-export/manual-exercises-2025-06-24.json` |
| Import Exercises | `npm run import-exercises -- manual-exercises-2025-06-24.json` |
| Create Admin | `npm run admin:init` |
| Backup Production | `npm run backup` |

---

## 🎉 **Final Result**

After completing this sync:
- ✅ **Production environment** with persistent data
- ✅ **All exercises** preserved with OR logic
- ✅ **Admin access** configured
- ✅ **Ready for real use** without data loss risk
- ✅ **Backup system** in place for future protection

**Your production environment will be fully set up and ready to use!** 🚀

---

## 💡 **Pro Tips**

1. **Always backup** before major changes
2. **Test exercises** thoroughly in production
3. **Document any customizations** you make
4. **Use production for real data** only
5. **Keep development for testing** new features

**Ready to sync?** Follow the steps above! 🎯 