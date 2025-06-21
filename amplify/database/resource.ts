import { defineBackend } from '@aws-amplify/backend';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Stack, Duration } from 'aws-cdk-lib';

export function createAuroraDatabase(backend: ReturnType<typeof defineBackend>) {
  const stack = Stack.of(backend.data);

  // Create VPC for Aurora Serverless v2
  const vpc = new ec2.Vpc(stack, 'PlaybookVPC', {
    maxAzs: 2,
    natGateways: 0, // No NAT gateways needed for Aurora Serverless v2
    subnetConfiguration: [
      {
        cidrMask: 24,
        name: 'Database',
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
    ],
    enableDnsHostnames: true,
    enableDnsSupport: true,
  });

  // Create security group for Aurora
  const dbSecurityGroup = new ec2.SecurityGroup(stack, 'AuroraSecurityGroup', {
    vpc,
    description: 'Security group for Aurora Serverless v2 cluster',
    allowAllOutbound: false,
  });

  // Allow inbound connections from Lambda (for GraphQL resolvers)
  dbSecurityGroup.addIngressRule(
    ec2.Peer.ipv4(vpc.vpcCidrBlock),
    ec2.Port.tcp(3306),
    'Allow MySQL connections from within VPC'
  );

  // Create database credentials secret
  const dbCredentials = new secretsmanager.Secret(stack, 'AuroraCredentials', {
    generateSecretString: {
      secretStringTemplate: JSON.stringify({ username: 'admin' }),
      generateStringKey: 'password',
      excludeCharacters: '"@/\\\'',
      passwordLength: 32,
    },
    description: 'Aurora Serverless v2 credentials for North Playbook',
  });

  // Create Aurora Serverless v2 cluster
  const cluster = new rds.DatabaseCluster(stack, 'PlaybookCluster', {
    engine: rds.DatabaseClusterEngine.auroraMysql({
      version: rds.AuroraMysqlEngineVersion.VER_3_02_0,
    }),
    
    // Writer instance configuration
    writer: rds.ClusterInstance.serverlessV2('PlaybookWriter', {
      minCapacity: 0.5,
      maxCapacity: 128,
    }),
    
    // Database configuration
    defaultDatabaseName: 'north_playbook',
    
    // Network configuration
    vpc,
    vpcSubnets: {
      subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
    },
    securityGroups: [dbSecurityGroup],
    
    // Credentials
    credentials: rds.Credentials.fromSecret(dbCredentials),
    
    // Backup and maintenance
    backup: {
      retention: Duration.days(7),
      preferredWindow: '03:00-04:00',
    },
    preferredMaintenanceWindow: 'sun:04:00-sun:05:00',
    
    // Security
    storageEncrypted: true,
    
    // Performance Insights
    enablePerformanceInsights: true,
    performanceInsightRetention: rds.PerformanceInsightRetention.DEFAULT,
    
    // Deletion protection
    deletionProtection: true,
    
    // Parameter group for optimization
    parameterGroup: new rds.ParameterGroup(stack, 'PlaybookParameterGroup', {
      engine: rds.DatabaseClusterEngine.auroraMysql({
        version: rds.AuroraMysqlEngineVersion.VER_3_02_0,
      }),
      parameters: {
        innodb_buffer_pool_size: '{DBInstanceClassMemory*3/4}',
        max_connections: '300',
        slow_query_log: '1',
        long_query_time: '2',
        innodb_lock_wait_timeout: '50',
        innodb_flush_log_at_trx_commit: '2',
        sync_binlog: '0',
      },
    }),
  });

  // Export cluster endpoint and credentials for use in GraphQL resolvers
  return {
    cluster,
    vpc,
    credentials: dbCredentials,
    endpoint: cluster.clusterEndpoint,
    port: cluster.clusterEndpoint.port,
  };
} 