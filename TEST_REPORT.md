# ผลทดสอบ MM v2.0

วันที่: 26 พฤศจิกายน 2569 (Asia/Bangkok)

## ผลที่ตรวจแล้ว

- Node.js Apps Script service simulation: **37/37 ผ่าน** (`node tests/run.cjs`)
- JavaScript syntax ของ Code.gs และ script ใน index.html: ผ่าน
- Browser: Chrome บนเครื่องผู้ใช้ เปิด test server ที่ localhost ใช้ฐานข้อมูลในหน่วยความจำเท่านั้น
- Desktop: Dashboard เริ่มต้น 0 / empty state, เพิ่มเครื่องพร้อมประกันและ Preview 4 รอบ, บันทึกสำเร็จและนับงานค้างจริง
- ทดสอบเริ่ม 31 ม.ค.: Preview 30 เม.ย., 31 ก.ค., 31 ต.ค., 31 ม.ค. ของปีถัดไป ไม่คลาดสะสม
- Mobile 390 × 844: เมนูย่อ, ค้นหา S/N 000001, เปิดฟอร์ม PM และบันทึก COMPLETED พร้อมวันทำจริง/Job ได้
- Mobile 320 × 760 (รอบสุดท้าย): เพิ่มเครื่องโดยไม่มีแผนสำเร็จ สร้าง 0 รอบ; document และ dialog ไม่มี horizontal overflow
- Tablet 820 × 1180: report layout อ่านได้ และ document ไม่มี horizontal overflow (ตาราง PM เลื่อนภายใน container ได้)
- Monthly Report: สร้าง Preview จากงานเปิด 2 รอบ แยกงานค้างและแสดงรูปแบบภาษาไทย/กลุ่ม/ครั้งที่ตามข้อมูล
- Browser error log ที่ตรวจ: ไม่มี JavaScript errors
- ทดสอบทั้งหมดไม่มีการสร้าง Spreadsheet จริง และไม่อ่าน/เขียนข้อมูล production

## การครอบคลุม Acceptance Tests

| ID | ผล local / browser | สิ่งที่ต้องตรวจบน Google จริง |
|---|---|---|
| T01–T03 | ผ่าน simulation: setup 5 ชีตเปล่า, setup ซ้ำ, schema mismatch, URL allowlist | Setup บน Spreadsheet ทดสอบและ URL placeholder |
| T04 | ผ่าน simulation: viewer เขียนไม่ได้ / ผู้ไม่มีสิทธิ์อ่านไม่ได้ | Google Viewer/Editor, domain access, OAuth, user execution |
| T05–T16 | ผ่าน simulation: เครื่อง/สัญญา, zero prefix, 1–4 PM/ปี, หลายปี, custom, EDATE, validation, ต่อสัญญา | กรอกผ่าน Web App จริงและตรวจค่าที่ Sheets เก็บ |
| T17–T23 | ผ่าน simulation: due date server, งานค้าง, เลื่อนนัด, ปิดผล, NOT_REQUIRED, Job, ย้ายเครื่องและ History | timezone, สีและข้อมูลหลัง reload จาก Google |
| T24–T28 | ผ่าน simulation: current/future report, carry/Demo, TXT template/CRLF, export read-only; browser ตรวจ Preview | ดาวน์โหลด TXT จาก Apps Script จริง เปิดด้วย Notepad และตรวจข้อมูลที่ผู้ใช้กรอก |
| T29 | ผ่าน simulation: idempotency, stale revision, lock contention | เปิด Web App ด้วย 2 บัญชีบันทึกชนกันจริง |
| T30 | ผ่าน simulation: Inject failure ที่ Maintenance หลังเครื่อง/สัญญาเขียนแล้ว, ไม่แจ้งสำเร็จ, journal ค้าง, block งานใหม่, reconcile ไม่ซ้ำ | ทำในสำเนาทดสอบเท่านั้น เช่นจำกัดสิทธิ์แท็บและแก้กลับ แล้วกู้คืน |
| T31 | ผ่าน simulation: formula prefix เป็น literal, escape DOM / textContent; syntax ผ่าน | ลอง =1+1, +, @, HTML และเลขศูนย์ใน Sheet ทดสอบจริง |
| T32 | ผ่าน browser ที่ 390 px: ค้นหาและบันทึก PM; desktop เพิ่มเครื่อง; tablet report | Safari/Chrome บนอุปกรณ์จริงและ Apps Script iframe โดยเฉพาะ date picker / ดาวน์โหลด |

เพิ่มเติม EX01–EX06: ขยายสัญญาโดยคง IDs/วัน/เลขรอบและอัปเดต total, ยืนยันแก้ผลปลายทาง, Settings stale timestamp, admin/identity guard, default Jan31 anchor, S/N ซ้ำพร้อมการยืนยัน — ผ่านทั้งหมด

## ขอบเขตที่ยังไม่ผ่านการรับรองจริง

**ยังไม่ใช่การผ่าน UAT บน Google Sheets จริง** เพราะยังไม่มี URL / deployment / บัญชีทดสอบ Google ของบริษัท ไม่มีการอ้างว่าผ่าน production T01–T32 ทั้งหมด แบบจำลองไม่สามารถรับรอง OAuth, permissions, Apps Script quota, พฤติกรรมการเก็บข้อความจริงใน Sheets หรือการรันพร้อมกันบนบริการ Google

## Checklist ติดตั้งบนฐานข้อมูลทดสอบแยก

