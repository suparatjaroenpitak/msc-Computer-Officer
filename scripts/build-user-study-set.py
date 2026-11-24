"""Build the study app's content from the user-provided recall and quiz set."""

from __future__ import annotations

import json
import re
from datetime import datetime, timezone
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SOURCE_PATH = ROOT / "content" / "user-study-source.txt"
ADDITIONAL_SOURCE_DIR = ROOT / "content" / "additional-sources"
OUTPUT_PATH = ROOT / "content" / "user-study-bank.json"
CATALOG_PATH = ROOT / "content" / "user-study-catalog.json"
LESSON_DIR = ROOT / "content" / "user-lessons"


TOPICS = [
    ("fundamentals", "พื้นฐานคอมพิวเตอร์", "องค์ประกอบคอมพิวเตอร์ ข้อมูล เลขฐาน และซอฟต์แวร์", "blue", 1, 30),
    ("cpu", "CPU และสถาปัตยกรรมคอมพิวเตอร์", "หน่วยประมวลผล รีจิสเตอร์ วงจรคำสั่ง และบัส", "violet", 31, 60),
    ("hardware", "ฮาร์ดแวร์และอุปกรณ์", "เมนบอร์ด อุปกรณ์จัดเก็บข้อมูล เฟิร์มแวร์ และการจ่ายไฟ", "amber", 61, 85),
    ("operating-system", "ระบบปฏิบัติการ", "Process การจัดสรรทรัพยากร ระบบไฟล์ และคำสั่งพื้นฐาน", "indigo", 86, 110),
    ("network", "ระบบเครือข่าย", "โครงสร้างเครือข่าย อุปกรณ์ IP โปรโตคอล และ OSI", "cyan", 111, 170),
    ("database", "ฐานข้อมูลและ SQL", "โมเดลข้อมูล คีย์ Normalization และคำสั่ง SQL", "emerald", 171, 210),
    ("programming-web", "การพัฒนาโปรแกรมและเว็บ", "SDLC อัลกอริทึม OOP เว็บ และ HTTP", "green", 211, 250),
    ("cybersecurity", "ความมั่นคงปลอดภัยไซเบอร์", "CIA การเข้ารหัส ภัยคุกคาม และการควบคุมความปลอดภัย", "rose", 251, 290),
    ("cloud-data-ai", "Cloud, Big Data และ AI", "บริการ Cloud การวิเคราะห์ข้อมูล และแนวคิด AI", "sky", 291, 330),
    ("digital-law", "กฎหมายดิจิทัลและงานราชการ", "กฎหมายคอมพิวเตอร์ PDPA ไซเบอร์ ธุรกรรมดิจิทัล และงานราชการ", "purple", 331, 380),
    ("public-health", "ความรู้หน่วยงานสาธารณสุข", "ภารกิจและข้อมูลพื้นฐานที่เกี่ยวข้องกับสาธารณสุข", "orange", 381, 390),
    ("it-operations", "การปฏิบัติงานด้านไอที", "DevOps การทดสอบ ระบบยืนยันตัวตน ความต่อเนื่อง และ AI ในงานจริง", "slate", 391, 420),
    ("advanced-cpu-os", "CPU และระบบปฏิบัติการขั้นต่อยอด", "เลขฐาน ตรรกศาสตร์ หน่วยความจำ Process และการทำงานพร้อมกัน", "blue", 421, 480),
    ("advanced-network", "เครือข่ายขั้นต่อยอด", "การสื่อสาร IP Subnet VLAN Routing และคุณภาพบริการ", "cyan", 481, 520),
    ("advanced-database", "ฐานข้อมูลขั้นต่อยอด", "ความสัมพันธ์ Constraint Transaction Query และการกระจายข้อมูล", "emerald", 521, 560),
    ("python", "การเขียนโปรแกรมภาษา Python", "พื้นฐานชนิดข้อมูล คำสั่ง ฟังก์ชัน OOP และจุดหลอกในข้อสอบ Python", "amber", 0, -1),
]


def topic_for(number: int) -> dict:
    for slug, title, summary, accent, start, end in TOPICS:
        if start <= number <= end:
            return {"slug": slug, "title": title, "summary": summary, "accent": accent}
    raise ValueError(f"ไม่พบหมวดสำหรับข้อ {number}")


