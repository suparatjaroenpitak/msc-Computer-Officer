-- Additive study storage migration.
-- This migration intentionally avoids DROP/ALTER of existing legacy tables.
-- It can be deployed on the existing Vercel database without deleting users,
-- OAuth sessions, progress, quiz attempts, or legacy application data.

CREATE TABLE IF NOT EXISTS "Course" (
  "id" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Course_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Course_slug_key" ON "Course"("slug");

CREATE TABLE IF NOT EXISTS "Lesson" (
  "id" TEXT NOT NULL,
  "courseId" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "summary" TEXT NOT NULL,
  "sortOrder" INTEGER NOT NULL,
  CONSTRAINT "Lesson_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Lesson_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "Lesson_courseId_slug_key" ON "Lesson"("courseId", "slug");

CREATE TABLE IF NOT EXISTS "Card" (
  "id" TEXT NOT NULL,
  "lessonId" TEXT NOT NULL,
  "prompt" TEXT NOT NULL,
  "answer" TEXT NOT NULL,
  "explanation" TEXT NOT NULL,
  "source" TEXT NOT NULL,
  "difficulty" TEXT NOT NULL DEFAULT 'easy',
  "sortOrder" INTEGER NOT NULL,
  CONSTRAINT "Card_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Card_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "Card_lessonId_sortOrder_idx" ON "Card"("lessonId", "sortOrder");

CREATE TABLE IF NOT EXISTS "Question" (
  "id" TEXT NOT NULL,
  "lessonId" TEXT NOT NULL,
  "prompt" TEXT NOT NULL,
  "options" JSONB NOT NULL,
  "answerIndex" INTEGER,
  "explanation" TEXT NOT NULL,
  "source" TEXT NOT NULL,
  "sortOrder" INTEGER NOT NULL,
  CONSTRAINT "Question_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Question_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "Question_lessonId_sortOrder_idx" ON "Question"("lessonId", "sortOrder");

CREATE TABLE IF NOT EXISTS "CardProgress" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "cardId" TEXT NOT NULL,
  "box" INTEGER NOT NULL DEFAULT 0,
  "correctCount" INTEGER NOT NULL DEFAULT 0,
  "wrongCount" INTEGER NOT NULL DEFAULT 0,
  "nextReviewAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastReviewedAt" TIMESTAMP(3),
  CONSTRAINT "CardProgress_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "CardProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "CardProgress_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "Card"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "CardProgress_userId_cardId_key" ON "CardProgress"("userId", "cardId");
CREATE INDEX IF NOT EXISTS "CardProgress_userId_nextReviewAt_idx" ON "CardProgress"("userId", "nextReviewAt");

CREATE TABLE IF NOT EXISTS "QuizAttempt" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "lessonSlug" TEXT NOT NULL,
  "score" INTEGER NOT NULL,
  "total" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "QuizAttempt_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "QuizAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "QuizAttempt_userId_createdAt_idx" ON "QuizAttempt"("userId", "createdAt");

CREATE TABLE IF NOT EXISTS "GeneratedStudyItem" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "itemType" TEXT NOT NULL,
  "mode" TEXT NOT NULL,
  "prompt" TEXT NOT NULL,
  "answer" TEXT,
  "options" JSONB,
  "answerIndex" INTEGER,
  "explanation" TEXT,
  "source" TEXT,
  "sourceItemId" TEXT,
  "lessonSlug" TEXT,
  "rawResponse" TEXT NOT NULL,
  "imageSvg" TEXT,
  "model" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "GeneratedStudyItem_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "GeneratedStudyItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "GeneratedStudyItem_userId_createdAt_idx" ON "GeneratedStudyItem"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "GeneratedStudyItem_userId_itemType_idx" ON "GeneratedStudyItem"("userId", "itemType");
