"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

type Stats = { cardsReviewed: number; quizAttempts: number; accuracy: number; quizAccuracy: number };

export function PersonalStats() {
  const { status } = useSession();
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/stats").then((response) => response.ok ? response.json() as Promise<Stats> : null).then((data) => { if (data) setStats(data); }).catch(() => undefined);
  }, [status]);

  if (!stats) return null;
  return <section className="section-block"><div className="section-heading"><div><p className="eyebrow">YOUR PROGRESS</p><h2>สถิติการเรียนของคุณ</h2><p className="muted">ข้อมูลนี้ผูกกับบัญชี Google และใช้ต่อเนื่องได้ทุกอุปกรณ์</p></div></div><div className="stats-grid"><div className="stat-card"><strong>{stats.cardsReviewed}</strong><span>การ์ดที่ทบทวน</span></div><div className="stat-card"><strong>{stats.accuracy}%</strong><span>ความแม่นยำ Recall</span></div><div className="stat-card"><strong>{stats.quizAttempts}</strong><span>ครั้งที่ทำข้อสอบ</span></div><div className="stat-card"><strong>{stats.quizAccuracy}%</strong><span>ความแม่นยำข้อสอบ</span></div></div></section>;
}
