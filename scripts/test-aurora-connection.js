#!/usr/bin/env node

/**
 * Aurora PostgreSQL Connection Test Script
 * Run this to verify your Aurora Serverless v2 setup
 */

const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  host: process.env.AURORA_POSTGRES_HOST,
  port: parseInt(process.env.AURORA_POSTGRES_PORT || '5432'),
  database: process.env.AURORA_POSTGRES_DATABASE,
  user: process.env.AURORA_POSTGRES_USER,
  password: process.env.AURORA_POSTGRES_PASSWORD,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

async function testConnection() {
  console.log('🔌 Testing Aurora PostgreSQL Connection...\n');
  
  let client;
  try {
    // Test basic connection
    console.log('1️⃣ Attempting database connection...');
    client = await pool.connect();
    console.log('✅ Database connection successful!');
    
    // Test basic query
    console.log('\n2️⃣ Testing basic query...');
    const timeResult = await client.query('SELECT NOW() as current_time, version() as pg_version');
    console.log('✅ Query successful!');
    console.log(`   Time: ${timeResult.rows[0].current_time}`);
    console.log(`   Version: ${timeResult.rows[0].pg_version.split(' ')[0]}`);
    
    // Check if schema is deployed
    console.log('\n3️⃣ Checking database schema...');
    const tablesResult = await client.query(`
      SELECT table_name, table_type
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    
    const expectedTables = [
      'avatar_interactions',
      'exercise_responses',
      'exercises',
      'media_assets',
      'playbook_entries',
      'user_insights',
      'user_profiles',
      'user_progress',
      'user_sessions'
    ];
    
    const foundTables = tablesResult.rows.map(row => row.table_name);
    console.log(`✅ Found ${foundTables.length} tables:`);
    foundTables.forEach(table => console.log(`   📋 ${table}`));
    
    // Check for missing tables
    const missingTables = expectedTables.filter(table => !foundTables.includes(table));
    if (missingTables.length > 0) {
      console.log(`\n⚠️  Missing tables (run schema script):`);
      missingTables.forEach(table => console.log(`   ❌ ${table}`));
    }
    
    // Test exercises data
    console.log('\n4️⃣ Testing sample data...');
    const exercisesResult = await client.query('SELECT COUNT(*) as count FROM exercises');
    const exerciseCount = parseInt(exercisesResult.rows[0].count);
    console.log(`✅ Found ${exerciseCount} exercises in database`);
    
    if (exerciseCount > 0) {
      const sampleExercise = await client.query('SELECT title, category FROM exercises LIMIT 1');
      console.log(`   Sample: "${sampleExercise.rows[0].title}" (${sampleExercise.rows[0].category})`);
    }
    
    // Test materialized views
    console.log('\n5️⃣ Testing materialized views...');
    const viewsResult = await client.query(`
      SELECT schemaname, matviewname 
      FROM pg_matviews 
      WHERE schemaname = 'public'
    `);
    console.log(`✅ Found ${viewsResult.rows.length} materialized views:`);
    viewsResult.rows.forEach(view => console.log(`   📊 ${view.matviewname}`));
    
    // Test functions
    console.log('\n6️⃣ Testing database functions...');
    const functionsResult = await client.query(`
      SELECT proname, pronargs 
      FROM pg_proc 
      WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
      AND proname LIKE '%user%'
    `);
    console.log(`✅ Found ${functionsResult.rows.length} custom functions:`);
    functionsResult.rows.forEach(func => console.log(`   🔧 ${func.proname}(${func.pronargs} args)`));
    
    // Test connection pool
    console.log('\n7️⃣ Testing connection pool...');
    const poolStats = {
      totalCount: pool.totalCount,
      idleCount: pool.idleCount,
      waitingCount: pool.waitingCount
    };
    console.log(`✅ Pool stats:`, poolStats);
    
    console.log('\n🎉 All tests passed! Aurora PostgreSQL is ready for North Playbook.');
    
  } catch (error) {
    console.error('\n❌ Connection test failed:', error.message);
    
    // Provide helpful error messages
    if (error.code === 'ENOTFOUND') {
      console.error('🔍 Check your AURORA_POSTGRES_HOST environment variable');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('🔍 Check your security group rules and network connectivity');
    } else if (error.code === '28P01') {
      console.error('🔍 Check your username and password');
    } else if (error.code === '3D000') {
      console.error('🔍 Check your database name');
    }
    
    console.error('\n🔧 Troubleshooting steps:');
    console.error('   1. Verify environment variables in .env.local');
    console.error('   2. Check AWS security group allows port 5432');
    console.error('   3. Ensure Aurora cluster is in "available" state');
    console.error('   4. Verify VPC and subnet configuration');
    
    process.exit(1);
  } finally {
    if (client) {
      client.release();
    }
    await pool.end();
  }
}

// Environment validation
function validateEnvironment() {
  const required = [
    'AURORA_POSTGRES_HOST',
    'AURORA_POSTGRES_DATABASE',
    'AURORA_POSTGRES_USER',
    'AURORA_POSTGRES_PASSWORD'
  ];
  
  const missing = required.filter(env => !process.env[env]);
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(env => console.error(`   ${env}`));
    console.error('\nPlease add these to your .env.local file');
    process.exit(1);
  }
  
  console.log('✅ Environment variables validated');
  console.log(`   Host: ${process.env.AURORA_POSTGRES_HOST}`);
  console.log(`   Database: ${process.env.AURORA_POSTGRES_DATABASE}`);
  console.log(`   User: ${process.env.AURORA_POSTGRES_USER}`);
  console.log(`   Port: ${process.env.AURORA_POSTGRES_PORT || '5432'}`);
  console.log('');
}

// Run the test
validateEnvironment();
testConnection(); 