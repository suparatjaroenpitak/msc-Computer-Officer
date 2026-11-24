import { StudyShell } from "@/components/StudyShell";
import { learnLessons } from "@/lib/study-bank";
export default function LearnPage() { return <main className="page-wrap inner-page"><div className="page-intro"><p className="eyebrow">LEARN & RECALL</p><h1>เรียนแบบนึกเองก่อนดูเฉลย</h1><p>การ์ดชุดแรกผ่านการตัดหน้าปก โฆษณา ข้อความซ้ำ และจัดหมวดจาก PDF ทั้ง 3 ไฟล์แล้ว จึงต่อด้วยบทเรียนสรุปแบบเข้าใจง่าย</p></div><StudyShell lessons={learnLessons} /></main>; }
