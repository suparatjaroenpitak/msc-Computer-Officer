export type StudyCard = {
  id: string;
  prompt: string;
  answer: string;
  explanation: string;
  source: string;
  difficulty: "easy" | "medium" | "hard";
  sourceId?: string;
  page?: number;
};

export type StudyQuestion = {
  id: string;
  prompt: string;
  options: string[];
  answerIndex: number | null;
  explanation: string;
  source: string;
  sourceId?: string;
  page?: number;
};

export type StudyNote = {
  id: string;
  title: string;
  content: string;
  source: string;
  sourceId?: string;
  page?: number;
};

export type StudyLesson = {
  slug: string;
  title: string;
  summary: string;
  accent: string;
  cards: StudyCard[];
  questions: StudyQuestion[];
  notes?: StudyNote[];
};

export type StudyLessonMeta = {
  slug: string;
  title: string;
  summary: string;
  accent: string;
  cardCount: number;
  questionCount: number;
  noteCount: number;
};

export const studyLessons: StudyLesson[] = [
  {
    slug: "network", title: "ระบบเครือข่ายแบบเข้าใจง่าย", summary: "รู้จักอุปกรณ์ สื่อกลาง OSI และคำถามที่ออกสอบบ่อย", accent: "blue",
    cards: [
      { id: "net-1", prompt: "โปรโตคอลหลักของอินเทอร์เน็ตคืออะไร?", answer: "TCP/IP", explanation: "TCP ช่วยจัดการการส่งข้อมูล ส่วน IP ช่วยระบุปลายทางและเส้นทาง", source: "PDF กรมโรงงานฯ ข้อ 13 + AI เสริม", difficulty: "easy" },
      { id: "net-2", prompt: "อุปกรณ์ใดช่วยเชื่อมผู้ใช้ไร้สายเข้ากับเครือข่าย?", answer: "Access Point", explanation: "Access Point ให้เครื่องไร้สายเข้าถึงเครือข่าย LAN และมักทำงานร่วมกับสวิตช์หรือเราเตอร์", source: "PDF กรมโรงงานฯ ข้อ 15", difficulty: "easy" },
      { id: "net-3", prompt: "Hub ต่างจาก Switch อย่างไร?", answer: "Hub กระจายข้อมูลทุกพอร์ต แต่ Switch เรียนรู้ MAC Address และส่งไปยังพอร์ตที่เหมาะสม", explanation: "จำว่า Hub = กระจาย, Switch = เลือกทาง", source: "PDF กรมโรงงานฯ ข้อ 21 + AI ตรวจทาน", difficulty: "medium" },
      { id: "net-4", prompt: "สื่อกลางใดเร็วและทนต่อสัญญาณรบกวนทางไฟฟ้ามาก?", answer: "สายใยแก้วนำแสง (Fiber Optic)", explanation: "ใช้แสงแทนกระแสไฟฟ้า จึงเร็วและถูกรบกวนจากสนามไฟฟ้าได้ยาก", source: "PDF กรมโรงงานฯ ข้อ 5 และ 9", difficulty: "easy" },
      { id: "net-5", prompt: "จำ OSI 7 ชั้นจากบนลงล่างอย่างไร?", answer: "Application, Presentation, Session, Transport, Network, Data Link, Physical", explanation: "จำเสียงไทย: แอป–พรี–เซส–ทราน–เน็ต–ดาต้า–ฟิสิคัล", source: "AI เสริมจากหัวข้อ Network ใน PDF", difficulty: "medium" },
      { id: "net-6", prompt: "Router ทำหน้าที่หลักอะไร?", answer: "หาเส้นทางและส่งข้อมูลระหว่างเครือข่าย โดยอาศัย IP Address", explanation: "Router = เปลี่ยนเครือข่าย ส่วน Switch = เชื่อมอุปกรณ์ในเครือข่ายเดียวกัน", source: "PDF กรมโรงงานฯ ข้อ 23 + AI เสริม", difficulty: "easy" },
    ],
    questions: [
      { id: "net-q1", prompt: "ข้อใดเป็นโปรโตคอลหลักที่ใช้บนอินเทอร์เน็ต?", options: ["NetBEUI", "IPX/SPX", "TCP/IP", "Bluetooth"], answerIndex: 2, explanation: "TCP/IP เป็นชุดโปรโตคอลพื้นฐานของอินเทอร์เน็ต", source: "PDF กรมโรงงานฯ ข้อ 13" },
      { id: "net-q2", prompt: "อุปกรณ์ใดทำหน้าที่หาเส้นทางระหว่างเครือข่าย?", options: ["Hub", "Router", "Repeater", "Keyboard"], answerIndex: 1, explanation: "Router ใช้ตัดสินใจเส้นทางของแพ็กเก็ตระหว่างเครือข่าย", source: "PDF กรมโรงงานฯ ข้อ 23 + AI ตรวจทาน" },
      { id: "net-q3", prompt: "ข้อใดเป็นสื่อกลางแบบมีสาย?", options: ["คลื่นไมโครเวฟ", "อินฟราเรด", "สายใยแก้วนำแสง", "คลื่นวิทยุ"], answerIndex: 2, explanation: "Fiber Optic เป็นสื่อกลางแบบกำหนดเส้นทางหรือมีสาย", source: "PDF กรมโรงงานฯ ข้อ 7" },
      { id: "net-q4", prompt: "ข้อใดอธิบาย Switch ได้ถูกต้องที่สุด?", options: ["ส่งข้อมูลออกทุกพอร์ตเสมอ", "ส่งข้อมูลโดยอาศัย MAC Address", "แปลงไฟล์เอกสาร", "ใช้แทนจอภาพ"], answerIndex: 1, explanation: "Switch เรียนรู้ MAC Address แล้วเลือกพอร์ตปลายทาง", source: "AI เสริมจาก PDF กรมโรงงานฯ ข้อ 21" },
    ],
  },
  {
    slug: "cyber-law", title: "กฎหมายไซเบอร์และข้อมูลส่วนบุคคล", summary: "แยก Computer Crime, PDPA และ Cybersecurity ให้ไม่สับสน", accent: "violet",
    cards: [
      { id: "law-1", prompt: "CIA Triad ประกอบด้วยอะไร?", answer: "Confidentiality, Integrity, Availability", explanation: "ลับ, ถูกต้องไม่ถูกแก้ไข, พร้อมใช้งาน", source: "AI เสริมจากหมวด Cybersecurity", difficulty: "easy" },
      { id: "law-2", prompt: "PDPA เน้นคุ้มครองสิ่งใด?", answer: "ข้อมูลส่วนบุคคลของบุคคลธรรมดา", explanation: "เวลาประมวลผลต้องคิดถึงวัตถุประสงค์ ฐานทางกฎหมาย สิทธิของเจ้าของข้อมูล และความปลอดภัย", source: "PDF ศาลฯ และสระบุรี หมวด PDPA", difficulty: "medium" },
      { id: "law-3", prompt: "การยืนยันตัวตนต่างจากการกำหนดสิทธิ์อย่างไร?", answer: "Authentication ยืนยันว่าเป็นใคร; Authorization กำหนดว่าทำอะไรได้บ้าง", explanation: "จำว่า AuthN = Name/Who, AuthZ = Permission/What", source: "AI เสริม", difficulty: "medium" },
      { id: "law-4", prompt: "Phishing คืออะไร?", answer: "การหลอกให้เปิดเผยข้อมูลหรือกดลิงก์ โดยปลอมเป็นแหล่งที่น่าเชื่อถือ", explanation: "เป็น Social Engineering ไม่ใช่ไวรัสโดยตัวมันเอง", source: "AI เสริมจากหมวดความมั่นคงปลอดภัย", difficulty: "easy" },
    ],
    questions: [
      { id: "law-q1", prompt: "ข้อใดอยู่ใน CIA Triad?", options: ["Confidentiality", "Compression", "Compilation", "Connection"], answerIndex: 0, explanation: "CIA คือ Confidentiality, Integrity และ Availability", source: "AI เสริม" },
      { id: "law-q2", prompt: "ข้อใดอธิบาย Authorization ได้ถูกต้อง?", options: ["ตรวจว่าเป็นใคร", "กำหนดสิทธิ์หลังจากยืนยันตัวตนแล้ว", "สำรองข้อมูล", "เข้ารหัสไฟล์"], answerIndex: 1, explanation: "Authorization คือการกำหนดสิทธิ์ในการเข้าถึงหรือใช้งาน", source: "AI เสริม" },
      { id: "law-q3", prompt: "PDPA เกี่ยวข้องกับเรื่องใดมากที่สุด?", options: ["การออกแบบ CPU", "การคุ้มครองข้อมูลส่วนบุคคล", "ความเร็วเครือข่าย", "การเขียนโปรแกรม"], answerIndex: 1, explanation: "PDPA คือกฎหมายคุ้มครองข้อมูลส่วนบุคคล", source: "PDF ศาลฯ และสระบุรี หมวด PDPA" },
    ],
  },
  {
    slug: "database", title: "ฐานข้อมูลและ SQL", summary: "จำ Key, Relationship และคำสั่ง SQL ด้วยตัวอย่างใกล้ตัว", accent: "emerald",
    cards: [
      { id: "db-1", prompt: "Primary Key มีหน้าที่อะไร?", answer: "ระบุแถวข้อมูลแต่ละแถวให้ไม่ซ้ำกัน", explanation: "เช่น รหัสนักเรียนหรือรหัสบัตรประชาชน โดยทั่วไปห้ามซ้ำและไม่ควรเป็นค่าว่าง", source: "PDF สระบุรี หมวด Database", difficulty: "easy" },
      { id: "db-2", prompt: "Foreign Key คืออะไร?", answer: "คอลัมน์ที่อ้างอิง Primary Key ของอีกตาราง เพื่อเชื่อมความสัมพันธ์", explanation: "ช่วยรักษาความสอดคล้องของข้อมูลระหว่างตาราง", source: "PDF สระบุรี หมวด Database", difficulty: "medium" },
      { id: "db-3", prompt: "คำสั่ง SQL ใดใช้ดึงข้อมูล?", answer: "SELECT", explanation: "SELECT ใช้ค้นคืนข้อมูล ส่วน INSERT, UPDATE, DELETE ใช้เพิ่ม แก้ไข และลบ", source: "PDF สระบุรี หมวด Database + AI เสริม", difficulty: "easy" },
      { id: "db-4", prompt: "Normalization ช่วยเรื่องใด?", answer: "ลดความซ้ำซ้อนและปัญหาความไม่สอดคล้องของข้อมูล", explanation: "ออกแบบตารางให้แยกข้อมูลเป็นระบบและแก้ไขได้ปลอดภัยขึ้น", source: "PDF สระบุรี หมวด Database", difficulty: "medium" },
    ],
    questions: [
      { id: "db-q1", prompt: "ข้อใดเป็นคำสั่งสำหรับค้นข้อมูล?", options: ["SELECT", "PUSH", "PAINT", "OPEN"], answerIndex: 0, explanation: "SELECT ใช้เลือกหรือค้นข้อมูลจากตาราง", source: "PDF สระบุรี หมวด Database" },
      { id: "db-q2", prompt: "Foreign Key ใช้เพื่ออะไร?", options: ["เข้ารหัสรหัสผ่าน", "เชื่อมความสัมพันธ์ระหว่างตาราง", "เพิ่มความเร็ว CPU", "สร้างระบบปฏิบัติการ"], answerIndex: 1, explanation: "Foreign Key อ้างอิง Primary Key ของตารางอื่น", source: "PDF สระบุรี หมวด Database" },
    ],
  },
  {
    slug: "web-ai-cloud", title: "Web, AI, Cloud และ Big Data", summary: "ภาพรวมเทคโนโลยีที่มักออกสอบเชิงความเข้าใจและอัตนัย", accent: "amber",
    cards: [
      { id: "web-1", prompt: "IaaS, PaaS และ SaaS ต่างกันอย่างไร?", answer: "IaaS ให้โครงสร้างพื้นฐาน, PaaS ให้แพลตฟอร์มพัฒนา, SaaS ให้ซอฟต์แวร์พร้อมใช้", explanation: "จำจากควบคุมมากไปน้อย: IaaS > PaaS > SaaS", source: "PDF สระบุรี หมวด Cloud Computing", difficulty: "medium" },
      { id: "web-2", prompt: "Big Data 5V มีอะไรบ้าง?", answer: "Volume, Velocity, Variety, Veracity, Value", explanation: "ปริมาณ, ความเร็ว, ความหลากหลาย, ความน่าเชื่อถือ, คุณค่า", source: "PDF สระบุรี หมวด Big Data + AI เสริม", difficulty: "medium" },
      { id: "web-3", prompt: "ทำไมต้องมีมนุษย์ตรวจผลลัพธ์ของ Generative AI?", answer: "เพราะ AI อาจสร้างข้อมูลผิดหรือแต่งข้อมูลขึ้นมาได้ จึงต้องตรวจความถูกต้องและความเหมาะสม", explanation: "โดยเฉพาะข้อมูลส่วนบุคคล งานกฎหมาย และการตัดสินใจภาครัฐ", source: "PDF ศาลฯ หมวด AI ในงานคดี + AI เสริม", difficulty: "easy" },
    ],
    questions: [
      { id: "web-q1", prompt: "บริการใดเป็นซอฟต์แวร์พร้อมใช้งานบนคลาวด์?", options: ["IaaS", "PaaS", "SaaS", "BIOS"], answerIndex: 2, explanation: "SaaS คือ Software as a Service ผู้ใช้เปิดใช้งานแอปพร้อมใช้", source: "PDF สระบุรี หมวด Cloud Computing" },
      { id: "web-q2", prompt: "ข้อใดไม่ใช่หนึ่งใน 5V ของ Big Data?", options: ["Volume", "Velocity", "Variety", "Voltage"], answerIndex: 3, explanation: "5V ที่ใช้ทั่วไปคือ Volume, Velocity, Variety, Veracity และ Value", source: "PDF สระบุรี หมวด Big Data + AI เสริม" },
    ],
  },
];

export const allCards = studyLessons.flatMap((lesson) => lesson.cards);
export const allQuestions = studyLessons.flatMap((lesson) => lesson.questions);
