# แก้การเชื่อมต่อ MM — ค่าจริงที่ผู้ใช้ยืนยัน

- เว็บไซต์: https://laserpui.github.io/Maintenance-Master-Data/
- origin ที่ Backend อนุญาต: https://laserpui.github.io
- ฐานข้อมูล: https://docs.google.com/spreadsheets/d/1sS6RpP8xzNCGpQ-QnJNvWhcVhYSiw5KYOwgkQYsbsLQ/edit
- Backend /exec คงลิงก์เดิมที่ผู้ใช้ให้มา

## ผลตรวจเว็บจริงก่อนแก้

หน้า GitHub Pages เปิดได้ แต่ยังมี YOUR_SPREADSHEET_ID ใน config และเมื่อ Backend ได้ mm_origin=https://laserpui.github.io จะตอบ “ไม่อนุญาตเว็บไซต์ต้นทาง” จึงเกิด timeout ในภาพ

## โค้ดในเครื่องที่แก้แล้ว

- index.html และ docs/index.html ใส่ URL Google Sheets จริงแล้ว
- app.js และ docs/app.js ตรวจ placeholder ก่อนเชื่อม และข้อความ timeout ไม่อ้างถึงไฟล์ bridge ที่เลิกแยกแล้ว
- google-apps-script.js ฝัง Spreadsheet ID เป็นค่าเริ่มต้นฝั่ง server และอนุญาตเฉพาะ origin ที่ผู้ใช้ระบุ รวมกับค่าที่ admin กำหนดเพิ่มใน Script Properties ไม่มี wildcard และไม่อนุญาต file origin null
- Code.gs เป็นสำเนา Backend เดียวกันสำหรับนำไปวางใน Apps Script เลือกติดตั้งเพียงหนึ่งไฟล์ อย่าวางทั้ง Code.gs และ google-apps-script.js ซ้ำในโปรเจกต์เดียว

## ขั้นตอนที่ต้องทำบนระบบออนไลน์

1. ใน Apps Script เปิดไฟล์ Code.gs (หรือไฟล์ “รหัส”) แล้วแทนเนื้อหาด้วย Code.gs รุ่นที่ส่งให้ บันทึก
2. Project Settings → Script Properties: ถ้ามี ALLOWED_SPREADSHEET_ID อยู่แล้ว ต้องเป็น 1sS6RpP8xzNCGpQ-QnJNvWhcVhYSiw5KYOwgkQYsbsLQ หากยังไม่มี โค้ดจะใช้ค่าเดียวกันที่ฝังไว้ ไม่ต้องสร้าง Sheet ใหม่
3. ADMIN_EMAILS ต้องเป็นบัญชี admin จริงสำหรับ Setup Database หากยังไม่ได้ตั้งให้เพิ่ม อีเมลหลายบัญชีคั่น comma
4. ALLOWED_FRONTEND_ORIGINS แนะนำให้ตั้ง https://laserpui.github.io โดยไม่มี path หรือ / ปิดท้าย โค้ดรุ่นนี้อนุญาต origin นี้โดยตรงแล้ว
5. Deploy → Manage deployments → แก้ deployment เดิม → New version → Deploy เพื่อให้ /exec เดิมใช้โค้ดใหม่ การ Save อย่างเดียวไม่อัปเดตเวอร์ชัน /exec
6. อัปโหลดไฟล์หน้าเว็บ index.html และ app.js ที่อัปเดตแล้วไปยังโฟลเดอร์ที่ repository ใช้เผยแพร่จริง (ถ้าใช้ /docs ให้อัปโหลด docs/index.html และ docs/app.js)
7. รอ Pages deployment สำเร็จ กด Ctrl+F5 แล้วเปิดการเชื่อมต่อ Google และลองเชื่อมต่อใหม่
8. ตรวจสิทธิ์: Execute as user accessing, จำกัดผู้ใช้ตามองค์กร, Google Sheet เป็น Restricted ผู้บันทึกมี Editor ไม่เปิด anonymous เพื่อให้เชื่อมได้
9. เมื่อเชื่อมสำเร็จ จึงกด Setup Database ด้วย admin สร้าง headers เท่านั้น ไม่สร้างข้อมูลตัวอย่าง

การแก้ครั้งนี้เป็นไฟล์ในเครื่อง ยังไม่ได้แก้ Script Properties หรือ redeploy ระบบ Google/GitHub ออนไลน์แทนผู้ใช้ และไม่มีการอ่านหรือเขียนข้อมูลลูกค้า
