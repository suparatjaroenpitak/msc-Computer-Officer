import { NextResponse } from "next/server";
import { getRequiredApiSession } from "@/lib/require-auth";

type AiItem = {
  kind: "recall" | "quiz";
  prompt: string;
  answer?: string;
  explanation?: string;
  options?: string[];
  source?: string;
};

export async function POST(request: Request) {
  const session = await getRequiredApiSession();
  if (!session?.user?.id) return NextResponse.json({ error: "ต้องเข้าสู่ระบบด้วย Google ก่อนใช้งาน" }, { status: 401 });

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "ยังไม่ได้ตั้งค่า GROQ_API_KEY" }, { status: 503 });

  const body = await request.json() as {
    topic?: string;
    summary?: string;
    mode?: "explain" | "memory" | "quiz";
    item?: AiItem;
  };
  if (!body.topic || !body.item?.prompt) {
    return NextResponse.json({ error: "ต้องส่งข้อมูลการ์ดหรือข้อสอบที่กำลังเปิดอยู่" }, { status: 400 });
  }

  const item = body.item;
  const mode = body.mode ?? "explain";
  const instruction = mode === "memory"
    ? "ช่วยคิดวิธีจำเฉพาะข้อนี้ เปรียบเทียบกับชีวิตประจำวัน และให้คำถามทบทวนสั้น ๆ 2 ข้อ"
    : mode === "quiz"
      ? "ถามต่อยอดจากข้อนี้ 2 ข้อ โดยห้ามออกนอกแนวคิดของข้อที่เปิดอยู่ พร้อมเฉลยสั้น ๆ"
      : "อธิบายเฉพาะข้อนี้ให้เข้าใจง่าย พร้อมชี้คำตอบและเหตุผลตามข้อมูลที่ให้";
  const currentItem = [
    "[ข้อมูลของข้อที่กำลังเปิดอยู่เท่านั้น]",
    "ประเภท: " + (item.kind === "recall" ? "Active Recall" : "ข้อสอบ"),
    "คำถาม: " + item.prompt,
    item.options?.length ? "ตัวเลือก: " + item.options.join(" | ") : "",
    item.answer ? "คำตอบจากเอกสาร: " + item.answer : "",
    item.explanation ? "เหตุผลจากเอกสาร: " + item.explanation : "",
    item.source ? "ที่มา: " + item.source : "",
  ].filter(Boolean).join("\n");
  const systemPrompt = [
    "คุณเป็นติวเตอร์นักวิชาการคอมพิวเตอร์สำหรับนักเรียนไทย",
    "ตอบเฉพาะข้อมูลของข้อที่กำลังเปิดอยู่ ห้ามดึงหรือผสมข้อมูลจากหัวข้ออื่น",
    "ถ้าข้อมูลไม่พอ ให้บอกตรง ๆ ว่ายังไม่มีข้อมูลในข้อนี้ ห้ามแต่งมาตรา ตัวเลข หรือคำตอบใหม่",
    "จัดคำตอบให้อ่านง่ายด้วยหัวข้อสั้น ๆ และรายการย่อย ไม่เขียนเป็นย่อหน้ายาว",
    "ใช้รูปแบบ: คำตอบสั้น / อธิบายง่าย / วิธีจำ / จุดที่มักสับสน",
  ].join("\n");
  const userPrompt = [
    "หมวด: " + body.topic,
    "สรุปหมวด: " + (body.summary ?? ""),
    "งานที่ต้องทำ: " + instruction,
    currentItem,
  ].join("\n\n");
  const model = process.env.GROQ_MODEL ?? "openai/gpt-oss-20b";

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: "Bearer " + apiKey },
    body: JSON.stringify({
      model,
      temperature: 0.25,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    }),
  });

  if (!response.ok) {
    const providerError = await response.text();
    console.error("Groq API request failed", {
      status: response.status,
      model,
      providerError: providerError.slice(0, 1000),
    });
    const error = response.status === 401
      ? "GROQ_API_KEY ไม่ถูกต้องหรือหมดอายุ"
      : response.status === 404
        ? "ไม่พบโมเดล Groq: " + model
        : "Groq ตอบกลับด้วยสถานะ " + response.status;
    return NextResponse.json({ error, model }, { status: 502 });
  }

  const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
  return NextResponse.json({
    content: data.choices?.[0]?.message?.content ?? "ไม่มีคำตอบจาก AI",
    model,
    sources: item.source ? [{ source: item.source }] : [],
  });
}

