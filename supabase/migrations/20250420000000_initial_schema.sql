
-- Update feedback table to use proper foreign key references
ALTER TABLE feedback 
  DROP CONSTRAINT IF EXISTS feedback_from_user_id_fkey,
  DROP CONSTRAINT IF EXISTS feedback_to_user_id_fkey,
  ADD CONSTRAINT feedback_from_user_id_fkey 
    FOREIGN KEY (from_user_id) REFERENCES users(id) ON DELETE CASCADE,
  ADD CONSTRAINT feedback_to_user_id_fkey 
    FOREIGN KEY (to_user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Add RLS policies for the users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anonymous select on users table
DROP POLICY IF EXISTS users_select_policy ON users;
CREATE POLICY users_select_policy ON users
  FOR SELECT USING (true);

-- Create policy to allow anonymous insert on users table
DROP POLICY IF EXISTS users_insert_policy ON users;
CREATE POLICY users_insert_policy ON users
  FOR INSERT WITH CHECK (true);

-- Create policy to allow anonymous update on users table
DROP POLICY IF EXISTS users_update_policy ON users;
CREATE POLICY users_update_policy ON users
  FOR UPDATE USING (true);

-- Create policy to allow anonymous delete on users table
DROP POLICY IF EXISTS users_delete_policy ON users;
CREATE POLICY users_delete_policy ON users
  FOR DELETE USING (true);

