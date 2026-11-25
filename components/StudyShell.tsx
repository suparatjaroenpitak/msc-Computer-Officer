"use client";

import { useEffect, useState } from "react";
import { Check, ChevronLeft, ChevronRight, RotateCcw, Sparkles } from "lucide-react";
import type { StudyLesson, StudyLessonMeta } from "@/lib/content";
import { AICoach } from "@/components/AICoach";
import { SpeakButton } from "@/components/SpeakButton";

function shuffle<T>(items: T[]) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[randomIndex]] = [result[randomIndex], result[index]];
  }
  return result;
}

export function StudyShell({ lessons }: { lessons: StudyLessonMeta[] }) {
  const [selectedSlug, setSelectedSlug] = useState(lessons[0]?.slug ?? "");
  const [lesson, setLesson] = useState<StudyLesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [cardIndex, setCardIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [mastered, setMastered] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const slug = new URLSearchParams(window.location.search).get("lesson");
    if (slug && lessons.some((item) => item.slug === slug)) setSelectedSlug(slug);
    const stored = window.localStorage.getItem("msc-mastered");
    if (stored) setMastered(JSON.parse(stored));
  }, [lessons]);

  useEffect(() => {
    if (!selectedSlug) return;
    const controller = new AbortController();
    setLoading(true);
    setLesson(null);
    setCardIndex(0);
    setRevealed(false);
    fetch(`/api/study?mode=learn&slug=${encodeURIComponent(selectedSlug)}`, { signal: controller.signal })
      .then((response) => response.ok ? response.json() as Promise<StudyLesson> : null)
      .then((payload) => {
        if (payload) setLesson({ ...payload, cards: shuffle(payload.cards) });
      })
      .catch(() => undefined)
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [selectedSlug]);

  const cards = lesson?.cards ?? [];
  const card = cards.length > 0 ? cards[cardIndex % cards.length] : undefined;
  const completed = cards.filter((item) => mastered[item.id]).length;

  const move = (remembered: boolean) => {
    if (!lesson || cards.length === 0 || !card) return;
    const next = { ...mastered, [card.id]: remembered };
    setMastered(next);
    window.localStorage.setItem("msc-mastered", JSON.stringify(next));
    fetch("/api/progress", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ cardId: card.id, remembered }) }).catch(() => undefined);
    setRevealed(false);
    setCardIndex((index) => (index + 1) % cards.length);
  };

  return <div className="study-grid">
    <aside className="lesson-list panel">
      <div className="panel-label">เลือกหมวดบทเรียน</div>
      {lessons.map((item, index) => <button key={item.slug} className={item.slug === selectedSlug ? "lesson-choice selected" : "lesson-choice"} onClick={() => setSelectedSlug(item.slug)}>
        <span className={`lesson-number ${item.accent}`}>{String(index + 1).padStart(2, "0")}</span>
        <span><strong>{item.title}</strong><small>{item.cardCount} การ์ด · {item.questionCount} ข้อสอบ</small></span>
      </button>)}
    </aside>
    <section className="study-main">
      {loading ? <div className="loading-card panel"><Sparkles size={20} className="spin" /><strong>กำลังโหลดการ์ดของหมวดนี้...</strong><span>โหลดเฉพาะเนื้อหาที่เลือกเพื่อให้แอปเปิดเร็วขึ้น</span></div> : !lesson || cards.length === 0 || !card ? <div className="loading-card panel"><strong>ไม่พบการ์ดของหมวดนี้</strong><span>ลองเลือกหมวดอื่นหรือโหลดหน้าเว็บใหม่</span></div> : <>
        <div className="section-heading"><div><p className="eyebrow"><Sparkles size={14} /> ACTIVE RECALL · คำถามก่อนเฉลย</p><h1>{lesson.title}</h1><p className="muted">{lesson.summary}</p></div><div className="progress-badge">{completed}/{cards.length} จำได้แล้ว</div></div>
        <div className="progress-track"><span style={{ width: `${(completed / cards.length) * 100}%` }} /></div>
        <div className={revealed ? "recall-card revealed" : "recall-card"}>
          <div className="card-topline"><span>การ์ด {cardIndex + 1} / {cards.length}</span><span className={`difficulty ${card.difficulty}`}>{card.difficulty === "easy" ? "เริ่มต้น" : card.difficulty === "medium" ? "กำลังฝึก" : "ท้าทาย"}</span></div>
          {!revealed ? <div className="card-body card-front"><p className="card-kicker">คำถาม</p><div className="card-question-row"><h2>{card.prompt}</h2><SpeakButton text={card.prompt} /></div><p className="recall-instruction">ลองตอบจากความจำก่อนเปิดเฉลย เพื่อฝึกการนึกย้อนกลับ</p><button className="primary-button reveal-button" onClick={() => setRevealed(true)}>เปิดเฉลย</button></div> : <div className="card-body card-back"><div className="card-question-row"><p className="card-kicker">เฉลย</p><SpeakButton text={`${card.prompt}. ${card.answer}. ${card.explanation}`} /></div><div className="answer-box"><strong className="card-answer">{card.answer}</strong><p>{card.explanation}</p><small>ที่มา: {card.source}{card.page == null ? "" : ` · หน้า ${card.page}`}</small></div></div>}
          <div className="card-actions"><button className="secondary-button" onClick={() => move(false)} disabled={!revealed}><RotateCcw size={17} /> ต้องทบทวนอีกครั้ง</button><button className="primary-button" onClick={() => move(true)} disabled={!revealed}><Check size={17} /> จำได้แล้ว</button></div>
        </div>
        <div className="study-tip"><span className="tip-icon">💡</span><p><strong>เทคนิคจำ:</strong> อ่านคำถาม ตอบในใจก่อน แล้วกดเปิดเฉลย การพยายามนึกเองจะช่วยให้จำได้นานกว่าการอ่านซ้ำ</p></div>
        <AICoach topic={lesson.title} summary={lesson.summary} />
        <div className="pager"><button className="icon-button" onClick={() => { setCardIndex((index) => (index - 1 + cards.length) % cards.length); setRevealed(false); }}><ChevronLeft size={18} /></button><span>เลื่อนการ์ด</span><button className="icon-button" onClick={() => { setCardIndex((index) => (index + 1) % cards.length); setRevealed(false); }}><ChevronRight size={18} /></button></div>
      </>}
    </section>
  </div>;
}
