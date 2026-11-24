"""Build a student-friendly study bank from the three extracted exam PDFs.

The raw page corpus remains available for source inspection. This pipeline removes
boilerplate, repairs common PDF extraction artifacts, groups pages by exam topic,
deduplicates MCQs, links answer-key pages where possible, and creates concise
Active Recall cards instead of exposing raw page dumps as the lesson itself.
"""

from __future__ import annotations

import json
import re
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
CORPUS_PATH = ROOT / "content" / "pdf-corpus.json"
OUT_PATH = ROOT / "content" / "curated-study-bank.json"

QUESTION_RE = re.compile(r"(?m)^[ \t]*(\d+)[\.)][ \t]+")
OPTION_RE = re.compile(r"(?m)^[ \t]*([กขคง])[\.)][ \t]*")
ANSWER_RE = re.compile(r"(?:ตอบ|เฉลย|คำตอบ)\s*[:.]?\s*([กขคง])(?=[\s.]|$)")
KEY_LINE_RE = re.compile(r"(?<!\d)(\d{1,3})\s*[\.)]?\s*([กขคง])(?=\s|$)")

PUA_MAP = {
    "\uf70a": "่",
    "\uf70b": "้",
    "\uf70e": "์",
    "\uf712": "็",
    "\uf702": "ี",
    "\uf706": "้",
    "\uf710": "ั",
    "\uf713": "่",
    "\uf705": "่",
    "\uf703": "ึ",
    "\uf704": "ื",
    "\uf714": "้",
    "\uf0b7": "•",
    "\uf0a7": "•",
    "\uf0a8": "◆",
    "\uf0aa": "▪",
    "\uf02e": "•",
    "\uf03f": "-",
    "\uf05b": "[",
}

