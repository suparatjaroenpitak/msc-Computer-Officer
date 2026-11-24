import { NextResponse } from "next/server";
import { searchPdfCorpus } from "@/lib/pdf-corpus";

export async function POST(request: Request) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "ยังไม่ได้ตั้งค่า GROQ_API_KEY" }, { status: 503 });

  const body = await request.json() as { topic?: string; summary?: string; mode?: "explain" | "memory" | "quiz" };
  if (!body.topic) return NextResponse.json({ error: "topic is required" }, { status: 400 });

  const mode = body.mode ?? "explain";
  const pdfHits = searchPdfCorpus(`${body.topic} ${body.summary ?? ""}`, 6);
  const pdfContext = pdfHits.length
    ? pdfHits.map((hit) => `[${hit.sourceTitle} หน้า ${hit.page}] ${hit.snippet}`).join("\n")
    : "ไม่พบข้อความตรงจากคลัง PDF ให้บอกผู้เรียนอย่างชัดเจนว่าเป็นคำอธิบายเสริมจาก AI";
  const instruction = mode === "memory"
    ? "อธิบายด้วยเทคนิคจำง่าย เปรียบเทียบกับชีวิตประจำวัน และสร้างคำถาม recall 3 ข้อ"
    : mode === "quiz"
      ? "สร้างข้อสอบปรนัย 3 ข้อ พร้อมตัวเลือก เฉลย และเหตุผล โดยใช้ภาษาไทยง่าย ๆ"
      : "อธิบายให้เด็กนักเรียนเข้าใจง่าย ใช้ตัวอย่างใกล้ตัว และสรุปท้ายคำตอบ 3 บรรทัด";

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile",
      temperature: 0.35,
      messages: [
        { role: "system", content: "คุณเป็นติวเตอร์นักวิชาการคอมพิวเตอร์ อธิบายอย่างถูกต้อง ชัดเจน และบอกเมื่อข้อมูลเป็นการขยายจากแหล่งอ้างอิง" },
        { role: "user", content: `หัวข้อ: ${body.topic}\nบริบทจากบทเรียน: ${body.summary ?? ""}\nข้อความอ้างอิงจาก PDF:\n${pdfContext}\nงาน: ${instruction}\nให้ติดป้าย [จาก PDF] และ [AI เสริม] แยกกัน และอย่าสร้างมาตรา/ตัวเลขกฎหมายขึ้นเอง` },
      ],
    }),
  });

  if (!response.ok) return NextResponse.json({ error: "Groq ตอบกลับไม่สำเร็จ" }, { status: 502 });
  const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
  return NextResponse.json({ content: data.choices?.[0]?.message?.content ?? "ไม่มีคำตอบจาก AI", model: process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile", sources: pdfHits.map((hit) => ({ source: hit.sourceTitle, page: hit.page, fileName: hit.fileName })) });
}
