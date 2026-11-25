import { NextResponse } from "next/server";
import { getRequiredApiSession } from "@/lib/require-auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getRequiredApiSession();
  if (!session?.user?.id) return NextResponse.json({ error: "ต้องเข้าสู่ระบบด้วย Google ก่อนดูรายการที่สร้างโดย AI" }, { status: 401 });
  const items = await prisma.generatedStudyItem.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 200,
    select: {
      id: true,
      itemType: true,
      mode: true,
      prompt: true,
      answer: true,
      options: true,
      answerIndex: true,
      explanation: true,
      source: true,
      lessonSlug: true,
      imageSvg: true,
      model: true,
      createdAt: true,
    },
  });
  return NextResponse.json({ items }, { headers: { "Cache-Control": "private, no-store" } });
}
