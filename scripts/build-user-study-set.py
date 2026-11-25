"""Build the study app's content from the user-provided recall and quiz set."""

from __future__ import annotations

import csv
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
    if any(word in title for word in ["คพร", "พนักงานราชการ", "บทเฉพาะกาล", "สิทธิประโยชน์"]):
        return topic_for(331)
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
        "set-06": "ชุดที่ 7.1",
        "set-07": "Computer Fundamentals 1500",
        "set-08": "Modern Information Technology 1500",
        "set-09": "Information Cyber Security 1500",
        "set-10": "System Development Database 1500",
        "set-11": "Computer Networking 1500",
        "set-12": "Troubleshooting IT 1500",
        "set-13": "Number Systems Logic 1500",
        "set-14": "Software Application Packages 1500",
        "set-15": "Operating System 1500",
        "set-16": "Hardware Computer Equipment 1500",
        "set-17": "Thai Laws 12000",
    }
    return labels.get(path.stem, path.stem)


def parse_legal_tsv_sources(recall_path: Path, quiz_path: Path) -> tuple[list[dict], list[dict]]:
    """Read the replacement legal bank supplied as two tab-separated files."""
    legal_topic = topic_for(331)

    with recall_path.open("r", encoding="utf-8-sig", newline="") as handle:
        recall_rows = list(csv.DictReader(handle, delimiter="\t"))
    if len(recall_rows) != 8000:
        raise ValueError(f"{recall_path.name} ต้องมี Recall 8000 ข้อ แต่พบ {len(recall_rows)} ข้อ")

    recalls: list[dict] = []
    for index, row in enumerate(recall_rows, start=1):
        prompt = (row.get("คำถาม") or "").strip()
        answer = (row.get("คำตอบ") or "").strip()
        if not prompt or not answer:
            raise ValueError(f"ข้อมูล Recall ไม่ครบใน {recall_path.name} แถว {index + 1}")
        module_id = (row.get("Module ID") or f"LEGAL-{index:04d}").strip()
        category = (row.get("หมวด") or "").strip()
        source = (row.get("แหล่งที่มา") or "สรุปสาระจาก PDF").strip()
        recalls.append({
            "number": index,
            "prompt": prompt,
            "answer": answer,
            "explanation": "คำตอบสรุปจากชุดกฎหมายใหม่ ลองตอบจากความจำก่อนเปิดเฉลย",
            "topic": legal_topic,
            "source": f"{source} · {category}" if category else source,
            "sourceId": f"part-06-legal-recall-{module_id}",
            "id": f"user-part06-legal-recall-{index:04d}",
        })

    with quiz_path.open("r", encoding="utf-8-sig", newline="") as handle:
        quiz_rows = list(csv.DictReader(handle, delimiter="\t"))
    if len(quiz_rows) != 8000:
        raise ValueError(f"{quiz_path.name} ต้องมีข้อสอบ 8000 ข้อ แต่พบ {len(quiz_rows)} ข้อ")

    quizzes: list[dict] = []
    for index, row in enumerate(quiz_rows, start=1):
        prompt = (row.get("คำถาม") or "").strip()
        options = [(row.get(letter) or "").strip() for letter in "ABCD"]
        answer = (row.get("เฉลย") or "").strip().upper()
        if not prompt or any(not option for option in options) or answer not in "ABCD":
            raise ValueError(f"ข้อมูลข้อสอบไม่ครบหรือเฉลยไม่ใช่ A-D ใน {quiz_path.name} แถว {index + 1}")
        module_id = (row.get("Module ID") or f"LEGAL-{index:04d}").strip()
        category = (row.get("หมวด") or "").strip()
        source = (row.get("แหล่งที่มา") or "สรุปสาระจาก PDF").strip()
        explanation = (row.get("คำอธิบาย") or "").strip()
        answer_index = "ABCD".index(answer)
        quizzes.append({
            "number": index,
            "prompt": prompt,
            "options": options,
            "answer": answer,
            "explanation": explanation or f"เฉลย {answer}. {options[answer_index]}",
            "topic": legal_topic,
            "source": f"{source} · {category}" if category else source,
            "sourceId": f"part-06-legal-quiz-{module_id}",
            "id": f"user-part06-legal-quiz-{index:04d}",
        })
    return recalls, quizzes


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


