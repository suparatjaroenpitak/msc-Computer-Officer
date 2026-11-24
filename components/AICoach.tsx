"use client";

import { useState } from "react";
import { Bot, Lightbulb, LoaderCircle } from "lucide-react";
import { SpeakButton } from "@/components/SpeakButton";

type AiSource = { source: string; page?: number; lesson?: string };

export function AICoach({ topic, summary }: { topic: string; summary: string }) {
  const [answer, setAnswer] = useState("");
  const [sources, setSources] = useState<AiSource[]>([]);
  const [loading, setLoading] = useState(false);

  async function ask(mode: "explain" | "memory" | "quiz") {
    setLoading(true); setAnswer(""); setSources([]);
    try {
      const response = await fetch("/api/ai", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ topic, summary, mode }) });
      const data = await response.json() as { content?: string; error?: string; sources?: AiSource[] };
      setAnswer(data.content ?? data.error ?? "ยังไม่มีคำตอบ");
      setSources(data.sources ?? []);
    } catch { setAnswer("เชื่อมต่อ AI ไม่สำเร็จ ลองใหม่อีกครั้ง"); }
    finally { setLoading(false); }
  }

  return <section className="ai-coach"><div className="ai-coach-title"><span className="ai-icon"><Bot size={18} /></span><div><strong>AI Coach</strong><small>ใช้เฉพาะเนื้อหาที่กลั่นแล้วจาก PDF ทั้ง 3 ไฟล์</small></div></div><div className="ai-actions"><button onClick={() => ask("explain")} disabled={loading}><Lightbulb size={15} /> อธิบายเพิ่ม</button><button onClick={() => ask("memory")} disabled={loading}>ช่วยคิดวิธีจำ</button><button onClick={() => ask("quiz")} disabled={loading}>สร้างข้อสอบ</button></div>{loading && <p className="ai-status"><LoaderCircle size={15} className="spin" /> กำลังให้ AI ช่วยติว...</p>}{answer && <div className="ai-answer"><div className="ai-answer-top"><SpeakButton text={answer} /></div>{answer}{sources.length > 0 && <div className="ai-sources"><strong>เนื้อหากลั่นแล้วที่ใช้ประกอบ:</strong> {sources.map((source) => `${source.lesson ?? "หมวดเรียน"} · ${source.source}${source.page == null ? "" : ` หน้า ${source.page}`}`).join(" · ")}</div>}</div>}</section>;
}
