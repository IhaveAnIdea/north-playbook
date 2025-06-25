# 🏠 Local Development with Production Data

## 🎯 **Yes! You Can Use Production Data Locally**

Once your production backend is deployed, you have **three development options**:

## 🔄 **Option 1: Switch Between Environments (Recommended)**

### **How It Works:**
Your local `localhost:3000` can connect to **either**:
- 🏗️ **Sandbox**: For testing new features safely
- 🚀 **Production**: For working with real data

### **Environment Switching Commands:**

```bash
# Work with PRODUCTION data locally
npm run dev:production

# Work with SANDBOX data locally  
npm run dev:sandbox

# Quick environment switching
npm run switch:production   # Point to production
npm run switch:sandbox      # Point to sandbox
```

## 📁 **How Environment Switching Works:**

### **Configuration Files:**
```
📁 Your Project:
├── amplify_outputs.json           # Current environment
├── amplify_outputs.production.json # Production config
└── amplify_outputs.sandbox.json   # Sandbox config
```

### **Switching Process:**
1. **Save configs**: Copy current `amplify_outputs.json` to environment-specific files
2. **Switch**: Copy desired config to `amplify_outputs.json`  
3. **Restart**: Refresh your dev server to use new environment

## 🔧 **Setting Up Environment Switching:**

### **Step 1: Save Current Sandbox Config**
```bash
# Save your current sandbox configuration
cp amplify_outputs.json amplify_outputs.sandbox.json
```

### **Step 2: Get Production Config (After Deployment)**
```bash
# Download production config from AWS
aws amplify get-app --app-id d2eswaiwjbdk9g --region us-west-2
# Production amplify_outputs.json will be available at production URL
```

### **Step 3: Use the Switching Scripts**
```bash
# Work with production data
npm run switch:production
npm run dev

# Work with sandbox data  
npm run switch:sandbox
npm run dev
```

## 🎯 **Development Workflows:**

### **For New Features (Use Sandbox):**
```bash
npm run dev:sandbox
# Create/test new features safely
# No risk to production data
```

### **For Content Creation (Use Production):**
```bash
npm run dev:production
# Create exercises, manage users
# Data persists and is safe
```

### **For Bug Fixes (Use Production):**
```bash
npm run dev:production  
# Debug with real data
# See actual user issues
```

## ⚡ **Quick Environment Status Check:**

Add this to see which environment you're using:
```bash
# Check current environment
cat amplify_outputs.json | grep "user_pool_id"
```

**Environment IDs:**
- 🏗️ **Sandbox**: `us-west-2_LbHX01MfK`
- 🚀 **Production**: (Will be different after deployment)

## 🛡️ **Safety Best Practices:**

### **1. Default to Production**
- Use production for **content creation**
- Use production for **normal development**
- Use sandbox only for **risky experiments**

### **2. Environment Indicators**
Add visual indicators to know which environment:
```javascript
// In your app
const env = process.env.NODE_ENV;
const isProduction = amplify_outputs.auth.user_pool_id !== 'us-west-2_LbHX01MfK';
```

### **3. Backup Before Experiments**
```bash
# Before trying risky features
npm run backup    # Backup production data
npm run dev:sandbox  # Switch to sandbox for testing
```

## 🎉 **Benefits of This Setup:**

### **✅ Real Data Development**
- Work with actual user content
- See real-world data scenarios
- Debug actual user issues

### **✅ Safe Experimentation**  
- Test breaking changes in sandbox
- No risk to production users
- Easy rollback if needed

### **✅ Seamless Workflow**
- One command to switch environments
- Same codebase, different data
- Fast development cycles

## 🚀 **After Production Deployment Completes:**

1. **Download production config**:
   ```bash
   # Get from production URL or AWS Console
   curl https://d2eswaiwjbdk9g.amplifyapp.com/amplify_outputs.json > amplify_outputs.production.json
   ```

2. **Set up environment switching**:
   ```bash
   npm run switch:production  # Use production by default
   npm run dev               # Start development
   ```

3. **Verify it works**:
   - Create a test user in production
   - Add a test exercise
   - Verify data persists

---

**🎯 Bottom Line: Use production data for 90% of development, sandbox for risky experiments!** 