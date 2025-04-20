
import { WheelData, WheelHistory } from "@/context/UserContext";
import { format, subDays, eachDayOfInterval } from "date-fns";

// Get the wheel data for a specific date
export const getWheelDataForDate = (
  wheelHistory: WheelHistory,
  date: Date
): WheelData | null => {
  const dateString = format(date, "yyyy-MM-dd");
  return wheelHistory[dateString] || null;
};

// Get the most recent wheel data before or on a specific date
export const getMostRecentWheelData = (
  wheelHistory: WheelHistory,
  date: Date
): WheelData | null => {
  const dateString = format(date, "yyyy-MM-dd");
  
  // Get all dates in the wheel history
  const dates = Object.keys(wheelHistory).sort();
  
  // Find the most recent date that is before or equal to the specified date
  const mostRecentDate = dates
    .filter(historyDate => historyDate <= dateString)
    .pop();
  
  return mostRecentDate ? wheelHistory[mostRecentDate] : null;
};

// Get wheel data for the past N days
export const getWheelDataForPastDays = (
  wheelHistory: WheelHistory,
  days: number,
  endDate: Date = new Date()
): { date: string; data: WheelData }[] => {
  const startDate = subDays(endDate, days - 1);
  const dateRange = eachDayOfInterval({ start: startDate, end: endDate });
  
  return dateRange.map(date => {
    const dateString = format(date, "yyyy-MM-dd");
    const wheelData = getMostRecentWheelData(wheelHistory, date) || {};
    
    return {
      date: dateString,
      data: wheelData,
    };
  });
};

// Convert wheel data to chart format
export const wheelDataToChartFormat = (wheelData: WheelData | null) => {
  if (!wheelData) return [];
  
  return Object.entries(wheelData).map(([category, value]) => ({
    category,
    value,
    fullMark: 10,
  }));
};

// Format category name for CSS class
export const formatCategoryClass = (category: string): string => {
  return `wheel-category-${category.toLowerCase().replace(/\s+/g, '-')}`;
};

// Get color for wheel category
export const getCategoryColor = (category: string): string => {
  switch (category.toLowerCase()) {
    case 'career':
      return '#3b82f6'; // blue-500
    case 'relationships':
      return '#ec4899'; // pink-500
    case 'personal growth':
      return '#8b5cf6'; // purple-500
    case 'physical health':
      return '#22c55e'; // green-500
    case 'finance':
      return '#f59e0b'; // amber-500
    case 'mental health':
      return '#14b8a6'; // teal-500
    default:
      return '#6b7280'; // gray-500
  }
};

// Calculate the average wheel score
export const calculateAverageWheelScore = (wheelData: WheelData | null): number => {
  if (!wheelData) return 0;
  
  const values = Object.values(wheelData);
  if (values.length === 0) return 0;
  
  const sum = values.reduce((acc, val) => acc + val, 0);
  return sum / values.length;
};