TOPICS = [
    {
        "slug": "public-service",
        "title": "งานราชการและหน่วยงาน",
        "summary": "พื้นฐานหน่วยงาน ภารกิจ ระเบียบพนักงานราชการ และสิทธิประโยชน์ที่ควรรู้",
        "accent": "blue",
        "keywords": ["กระทรวงสาธารณสุข", "พนักงานราชการ", "สิทธิประโยชน์", "ระเบียบสำนักนายกรัฐมนตรี", "อำนาจหน้าที่ของหน่วยงาน"],
        "tip": "จำเป็นภาพรวม: หน่วยงานมีภารกิจอะไร ใครมีอำนาจ และประชาชน/เจ้าหน้าที่มีสิทธิหน้าที่อะไร",
    },
    {
        "slug": "digital-law",
        "title": "กฎหมายดิจิทัลและการปฏิบัติราชการ",
        "summary": "แยก พ.ร.บ. คอมพิวเตอร์ ธุรกรรมอิเล็กทรอนิกส์ ราชการดิจิทัล และการปฏิบัติราชการทางอิเล็กทรอนิกส์",
        "accent": "violet",
        "keywords": ["ธุรกรรมทางอิเล็กทรอนิกส์", "กระทำความผิดเกี่ยวกับคอมพิวเตอร์", "การบริหารงานและการให้บริการภาครัฐผ่านระบบดิจิทัล", "การปฏิบัติราชการทางอิเล็กทรอนิกส์", "ราชกิจจานุเบกษา"],
        "tip": "จำกฎหมายด้วย 3 ช่อง: ใคร/การกระทำอะไร, หน่วยงานมีอำนาจอะไร, และผลหรือข้อยกเว้นคืออะไร",
    },
    {
        "slug": "privacy-cybersecurity",
        "title": "PDPA และความมั่นคงปลอดภัยไซเบอร์",
        "summary": "เข้าใจข้อมูลส่วนบุคคล การรักษาความปลอดภัยไซเบอร์ การควบคุมความเสี่ยง และการตอบสนองเหตุการณ์",
        "accent": "rose",
        "keywords": ["คุ้มครองข้อมูลส่วนบุคคล", "ข้อมูลส่วนบุคคล", "ความมั่นคงปลอดภัยไซเบอร์", "Cyber Security", "ไซเบอร์", "ความปลอดภัยระบบสารสนเทศ", "เข้ารหัส", "ไฟร์วอลล์"],
        "tip": "จำเป็นวงจร: ป้องกัน - ตรวจพบ - รับมือ - ฟื้นฟู และอย่าลืมสิทธิของเจ้าของข้อมูล",
    },
    {
        "slug": "network",
        "title": "ระบบเครือข่ายและการสื่อสาร",
        "summary": "สื่อกลาง อุปกรณ์ โปรโตคอล โครงสร้างเครือข่าย และแนวทางแก้ปัญหาเครือข่าย",
        "accent": "cyan",
        "keywords": ["เครือข่าย", "Network", "TCP/IP", "Router", "Switch", "Access Point", "OSI", "สื่อกลาง", "Wi-Fi", "อินเทอร์เน็ต", "Ethernet"],
        "tip": "จำอุปกรณ์ตามหน้าที่: Hub กระจาย, Switch เลือกพอร์ต, Router หาเส้นทาง, Access Point เชื่อมไร้สาย",
    },
    {
        "slug": "hardware-os",
        "title": "ฮาร์ดแวร์และระบบปฏิบัติการ",
        "summary": "ส่วนประกอบคอมพิวเตอร์ หน่วยประมวลผล หน่วยความจำ อุปกรณ์ และหน้าที่ของระบบปฏิบัติการ",
        "accent": "amber",
        "keywords": ["ฮาร์ดแวร์", "Hardware", "ระบบปฏิบัติการ", "Operating System", "CPU", "หน่วยความจำ", "RAM", "ROM", "อุปกรณ์คอมพิวเตอร์"],
        "tip": "จำเป็นชั้น: รับข้อมูล - ประมวลผล - จัดเก็บ - แสดงผล และ OS เป็นตัวกลางจัดการทรัพยากร",
    },
    {
        "slug": "programming-web",
        "title": "การพัฒนาโปรแกรมและเว็บ",
        "summary": "กระบวนการพัฒนาระบบ อัลกอริทึม โปรแกรม เว็บแอป และการแก้ปัญหาโปรแกรม",
        "accent": "emerald",
        "keywords": ["พัฒนาโปรแกรม", "Programming", "อัลกอริทึม", "Pseudo Code", "Web Application", "HTML", "CSS", "PHP", "JavaScript", "โปรแกรมสำเร็จรูป", "การแก้ไขปัญหาระบบ"],
        "tip": "เริ่มจากปัญหาและความต้องการ แล้วออกแบบขั้นตอน ทดสอบ แก้ไข และดูแลระบบต่อเนื่อง",
    },
    {
        "slug": "database",
        "title": "ฐานข้อมูลและ SQL",
        "summary": "ตาราง ความสัมพันธ์ คีย์ การจัดการข้อมูล SQL และแนวคิดฐานข้อมูลสำหรับงานระบบ",
        "accent": "indigo",
        "keywords": ["ฐานข้อมูล", "Database", "SQL", "Primary Key", "Foreign Key", "ตาราง", "PHP", "การจัดการฐานข้อมูล"],
        "tip": "จำฐานข้อมูลด้วย 3 คำถาม: เก็บอะไร, เชื่อมกันอย่างไร, และค้น/เพิ่ม/แก้/ลบด้วยคำสั่งใด",
    },
    {
        "slug": "cloud-data-ai",
        "title": "Cloud, Big Data และ AI",
        "summary": "รูปแบบบริการคลาวด์ ลักษณะ Big Data และการใช้ AI อย่างมีคนตรวจสอบ",
        "accent": "sky",
        "keywords": ["Cloud Computing", "คลาวด์", "IaaS", "PaaS", "SaaS", "BIG DATA", "Big Data", "ปัญญาประดิษฐ์", "AI", "ดิจิทัล"],
        "tip": "จำ Cloud จากการควบคุมมากไปน้อย IaaS - PaaS - SaaS และตรวจความถูกต้องของผลลัพธ์ AI ทุกครั้ง",
    },
    {
        "slug": "interview",
        "title": "การสอบสัมภาษณ์และการทำงาน",
        "summary": "การเตรียมตัวสัมภาษณ์งานราชการ บุคลิกภาพ เอกสาร และการสื่อสารอย่างมืออาชีพ",
        "accent": "orange",
        "keywords": ["สัมภาษณ์งานราชการ", "การสอบสัมภาษณ์", "บุคลิกภาพ", "เอกสารประกอบการสัมภาษณ์"],
        "tip": "ตอบให้สั้น ชัด และยกตัวอย่างจริง โดยเชื่อมคำตอบเข้ากับภารกิจของตำแหน่ง",
    },
    {
        "slug": "general-computer",
        "title": "ความรู้คอมพิวเตอร์ทั่วไป",
        "summary": "หัวข้อพื้นฐานที่เชื่อมหลายหมวดและควรทบทวนก่อนลงรายละเอียด",
        "accent": "slate",
        "keywords": [],
        "tip": "แยกคำถามให้ออกว่าเป็นเรื่องอุปกรณ์ ซอฟต์แวร์ ข้อมูล เครือข่าย หรือกระบวนการทำงาน",
    },
]

