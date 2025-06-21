-- North Playbook PostgreSQL Schema for Aurora Serverless v2
-- Focused on core playbook functionality (vectors handled by Pinecone)

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- User profiles table
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(255) NOT NULL UNIQUE,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    preferences JSONB DEFAULT '{}',
    avatar_settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for user profiles
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_user_profiles_email ON user_profiles(email);
CREATE INDEX idx_user_profiles_preferences ON user_profiles USING GIN(preferences);

-- Exercises table (reference data)
CREATE TABLE exercises (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(500) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(100) NOT NULL CHECK (category IN ('mindset', 'motivation', 'goals', 'reflection', 'gratitude', 'vision')),
    question TEXT NOT NULL,
    prompt_type VARCHAR(50) NOT NULL CHECK (prompt_type IN ('text', 'audio', 'video')),
    is_active BOOLEAN DEFAULT TRUE,
    display_order INTEGER DEFAULT 0,
    estimated_time_minutes INTEGER DEFAULT 10,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for exercises
CREATE INDEX idx_exercises_category ON exercises(category);
CREATE INDEX idx_exercises_active ON exercises(is_active);
CREATE INDEX idx_exercises_order ON exercises(display_order);
CREATE INDEX idx_exercises_metadata ON exercises USING GIN(metadata);
CREATE INDEX idx_exercises_question_text ON exercises USING GIN(to_tsvector('english', question));

-- Media assets table (S3 references)
CREATE TABLE media_assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(255) NOT NULL,
    s3_key VARCHAR(1024) NOT NULL,
    s3_bucket VARCHAR(255) NOT NULL,
    file_name VARCHAR(500) NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(255) NOT NULL,
    exercise_id UUID NULL,
    exercise_response_id UUID NULL,
    playbook_entry_id UUID NULL,
    category VARCHAR(100) NULL,
    tags TEXT[] DEFAULT '{}',
    description TEXT NULL,
    metadata JSONB DEFAULT '{}',
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_accessed_at TIMESTAMP WITH TIME ZONE NULL,
    access_count INTEGER DEFAULT 0
);

-- Create indexes for media assets
CREATE INDEX idx_media_assets_user_id ON media_assets(user_id);
CREATE INDEX idx_media_assets_exercise_id ON media_assets(exercise_id);
CREATE INDEX idx_media_assets_exercise_response_id ON media_assets(exercise_response_id);
CREATE INDEX idx_media_assets_playbook_entry_id ON media_assets(playbook_entry_id);
CREATE INDEX idx_media_assets_category ON media_assets(category);
CREATE INDEX idx_media_assets_tags ON media_assets USING GIN(tags);
CREATE INDEX idx_media_assets_metadata ON media_assets USING GIN(metadata);
CREATE INDEX idx_media_assets_uploaded_at ON media_assets(uploaded_at);
CREATE INDEX idx_media_assets_description ON media_assets USING GIN(to_tsvector('english', description));

