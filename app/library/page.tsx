import { LibraryShell } from "@/components/LibraryShell";
import { pdfCorpus } from "@/lib/pdf-corpus";

export default function LibraryPage() {
  const sources = pdfCorpus.sources.map((source) => ({ id: source.id, title: source.title, fileName: source.fileName, pageCount: source.pageCount }));
  return <main className="page-wrap inner-page"><div className="page-intro"><p className="eyebrow">PDF KNOWLEDGE BASE</p><h1>คลังเนื้อหาจาก PDF</h1><p>ค้นและอ่านเนื้อหาจากเอกสารจริงทั้ง 3 ชุด รวม 673 หน้า แล้วใช้ AI Coach ช่วยอธิบายต่อจากบริบทที่ค้นพบ</p></div><LibraryShell sources={sources} /></main>;
}
