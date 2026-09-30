import { getSupabaseClient } from './supabase';
import {
  DbSubject,
  DbTopic,
  DbExam,
  DbStudyPlan,
  DbStudyPlanItem,
  TopicWithSubject,
  ExamWithSubject,
  StudyPlanItemWithDetails,
  DifficultyLevel,
  PriorityLevel,
  DbProfile,
} from '../types';
import { encodeExamTitle, parseExamTitle } from '../utils/examUtils';

// Helper to throw if client is not ready
function requireClient() {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error('Supabase client is not configured. Please check your credentials.');
  }
  return client;
}

// -------------------------------------------------------------
// PROFILES
// -------------------------------------------------------------
export async function getProfile(userId: string): Promise<DbProfile | null> {
  const supabase = requireClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .limit(1);

  if (error) {
    console.warn('Could not fetch profile:', error.message);
    return null;
  }
  return data && data.length > 0 ? data[0] : null;
}

// -------------------------------------------------------------
// SUBJECTS
// -------------------------------------------------------------
export async function fetchSubjects(): Promise<DbSubject[]> {
  const supabase = requireClient();
  const { data, error } = await supabase
    .from('subjects')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function createSubject(name: string, description?: string | null): Promise<DbSubject> {
  const supabase = requireClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('subjects')
    .insert({
      user_id: user.id,
      name: name.trim(),
      description: description?.trim() || null,
    })
    .select();

  if (error) throw error;
  return data && data[0] ? data[0] : (data as any);
}

export async function updateSubject(id: string, name: string, description?: string | null): Promise<DbSubject> {
  const supabase = requireClient();
  const { data, error } = await supabase
    .from('subjects')
    .update({
      name: name.trim(),
      description: description?.trim() || null,
    })
    .eq('id', id)
    .select();

  if (error) throw error;
  return data && data[0] ? data[0] : (data as any);
}

export async function deleteSubject(id: string): Promise<void> {
  const supabase = requireClient();
  const { error } = await supabase
    .from('subjects')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// -------------------------------------------------------------
// TOPICS
// -------------------------------------------------------------
export async function fetchTopics(): Promise<TopicWithSubject[]> {
  const supabase = requireClient();
  const { data, error } = await supabase
    .from('topics')
    .select('*, subjects!inner(id, name, user_id)')
    .order('created_at', { ascending: true });

  if (error) throw error;
  return (data as any) || [];
}

export async function createTopic(params: {
  subject_id: string;
  name: string;
  difficulty: DifficultyLevel;
  progress: number;
  estimated_minutes: number;
}): Promise<DbTopic> {
  const supabase = requireClient();
  const progressClamped = Math.max(0, Math.min(100, Math.round(params.progress || 0)));
  const estimatedMinClamped = Math.max(1, Math.round(params.estimated_minutes || 60));

  const { data, error } = await supabase
    .from('topics')
    .insert({
      subject_id: params.subject_id,
      name: params.name.trim(),
      difficulty: params.difficulty,
      progress: progressClamped,
      estimated_minutes: estimatedMinClamped,
    })
    .select();

  if (error) throw error;
  return data && data[0] ? data[0] : (data as any);
}

export async function updateTopic(id: string, params: {
  name?: string;
  difficulty?: DifficultyLevel;
  progress?: number;
  estimated_minutes?: number;
}): Promise<DbTopic> {
  const supabase = requireClient();
  const payload: any = {};
  if (params.name !== undefined) payload.name = params.name.trim();
  if (params.difficulty !== undefined) payload.difficulty = params.difficulty;
  if (params.progress !== undefined) {
    payload.progress = Math.max(0, Math.min(100, Math.round(params.progress)));
  }
  if (params.estimated_minutes !== undefined) {
    payload.estimated_minutes = Math.max(1, Math.round(params.estimated_minutes));
  }

  const { data, error } = await supabase
    .from('topics')
    .update(payload)
    .eq('id', id)
    .select();

  if (error) throw error;
  return data && data[0] ? data[0] : (data as any);
}

export async function deleteTopic(id: string): Promise<void> {
  const supabase = requireClient();
  const { error } = await supabase
    .from('topics')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// -------------------------------------------------------------
// EXAMS
// -------------------------------------------------------------
export async function fetchExams(): Promise<ExamWithSubject[]> {
  const supabase = requireClient();
  const { data, error } = await supabase
    .from('exams')
    .select('*, subjects(id, name)')
    .order('exam_date', { ascending: true });

  if (error) throw error;
  const list: any[] = data || [];
  return list.map((item) => {
    const { cleanTitle, extraSubjectIds } = parseExamTitle(item.title || '');
    const subjectIds = Array.from(new Set([item.subject_id, ...extraSubjectIds].filter(Boolean)));
    return {
      ...item,
      cleanTitle: cleanTitle || item.title,
      subject_ids: subjectIds,
      all_subjects: item.subjects ? [item.subjects] : [],
    };
  });
}

export async function createExam(params: {
  subject_id?: string;
  subject_ids?: string[];
  title: string;
  exam_date: string;
  priority: PriorityLevel;
}): Promise<DbExam> {
  const supabase = requireClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const subjectIds =
    params.subject_ids && params.subject_ids.length > 0
      ? params.subject_ids
      : params.subject_id
      ? [params.subject_id]
      : [];

  if (subjectIds.length === 0) {
    throw new Error('Please select at least one subject for the exam.');
  }

  const primarySubjectId = subjectIds[0];
  const encodedTitle = encodeExamTitle(params.title, subjectIds);

  const { data, error } = await supabase
    .from('exams')
    .insert({
      user_id: user.id,
      subject_id: primarySubjectId,
      title: encodedTitle,
      exam_date: params.exam_date,
      priority: params.priority,
    })
    .select();

  if (error) throw error;
  return data && data[0] ? data[0] : (data as any);
}

export async function updateExam(id: string, params: {
  subject_id?: string;
  subject_ids?: string[];
  title?: string;
  exam_date?: string;
  priority?: PriorityLevel;
}): Promise<DbExam> {
  const supabase = requireClient();
  const payload: any = {};

  if (params.subject_ids !== undefined && params.subject_ids.length > 0) {
    payload.subject_id = params.subject_ids[0];
    if (params.title !== undefined) {
      payload.title = encodeExamTitle(params.title, params.subject_ids);
    }
  } else if (params.subject_id !== undefined) {
    payload.subject_id = params.subject_id;
    if (params.title !== undefined) {
      payload.title = params.title.trim();
    }
  } else if (params.title !== undefined) {
    payload.title = params.title.trim();
  }

  if (params.exam_date !== undefined) payload.exam_date = params.exam_date;
  if (params.priority !== undefined) payload.priority = params.priority;

  const { data, error } = await supabase
    .from('exams')
    .update(payload)
    .eq('id', id)
    .select();

  if (error) throw error;
  return data && data[0] ? data[0] : (data as any);
}

export async function deleteExam(id: string): Promise<void> {
  const supabase = requireClient();
  const { error } = await supabase
    .from('exams')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// -------------------------------------------------------------
// STUDY PLANS & ITEMS
// -------------------------------------------------------------
export async function getOrCreateStudyPlan(planDate: string): Promise<DbStudyPlan> {
  const supabase = requireClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  // Try to find existing plan for this date using limit(1) to avoid PGRST116 if duplicates exist
  let query = supabase
    .from('study_plans')
    .select('*')
    .eq('plan_date', planDate);

  if (user?.id) {
    query = query.eq('user_id', user.id);
  }

  const { data: existing, error: findError } = await query
    .order('created_at', { ascending: false })
    .limit(1);

  if (!findError && existing && existing.length > 0) {
    return existing[0];
  }

  // Fallback: check without user_id filter in case plans were inserted with another user ID or none
  const { data: anyExisting } = await supabase
    .from('study_plans')
    .select('*')
    .eq('plan_date', planDate)
    .order('created_at', { ascending: false })
    .limit(1);

  if (anyExisting && anyExisting.length > 0) {
    return anyExisting[0];
  }

  // Create new plan
  const { data: created, error: createError } = await supabase
    .from('study_plans')
    .insert({
      user_id: user.id,
      plan_date: planDate,
      total_minutes: 0,
    })
    .select();

  if (createError) {
    // If insert ran into race condition or conflict, retry fetching
    const { data: retryList } = await supabase
      .from('study_plans')
      .select('*')
      .eq('plan_date', planDate)
      .order('created_at', { ascending: false })
      .limit(1);

    if (retryList && retryList.length > 0) {
      return retryList[0];
    }
    throw createError;
  }

  if (created && created.length > 0) {
    return created[0];
  }

  throw new Error(`Failed to initialize study plan for ${planDate}`);
}

export async function fetchStudyPlanItems(studyPlanId: string): Promise<StudyPlanItemWithDetails[]> {
  const supabase = requireClient();
  const { data, error } = await supabase
    .from('study_plan_items')
    .select('*, topics(id, name, difficulty, progress, subject_id, subjects(id, name))')
    .eq('study_plan_id', studyPlanId)
    .order('start_time', { ascending: true, nullsFirst: false });

  if (error) throw error;
  return (data as any) || [];
}

async function recalculateStudyPlanMinutes(studyPlanId: string): Promise<number> {
  const supabase = requireClient();
  const { data, error } = await supabase
    .from('study_plan_items')
    .select('duration_minutes')
    .eq('study_plan_id', studyPlanId);

  if (error) {
    console.warn('Failed to calculate items total:', error);
    return 0;
  }
  const total = (data || []).reduce((acc: number, item: any) => acc + (item.duration_minutes || 0), 0);

  await supabase
    .from('study_plans')
    .update({ total_minutes: total })
    .eq('id', studyPlanId);

  return total;
}

export async function createStudyPlanItem(params: {
  study_plan_id: string;
  topic_id: string;
  start_time: string | null;
  duration_minutes: number;
  priority: PriorityLevel;
}): Promise<DbStudyPlanItem> {
  const supabase = requireClient();
  const duration = Math.max(1, Math.round(params.duration_minutes || 30));

  const { data, error } = await supabase
    .from('study_plan_items')
    .insert({
      study_plan_id: params.study_plan_id,
      topic_id: params.topic_id,
      start_time: params.start_time || null,
      duration_minutes: duration,
      priority: params.priority,
      completed: false,
    })
    .select();

  if (error) throw error;

  await recalculateStudyPlanMinutes(params.study_plan_id);
  return data && data[0] ? data[0] : (data as any);
}

export async function updateStudyPlanItem(
  id: string,
  params: {
    completed?: boolean;
    start_time?: string | null;
    duration_minutes?: number;
    priority?: PriorityLevel;
    topic_id?: string;
  },
  studyPlanId: string
): Promise<DbStudyPlanItem> {
  const supabase = requireClient();
  const payload: any = {};
  if (params.completed !== undefined) payload.completed = params.completed;
  if (params.start_time !== undefined) payload.start_time = params.start_time || null;
  if (params.duration_minutes !== undefined) {
    payload.duration_minutes = Math.max(1, Math.round(params.duration_minutes));
  }
  if (params.priority !== undefined) payload.priority = params.priority;
  if (params.topic_id !== undefined) payload.topic_id = params.topic_id;

  const { data, error } = await supabase
    .from('study_plan_items')
    .update(payload)
    .eq('id', id)
    .select();

  if (error) throw error;

  if (params.duration_minutes !== undefined) {
    await recalculateStudyPlanMinutes(studyPlanId);
  }
  return data && data[0] ? data[0] : (data as any);
}

export async function deleteStudyPlanItem(id: string, studyPlanId: string): Promise<void> {
  const supabase = requireClient();
  const { error } = await supabase
    .from('study_plan_items')
    .delete()
    .eq('id', id);

  if (error) throw error;

  await recalculateStudyPlanMinutes(studyPlanId);
}