def quiz_topic_for(number: int) -> dict:
    if number <= 15:
        return topic_for(61)
    if number <= 30:
        return topic_for(111)
    if number <= 45:
        return topic_for(171)
    if number <= 60:
        return topic_for(251)
    if number <= 70:
        return topic_for(291)
    if number <= 85:
        return topic_for(331)
    return topic_for(391)


def difficulty(text: str) -> str:
    return "easy" if len(text) < 70 else "medium" if len(text) < 150 else "hard"


def normalize_key(value: str) -> str:
    return re.sub(r"\W+", "", value.casefold())


def topic_from_module(module_title: str) -> dict:
    title = module_title.casefold()
    if "python" in title:
        return {"slug": "python", "title": "การเขียนโปรแกรมภาษา Python", "summary": "พื้นฐานชนิดข้อมูล คำสั่ง ฟังก์ชัน OOP และจุดหลอกในข้อสอบ Python", "accent": "amber"}
    if any(word in title for word in ["php", "web", "programming", "data structure"]):
        return topic_for(211)
    if any(word in title for word in ["sql", "database"]):
        return topic_for(521)
    if any(word in title for word in ["cloud", "big data", "data analytics", "artificial intelligence"]):
        return topic_for(291)
    if any(word in title for word in ["cybersecurity", "ความมั่นคงปลอดภัย"]):
        return topic_for(251)
    if any(word in title for word in ["network", "เครือข่าย"]):
        return topic_for(481)
    if any(word in title for word in ["operating system", "computer architecture", "digital logic"]):
        return topic_for(421)
    if any(word in title for word in ["กฎหมาย", "ศาลยุติธรรม", "pdpa", "ธุรกรรม", "ราชการ"]):
        return topic_for(331)
    if "support" in title or "troubleshooting" in title:
        return topic_for(391)
    return topic_for(391)


def source_label(path: Path) -> str:
    labels = {
        "set-02": "ชุดที่ 2",
        "set-03": "ชุดที่ 3",
        "set-04": "ชุดที่ 4",
        "set-05": "ชุดที่ 5",
    }
    return labels.get(path.stem, path.stem)


def make_extra_card(prompt: str, answer: str, topic: dict, source: str, card_id: str, explanation: str = "") -> dict:
    return {
        "id": card_id,
        "prompt": prompt.strip(),
        "answer": answer.strip(),
        "explanation": explanation or "คำตอบจากเนื้อหาชุดที่แนบมา ลองตอบจากความจำก่อนเปิดเฉลย",
        "source": source,
        "difficulty": difficulty(prompt + answer),
        "sourceId": "user-study-attachments",
        "topic": topic["slug"],
    }


