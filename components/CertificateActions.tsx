"use client";

type CertificateActionsProps = {
  title: string;
  completed: number;
  total: number;
  accuracy: number;
};

function escapeHtml(value: string) {
  return value.replace(/[&<>\"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" })[character] ?? character);
}

function certificateSvg({ title, completed, total, accuracy }: CertificateActionsProps) {
  const date = new Date().toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" });
  const safeTitle = escapeHtml(title);
  const safeDate = escapeHtml(date);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1000" viewBox="0 0 1600 1000">
    <rect width="1600" height="1000" fill="#f7f8ff"/>
    <rect x="34" y="34" width="1532" height="932" rx="30" fill="#ffffff" stroke="#635bff" stroke-width="8"/>
    <rect x="62" y="62" width="1476" height="876" rx="22" fill="none" stroke="#d9d7ff" stroke-width="3"/>
    <text x="800" y="210" text-anchor="middle" fill="#5147d9" font-family="Tahoma, Noto Sans Thai, sans-serif" font-size="42" font-weight="700">MSC Exam Lab</text>
    <text x="800" y="340" text-anchor="middle" fill="#1f2937" font-family="Tahoma, Noto Sans Thai, sans-serif" font-size="70" font-weight="700">ใบรับรองการเรียนรู้ครบหมวด</text>
    <text x="800" y="450" text-anchor="middle" fill="#4b5563" font-family="Tahoma, Noto Sans Thai, sans-serif" font-size="38">ขอรับรองว่าเรียนและทบทวนครบทุกการ์ดในหมวด</text>
    <text x="800" y="535" text-anchor="middle" fill="#111827" font-family="Tahoma, Noto Sans Thai, sans-serif" font-size="52" font-weight="700">${safeTitle}</text>
    <text x="800" y="650" text-anchor="middle" fill="#5147d9" font-family="Tahoma, Noto Sans Thai, sans-serif" font-size="38">สำเร็จ ${completed.toLocaleString("th-TH")} / ${total.toLocaleString("th-TH")} การ์ด · ความแม่นยำ ${accuracy}%</text>
    <text x="800" y="790" text-anchor="middle" fill="#6b7280" font-family="Tahoma, Noto Sans Thai, sans-serif" font-size="30">ออกให้ ณ วันที่ ${safeDate}</text>
    <circle cx="800" cy="860" r="34" fill="#635bff"/><path d="M784 860l11 11 22-27" fill="none" stroke="white" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function CertificateActions(props: CertificateActionsProps) {
  const downloadPng = () => {
    const svgBlob = new Blob([certificateSvg(props)], { type: "image/svg+xml;charset=utf-8" });
    const svgUrl = URL.createObjectURL(svgBlob);
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 1600;
      canvas.height = 1000;
      const context = canvas.getContext("2d");
      if (!context) return;
      context.drawImage(image, 0, 0);
      canvas.toBlob((blob) => { if (blob) downloadBlob(blob, "msc-exam-lab-certificate.png"); }, "image/png");
      URL.revokeObjectURL(svgUrl);
    };
    image.src = svgUrl;
  };

  const printPdf = () => {
    const printWindow = window.open("", "_blank", "noopener,noreferrer");
    if (!printWindow) return;
    const safeTitle = escapeHtml(props.title);
    const date = new Date().toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" });
    printWindow.document.write(`<!doctype html><html lang="th"><head><meta charset="utf-8"><title>ใบรับรอง ${safeTitle}</title><style>@page{size:A4 landscape;margin:0}*{box-sizing:border-box}body{margin:0;background:#f7f8ff;font-family:Tahoma,"Noto Sans Thai",sans-serif}.certificate{width:100vw;height:100vh;padding:3.5vw;display:flex;align-items:center;justify-content:center}.sheet{width:94vw;height:88vh;background:#fff;border:4px solid #635bff;border-radius:24px;outline:2px solid #d9d7ff;outline-offset:-16px;text-align:center;padding:12vh 5vw;color:#1f2937}.brand{font-size:28px;color:#5147d9;font-weight:700}.heading{font-size:46px;font-weight:700;margin:50px 0 35px}.muted{font-size:24px;color:#4b5563}.title{font-size:36px;font-weight:700;margin:28px}.score{font-size:26px;color:#5147d9;margin:44px 0}.date{font-size:20px;color:#6b7280}</style></head><body><main class="certificate"><section class="sheet"><div class="brand">MSC Exam Lab</div><div class="heading">ใบรับรองการเรียนรู้ครบหมวด</div><div class="muted">ขอรับรองว่าเรียนและทบทวนครบทุกการ์ดในหมวด</div><div class="title">${safeTitle}</div><div class="score">สำเร็จ ${props.completed.toLocaleString("th-TH")} / ${props.total.toLocaleString("th-TH")} การ์ด · ความแม่นยำ ${props.accuracy}%</div><div class="date">ออกให้ ณ วันที่ ${escapeHtml(date)}</div></section></main><script>window.onload=()=>setTimeout(()=>window.print(),300)</script></body></html>`);
    printWindow.document.close();
  };

  return <div className="certificate-actions panel"><div><p className="eyebrow">หมวดนี้เรียนครบแล้ว</p><h3>ออกใบรับรองการเรียนรู้</h3><p className="muted">บันทึกเป็น PNG ได้ทันที หรือเลือกพิมพ์แล้วบันทึกเป็น PDF จากหน้าต่างพิมพ์</p></div><div className="result-actions"><button className="primary-button" onClick={downloadPng}>ดาวน์โหลด PNG</button><button className="secondary-button" onClick={printPdf}>พิมพ์ / บันทึก PDF</button></div></div>;
}
