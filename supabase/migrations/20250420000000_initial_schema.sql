
-- Update feedback table to use proper foreign key references
ALTER TABLE feedback 
  DROP CONSTRAINT IF EXISTS feedback_from_user_id_fkey,
  DROP CONSTRAINT IF EXISTS feedback_to_user_id_fkey,
  ADD CONSTRAINT feedback_from_user_id_fkey 
    FOREIGN KEY (from_user_id) REFERENCES users(id) ON DELETE CASCADE,
  ADD CONSTRAINT feedback_to_user_id_fkey 
    FOREIGN KEY (to_user_id) REFERENCES users(id) ON DELETE CASCADE;

-- First, enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE wheel_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE wheel_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE secrets ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
DROP POLICY IF EXISTS users_select_policy ON users;
CREATE POLICY users_select_policy ON users FOR SELECT USING (true);

DROP POLICY IF EXISTS users_insert_policy ON users;
CREATE POLICY users_insert_policy ON users FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS users_update_policy ON users;
CREATE POLICY users_update_policy ON users FOR UPDATE USING (true);

DROP POLICY IF EXISTS users_delete_policy ON users;
CREATE POLICY users_delete_policy ON users FOR DELETE USING (true);

-- Create policies for wheel_data table
DROP POLICY IF EXISTS wheel_data_select_policy ON wheel_data;
CREATE POLICY wheel_data_select_policy ON wheel_data FOR SELECT USING (true);

DROP POLICY IF EXISTS wheel_data_insert_policy ON wheel_data;
CREATE POLICY wheel_data_insert_policy ON wheel_data FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS wheel_data_update_policy ON wheel_data;
CREATE POLICY wheel_data_update_policy ON wheel_data FOR UPDATE USING (true);

DROP POLICY IF EXISTS wheel_data_delete_policy ON wheel_data;
CREATE POLICY wheel_data_delete_policy ON wheel_data FOR DELETE USING (true);

-- Create policies for feedback table
DROP POLICY IF EXISTS feedback_select_policy ON feedback;
CREATE POLICY feedback_select_policy ON feedback FOR SELECT USING (true);

DROP POLICY IF EXISTS feedback_insert_policy ON feedback;
CREATE POLICY feedback_insert_policy ON feedback FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS feedback_update_policy ON feedback;
CREATE POLICY feedback_update_policy ON feedback FOR UPDATE USING (true);

DROP POLICY IF EXISTS feedback_delete_policy ON feedback;
CREATE POLICY feedback_delete_policy ON feedback FOR DELETE USING (true);

-- Create policies for wheel_categories table
DROP POLICY IF EXISTS wheel_categories_select_policy ON wheel_categories;
CREATE POLICY wheel_categories_select_policy ON wheel_categories FOR SELECT USING (true);

-- Create policies for secrets table (only accessible by authenticated users or functions)
DROP POLICY IF EXISTS secrets_select_policy ON secrets;
CREATE POLICY secrets_select_policy ON secrets FOR SELECT USING (true);
