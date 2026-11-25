import { NextResponse } from "next/server";
import { getRequiredApiSession } from "@/lib/require-auth";
import { prisma } from "@/lib/prisma";

type AiMode = "explain" | "memory" | "quiz" | "generate-recall" | "generate-quiz" | "image";

type AiItem = {
  id?: string;
  kind: "recall" | "quiz";
  prompt: string;
  answer?: string;
  explanation?: string;
  options?: string[];
  source?: string;
};

type GeneratedDraft = {
  prompt: string;
  answer?: string;
  options?: string[];
  answerIndex?: number | null;
  explanation?: string;
};

function cleanAiText(value: string) {
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

function parseGeneratedDrafts(raw: string, mode: "generate-recall" | "generate-quiz", item: AiItem): GeneratedDraft[] {
  const normalized = raw.replace(/^\x60\x60\x60(?:json)?\s*/i, "").replace(/\s*\x60\x60\x60$/i, "").trim();
  let parsed: unknown;
  try {
    parsed = JSON.parse(normalized);
  } catch {
    parsed = undefined;
  }
  const candidates = Array.isArray(parsed)
    ? parsed
    : parsed && typeof parsed === "object" && Array.isArray((parsed as { items?: unknown[] }).items)
      ? (parsed as { items: unknown[] }).items
      : [];
  const drafts = candidates.flatMap((candidate) => {
    if (!candidate || typeof candidate !== "object") return [];
    const value = candidate as Record<string, unknown>;
    const prompt = typeof value.prompt === "string" ? cleanAiText(value.prompt) : "";
    if (!prompt) return [];
    const options = Array.isArray(value.options) ? value.options.filter((option): option is string => typeof option === "string").map(cleanAiText) : undefined;
    const answerIndex = typeof value.answerIndex === "number" ? Math.max(0, Math.min(3, Math.trunc(value.answerIndex))) : null;
    return [{
      prompt,
      answer: typeof value.answer === "string" ? cleanAiText(value.answer) : undefined,
      options: options?.length === 4 ? options : undefined,
      answerIndex,
      explanation: typeof value.explanation === "string" ? cleanAiText(value.explanation) : undefined,
    }];
  });
  if (drafts.length > 0) return drafts.slice(0, 5);
  return [{
    prompt: item.prompt,
    answer: mode === "generate-recall" ? item.answer ?? cleanAiText(raw) : undefined,
    options: mode === "generate-quiz" ? item.options : undefined,
    answerIndex: mode === "generate-quiz" ? (item.options?.length ? 0 : null) : undefined,
    explanation: item.explanation,
  }];
}

function formatGeneratedDrafts(drafts: GeneratedDraft[], mode: "generate-recall" | "generate-quiz") {
  return drafts.map((draft, index) => {
    const lines = ["ข้อที่สร้างใหม่ " + (index + 1), "คำถาม: " + draft.prompt];
    if (mode === "generate-recall") {
      lines.push("คำตอบ: " + (draft.answer ?? "ยังไม่มีคำตอบ"));
    } else {
      draft.options?.forEach((option, optionIndex) => lines.push(String.fromCharCode(65 + optionIndex) + ". " + option));
      lines.push("เฉลย: " + (draft.answerIndex == null ? "ยังไม่มีเฉลย" : String.fromCharCode(65 + draft.answerIndex)));
    }
    if (draft.explanation) lines.push("อธิบาย: " + draft.explanation);
    return lines.join("\n");
  }).join("\n\n");
}

function escapeXml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

function makeSummarySvg(title: string, prompt: string, content: string) {
  const rawLines = [title, "", "คำถาม: " + prompt, "", ...content.split(/\r?\n/)];
  const lines = rawLines.flatMap((line) => {
    if (line.length <= 70) return [line];
    const parts: string[] = [];
    for (let index = 0; index < line.length; index += 70) parts.push(line.slice(index, index + 70));
    return parts;
  }).slice(0, 28);
  const height = Math.max(560, 150 + lines.length * 34);
  const text = lines.map((line, index) => "<text x=\"70\" y=\"" + (105 + index * 34) + "\" class=\"" + (index === 0 ? "title" : "body") + "\">" + escapeXml(line) + "</text>").join("");
  return "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"1200\" height=\"" + height + "\" viewBox=\"0 0 1200 " + height + "\"><rect width=\"1200\" height=\"" + height + "\" rx=\"28\" fill=\"#f8f7ff\"/><rect x=\"28\" y=\"28\" width=\"1144\" height=\"" + (height - 56) + "\" rx=\"22\" fill=\"#ffffff\" stroke=\"#ddd6fe\" stroke-width=\"3\"/><style>.title{font:700 30px Arial,sans-serif;fill:#4c1d95}.body{font:400 22px Arial,sans-serif;fill:#172033}</style>" + text + "</svg>";
}

async function saveGeneratedItems(userId: string, body: { topic: string; item: AiItem; mode: AiMode; model: string; rawResponse: string; drafts?: GeneratedDraft[]; imageSvg?: string }) {
  if (body.mode === "generate-recall" || body.mode === "generate-quiz") {
    const drafts = body.drafts ?? [];
    const saved = await Promise.all(drafts.map((draft) => prisma.generatedStudyItem.create({
      data: {
        userId,
        itemType: body.mode === "generate-recall" ? "recall" : "quiz",
        mode: body.mode,
        prompt: draft.prompt,
        answer: draft.answer,
        options: draft.options,
        answerIndex: draft.answerIndex,
        explanation: draft.explanation,
        source: body.item.source,
        sourceItemId: body.item.id,
        lessonSlug: body.topic,
        rawResponse: body.rawResponse,
        model: body.model,
      },
      select: { id: true },
    })));
    return saved.map((item) => item.id);
  }
  if (body.mode === "image" && body.imageSvg) {
    const saved = await prisma.generatedStudyItem.create({
      data: {
        userId,
        itemType: "image",
        mode: "image",
        prompt: body.item.prompt,
        answer: body.item.answer,
        explanation: body.item.explanation,
        source: body.item.source,
        sourceItemId: body.item.id,
        lessonSlug: body.topic,
        rawResponse: body.rawResponse,
        imageSvg: body.imageSvg,
        model: body.model,
      },
      select: { id: true },
    });
    return [saved.id];
  }
  return [];
}

export async function POST(request: Request) {
  const session = await getRequiredApiSession();
  if (!session?.user?.id) return NextResponse.json({ error: "ต้องเข้าสู่ระบบด้วย Google ก่อนใช้งาน" }, { status: 401 });

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "ยังไม่ได้ตั้งค่า GROQ_API_KEY" }, { status: 503 });

  const body = await request.json() as { topic?: string; summary?: string; mode?: AiMode; item?: AiItem };
  if (!body.topic || !body.item?.prompt) return NextResponse.json({ error: "ต้องส่งข้อมูลการ์ดหรือข้อสอบที่กำลังเปิดอยู่" }, { status: 400 });

  const item = body.item;
  const mode = body.mode ?? "explain";
  const generateMode = mode === "generate-recall" || mode === "generate-quiz";
  const instruction = mode === "memory"
    ? "ช่วยคิดวิธีจำเฉพาะข้อนี้ เปรียบเทียบกับชีวิตประจำวัน และให้คำถามทบทวนสั้น ๆ 2 ข้อ"
    : mode === "quiz"
      ? "ถามต่อยอดจากข้อนี้ 2 ข้อ โดยห้ามออกนอกแนวคิดของข้อที่เปิดอยู่ พร้อมเฉลยสั้น ๆ"
      : mode === "generate-recall"
        ? "สร้างการ์ด Active Recall ใหม่ 3 ใบจากเนื้อหาของข้อที่เปิดอยู่เท่านั้น ให้คำถามสั้น กระชับ และคำตอบตรงกับเอกสาร"
        : mode === "generate-quiz"
          ? "สร้างข้อสอบปรนัย 4 ตัวเลือกใหม่ 3 ข้อจากเนื้อหาของข้อที่เปิดอยู่เท่านั้น ห้ามออกนอกเนื้อหา"
          : mode === "image"
            ? "สรุปคำตอบของข้อนี้เป็นข้อความสั้น 5 ถึง 8 บรรทัด เพื่อทำภาพสรุป"
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
    "ใช้ภาษาไทยที่อ่านง่าย ประโยคสั้น และรักษาสระ วรรณยุกต์ และเครื่องหมายภาษาไทยให้ครบ",
    "ห้ามใช้ตาราง Markdown โค้ดบล็อก หรือการเขียนตัวเลขติดกันจนอ่านเป็นอีกตัวเลขหนึ่ง",
    "ถ้ามีการคำนวณ ให้แยกเป็นบรรทัด สูตร / แทนค่า / คำตอบ และเขียนเลขยกกำลังเป็นคำว่า ยกกำลัง เช่น 2 ยกกำลัง 8",
    "ให้เว้นบรรทัดระหว่างหัวข้อและคำอธิบายทุกหัวข้อ ใช้ไม่เกิน 2 ประโยคต่อย่อหน้า",
    generateMode ? "ตอบเป็น JSON เท่านั้นในรูปแบบ {\"items\":[{\"prompt\":\"...\",\"answer\":\"...\",\"explanation\":\"...\",\"options\":[\"...\",\"...\",\"...\",\"...\"],\"answerIndex\":0}]} โดย generate-recall ไม่ต้องใส่ options และ generate-quiz ต้องใส่ options 4 ตัวเลือก" : "",
    "สำหรับงานอธิบายทั่วไป ใช้หัวข้อสั้น ๆ: คำตอบสั้น / อธิบายง่าย / วิธีจำ / จุดที่มักสับสน",
  ].filter(Boolean).join("\n");
  const userPrompt = ["หมวด: " + body.topic, "สรุปหมวด: " + (body.summary ?? ""), "งานที่ต้องทำ: " + instruction, currentItem].join("\n\n");
  const model = process.env.GROQ_MODEL ?? "openai/gpt-oss-120b";
  const requestBody: Record<string, unknown> = {
    model,
    temperature: generateMode ? 0.2 : 0.25,
    reasoning_effort: "low",
    max_completion_tokens: 900,
    messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }],
  };
  if (generateMode) requestBody.response_format = { type: "json_object" };

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: "Bearer " + apiKey },
    body: JSON.stringify(requestBody),
  });
  if (!response.ok) {
    const providerError = await response.text();
    console.error("Groq API request failed", { status: response.status, model, providerError: providerError.slice(0, 1000) });
    const error = response.status === 401
      ? "GROQ_API_KEY ไม่ถูกต้องหรือหมดอายุ"
      : response.status === 404
        ? "ไม่พบโมเดล Groq: " + model
        : "Groq ตอบกลับด้วยสถานะ " + response.status;
    return NextResponse.json({ error, model }, { status: 502 });
  }

  const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
  const rawContent = data.choices?.[0]?.message?.content ?? "ไม่มีคำตอบจาก AI";
  const drafts = generateMode ? parseGeneratedDrafts(rawContent, mode, item) : undefined;
  const content = generateMode ? formatGeneratedDrafts(drafts ?? [], mode) : cleanAiText(rawContent);
  let imageUrl: string | undefined;
  let imageSvg: string | undefined;
  if (mode === "image") {
    imageSvg = makeSummarySvg("สรุปโดย AI Coach", item.prompt, cleanAiText(rawContent));
    imageUrl = "data:image/svg+xml;base64," + Buffer.from(imageSvg).toString("base64");
  }

  let savedIds: string[] = [];
  let saveError: string | undefined;
  try {
    savedIds = await saveGeneratedItems(session.user.id, { topic: body.topic, item, mode, model, rawResponse: rawContent, drafts, imageSvg });
  } catch (error) {
    console.error("Could not save AI-generated study item", error);
    saveError = "AI ตอบแล้ว แต่ยังบันทึกลงฐานข้อมูลไม่ได้";
  }
  return NextResponse.json({
    content,
    model,
    imageUrl,
    savedIds,
    saveError,
    generated: drafts ?? [],
    sources: item.source ? [{ source: item.source }] : [],
  });
}
