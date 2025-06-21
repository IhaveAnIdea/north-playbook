# Aurora Serverless v2 Deployment Guide

This guide walks you through setting up Aurora Serverless v2 for the North Playbook application.

## Overview

Aurora Serverless v2 provides:
- **Automatic scaling** from 0.5 to 128 ACUs based on demand
- **Cost optimization** with pay-per-use pricing
- **High availability** with Multi-AZ deployments
- **Enhanced performance** with Performance Insights
- **Advanced security** with encryption at rest and in transit

## Prerequisites

1. AWS CLI configured with appropriate permissions
2. Amplify CLI installed and configured
3. Node.js 18+ and npm installed
4. MySQL client for database initialization

## Step 1: Create Aurora Serverless v2 Cluster

### Using AWS Console

1. **Navigate to RDS Console**
   - Go to AWS RDS Console → Databases → Create Database

2. **Configure Database**
   ```
   Engine: Aurora (MySQL Compatible)
   Edition: Aurora MySQL
   Version: 8.0.mysql_aurora.3.04.0 (or latest)
   Template: Serverless
   ```

3. **Serverless v2 Settings**
   ```
   Minimum ACUs: 0.5
   Maximum ACUs: 128
   Pause compute capacity: Disabled (for better performance)
   ```

4. **Database Settings**
   ```
   DB cluster identifier: north-playbook-cluster
   Master username: admin
   Password: [Generate secure password]
   Database name: north_playbook
   ```

5. **Connectivity**
   ```
   VPC: Default or create new
   Subnet group: Create new
   Security group: Create new (allow port 3306)
   ```

### Using AWS CLI

```bash
# Create the Aurora Serverless v2 cluster
aws rds create-db-cluster \
  --db-cluster-identifier north-playbook-cluster \
  --engine aurora-mysql \
  --engine-version 8.0.mysql_aurora.3.04.0 \
  --master-username admin \
  --master-user-password [YOUR_SECURE_PASSWORD] \
  --database-name north_playbook \
  --serverless-v2-scaling-configuration MinCapacity=0.5,MaxCapacity=128 \
  --storage-encrypted \
  --enable-cloudwatch-logs-exports error,general,slowquery \
  --enable-performance-insights \
  --performance-insights-retention-period 7

# Create the writer instance
aws rds create-db-instance \
  --db-instance-identifier north-playbook-writer \
  --db-cluster-identifier north-playbook-cluster \
  --db-instance-class db.serverless \
  --engine aurora-mysql \
  --enable-performance-insights
```

## Step 2: Configure Security Groups

```bash
# Get the security group ID
SECURITY_GROUP_ID=$(aws rds describe-db-clusters \
  --db-cluster-identifier north-playbook-cluster \
  --query 'DBClusters[0].VpcSecurityGroups[0].VpcSecurityGroupId' \
  --output text)

# Allow Lambda access (for Amplify GraphQL resolvers)
aws ec2 authorize-security-group-ingress \
  --group-id $SECURITY_GROUP_ID \
  --protocol tcp \
  --port 3306 \
  --source-group $SECURITY_GROUP_ID

# Allow local development access (temporary)
aws ec2 authorize-security-group-ingress \
  --group-id $SECURITY_GROUP_ID \
  --protocol tcp \
  --port 3306 \
  --cidr 0.0.0.0/0
```

## Step 3: Initialize Database Schema

1. **Get Connection Details**
   ```bash
   aws rds describe-db-clusters \
     --db-cluster-identifier north-playbook-cluster \
     --query 'DBClusters[0].Endpoint'
   ```

2. **Connect and Initialize**
   ```bash
   # Connect to Aurora
   mysql -h [CLUSTER_ENDPOINT] -u admin -p north_playbook

   # Run the schema file
   mysql -h [CLUSTER_ENDPOINT] -u admin -p north_playbook < database/schema.sql
   ```

## Step 4: Configure Environment Variables

### Local Development (.env.local)
```env
# Aurora Serverless v2 Configuration
AURORA_HOST=north-playbook-cluster.cluster-xxxxx.us-east-1.rds.amazonaws.com
AURORA_PORT=3306
AURORA_DATABASE=north_playbook
AURORA_USER=admin
AURORA_PASSWORD=your_secure_password

# S3 Configuration
NEXT_PUBLIC_S3_BUCKET=north-playbook-assets
NEXT_PUBLIC_S3_REGION=us-east-1
```

### Production (Amplify Console)
1. Go to Amplify Console → Your App → Environment Variables
2. Add the same variables as above
3. Ensure password is stored securely (use AWS Secrets Manager)

## Step 5: Update Application Dependencies

```bash
# Install MySQL driver
npm install mysql2

# Install additional dependencies for Aurora
npm install @aws-sdk/client-rds @aws-sdk/client-secrets-manager
```

## Step 6: Configure Lambda Function Access

### Create VPC Configuration for Lambda
```javascript
// amplify/backend.ts
import { defineBackend } from '@aws-amplify/backend';

export const backend = defineBackend({
  auth,
  data,
  storage,
});

// Configure Lambda to access Aurora in VPC
backend.data.resources.nestedStacks.graphqlResolvers.addEnvironment({
  AURORA_HOST: process.env.AURORA_HOST!,
  AURORA_DATABASE: process.env.AURORA_DATABASE!,
  AURORA_USER: process.env.AURORA_USER!,
  AURORA_PASSWORD: process.env.AURORA_PASSWORD!,
});
```

