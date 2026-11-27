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

## ผลตรวจและแก้การเชื่อมต่อจากเว็บจริง

- เว็บไซต์ https://laserpui.github.io/Maintenance-Master-Data/ ตอบ HTTP 200 แต่ยังใช้ placeholder ของ Sheet
- ตรวจ Backend ด้วย origin ของเว็บไซต์จริง: ตอบ “ไม่อนุญาตเว็บไซต์ต้นทาง” เป็นสาเหตุที่ bridge ไม่ตอบ ready
- ใส่ Sheet ID ที่ผู้ใช้ยืนยันแล้วใน root/docs index และ Backend defaults กำหนด exact origin เป็น https://laserpui.github.io
- เตรียม Code.gs สำเนา Backend สำหรับติดตั้ง ตรวจตรงกับ google-apps-script.js
- Regression ผ่าน 37/37 + adapter/config tests 12/12 รวม 49 กรณีใน simulation
- ยังไม่ได้อ่าน/เขียนข้อมูลใน Google Sheets จริง และยังไม่ได้แก้ Script Properties หรือ redeploy Apps Script
- พยายาม push ไป repository เดิม แต่ automatic approval review ปฏิเสธการเผยแพร่โค้ด/Spreadsheet ID จึงยังไม่อัปเดต GitHub และต้องรอผู้ใช้ยืนยัน

## ตรวจการติดตั้งจริง — 26 พฤศจิกายน 2569

ผู้ใช้ยืนยันบัญชีผู้ดูแลและอนุมัติ Setup Database แล้ว ตั้ง ADMIN_EMAILS ตามบัญชีที่ผู้ใช้อนุมัติ พร้อม ALLOWED_FRONTEND_ORIGINS=https://laserpui.github.io และ ALLOWED_SPREADSHEET_ID ตามไฟล์ฐานข้อมูลที่ผู้ใช้ระบุ

กด Setup Database จาก GitHub Pages จริงสำเร็จ ตรวจพบ Machines, Contracts, Maintenance, History, Settings ใน Google Sheets และหัวตาราง Machines ตรงตาม schema หน้าเว็บแสดง “เชื่อมต่อฐานข้อมูลแล้ว” และ Dashboard ทุกตัวนับเป็น 0 / ยังไม่มีข้อมูลเครื่อง ไม่มีการเพิ่มข้อมูลตัวอย่างหรือทดสอบงานเขียนเครื่อง/สัญญา/PM ในฐานข้อมูลจริง

การแก้ครั้งนี้ใช้ Script Properties ที่ deployment เดิมอ่านได้ทันที จึงไม่จำเป็นต้อง redeploy เพื่อแก้การเชื่อมต่อ ส่วน source defaults ใน repository มีไว้สำหรับติดตั้งครั้งใหม่ การทดสอบเพิ่ม/แก้ข้อมูลจริง สองบัญชีพร้อมกัน และสิทธิ์ Viewer ยังคงเป็นการตรวจที่ต้องทำแยกจากการ Setup นี้


## ช่องกรอกวันที่ DD/MM/YYYY

ปรับช่องวันที่เครื่อง สัญญา วันนัด วันทำจริง และ Preview PM ให้แสดง/รับ DD/MM/YYYY (ค.ศ.) เช่น 26/11/2026 พร้อมปุ่มปฏิทิน แปลงเป็น ISO ก่อนส่ง Backend โดยไม่แก้ schema หรือข้อมูลเดิม ทดสอบ parse วันที่จริง/ปีอธิกสุรทิน/วันที่ผิดผ่าน และทดสอบผ่าน Chrome บนฐานข้อมูลจำลอง: เพิ่มเครื่องพร้อมสัญญาและแก้วันที่ใน Preview, เปิดกลับแก้ไข, เลือกจากปฏิทิน, บันทึก COMPLETED, ปฏิเสธวันทำจริงในอนาคต ไม่มีการเพิ่มข้อมูลตัวอย่างลง Google Sheets จริง


## แก้ไขสัญญาและข้อมูลเดิม — 27 พฤศจิกายน 2569

