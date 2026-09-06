/* Engram Atelier 5.0.0 · project data and rules engine. No DOM, no eval. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.EngramCore = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const SCHEMA = 'engram-cyoa', VERSION = 1;
  const copy = value => JSON.parse(JSON.stringify(value));
  const uid = prefix => (prefix || 'id') + '_' + (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID().replace(/-/g, '').slice(0, 12) : Math.random().toString(36).slice(2, 14));
  const str = (v, d = '') => typeof v === 'string' ? v : d;
  const num = (v, d = 0) => typeof v === 'number' && Number.isFinite(v) ? v : d;
  const bound = (v, d, min, max) => Math.max(min, Math.min(max, num(v, d)));
  const arr = v => Array.isArray(v) ? v : [];
  const ids = v => [...new Set(arr(v).filter(x => typeof x === 'string'))];
  const one = (v, values, d) => values.includes(v) ? v : d;
  const hex = (v, d) => /^#[0-9a-fA-F]{6}$/.test(v || '') ? v : d;
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function image(v = {}) {
    return {src: /^data:image\/(png|jpeg|webp|gif);base64,[A-Za-z0-9+/=\s]+$/.test(v.src || '') ? v.src : '',
      name:str(v.name), alt:str(v.alt), caption:str(v.caption), credit:str(v.credit), ratio:one(v.ratio,['16/9','3/2','1/1','4/5','21/9','auto'],'1/1'),
      fit:one(v.fit,['cover','contain'],'cover'), x:bound(v.x,50,0,100), y:bound(v.y,50,0,100), show:v.show !== false};
  }
  function gate(v = {}) { return {visibility:one(v.visibility,['public','gated','author'],'public'), unlock:ids(v.unlock), unlockMode:one(v.unlockMode,['all','any'],'all')}; }
  function card(v = {}) {
    return {id:str(v.id,uid('c')), title:str(v.title), subtitle:str(v.subtitle), description:str(v.description), points:typeof v.points === 'number' && Number.isFinite(v.points) ? v.points : null,
      status:one(v.status,['draft','review','ready'],'draft'), badge:str(v.badge), span:Math.round(bound(v.span,1,1,6)), image:image(v.image), ...gate(v),
      requires:ids(v.requires), excludes:ids(v.excludes), notes:str(v.notes), fields:arr(v.fields).map(f=>({label:str(f.label),value:str(f.value)}))};
  }
  function row(v = {}) { return {id:str(v.id,uid('r')),title:str(v.title),description:str(v.description),required:!!v.required,cards:arr(v.cards).map(card)}; }
  const displayKeys=['moduleNumbers','moduleTitles','moduleSubtitles','selectionHints','cardNumbers','attributeTitles'];
  function display(v={}) {return Object.fromEntries(displayKeys.map(k=>[k,v[k]!==false]));}
  function heading(v={}) {return {id:str(v.id,uid('h')),title:str(v.title),subtitle:str(v.subtitle),before:str(v.before,'start'),align:one(v.align,['left','center','right'],'center'),size:bound(v.size,32,18,72),spacing:bound(v.spacing,22,0,96)};}
  function section(v = {}) {
    const type=one(v.type,['choices','attributes','text','scenario'],'choices');
    return {id:str(v.id,uid('m')),title:str(v.title),subtitle:str(v.subtitle),description:str(v.description),type,
      selection:one(v.selection,['single','multi','none'],type==='scenario'?'multi':'single'), required:!!v.required,
      min:Math.round(bound(v.min,0,0,9999)),max:Math.round(bound(v.max,0,0,9999)),columns:Math.round(bound(v.columns,type==='scenario'?1:3,1,6)),
      image:image(v.image || {show:false}),layout:one(v.layout,['grid','list'],'grid'),...gate(v),
      display:display(v.display),headings:arr(v.headings).map(heading),notes:str(v.notes), text:str(v.text),textStyle:one(v.textStyle,['plain','callout','divider'],'plain'),
      input:!!v.input,inputLabel:str(v.inputLabel,'你的记录'),cards:arr(v.cards).map(card), rows:arr(v.rows).map(row)};
  }
  function normalize(raw) {
    if (!raw || raw.schema !== SCHEMA || raw.version !== VERSION || !raw.meta || !Array.isArray(raw.modules))
      throw new Error('这不是受支持的图录工坊存档（需要 schema: engram-cyoa，version: 1）。');
    if(raw.modules.length>300) throw new Error('模块数量超过本编辑器的安全上限（300）。');
    const m=raw.meta,t=raw.theme||{},s=raw.settings||{};
    const p={schema:SCHEMA,version:VERSION,id:str(raw.id,uid('project')),
      meta:{title:str(m.title,'未命名项目'),subtitle:str(m.subtitle),kicker:str(m.kicker,'CYOA / WORK IN PROGRESS'),edition:str(m.edition,'v0.1'),author:str(m.author),
        intro:str(m.intro),rules:str(m.rules),footer:str(m.footer),notes:str(m.notes),tokenName:str(m.tokenName,'代币（待命名）'),tokenSymbol:str(m.tokenSymbol),
        initial:num(m.initial), brand:one(m.brand,['auto','stellagram','none','custom'],'auto'), logo:{light:image(m.logo?.light||{show:true}),dark:image(m.logo?.dark||{show:true}),align:one(m.logo?.align,['left','center','right'],'left'),width:bound(m.logo?.width,430,100,900),showSubtitle:m.logo?.showSubtitle!==false}, labels:{initial:str(m.labels?.initial,'INITIAL CONDITIONS'),image:str(m.labels?.image,'IMAGE / RESERVED'),end:str(m.labels?.end,'END OF RECORD'),record:str(m.labels?.record,'RECORD / 001'),decor:str(m.labels?.decor,'✧'),single:str(m.labels?.single,'单选'),multi:str(m.labels?.multi,'多选'),display:str(m.labels?.display,'展示'),attribute:str(m.labels?.attribute,'每行单选'),text:str(m.labels?.text,'自由文本')}, created:str(m.created,new Date().toISOString()), modified:str(m.modified,new Date().toISOString()),image:image(m.image || {show:false})},
      theme:{mode:one(t.mode,['light','dark'],'light'),accent:hex(t.accent,'#8267A6'),gold:hex(t.gold,'#5D789D'),positive:hex(t.positive,'#527E6F'),negative:hex(t.negative,'#CA8790'),
        background:hex(t.background,t.mode==='dark'?'#141518':'#F1F0ED'),surface:hex(t.surface,t.mode==='dark'?'#1E2024':'#FAF9F6'),
        text:hex(t.text,t.mode==='dark'?'#F1F0ED':'#25272B'),muted:hex(t.muted,t.mode==='dark'?'#B7B6BD':'#63666C'),
        font:one(t.font,['rajdhani','sans','serif'],'rajdhani'),bodySize:bound(t.bodySize,20,16,34),cardTitleSize:bound(t.cardTitleSize,28,20,48),moduleTitleSize:bound(t.moduleTitleSize,36,24,64),wear:bound(t.wear,0,0,40),titleSize:bound(t.titleSize,64,24,100),width:bound(t.width,1380,560,2200),
        gap:bound(t.gap,24,8,56),radius:bound(t.radius,2,0,24),grid:t.grid !== false,placeholders:t.placeholders !== false,showStatus:!!t.showStatus,showRules:t.showRules !== false,showDecor:t.showDecor !== false,showFooter:t.showFooter !== false},
      output:{...display(raw.output),pageLabels:raw.output?.pageLabels!==false},settings:{enforceBudget:!!s.enforceBudget,showLocked:!!s.showLocked},modules:raw.modules.map(section),
      play:{selected:ids(raw.play?.selected),answers:{},name:str(raw.play?.name),note:str(raw.play?.note)}};
    const allIds = new Set();
    const claim = id => { if(!/^[A-Za-z0-9_-]{1,100}$/.test(id))throw new Error('标识符只接受 1–100 位字母、数字、下划线或连字符：'+id); if(!id || allIds.has(id)) throw new Error('存档包含空白或重复的标识符：'+id); allIds.add(id); };
    p.modules.forEach(m=>{claim(m.id);m.headings.forEach(h=>claim(h.id)); m.cards.forEach(c=>claim(c.id)); m.rows.forEach(r=>{claim(r.id);r.cards.forEach(c=>claim(c.id));});
      if(typeof raw.play?.answers?.[m.id]==='string') p.play.answers[m.id]=raw.play.answers[m.id];});
    if(index(p).size>6000) throw new Error('卡片数量超过安全上限（6000）。');
    p.play.selected=p.play.selected.filter(id=>index(p).has(id));
    return p;
  }
  function index(p) {
    const map=new Map();
    p.modules.forEach((m,mi)=>{
      if(m.type==='attributes')m.rows.forEach((r,ri)=>r.cards.forEach((c,ci)=>map.set(c.id,{card:c,module:m,row:r,group:r.id,mode:'single',path:`modules.${mi}.rows.${ri}.cards.${ci}`})));
      else if(m.type!=='text')m.cards.forEach((c,ci)=>map.set(c.id,{card:c,module:m,row:null,group:m.id,mode:m.selection,path:`modules.${mi}.cards.${ci}`}));
    }); return map;
  }
  function unlocked(v, selected) { return v.visibility==='public' || (v.visibility==='gated' && v.unlock.length>0 && (v.unlockMode==='any'?v.unlock.some(id=>selected.has(id)):v.unlock.every(id=>selected.has(id)))); }
  function visible(entry, selected) { return unlocked(entry.module,selected) && unlocked(entry.card,selected); }
  function balance(p, selected=p.play.selected) { const ix=index(p); return Math.round((p.meta.initial+selected.reduce((s,id)=>s+(ix.get(id)?.card.points||0),0))*1e6)/1e6; }
  function toggle(p, id) {
    const ix=index(p),e=ix.get(id); if(!e||e.mode==='none') return {ok:false,error:'这是展示卡片，不能选择。'};
    const set=new Set(p.play.selected);
    if(set.has(id))set.delete(id);
    else {
      if(!visible(e,set))return {ok:false,error:'此选项尚未解锁。'};
      if(e.mode==='single') for(const s of [...set])if(ix.get(s)?.group===e.group)set.delete(s);
      set.add(id);
    }
    // Removing or replacing a prerequisite also removes now-ineligible dependants.
    let changed=true;
    while(changed){changed=false;for(const sid of [...set]){const k=ix.get(sid);if(!k||!visible(k,set)||k.card.requires.some(r=>!set.has(r))){
      if(sid===id&&!p.play.selected.includes(id))return {ok:false,error:'缺少前置选项：'+k.card.requires.filter(r=>!set.has(r)).map(r=>ix.get(r)?.card.title||r).join('、')};
      set.delete(sid);changed=true;
    }}}
    for(const sid of set){const k=ix.get(sid);const conflict=k.card.excludes.find(x=>set.has(x));if(conflict)return {ok:false,error:`“${k.card.title||sid}”与“${ix.get(conflict)?.card.title||conflict}”互斥。`};}
    for(const m of p.modules){if(m.type!=='attributes'&&m.max>0&&[...set].filter(x=>ix.get(x)?.module.id===m.id).length>m.max)return {ok:false,error:`“${m.title}”最多选择 ${m.max} 项。`};}
    if(p.settings.enforceBudget&&balance(p,[...set])<0)return {ok:false,error:'余额不足。可先选择返还资源的选项，或在项目设置中关闭严格预算。'};
    return {ok:true,selected:[...set],removed:p.play.selected.filter(s=>!set.has(s))};
  }
  function validate(p) {
    const ix=index(p),set=new Set(p.play.selected),issues=[];const push=(level,text)=>issues.push({level,text});
    if(balance(p)<0)push('error','当前余额为负，构筑尚未完成。');
    for(const id of set){const e=ix.get(id);if(!e)continue;
      if(!visible(e,set))push('error',`已选“${e.card.title}”现在不可见或未解锁。`);
      if(e.card.points===null)push('warning',`已选“${e.card.title||id}”尚未定价，暂按 0 计算。`);
      for(const r of e.card.requires)if(!set.has(r))push('error',`“${e.card.title}”缺少前置“${ix.get(r)?.card.title||r}”。`);
      for(const r of e.card.excludes)if(set.has(r))push('error',`“${e.card.title}”与“${ix.get(r)?.card.title||r}”互斥。`);
    }
    for(const m of p.modules){if(!unlocked(m,set)||m.type==='text')continue;
      if(m.type==='attributes'){for(const r of m.rows){const n=r.cards.filter(c=>set.has(c.id)).length;if(r.required&&n===0)push('error',`“${m.title} / ${r.title}”尚未选择。`);if(n>1)push('error',`“${r.title}”只能选择一项。`);}}
      else if(m.selection!=='none'){const n=m.cards.filter(c=>set.has(c.id)).length;const min=Math.max(m.min,m.required?1:0);
        if(n<min)push('error',`“${m.title}”至少选择 ${min} 项。`);if(m.selection==='single'&&n>1)push('error',`“${m.title}”只能选择一项。`);if(m.max>0&&n>m.max)push('error',`“${m.title}”最多选择 ${m.max} 项。`);}
    }
    return issues;
  }
  function audit(p) {
    const ix=index(p),out=[];
    for(const [id,e]of ix){if(e.card.points===null)out.push({level:'info',text:`待定价：${e.card.title||id}`});
      for(const key of ['requires','excludes','unlock'])for(const r of e.card[key]){if(!ix.has(r))out.push({level:'error',text:`${e.card.title||id} 的 ${key} 引用了不存在的卡片：${r}`});if(r===id)out.push({level:'warning',text:`${e.card.title||id} 的 ${key} 引用了自身。`});}
      if(e.card.visibility==='gated'&&!e.card.unlock.length)out.push({level:'warning',text:`“${e.card.title}”设为条件解锁，但尚未设置条件。`});}
    for(const m of p.modules){for(const r of m.unlock)if(!ix.has(r))out.push({level:'error',text:`模块“${m.title}”引用了不存在的解锁项 ${r}`});if(m.visibility==='gated'&&!m.unlock.length)out.push({level:'warning',text:`模块“${m.title}”未设置解锁条件。`});}
    return out;
  }
  function js(p) {return '// ENGRAM CYOA DATA v1\n// 数据存档：导入时仅解析 JSON，不执行脚本。\nwindow.ENGRAM_PROJECT = '+JSON.stringify(p,null,2)+';\n';}
  function parse(text) {
    text=String(text).replace(/^\uFEFF/,'').trim();
    if(text.startsWith('{'))return normalize(JSON.parse(text));
    // Only our data assignment form is accepted; arbitrary JavaScript is never run.
    const match=text.match(/^(?:(?:\/\/[^\r\n]*)(?:\r?\n|$)\s*)*(?:window\.ENGRAM_PROJECT\s*=|const\s+ENGRAM_PROJECT\s*=|export\s+default)\s*([\s\S]*?)\s*;?\s*$/);
    if(!match)throw new Error('JS 文件必须是本工坊导出的纯数据赋值格式；不会执行任意脚本。');
    return normalize(JSON.parse(match[1].replace(/;\s*$/,'')));
  }
  function cloneSection(m) {
    const c=copy(m),map=new Map(); map.set(c.id,uid('m'));c.headings.forEach(h=>map.set(h.id,uid('h')));c.cards.forEach(k=>map.set(k.id,uid('c')));c.rows.forEach(r=>{map.set(r.id,uid('r'));r.cards.forEach(k=>map.set(k.id,uid('c')));});
    const walk=o=>{o.id=map.get(o.id);for(const key of ['requires','excludes','unlock'])if(o[key])o[key]=o[key].map(x=>map.get(x)||x);};
    walk(c);c.headings.forEach(h=>{h.id=map.get(h.id);h.before=map.get(h.before)||h.before;});c.cards.forEach(walk);c.rows.forEach(r=>{walk(r);r.cards.forEach(walk);});c.title+=(c.title?' · 副本':'副本');return c;
  }
  const fmt=n=>Number.isFinite(n)?(n>0?'+':'')+n:'待定';
  function markdown(p,assets=false,playerOnly=false) {
    const ix=index(p),s=new Set(p.play.selected),name=id=>ix.get(id)?.card.title||id;
    const line=(k,v)=>v!==''&&v!=null?`**${k}：** ${v}\n`:'';
    const im=(v,id)=>!v?.src?'':assets?`![${v.alt||v.name||'图片'}](images/${id}.${v.src.includes('image/png')?'png':v.src.includes('image/jpeg')?'jpg':v.src.includes('image/gif')?'gif':'webp'})\n${v.caption||''}\n${v.credit?'图片来源：'+v.credit:''}\n`:`[图片：${v.name||v.alt||id}；图像数据保存在 JS/JSON 存档中]\n${v.caption||''}\n${v.credit?'图片来源：'+v.credit:''}\n`;
    let o=`# ${p.meta.title}\n\n${p.meta.subtitle}\n\n`+line('顶部标记',p.meta.kicker)+line('版本',p.meta.edition)+line('作者',p.meta.author)+line('项目 ID',p.id)+line('更新时间',p.meta.modified);
    if(!playerOnly)o+='\n## 项目说明\n\n'+p.meta.intro+'\n\n## 基础规则\n\n'+p.meta.rules+'\n\n'+line('代币名称',p.meta.tokenName)+line('单位',p.meta.tokenSymbol||'未设置')+line('初始余额',p.meta.initial)+line('严格预算',p.settings.enforceBudget?'开启':'关闭：允许暂时透支，结算仍报错')+line('图件显示设置',Object.entries(p.output).map(([k,v])=>k+': '+v).join('；'))+im(p.meta.image,'cover')+line('标题方式',p.meta.brand)+im(p.meta.logo.light,'logo-light')+im(p.meta.logo.dark,'logo-dark')+(p.meta.notes?'\n### 创作备注（不向试玩者显示）\n\n'+p.meta.notes+'\n':'');
    const outCard=c=>{let x=`\n#### ${s.has(c.id)?'[x]':'[ ]'} ${c.title||'未命名选项'}\n\n`+line('ID',c.id)+line('副标题',c.subtitle)+line('资源变化',fmt(c.points)+(p.meta.tokenSymbol?' '+p.meta.tokenSymbol:''))+line('状态',{draft:'草稿',review:'待复核',ready:'已完成'}[c.status])+line('可见性',{public:'公开',gated:'条件解锁',author:'仅作者'}[c.visibility])+line('标签',c.badge)+'\n'+c.description+'\n'+im(c.image,c.id);
      for(const [key,label]of [['requires','前置（全部）'],['excludes','互斥'],['unlock','解锁条件（'+(c.unlockMode==='all'?'全部':'任一')+'）']])if(c[key].length)x+=line(label,c[key].map(id=>`${name(id)} [${id}]`).join('；'));
      for(const f of c.fields)x+='\n'+line(f.label||'自定义字段',f.value);
      if(c.notes&&!playerOnly)x+='\n**作者备注：** '+c.notes+'\n';return x;};
    if(!playerOnly)for(const [mi,m]of p.modules.entries()){
      o+=`\n---\n\n## ${String(mi+1).padStart(2,'0')} · ${m.title||'未命名模块'}\n\n`+line('ID',m.id)+line('类型',m.type)+line('副标题',m.subtitle)+line('选择方式',m.type==='attributes'?'每行单选':m.selection)+line('选择数量',`至少 ${Math.max(m.min,m.required?1:0)}；${m.max?'最多 '+m.max:'不设数量上限（单选仍限一项）'}`)+line('可见性',m.visibility)+'\n'+m.description+'\n'+im(m.image,m.id);
      o+=line('排版开关',Object.entries(m.display).map(([k,v])=>k+': '+v).join('；'));
      for(const h of m.headings)o+='\n### 展示标题行：'+(h.title||'（未填写）')+'\n'+line('副标题',h.subtitle)+line('对齐',h.align)+line('插入位置',h.before)+line('字号',h.size);
      if(m.unlock.length)o+=line('解锁条件',m.unlock.map(id=>`${name(id)} [${id}]`).join('；'))+line('解锁模式',m.unlockMode);
      if(m.type==='text')o+='\n'+m.text+'\n'+(m.input?line(m.inputLabel,p.play.answers[m.id]||'（未填写）'):'');
      else if(m.type==='attributes')for(const r of m.rows){o+='\n### '+r.title+'\n\n'+r.description+'\n'+line('必选',r.required?'是':'否');for(const c of r.cards)o+=outCard(c);}
      else for(const c of m.cards)o+=outCard(c);
      if(m.notes)o+='\n**模块创作备注：** '+m.notes+'\n';
    }
    o+='\n---\n\n## 当前试玩构筑\n\n'+line('构筑名称',p.play.name)+line('剩余资源',balance(p)+(p.meta.tokenSymbol?' '+p.meta.tokenSymbol:''));
    for(const id of s){const e=ix.get(id);if(e)o+=playerOnly?outCard(e.card):`- ${e.module.title}${e.row?' / '+e.row.title:''}：${e.card.title}（${fmt(e.card.points)}） [${id}]\n`;}
    for(const m of p.modules)if(m.input&&p.play.answers[m.id])o+='\n'+line(m.inputLabel,p.play.answers[m.id]);
    o+='\n'+line('试玩备注',p.play.note);
    const issues=validate(p);o+='\n### 构筑校验\n\n'+(issues.length?issues.map(i=>'- ['+i.level+'] '+i.text).join('\n'):'没有发现构筑冲突。未选择的占位内容仍可能需要完善。')+'\n';
    if(!playerOnly){o+='\n## 编辑状态\n\n'+line('模块数',p.modules.length)+line('卡片数',ix.size)+line('未定价卡片',[...ix.values()].filter(e=>e.card.points===null).length)+line('草稿卡片',[...ix.values()].filter(e=>e.card.status==='draft').length)+'\n### 图件表层文字\n\n'+Object.entries(p.meta.labels).map(([k,v])=>line(k,v)).join('')+'\n'+p.meta.footer+'\n';}
    return o;
  }
  return {SCHEMA,VERSION,uid,copy,esc,image,card,row,section,heading,display,displayKeys,normalize,index,unlocked,visible,balance,toggle,validate,audit,js,parse,cloneSection,fmt,markdown};
});
