import rawCorpus from "@/content/pdf-corpus.json";

export type PdfPage = { id: string; page: number; text: string; charCount: number };
export type PdfSource = { id: string; title: string; fileName: string; sha256: string; pageCount: number; pages: PdfPage[] };
export type PdfCorpus = { version: number; generatedAt: string; extraction: string; totalPages: number; totalChars: number; sources: PdfSource[] };
export type PdfHit = { sourceId: string; sourceTitle: string; fileName: string; page: number; snippet: string; score: number };

export const pdfCorpus = rawCorpus as PdfCorpus;

const knownThaiTerms = [
  "เครือข่าย", "การสื่อสาร", "ฐานข้อมูล", "ความมั่นคงปลอดภัย", "ไซเบอร์", "ข้อมูลส่วนบุคคล", "คอมพิวเตอร์", "ระบบปฏิบัติการ", "ปัญญาประดิษฐ์", "การพัฒนาโปรแกรม", "ธุรกรรมทางอิเล็กทรอนิกส์", "พนักงานราชการ", "ศาลยุติธรรม", "กระทรวงสาธารณสุข", "cloud", "big data", "web application", "php", "ai", "pdpa",
];

function termsFor(query: string) {
  const normalized = query.toLowerCase().trim();
  const terms = normalized.split(/[\s,./:()\-]+/).filter((term) => term.length > 1);
  for (const term of knownThaiTerms) if (normalized.includes(term)) terms.push(term);
  const aliases: Record<string, string[]> = {
    pdpa: ["คุ้มครองข้อมูลส่วนบุคคล", "ข้อมูลส่วนบุคคล"],
    ai: ["ปัญญาประดิษฐ์", "เทคโนโลยีปัญญาประดิษฐ์"],
    osi: ["เครือข่าย", "การสื่อสาร"],
    cloud: ["คลาวด์", "cloud computing"],
    "big data": ["ข้อมูลขนาดใหญ่", "big data"],
    router: ["เราเตอร์", "router"],
    switch: ["สวิตช์", "switch"],
  };
  for (const [alias, replacements] of Object.entries(aliases)) if (normalized.includes(alias)) terms.push(...replacements);
  return [...new Set(terms)];
}

function snippetFor(text: string, query: string) {
  const compact = text.replace(/\s+/g, " ").trim();
  const needle = termsFor(query).sort((a, b) => b.length - a.length)[0] ?? "";
  const at = compact.toLowerCase().indexOf(needle.toLowerCase());
  if (at < 0) return compact.slice(0, 260) + (compact.length > 260 ? "..." : "");
  const start = Math.max(0, at - 100);
  const end = Math.min(compact.length, at + 220);
  return (start > 0 ? "..." : "") + compact.slice(start, end) + (end < compact.length ? "..." : "");
}

export function searchPdfCorpus(query: string, limit = 12): PdfHit[] {
  const normalized = query.toLowerCase().trim();
  if (!normalized) return [];
  const terms = termsFor(normalized);
  const hits: PdfHit[] = [];
  for (const source of pdfCorpus.sources) {
    for (const page of source.pages) {
      const text = page.text.toLowerCase();
      if (!text) continue;
      let score = text.includes(normalized) ? 10 : 0;
      for (const term of terms) if (text.includes(term)) score += term.length > 4 ? 2 : 1;
      if (score > 0) hits.push({ sourceId: source.id, sourceTitle: source.title, fileName: source.fileName, page: page.page, snippet: snippetFor(page.text, normalized), score });
    }
  }
  return hits.sort((a, b) => b.score - a.score || a.sourceId.localeCompare(b.sourceId) || a.page - b.page).slice(0, limit);
}

export function getPdfPage(sourceId: string, pageNumber: number) {
  const source = pdfCorpus.sources.find((item) => item.id === sourceId);
  const page = source?.pages.find((item) => item.page === pageNumber);
  return source && page ? { source, page } : null;
}
