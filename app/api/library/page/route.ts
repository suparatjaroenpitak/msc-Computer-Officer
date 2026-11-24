import { NextResponse } from "next/server";
import { getPdfPage } from "@/lib/pdf-corpus";

export function GET(request: Request) {
  const url = new URL(request.url);
  const source = url.searchParams.get("source") ?? "";
  const page = Number(url.searchParams.get("page") ?? "0");
  const result = getPdfPage(source, page);
  if (!result) return NextResponse.json({ error: "ไม่พบหน้าที่ต้องการ" }, { status: 404 });
  return NextResponse.json({ source: { id: result.source.id, title: result.source.title, fileName: result.source.fileName, pageCount: result.source.pageCount }, page: result.page });
}
