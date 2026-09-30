import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  Clock,
  Sparkles,
  X,
  BookOpen,
  TrendingUp,
  Award,
  Zap,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { StudyPlanItemWithDetails, TopicWithSubject } from '../types';
import { updateTopic, updateStudyPlanItem } from '../lib/api';
import { playStudyCompletionChime } from '../utils/audioChime';

interface StudyFocusTimerModalProps {
  isOpen: boolean;
  onClose: () => void;
  task?: StudyPlanItemWithDetails | null;
  topic?: TopicWithSubject | null;
  studyPlanId?: string | null;
  onSessionFinished: () => void;
}

export const StudyFocusTimerModal: React.FC<StudyFocusTimerModalProps> = ({
  isOpen,
  onClose,
  task,
  topic,
  studyPlanId,
  onSessionFinished,
}) => {
  // Resolve active topic and subject info
  const activeTopic = topic || (task?.topics as TopicWithSubject | undefined);
  const topicName = activeTopic?.name || 'Academic Topic';
  const subjectName = activeTopic?.subjects?.name || 'Subject';
  const initialProgress = activeTopic?.progress ?? 0;

  // Initial duration in minutes
  const defaultMinutes = task?.duration_minutes || activeTopic?.estimated_minutes || 25;

  const [selectedMinutes, setSelectedMinutes] = useState<number>(defaultMinutes);
  const [totalSeconds, setTotalSeconds] = useState<number>(defaultMinutes * 60);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(defaultMinutes * 60);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [hasStarted, setHasStarted] = useState<boolean>(false);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [savingProgress, setSavingProgress] = useState<boolean>(false);
  const [updatedProgressValue, setUpdatedProgressValue] = useState<number>(initialProgress);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync with prop changes when modal opens
  useEffect(() => {
    if (isOpen) {
      const mins = task?.duration_minutes || 25;
      setSelectedMinutes(mins);
      setTotalSeconds(mins * 60);
      setSecondsRemaining(mins * 60);
      setIsRunning(false);
      setHasStarted(false);
      setIsCompleted(false);
      setSavingProgress(false);
      setUpdatedProgressValue(initialProgress);
    }
  }, [isOpen, task?.id, task?.duration_minutes, initialProgress]);

  // Main countdown tick
  useEffect(() => {
    if (isRunning && secondsRemaining > 0) {
      timerRef.current = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            handleTimerFinished();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, secondsRemaining]);

  // Handle changing preset time
  const handleSetPresetTime = (minutes: number, isSeconds = false) => {
    if (isRunning) return;
    const secs = isSeconds ? minutes : minutes * 60;
    setSelectedMinutes(isSeconds ? 1 : minutes);
    setTotalSeconds(secs);
    setSecondsRemaining(secs);
    setHasStarted(false);
  };

  // Calculate progress boost based on duration
  const calculateProgressGain = (studySecs: number) => {
    const estimatedMinutes = activeTopic?.estimated_minutes || 60;
    const studyMinutes = Math.max(0.5, studySecs / 60);
    const proportionalGain = Math.round((studyMinutes / estimatedMinutes) * 100);
    const gain = Math.max(15, Math.min(45, proportionalGain || 25));
    return gain;
  };

  // Complete and save progress to DB
  const saveProgressToDb = async (secondsStudied: number) => {
    if (!activeTopic) return;
    setSavingProgress(true);

    const gain = calculateProgressGain(secondsStudied);
    const newProgress = Math.min(100, (activeTopic.progress || 0) + gain);
    setUpdatedProgressValue(newProgress);

    try {
      await updateTopic(activeTopic.id, { progress: newProgress });

      if (task && (studyPlanId || task.study_plan_id)) {
        await updateStudyPlanItem(
          task.id,
          { completed: true },
          studyPlanId || task.study_plan_id
        );
      }

      playStudyCompletionChime();
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#4f46e5', '#7c3aed', '#10b981', '#f59e0b'],
      });

      onSessionFinished();
    } catch (err) {
      console.error('Failed to update progress after study timer:', err);
    } finally {
      setSavingProgress(false);
      setIsCompleted(true);
    }
  };

  const handleTimerFinished = () => {
    setIsRunning(false);
    saveProgressToDb(totalSeconds);
  };

  const handleFinishEarly = () => {
    if (!hasStarted) return;
    setIsRunning(false);
    const timeSpent = Math.max(10, totalSeconds - secondsRemaining);
    saveProgressToDb(timeSpent);
  };

  const handleReset = () => {
    setIsRunning(false);
    setSecondsRemaining(totalSeconds);
    setHasStarted(false);
  };

  const toggleRunning = () => {
    setIsRunning((prev) => !prev);
    setHasStarted(true);
  };

  // Format time MM:SS
  const mins = Math.floor(secondsRemaining / 60);
  const secs = secondsRemaining % 60;
  const formattedTime = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  // SVG Progress calculation
  const percentComplete = totalSeconds > 0 ? ((totalSeconds - secondsRemaining) / totalSeconds) * 100 : 0;
  const radius = 96;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentComplete / 100) * circumference;

  const estimatedGain = calculateProgressGain(totalSeconds);
  const projectedProgress = Math.min(100, initialProgress + estimatedGain);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden flex flex-col relative max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center font-bold shadow-xs">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                  {subjectName}
                </span>
                <span className="text-slate-300">•</span>
                <span className="text-xs text-slate-500 font-medium">Deep Focus Mode</span>
              </div>
              <h2 className="font-display text-base sm:text-lg font-extrabold text-slate-900 line-clamp-1">
                {topicName}
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

        {/* Modal Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6">
          {!isCompleted ? (
            <>
              {/* Progress Projection Card */}
              <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-white text-indigo-600 flex items-center justify-center shadow-xs shrink-0 border border-indigo-100">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[11px] font-semibold text-slate-500">
                      Topic Mastery
                    </div>
                    <div className="text-xs font-extrabold text-slate-900">
                      Current: <span className="text-indigo-600">{initialProgress}%</span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span className="inline-flex items-center gap-1 text-xs font-extrabold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                    +{estimatedGain}% after timer ➔ {projectedProgress}%
                  </span>
                </div>
              </div>

              {/* Timer Circular Display */}
              <div className="flex flex-col items-center justify-center py-2">
                <div className="relative w-56 h-56 flex items-center justify-center">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 220 220">
                    <defs>
                      <linearGradient id="timerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#4f46e5" />
                        <stop offset="100%" stopColor="#7c3aed" />
                      </linearGradient>
                    </defs>
                    {/* Background track */}
                    <circle
                      cx="110"
                      cy="110"
                      r={radius}
                      stroke="#f1f5f9"
                      strokeWidth="12"
                      fill="transparent"
                    />
                    {/* Progress track */}
                    <circle
                      cx="110"
                      cy="110"
                      r={radius}
                      stroke="url(#timerGradient)"
                      strokeWidth="12"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                      fill="transparent"
                      className="transition-all duration-1000 ease-linear"
                    />
                  </svg>

                  {/* Centered Digital Countdown */}
                  <div className="absolute flex flex-col items-center justify-center text-center">
                    <span className="font-display font-black text-4xl sm:text-5xl text-slate-900 tracking-tight tabular-nums">
                      {formattedTime}
                    </span>
                    <span className="text-xs font-bold text-slate-500 mt-1 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-indigo-500" />
                      {isRunning ? 'Focus In Progress' : hasStarted ? 'Timer Paused' : 'Ready to Start'}
                    </span>
                  </div>
                </div>

                {/* Preset Duration Buttons */}
                {!hasStarted && (
                  <div className="flex items-center flex-wrap justify-center gap-2 mt-4">
                    {[
                      { label: '10s (Test)', mins: 10, isSec: true },
                      { label: '15m', mins: 15, isSec: false },
                      { label: '25m (Pomodoro)', mins: 25, isSec: false },
                      { label: '30m', mins: 30, isSec: false },
                      { label: '45m', mins: 45, isSec: false },
                      { label: '60m', mins: 60, isSec: false },
                    ].map((preset, idx) => {
                      const isSelected = preset.isSec
                        ? totalSeconds === preset.mins
                        : totalSeconds === preset.mins * 60;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSetPresetTime(preset.mins, preset.isSec)}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-indigo-600 text-white shadow-xs'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {preset.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleReset}
                  disabled={!hasStarted}
                  className="p-3.5 rounded-2xl border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
                  title="Reset Timer"
                >
                  <RotateCcw className="w-5 h-5" />
                </button>

                <button
                  type="button"
                  id="btn-timer-toggle"
                  onClick={toggleRunning}
                  className={`px-8 py-3.5 rounded-2xl font-extrabold text-sm text-white shadow-md flex items-center gap-2.5 transition-all active:scale-95 cursor-pointer ${
                    isRunning
                      ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20'
                      : 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 shadow-indigo-500/20'
                  }`}
                >
                  {isRunning ? (
                    <>
                      <Pause className="w-5 h-5 fill-current" />
                      <span>Pause</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5 fill-current" />
                      <span>{hasStarted ? 'Resume Focus' : 'Start Focus Timer'}</span>
                    </>
                  )}
                </button>

                {hasStarted && (
                  <button
                    type="button"
                    onClick={handleFinishEarly}
                    disabled={savingProgress}
                    className="px-4 py-3 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 font-bold text-xs transition-colors cursor-pointer"
                  >
                    Finish & Log
                  </button>
                )}
              </div>

              {/* AI Study Strategy Tip */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 text-xs text-slate-600 flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-900 font-bold">Active Recall Technique:</strong>{' '}
                  Try summarizing core principles from memory onto paper before looking back at your course reference materials.
                </div>
              </div>
            </>
          ) : (
            /* Celebration Screen when Timer Completes */
            <div className="py-6 text-center space-y-5 animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
                <Award className="w-8 h-8" />
              </div>

              <div>
                <h3 className="font-display text-xl sm:text-2xl font-black text-slate-900">
                  Study Session Complete! 🎉
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  You completed your deep-focus block on{' '}
                  <strong className="text-slate-900">{topicName}</strong>.
                </p>
              </div>

              {/* Progress Update Card */}
              <div className="p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200 max-w-sm mx-auto text-left space-y-3 shadow-2xs">
                <div className="flex items-center justify-between text-xs font-bold text-emerald-900">
                  <span>Topic Progress Boosted!</span>
                  <span className="font-extrabold text-emerald-700">+{estimatedGain}% gain</span>
                </div>

                {/* Progress bar visual */}
                <div className="w-full h-3 bg-emerald-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-700"
                    style={{ width: `${updatedProgressValue}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Previous: {initialProgress}%</span>
                  <span className="font-bold text-emerald-800">
                    New Mastery: {updatedProgressValue}%
                  </span>
                </div>

                {task && (
                  <div className="pt-2 border-t border-emerald-200/60 text-[11px] text-emerald-800 flex items-center gap-1.5 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Task marked as completed in today's study plan.</span>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold text-xs sm:text-sm transition-all shadow-md shadow-indigo-500/20 cursor-pointer"
              >
                Back to Workspace
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
