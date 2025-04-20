
import React, { createContext, useContext, useState, useEffect } from "react";
import { format } from "date-fns";
import {
  fetchUsers,
  fetchUserWheelHistory,
  fetchUserFeedback,
  saveWheelData,
  saveFeedback,
  subscribeToWheelUpdates,
  subscribeToFeedbackUpdates,
  initializeDefaultUsers
} from "@/utils/supabase";
import {
  classifyFeedback,
  updateWheelFromFeedback
} from "@/utils/apiUtils";
import { toast } from "sonner";

// Define the wheel of life categories
export const wheelCategories = [
  "Career",
  "Relationships",
  "Personal Growth", 
  "Physical Health",
  "Finance",
  "Mental Health"
];

// Define types for our user data
export interface WheelData {
  [category: string]: number;
}

export interface WheelHistory {
  [date: string]: WheelData;
}

export interface Feedback {
  id: string;
  from: string;
  to: string;
  text: string;
  date: string;
  categories: string[];
}

export interface User {
  id: string;
  username: string;
  wheelHistory: WheelHistory;
  feedbackReceived: Feedback[];
  feedbackGiven: Feedback[];
}

interface UserContextType {
  users: User[];
  currentUser: User | null;
  selectedDate: Date;
  login: (userId: string) => Promise<void>;
  logout: () => void;
  setSelectedDate: (date: Date) => void;
  addFeedback: (feedback: Omit<Feedback, "id" | "categories">) => Promise<void>;
  isLoading: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

// Function to get empty wheel data
const getEmptyWheelData = (): WheelData => {
  const emptyData: WheelData = {};
  wheelCategories.forEach(category => {
    emptyData[category] = 5; // Start with neutral value of 5 (on a scale of 1-10)
  });
  return emptyData;
};

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [wheelChannel, setWheelChannel] = useState<any>(null);
  const [feedbackChannel, setFeedbackChannel] = useState<any>(null);
  
