import React, { createContext, useContext, useState, useEffect } from "react";
import { format } from "date-fns";

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
  apiKey: string;
  setApiKey: (key: string) => void;
  login: (userId: string) => void;
  logout: () => void;
  setSelectedDate: (date: Date) => void;
  addFeedback: (feedback: Omit<Feedback, "id" | "categories">) => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

// Initial users with empty wheel of life profiles
const initialUsers: User[] = [
  {
    id: "1",
    username: "Joe",
    wheelHistory: {},
    feedbackReceived: [],
    feedbackGiven: []
  },
  {
    id: "2",
    username: "Mike",
    wheelHistory: {},
    feedbackReceived: [],
    feedbackGiven: []
  },
  {
    id: "3",
    username: "Emma",
    wheelHistory: {},
    feedbackReceived: [],
    feedbackGiven: []
  }
];

// Function to get empty wheel data
const getEmptyWheelData = (): WheelData => {
  const emptyData: WheelData = {};
  wheelCategories.forEach(category => {
    emptyData[category] = 5; // Start with neutral value of 5 (on a scale of 1-10)
  });
  return emptyData;
};

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>(() => {
    // Try to load from localStorage on initial render
    const storedUsers = localStorage.getItem('wheelOfLifeUsers');
    return storedUsers ? JSON.parse(storedUsers) : initialUsers;
  });
  
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [apiKey, setApiKey] = useState<string>("");

  // Save users to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('wheelOfLifeUsers', JSON.stringify(users));
  }, [users]);

  const login = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (user) {
      setCurrentUser(user);
      
      // If the user doesn't have wheel data for today, initialize it with empty values
      const today = format(new Date(), "yyyy-MM-dd");
      if (!user.wheelHistory[today]) {
        // Find the most recent wheel data or use empty data
        const dates = Object.keys(user.wheelHistory).sort();
        const mostRecentData = dates.length > 0 
          ? user.wheelHistory[dates[dates.length - 1]] 
          : getEmptyWheelData();
        
        updateUserWheelData(userId, today, mostRecentData);
      }
    }
  };

  const logout = () => {
    setCurrentUser(null);
  };

  // Update a user's wheel data for a specific date
  const updateUserWheelData = (userId: string, date: string, wheelData: WheelData) => {
    setUsers(prevUsers => {
      return prevUsers.map(user => {
        if (user.id === userId) {
          return {
            ...user,
            wheelHistory: {
              ...user.wheelHistory,
              [date]: wheelData
            }
          };
        }
        return user;
      });
    });
  };

  // Process feedback and update wheel of life
  const addFeedback = async (feedback: Omit<Feedback, "id" | "categories">) => {
    if (!apiKey) {
      throw new Error("OpenAI API key is required");
    }

    try {
      // Process feedback with OpenAI to classify categories
      const categories = await classifyFeedback(feedback.text);
      
      // Create a new feedback with ID and categories
      const newFeedback: Feedback = {
        ...feedback,
        id: Math.random().toString(36).substring(2, 15),
        categories
      };

      // Update wheel of life for the recipient
      const recipientId = feedback.to;
      const feedbackDate = feedback.date;
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
        newFeedback
      );

      // Save the updated wheel data and feedback
      setUsers(prevUsers => {
        return prevUsers.map(user => {
          if (user.id === recipientId) {
            return {
              ...user,
              wheelHistory: {
                ...user.wheelHistory,
                [feedbackDate]: updatedWheelData
              },
              feedbackReceived: [...user.feedbackReceived, newFeedback]
            };
          }
          if (user.id === feedback.from) {
            return {
              ...user,
              feedbackGiven: [...user.feedbackGiven, newFeedback]
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
            },
            feedbackReceived: [...prevUser.feedbackReceived, newFeedback]
          };
        });
      }
    } catch (error) {
      console.error("Error processing feedback:", error);
      throw error;
    }
  };

  // Classify feedback using OpenAI
  const classifyFeedback = async (text: string): Promise<string[]> => {
    if (!apiKey) {
      throw new Error("OpenAI API key is required");
    }

    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: `You are a helpful assistant that classifies feedback into specific life categories. 
              The available categories are: ${wheelCategories.join(", ")}.
              Analyze the feedback text and determine which categories it relates to. 
              Return ONLY an array of relevant category names, exactly as they appear in the list above. 
              If no categories are mentioned or implied, return an empty array.`
            },
            {
              role: "user",
              content: text
            }
          ],
          temperature: 0.3,
          max_tokens: 150
        }),
      });

      const data = await response.json();
      
      if (data.error) {
        console.error("OpenAI API error:", data.error);
        throw new Error(data.error.message || "Error classifying feedback");
      }
      
      try {
        // Parse the response to get categories
        const content = data.choices[0].message.content;
        
        // Try to parse as JSON if it's in JSON format
        if (content.includes("[") && content.includes("]")) {
          const jsonMatch = content.match(/\[.*?\]/s);
          if (jsonMatch) {
            const jsonStr = jsonMatch[0];
            return JSON.parse(jsonStr);
          }
        }
        
        // If not JSON, try to extract categories by name
        return wheelCategories.filter(category => 
          content.includes(category)
        );
      } catch (error) {
        console.error("Error parsing categories:", error);
        return [];
      }
    } catch (error) {
      console.error("Error calling OpenAI API:", error);
      return [];
    }
  };

  // Update wheel data based on feedback using OpenAI
  const updateWheelFromFeedback = async (
    baseWheelData: WheelData,
    feedback: Feedback
  ): Promise<WheelData> => {
    if (!apiKey) {
      throw new Error("OpenAI API key is required");
    }

    // If no categories were classified, return the base wheel data unchanged
    if (!feedback.categories || feedback.categories.length === 0) {
      return baseWheelData;
    }

    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: `You are a helpful assistant that analyzes feedback and determines how it should affect a person's Wheel of Life scores.

              The Wheel of Life categories are: ${wheelCategories.join(", ")}.
              
              The current Wheel of Life scores (out of 10) are:
              ${Object.entries(baseWheelData)
                .map(([category, score]) => `${category}: ${score}`)
                .join("\n")}
              
              Based on the feedback text, analyze only the following categories: ${feedback.categories.join(", ")}.
              For each category, determine if the feedback is positive, negative, or neutral, and how much the score should change.
              
              Return your analysis as a JSON object with the updated scores for only the affected categories.
              Scores should be between 1 and 10, and changes should be reasonable (typically ±0.5 to ±2 points).
              Do not include categories that were not mentioned in the feedback.`
            },
            {
              role: "user",
              content: `Feedback from ${feedback.from}: "${feedback.text}"`
            }
          ],
          temperature: 0.4,
          max_tokens: 300
        }),
      });

      const data = await response.json();
      
      if (data.error) {
        console.error("OpenAI API error:", data.error);
        throw new Error(data.error.message || "Error updating wheel data");
      }
      
      try {
        // Get the response from OpenAI
        const content = data.choices[0].message.content;
        
        // Extract the JSON from the response
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          console.error("No valid JSON found in OpenAI response");
          return baseWheelData;
        }
        
        const updatedScores = JSON.parse(jsonMatch[0]);
        
        // Create a new wheel data object with the updated scores
        const updatedWheelData = { ...baseWheelData };
        
        // Update only the categories that were mentioned in the feedback
        Object.entries(updatedScores).forEach(([category, score]) => {
          if (wheelCategories.includes(category)) {
            updatedWheelData[category] = Math.max(1, Math.min(10, Number(score)));
          }
        });
        
        return updatedWheelData;
      } catch (error) {
        console.error("Error parsing updated wheel data:", error);
        return baseWheelData;
      }
    } catch (error) {
      console.error("Error calling OpenAI API:", error);
      return baseWheelData;
    }
  };

  return (
    <UserContext.Provider
      value={{
        users,
        currentUser,
        selectedDate,
        apiKey,
        setApiKey,
        login,
        logout,
        setSelectedDate,
        addFeedback
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