-- Exercise responses table
CREATE TABLE exercise_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    exercise_id UUID NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    response_text TEXT NULL,
    audio_s3_key VARCHAR(1024) NULL,
    video_s3_key VARCHAR(1024) NULL,
    image_s3_keys TEXT[] DEFAULT '{}',
    s3_bucket VARCHAR(255) NULL,
    analysis_result JSONB DEFAULT '{}',
    insights TEXT[] DEFAULT '{}',
    mood VARCHAR(100) NULL,
    tags TEXT[] DEFAULT '{}',
    completion_time_seconds INTEGER NULL,
    confidence_rating INTEGER NULL CHECK (confidence_rating BETWEEN 1 AND 10),
    sentiment_score DECIMAL(3,2) NULL CHECK (sentiment_score BETWEEN -1 AND 1),
    pinecone_id VARCHAR(255) NULL, -- Reference to Pinecone vector ID for avatar knowledge
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for exercise responses
CREATE INDEX idx_exercise_responses_exercise_id ON exercise_responses(exercise_id);
CREATE INDEX idx_exercise_responses_user_id ON exercise_responses(user_id);
CREATE INDEX idx_exercise_responses_user_exercise ON exercise_responses(user_id, exercise_id);
CREATE INDEX idx_exercise_responses_created_at ON exercise_responses(created_at);
CREATE INDEX idx_exercise_responses_mood ON exercise_responses(mood);
CREATE INDEX idx_exercise_responses_tags ON exercise_responses USING GIN(tags);
CREATE INDEX idx_exercise_responses_insights ON exercise_responses USING GIN(insights);
CREATE INDEX idx_exercise_responses_analysis_result ON exercise_responses USING GIN(analysis_result);
CREATE INDEX idx_exercise_responses_metadata ON exercise_responses USING GIN(metadata);
CREATE INDEX idx_exercise_responses_pinecone_id ON exercise_responses(pinecone_id);
CREATE INDEX idx_exercise_responses_response_text ON exercise_responses USING GIN(to_tsvector('english', response_text));
CREATE INDEX idx_exercise_responses_sentiment ON exercise_responses(sentiment_score);

-- Playbook entries table
CREATE TABLE playbook_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(255) NOT NULL,
    exercise_response_id UUID NULL,
    title VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    insights TEXT[] DEFAULT '{}',
    audio_s3_keys TEXT[] DEFAULT '{}',
    video_s3_keys TEXT[] DEFAULT '{}',
    image_s3_keys TEXT[] DEFAULT '{}',
    document_s3_keys TEXT[] DEFAULT '{}',
    s3_bucket VARCHAR(255) NULL,
    mood VARCHAR(100) NULL,
    tags TEXT[] DEFAULT '{}',
    is_highlight BOOLEAN DEFAULT FALSE,
    view_count INTEGER DEFAULT 0,
    last_viewed_at TIMESTAMP WITH TIME ZONE NULL,
    pinecone_id VARCHAR(255) NULL, -- Reference to Pinecone vector ID
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for playbook entries
CREATE INDEX idx_playbook_entries_user_id ON playbook_entries(user_id);
CREATE INDEX idx_playbook_entries_exercise_response_id ON playbook_entries(exercise_response_id);
CREATE INDEX idx_playbook_entries_category ON playbook_entries(category);
CREATE INDEX idx_playbook_entries_is_highlight ON playbook_entries(is_highlight);
CREATE INDEX idx_playbook_entries_created_at ON playbook_entries(created_at);
CREATE INDEX idx_playbook_entries_mood ON playbook_entries(mood);
CREATE INDEX idx_playbook_entries_tags ON playbook_entries USING GIN(tags);
CREATE INDEX idx_playbook_entries_insights ON playbook_entries USING GIN(insights);
CREATE INDEX idx_playbook_entries_metadata ON playbook_entries USING GIN(metadata);
CREATE INDEX idx_playbook_entries_pinecone_id ON playbook_entries(pinecone_id);
CREATE INDEX idx_playbook_entries_content_text ON playbook_entries USING GIN(to_tsvector('english', title || ' ' || content));

