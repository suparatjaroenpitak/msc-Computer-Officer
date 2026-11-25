"use client";

import { useEffect, useState } from "react";
import { Bot, Lightbulb, LoaderCircle } from "lucide-react";
import { SpeakButton } from "@/components/SpeakButton";

type AiSource = { source: string; page?: number; lesson?: string };
export type AiItemContext = {
  id?: string;
  kind: "recall" | "quiz";
  prompt: string;
  answer?: string;
  explanation?: string;
  options?: string[];
  source?: string;
};

export type AiGeneratedItem = {
  id: string;
  generatedItemId: string;
  kind: "recall" | "quiz";
  prompt: string;
  answer?: string;
  options?: string[];
  answerIndex?: number | null;
  explanation: string;
  source: string;
};

function cleanAiText(value: string) {
  return value
    .replace(/```[\s\S]*?```/g, (block) => block.replace(/```[a-zA-Z]*\n?/g, ""))
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/^\s*#{1,6}\s*/gm, "")
    .replace(/^\s*[-*+•]\s+/gm, "")
    .replace(/[*_~`>|]/g, "")
    .replace(/[^\p{L}\p{M}\p{N}\s.,:;!?()\/+\-%]/gu, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function normalizeAiText(value: string) {
  return value
    .replace(/\x60\x60\x60[\s\S]*?\x60\x60\x60/g, (block) => block.replace(/\x60\x60\x60[a-zA-Z]*\n?/g, ""))
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, "($1 ÷ $2)")
    .replace(/\\(?:times|cdot)/g, " × ")
    .replace(/\\div/g, " ÷ ")
    .replace(/\^\{([^{}]+)\}/g, " ยกกำลัง $1")
    .replace(/^\s*#{1,6}\s*/gm, "")
    .replace(/^\s*[-*+•]\s+/gm, "")
    .replace(/(\d+(?:\.\d+)?)\s*\*\s*(\d+(?:\.\d+)?)/g, "$1 × $2")
    .replace(/(\d+(?:\.\d+)?)\s*\^\s*(\d+(?:\.\d+)?)/g, "$1 ยกกำลัง $2")
    .replace(/[*_~\x60>|]/g, "")
    .replace(/[^\p{L}\p{M}\p{N}\s.,:;!?()\/+\-%=^<>&×÷√≤≥≠₀₁₂₃₄₅₆₇₈₉⁰¹²³⁴⁵⁶⁷⁸⁹]/gu, "")
    .replace(/[ \t]+/g, " ")
    .replace(/[ \t]*\n[ \t]*/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

type AiBlock = { title: string; lines: string[] };

function splitAiBlocks(value: string): AiBlock[] {
  const blocks: AiBlock[] = [];
  let current: AiBlock = { title: "คำอธิบายจาก AI", lines: [] };
  const headingPattern = /^(คำตอบสั้น|อธิบายง่าย|เหตุผล|วิธีจำ|จุดที่มักสับสน|ข้อที่สร้างใหม่(?:\s+\d+)?)\s*:?\s*(.*)$/;
  for (const rawLine of value.split("\n")) {
    const line = rawLine.trim();
    if (!line) continue;
    const match = line.match(headingPattern);
    if (match) {
      if (current.lines.length > 0) blocks.push(current);
      current = { title: match[1], lines: match[2] ? [match[2]] : [] };
    } else {
      current.lines.push(line);
    }
  }
  if (current.lines.length > 0) blocks.push(current);
  return blocks.length > 0 ? blocks : [{ title: "คำอธิบายจาก AI", lines: [value] }];
}

function ReadableAiAnswer({ text }: { text: string }) {
  return <div className="ai-readable">{splitAiBlocks(text).map((block, blockIndex) => <section className={"ai-block ai-block-" + blockIndex} key={block.title + blockIndex}>
    <h4>{block.title}</h4>
    <div className="ai-block-content">{block.lines.map((line, lineIndex) => {
      const numbered = line.match(/^(\d+)[.)]\s*(.*)$/);
      return numbered
        ? <div className="ai-step" key={line + lineIndex}><span>{numbered[1]}</span><p>{numbered[2]}</p></div>
        : <p key={line + lineIndex}>{line}</p>;
    })}</div>
  </section>)}</div>;
}

export function AICoach({
  topic,
  summary,
  item,
  onGenerated,
}: {
  topic: string;
  summary: string;
  item: AiItemContext;
  onGenerated?: (items: AiGeneratedItem[]) => void;
}) {
  const [answer, setAnswer] = useState("");
  const [sources, setSources] = useState<AiSource[]>([]);
  const [imageUrl, setImageUrl] = useState("");
  const [savedMessage, setSavedMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setAnswer("");
    setSources([]);
    setImageUrl("");
    setSavedMessage("");
  }, [item.prompt]);

  async function ask(mode: "explain" | "memory" | "quiz" | "generate-recall" | "generate-quiz" | "image") {
    setLoading(true);
    setAnswer("");
    setSources([]);
    setImageUrl("");
    setSavedMessage("");
    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, summary, item, mode }),
      });
      const data = await response.json() as { content?: string; error?: string; sources?: AiSource[]; imageUrl?: string; savedIds?: string[]; saveError?: string; generated?: Array<{ prompt: string; answer?: string; options?: string[]; answerIndex?: number | null; explanation?: string; source?: string }> };
      setAnswer(normalizeAiText(data.content ?? data.error ?? "ยังไม่มีคำตอบ"));
      setSources(data.sources ?? []);
      setImageUrl(data.imageUrl ?? "");
      setSavedMessage(data.saveError ?? (data.savedIds?.length ? `บันทึกลงฐานข้อมูลแล้ว ${data.savedIds.length} รายการ` : ""));
      if ((mode === "generate-recall" || mode === "generate-quiz") && data.savedIds?.length && data.generated?.length && onGenerated) {
        const kind = mode === "generate-recall" ? "recall" : "quiz";
        const generated = data.generated.flatMap((draft, index) => {
          const generatedItemId = data.savedIds?.[index];
          if (!generatedItemId || !draft.prompt) return [];
          return [{
            id: `ai-${generatedItemId}`,
            generatedItemId,
            kind,
            prompt: draft.prompt,
            answer: draft.answer,
            options: draft.options,
            answerIndex: draft.answerIndex,
            explanation: draft.explanation ?? "เฉลยจาก AI โดยยึดเนื้อหาข้อที่กำลังเปิด",
            source: draft.source ?? item.source ?? "AI Coach",
          } satisfies AiGeneratedItem];
        });
        onGenerated(generated);
      }
    } catch {
      setAnswer("เชื่อมต่อ AI ไม่สำเร็จ ลองใหม่อีกครั้ง");
    } finally {
      setLoading(false);
    }
  }

  return <section className="ai-coach">
    <div className="ai-coach-title">
      <span className="ai-icon"><Bot size={18} /></span>
      <div><strong>AI Coach</strong><small>ตอบจากการ์ด/ข้อสอบที่กำลังเปิดอยู่เท่านั้น</small></div>
    </div>
    <div className="ai-current"><strong>กำลังช่วยข้อนี้:</strong><span>{item.prompt}</span></div>
    <div className="ai-actions">
      <button onClick={() => ask("explain")} disabled={loading}><Lightbulb size={15} /> อธิบายข้อนี้</button>
      <button onClick={() => ask("memory")} disabled={loading}>ช่วยคิดวิธีจำข้อนี้</button>
      <button onClick={() => ask("quiz")} disabled={loading}>ถามต่อจากข้อนี้</button>
      <button onClick={() => ask("generate-recall")} disabled={loading}>สร้าง Recall ใหม่</button>
      <button onClick={() => ask("generate-quiz")} disabled={loading}>สร้างข้อสอบใหม่</button>
      <button onClick={() => ask("image")} disabled={loading}>ทำเป็นภาพสรุป</button>
    </div>
    {loading && <p className="ai-status"><LoaderCircle size={15} className="spin" /> กำลังวิเคราะห์ข้อนี้...</p>}
    {answer && <div className="ai-answer">
      <div className="ai-answer-top"><SpeakButton text={answer} /></div>
      <ReadableAiAnswer text={answer} />
      {sources.length > 0 && <div className="ai-sources"><strong>ที่มา:</strong> {sources.map((source) => `${source.lesson ?? "หมวดเรียน"} · ${source.source}${source.page == null ? "" : ` หน้า ${source.page}`}`).join(" · ")}</div>}
    </div>}
    {savedMessage && <p className="ai-saved-message">{savedMessage}</p>}
    {imageUrl && <div className="ai-image-result"><img src={imageUrl} alt="ภาพสรุปจาก AI Coach" /></div>}
  </section>;
}

