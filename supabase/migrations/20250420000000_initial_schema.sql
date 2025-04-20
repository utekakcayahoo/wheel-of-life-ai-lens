
-- Update feedback table to use proper foreign key references
ALTER TABLE feedback 
  DROP CONSTRAINT IF EXISTS feedback_from_user_id_fkey,
  DROP CONSTRAINT IF EXISTS feedback_to_user_id_fkey,
  ADD CONSTRAINT feedback_from_user_id_fkey 
    FOREIGN KEY (from_user_id) REFERENCES users(id) ON DELETE CASCADE,
  ADD CONSTRAINT feedback_to_user_id_fkey 
    FOREIGN KEY (to_user_id) REFERENCES users(id) ON DELETE CASCADE;