-- User insights table (analytics and progress metrics)
CREATE TABLE user_insights (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(255) NOT NULL UNIQUE,
    overall_mood VARCHAR(100) NULL,
    growth_areas TEXT[] DEFAULT '{}',
    strengths TEXT[] DEFAULT '{}',
    recommendations TEXT[] DEFAULT '{}',
    progress_metrics JSONB DEFAULT '{}',
    total_exercises_completed INTEGER DEFAULT 0,
    streak_days INTEGER DEFAULT 0,
    last_exercise_date TIMESTAMP WITH TIME ZONE NULL,
    ai_analysis JSONB DEFAULT '{}',
    personality_profile JSONB DEFAULT '{}',
    avatar_context JSONB DEFAULT '{}', -- Context for avatar interactions
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for user insights
CREATE INDEX idx_user_insights_user_id ON user_insights(user_id);
CREATE INDEX idx_user_insights_last_exercise_date ON user_insights(last_exercise_date);
CREATE INDEX idx_user_insights_growth_areas ON user_insights USING GIN(growth_areas);
CREATE INDEX idx_user_insights_strengths ON user_insights USING GIN(strengths);
CREATE INDEX idx_user_insights_progress_metrics ON user_insights USING GIN(progress_metrics);
CREATE INDEX idx_user_insights_ai_analysis ON user_insights USING GIN(ai_analysis);

-- User sessions table (tracking user engagement)
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(255) NOT NULL,
    session_type VARCHAR(50) NOT NULL CHECK (session_type IN ('exercise', 'reflection', 'goal_setting', 'review', 'avatar_chat')),
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NULL,
    duration_seconds INTEGER NULL,
    exercise_ids UUID[] DEFAULT '{}',
    mood VARCHAR(100) NULL,
    notes TEXT NULL,
    completion_status VARCHAR(50) DEFAULT 'started' CHECK (completion_status IN ('started', 'completed', 'paused', 'abandoned')),
    avatar_interactions INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for user sessions
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_session_type ON user_sessions(session_type);
CREATE INDEX idx_user_sessions_start_time ON user_sessions(start_time);
CREATE INDEX idx_user_sessions_completion_status ON user_sessions(completion_status);
CREATE INDEX idx_user_sessions_exercise_ids ON user_sessions USING GIN(exercise_ids);
CREATE INDEX idx_user_sessions_metadata ON user_sessions USING GIN(metadata);

-- User progress table (detailed progress tracking per exercise)
CREATE TABLE user_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(255) NOT NULL,
    exercise_id UUID NOT NULL,
    completion_count INTEGER DEFAULT 0,
    last_completed_at TIMESTAMP WITH TIME ZONE NULL,
    average_completion_time_seconds INTEGER NULL,
    average_mood_rating DECIMAL(3,2) NULL,
    best_streak INTEGER DEFAULT 0,
    current_streak INTEGER DEFAULT 0,
    total_time_spent_seconds INTEGER DEFAULT 0,
    insights TEXT[] DEFAULT '{}',
    ai_recommendations JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, exercise_id)
);

-- Create indexes for user progress
CREATE INDEX idx_user_progress_user_id ON user_progress(user_id);
CREATE INDEX idx_user_progress_exercise_id ON user_progress(exercise_id);
CREATE INDEX idx_user_progress_last_completed_at ON user_progress(last_completed_at);
CREATE INDEX idx_user_progress_completion_count ON user_progress(completion_count);
CREATE INDEX idx_user_progress_insights ON user_progress USING GIN(insights);
CREATE INDEX idx_user_progress_ai_recommendations ON user_progress USING GIN(ai_recommendations);

-- Avatar interactions table (for tracking avatar conversations)
CREATE TABLE avatar_interactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(255) NOT NULL,
    session_id UUID NULL,
    user_message TEXT NOT NULL,
    avatar_response TEXT NOT NULL,
    context_used JSONB DEFAULT '{}',
    pinecone_query_ids TEXT[] DEFAULT '{}', -- IDs of Pinecone results used for context
    interaction_type VARCHAR(50) DEFAULT 'chat',
    sentiment_score DECIMAL(3,2) NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for avatar interactions
CREATE INDEX idx_avatar_interactions_user_id ON avatar_interactions(user_id);
CREATE INDEX idx_avatar_interactions_session_id ON avatar_interactions(session_id);
CREATE INDEX idx_avatar_interactions_created_at ON avatar_interactions(created_at);
CREATE INDEX idx_avatar_interactions_interaction_type ON avatar_interactions(interaction_type);
CREATE INDEX idx_avatar_interactions_context_used ON avatar_interactions USING GIN(context_used);

