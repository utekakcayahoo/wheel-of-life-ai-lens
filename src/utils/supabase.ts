
import { createClient } from '@supabase/supabase-js';
import type { WheelData, WheelHistory, Feedback } from '@/context/UserContext';

// Create Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Check if the Supabase URL is available
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase URL or Anonymous Key is missing. Please make sure they are set in the environment variables.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export type DbUser = {
  id: string;
  username: string;
  created_at?: string;
};

export type DbWheelData = {
  id: string;
  user_id: string;
  date: string;
  data: WheelData;
  created_at?: string;
};

export type DbFeedback = {
  id: string;
  from_user_id: string;
  to_user_id: string;
  text: string;
  date: string;
  categories: string[];
  created_at?: string;
};

// User related functions
export const fetchUsers = async () => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*');
    
    if (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
    
    return data as DbUser[];
  } catch (error) {
    console.error('Failed to fetch users. Returning mock data:', error);
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

// Wheel data functions
export const fetchUserWheelHistory = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('wheel_data')
      .select('*')
      .eq('user_id', userId);
    
    if (error) {
      console.error('Error fetching wheel history:', error);
      throw error;
    }
    
    // Convert array of wheel data to wheel history format
    const wheelHistory: WheelHistory = {};
    (data as DbWheelData[]).forEach(item => {
      wheelHistory[item.date] = item.data;
    });
    
    return wheelHistory;
  } catch (error) {
    console.error('Failed to fetch wheel history. Returning empty data:', error);
    return {} as WheelHistory;
  }
};

export const saveWheelData = async (userId: string, date: string, wheelData: WheelData) => {
  try {
    const { error } = await supabase
      .from('wheel_data')
      .upsert(
        { 
          id: `${userId}_${date}`, 
          user_id: userId, 
          date, 
          data: wheelData 
        },
        { onConflict: 'id' }
      );
    
    if (error) {
      console.error('Error saving wheel data:', error);
      throw error;
    }
  } catch (error) {
    console.error('Failed to save wheel data:', error);
    // Silently fail if Supabase is not properly connected
  }
};

// Feedback functions
export const fetchUserFeedback = async (userId: string) => {
  try {
    // Fetch feedback received
    const { data: receivedData, error: receivedError } = await supabase
      .from('feedback')
      .select('*, from_user:from_user_id(username)')
      .eq('to_user_id', userId);
    
    if (receivedError) {
      console.error('Error fetching received feedback:', receivedError);
      throw receivedError;
    }
    
    // Fetch feedback given
    const { data: givenData, error: givenError } = await supabase
      .from('feedback')
      .select('*, to_user:to_user_id(username)')
      .eq('from_user_id', userId);
    
    if (givenError) {
      console.error('Error fetching given feedback:', givenError);
      throw givenError;
    }
    
    // Format the feedback received
    const feedbackReceived = receivedData.map(item => ({
      id: item.id,
      from: item.from_user_id,
      to: item.to_user_id,
      text: item.text,
      date: item.date,
      categories: item.categories
    })) as Feedback[];
    
    // Format the feedback given
    const feedbackGiven = givenData.map(item => ({
      id: item.id,
      from: item.from_user_id,
      to: item.to_user_id,
      text: item.text,
      date: item.date,
      categories: item.categories
    })) as Feedback[];
    
    return { feedbackReceived, feedbackGiven };
  } catch (error) {
    console.error('Failed to fetch user feedback. Returning empty data:', error);
    return { feedbackReceived: [], feedbackGiven: [] };
  }
};

export const saveFeedback = async (feedback: Omit<Feedback, "id" | "categories"> & { categories: string[] }) => {
  try {
    const { error } = await supabase
      .from('feedback')
      .insert({
        id: Math.random().toString(36).substring(2, 15),
        from_user_id: feedback.from,
        to_user_id: feedback.to,
        text: feedback.text,
        date: feedback.date,
        categories: feedback.categories
      });
    
    if (error) {
      console.error('Error saving feedback:', error);
      throw error;
    }
  } catch (error) {
    console.error('Failed to save feedback:', error);
    // Silently fail if Supabase is not properly connected
  }
};

// Subscribe to real-time updates
export const subscribeToWheelUpdates = (userId: string, callback: () => void) => {
  try {
    return supabase
      .channel('wheel_updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'wheel_data',
          filter: `user_id=eq.${userId}`
        },
        callback
      )
      .subscribe();
  } catch (error) {
    console.error('Failed to subscribe to wheel updates:', error);
    // Return a dummy channel with an unsubscribe method
    return { unsubscribe: () => {} };
  }
};

export const subscribeToFeedbackUpdates = (userId: string, callback: () => void) => {
  try {
    return supabase
      .channel('feedback_updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'feedback',
          filter: `to_user_id=eq.${userId}`
        },
        callback
      )
      .subscribe();
  } catch (error) {
    console.error('Failed to subscribe to feedback updates:', error);
    // Return a dummy channel with an unsubscribe method
    return { unsubscribe: () => {} };
  }
};
