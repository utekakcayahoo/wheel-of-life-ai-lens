
import { supabase } from './client';
import { toast } from 'sonner';

export const checkDatabaseSetup = async (): Promise<boolean> => {
  try {
    // Try to query the users table
    const { error } = await supabase
      .from('users')
      .select('count')
      .limit(1)
      .single();
    
    if (error) {
      if (error.code === '42P01') { // Table doesn't exist error code
        toast.error(
          "Supabase tables not found. Please run the migration script in supabase/migrations folder.",
          { duration: 10000 }
        );
        console.error("Database tables not set up. Please run the migration in supabase/migrations folder.");
        return false;
      }
      
      console.error("Error checking database:", error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Failed to check database setup:", error);
    return false;
  }
};
