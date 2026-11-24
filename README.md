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

## นำเข้าเนื้อหาจาก PDF ใหม่

ข้อมูลจาก PDF ที่ใช้ในแอปอยู่ใน `content/pdf-corpus.json` ครบ 3 ไฟล์ รวม 673 หน้า

ถ้าเปลี่ยนไฟล์ PDF หรือย้ายโฟลเดอร์ ให้ตั้งค่า `PDF_SOURCE_DIR` แล้วรัน:

```bash
python scripts/extract-pdf-corpus.py
python scripts/build-study-bank.py
```

คำสั่งที่สองจะสร้าง `content/study-bank.json` ใหม่ โดยเปลี่ยนทุกหน้า PDF เป็นการ์ด Active Recall และดึงบล็อกคำถามปรนัยเป็นคลังข้อสอบ จากนั้น `/learn` และ `/quiz` จะใช้คลังเต็มนี้เป็นชุดแรกโดยอัตโนมัติ

หน้า `/library` ใช้ค้นข้อความและเปิดอ่านตามไฟล์/เลขหน้า ส่วน AI Coach จะค้นบริบทจากคลังนี้ก่อนส่งให้ Groq ทุกครั้ง