def parse_additional_source(path: Path) -> tuple[list[dict], list[dict]]:
    lines = path.read_text(encoding="utf-8").splitlines()
    label = source_label(path)
    recalls: list[dict] = []
    quizzes: list[dict] = []
    mode = ""
    section = ""
    module_title = label
    pending_recall: dict | None = None
    current_question: dict | None = None

    def current_topic() -> dict:
        if "python" in section:
            return {"slug": "python", "title": "การเขียนโปรแกรมภาษา Python", "summary": "พื้นฐานชนิดข้อมูล คำสั่ง ฟังก์ชัน OOP และจุดหลอกในข้อสอบ Python", "accent": "amber"}
        return topic_from_module(module_title)

    def flush_question() -> None:
        nonlocal current_question
        if current_question and len(current_question["options"]) == 4 and current_question.get("answer") in "ABCD":
            current_question["topic"] = current_topic()
            quizzes.append(current_question)
        current_question = None

    def flush_recall() -> None:
        nonlocal pending_recall
        if pending_recall and pending_recall.get("answer"):
            recalls.append(pending_recall)
        pending_recall = None

    for raw_line in lines:
        line = raw_line.strip()
        if not line or line.startswith("="):
            continue
        if line.startswith("MODULE"):
            flush_question()
            flush_recall()
            module_title = line.split(":", 1)[1].strip() if ":" in line else line
            continue
        if line.startswith("PART 1"):
            flush_question()
            flush_recall()
            mode, section = "recall", ""
            continue
        if line.startswith("PART 2"):
            flush_recall()
            mode, section = "quiz", ""
            continue
        if line.startswith("PART 3") or line.startswith("PART 4"):
            flush_question()
            flush_recall()
            mode, section = "extra", line.casefold()
            continue
        if line.startswith(("END OF SET", "สรุปคลังข้อสอบ", "รวมชุดที่", "ยอดสะสม", "Active Recall:", "Multiple Choice:", "รวมทั้งหมด:")):
            continue

        if mode == "recall":
            answer_match = re.match(r"^ตอบ\s*:\s*(.+)$", line)
            if answer_match and pending_recall:
                pending_recall["answer"] = answer_match.group(1).strip()
                flush_recall()
                continue
            question_match = re.match(r"^(\d+)\.\s+(.+)$", line)
            if question_match:
                flush_recall()
                pending_recall = {
                    "number": int(question_match.group(1)),
                    "prompt": question_match.group(2).strip(),
                    "answer": "",
                    "topic": current_topic(),
                    "source": f"{label} · {module_title}",
                    "sourceId": f"user-{path.stem}",
                }
                continue

        if mode == "quiz":
            question_match = re.match(r"^ข้อ\s*(\d+)\.\s*(.+)$", line)
            if question_match:
                flush_question()
                current_question = {
                    "number": int(question_match.group(1)),
                    "prompt": question_match.group(2).strip(),
                    "options": [],
                    "answer": "",
                    "explanation": "",
                    "source": f"{label} · {module_title}",
                    "sourceId": f"user-{path.stem}",
                }
                continue
            option_match = re.match(r"^([A-D])\.\s*(.+)$", line)
            if option_match and current_question:
                current_question["options"].append(option_match.group(2).strip())
                continue
            answer_match = re.match(r"^เฉลย\s*:\s*([A-D])(?:\.\s*(.*))?$", line)
            if answer_match and current_question:
                current_question["answer"] = answer_match.group(1)
                continue
            reason_match = re.match(r"^เหตุผล\s*:\s*(.+)$", line)
            if reason_match and current_question:
                current_question["explanation"] = reason_match.group(1).strip()
                continue

        if mode == "extra":
            if "quick memory" in section or "ศัพท์" in section or "รายมาตรา" in section or "เทคนิคจำ" in line.casefold():
                pair_match = re.match(r"^(?:\d+\.\s*)?(.+?)\s*=\s*(.+)$", line)
                article_match = re.match(r"^มาตรา\s+([0-9]+)\s*=\s*(.+)$", line)
                if article_match:
                    article = article_match.group(1)
                    answer = article_match.group(2)
                    topic = current_topic()
                    recalls.append(make_extra_card(f"มาตรา {article} เกี่ยวข้องกับอะไร?", answer, topic, f"{label} · {module_title}", f"user-extra-{path.stem}-{len(recalls) + 1}"))
                    continue
                if pair_match and not pair_match.group(1).startswith(("user", "person")):
                    left, right = pair_match.groups()
                    topic = current_topic()
                    if "ศัพท์" in section:
                        prompt = f"คำศัพท์ “{left.strip()}” หมายถึงอะไร?"
                    elif "python" in section or topic["slug"] == "python":
                        prompt = f"Python: “{left.strip()}” หมายถึงอะไร?"
                    else:
                        prompt = f"“{left.strip()}” หมายถึงอะไร?"
                    recalls.append(make_extra_card(prompt, right, topic, f"{label} · {module_title}", f"user-extra-{path.stem}-{len(recalls) + 1}"))
                    continue
            if "exam traps" in section or "จุดหลอก" in section:
                trap_match = re.match(r"^\d+\.\s+(.+)$", line)
                if trap_match:
                    topic = current_topic()
                    recalls.append(make_extra_card("จุดหลอกที่ควรระวังในหัวข้อนี้คืออะไร?", trap_match.group(1), topic, f"{label} · {module_title}", f"user-extra-{path.stem}-{len(recalls) + 1}"))
                    continue
            if "รายมาตรา" in section and re.match(r"^\d+\s+.+$", line):
                article, answer = line.split(None, 1)
                topic = current_topic()
                recalls.append(make_extra_card(f"เทคนิคจำมาตรา {article} คืออะไร?", answer, topic, f"{label} · {module_title}", f"user-extra-{path.stem}-{len(recalls) + 1}"))

    flush_question()
    flush_recall()
    return recalls, quizzes


