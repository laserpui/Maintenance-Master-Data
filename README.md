# Maintenance Management (MM) — GitHub Pages

โครงสร้างปัจจุบันตามชื่อไฟล์ที่ผู้ใช้ต้องการ:

| ไฟล์ | หน้าที่ |
|---|---|
| `google-apps-script.js` | Backend ทั้งหมด รวมตัวเชื่อมข้อมูล: นำเนื้อหาไปวางใน Apps Script server file |
| `app.js` | JavaScript หน้าเว็บทั้งหมด รวมการเชื่อม Backend |
| `index.html` | HTML/CSS และ URL ตั้งค่า เรียกโหลด app.js |
| `appsscript.json` | Manifest สำหรับ Apps Script |
| `docs/index.html`, `docs/app.js` | ชุดหน้าเว็บที่ GitHub Pages เผยแพร่ |

ไม่ต้องใช้ Code.gs, transport.js หรือ bridge.html แยกในชุด source นี้แล้ว เมื่อวาง google-apps-script.js ลง Apps Script editor จะเป็นไฟล์ Script (.gs) ได้ตามรูปแบบของ editor อย่าเพิ่มเนื้อหาซ้ำกับ Backend เดิม

วิธีติดตั้งครบทุกขั้นตอน: [GITHUB_PAGES_SETUP.md](GITHUB_PAGES_SETUP.md)

- Google Sheets เป็นฐานข้อมูล Apps Script เป็น Backend หน้าเว็บอยู่บน GitHub Pages
- ตั้ง URL ของ Sheet และ Backend ที่ window.MM_CONFIG ใน index.html
- ตั้ง ALLOWED_SPREADSHEET_ID, ADMIN_EMAILS และ ALLOWED_FRONTEND_ORIGINS ใน Script Properties
- คัดลอก index.html และ app.js จาก root ไป docs/ หลังแก้ source
- ตั้ง Pages ให้ deploy docs/ หรือใช้ workflow ที่ให้ไว้
- คง schema 5 ชีต, Business Rules, History, Operation ID, revision และการตรวจสิทธิ์เดิม
- ไม่มี API Key ไม่มีการ Import/seed ข้อมูลจริง ไม่มีการเปลี่ยนข้อมูล production

ทดสอบในเครื่อง:

```powershell
node .\tests\run.cjs
node .\tests\pages.cjs
```

ผลล่าสุด 37 + 10 = 47 กรณีผ่านใน simulation ไม่ใช่การรับรองการเชื่อม Google จริง

ยังรอ repository เป้าหมายและ URL ของ Google Sheets ที่ผู้ใช้ยืนยัน จึงยังไม่ได้เผยแพร่ Pages หรือ redeploy Apps Script จริง ดูข้อจำกัดและผลทดสอบใน [TEST_REPORT.md](TEST_REPORT.md)


## แก้การเชื่อมต่อด้วยค่าจริง

ใส่ URL Sheet ที่ผู้ใช้ยืนยันแล้ว ดู [CONNECTION_FIX.md](CONNECTION_FIX.md) ไฟล์ Code.gs เป็นสำเนา google-apps-script.js สำหรับติดตั้ง เลือกวางเพียงชุดเดียวใน Apps Script


## การแก้ไขข้อมูลเดิม

Machine Data มีปุ่มแก้ไขข้อมูลโดยตรง รายละเอียดเครื่องมีปุ่มแก้ไขสัญญาและรายการ PM ทุกเดือน รวมทั้งงานที่ปิดแล้ว รายงานแต่ละรายการมีปุ่มแก้ไขงาน PM ค่าตั้งต้นแก้จาก Settings การแก้สัญญาต้องยืนยัน Preview และระบุเหตุผล ทุกครั้งคง IDs/ลำดับรอบและบันทึก History; รอบที่มีการดำเนินงานแล้วใช้วันนัดสำหรับเลื่อนงาน ไม่แก้วันกำหนดเดิมหรือลบประวัติ

เผยแพร่ Backend เวอร์ชัน 3 วันที่ 27 พฤศจิกายน 2569 แล้ว ตามสิทธิ์ที่ผู้ใช้อนุมัติ: ดำเนินการในฐานะผู้ใช้ที่เข้าถึงเว็บแอป และเข้าถึงได้เฉพาะฉันเท่านั้น (บัญชี puisena88@gmail.com) ตรวจจาก GitHub Pages แล้วเชื่อมต่อฐานข้อมูลจริงได้ ข้อมูลเครื่องเดิม 4 รายการแสดงครบโดยไม่มีการแก้ไขข้อมูลระหว่างตรวจ


## รุ่นปรับรายงานและประสิทธิภาพ — 27 พฤศจิกายน 2569

Backend เวอร์ชัน 4 เผยแพร่แล้ว ลดการอ่านทั้งฐานซ้ำขณะบันทึกและคืนข้อมูลหน้าจอในผลตอบกลับเดียว จึงตัดการเรียกโหลดใหม่หลังบันทึกปกติ โดยคง lock, revision, journal และ recovery เพิ่ม Export CSV (UTF-8 BOM) ที่ Machine Data, Maintenance, Dashboard และ Monthly Report; รายการเครื่อง/PM ส่งออกตามคำค้นและตัวกรอง ส่วนรายงานส่งออกตาม Preview รองรับ comma, quote, newline และป้องกันสูตรจากข้อความ CSV

เพิ่ม Reset เพื่อล้างคำค้นและตัวกรอง เอาข้อความเตือนหลายรอบเปิดออก รายงาน TXT/Preview/Copy ไม่เติม [Package] และ (เอกสารแนบ) แต่คงค่าทั้งสองในฐานข้อมูล เลือกเฉพาะรอบเปิดลำดับแรกต่อเครื่องและสัญญาในเดือนที่มีรอบกำหนดเดิมจริง ไม่สร้างรอบหรือขยับวันเดิม เมื่อปิดรอบแรกจึงแสดงรอบเปิดถัดไป โดยใช้ตัวกรองรวมงานค้าง/Demo/ครั้งสุดท้ายเดิม

ทดสอบ regression 37/37, adapter 12/12, editing 8/8 และ release tests ผ่าน (เดือน 1/4/7/10, ข้ามเดือนว่าง, ปิด 2/4 แล้วแสดง 3/4, ค่าธง/วันแผนไม่เปลี่ยน, snapshot หลังบันทึกเท่ากับอ่านใหม่ และ CSV escaping) เป็นการทดสอบฐานจำลอง ไม่ได้จับเวลาเขียนข้อมูลจริงก่อน/หลัง
