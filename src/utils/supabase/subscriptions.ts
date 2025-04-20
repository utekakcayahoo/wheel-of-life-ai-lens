
import { supabase } from './client';

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

