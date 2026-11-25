import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import type { StudyLesson } from "@/lib/content";
import { getRequiredApiSession } from "@/lib/require-auth";
import { prisma } from "@/lib/prisma";

async function loadLesson(slug: string, userId: string) {
  if (!slug.startsWith("user-") || !/^[a-z0-9-]+$/.test(slug)) return undefined;

  // PostgreSQL is the source of truth in production. The file fallback keeps
  // local development and a first deployment usable while the seed runs.
  try {
    const dbLesson = await prisma.lesson.findFirst({
      where: { slug },
      orderBy: { sortOrder: "asc" },
      include: {
        cards: { orderBy: { sortOrder: "asc" } },
        questions: { orderBy: { sortOrder: "asc" } },
      },
    });
    if (dbLesson) {
      const generatedItems = await prisma.generatedStudyItem.findMany({
        where: { userId, lessonSlug: slug, itemType: { in: ["recall", "quiz"] } },
        orderBy: { createdAt: "asc" },
      });
      const generatedCards = generatedItems
        .filter((item) => item.itemType === "recall")
        .map((item) => ({
          id: `ai-${item.id}`,
          generatedItemId: item.id,
          prompt: item.prompt,
          answer: item.answer ?? "ยังไม่มีคำตอบ",
          explanation: item.explanation ?? "คำตอบที่สร้างโดย AI จากเนื้อหาการ์ดนี้",
          source: item.source ?? "AI Coach",
          difficulty: "medium" as const,
        }));
      const generatedQuestions = generatedItems
        .filter((item) => item.itemType === "quiz")
        .map((item) => ({
          id: `ai-${item.id}`,
          generatedItemId: item.id,
          prompt: item.prompt,
          options: Array.isArray(item.options) ? item.options.filter((option): option is string => typeof option === "string") : [],
          answerIndex: item.answerIndex,
          explanation: item.explanation ?? "เฉลยที่สร้างโดย AI จากเนื้อหาข้อสอบนี้",
          source: item.source ?? "AI Coach",
        }))
        .filter((item) => item.options.length === 4);
      return {
        slug: dbLesson.slug,
        title: dbLesson.title,
        summary: dbLesson.summary,
        accent: "blue",
        cards: [...dbLesson.cards.map((card) => ({
          id: card.id,
          prompt: card.prompt,
          answer: card.answer,
          explanation: card.explanation,
          source: card.source,
          difficulty: card.difficulty as StudyLesson["cards"][number]["difficulty"],
        })), ...generatedCards],
        questions: [...dbLesson.questions.map((question) => ({
          id: question.id,
          prompt: question.prompt,
          options: Array.isArray(question.options) ? question.options.filter((option): option is string => typeof option === "string") : [],
          answerIndex: question.answerIndex,
          explanation: question.explanation,
          source: question.source,
        })), ...generatedQuestions],
        notes: [],
      } satisfies StudyLesson;
    }
  } catch (error) {
    console.warn("Study database unavailable; using bundled content", error);
  }

  const filePath = path.join(process.cwd(), "content", "user-lessons", `${slug}.json`);
  return JSON.parse(await readFile(filePath, "utf8")) as StudyLesson;
}

export async function GET(request: Request) {
  const session = await getRequiredApiSession();
  if (!session?.user?.id) return NextResponse.json({ error: "ต้องเข้าสู่ระบบด้วย Google ก่อนใช้งาน" }, { status: 401 });
  const url = new URL(request.url);
  const slug = url.searchParams.get("slug") ?? "";
  const mode = url.searchParams.get("mode") === "quiz" ? "quiz" : "learn";
  try {
    const lesson = await loadLesson(slug, session.user.id);
    if (!lesson) return NextResponse.json({ error: "lesson not found" }, { status: 404 });

    // Keep the client payload focused: Learn needs cards; Quiz needs questions.
    const payload = mode === "quiz"
      ? { ...lesson, cards: [], notes: [] }
      : { ...lesson, questions: [], notes: [] };
    // Study data belongs to the signed-in learner and must not remain stale
    // after new cards/questions are deployed.
    return NextResponse.json(payload, { headers: { "Cache-Control": "private, no-store" } });
  } catch {
    return NextResponse.json({ error: "lesson data unavailable" }, { status: 500 });
  }
}
