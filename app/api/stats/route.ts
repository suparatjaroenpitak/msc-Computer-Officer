import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
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
  const lessonSlug = new URL(request.url).searchParams.get("lessonSlug");
  let lesson: { slug: string; title: string; totalCards: number; completedCards: number; accuracy: number; complete: boolean } | undefined;
  if (lessonSlug) {
    const dbLesson = await prisma.lesson.findFirst({ where: { slug: lessonSlug }, select: { slug: true, title: true, id: true } });
    if (dbLesson) {
      const [staticTotal, generatedTotal, categoryProgress] = await Promise.all([
        prisma.card.count({ where: { lessonId: dbLesson.id } }),
        prisma.generatedStudyItem.count({ where: { userId: session.user.id, lessonSlug, itemType: "recall" } }),
        prisma.cardProgress.findMany({
          where: {
            userId: session.user.id,
            OR: [
              { card: { lessonId: dbLesson.id } },
              { generatedItem: { lessonSlug, itemType: "recall" } },
            ],
          },
          select: { box: true, correctCount: true, wrongCount: true },
        }),
      ]);
      const completedCards = categoryProgress.filter((item) => item.box > 0).length;
      const categoryCorrect = categoryProgress.reduce((sum, item) => sum + item.correctCount, 0);
      const categoryWrong = categoryProgress.reduce((sum, item) => sum + item.wrongCount, 0);
      lesson = {
        slug: dbLesson.slug,
        title: dbLesson.title,
        totalCards: staticTotal + generatedTotal,
        completedCards,
        accuracy: categoryCorrect + categoryWrong > 0 ? Math.round((categoryCorrect / (categoryCorrect + categoryWrong)) * 100) : 0,
        complete: staticTotal + generatedTotal > 0 && completedCards >= staticTotal + generatedTotal,
      };
    }
  }
  return NextResponse.json({
    cardsReviewed: progress._count._all,
    correctAnswers,
    wrongAnswers,
    quizAttempts: attempts._count._all,
    quizScore,
    quizTotal,
    accuracy: correctAnswers + wrongAnswers > 0 ? Math.round((correctAnswers / (correctAnswers + wrongAnswers)) * 100) : 0,
    quizAccuracy: quizTotal > 0 ? Math.round((quizScore / quizTotal) * 100) : 0,
    lesson,
  });
}
