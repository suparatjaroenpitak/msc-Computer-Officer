import { QuizShell } from "@/components/QuizShell";
import { quizLessons } from "@/lib/study-bank";
export default function QuizPage() { return <main className="page-wrap inner-page"><div className="page-intro"><p className="eyebrow">PRACTICE TEST</p><h1>บททดสอบจากเนื้อหาทุกหน้า</h1><p>รวมข้อสอบปรนัยจาก PDF และคำถามตรวจความเข้าใจที่สร้างจากทุกหน้าซึ่งผ่านการกลั่นแล้ว พร้อมแยกตามหมวด ไม่ใช้เฉพาะบล็อกข้อสอบเดิม</p></div><QuizShell lessons={quizLessons} /></main>; }
