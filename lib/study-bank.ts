import rawStudyBank from "@/content/curated-study-bank.json";
import { studyLessons, type StudyLesson } from "@/lib/content";

const pdfLessons = rawStudyBank.lessons as StudyLesson[];

export const pdfRecallLesson = pdfLessons.find((lesson) => lesson.slug === "pdf-recall-all") ?? pdfLessons[0];
export const pdfExamLesson = pdfLessons.find((lesson) => lesson.slug === "pdf-exam-bank") ?? pdfLessons[1];

// Keep each curated topic as its own path. The aggregate decks stay internal so
// the UI does not pile every card and question into one giant lesson.
export const curatedTopicLessons: StudyLesson[] = pdfLessons.filter(
  (lesson) => lesson.slug.startsWith("curated-") && !["curated-recall-all", "curated-exam-bank"].includes(lesson.slug),
);

// The original hand-written AI-friendly modules remain available after the PDF-derived topics.
export const learnLessons: StudyLesson[] = [...curatedTopicLessons, ...studyLessons, pdfRecallLesson].filter(Boolean);
export const quizLessons: StudyLesson[] = [
  ...curatedTopicLessons.filter((lesson) => lesson.questions.length > 0),
  ...studyLessons,
  pdfExamLesson,
].filter(Boolean);
export const pdfBankStats = rawStudyBank.stats;