def topic_from_computer_section(section: str) -> dict:
    title = section.casefold()
    if any(word in title for word in ["เครือข่าย", "อินเทอร์เน็ต", "ส่งไฟล์", "อัตรารับส่ง"]):
        return topic_for(111)
    if "ความปลอดภัย" in title:
        return topic_for(251)
    if "ฐานข้อมูล" in title:
        return topic_for(171)
    if "เว็บ" in title or "ข้อมูลและโปรแกรม" in title:
        return topic_for(211)
    if any(word in title for word in ["ระบบปฏิบัติการ", "ระบบไฟล์"]):
        return topic_for(86)
    if any(word in title for word in ["สถาปัตยกรรม", "ประวัติ"]):
        return topic_for(31)
    if any(word in title for word in ["ฮาร์ดแวร์", "หน่วยความจำ", "อุปกรณ์", "raid", "ภาพดิจิทัล"]):
        return topic_for(61)
    if any(word in title for word in ["บำรุงรักษา", "เทคโนโลยีประยุกต์"]):
        return topic_for(391)
    return topic_for(1)


def parse_computer_fundamentals_source(path: Path) -> tuple[list[dict], list[dict]]:
    lines = path.read_text(encoding="utf-8").splitlines()
    label = source_label(path)
    recalls: list[dict] = []
    quiz_items: dict[int, dict] = {}
    answer_key: dict[int, dict] = {}
    mode = ""
    section = label
    pending_recall: dict | None = None
    current_question: dict | None = None

    def flush_recall() -> None:
        nonlocal pending_recall
        if pending_recall and pending_recall.get("answer"):
            recalls.append(pending_recall)
        pending_recall = None

    def flush_question() -> None:
        nonlocal current_question
        if current_question and len(current_question["options"]) == 4:
            quiz_items[current_question["number"]] = current_question
        current_question = None

    for raw_line in lines:
        line = raw_line.strip()
        if not line or line.startswith("="):
            continue
        if line.startswith("PART 1"):
            flush_question()
            flush_recall()
            mode = "recall"
            continue
        if line.startswith("PART 2"):
            flush_recall()
            mode = "quiz"
            continue
        if line.startswith("PART 3"):
            flush_question()
            mode = "answer"
            continue
        section_match = re.match(r"^---\s*(.+?)\s*---$", line)
        if section_match:
            section = section_match.group(1).strip()
            continue

        if mode == "recall":
            answer_match = re.match(r"^ตอบ\s*:\s*(.+)$", line)
            if answer_match and pending_recall:
                answer = answer_match.group(1).strip()
                explanation = ""
                if "| วิธีคิด:" in answer:
                    answer, explanation = answer.split("| วิธีคิด:", 1)
                pending_recall["answer"] = answer.strip()
                pending_recall["explanation"] = explanation.strip()
                flush_recall()
                continue
            question_match = re.match(r"^AR(\d+)\.\s*(.+)$", line)
            if question_match:
                flush_recall()
                topic = topic_from_computer_section(section)
                pending_recall = {
                    "number": int(question_match.group(1)),
                    "prompt": question_match.group(2).strip(),
                    "answer": "",
                    "explanation": "",
                    "topic": topic,
                    "source": f"{label} · {section}",
                    "sourceId": "user-set-07",
                    "id": f"user-set-07-recall-{int(question_match.group(1)):04d}",
                }
                continue

        if mode == "quiz":
            question_match = re.match(r"^MC(\d+)\.\s*(.+)$", line)
            if question_match:
                flush_question()
                topic = topic_from_computer_section(section)
                current_question = {
                    "number": int(question_match.group(1)),
                    "prompt": question_match.group(2).strip(),
                    "options": [],
                    "answer": "",
                    "explanation": "",
                    "topic": topic,
                    "source": f"{label} · {section}",
                    "sourceId": "user-set-07",
                    "id": f"user-set-07-quiz-{int(question_match.group(1)):04d}",
                }
                continue
            option_match = re.match(r"^([A-D])\.\s*(.+)$", line)
            if option_match and current_question:
                current_question["options"].append(option_match.group(2).strip())
                continue

        if mode == "answer":
            answer_match = re.match(r"^MC(\d+)\.\s*([A-D])\.\s*(.*)$", line)
            if answer_match:
                answer_key[int(answer_match.group(1))] = {
                    "answer": answer_match.group(2),
                    "answerText": answer_match.group(3).strip(),
                    "explanation": "",
                }
                continue
            reason_match = re.match(r"^เหตุผล\s*:\s*(.+)$", line)
            if reason_match:
                answer_number = max(answer_key) if answer_key else 0
                if answer_number:
                    answer_key[answer_number]["explanation"] = reason_match.group(1).strip()

    flush_question()
    flush_recall()

    quizzes: list[dict] = []
    for number in sorted(quiz_items):
        question = quiz_items[number]
        key = answer_key.get(number)
        if not key:
            raise ValueError(f"ไม่พบเฉลย Computer Fundamentals ข้อ {number}")
        question["answer"] = key["answer"]
        question["explanation"] = key["explanation"] or f"เฉลย {key['answer']}. {key['answerText']}"
        quizzes.append(question)

    if len(recalls) != 500:
        raise ValueError(f"Computer Fundamentals ต้องมี Recall 500 ข้อ แต่พบ {len(recalls)} ข้อ")
    if len(quizzes) != 1000:
        raise ValueError(f"Computer Fundamentals ต้องมีข้อสอบ 1000 ข้อ แต่พบ {len(quizzes)} ข้อ")
    return recalls, quizzes


