import type { Metadata } from "next";
import { Providers } from "@/app/providers";
import { PwaRegister } from "@/components/PwaRegister";
import { TopNav } from "@/components/TopNav";
import "./globals.css";

export const metadata: Metadata = { title: "MSC Exam Lab | นักวิชาการคอมพิวเตอร์", description: "เรียนแบบเข้าใจง่าย ฝึก Recall และทำข้อสอบจากชุดเอกสารติว" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="th"><body><Providers><TopNav />{children}<PwaRegister /></Providers></body></html>;
}
