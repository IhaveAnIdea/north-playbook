-- DBeaver Setup Script for North Playbook
-- Run this after connecting to the 'postgres' database, then reconnect to 'north_playbook'

-- Step 1: Create the database (run this first)
CREATE DATABASE north_playbook;

-- Step 2: After creating database, reconnect to 'north_playbook' and run the rest

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Essential sample exercises to get started
INSERT INTO exercises (id, title, description, category, question, prompt_type, is_active, display_order, estimated_time_minutes) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Daily Gratitude Reflection', 'Reflect on three things you are grateful for today and why they matter to you.', 'gratitude', 'What are three things you are grateful for today, and how do they make you feel?', 'text', true, 1, 5),
('550e8400-e29b-41d4-a716-446655440002', 'Future Vision Exercise', 'Visualize and describe your ideal life 5 years from now.', 'vision', 'Describe in detail what your life looks like 5 years from now. What have you achieved?', 'text', true, 2, 15),
('550e8400-e29b-41d4-a716-446655440003', 'Mindset Check-In', 'Examine your current mindset and identify areas for growth.', 'mindset', 'How would you describe your current mindset? What beliefs are serving you well, and which ones might be holding you back?', 'audio', true, 3, 10),
('550e8400-e29b-41d4-a716-446655440004', 'Goal Setting Session', 'Define and structure your most important goals.', 'goals', 'What is one major goal you want to achieve in the next 90 days? Break it down into actionable steps.', 'text', true, 4, 20),
('550e8400-e29b-41d4-a716-446655440005', 'Weekly Reflection', 'Look back on your week and extract key insights.', 'reflection', 'What were the biggest wins and challenges from this week? What would you do differently?', 'video', true, 5, 12);

-- Create a simple function to test database connectivity
CREATE OR REPLACE FUNCTION test_database_connection()
RETURNS TABLE(
    database_name TEXT,
    version TEXT,
    table_count BIGINT,
    extension_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        current_database()::TEXT as database_name,
        version()::TEXT as version,
        (SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public') as table_count,
        (SELECT count(*) FROM pg_extension) as extension_count;
END;
$$ LANGUAGE plpgsql;

-- Test the setup
SELECT * FROM test_database_connection();

-- Show all tables created
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name; 