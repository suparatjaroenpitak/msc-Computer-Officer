import { NextResponse } from "next/server";
import { learnLessons, quizLessons } from "@/lib/study-bank";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const slug = url.searchParams.get("slug");
  const mode = url.searchParams.get("mode") === "quiz" ? "quiz" : "learn";
  const lessons = mode === "quiz" ? quizLessons : learnLessons;
  const lesson = lessons.find((item) => item.slug === slug);
  if (!lesson) return NextResponse.json({ error: "lesson not found" }, { status: 404 });

  // Keep the initial client payload small: Learn needs cards, Quiz needs questions.
  const payload = mode === "quiz"
    ? { ...lesson, cards: [], notes: [] }
    : { ...lesson, questions: [], notes: [] };
  return NextResponse.json(payload, { headers: { "Cache-Control": "public, max-age=3600" } });
}