NOISE_PATTERNS = [
    "ห้ามตัดต่อหรือคัดลอก",
    "ห้าม!! คัดลอก",
    "สงวนลิขสิทธิ์",
    "สนใจติดต่อ",
    "แนวข้อสอบราชการไทย",
    "www.",
    "ราคา ",
    "จัดพิมพ์และจําหน่าย",
    "คู่มือสอบ",
    "the best center",
    "สถาบัน the best",
]


def normalize_inline(value: str) -> str:
    value = "".join(PUA_MAP.get(char, char) for char in value)
    value = value.replace("\ufeff", "").replace("\u200b", "")
    value = re.sub(r"([ก-ฮ])\s+([ะาำิีึืุูั็])", r"\1\2", value)
    value = re.sub(r"([็่้๊๋])\s+(?=[ก-ฮ])", r"\1", value)
    for before, after in {
        "ส า": "สา", "ส ำ": "สำ", "ค า": "คำ", "ค ำ": "คำ", "เป็ น": "เป็น",
        "เนื้ อ": "เนื้อ", "ฝ่ าย": "ฝ่าย", "จ ำ": "จำ", "ท ำ": "ทำ", "ก ำ": "กำ",
        "ต ำ": "ตำ", "น ำ": "นำ", "ด ำ": "ดำ", "อ ำ": "อำ", "ส ำคัญ": "สำคัญ",
    }.items():
        value = value.replace(before, after)
    for before, after in {"กำร": "การ", "สำร": "สาร", "สำนกั": "สำนักงาน", "สานักงาน": "สำนักงาน", "อำนำจ": "อำนาจ", "ควำม": "ความ", "เรำ": "เรา", "อย่ำง": "อย่าง", "กล่ำว": "กล่าว", "ทำกำร": "ทำการ"}.items():
        value = value.replace(before, after)
    value = re.sub(r"[ \t]+", " ", value)
    value = re.sub(r"\s+([,.;:!?])", r"\1", value)
    return value.strip(" -|\t\r\n")


def normalize_text(value: str) -> str:
    return "\n".join(normalize_inline(line) for line in value.replace("\r", "").split("\n") if normalize_inline(line))


def is_noise_line(line: str) -> bool:
    lowered = line.lower()
    if not line or line.isdigit():
        return True
    if any(pattern.lower() in lowered for pattern in NOISE_PATTERNS):
        return True
    if line in {"สารบัญ", "คำนำ", "สารบัญ (ต่อ)", "แนวข้อสอบ"}:
        return True
    return False


def clean_page_text(value: str) -> str:
    lines = [line for line in normalize_text(value).splitlines() if not is_noise_line(line)]
    return "\n".join(lines)


def compact(value: str, limit: int = 700) -> str:
    value = normalize_inline(value)
    value = re.sub(r"\s+", " ", value)
    return value[:limit].rstrip() + ("..." if len(value) > limit else "")


def topic_for(text: str, source_id: str) -> dict:
    scoring_text = re.sub(r"คู่มือสอบ[^\n]*|สำนักงานศาลยุติธรรม|นักวิชาการคอมพิวเตอร์ปฏิบัติการ|สำนักงานสาธารณสุขจังหวัดสระบุรี", " ", text, flags=re.IGNORECASE)
    lowered = scoring_text.lower()
    if source_id == "industry":
        return next(topic for topic in TOPICS if topic["slug"] == "network")
    scores = []
    for index, topic in enumerate(TOPICS[:-1]):
        score = sum(lowered.count(keyword.lower()) for keyword in topic["keywords"])
        scores.append((score, -index, topic))
    score, _, topic = max(scores, key=lambda item: (item[0], item[1]))
    return topic if score else TOPICS[-1]


