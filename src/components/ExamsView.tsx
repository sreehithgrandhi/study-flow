import React, { useState, useMemo } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  Calendar,
  AlertCircle,
  X,
  GraduationCap,
  Check,
  Search,
  BookOpen,
  Layers,
  Clock,
  Flame,
} from 'lucide-react';
import {
  ExamWithSubject,
  DbSubject,
  PriorityLevel,
} from '../types';
import {
  createExam,
  updateExam,
  deleteExam,
} from '../lib/api';

interface ExamsViewProps {
  exams: ExamWithSubject[];
  subjects: DbSubject[];
  loading: boolean;
  onRefresh: () => void;
  onNavigateToSubjects: () => void;
}

export const ExamsView: React.FC<ExamsViewProps> = ({
  exams,
  subjects,
  loading,
  onRefresh,
  onNavigateToSubjects,
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingExam, setEditingExam] = useState<ExamWithSubject | null>(null);

  const [title, setTitle] = useState('');
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([]);
  const [subjectSearch, setSubjectSearch] = useState('');
  const [examDate, setExamDate] = useState('');
  const [priority, setPriority] = useState<PriorityLevel>('medium');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Subject filtering for the view
  const [activeSubjectFilter, setActiveSubjectFilter] = useState<string>('all');

  const [deleteConfirmExam, setDeleteConfirmExam] = useState<ExamWithSubject | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Calculate days remaining strictly from database exam_date
  const todayMs = new Date().setHours(0, 0, 0, 0);

  const examsWithCalculated = useMemo(() => {
    return exams.map((exam) => {
      const examDateObj = new Date(exam.exam_date + 'T00:00:00');
      const diffDays = Math.ceil((examDateObj.getTime() - todayMs) / (1000 * 60 * 60 * 24));
      
      // Resolve all associated subjects
      const resolvedSubjects =
        exam.all_subjects && exam.all_subjects.length > 0
          ? exam.all_subjects
          : exam.subjects
          ? [exam.subjects]
          : [];

      return {
        ...exam,
        resolvedSubjects,
        daysRemaining: diffDays,
        isOverdue: diffDays < 0,
        isToday: diffDays === 0,
      };
    });
  }, [exams, todayMs]);

  // Filter exams by active subject filter
  const displayedExams = useMemo(() => {
    if (activeSubjectFilter === 'all') return examsWithCalculated;
    return examsWithCalculated.filter((exam) => {
      if (exam.subject_ids && exam.subject_ids.length > 0) {
        return exam.subject_ids.includes(activeSubjectFilter);
      }
      return exam.subject_id === activeSubjectFilter;
    });
  }, [examsWithCalculated, activeSubjectFilter]);

  const handleOpenCreate = () => {
    setActionError(null);
    if (subjects.length === 0) {
      setActionError('Please create at least one subject in Subjects before adding an exam.');
      return;
    }
    setEditingExam(null);
    setTitle('');
    setSelectedSubjectIds(subjects[0] ? [subjects[0].id] : []);
    setSubjectSearch('');
    setExamDate(new Date().toISOString().split('T')[0]);
    setPriority('medium');
    setErrorMsg(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (exam: ExamWithSubject) => {
    setEditingExam(exam);
    setTitle(exam.cleanTitle || exam.title);
    const initialIds =
      exam.subject_ids && exam.subject_ids.length > 0
        ? exam.subject_ids
        : exam.subject_id
        ? [exam.subject_id]
        : [];
    setSelectedSubjectIds(initialIds);
    setSubjectSearch('');
    setExamDate(exam.exam_date);
    setPriority(exam.priority);
    setErrorMsg(null);
    setModalOpen(true);
  };

  const handleToggleSubject = (subjectId: string) => {
    setSelectedSubjectIds((prev) => {
      if (prev.includes(subjectId)) {
        return prev.filter((id) => id !== subjectId);
      } else {
        return [...prev, subjectId];
      }
    });
  };

  const handleSelectAllSubjects = () => {
    setSelectedSubjectIds(subjects.map((s) => s.id));
  };

  const handleClearSubjects = () => {
    setSelectedSubjectIds([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('Exam title is required.');
      return;
    }
    if (selectedSubjectIds.length === 0) {
      setErrorMsg('Please select at least one subject for this exam.');
      return;
    }
    if (!examDate) {
      setErrorMsg('Exam date is required.');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      if (editingExam) {
        await updateExam(editingExam.id, {
          title: title.trim(),
          subject_ids: selectedSubjectIds,
          subject_id: selectedSubjectIds[0],
          exam_date: examDate,
          priority,
        });
      } else {
        await createExam({
          title: title.trim(),
          subject_ids: selectedSubjectIds,
          subject_id: selectedSubjectIds[0],
          exam_date: examDate,
          priority,
        });
      }
      setModalOpen(false);
      onRefresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save exam');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmExam) return;
    setActionError(null);
    try {
      await deleteExam(deleteConfirmExam.id);
      setDeleteConfirmExam(null);
      onRefresh();
    } catch (err: any) {
      setActionError(err.message || 'Failed to delete exam. Please try again.');
    }
  };

  // Filter subjects in modal search
  const filteredModalSubjects = useMemo(() => {
    if (!subjectSearch.trim()) return subjects;
    const term = subjectSearch.toLowerCase().trim();
    return subjects.filter((s) => s.name.toLowerCase().includes(term));
  }, [subjects, subjectSearch]);

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Exam Timetable
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Track evaluation dates, multi-subject schedules, priorities, and countdown milestones.
          </p>
        </div>

        <button
          id="btn-add-exam"
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 active:scale-[0.98] text-white font-bold text-xs sm:text-sm shadow-md shadow-indigo-500/20 transition-all self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Exam</span>
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

      {/* Subject Filter Bar */}
      {subjects.length > 1 && exams.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <span className="text-slate-400 text-[11px] font-bold uppercase tracking-wider shrink-0 mr-1">
            Filter:
          </span>
          <button
            onClick={() => setActiveSubjectFilter('all')}
            className={`px-3.5 py-1.5 rounded-xl font-bold transition-all shrink-0 cursor-pointer ${
              activeSubjectFilter === 'all'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            All Subjects ({exams.length})
          </button>
          {subjects.map((sub) => {
            const count = exams.filter((e) =>
              e.subject_ids?.includes(sub.id) || e.subject_id === sub.id
            ).length;
            if (count === 0) return null;
            return (
              <button
                key={sub.id}
                onClick={() => setActiveSubjectFilter(sub.id)}
                className={`px-3.5 py-1.5 rounded-xl font-bold transition-all shrink-0 cursor-pointer ${
                  activeSubjectFilter === sub.id
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {sub.name} ({count})
              </button>
            );
          })}
        </div>
      )}

      {/* Main Exams Grid */}
      {loading ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 text-xs text-slate-400">
          Loading exams from Supabase...
        </div>
      ) : displayedExams.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-dashed border-indigo-200 space-y-4 shadow-2xs">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
            <GraduationCap className="w-7 h-7" />
          </div>
          <div>
            <h3 className="font-display font-bold text-base text-slate-900">
              {activeSubjectFilter !== 'all' ? 'No exams found for this subject.' : 'No exams scheduled yet.'}
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
              {activeSubjectFilter !== 'all'
                ? 'Try selecting a different filter or schedule an exam for this subject.'
                : 'Add upcoming tests, midterms, or finals to unlock countdown timers and automated AI revision scheduling.'}
            </p>
          </div>
          <div className="flex items-center justify-center gap-2 pt-1">
            {activeSubjectFilter !== 'all' ? (
              <button
                onClick={() => setActiveSubjectFilter('all')}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-800 text-xs font-bold hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Show All Exams
              </button>
            ) : (
              <button
                onClick={handleOpenCreate}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition-colors shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Exam</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {displayedExams.map((exam) => {
            const displayTitle = exam.cleanTitle || exam.title;
            const subjectBadges = exam.resolvedSubjects;
            const isUrgent = exam.daysRemaining >= 0 && exam.daysRemaining <= 3;

            return (
              <div
                key={exam.id}
                id={`exam-card-${exam.id}`}
                className="group bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 hover:border-indigo-300 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  {/* Subjects Badges & Priority */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5 flex-1">
                      {subjectBadges.length > 0 ? (
                        subjectBadges.map((s) => (
                          <span
                            key={s.id}
                            className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-100"
                          >
                            {s.name}
                          </span>
                        ))
                      ) : (
                        <span className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-slate-100 text-slate-600">
                          Subject
                        </span>
                      )}

                      {subjectBadges.length > 1 && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-extrabold rounded-lg bg-purple-50 text-purple-700 border border-purple-200">
                          <Layers className="w-3 h-3" />
                          <span>{subjectBadges.length} Subjects</span>
                        </span>
                      )}
                    </div>

                    <span
                      className={`px-2.5 py-0.5 text-[10px] font-extrabold rounded-full uppercase shrink-0 ${
                        exam.priority === 'high'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : exam.priority === 'medium'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-slate-50 text-slate-700 border border-slate-200'
                      }`}
                    >
                      {exam.priority}
                    </span>
                  </div>

                  <h3 className="font-display font-extrabold text-base text-slate-900 leading-snug">
                    {displayTitle}
                  </h3>
                </div>

                <div className="space-y-3 pt-3 border-t border-slate-100">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 text-slate-500 font-medium">
                      <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                      <span>{exam.exam_date}</span>
                    </div>

                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        exam.isOverdue
                          ? 'bg-slate-100 text-slate-400'
                          : exam.isToday
                          ? 'bg-rose-600 text-white animate-pulse'
                          : isUrgent
                          ? 'bg-rose-50 text-rose-700 border border-rose-200 font-extrabold'
                          : exam.daysRemaining <= 7
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                      }`}
                    >
                      {exam.isOverdue
                        ? 'Passed'
                        : exam.isToday
                        ? 'Today'
                        : `${exam.daysRemaining} days left`}
                    </span>
                  </div>

                  <div className="flex justify-end gap-1.5 pt-1">
                    <button
                      onClick={() => handleOpenEdit(exam)}
                      className="p-2 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                      title="Edit Exam"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirmExam(exam)}
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Delete Exam"
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

      {/* MODAL: Create / Edit Exam with Multi-Subject Selection */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center shadow-xs">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <h3 className="font-display font-extrabold text-base text-slate-900">
                  {editingExam ? 'Edit Exam' : 'Schedule New Exam'}
                </h3>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
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
                  Exam Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Midterm Exams, Semester Finals, Combined Sciences"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="w-full h-11 px-4 text-xs sm:text-sm bg-slate-50/50 border border-slate-200 rounded-2xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all shadow-2xs"
                />
              </div>

              {/* Multiple Subject Selection Section */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-800">
                    Covered Subjects <span className="text-rose-500">*</span>
                    <span className="ml-1.5 text-[11px] font-medium text-slate-400">
                      ({selectedSubjectIds.length} {selectedSubjectIds.length === 1 ? 'subject' : 'subjects'} selected)
                    </span>
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSelectAllSubjects}
                      className="text-[11px] font-bold text-indigo-600 hover:underline cursor-pointer"
                    >
                      Select all
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={handleClearSubjects}
                      className="text-[11px] font-semibold text-slate-500 hover:text-slate-700 cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                {/* Filter input if many subjects */}
                {subjects.length > 4 && (
                  <div className="relative mb-2">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      placeholder="Search subjects..."
                      value={subjectSearch}
                      onChange={(e) => setSubjectSearch(e.target.value)}
                      className="w-full h-9 pl-9 pr-3 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                )}

                {/* Multi-Select Subject Cards / Checkboxes */}
                <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-2xl p-2 bg-slate-50/50 space-y-1">
                  {filteredModalSubjects.length === 0 ? (
                    <div className="py-4 text-center text-xs text-slate-400">
                      No matching subjects found.
                    </div>
                  ) : (
                    filteredModalSubjects.map((sub) => {
                      const isSelected = selectedSubjectIds.includes(sub.id);
                      return (
                        <div
                          key={sub.id}
                          onClick={() => handleToggleSubject(sub.id)}
                          className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all border ${
                            isSelected
                              ? 'bg-indigo-50/90 border-indigo-200 text-indigo-700 font-bold'
                              : 'bg-white border-slate-200/60 hover:border-slate-300 text-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div
                              className={`w-4 h-4 rounded-md flex items-center justify-center border transition-colors ${
                                isSelected
                                  ? 'bg-indigo-600 border-indigo-600 text-white'
                                  : 'border-slate-300 bg-white'
                              }`}
                            >
                              {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>
                            <span className="text-xs truncate">{sub.name}</span>
                          </div>

                          {isSelected && (
                            <span className="text-[10px] font-bold text-indigo-700 px-2 py-0.5 rounded-md bg-white border border-indigo-200">
                              Selected
                            </span>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Selected Subject Badges */}
                {selectedSubjectIds.length > 0 && (
                  <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] text-slate-400 font-semibold mr-1">
                      Selected:
                    </span>
                    {selectedSubjectIds.map((id) => {
                      const sub = subjects.find((s) => s.id === id);
                      if (!sub) return null;
                      return (
                        <span
                          key={id}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200"
                        >
                          <span className="truncate max-w-[150px]">{sub.name}</span>
                          <button
                            type="button"
                            onClick={() => handleToggleSubject(id)}
                            className="text-indigo-400 hover:text-rose-600 ml-1 rounded-sm cursor-pointer"
                            title="Remove subject"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">
                    Exam Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={examDate}
                    onChange={(e) => setExamDate(e.target.value)}
                    required
                    className="w-full h-11 px-3 text-xs bg-slate-50/50 border border-slate-200 rounded-2xl text-slate-800 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">
                    Priority Level
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as PriorityLevel)}
                    className="w-full h-11 px-3 text-xs bg-slate-50/50 border border-slate-200 rounded-2xl text-slate-800 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="high">High Priority</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
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
                  {submitting ? 'Saving...' : editingExam ? 'Update Exam' : 'Add Exam'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation: Delete Exam */}
      {deleteConfirmExam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-sm w-full p-6 space-y-4">
            <h3 className="font-display font-extrabold text-base text-slate-900">
              Delete Exam?
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Are you sure you want to delete <strong>{deleteConfirmExam.cleanTitle || deleteConfirmExam.title}</strong>? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirmExam(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 cursor-pointer shadow-xs"
              >
                Delete Exam
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
