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
