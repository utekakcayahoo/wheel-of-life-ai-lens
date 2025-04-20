
-- Create the wheel_categories table
CREATE TABLE IF NOT EXISTS wheel_categories (
  name TEXT PRIMARY KEY
);

-- Create the users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create the wheel_data table
CREATE TABLE IF NOT EXISTS wheel_data (
  id TEXT PRIMARY KEY, -- Format: user_id_date
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date TEXT NOT NULL, -- Format: YYYY-MM-DD
  data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(user_id, date)
);

-- Create the feedback table
CREATE TABLE IF NOT EXISTS feedback (
  id TEXT PRIMARY KEY,
  from_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  to_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  date TEXT NOT NULL, -- Format: YYYY-MM-DD
  categories TEXT[] NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create the secrets table for storing API keys
CREATE TABLE IF NOT EXISTS secrets (
  name TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create RLS policies
ALTER TABLE wheel_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE wheel_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE secrets ENABLE ROW LEVEL SECURITY;

-- Allow public read access to wheel_categories
CREATE POLICY "Public read access for wheel_categories" ON wheel_categories
  FOR SELECT USING (true);

-- Allow public read access to users
CREATE POLICY "Public read access for users" ON users
  FOR SELECT USING (true);

-- Allow authenticated users to read wheel_data
CREATE POLICY "Authenticated read access for wheel_data" ON wheel_data
  FOR SELECT USING (auth.role() = 'authenticated');

-- Allow authenticated users to insert and update their own wheel_data
CREATE POLICY "Authenticated write access for wheel_data" ON wheel_data
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated update access for wheel_data" ON wheel_data
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Allow authenticated users to read feedback
CREATE POLICY "Authenticated read access for feedback" ON feedback
  FOR SELECT USING (auth.role() = 'authenticated');

-- Allow authenticated users to insert feedback
CREATE POLICY "Authenticated write access for feedback" ON feedback
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Only allow service_role to access secrets
CREATE POLICY "Service role read access for secrets" ON secrets
  FOR SELECT USING (auth.jwt() ->> 'role' = 'service_role');

-- Insert default wheel categories
INSERT INTO wheel_categories (name)
VALUES 
  ('Career'),
  ('Relationships'),
  ('Personal Growth'),
  ('Physical Health'),
  ('Finance'),
  ('Mental Health')
ON CONFLICT (name) DO NOTHING;

-- Add OpenAI secret placeholder (to be updated in the dashboard)
INSERT INTO secrets (name, value)
VALUES ('OPENAI_API_KEY', 'your_openai_api_key')
ON CONFLICT (name) DO UPDATE SET 
  value = EXCLUDED.value,
  updated_at = TIMEZONE('utc', NOW());
