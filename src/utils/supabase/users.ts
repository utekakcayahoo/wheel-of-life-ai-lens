
import { supabase, isSupabaseConfigured } from './client';
import type { DbUser } from './types';
import { toast } from 'sonner';

export const fetchUsers = async () => {
  try {
    if (!isSupabaseConfigured) {
      console.warn('Supabase not configured, using mock data');
      throw new Error('Supabase not configured');
    }
    
    const { data, error } = await supabase
      .from('users')
      .select('*');
    
    if (error) {
      console.error('Error fetching users:', error);
      if (error.code === '42501') {
        toast.error("Permission denied when fetching users.", {
          description: "Please apply the migration script in supabase/migrations folder to update RLS policies."
        });
      }
      throw error;
    }
    
    if (data && data.length > 0) {
      console.log('Found users in database:', data.length);
      return data as DbUser[];
    } else {
      console.log('No users found in database. Initializing default users...');
      await initializeDefaultUsers();
      // Try fetching again after initialization
      const { data: refreshedData, error: refreshError } = await supabase
        .from('users')
        .select('*');
        
      if (refreshError || !refreshedData || refreshedData.length === 0) {
        console.warn('Still no users found after initialization, using mock data');
        return getMockUsers();
      }
      
      return refreshedData as DbUser[];
    }
  } catch (error) {
    console.warn('Failed to fetch users from Supabase. Using mock data:', error);
    return getMockUsers();
  }
};

// Extract mock users to a separate function for reuse
const getMockUsers = (): DbUser[] => {
  return [
    { id: '1', username: 'Joe' },
    { id: '2', username: 'Mike' },
    { id: '3', username: 'Emma' }
  ];
};

export const initializeDefaultUsers = async () => {
  try {
    if (!isSupabaseConfigured) {
      console.warn('Supabase not configured, skipping user initialization');
      toast.warning("Supabase not configured", {
        description: "Using mock user data instead. Connect to Supabase to enable persistence."
      });
      return;
    }
    
    // First check if users already exist
    const { data: existingUsers, error: fetchError } = await supabase
      .from('users')
      .select('*');
      
    if (fetchError) {
      if (fetchError.code === '42501') { // Permission denied error
        toast.error("Permission denied when checking users.", {
          description: "Please apply the migration script in supabase/migrations folder to update RLS policies."
        });
      } else {
        console.error('Error checking existing users:', fetchError);
        toast.error("Error checking existing users", {
          description: "Could not verify if users exist in the database."
        });
      }
      throw fetchError;
    }
    
    // Only add default users if no users exist
    if (!existingUsers || existingUsers.length === 0) {
      console.log('No users found, initializing default users');
      const defaultUsers = getMockUsers();
      
      let hasInsertError = false;
      
      for (const user of defaultUsers) {
        const { error } = await supabase
          .from('users')
          .upsert(user, { onConflict: 'id' });
        
        if (error) {
          console.error(`Error initializing user ${user.username}:`, error);
          hasInsertError = true;
          if (error.code === '42501') {
            toast.error("Permission denied when creating users.", {
              description: "Please apply the migration script in supabase/migrations folder to update RLS policies."
            });
          }
        } else {
          console.log(`User ${user.username} successfully initialized`);
        }
      }
      
      if (!hasInsertError) {
        toast.success("Default users initialized", {
          description: "Joe, Mike, and Emma are ready to use!"
        });
      }
    } else {
      console.log('Users already exist, skipping initialization');
    }
  } catch (error) {
    console.error('Failed to initialize default users:', error);
    toast.error("Unable to initialize users in database", {
      description: "Please make sure your Supabase instance is properly configured."
    });
    throw error;
  }
};
