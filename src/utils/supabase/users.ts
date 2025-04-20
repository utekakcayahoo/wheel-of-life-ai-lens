
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
        toast.error("Permission denied when fetching users. Check your RLS policies.", {
          description: "Make sure your Supabase RLS policies allow selecting from the users table."
        });
      }
      throw error;
    }
    
    if (data && data.length > 0) {
      console.log('Found users in database:', data.length);
      return data as DbUser[];
    } else {
      console.warn('No users found in database, using mock data');
      return getMockUsers();
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
      console.error('Error checking existing users:', fetchError);
      if (fetchError.code === '42501') {
        toast.error("Permission denied when checking users. Check your RLS policies.", {
          description: "Make sure your Supabase RLS policies allow selecting from the users table."
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
            toast.error("Permission denied when creating users. Check your RLS policies.", {
              description: "Make sure your Supabase RLS policies allow inserting into the users table."
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
      } else {
        toast.warning("Using mock user data", {
          description: "RLS policies prevented database creation but app will function with temporary users."
        });
      }
    } else {
      console.log('Users already exist, skipping initialization');
    }
  } catch (error) {
    console.error('Failed to initialize default users:', error);
    toast.warning("Unable to initialize users in database", {
      description: "Using mock data instead. App will function but changes won't be saved."
    });
  }
};
