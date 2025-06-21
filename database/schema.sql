-- North Playbook Database Schema for Aurora Serverless v2
-- This schema is optimized for relational data with proper foreign keys and indexes

-- User profiles table
CREATE TABLE user_profiles (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL UNIQUE,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_email (email)
);

-- Exercises table (reference data)
CREATE TABLE exercises (
    id VARCHAR(36) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category ENUM('mindset', 'motivation', 'goals', 'reflection', 'gratitude', 'vision') NOT NULL,
    question TEXT NOT NULL,
    prompt_type ENUM('text', 'audio', 'video') NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    display_order INT DEFAULT 0,
    estimated_time_minutes INT DEFAULT 10,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_category (category),
    INDEX idx_active (is_active),
    INDEX idx_order (display_order)
);

-- Media assets table (S3 references)
CREATE TABLE media_assets (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    s3_key VARCHAR(1024) NOT NULL,
    s3_bucket VARCHAR(255) NOT NULL,
    file_name VARCHAR(500) NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(255) NOT NULL,
    exercise_id VARCHAR(36) NULL,
    exercise_response_id VARCHAR(36) NULL,
    playbook_entry_id VARCHAR(36) NULL,
    category VARCHAR(100) NULL,
    tags JSON NULL,
    description TEXT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_accessed_at TIMESTAMP NULL,
    access_count INT DEFAULT 0,
    INDEX idx_user_id (user_id),
    INDEX idx_exercise_id (exercise_id),
    INDEX idx_exercise_response_id (exercise_response_id),
    INDEX idx_playbook_entry_id (playbook_entry_id),
    INDEX idx_category (category),
    INDEX idx_uploaded_at (uploaded_at),
    FULLTEXT idx_description (description)
);

-- Exercise responses table
CREATE TABLE exercise_responses (
    id VARCHAR(36) PRIMARY KEY,
    exercise_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    response_text LONGTEXT NULL,
    audio_s3_key VARCHAR(1024) NULL,
    video_s3_key VARCHAR(1024) NULL,
    image_s3_keys JSON NULL,
    s3_bucket VARCHAR(255) NULL,
    analysis_result JSON NULL,
    insights TEXT NULL,
    mood VARCHAR(100) NULL,
    tags JSON NULL,
    completion_time_seconds INT NULL,
    confidence_rating INT NULL CHECK (confidence_rating BETWEEN 1 AND 10),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_exercise_id (exercise_id),
    INDEX idx_user_id (user_id),
    INDEX idx_user_exercise (user_id, exercise_id),
    INDEX idx_created_at (created_at),
    INDEX idx_mood (mood),
    FULLTEXT idx_response_text (response_text),
    FULLTEXT idx_insights (insights),
    FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES user_profiles(user_id) ON DELETE CASCADE
);

-- Playbook entries table
CREATE TABLE playbook_entries (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    exercise_response_id VARCHAR(36) NULL,
    title VARCHAR(500) NOT NULL,
    content LONGTEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    insights TEXT NULL,
    audio_s3_keys JSON NULL,
    video_s3_keys JSON NULL,
    image_s3_keys JSON NULL,
    document_s3_keys JSON NULL,
    s3_bucket VARCHAR(255) NULL,
    mood VARCHAR(100) NULL,
    tags JSON NULL,
    is_highlight BOOLEAN DEFAULT FALSE,
    view_count INT DEFAULT 0,
    last_viewed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_exercise_response_id (exercise_response_id),
    INDEX idx_category (category),
    INDEX idx_is_highlight (is_highlight),
    INDEX idx_created_at (created_at),
    INDEX idx_mood (mood),
    FULLTEXT idx_title (title),
    FULLTEXT idx_content (content),
    FULLTEXT idx_insights (insights),
    FOREIGN KEY (exercise_response_id) REFERENCES exercise_responses(id) ON DELETE SET NULL,
    FOREIGN KEY (user_id) REFERENCES user_profiles(user_id) ON DELETE CASCADE
);

-- User insights table (analytics and AI-generated insights)
CREATE TABLE user_insights (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL UNIQUE,
    overall_mood VARCHAR(100) NULL,
    growth_areas JSON NULL,
    strengths JSON NULL,
    recommendations JSON NULL,
    progress_metrics JSON NULL,
    total_exercises_completed INT DEFAULT 0,
    streak_days INT DEFAULT 0,
    last_exercise_date TIMESTAMP NULL,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_last_exercise_date (last_exercise_date),
    FOREIGN KEY (user_id) REFERENCES user_profiles(user_id) ON DELETE CASCADE
);

-- User sessions table (tracking user engagement)
CREATE TABLE user_sessions (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    session_type ENUM('exercise', 'reflection', 'goal_setting', 'review') NOT NULL,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NULL,
    duration_seconds INT NULL,
    exercise_ids JSON NULL,
    mood VARCHAR(100) NULL,
    notes TEXT NULL,
    completion_status ENUM('started', 'completed', 'paused', 'abandoned') DEFAULT 'started',
    metadata JSON NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_session_type (session_type),
    INDEX idx_start_time (start_time),
    INDEX idx_completion_status (completion_status),
    FOREIGN KEY (user_id) REFERENCES user_profiles(user_id) ON DELETE CASCADE
);