-- Add foreign key constraints
ALTER TABLE media_assets 
ADD CONSTRAINT fk_media_assets_exercise 
FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE SET NULL;

ALTER TABLE media_assets 
ADD CONSTRAINT fk_media_assets_exercise_response 
FOREIGN KEY (exercise_response_id) REFERENCES exercise_responses(id) ON DELETE CASCADE;

ALTER TABLE media_assets 
ADD CONSTRAINT fk_media_assets_playbook_entry 
FOREIGN KEY (playbook_entry_id) REFERENCES playbook_entries(id) ON DELETE CASCADE;

ALTER TABLE exercise_responses 
ADD CONSTRAINT fk_exercise_responses_exercise 
FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE CASCADE;

ALTER TABLE playbook_entries 
ADD CONSTRAINT fk_playbook_entries_exercise_response 
FOREIGN KEY (exercise_response_id) REFERENCES exercise_responses(id) ON DELETE SET NULL;

ALTER TABLE user_progress 
ADD CONSTRAINT fk_user_progress_exercise 
FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE CASCADE;

ALTER TABLE avatar_interactions 
ADD CONSTRAINT fk_avatar_interactions_session 
FOREIGN KEY (session_id) REFERENCES user_sessions(id) ON DELETE SET NULL;

-- Insert default exercises
INSERT INTO exercises (id, title, description, category, question, prompt_type, display_order, estimated_time_minutes, metadata) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Daily Gratitude Reflection', 'Reflect on three things you are grateful for today and why they matter to you.', 'gratitude', 'What are three things you are grateful for today, and how do they make you feel?', 'text', 1, 5, '{"difficulty": "easy", "focus_area": "mindfulness"}'),
('550e8400-e29b-41d4-a716-446655440002', 'Future Vision Exercise', 'Visualize and describe your ideal life 5 years from now.', 'vision', 'Describe in detail what your life looks like 5 years from now. What have you achieved?', 'text', 2, 15, '{"difficulty": "medium", "focus_area": "goal_setting"}'),
('550e8400-e29b-41d4-a716-446655440003', 'Mindset Check-In', 'Examine your current mindset and identify areas for growth.', 'mindset', 'How would you describe your current mindset? What beliefs are serving you well, and which ones might be holding you back?', 'audio', 3, 10, '{"difficulty": "medium", "focus_area": "self_awareness"}'),
('550e8400-e29b-41d4-a716-446655440004', 'Goal Setting Session', 'Define clear, actionable goals for the next month.', 'goals', 'What are three specific goals you want to achieve in the next 30 days? How will you measure success?', 'text', 4, 20, '{"difficulty": "hard", "focus_area": "planning"}'),
('550e8400-e29b-41d4-a716-446655440005', 'Values Clarification', 'Identify and prioritize your core personal values.', 'reflection', 'What are your top 5 core values? How do these values show up in your daily life and decisions?', 'text', 5, 15, '{"difficulty": "medium", "focus_area": "values"}'),
('550e8400-e29b-41d4-a716-446655440006', 'Stress Response Analysis', 'Examine how you respond to stress and develop better coping strategies.', 'mindset', 'Describe a recent stressful situation. How did you respond? What would you do differently next time?', 'audio', 6, 12, '{"difficulty": "medium", "focus_area": "stress_management"}'),
('550e8400-e29b-41d4-a716-446655440007', 'Success Visualization', 'Visualize achieving your biggest goal and the journey to get there.', 'motivation', 'Imagine you have achieved your biggest goal. What does that moment feel like? What steps did you take to get there?', 'video', 7, 18, '{"difficulty": "hard", "focus_area": "visualization"}'),
('550e8400-e29b-41d4-a716-446655440008', 'Energy Audit', 'Identify what gives you energy and what drains it.', 'reflection', 'What activities, people, or situations give you energy? What drains your energy? How can you optimize your energy?', 'text', 8, 10, '{"difficulty": "easy", "focus_area": "energy_management"}');

