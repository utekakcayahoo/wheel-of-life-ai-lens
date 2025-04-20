
import { supabase, isSupabaseConfigured } from './client';
import type { DbUser } from './types';
import { toast } from 'sonner';

export const fetchUsers = async () => {
  try {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase not configured');
    }
    
    const { data, error } = await supabase
      .from('users')
      .select('*');
    
    if (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
    
    return data as DbUser[];
  } catch (error) {
    console.warn('Failed to fetch users from Supabase. Using mock data:', error);
    // Return mock data if Supabase is not connected
    return [
      { id: '1', username: 'Joe' },
      { id: '2', username: 'Mike' },
      { id: '3', username: 'Emma' }
    ] as DbUser[];
  }
};

export const initializeDefaultUsers = async () => {
  try {
    if (!isSupabaseConfigured) {
      console.warn('Supabase not configured, skipping user initialization');
      return;
    }
    
    // First check if users already exist
    const { data: existingUsers, error: fetchError } = await supabase
      .from('users')
      .select('*');
      
    if (fetchError) {
      console.error('Error checking existing users:', fetchError);
      throw fetchError;
    }
    
    // Only add default users if no users exist
    if (!existingUsers || existingUsers.length === 0) {
      console.log('No users found, initializing default users');
      const defaultUsers = [
        { id: '1', username: 'Joe' },
        { id: '2', username: 'Mike' },
        { id: '3', username: 'Emma' }
      ];
      
      for (const user of defaultUsers) {
        const { error } = await supabase
          .from('users')
          .upsert(user, { onConflict: 'id' });
        
        if (error) {
          console.error(`Error initializing user ${user.username}:`, error);
          if (error.code === '42501') {
            toast.error("Permission denied when creating users. Check your RLS policies.", {
              description: "Make sure your Supabase RLS policies allow inserting into the users table."
            });
          }
        } else {
          console.log(`User ${user.username} successfully initialized`);
        }
      }
      
      toast.success("Default users initialized", {
        description: "Joe, Mike, and Emma are ready to use!"
      });
    } else {
      console.log('Users already exist, skipping initialization');
    }
  } catch (error) {
    console.error('Failed to initialize default users:', error);
    toast.error("Failed to initialize default users", {
      description: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
};