-- User progress table (detailed progress tracking per exercise)
CREATE TABLE user_progress (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    exercise_id VARCHAR(36) NOT NULL,
    completion_count INT DEFAULT 0,
    last_completed_at TIMESTAMP NULL,
    average_completion_time_seconds INT NULL,
    average_mood_rating DECIMAL(3,2) NULL,
    best_streak INT DEFAULT 0,
    current_streak INT DEFAULT 0,
    total_time_spent_seconds INT DEFAULT 0,
    insights JSON NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_user_exercise (user_id, exercise_id),
    INDEX idx_user_id (user_id),
    INDEX idx_exercise_id (exercise_id),
    INDEX idx_last_completed_at (last_completed_at),
    INDEX idx_completion_count (completion_count),
    FOREIGN KEY (user_id) REFERENCES user_profiles(user_id) ON DELETE CASCADE,
    FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE CASCADE
);

-- Add foreign key constraints for media assets
ALTER TABLE media_assets 
ADD CONSTRAINT fk_media_exercise 
FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE SET NULL;

ALTER TABLE media_assets 
ADD CONSTRAINT fk_media_exercise_response 
FOREIGN KEY (exercise_response_id) REFERENCES exercise_responses(id) ON DELETE CASCADE;

ALTER TABLE media_assets 
ADD CONSTRAINT fk_media_playbook_entry 
FOREIGN KEY (playbook_entry_id) REFERENCES playbook_entries(id) ON DELETE CASCADE;

ALTER TABLE media_assets 
ADD CONSTRAINT fk_media_user 
FOREIGN KEY (user_id) REFERENCES user_profiles(user_id) ON DELETE CASCADE;

-- Insert default exercises
INSERT INTO exercises (id, title, description, category, question, prompt_type, display_order, estimated_time_minutes) VALUES
('1', 'Daily Gratitude Reflection', 'Reflect on three things you are grateful for today and why they matter to you.', 'gratitude', 'What are three things you are grateful for today, and how do they make you feel?', 'text', 1, 5),
('2', 'Future Vision Exercise', 'Visualize and describe your ideal life 5 years from now.', 'vision', 'Describe in detail what your life looks like 5 years from now. What have you achieved?', 'text', 2, 15),
('3', 'Mindset Check-In', 'Examine your current mindset and identify areas for growth.', 'mindset', 'How would you describe your current mindset? What beliefs are serving you well, and which ones might be holding you back?', 'audio', 3, 10),
('4', 'Goal Setting Session', 'Define clear, actionable goals for the next month.', 'goals', 'What are three specific goals you want to achieve in the next 30 days? How will you measure success?', 'text', 4, 20),
('5', 'Values Clarification', 'Identify and prioritize your core personal values.', 'reflection', 'What are your top 5 core values? How do these values show up in your daily life and decisions?', 'text', 5, 15),
('6', 'Stress Response Analysis', 'Examine how you respond to stress and develop better coping strategies.', 'mindset', 'Describe a recent stressful situation. How did you respond? What would you do differently next time?', 'audio', 6, 12),
('7', 'Success Visualization', 'Visualize achieving your biggest goal and the journey to get there.', 'motivation', 'Imagine you have achieved your biggest goal. What does that moment feel like? What steps did you take to get there?', 'video', 7, 18),
('8', 'Energy Audit', 'Identify what gives you energy and what drains it.', 'reflection', 'What activities, people, or situations give you energy? What drains your energy? How can you optimize your energy?', 'text', 8, 10);

-- Create views for common queries
CREATE VIEW exercise_completion_stats AS
SELECT 
    e.id as exercise_id,
    e.title,
    e.category,
    COUNT(er.id) as total_completions,
    COUNT(DISTINCT er.user_id) as unique_users,
    AVG(er.completion_time_seconds) as avg_completion_time,
    AVG(er.confidence_rating) as avg_confidence_rating
FROM exercises e
LEFT JOIN exercise_responses er ON e.id = er.exercise_id
GROUP BY e.id, e.title, e.category;

CREATE VIEW user_activity_summary AS
SELECT 
    up.user_id,
    up.first_name,
    up.last_name,
    COUNT(DISTINCT er.exercise_id) as exercises_completed,
    COUNT(er.id) as total_responses,
    MAX(er.created_at) as last_activity,
    AVG(er.confidence_rating) as avg_confidence,
    SUM(er.completion_time_seconds) as total_time_spent
FROM user_profiles up
LEFT JOIN exercise_responses er ON up.user_id = er.user_id
GROUP BY up.user_id, up.first_name, up.last_name;

-- Indexes for better query performance
CREATE INDEX idx_exercise_responses_created_date ON exercise_responses (DATE(created_at));
CREATE INDEX idx_playbook_entries_created_date ON playbook_entries (DATE(created_at));
CREATE INDEX idx_media_assets_file_type ON media_assets (file_type);
CREATE INDEX idx_user_sessions_duration ON user_sessions (duration_seconds);

-- Full-text search indexes for content discovery
ALTER TABLE exercise_responses ADD FULLTEXT(response_text, insights);
ALTER TABLE playbook_entries ADD FULLTEXT(title, content, insights);
ALTER TABLE media_assets ADD FULLTEXT(file_name, description); 