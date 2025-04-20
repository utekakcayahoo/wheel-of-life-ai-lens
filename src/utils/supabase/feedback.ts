import { supabase } from './client';
import type { Feedback } from '@/types/userTypes';

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
