import { NextResponse } from "next/server";
import { searchPdfCorpus } from "@/lib/pdf-corpus";

export function GET(request: Request) {
  const url = new URL(request.url);
  const query = url.searchParams.get("q") ?? "";
  const source = url.searchParams.get("source");
  const results = searchPdfCorpus(query, 30).filter((hit) => !source || hit.sourceId === source);
  return NextResponse.json({ query, results, totalPages: 673 });
}
