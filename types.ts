export interface SRSData {
  interval: number;
  reps: number;
  ease: number;
  nextReview: number;
}

export interface Word {
  id: number;
  word: string;
  ipa: string;
  def: string;
  ex_en: string;
  ex_cn: string;
  category: string; // New field for "Book" classification
  srs: SRSData;
}

export interface AuthUser {
  username: string;
  password?: string; // Only used internally for auth check
  isAdmin: boolean;
}

export interface UserSettings {
  nickname: string;
  avatar: string;
  avatarType: 'text' | 'image';
  dailyGoal: number;
  selectedCategory: string; // 'All' or specific category name
}

export interface AppStats {
  lastLogin: string | null;
  todayLearned: number;
  totalMastered: number;
}

export type ViewState = 'home' | 'study' | 'library' | 'stats' | 'profile';
export type StudyMode = 'flashcard' | 'spelling';
export type FilterType = 'all' | 'due' | 'new' | 'learned' | 'mastered';