  // Initialize users and subscribe to real-time updates
  useEffect(() => {
    const initializeApp = async () => {
      try {
        setIsLoading(true);
        
        // Create default users if they don't exist
        await initializeDefaultUsers();
        
        // Fetch all users
        const usersData = await fetchUsers();
        
        // Format users with empty initial data
        const formattedUsers = await Promise.all(
          usersData.map(async (user) => {
            try {
              // Fetch wheel history for user
              const wheelHistory = await fetchUserWheelHistory(user.id);
              
              // Fetch feedback for user
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
        console.error("Error initializing app:", error);
        toast.error("Error loading user data. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };
    
    initializeApp();
  }, []);
  
  // Clean up subscriptions when component unmounts
  useEffect(() => {
    return () => {
      if (wheelChannel) wheelChannel.unsubscribe();
      if (feedbackChannel) feedbackChannel.unsubscribe();
    };
  }, [wheelChannel, feedbackChannel]);
  
  const login = async (userId: string) => {
    setIsLoading(true);
    try {
      const user = users.find(u => u.id === userId);
      
      if (user) {
        // Subscribe to real-time updates for this user
        const wheelUpdates = subscribeToWheelUpdates(userId, () => {
          refreshUserData(userId);
        });
        
        const feedbackUpdates = subscribeToFeedbackUpdates(userId, () => {
          refreshUserData(userId);
        });
        
        setWheelChannel(wheelUpdates);
        setFeedbackChannel(feedbackUpdates);
        
        // Check if user has wheel data for today and initialize if needed
        const today = format(new Date(), "yyyy-MM-dd");
        if (!user.wheelHistory[today]) {
          // Find the most recent wheel data or use empty data
          const dates = Object.keys(user.wheelHistory).sort();
          const mostRecentData = dates.length > 0 
            ? user.wheelHistory[dates[dates.length - 1]] 
            : getEmptyWheelData();
          
          // Save initial wheel data for today
          await saveWheelData(userId, today, mostRecentData);
          
          // Update local user data
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
    // Unsubscribe from real-time updates
    if (wheelChannel) wheelChannel.unsubscribe();
    if (feedbackChannel) feedbackChannel.unsubscribe();
    
    setWheelChannel(null);
    setFeedbackChannel(null);
    setCurrentUser(null);
  };
  
  // Refresh user data from the database
  const refreshUserData = async (userId: string) => {
    try {
      // Fetch updated wheel history
      const wheelHistory = await fetchUserWheelHistory(userId);
      
      // Fetch updated feedback
      const { feedbackReceived, feedbackGiven } = await fetchUserFeedback(userId);
      
      // Update users array
      setUsers(prevUsers => 
        prevUsers.map(u => {
          if (u.id === userId) {
            return {
              ...u,
              wheelHistory,
              feedbackReceived,
              feedbackGiven
            };
          }
          return u;
        })
      );
      
      // Update current user if it's the same user
      setCurrentUser(prevUser => {
        if (prevUser && prevUser.id === userId) {
          return {
            ...prevUser,
            wheelHistory,
            feedbackReceived,
            feedbackGiven
          };
        }
        return prevUser;
      });
    } catch (error) {
      console.error("Error refreshing user data:", error);
    }
  };
  
  // Process feedback and update wheel of life
  const addFeedback = async (feedback: Omit<Feedback, "id" | "categories">) => {
    try {
      // Process feedback with OpenAI to classify categories
      const categories = await classifyFeedback(feedback.text);
      
      // If no categories were classified, show a message to the user
      if (!categories || categories.length === 0) {
        toast.warning("No wheel of life categories were detected in your feedback.");
      }
      
      // Create a new feedback object with categories
      const newFeedback = {
        ...feedback,
        categories
      };
      
      // Update wheel of life for the recipient
      const recipientId = feedback.to;
      const feedbackDate = feedback.date;
      
      // Find the user
      const recipient = users.find(u => u.id === recipientId);
      
      if (!recipient) return;
      
      // Get the most recent wheel data before the feedback date
      let baseWheelData: WheelData;
      
      if (recipient.wheelHistory[feedbackDate]) {
        baseWheelData = { ...recipient.wheelHistory[feedbackDate] };
      } else {
        // Find the most recent wheel data before the feedback date
        const dates = Object.keys(recipient.wheelHistory)
          .filter(date => date <= feedbackDate)
          .sort();
        
        baseWheelData = dates.length > 0 
          ? { ...recipient.wheelHistory[dates[dates.length - 1]] } 
          : getEmptyWheelData();
      }
      
      // Update the wheel data based on the feedback
      const updatedWheelData = await updateWheelFromFeedback(
        baseWheelData,
        {
          from: currentUser?.username || feedback.from,
          text: feedback.text,
          categories
        }
      );
      
      // Save the updated wheel data to Supabase
      await saveWheelData(recipientId, feedbackDate, updatedWheelData);
      
      // Save the feedback to Supabase
      await saveFeedback(newFeedback);
      
      // Real-time updates will trigger a refresh, but let's also update the local state
      // to ensure immediate feedback for the user
      setUsers(prevUsers => {
        return prevUsers.map(user => {
          if (user.id === recipientId) {
            return {
              ...user,
              wheelHistory: {
                ...user.wheelHistory,
                [feedbackDate]: updatedWheelData
              }
            };
          }
          if (user.id === feedback.from) {
            // We'll add the feedback to given list, but the ID will be temporary
            // until we refresh from the database
            const tempFeedback: Feedback = {
              ...newFeedback,
              id: Math.random().toString(36).substring(2, 15)
            };
            return {
              ...user,
              feedbackGiven: [...user.feedbackGiven, tempFeedback]
            };
          }
          return user;
        });
      });
      
      // If the recipient is the current user, update the current user object
      if (currentUser && currentUser.id === recipientId) {
        setCurrentUser(prevUser => {
          if (!prevUser) return null;
          return {
            ...prevUser,
            wheelHistory: {
              ...prevUser.wheelHistory,
              [feedbackDate]: updatedWheelData
            }
          };
        });
      }
    } catch (error) {
      console.error("Error processing feedback:", error);
      toast.error("Failed to process feedback. Please try again.");
      throw error;
    }
  };
  
  return (
    <UserContext.Provider
      value={{
        users,
        currentUser,
        selectedDate,
        login,
        logout,
        setSelectedDate,
        addFeedback,
        isLoading
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUserContext = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUserContext must be used within a UserProvider");
  }
  return context;
};
