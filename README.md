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