-- Create materialized views for analytics and performance
CREATE MATERIALIZED VIEW exercise_completion_stats AS
SELECT 
    e.id as exercise_id,
    e.title,
    e.category,
    COUNT(er.id) as total_completions,
    COUNT(DISTINCT er.user_id) as unique_users,
    AVG(er.completion_time_seconds) as avg_completion_time,
    AVG(er.confidence_rating) as avg_confidence_rating,
    AVG(er.sentiment_score) as avg_sentiment_score,
    MODE() WITHIN GROUP (ORDER BY er.mood) as most_common_mood
FROM exercises e
LEFT JOIN exercise_responses er ON e.id = er.exercise_id
GROUP BY e.id, e.title, e.category;

CREATE MATERIALIZED VIEW user_activity_summary AS
SELECT 
    up.user_id,
    up.first_name,
    up.last_name,
    COUNT(DISTINCT er.exercise_id) as exercises_completed,
    COUNT(er.id) as total_responses,
    MAX(er.created_at) as last_activity,
    AVG(er.confidence_rating) as avg_confidence,
    AVG(er.sentiment_score) as avg_sentiment,
    SUM(er.completion_time_seconds) as total_time_spent,
    array_agg(DISTINCT er.mood) FILTER (WHERE er.mood IS NOT NULL) as moods_used,
    COUNT(ai.id) as total_avatar_interactions
FROM user_profiles up
LEFT JOIN exercise_responses er ON up.user_id = er.user_id
LEFT JOIN avatar_interactions ai ON up.user_id = ai.user_id
GROUP BY up.user_id, up.first_name, up.last_name;

-- Create unique indexes on materialized views
CREATE UNIQUE INDEX idx_exercise_completion_stats_exercise_id ON exercise_completion_stats(exercise_id);
CREATE UNIQUE INDEX idx_user_activity_summary_user_id ON user_activity_summary(user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers to relevant tables
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_exercises_updated_at BEFORE UPDATE ON exercises FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_exercise_responses_updated_at BEFORE UPDATE ON exercise_responses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_playbook_entries_updated_at BEFORE UPDATE ON playbook_entries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_progress_updated_at BEFORE UPDATE ON user_progress FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create refresh function for materialized views
CREATE OR REPLACE FUNCTION refresh_analytics_views()
RETURNS VOID AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY exercise_completion_stats;
    REFRESH MATERIALIZED VIEW CONCURRENTLY user_activity_summary;
END;
$$ LANGUAGE plpgsql;

-- Create functions for analytics
CREATE OR REPLACE FUNCTION get_user_progress_summary(target_user_id VARCHAR)
RETURNS TABLE(
    total_exercises INTEGER,
    completed_exercises INTEGER,
    completion_rate DECIMAL,
    current_streak INTEGER,
    total_time_hours DECIMAL,
    avg_confidence DECIMAL,
    most_common_mood VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*)::INTEGER FROM exercises WHERE is_active = true),
        COUNT(DISTINCT up.exercise_id)::INTEGER,
        ROUND(COUNT(DISTINCT up.exercise_id)::DECIMAL / NULLIF((SELECT COUNT(*) FROM exercises WHERE is_active = true), 0) * 100, 2),
        COALESCE(MAX(up.current_streak), 0)::INTEGER,
        ROUND(COALESCE(SUM(up.total_time_spent_seconds), 0)::DECIMAL / 3600, 2),
        ROUND(AVG(er.confidence_rating), 2),
        MODE() WITHIN GROUP (ORDER BY er.mood)
    FROM user_progress up
    LEFT JOIN exercise_responses er ON up.user_id = er.user_id AND up.exercise_id = er.exercise_id
    WHERE up.user_id = target_user_id;
END;
$$ LANGUAGE plpgsql; 