import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import type { StudyLesson } from "@/lib/content";
import { getRequiredApiSession } from "@/lib/require-auth";

async function loadLesson(slug: string) {
  if (slug.startsWith("user-") && /^[a-z0-9-]+$/.test(slug)) {
    const filePath = path.join(process.cwd(), "content", "user-lessons", `${slug}.json`);
    return JSON.parse(await readFile(filePath, "utf8")) as StudyLesson;
  }
  return undefined;
}

export async function GET(request: Request) {
  const session = await getRequiredApiSession();
  if (!session?.user?.id) return NextResponse.json({ error: "ต้องเข้าสู่ระบบด้วย Google ก่อนใช้งาน" }, { status: 401 });
  const url = new URL(request.url);
  const slug = url.searchParams.get("slug") ?? "";
  const mode = url.searchParams.get("mode") === "quiz" ? "quiz" : "learn";
  try {
    const lesson = await loadLesson(slug);
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
