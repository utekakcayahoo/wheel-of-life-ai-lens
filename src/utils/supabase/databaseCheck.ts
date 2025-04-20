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
      
      if (error.code === '42501') { // Permission denied error code
        toast.warning(
          "RLS policy issue detected",
          { 
            description: "Your Supabase Row Level Security policies are preventing access to the users table. App will use mock data instead.",
            duration: 8000
          }
        );
        console.error("RLS policy issue detected. Check your Supabase policies for the users table.");
        // Return true so the app keeps functioning with mock data
        return true;
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
