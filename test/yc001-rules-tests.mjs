// Offline unit checks for YC-HSBA-001. NOT a Firebase emulator or production test.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const home = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rules = JSON.parse(fs.readFileSync(path.join(home,'firebase-rules.json'),'utf8')).rules;
const patch = JSON.parse(fs.readFileSync(path.join(home,'YC001_DOITUONG_WRITE_PATCH.json'),'utf8'));
let count=0;
function check(title, fn){fn(); console.log('PASS',title);count++;}
class DataNode {
  constructor(value){this.value=value === undefined ? null : value;}
  child(segment){return new DataNode(this.value !== null && typeof this.value === 'object' ? this.value[segment] : null);}
  val(){return this.value;}
  exists(){return this.value !== null;}
  isString(){return typeof this.value === 'string';}
}
const uid='editor-uid', email='editor@example.test', patientId='AB_01_test', bookKey='q_000001', token='test-lock-token-123456789';
const now=1761500000000;
const oldPatient={soHoSo:'AB.11.22.3333',tongSoQuyen:0};
const updatedPatient={...oldPatient,tongSoQuyen:1};
const roleData=(role='editor',active=true)=>({[uid]:{role,active}});
function db({role='editor',active=true,hasBook=false,locked=true,hasDeath=false,bookCount=0}={}){
 return {phanQuyen:roleData(role,active),khoaThaoTac:locked?{[patientId]:{uid,token}}:{},doiTuong:{[patientId]:{...oldPatient,tongSoQuyen:bookCount}},quyenHoSo:hasBook?{[patientId]:{[bookKey]:{quyenSo:1}}}:{},hoSoTuVong:hasDeath?{[patientId]:{quyenSo:1}}:{}};
}
function allowed(expression,{rootData=db(), role='editor', oldValue=oldPatient, newValue=updatedPatient, person=patientId,locationKey='tuvong_t_000001_v_000001'}={}){
 const auth={uid, token:{email}};
 const exprFn=new Function('auth','root','data','newData','now','$patientId','$locationKey',`return (${expression});`);
 return Boolean(exprFn(auth,new DataNode(rootData),new DataNode(oldValue),new DataNode(newValue),now,person,locationKey));
}
const pRule=rules.doiTuong.$patientId['.write'];
check('Relevant rule equals minimal patch',()=>assert.equal(pRule,patch.patchedWrite));
check('Editor can update first book summary without pre-existing book',()=>assert.equal(allowed(pRule,{rootData:db()}),true));
check('Old rule denied editor first book summary (regression reproduced)',()=>assert.equal(allowed(patch.baselineWrite,{rootData:db()}),false));
check('Editor can update later book summary',()=>assert.equal(allowed(pRule,{rootData:db({hasBook:true,bookCount:1})}),true));
check('Admin can update first book summary',()=>assert.equal(allowed(pRule,{rootData:db({role:'admin'})}),true));
check('Viewer cannot edit patient summary',()=>assert.equal(allowed(pRule,{rootData:db({role:'viewer'})}),false));
check('Inactive editor cannot edit patient summary',()=>assert.equal(allowed(pRule,{rootData:db({active:false})}),false));
check('Editor without lock cannot edit patient summary',()=>assert.equal(allowed(pRule,{rootData:db({locked:false})}),false));
check('Editor cannot alter medical-record number',()=>assert.equal(allowed(pRule,{rootData:db(),newValue:{...updatedPatient,soHoSo:'AB.99.88.7777'}}),false));
const bRule=rules.quyenHoSo.$patientId.$bookId['.write'];
const dRule=rules.hoSoTuVong.$patientId['.write'];
const book={quyenSo:1,trangThai:'Đối tượng tử vong',operationToken:token};
check('Editor can create death book one with lock/token',()=>assert.equal(allowed(bRule,{rootData:db(),oldValue:null,newValue:book}),true));
check('Editor can create death record with lock/token',()=>assert.equal(allowed(dRule,{rootData:db(),oldValue:null,newValue:{operationToken:token}}),true));
check('Viewer cannot create death record',()=>assert.equal(allowed(dRule,{rootData:db({role:'viewer'}),oldValue:null,newValue:{operationToken:token}}),false));
check('Wrong operationToken rejected for death record',()=>assert.equal(allowed(dRule,{rootData:db(),oldValue:null,newValue:{operationToken:'incorrect'}}),false));
check('Attempt to create another book after death is denied',()=>assert.equal(allowed(bRule,{rootData:db({hasDeath:true}),oldValue:null,newValue:{quyenSo:2,trangThai:'Hết quyển',operationToken:token}}),false));
const sRule=rules.hsbaViTriLuuTru.$locationKey['.write'];
const oldIndex={patientId,bookKey,reservationState:'committed',locationKey:'tuvong_t_000001_v_000001'};
check('Editor can commit previously created index with refreshed patient token',()=>assert.equal(allowed(sRule,{rootData:db(),oldValue:oldIndex,newValue:{...oldIndex,patientLockToken:token}}),true));
check('Editor must still supply current patient token',()=>assert.equal(allowed(sRule,{rootData:db(),oldValue:oldIndex,newValue:{...oldIndex}}),false));
const html=fs.readFileSync(path.join(home,'index.html'),'utf8');
check('Frontend commits current token with reused index',()=>assert.match(html,/const committedIndex\s*=\s*\{[\s\S]*?patientLockToken:\s*lockToken,[\s\S]*?reservationState:\s*'committed'/));
check('Viewer remains read-only in frontend',()=>assert.match(html,/function canEditRecords\(\)\s*\{\s*return state\.currentRole === 'admin' \|\| state\.currentRole === 'editor';/));
check('Rules keep unrelated applications',()=>{for(const k of ['tongHopYTe','yTeApp','baoCaoYTe'])assert.ok(rules[k]);});
check('Permission subtree admin-only for writes',()=>assert.ok(!rules.phanQuyen.$uid['.write'].includes("role').val() == 'editor'")));
check('Valid production version metadata',()=>{assert.equal(JSON.parse(fs.readFileSync(path.join(home,'version.json'))).version,'2026.10.26.1')});
console.log(`Completed ${count}/${count} offline checks.`);
