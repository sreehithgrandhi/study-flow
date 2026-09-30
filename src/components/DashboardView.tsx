import React from 'react';
import {
  Clock,
  Calendar,
  CheckCircle2,
  BookOpen,
  Plus,
  ArrowRight,
  Check,
  Sparkles,
  Play,
  TrendingUp,
  Zap,
  Target,
  Flame,
  Award,
  Layers
} from 'lucide-react';
import {
  DbStudyPlan,
  StudyPlanItemWithDetails,
  ExamWithSubject,
  SubjectWithTopics,
  ActiveTab,
} from '../types';

interface DashboardViewProps {
  userEmail: string;
  userName?: string | null;
  todayPlan: DbStudyPlan | null;
  todayTasks: StudyPlanItemWithDetails[];
  exams: ExamWithSubject[];
  subjects: SubjectWithTopics[];
  loading: boolean;
  onToggleTaskComplete: (task: StudyPlanItemWithDetails) => void;
  onNavigateTab: (tab: ActiveTab) => void;
  onOpenAiPlan?: () => void;
  onStartTimer?: (task: StudyPlanItemWithDetails) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  userEmail,
  userName,
  todayPlan,
  todayTasks,
  exams,
  subjects,
  loading,
  onToggleTaskComplete,
  onNavigateTab,
  onOpenAiPlan,
  onStartTimer,
}) => {
  const displayName = userName?.trim() || userEmail;

  // Time of day greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  // Calculate planned study time strictly from database records
  const totalPlannedMinutes =
    todayPlan?.total_minutes ||
    todayTasks.reduce((acc, t) => acc + (t.duration_minutes || 0), 0);

  const hours = Math.floor(totalPlannedMinutes / 60);
  const mins = totalPlannedMinutes % 60;

  const completedTasks = todayTasks.filter((t) => t.completed);
  const pendingTasks = todayTasks.filter((t) => !t.completed);
  const completionPercentage =
    todayTasks.length > 0 ? Math.round((completedTasks.length / todayTasks.length) * 100) : 0;

  // Calculate total topics and average mastery across all subjects
  const allTopicsCount = subjects.reduce((sum, s) => sum + (s.topics?.length || 0), 0);
  const averageMastery =
    allTopicsCount > 0
      ? Math.round(
          subjects.reduce(
            (sum, s) => sum + (s.topics?.reduce((tSum, t) => tSum + (t.progress || 0), 0) || 0),
            0
          ) / allTopicsCount
        )
      : 0;

  // Calculate days remaining for exams
  const todayMs = new Date().setHours(0, 0, 0, 0);
  const upcomingExamsWithDays = exams
    .map((exam) => {
      const examDateObj = new Date(exam.exam_date + 'T00:00:00');
      const diffDays = Math.ceil((examDateObj.getTime() - todayMs) / (1000 * 60 * 60 * 24));
      return {
        ...exam,
        daysRemaining: diffDays,
      };
    })
    .sort((a, b) => a.daysRemaining - b.daysRemaining);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Dynamic Ambient Hero Greeting */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#1e1b4b] via-[#2e1065] to-[#312e81] p-6 sm:p-8 text-white shadow-xl shadow-indigo-950/20">
        <div className="absolute -right-12 -top-12 w-64 h-64 rounded-full bg-gradient-to-br from-indigo-500/20 to-fuchsia-500/20 blur-3xl pointer-events-none" />
        <div className="absolute -left-12 -bottom-12 w-64 h-64 rounded-full bg-gradient-to-tr from-blue-500/20 to-indigo-500/20 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-semibold text-indigo-200">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Smart Study Assistant Active</span>
            </div>
            <h1 className="font-display text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
              {getGreeting()}, {displayName.split('@')[0]}!
            </h1>
            <p className="text-sm text-indigo-200/90 leading-relaxed">
              {todayTasks.length === 0
                ? "You haven't scheduled any study tasks for today yet. Use AI generation or add tasks manually to get started."
                : `You have ${pendingTasks.length} study ${pendingTasks.length === 1 ? 'task' : 'tasks'} remaining today with ${hours}h ${mins}m planned.`}
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              id="btn-ai-generate-today"
              onClick={onOpenAiPlan}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white text-indigo-950 font-bold text-xs sm:text-sm hover:bg-indigo-50 active:scale-[0.98] shadow-lg shadow-black/10 transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>Generate AI Plan</span>
            </button>

            <button
              id="btn-ask-ai-assistant"
              onClick={() => onNavigateTab('ai-assistant')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 active:scale-[0.98] text-white font-semibold text-xs sm:text-sm backdrop-blur-md border border-white/20 transition-all cursor-pointer"
            >
              <Zap className="w-4 h-4 text-amber-300" />
              <span>Ask AI Tutor</span>
            </button>

            <button
              id="btn-plan-today"
              onClick={() => onNavigateTab('study-plan')}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-white/5 hover:bg-white/15 text-white/90 font-medium text-xs sm:text-sm border border-white/10 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Task</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3-Pillar Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Metric 1: Planned Study Time */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Today's Planned Time
            </span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-display text-3xl font-extrabold text-slate-900">
              {hours}h {mins}m
            </span>
            <span className="text-xs text-slate-500 font-medium">
              ({todayTasks.length} {todayTasks.length === 1 ? 'task' : 'tasks'})
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-600 pt-3 border-t border-slate-100">
            <span>Completed: <strong className="text-slate-900">{completedTasks.length}</strong> / {todayTasks.length}</span>
            <span className="text-indigo-600 font-semibold">{pendingTasks.length} remaining</span>
          </div>
        </div>

        {/* Metric 2: Completion Progress */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Today's Completion
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-display text-3xl font-extrabold text-slate-900">
              {completionPercentage}%
            </span>
            <span className="text-xs text-emerald-600 font-semibold">
              {completedTasks.length} done
            </span>
          </div>
          <div className="mt-3 w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>

        {/* Metric 3: Academic Mastery */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition-all sm:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Overall Topic Mastery
            </span>
            <div className="w-9 h-9 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-display text-3xl font-extrabold text-slate-900">
              {averageMastery}%
            </span>
            <span className="text-xs text-slate-500 font-medium">
              across {allTopicsCount} topics
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-600 pt-3 border-t border-slate-100">
            <span>Enrolled: <strong className="text-slate-900">{subjects.length}</strong> subjects</span>
            <span className="text-violet-600 font-semibold">{exams.length} exams</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Left Tasks (8 cols) & Right Exams / Subjects (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (8 cols): Today's Tasks */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <h2 className="font-display text-lg font-bold text-slate-900">
                Today's Study Schedule
              </h2>
              {todayTasks.length > 0 && (
                <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {pendingTasks.length} pending
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              {todayTasks.length > 0 && (
                <button
                  onClick={onOpenAiPlan}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors cursor-pointer"
                  title="Generate more study tasks with AI"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>AI Re-plan</span>
                </button>
              )}

              <button
                onClick={() => onNavigateTab('study-plan')}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <span>Full calendar</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Tasks List */}
          {loading ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-xs text-slate-500">
              Loading study tasks from Supabase...
            </div>
          ) : todayTasks.length === 0 ? (
            <div className="p-8 sm:p-10 text-center bg-white rounded-3xl border border-dashed border-indigo-200 space-y-4 shadow-2xs">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-500 to-violet-500 text-white flex items-center justify-center mx-auto shadow-md shadow-indigo-500/20">
                <Sparkles className="w-7 h-7" />
              </div>
              <div className="max-w-md mx-auto">
                <h3 className="font-display font-bold text-base text-slate-900">
                  No study tasks scheduled for today yet
                </h3>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                  Let Gemini AI analyze your courses, upcoming exams, and lowest mastery topics to automatically build your optimal schedule.
                </p>
              </div>
              <div className="flex items-center justify-center gap-2.5 flex-wrap pt-1">
                <button
                  id="btn-ai-generate-today-empty"
                  onClick={onOpenAiPlan}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-indigo-500/20 transition-all active:scale-[0.98] cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Today's Tasks with AI</span>
                </button>
                <button
                  onClick={() => onNavigateTab('study-plan')}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Task Manually</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Pending tasks */}
              {pendingTasks.map((task) => {
                const topicName = task.topics?.name || 'Topic';
                const subjectName = task.topics?.subjects?.name || 'Subject';
                const topicProgress = task.topics?.progress ?? 0;

                return (
                  <div
                    key={task.id}
                    id={`task-item-${task.id}`}
                    className="group bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 hover:border-indigo-300 hover:shadow-md transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-start sm:items-center gap-3.5 flex-1 min-w-0">
                      <button
                        onClick={() => onToggleTaskComplete(task)}
                        className="mt-0.5 sm:mt-0 w-5 h-5 rounded-lg border-2 border-slate-300 hover:border-indigo-600 hover:bg-indigo-50 flex items-center justify-center transition-colors shrink-0 cursor-pointer"
                        title="Mark as completed"
                      >
                        <Check className="w-3.5 h-3.5 text-transparent group-hover:text-slate-300" />
                      </button>

                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm sm:text-base text-slate-900 flex items-center gap-2 flex-wrap">
                          <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-100">
                            {subjectName}
                          </span>
                          <span className="truncate text-slate-800 font-medium">{topicName}</span>
                        </div>

                        <div className="text-xs text-slate-500 mt-2 flex items-center gap-3 flex-wrap">
                          <span className="flex items-center gap-1.5 font-medium text-slate-600">
                            <Clock className="w-3.5 h-3.5 text-indigo-500" />
                            <span>{task.duration_minutes} min</span>
                          </span>

                          {task.start_time && (
                            <>
                              <span className="text-slate-300">•</span>
                              <span>Scheduled at {task.start_time.slice(0, 5)}</span>
                            </>
                          )}

                          <span className="text-slate-300">•</span>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] text-slate-400">Mastery:</span>
                            <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                                style={{ width: `${topicProgress}%` }}
                              />
                            </div>
                            <span className="font-bold text-[11px] text-slate-700">
                              {topicProgress}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 self-end sm:self-center shrink-0">
                      {/* Interactive Study Focus Timer Button */}
                      {onStartTimer && (
                        <button
                          id={`btn-start-timer-${task.id}`}
                          onClick={() => onStartTimer(task)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white font-semibold text-xs border border-indigo-200 hover:border-indigo-600 transition-all shadow-2xs group/btn cursor-pointer"
                          title="Start study focus timer to automatically increase progress"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>Focus ({task.duration_minutes}m)</span>
                        </button>
                      )}

                      <span
                        className={`px-2.5 py-1 text-[11px] font-bold rounded-full border capitalize ${
                          task.priority === 'high'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : task.priority === 'medium'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-slate-50 text-slate-700 border-slate-200'
                        }`}
                      >
                        {task.priority}
                      </span>
                    </div>
                  </div>
                );
              })}

              {/* Completed tasks */}
              {completedTasks.length > 0 && (
                <div className="pt-3">
                  <div className="text-[11px] font-bold tracking-wider uppercase text-slate-400 mb-2.5 flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Completed Today ({completedTasks.length})</span>
                  </div>
                  <div className="space-y-2">
                    {completedTasks.map((task) => {
                      const topicName = task.topics?.name || 'Topic';
                      const subjectName = task.topics?.subjects?.name || 'Subject';

                      return (
                        <div
                          key={task.id}
                          className="flex items-center justify-between px-4 py-3 bg-white/70 rounded-xl border border-slate-200/60 text-xs text-slate-500"
                        >
                          <div className="flex items-center gap-2.5">
                            <button
                              onClick={() => onToggleTaskComplete(task)}
                              className="w-4 h-4 rounded-md bg-emerald-500 text-white flex items-center justify-center shrink-0 cursor-pointer"
                              title="Click to unmark"
                            >
                              <Check className="w-3 h-3 stroke-[3]" />
                            </button>
                            <div>
                              <span className="font-semibold text-slate-700">{subjectName}</span>
                              <span className="text-slate-300 mx-1.5">•</span>
                              <span className="line-through text-slate-400">{topicName}</span>
                            </div>
                          </div>

                          <span className="text-[11px] text-slate-400 font-medium">
                            {task.duration_minutes} min
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Enrolled Subjects Progress */}
          <div className="pt-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display text-base font-bold text-slate-900">
                Course Mastery
              </h2>
              <button
                onClick={() => onNavigateTab('subjects')}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
              >
                <span>All courses</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {subjects.length === 0 ? (
              <div className="p-6 text-center bg-white rounded-2xl border border-dashed border-slate-200 text-xs text-slate-500 space-y-2">
                <p>No subjects enrolled in database.</p>
                <button
                  onClick={() => onNavigateTab('subjects')}
                  className="text-indigo-600 font-semibold hover:underline"
                >
                  + Add subject
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {subjects.slice(0, 4).map((sub) => {
                  const topicCount = sub.topics?.length || 0;
                  const avgProgress =
                    topicCount > 0
                      ? Math.round(
                          sub.topics.reduce((sum, t) => sum + (t.progress || 0), 0) / topicCount
                        )
                      : 0;

                  return (
                    <div
                      key={sub.id}
                      onClick={() => onNavigateTab('subjects')}
                      className="p-4 bg-white rounded-2xl border border-slate-200/80 hover:border-indigo-300 hover:shadow-xs cursor-pointer transition-all duration-200 space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-xs text-slate-900 truncate pr-2">
                          {sub.name}
                        </h3>
                        <span className="text-[11px] font-extrabold text-indigo-600">
                          {avgProgress}%
                        </span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-300"
                          style={{ width: `${avgProgress}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <span>{topicCount} {topicCount === 1 ? 'topic' : 'topics'}</span>
                        <span className="text-indigo-600 font-semibold hover:underline">View details →</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (4 cols): Upcoming Exams & Quick Actions */}
        <div className="lg:col-span-4 space-y-4">
          {/* Upcoming Exams Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Calendar className="w-4 h-4" />
                </div>
                <h3 className="font-display font-bold text-sm text-slate-900">
                  Upcoming Exams
                </h3>
              </div>
              <button
                onClick={() => onNavigateTab('exams')}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer"
              >
                View all
              </button>
            </div>

            {loading ? (
              <div className="py-6 text-center text-xs text-slate-400">
                Loading exams...
              </div>
            ) : upcomingExamsWithDays.length === 0 ? (
              <div className="py-6 text-center space-y-2">
                <p className="text-xs text-slate-400">No exams scheduled.</p>
                <button
                  onClick={() => onNavigateTab('exams')}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:underline cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>Schedule exam</span>
                </button>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {upcomingExamsWithDays.slice(0, 4).map((exam) => {
                  const displayTitle = exam.cleanTitle || exam.title;
                  const subjectsDisplay =
                    exam.all_subjects && exam.all_subjects.length > 0
                      ? exam.all_subjects.map((s) => s.name).join(', ')
                      : exam.subjects?.name || 'Subject';

                  const isUrgent = exam.daysRemaining >= 0 && exam.daysRemaining <= 3;

                  return (
                    <div key={exam.id} className="py-3.5 flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <h4 className="font-semibold text-xs text-slate-900 truncate">
                          {displayTitle}
                        </h4>
                        <div className="flex items-center gap-1.5 flex-wrap mt-1">
                          <p className="text-[11px] text-slate-500 truncate">
                            {subjectsDisplay}
                          </p>
                          {exam.all_subjects && exam.all_subjects.length > 1 && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100">
                              {exam.all_subjects.length} subjects
                            </span>
                          )}
                        </div>
                      </div>

                      <span
                        className={`px-2.5 py-1 text-[11px] font-bold rounded-full shrink-0 ${
                          exam.daysRemaining < 0
                            ? 'bg-slate-100 text-slate-500'
                            : exam.daysRemaining === 0
                            ? 'bg-rose-500 text-white animate-pulse'
                            : isUrgent
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : exam.daysRemaining <= 7
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                        }`}
                      >
                        {exam.daysRemaining < 0
                          ? 'Past'
                          : exam.daysRemaining === 0
                          ? 'Today'
                          : `${exam.daysRemaining} days`}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick Hub Actions */}
          <div className="bg-gradient-to-br from-slate-50 to-indigo-50/30 rounded-2xl border border-slate-200/80 p-4 space-y-2">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1">
              Quick Shortcuts
            </div>
            <div className="space-y-1.5">
              <button
                onClick={() => onNavigateTab('subjects')}
                className="w-full flex items-center justify-between p-2.5 bg-white hover:bg-indigo-50/80 rounded-xl border border-slate-200/60 text-xs font-semibold text-slate-800 transition-all cursor-pointer shadow-2xs"
              >
                <div className="flex items-center gap-2.5">
                  <BookOpen className="w-4 h-4 text-indigo-600" />
                  <span>Manage Courses & Topics</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </button>

              <button
                onClick={() => onNavigateTab('exams')}
                className="w-full flex items-center justify-between p-2.5 bg-white hover:bg-indigo-50/80 rounded-xl border border-slate-200/60 text-xs font-semibold text-slate-800 transition-all cursor-pointer shadow-2xs"
              >
                <div className="flex items-center gap-2.5">
                  <Calendar className="w-4 h-4 text-indigo-600" />
                  <span>Exam Schedule</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </button>

              <button
                onClick={() => onNavigateTab('ai-assistant')}
                className="w-full flex items-center justify-between p-2.5 bg-white hover:bg-indigo-50/80 rounded-xl border border-slate-200/60 text-xs font-semibold text-slate-800 transition-all cursor-pointer shadow-2xs"
              >
                <div className="flex items-center gap-2.5">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>Ask AI Academic Assistant</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
