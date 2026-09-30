// Authoritative Supabase Database Schema Types

export type DifficultyLevel = 'easy' | 'medium' | 'hard';
export type PriorityLevel = 'low' | 'medium' | 'high';

export interface DbProfile {
  id: string; // references auth.users(id)
  full_name?: string | null;
  email?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface DbSubject {
  id: string; // uuid
  created_at: string; // timestamptz
  user_id: string; // uuid references auth.users(id)
  name: string; // text not null
  description: string | null; // text nullable
}

export interface DbTopic {
  id: string; // uuid
  created_at: string; // timestamptz
  subject_id: string; // uuid references public.subjects(id)
  name: string; // text not null
  difficulty: DifficultyLevel; // 'easy' | 'medium' | 'hard', default 'medium'
  progress: number; // integer 0-100, default 0
  estimated_minutes: number; // integer > 0, default 60
}

export interface DbExam {
  id: string; // uuid
  created_at: string; // timestamptz
  user_id: string; // uuid references auth.users(id)
  subject_id: string; // uuid references public.subjects(id)
  title: string; // text not null
  exam_date: string; // date YYYY-MM-DD
  priority: PriorityLevel; // 'low' | 'medium' | 'high', default 'medium'
}

export interface DbStudyPlan {
  id: string; // uuid
  created_at: string; // timestamptz
  user_id: string; // uuid references auth.users(id)
  plan_date: string; // date YYYY-MM-DD
  total_minutes: number; // integer, default 0
}

export interface DbStudyPlanItem {
  id: string; // uuid
  created_at: string; // timestamptz
  study_plan_id: string; // uuid references public.study_plans(id)
  topic_id: string; // uuid references public.topics(id)
  start_time: string | null; // time nullable (e.g. '09:00')
  duration_minutes: number; // integer > 0, default 30
  priority: PriorityLevel; // 'low' | 'medium' | 'high', default 'medium'
  completed: boolean; // boolean, default false
}

// Joined types for Frontend consumption (derived from real DB foreign keys)
export interface TopicWithSubject extends DbTopic {
  subjects?: {
    id: string;
    name: string;
    user_id: string;
  };
}

export interface ExamWithSubject extends DbExam {
  subjects?: {
    id: string;
    name: string;
  };
  // Support for multiple subjects per exam
  cleanTitle?: string;
  subject_ids?: string[];
  all_subjects?: {
    id: string;
    name: string;
  }[];
}

export interface StudyPlanItemWithDetails extends DbStudyPlanItem {
  topics?: {
    id: string;
    name: string;
    difficulty: DifficultyLevel;
    progress: number;
    subject_id: string;
    subjects?: {
      id: string;
      name: string;
    };
  };
}

export interface SubjectWithTopics extends DbSubject {
  topics: DbTopic[];
  // Derived fields:
  topicCount?: number;
  avgProgress?: number;
}

export type ActiveTab = 'dashboard' | 'ai-assistant' | 'study-plan' | 'subjects' | 'exams' | 'profile';