Backend เพิ่มโหมดแก้สัญญาโดยตรวจเหตุผลและการยืนยันผลกระทบ เก็บ contract_id/pm_id และเลขรอบเดิม รอบที่มีประวัติการดำเนินงานเก็บวันกำหนดเดิมไว้ ใช้วันนัดใน Maintenance สำหรับการเลื่อนงาน ป้องกันการลบรอบเดิมและตรวจ revision/overlap เหมือนเดิม Regression 37 กรณีและ contract editing 8 กรณีผ่านใน simulation ไม่มีการแก้ไขหรือสร้างข้อมูล production ในการทดสอบ


## สถานะส่งต่อวันที่ 27 พฤศจิกายน 2569

Contract editing 8/8 และ adapter/config 12/12 ผ่าน ตรวจ source ที่วางใน Apps Script ตรงกับ source ที่ทดสอบ ผู้ใช้อนุมัติการเปลี่ยน execution/access แล้ว เผยแพร่ Backend เวอร์ชัน 3 สำเร็จ วันที่ 27 พฤศจิกายน 2569 เวลา 09:11 และตรวจจาก GitHub Pages ว่าเชื่อมต่อฐานข้อมูลจริงได้ แสดงเครื่องเดิม 4 รายการ การทดสอบบันทึกการแก้ไขทำบน local memory-only database ไม่มีการแก้ไขข้อมูลลูกค้าจริงระหว่างตรวจออนไลน์


## รุ่นปรับรายงานและประสิทธิภาพ — 27 พฤศจิกายน 2569

Backend เวอร์ชัน 4 เผยแพร่แล้ว ลดการอ่านทั้งฐานซ้ำขณะบันทึกและคืนข้อมูลหน้าจอในผลตอบกลับเดียว จึงตัดการเรียกโหลดใหม่หลังบันทึกปกติ โดยคง lock, revision, journal และ recovery เพิ่ม Export CSV (UTF-8 BOM) ที่ Machine Data, Maintenance, Dashboard และ Monthly Report; รายการเครื่อง/PM ส่งออกตามคำค้นและตัวกรอง ส่วนรายงานส่งออกตาม Preview รองรับ comma, quote, newline และป้องกันสูตรจากข้อความ CSV

เพิ่ม Reset เพื่อล้างคำค้นและตัวกรอง เอาข้อความเตือนหลายรอบเปิดออก รายงาน TXT/Preview/Copy ไม่เติม [Package] และ (เอกสารแนบ) แต่คงค่าทั้งสองในฐานข้อมูล เลือกเฉพาะรอบเปิดลำดับแรกต่อเครื่องและสัญญาในเดือนที่มีรอบกำหนดเดิมจริง ไม่สร้างรอบหรือขยับวันเดิม เมื่อปิดรอบแรกจึงแสดงรอบเปิดถัดไป โดยใช้ตัวกรองรวมงานค้าง/Demo/ครั้งสุดท้ายเดิม

ทดสอบ regression 37/37, adapter 12/12, editing 8/8 และ release tests ผ่าน (เดือน 1/4/7/10, ข้ามเดือนว่าง, ปิด 2/4 แล้วแสดง 3/4, ค่าธง/วันแผนไม่เปลี่ยน, snapshot หลังบันทึกเท่ากับอ่านใหม่ และ CSV escaping) เป็นการทดสอบฐานจำลอง ไม่ได้จับเวลาเขียนข้อมูลจริงก่อน/หลัง


## รายงานต่อเนื่องข้ามปี — 27 พฤศจิกายน 2569
นำจำนวนรายการ ข้อความอธิบาย และรายการพร้อมปุ่มแก้ไขเหนือ Preview ออก โดยคงข้อมูล items ในผลรายงานเพื่อส่งออก CSV กติกางานค้างอ้างอิงเดือนของปีจากวันแผนเดิมของแต่ละเครื่อง/สัญญา จึงแสดงรอบเปิดแรกเดิมต่อเนื่องข้ามปีจนปิด ไม่แก้ Job เลขครั้งหรือวันแผน ทดสอบ regression 37/37, adapter 12/12, release และ report-next ผ่าน รวมการสร้าง Preview คัดลอก สร้าง TXT และการปิดรอบแล้วเปลี่ยนเป็นรอบถัดไปในฐานจำลอง
