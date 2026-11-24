# MSC Computer Officer Study App

แอปติวนักวิชาการคอมพิวเตอร์สำหรับนักเรียน ใช้ Next.js, PostgreSQL/Prisma, Google OAuth และ PWA

## เริ่มต้นใช้งาน

```bash
npm install
copy .env.example .env.local
npm run db:generate
npm run db:push
npm run db:seed
npm run dev
```

เปิด `http://localhost:3000`

ถ้าต้องการบันทึกคะแนนและความคืบหน้า ให้ตั้งค่า PostgreSQL และ Google OAuth ใน `.env.local` ก่อน

Google OAuth callback URL: `http://localhost:3000/api/auth/callback/google`

ถ้ายังไม่ตั้งค่า OAuth แอปยังเปิดอ่านบทเรียน การ์ด และทำแบบทดสอบได้ โดยความคืบหน้าในโหมดผู้เยี่ยมชมจะเก็บใน browser localStorage

`npm run db:seed` จะเก็บบทเรียน/ข้อสอบที่ผ่านการกลั่นและบทสรุป AI-friendly ลง PostgreSQL พร้อมใช้รหัสการ์ดเดียวกับหน้าเว็บ เพื่อให้ความคืบหน้าของผู้ใช้บันทึกได้ถูกต้อง

## นำเข้าเนื้อหาจาก PDF ใหม่

ข้อมูลจาก PDF ที่ใช้ในแอปอยู่ใน `content/pdf-corpus.json` ครบ 3 ไฟล์ รวม 673 หน้า

ถ้าเปลี่ยนไฟล์ PDF หรือย้ายโฟลเดอร์ ให้ตั้งค่า `PDF_SOURCE_DIR` แล้วรัน:

```bash
python scripts/extract-pdf-corpus.py
python scripts/build-curated-study-bank.py
```

คำสั่งที่สองจะวิเคราะห์ครบทั้ง 673 หน้า แล้วสร้าง `content/curated-study-bank.json` โดยซ่อมอักขระจาก PDF จัดหมวดหัวข้อ สร้างเนื้อหาอ่าน/การ์ด Recall/ข้อสอบตรวจความเข้าใจจากทุกหน้าสาระ ตัดเฉพาะข้อความหน้าปก สารบัญ โฆษณา และลิขสิทธิ์ที่ไม่ใช่เนื้อหาสอบ ตัดข้อสอบซ้ำ และเชื่อมเฉลยที่พบในเอกสาร จากนั้น `/learn` และ `/quiz` จะใช้เนื้อหาที่กลั่นแล้วเป็นชุดแรกโดยอัตโนมัติ

หน้า `/learn` และ `/quiz` ใช้เฉพาะเนื้อหาที่ผ่านการกลั่นและจัดหมวดแล้ว ส่วน AI Coach จะค้นบริบทจากการ์ด/ข้อสอบที่กลั่นแล้วก่อนส่งให้ Groq จึงไม่ส่งข้อความ PDF ดิบให้ผู้เรียนเห็น
