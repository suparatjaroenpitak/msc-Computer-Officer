import { QuizShell } from "@/components/QuizShell";
import { studyLessons } from "@/lib/content";
export default function QuizPage() { return <main className="page-wrap inner-page"><div className="page-intro"><p className="eyebrow">PRACTICE TEST</p><h1>ข้อสอบฝึกแบบไม่กดดัน</h1><p>ทำทีละชุด ดูคำอธิบายหลังจากจบ และใช้คะแนนเพื่อดูว่าควรกลับไปทบทวนบทไหน</p></div><QuizShell lessons={studyLessons} /></main>; }
