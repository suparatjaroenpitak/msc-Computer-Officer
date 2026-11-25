-- Additive study storage migration.
-- This migration intentionally avoids DROP/ALTER of existing legacy tables.
-- It can be deployed on the existing Vercel database without deleting users,
-- OAuth sessions, progress, quiz attempts, or legacy application data.

CREATE TABLE IF NOT EXISTS "StudyCourse" (
  "id" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "StudyCourse_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "StudyCourse_slug_key" ON "StudyCourse"("slug");

CREATE TABLE IF NOT EXISTS "StudyLesson" (
  "id" TEXT NOT NULL,
  "courseId" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "summary" TEXT NOT NULL,
  "sortOrder" INTEGER NOT NULL,
  CONSTRAINT "StudyLesson_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "StudyLesson_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "StudyCourse"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "StudyLesson_courseId_slug_key" ON "StudyLesson"("courseId", "slug");

CREATE TABLE IF NOT EXISTS "StudyCard" (
  "id" TEXT NOT NULL,
  "lessonId" TEXT NOT NULL,
  "prompt" TEXT NOT NULL,
  "answer" TEXT NOT NULL,
  "explanation" TEXT NOT NULL,
  "source" TEXT NOT NULL,
  "difficulty" TEXT NOT NULL DEFAULT 'easy',
  "sortOrder" INTEGER NOT NULL,
  CONSTRAINT "StudyCard_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "StudyCard_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "StudyLesson"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "StudyCard_lessonId_sortOrder_idx" ON "StudyCard"("lessonId", "sortOrder");

CREATE TABLE IF NOT EXISTS "StudyQuestion" (
  "id" TEXT NOT NULL,
  "lessonId" TEXT NOT NULL,
  "prompt" TEXT NOT NULL,
  "options" JSONB NOT NULL,
  "answerIndex" INTEGER,
  "explanation" TEXT NOT NULL,
  "source" TEXT NOT NULL,
  "sortOrder" INTEGER NOT NULL,
  CONSTRAINT "StudyQuestion_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "StudyQuestion_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "StudyLesson"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "StudyQuestion_lessonId_sortOrder_idx" ON "StudyQuestion"("lessonId", "sortOrder");

CREATE TABLE IF NOT EXISTS "StudyCardProgress" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "cardId" TEXT NOT NULL,
  "box" INTEGER NOT NULL DEFAULT 0,
  "correctCount" INTEGER NOT NULL DEFAULT 0,
  "wrongCount" INTEGER NOT NULL DEFAULT 0,
  "nextReviewAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastReviewedAt" TIMESTAMP(3),
  CONSTRAINT "StudyCardProgress_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "StudyCardProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "StudyCardProgress_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "StudyCard"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "StudyCardProgress_userId_cardId_key" ON "StudyCardProgress"("userId", "cardId");
CREATE INDEX IF NOT EXISTS "StudyCardProgress_userId_nextReviewAt_idx" ON "StudyCardProgress"("userId", "nextReviewAt");

CREATE TABLE IF NOT EXISTS "StudyQuizAttempt" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "lessonSlug" TEXT NOT NULL,
  "score" INTEGER NOT NULL,
  "total" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "StudyQuizAttempt_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "StudyQuizAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "StudyQuizAttempt_userId_createdAt_idx" ON "StudyQuizAttempt"("userId", "createdAt");

CREATE TABLE IF NOT EXISTS "StudyGeneratedItem" (
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
  CONSTRAINT "StudyGeneratedItem_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "StudyGeneratedItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "StudyGeneratedItem_userId_createdAt_idx" ON "StudyGeneratedItem"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "StudyGeneratedItem_userId_itemType_idx" ON "StudyGeneratedItem"("userId", "itemType");
