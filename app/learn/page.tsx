import { StudyShell } from "@/components/StudyShell";
import { learnLessons } from "@/lib/study-bank";
export default function LearnPage() { return <main className="page-wrap inner-page"><div className="page-intro"><p className="eyebrow">LEARN & RECALL</p><h1>เรียนแบบนึกเองก่อนดูเฉลย</h1><p>การ์ดชุดแรกสร้างจากทุกหน้าใน PDF ทั้ง 3 ไฟล์ แล้วจึงต่อด้วยบทเรียนสรุปแบบเข้าใจง่าย</p></div><StudyShell lessons={learnLessons} /></main>; }
