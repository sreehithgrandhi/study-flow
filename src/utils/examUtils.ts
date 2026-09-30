import { DbSubject, ExamWithSubject } from '../types';

const METADATA_TAG_REGEX = /\s*<!--(?:studyflow_subjects|subj):(.*?)-->/g;

/**
 * Encodes an exam title with multiple subject IDs if more than one subject is assigned.
 * Primary subject is always stored in exam.subject_id to satisfy relational foreign keys.
 * Additional subject IDs are embedded seamlessly in metadata.
 */
export function encodeExamTitle(cleanTitle: string, subjectIds: string[]): string {
  const sanitizedTitle = cleanTitle.replace(METADATA_TAG_REGEX, '').trim();
  const validIds = Array.from(new Set(subjectIds.filter(Boolean)));

  if (validIds.length <= 1) {
    return sanitizedTitle;
  }

  return `${sanitizedTitle} <!--studyflow_subjects:${JSON.stringify(validIds)}-->`;
}

/**
 * Parses raw exam title to extract clean user-facing title and any embedded subject IDs.
 */
export function parseExamTitle(rawTitle: string): { cleanTitle: string; extraSubjectIds: string[] } {
  if (!rawTitle) {
    return { cleanTitle: '', extraSubjectIds: [] };
  }

  let extraSubjectIds: string[] = [];
  const match = rawTitle.match(/<!--(?:studyflow_subjects|subj):(.*?)-->/);

  if (match && match[1]) {
    try {
      const parsed = JSON.parse(match[1]);
      if (Array.isArray(parsed)) {
        extraSubjectIds = parsed.filter((id) => typeof id === 'string' && id.trim().length > 0);
      }
    } catch {
      // Fallback if comma separated
      extraSubjectIds = match[1]
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
    }
  }

  const cleanTitle = rawTitle.replace(METADATA_TAG_REGEX, '').trim();
  return { cleanTitle, extraSubjectIds };
}

/**
 * Enriches an ExamWithSubject record with all associated subjects from the global subjects list.
 */
export function enrichExamWithSubjects(
  exam: ExamWithSubject,
  allSubjects: DbSubject[] = []
): ExamWithSubject {
  const { cleanTitle, extraSubjectIds } = parseExamTitle(exam.title || '');

  // Combine primary subject_id with extra subject IDs
  const combinedIds = Array.from(
    new Set([exam.subject_id, ...extraSubjectIds].filter(Boolean))
  );

  // Map IDs to actual subject entities
  const subjectsMap = new Map<string, { id: string; name: string }>();

  // Add primary joined subject if available
  if (exam.subjects?.id && exam.subjects?.name) {
    subjectsMap.set(exam.subjects.id, {
      id: exam.subjects.id,
      name: exam.subjects.name,
    });
  }

  // Add from loaded subjects
  for (const s of allSubjects) {
    subjectsMap.set(s.id, { id: s.id, name: s.name });
  }

  const all_subjects: { id: string; name: string }[] = combinedIds.map((id) => {
    return subjectsMap.get(id) || { id, name: 'Subject' };
  });

  const primarySubject = all_subjects[0] || exam.subjects || { id: exam.subject_id, name: 'Subject' };

  return {
    ...exam,
    cleanTitle: cleanTitle || exam.title,
    subject_ids: combinedIds,
    all_subjects,
    subjects: primarySubject,
  };
}

/**
 * Enriches an array of exams with full subject associations.
 */
export function enrichExamsList(
  exams: ExamWithSubject[],
  allSubjects: DbSubject[] = []
): ExamWithSubject[] {
  return exams.map((e) => enrichExamWithSubjects(e, allSubjects));
}
