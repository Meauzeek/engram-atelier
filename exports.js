/* Native DOM → inline SVG → PNG. No remote renderer, canvas library or network. */
(function(root){
'use strict';const C=root.EngramCore,V=root.EngramView,E=C.esc;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
function filename(s){return String(s||'未命名项目').replace(/[<>:"/\\|?*\u0000-\u001f]/g,'_').slice(0,85);}
function download(blob,name){const u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),60000);}
function textFile(s,name,type='text/plain;charset=utf-8'){download(new Blob([s],{type}),name);}
function cssText(){if(root.ENGRAM_CSS)return root.ENGRAM_CSS;const inline=document.querySelector('style[data-app-style]');if(inline?.textContent)return inline.textContent;let s='';for(const sheet of document.styleSheets){try{s+=[...sheet.cssRules].map(r=>r.cssText).join('\n');}catch{}}
 if(!s)throw new Error('无法读取页面样式，请使用交付的离线单文件版。');return s;}
function dom(html){const d=document.createElement('div');d.innerHTML=html;return d.firstElementChild;}
async function settle(el){await document.fonts.ready;await Promise.all([...el.querySelectorAll('img')].map(im=>im.decode().catch(()=>{})));await sleep(40);}
function svg(el,crop={},raster=false){
 const rect=el.getBoundingClientRect(),w=Math.ceil(rect.width),total=Math.ceil(el.scrollHeight),height=crop.height||total,y=crop.y||0;
 const clone=el.cloneNode(true);clone.style.width=w+'px';clone.style.maxWidth='none';clone.style.margin='0';clone.querySelectorAll('[data-action]').forEach(n=>{n.removeAttribute('data-action');n.removeAttribute('tabindex');n.removeAttribute('role');});
 clone.querySelectorAll('textarea,input').forEach(n=>{const d=document.createElement('div');d.className='response-print';d.textContent=n.value||n.textContent;n.replaceWith(d);});
 const markup=new XMLSerializer().serializeToString(clone);
 const fontCSS=raster?(root.EngramFonts?.rasterCSS()||''):'';
 const sheet=(cssText().split('\n').filter(l=>!l.trim().startsWith('@import')).join('\n').replace(/@font-face\s*\{[^}]*\}/g,rule=>rule.includes('url(')?'':rule)+fontCSS).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
 return {width:w,height,source:`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${height}" viewBox="0 0 ${w} ${height}"><foreignObject x="0" y="${-y}" width="${w}" height="${total}"><div xmlns="http://www.w3.org/1999/xhtml" style="margin:0;padding:0;width:${w}px;"><style>${sheet}</style>${markup}</div></foreignObject></svg>`};
}
async function png(el,scale=2,crop={}){
 await settle(el);const payload=svg(el,crop,true),w=Math.ceil(payload.width*scale),h=Math.ceil(payload.height*scale);
 if(w>15000||h>15000||w*h>34000000)throw new Error('单张画布尺寸过大。请降低倍率，或使用分段 / 分页导出。');
 const image=new Image();
 await new Promise((resolve,reject)=>{let timer=setTimeout(()=>reject(new Error('图像渲染超时。建议按模块导出，或减少超大图片。')),30000);image.onload=()=>{clearTimeout(timer);resolve();};image.onerror=()=>{clearTimeout(timer);reject(new Error('浏览器不能渲染此离线图像。请用桌面版 Edge / Chrome，或先导出 SVG。'));};image.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(payload.source);});
 const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;const ctx=canvas.getContext('2d');if(!ctx)throw new Error('无法分配画布，请降低导出倍率。');
 ctx.drawImage(image,0,0,w,h);
 try{const blob=await new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error('PNG 编码失败，建议使用分段导出。')),'image/png'));return {blob,width:w,height:h};}
 finally{canvas.width=1;canvas.height=1;image.src='';}
}
function exportOptions(o){return {...Object.fromEntries(C.displayKeys.map(k=>[k,o[k]])),author:o.scope==='author',export:true,notes:o.scope==='author'&&!!o.notes,placeholders:!!o.placeholders,showSelection:!!o.selections,status:!!o.status,columns:o.columns||undefined};}
function rootDoc(p,html,width,extra=''){const el=dom(`<article class="${V.classes(p,{export:true})} ${extra}" style="${E(V.style(p))};width:${width}px;max-width:none">${html}</article>`);document.getElementById('exportMount').append(el);return el;}
function selectedProject(p){const q=C.copy(p),set=new Set(q.play.selected);q.modules=q.modules.map(m=>{m.cards=m.cards.filter(c=>set.has(c.id));m.rows=m.rows.map(r=>({...r,cards:r.cards.filter(c=>set.has(c.id))})).filter(r=>r.cards.length);return m;}).filter(m=>m.type==='text'||m.cards.length||m.rows.length);return q;}
function rows(cards,cols){let rows=[],row=[],used=0;for(const c of cards){const span=Math.min(c.span,cols);if(row.length&&used+span>cols){rows.push(row);row=[];used=0;}row.push(c);used+=span;}if(row.length)rows.push(row);return rows;}
function units(p,o){
 const opts=exportOptions(o),set=new Set(p.play.selected),out=[];
 const h=dom(`<div>${V.hero(p,opts)}</div>`);for(const child of [...h.children])out.push(dom(`<div class="export-unit">${child.outerHTML}</div>`));
 p.modules.forEach((m,mi)=>{
  if(!opts.author&&!C.unlocked(m,set))return;
  const header=V.headingsAt(m,'start',opts)+V.moduleHeader(m,p,mi,opts)+V.media(m.image,p,opts);let first=true,pending='';
  const add=(content,sub='')=>{const name=V.shown(m,p,opts,'moduleTitles')?m.title:'';const prefix=first?header:name?`<div class="continuation-label">${E(name)}${sub&&V.shown(m,p,opts,'attributeTitles')?' / '+E(sub):''} · 续</div>`:'';out.push(dom(`<div class="export-unit ${m.type==='scenario'?'scenario':''}">${prefix}${pending}${content}</div>`));first=false;pending='';};
  const cols=m.layout==='list'?1:(o.columns||m.columns),filter=cards=>cards.filter(c=>opts.author||C.visible({card:c,module:m},set));
  if(m.type==='text'){const body=dom(V.section(m,p,mi,opts)).querySelector('.text-block');add(body?body.outerHTML:'');}
  else if(m.type==='attributes')m.rows.forEach(r=>{pending+=V.headingsAt(m,r.id,opts);rows(filter(r.cards),cols).forEach((row,ri)=>add(`<div class="attribute-row">${V.attributeHeader(r,m,p,opts,ri>0)}<div class="cards-grid" style="--columns:${cols}">${row.map(c=>V.card(c,m,p,r.cards.indexOf(c),{...opts,columns:cols})).join('')}</div></div>`,r.title));});
  else {
   let batch=[],used=0;
   const flush=()=>{if(batch.length){add(`<div class="cards-grid" style="--columns:${cols}">${batch.map(c=>V.card(c,m,p,m.cards.indexOf(c),{...opts,columns:cols})).join('')}</div>`);batch=[];used=0;}};
   for(const c of m.cards){const head=V.headingsAt(m,c.id,opts);if(head){flush();pending+=head;}if(!opts.author&&!C.visible({card:c,module:m},set))continue;const span=Math.min(c.span,cols);if(batch.length&&used+span>cols)flush();batch.push(c);used+=span;if(used>=cols)flush();}flush();
  }
  pending+=V.headingsAt(m,'end',opts);
  if(first)add('<div class="empty-module">暂无选项</div>');else if(pending)add('');
  if(opts.notes&&m.notes)out.push(dom(`<div class="export-unit doc-note">模块备注：${E(m.notes)}</div>`));
 });
 const footer=V.footer(p);if(footer)out.push(dom(`<div class="export-unit">${footer}</div>`));return out;
}
function newPage(p,w,h,n){const labels=p.output?.pageLabels!==false;const el=rootDoc(p,`${labels?`<div class="export-minibar"><span>${E(p.meta.title)}</span><span>${E(p.meta.edition)}</span></div>`:''}<div class="export-page-body"></div>${labels?`<div class="export-page-footer"><span>ENGRAM / ${E(p.meta.tokenName)}</span><span class="page-counter">${n}</span></div>`:''}`,w,'export-page');el.style.height=h+'px';return {el,body:el.querySelector('.export-page-body')};}
function over(page){const b=page.body,last=b.lastElementChild;return !!last&&last.getBoundingClientRect().bottom>b.getBoundingClientRect().bottom+0.5;}
function isTooTall(unit,page){page.body.append(unit);const too=over(page);unit.remove();return too;}
// When a row is unusually tall, preserve every card before falling back to text continuations.
function divideRow(unit){const cards=[...unit.querySelectorAll('.cards-grid > .card')];if(cards.length<=1)return null;
 const prefix=unit.querySelector('.module-head')?.outerHTML||unit.querySelector('.continuation-label')?.outerHTML||'';
 const desc=unit.querySelector('.module-desc')?.outerHTML||'';
 const label=unit.querySelector('.attribute-title')?.outerHTML||'';const headings=[...unit.querySelectorAll(':scope > .display-heading')].map(h=>h.outerHTML).join('');
 const moduleMedia=[...unit.children].filter(n=>n.classList.contains('media')||n.classList.contains('media-caption')).map(n=>n.outerHTML).join('');
 return cards.map((c,i)=>{const clone=c.cloneNode(true);clone.style.gridColumn='auto';return dom(`<div class="export-unit">${i===0?prefix+desc+moduleMedia+headings:prefix}${label}<div class="cards-grid" style="--columns:1">${clone.outerHTML}</div></div>`);});
}
function splitLongUnit(unit,page){
 page.body.append(unit);
 const single=unit.querySelector('.card'),heading=single?.querySelector('h3')?.innerText||unit.querySelector('.module-head h2')?.innerText||'长内容';
 const amount=single?.querySelector('.points')?.outerHTML||'';
 const context=unit.querySelector('.module-head')?.innerText.replace(/\s+/g,' ')||unit.querySelector('.continuation-label')?.innerText||'';
 let text;
 if(single){const intro=[...unit.querySelectorAll(':scope > .module-desc,:scope > .media-caption,:scope > .display-heading')].map(n=>n.innerText);const parts=[...single.querySelector('.card-body').children].filter(n=>n.tagName!=='H3').map(n=>n.innerText);const captions=[...single.querySelectorAll('.media-caption')].map(n=>n.innerText);text=[...intro,...captions,...parts].filter(Boolean).join('\n\n').trim();}
 else text=unit.innerText.trim();
 const images=[...unit.querySelectorAll('img')].map(n=>n.cloneNode(true));unit.remove();
 const result=[];
 for(const im of images){const u=dom('<div class="export-unit split-record"><div class="continuation-label">图片 / 长内容分段</div></div>');im.style='max-height:180px;width:auto;max-width:100%;height:auto;object-fit:contain';u.append(im);result.push(u);}
 let rest=text,part=1;
 while(rest.length){const u=dom(`<div class="export-unit split-record"><div class="continuation-label">${E(context)}${context?' / ':''}${part===1?'阅读分段':'续页 '+part}</div><h3>${E(heading)} ${amount}</h3><p></p></div>`),p=u.querySelector('p');
  let lo=1,hi=rest.length,best=0;
  while(lo<=hi){const mid=(lo+hi)>>1;p.textContent=rest.slice(0,mid);if(isTooTall(u,page)){hi=mid-1;}else{best=mid;lo=mid+1;}}
  if(best<1)throw new Error('当前页高不足以容纳一行正文，请增大页高。');
  if(best<rest.length){const cut=rest.lastIndexOf('\n',best);if(cut>best*.7)best=cut+1;}
  p.textContent=rest.slice(0,best);rest=rest.slice(best);result.push(u);part++;
 }
 return result;
}
async function paginate(p,o){const pages=[];let current=newPage(p,o.width,o.height,1);pages.push(current);const queue=units(p,o);let guard=0;
 while(queue.length){if(++guard>16000)throw new Error('分页内容过大，请缩小导出范围。');const u=queue.shift();current.body.append(u);await settle(u);
  if(!over(current))continue;u.remove();
  if(current.body.children.length){current=newPage(p,o.width,o.height,pages.length+1);pages.push(current);queue.unshift(u);continue;}
  const chunks=divideRow(u)||splitLongUnit(u,current);if(!chunks.length)continue;queue.unshift(...chunks);
 }
 if(!pages[pages.length-1].body.children.length&&pages.length>1){pages.pop().el.remove();}
 pages.forEach((page,i)=>{const c=page.el.querySelector('.page-counter');if(c)c.textContent=String(i+1).padStart(2,'0')+' / '+String(pages.length).padStart(2,'0');});
 return pages;
}
async function segments(el,o,zip,prefix,report){
 const total=Math.ceil(el.scrollHeight),w=Math.ceil(el.getBoundingClientRect().width),base=el.getBoundingClientRect().top;
 const safe=Math.floor(Math.min(14500/o.scale,32000000/(w*o.scale*o.scale))),desired=Math.min(o.segmentHeight||1600,safe);
 const bottoms=[...el.querySelectorAll('.card,.rules,.hero,.module-head,.doc-footer,.text-block')].map(n=>Math.ceil(n.getBoundingClientRect().bottom-base+15));
 let y=0,count=0;
 while(y<total){let end=Math.min(total,y+desired);if(end<total){const candidates=bottoms.filter(b=>b>y+desired*.45&&b<=end);if(candidates.length)end=Math.max(...candidates);}
  if(end<=y)end=Math.min(total,y+desired);report(`分段 ${count+1} · ${Math.round(end/total*100)}%`);
  const r=await png(el,o.scale,{y,height:end-y});zip.file(prefix+'-'+String(++count).padStart(2,'0')+'.png',r.blob);y=end;
 }
 return count;
}
async function graphics(project,config,report=()=>{}){
 const o={...project.output,type:'full',scope:'author',width:1080,height:1528,scale:2,columns:0,placeholders:true,status:true,selections:false,notes:false,segmentHeight:1600,...config};
 o.width=Math.round(Math.max(600,Math.min(2400,Number(o.width)||1080)));o.height=Math.round(Math.max(300,Math.min(4000,Number(o.height)||1528)));o.scale=Math.max(.5,Math.min(3,Number(o.scale)||2));
 const p=o.scope==='selected'?selectedProject(project):C.copy(project);p.output={...p.output,...Object.fromEntries([...C.displayKeys,'pageLabels'].filter(k=>typeof o[k]==='boolean').map(k=>[k,o[k]]))};if(o.scope==='selected'){o.scope='player';o.selections=true;}
 const mount=document.getElementById('exportMount');mount.innerHTML='';const zip=new JSZip(),base=filename(p.meta.title);const opts=exportOptions(o);
 document.body.classList.add('export-busy');let result;
 try{
  if(o.type==='pages'){
   report('正在按卡片与文本边界排版…');const pages=await paginate(p,o);for(let i=0;i<pages.length;i++){report(`正在渲染第 ${i+1} / ${pages.length} 页`);const r=await png(pages[i].el,o.scale);zip.file('pages/'+String(i+1).padStart(3,'0')+'.png',r.blob);}
   zip.file('说明.txt',`项目：${p.meta.title}\n页数：${pages.length}\n逻辑页：${o.width} × ${o.height}\n像素倍率：${o.scale}\n按卡片行分页；超长内容自动转为续页，不裁掉文字。\n`);
   result={blob:await zip.generateAsync({type:'blob'}),name:base+'-阅读分页.zip',count:pages.length};
  }else if(o.type==='modules'){
   let n=0;for(let i=0;i<p.modules.length;i++){const m=p.modules[i];if(!opts.author&&!C.unlocked(m,new Set(p.play.selected)))continue;
    report(`模块 ${i+1} / ${p.modules.length} · ${m.title}`);const el=rootDoc(p,`${p.output.pageLabels!==false?`<div class="export-minibar"><span>${E(p.meta.title)}</span><span>${E(p.meta.edition)}</span></div>`:''}${V.section(m,p,i,opts)}${V.footer(p)}`,o.width);await settle(el);
    const prefix=String(i+1).padStart(2,'0')+'-'+filename(m.title);if(el.scrollHeight*o.scale>14500||el.scrollHeight*o.width*o.scale*o.scale>32000000)n+=await segments(el,o,zip,prefix,report);else{const r=await png(el,o.scale);zip.file(prefix+'.png',r.blob);n++;}el.remove();}
   if(!n)throw new Error('当前范围没有可导出的模块。');result={blob:await zip.generateAsync({type:'blob'}),name:base+'-模块图.zip',count:n};
  }else{
   const el=dom(V.document(p,opts));el.style.width=o.width+'px';el.style.maxWidth='none';mount.append(el);await settle(el);
   if(o.type==='svg'){result={blob:new Blob([svg(el).source],{type:'image/svg+xml;charset=utf-8'}),name:base+'-长图.svg',count:1};}
   else if(o.type==='segments'||el.scrollHeight*o.scale>14500||el.scrollHeight*o.width*o.scale*o.scale>32000000){const n=await segments(el,o,zip,'segment',report);zip.file('说明.txt',`全文高度 ${el.scrollHeight}，导出 ${n} 段。\n${o.type==='full'?'原请求为完整长图，因尺寸超过保守画布阈值，自动改为分段，未丢弃内容。':''}\n分段优先靠近卡片边界；跨段阅读请按文件名顺序。`);result={blob:await zip.generateAsync({type:'blob'}),name:base+'-分段长图.zip',count:n};}
   else{report('正在生成完整长图…');const r=await png(el,o.scale);result={blob:r.blob,name:base+'-完整长图.png',count:1,width:r.width,height:r.height};}
  }
  report(`已完成：${result.count} 张图件`);if(!matchMedia('(pointer:coarse)').matches)download(result.blob,result.name);return result;
 }finally{mount.innerHTML='';document.body.classList.remove('export-busy');}
}
async function syncBundle(p){const z=new JSZip();z.file('progress.md',C.markdown(p,true));z.file('project.json',JSON.stringify(p,null,2));z.file('project.js',C.js(p));
 const save=(im,id)=>{if(!im?.src)return;const ext=im.src.includes('image/png')?'png':im.src.includes('image/jpeg')?'jpg':im.src.includes('image/gif')?'gif':'webp';z.file('images/'+filename(id)+'.'+ext,im.src.split(',')[1],{base64:true});};
 save(p.meta.image,'cover');save(p.meta.logo.light,'logo-light');save(p.meta.logo.dark,'logo-dark');for(const m of p.modules){save(m.image,m.id);for(const c of m.cards)save(c.image,c.id);for(const r of m.rows)for(const c of r.cards)save(c.image,c.id);}
 z.file('README.txt','progress.md：可阅读的创作进度（含隐藏项与作者备注）。\nproject.js / project.json：完整可恢复存档，已内嵌图片。\nimages/：供 Markdown 使用的独立图片。\n将 project.js、project.json 或本 ZIP 拖入图录工坊即可恢复。\n');
 const b=await z.generateAsync({type:'blob'});download(b,filename(p.meta.title)+'-同步包.zip');return b;
}
async function standalone(p,mode='edit',options={}){
 const clone=document.documentElement.cloneNode(true);clone.querySelector('#engram-boot')?.remove();
 for(const id of ['paper','moduleTree','inspectorBody','playLedger','progressStats','modalBody','exportMount']){const el=clone.querySelector('#'+id);if(el)el.innerHTML='';}
 clone.querySelector('#modal')?.removeAttribute('open');clone.querySelector('#panelBackdrop')?.setAttribute('hidden','');clone.querySelector('#offlineNotice')?.setAttribute('hidden','');clone.querySelector('.left-panel')?.classList.remove('mobile-open');clone.querySelector('.inspector')?.classList.remove('open');clone.querySelectorAll('[inert]').forEach(n=>{if(!n.classList.contains('inspector'))n.removeAttribute('inert');});clone.querySelector('body').classList.remove('panel-open');clone.querySelectorAll('link[rel=manifest],link[rel=apple-touch-icon]').forEach(n=>n.remove());clone.querySelector('#toast').classList.remove('show');clone.querySelector('body').classList.remove('export-busy');
 clone.querySelector('#app')?.removeAttribute('style');clone.querySelectorAll('[data-runtime-font]').forEach(n=>n.remove());
 clone.querySelectorAll('link[rel=stylesheet],style[data-app-style]').forEach(s=>s.remove());const style=document.createElement('style');style.setAttribute('data-app-style','');style.textContent=cssText();clone.querySelector('head').append(style);
 for(const script of clone.querySelectorAll('script[data-app-script][src]')){const src=script.getAttribute('src');try{const r=await fetch(src);if(!r.ok)throw new Error();script.textContent=await r.text();script.removeAttribute('src');}catch{throw new Error('源码版在 file:// 下不能读取脚本源码；请用交付的单文件 HTML 导出，或用本地服务器打开源码版。');}}
 const boot=document.createElement('script');boot.type='application/json';boot.id='engram-boot';boot.textContent=JSON.stringify({project:p,mode}).replace(/</g,'\\u003c');clone.querySelector('body').prepend(boot);
 clone.querySelector('title').textContent=p.meta.title+' · 图录工坊';
 const html='<!DOCTYPE html>\n'+clone.outerHTML;const blob=new Blob([html],{type:'text/html;charset=utf-8'});if(options.download!==false)download(blob,options.name||filename(p.meta.title)+(mode==='play'?'-试玩单页':'-可编辑单页')+'.html');return blob;
}
root.EngramExport={filename,download,textFile,cssText,svg,png,graphics,paginate,units,syncBundle,standalone};
})(globalThis);
