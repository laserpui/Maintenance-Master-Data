# MM บน GitHub Pages — วิธีติดตั้งฉบับปัจจุบัน

เอกสารนี้ใช้แทนขั้นตอนโฮสต์หน้าเว็บผ่าน Apps Script ใน README เดิม ตามคำขอเปลี่ยนมาใช้ GitHub Pages เมื่อ 26 พ.ย. 2569

## สถาปัตยกรรม

หน้า Dashboard, Machine Data, Maintenance, Monthly Report และ Settings รันจาก GitHub Pages ทั้งหมด โค้ดหน้าเว็บอยู่ใน `docs/index.html` และ `docs/app.js` ไม่มี Google Apps Script server code อยู่ใน Pages artifact

Apps Script ทำหน้าที่ Backend และตัวเชื่อมข้อมูลขนาดเล็ก (รวมไว้ภายใน `google-apps-script.js`) ใน iframe ที่มองไม่เห็น ไม่ได้ฝังหน้า Dashboard หรือฟอร์มจาก Apps Script ตัวเชื่อมตรวจ origin ที่ผู้ดูแลกำหนด + ช่องสื่อสารสุ่มต่อการเปิดหน้า และส่งต่อเฉพาะคำสั่งที่อนุญาตไปยัง server functions เดิม โดยคง Google user execution, Spreadsheet allowlist, revision, operation ID และ History

ไม่ใช้ API Key ไม่เก็บ OAuth token ใน localStorage ไม่เปิด Sheet เป็นสาธารณะ และไม่มี anonymous JSONP/REST write endpoint ไม่ใช้ `fetch(..., {mode:'no-cors'})` เพื่ออ้างว่าบันทึกสำเร็จ

Google บังคับสิทธิ์ของ Web App ที่ฝังอยู่เหมือนเดิม บัญชีที่ยังไม่เคยอนุญาตอาจต้องเปิดลิงก์ “เปิดการเชื่อมต่อ Google” ก่อน แล้วกลับมากด “ลองเชื่อมต่อใหม่” การทำงานของ iframe ที่ต้องยืนยันบัญชียังต้องตรวจบน deployment จริง โดยเฉพาะ browser ที่ปิด third-party cookies

