// Debug API route to check environment variables
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    nodeEnv: process.env.NODE_ENV,
    auroraHost: process.env.AURORA_POSTGRES_HOST ? 'SET' : 'NOT SET',
    auroraDatabase: process.env.AURORA_POSTGRES_DATABASE ? 'SET' : 'NOT SET',
    auroraUser: process.env.AURORA_POSTGRES_USER ? 'SET' : 'NOT SET',
    auroraPassword: process.env.AURORA_POSTGRES_PASSWORD ? 'SET' : 'NOT SET',
    isDatabaseConfigured: !!(process.env.AURORA_POSTGRES_HOST && 
                           process.env.AURORA_POSTGRES_DATABASE && 
                           process.env.AURORA_POSTGRES_USER && 
                           process.env.AURORA_POSTGRES_PASSWORD),
    isDevMode: process.env.NODE_ENV === 'development' || !!(process.env.AURORA_POSTGRES_HOST && 
                                                           process.env.AURORA_POSTGRES_DATABASE && 
                                                           process.env.AURORA_POSTGRES_USER && 
                                                           process.env.AURORA_POSTGRES_PASSWORD),
    timestamp: new Date().toISOString()
  });
} 