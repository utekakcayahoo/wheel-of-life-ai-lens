
import { createClient } from '@supabase/supabase-js';
import type { WheelData, WheelHistory, Feedback } from '@/context/UserContext';

// Create Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

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
  const { data, error } = await supabase
    .from('users')
    .select('*');
  
  if (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
  
  return data as DbUser[];
};

export const initializeDefaultUsers = async () => {
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
};

// Wheel data functions
export const fetchUserWheelHistory = async (userId: string) => {
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
};

export const saveWheelData = async (userId: string, date: string, wheelData: WheelData) => {
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
};

// Feedback functions
export const fetchUserFeedback = async (userId: string) => {
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
};

export const saveFeedback = async (feedback: Omit<Feedback, "id" | "categories"> & { categories: string[] }) => {
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
};

// Subscribe to real-time updates
export const subscribeToWheelUpdates = (userId: string, callback: () => void) => {
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
};

export const subscribeToFeedbackUpdates = (userId: string, callback: () => void) => {
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
};