def parse_source() -> tuple[list[dict], list[dict]]:
    mode = None
    recalls: list[dict] = []
    quizzes: list[dict] = []
    for line_number, raw_line in enumerate(SOURCE_PATH.read_text(encoding="utf-8").splitlines(), start=1):
        line = raw_line.strip()
        if not line or line.startswith("#"):
            continue
        if line == "[RECALL]":
            mode = "recall"
            continue
        if line == "[QUIZ]":
            mode = "quiz"
            continue
        if mode == "recall":
            parts = line.split("|||")
            if len(parts) != 3:
                raise ValueError(f"รูปแบบ Recall ไม่ถูกต้อง บรรทัด {line_number}")
            number, prompt, answer = parts
            recalls.append({"number": int(number), "prompt": prompt.strip(), "answer": answer.strip()})
        elif mode == "quiz":
            parts = line.split("|||")
            if len(parts) != 7:
                raise ValueError(f"รูปแบบข้อสอบไม่ถูกต้อง บรรทัด {line_number}")
            number, prompt, option_a, option_b, option_c, option_d, answer = parts
            quizzes.append({
                "number": int(number),
                "prompt": prompt.strip(),
                "options": [option_a.strip(), option_b.strip(), option_c.strip(), option_d.strip()],
                "answer": answer.strip().upper(),
            })
    if len(recalls) != 560:
        raise ValueError(f"ต้องมี Recall 560 ข้อ แต่พบ {len(recalls)} ข้อ")
    if len(quizzes) != 100:
        raise ValueError(f"ต้องมีข้อสอบ 100 ข้อ แต่พบ {len(quizzes)} ข้อ")
    if [item["number"] for item in recalls] != list(range(1, 561)):
        raise ValueError("เลขข้อ Recall ต้องเรียงครบ 001 ถึง 560")
    if [item["number"] for item in quizzes] != list(range(1, 101)):
        raise ValueError("เลขข้อสอบต้องเรียงครบ 1 ถึง 100")
    additional_recalls: list[dict] = []
    additional_quizzes: list[dict] = []
    for path in sorted(ADDITIONAL_SOURCE_DIR.glob("set-*.txt")):
        file_recalls, file_quizzes = parse_additional_source(path)
        additional_recalls.extend(file_recalls)
        additional_quizzes.extend(file_quizzes)

    unique_recalls: list[dict] = []
    seen_recalls: set[str] = set()
    for item in [*recalls, *additional_recalls]:
        key = f"{normalize_key(item['prompt'])}|{normalize_key(item['answer'])}"
        if key and key not in seen_recalls:
            seen_recalls.add(key)
            unique_recalls.append(item)

    unique_quizzes: list[dict] = []
    seen_quizzes: set[str] = set()
    for item in [*quizzes, *additional_quizzes]:
        key = "|".join([normalize_key(item["prompt"]), *(normalize_key(option) for option in item["options"]), item["answer"]])
        if key and key not in seen_quizzes:
            seen_quizzes.add(key)
            unique_quizzes.append(item)
    return unique_recalls, unique_quizzes