อ้างอิง [Google: Embedded Web Apps และสิทธิ์](https://developers.google.com/apps-script/guides/web), [HtmlService framing](https://developers.google.com/apps-script/reference/html/x-frame-options-mode)

## สิ่งที่ยังต้องระบุก่อนเผยแพร่จริง

1. URL ของ GitHub repository เป้าหมาย หรือบัญชี GitHub + ชื่อ repository ใหม่
2. URL ของ Google Sheets ฐานข้อมูล MM จริง
3. บัญชี admin ของ Apps Script และการเข้าถึงโปรเจกต์เพื่ออัปเดต source / deployment

ลิงก์ Backend ที่ผู้ใช้ให้มาถูกฝังไว้ใน `APPS_SCRIPT_URL` แล้ว:

https://script.google.com/macros/s/AKfycbyp8ie5yR6mPumkfC5NFi61cljGsQ0yo4L9V8eOSA5tw_6aw5cmlzipcS9u0QLvTq3ikA/exec

แต่ URL นี้ไม่ใช่ URL ของ Spreadsheet และ source ที่ deploy อยู่ยังไม่ได้รับการอัปเดตโดยงานนี้

## 1. ตั้งค่า Frontend
ฉันอยากทำเป็นไฟล์

google-apps-script.js
app.js
1. ใส่ URL ของ Google Sheets จริงใน `window.MM_CONFIG.googleSheetUrl` ของไฟล์ `index.html` ที่ root
2. ตรวจ `window.MM_CONFIG.appsScriptUrl` ให้ตรงกับ deployment Backend
3. คัดลอก `index.html` และ `app.js` ไปแทนไฟล์ชื่อเดียวกันใน `docs/` ทุกครั้งที่แก้ source
4. ไม่ใส่ข้อมูลเครื่องหรือตัวอย่างใน source หรือ repository
5. อัปโหลดโฟลเดอร์ `docs/` และ workflow ไปยัง repository ที่ผู้ใช้ระบุ ไม่อัปโหลดไฟล์ฐานข้อมูลหรือข้อมูลลูกค้า

## 2. อัปเดต Backend ใน Apps Script

ติดตั้งไฟล์เหล่านี้:

- `google-apps-script.js`: ใช้แทน source Backend ปัจจุบัน
- `bridge.html`: สร้างไฟล์ HTML ชื่อ **bridge** (ไม่ใช่ index)
- `appsscript.json`: manifest เดิม V8 / Asia/Bangkok / USER_ACCESSING

ไม่ต้องวาง `index.html` ของหน้าเว็บลง Apps Script แล้ว `doGet()` ใหม่ไม่มีการเรียกไฟล์ index จึงแก้สาเหตุเดิม “ไม่พบไฟล์ HTML ชื่อ index” เมื่ออัปเดต deployment ครบ

ตั้ง Script Properties:

| Property | ค่า |
|---|---|
| `ALLOWED_SPREADSHEET_ID` | ID ของ Sheet จริงที่ตรงกับ GOOGLE_SHEET_URL |
| `ADMIN_EMAILS` | อีเมล admin หลายบัญชีคั่นด้วย comma |
| `ALLOWED_FRONTEND_ORIGINS` | origin ของ GitHub Pages เช่น `https://your-account.github.io` |

ค่า origin ต้องไม่มี path ชื่อ repository ไม่มี `/` ปิดท้าย และห้าม `*` ถ้าใช้ custom domain ให้ใช้ origin ของโดเมนจริง หลาย origin คั่น comma กำหนดเฉพาะเว็บไซต์ที่ควบคุมได้ การอนุญาต origin ของ github.io หมายถึงเชื่อถือทุก repository page ภายใต้บัญชี/hostname เดียวกันตาม same-origin model

Sheet ยังคง Restricted ให้ Editor เฉพาะผู้บันทึก Viewer สำหรับผู้ดู ใช้ Execute as **User accessing the web app** และจำกัดองค์กรตาม SRS ไม่เปลี่ยนเป็น Execute as me / Anyone anonymous เพื่อแก้ปัญหาการเชื่อมต่อ

Deploy → Manage deployments → เลือก deployment เดิม → Edit → New version → Deploy เพื่อรักษา URL `/exec` เดิม ตรวจว่า runtime code มี bridge แล้วก่อนลองหน้า GitHub Pages

## 3. เปิด GitHub Pages

เลือกวิธีใดวิธีหนึ่ง:

### GitHub Actions (มี workflow ให้แล้ว)

- repository → Settings → Pages → Source: **GitHub Actions**
- workflow `.github/workflows/pages.yml` เผยแพร่เฉพาะ `docs/` เมื่อ push เข้า `main`
- หาก repository ใช้ branch ชื่ออื่นให้แก้ชื่อใน workflow ให้ตรง
- ดูผลใน Actions → Publish MM to GitHub Pages แล้วใช้ URL ที่ GitHub ส่งกลับเมื่อ deploy สำเร็จ

### Deploy from a branch

- repository → Settings → Pages → Source: **Deploy from a branch**
- Branch: `main`, Folder: `/docs`
- วิธีนี้ไม่จำเป็นต้องใช้ workflow

อ้างอิง [GitHub Pages custom workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)

## 4. ตรวจหลังเผยแพร่

1. เปิดหน้า GitHub Pages จริง ตรวจว่า 5 เมนูแสดงจากหน้าเว็บนี้
2. ถ้าบัญชียังไม่อนุญาต Google ให้กด เปิดการเชื่อมต่อ Google ทำขั้นตอนบัญชีตามหน้าจอ แล้วกลับมา ลองเชื่อมต่อใหม่
3. Settings → Setup Database ด้วย admin สร้าง 5 headers เท่านั้น ไม่มีข้อมูลตัวอย่าง
4. ตรวจ Dashboard = 0, จำนวนแถวข้อมูลทุกชีต = 0
5. ทดสอบการเพิ่ม/แก้/PM และ T01–T32 บน **Spreadsheet ทดสอบแยก** เท่านั้น ห้าม seed production
6. ตรวจ origin อื่นเรียก bridge ไม่ได้ และ Viewer เขียนไม่ได้จริง
7. ตรวจการใช้งาน desktop/mobile, Cookie policy, OAuth, iframe และสองบัญชีพร้อมกันจริง

## การทดสอบในเครื่อง

```powershell
node .\tests\run.cjs
node .\tests\pages.cjs
```

ชุดแรกตรวจ business logic เดิม ชุดที่สองจำลองช่องสื่อสารข้าม origin, การปฏิเสธข้อความปลอม, สิทธิ์ Google จำลอง, method allowlist และ partial-write recovery ไม่มีการเรียก Google จริง

`tests/browser-server.cjs` ใช้ mock transport ในเครื่องสำหรับตรวจ UI เท่านั้น ไม่รับรองการเชื่อม Google จาก GitHub Pages จริง และห้ามนำไปติดตั้งเป็น backend

## ข้อจำกัดปัจจุบัน

ยังไม่มี repository เป้าหมายและ URL ของ Sheet ที่ผู้ใช้ยืนยัน จึงยังไม่ push / เปิด Pages / แก้ Script Properties / redeploy Backend / Setup ฐานข้อมูลจริง การส่งมอบนี้เป็น source พร้อม workflow และคู่มือ ไม่ใช่เว็บไซต์ที่เผยแพร่สำเร็จแล้ว
