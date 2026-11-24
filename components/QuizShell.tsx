"use client";

import { useEffect, useState } from "react";
import { ArrowRight, CheckCircle2, RotateCcw, Sparkles, XCircle } from "lucide-react";
import type { StudyLesson, StudyLessonMeta } from "@/lib/content";
import { SpeakButton } from "@/components/SpeakButton";

export function QuizShell({ lessons }: { lessons: StudyLessonMeta[] }) {
  const [selectedSlug, setSelectedSlug] = useState(lessons[0]?.slug ?? "");
  const [lesson, setLesson] = useState<StudyLesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [choice, setChoice] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    const slug = new URLSearchParams(window.location.search).get("lesson");
    if (slug && lessons.some((item) => item.slug === slug)) setSelectedSlug(slug);
  }, [lessons]);

  useEffect(() => {
    if (!selectedSlug) return;
    const controller = new AbortController();
    setLoading(true);
    setLesson(null);
    setQuestionIndex(0);
    setChoice(null);
    setScore(0);
    setFinished(false);
    fetch(`/api/study?mode=quiz&slug=${encodeURIComponent(selectedSlug)}`, { signal: controller.signal })
      .then((response) => response.ok ? response.json() as Promise<StudyLesson> : null)
      .then((payload) => { if (payload) setLesson(payload); })
      .catch(() => undefined)
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [selectedSlug]);

  const question = lesson?.questions[questionIndex];
  const scoredTotal = lesson?.questions.filter((item) => item.answerIndex !== null).length ?? 0;
  const reset = (slug = selectedSlug) => setSelectedSlug(slug);
  const submit = () => {
    if (!lesson || !question || choice === null) return;
    const nextScore = score + (question.answerIndex !== null && choice === question.answerIndex ? 1 : 0);
    setScore(nextScore);
    if (questionIndex === lesson.questions.length - 1) {
      setFinished(true);
      fetch("/api/quiz", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ lessonSlug: lesson.slug, score: nextScore, total: scoredTotal }) }).catch(() => undefined);
    } else {
      setQuestionIndex((index) => index + 1);
      setChoice(null);
    }
  };

  const sidebar = <aside className="quiz-sidebar panel"><div className="panel-label">เลือกชุดข้อสอบ</div>{lessons.map((item) => <button key={item.slug} className={item.slug === selectedSlug ? "lesson-choice selected" : "lesson-choice"} onClick={() => reset(item.slug)}><span><strong>{item.title}</strong><small>{item.questionCount} ข้อ</small></span></button>)}</aside>;
  if (loading || !lesson || !question) return <div className="quiz-layout">{sidebar}<section className="quiz-card panel loading-card"><Sparkles size={20} className="spin" /><strong>กำลังโหลดข้อสอบของหมวดนี้...</strong><span>โหลดเฉพาะชุดที่เลือกเพื่อให้แอปเปิดเร็วขึ้น</span></section></div>;
  if (finished) return <div className="result-card panel"><div className="result-emoji">🎉</div><p className="eyebrow">QUIZ COMPLETE</p><h1>ทำได้ {score} / {scoredTotal} ข้อที่มีเฉลย</h1><p className="muted">ชุดนี้มีทั้งหมด {lesson.questions.length} ข้อ</p><div className="result-actions"><button className="primary-button" onClick={() => reset()}><RotateCcw size={17} /> ทำชุดนี้อีกครั้ง</button><button className="secondary-button" onClick={() => reset(lessons[(lessons.findIndex((item) => item.slug === lesson.slug) + 1) % lessons.length].slug)}>ไปบทถัดไป <ArrowRight size={17} /></button></div></div>;

  return <div className="quiz-layout">{sidebar}<section className="quiz-card panel"><div className="quiz-meta"><span>ข้อ {questionIndex + 1} / {lesson.questions.length}</span><span>คะแนน {score}</span></div><div className="progress-track"><span style={{ width: `${((questionIndex + 1) / lesson.questions.length) * 100}%` }} /></div><div className="quiz-question-row"><h1>{question.prompt}</h1><SpeakButton text={`${question.prompt}. ตัวเลือก: ${question.options.join(". ")}`} /></div><div className="options">{question.options.map((option, index) => { const isSelected = choice === index; const isCorrect = question.answerIndex !== null && isSelected && index === question.answerIndex; const isWrong = question.answerIndex !== null && isSelected && index !== question.answerIndex; return <button key={option} className={`option ${isSelected ? "selected" : ""} ${isCorrect ? "correct" : ""} ${isWrong ? "wrong" : ""}`} onClick={() => setChoice(index)}><span className="option-letter">{String.fromCharCode(65 + index)}</span><span>{option}</span>{isCorrect && <CheckCircle2 size={18} />}{isWrong && <XCircle size={18} />}</button>; })}</div><div className="quiz-footer"><span className="muted">{question.answerIndex === null ? "ข้อนี้ยังไม่มีเฉลยใน PDF" : "เลือกคำตอบที่ดีที่สุด"}</span><button className="primary-button" disabled={choice === null} onClick={submit}>{questionIndex === lesson.questions.length - 1 ? "ส่งคำตอบ" : "ข้อต่อไป"} <ArrowRight size={17} /></button></div><p className="source-note">แหล่งเนื้อหา: {question.source}</p></section></div>;
}