1. สร้าง Spreadsheet ทดสอบใหม่ ตั้ง URL/ID/admin และ Deploy แบบ USER_ACCESSING โดยจำกัดองค์กร
2. Setup ตรวจ 5 headers และศูนย์แถวทุกชีต Dashboard 0
3. ทดสอบ T01–T32 ตามตารางใน SRS ด้วยข้อมูลสมมติของผู้ทดสอบ **เฉพาะไฟล์ทดสอบ**
4. ใช้บัญชี Viewer, Editor และบัญชีที่ไม่แชร์แยกกัน ตรวจ T04 และ T29 จริง
5. สำรองก่อนทดลอง partial failure T30 ห้ามทดลองใน production
6. เปิด TXT บน Windows ตรวจภาษาไทย, CRLF, leading zeros, Job, PO/QT และรอบสุดท้าย
7. ทดสอบโทรศัพท์/แท็บเล็ตจริงแล้วลงนามผล UAT ของบริษัท
8. ตั้ง production เป็น Spreadsheet ใหม่ว่างอีกไฟล์ เปลี่ยน URL/ID ให้ตรง และ Setup headers เท่านั้น ไม่คัดลอกข้อมูลทดสอบ

ผลอัตโนมัติรายกรณีอยู่ที่ `tests/results.json` รันใหม่ได้โดยไม่ติดตั้ง package และไม่เข้าถึง Google


## อัปเดตสถาปัตยกรรม GitHub Pages — 26 พ.ย. 2569

ตามคำขอผู้ใช้ Frontend เปลี่ยนเป็น static `docs/index.html` + `docs/transport.js` Backend เพิ่ม `bridge.html` สำหรับช่องสื่อสารที่ตรวจ origin ไม่ใช่การฝัง UI เดิม ไม่มีการเปลี่ยน schema หรือ Business Rules

- ชุด regression เดิม: 37/37 ผ่านหลังปรับสถาปัตยกรรม
- ชุด adapter ใหม่ (`node tests/pages.cjs`): 10/10 ผ่านใน VM simulation
- ตรวจ syntax ของ frontend/transport/bridge template และ backend ผ่าน พร้อมตรวจ source ใน docs ตรงกับ root
- ครอบคลุม channel handshake, method allowlist ทั้ง client/server, origin/source/channel ผิดถูกปฏิเสธ, Sheet allowlist, Viewer write rejection, timeout/reconnect, retry และ reconcile ผ่านช่องสื่อสารใหม่
- ผล browser QA ด้านบนเป็นผลรุ่นก่อนเปลี่ยน transport **ยังไม่ได้ทดสอบ browser cross-origin ของรุ่น GitHub Pages กับ Google จริง**
- ยังไม่เผยแพร่ Pages เพราะรอ repository เป้าหมายและ URL Google Sheets ที่ผู้ใช้ยืนยัน
- ยังไม่ได้แก้ Apps Script ออนไลน์ / redeploy / ตั้งค่า origin หรือ Setup ฐานข้อมูลจริง
- ต้องทดสอบ Google OAuth, third-party cookie policy และ nested Apps Script iframe บน Pages จริงก่อนยืนยันว่าพร้อมใช้งานจริง หากพบว่า Google ปิดกั้น iframe ต้องประเมินวิธีเชื่อมต่อที่ยืนยันตัวตนได้ใหม่ ห้ามลดสิทธิ์เป็น anonymous เพื่อให้ผ่าน


## จัดไฟล์ JavaScript ตามคำขอผู้ใช้

- Backend เป็น google-apps-script.js โดยรวม HTML adapter ใน bridgePage_() ไม่ต้องติดตั้ง bridge.html แยก
- Frontend รวมไว้ใน app.js; index.html เก็บ HTML/CSS และ window.MM_CONFIG
- Source ที่ docs/ ตรงกับ root; ชุดทดสอบอัปเดตให้อ่านไฟล์ใหม่
- รัน regression หลังจัดไฟล์: 37/37 และ adapter tests 10/10 ผ่าน รวม 47 กรณี
- เป็นการจัดโครงสร้างไฟล์ ไม่เปลี่ยน Business Rules/schema หรือ deploy ออนไลน์


## แก้การเชื่อมต่อด้วย URL ที่ยืนยันแล้ว

ตรวจเว็บจริงพบ Backend ปฏิเสธ origin และหน้าเว็บยังใช้ placeholder จึงตั้ง Sheet ID และ whitelist ของ https://laserpui.github.io ใน source เพิ่ม regression ค่าตั้งต้น 2 กรณี ผล 37 + 12 = 49 กรณีผ่านใน simulation ยังไม่ได้ redeploy Apps Script หรือทดสอบข้อมูลจริง


## ช่องกรอกวันที่ DD/MM/YYYY

ปรับช่องวันที่เครื่อง สัญญา วันนัด วันทำจริง และ Preview PM ให้แสดง/รับ DD/MM/YYYY (ค.ศ.) เช่น 26/11/2026 พร้อมปุ่มปฏิทิน แปลงเป็น ISO ก่อนส่ง Backend โดยไม่แก้ schema หรือข้อมูลเดิม ทดสอบ parse วันที่จริง/ปีอธิกสุรทิน/วันที่ผิดผ่าน และทดสอบผ่าน Chrome บนฐานข้อมูลจำลอง: เพิ่มเครื่องพร้อมสัญญาและแก้วันที่ใน Preview, เปิดกลับแก้ไข, เลือกจากปฏิทิน, บันทึก COMPLETED, ปฏิเสธวันทำจริงในอนาคต ไม่มีการเพิ่มข้อมูลตัวอย่างลง Google Sheets จริง
