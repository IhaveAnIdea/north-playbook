// Test Aurora PostgreSQL connection directly
import { NextResponse } from 'next/server';
import { Pool } from 'pg';

export async function GET() {
  const pool = new Pool({
    host: process.env.AURORA_POSTGRES_HOST,
    port: parseInt(process.env.AURORA_POSTGRES_PORT || '5432'),
    database: 'postgres', // Try the default database
    user: process.env.AURORA_POSTGRES_USER,
    password: process.env.AURORA_POSTGRES_PASSWORD,
    ssl: { rejectUnauthorized: false },
    max: 1,
    connectionTimeoutMillis: 10000,
  });

  try {
    console.log('🔗 Attempting direct Aurora connection...');
    
    const client = await pool.connect();
    console.log('✅ Connected to Aurora!');
    
    // Test basic query
    const result = await client.query('SELECT version(), current_database(), current_user');
    console.log('✅ Query executed successfully');
    
    // List available databases
    const dbResult = await client.query('SELECT datname FROM pg_database WHERE datistemplate = false');
    console.log('📋 Available databases:', dbResult.rows);
    
    client.release();
    await pool.end();
    
    return NextResponse.json({
      status: 'success',
      message: 'Successfully connected to Aurora PostgreSQL!',
      data: {
        version: result.rows[0].version,
        currentDatabase: result.rows[0].current_database,
        currentUser: result.rows[0].current_user,
        availableDatabases: dbResult.rows.map(row => row.datname),
        host: process.env.AURORA_POSTGRES_HOST,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('❌ Aurora connection failed:', error);
    
    await pool.end();
    
    return NextResponse.json({
      status: 'error',
      message: 'Failed to connect to Aurora PostgreSQL',
      error: error instanceof Error ? error.message : 'Unknown error',
      details: {
        host: process.env.AURORA_POSTGRES_HOST,
        port: process.env.AURORA_POSTGRES_PORT,
        database: 'postgres',
        user: process.env.AURORA_POSTGRES_USER,
        sslEnabled: true,
        timestamp: new Date().toISOString()
      }
    }, { status: 500 });
  }
} 