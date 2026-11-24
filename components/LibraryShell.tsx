"use client";

import { FormEvent, useState } from "react";
import { BookOpen, FileText, Search } from "lucide-react";

type SourceSummary = { id: string; title: string; fileName: string; pageCount: number };
type Hit = { sourceId: string; sourceTitle: string; fileName: string; page: number; snippet: string; score: number };
type PageView = { source: SourceSummary; page: { id: string; page: number; text: string; charCount: number } };

export function LibraryShell({ sources }: { sources: SourceSummary[] }) {
  const [query, setQuery] = useState("");
  const [source, setSource] = useState("");
  const [results, setResults] = useState<Hit[]>([]);
  const [selectedPage, setSelectedPage] = useState<PageView | null>(null);
  const [loading, setLoading] = useState(false);

  async function search(event?: FormEvent) {
    event?.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    const response = await fetch(`/api/library/search?q=${encodeURIComponent(query)}${source ? `&source=${source}` : ""}`);
    const data = await response.json() as { results: Hit[] };
    setResults(data.results);
    setSelectedPage(null);
    setLoading(false);
  }

  async function openPage(hit: Hit) {
    const response = await fetch(`/api/library/page?source=${hit.sourceId}&page=${hit.page}`);
    if (response.ok) setSelectedPage(await response.json() as PageView);
  }

  return <div className="library-layout"><aside className="library-sidebar panel"><div className="panel-label">แหล่งข้อมูล</div>{sources.map((item) => <button key={item.id} className={source === item.id ? "source-choice selected" : "source-choice"} onClick={() => setSource(source === item.id ? "" : item.id)}><FileText size={17} /><span><strong>{item.title}</strong><small>{item.pageCount} หน้า</small></span></button>)}<div className="library-note"><BookOpen size={16} /><p>ระบบเก็บเนื้อหาแบบรายหน้า จึงย้อนกลับไปตรวจแหล่งที่มาได้</p></div></aside><section className="library-main"><form className="library-search" onSubmit={search}><Search size={19} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ค้นหา เช่น PDPA, OSI, ฐานข้อมูล, Router" /><button className="primary-button" type="submit" disabled={loading}>{loading ? "กำลังค้น..." : "ค้นหา"}</button></form><div className="quick-searches"><span>ลองค้นหา:</span>{["ระบบเครือข่าย", "ข้อมูลส่วนบุคคล", "ฐานข้อมูล", "ปัญญาประดิษฐ์"].map((item) => <button key={item} onClick={() => { setQuery(item); void search(); }}>{item}</button>)}</div>{selectedPage ? <article className="page-view panel"><div className="page-view-head"><div><p className="eyebrow">PDF SOURCE</p><h2>{selectedPage.source.title}</h2><p className="muted">หน้า {selectedPage.page.page} · {selectedPage.source.fileName}</p></div><button className="secondary-button" onClick={() => setSelectedPage(null)}>กลับผลค้นหา</button></div><div className="pdf-text">{selectedPage.page.text || "หน้านี้ไม่มีข้อความที่ดึงได้ อาจเป็นภาพสแกน"}</div></article> : <div className="search-results">{query && <div className="result-heading"><h2>ผลค้นหา</h2><span>{results.length} หน้าที่พบ</span></div>}{results.length === 0 && <div className="empty-library panel"><div className="empty-icon">🔎</div><h2>ค้นหาเนื้อหาจาก PDF ทั้ง 673 หน้า</h2><p className="muted">ค้นคำสำคัญ แล้วกดผลลัพธ์เพื่ออ่านเนื้อหาเต็มพร้อมชื่อไฟล์และเลขหน้า</p></div>}{results.map((hit) => <button className="result-card" key={`${hit.sourceId}-${hit.page}`} onClick={() => openPage(hit)}><div className="result-meta"><span>{hit.sourceTitle}</span><b>หน้า {hit.page}</b></div><p>{hit.snippet}</p><span className="result-open">เปิดอ่านหน้านี้</span></button>)}</div>}</section></div>;
}