def parse_questions(source: dict) -> list[dict]:
    questions = []
    for page in source["pages"]:
        text = normalize_text(page["text"])
        starts = list(QUESTION_RE.finditer(text))
        for index, match in enumerate(starts):
            end = starts[index + 1].start() if index + 1 < len(starts) else len(text)
            block = text[match.start():end]
            options = list(OPTION_RE.finditer(block))
            if len(options) < 4 or [option.group(1) for option in options[:4]] != list("กขคง"):
                continue
            prompt = compact(block[match.end() - match.start():options[0].start()], 420)
            if len(prompt) < 10 or any(marker.lower() in prompt.lower() for marker in NOISE_PATTERNS):
                continue
            option_values = []
            for option_index, option in enumerate(options[:4]):
                option_end = options[option_index + 1].start() if option_index + 1 < len(options) else len(block)
                value = compact(block[option.end():option_end], 260)
                value = re.split(r"(?:ตอบ|เฉลย|คำตอบ)\s*[:.]?\s*[กขคง](?=[\s.]|$)", value, maxsplit=1)[0].strip()
                if not value:
                    break
                option_values.append(value)
            if len(option_values) != 4:
                continue
            answer = ANSWER_RE.search(block)
            answer_index = "กขคง".find(answer.group(1)) if answer else None
            explanation = compact(block[answer.end():], 600) if answer else "ยังไม่พบเฉลยในบล็อกเดียวกัน จึงเก็บเป็นข้อฝึกและไม่เดาคำตอบ"
            questions.append({
                "id": f"curated-q-{source['id']}-{page['page']}-{match.group(1)}-{index}",
                "prompt": prompt,
                "options": option_values,
                "answerIndex": answer_index if answer_index is not None and answer_index >= 0 else None,
                "explanation": explanation,
                "source": f"{source['title']} หน้า {page['page']}",
                "sourceId": source["id"],
                "page": page["page"],
                "topic": topic_for(prompt, source["id"])["slug"],
                "origin": "pdf-mcq",
            })
    return questions


def parse_answer_keys(page_text: str) -> list[tuple[int, int]]:
    text = normalize_text(page_text)
    if not re.search(r"(?m)^\s*เฉลย", text):
        return []
    answers = []
    seen = set()
    for line in text.splitlines():
        for match in KEY_LINE_RE.finditer(line):
            number = int(match.group(1))
            if number not in seen and 1 <= number <= 200:
                answers.append((number, "กขคง".find(match.group(2))))
                seen.add(number)
    return answers


def link_answer_keys(source: dict, questions: list[dict]) -> None:
    previous_key_page = 0
    for page in source["pages"]:
        keys = parse_answer_keys(page["text"])
        if not keys:
            continue
        candidates = [q for q in questions if previous_key_page < q["page"] < page["page"] and q["answerIndex"] is None]
        if len(candidates) >= len(keys):
            for question, (_, answer_index) in zip(candidates[-len(keys):], keys):
                question["answerIndex"] = answer_index
                question["explanation"] = f"เฉลยจากหน้าคำตอบของเอกสาร หน้า {page['page']}"
                question["origin"] = "pdf-mcq-answer-key"
        previous_key_page = page["page"]


def page_content_points(text: str, topic: dict) -> list[str]:
    lines = []
    for line in clean_page_text(text).splitlines():
        if len(line) < 12 or re.match(r"^(?:[กขคง][\.)]|\d+[\.)]|ตอบ|เฉลย)", line):
            continue
        if re.match(r"^\d+\s+", line) and len(line) < 120:
            continue
        if line.startswith(("➢", "", "◆", "▪")):
            line = line.lstrip("➢◆▪ ")
        lines.append(line)
    if not lines:
        return [f"หน้านี้อยู่ในหมวด{topic['title']} และไม่พบข้อความสาระที่ดึงได้จากหน้าเอกสาร"]
    candidates = []
    for line in lines:
        candidates.extend(re.split(r"(?<=[.!?ฯ])\s+|(?<=[;:])\s+", line))
    points = []
    for candidate in candidates:
        point = compact(candidate, 190)
        if len(point) >= 12 and point not in points:
            points.append(point)
    if not points:
        points = [compact(lines[0], 190)]
    return points


def page_content_blocks(text: str, topic: dict) -> list[str]:
    points = page_content_points(text, topic)
    return ["\n".join(f"{index + 1}. {point}" for index, point in enumerate(points[start:start + 3])) for start in range(0, len(points), 3)]


