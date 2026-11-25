"use client";

import { useEffect, useState } from "react";
import { certificateSvg } from "@/components/CertificateActions";

function readAsDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error("อ่านภาพลายเซ็นไม่สำเร็จ"));
    reader.readAsDataURL(blob);
  });
}

export default function CertificatePreviewPage() {
  const [svg, setSvg] = useState("");

  useEffect(() => {
    fetch("/signature-recipient.png", { cache: "force-cache" })
      .then((response) => response.blob())
      .then(readAsDataUrl)
      .then((signature) => setSvg(certificateSvg({
        title: "ตัวอย่างหลักสูตรนักวิชาการคอมพิวเตอร์",
        completed: 651,
        total: 651,
        accuracy: 96,
        recipient: "ผู้เรียนตัวอย่าง",
      }, signature).replace('width="1600"', 'width="100%"').replace('height="1000"', 'height="auto"')))
      .catch(() => setSvg(certificateSvg({
        title: "ตัวอย่างหลักสูตรนักวิชาการคอมพิวเตอร์",
        completed: 651,
        total: 651,
        accuracy: 96,
        recipient: "ผู้เรียนตัวอย่าง",
      }).replace('width="1600"', 'width="100%"').replace('height="1000"', 'height="auto"')));
  }, []);

  return <main style={{ minHeight: "100vh", padding: "24px", background: "#081a35" }}><div style={{ maxWidth: "1200px", margin: "0 auto", background: "#081a35" }} dangerouslySetInnerHTML={{ __html: svg }} /></main>;
}
