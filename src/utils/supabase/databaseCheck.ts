
import { supabase } from './client';
import { toast } from 'sonner';

export const checkDatabaseSetup = async (): Promise<boolean> => {
  try {
    // Try to query the users table
    const { data, error } = await supabase
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
      
      if (error.code === '42501') { // Permission denied error code
        toast.error(
          "RLS policy issue detected",
          { 
            description: "Your Supabase Row Level Security policies need to be updated. Please apply the migration script in supabase/migrations folder.",
            duration: 8000
          }
        );
        console.error("RLS policy issue detected. Check the migration script in supabase/migrations folder.");
        return false;
      }
      
      console.error("Error checking database:", error);
      throw error; // Throw error so we don't silently fail
    }
    
    return true;
  } catch (error) {
    console.error("Failed to check database setup:", error);
    throw error; // Throw error rather than silently using mock data
  }
};