def is_curatable_page(source: dict, page: dict, text: str) -> bool:
    if len(text) < 80:
        return False
    raw = normalize_text(page["text"]).lower()
    if source["id"] == "court" and page["page"] <= 7:
        return False
    if source["id"] == "health" and page["page"] <= 2:
        return False
    if "สารบัญ" in raw or "คำนำ" in raw or "รวบรวมและเรียบเรียง" in raw:
        return False
    if "ห้ามตัดต่อหรือคัดลอก" in raw or ("ราคา" in raw and "สงวนลิขสิทธิ์" in raw):
        return False
    return True


def difficulty(value: str) -> str:
    length = len(value)
    return "easy" if length < 120 else "medium" if length < 300 else "hard"


def make_page_cards(source: dict, page: dict, topic: dict, blocks: list[str]) -> list[dict]:
    text = clean_page_text(page["text"])
    if len(text) < 80:
        return []
    return [{
        "id": f"curated-card-{source['id']}-{page['page']}-{block_index + 1}",
        "prompt": "ลองนึกเอง: เนื้อหานี้มีใจความสำคัญอะไรบ้าง",
        "answer": block,
        "explanation": f"จัดเข้าหมวด {topic['title']} แล้ว แบ่งเป็นประเด็นสั้น ๆ เพื่อจำง่าย วิธีจำ: {topic['tip']}",
        "source": f"{source['title']} หน้า {page['page']}",
        "difficulty": difficulty(block),
        "sourceId": source["id"],
        "page": page["page"],
        "topic": topic["slug"],
        "origin": "curated-page-note",
    } for block_index, block in enumerate(blocks)]


def make_question_card(question: dict, topic: dict) -> dict | None:
    if question["answerIndex"] is None:
        return None
    answer = question["options"][question["answerIndex"]]
    explanation = question["explanation"] if not question["explanation"].startswith("ยังไม่พบ") else ""
    return {
        "id": f"recall-{question['id']}",
        "prompt": f"ลองตอบจากความจำก่อนดูตัวเลือก: {question['prompt']}",
        "answer": answer,
        "explanation": compact(f"เฉลย: {answer}. {explanation} วิธีจำ: {topic['tip']}", 720),
        "source": question["source"],
        "difficulty": difficulty(question["prompt"]),
        "sourceId": question["sourceId"],
        "page": question["page"],
        "topic": topic["slug"],
        "origin": "curated-question-recall",
    }


def make_content_question(record: dict, records: list[dict], index: int) -> dict:
    answer = compact(record["summary"], 240)
    candidates = [item for item in records if item["summary"] != record["summary"] and item["topic"]["slug"] != record["topic"]["slug"]]
    candidates += [item for item in records if item["summary"] != record["summary"]]
    distractors = []
    for offset in range(len(candidates)):
        candidate = compact(candidates[(index * 3 + offset) % len(candidates)]["summary"], 240)
        if candidate and candidate != answer and candidate not in distractors:
            distractors.append(candidate)
        if len(distractors) == 3:
            break
    options = [answer, *distractors]
    while len(options) < 4:
        options.append("ไม่พบใจความนี้ในหน้าที่กำหนด")
    answer_index = index % 4
    options[0], options[answer_index] = options[answer_index], options[0]
    return {
        "id": f"content-q-{record['sourceId']}-{record['page']}-{record['blockIndex']}",
        "prompt": "ข้อใดสรุปสาระสำคัญของเนื้อหาหน้านี้ได้ถูกต้องที่สุด",
        "options": options,
        "answerIndex": answer_index,
        "explanation": f"คำตอบคือสรุปเนื้อหาที่กลั่นจากหน้านี้: {answer}",
        "source": record["source"],
        "sourceId": record["sourceId"],
        "page": record["page"],
        "topic": record["topic"]["slug"],
        "origin": "curated-content-comprehension",
    }


def dedupe_questions(questions: list[dict]) -> list[dict]:
    by_key = {}
    for question in questions:
        key = re.sub(r"\W+", "", question["prompt"].lower()) + "|" + "|".join(re.sub(r"\W+", "", option.lower()) for option in question["options"])
        existing = by_key.get(key)
        if existing is None or (existing["answerIndex"] is None and question["answerIndex"] is not None):
            by_key[key] = question
    return list(by_key.values())


