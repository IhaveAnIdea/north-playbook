import { NextResponse } from 'next/server';

export async function GET() {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const isDatabaseConfigured = !!(
    process.env.AURORA_POSTGRES_HOST &&
    process.env.AURORA_POSTGRES_DATABASE &&
    process.env.AURORA_POSTGRES_USER &&
    process.env.AURORA_POSTGRES_PASSWORD
  );

  const devModeStatus = {
    nodeEnv: process.env.NODE_ENV,
    isDevelopment,
    isDatabaseConfigured,
    isUsingMockDatabase: isDevelopment || !isDatabaseConfigured,
    isUsingMockStorage: isDevelopment,
    databaseHost: isDatabaseConfigured ? 'CONFIGURED' : 'NOT CONFIGURED',
    storageMode: isDevelopment ? 'MOCK (Local Development)' : 'REAL (Production)',
    databaseMode: isDevelopment || !isDatabaseConfigured ? 'MOCK (Local Development)' : 'REAL (Production)',
    message: isDevelopment 
      ? '🎭 LOCAL DEVELOPMENT MODE - Using mock data and storage'
      : '🚀 PRODUCTION MODE - Using real database and S3'
  };

  return NextResponse.json(devModeStatus, { status: 200 });
} 