import { QuizShell } from "@/components/QuizShell";
import { quizLessons } from "@/lib/study-bank";
export default function QuizPage() { return <main className="page-wrap inner-page"><div className="page-intro"><p className="eyebrow">PRACTICE TEST</p><h1>ข้อสอบจากไฟล์จริง</h1><p>ชุดแรกดึงคำถามจาก PDF ทั้ง 3 ไฟล์ รวมข้อที่มีเฉลยและข้อฝึกที่ยังต้องตรวจเฉลยเพิ่มเติม</p></div><QuizShell lessons={quizLessons} /></main>; }
