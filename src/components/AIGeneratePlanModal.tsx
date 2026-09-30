import React, { useState } from 'react';
import {
  Sparkles,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  X,
  Zap,
  ArrowRight,
  BookOpen,
  GraduationCap,
} from 'lucide-react';
import { TopicWithSubject, ExamWithSubject } from '../types';
import { getOrCreateStudyPlan, createStudyPlanItem } from '../lib/api';

interface AIGeneratePlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetDate: string; // YYYY-MM-DD
  topics: TopicWithSubject[];
  exams: ExamWithSubject[];
  onPlanApplied: () => void;
}

interface GeneratedTask {
  topic_id: string;
  topic_name: string;
  subject_name: string;
  duration_minutes: number;
  priority: 'high' | 'medium' | 'low';
  start_time?: string;
  ai_reason?: string;
}

export const AIGeneratePlanModal: React.FC<AIGeneratePlanModalProps> = ({
  isOpen,
  onClose,
  targetDate,
  topics,
  exams,
  onPlanApplied,
}) => {
  const [availableHours, setAvailableHours] = useState<number>(2);
  const [focusGoal, setFocusGoal] = useState<'balanced' | 'exams' | 'weak_topics'>('exams');
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [generatedPlan, setGeneratedPlan] = useState<{
    plan_summary: string;
    total_planned_minutes: number;
    tasks: GeneratedTask[];
    source?: string;
  } | null>(null);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (topics.length === 0) {
      setErrorMsg('Please add at least one subject and topic in the Subjects tab first.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setGeneratedPlan(null);

    try {
      const res = await fetch('/api/ai/generate-study-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: targetDate,
          availableMinutes: availableHours * 60,
          topics,
          exams,
          focusGoal:
            focusGoal === 'exams'
              ? 'Prioritize upcoming exams'
              : focusGoal === 'weak_topics'
              ? 'Prioritize lowest progress and highest difficulty topics'
              : 'Balanced revision across all courses',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate study plan from AI.');
      }

      setGeneratedPlan(data);
    } catch (err: any) {
      console.error('Failed to generate AI plan:', err);
      setErrorMsg(err.message || 'Something went wrong while generating the AI plan.');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyPlan = async () => {
    if (!generatedPlan || generatedPlan.tasks.length === 0) return;
    setApplying(true);
    setErrorMsg(null);

    try {
      const plan = await getOrCreateStudyPlan(targetDate);
      if (!plan) throw new Error('Could not create or retrieve study plan record.');

      for (const task of generatedPlan.tasks) {
        await createStudyPlanItem({
          study_plan_id: plan.id,
          topic_id: task.topic_id,
          start_time: task.start_time ? `${task.start_time}:00` : null,
          duration_minutes: task.duration_minutes,
          priority: task.priority,
        });
      }

      onPlanApplied();
      onClose();
    } catch (err: any) {
      const msg =
        typeof err === 'object' && err?.message
          ? err.message
          : typeof err === 'string'
          ? err
          : 'Failed to save generated tasks to database.';
      setErrorMsg(msg);
    } finally {
      setApplying(false);
    }
  };

  const isToday = targetDate === new Date().toISOString().split('T')[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col relative max-h-[92vh]">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                  AI Study Optimizer
                </span>
                <span className="text-slate-300">•</span>
                <span className="text-xs text-slate-500 font-medium">
                  {isToday ? "Today's Schedule" : targetDate}
                </span>
              </div>
              <h2 className="font-display text-lg sm:text-xl font-extrabold text-slate-900">
                Auto-Generate Daily Schedule
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
          {/* Configuration Form */}
          {!generatedPlan && !loading && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-2">
                  Target Study Duration
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { label: '1 Hour', hours: 1 },
                    { label: '2 Hours (Rec.)', hours: 2 },
                    { label: '3 Hours', hours: 3 },
                    { label: '4 Hours', hours: 4 },
                  ].map((opt) => (
                    <button
                      key={opt.hours}
                      type="button"
                      onClick={() => setAvailableHours(opt.hours)}
                      className={`p-3 rounded-2xl border text-xs font-bold text-center transition-all cursor-pointer ${
                        availableHours === opt.hours
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-xs'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-2">
                  Optimization Priority
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {[
                    {
                      id: 'exams' as const,
                      title: 'Upcoming Exams',
                      desc: 'Prioritize courses with nearest evaluation dates',
                      icon: GraduationCap,
                    },
                    {
                      id: 'weak_topics' as const,
                      title: 'Weakest Topics',
                      desc: 'Target lowest mastery & difficult topics first',
                      icon: Zap,
                    },
                    {
                      id: 'balanced' as const,
                      title: 'Balanced Rotation',
                      desc: 'Even study distribution across all courses',
                      icon: BookOpen,
                    },
                  ].map((goal) => {
                    const Icon = goal.icon;
                    return (
                      <button
                        key={goal.id}
                        type="button"
                        onClick={() => setFocusGoal(goal.id)}
                        className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                          focusGoal === goal.id
                            ? 'border-indigo-600 bg-indigo-50/70 shadow-xs'
                            : 'border-slate-200 bg-white hover:bg-slate-50'
                        }`}
                      >
                        <div
                          className={`w-8 h-8 rounded-xl flex items-center justify-center mb-2 shadow-2xs ${
                            focusGoal === goal.id
                              ? 'bg-indigo-600 text-white'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div
                          className={`text-xs font-bold ${
                            focusGoal === goal.id ? 'text-indigo-700' : 'text-slate-900'
                          }`}
                        >
                          {goal.title}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-1 leading-snug">
                          {goal.desc}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 text-xs text-slate-600 space-y-1">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  <span>AI Schedule Engine:</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Gemini analyzes {topics.length} curriculum topics, tracking mastery percentages and {exams.length} scheduled exam dates to size study blocks into realistic intervals with rest buffers.
                </p>
              </div>

              {errorMsg && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <button
                type="button"
                onClick={handleGenerate}
                disabled={topics.length === 0}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 active:scale-[0.98] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md shadow-indigo-500/20 transition-all cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>Generate Smart Study Schedule</span>
              </button>
            </div>
          )}

          {/* Loading Animation */}
          {loading && (
            <div className="py-14 text-center space-y-4">
              <div className="relative w-16 h-16 mx-auto">
                <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/30 animate-pulse">
                  <Sparkles className="w-8 h-8" />
                </div>
                <div className="absolute inset-0 rounded-3xl border-2 border-indigo-500 animate-ping opacity-25" />
              </div>
              <div>
                <h3 className="font-display text-base font-extrabold text-slate-900">
                  Gemini is Designing Your Study Plan...
                </h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Balancing exam deadlines, weakest topics, and optimal session durations.
                </p>
              </div>
            </div>
          )}

          {/* Generated Plan Preview */}
          {generatedPlan && !loading && (
            <div className="space-y-4">
              {/* AI Rationale Summary Banner */}
              <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 space-y-1.5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    AI Academic Recommendation
                  </span>
                  <span className="text-xs font-extrabold text-slate-800">
                    Total: {generatedPlan.total_planned_minutes} mins
                  </span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">
                  {generatedPlan.plan_summary}
                </p>
              </div>

              {/* Tasks List */}
              <div className="space-y-2.5">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Scheduled Tasks ({generatedPlan.tasks.length})
                </div>

                {generatedPlan.tasks.map((task, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs hover:border-indigo-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <div className="font-bold text-sm text-slate-900 flex items-center gap-2 flex-wrap">
                        <span className="text-indigo-600 font-extrabold">{task.subject_name}</span>
                        <span className="text-slate-300">•</span>
                        <span>{task.topic_name}</span>
                      </div>

                      <div className="text-xs text-slate-500 mt-1 flex items-center gap-2 flex-wrap">
                        <span className="flex items-center gap-1 font-semibold text-slate-600">
                          <Clock className="w-3.5 h-3.5 text-indigo-500" />
                          {task.duration_minutes} min
                        </span>
                        {task.start_time && (
                          <>
                            <span className="text-slate-300">•</span>
                            <span>Start at {task.start_time}</span>
                          </>
                        )}
                      </div>

                      {task.ai_reason && (
                        <div className="text-[11px] text-slate-600 mt-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100 italic">
                          "{task.ai_reason}"
                        </div>
                      )}
                    </div>

                    <span
                      className={`px-2.5 py-0.5 text-[10px] font-extrabold rounded-full uppercase self-start sm:self-center shrink-0 ${
                        task.priority === 'high'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : task.priority === 'medium'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-slate-50 text-slate-700 border border-slate-200'
                      }`}
                    >
                      {task.priority}
                    </span>
                  </div>
                ))}
              </div>

              {errorMsg && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setGeneratedPlan(null)}
                  disabled={applying}
                  className="px-4 py-3 rounded-2xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Adjust Options
                </button>

                <button
                  type="button"
                  onClick={handleApplyPlan}
                  disabled={applying}
                  className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 active:scale-[0.98] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md shadow-indigo-500/20 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {applying ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Applying to Schedule...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Add {generatedPlan.tasks.length} Tasks to Schedule</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