## Step 7: Create Database Migration Service

```typescript
// src/lib/migrations.ts
import { databaseService } from './database-service';

export async function runMigrations() {
  try {
    // Check if migrations table exists
    await databaseService.executeQuery(`
      CREATE TABLE IF NOT EXISTS migrations (
        id VARCHAR(255) PRIMARY KEY,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Run pending migrations
    const migrations = [
      'initial_schema',
      'add_indexes',
      'add_views',
    ];

    for (const migration of migrations) {
      const exists = await databaseService.executeQuery(
        'SELECT id FROM migrations WHERE id = ?',
        [migration]
      );

      if (exists.length === 0) {
        console.log(`Running migration: ${migration}`);
        // Run migration logic here
        await databaseService.executeQuery(
          'INSERT INTO migrations (id) VALUES (?)',
          [migration]
        );
      }
    }

    console.log('All migrations completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}
```

## Step 8: Monitor and Optimize

### Performance Monitoring
1. **Enable Performance Insights**
   - Monitor query performance
   - Identify slow queries
   - Optimize indexes

2. **CloudWatch Metrics**
   - DatabaseConnections
   - CPUUtilization
   - ServerlessDatabaseCapacity

3. **Query Optimization**
   ```sql
   -- Enable slow query log
   SET GLOBAL slow_query_log = 'ON';
   SET GLOBAL long_query_time = 2;
   
   -- Monitor queries
   SHOW PROCESSLIST;
   EXPLAIN SELECT * FROM exercise_responses WHERE user_id = ?;
   ```

### Cost Optimization
1. **ACU Scaling**
   - Monitor actual usage patterns
   - Adjust min/max ACUs based on traffic
   - Consider pause settings for dev environments

2. **Connection Pooling**
   - Use connection pooling to reduce overhead
   - Configure proper timeout settings
   - Monitor connection counts

## Step 9: Backup and Recovery

### Automated Backups
```bash
# Configure backup retention
aws rds modify-db-cluster \
  --db-cluster-identifier north-playbook-cluster \
  --backup-retention-period 7 \
  --preferred-backup-window "03:00-04:00"
```

### Point-in-Time Recovery
```bash
# Restore to specific time
aws rds restore-db-cluster-to-point-in-time \
  --source-db-cluster-identifier north-playbook-cluster \
  --db-cluster-identifier north-playbook-restored \
  --restore-to-time 2024-01-30T10:00:00.000Z
```

## Step 10: Security Best Practices

### 1. Network Security
- Use VPC with private subnets
- Configure security groups properly
- Enable VPC Flow Logs

### 2. Authentication & Authorization
- Use IAM database authentication
- Rotate credentials regularly
- Use AWS Secrets Manager

### 3. Encryption
- Enable encryption at rest
- Use SSL/TLS for connections
- Encrypt backups

### 4. Monitoring
- Enable CloudTrail for audit logs
- Set up CloudWatch alarms
- Monitor failed connection attempts

## Troubleshooting

### Common Issues

1. **Connection Timeouts**
   ```typescript
   // Increase connection timeout
   const config = {
     acquireTimeout: 60000,
     timeout: 60000,
     connectionLimit: 20
   };
   ```

2. **Capacity Scaling**
   ```bash
   # Check current capacity
   aws rds describe-db-clusters \
     --db-cluster-identifier north-playbook-cluster \
     --query 'DBClusters[0].ServerlessV2ScalingConfiguration'
   ```

3. **Query Performance**
   ```sql
   -- Check for missing indexes
   SELECT * FROM information_schema.tables 
   WHERE table_schema = 'north_playbook';
   
   -- Analyze table statistics
   ANALYZE TABLE exercise_responses;
   ```

## Migration from DynamoDB

If migrating from existing DynamoDB:

1. **Data Export**
   ```bash
   # Export DynamoDB data
   aws dynamodb scan --table-name YourTable --output json > data.json
   ```

2. **Data Transformation**
   ```typescript
   // Transform DynamoDB format to MySQL
   function transformDynamoToMySQL(dynamoData: any) {
     return {
       id: dynamoData.id.S,
       userId: dynamoData.userId.S,
       responseText: dynamoData.responseText?.S,
       // ... transform other fields
     };
   }
   ```

3. **Data Import**
   ```sql
   LOAD DATA INFILE 'transformed_data.csv'
   INTO TABLE exercise_responses
   FIELDS TERMINATED BY ','
   LINES TERMINATED BY '\n';
   ```

## Conclusion

Aurora Serverless v2 provides a robust, scalable, and cost-effective database solution for the North Playbook application. The relational model offers better data consistency, complex querying capabilities, and stronger ACID guarantees compared to NoSQL solutions.

Key benefits:
- **Automatic scaling** based on demand
- **Enhanced querying** with SQL and full-text search
- **Better data relationships** with foreign keys
- **Advanced analytics** with built-in views
- **Cost optimization** with serverless pricing 