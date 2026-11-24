import { NextResponse } from "next/server";
import { searchCuratedStudyBank } from "@/lib/curated-context";

export async function POST(request: Request) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "ยังไม่ได้ตั้งค่า GROQ_API_KEY" }, { status: 503 });

  const body = await request.json() as { topic?: string; summary?: string; mode?: "explain" | "memory" | "quiz" };
  if (!body.topic) return NextResponse.json({ error: "topic is required" }, { status: 400 });

  const mode = body.mode ?? "explain";
  const curatedHits = searchCuratedStudyBank(`${body.topic} ${body.summary ?? ""}`, 8);
  const curatedContext = curatedHits.length
    ? curatedHits.map((hit) => {
        const options = hit.options?.length ? ` ตัวเลือก: ${hit.options.join(" | ")}` : "";
        const page = hit.page == null ? "" : ` หน้า ${hit.page}`;
        const kind = hit.kind === "note" ? "เนื้อหาอ่าน" : hit.kind === "recall" ? "Active Recall" : "ข้อสอบ";
        return `[หมวด ${hit.lessonTitle} · ${kind}${page}] คำถาม/หัวข้อ: ${hit.prompt}${options} คำตอบ/เนื้อหา: ${hit.answer} เหตุผล: ${hit.explanation} ที่มา: ${hit.source}`;
      }).join("\n")
    : "ไม่พบเนื้อหากลั่นแล้วที่ตรงกับหัวข้อนี้ ให้บอกผู้เรียนอย่างชัดเจนว่าเป็นคำอธิบายเสริมจาก AI";
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
        { role: "system", content: "คุณเป็นติวเตอร์นักวิชาการคอมพิวเตอร์ อธิบายอย่างถูกต้อง ชัดเจน และใช้เฉพาะข้อมูลอ้างอิงที่ผ่านการกลั่นเป็นการ์ดหรือข้อสอบแล้ว ห้ามอ้างหรือแต่งข้อความจาก PDF ดิบที่ไม่ได้อยู่ในบริบท" },
        { role: "user", content: `หัวข้อ: ${body.topic}\nบริบทจากบทเรียน: ${body.summary ?? ""}\nบริบทจากเนื้อหากลั่นแล้ว:\n${curatedContext}\nงาน: ${instruction}\nให้ติดป้าย [จากเนื้อหากลั่นแล้ว] และ [AI เสริม] แยกกัน และอย่าสร้างมาตรา/ตัวเลขกฎหมายขึ้นเอง` },
      ],
    }),
  });

  if (!response.ok) return NextResponse.json({ error: "Groq ตอบกลับไม่สำเร็จ" }, { status: 502 });
  const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
  return NextResponse.json({ content: data.choices?.[0]?.message?.content ?? "ไม่มีคำตอบจาก AI", model: process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile", sources: curatedHits.map((hit) => ({ source: hit.source, page: hit.page, lesson: hit.lessonTitle })) });
}
