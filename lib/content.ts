export type StudyCard = {
  id: string;
  prompt: string;
  answer: string;
  explanation: string;
  source: string;
  difficulty: "easy" | "medium" | "hard";
  sourceId?: string;
  page?: number;
  generatedItemId?: string;
};

export type StudyQuestion = {
  id: string;
  prompt: string;
  options: string[];
  answerIndex: number | null;
  explanation: string;
  source: string;
  sourceId?: string;
  page?: number;
  generatedItemId?: string;
};

export type StudyNote = {
  id: string;
  title: string;
  content: string;
  source: string;
  sourceId?: string;
  page?: number;
};

export type StudyLesson = {
  slug: string;
  title: string;
  summary: string;
  accent: string;
  cards: StudyCard[];
  questions: StudyQuestion[];
  notes?: StudyNote[];
};

export type StudyLessonMeta = {
  slug: string;
  title: string;
  summary: string;
  accent: string;
  cardCount: number;
  questionCount: number;
  noteCount: number;
};
