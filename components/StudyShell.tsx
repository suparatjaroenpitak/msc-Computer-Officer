"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, ChevronLeft, ChevronRight, RotateCcw, Sparkles } from "lucide-react";
import type { StudyLesson } from "@/lib/content";
import { AICoach } from "@/components/AICoach";
import { SpeakButton } from "@/components/SpeakButton";

export function StudyShell({ lessons }: { lessons: StudyLesson[] }) {
  const [selectedSlug, setSelectedSlug] = useState(lessons[0]?.slug ?? "");
  const [cardIndex, setCardIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [mastered, setMastered] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const slug = new URLSearchParams(window.location.search).get("lesson");
    if (slug && lessons.some((lesson) => lesson.slug === slug)) setSelectedSlug(slug);
    const stored = window.localStorage.getItem("msc-mastered");
    if (stored) setMastered(JSON.parse(stored));
  }, [lessons]);

  const lesson = useMemo(() => lessons.find((item) => item.slug === selectedSlug) ?? lessons[0], [lessons, selectedSlug]);
  const card = lesson.cards[cardIndex % lesson.cards.length];

  const move = (remembered: boolean) => {
    const next = { ...mastered, [card.id]: remembered };
    setMastered(next);
    window.localStorage.setItem("msc-mastered", JSON.stringify(next));
    fetch("/api/progress", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ cardId: card.id, remembered }) }).catch(() => undefined);
    setRevealed(false);
    setCardIndex((index) => (index + 1) % lesson.cards.length);
  };

  const completed = lesson.cards.filter((item) => mastered[item.id]).length;
  return <div className="study-grid">
    <aside className="lesson-list panel">
      <div className="panel-label">เลือกหมวดบทเรียน</div>
      {lessons.map((item, index) => <button key={item.slug} className={item.slug === lesson.slug ? "lesson-choice selected" : "lesson-choice"} onClick={() => { setSelectedSlug(item.slug); setCardIndex(0); setRevealed(false); }}>
        <span className={`lesson-number ${item.accent}`}>{String(index + 1).padStart(2, "0")}</span>
        <span><strong>{item.title}</strong><small>{item.cards.length} การ์ด · {item.questions.length} ข้อสอบ · {item.notes?.length ?? 0} เนื้อหา</small></span>
      </button>)}
    </aside>
    <section className="study-main">
      <div className="section-heading"><div><p className="eyebrow"><Sparkles size={14} /> ACTIVE RECALL · คำถามก่อนเฉลย</p><h1>{lesson.title}</h1><p className="muted">{lesson.summary}</p></div><div className="progress-badge">{completed}/{lesson.cards.length} จำได้แล้ว</div></div>
      <div className="progress-track"><span style={{ width: `${(completed / lesson.cards.length) * 100}%` }} /></div>
      <div className={revealed ? "recall-card revealed" : "recall-card"}>
        <div className="card-topline"><span>การ์ด {cardIndex + 1} / {lesson.cards.length}</span><span className={`difficulty ${card.difficulty}`}>{card.difficulty === "easy" ? "เริ่มต้น" : card.difficulty === "medium" ? "กำลังฝึก" : "ท้าทาย"}</span></div>
        {!revealed ? <div className="card-body card-front"><p className="card-kicker">คำถาม</p><div className="card-question-row"><h2>{card.prompt}</h2><SpeakButton text={card.prompt} /></div><p className="recall-instruction">ลองตอบจากความจำก่อนเปิดเฉลย เพื่อฝึกการนึกย้อนกลับ</p><button className="primary-button reveal-button" onClick={() => setRevealed(true)}>เปิดเฉลย</button></div> : <div className="card-body card-back"><div className="card-question-row"><p className="card-kicker">เฉลย</p><SpeakButton text={`${card.prompt}. ${card.answer}. ${card.explanation}`} /></div><div className="answer-box"><strong className="card-answer">{card.answer}</strong><p>{card.explanation}</p><small>ที่มา: {card.source}{card.page == null ? "" : ` · หน้า ${card.page}`}</small></div></div>}
        <div className="card-actions"><button className="secondary-button" onClick={() => move(false)} disabled={!revealed}><RotateCcw size={17} /> ต้องทบทวนอีกครั้ง</button><button className="primary-button" onClick={() => move(true)} disabled={!revealed}><Check size={17} /> จำได้แล้ว</button></div>
      </div>
      <div className="study-tip"><span className="tip-icon">💡</span><p><strong>เทคนิคจำ:</strong> อ่านคำถาม ตอบในใจก่อน แล้วกดเปิดเฉลย การพยายามนึกเองจะช่วยให้จำได้นานกว่าการอ่านซ้ำ</p></div>
      <AICoach topic={lesson.title} summary={lesson.summary} />
      <div className="pager"><button className="icon-button" onClick={() => { setCardIndex((index) => (index - 1 + lesson.cards.length) % lesson.cards.length); setRevealed(false); }}><ChevronLeft size={18} /></button><span>เลื่อนการ์ด</span><button className="icon-button" onClick={() => { setCardIndex((index) => (index + 1) % lesson.cards.length); setRevealed(false); }}><ChevronRight size={18} /></button></div>
    </section>
  </div>;
}
