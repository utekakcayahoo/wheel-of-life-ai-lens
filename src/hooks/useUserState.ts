
import { useState, useEffect } from 'react';
import { User, WheelData } from '@/types/userTypes';
import {
  fetchUsers,
  fetchUserWheelHistory,
  fetchUserFeedback,
  subscribeToWheelUpdates,
  subscribeToFeedbackUpdates,
  saveWheelData
} from '@/utils/supabase';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { checkDatabaseSetup } from '@/utils/supabase/databaseCheck';

export const useUserState = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [usingMockData, setUsingMockData] = useState<boolean>(false);
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
      setIsLoading(true);
      
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
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const initializeUsers = async () => {
    try {
      setIsLoading(true);
      
      // Check database setup
      try {
        await checkDatabaseSetup();
      } catch (error) {
        console.error("Database setup check failed:", error);
        throw error;
      }
            
      try {
        const usersData = await fetchUsers();
        
        if (usersData.length === 0) {
          console.error("No users found in database.");
          throw new Error("No users found in database");
        }
        
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
              throw new Error(`Failed to load user data for ${user.username}`);
            }
          })
        );
        
        setUsers(formattedUsers);
        setUsingMockData(false);
      } catch (error) {
        console.error("Error fetching users:", error);
        throw error;
      }
    } catch (error) {
      console.error("Error initializing users:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (userId: string) => {
    setIsLoading(true);
    try {
      const user = users.find(u => u.id === userId);
      
      if (!user) {
        throw new Error(`User with ID ${userId} not found`);
      }
      
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
        
        try {
          await saveWheelData(userId, today, mostRecentData);
          user.wheelHistory[today] = mostRecentData;
        } catch (error) {
          console.error("Error saving wheel data for today:", error);
          throw new Error("Failed to initialize today's wheel data");
        }
      }
      
      setCurrentUser(user);
    } catch (error) {
      console.error("Error during login:", error);
      toast.error("Failed to log in. Please try again.");
      throw error;
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
    initializeUsers().catch(error => {
      console.error("Failed to initialize users:", error);
      toast.error("Failed to load user data. Please check your database connection.");
    });
    
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
    usingMockData,
    login,
    logout,
    refreshUserData
  };
};
