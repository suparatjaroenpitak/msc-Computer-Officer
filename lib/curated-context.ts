import rawStudyBank from "@/content/user-study-bank.json";
import type { StudyCard, StudyLesson, StudyNote, StudyQuestion } from "@/lib/content";

const studyTopicLessons = (rawStudyBank.lessons as StudyLesson[]).filter(
  (lesson) => lesson.slug.startsWith("user-") && !["user-recall-all", "user-exam-bank"].includes(lesson.slug),
);

export type CuratedAiHit = {
  lessonTitle: string;
  lessonSlug: string;
  kind: "note" | "recall" | "question";
  prompt: string;
  answer: string;
  explanation: string;
  source: string;
  page?: number;
  options?: string[];
};

function normalize(value: string) {
  return value.toLocaleLowerCase().replace(/[\u200b\u200c\u200d]/g, "").replace(/\s+/g, " ").trim();
}

function termsFrom(query: string) {
  return normalize(query)
    .split(/[\s,./:;|()\[\]{}<>"'!?+-]+/)
    .map((term) => term.trim())
    .filter((term) => term.length >= 2);
}

function scoreText(text: string, query: string, terms: string[]) {
  const normalizedText = normalize(text);
  const normalizedQuery = normalize(query);
  let score = normalizedQuery && normalizedText.includes(normalizedQuery) ? 12 : 0;
  for (const term of terms) if (normalizedText.includes(term)) score += term.length >= 4 ? 3 : 1;
  return score;
}

function cardToHit(lessonTitle: string, lessonSlug: string, card: StudyCard): CuratedAiHit {
  return { lessonTitle, lessonSlug, kind: "recall", prompt: card.prompt, answer: card.answer, explanation: card.explanation, source: card.source, page: card.page };
}

function questionToHit(lessonTitle: string, lessonSlug: string, question: StudyQuestion): CuratedAiHit {
  return {
    lessonTitle,
    lessonSlug,
    kind: "question",
    prompt: question.prompt,
    answer: question.answerIndex === null ? "ยังไม่มีเฉลยในเอกสาร" : question.options[question.answerIndex] ?? "ยังไม่มีเฉลยในเอกสาร",
    explanation: question.explanation,
    source: question.source,
    page: question.page,
    options: question.options,
  };
}

function noteToHit(lessonTitle: string, lessonSlug: string, note: StudyNote): CuratedAiHit {
  return { lessonTitle, lessonSlug, kind: "note", prompt: note.title, answer: note.content, explanation: "เนื้อหาสรุปจากหน้าที่ผ่านการกรองและจัดหมวดแล้ว", source: note.source, page: note.page };
}

/** Search only the new user-provided study set. */
export function searchCuratedStudyBank(query: string, limit = 8) {
  const terms = termsFrom(query);
  const hits = studyTopicLessons.flatMap((lesson) => [
    ...(lesson.notes ?? []).map((note) => ({ item: noteToHit(lesson.title, lesson.slug, note), text: `${lesson.title} ${lesson.summary} ${note.content}` })),
    ...lesson.cards.map((card) => ({ item: cardToHit(lesson.title, lesson.slug, card), text: `${lesson.title} ${lesson.summary} ${card.prompt} ${card.answer} ${card.explanation}` })),
    ...lesson.questions.map((question) => ({ item: questionToHit(lesson.title, lesson.slug, question), text: `${lesson.title} ${lesson.summary} ${question.prompt} ${question.options.join(" ")} ${question.explanation}` })),
  ]);

  return hits
    .map(({ item, text }) => ({ item, score: scoreText(text, query, terms) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ item }) => item);
}