def build() -> None:
    recalls, quizzes = parse_source()
    cards_by_topic: dict[str, list[dict]] = {topic[0]: [] for topic in TOPICS}
    questions_by_topic: dict[str, list[dict]] = {topic[0]: [] for topic in TOPICS}

    for item_index, item in enumerate(recalls, start=1):
        topic = item.get("topic")
        if isinstance(topic, str):
            topic = next({"slug": slug, "title": title, "summary": summary, "accent": accent} for slug, title, summary, accent, _, _ in TOPICS if slug == topic)
        topic = topic or topic_for(item["number"])
        card_id = item.get("id") or f"user-recall-{item['number']:03d}"
        source = item.get("source") or f"ชุดข้อมูลใหม่ · Active Recall ข้อ {item['number']:03d}"
        cards_by_topic[topic["slug"]].append({
            "id": card_id if card_id.startswith("user-") else f"user-recall-{item_index:04d}",
            "prompt": item["prompt"],
            "answer": item["answer"],
            "explanation": item.get("explanation") or f"คำตอบจากชุดข้อมูลใหม่ ลองตอบจากความจำก่อนเปิดเฉลย",
            "source": source,
            "difficulty": difficulty(item["prompt"] + item["answer"]),
            "sourceId": item.get("sourceId", "user-study-set"),
        })

    for item_index, item in enumerate(quizzes, start=1):
        topic = item.get("topic")
        if isinstance(topic, str):
            topic = next({"slug": slug, "title": title, "summary": summary, "accent": accent} for slug, title, summary, accent, _, _ in TOPICS if slug == topic)
        topic = topic or quiz_topic_for(item["number"])
        answer_index = "ABCD".find(item["answer"])
        if answer_index < 0:
            raise ValueError(f"เฉลยข้อสอบไม่ใช่ A-D: ข้อ {item.get('number', item_index)}")
        question_id = item.get("id") or f"user-quiz-{item_index:04d}"
        questions_by_topic[topic["slug"]].append({
            "id": question_id if question_id.startswith("user-") else f"user-quiz-{item_index:04d}",
            "prompt": item["prompt"],
            "options": item["options"],
            "answerIndex": answer_index,
            "explanation": item.get("explanation") or f"เฉลย {item['answer']}. {item['options'][answer_index]}",
            "source": item.get("source") or f"ชุดข้อมูลใหม่ · บททดสอบข้อ {item_index:03d}",
            "sourceId": item.get("sourceId", "user-study-set"),
        })

    lessons: list[dict] = [
        {
            "slug": "user-recall-all",
            "title": "รวม Active Recall ชุดใหม่",
            "summary": f"การ์ดคำถาม–คำตอบ {len(recalls)} ใบจากชุดข้อมูลใหม่และไฟล์แนบ ตอบก่อนเปิดเฉลย",
            "accent": "blue",
            "cards": [card for topic in TOPICS for card in cards_by_topic[topic[0]]],
            "questions": [],
            "notes": [],
        },
        {
            "slug": "user-exam-bank",
            "title": "รวมบททดสอบชุดใหม่",
            "summary": f"ข้อสอบปรนัย 4 ตัวเลือก {len(quizzes)} ข้อ พร้อมเฉลยจากชุดข้อมูลใหม่และไฟล์แนบ",
            "accent": "violet",
            "cards": [],
            "questions": [question for topic in TOPICS for question in questions_by_topic[topic[0]]],
            "notes": [],
        },
    ]
    for slug, title, summary, accent, _, _ in TOPICS:
        lessons.append({
            "slug": f"user-{slug}",
            "title": title,
            "summary": summary,
            "accent": accent,
            "cards": cards_by_topic[slug],
            "questions": questions_by_topic[slug],
            "notes": [],
        })

    stats = {
        "recallCards": len(recalls),
        "examQuestions": len(quizzes),
        "scoredQuestions": len(quizzes),
        "topics": len(TOPICS),
        "source": ["content/user-study-source.txt", "content/additional-sources/set-02.txt", "content/additional-sources/set-03.txt", "content/additional-sources/set-04.txt", "content/additional-sources/set-05.txt"],
    }
    output = {
        "version": 1,
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "curation": {"method": "ผู้ใช้จัดทำคำถามและคำตอบ แล้วระบบแบ่งหมวดและสร้างการ์ด/ข้อสอบ", "source": stats["source"]},
        "stats": stats,
        "lessons": lessons,
    }
    OUTPUT_PATH.write_text(json.dumps(output, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    LESSON_DIR.mkdir(parents=True, exist_ok=True)
    for lesson in lessons:
        (LESSON_DIR / f"{lesson['slug']}.json").write_text(json.dumps(lesson, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    CATALOG_PATH.write_text(json.dumps({
        "version": output["version"],
        "generatedAt": output["generatedAt"],
        "stats": stats,
        "lessons": [{
            "slug": lesson["slug"],
            "title": lesson["title"],
            "summary": lesson["summary"],
            "accent": lesson["accent"],
            "cardCount": len(lesson["cards"]),
            "questionCount": len(lesson["questions"]),
            "noteCount": 0,
        } for lesson in lessons],
    }, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(json.dumps(stats, ensure_ascii=False))


if __name__ == "__main__":
    build()
