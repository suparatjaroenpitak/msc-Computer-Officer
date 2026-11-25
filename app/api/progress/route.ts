import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "ต้องเข้าสู่ระบบด้วย Google ก่อนบันทึกความคืบหน้า" }, { status: 401 });
  const body = await request.json() as { cardId?: string; generatedItemId?: string; remembered?: boolean };
  if (!body.cardId && !body.generatedItemId) return NextResponse.json({ error: "cardId or generatedItemId is required" }, { status: 400 });
  const remembered = Boolean(body.remembered);
  const where = body.cardId
    ? { userId_cardId: { userId: session.user.id, cardId: body.cardId } }
    : { userId_generatedItemId: { userId: session.user.id, generatedItemId: body.generatedItemId! } };
  const existing = await prisma.cardProgress.findUnique({ where });
  const nextBox = remembered ? Math.min((existing?.box ?? 0) + 1, 5) : Math.max((existing?.box ?? 0) - 1, 0);
  const days = remembered ? [1, 1, 3, 7, 14, 30][nextBox] : 1;
  const nextReviewAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  const update = { box: nextBox, nextReviewAt, lastReviewedAt: new Date(), correctCount: { increment: remembered ? 1 : 0 }, wrongCount: { increment: remembered ? 0 : 1 } };
  const create = { userId: session.user.id, cardId: body.cardId, generatedItemId: body.generatedItemId, box: nextBox, nextReviewAt, lastReviewedAt: new Date(), correctCount: remembered ? 1 : 0, wrongCount: remembered ? 0 : 1 };
  await prisma.cardProgress.upsert({ where, update, create });
  return NextResponse.json({ saved: true, nextReviewAt });
}
