
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

export const wheelCategories = [
  "Career",
  "Relationships",
  "Personal Growth", 
  "Physical Health",
  "Finance",
  "Mental Health"
];
