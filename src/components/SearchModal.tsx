import React, { useState } from 'react';
import { Search, X, BookOpen, GraduationCap, Calendar, Clock, ArrowRight } from 'lucide-react';
import { SubjectWithTopics, ExamWithSubject, StudyPlanItemWithDetails, ActiveTab } from '../types';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  subjects: SubjectWithTopics[];
  exams: ExamWithSubject[];
  todayTasks: StudyPlanItemWithDetails[];
  onNavigate: (tab: ActiveTab) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  subjects,
  exams,
  todayTasks,
  onNavigate,
}) => {
  const [query, setQuery] = useState('');

  if (!isOpen) return null;

  const q = query.toLowerCase().trim();

  // Search subjects
  const matchedSubjects = q
    ? subjects.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          (s.description && s.description.toLowerCase().includes(q))
      )
    : [];

  // Search topics across subjects
  const matchedTopics: { topicName: string; subjectName: string; progress: number }[] = [];
  if (q) {
    subjects.forEach((s) => {
      s.topics?.forEach((t) => {
        if (t.name.toLowerCase().includes(q)) {
          matchedTopics.push({
            topicName: t.name,
            subjectName: s.name,
            progress: t.progress,
          });
        }
      });
    });
  }

  // Search exams
  const matchedExams = q
    ? exams.filter((e) => {
        const titleMatch = (e.cleanTitle || e.title || '').toLowerCase().includes(q);
        const subjectMatch =
          e.all_subjects && e.all_subjects.length > 0
            ? e.all_subjects.some((s) => s.name.toLowerCase().includes(q))
            : e.subjects?.name && e.subjects.name.toLowerCase().includes(q);
        return titleMatch || subjectMatch;
      })
    : [];

  const handleSelectTab = (tab: ActiveTab) => {
    onNavigate(tab);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-slate-950/40 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Search Input Bar */}
        <div className="flex items-center px-5 py-4 border-b border-slate-100 bg-slate-50/50">
          <Search className="w-5 h-5 text-indigo-500 shrink-0 mr-3" />
          <input
            type="text"
            autoFocus
            placeholder="Search subjects, topics, or exams..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full text-sm font-semibold text-slate-900 placeholder:text-slate-400 bg-transparent focus:outline-none"
          />
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 rounded-xl transition-colors cursor-pointer ml-2"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results Area */}
        <div className="max-h-96 overflow-y-auto p-4 space-y-4 text-xs">
          {!q ? (
            <div className="text-center py-10 text-slate-400 space-y-1">
              <p className="font-semibold text-slate-600">Quick Global Search</p>
              <p className="text-[11px] text-slate-400">Search instantly across courses, topic mastery, and exam schedules.</p>
            </div>
          ) : matchedSubjects.length === 0 &&
            matchedTopics.length === 0 &&
            matchedExams.length === 0 ? (
            <div className="text-center py-10 text-slate-400">
              No matching records found for "{query}".
            </div>
          ) : (
            <>
              {/* Matched Subjects */}
              {matchedSubjects.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Subjects ({matchedSubjects.length})
                  </div>
                  {matchedSubjects.map((sub) => (
                    <div
                      key={sub.id}
                      onClick={() => handleSelectTab('subjects')}
                      className="flex items-center justify-between p-3 rounded-2xl hover:bg-indigo-50/70 border border-transparent hover:border-indigo-100 cursor-pointer transition-all"
                    >
                      <div className="flex items-center gap-2.5">
                        <BookOpen className="w-4 h-4 text-indigo-600" />
                        <span className="font-bold text-slate-900">{sub.name}</span>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-400" />
                    </div>
                  ))}
                </div>
              )}

              {/* Matched Topics */}
              {matchedTopics.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Topics ({matchedTopics.length})
                  </div>
                  {matchedTopics.map((t, idx) => (
                    <div
                      key={idx}
                      onClick={() => handleSelectTab('subjects')}
                      className="flex items-center justify-between p-3 rounded-2xl hover:bg-indigo-50/70 border border-transparent hover:border-indigo-100 cursor-pointer transition-all"
                    >
                      <div>
                        <div className="font-bold text-slate-900">{t.topicName}</div>
                        <div className="text-[11px] text-slate-500 font-medium">{t.subjectName}</div>
                      </div>
                      <span className="text-xs font-black text-indigo-600">{t.progress}%</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Matched Exams */}
              {matchedExams.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Exams ({matchedExams.length})
                  </div>
                  {matchedExams.map((ex) => {
                    const displayTitle = ex.cleanTitle || ex.title;
                    const subjectNames =
                      ex.all_subjects && ex.all_subjects.length > 0
                        ? ex.all_subjects.map((s) => s.name).join(', ')
                        : ex.subjects?.name || 'Subject';
                    return (
                      <div
                        key={ex.id}
                        onClick={() => handleSelectTab('exams')}
                        className="flex items-center justify-between p-3 rounded-2xl hover:bg-indigo-50/70 border border-transparent hover:border-indigo-100 cursor-pointer transition-all"
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-2">
                          <GraduationCap className="w-4 h-4 text-indigo-600 shrink-0" />
                          <div className="min-w-0">
                            <div className="font-bold text-slate-900 truncate">{displayTitle}</div>
                            <div className="text-[11px] text-slate-500 font-medium truncate">{subjectNames}</div>
                          </div>
                        </div>
                        <span className="text-[11px] text-slate-600 font-bold shrink-0">{ex.exam_date}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
