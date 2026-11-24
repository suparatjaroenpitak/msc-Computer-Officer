import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ saved: false, reason: "guest" });
  const body = await request.json() as { cardId?: string; remembered?: boolean };
  if (!body.cardId) return NextResponse.json({ error: "cardId is required" }, { status: 400 });
  const remembered = Boolean(body.remembered);
  const existing = await prisma.cardProgress.findUnique({ where: { userId_cardId: { userId: session.user.id, cardId: body.cardId } } });
  const nextBox = remembered ? Math.min((existing?.box ?? 0) + 1, 5) : Math.max((existing?.box ?? 0) - 1, 0);
  const days = remembered ? [1, 1, 3, 7, 14, 30][nextBox] : 1;
  const nextReviewAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  await prisma.cardProgress.upsert({ where: { userId_cardId: { userId: session.user.id, cardId: body.cardId } }, update: { box: nextBox, nextReviewAt, lastReviewedAt: new Date(), correctCount: { increment: remembered ? 1 : 0 }, wrongCount: { increment: remembered ? 0 : 1 } }, create: { userId: session.user.id, cardId: body.cardId, box: nextBox, nextReviewAt, lastReviewedAt: new Date(), correctCount: remembered ? 1 : 0, wrongCount: remembered ? 0 : 1 } });
  return NextResponse.json({ saved: true, nextReviewAt });
}
