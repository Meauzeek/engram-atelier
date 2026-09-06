/* Fonts remain on the user's device. No font binaries are shipped in this project.
 * Original QUALITHM files may be reused via assets/fonts or selected in the UI.
 * Imported bytes are stored only in a separate local browser cache, never project saves. */
(function(root){
 'use strict';
 const records=new Map();let loadedFaces=[];
 const weights=[400,500,600,700];
 const base='assets/fonts/';
 function db(){return new Promise((resolve,reject)=>{const r=indexedDB.open('engram-local-fonts',1);r.onupgradeneeded=()=>r.result.createObjectStore('faces');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}
 async function read(){try{const d=await db();return await new Promise((resolve,reject)=>{const t=d.transaction('faces'),r=t.objectStore('faces').getAll();r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);t.oncomplete=()=>d.close();});}catch{return [];}}
 async function store(rec){try{const d=await db();await new Promise((resolve,reject)=>{const t=d.transaction('faces','readwrite');t.objectStore('faces').put(rec,rec.family+'-'+rec.weight);t.oncomplete=()=>{d.close();resolve();};t.onerror=()=>reject(t.error);});return true;}catch{return false;}}
 function asData(buffer){const bytes=new Uint8Array(buffer);let s='';for(let i=0;i<bytes.length;i+=0x4000)s+=String.fromCharCode(...bytes.subarray(i,i+0x4000));return btoa(s);}
 async function activate(rec){const key=rec.family+'-'+rec.weight;
  const old=loadedFaces.find(x=>x.key===key);if(old)document.fonts.delete(old.face);
  const face=new FontFace(rec.family,rec.data,{style:'normal',weight:String(rec.weight)});await face.load();document.fonts.add(face);loadedFaces=loadedFaces.filter(x=>x.key!==key);loadedFaces.push({key,face});records.set(key,rec);
 }
 async function importFonts(files,type='en'){
  if(!files.length)return;
  for(const file of files){if(!/\.(woff2?|ttf|otf)$/i.test(file.name))throw new Error('请选择 WOFF2、WOFF、TTF 或 OTF 字体文件。');if(file.size>30*1024*1024)throw new Error('单个字体上限 30 MB；可使用已有的精简字库。');
   const num=file.name.match(/(?:^|[-_ ])([4-9]00)(?:[-_. ]|$)/),weight=num?Number(num[1]):/bold/i.test(file.name)?700:/medium/i.test(file.name)?500:400;
   const rec={family:type==='cn'?'EngramChinese':'Rajdhani',weight,name:file.name,data:await file.arrayBuffer()};await activate(rec);await store(rec);
  }
  await document.fonts.ready;
 }
 async function init(){for(const rec of await read())try{await activate(rec);}catch{}
  // file:// forbids fetch in Chromium. CSS can still load original relative faces;
  // choosing them in the font dialog also makes the bytes available to PNG export.
  if(/^https?:$/.test(location.protocol))await Promise.all(weights.map(async weight=>{const key='Rajdhani-'+weight;if(records.has(key))return;try{const r=await fetch(base+'rajdhani-'+weight+'.woff2');if(!r.ok)return;const rec={family:'Rajdhani',weight,name:'rajdhani-'+weight+'.woff2',data:await r.arrayBuffer()};await activate(rec);}catch{}}));
 }
 // Fallback English loading bypasses failed relative CSS sources. Only font URLs
 // are requested; project content and user images never leave the document.
 async function webEnglish(){
  if(location.protocol==='about:'||weights.every(w=>records.has('Rajdhani-'+w)))return;
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),7000);
  try{
   const response=await fetch('https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&display=swap',{signal:controller.signal});if(!response.ok)return;
   const css=await response.text(),blocks=css.match(/@font-face\s*\{[^}]*\}/g)||[];
   for(const weight of weights){if(records.has('Rajdhani-'+weight))continue;const candidates=blocks.filter(x=>new RegExp('font-weight:\\s*'+weight+'\\s*;').test(x));const block=candidates.find(x=>/U\+0000-00FF/i.test(x))||candidates.at(-1);const url=block?.match(/url\(([^)]+)\)/)?.[1]?.replace(/["']/g,'');if(!url||!url.startsWith('https://fonts.gstatic.com/'))continue;
    const r=await fetch(url,{signal:controller.signal});if(!r.ok)continue;const rec={family:'Rajdhani',weight,name:'rajdhani-'+weight+'.woff2',data:await r.arrayBuffer()};await activate(rec);await store(rec);
   }
   document.dispatchEvent(new Event('engram-fonts-ready'));
  }catch{}finally{clearTimeout(timer);}
 }
 function rasterCSS(){return [...records.values()].map(r=>`@font-face{font-family:"${r.family}";font-weight:${r.weight};font-style:normal;src:url(data:${/\.ttf$/i.test(r.name)?'font/ttf':/\.otf$/i.test(r.name)?'font/otf':/\.woff$/i.test(r.name)?'font/woff':'font/woff2'};base64,${asData(r.data)});}`).join('\n');}
 function status(){const en=[...records.values()].filter(r=>r.family==='Rajdhani'),cn=[...records.values()].filter(r=>r.family==='EngramChinese');return `已读取 ${en.length} 个 Rajdhani 字重${cn.length?'、'+cn.length+' 个中文字库':''}。${en.length?'PNG 可使用原英文字形。':'尚未读取字体二进制；显示使用相对路径字体或系统回退，PNG 使用系统回退。'}`;}
 root.EngramFonts={import:importFonts,rasterCSS,status,ready:null};root.EngramFonts.ready=init().catch(()=>{}).then(()=>{webEnglish().catch(()=>{});});
})(globalThis);
