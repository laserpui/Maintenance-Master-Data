/** Maintenance Management v2.0 — Google Apps Script V8. */
// Installation defaults confirmed by the user. No database rows are created here.
const MM_DEPLOYMENT = Object.freeze({
 spreadsheetId: '1sS6RpP8xzNCGpQ-QnJNvWhcVhYSiw5KYOwgkQYsbsLQ',
 frontendOrigins: ['https://laserpui.github.io']
});

const SCHEMA = Object.freeze({
  Machines: 'maintenance_code brand model serial_number customer_name site_name phone contact_name service_area customer_type install_date machine_status notes created_at updated_at revision'.split(' '),
  Contracts: 'contract_id maintenance_code contract_type start_date duration_months end_date pm_per_year first_pm_date total_rounds contract_status is_package po_number qt_number notes created_at updated_at revision'.split(' '),
  Maintenance: 'pm_id contract_id maintenance_code round_no round_total original_due_date appointment_date actual_pm_date status job_number reason po_number qt_number is_package has_attachment notes created_at updated_at revision'.split(' '),
  History: 'history_id entity_type entity_id action before_json after_json reason changed_at changed_by operation_id'.split(' '),
  Settings: 'setting_id category value label active sort_order updated_at'.split(' ')
});
const KEYS = {Machines:'maintenance_code', Contracts:'contract_id', Maintenance:'pm_id', Settings:'setting_id'};
const STATUSES = ['UPCOMING','PENDING','COMPLETED','CANCELLED','NOT_REQUIRED'];
const TERMINAL = ['COMPLETED','CANCELLED','NOT_REQUIRED'];
const MONTHS_TH = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
/** Only the transport adapter is hosted by Apps Script. The application UI is on GitHub Pages. */
function doGet(e) {
 const p=e&&e.parameter||{},origin=String(p.mm_origin||''),channel=String(p.mm_channel||'');
 if(!origin&&!channel)return HtmlService.createHtmlOutput('<!doctype html><html lang="th"><meta charset="UTF-8"><title>MM Backend</title><p>MM Backend พร้อมรับการเชื่อมต่อ กรุณาเปิดใช้งานหน้าเว็บจาก GitHub Pages</p></html>');
 if(!allowedFrontendOrigin_(origin)||!/^\w{48}$/.test(channel))throw new Error('ไม่อนุญาตเว็บไซต์ต้นทาง กรุณาตั้ง ALLOWED_FRONTEND_ORIGINS ให้ตรงกับ GitHub Pages');
 return HtmlService.createHtmlOutput(bridgePage_(origin,channel)).setTitle('MM data connection').setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
function allowedFrontendOrigin_(origin) {
 if(!/^https:\/\/[a-z0-9.-]+(?::[0-9]+)?$/i.test(origin))return false;
 const configured=(PropertiesService.getScriptProperties().getProperty('ALLOWED_FRONTEND_ORIGINS')||'').split(',').map(x=>x.trim()).filter(Boolean);
 return MM_DEPLOYMENT.frontendOrigins.concat(configured).includes(origin);
}
function bridgeCall(url,method,payload) {
 const functions={setupDatabase,getAppData,previewSchedule,saveMachine,saveContract,saveMaintenance,saveSetting,getMonthlyReport,retryOperation};
 if(!Object.prototype.hasOwnProperty.call(functions,method))throw new Error('ไม่อนุญาตคำสั่งนี้');
 return functions[method](url,payload);
}
function fail_(message) { throw new Error(message); }
function text_(v, max) { const s = v == null ? '' : String(v).trim(); if (s.length > (max || 3000)) fail_('ข้อความยาวเกินกำหนด'); return s; }
function required_(v, label) { const s=text_(v); if (!s) fail_('กรุณาระบุ '+label); return s; }
function integer_(v,min,max,label) { const n=Number(v); if (!Number.isInteger(n)||n<min||n>max) fail_('ค่า '+label+' ไม่ถูกต้อง'); return n; }
function bool_(v) { return v===true || v==='true'; }
function today_() { return Utilities.formatDate(new Date(),'Asia/Bangkok','yyyy-MM-dd'); }
function timestamp_() { return new Date().toISOString(); }
function uuid_() { return Utilities.getUuid(); }
function date_(s,optional) { s=text_(s); if (!s && optional) return ''; if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) fail_('วันที่ต้องเป็น YYYY-MM-DD'); const d=new Date(s+'T00:00:00Z'); if(isNaN(d)||d.toISOString().slice(0,10)!==s) fail_('วันที่ไม่มีอยู่จริง'); return s; }
function addMonths_(s,n) { date_(s); const [y,m,d]=s.split('-').map(Number); const last=new Date(Date.UTC(y,m-1+n+1,0)); return new Date(Date.UTC(last.getUTCFullYear(),last.getUTCMonth(),Math.min(d,last.getUTCDate()))).toISOString().slice(0,10); }
function effectiveStatus_(p,now) { return p.status==='UPCOMING' && p.original_due_date<=now ? 'PENDING' : p.status; }
function user_() { return Session.getEffectiveUser().getEmail() || 'unknown'; }
function isAdmin_() { return (PropertiesService.getScriptProperties().getProperty('ADMIN_EMAILS')||'').split(',').map(x=>x.trim().toLowerCase()).includes(user_().toLowerCase()) && user_()!=='unknown'; }
function admin_() { if (!isAdmin_()) fail_('ต้องใช้บัญชีผู้ดูแลที่กำหนดใน ADMIN_EMAILS'); }
function openDatabase_(url) {
 const active=Session.getActiveUser().getEmail(), effective=Session.getEffectiveUser().getEmail();
 if(active && effective && active!==effective)fail_('กรุณา deploy แบบ Execute as user accessing the web app');
 const m=/^https:\/\/docs\.google\.com\/spreadsheets\/d\/([A-Za-z0-9_-]+)\/edit(?:[?#].*)?$/.exec(String(url));
 const allowed=PropertiesService.getScriptProperties().getProperty('ALLOWED_SPREADSHEET_ID')||MM_DEPLOYMENT.spreadsheetId;
 if(!m||!allowed||m[1]!==allowed||/YOUR_SPREADSHEET_ID/.test(m[1])) fail_('URL ฐานข้อมูลไม่ถูกต้องหรือยังไม่ได้ตั้งค่า GOOGLE_SHEET_URL / ALLOWED_SPREADSHEET_ID');
 return SpreadsheetApp.openByUrl('https://docs.google.com/spreadsheets/d/'+allowed+'/edit');
}
function writable_(ss) {
 const active=Session.getActiveUser().getEmail(), effective=Session.getEffectiveUser().getEmail();
 if(active && effective && active!==effective) fail_('กรุณา deploy แบบ Execute as user accessing the web app');
 // This edit is authorized by Google as the executing account; viewers cannot pass it.
 ss.setSpreadsheetTimeZone('Asia/Bangkok');
}
function withLock_(fn) { const lock=LockService.getScriptLock(); lock.waitLock(30000); try { return fn(); } finally { lock.releaseLock(); } }
function checkSchema_(ss) {
 Object.keys(SCHEMA).forEach(name=>{const sh=ss.getSheetByName(name); if(!sh) fail_('ยังไม่ได้ Setup Database: '+name); const heads=sh.getRange(1,1,1,Math.max(sh.getLastColumn(),SCHEMA[name].length)).getValues()[0]; if(JSON.stringify(heads)!==JSON.stringify(SCHEMA[name])) fail_('Schema ไม่ตรง: '+name+' — ห้าม reset อัตโนมัติ กรุณาตรวจสอบกับผู้ดูแล'); });
}
function setupDatabase(url) { return withLock_(()=>{const ss=openDatabase_(url); writable_(ss); admin_();
 // Validate existing tabs before making any structural changes.
 Object.keys(SCHEMA).forEach(name=>{const s=ss.getSheetByName(name); if(s&&s.getLastRow()>0){const h=s.getRange(1,1,1,Math.max(s.getLastColumn(),SCHEMA[name].length)).getValues()[0]; if(JSON.stringify(h)!==JSON.stringify(SCHEMA[name])) fail_('Schema ไม่ตรง: '+name);}});
 Object.keys(SCHEMA).forEach(name=>{let s=ss.getSheetByName(name); if(!s){const empty=ss.getSheets().find(x=>x.getLastRow()===0&&!Object.keys(SCHEMA).includes(x.getName())); s=empty ? empty.setName(name) : ss.insertSheet(name);} if(!s.getLastRow()){s.getRange(1,1,1,SCHEMA[name].length).setValues([SCHEMA[name]]); s.setFrozenRows(1);}});
 return {message:'สร้าง 5 ชีตและหัวตารางแล้ว ไม่มีการเพิ่มข้อมูลตัวอย่าง'};
 }); }
function readAll_(ss) { checkSchema_(ss); const data={}; Object.keys(SCHEMA).forEach(name=>{const values=ss.getSheetByName(name).getDataRange().getValues(); data[name]=values.slice(1).filter(row=>row.some(v=>v!=='')).map(row=>Object.fromEntries(SCHEMA[name].map((h,i)=>[h,row[i] instanceof Date ? Utilities.formatDate(row[i],'Asia/Bangkok',h.endsWith('_at')?"yyyy-MM-dd'T'HH:mm:ssXXX":'yyyy-MM-dd') : row[i]]))); }); return data; }
function row_(name,obj) { return SCHEMA[name].map(h=>obj[h]==null?'':obj[h]); }
function safeCell_(v) { return typeof v==='string' && /^[=+@\-\t\r]/.test(v) ? "'"+v : v; }
function writeRows_(ss,name,rows) { if(!rows.length)return; const sh=ss.getSheetByName(name); sh.getRange(sh.getLastRow()+1,1,rows.length,SCHEMA[name].length).setNumberFormat('@').setValues(rows.map(o=>row_(name,o).map(safeCell_))); }
function revision_(old,p) { if(old && Number(old.revision)!==Number(p.revision)) fail_('ข้อมูลถูกแก้ไขโดยผู้อื่น กรุณาโหลดใหม่ก่อนบันทึก'); }
function pending_(d) { const committed=new Set(d.History.filter(h=>h.action==='COMMITTED').map(h=>h.operation_id)); return d.History.filter(h=>h.action==='PREPARED'&&!committed.has(h.operation_id)); }
function applyChanges_(ss,changes) {
 const d=readAll_(ss);
 Object.keys(KEYS).forEach(name=>{
  const key=KEYS[name], append=[],updates=[];
  changes.filter(c=>c.sheet===name).forEach(c=>{
   const i=d[name].findIndex(r=>String(r[key])===String(c.after[key]));
   if(i<0){if(c.before)fail_('ไม่พบแถวสำหรับกู้คืน '+name);append.push(c.after);return;}
   const current=d[name][i];
   if(JSON.stringify(row_(name,current))===JSON.stringify(row_(name,c.after)))return;
   if(!c.before||JSON.stringify(row_(name,current))!==JSON.stringify(row_(name,c.before)))fail_('ข้อมูลเปลี่ยนระหว่างกู้คืน กรุณาให้ผู้ดูแลตรวจ History: '+name);
   updates.push({index:i+2,value:row_(name,c.after).map(safeCell_)});
  });
  updates.sort((a,b)=>a.index-b.index);
  // Batch contiguous updates; contract extensions usually touch one contiguous range.
  for(let i=0;i<updates.length;){const first=updates[i].index,values=[updates[i].value];i++;
   while(i<updates.length&&updates[i].index===first+values.length){values.push(updates[i].value);i++;}
   ss.getSheetByName(name).getRange(first,1,values.length,SCHEMA[name].length).setNumberFormat('@').setValues(values);
  }
  writeRows_(ss,name,append);
 }); SpreadsheetApp.flush();
}
function commit_(ss,operation,changes,reason) {
 const before=JSON.stringify(changes.map(c=>({sheet:c.sheet,value:c.before}))), after=JSON.stringify(changes);
 if(before.length>45000||after.length>45000)fail_('รายการใหญ่เกินขนาด History กรุณาแบ่งการเพิ่มรอบเป็นช่วงเล็กลง');
 writeRows_(ss,'History',[{history_id:uuid_(),entity_type:'OPERATION',entity_id:changes[0].after[KEYS[changes[0].sheet]],action:'PREPARED',before_json:before,after_json:after,reason:text_(reason),changed_at:timestamp_(),changed_by:user_(),operation_id:operation}]);
 SpreadsheetApp.flush();
 try { applyChanges_(ss,changes); writeRows_(ss,'History',[{history_id:uuid_(),entity_type:'OPERATION',entity_id:operation,action:'COMMITTED',before_json:'',after_json:'',reason:'',changed_at:timestamp_(),changed_by:user_(),operation_id:operation}]); SpreadsheetApp.flush(); }
 catch(e){fail_('การบันทึกยังไม่ครบ คง Operation ID '+operation+' ไว้และกดกู้คืน/ลองบันทึกซ้ำ: '+e.message);}
 return {message:'บันทึกสำเร็จ',operation_id:operation,entity_id:changes[0].after[KEYS[changes[0].sheet]],rounds:changes.filter(c=>c.sheet==='Maintenance'&&!c.before).length};
}
function mutate_(url,p,build) {
 return withLock_(()=>{const ss=openDatabase_(url); writable_(ss); const d=readAll_(ss); const op=required_(p.operation_id,'Operation ID'); if(!/^[A-Za-z0-9_-]{8,100}$/.test(op))fail_('Operation ID ไม่ถูกต้อง');
 const done=d.History.find(h=>h.operation_id===op&&h.action==='COMMITTED'); if(done)return {message:'รายการนี้บันทึกครบแล้ว (ไม่สร้างซ้ำ)',operation_id:op};
 const prepared=pending_(d); const same=prepared.find(h=>h.operation_id===op);
 if(same){if(same.changed_by!==user_()&&!isAdmin_())fail_('ให้ผู้ทำรายการเดิมหรือผู้ดูแลกู้คืน'); return reconcile_(ss,same);}
 if(prepared.length) fail_('มีรายการบันทึกไม่ครบ '+prepared[0].operation_id+' กรุณากู้คืนใน Settings ก่อน');
 const changes=build(d); if(!changes.length)fail_('ไม่มีข้อมูลเปลี่ยนแปลง'); return commit_(ss,op,changes,p.change_reason||p.reason||''); });
}
function reconcile_(ss,h) { applyChanges_(ss,JSON.parse(h.after_json)); writeRows_(ss,'History',[{history_id:uuid_(),entity_type:'OPERATION',entity_id:h.operation_id,action:'COMMITTED',before_json:'',after_json:'',reason:'reconciled',changed_at:timestamp_(),changed_by:user_(),operation_id:h.operation_id}]); SpreadsheetApp.flush(); return {message:'กู้คืนรายการครบแล้ว',operation_id:h.operation_id}; }
function retryOperation(url,p) {return mutate_(url,p,()=>fail_('ไม่พบรายการที่รอกู้คืน'));}
function cleanMachine_(p,old,d) {
 const m={}; ['maintenance_code','brand','model','serial_number','customer_name','site_name','phone','contact_name','service_area','customer_type','notes'].forEach(k=>m[k]=text_(p[k]));
 ['maintenance_code','brand','model','serial_number','customer_name','service_area','customer_type'].forEach(k=>required_(m[k],k));
 if(old&&m.maintenance_code!==old.maintenance_code)fail_('เปลี่ยน Maintenance Code ไม่ได้');
 if(!old&&d.Machines.some(x=>x.maintenance_code.toLowerCase()===m.maintenance_code.toLowerCase()))fail_('Maintenance Code ซ้ำ');
 const duplicate=d.Machines.find(x=>x.maintenance_code!==m.maintenance_code&&x.brand.toLowerCase()===m.brand.toLowerCase()&&x.model.toLowerCase()===m.model.toLowerCase()&&x.serial_number.toLowerCase()===m.serial_number.toLowerCase());
 if(duplicate&&!bool_(p.confirm_duplicate_serial))fail_('พบ S/N + Brand + Model ซ้ำกับ '+duplicate.maintenance_code+' กรุณาตรวจและยืนยันก่อนบันทึก');
 m.install_date=date_(p.install_date,true); m.machine_status=p.machine_status||'ACTIVE'; if(!['ACTIVE','INACTIVE'].includes(m.machine_status))fail_('สถานะเครื่องไม่ถูกต้อง');
 return Object.assign(m,{created_at:old?old.created_at:timestamp_(),updated_at:timestamp_(),revision:old?Number(old.revision)+1:1});
}
function generateSchedule_(p) {
 const start=date_(p.start_date), end=date_(p.end_date||addMonths_(start,integer_(p.duration_months,1,600,'ระยะเวลา'))); const per=integer_(p.pm_per_year,1,4,'PM ต่อปี');
 if(start>end)fail_('วันเริ่มต้องไม่เกินวันสิ้นสุด'); const explicit=!!p.first_pm_date, first=explicit?date_(p.first_pm_date):start; const dates=[]; if(explicit && (first<start || first>end))fail_('วัน PM ครั้งแรกต้องอยู่ในช่วงสัญญา');
 for(let i=0;i<600;i++){const s=addMonths_(first,(explicit?i:i+1)*12/per); if(s>end)break; if(s>=start)dates.push(s);} return dates;
}
function previewSchedule(url,p) {openDatabase_(url); const dates=generateSchedule_(p); return {dates,total:dates.length,end_date:p.end_date||addMonths_(p.start_date,Number(p.duration_months))};}
function contractChanges_(p,d,code) {
 const old=p.contract_id?d.Contracts.find(x=>x.contract_id===p.contract_id):null; if(p.contract_id&&!old)fail_('ไม่พบสัญญา'); if(old&&old.maintenance_code!==code)fail_('เครื่องไม่ตรงกับสัญญา'); revision_(old,p);
 const c={contract_id:old?old.contract_id:uuid_(),maintenance_code:code,contract_type:p.contract_type,start_date:date_(p.start_date),duration_months:integer_(p.duration_months,1,600,'ระยะเวลา'),end_date:date_(p.end_date),pm_per_year:integer_(p.pm_per_year,1,4,'PM ต่อปี'),first_pm_date:date_(p.first_pm_date,true),total_rounds:0,contract_status:p.contract_status||'ACTIVE',is_package:bool_(p.is_package),po_number:text_(p.po_number),qt_number:text_(p.qt_number),notes:text_(p.notes),created_at:old?old.created_at:timestamp_(),updated_at:timestamp_(),revision:old?Number(old.revision)+1:1};
 if(!['WARRANTY','PM_CONTRACT','DEMO'].includes(c.contract_type)||!['ACTIVE','CLOSED'].includes(c.contract_status))fail_('ประเภท/สถานะสัญญาไม่ถูกต้อง'); if(c.start_date>c.end_date)fail_('ช่วงสัญญาไม่ถูกต้อง');
 if(!bool_(p.preview_confirmed))fail_('กรุณาตรวจ Preview และยืนยันจำนวนรอบก่อน');
 const dates=(p.dates||[]).map(x=>date_(x)); if(dates.length>120)fail_('เพิ่มได้ไม่เกิน 120 รอบต่อรายการ');
 if(Number(p.total_rounds)!==dates.length)fail_('จำนวนรอบไม่ตรงกับ Preview');
 dates.forEach((s,i)=>{if(s<c.start_date||s>c.end_date||i&&s<=dates[i-1])fail_('รอบ PM ต้องอยู่ในสัญญา เรียงวัน และไม่ซ้ำ');});
 if(d.Contracts.some(x=>x.contract_id!==c.contract_id&&x.maintenance_code===code&&x.contract_status==='ACTIVE'&&c.contract_status==='ACTIVE'&&x.start_date<=c.end_date&&x.end_date>=c.start_date)){admin_(); if(!bool_(p.confirm_overlap)||!text_(p.change_reason))fail_('สัญญาทับซ้อน ต้องให้ผู้ดูแลยืนยันพร้อมเหตุผล');}
 const existing=old?d.Maintenance.filter(x=>x.contract_id===c.contract_id&&x.round_no!=='').sort((a,b)=>Number(a.round_no)-Number(b.round_no)):[];
 // Contract edits are explicit append-only extensions. Existing round numbers/dates remain immutable.
 if(old){if(!bool_(p.confirm_extension)||!text_(p.change_reason))fail_('การแก้สัญญาต้องยืนยันผลกระทบและเหตุผล'); if(c.start_date!==old.start_date||c.end_date<old.end_date||c.contract_type!==old.contract_type)fail_('แก้สัญญาเดิมได้โดยขยายระยะ/เพิ่มรอบเท่านั้น'); if(dates.length<existing.length||existing.some((r,i)=>dates[i]!==r.original_due_date))fail_('ห้ามลบ สลับ หรือเปลี่ยนวันของรอบเดิม ให้เลื่อนนัดที่ Maintenance');}
 c.total_rounds=dates.length;
 const changes=[{sheet:'Contracts',before:old,after:c}];
 existing.forEach(r=>{if(Number(r.round_total)!==dates.length)changes.push({sheet:'Maintenance',before:r,after:Object.assign({},r,{round_total:dates.length,updated_at:timestamp_(),revision:Number(r.revision)+1})});});
 dates.slice(existing.length).forEach((s,i)=>changes.push({sheet:'Maintenance',before:null,after:{pm_id:uuid_(),contract_id:c.contract_id,maintenance_code:code,round_no:existing.length+i+1,round_total:dates.length,original_due_date:s,appointment_date:'',actual_pm_date:'',status:s<=today_()?'PENDING':'UPCOMING',job_number:'',reason:'',po_number:c.po_number,qt_number:c.qt_number,is_package:c.is_package,has_attachment:false,notes:'',created_at:timestamp_(),updated_at:timestamp_(),revision:1}})); return changes;
}
function saveMachine(url,p) { return mutate_(url,p,d=>{const old=p.edit_code?d.Machines.find(x=>x.maintenance_code===p.edit_code):null; if(p.edit_code&&!old)fail_('ไม่พบเครื่อง'); revision_(old,p); const m=cleanMachine_(p,old,d); const changes=[{sheet:'Machines',before:old,after:m}]; if(p.contract){if(old)fail_('กรุณาเพิ่มสัญญาจากรายละเอียดเครื่อง'); changes.push(...contractChanges_(p.contract,d,m.maintenance_code));} return changes;}); }
function saveContract(url,p) {return mutate_(url,p,d=>{if(!d.Machines.some(m=>m.maintenance_code===p.maintenance_code))fail_('ไม่พบเครื่อง'); return contractChanges_(p,d,p.maintenance_code);});}
function saveMaintenance(url,p) {return mutate_(url,p,d=>{const old=d.Maintenance.find(x=>x.pm_id===p.pm_id); if(!old)fail_('ไม่พบรอบ PM'); revision_(old,p);
 if(!d.Machines.some(m=>m.maintenance_code===old.maintenance_code)||!d.Contracts.some(c=>c.contract_id===old.contract_id&&c.maintenance_code===old.maintenance_code))fail_('ความสัมพันธ์เครื่องและสัญญาไม่ถูกต้อง กรุณาให้ผู้ดูแลตรวจสอบ');
 const r=Object.assign({},old); ['appointment_date','actual_pm_date'].forEach(k=>r[k]=date_(p[k],true)); ['job_number','reason','po_number','qt_number','notes'].forEach(k=>r[k]=text_(p[k])); ['is_package','has_attachment'].forEach(k=>r[k]=bool_(p[k])); r.status=p.status;
 if(!STATUSES.includes(r.status))fail_('สถานะไม่ถูกต้อง'); if(TERMINAL.includes(old.status)&&(!bool_(p.confirm_terminal)||!text_(p.change_reason)))fail_('แก้ผลที่ปิดแล้วต้องยืนยันและระบุเหตุผล');
 if(r.status==='COMPLETED'&&(!r.actual_pm_date||r.actual_pm_date>today_()))fail_('งานเสร็จต้องมีวันทำจริงซึ่งไม่อยู่ในอนาคต');
 if(['CANCELLED','NOT_REQUIRED'].includes(r.status)&&!r.reason)fail_('กรุณาระบุเหตุผลการยกเลิก/ไม่ต้องทำ');
 if(r.status!=='COMPLETED'&&r.actual_pm_date)fail_('วันทำจริงใช้กับงานเสร็จแล้วเท่านั้น');
 if(r.status==='UPCOMING'&&r.original_due_date<=today_())r.status='PENDING'; r.updated_at=timestamp_(); r.revision=Number(old.revision)+1;
 return [{sheet:'Maintenance',before:old,after:r}]; });}
function saveSetting(url,p) {return mutate_(url,p,d=>{const old=p.setting_id?d.Settings.find(x=>x.setting_id===p.setting_id):null; if(p.setting_id&&!old)fail_('ไม่พบค่าตั้งต้น'); if(old&&p.updated_at!==old.updated_at)fail_('ค่าตั้งต้นถูกแก้ไขโดยผู้อื่น กรุณาโหลดใหม่'); const category=required_(p.category,'หมวด'); if(!['brand','model','service_area','customer_type','pm_condition','discontinued_model'].includes(category))fail_('หมวดไม่ถูกต้อง'); const value=required_(p.value,'ค่า'); if(d.Settings.some(x=>x.setting_id!==(old&&old.setting_id)&&x.category===category&&x.value===value))fail_('ค่าตั้งต้นซ้ำ'); return [{sheet:'Settings',before:old,after:{setting_id:old?old.setting_id:uuid_(),category,value,label:required_(p.label,'ชื่อแสดง'),active:bool_(p.active),sort_order:integer_(p.sort_order||0,0,9999,'ลำดับ'),updated_at:timestamp_()}}];});}
function monthBounds_(month) {if(!/^\d{4}-\d{2}$/.test(month||''))fail_('กรุณาเลือกเดือน'); const start=date_(month+'-01'); return {start,end:new Date(Date.UTC(Number(month.slice(0,4)),Number(month.slice(5)),0)).toISOString().slice(0,10)};}
function summary_(d,month,now) {const b=monthBounds_(month), real=d.Maintenance.filter(p=>p.status!=='NOT_REQUIRED'); const open=p=>!TERMINAL.includes(p.status); const expiry=new Date(now+'T00:00:00Z'); expiry.setUTCDate(expiry.getUTCDate()+30); const exp=expiry.toISOString().slice(0,10); return {machines:d.Machines.length,due:real.filter(p=>p.original_due_date>=b.start&&p.original_due_date<=b.end).length,overdue:real.filter(p=>open(p)&&p.original_due_date<b.start).length,completed:real.filter(p=>p.status==='COMPLETED'&&p.actual_pm_date>=b.start&&p.actual_pm_date<=b.end).length,cancelled:real.filter(p=>p.status==='CANCELLED'&&p.original_due_date>=b.start&&p.original_due_date<=b.end).length,expiring:d.Contracts.filter(c=>c.contract_status==='ACTIVE'&&c.end_date>=now&&c.end_date<=exp).length};}
function getAppData(url,filters) { const d=readAll_(openDatabase_(url)), now=today_(); const month=filters&&filters.month||now.slice(0,7); d.Maintenance=d.Maintenance.map(p=>Object.assign({},p,{status:effectiveStatus_(p,now)})); return {machines:d.Machines,contracts:d.Contracts,maintenance:d.Maintenance,settings:d.Settings,history:d.History.filter(h=>h.action==='PREPARED').map(h=>({operation_id:h.operation_id,changed_at:h.changed_at,changed_by:h.changed_by,reason:h.reason,changes:JSON.parse(h.after_json).map(c=>({sheet:c.sheet,before:c.before,after:c.after}))})),pending_operations:pending_(d).map(h=>({operation_id:h.operation_id,changed_by:h.changed_by})),summary:summary_(d,month,now),today:now,is_admin:isAdmin_()}; }
function report_(d,f,now) {
 const b=monthBounds_(f.month||now.slice(0,7)), machine=Object.fromEntries(d.Machines.map(m=>[m.maintenance_code,m])), contracts=Object.fromEntries(d.Contracts.map(c=>[c.contract_id,c]));
 const rows=d.Maintenance.filter(p=>{const c=contracts[p.contract_id];return c&&p.status!=='NOT_REQUIRED'&&!['COMPLETED','CANCELLED'].includes(p.status)&&p.original_due_date<=b.end&&(f.include_carry!==false||p.original_due_date>=b.start)&&(f.include_demo!==false||c.contract_type!=='DEMO')&&(!f.last_only||Number(p.round_no)===Number(p.round_total));}).map(p=>({pm:p,m:machine[p.maintenance_code],c:contracts[p.contract_id],carry:p.original_due_date<b.start}));
 const settings=d.Settings.filter(s=>s.category==='service_area').sort((a,b)=>Number(a.sort_order)-Number(b.sort_order));
 const defaultOrder=['ภาคใต้','ภาคเหนือ','ต่างจังหวัด','กรุงเทพฯ']; const groups=new Map();
 rows.forEach(r=>{const group=r.c.contract_type==='DEMO'?'เครื่อง Demo':r.m.service_area; if(!groups.has(group))groups.set(group,[]); groups.get(group).push(r);});
 const rank=g=>g==='เครื่อง Demo'?100000:(defaultOrder.includes(g)?defaultOrder.indexOf(g):10+(settings.findIndex(s=>s.value===g)>=0?settings.findIndex(s=>s.value===g):999));
 const names=Array.from(groups.keys()).sort((a,b)=>rank(a)-rank(b)||a.localeCompare(b,'th'));
 const lines=['งาน Maintenance ประจำเดือน'+MONTHS_TH[Number(b.start.slice(5,7))-1]+' '+String(Number(b.start.slice(0,4))+543).slice(-2),''];
 names.forEach(g=>{lines.push(g==='เครื่อง Demo'?'**เครื่อง Demo**':'(งาน...'+g+')',''); const items=groups.get(g); items.sort((a,b)=>a.pm.original_due_date.localeCompare(b.pm.original_due_date)||a.m.maintenance_code.localeCompare(b.m.maintenance_code)); const types=g==='กรุงเทพฯ'?Array.from(new Set(items.map(r=>r.m.customer_type))).sort((a,b)=>{const t=['โรงพยาบาล','คลินิก']; return (t.includes(a)?t.indexOf(a):99)-(t.includes(b)?t.indexOf(b):99)||a.localeCompare(b,'th');}):[''];
 types.forEach(type=>{if(type)lines.push(type==='คลินิก'?'**งาน..คลินิก**':'**งาน...'+type+'**',''); items.filter(r=>!type||r.m.customer_type===type).forEach(({pm:p,m,c,carry})=>{let job='.....'+p.job_number; if(p.is_package)job+=' [Package]'; if(p.po_number)job+=' PO'+p.po_number; if(p.qt_number)job+=' QT'+p.qt_number; if(p.has_attachment)job+=' (เอกสารแนบ)'; lines.push(job); let detail=m.customer_name+(m.site_name?' ('+m.site_name+')':'')+(m.phone?' ติดต่อ '+m.phone:'')+' เครื่อง '+m.model+' Maintenance ครั้งที่ '+p.round_no+'/'+p.round_total+' (SN: '+m.serial_number+')'; if(Number(p.round_no)===Number(p.round_total)&&!(c.contract_type==='DEMO'&&f.hide_demo_last))detail+=' **ครั้งสุดท้าย**'; if(carry&&f.carry_label)detail+=' [งานค้างจากรอบก่อน]'; lines.push(detail); if(p.appointment_date)lines.push('วันนัด '+thaiDate_(p.appointment_date)); if(p.notes)lines.push(p.notes); lines.push('');});});});
 return {text:rows.length?lines.join('\r\n'):'ไม่มีรายการ PM ตามเงื่อนไขที่เลือก',count:rows.length,items:rows.map(r=>({pm_id:r.pm.pm_id,maintenance_code:r.m.maintenance_code,original_due_date:r.pm.original_due_date,appointment_date:r.pm.appointment_date,carry:r.carry,notes:r.pm.notes})),notice:'ข้อมูลสถานะปัจจุบันที่อ้างอิงกำหนดเดิม ไม่ใช่ snapshot ณ สิ้นเดือน'};
}
function thaiDate_(s) {const [y,m,d]=s.split('-');return Number(d)+'/'+Number(m)+'/'+(Number(y)+543);}
function getMonthlyReport(url,filters) {return report_(readAll_(openDatabase_(url)),filters||{},today_());}

/** Internal adapter HTML is bundled here; no separate HTML file is required in Apps Script. */
function bridgePage_(origin,channel) {
 return "<!DOCTYPE html><html lang=\"th\"><head><meta charset=\"UTF-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"><title>MM data connection</title></head><body>\n<p>การเชื่อมต่อข้อมูล MM พร้อมแล้ว คุณสามารถกลับไปใช้งานที่เว็บไซต์ GitHub Pages ได้</p>\n<script>\n(function(){\n 'use strict';\n const origin=<?!= frontendOriginJson ?>;\n const channel=<?!= channelJson ?>;\n const scope='mm-bridge-v1';\n const methods=new Set(['setupDatabase','getAppData','previewSchedule','saveMachine','saveContract','saveMaintenance','saveSetting','getMonthlyReport','retryOperation']);\n if(!origin||!channel||window.top===window)return;\n window.addEventListener('message',function(event){\n  const m=event.data;\n  if(event.source!==window.top||event.origin!==origin||!m||m.scope!==scope||m.kind!=='request'||m.channel!==channel||typeof m.id!=='string'||m.id.length>160||!methods.has(m.method)||typeof m.sheetUrl!=='string')return;\n  const reply=result=>event.source.postMessage(Object.assign({scope,kind:'result',channel,id:m.id},result),origin);\n  google.script.run.withSuccessHandler(result=>reply({result})).withFailureHandler(e=>reply({error:String(e.message||e)})).bridgeCall(m.sheetUrl,m.method,m.payload);\n });\n window.top.postMessage({scope,kind:'ready',channel},origin);\n})();\n</script></body></html>\r\n"
  .replace('<?!= frontendOriginJson ?>',JSON.stringify(origin).replace(/</g,'\\u003c'))
  .replace('<?!= channelJson ?>',JSON.stringify(channel));
}
