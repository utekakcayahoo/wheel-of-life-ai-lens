import type { WheelData } from '@/types/userTypes';

export type DbUser = {
  id: string;
  username: string;
  created_at?: string;
};

export type DbWheelData = {
  id: string;
  user_id: string;
  date: string;
  data: WheelData;
  created_at?: string;
};

export type DbFeedback = {
  id: string;
  from_user_id: string;
  to_user_id: string;
  text: string;
  date: string;
  categories: string[];
  created_at?: string;
};
