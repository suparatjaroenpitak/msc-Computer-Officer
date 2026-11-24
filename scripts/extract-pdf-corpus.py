"""Extract the three exam PDFs into a page-addressable JSON corpus for the app."""

from __future__ import annotations

import hashlib
import json
import os
from datetime import datetime, timezone
from pathlib import Path

from pypdf import PdfReader


PDF_DIR = Path(os.environ.get("PDF_SOURCE_DIR", r"D:\แนวข้อสอบ นักวิชาการคอม"))
OUT = Path(__file__).resolve().parents[1] / "content" / "pdf-corpus.json"

SOURCES = [
    ("court", "สำนักงานศาลยุติธรรม", "eb.นักวิชาการคอมพิวเตอร์ปฏิบัติการ สำนักงานศาลยุติธรรม 69.pdf"),
    ("health", "สำนักงานสาธารณสุขจังหวัดสระบุรี", "แนวข้อสอบ นักวิชาการคอมพิวเตอร์ สำนักงานสาธารณสุขจังหวัดสระบุรี (1).pdf"),
    ("industry", "กรมโรงงานอุตสาหกรรม", "แนวข้อสอบนักวิชาการคอมพิวเตอร์ กรมโรงงานอุตสาหกรรม.pdf"),
]


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def main() -> None:
    OUT.parent.mkdir(parents=True, exist_ok=True)
    sources = []
    total_pages = 0
    total_chars = 0

    for source_id, title, filename in SOURCES:
        path = PDF_DIR / filename
        if not path.exists():
            raise FileNotFoundError(f"ไม่พบไฟล์ PDF: {path}")
        reader = PdfReader(str(path))
        pages = []
        for page_number, page in enumerate(reader.pages, start=1):
            text = (page.extract_text() or "").replace("\x00", " ").strip()
            pages.append({
                "id": f"{source_id}-{page_number}",
                "page": page_number,
                "text": text,
                "charCount": len(text),
            })
            total_chars += len(text)
        total_pages += len(pages)
        sources.append({
            "id": source_id,
            "title": title,
            "fileName": filename,
            "sha256": sha256(path),
            "pageCount": len(pages),
            "pages": pages,
        })
        print(f"{title}: {len(pages)} หน้า, {sum(p['charCount'] for p in pages):,} ตัวอักษร")

    corpus = {
        "version": 1,
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "extraction": "pypdf page text extraction; source pages retained for citation",
        "totalPages": total_pages,
        "totalChars": total_chars,
        "sources": sources,
    }
    OUT.write_text(json.dumps(corpus, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(f"เขียนคลังเนื้อหา: {OUT}")
    print(f"รวม {total_pages} หน้า, {total_chars:,} ตัวอักษร")


if __name__ == "__main__":
    main()
