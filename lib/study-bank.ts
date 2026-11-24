import rawStudyBank from "@/content/study-bank.json";
import { studyLessons, type StudyLesson } from "@/lib/content";

const pdfLessons = rawStudyBank.lessons as StudyLesson[];

export const pdfRecallLesson = pdfLessons.find((lesson) => lesson.slug === "pdf-recall-all") ?? pdfLessons[0];
export const pdfExamLesson = pdfLessons.find((lesson) => lesson.slug === "pdf-exam-bank") ?? pdfLessons[1];

// The full PDF-derived decks come first. The hand-curated AI-friendly modules remain available after them.
export const learnLessons: StudyLesson[] = [pdfRecallLesson, ...studyLessons].filter(Boolean);
export const quizLessons: StudyLesson[] = [pdfExamLesson, ...studyLessons].filter(Boolean);
export const pdfBankStats = rawStudyBank.stats;
