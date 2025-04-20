
import { supabase, isSupabaseConfigured } from './client';
import type { DbUser } from './types';

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
      }
    }
  } catch (error) {
    console.error('Failed to initialize default users:', error);
    // Silently fail if Supabase is not properly connected
  }
};

