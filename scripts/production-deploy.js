#!/usr/bin/env node

/**
 * Production deployment script for North Playbook
 * Sets up proper production environment with persistent data
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function runCommand(command, description) {
  console.log(`🔄 ${description}`);
  console.log(`   Running: ${command}`);
  
  try {
    const output = execSync(command, { 
      stdio: 'inherit',
      cwd: path.join(__dirname, '..')
    });
    console.log(`✅ ${description} completed`);
    return output;
  } catch (error) {
    console.error(`❌ ${description} failed:`, error.message);
    throw error;
  }
}

async function deployProduction() {
  console.log('🚀 Starting production deployment...\n');
  
  try {
    // 1. Backup current data if in development
    console.log('📦 Step 1: Backup current data');
    try {
      runCommand('node scripts/backup-data.js', 'Creating backup before deployment');
    } catch (error) {
      console.warn('⚠️ Could not create backup (may be expected if no data exists)');
    }
    
    // 2. Check Git status
    console.log('\n📋 Step 2: Check Git status');
    runCommand('git status --porcelain', 'Checking for uncommitted changes');
    
    // 3. Create production branch if it doesn't exist
    console.log('\n🌳 Step 3: Setup production branch');
    try {
      runCommand('git checkout production', 'Switching to production branch');
    } catch (error) {
      console.log('Creating new production branch...');
      runCommand('git checkout -b production', 'Creating production branch');
    }
    
    // 4. Merge latest changes
    console.log('\n🔄 Step 4: Merge latest changes');
    runCommand('git merge main', 'Merging main branch into production');
    
    // 5. Deploy to AWS
    console.log('\n☁️ Step 5: Deploy to AWS');
    runCommand('npx ampx pipeline deploy --branch production', 'Deploying to AWS production environment');
    
    // 6. Push to GitHub
    console.log('\n📤 Step 6: Push to GitHub');
    runCommand('git push origin production', 'Pushing production branch to GitHub');
    
    console.log('\n🎉 Production deployment completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('   1. Set up AWS Amplify Hosting in the AWS Console');
    console.log('   2. Connect your GitHub repository');
    console.log('   3. Set production branch as the deployment branch');
    console.log('   4. Enable auto-deploy on push to production');
    console.log('   5. Configure custom domain if needed');
    
  } catch (error) {
    console.error('\n💥 Production deployment failed:', error);
    throw error;
  }
}

async function setupEnvironments() {
  console.log('🏗️ Setting up multi-environment configuration...\n');
  
  // Create environments directory
  const envDir = path.join(__dirname, '..', 'environments');
  if (!fs.existsSync(envDir)) {
    fs.mkdirSync(envDir, { recursive: true });
  }
  
  // Development environment config
  const devConfig = {
    name: 'development',
    description: 'Local development environment (sandbox)',
    persistent: false,
    command: 'npx ampx sandbox',
    notes: 'Ephemeral - data will be lost when sandbox is deleted'
  };
  
  // Staging environment config
  const stagingConfig = {
    name: 'staging',
    description: 'Staging environment for testing',
    persistent: true,
    command: 'npx ampx pipeline deploy --branch staging',
    notes: 'Persistent environment for testing before production'
  };
  
  // Production environment config
  const prodConfig = {
    name: 'production',
    description: 'Production environment',
    persistent: true,
    command: 'npx ampx pipeline deploy --branch production',
    notes: 'Live production environment - never delete!'
  };
  
  fs.writeFileSync(
    path.join(envDir, 'development.json'),
    JSON.stringify(devConfig, null, 2)
  );
  
  fs.writeFileSync(
    path.join(envDir, 'staging.json'),
    JSON.stringify(stagingConfig, null, 2)
  );
  
  fs.writeFileSync(
    path.join(envDir, 'production.json'),
    JSON.stringify(prodConfig, null, 2)
  );
  
  console.log('✅ Environment configurations created');
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--setup-envs')) {
    setupEnvironments()
      .then(() => {
        console.log('\n🎉 Environment setup completed!');
        process.exit(0);
      })
      .catch((error) => {
        console.error('\n💥 Environment setup failed:', error);
        process.exit(1);
      });
  } else {
    deployProduction()
      .then(() => {
        console.log('\n🎉 Production deployment completed!');
        process.exit(0);
      })
      .catch((error) => {
        console.error('\n💥 Production deployment failed:', error);
        process.exit(1);
      });
  }
}

module.exports = { deployProduction, setupEnvironments }; 