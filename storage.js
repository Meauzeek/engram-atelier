/* Local project library, transactional revisions, bounded history and an emergency journal.
 * No accounts, tokens or project contents are sent over the network.
 */
(function(root){
'use strict';
const C=root.EngramCore;
const scope=(document.getElementById('engram-boot')?'file:'+location.pathname:new URL('.',location.href).pathname);
const namespace='engram5:'+scope+':', seen=new Map();
const writer=C.uid('tab'); let dbPromise,queue=Promise.resolve();
const chan=typeof BroadcastChannel==='function'?new BroadcastChannel(namespace+'changes'):null;
function db(){if(!dbPromise)dbPromise=new Promise((resolve,reject)=>{
 const r=indexedDB.open('engram-atelier-v5',1);let done=false;
 const fail=err=>{if(!done){done=true;reject(err);dbPromise=null;}};
 const timeout=setTimeout(()=>fail(new Error('本地数据库没有响应。请检查浏览器是否限制网站存储。')),5000);
 r.onupgradeneeded=()=>{for(const store of ['docs','state','history'])if(!r.result.objectStoreNames.contains(store))r.result.createObjectStore(store);};
 r.onblocked=()=>fail(new Error('数据库被另一标签页占用，请关闭旧页面后重试。'));
 r.onerror=()=>{clearTimeout(timeout);fail(r.error||new Error('数据库打开失败。'));};
 r.onsuccess=()=>{clearTimeout(timeout);if(done){r.result.close();return;}done=true;const d=r.result;d.onversionchange=()=>{d.close();dbPromise=null;};resolve(d);};
});return dbPromise;}
const entryKey=id=>namespace+id;
function conflict(record){const e=new Error('另一标签页已保存这个项目。为避免覆盖，自动保存已暂停。请在“项目库”中保留为分支，或读取较新版本。');e.name='ConflictError';e.latest=record;return e;}
async function read(store,k){const d=await db();return new Promise((resolve,reject)=>{const tx=d.transaction(store),r=tx.objectStore(store).get(k);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}
async function put(store,k,v){const d=await db();return new Promise((resolve,reject)=>{const tx=d.transaction(store,'readwrite');tx.objectStore(store).put(v,k);tx.oncomplete=()=>resolve(v);tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);});}
async function all(store){const d=await db();return new Promise((resolve,reject)=>{const r=d.transaction(store).objectStore(store).getAll();r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}
function lsRead(k){try{return JSON.parse(localStorage.getItem(namespace+k)||'null');}catch{return null;}}
function fallbackSave(k,value){const old=lsRead('doc:'+value.id);const expected=seen.get(value.id)||0;if(old&&old.writer!==writer&&old.revision!==expected)throw conflict(old);
 const revision=(old?.revision||0)+1,record={scope,id:value.id,project:value,revision,writer,savedAt:Date.now()};
 try{localStorage.setItem(namespace+'doc:'+value.id,JSON.stringify(record));localStorage.setItem(namespace+'active',JSON.stringify(value.id));}catch{throw new Error('本机保存失败：数据库和备用存储均不可用。请立即导出完整存档。');}
 seen.set(value.id,revision);clearJournal(value.id,value.meta.modified);return 'LocalStorage';}
async function writeDoc(k,value,forceHistory=false){
 let d;try{d=await db();}catch{if(k.endsWith(':backup'))return 'Unavailable';return fallbackSave(k,value);}
 if(k.endsWith(':backup')){await put('state',namespace+'replacement',value);return 'IndexedDB';}
 const id=value.id,ek=entryKey(id),now=Date.now();let outcome;
 await new Promise((resolve,reject)=>{const tx=d.transaction(['docs','state','history'],'readwrite'),docs=tx.objectStore('docs'),hist=tx.objectStore('history');let error=null;
 const get=docs.get(ek);get.onsuccess=()=>{
 const old=get.result,expected=seen.get(id)||0;
 if(old&&old.writer!==writer&&old.revision!==expected){error=conflict(old);tx.abort();return;}
 const revision=(old?.revision||0)+1;
 // Save the PREVIOUS committed state, at most every 3 minutes (plus explicit snapshots).
 const keep=old&&(forceHistory||now-(old.lastSnapshot||0)>=180000)&&old.project.meta.modified!==value.meta.modified;
 if(keep){hist.put({id:ek+':'+now,scope,projectId:id,created:now,label:'自动历史',project:old.project},ek+':'+now);}
 outcome={scope,id,project:value,revision,writer,savedAt:now,lastSnapshot:keep?now:old?.lastSnapshot||now};docs.put(outcome,ek);tx.objectStore('state').put({id},namespace+'active');
 };tx.oncomplete=resolve;tx.onerror=()=>reject(error||tx.error);tx.onabort=()=>reject(error||tx.error||new Error('保存事务中止。'));});
 seen.set(id,outcome.revision);clearJournal(id,value.meta.modified);chan?.postMessage({id,revision:outcome.revision,writer});
 trim(id).catch(()=>{});return 'IndexedDB';
}
async function trim(id){const records=(await all('history')).filter(h=>h.scope===scope&&h.projectId===id).sort((a,b)=>b.created-a.created);let size=0,remove=[];
 for(let i=0;i<records.length;i++){size+=JSON.stringify(records[i].project).length;if(i>=12||i>=2&&size>24000000)remove.push(records[i].id);}
 if(remove.length){const d=await db();await new Promise((r,j)=>{const tx=d.transaction('history','readwrite');remove.forEach(k=>tx.objectStore('history').delete(k));tx.oncomplete=r;tx.onerror=()=>j(tx.error);});}}
async function getDoc(id){let r;try{r=await read('docs',entryKey(id));}catch{}const fallback=lsRead('doc:'+id);if(fallback&&(!r||fallback.project.meta.modified>r.project.meta.modified))r=fallback;if(r){seen.set(id,r.revision);return C.copy(r.project);}return null;}
function journal(value){if(!value)return;try{const text=JSON.stringify({project:value,base:seen.get(value.id)||0,writer,time:Date.now()});if(text.length<1200000)localStorage.setItem(namespace+'journal',text);else localStorage.removeItem(namespace+'journal');}catch{}}
function clearJournal(id,stamp){const j=lsRead('journal');if(j?.project?.id===id&&j.project.meta.modified<=stamp&&j.writer===writer)try{localStorage.removeItem(namespace+'journal');}catch{}}
async function legacy(k){try{const names=await indexedDB.databases?.();if(names&&!names.some(d=>d.name==='engram-atelier'))return null;
 return await new Promise(resolve=>{const r=indexedDB.open('engram-atelier',1);r.onerror=()=>resolve(null);r.onupgradeneeded=()=>{};r.onsuccess=()=>{const d=r.result;if(!d.objectStoreNames.contains('projects')){d.close();resolve(null);return;}const tx=d.transaction('projects'),q=tx.objectStore('projects').get(k);q.onsuccess=()=>resolve(q.result||null);q.onerror=()=>resolve(null);tx.oncomplete=()=>d.close();};});}catch{return null;}}
async function get(k){if(k.endsWith(':backup')){try{return await read('state',namespace+'replacement');}catch{return null;}}
 let active;try{active=(await read('state',namespace+'active'))?.id;}catch{}active=active||lsRead('active');let project=active?await getDoc(active):null;
 const j=lsRead('journal');
 if(j?.project&&(!project||j.project.id===project.id&&j.project.meta.modified>project.meta.modified)){
 // An emergency draft from another revision never silently replaces newer committed work.
 const sameBase=!project||j.base===(seen.get(project.id)||0);
 if(sameBase){project=C.normalize(j.project);root.ENGRAM_RECOVERED_DRAFT=true;}
 else {const copy=C.normalize(j.project);copy.id=C.uid('recovered');copy.meta.title+=' · 恢复草稿';project=copy;root.ENGRAM_RECOVERED_DRAFT=true;}
 }
 return project||await legacy(k)||lsRead(k);}
function set(k,v){const value=C.copy(v);const p=queue.catch(()=>{}).then(()=>writeDoc(k,value));queue=p;return p;}
async function list(){let records=[];try{records=(await all('docs')).filter(x=>x.scope===scope);}catch{}
 try{for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k?.startsWith(namespace+'doc:')){const r=JSON.parse(localStorage.getItem(k)),pos=records.findIndex(x=>x.id===r.id);if(pos<0)records.push(r);else if(r.savedAt>records[pos].savedAt)records[pos]=r;}}}catch{}
 return records.sort((a,b)=>b.savedAt-a.savedAt).map(r=>({id:r.id,title:r.project.meta.title,subtitle:r.project.meta.subtitle,modified:r.project.meta.modified,savedAt:r.savedAt,modules:r.project.modules.length,cards:C.index(r.project).size,revision:r.revision}));}
async function snapshot(project,label='手动快照'){await queue.catch(()=>{});const p=C.copy(project),now=Date.now(),id=entryKey(p.id)+':manual:'+now;await put('history',id,{id,scope,projectId:p.id,created:now,label,project:p});await trim(p.id);return id;}
async function history(id){try{return (await all('history')).filter(x=>x.scope===scope&&x.projectId===id).sort((a,b)=>b.created-a.created);}catch{return [];}}
async function remove(id){await queue.catch(()=>{});try{const d=await db(),records=await history(id);await new Promise((resolve,reject)=>{const tx=d.transaction(['docs','history'],'readwrite');tx.objectStore('docs').delete(entryKey(id));records.forEach(x=>tx.objectStore('history').delete(x.id));tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});}catch(e){if(!lsRead('doc:'+id))throw e;}try{localStorage.removeItem(namespace+'doc:'+id);}catch{}seen.delete(id);}
async function stats(){let estimate={},persisted=false;try{estimate=await navigator.storage?.estimate?.()||{};persisted=await navigator.storage?.persisted?.()||false;}catch{}return {...estimate,persisted,supported:!!navigator.storage?.persist,secure:isSecureContext};}
chan?.addEventListener('message',e=>{if(e.data.writer!==writer)document.dispatchEvent(new CustomEvent('engram-remote-save',{detail:e.data}));});
root.EngramStorage={get,set,db,list,getDoc,snapshot,history,remove,journal,stats,scope,namespace,writer,settle:()=>queue.catch(()=>{})};
})(globalThis);
