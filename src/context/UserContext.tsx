
import React, { createContext, useContext, useState } from "react";
import { User, Feedback, WheelData } from "@/types/userTypes";
import { useUserState } from "@/hooks/useUserState";
import { saveFeedback } from "@/utils/supabase";
import { classifyFeedback, updateWheelFromFeedback } from "@/utils/apiUtils";
import { toast } from "sonner";
import { saveWheelData } from "@/utils/supabase";
import { getEmptyWheelData } from "@/utils/wheelOfLifeUtils";

interface UserContextType {
  users: User[];
  currentUser: User | null;
  selectedDate: Date;
  usingMockData: boolean;
  login: (userId: string) => Promise<void>;
  logout: () => void;
  setSelectedDate: (date: Date) => void;
  addFeedback: (feedback: Omit<Feedback, "id" | "categories">) => Promise<void>;
  isLoading: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    users,
    setUsers,
    currentUser,
    isLoading,
    usingMockData,
    login,
    logout,
    refreshUserData
  } = useUserState();
  
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const addFeedback = async (feedback: Omit<Feedback, "id" | "categories">) => {
    if (!currentUser) {
      throw new Error("You must be logged in to submit feedback");
    }

    try {
      const categories = await classifyFeedback(feedback.text);
      
      if (!categories || categories.length === 0) {
        toast.warning("No wheel of life categories were detected in your feedback.");
      }

      const recipient = users.find(u => u.id === feedback.to);
      if (!recipient) {
        throw new Error("Recipient not found");
      }

      // Get base wheel data
      const baseWheelData = recipient.wheelHistory[feedback.date] || getEmptyWheelData();
      
      // Update wheel based on feedback
      let updatedWheelData: WheelData;
      
      try {
        updatedWheelData = await updateWheelFromFeedback(
          baseWheelData,
          {
            from: currentUser?.username || feedback.from,
            text: feedback.text,
            categories
          }
        );
      } catch (error) {
        console.error("Error updating wheel data:", error);
        throw new Error(`Failed to update wheel data: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
      
      // Save updates
      try {
        await saveWheelData(feedback.to, feedback.date, updatedWheelData);
        await saveFeedback({ ...feedback, categories });
      } catch (error) {
        console.error("Error saving data:", error);
        throw new Error(`Failed to save data: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
      
      // Refresh data
      await refreshUserData(feedback.to);
      if (currentUser) {
        await refreshUserData(currentUser.id);
      }
    } catch (error) {
      console.error("Error processing feedback:", error);
      throw error;
    }
  };

  return (
    <UserContext.Provider
      value={{
        users,
        currentUser,
        selectedDate,
        usingMockData,
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
