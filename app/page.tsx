import Link from "next/link";
import { ArrowRight, Brain, CheckCircle2, Clock3, Layers3, ShieldCheck, Sparkles } from "lucide-react";
import { studyBankStats, studyTopicLessons } from "@/lib/study-bank";

export default function HomePage() {
  return (
    <main className="page-wrap">
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow"><Sparkles size={14} /> STUDY SMART · REMEMBER LONGER</p>
          <h1>ติวนักวิชาการคอมพิวเตอร์<br /><span>ให้เข้าใจง่ายและจำได้นาน</span></h1>
          <p className="hero-text">ชุดคำถาม–คำตอบคอมพิวเตอร์จากชุดข้อมูลที่คัดกรองแล้ว พร้อมบททดสอบ 4 ตัวเลือก ฝึกตอบก่อนเปิดเฉลยในที่เดียว</p>
          <div className="hero-actions"><Link href="/learn" className="primary-button">เริ่มเรียนทันที <ArrowRight size={18} /></Link><Link href="/quiz" className="secondary-button">ลองทำข้อสอบ</Link></div>
          <div className="trust-row"><span><CheckCircle2 size={16} /> เรียนเป็นขั้น</span><span><CheckCircle2 size={16} /> ทบทวนซ้ำ</span><span><CheckCircle2 size={16} /> ใช้ได้บนมือถือ</span></div>
        </div>
        <div className="hero-art"><div className="orbit orbit-one" /><div className="orbit orbit-two" /><div className="hero-note note-one"><Brain size={20} /><span>Recall<br /><b>ช่วยจำได้นาน</b></span></div><div className="hero-note note-two"><ShieldCheck size={20} /><span>บททดสอบ<br /><b>{studyBankStats.examQuestions.toLocaleString("en-US")} ข้อ</b></span></div><div className="hero-center"><div className="center-icon">🧠</div><strong>พร้อมสอบ<br />ทีละก้าว</strong></div></div>
      </section>
      <section className="stats-grid"><div className="stat-card"><span className="stat-icon blue"><Layers3 size={20} /></span><strong>{studyBankStats.recallCards}</strong><span>การ์ด Recall</span></div><div className="stat-card"><span className="stat-icon violet"><Brain size={20} /></span><strong>{studyBankStats.examQuestions}</strong><span>ข้อสอบ 4 ตัวเลือก</span></div><div className="stat-card"><span className="stat-icon amber"><Clock3 size={20} /></span><strong>{studyBankStats.topics}</strong><span>หมวดเนื้อหา</span></div><div className="stat-card"><span className="stat-icon green"><ShieldCheck size={20} /></span><strong>PWA</strong><span>ติดตั้งใช้งานได้</span></div></section>
      <section className="section-block"><div className="section-heading"><div><p className="eyebrow">LEARNING PATH</p><h2>เลือกหมวดที่ต้องการฝึก</h2><p className="muted">ชุดข้อมูลใหม่ถูกแบ่งเป็นหมวด เพื่อให้เรียนง่ายและไม่กระจุกอยู่ในกองเดียว</p></div><Link href="/learn" className="text-link">ดูทั้งหมด <ArrowRight size={16} /></Link></div><div className="module-grid">{studyTopicLessons.map((lesson, index) => <Link href={`/learn?lesson=${lesson.slug}`} className="module-card" key={lesson.slug}><span className={`lesson-number ${lesson.accent}`}>{String(index + 1).padStart(2, "0")}</span><div><h3>{lesson.title}</h3><p>{lesson.summary}</p><span className="module-meta">{lesson.cardCount} การ์ด · {lesson.questionCount} ข้อสอบ</span></div><ArrowRight className="module-arrow" size={18} /></Link>)}</div></section>
      <section className="callout"><div><p className="eyebrow">วิธีใช้งาน</p><h2>อ่านสั้น ๆ → ลองนึกเอง → ทำข้อสอบ → กลับมาทบทวน</h2><p>ถ้าเข้าสู่ระบบด้วย Google ระบบจะบันทึกความคืบหน้าและประวัติการทำข้อสอบไว้กับบัญชีของคุณ</p></div><Link href="/learn" className="primary-button">เริ่มการ์ดแรก <ArrowRight size={18} /></Link></section>
    </main>
  );
}
