# Aurora Serverless v2 Setup Guide

## 🎯 **Complete Setup for North Playbook**

This guide walks you through setting up **Aurora Serverless v2 with PostgreSQL** for your North Playbook application.

---

## 📋 **Prerequisites**

- **AWS Account** with appropriate permissions
- **AWS CLI** installed and configured
- **Database administration tool** (pgAdmin, DBeaver, or psql)
- **Node.js application** ready for database integration

---

## 🚀 **Step 1: Create Aurora Serverless v2 Cluster**

### **Option A: AWS Console (Recommended for first-time)**

1. **Navigate to RDS Console**
   - Go to [AWS RDS Console](https://console.aws.amazon.com/rds/)
   - Click **"Create database"**

2. **Choose Database Creation Method**
   - Select **"Standard create"**
   - Choose **"Amazon Aurora"**

3. **Engine Configuration**
   ```
   Engine type: Amazon Aurora
   Edition: Amazon Aurora PostgreSQL-Compatible Edition
   Capacity type: Serverless v2
   Engine version: Aurora PostgreSQL 15.4 (or latest)
   ```

4. **Database Cluster Settings**
   ```
   DB cluster identifier: north-playbook-cluster
   Master username: postgres
   Master password: [Generate secure password]
   ```

5. **Serverless v2 Configuration**
   ```
   Minimum Aurora capacity units: 0.5 ACUs
   Maximum Aurora capacity units: 4 ACUs
   ```

6. **Additional Configuration**
   ```
   Initial database name: north_playbook
   VPC: Default VPC (or create new)
   Subnet group: default
   VPC security groups: Create new (or use existing)
   ```

7. **Advanced Settings**
   ```
   Database port: 5432
   Parameter group: default.aurora-postgresql15
   Backup retention period: 7 days
   Enable deletion protection: Yes (recommended)
   ```

### **Option B: AWS CLI**

```bash
# Create Aurora Serverless v2 cluster
aws rds create-db-cluster \
  --db-cluster-identifier north-playbook-cluster \
  --engine aurora-postgresql \
  --engine-version 15.4 \
  --master-username postgres \
  --master-user-password YourSecurePassword123! \
  --serverless-v2-scaling-configuration MinCapacity=0.5,MaxCapacity=4 \
  --database-name north_playbook \
  --vpc-security-group-ids sg-xxxxxxxxx \
  --db-subnet-group-name default \
  --backup-retention-period 7 \
  --deletion-protection

# Create Aurora Serverless v2 instance
aws rds create-db-instance \
  --db-instance-identifier north-playbook-writer \
  --db-instance-class db.serverless \
  --engine aurora-postgresql \
  --db-cluster-identifier north-playbook-cluster
```

---

## 🔐 **Step 2: Configure Security Group**

### **Create Security Group**
```bash
# Create security group
aws ec2 create-security-group \
  --group-name aurora-playbook-sg \
  --description "Security group for Aurora Playbook cluster"

# Add inbound rule for PostgreSQL (port 5432)
aws ec2 authorize-security-group-ingress \
  --group-id sg-xxxxxxxxx \
  --protocol tcp \
  --port 5432 \
  --source-group sg-xxxxxxxxx
```

### **Security Group Rules**
```
Type: PostgreSQL/Aurora
Protocol: TCP
Port Range: 5432
Source: Your application's security group or specific IP ranges
```

---

## 🗄️ **Step 3: Initialize Database Schema**

### **Connect to Database**
```bash
# Get cluster endpoint
aws rds describe-db-clusters \
  --db-cluster-identifier north-playbook-cluster \
  --query 'DBClusters[0].Endpoint'

# Connect using psql
psql -h your-cluster-endpoint.cluster-xxxxx.us-east-1.rds.amazonaws.com \
     -U postgres \
     -d north_playbook
```

### **Run Schema Script**
```sql
-- Copy and paste the contents of database/aurora-postgresql-schema.sql
-- Or run directly from file:
\i /path/to/database/aurora-postgresql-schema.sql
```

---

## 🔧 **Step 4: Environment Configuration**

### **Add to `.env.local`**
```env
# Aurora PostgreSQL Configuration
AURORA_POSTGRES_HOST=north-playbook-cluster.cluster-xxxxx.us-east-1.rds.amazonaws.com
AURORA_POSTGRES_PORT=5432
AURORA_POSTGRES_DATABASE=north_playbook
AURORA_POSTGRES_USER=postgres
AURORA_POSTGRES_PASSWORD=YourSecurePassword123!

# Optional: SSL configuration
AURORA_POSTGRES_SSL=true
```

### **Production Environment Variables**
```env
# Use AWS Secrets Manager or Parameter Store
AURORA_POSTGRES_HOST=${aurora_endpoint}
AURORA_POSTGRES_PASSWORD=${aurora_password}
```

---

## ⚙️ **Step 5: Install Dependencies**

```bash
# Install PostgreSQL client for Node.js
npm install pg @types/pg

# Optional: Install migration tools
npm install db-migrate db-migrate-pg
```

---

## 🧪 **Step 6: Test Connection**

### **Create Test Script** (`scripts/test-db.js`)
```javascript
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.AURORA_POSTGRES_HOST,
  port: parseInt(process.env.AURORA_POSTGRES_PORT || '5432'),
  database: process.env.AURORA_POSTGRES_DATABASE,
  user: process.env.AURORA_POSTGRES_USER,
  password: process.env.AURORA_POSTGRES_PASSWORD,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function testConnection() {
  try {
    const client = await pool.connect();
    
    // Test basic query
    const result = await client.query('SELECT NOW(), version()');
    console.log('✅ Database connected successfully!');
    console.log('Time:', result.rows[0].now);
    console.log('Version:', result.rows[0].version);
    
    // Test table existence
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log('📋 Tables found:', tables.rows.map(r => r.table_name));
    
    client.release();
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
  } finally {
    await pool.end();
  }
}

testConnection();
```

### **Run Test**
```bash
node scripts/test-db.js
```

---

## 🎛️ **Step 7: Advanced Configuration**

### **Connection Pooling**
```javascript
// src/lib/db-config.ts
import { Pool } from 'pg';

const poolConfig = {
  host: process.env.AURORA_POSTGRES_HOST,
  port: parseInt(process.env.AURORA_POSTGRES_PORT || '5432'),
  database: process.env.AURORA_POSTGRES_DATABASE,
  user: process.env.AURORA_POSTGRES_USER,
  password: process.env.AURORA_POSTGRES_PASSWORD,
  ssl: process.env.NODE_ENV === 'production' ? { 
    rejectUnauthorized: false 
  } : false,
  
  // Connection pool settings
  max: 20,                      // Maximum connections
  min: 2,                       // Minimum connections
  idleTimeoutMillis: 30000,     // Close idle connections after 30s
  connectionTimeoutMillis: 2000, // Timeout connection attempts
  maxUses: 7500,                // Retire connections after 7500 uses
};

export const pool = new Pool(poolConfig);
```

### **Performance Monitoring**
```javascript
// Add connection monitoring
pool.on('connect', () => {
  console.log('📊 New database connection established');
});

pool.on('error', (err) => {
  console.error('❌ Database pool error:', err);
});
```

---

## 📊 **Step 8: Monitoring & Optimization**

### **CloudWatch Metrics to Monitor**
- **DatabaseConnections** - Track connection usage
- **ServerlessDatabaseCapacity** - Monitor ACU usage
- **CPUUtilization** - Check performance
- **DatabaseConnections** - Ensure pool efficiency

### **Performance Tuning**
```sql
-- Check current connections
SELECT count(*) FROM pg_stat_activity;

-- Monitor query performance
SELECT query, mean_exec_time, calls 
FROM pg_stat_statements 
ORDER BY mean_exec_time DESC 
LIMIT 10;
```

---

## 🔒 **Step 9: Security Best Practices**

### **Enable SSL/TLS**
```javascript
const pool = new Pool({
  // ... other config
  ssl: {
    require: true,
    rejectUnauthorized: false, // For RDS certificates
  }
});
```

### **Use AWS Secrets Manager**
```bash
# Create secret
aws secretsmanager create-secret \
  --name "aurora-playbook-credentials" \
  --description "Aurora PostgreSQL credentials for North Playbook" \
  --secret-string '{"username":"postgres","password":"YourSecurePassword123!"}'

# Retrieve secret in application
const secret = await secretsManager.getSecretValue({
  SecretId: 'aurora-playbook-credentials'
}).promise();
```

---

## 🚀 **Step 10: Deploy & Test**

### **Update Application**
```javascript
// Update your playbook service to use the connection
import { playbookService } from './lib/playbook-service';

// Test in your application
const exercises = await playbookService.getExercises();
console.log('✅ Exercises loaded:', exercises.length);
```

### **Health Check Endpoint**
```javascript
// pages/api/health/db.js
import { playbookService } from '../../../lib/playbook-service';

export default async function handler(req, res) {
  try {
    const exercises = await playbookService.getExercises();
    res.status(200).json({ 
      status: 'healthy', 
      exercises: exercises.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'unhealthy', 
      error: error.message 
    });
  }
}
```

---

## 💡 **Cost Optimization Tips**

### **Serverless v2 Scaling**
- **Start small**: 0.5 ACUs minimum
- **Scale gradually**: Monitor and adjust max ACUs
- **Use pausing**: Enable automatic pausing for dev/test

### **Connection Management**
- **Pool connections**: Reuse database connections
- **Monitor usage**: Track active connections
- **Close unused**: Implement connection lifecycle

---

## 🔧 **Troubleshooting**

### **Common Issues**

**Connection Timeouts**
```bash
# Check security group rules
aws ec2 describe-security-groups --group-ids sg-xxxxxxxxx

# Test network connectivity
telnet your-cluster-endpoint.amazonaws.com 5432
```

**SSL Certificate Issues**
```javascript
// For development, disable SSL verification
ssl: { rejectUnauthorized: false }
```

**Permission Errors**
```sql
-- Grant necessary permissions
GRANT ALL PRIVILEGES ON DATABASE north_playbook TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
```

---

## ✅ **Verification Checklist**

- [ ] **Aurora cluster created** and available
- [ ] **Security groups configured** properly
- [ ] **Database schema deployed** successfully
- [ ] **Environment variables set** correctly
- [ ] **Application connection tested** and working
- [ ] **Health check endpoint** responding
- [ ] **Monitoring enabled** in CloudWatch
- [ ] **Backup retention configured**
- [ ] **SSL/TLS enabled** for production

---

Your Aurora Serverless v2 PostgreSQL cluster is now ready for the North Playbook application! 🎉

The serverless architecture will automatically scale based on demand, keeping costs low during development and scaling up as your user base grows. 