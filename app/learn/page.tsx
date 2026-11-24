import { StudyShell } from "@/components/StudyShell";
import { learnLessons } from "@/lib/study-bank";
import { requirePageSession } from "@/lib/require-auth";

export const dynamic = "force-dynamic";

export default async function LearnPage() {
  await requirePageSession();
  return (
    <main className="page-wrap inner-page">
      <div className="page-intro">
        <p className="eyebrow">LEARN & RECALL</p>
        <h1>เรียนแบบนึกเองก่อนดูเฉลย</h1>
        <p>เลือกหมวดเพื่อโหลดเฉพาะการ์ดของหมวดนั้น แล้วฝึกตอบก่อนเปิดเฉลย</p>
      </div>
      <StudyShell lessons={learnLessons} />
    </main>
  );
}
