import { QuizShell } from "@/components/QuizShell";
import { quizLessons } from "@/lib/study-bank";
import { requirePageSession } from "@/lib/require-auth";

export const dynamic = "force-dynamic";

export default async function QuizPage() {
  await requirePageSession();
  return (
    <main className="page-wrap inner-page">
      <div className="page-intro">
        <p className="eyebrow">PRACTICE TEST</p>
        <h1>บททดสอบจากชุดข้อมูลใหม่</h1>
        <p>เลือกหมวดเพื่อโหลดเฉพาะข้อสอบของหมวดนั้น พร้อมเสียงอ่านภาษาไทย</p>
      </div>
      <QuizShell lessons={quizLessons} />
    </main>
  );
}
