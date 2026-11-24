import catalog from "@/content/user-study-catalog.json";
import type { StudyLessonMeta } from "@/lib/content";

const lessons = catalog.lessons as StudyLessonMeta[];

export const studyRecallLesson = lessons.find((lesson) => lesson.slug === "user-recall-all") ?? lessons[0];
export const studyExamLesson = lessons.find((lesson) => lesson.slug === "user-exam-bank") ?? lessons[1];
export const studyTopicLessons: StudyLessonMeta[] = lessons.filter(
  (lesson) => lesson.slug.startsWith("user-") && !["user-recall-all", "user-exam-bank"].includes(lesson.slug),
);

// Only lightweight metadata is sent to the browser. Full lesson data is loaded by /api/study per selection.
export const learnLessons: StudyLessonMeta[] = [...studyTopicLessons, studyRecallLesson].filter(Boolean);
export const quizLessons: StudyLessonMeta[] = [
  ...studyTopicLessons.filter((lesson) => lesson.questionCount > 0),
  studyExamLesson,
].filter(Boolean);
export const studyBankStats = catalog.stats;
