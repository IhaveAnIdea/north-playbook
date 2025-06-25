# 🚀 Production Environment Setup Guide

## ⚠️ **CRITICAL: Your Data Storage Reality**

### **Current Situation:**
```
📍 Environment: Amplify Sandbox (Development)
💾 Data Storage: TEMPORARY - Can be lost anytime
🔄 When you push to Git: Code is safe, DATA IS NOT
```

### **After Production Setup:**
```
📍 Environment: Amplify Production (Persistent)
💾 Data Storage: PERMANENT - Never lost
🔄 When you push to Git: Code AND data are both safe
```

## 🎯 **Step-by-Step Production Setup**

### **Step 1: Access AWS Amplify Console**
1. Go to: https://console.aws.amazon.com/amplify/
2. Sign in with your AWS account
3. Find your `north-playbook` app (should be there since GitHub is connected)

### **Step 2: Create Production Environment**
1. Click on your `north-playbook` app
2. Look for **"Hosting environments"** or **"Frontend environments"** 
3. Click **"Connect branch"** or **"Add environment"**
4. Select: **`master`** branch
5. Environment name: **`production`**
6. Click **"Save and deploy"**

### **Step 3: Wait for Deployment**
- ⏱️ Takes 5-10 minutes
- ✅ Creates persistent AWS resources
- 🔒 Your data will be safe forever

### **Step 4: Get Production URL**
- Copy the production URL (e.g., `https://master.d1234567890.amplifyapp.com`)
- **Use THIS URL for all real work**
- **Stop using localhost for important data**

## 🔄 **How Data Works After Setup**

### **When You Push to GitHub:**
```bash
git add .
git commit -m "your changes"
git push origin master
```

**What Happens:**
1. ✅ Code → Deployed to production automatically
2. ✅ Database changes → Applied safely
3. ✅ All existing data → Preserved
4. ✅ Users can keep using the app

### **Data Storage Locations:**
```
🏢 Production Environment:
├── 👥 User Accounts: AWS Cognito (Safe)
├── 📋 Exercises: DynamoDB (Safe)  
├── 💬 Responses: DynamoDB (Safe)
├── 📖 Playbook: DynamoDB (Safe)
├── 📁 Media Files: S3 (Safe)
└── 🔐 Auth/Settings: IAM (Safe)
```

## 🚨 **STOP Using Sandbox for Important Data**

### **Sandbox = Development Only:**
- Use for testing new features
- Can be deleted/reset anytime
- Data is temporary

### **Production = Real Work:**
- Use for actual exercises
- Data is permanent
- Safe for users

## 🎉 **After Production is Set Up**

1. **Share production URL** with users (not localhost)
2. **Create admin account** in production
3. **Re-create your exercises** in production 
4. **All future work** happens in production
5. **Backup scripts** will work properly

---

## 🔧 **Troubleshooting**

### **If you can't find your app in Amplify Console:**
1. Check you're in the right AWS region (us-west-2)
2. Look for "Get started" and connect your GitHub repo
3. Select `north-playbook` repository

### **If deployment fails:**
1. Check GitHub connection is working
2. Ensure your AWS account has permissions
3. Try disconnecting and reconnecting GitHub

---

**🎯 Bottom Line: Set up production environment NOW to protect your data!** 