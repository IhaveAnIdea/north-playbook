// Production readiness checker for North Playbook

// Define the expected structure of the Amplify config
interface AmplifyConfig {
  storage?: {
    bucket_name?: string;
  };
  auth?: {
    user_pool_id?: string;
  };
}

// Extend the Window interface to include aws_amplify_config
declare global {
  interface Window {
    aws_amplify_config?: AmplifyConfig;
  }
}

export interface ProductionCheckResult {
  isReady: boolean;
  checks: {
    amplifyConfig: boolean;
    storageConfig: boolean;
    authConfig: boolean;
    environment: 'development' | 'production';
  };
  issues: string[];
  recommendations: string[];
}

export function checkProductionReadiness(): ProductionCheckResult {
  const result: ProductionCheckResult = {
    isReady: false,
    checks: {
      amplifyConfig: false,
      storageConfig: false,
      authConfig: false,
      environment: process.env.NODE_ENV === 'production' ? 'production' : 'development'
    },
    issues: [],
    recommendations: []
  };

  try {
    // Check if we're in browser environment
    if (typeof window === 'undefined') {
      result.issues.push('Running in server environment');
      return result;
    }

    // Check Amplify configuration
    const amplifyConfig = window.aws_amplify_config;
    if (amplifyConfig) {
      result.checks.amplifyConfig = true;
    } else {
      result.issues.push('Amplify configuration not found');
      result.recommendations.push('Run "amplify init" and "amplify push" to set up AWS resources');
    }

    // Check storage configuration
    if (amplifyConfig?.storage) {
      if (amplifyConfig.storage.bucket_name && amplifyConfig.storage.bucket_name !== 'placeholder') {
        result.checks.storageConfig = true;
      } else {
        result.issues.push('S3 storage not properly configured (placeholder bucket)');
        result.recommendations.push('Deploy storage resources with "amplify push"');
      }
    } else {
      result.issues.push('Storage configuration missing');
      result.recommendations.push('Add storage resource to amplify/backend.ts');
    }

    // Check auth configuration
    if (amplifyConfig?.auth) {
      if (amplifyConfig.auth.user_pool_id && !amplifyConfig.auth.user_pool_id.includes('placeholder')) {
        result.checks.authConfig = true;
      } else {
        result.issues.push('Authentication not properly configured');
        result.recommendations.push('Deploy auth resources with "amplify push"');
      }
    } else {
      result.issues.push('Authentication configuration missing');
      result.recommendations.push('Add auth resource to amplify/backend.ts');
    }

    // Determine overall readiness
    result.isReady = result.checks.amplifyConfig && 
                    result.checks.storageConfig && 
                    result.checks.authConfig;

    // Add environment-specific recommendations
    if (result.checks.environment === 'development') {
      if (result.isReady) {
        result.recommendations.push('Ready for production deployment!');
      } else {
        result.recommendations.push('Using development mode with mock storage');
      }
    }

  } catch (error) {
    result.issues.push(`Configuration check failed: ${error}`);
  }

  return result;
}

export function logProductionStatus(): void {
  const status = checkProductionReadiness();
  
  console.log('🔍 North Playbook Production Readiness Check');
  console.log('='.repeat(50));
  
  console.log(`Environment: ${status.checks.environment}`);
  console.log(`Overall Status: ${status.isReady ? '✅ Ready' : '⚠️ Not Ready'}`);
  
  console.log('\nChecks:');
  console.log(`  Amplify Config: ${status.checks.amplifyConfig ? '✅' : '❌'}`);
  console.log(`  Storage Config: ${status.checks.storageConfig ? '✅' : '❌'}`);
  console.log(`  Auth Config: ${status.checks.authConfig ? '✅' : '❌'}`);
  
  if (status.issues.length > 0) {
    console.log('\n⚠️ Issues:');
    status.issues.forEach(issue => console.log(`  - ${issue}`));
  }
  
  if (status.recommendations.length > 0) {
    console.log('\n💡 Recommendations:');
    status.recommendations.forEach(rec => console.log(`  - ${rec}`));
  }
  
  console.log('='.repeat(50));
}

// Auto-run in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  setTimeout(() => logProductionStatus(), 1000);
} 