"use client";

import { useState } from "react";
import { Bot, Lightbulb, LoaderCircle } from "lucide-react";

export function AICoach({ topic, summary }: { topic: string; summary: string }) {
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);

  async function ask(mode: "explain" | "memory" | "quiz") {
    setLoading(true); setAnswer("");
    try {
      const response = await fetch("/api/ai", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ topic, summary, mode }) });
      const data = await response.json() as { content?: string; error?: string };
      setAnswer(data.content ?? data.error ?? "ยังไม่มีคำตอบ");
    } catch { setAnswer("เชื่อมต่อ AI ไม่สำเร็จ ลองใหม่อีกครั้ง"); }
    finally { setLoading(false); }
  }

  return <section className="ai-coach"><div className="ai-coach-title"><span className="ai-icon"><Bot size={18} /></span><div><strong>AI Coach</strong><small>ให้ช่วยอธิบายเรื่องนี้แบบเข้าใจง่าย</small></div></div><div className="ai-actions"><button onClick={() => ask("explain")} disabled={loading}><Lightbulb size={15} /> อธิบายเพิ่ม</button><button onClick={() => ask("memory")} disabled={loading}>ช่วยคิดวิธีจำ</button><button onClick={() => ask("quiz")} disabled={loading}>สร้างข้อสอบ</button></div>{loading && <p className="ai-status"><LoaderCircle size={15} className="spin" /> กำลังให้ AI ช่วยติว...</p>}{answer && <div className="ai-answer">{answer}</div>}</section>;
}
