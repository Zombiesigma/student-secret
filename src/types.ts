export type Category = 'Confession' | 'Crush' | 'Study' | 'Rant' | 'Other';

export type SurveyQuestionType = 'multiple-choice' | 'essay';

export interface SurveyQuestion {
  id: string;
  question: string;
  type: SurveyQuestionType;
  options?: string[]; // Only for multiple-choice
}

export interface Survey {
  id: string;
  title: string;
  description: string;
  questions: SurveyQuestion[];
  active: boolean;
  timestamp: number;
}

export interface SurveyResponse {
  id: string;
  surveyId: string;
  answers: { [questionId: string]: string | string[] };
  timestamp: number;
}

export interface Comment {
  id: string;
  content: string;
  timestamp: number;
  likes: number;
}

export interface Secret {
  id: string;
  content: string;
  category: Category;
  timestamp: number;
  likes: number;
  color: string;
  commentCount?: number;
}

export interface Report {
  id: string;
  targetId: string;
  targetType: 'secret' | 'comment';
  content: string;
  reason?: string;
  timestamp: number;
  status: 'pending' | 'resolved';
  secretId?: string; // For comments, to know which secret they belong to
}

export const CATEGORIES: Category[] = ['Confession', 'Crush', 'Study', 'Rant', 'Other'];

export const CATEGORY_COLORS: Record<Category, string> = {
  Confession: 'from-purple-500 to-indigo-600',
  Crush: 'from-pink-500 to-rose-600',
  Study: 'from-blue-500 to-cyan-600',
  Rant: 'from-orange-500 to-red-600',
  Other: 'from-gray-500 to-slate-600',
};
