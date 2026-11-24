import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "ต้องเข้าสู่ระบบด้วย Google ก่อนดูสถิติ" }, { status: 401 });

  const [progress, attempts] = await Promise.all([
    prisma.cardProgress.aggregate({
      where: { userId: session.user.id },
      _count: { _all: true },
      _sum: { correctCount: true, wrongCount: true },
    }),
    prisma.quizAttempt.aggregate({
      where: { userId: session.user.id },
      _count: { _all: true },
      _sum: { score: true, total: true },
    }),
  ]);

  const correctAnswers = progress._sum.correctCount ?? 0;
  const wrongAnswers = progress._sum.wrongCount ?? 0;
  const quizScore = attempts._sum.score ?? 0;
  const quizTotal = attempts._sum.total ?? 0;
  return NextResponse.json({
    cardsReviewed: progress._count._all,
    correctAnswers,
    wrongAnswers,
    quizAttempts: attempts._count._all,
    quizScore,
    quizTotal,
    accuracy: correctAnswers + wrongAnswers > 0 ? Math.round((correctAnswers / (correctAnswers + wrongAnswers)) * 100) : 0,
    quizAccuracy: quizTotal > 0 ? Math.round((quizScore / quizTotal) * 100) : 0,
  });
}
