import React, { useState, useEffect, useCallback } from 'react';
import { getSupabaseClient } from './lib/supabase';
import { AuthView } from './components/AuthView';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { DashboardView } from './components/DashboardView';
import { StudyPlanView } from './components/StudyPlanView';
import { SubjectsView } from './components/SubjectsView';
import { ExamsView } from './components/ExamsView';
import { ProfileView } from './components/ProfileView';
import { AIAssistantView } from './components/AIAssistantView';
import { SearchModal } from './components/SearchModal';
import { DatabaseNoticeBanner } from './components/DatabaseNoticeBanner';
import { StudyFocusTimerModal } from './components/StudyFocusTimerModal';
import { AIGeneratePlanModal } from './components/AIGeneratePlanModal';
import {
  ActiveTab,
  DbSubject,
  DbProfile,
  DbStudyPlan,
  TopicWithSubject,
  ExamWithSubject,
  StudyPlanItemWithDetails,
  SubjectWithTopics,
} from './types';
import {
  fetchSubjects,
  fetchTopics,
  fetchExams,
  getOrCreateStudyPlan,
  fetchStudyPlanItems,
  updateStudyPlanItem,
  getProfile,
} from './lib/api';
import { enrichExamsList } from './utils/examUtils';

export default function App() {
  // Auth state
  const [session, setSession] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Navigation state
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);

  // Selected date for study plan (YYYY-MM-DD)
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });

  // Database records
  const [profile, setProfile] = useState<DbProfile | null>(null);
  const [subjects, setSubjects] = useState<DbSubject[]>([]);
  const [topics, setTopics] = useState<TopicWithSubject[]>([]);
  const [exams, setExams] = useState<ExamWithSubject[]>([]);
  const [currentPlan, setCurrentPlan] = useState<DbStudyPlan | null>(null);
  const [planItems, setPlanItems] = useState<StudyPlanItemWithDetails[]>([]);

  // Today's study plan data specifically for dashboard
  const [todayPlan, setTodayPlan] = useState<DbStudyPlan | null>(null);
  const [todayTasks, setTodayTasks] = useState<StudyPlanItemWithDetails[]>([]);

  // Study Timer Modal State
  const [timerModalOpen, setTimerModalOpen] = useState(false);
  const [activeTimerTask, setActiveTimerTask] = useState<StudyPlanItemWithDetails | null>(null);
  const [activeTimerTopic, setActiveTimerTopic] = useState<TopicWithSubject | null>(null);

  // AI Plan Generator Modal State
  const [aiPlanModalOpen, setAiPlanModalOpen] = useState(false);
  const [aiPlanTargetDate, setAiPlanTargetDate] = useState<string>(
    () => new Date().toISOString().split('T')[0]
  );

  const [dataLoading, setDataLoading] = useState(false);
  const [dbPermissionError, setDbPermissionError] = useState<{
    code?: string;
    message?: string;
    hint?: string;
  } | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);

  // Monitor Supabase auth session
  useEffect(() => {
    const client = getSupabaseClient();
    if (!client) {
      setAuthLoading(false);
      return;
    }

    // Get current session
    client.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setAuthLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Keyboard shortcut for search (⌘K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchModalOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Fetch core academic records
  const loadCoreData = useCallback(async () => {
    if (!session?.user?.id) return;
    setDataLoading(true);

    try {
      const [subRes, topRes, exRes, profRes] = await Promise.allSettled([
        fetchSubjects(),
        fetchTopics(),
        fetchExams(),
        getProfile(session.user.id),
      ]);

      let permissionErr: any = null;

      const loadedSubjects = subRes.status === 'fulfilled' ? subRes.value : [];
      if (subRes.status === 'fulfilled') {
        setSubjects(loadedSubjects);
      } else {
        const err = subRes.reason;
        if (err?.code === '42501' || err?.message?.toLowerCase().includes('permission denied')) {
          permissionErr = err;
        } else {
          console.warn('Could not load subjects:', err?.message || err);
        }
      }

      if (topRes.status === 'fulfilled') {
        setTopics(topRes.value);
      } else {
        const err = topRes.reason;
        if (err?.code === '42501' || err?.message?.toLowerCase().includes('permission denied')) {
          permissionErr = permissionErr || err;
        } else {
          console.warn('Could not load topics:', err?.message || err);
        }
      }

      if (exRes.status === 'fulfilled') {
        const enriched = enrichExamsList(exRes.value, loadedSubjects);
        setExams(enriched);
      } else {
        const err = exRes.reason;
        if (err?.code === '42501' || err?.message?.toLowerCase().includes('permission denied')) {
          permissionErr = permissionErr || err;
        } else {
          console.warn('Could not load exams:', err?.message || err);
        }
      }

      if (profRes.status === 'fulfilled') {
        setProfile(profRes.value);
      }

      if (permissionErr) {
        setDbPermissionError({
          code: permissionErr.code || '42501',
          message: permissionErr.message || 'Permission denied for table',
          hint: permissionErr.hint || 'Grant the required privileges to the authenticated role.',
        });
      }
    } catch (err: any) {
      if (err?.code === '42501' || err?.message?.toLowerCase().includes('permission denied')) {
        setDbPermissionError({
          code: err.code || '42501',
          message: err.message || 'Permission denied for table',
          hint: err.hint,
        });
      } else {
        console.warn('Could not load core data:', err?.message || err);
      }
    } finally {
      setDataLoading(false);
    }
  }, [session?.user?.id]);

  // Load today's plan for the Dashboard
  const loadTodayPlan = useCallback(async () => {
    if (!session?.user?.id) return;
    const todayStr = new Date().toISOString().split('T')[0];

    try {
      const plan = await getOrCreateStudyPlan(todayStr);
      if (plan) {
        setTodayPlan(plan);
        const items = await fetchStudyPlanItems(plan.id);
        setTodayTasks(items);
      }
    } catch (err: any) {
      if (err?.code === '42501' || err?.message?.toLowerCase().includes('permission denied')) {
        setDbPermissionError({
          code: err.code || '42501',
          message: err.message || 'Permission denied for table',
          hint: err.hint,
        });
      } else {
        console.warn('Could not load today study plan:', err?.message || err);
      }
    }
  }, [session?.user?.id]);

  // Load selected date plan for the Study Plan view
  const loadSelectedDatePlan = useCallback(async () => {
    if (!session?.user?.id || !selectedDate) return;

    try {
      const plan = await getOrCreateStudyPlan(selectedDate);
      if (plan) {
        setCurrentPlan(plan);
        const items = await fetchStudyPlanItems(plan.id);
        setPlanItems(items);

        // If the selected date is today, keep todayTasks in sync
        const todayStr = new Date().toISOString().split('T')[0];
        if (selectedDate === todayStr) {
          setTodayPlan(plan);
          setTodayTasks(items);
        }
      }
    } catch (err: any) {
      if (err?.code === '42501' || err?.message?.toLowerCase().includes('permission denied')) {
        setDbPermissionError({
          code: err.code || '42501',
          message: err.message || 'Permission denied for table',
          hint: err.hint,
        });
      } else {
        console.warn('Could not load selected date plan:', err?.message || err);
      }
    }
  }, [session?.user?.id, selectedDate]);

  const handleRetryConnection = async () => {
    setIsRetrying(true);
    setDbPermissionError(null);
    await Promise.allSettled([
      loadCoreData(),
      loadTodayPlan(),
      loadSelectedDatePlan(),
    ]);
    setIsRetrying(false);
  };

  // Initial and reactive data loading
  useEffect(() => {
    if (session?.user?.id) {
      loadCoreData();
      loadTodayPlan();
      loadSelectedDatePlan();
    }
  }, [session?.user?.id, loadCoreData, loadTodayPlan, loadSelectedDatePlan]);

  // Combine subjects with their topics
  const subjectsWithTopics: SubjectWithTopics[] = subjects.map((sub) => {
    const subTopics = topics.filter((t) => t.subject_id === sub.id);
    return {
      ...sub,
      topics: subTopics,
    };
  });

  // Handle task completion toggle from dashboard
  const handleToggleTodayTask = async (task: StudyPlanItemWithDetails) => {
    if (!todayPlan) return;
    try {
      await updateStudyPlanItem(
        task.id,
        { completed: !task.completed },
        todayPlan.id
      );
      loadTodayPlan();
      if (selectedDate === todayPlan.plan_date) {
        loadSelectedDatePlan();
      }
    } catch (err) {
      console.error('Failed to toggle task:', err);
    }
  };

  // Open Study Focus Timer
  const handleStartTimer = (
    task?: StudyPlanItemWithDetails | null,
    topic?: TopicWithSubject | null
  ) => {
    setActiveTimerTask(task || null);
    setActiveTimerTopic(topic || null);
    setTimerModalOpen(true);
  };

  // Callback when study session timer finishes
  const handleTimerFinished = async () => {
    await Promise.allSettled([
      loadCoreData(),
      loadTodayPlan(),
      loadSelectedDatePlan(),
    ]);
  };

  // Open AI Plan Generator Modal
  const handleOpenAiPlan = (date?: string) => {
    setAiPlanTargetDate(date || selectedDate || new Date().toISOString().split('T')[0]);
    setAiPlanModalOpen(true);
  };

  // Callback when AI generated tasks are saved to DB
  const handleAiPlanApplied = async () => {
    await Promise.allSettled([
      loadTodayPlan(),
      loadSelectedDatePlan(),
      loadCoreData(),
    ]);
  };

  // Sign out handler
  const handleSignOut = async () => {
    const client = getSupabaseClient();
    if (client) {
      await client.auth.signOut();
    }
    setSession(null);
  };

  // Loading indicator for initial auth check
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#f8f9ff] flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 rounded-2xl bg-[#3525cd] flex items-center justify-center text-white mx-auto font-display font-black animate-pulse">
            S
          </div>
          <p className="text-xs font-semibold text-[#464555]">
            Connecting to Supabase...
          </p>
        </div>
      </div>
    );
  }

  // If not signed in with Supabase Auth, render AuthView
  if (!session) {
    return <AuthView onAuthSuccess={() => {}} />;
  }

  const userEmail = session.user.email || '';
  const userName =
    profile?.full_name ||
    session.user.user_metadata?.full_name ||
    userEmail.split('@')[0];

  return (
    <div className="min-h-screen bg-[#f8f9ff] flex text-[#0b1c30]">
      {/* Navigation Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        userEmail={userEmail}
        userName={userName}
        onSignOut={handleSignOut}
        mobileOpen={mobileNavOpen}
        onCloseMobile={() => setMobileNavOpen(false)}
      />

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        {/* Top bar header */}
        <TopBar
          onOpenMobileNav={() => setMobileNavOpen(true)}
          onSearchClick={() => setSearchModalOpen(true)}
          userEmail={userEmail}
          onOpenTimer={() => handleStartTimer()}
          onOpenAiPlan={() => handleOpenAiPlan()}
        />

        {/* View Router */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <DatabaseNoticeBanner
            error={dbPermissionError}
            onRetry={handleRetryConnection}
            isRetrying={isRetrying}
          />

          {activeTab === 'dashboard' && (
            <DashboardView
              userEmail={userEmail}
              userName={userName}
              todayPlan={todayPlan}
              todayTasks={todayTasks}
              exams={exams}
              subjects={subjectsWithTopics}
              loading={dataLoading}
              onToggleTaskComplete={handleToggleTodayTask}
              onNavigateTab={setActiveTab}
              onOpenAiPlan={() => handleOpenAiPlan()}
              onStartTimer={(task) => handleStartTimer(task)}
            />
          )}

          {activeTab === 'ai-assistant' && (
            <AIAssistantView
              userEmail={userEmail}
              userName={userName}
              subjects={subjects}
              topics={topics}
              exams={exams}
            />
          )}

          {activeTab === 'study-plan' && (
            <StudyPlanView
              selectedDate={selectedDate}
              onDateChange={setSelectedDate}
              studyPlan={currentPlan}
              items={planItems}
              topics={topics}
              loading={dataLoading}
              onRefresh={() => {
                loadSelectedDatePlan();
                loadTodayPlan();
              }}
              onNavigateToSubjects={() => setActiveTab('subjects')}
              onOpenAiPlan={() => handleOpenAiPlan(selectedDate)}
              onStartTimer={(item) => handleStartTimer(item)}
            />
          )}

          {activeTab === 'subjects' && (
            <SubjectsView
              subjects={subjectsWithTopics}
              loading={dataLoading}
              onRefresh={() => {
                loadCoreData();
                loadTodayPlan();
              }}
              onStartTimer={(topic) => handleStartTimer(null, topic)}
            />
          )}

          {activeTab === 'exams' && (
            <ExamsView
              exams={exams}
              subjects={subjects}
              loading={dataLoading}
              onRefresh={loadCoreData}
              onNavigateToSubjects={() => setActiveTab('subjects')}
            />
          )}

          {activeTab === 'profile' && (
            <ProfileView
              userEmail={userEmail}
              userId={session.user.id}
              profile={profile}
              onSignOut={handleSignOut}
              onProfileUpdated={loadCoreData}
            />
          )}
        </main>
      </div>

      {/* Quick Global Search Palette */}
      <SearchModal
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        subjects={subjectsWithTopics}
        exams={exams}
        todayTasks={todayTasks}
        onNavigate={setActiveTab}
      />

      {/* Interactive Study Focus Timer Modal */}
      <StudyFocusTimerModal
        isOpen={timerModalOpen}
        onClose={() => {
          setTimerModalOpen(false);
          setActiveTimerTask(null);
          setActiveTimerTopic(null);
        }}
        task={activeTimerTask}
        topic={activeTimerTopic}
        studyPlanId={activeTimerTask?.study_plan_id || todayPlan?.id || currentPlan?.id}
        onSessionFinished={handleTimerFinished}
      />

      {/* Gemini AI Daily Study Plan Generator Modal */}
      <AIGeneratePlanModal
        isOpen={aiPlanModalOpen}
        onClose={() => setAiPlanModalOpen(false)}
        targetDate={aiPlanTargetDate}
        topics={topics}
        exams={exams}
        onPlanApplied={handleAiPlanApplied}
      />
    </div>
  );
}
