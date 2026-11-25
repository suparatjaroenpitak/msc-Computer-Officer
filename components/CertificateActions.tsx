"use client";

import { useSession } from "next-auth/react";

type CertificateActionsProps = {
  title: string;
  completed: number;
  total: number;
  accuracy: number;
  recipient?: string;
};

function escapeHtml(value: string) {
  return value.replace(/[&<>\"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" })[character] ?? character);
}

function certificateSvg({ title, completed, total, accuracy, recipient = "ผู้เรียน" }: CertificateActionsProps, signatureDataUrl = "") {
  const date = new Date().toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" });
  const safeTitle = escapeHtml(title);
  const safeDate = escapeHtml(date);
  const safeRecipient = escapeHtml(recipient);
  const certificateNumber = `MSC-${new Date().getFullYear()}-${String(total).padStart(4, "0")}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1000" viewBox="0 0 1600 1000">
    <defs>
      <linearGradient id="paper" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fffdf7"/><stop offset=".5" stop-color="#fbf7ed"/><stop offset="1" stop-color="#f5efe1"/></linearGradient>
      <linearGradient id="gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f9e6a1"/><stop offset=".45" stop-color="#c99220"/><stop offset=".75" stop-color="#ffe9a0"/><stop offset="1" stop-color="#ad7410"/></linearGradient>
      <radialGradient id="seal" cx="35%" cy="25%"><stop offset="0" stop-color="#fff0a5"/><stop offset=".55" stop-color="#e8b83e"/><stop offset="1" stop-color="#a66c0b"/></radialGradient>
      <filter id="shadow" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="5" stdDeviation="5" flood-color="#0b1f3a" flood-opacity=".22"/></filter>
      <filter id="signatureInk" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 -0.2126 -0.7152 -0.0722 0 1"/></filter>
      <clipPath id="signatureBox"><rect x="1025" y="795" width="315" height="90" rx="4"/></clipPath>
      <g id="flower" fill="url(#gold)" stroke="#b17b17" stroke-width="2"><ellipse cx="0" cy="-26" rx="13" ry="27"/><ellipse cx="24" cy="-8" rx="13" ry="27" transform="rotate(55 24 -8)"/><ellipse cx="15" cy="22" rx="13" ry="27" transform="rotate(115 15 22)"/><ellipse cx="-15" cy="22" rx="13" ry="27" transform="rotate(-115 -15 22)"/><ellipse cx="-24" cy="-8" rx="13" ry="27" transform="rotate(-55 -24 -8)"/><circle r="10" fill="#fff1a6"/></g>
      <g id="leaf" fill="url(#gold)" stroke="#b17b17" stroke-width="1"><ellipse cx="0" cy="-13" rx="7" ry="18" transform="rotate(-32)"/><ellipse cx="0" cy="-13" rx="7" ry="18" transform="rotate(32)"/></g>
      <g id="laurel"><path d="M0 180 C-60 110 -70 45 -28 0" fill="none" stroke="#b8861b" stroke-width="7"/><use href="#leaf" transform="translate(-30 126) rotate(-38) scale(.72)"/><use href="#leaf" transform="translate(-48 98) rotate(-42) scale(.68)"/><use href="#leaf" transform="translate(-56 68) rotate(-52) scale(.62)"/><use href="#leaf" transform="translate(-50 37) rotate(-66) scale(.55)"/><use href="#leaf" transform="translate(-39 13) rotate(-78) scale(.48)"/></g>
    </defs>
    <rect width="1600" height="1000" fill="#081a35"/>
    <path d="M0 0H540C355 45 184 145 0 330Z" fill="#0b2348" stroke="url(#gold)" stroke-width="7"/><path d="M0 30C185 4 342 18 470 0C292 83 122 177 0 290" fill="none" stroke="#f2d47d" stroke-width="12"/>
    <path d="M1600 1000H1060C1245 955 1416 855 1600 670Z" fill="#0b2348" stroke="url(#gold)" stroke-width="7"/><path d="M1600 970C1415 996 1258 982 1130 1000C1308 917 1478 823 1600 710" fill="none" stroke="#f2d47d" stroke-width="12"/>
    <rect x="22" y="22" width="1556" height="956" rx="7" fill="url(#paper)" stroke="url(#gold)" stroke-width="9"/><rect x="40" y="40" width="1520" height="920" rx="4" fill="none" stroke="#0b2348" stroke-width="3"/><rect x="51" y="51" width="1498" height="898" rx="2" fill="none" stroke="#d2a33c" stroke-width="2"/>
    <g opacity=".95"><use href="#flower" transform="translate(110 145) scale(.9)"/><path d="M108 173C72 220 67 271 91 315" fill="none" stroke="#b8861b" stroke-width="6"/><use href="#leaf" transform="translate(88 218) rotate(-68) scale(.55)"/><use href="#leaf" transform="translate(83 254) rotate(-68) scale(.52)"/><use href="#flower" transform="translate(1490 112) scale(.68)"/><use href="#flower" transform="translate(110 868) scale(.72)"/><use href="#flower" transform="translate(1482 864) scale(.8)"/></g>
    <text x="1475" y="92" text-anchor="end" fill="#172a4d" font-family="Tahoma, Noto Sans Thai, sans-serif" font-size="20">เลขที่เกียรติบัตร : ${certificateNumber}</text>
    <use href="#laurel" transform="translate(545 145) rotate(-8)"/><use href="#laurel" transform="translate(1055 145) scale(-1 1) rotate(-8)"/>
    <text x="800" y="185" text-anchor="middle" fill="#10294f" font-family="Tahoma, Noto Sans Thai, sans-serif" font-size="80" font-weight="700">เกียรติบัตร</text><text x="800" y="245" text-anchor="middle" fill="#172a4d" font-family="Georgia, serif" font-size="38" font-style="italic">Certificate of Achievement</text>
    <path d="M485 285H735M865 285H1115" stroke="#ba861c" stroke-width="3"/><path d="M800 272l12 13-12 13-12-13z" fill="url(#gold)"/>
    <text x="800" y="360" text-anchor="middle" fill="#172a4d" font-family="Tahoma, Noto Sans Thai, sans-serif" font-size="31">ขอมอบเกียรติบัตรฉบับนี้เพื่อแสดงว่า</text><text x="800" y="445" text-anchor="middle" fill="#10294f" font-family="Tahoma, Noto Sans Thai, sans-serif" font-size="60" font-weight="700">${safeRecipient}</text>
    <path d="M390 475H720M880 475H1210" stroke="#ba861c" stroke-width="3"/><path d="M800 463l12 13-12 13-12-13z" fill="url(#gold)"/><text x="800" y="525" text-anchor="middle" fill="#172a4d" font-family="Tahoma, Noto Sans Thai, sans-serif" font-size="29">ได้ผ่านการเรียนและทบทวนครบถ้วนตามเกณฑ์ของหลักสูตร</text>
    <rect x="350" y="552" width="900" height="112" rx="17" fill="#0b2348" stroke="url(#gold)" stroke-width="8" filter="url(#shadow)"/><path d="M392 608h55M1153 608h55" stroke="#f1d47e" stroke-width="7"/><text x="800" y="625" text-anchor="middle" fill="#fff4bd" font-family="Tahoma, Noto Sans Thai, sans-serif" font-size="36" font-weight="700">${safeTitle}</text>
    <text x="800" y="715" text-anchor="middle" fill="#172a4d" font-family="Tahoma, Noto Sans Thai, sans-serif" font-size="25">สถิติการเรียนรู้: ${completed.toLocaleString("th-TH")} / ${total.toLocaleString("th-TH")} การ์ด · ความแม่นยำ ${accuracy}%</text><path d="M560 755H1040" stroke="#ba861c" stroke-width="2"/><text x="800" y="785" text-anchor="middle" fill="#172a4d" font-family="Tahoma, Noto Sans Thai, sans-serif" font-size="24">ให้ไว้ ณ วันที่ ${safeDate}</text>
    <g transform="translate(800 865)" filter="url(#shadow)"><path d="M-54 55l-30 58 58-25 26 43 26-43 58 25-30-58z" fill="#0b2348" stroke="url(#gold)" stroke-width="5"/><circle r="76" fill="url(#seal)" stroke="#a66c0b" stroke-width="7"/><circle r="58" fill="none" stroke="#fff0a5" stroke-width="3" stroke-dasharray="4 6"/><path d="M-35 5l24 25L38-27" fill="none" stroke="#8c5d0c" stroke-width="11" stroke-linecap="round" stroke-linejoin="round"/><text y="47" text-anchor="middle" fill="#704a0a" font-family="Tahoma, Noto Sans Thai, sans-serif" font-size="12" font-weight="700">สำเร็จ</text></g>
    <path d="M260 885H575M1025 885H1340" stroke="#172a4d" stroke-width="2"/>${signatureDataUrl ? `<image href="${signatureDataUrl}" x="958" y="740" width="399" height="266" preserveAspectRatio="none" filter="url(#signatureInk)" clip-path="url(#signatureBox)"/>` : ""}<text x="417" y="918" text-anchor="middle" fill="#172a4d" font-family="Tahoma, Noto Sans Thai, sans-serif" font-size="21">ผู้มอบประกาศนียบัตร</text><text x="1183" y="918" text-anchor="middle" fill="#172a4d" font-family="Tahoma, Noto Sans Thai, sans-serif" font-size="19">ศุภรัตน์ เจริญพิทักษ์</text><text x="1183" y="945" text-anchor="middle" fill="#172a4d" font-family="Tahoma, Noto Sans Thai, sans-serif" font-size="16">ผู้รับรอง</text>
  </svg>`;
}

