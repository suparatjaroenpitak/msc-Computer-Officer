import { PrismaClient } from "@prisma/client";
import rawStudyBank from "../content/user-study-bank.json";
import type { StudyLesson } from "../lib/content";

const prisma = new PrismaClient();

async function main() {
  const lessons = (rawStudyBank.lessons as StudyLesson[]).filter(
    (lesson) => !["user-recall-all", "user-exam-bank"].includes(lesson.slug),
  );
  const course = await prisma.course.upsert({
    where: { slug: "computer-officer" },
    update: { title: "นักวิชาการคอมพิวเตอร์: เรียนให้เข้าใจ จำให้นาน" },
    create: { slug: "computer-officer", title: "นักวิชาการคอมพิวเตอร์: เรียนให้เข้าใจ จำให้นาน", description: "บทเรียนและข้อสอบจากชุดข้อมูลใหม่ พร้อมระบบ Recall และทบทวนซ้ำ" },
  });

  for (const [lessonIndex, lesson] of lessons.entries()) {
    const dbLesson = await prisma.lesson.upsert({
      where: { courseId_slug: { courseId: course.id, slug: lesson.slug } },
      update: { title: lesson.title, summary: lesson.summary, sortOrder: lessonIndex },
      create: { courseId: course.id, slug: lesson.slug, title: lesson.title, summary: lesson.summary, sortOrder: lessonIndex },
    });
    await prisma.card.deleteMany({ where: { lessonId: dbLesson.id } });
    await prisma.question.deleteMany({ where: { lessonId: dbLesson.id } });
    await prisma.card.createMany({ data: lesson.cards.map((card, index) => ({ id: card.id, lessonId: dbLesson.id, prompt: card.prompt, answer: card.answer, explanation: card.explanation, source: card.source, difficulty: card.difficulty, sortOrder: index })) });
    await prisma.question.createMany({ data: lesson.questions.map((question, index) => ({ lessonId: dbLesson.id, prompt: question.prompt, options: question.options, answerIndex: question.answerIndex, explanation: question.explanation, source: question.source, sortOrder: index })) });
  }
  console.log(`Seeded ${lessons.length} lessons for ${course.title}`);
}

main().finally(() => prisma.$disconnect());
