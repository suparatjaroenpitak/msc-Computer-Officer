import { StudyShell } from "@/components/StudyShell";
import { studyLessons } from "@/lib/content";
export default function LearnPage() { return <main className="page-wrap inner-page"><div className="page-intro"><p className="eyebrow">LEARN & RECALL</p><h1>เรียนแบบนึกเองก่อนดูเฉลย</h1><p>เลือกบทเรียน แล้วลองตอบจากความจำก่อนกดเปิดคำตอบ ระบบจะช่วยนับการ์ดที่คุณจำได้</p></div><StudyShell lessons={studyLessons} /></main>; }