def topic_from_structured_source(path: Path, section: str) -> dict:
    stem = path.stem
    title = section.casefold()
    if stem == "set-08":
        return topic_for(291)
    if stem == "set-09":
        return topic_for(251)
    if stem == "set-10":
        return topic_for(171) if any(word in title for word in ["sql", "database", "ฐานข้อมูล"]) else topic_for(211)
    if stem == "set-11":
        return topic_for(111)
    if stem == "set-12":
        if "เครือข่าย" in title:
            return topic_for(111)
        if "ฮาร์ดแวร์" in title:
            return topic_for(61)
        if "ระบบปฏิบัติการ" in title:
            return topic_for(86)
        return topic_for(391)
    if stem == "set-13":
        return topic_for(1)
    if stem == "set-14":
        return topic_for(391)
    if stem == "set-15":
        return topic_for(86)
    if stem == "set-16":
        return topic_for(61)
    if stem == "set-17":
        return topic_for(331)
    return topic_for(391)


def parse_structured_source(path: Path) -> tuple[list[dict], list[dict]]:
    lines = path.read_text(encoding="utf-8").splitlines()
    label = source_label(path)
    recalls: list[dict] = []
    quizzes: list[dict] = []
    mode = ""
    section = label
    pending_recall: dict | None = None
    current_question: dict | None = None

    def current_topic() -> dict:
        return topic_from_structured_source(path, section)

    def flush_recall() -> None:
        nonlocal pending_recall
        if pending_recall and pending_recall.get("answer"):
            recalls.append(pending_recall)
        pending_recall = None

    def flush_question() -> None:
        nonlocal current_question
        if current_question:
            if len(current_question["options"]) != 4:
                raise ValueError(f"ตัวเลือกไม่ครบ 4 ข้อใน {path.name} ข้อ {current_question['number']}")
            if current_question.get("answer") not in "ABCD":
                raise ValueError(f"ไม่พบเฉลยใน {path.name} ข้อ {current_question['number']}")
            quizzes.append(current_question)
        current_question = None

    for raw_line in lines:
        line = raw_line.strip()
        if not line or line.startswith("=") and not line.startswith("==="):
            continue
        lowered = line.casefold()
        if "active recall" in lowered:
            flush_question()
            flush_recall()
            mode = "recall"
            continue
        if "multiple choice" in lowered:
            flush_recall()
            mode = "quiz"
            continue

        if line.startswith(("MODULE", "กรณีศึกษา", "ชุด A", "ชุด B", "ชุด C", "ชุด D")):
            section = line
            continue
        if line.startswith("---") or line.startswith("===") or line.startswith("=========="):
            cleaned = re.sub(r"^[=\-]+|[=\-]+$", "", line).strip()
            if cleaned:
                section = cleaned
            continue
        if re.match(r"^\d+\.\s+พระราชบัญญัติ", line):
            section = line
            continue

        if mode == "recall":
            answer_match = re.match(r"^ตอบ\s*:\s*(.+)$", line)
            if answer_match and pending_recall:
                answer = answer_match.group(1).strip()
                explanation = ""
                if "| วิธีคิด:" in answer:
                    answer, explanation = answer.split("| วิธีคิด:", 1)
                pending_recall["answer"] = answer.strip()
                pending_recall["explanation"] = explanation.strip()
                flush_recall()
                continue
            question_match = re.match(r"^(?:AR|R)\s*(\d+)\.\s*(.+)$", line) or re.match(r"^(\d{4})\.\s*(.+)$", line)
            if question_match:
                flush_recall()
                number = int(question_match.group(1))
                topic = current_topic()
                pending_recall = {
                    "number": number,
                    "prompt": question_match.group(2).strip(),
                    "answer": "",
                    "explanation": "",
                    "topic": topic,
                    "source": f"{label} · {section}",
                    "sourceId": f"user-{path.stem}",
                    "id": f"user-{path.stem}-recall-{number:04d}",
                }
                continue

        if mode == "quiz":
            question_match = (
                re.match(r"^(?:MCQ|MC|Q)\s*(\d+)\.\s*(.+)$", line)
                or re.match(r"^(\d{4})\.\s*(.+)$", line)
            )
            if question_match:
                flush_question()
                number = int(question_match.group(1))
                topic = current_topic()
                current_question = {
                    "number": number,
                    "prompt": question_match.group(2).strip(),
                    "options": [],
                    "answer": "",
                    "explanation": "",
                    "topic": topic,
                    "source": f"{label} · {section}",
                    "sourceId": f"user-{path.stem}",
                    "id": f"user-{path.stem}-quiz-{number:04d}",
                }
                continue
            option_match = re.match(r"^([A-D])\.\s*(.+)$", line)
            if option_match and current_question:
                current_question["options"].append(option_match.group(2).strip())
                continue
            answer_match = re.match(r"^เฉลย\s*:\s*([A-D])(?:\.\s*(.*))?$", line)
            if answer_match and current_question:
                current_question["answer"] = answer_match.group(1)
                current_question["answerText"] = (answer_match.group(2) or "").strip()
                continue
            reason_match = re.match(r"^เหตุผล\s*:\s*(.+)$", line)
            if reason_match and current_question:
                current_question["explanation"] = reason_match.group(1).strip()
                continue
            reference_match = re.match(r"^อ้างอิง\s*:\s*(.+)$", line)
            if reference_match and current_question:
                reference = reference_match.group(1).strip()
                current_question["explanation"] = f"{current_question.get('explanation') or ''} อ้างอิง: {reference}".strip()

    flush_question()
    flush_recall()
    is_large_law_source = path.stem in {"set-17", "PART_06_Thai_Laws_12000_TH"}
    expected_recalls = 4000 if is_large_law_source else 500
    expected_quizzes = 8000 if is_large_law_source else 1000
    if len(recalls) != expected_recalls:
        raise ValueError(f"{path.name} ต้องมี Recall {expected_recalls} ข้อ แต่พบ {len(recalls)} ข้อ")
    if len(quizzes) != expected_quizzes:
        raise ValueError(f"{path.name} ต้องมีข้อสอบ {expected_quizzes} ข้อ แต่พบ {len(quizzes)} ข้อ")
    return recalls, quizzes


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
        # set-17 is the superseded legal source. The replacement TSV bank is
        # imported below so old legal rows never reach the generated seed.
        if path.stem == "set-17":
            continue
        if path.stem == "set-07":
            parser = parse_computer_fundamentals_source
        elif path.stem in {f"set-{number:02d}" for number in range(8, 18)}:
            parser = parse_structured_source
        else:
            parser = parse_additional_source
        file_recalls, file_quizzes = parser(path)
        additional_recalls.extend(file_recalls)
        additional_quizzes.extend(file_quizzes)

    replacement_recall_path = ADDITIONAL_SOURCE_DIR / "PART_06_Active_Recall_8000_Flashcards_TH.tsv"
    replacement_quiz_path = ADDITIONAL_SOURCE_DIR / "PART_06_MCQ_8000_TH.tsv"
    if not replacement_recall_path.exists() or not replacement_quiz_path.exists():
        raise FileNotFoundError("ไม่พบ TSV ชุดกฎหมายใหม่ทั้งสองไฟล์ใน content/additional-sources")
    legal_recalls, legal_quizzes = parse_legal_tsv_sources(replacement_recall_path, replacement_quiz_path)
    additional_recalls.extend(legal_recalls)
    additional_quizzes.extend(legal_quizzes)

    unique_recalls: list[dict] = []
    seen_recalls: set[str] = set()
    # Remove the old 331-390 legal block from the original 560-card seed.
    base_recalls = [item for item in recalls if not 331 <= item["number"] <= 390]
    for item in [*base_recalls, *additional_recalls]:
        key = f"{normalize_key(item['prompt'])}|{normalize_key(item['answer'])}"
        if key and key not in seen_recalls:
            seen_recalls.add(key)
            unique_recalls.append(item)

    unique_quizzes: list[dict] = []
    seen_quizzes: set[str] = set()
    # Remove the old legal block from the original 100-question seed.
    base_quizzes = [item for item in quizzes if not 71 <= item["number"] <= 85]
    for item in [*base_quizzes, *additional_quizzes]:
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

    additional_sources = [
        path.relative_to(ROOT).as_posix()
        for path in sorted(ADDITIONAL_SOURCE_DIR.glob("set-*.txt"))
        if path.stem != "set-17"
    ]
    additional_sources.extend([
        (ADDITIONAL_SOURCE_DIR / "PART_06_Active_Recall_8000_Flashcards_TH.tsv").relative_to(ROOT).as_posix(),
        (ADDITIONAL_SOURCE_DIR / "PART_06_MCQ_8000_TH.tsv").relative_to(ROOT).as_posix(),
    ])
    stats = {
        "recallCards": len(recalls),
        "examQuestions": len(quizzes),
        "scoredQuestions": len(quizzes),
        "topics": len(TOPICS),
        "source": ["content/user-study-source.txt", *additional_sources],
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