def main() -> None:
    corpus = json.loads(CORPUS_PATH.read_text(encoding="utf-8"))
    all_questions = []
    cards = []
    topic_notes = defaultdict(list)
    page_records = []
    usable_pages = 0
    for source in corpus["sources"]:
        source_questions = parse_questions(source)
        link_answer_keys(source, source_questions)
        all_questions.extend(source_questions)
        for page in source["pages"]:
            page_text = clean_page_text(page["text"])
            topic = topic_for(page_text, source["id"])
            page_questions = [q for q in source_questions if q["page"] == page["page"]]
            if is_curatable_page(source, page, page_text):
                usable_pages += 1
                blocks = page_content_blocks(page["text"], topic)
                cards.extend(make_page_cards(source, page, topic, blocks))
                for block_index, block in enumerate(blocks):
                    page_records.append({
                        "summary": block,
                        "topic": topic,
                        "source": f"{source['title']} หน้า {page['page']}",
                        "sourceId": source["id"],
                        "page": page["page"],
                        "blockIndex": block_index + 1,
                    })
                    topic_notes[topic["slug"]].append({
                        "id": f"note-{source['id']}-{page['page']}-{block_index + 1}",
                        "title": f"เนื้อหาสำคัญ ตอนที่ {block_index + 1}",
                        "content": block,
                        "source": f"{source['title']} หน้า {page['page']}",
                        "sourceId": source["id"],
                        "page": page["page"],
                    })
            for question in page_questions:
                recall_card = make_question_card(question, topic)
                if recall_card:
                    cards.append(recall_card)

    content_questions = [make_content_question(record, page_records, index) for index, record in enumerate(page_records)]
    all_questions = dedupe_questions([*all_questions, *content_questions])
    cards = list({card["id"]: card for card in cards}.values())
    topic_map = {topic["slug"]: topic for topic in TOPICS}
    topic_cards = defaultdict(list)
    topic_questions = defaultdict(list)
    for card in cards:
        topic_cards[card["topic"]].append({key: value for key, value in card.items() if key != "topic"})
    for question in all_questions:
        topic_questions[question["topic"]].append({key: value for key, value in question.items() if key != "topic"})
    all_notes = [note for topic in TOPICS for note in topic_notes[topic["slug"]]]

    lessons = [
        {
            "slug": "curated-recall-all",
            "title": "รวม Active Recall จากทุกหมวด",
            "summary": "รวมการ์ดจากทุกหมวดของ PDF ทั้ง 3 ไฟล์ สำหรับทบทวนภาพรวม ไม่แสดงข้อความดิบเป็นบทเรียน",
            "accent": "blue",
            "cards": cards,
            "questions": [],
            "notes": all_notes,
        },
        {
            "slug": "curated-exam-bank",
            "title": "รวมข้อสอบจากทุกหมวด",
            "summary": f"ข้อสอบจากทุกหมวดที่คัดบล็อกสมบูรณ์และตัดรายการซ้ำแล้ว {len(all_questions)} ข้อ; ข้อที่ไม่พบเฉลยจะไม่เดาคำตอบ",
            "accent": "violet",
            "cards": [],
            "questions": all_questions,
            "notes": all_notes,
        },
    ]
    for topic in TOPICS:
        if not topic_cards[topic["slug"]] and not topic_questions[topic["slug"]]:
            continue
        lessons.append({
            "slug": f"curated-{topic['slug']}",
            "title": topic["title"],
            "summary": topic["summary"],
            "accent": topic["accent"],
            "cards": topic_cards[topic["slug"]],
            "questions": topic_questions[topic["slug"]],
            "notes": topic_notes[topic["slug"]],
        })

    output = {
        "version": 2,
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "curation": {
            "method": "boilerplate removal, OCR repair, topic classification, MCQ deduplication, and answer-key linking",
            "sourceCorpus": "content/pdf-corpus.json",
            "aiReady": True,
        },
        "stats": {
            "totalPages": corpus["totalPages"],
            "usablePages": usable_pages,
            "filteredPages": corpus["totalPages"] - usable_pages,
            "recallCards": len(cards),
            "examQuestions": len(all_questions),
            "scoredQuestions": sum(question["answerIndex"] is not None for question in all_questions),
            "contentNotes": len(all_notes),
            "contentQuestions": len(content_questions),
            "sourceQuestions": len(all_questions) - len(content_questions),
            "topics": len(lessons) - 2,
        },
        "lessons": lessons,
    }
    OUT_PATH.write_text(json.dumps(output, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(json.dumps(output["stats"], ensure_ascii=False))
    print(f"เขียนคลังเนื้อหากลั่นแล้ว: {OUT_PATH}")


if __name__ == "__main__":
    main()
