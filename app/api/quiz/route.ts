import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "ต้องเข้าสู่ระบบด้วย Google ก่อนบันทึกสถิติ" }, { status: 401 });
  const body = await request.json() as { lessonSlug?: string; score?: number; total?: number };
  if (!body.lessonSlug || typeof body.score !== "number" || typeof body.total !== "number") return NextResponse.json({ error: "invalid attempt" }, { status: 400 });
  await prisma.quizAttempt.create({ data: { userId: session.user.id, lessonSlug: body.lessonSlug, score: body.score, total: body.total } });
  return NextResponse.json({ saved: true });
}
