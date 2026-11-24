"""Turn every extracted PDF page into Active Recall cards and every MCQ block into exam items."""

from __future__ import annotations

import json
import re
from datetime import datetime, timezone
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
CORPUS_PATH = ROOT / "content" / "pdf-corpus.json"
OUT_PATH = ROOT / "content" / "study-bank.json"
OPTION_RE = re.compile(r"(?:^|\n)\s*([กขคง])\.\s*")
QUESTION_RE = re.compile(r"(?m)(?:^|\n)\s*(\d+)\.\s+")
ANSWER_RE = re.compile(r"(?:ตอบ|เฉลย)\s*([กขคง])")


def clean(value: str) -> str:
    return re.sub(r"\s+", " ", value).strip(" -|\t\r\n")


def page_summary(text: str) -> str:
    lines = []
    for raw in text.splitlines():
        line = clean(raw)
        if not line or set(line) <= {"-", "_", "."} or line.isdigit():
            continue
        if line.startswith(("(สนใจติดต่อ", "www.", "Tel :", "ห้าม!!")):
            continue
        lines.append(line)
    summary = " ".join(lines[:8])
    return summary[:900] + ("..." if len(summary) > 900 else "")


def difficulty(text: str) -> str:
    length = len(text)
    if length < 900:
        return "easy"
    if length < 1800:
        return "medium"
    return "hard"


def parse_questions(source: dict) -> list[dict]:
    questions = []
    for page in source["pages"]:
        text = page["text"]
        starts = list(QUESTION_RE.finditer(text))
        for index, match in enumerate(starts):
            end = starts[index + 1].start() if index + 1 < len(starts) else len(text)
            block = text[match.start():end]
            options = list(OPTION_RE.finditer(block))
            if len(options) < 4:
                continue
            question_text = clean(block[match.end() - match.start():options[0].start()])
            option_values = []
            for option_index, option in enumerate(options[:4]):
                option_end = options[option_index + 1].start() if option_index + 1 < len(options) else len(block)
                value = clean(block[option.end():option_end])
                value = re.split(r"(?:ตอบ|เฉลย)\s*[กขคง]", value, maxsplit=1)[0].strip()
                option_values.append(value)
            answer = ANSWER_RE.search(block)
            answer_index = None
            if answer:
                answer_index = "กขคง".find(answer.group(1))
            question_number = match.group(1)
            source_label = f"{source['title']} หน้า {page['page']}"
            questions.append({
                "id": f"pdf-q-{source['id']}-{page['page']}-{question_number}-{index}",
                "prompt": question_text,
                "options": option_values,
            "answerIndex": answer_index if answer_index is not None and answer_index >= 0 else None,
                "explanation": clean(block[answer.end():])[:600] if answer else "หน้านี้มีโจทย์จาก PDF แต่ไม่พบเฉลยในบล็อกเดียวกัน ให้ใช้ AI Coach ตรวจเหตุผลเมื่อเชื่อมต่อ Groq",
                "source": source_label,
                "sourceId": source["id"],
                "page": page["page"],
                "origin": "pdf",
            })
    return questions


def main() -> None:
    corpus = json.loads(CORPUS_PATH.read_text(encoding="utf-8"))
    recall_cards = []
    all_questions = []
    for source in corpus["sources"]:
        for page in source["pages"]:
            summary = page_summary(page["text"])
            if not summary:
                summary = "หน้านี้ไม่มีข้อความที่ดึงได้ อาจเป็นหน้าปกหรือภาพสแกน"
            source_label = f"{source['title']} หน้า {page['page']}"
            recall_cards.append({
                "id": f"pdf-card-{source['id']}-{page['page']}",
                "prompt": f"จาก {source_label} อธิบายใจความสำคัญและคำสำคัญของหน้านี้จากความจำ",
                "answer": summary,
                "explanation": "อ่านคำตอบให้จบ แล้วกลับไปนึกหัวข้อ คำสำคัญ และตัวเลข/ข้อยกเว้นที่อยู่ในหน้านี้อีกครั้ง",
                "source": source_label,
                "difficulty": difficulty(page["text"]),
                "sourceId": source["id"],
                "page": page["page"],
                "origin": "pdf-page",
            })
        all_questions.extend(parse_questions(source))

    pdf_recall = {
        "slug": "pdf-recall-all",
        "title": "Active Recall จาก PDF ทั้งหมด",
        "summary": f"ทบทวนครบทุกหน้าจาก 3 ไฟล์ รวม {corpus['totalPages']} หน้า พร้อมแหล่งที่มา",
        "accent": "blue",
        "cards": recall_cards,
        "questions": [],
    }
    pdf_exam = {
        "slug": "pdf-exam-bank",
        "title": "คลังข้อสอบจาก PDF ทั้งหมด",
        "summary": f"ข้อสอบที่ดึงจากเอกสารจริง {len(all_questions)} ข้อ; ข้อที่ยังไม่มีเฉลยจะแสดงเป็นข้อฝึกไม่คิดคะแนน",
        "accent": "violet",
        "cards": [],
        "questions": all_questions,
    }
    output = {
        "version": 1,
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "stats": {
            "totalPages": corpus["totalPages"],
            "recallCards": len(recall_cards),
            "examQuestions": len(all_questions),
            "scoredQuestions": sum(q["answerIndex"] is not None for q in all_questions),
        },
        "lessons": [pdf_recall, pdf_exam],
    }
    OUT_PATH.write_text(json.dumps(output, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(json.dumps(output["stats"], ensure_ascii=False))
    print(f"เขียนคลัง Active Recall/ข้อสอบ: {OUT_PATH}")


if __name__ == "__main__":
    main()