async function loadSignatureDataUrl() {
  const response = await fetch("/signature-recipient.png", { cache: "force-cache" });
  if (!response.ok) throw new Error("โหลดภาพลายเซ็นไม่สำเร็จ");
  const blob = await response.blob();
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error("อ่านภาพลายเซ็นไม่สำเร็จ"));
    reader.readAsDataURL(blob);
  });
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
  const { data: session } = useSession();
  const certificate = {
    ...props,
    recipient: props.recipient ?? session?.user?.name ?? session?.user?.email ?? "ผู้เรียน",
  };

  const downloadPng = async () => {
    const signatureDataUrl = await loadSignatureDataUrl().catch(() => "");
    const svgBlob = new Blob([certificateSvg(certificate, signatureDataUrl)], { type: "image/svg+xml;charset=utf-8" });
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

  const printPdf = async () => {
    const printWindow = window.open("", "_blank", "width=1200,height=900");
    if (!printWindow) return;
    const signatureDataUrl = await loadSignatureDataUrl().catch(() => "");
    const safeTitle = escapeHtml(certificate.title);
    const imageUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(certificateSvg(certificate, signatureDataUrl))}`;
    printWindow.document.write(`<!doctype html><html lang="th"><head><meta charset="utf-8"><title>ใบรับรอง ${safeTitle}</title><style>@page{size:A4 landscape;margin:0}html,body{margin:0;width:100%;height:100%;background:#081a35}img{display:block;width:100vw;height:100vh;object-fit:contain}</style></head><body><img src="${imageUrl}" alt="ใบรับรอง ${safeTitle}" onload="setTimeout(()=>window.print(),300)"></body></html>`);
    printWindow.document.close();
  };

  return <div className="certificate-actions panel"><div><p className="eyebrow">หมวดนี้เรียนครบแล้ว</p><h3>ออกใบรับรองการเรียนรู้</h3><p className="muted">บันทึกเป็น PNG ได้ทันที หรือเลือกพิมพ์แล้วบันทึกเป็น PDF จากหน้าต่างพิมพ์</p></div><div className="result-actions"><button className="primary-button" onClick={downloadPng}>ดาวน์โหลด PNG</button><button className="secondary-button" onClick={printPdf}>พิมพ์ / บันทึก PDF</button></div></div>;
}
