# MSC Computer Officer Study App

แอปติวนักวิชาการคอมพิวเตอร์สำหรับนักเรียน ใช้ Next.js, PostgreSQL/Prisma, Google OAuth และ PWA

## เริ่มต้นใช้งาน

```bash
npm install
copy .env.example .env.local
npm run db:generate
npm run db:migrate:deploy
npm run db:seed
npm run dev
```

เปิด `http://localhost:3000`

ถ้าต้องการบันทึกคะแนนและความคืบหน้า ให้ตั้งค่า PostgreSQL และ Google OAuth ใน `.env.local` ก่อน

Google OAuth callback URL: `http://localhost:3000/api/auth/callback/google`

ถ้ายังไม่ตั้งค่า OAuth แอปยังเปิดอ่านบทเรียน การ์ด และทำแบบทดสอบได้ โดยความคืบหน้าในโหมดผู้เยี่ยมชมจะเก็บใน browser localStorage

`npm run db:seed` จะเก็บข้อมูลทุกหมวด รวมชุด Recall และข้อสอบทั้งหมด ลง PostgreSQL โดยใช้รหัสแบบผูกกับหมวดเพื่อไม่ให้รายการจากไฟล์หลายชุดชนกัน ส่วน `npm run db:seed:if-needed` จะตรวจจำนวนข้อมูลก่อนและไม่ลบข้อมูลเดิม

สำหรับฐานข้อมูลเดิมให้ใช้ `npm run db:migrate:deploy` ห้ามใช้ `prisma db push` กับฐานข้อมูล production เพราะอาจลบตาราง legacy ได้ การ deploy Vercel จะรัน migration แบบเพิ่มอย่างปลอดภัยและ seed ข้อมูลอัตโนมัติใน `vercel-build`

## ตั้งค่า Groq AI แบบทีละขั้น

1. สมัครหรือเข้าสู่ระบบที่ [console.groq.com](https://console.groq.com/)
2. เปิดเมนู API Keys แล้วสร้างคีย์ใหม่ จากนั้นคัดลอกไว้ทันที
3. เปิดไฟล์ `.env.local` แล้วเพิ่มค่าต่อไปนี้ โดยใส่คีย์ของคุณเอง ห้ามใส่คีย์จริงใน Git หรือแชท:

```env
GROQ_API_KEY="วางคีย์ Groq ของคุณตรงนี้"
GROQ_MODEL="openai/gpt-oss-120b"
```

4. ปิดแล้วเปิด `npm run dev` ใหม่ จากนั้นเข้าสู่ระบบ Google และกดปุ่ม AI Coach ในหน้าเรียน
5. ถ้าใช้ Vercel ให้ไปที่ Project Settings → Environment Variables เพิ่ม `GROQ_API_KEY` และ `GROQ_MODEL` ในช่อง Production แล้วกด Redeploy โดยไม่ต้องใส่คีย์ในโค้ด

AI Coach ใช้โมเดลข้อความ Groq เพื่ออธิบายเฉพาะการ์ดที่เปิดอยู่ มีปุ่มสร้าง Recall ใหม่และสร้างข้อสอบใหม่ ผลลัพธ์สองโหมดนี้จะถูกบันทึกใน PostgreSQL ของผู้ใช้โดยอัตโนมัติ ปุ่มทำเป็นภาพสรุปจะสร้าง SVG ภาษาไทยจากคำตอบและบันทึกไว้ด้วย โดย Groq เองเป็นโมเดลข้อความ ไม่ใช่โมเดลสร้างภาพ

ถ้าเห็นข้อความ `ยังไม่ได้ตั้งค่า GROQ_API_KEY` แปลว่ายังไม่ได้เพิ่มคีย์ใน environment ที่กำลังใช้งาน ส่วนข้อมูล Recall และข้อสอบจะโหลดครบทั้งหมวด ไม่ตัดเหลือ 30 รายการ

## นำเข้าเนื้อหาจาก PDF ใหม่

ข้อมูลจาก PDF ที่ใช้ในแอปอยู่ใน `content/pdf-corpus.json` ครบ 3 ไฟล์ รวม 673 หน้า

ถ้าเปลี่ยนไฟล์ PDF หรือย้ายโฟลเดอร์ ให้ตั้งค่า `PDF_SOURCE_DIR` แล้วรัน:

```bash
python scripts/extract-pdf-corpus.py
python scripts/build-curated-study-bank.py
```

คำสั่งที่สองจะวิเคราะห์ครบทั้ง 673 หน้า แล้วสร้าง `content/curated-study-bank.json` โดยซ่อมอักขระจาก PDF จัดหมวดหัวข้อ สร้างเนื้อหาอ่าน/การ์ด Recall/ข้อสอบตรวจความเข้าใจจากทุกหน้าสาระ ตัดเฉพาะข้อความหน้าปก สารบัญ โฆษณา และลิขสิทธิ์ที่ไม่ใช่เนื้อหาสอบ ตัดข้อสอบซ้ำ และเชื่อมเฉลยที่พบในเอกสาร จากนั้น `/learn` และ `/quiz` จะใช้เนื้อหาที่กลั่นแล้วเป็นชุดแรกโดยอัตโนมัติ

หน้า `/learn` และ `/quiz` ใช้เฉพาะเนื้อหาที่ผ่านการกลั่นและจัดหมวดแล้ว ส่วน AI Coach จะค้นบริบทจากการ์ด/ข้อสอบที่กลั่นแล้วก่อนส่งให้ Groq จึงไม่ส่งข้อความ PDF ดิบให้ผู้เรียนเห็น
