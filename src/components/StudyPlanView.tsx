import React, { useState } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  Clock,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Check,
  AlertCircle,
  X,
  Sparkles,
  Play,
  CheckCircle2,
  Flame,
} from 'lucide-react';
import {
  DbStudyPlan,
  StudyPlanItemWithDetails,
  TopicWithSubject,
  PriorityLevel,
} from '../types';
import {
  createStudyPlanItem,
  updateStudyPlanItem,
  deleteStudyPlanItem,
} from '../lib/api';

interface StudyPlanViewProps {
  selectedDate: string; // YYYY-MM-DD
  onDateChange: (date: string) => void;
  studyPlan: DbStudyPlan | null;
  items: StudyPlanItemWithDetails[];
  topics: TopicWithSubject[];
  loading: boolean;
  onRefresh: () => void;
  onNavigateToSubjects: () => void;
  onOpenAiPlan?: () => void;
  onStartTimer?: (item: StudyPlanItemWithDetails) => void;
}

export const StudyPlanView: React.FC<StudyPlanViewProps> = ({
  selectedDate,
  onDateChange,
  studyPlan,
  items,
  topics,
  loading,
  onRefresh,
  onNavigateToSubjects,
  onOpenAiPlan,
  onStartTimer,
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<StudyPlanItemWithDetails | null>(null);

  const [topicId, setTopicId] = useState('');
  const [startTime, setStartTime] = useState('');
  const [durationMinutes, setDurationMinutes] = useState<number>(30);
  const [priority, setPriority] = useState<PriorityLevel>('medium');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [deleteConfirmItem, setDeleteConfirmItem] = useState<StudyPlanItemWithDetails | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Navigate Date Helpers
  const handlePrevDay = () => {
    const current = new Date(selectedDate + 'T00:00:00');
    current.setDate(current.getDate() - 1);
    onDateChange(current.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    const current = new Date(selectedDate + 'T00:00:00');
    current.setDate(current.getDate() + 1);
    onDateChange(current.toISOString().split('T')[0]);
  };

  const handleToday = () => {
    onDateChange(new Date().toISOString().split('T')[0]);
  };

  const totalMinutes =
    studyPlan?.total_minutes ||
    items.reduce((acc, i) => acc + (i.duration_minutes || 0), 0);

  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  const completedCount = items.filter((i) => i.completed).length;
  const progressPercent = items.length > 0 ? Math.round((completedCount / items.length) * 100) : 0;

  const handleOpenCreate = () => {
    setActionError(null);
    if (topics.length === 0) {
      setActionError('Please create at least one subject and topic in Subjects before scheduling study tasks.');
      return;
    }
    setEditingItem(null);
    setTopicId(topics[0]?.id || '');
    setStartTime('');
    setDurationMinutes(30);
    setPriority('medium');
    setErrorMsg(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (item: StudyPlanItemWithDetails) => {
    setEditingItem(item);
    setTopicId(item.topic_id);
    setStartTime(item.start_time ? item.start_time.slice(0, 5) : '');
    setDurationMinutes(item.duration_minutes);
    setPriority(item.priority);
    setErrorMsg(null);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studyPlan) {
      setErrorMsg('No study plan loaded for this date.');
      return;
    }
    if (!topicId) {
      setErrorMsg('Please select a topic.');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      if (editingItem) {
        await updateStudyPlanItem(
          editingItem.id,
          {
            topic_id: topicId,
            start_time: startTime ? `${startTime}:00` : null,
            duration_minutes: durationMinutes,
            priority,
          },
          studyPlan.id
        );
      } else {
        await createStudyPlanItem({
          study_plan_id: studyPlan.id,
          topic_id: topicId,
          start_time: startTime ? `${startTime}:00` : null,
          duration_minutes: durationMinutes,
          priority,
        });
      }
      setModalOpen(false);
      onRefresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save study item');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleComplete = async (item: StudyPlanItemWithDetails) => {
    if (!studyPlan) return;
    try {
      await updateStudyPlanItem(
        item.id,
        { completed: !item.completed },
        studyPlan.id
      );
      onRefresh();
    } catch (err: any) {
      console.error('Failed to toggle completion:', err);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmItem || !studyPlan) return;
    setActionError(null);
    try {
      await deleteStudyPlanItem(deleteConfirmItem.id, studyPlan.id);
      setDeleteConfirmItem(null);
      onRefresh();
    } catch (err: any) {
      setActionError(err.message || 'Failed to delete task. Please try again.');
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300 max-w-7xl mx-auto">
      {/* Top Header with Date Navigator */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Daily Study Schedule
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Structure your study blocks, track completion rates, and trigger deep-focus timers.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap self-start lg:self-auto">
          {/* Date Selector Controls */}
          <div className="flex items-center bg-white rounded-2xl border border-slate-200/80 p-1 shadow-2xs">
            <button
              onClick={handlePrevDay}
              className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Previous Day"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <input
              type="date"
              value={selectedDate}
              onChange={(e) => onDateChange(e.target.value)}
              className="px-3 py-1.5 text-xs font-bold text-slate-800 bg-transparent focus:outline-none cursor-pointer"
            />

            <button
              onClick={handleNextDay}
              className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Next Day"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={handleToday}
            className="px-3.5 py-2.5 rounded-2xl bg-white border border-slate-200/80 hover:bg-slate-50 text-xs font-bold text-slate-700 transition-colors shadow-2xs cursor-pointer"
          >
            Today
          </button>

          {onOpenAiPlan && (
            <button
              id="btn-ai-generate-schedule"
              onClick={onOpenAiPlan}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-purple-50 to-indigo-50 hover:from-purple-100 hover:to-indigo-100 text-indigo-700 font-bold text-xs border border-indigo-200/70 transition-all shadow-xs active:scale-[0.98] cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>AI Plan Generator</span>
            </button>
          )}

          <button
            id="btn-add-study-task"
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 active:scale-[0.98] text-white font-bold text-xs sm:text-sm shadow-md shadow-indigo-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Task</span>
          </button>
        </div>
      </div>

      {/* Action Error Banner if any */}
      {actionError && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 flex items-center justify-between shadow-2xs">
          <span>{actionError}</span>
          <button
            onClick={() => setActionError(null)}
            className="text-rose-500 hover:text-rose-700 font-bold ml-2 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Date Summary Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] font-bold tracking-wider uppercase text-slate-400">
              Planned Duration • {selectedDate}
            </div>
            <div className="text-xl sm:text-2xl font-black font-display text-slate-900 mt-0.5">
              {hours}h {mins}m
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200/60 text-xs">
            <span className="text-slate-500 font-medium">Completed: </span>
            <strong className="text-slate-900 font-extrabold">{completedCount}</strong>
            <span className="text-slate-400 font-medium"> / {items.length} tasks</span>
          </div>

          {items.length > 0 && (
            <div className="flex items-center gap-2.5">
              <div className="w-32 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <span className="text-xs font-black text-slate-800">{progressPercent}%</span>
            </div>
          )}
        </div>
      </div>

      {/* Task List */}
      {loading ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 text-xs text-slate-400">
          Loading schedule for {selectedDate}...
        </div>
      ) : items.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-dashed border-indigo-200 space-y-4 shadow-2xs">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-50 to-purple-50 text-indigo-600 flex items-center justify-center mx-auto border border-indigo-100">
            <Sparkles className="w-7 h-7" />
          </div>
          <div className="max-w-md mx-auto">
            <h3 className="font-display font-extrabold text-base text-slate-900">
              No study tasks scheduled for this day.
            </h3>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              Use Gemini AI to instantly generate an optimized study plan tailored to your upcoming exams and weak topic areas.
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 flex-wrap pt-2">
            {onOpenAiPlan && (
              <button
                onClick={onOpenAiPlan}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-indigo-500/20 transition-all active:scale-[0.98] cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>Generate AI Study Plan</span>
              </button>
            )}
            <button
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Task Manually</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3.5">
          {items.map((item) => {
            const topicName = item.topics?.name || 'Topic';
            const subjectName = item.topics?.subjects?.name || 'Subject';

            return (
              <div
                key={item.id}
                id={`study-item-${item.id}`}
                className={`group bg-white rounded-3xl border p-4 sm:p-5 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  item.completed
                    ? 'border-slate-200 bg-slate-50/70 opacity-80'
                    : 'border-slate-200/80 hover:border-indigo-300 hover:shadow-md'
                }`}
              >
                <div className="flex items-start sm:items-center gap-4">
                  <button
                    onClick={() => handleToggleComplete(item)}
                    className={`mt-0.5 sm:mt-0 w-6 h-6 rounded-xl flex items-center justify-center transition-all shrink-0 cursor-pointer ${
                      item.completed
                        ? 'bg-emerald-500 text-white shadow-xs'
                        : 'border-2 border-slate-300 hover:border-indigo-600 hover:bg-indigo-50'
                    }`}
                    title={item.completed ? 'Mark as incomplete' : 'Mark as completed'}
                  >
                    {item.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </button>

                  <div>
                    <div className="font-bold text-sm sm:text-base text-slate-900 flex items-center gap-2 flex-wrap">
                      <span className="text-indigo-600 font-extrabold">{subjectName}</span>
                      <span className="text-slate-300">•</span>
                      <span className={item.completed ? 'line-through text-slate-400' : ''}>
                        {topicName}
                      </span>
                    </div>

                    <div className="text-xs text-slate-500 mt-1.5 flex items-center gap-3 flex-wrap">
                      <span className="flex items-center gap-1 font-semibold text-slate-600">
                        <Clock className="w-3.5 h-3.5 text-indigo-500" />
                        {item.duration_minutes} minutes
                      </span>

                      {item.start_time && (
                        <>
                          <span className="text-slate-300">•</span>
                          <span>Start at {item.start_time.slice(0, 5)}</span>
                        </>
                      )}

                      {item.topics?.difficulty && (
                        <>
                          <span className="text-slate-300">•</span>
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase ${
                              item.topics.difficulty === 'hard'
                                ? 'bg-rose-50 text-rose-700'
                                : item.topics.difficulty === 'medium'
                                ? 'bg-amber-50 text-amber-700'
                                : 'bg-emerald-50 text-emerald-700'
                            }`}
                          >
                            {item.topics.difficulty}
                          </span>
                        </>
                      )}

                      <span className="text-slate-300">•</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-slate-400 font-medium">Topic Mastery:</span>
                        <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                            style={{ width: `${item.topics?.progress || 0}%` }}
                          />
                        </div>
                        <span className="font-extrabold text-[11px] text-slate-700">
                          {item.topics?.progress || 0}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 self-end sm:self-center shrink-0">
                  {/* Start Timer Button */}
                  {!item.completed && onStartTimer && (
                    <button
                      id={`btn-study-timer-${item.id}`}
                      onClick={() => onStartTimer(item)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white font-bold text-xs border border-indigo-200/80 hover:border-indigo-600 transition-all shadow-2xs group cursor-pointer"
                      title="Start study focus timer for this task"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Start Timer</span>
                    </button>
                  )}

                  <span
                    className={`px-2.5 py-0.5 text-[10px] font-extrabold rounded-full uppercase shrink-0 ${
                      item.priority === 'high'
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : item.priority === 'medium'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-slate-50 text-slate-700 border border-slate-200'
                    }`}
                  >
                    {item.priority}
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(item)}
                      className="p-2 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                      title="Edit Task"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirmItem(item)}
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Delete Task"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL: Create / Edit Study Task */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-extrabold text-base text-slate-900">
                {editingItem ? 'Edit Study Task' : 'Schedule Study Task'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 text-xs text-rose-700 rounded-2xl flex items-center gap-2 shadow-2xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Select Topic <span className="text-rose-500">*</span>
                </label>
                <select
                  value={topicId}
                  onChange={(e) => setTopicId(e.target.value)}
                  required
                  className="w-full h-11 px-3.5 text-xs bg-slate-50/50 border border-slate-200 rounded-2xl text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white"
                >
                  {topics.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.subjects?.name ? `[${t.subjects.name}] ` : ''}
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">
                    Start Time (Optional)
                  </label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full h-11 px-3 text-xs bg-slate-50/50 border border-slate-200 rounded-2xl text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">
                    Duration (Mins) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="5"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(parseInt(e.target.value) || 30)}
                    required
                    className="w-full h-11 px-3 text-xs bg-slate-50/50 border border-slate-200 rounded-2xl text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Priority Level
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as PriorityLevel)}
                  className="w-full h-11 px-3 text-xs bg-slate-50/50 border border-slate-200 rounded-2xl text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white"
                >
                  <option value="low">Low Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="high">High Priority</option>
                </select>
              </div>

              <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white text-xs font-bold shadow-md shadow-indigo-500/20 disabled:opacity-50 transition-all cursor-pointer"
                >
                  {submitting ? 'Saving...' : editingItem ? 'Update Task' : 'Add Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation: Delete Task */}
      {deleteConfirmItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-sm w-full p-6 space-y-4">
            <h3 className="font-display font-extrabold text-base text-slate-900">
              Delete Study Task?
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Remove this study block from the schedule for {selectedDate}?
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirmItem(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 cursor-pointer shadow-xs"
              >
                Delete Task
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
