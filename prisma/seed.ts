import { PrismaClient, Prisma } from "@prisma/client";
import rawStudyBank from "../content/user-study-bank.json";
import type { StudyLesson } from "../lib/content";

const prisma = new PrismaClient();

function dbItemId(lessonSlug: string, kind: "card" | "question", index: number) {
  return `${lessonSlug}--${kind}-${String(index).padStart(5, "0")}`;
}

const LEGAL_REPLACEMENT_LESSONS = ["user-digital-law", "user-recall-all", "user-exam-bank"];

async function needsLegalReplacement(courseId: string, lessons: StudyLesson[]) {
  for (const slug of LEGAL_REPLACEMENT_LESSONS) {
    const expected = lessons.find((lesson) => lesson.slug === slug);
    const dbLesson = await prisma.lesson.findUnique({
      where: { courseId_slug: { courseId, slug } },
      select: { id: true },
    });
    if (!expected || !dbLesson) continue;
    const [cardCount, questionCount] = await Promise.all([
      prisma.card.count({ where: { lessonId: dbLesson.id } }),
      prisma.question.count({ where: { lessonId: dbLesson.id } }),
    ]);
    if (cardCount !== expected.cards.length || questionCount !== expected.questions.length) return true;
  }
  return false;
}

async function replaceLegalLessons(courseId: string) {
  const dbLessons = await prisma.lesson.findMany({
    where: { courseId, slug: { in: LEGAL_REPLACEMENT_LESSONS } },
    select: { id: true, slug: true },
  });
  const lessonIds = dbLessons.map((lesson) => lesson.id);
  if (!lessonIds.length) return;

  await prisma.$transaction(async (tx) => {
    await tx.cardProgress.deleteMany({ where: { card: { lessonId: { in: lessonIds } } } });
    await tx.card.deleteMany({ where: { lessonId: { in: lessonIds } } });
    await tx.question.deleteMany({ where: { lessonId: { in: lessonIds } } });
  });
  console.log(`Replaced legacy legal study rows in ${dbLessons.map((lesson) => lesson.slug).join(", ")}`);
}

async function main() {
  const lessons = rawStudyBank.lessons as StudyLesson[];
  const totalCards = lessons.reduce((sum, lesson) => sum + lesson.cards.length, 0);
  const totalQuestions = lessons.reduce((sum, lesson) => sum + lesson.questions.length, 0);

  if (process.argv.includes("--if-needed")) {
    const existingCourse = await prisma.course.findUnique({ where: { slug: "computer-officer" } });
    if (existingCourse) {
      const [lessonCount, cardCount, questionCount] = await Promise.all([
        prisma.lesson.count({ where: { courseId: existingCourse.id } }),
        prisma.card.count({ where: { lesson: { courseId: existingCourse.id } } }),
        prisma.question.count({ where: { lesson: { courseId: existingCourse.id } } }),
      ]);
      if (lessonCount >= lessons.length && cardCount >= totalCards && questionCount >= totalQuestions) {
        console.log(`Study data already seeded (${lessonCount} lessons, ${cardCount} cards, ${questionCount} questions)`);
        return;
      }
    }
  }

  const course = await prisma.course.upsert({
    where: { slug: "computer-officer" },
    update: { title: "นักวิชาการคอมพิวเตอร์: เรียนให้เข้าใจ จำให้นาน", description: "บทเรียนและข้อสอบจากชุดข้อมูลใหม่ พร้อมระบบ Recall และทบทวนซ้ำ" },
    create: { slug: "computer-officer", title: "นักวิชาการคอมพิวเตอร์: เรียนให้เข้าใจ จำให้นาน", description: "บทเรียนและข้อสอบจากชุดข้อมูลใหม่ พร้อมระบบ Recall และทบทวนซ้ำ" },
  });

  if (await needsLegalReplacement(course.id, lessons)) {
    await replaceLegalLessons(course.id);
  }

  for (const [lessonIndex, lesson] of lessons.entries()) {
    const dbLesson = await prisma.lesson.upsert({
      where: { courseId_slug: { courseId: course.id, slug: lesson.slug } },
      update: { title: lesson.title, summary: lesson.summary, sortOrder: lessonIndex },
      create: { courseId: course.id, slug: lesson.slug, title: lesson.title, summary: lesson.summary, sortOrder: lessonIndex },
    });
    await prisma.card.createMany({
      skipDuplicates: true,
      data: lesson.cards.map((card, index) => ({
        id: dbItemId(lesson.slug, "card", index),
        lessonId: dbLesson.id,
        prompt: card.prompt,
        answer: card.answer,
        explanation: card.explanation,
        source: card.source,
        difficulty: card.difficulty,
        sortOrder: index,
      })),
    });
    await prisma.question.createMany({
      skipDuplicates: true,
      data: lesson.questions.map((question, index) => ({
        id: dbItemId(lesson.slug, "question", index),
        lessonId: dbLesson.id,
        prompt: question.prompt,
        options: question.options as Prisma.InputJsonValue,
        answerIndex: question.answerIndex,
        explanation: question.explanation,
        source: question.source,
        sortOrder: index,
      })),
    });
    console.log(`Seeded ${lesson.slug}: ${lesson.cards.length} cards, ${lesson.questions.length} questions`);
  }
  console.log(`Seeded ${lessons.length} lessons, ${totalCards} cards, ${totalQuestions} questions`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
