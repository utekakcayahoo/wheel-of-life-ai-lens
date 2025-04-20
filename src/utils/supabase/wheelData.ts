
import { supabase, isSupabaseConfigured } from './client';
import type { DbWheelData } from './types';
import type { WheelData, WheelHistory } from '@/context/UserContext';

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

