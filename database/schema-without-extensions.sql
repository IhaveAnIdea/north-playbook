-- North Playbook PostgreSQL Schema (without extension creation)
-- Run this AFTER creating extensions manually

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
    pinecone_id VARCHAR(255) NULL,
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
    pinecone_id VARCHAR(255) NULL,
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

-- User progress table
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

-- User insights table
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
    avatar_context JSONB DEFAULT '{}',
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for user insights
CREATE INDEX idx_user_insights_user_id ON user_insights(user_id);
CREATE INDEX idx_user_insights_last_exercise_date ON user_insights(last_exercise_date);

-- Avatar interactions table
CREATE TABLE avatar_interactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(255) NOT NULL,
    session_id VARCHAR(255) NULL,
    user_message TEXT NOT NULL,
    avatar_response TEXT NOT NULL,
    context_used JSONB DEFAULT '{}',
    pinecone_query_ids TEXT[] DEFAULT '{}',
    interaction_type VARCHAR(100) NOT NULL,
    sentiment_score DECIMAL(3,2) NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for avatar interactions
CREATE INDEX idx_avatar_interactions_user_id ON avatar_interactions(user_id);
CREATE INDEX idx_avatar_interactions_session_id ON avatar_interactions(session_id);
CREATE INDEX idx_avatar_interactions_created_at ON avatar_interactions(created_at);

-- User sessions table
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

-- Add foreign key constraints
ALTER TABLE exercise_responses ADD CONSTRAINT fk_exercise_responses_exercise_id FOREIGN KEY (exercise_id) REFERENCES exercises(id);
ALTER TABLE playbook_entries ADD CONSTRAINT fk_playbook_entries_exercise_response_id FOREIGN KEY (exercise_response_id) REFERENCES exercise_responses(id);
ALTER TABLE user_progress ADD CONSTRAINT fk_user_progress_exercise_id FOREIGN KEY (exercise_id) REFERENCES exercises(id);

-- Create triggers for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = CURRENT_TIMESTAMP;
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_exercises_updated_at BEFORE UPDATE ON exercises FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_exercise_responses_updated_at BEFORE UPDATE ON exercise_responses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_playbook_entries_updated_at BEFORE UPDATE ON playbook_entries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_progress_updated_at BEFORE UPDATE ON user_progress FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample exercises
INSERT INTO exercises (id, title, description, category, question, prompt_type, is_active, display_order, estimated_time_minutes) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Daily Gratitude Reflection', 'Reflect on three things you are grateful for today and why they matter to you.', 'gratitude', 'What are three things you are grateful for today, and how do they make you feel?', 'text', true, 1, 5),
('550e8400-e29b-41d4-a716-446655440002', 'Future Vision Exercise', 'Visualize and describe your ideal life 5 years from now.', 'vision', 'Describe in detail what your life looks like 5 years from now. What have you achieved?', 'text', true, 2, 15),
('550e8400-e29b-41d4-a716-446655440003', 'Mindset Check-In', 'Examine your current mindset and identify areas for growth.', 'mindset', 'How would you describe your current mindset? What beliefs are serving you well, and which ones might be holding you back?', 'audio', true, 3, 10),
('550e8400-e29b-41d4-a716-446655440004', 'Goal Setting Session', 'Define and structure your most important goals.', 'goals', 'What is one major goal you want to achieve in the next 90 days? Break it down into actionable steps.', 'text', true, 4, 20),
('550e8400-e29b-41d4-a716-446655440005', 'Weekly Reflection', 'Look back on your week and extract key insights.', 'reflection', 'What were the biggest wins and challenges from this week? What would you do differently?', 'video', true, 5, 12);

-- Verify tables were created
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name; 