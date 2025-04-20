
import { useState, useEffect } from 'react';
import { User, WheelData } from '@/types/userTypes';
import {
  fetchUsers,
  fetchUserWheelHistory,
  fetchUserFeedback,
  subscribeToWheelUpdates,
  subscribeToFeedbackUpdates,
  initializeDefaultUsers,
  saveWheelData
} from '@/utils/supabase';
import { format } from 'date-fns';
import { toast } from 'sonner';

export const useUserState = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [wheelChannel, setWheelChannel] = useState<any>(null);
  const [feedbackChannel, setFeedbackChannel] = useState<any>(null);

  const getEmptyWheelData = (): WheelData => {
    const emptyData: WheelData = {};
    ['Career', 'Relationships', 'Personal Growth', 'Physical Health', 'Finance', 'Mental Health']
      .forEach(category => {
        emptyData[category] = 5;
      });
    return emptyData;
  };

  const refreshUserData = async (userId: string) => {
    try {
      const wheelHistory = await fetchUserWheelHistory(userId);
      const { feedbackReceived, feedbackGiven } = await fetchUserFeedback(userId);
      
      setUsers(prevUsers => 
        prevUsers.map(u => {
          if (u.id === userId) {
            return { ...u, wheelHistory, feedbackReceived, feedbackGiven };
          }
          return u;
        })
      );
      
      setCurrentUser(prevUser => {
        if (prevUser?.id === userId) {
          return { ...prevUser, wheelHistory, feedbackReceived, feedbackGiven };
        }
        return prevUser;
      });
    } catch (error) {
      console.error("Error refreshing user data:", error);
    }
  };

  const initializeUsers = async () => {
    try {
      setIsLoading(true);
      await initializeDefaultUsers();
      const usersData = await fetchUsers();
      
      const formattedUsers = await Promise.all(
        usersData.map(async (user) => {
          try {
            const wheelHistory = await fetchUserWheelHistory(user.id);
            const { feedbackReceived, feedbackGiven } = await fetchUserFeedback(user.id);
            
            return {
              id: user.id,
              username: user.username,
              wheelHistory,
              feedbackReceived,
              feedbackGiven
            };
          } catch (error) {
            console.error(`Error fetching data for user ${user.username}:`, error);
            return {
              id: user.id,
              username: user.username,
              wheelHistory: {},
              feedbackReceived: [],
              feedbackGiven: []
            };
          }
        })
      );
      
      setUsers(formattedUsers);
    } catch (error) {
      console.error("Error initializing users:", error);
      toast.error("Error loading user data. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (userId: string) => {
    setIsLoading(true);
    try {
      const user = users.find(u => u.id === userId);
      
      if (user) {
        const wheelUpdates = subscribeToWheelUpdates(userId, () => {
          refreshUserData(userId);
        });
        
        const feedbackUpdates = subscribeToFeedbackUpdates(userId, () => {
          refreshUserData(userId);
        });
        
        setWheelChannel(wheelUpdates);
        setFeedbackChannel(feedbackUpdates);
        
        const today = format(new Date(), "yyyy-MM-dd");
        if (!user.wheelHistory[today]) {
          const dates = Object.keys(user.wheelHistory).sort();
          const mostRecentData = dates.length > 0 
            ? user.wheelHistory[dates[dates.length - 1]] 
            : getEmptyWheelData();
          
          await saveWheelData(userId, today, mostRecentData);
          user.wheelHistory[today] = mostRecentData;
        }
        
        setCurrentUser(user);
      }
    } catch (error) {
      console.error("Error during login:", error);
      toast.error("Failed to log in. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    if (wheelChannel) wheelChannel.unsubscribe();
    if (feedbackChannel) feedbackChannel.unsubscribe();
    setWheelChannel(null);
    setFeedbackChannel(null);
    setCurrentUser(null);
  };

  useEffect(() => {
    initializeUsers();
    return () => {
      if (wheelChannel) wheelChannel.unsubscribe();
      if (feedbackChannel) feedbackChannel.unsubscribe();
    };
  }, []);

  return {
    users,
    setUsers,
    currentUser,
    isLoading,
    login,
    logout,
    refreshUserData
  };
};
