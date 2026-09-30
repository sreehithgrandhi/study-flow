import React, { useState } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  ChevronDown,
  ChevronUp,
  Clock,
  BookOpen,
  AlertCircle,
  CheckCircle2,
  X,
  Play,
  Layers,
  Sparkles,
  BarChart3,
} from 'lucide-react';
import {
  DbSubject,
  DbTopic,
  SubjectWithTopics,
  DifficultyLevel,
} from '../types';
import {
  createSubject,
  updateSubject,
  deleteSubject,
  createTopic,
  updateTopic,
  deleteTopic,
} from '../lib/api';

interface SubjectsViewProps {
  subjects: SubjectWithTopics[];
  loading: boolean;
  onRefresh: () => void;
  onStartTimer?: (topic: DbTopic) => void;
}

export const SubjectsView: React.FC<SubjectsViewProps> = ({
  subjects,
  loading,
  onRefresh,
  onStartTimer,
}) => {
  const [expandedSubjectId, setExpandedSubjectId] = useState<string | null>(
    subjects[0]?.id || null
  );

  // Subject Modals State
  const [subjectModalOpen, setSubjectModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<DbSubject | null>(null);
  const [subjectName, setSubjectName] = useState('');
  const [subjectDesc, setSubjectDesc] = useState('');
  const [subjectSubmitting, setSubjectSubmitting] = useState(false);
  const [subjectError, setSubjectError] = useState<string | null>(null);

  // Topic Modals State
  const [topicModalOpen, setTopicModalOpen] = useState(false);
  const [selectedSubjectIdForTopic, setSelectedSubjectIdForTopic] = useState<string>('');
  const [editingTopic, setEditingTopic] = useState<DbTopic | null>(null);
  const [topicName, setTopicName] = useState('');
  const [topicDifficulty, setTopicDifficulty] = useState<DifficultyLevel>('medium');
  const [topicProgress, setTopicProgress] = useState<number>(0);
  const [topicEstMinutes, setTopicEstMinutes] = useState<number>(60);
  const [topicSubmitting, setTopicSubmitting] = useState(false);
  const [topicError, setTopicError] = useState<string | null>(null);

  // Delete confirmations
  const [deleteConfirmSubject, setDeleteConfirmSubject] = useState<DbSubject | null>(null);
  const [deleteConfirmTopic, setDeleteConfirmTopic] = useState<DbTopic | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Open Create Subject Modal
  const handleOpenCreateSubject = () => {
    setEditingSubject(null);
    setSubjectName('');
    setSubjectDesc('');
    setSubjectError(null);
    setSubjectModalOpen(true);
  };

  // Open Edit Subject Modal
  const handleOpenEditSubject = (sub: DbSubject) => {
    setEditingSubject(sub);
    setSubjectName(sub.name);
    setSubjectDesc(sub.description || '');
    setSubjectError(null);
    setSubjectModalOpen(true);
  };

  // Submit Subject Form
  const handleSubjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectName.trim()) {
      setSubjectError('Subject name is required.');
      return;
    }

    setSubjectSubmitting(true);
    setSubjectError(null);

    try {
      if (editingSubject) {
        await updateSubject(editingSubject.id, subjectName, subjectDesc);
      } else {
        const created = await createSubject(subjectName, subjectDesc);
        setExpandedSubjectId(created.id);
      }
      setSubjectModalOpen(false);
      onRefresh();
    } catch (err: any) {
      setSubjectError(err.message || 'Failed to save subject');
    } finally {
      setSubjectSubmitting(false);
    }
  };

  // Confirm Delete Subject
  const handleDeleteSubject = async () => {
    if (!deleteConfirmSubject) return;
    setActionError(null);
    try {
      await deleteSubject(deleteConfirmSubject.id);
      setDeleteConfirmSubject(null);
      onRefresh();
    } catch (err: any) {
      setActionError(err.message || 'Failed to delete subject. Please try again.');
    }
  };

  // Open Create Topic Modal
  const handleOpenCreateTopic = (subjectId: string) => {
    setSelectedSubjectIdForTopic(subjectId);
    setEditingTopic(null);
    setTopicName('');
    setTopicDifficulty('medium');
    setTopicProgress(0);
    setTopicEstMinutes(60);
    setTopicError(null);
    setTopicModalOpen(true);
  };

  // Open Edit Topic Modal
  const handleOpenEditTopic = (topic: DbTopic) => {
    setSelectedSubjectIdForTopic(topic.subject_id);
    setEditingTopic(topic);
    setTopicName(topic.name);
    setTopicDifficulty(topic.difficulty);
    setTopicProgress(topic.progress);
    setTopicEstMinutes(topic.estimated_minutes);
    setTopicError(null);
    setTopicModalOpen(true);
  };

  // Submit Topic Form
  const handleTopicSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topicName.trim()) {
      setTopicError('Topic name is required.');
      return;
    }

    setTopicSubmitting(true);
    setTopicError(null);

    try {
      if (editingTopic) {
        await updateTopic(editingTopic.id, {
          name: topicName,
          difficulty: topicDifficulty,
          progress: topicProgress,
          estimated_minutes: topicEstMinutes,
        });
      } else {
        await createTopic({
          subject_id: selectedSubjectIdForTopic,
          name: topicName,
          difficulty: topicDifficulty,
          progress: topicProgress,
          estimated_minutes: topicEstMinutes,
        });
      }
      setTopicModalOpen(false);
      onRefresh();
    } catch (err: any) {
      setTopicError(err.message || 'Failed to save topic');
    } finally {
      setTopicSubmitting(false);
    }
  };

  // Inline Progress Update for Topic
  const handleQuickProgressUpdate = async (topicId: string, newProgress: number) => {
    try {
      await updateTopic(topicId, { progress: newProgress });
      onRefresh();
    } catch (err: any) {
      console.error('Failed to update progress:', err);
    }
  };

  // Confirm Delete Topic
  const handleDeleteTopic = async () => {
    if (!deleteConfirmTopic) return;
    setActionError(null);
    try {
      await deleteTopic(deleteConfirmTopic.id);
      setDeleteConfirmTopic(null);
      onRefresh();
    } catch (err: any) {
      setActionError(err.message || 'Failed to delete topic. Please try again.');
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Curriculum & Subjects
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Organize academic courses, break them down into modular topics, and track mastery percentages.
          </p>
        </div>

        <button
          id="btn-add-subject"
          onClick={handleOpenCreateSubject}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 active:scale-[0.98] text-white font-bold text-xs sm:text-sm shadow-md shadow-indigo-500/20 transition-all self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Subject</span>
        </button>
      </div>

      {/* Action Error Banner */}
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

      {/* Subjects List */}
      {loading ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 text-xs text-slate-400">
          Loading subjects from database...
        </div>
      ) : subjects.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-dashed border-indigo-200 space-y-4 shadow-2xs">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
            <BookOpen className="w-7 h-7" />
          </div>
          <div>
            <h3 className="font-display font-bold text-base text-slate-900">
              You haven't enrolled any subjects yet.
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
              Add your courses (e.g., Biology, Organic Chemistry, Data Structures) to organize revision topics and generate smart study plans.
            </p>
          </div>
          <button
            onClick={handleOpenCreateSubject}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition-all shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add First Subject</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {subjects.map((sub) => {
            const isExpanded = expandedSubjectId === sub.id;
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
                id={`subject-card-${sub.id}`}
                className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-xs hover:border-indigo-300 transition-all duration-200"
              >
                {/* Subject Header */}
                <div className="p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center font-display font-extrabold text-base shrink-0 shadow-xs">
                      {sub.name.slice(0, 2).toUpperCase()}
                    </div>

                    <div>
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <h2 className="font-display font-bold text-base sm:text-lg text-slate-900">
                          {sub.name}
                        </h2>
                        <span className="px-2.5 py-0.5 text-[11px] font-bold rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100">
                          {topicCount} {topicCount === 1 ? 'topic' : 'topics'}
                        </span>
                      </div>

                      {sub.description && (
                        <p className="text-xs text-slate-500 mt-1 max-w-xl leading-relaxed">
                          {sub.description}
                        </p>
                      )}

                      {/* Derived Average Progress Bar */}
                      <div className="mt-3 flex items-center gap-3 max-w-xs">
                        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-300"
                            style={{ width: `${avgProgress}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-slate-800">
                          {avgProgress}% mastery
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                    <button
                      onClick={() => handleOpenCreateTopic(sub.id)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white text-xs font-bold transition-all cursor-pointer border border-indigo-200/80 hover:border-indigo-600"
                      title="Add topic to this subject"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Topic</span>
                    </button>

                    <button
                      onClick={() => handleOpenEditSubject(sub)}
                      className="p-2 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                      title="Edit Subject"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => setDeleteConfirmSubject(sub)}
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Delete Subject"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => setExpandedSubjectId(isExpanded ? null : sub.id)}
                      className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors cursor-pointer"
                      aria-label={isExpanded ? 'Collapse' : 'Expand'}
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Collapsible Topics List */}
                {isExpanded && (
                  <div className="px-5 pb-5 sm:px-6 sm:pb-6 pt-3 border-t border-slate-100 bg-slate-50/50 space-y-3">
                    <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
                      <span>Curriculum Topics ({topicCount})</span>
                      <button
                        onClick={() => handleOpenCreateTopic(sub.id)}
                        className="text-[11px] font-bold text-indigo-600 hover:underline normal-case cursor-pointer"
                      >
                        + Add topic
                      </button>
                    </div>

                    {topicCount === 0 ? (
                      <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-slate-200 text-xs text-slate-500 space-y-2">
                        <p>No topics added to this subject yet.</p>
                        <button
                          onClick={() => handleOpenCreateTopic(sub.id)}
                          className="inline-flex items-center gap-1 text-indigo-600 font-bold hover:underline cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Create first topic</span>
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                        {sub.topics.map((topic) => (
                          <div
                            key={topic.id}
                            id={`topic-item-${topic.id}`}
                            className="p-4 bg-white rounded-2xl border border-slate-200/80 hover:border-indigo-300 hover:shadow-xs transition-all space-y-2.5"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h4 className="font-bold text-xs sm:text-sm text-slate-900">
                                  {topic.name}
                                </h4>
                                <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-1">
                                  <span
                                    className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase ${
                                      topic.difficulty === 'hard'
                                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                        : topic.difficulty === 'medium'
                                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    }`}
                                  >
                                    {topic.difficulty}
                                  </span>
                                  <span>•</span>
                                  <span className="flex items-center gap-1 font-medium">
                                    <Clock className="w-3 h-3 text-indigo-500" />
                                    {topic.estimated_minutes}m est.
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  onClick={() => handleOpenEditTopic(topic)}
                                  className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
                                  title="Edit Topic"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => setDeleteConfirmTopic(topic)}
                                  className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 cursor-pointer"
                                  title="Delete Topic"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            {/* Progress slider and percentage */}
                            <div className="pt-1">
                              <div className="flex items-center justify-between text-[11px] mb-1.5">
                                <span className="text-slate-500 font-medium">Mastery Progress</span>
                                <span className="font-extrabold text-indigo-600">{topic.progress}%</span>
                              </div>
                              <input
                                type="range"
                                min="0"
                                max="100"
                                value={topic.progress}
                                onChange={(e) =>
                                  handleQuickProgressUpdate(topic.id, parseInt(e.target.value))
                                }
                                className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                              />
                            </div>

                            {/* Start Study Timer button for this topic */}
                            {onStartTimer && (
                              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                                <span className="text-[11px] text-slate-400">Boost mastery with timer:</span>
                                <button
                                  onClick={() =>
                                    onStartTimer({
                                      ...topic,
                                      subjects: { name: sub.name },
                                    } as any)
                                  }
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white font-bold text-xs transition-all shadow-2xs group cursor-pointer"
                                  title="Start timer for this topic"
                                >
                                  <Play className="w-3 h-3 fill-current" />
                                  <span>Focus Topic</span>
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL: Create / Edit Subject */}
      {subjectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-extrabold text-base text-slate-900">
                {editingSubject ? 'Edit Subject' : 'Create New Subject'}
              </h3>
              <button
                onClick={() => setSubjectModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {subjectError && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 text-xs text-rose-700 rounded-2xl flex items-center gap-2 shadow-2xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{subjectError}</span>
              </div>
            )}

            <form onSubmit={handleSubjectSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Subject Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Molecular Biology, Calculus II, Computer Systems"
                  value={subjectName}
                  onChange={(e) => setSubjectName(e.target.value)}
                  required
                  className="w-full h-11 px-4 text-xs sm:text-sm bg-slate-50/50 border border-slate-200 rounded-2xl text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Course Description (Optional)
                </label>
                <textarea
                  placeholder="Brief syllabus outline or course goals"
                  value={subjectDesc}
                  onChange={(e) => setSubjectDesc(e.target.value)}
                  rows={3}
                  className="w-full p-3.5 text-xs sm:text-sm bg-slate-50/50 border border-slate-200 rounded-2xl text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all shadow-2xs"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSubjectModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={subjectSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white text-xs font-bold shadow-md shadow-indigo-500/20 disabled:opacity-50 transition-all cursor-pointer"
                >
                  {subjectSubmitting ? 'Saving...' : editingSubject ? 'Update Subject' : 'Create Subject'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Create / Edit Topic */}
      {topicModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-extrabold text-base text-slate-900">
                {editingTopic ? 'Edit Topic' : 'Add New Topic'}
              </h3>
              <button
                onClick={() => setTopicModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {topicError && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 text-xs text-rose-700 rounded-2xl flex items-center gap-2 shadow-2xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{topicError}</span>
              </div>
            )}

            <form onSubmit={handleTopicSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Topic Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Enzyme Kinetics, Graph Traversals, Partial Derivatives"
                  value={topicName}
                  onChange={(e) => setTopicName(e.target.value)}
                  required
                  className="w-full h-11 px-4 text-xs sm:text-sm bg-slate-50/50 border border-slate-200 rounded-2xl text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all shadow-2xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">
                    Difficulty Level
                  </label>
                  <select
                    value={topicDifficulty}
                    onChange={(e) => setTopicDifficulty(e.target.value as DifficultyLevel)}
                    className="w-full h-11 px-3 text-xs bg-slate-50/50 border border-slate-200 rounded-2xl text-slate-900 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">
                    Est. Minutes
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={topicEstMinutes}
                    onChange={(e) => setTopicEstMinutes(parseInt(e.target.value) || 60)}
                    required
                    className="w-full h-11 px-3 text-xs bg-slate-50/50 border border-slate-200 rounded-2xl text-slate-900 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs font-bold text-slate-800 mb-1.5">
                  <span>Initial Mastery:</span>
                  <span className="text-indigo-600 font-extrabold">{topicProgress}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={topicProgress}
                  onChange={(e) => setTopicProgress(parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setTopicModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={topicSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white text-xs font-bold shadow-md shadow-indigo-500/20 disabled:opacity-50 transition-all cursor-pointer"
                >
                  {topicSubmitting ? 'Saving...' : editingTopic ? 'Update Topic' : 'Add Topic'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation: Delete Subject */}
      {deleteConfirmSubject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-sm w-full p-6 space-y-4">
            <h3 className="font-display font-extrabold text-base text-slate-900">
              Delete Subject?
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Are you sure you want to delete <strong>{deleteConfirmSubject.name}</strong>? All topics and exams associated with this subject will also be deleted.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirmSubject(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteSubject}
                className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 cursor-pointer shadow-xs"
              >
                Delete Subject
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation: Delete Topic */}
      {deleteConfirmTopic && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-sm w-full p-6 space-y-4">
            <h3 className="font-display font-extrabold text-base text-slate-900">
              Delete Topic?
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Are you sure you want to delete <strong>{deleteConfirmTopic.name}</strong>?
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirmTopic(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteTopic}
                className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 cursor-pointer shadow-xs"
              >
                Delete Topic
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
