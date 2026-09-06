/* Engram Atelier 5.0.0 · local-first authoring application */
(function(root){
'use strict';
const C=root.EngramCore,V=root.EngramView,X=root.EngramExport,E=C.esc,$=s=>document.querySelector(s);
const key='engram-atelier:'+location.pathname;let project,target={kind:'project'},mode='edit',undoStack=[],redoStack=[],timer,previewTimer,toastTimer,dirty=false,dbPromise,modalKind='',imagePath='',dragId='',exporting=false;
let canvasScope='module',focusId='cover',moduleFilter='all';
let exportPrefs={type:'full',scope:'author',width:1080,height:1528,scale:2,columns:0,segmentHeight:1600,placeholders:true,status:false,selections:false,notes:false};
const Store=root.EngramStorage;
function toast(text){$('#toast').textContent=text;$('#toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('show'),4600);}
function get(path){return path.split('.').reduce((o,k)=>o?.[k],project);}
function set(path,value){const parts=path.split('.');if(parts.some(k=>['__proto__','prototype','constructor'].includes(k)))throw new Error('不安全的数据路径');let o=project;for(const k of parts.slice(0,-1)){if(o[k]===undefined)throw new Error('数据路径不存在');o=o[k];}o[parts.at(-1)]=value;}
function snapshot(){return JSON.stringify(project);}
function checkpoint(){const s=snapshot();if(undoStack.at(-1)!==s){undoStack.push(s);while(undoStack.length>35||undoStack.reduce((n,s)=>n+s.length,0)>25000000&&undoStack.length>1)undoStack.shift();}redoStack=[];}
function updateHistoryButtons(){document.querySelector('[data-action=undo]').disabled=!undoStack.length;document.querySelector('[data-action=redo]').disabled=!redoStack.length;}
function syncSaveIndicator(ok){const el=document.querySelector('.inspector-save>span');if(el){el.innerHTML='<i style="background:'+ (ok?'var(--c-dec)':'var(--c-nul)')+'"></i>'+ (ok?'本地已保存':'请导出存档备份');}}
async function save(){clearTimeout(timer);const value=C.copy(project),stamp=value.meta.modified;$('#saveState').textContent='正在保存…';try{const storage=await Store.set(key,value);if(project.meta.modified===stamp){dirty=false;syncSaveIndicator(true);$('#saveState').textContent='本地已保存 · '+new Date().toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit'})+(storage==='LocalStorage'?' · 备用存储':'');}}catch(e){dirty=true;syncSaveIndicator(false);$('#saveState').textContent=e.name==='ConflictError'?'存在较新版本 · 请处理冲突':'保存失败 · 请导出备份';toast(e.message);}return !dirty;}
function changed(rebuild=false){dirty=true;project.meta.modified=new Date().toISOString();Store.journal(project);$('#saveState').textContent='修改待保存…';clearTimeout(timer);timer=setTimeout(save,550);updateHistoryButtons();if(rebuild)render();else{clearTimeout(previewTimer);previewTimer=setTimeout(()=>{renderPreview();renderTree();renderHeader();updateLiveMarkdown();},90);}}
function apply(fn,rebuild=true){checkpoint();fn();changed(rebuild);}
function findHeading(id){for(const [mi,m]of project.modules.entries())for(const [hi,h]of m.headings.entries())if(h.id===id)return {heading:h,module:m,path:`modules.${mi}.headings.${hi}`};return null;}
function findModule(id){return project.modules.find(m=>m.id===id);}
function modPath(id){return 'modules.'+project.modules.findIndex(m=>m.id===id);}
function findRow(id){for(const [mi,m]of project.modules.entries())for(const[ri,r]of m.rows.entries())if(r.id===id)return {row:r,module:m,path:`modules.${mi}.rows.${ri}`};return null;}
function cardList(id){const e=C.index(project).get(id);if(!e)return null;const list=e.row?e.row.cards:e.module.cards;return {e,list,i:list.findIndex(c=>c.id===id)};}
function selectTarget(kind,id){target={kind,id};
 if(kind==='module')focusId=id;
 else if(kind==='card')focusId=C.index(project).get(id)?.module.id||focusId;
 else if(kind==='heading')focusId=findHeading(id)?.module.id||focusId;
 else if(kind==='row')focusId=findRow(id)?.module.id||focusId;
 renderInspector();renderTree();renderPreview();setInspector(true);
}
function setInspector(open){document.documentElement.style.setProperty('--sheet-top',document.querySelector('.workspace').getBoundingClientRect().top+'px');const el=document.querySelector('.inspector');el.classList.toggle('open',open);el.inert=!open;el.setAttribute('aria-hidden',String(!open));document.querySelector('[data-action="toggle-inspector"]').setAttribute('aria-expanded',String(open));syncPanelState();}

function themeUI(){const dark=project.theme.mode==='dark',r=document.documentElement.style;
 const palette=dark?{'--ui-bg':'#141518','--ui-panel':'#1B1D21','--ui-field':'#26282D','--ui-text':'#EAE7E2','--ui-muted':'#B7B6BD','--ui-line':'#41424A','--ui-soft':'#302B39','--ui-inverse':'#141518'}:{'--ui-bg':'#ECECE9','--ui-panel':'#F6F5F2','--ui-field':'#E8E8E4','--ui-text':'#25272B','--ui-muted':'#63666C','--ui-line':'#C9CBC6','--ui-soft':'#E4DFEB','--ui-inverse':'#FAF9F6'};
 Object.entries(palette).forEach(([k,v])=>r.setProperty(k,v));r.setProperty('--ui-accent',dark?'#BCA8D5':project.theme.accent);for(const [k,v]of Object.entries({'--c-met':project.theme.accent,'--c-dec':project.theme.positive,'--c-phm':project.theme.gold,'--c-nul':project.theme.negative}))r.setProperty(k,v);r.setProperty('color-scheme',dark?'dark':'light');$('#app').dataset.uiTheme=dark?'dark':'light';document.body.dataset.theme=dark?'dark':'light';
}

function renderHeader(){themeUI();$('#projectName').textContent=project.meta.title;document.title=project.meta.title+' · 图录工坊';
 $('#stageMode').textContent=mode==='edit'?'编辑画布':'试玩构筑';$('#stageHint').textContent=mode==='edit'?'点击卡片编辑':'点击卡片选择';
 $('#themeBtn').title=project.theme.mode==='dark'?'切换浅色':'切换深色';$('#themeBtn').setAttribute('aria-label',$('#themeBtn').title);
 $('#placeholderBtn').textContent=project.theme.placeholders?'隐藏图位':'显示图位';
 document.querySelectorAll('[data-action=mode]').forEach(b=>b.classList.toggle('active',b.dataset.value===mode));
 document.querySelectorAll('[data-action=canvas-scope]').forEach(b=>b.classList.toggle('active',b.dataset.value===canvasScope));
 $('#tokenName').textContent=project.meta.tokenSymbol||project.meta.tokenName;
 $('#tokenValue').textContent=C.balance(project);$('#tokenValue').classList.toggle('negative',C.balance(project)<0);
 $('#tokenCaption').textContent=mode==='play'?'当前余额':'初始资源';
 if(mode==='edit')$('#tokenValue').textContent=project.meta.initial;
 $('#viewCount').textContent=project.modules.length+' MODULES / '+C.index(project).size+' OPTIONS';
 document.querySelectorAll('[data-action=filter]').forEach(b=>b.classList.toggle('active',b.dataset.value===moduleFilter));
 $('#stageEnd').hidden=canvasScope==='module';updateHistoryButtons();const mb=$('#mobilePlayButton');if(mb){mb.innerHTML=mode==='play'?'<span aria-hidden="true">✎</span>创作':'<span aria-hidden="true">▷</span>试玩';mb.setAttribute('aria-label',mode==='play'?'切回创作模式':'进入试玩模式');}document.dispatchEvent(new Event('engram-render')); 
}

function renderTree(){const tree=$('#moduleTree'),scroll=tree.scrollTop,query=$('#search').value.trim().toLowerCase(),set=new Set(project.play.selected),ix=C.index(project);let html='';
 project.modules.forEach((m,i)=>{if(moduleFilter!=='all'&&m.type!==moduleFilter)return;if(mode==='play'&&!C.unlocked(m,set))return;const cs=[...ix.values()].filter(e=>e.module.id===m.id);if(query&&!(m.title+' '+m.subtitle+' '+cs.map(e=>e.card.title).join(' ')).toLowerCase().includes(query))return;
 const active=canvasScope==='module'&&focusId===m.id||target.kind==='module'&&target.id===m.id||target.kind==='card'&&ix.get(target.id)?.module.id===m.id||target.kind==='heading'&&findHeading(target.id)?.module.id===m.id||target.kind==='row'&&findRow(target.id)?.module.id===m.id;
 html+=`<div class="tree-item ${active?'active':''}" data-type="${E(m.type)}" data-action="nav-module" data-id="${E(m.id)}" draggable="${mode==='edit'}" tabindex="0" role="button"><span class="tree-index">${String(i+1).padStart(2,'0')}</span><span class="tree-name">${E(m.title||'未命名模块')}<small>${E(m.subtitle)||{choices:'CHOICES',attributes:'ATTRIBUTES',text:'TEXT',scenario:'SCENARIO'}[m.type]}${m.visibility==='public'?'':m.visibility==='author'?' · 仅作者':' · 条件解锁'}</small></span><span class="tree-count">${m.type==='text'?'—':cs.length}<small>${m.type==='text'?'TEXT':'ITEMS'}</small></span></div>`;
 });tree.innerHTML=html||'<p class="hint">暂无匹配的模块。</p>';tree.scrollTop=scroll;
 const entries=[...ix.values()],ready=entries.filter(e=>e.card.status==='ready').length,pct=entries.length?Math.round(ready/entries.length*100):0;
 $('#progressStats').innerHTML=`<div class="progress-line"><span>填写进度</span><span class="mono">${pct}%</span></div><div class="progress-track"><i style="width:${pct}%"></i></div><div class="progress-line"><span>${project.modules.length} 模块 · ${entries.length} 选项</span><span>${ready} 已完成</span></div>`;
}
function renderPreview(){const scroll=$('#stageScroll'),pos=scroll.scrollTop;
 const visible=project.modules.filter(m=>mode==='edit'||C.unlocked(m,new Set(project.play.selected)));
 if(focusId!=='cover'&&!visible.some(m=>m.id===focusId))focusId=visible[0]?.id||'cover';
 const opts={author:mode==='edit',target:target.id,focus:true};
 if(canvasScope==='all')$('#paper').innerHTML=V.document(project,{author:mode==='edit',target:target.id});
 else if(focusId==='cover')$('#paper').innerHTML=`<article class="${V.classes(project,opts)} cover-paper" style="${E(V.style(project))}">${V.hero(project,opts)}<div class="overview-actions"><button class="btn primary" data-action="project">编辑开场与规则 ↗</button>${project.modules.length?'<button class="btn" data-action="first-module">进入模块 →</button>':'<button class="btn" data-action="add-module">添加第一个模块 ＋</button>'}</div></article>`;
 else{const m=findModule(focusId),i=project.modules.indexOf(m);$('#paper').innerHTML=`<article class="${V.classes(project,opts)}" style="${E(V.style(project))}"><div class="focus-top"><span>${E(project.meta.title)} / ${E(project.meta.subtitle)}</span><span>${E(project.meta.edition)}</span></div>${V.section(m,project,i,opts)}<div class="module-pagination"><button class="text-btn" data-action="prev-module">← 上一模块</button><span>${String(visible.indexOf(m)+1).padStart(2,'0')} / ${String(visible.length).padStart(2,'0')}</span><button class="text-btn" data-action="next-module">下一模块 →</button></div></article>`;}
 $('#paperWrap').style.maxWidth=project.theme.width+'px';renderLedger();scroll.scrollTop=pos;
 document.querySelector('[data-action="cover"]').classList.toggle('active',canvasScope==='module'&&focusId==='cover');
}

function renderLedger(){const e=$('#playLedger');e.classList.toggle('visible',mode==='play');if(mode!=='play')return;const bal=C.balance(project),issues=C.validate(project);
 e.innerHTML=`<div class="ledger-main"><div><div class="ledger-amount ${bal<0?'negative':''}">${E(bal)} <span style="font-size:18px">${E(project.meta.tokenSymbol||project.meta.tokenName)}</span></div><small>初始 ${project.meta.initial} / 已选 ${project.play.selected.length} 项${[...C.index(project).values()].some(e=>e.card.points===null)?' / 未定价选项暂按 0 计算':''}</small></div><div><button class="btn" data-action="build-summary">构筑摘要</button> <button class="btn" data-action="clear-play">重置选择</button></div></div>${issues.length?`<div class="ledger-issues">${issues.filter(i=>i.level==='error').length?'构筑尚未通过校验':'存在未定价选项'} · ${issues.length} 条提示，见右侧构筑面板。</div>`:''}`;
}
function F(label,path,type='text',options={}){const value=get(path),attrs=`data-bind="${E(path)}" ${options.cast?`data-cast="${options.cast}"`:''}`;let control;
 if(type==='textarea')control=`<textarea ${attrs} rows="${options.rows||3}" placeholder="${E(options.placeholder||'')}" spellcheck="false">${E(value||'')}</textarea>`;
 else if(type==='select')control=`<select ${attrs}>${(options.items||[]).map(a=>`<option value="${E(a[0])}" ${String(value)===String(a[0])?'selected':''}>${E(a[1])}</option>`).join('')}</select>`;
 else control=`<input ${attrs} type="${type}" value="${E(value??'')}" ${['number','range'].includes(type)?`step="${options.step||'any'}" ${options.min!=null?`min="${options.min}"`:''} ${options.max!=null?`max="${options.max}"`:''}`:''} placeholder="${E(options.placeholder||'')}" spellcheck="false">`;
 return `<label class="field"><span>${E(label)}</span>${control}${options.hint?`<small>${E(options.hint)}</small>`:''}</label>`;
}
function check(label,path){return `<label class="check-field"><input type="checkbox" data-bind="${E(path)}" ${get(path)?'checked':''}>${E(label)}</label>`;}
function refs(label,path,exclude=''){const list=get(path)||[];return `<div class="field ref-picker"><span>${E(label)}</span><input type="search" class="ref-search" data-ref-search placeholder="筛选卡片…" aria-label="筛选${E(label)}"><div class="ref-list">${[...C.index(project).values()].filter(e=>e.card.id!==exclude).map(e=>`<label><input type="checkbox" data-ref-path="${E(path)}" data-ref-id="${E(e.card.id)}" ${list.includes(e.card.id)?'checked':''}><span>${E(e.module.title)} / ${E(e.card.title||e.card.id)}</span></label>`).join('')}</div><small>点选即可多选；留空为无条件。</small></div>`;}
function gates(path,id=''){return F('可见性',path+'.visibility','select',{items:[['public','公开显示'],['gated','满足条件后显示'],['author','仅作者可见']]})+(get(path+'.visibility')==='gated'?F('解锁逻辑',path+'.unlockMode','select',{items:[['all','所有条件都满足'],['any','任一条件满足']]})+refs('显示前需要选中',path+'.unlock',id):'');}
function imageEditor(path){const v=get(path),label=path==='meta.logo.light'?'浅色主题 Logo':path==='meta.logo.dark'?'深色主题 Logo':'图片与预留图位';return `<details><summary>${label}</summary>${check('显示此图片区域',path+'.show')}<div class="image-drop" data-action="image-upload" data-image-path="${E(path)}" tabindex="0" role="button">${v.src?`<img src="${E(v.src)}" alt="${E(v.alt)}">`:'<span class="plus">＋</span><span>选择图片，或拖到此处</span><small>PNG / JPG / WebP / GIF</small>'}</div>${v.src?`<button class="btn small" data-action="image-remove" data-path="${E(path)}">移除图片</button><p class="hint">${E(v.name)}</p>`:''}<div class="field-row">${F('比例',path+'.ratio','select',{items:[['16/9','16 : 9'],['21/9','21 : 9'],['3/2','3 : 2'],['1/1','1 : 1'],['4/5','4 : 5'],['auto','原始比例']]})}${F('适配',path+'.fit','select',{items:[['cover','填满并裁剪'],['contain','完整显示']]})}</div><div class="field-row">${F('焦点 X (%)',path+'.x','number',{min:0,max:100})}${F('焦点 Y (%)',path+'.y','number',{min:0,max:100})}</div>${F('替代文字',path+'.alt')}${F('图片说明',path+'.caption')}${F('来源 / 署名',path+'.credit')}<p class="hint">图片会内嵌存档；导入时转为最长边不超过 2200 px 的 WebP 静态图，不依赖外链。</p></details>`;}
let lastInspectorKey='';
function renderInspector(){const inspectorKey=target.kind+':'+(target.id||'');const opens=lastInspectorKey===inspectorKey?[...document.querySelectorAll('#inspectorBody details[open]')].map(d=>d.querySelector('summary').textContent.replace(/（\d+）/g,'')):[];lastInspectorKey=inspectorKey;if(mode==='play'){renderBuild();return;}let html='',title='',tag='';
 if(target.kind==='project'){
  title='项目设置';tag='PROJECT';html=`<div class="subhead">基本信息 <span class="mono">01</span></div>${F('项目标题','meta.title')}${F('英文名 / 副标题','meta.subtitle')}${F('顶部标记','meta.kicker')}<div class="field-row">${F('版本','meta.edition')}${F('作者','meta.author')}</div>${F('开场语','meta.intro','textarea',{rows:4,placeholder:'从这里写下世界的第一句话…'})}${F('基本规则','meta.rules','textarea',{rows:4,placeholder:'选择、预算与冲突的规则…'})}
  <div class="subhead">资源与预算 <span class="mono">02</span></div>${F('代币名称','meta.tokenName')}<div class="field-row">${F('单位 / 符号','meta.tokenSymbol')}${F('初始数量','meta.initial','number')}</div>${check('禁止操作中出现负余额','settings.enforceBudget')}${check('为未解锁内容显示匿名占位','settings.showLocked')}<p class="hint">默认允许暂时透支，最终校验仍会提示负余额。未定价选项以“待定”显示，不会自动视为已完成。</p>
  <details class="branding-settings"><summary>文字标题与自定义 Logo</summary>${F('封面标题方式','meta.brand','select',{items:[['none','文字标题'],['custom','上传自己的 Logo'],['stellagram','随星录文字 Logo'],['auto','按项目名称识别']]})}<p class="hint">自定义 Logo 用于封面左侧标题；未上传时显示文字。两套只传一套也可以；透明 PNG 效果最好。</p><h3 class="inspector-subtitle">浅色界面 Logo</h3>${imageEditor('meta.logo.light')}<h3 class="inspector-subtitle">深色界面 Logo</h3>${imageEditor('meta.logo.dark')}<div class="field-row">${F('Logo 对齐','meta.logo.align','select',{items:[['left','左对齐'],['center','居中'],['right','右对齐']]})}${F('Logo 最大宽度','meta.logo.width','number',{min:100,max:900})}</div>${check('Logo 下方显示项目副标题','meta.logo.showSubtitle')}</details>${imageEditor('meta.image')}<details><summary>版式、字体与配色</summary><div class="inspector-actions"><button class="btn" data-action="apply-qualithm">套用协调配色与排版</button><button class="btn" data-action="fonts">原项目字体…</button></div>${F('视觉模式','theme.mode','select',{items:[['light','日照 / 浅色'],['dark','夜航 / 深色']]})}${F('字体风格','theme.font','select',{items:[['rajdhani','QUALITHM · Rajdhani / 明体（中宋）'],['sans','系统无衬线'],['serif','衬线 / 系统宋体']]})}<div class="field-row">${F('说明文字','theme.bodySize','number',{min:16,max:34})}${F('选项标题','theme.cardTitleSize','number',{min:20,max:48})}</div><div class="field-row">${F('模块标题','theme.moduleTitleSize','number',{min:22,max:56})}${F('封面文字标题','theme.titleSize','number',{min:24,max:100})}</div>${F('预览最大宽度','theme.width','number',{min:560,max:2200})}<div class="field-row">${F('卡片间距','theme.gap','number',{min:6,max:48})}${F('圆角','theme.radius','number',{min:0,max:24})}</div><div class="field-row">${F('强调色','theme.accent','color')}${F('正文色','theme.text','color')}${F('背景色','theme.background','color')}${F('卡片底色','theme.surface','color')}${F('次级文字','theme.muted','color')}${F('钴蓝辅助','theme.gold','color')}${F('资源增加','theme.positive','color')}${F('资源消耗','theme.negative','color')}</div><div class="wear-control">${F('做旧强度 · 0 为完全关闭','theme.wear','range',{min:0,max:40,step:1})}<div class="wear-actions"><button class="btn small" data-action="wear-preset" data-value="0">关闭</button><button class="btn small" data-action="wear-preset" data-value="7">轻微</button><button class="btn small" data-action="wear-preset" data-value="15">适中</button><output id="wearValue">${get('theme.wear')}</output></div></div>${check('透视网格与斜向背景','theme.grid')}${check('显示未填充的图片占位','theme.placeholders')}${check('显示卡片草稿状态','theme.showStatus')}${check('显示初始资源与规则框','theme.showRules')}${check('显示封面几何装饰','theme.showDecor')}${check('显示页脚','theme.showFooter')}</details>
  <details><summary>图件中的界面文字</summary>${F('初始条件标题','meta.labels.initial')}${F('图片占位文字','meta.labels.image')}${F('封面装饰编号','meta.labels.record')}${F('结束标记','meta.labels.end')}<div class="field-row">${F('单选标记','meta.labels.single')}${F('多选标记','meta.labels.multi')}${F('展示标记','meta.labels.display')}${F('素质行标记','meta.labels.attribute')}${F('文本标记','meta.labels.text')}</div></details><details><summary>页脚与作者备注</summary>${F('页脚 / 署名 / 自定义说明','meta.footer','textarea')}${F('创作备注（不向试玩者显示）','meta.notes','textarea',{rows:7})}</details><span class="id-label">PROJECT ${E(project.id)}</span>`;
 }else if(target.kind==='module'){
  const m=findModule(target.id);if(!m){target={kind:'project'};return renderInspector();}const p=modPath(m.id);title='模块设置';tag='MODULE';
  html=`<div class="subhead">${E(m.title||'未命名模块')}</div>${F('模块名称',p+'.title')}${F('副标题 / 编号标记',p+'.subtitle')}${F('模块说明',p+'.description','textarea')}${F('模块类型',p+'.type','select',{items:[['choices','选项卡组'],['attributes','素质矩阵（多行单选）'],['text','自由文本 / 自定义文本框'],['scenario','大型路线卡']]})}`;
  if(m.type==='text')html+=F('正文（支持基础 Markdown）',p+'.text','textarea',{rows:8})+F('文本样式',p+'.textStyle','select',{items:[['plain','常规文本框'],['callout','强调说明框'],['divider','章节分隔 / 居中']]})+check('允许试玩者填写内容',p+'.input')+(m.input?F('填写框标题',p+'.inputLabel'):'');
  else{
   if(m.type!=='attributes')html+=F('选择方式',p+'.selection','select',{items:[['single','单选（可取消）'],['multi','多选'],['none','只展示，不参与选择']]})+check('至少选择一项',p+'.required')+`<div class="field-row">${F('最少选项数',p+'.min','number',{min:0,max:9999,step:1})}${F('最多（0 为不限）',p+'.max','number',{min:0,max:9999,step:1})}</div>`;
   html+=`<div class="field-row">${F('每行列数',p+'.columns','number',{min:1,max:6,step:1})}${F('排列',p+'.layout','select',{items:[['grid','网格'],['list','纵向列表']]})}</div>`;
   if(m.type==='attributes')html+=`<div class="subhead">素质行</div>`+m.rows.map(r=>`<div class="row-manager"><span>${E(r.title)}</span><span class="small-count">${r.cards.length}</span><button class="btn small" data-action="edit-row" data-id="${E(r.id)}">编辑</button></div>`).join('')+`<button class="btn wide" data-action="add-row" data-id="${E(m.id)}">＋ 添加素质行</button>`;
   else html+=`<div class="inspector-actions"><button class="btn small" data-action="add-card" data-id="${E(m.id)}">＋ 添加选项</button><button class="btn small" data-action="batch" data-id="${E(m.id)}">批量添加</button></div>`;
  }
  html+=displayControls(p)+headingControls(m,p)+imageEditor(p+'.image')+`<details><summary>可见性与后置解锁</summary>${gates(p)}</details><details><summary>作者备注</summary>${F('备注',p+'.notes','textarea')}</details><div class="inspector-actions"><button class="btn small" data-action="move-module" data-id="${E(m.id)}" data-dir="-1">↑ 上移</button><button class="btn small" data-action="move-module" data-id="${E(m.id)}" data-dir="1">↓ 下移</button><button class="btn small" data-action="clone-module" data-id="${E(m.id)}">复制</button><button class="btn small danger" data-action="delete-module" data-id="${E(m.id)}">删除模块</button></div><span class="id-label">${E(m.id)}</span>`;
 }else if(target.kind==='card'){
  const e=C.index(project).get(target.id);if(!e){target={kind:'project'};return renderInspector();}const c=e.card,p=e.path;title='选项编辑';tag='CARD';
  html=`<button class="text-btn" data-action="edit-module" data-id="${E(e.module.id)}">← ${E(e.module.title)}</button><div class="subhead">内容</div>${F('名称',p+'.title')}${F('副标题',p+'.subtitle')}<div class="field-row">${F('资源变化',p+'.points','number',{placeholder:'待定',hint:'正数返还；负数消耗。'})}${F('填写状态',p+'.status','select',{items:[['draft','草稿'],['review','待复核'],['ready','已完成']]})}</div>${F('简介（支持基础 Markdown）',p+'.description','textarea',{rows:7,placeholder:'选项的效果、代价、背景…'})}<details><summary>角标与卡片版式</summary><div class="field-row">${F('角标 / 标签',p+'.badge')}${F('横跨列数',p+'.span','number',{min:1,max:6,step:1})}</div></details>${imageEditor(p+'.image')}
  <details><summary>自定义文本字段（${c.fields.length}）</summary>${c.fields.map((f,fi)=>`<div class="custom-field">${F('字段标题',p+'.fields.'+fi+'.label')}${F('内容',p+'.fields.'+fi+'.value','textarea',{rows:3})}<button class="text-btn" data-action="remove-field" data-id="${E(c.id)}" data-index="${fi}">删除此字段</button></div>`).join('')}<button class="btn small" data-action="add-field" data-id="${E(c.id)}">＋ 添加字段</button></details>
  <details><summary>前置、互斥与隐藏规则</summary>${gates(p,c.id)}${refs('选择前置：需全部选中',p+'.requires',c.id)}${refs('互斥选项（双向检查）',p+'.excludes',c.id)}<p class="hint">取消前置项时，已失效的关联选择会级联取消。门槛和规则按卡片 ID 保存；改名不会使引用失效。</p></details>
  <details><summary>作者备注</summary>${F('备注（不向试玩者显示）',p+'.notes','textarea')}</details><div class="inspector-actions"><button class="btn small" data-action="move-card" data-id="${E(c.id)}" data-dir="-1">↑</button><button class="btn small" data-action="move-card" data-id="${E(c.id)}" data-dir="1">↓</button><button class="btn small" data-action="clone-card" data-id="${E(c.id)}">复制</button><button class="btn small" data-action="transfer-card" data-id="${E(c.id)}">移至模块</button><button class="btn small danger" data-action="delete-card" data-id="${E(c.id)}">删除</button></div><span class="id-label">${E(c.id)}</span>`;
 }else if(target.kind==='heading'){
  const e=findHeading(target.id);if(!e){target={kind:'project'};return renderInspector();}const h=e.heading,m=e.module,p=e.path;title='展示标题行';tag='HEADING';
  const positions=[['start','模块开头'],...(m.type==='attributes'?m.rows:m.cards).map(x=>[x.id,'放在「'+x.title+'」前']),['end','模块末尾']];
  html=`<button class="text-btn" data-action="edit-module" data-id="${E(m.id)}">← ${E(m.title)}</button>${F('标题',p+'.title')}${F('英文 / 辅助标题',p+'.subtitle')}${F('对齐',p+'.align','select',{items:[['left','左对齐'],['center','居中'],['right','右对齐']]})}${F('插入位置',p+'.before','select',{items:positions})}<div class="field-row">${F('标题字号',p+'.size','number',{min:18,max:72})}${F('上下间距',p+'.spacing','number',{min:0,max:96})}</div><p class="hint">本行只展示文字，不占选项名额、不改变余额。隐藏默认模块名称不会隐藏此行。</p><div class="inspector-actions"><button class="btn" data-action="move-heading" data-id="${E(h.id)}" data-dir="-1">↑</button><button class="btn" data-action="move-heading" data-id="${E(h.id)}" data-dir="1">↓</button><button class="btn danger" data-action="delete-heading" data-id="${E(h.id)}">删除标题行</button></div>`;
 }else if(target.kind==='row'){
  const e=findRow(target.id);if(!e){target={kind:'project'};return renderInspector();}const p=e.path,r=e.row;title='素质行设置';tag='ATTRIBUTE';
  html=`<button class="text-btn" data-action="edit-module" data-id="${E(e.module.id)}">← ${E(e.module.title)}</button>${F('素质名称',p+'.title')}${F('说明',p+'.description','textarea')}${check('此行必须选择一个档位',p+'.required')}<div class="inspector-actions"><button class="btn small" data-action="add-card" data-id="${E(e.module.id)}" data-row="${E(r.id)}">＋ 添加档位</button><button class="btn small" data-action="batch" data-id="${E(e.module.id)}" data-row="${E(r.id)}">批量添加</button></div>`+r.cards.map(c=>`<div class="row-manager"><span>${E(c.title)}</span><span class="small-count">${C.fmt(c.points)}</span><button class="btn small" data-action="edit-card" data-id="${E(c.id)}">编辑</button></div>`).join('')+`<div class="inspector-actions"><button class="btn small" data-action="move-row" data-id="${E(r.id)}" data-dir="-1">↑ 上移</button><button class="btn small" data-action="move-row" data-id="${E(r.id)}" data-dir="1">↓ 下移</button><button class="btn small danger" data-action="delete-row" data-id="${E(r.id)}">删除此行</button></div>`;
 }
 $('#inspectorTitle').textContent=title;$('#inspectorType').textContent=tag;$('#inspectorBody').innerHTML=html;$('#inspectorBody').querySelectorAll('details').forEach(d=>{if(opens.includes(d.querySelector('summary').textContent.replace(/（\d+）/g,'')))d.open=true;});
}
function renderBuild(){const bal=C.balance(project),ix=C.index(project),issues=C.validate(project);$('#inspectorTitle').textContent='当前构筑';$('#inspectorType').textContent='BUILD';
 $('#inspectorBody').innerHTML=`<div class="subhead">剩余资源 <span class="mono">BALANCE</span></div><div class="ledger-amount ${bal<0?'negative':''}">${E(bal)}</div><p class="hint">${E(project.meta.tokenName)}${project.meta.tokenSymbol?' / '+E(project.meta.tokenSymbol):''}</p><hr>${F('构筑名称','play.name')}${project.play.selected.length?project.play.selected.map(id=>{const e=ix.get(id);return e?`<div class="build-item"><span>${E(e.card.title)}<small>${E(e.module.title)}${e.row?' / '+E(e.row.title):''}</small></span><span>${C.fmt(e.card.points)}</span><button class="text-btn" data-action="choose" data-id="${E(id)}" title="取消选择">×</button></div>`:'';}).join(''):'<p class="hint">从画布中选择选项，构筑会显示在这里。</p>'}<div class="subhead">校验</div>${issues.length?issues.map(i=>`<div class="notice">${E(i.text)}</div>`).join(''):'<p class="hint">当前没有发现规则冲突。</p>'}${F('试玩备注','play.note','textarea',{rows:5})}<button class="btn wide" data-action="build-summary">导出构筑摘要</button><p class="hint">这里不会改写作者备注；试玩选择与自由填写内容会随 JS / JSON 存档一起保存。</p>`;
}
function render(){renderHeader();renderTree();renderPreview();renderInspector();updateLiveMarkdown();}
let pendingConfirm=null,mdWindow=null;
function openModal(title,html,kind=''){modalKind=kind;$('#modalTitle').textContent=title;$('#modalBody').innerHTML=html;if(!$('#modal').open)$('#modal').showModal();}
function closeModal(force=false){if(fileBusy&&!force){toast('正在保存文件，请稍候。');return;}if(exporting){toast('图件仍在生成，请等待导出完成。');return;}$('#modal').close();modalKind='';}
function confirmModal(title,text,callback){pendingConfirm=callback;openModal(title,`<p class="help-text">${E(text)}</p><div class="modal-bottom"><button class="btn" data-action="close-modal">取消</button><button class="btn primary" data-action="confirm">确认</button></div>`,'confirm');}
function newModal(){openModal('从哪里开始',`<p class="hint">新建项目会保留当前项目。以后可以在本机项目库切换。</p><div class="template-gallery"><button class="tile-btn" data-action="new-template" data-kind="demo"><span class="mono">STELLAGRAM / FILLED</span><strong>随星录 · 预填版</strong><p>沿用当前预填内容与 50 IN 铟锭开局，继续改写。</p></button><button class="tile-btn" data-action="new-template" data-kind="stellagram"><span class="mono">STELLAGRAM / OUTLINE</span><strong>随星录 · 留白框架</strong><p>保留模块与图片位，数值和说明自行填写。</p></button><button class="tile-btn" data-action="new-template" data-kind="generic"><span class="mono">YOUR WORLD / BLANK</span><strong>通用空白模板</strong><p>自定义文字标题或上传 Logo，没有预设世界观。</p></button></div>`,'new');}

function addModuleModal(){openModal('添加模块',`<div class="modal-grid">${[['choices','01 / CHOICES','选项卡组','可设为单选、多选或仅展示；适合世界、身份和事件。'],['attributes','02 / MATRIX','素质矩阵','自由增减素质行与档位，每一行独立单选。'],['text','03 / TEXT','自由文本','规则、章节标题、作者文案，或供玩家填写的文本框。'],['scenario','04 / SCENARIO','大型路线','宽幅图片与长说明，支持自定义目标和结果字段。']].map(a=>`<button class="tile-btn" data-action="create-module" data-kind="${a[0]}"><span class="mono">${a[1]}</span><strong>${a[2]}</strong><p>${a[3]}</p></button>`).join('')}</div>`,'add-module');}
function batchModal(id,row){openModal('批量添加选项',`<div class="field-row"><label class="field"><span>数量</span><input id="batchCount" type="number" value="5" min="1" max="100" step="1"></label><label class="field"><span>名称前缀</span><input id="batchPrefix" value="选项"></label></div><label class="field"><span>资源变化（可选，用逗号分隔）</span><input id="batchPoints" placeholder="例如：30, 10, 0, -10, -30"><small>没有填写或数量不足的位置保持“待定”。</small></label><div class="modal-bottom"><button class="btn" data-action="close-modal">取消</button><button class="btn primary" data-action="batch-create" data-id="${E(id)}" data-row="${E(row||'')}">添加</button></div>`,'batch');}
function transferModal(id){const entry=cardList(id);const destinations=[];for(const m of project.modules){if(m.type==='attributes'){for(const r of m.rows)if(r.id!==entry.e.group)destinations.push([m.id+'|'+r.id,m.title+' / '+r.title]);}else if(m.type!=='text'&&m.id!==entry.e.group)destinations.push([m.id,m.title]);}
 openModal('移动选项',`<label class="field"><span>目标模块 / 素质行</span><select id="transferDest">${destinations.map(([id,n])=>`<option value="${E(id)}">${E(n)}</option>`).join('')}</select></label><p class="hint">移动后仍使用原 ID，已有的条件引用不会断开。</p><div class="modal-bottom"><button class="btn primary" data-action="transfer-confirm" data-id="${E(id)}" ${!destinations.length?'disabled':''}>移动</button></div>`,'transfer');}
function syncModal(tab='md'){
 const tabs=`<div class="tabs"><button class="btn small ${tab==='md'?'active':''}" data-action="sync-tab" data-tab="md">Markdown</button><button class="btn small ${tab==='data'?'active':''}" data-action="sync-tab" data-tab="data">完整存档</button><button class="btn small ${tab==='audit'?'active':''}" data-action="sync-tab" data-tab="audit">内容校验</button></div>`;
 let body='';if(tab==='md')body=`<p class="hint">文档按当前项目实时生成；包括隐藏项、未定价状态、作者备注和试玩记录，不会自动上传。</p><textarea id="mdPreview" class="code-view" readonly spellcheck="false">${E(C.markdown(project))}</textarea><div class="modal-bottom"><button class="text-btn" data-action="md-window">打开跟随编辑的 MD 窗口 ↗</button><button class="btn" data-action="copy-md">复制</button><button class="btn primary" data-action="download-md">导出 .md</button><button class="btn" data-action="download-bundle">导出 MD＋图片包</button></div>`;
 else if(tab==='data')body=`<div class="modal-grid"><button class="tile-btn" data-action="download-js"><span class="mono">DATA / JAVASCRIPT</span><strong>导出 JS 存档</strong><p>项目、图片、选择、文本与配色。下次直接导入即可恢复。仅解析数据，不执行脚本。</p></button><button class="tile-btn" data-action="download-json"><span class="mono">DATA / JSON</span><strong>导出 JSON 存档</strong><p>同一份项目的纯 JSON 形式；便于代码编辑、版本控制和交给其他工具。</p></button><button class="tile-btn" data-action="download-html" data-mode="edit"><span class="mono">SINGLE FILE / EDITABLE</span><strong>保存为可编辑 HTML</strong><p>把当前项目嵌入整个工坊，成为一个新的离线单文件。保留全部编辑与导出功能。</p></button><button class="tile-btn" data-action="download-html" data-mode="play"><span class="mono">SINGLE FILE / PLAY</span><strong>保存为试玩 HTML</strong><p>打开即进入试玩。仍可切回编辑；隐藏条件是展示规则，不是加密或防剧透保护。</p></button></div><div class="notice">浏览器自动保存只用于防止意外刷新。清理浏览器数据、换设备或移动 HTML 文件之前，请先导出 JS / JSON。它们包含内嵌图片，可独立恢复。</div><div class="modal-bottom"><button class="btn primary" data-action="save-as">另存为…</button><button class="btn" data-action="save-now">立即本地保存</button><button class="btn" data-action="raw-json">高级：查看 / 修改 JSON</button></div>`;
 else{const a=C.audit(project),v=C.validate(project),severe=a.filter(i=>i.level!=='info');body=`<div class="notice">${project.modules.length} 个模块 · ${C.index(project).size} 个选项 · ${a.filter(i=>i.level==='info').length} 项未定价</div><h3 style="font-size:18px">作者侧结构检查</h3>${severe.length?severe.map(i=>`<p class="hint">[${E(i.level)}] ${E(i.text)}</p>`).join(''):'<p class="hint">没有发现断开的引用或明显的可见性配置缺口。此处不会自动判断剧情矛盾或价格是否平衡。</p>'}<h3 style="font-size:18px;margin-top:25px">当前构筑检查</h3>${v.length?v.map(i=>`<p class="hint">[${E(i.level)}] ${E(i.text)}</p>`).join(''):'<p class="hint">当前构筑没有规则冲突。</p>'}`;}
 openModal('同步进度与存档',tabs+body,'sync-'+tab);
}
function updateLiveMarkdown(){if($('#mdPreview'))$('#mdPreview').value=C.markdown(project);if(mdWindow&&!mdWindow.closed){const t=mdWindow.document.querySelector('textarea');if(t)t.value=C.markdown(project);}}
function openMarkdownWindow(){mdWindow=window.open('','engram-live-md','width=820,height=850');if(!mdWindow){toast('浏览器拦截了新窗口；可直接在同步面板导出 Markdown。');return;}
 mdWindow.document.open();mdWindow.document.write('<!doctype html><html lang="zh-CN"><meta charset="utf-8"><title>图录工坊 · 实时 Markdown</title><style>body{margin:22px;background:#f0f0f0;color:#171719;font:18px system-ui}header{display:flex;justify-content:space-between;align-items:center;margin-bottom:15px}button{padding:8px 14px;border:1px solid #c5c5cb;background:white;border-radius:4px;cursor:pointer}small{display:block;color:#59595f;margin:8px 0}textarea{box-sizing:border-box;width:100%;height:calc(100vh - 125px);background:white;color:#171719;border:1px solid #c5c5cb;border-radius:5px;padding:17px;resize:none;font:16px/1.8 monospace}</style><header><div>实时 Markdown<small>跟随主窗口编辑，仅在本机更新。</small></div><button id="save">导出当前 .md</button></header><textarea readonly></textarea></html>');mdWindow.document.close();mdWindow.document.querySelector('#save').onclick=()=>X.textFile(C.markdown(project),X.filename(project.meta.title)+'-创作进度.md','text/markdown;charset=utf-8');updateLiveMarkdown();closeModal();}
function exportModal(){const o={...exportPrefs,...project.output};if(matchMedia('(pointer:coarse)').matches){o.scale=1;if(o.type==='full')o.type='pages';}openModal('导出图件',`<div class="export-options"><div class="field-row"><label class="field"><span>输出形式</span><select id="exType">${[['full','完整长图 PNG'],['pages','正常比例阅读分页（ZIP）'],['segments','分段裁剪长图（ZIP）'],['modules','逐模块图片（ZIP）'],['svg','完整长图 SVG']].map(([v,n])=>`<option value="${v}" ${o.type===v?'selected':''}>${n}</option>`).join('')}</select></label><label class="field"><span>内容范围</span><select id="exScope">${[['author','作者视图（包含隐藏项）'],['player','玩家视图（遵守解锁条件）'],['selected','仅当前已选构筑']].map(([v,n])=>`<option value="${v}" ${o.scope===v?'selected':''}>${n}</option>`).join('')}</select></label></div>
 <div class="field-row"><label class="field"><span>宽度（逻辑像素）</span><input id="exWidth" type="number" min="600" max="2400" value="${o.width}"></label><label class="field"><span>像素倍率</span><select id="exScale">${[1,1.5,2,3].map(v=>`<option value="${v}" ${o.scale===v?'selected':''}>${v}×</option>`).join('')}</select></label></div>
 <div class="field-row"><label class="field"><span>阅读分页比例</span><select id="exRatio"><option value="1.4148148148">A4 纵向（近似比例）</option><option value="1.25">4 : 5</option><option value="1">1 : 1</option><option value="0.5625">16 : 9</option><option value="custom">自定义页高</option></select></label><label class="field"><span>分页高度 / 分段目标高度</span><input id="exHeight" type="number" min="300" max="4000" value="${o.type==='segments'?o.segmentHeight:o.height}"></label></div>
 <label class="field"><span>导出列数</span><select id="exColumns"><option value="0">沿用各模块列数</option>${[1,2,3,4,5,6].map(v=>`<option value="${v}" ${o.columns===v?'selected':''}>统一为 ${v} 列</option>`).join('')}</select><small>长文字建议 2–3 列；素质矩阵可沿用 5 列。分页以卡片行和文本块为边界。</small></label>
 <div class="field-row"><div><label class="check-field"><input id="exPlaceholders" type="checkbox" ${o.placeholders?'checked':''}>保留空图片位</label><label class="check-field"><input id="exSelections" type="checkbox" ${o.selections?'checked':''}>标记当前选择</label></div><div><label class="check-field"><input id="exStatus" type="checkbox" ${o.status?'checked':''}>显示草稿 / 完成状态</label><label class="check-field"><input id="exNotes" type="checkbox" ${o.notes?'checked':''}>显示卡片与模块作者备注</label></div></div>
 <details><summary>图件标题与编号</summary><div class="export-label-options">${[['moduleNumbers','模块数字编号'],['moduleTitles','模块名称'],['moduleSubtitles','模块英文副标题'],['selectionHints','选择方式提示'],['cardNumbers','选项序号'],['attributeTitles','素质行标题'],['pageLabels','分页 / 模块图的页眉页码']].map(([k,l])=>`<label class="check-field"><input id="ex-${k}" type="checkbox" ${o[k]!==false?'checked':''}>${l}</label>`).join('')}</div><p class="hint">仅影响图件，不改目录和规则。独立展示标题行不受这些开关影响，可在模块设置中添加并选择对齐方式。</p></details>
 <p class="hint">图件只输出正文，不包含编辑面板。超长 PNG 达到保守画布阈值时自动改为分段，不会静默裁掉底部。超高的单张卡片在阅读分页中转为续页，以保留完整文字。</p><div id="exportProgress" class="export-progress" role="status"></div><div class="modal-bottom"><button class="btn" data-action="close-modal">取消</button><button class="btn primary" data-action="run-export">生成并导出 ↗</button></div></div>`,'export');}
function helpModal(){openModal('使用说明',`<div class="help-text"><h3>新版工作台</h3><p>左侧目录切换模块；右侧默认只显示一个模块。点击卡片或模块标题展开编辑面板，按 Esc 或“完成编辑”收起。顶部可切换完整文档、试玩、明暗主题；列表可按模块类型筛选。</p><h3>沿用原项目字体</h3><p>英文字体为 Rajdhani，汉字优先使用 W6 左右的明体 / 中宋风格（Noto Serif SC、思源宋体、华文中宋、宋体等）。原压缩包只有英文字库：把单文件 HTML 放在原项目 index.html 同级即可读取 assets/fonts。为使离线 PNG 也使用同样的英文，请在“项目设置 → 版式、字体与配色 → 原项目字体”选择原有四个 woff2 文件。可另选本机中文字库。字体只存本机，不写入 JS/JSON/HTML 存档。</p><h3>填写与结构</h3><p>点击目录标题旁的设置按钮，修改项目名、开场语和代币。点击卡片编辑名称、数值、简介、图片与规则。模块可以拖动排序，也可以用上下箭头移动。素质矩阵允许任意增加行与档位；自由文本模块还可加入玩家填写框。</p><h3>数值与条件</h3><p>正数返还资源，负数消耗资源。留空显示“待定”，试玩时暂按 0 计算并警告。单选、多选、数量限制、前置和互斥会真正执行；删除前置卡片后请查看“内容校验”。条件解锁支持模块级和卡片级，适合把后置分支藏在开局之后。</p><h3>保存与同步</h3><p>编辑会自动保存到本浏览器。<strong>自动保存不是独立备份。</strong>使用“存档 / MD”导出 JS / JSON，可在另一台设备恢复，内嵌图片不会丢失。Markdown 用于阅读与交流，不作为完整回读格式。带图片的同步包附带 progress.md、图片与完整工程存档。</p><h3>标题与编号</h3><p>模块设置中可分别隐藏模块编号、名称、副标题、选择标记、选项序号和素质行标题；目录中的名称不会丢失。用“＋ 标题行”插入独立展示标题，可左、中、右对齐，插在指定选项前或模块末尾。导出窗口的“图件标题与编号”可再做全局控制。</p><h3>另存为</h3><p>顶部“另存为”可自定文件名，选择 JS、JSON、HTML 或 Markdown。JS / JSON / HTML 可生成独立项目副本；浏览器支持时直接选择位置，授权后 Ctrl/Cmd+S 更新所关联文件。文件关联仅在本次会话有效，刷新后需重新选择。不支持直接写入时改为按指定文件名下载。</p><h3>图件</h3><p>完整 PNG 保留全文；阅读分页提供 A4、4:5、方形和横向比例；模块图按模块打包。SVG 保留浏览器文字渲染，适合大尺寸保存，但使用 foreignObject，不保证各矢量编辑软件都支持。PNG 导出建议在桌面版 Edge / Chrome 运行。</p><h3>安全与隐藏</h3><p>项目内容不会上传到服务器。若浏览器可联网，页面只会尝试向 Google Fonts 请求 Rajdhani / Noto Serif SC 字体样式；完全离线时自动使用本地字体或系统回退。JS 导入仅接受本工具的 JSON 赋值格式，不使用 eval。隐藏项只控制界面展示；试玩 HTML 仍含项目数据且可以切回编辑。向公众分享前请检查范围，完整 MD 会包含作者备注。</p><h3>快捷键与文本</h3><p><code>Ctrl/Cmd + S</code> 保存关联文件（首次打开另存为）；<code>Ctrl/Cmd + Shift + S</code> 另存为；<code>Ctrl/Cmd + Z</code> 撤销；<code>Ctrl/Cmd + Shift + Z</code> 重做。文本输入中保留浏览器自身的文字撤销。正文支持标题、粗体、斜体、行内代码、列表和引用，不执行 HTML。</p></div>`,'help');}
async function replaceProject(p){
 const next=C.normalize(p);if(project&&dirty&&!(await save()))throw new Error('当前修改尚未保存。先导出或保留分支，再切换项目。');
 if(project){await Store.snapshot(project,'切换项目之前').catch(()=>{});await Store.set(key+':backup',C.copy(project)).catch(()=>{});}
 activeFile=null;undoStack=[];redoStack=[];project=next;target={kind:'project'};focusId='cover';canvasScope='module';mode='edit';setInspector(false);closePanels();changed(true);closeModal();await save();toast('已载入项目，图片、Logo 与试玩记录一并恢复。');
}
async function importFile(file){if(!file)return;if(file.size>85*1024*1024)throw new Error('存档超过 85 MB，请先精简图片。');let text;
 if(/\.zip$/i.test(file.name)){const z=await JSZip.loadAsync(await file.arrayBuffer());const f=z.file('project.json')||Object.values(z.files).find(x=>/\/project\.json$/.test(x.name));if(!f)throw new Error('ZIP 中没有 project.json。请选择工坊导出的同步包。');if(f._data?.uncompressedSize>100*1024*1024)throw new Error('ZIP 中的工程文件过大。');text=await f.async('string');}else text=await file.text();
 const p=C.parse(text);await replaceProject(p);
}
async function uploadImage(file,path){if(!file)return;if(!/^image\/(png|jpeg|webp|gif)$/.test(file.type))throw new Error('请使用 PNG、JPG、WebP 或 GIF。SVG 不作为可执行图像导入。');if(file.size>25*1024*1024)throw new Error('图片超过 25 MB，请先压缩。');
 const u=URL.createObjectURL(file),im=new Image();try{await new Promise((r,j)=>{im.onload=r;im.onerror=()=>j(new Error('图片读取失败。'));im.src=u;});if(im.naturalWidth*im.naturalHeight>90000000)throw new Error('原图像素过大，请先缩小尺寸。');const scale=Math.min(1,2200/Math.max(im.naturalWidth,im.naturalHeight)),canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(im.naturalWidth*scale));canvas.height=Math.max(1,Math.round(im.naturalHeight*scale));canvas.getContext('2d').drawImage(im,0,0,canvas.width,canvas.height);const data=canvas.toDataURL('image/webp',.9);
  apply(()=>{const image=get(path);if(!image)throw new Error('图片目标已不存在');image.src=data;image.name=file.name;image.show=true;if(path.startsWith('meta.logo.'))project.meta.brand='custom';if(!image.alt)image.alt=file.name;});toast('图片已内嵌保存，无需保留原文件路径。');canvas.width=1;canvas.height=1;
 }finally{URL.revokeObjectURL(u);}}
function freshCard(label='未命名选项'){return C.card({title:label});}
function changeTheme(mode){const dark=mode==='dark';project.theme.mode=mode;Object.assign(project.theme,dark?{background:'#141518',surface:'#1E2024',text:'#EAE7E2',muted:'#B7B6BD'}:{background:'#F1F0ED',surface:'#FAF9F6',text:'#25272B',muted:'#63666C'});}
function advanceModule(dir){const ms=project.modules.filter(m=>mode==='edit'||C.unlocked(m,new Set(project.play.selected)));if(!ms.length)return;const i=ms.findIndex(m=>m.id===focusId);focusId=ms[Math.max(0,Math.min(ms.length-1,i+dir))].id;target={kind:'module',id:focusId};canvasScope='module';render();$('#stageScroll').scrollTop=0;}
function fontModal(){openModal('原项目字体',`<div class="font-example"><strong>ENGRAM ATELIER / 012345</strong><span>随星录 · 图录工坊</span></div><p class="help-text">原项目的英文为 <b>Rajdhani</b>；本版将汉字改为 <b>W6 左右的明体 / 中宋风格</b>。页面在线时会尝试从 Google Fonts 补全 Rajdhani 与 Noto Serif SC；离线时会优先读取原项目 assets/fonts，并依次回退到 Bahnschrift、思源宋体、华文中宋或宋体。数字、拉丁字母始终排在汉字字体之前。</p><div class="notice">${E(root.EngramFonts?.status()||'字体使用 CSS 路径或系统回退。')}</div><p class="help-text">也可直接选择原项目的四个 rajdhani-*.woff2 文件，以便离线读取、跨刷新复用，并让 PNG 图件保留相同的英文字形。字体只存于本机，不写入项目 JS、JSON、Markdown 或 HTML。</p><div class="modal-bottom"><button class="btn" data-action="pick-cn-font">选择本机明体 / 宋体字库</button><button class="btn primary" data-action="pick-fonts">选择 Rajdhani 文件</button></div>`,'fonts');}
// Native file writes only happen after an explicit save action, never auto-save.
let activeFile=null,fileBusy=false;
const formats={js:{ext:'.js',mime:'text/javascript',label:'JS 工程存档'},json:{ext:'.json',mime:'application/json',label:'JSON 工程存档'},html:{ext:'.html',mime:'text/html',label:'可编辑 HTML'},md:{ext:'.md',mime:'text/markdown',label:'Markdown 文档'}};
function saveAsModal(){openModal('另存为',`<p class="hint">完整工程选 JS / JSON；需要把编辑器和内容一起保存时选 HTML。</p><label class="field"><span>文件名</span><input id="saveAsName" value="${E(X.filename(project.meta.title)+'-'+(project.meta.edition||'存档'))}" spellcheck="false"></label><label class="field"><span>文件格式</span><select id="saveAsFormat">${Object.entries(formats).map(([k,f])=>`<option value="${k}">${E(f.label)} (${f.ext})</option>`).join('')}</select></label><label class="check-field"><input id="saveAsCopy" type="checkbox" checked>生成独立项目副本，保存后切换到该副本</label><p class="hint">副本保留所有图片、规则和选择。Markdown 只用于阅读，不作为可恢复工程。浏览器支持时选择保存位置；否则按指定文件名下载。</p>${activeFile?`<div class="notice">当前关联文件：${E(activeFile.name)}。Ctrl / Cmd + S 可更新此文件；更换文件或保存分支使用“另存为”。</div>`:''}<div class="modal-bottom"><button class="btn" data-action="close-modal">取消</button><button class="btn primary" data-action="save-as-confirm">选择位置并保存 ↗</button></div>`,'save-as');}
async function projectBlob(p,format){if(format==='html')return X.standalone(p,'edit',{download:false});const f=formats[format];return new Blob([format==='js'?C.js(p):format==='json'?JSON.stringify(p,null,2):C.markdown(p)],{type:f.mime+';charset=utf-8'});}
async function saveAsConfirm(){
 if(fileBusy)return;
 const format=$('#saveAsFormat').value,f=formats[format];
 const name=X.filename($('#saveAsName').value.replace(/\.(js|json|html?|md)$/i,''))+f.ext;
 const independent=$('#saveAsCopy').checked&&format!=='md',p=C.copy(project);
 if(independent){p.id=C.uid('project');p.meta.created=new Date().toISOString();}p.meta.modified=new Date().toISOString();
 fileBusy=true;const button=$('[data-action="save-as-confirm"]');button.disabled=true;
 let handle=null;
 try {
  // Acquire the picker inside the original user gesture, before asynchronous HTML work.
  if(typeof window.showSaveFilePicker==='function'&&window.isSecureContext){try{handle=await window.showSaveFilePicker({suggestedName:name,types:[{description:f.label,accept:{[f.mime]:[f.ext]}}]});}catch(e){if(e.name==='AbortError')return;if(!['SecurityError','NotSupportedError'].includes(e.name))throw e;}}
  const blob=await projectBlob(p,format);
  if(handle){let writable;try{writable=await handle.createWritable();await writable.write(blob);await writable.close();}catch(e){try{await writable?.abort();}catch{}throw e;}}
  else X.download(blob,name);
  if(format!=='md'){
   if(independent){await Store.set(key+':backup',C.copy(project)).catch(()=>{});checkpoint();project=C.normalize(p);changed(true);}
   activeFile=handle?{handle,format,id:project.id,name:handle.name||name}:null;
  }
  closeModal(true);toast(handle?'已保存：'+(handle.name||name):'已按指定文件名下载：'+name+'。本浏览器未使用直接文件写入。');
 } finally {fileBusy=false;if(button.isConnected)button.disabled=false;}
}
async function saveLinked(){
 if(fileBusy)return;
 if(!activeFile||activeFile.id!==project.id){saveAsModal();return;}
 fileBusy=true;
 try{const permission=await activeFile.handle.queryPermission?.({mode:'readwrite'});if(permission!=='granted'){const granted=await activeFile.handle.requestPermission({mode:'readwrite'});if(granted!=='granted'){toast('未获文件写入许可；请使用“另存为”。');return;}}
 const blob=await projectBlob(C.copy(project),activeFile.format);let writable;try{writable=await activeFile.handle.createWritable();await writable.write(blob);await writable.close();}catch(e){try{await writable?.abort();}catch{}throw e;}await save();toast('已更新文件：'+activeFile.name);
 }finally{fileBusy=false;}
}
function displayControls(path){return `<details><summary>标题、编号与导出版式</summary><p class="hint">以下开关控制这个模块的显示；目录名称仍然保留。图件导出窗口还可统一隐藏所有模块的同类标记。</p>${[['moduleNumbers','显示模块编号'],['moduleTitles','显示模块名称'],['moduleSubtitles','显示模块英文副标题'],['selectionHints','显示单选 / 多选标记'],['cardNumbers','显示选项编号（不影响自定义角标）'],['attributeTitles','显示素质行标题与说明']].map(([k,l])=>check(l,path+'.display.'+k)).join('')}</details>`;}
function headingControls(m,path){return `<details><summary>独立展示标题行（${m.headings.length}）</summary><p class="hint">标题行不计分，不参与选择；可以插在模块开头、选项之间或末尾。默认标题被隐藏后，这些标题行仍可显示。</p>${m.headings.map(h=>`<div class="row-manager"><span>${E(h.title||h.subtitle||'未填写标题')}<small>${E(h.align)} / ${E(h.before)}</small></span><button class="btn small" data-action="edit-heading" data-id="${E(h.id)}">编辑</button></div>`).join('')}<button class="btn wide" data-action="add-heading" data-id="${E(m.id)}">＋ 添加展示标题行</button></details>`;}


function syncPanelState(){const narrow=matchMedia('(max-width:1180px)').matches,ins=document.querySelector('.inspector').classList.contains('open'),outline=document.querySelector('.left-panel').classList.contains('mobile-open'),active=narrow&&(ins||outline);
 const b=$('#panelBackdrop');if(b)b.hidden=!active;document.body.classList.toggle('panel-open',active);
 const stage=document.querySelector('.stage');if(stage)stage.inert=active;const left=document.querySelector('.left-panel');left.inert=narrow&&!outline;document.querySelector('.mobile-dock').inert=active;
}
function closePanels(){setInspector(false);document.querySelector('.left-panel').classList.remove('mobile-open');syncPanelState();}
const formatDate=x=>new Date(x).toLocaleString('zh-CN',{month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'});
const formatBytes=n=>!Number.isFinite(n)?'未知':n>1024*1024*1024?(n/(1024*1024*1024)).toFixed(1)+' GB':(n/(1024*1024)).toFixed(1)+' MB';
async function libraryModal(){
 closePanels();openModal('本机项目库','<p class="hint">正在读取已保存项目…</p>','library');
 if(dirty)await save();const [items,stats]=await Promise.all([Store.list(),Store.stats()]);if(modalKind!=='library')return;
 const status=stats.persisted?'已获持久存储许可':'普通本机存储';
 $('#modalBody').innerHTML=`<div class="library-lead"><div><span class="mono">LOCAL FIRST / YOUR RECORDS</span><h3>继续你的创作</h3><p>当前设备独立保存。发布网页不会把这些草稿上传到 GitHub。</p></div><button class="btn primary" data-action="new">＋ 新建</button></div>${dirty?'<div class="notice">当前内容尚未安全保存。请先导出完整存档，或“保留为分支”以免覆盖其他标签页。</div>':''}
 <div class="library-toolbar"><button class="btn" data-action="import">导入存档</button><button class="btn" data-action="save-as">另存为…</button><button class="btn" data-action="share-project">备份 / 跨设备转移</button><button class="btn" data-action="sync">Markdown / 图文包</button></div>
 <div class="project-list">${items.map(x=>`<article class="saved-project ${x.id===project.id?'current':''}"><div><span class="mono">${x.id===project.id?'CURRENT / 当前项目':'SAVED RECORD'}</span><h3>${E(x.title)}</h3><p>${x.modules} 个模块 · ${x.cards} 个选项 · ${formatDate(x.savedAt)}</p></div><div class="project-operations"><button class="btn primary" data-action="library-open" data-id="${E(x.id)}">${x.id===project.id?'重新读取':'继续编辑'}</button><button class="btn" data-action="history" data-id="${E(x.id)}">历史</button>${x.id!==project.id?`<button class="text-btn" data-action="library-delete" data-id="${E(x.id)}">删除</button>`:''}</div></article>`).join('')||'<p class="hint">尚无项目副本，请先保存或导入。</p>'}</div>
 <div class="library-toolbar"><button class="btn" data-action="snapshot">保存当前快照</button><button class="btn" data-action="library-fork">保留为分支</button><button class="btn" data-action="save-now">立即保存</button></div>
 <details class="storage-details"><summary>${status} · 备份与离线使用</summary><p class="hint">自动保存包含文字、卡片、图片、Logo、主题与试玩记录。每个项目保留最多 12 份历史快照；大体积存档会更早回收旧快照。清除网站数据会同时清掉这些副本。</p><p class="hint">当前来源存储约 ${formatBytes(stats.usage)} / ${formatBytes(stats.quota)}。${stats.persisted?'浏览器已授予持久存储；主动清除网站数据仍会丢失。':'可请求持久存储，能否批准由浏览器决定；这不是云备份。'}</p><div class="library-toolbar"><button class="btn" data-action="persist">请求持久存储</button><button class="btn" data-action="install">添加到主屏幕 / 离线状态</button></div></details>`;
}
async function historyModal(id){const rows=await Store.history(id);openModal('历史快照',`<p class="hint">恢复时会另建一个分支，保留当前与原来的项目。</p><div class="history-list">${rows.map(r=>`<article class="saved-project"><div><h3>${E(r.label)}</h3><p>${formatDate(r.created)} · ${E(r.project.meta.title)}</p></div><button class="btn" data-action="history-restore" data-id="${E(id)}" data-snapshot="${E(r.id)}">恢复为分支</button></article>`).join('')||'<div class="empty-module">尚无历史快照。使用“保存当前快照”立即留一份。</div>'}</div><div class="modal-bottom"><button class="btn" data-action="library">返回项目库</button></div>`,'history');}
async function forkCurrent(){const p=C.copy(project);p.id=C.uid('project');p.meta.title+=' · 分支';p.meta.created=p.meta.modified=new Date().toISOString();activeFile=null;checkpoint();project=p;dirty=true;changed(true);await save();await libraryModal();}
function projectFile(){return new File([JSON.stringify(project,null,2)],X.filename(project.meta.title)+'-'+new Date().toISOString().slice(0,10)+'.json',{type:'application/json'});}
async function shareProject(){const file=projectFile();if(navigator.canShare?.({files:[file]})){try{await navigator.share({files:[file],title:project.meta.title});toast('已交给系统分享面板；请确认已保存到文件或发送。');return;}catch(e){if(e.name==='AbortError')return;}}
 X.download(file,file.name);toast('完整 JSON 存档已下载。传到另一设备后，在项目库导入即可；不会自动合并两份修改。');}
function mobileMenu(){closePanels();openModal('工作台',`<div class="mobile-menu-grid"><button class="tile-btn" data-action="project"><strong>项目与外观</strong><p>开场、代币、Logo、字体、做旧</p></button><button class="tile-btn" data-action="new"><strong>新建世界</strong><p>随星录或通用空白模板</p></button><button class="tile-btn" data-action="export"><strong>导出图件</strong><p>长图、分页、模块图</p></button><button class="tile-btn" data-action="save-as"><strong>另存为</strong><p>JS / JSON / HTML / MD</p></button><button class="tile-btn" data-action="import"><strong>导入进度</strong><p>从文件或另一台设备恢复</p></button><button class="tile-btn" data-action="sync"><strong>文字同步</strong><p>Markdown 与图片包</p></button></div><div class="library-toolbar"><button class="btn" data-action="theme">切换明暗</button><button class="btn" data-action="toggle-placeholders">显示 / 隐藏空图位</button><button class="btn" data-action="install">离线 / 安装</button><button class="btn" data-action="help">使用说明</button></div>`,'mobile-menu');}
async function installModal(){await root.EngramPWA?.show?.();}

async function action(el){const a=el.dataset.action,id=el.dataset.id,dir=Number(el.dataset.dir||0);
 switch(a){
 case 'mobile-menu':mobileMenu();return;
 case 'close-panels':closePanels();return;
 case 'mobile-mode':mode=mode==='edit'?'play':'edit';closePanels();render();return;
 case 'library':await libraryModal();return;
 case 'library-open':{if(dirty&&!(await save())){confirmModal('读取另一份已保存内容？','当前未保存的修改将被替换。取消后可先另存为或保留为分支。',async()=>{dirty=false;const p=await Store.getDoc(id);if(p)await replaceProject(p);});return;}const p=await Store.getDoc(id);if(!p)throw new Error('该项目已不存在。');await replaceProject(p);return;}
 case 'library-delete':confirmModal('删除本机项目？','这会删除此项目及其历史快照，不影响已经导出的备份文件。',async()=>{await Store.remove(id);await libraryModal();});return;
 case 'library-fork':await forkCurrent();return;
 case 'snapshot':if(!(await save()))return;await Store.snapshot(project,'手动快照');toast('当前内容已存为历史快照。');await libraryModal();return;
 case 'history':await historyModal(id||project.id);return;
 case 'history-restore':{const rows=await Store.history(id),r=rows.find(x=>x.id===el.dataset.snapshot);if(!r)throw new Error('快照已被清理。');const p=C.copy(r.project);p.id=C.uid('project');p.meta.title+=' · 恢复';p.meta.created=p.meta.modified=new Date().toISOString();await replaceProject(p);return;}
 case 'share-project':await shareProject();return;
 case 'persist':{const result=await navigator.storage?.persist?.();toast(result?'已获得持久存储许可。请继续保留外部备份。':'浏览器未批准或不支持。自动保存仍可使用，请定期导出备份。');await libraryModal();return;}
 case 'wear-preset':apply(()=>project.theme.wear=Number(el.dataset.value));return;
 case 'install':await installModal();return;
 case 'pwa-install':await root.EngramPWA?.install?.();return;
 case 'pwa-update':if(dirty&&!(await save()))return;await root.EngramPWA?.update?.();return;
 case 'export-download-ready':{const r=root.ENGRAM_LAST_EXPORT;if(r)X.download(r.blob,r.name);return;}
 case 'export-share-ready':{const r=root.ENGRAM_LAST_EXPORT;if(!r)return;const file=new File([r.blob],r.name,{type:r.blob.type});if(navigator.canShare?.({files:[file]})){try{await navigator.share({files:[file],title:project.meta.title});}catch(e){if(e.name!=='AbortError')throw e;}}else X.download(r.blob,r.name);return;}

 case 'save-as':saveAsModal();return;
 case 'save-as-confirm':await saveAsConfirm();return;
 case 'save-linked':await saveLinked();return;
 case 'edit-heading':selectTarget('heading',id);return;
 case 'add-heading':apply(()=>{const m=findModule(id),h=C.heading({title:'展示标题',subtitle:'',before:'start'});m.headings.push(h);target={kind:'heading',id:h.id};focusId=m.id;});setInspector(true);return;
 case 'delete-heading':{const e=findHeading(id);apply(()=>{e.module.headings=e.module.headings.filter(h=>h.id!==id);target={kind:'module',id:e.module.id};});return;}
 case 'move-heading':{const e=findHeading(id),list=e.module.headings,i=list.indexOf(e.heading),j=i+dir;if(j>=0&&j<list.length)apply(()=>[list[i],list[j]]=[list[j],list[i]]);return;}
 case 'noop':return;
 case 'cover':focusId='cover';canvasScope='module';target={kind:'project'};setInspector(false);render();$('#stageScroll').scrollTop=0;return;
 case 'first-module':advanceModule(1);return;
 case 'prev-module':advanceModule(-1);return;
 case 'next-module':advanceModule(1);return;
 case 'canvas-scope':canvasScope=el.dataset.value;render();$('#stageScroll').scrollTop=0;return;
 case 'filter':moduleFilter=el.dataset.value;renderTree();renderHeader();return;
 case 'close-inspector':setInspector(false);return;
 case 'toggle-outline':setInspector(false);document.querySelector('.left-panel').classList.toggle('mobile-open');syncPanelState();return;
 case 'apply-qualithm':apply(()=>{changeTheme(project.theme.mode);Object.assign(project.theme,{accent:'#8267A6',positive:'#527E6F',gold:'#5D789D',negative:'#CA8790',font:'rajdhani',bodySize:20,cardTitleSize:28,moduleTitleSize:36,titleSize:64,wear:project.theme.wear,gap:24,radius:2,width:1440,showStatus:false});});toast('已更新外观，内容、价格与规则未改变。');return;
 case 'fonts':fontModal();return;
 case 'pick-fonts':$('#fontInput').value='';$('#fontInput').click();return;
 case 'pick-cn-font':$('#cnFontInput').value='';$('#cnFontInput').click();return;
 case 'project':closeModal();mode='edit';selectTarget('project');renderHeader();return;
 case 'mode':mode=el.dataset.value;setInspector(false);render();return;
 case 'toggle-inspector':renderInspector();setInspector(!document.querySelector('.inspector').classList.contains('open'));return;
 case 'edit-module':selectTarget('module',id);return;
 case 'edit-card':selectTarget('card',id);return;
 case 'edit-row':selectTarget('row',id);return;
 case 'nav-module':focusId=id;target={kind:'module',id};canvasScope='module';setInspector(false);document.querySelector('.left-panel').classList.remove('mobile-open');syncPanelState();render();$('#stageScroll').scrollTop=0;return;
 case 'undo':if(undoStack.length){redoStack.push(snapshot());project=C.normalize(JSON.parse(undoStack.pop()));changed(true);}return;
 case 'redo':if(redoStack.length){undoStack.push(snapshot());project=C.normalize(JSON.parse(redoStack.pop()));changed(true);}return;
 case 'theme':apply(()=>changeTheme(project.theme.mode==='dark'?'light':'dark'));return;
 case 'toggle-placeholders':apply(()=>project.theme.placeholders=!project.theme.placeholders);return;
 case 'choose':{const result=C.toggle(project,id);if(!result.ok){toast(result.error);return;}apply(()=>project.play.selected=result.selected);if(result.removed.length>1)toast(`已取消 ${result.removed.length} 个选项，其中包括失效的关联选择。`);return;}
 case 'clear-play':confirmModal('重置当前选择？','卡片选择将被清空，已填写的构筑名称、笔记和项目内容仍会保留。',()=>apply(()=>project.play.selected=[]));return;
 case 'new':newModal();return;
 case 'new-template':await replaceProject(root.EngramSeeds.make(el.dataset.kind));return;
 case 'restore-backup':{const backup=await Store.get(key+':backup');if(!backup){toast('没有可恢复的本地替换备份。');return;}await replaceProject(backup);return;}
 case 'add-module':addModuleModal();return;
 case 'create-module':{const type=el.dataset.kind;let m;apply(()=>{m=C.section({type,title:{choices:'新选项模块',attributes:'新素质矩阵',text:'新文本模块',scenario:'新路线模块'}[type],columns:type==='scenario'?1:type==='attributes'?5:3,selection:type==='scenario'?'multi':'single',cards:['choices','scenario'].includes(type)?[freshCard()]:[],rows:type==='attributes'?[C.row({title:'素质 A',cards:Array.from({length:5},(_,i)=>freshCard('档位 '+(i+1)))})]:[]});project.modules.push(m);target={kind:'module',id:m.id};focusId=m.id;canvasScope='module';});closeModal();setInspector(true);setTimeout(()=>document.getElementById('section-'+m.id)?.scrollIntoView({behavior:'smooth'}),100);return;}
 case 'move-module':{const i=project.modules.findIndex(m=>m.id===id),j=i+dir;if(j<0||j>=project.modules.length)return;apply(()=>[project.modules[i],project.modules[j]]=[project.modules[j],project.modules[i]]);return;}
 case 'clone-module':apply(()=>{const i=project.modules.findIndex(m=>m.id===id),m=C.cloneSection(project.modules[i]);project.modules.splice(i+1,0,m);target={kind:'module',id:m.id};focusId=m.id;});return;
 case 'delete-module':{const m=findModule(id);confirmModal('删除模块？',`将删除“${m.title}”及其中全部内容。此操作可撤销；其他卡片中的引用将保留并在校验中提示。`,()=>apply(()=>{const cs=[...C.index(project).values()].filter(e=>e.module.id===id).map(e=>e.card.id);project.modules=project.modules.filter(m=>m.id!==id);project.play.selected=project.play.selected.filter(s=>!cs.includes(s));target={kind:'project'};}));return;}
 case 'add-row':apply(()=>{const m=findModule(id),r=C.row({title:'新素质',cards:Array.from({length:m.columns},(_,i)=>freshCard('档位 '+(i+1)))});m.rows.push(r);target={kind:'row',id:r.id};focusId=m.id;});setInspector(true);return;
 case 'move-row':{const e=findRow(id),list=e.module.rows,i=list.indexOf(e.row),j=i+dir;if(j<0||j>=list.length)return;apply(()=>[list[i],list[j]]=[list[j],list[i]]);return;}
 case 'delete-row':{const e=findRow(id);confirmModal('删除此素质行？','这一行及其中的档位将被删除；可用撤销恢复。',()=>apply(()=>{e.module.rows=e.module.rows.filter(r=>r.id!==id);project.play.selected=project.play.selected.filter(s=>!e.row.cards.some(c=>c.id===s));target={kind:'module',id:e.module.id};}));return;}
 case 'add-card':apply(()=>{const m=findModule(id),r=el.dataset.row?m.rows.find(r=>r.id===el.dataset.row):null,c=freshCard(m.type==='scenario'?'新路线':'新选项');if(m.type==='scenario'){c.image.ratio='1/1';c.fields=[{label:'目标',value:''},{label:'达成结果',value:''}];}(r?r.cards:m.cards).push(c);target={kind:'card',id:c.id};focusId=m.id;});setInspector(true);return;
 case 'batch':batchModal(id,el.dataset.row);return;
 case 'batch-create':{const n=Math.max(1,Math.min(100,Math.floor(Number($('#batchCount').value)||1))),prefix=$('#batchPrefix').value||'选项',raw=$('#batchPoints').value.split(/[,，]/).map(v=>v.trim()),points=raw.map(v=>v===''?null:Number(v));if(points.some(v=>v!==null&&!Number.isFinite(v))){toast('资源变化中包含不能识别的数字。');return;}apply(()=>{const m=findModule(id),r=el.dataset.row?m.rows.find(r=>r.id===el.dataset.row):null,list=r?r.cards:m.cards,base=list.length;for(let i=0;i<n;i++){const c=freshCard(prefix+' '+String(base+i+1).padStart(2,'0'));c.points=points[i]??null;list.push(c);}target={kind:r?'row':'module',id:r?r.id:m.id};});closeModal();return;}
 case 'move-card':{const e=cardList(id),j=e.i+dir;if(j<0||j>=e.list.length)return;apply(()=>[e.list[e.i],e.list[j]]=[e.list[j],e.list[e.i]]);return;}
 case 'clone-card':apply(()=>{const e=cardList(id),c=C.copy(e.e.card);c.id=C.uid('c');c.title+=' · 副本';e.list.splice(e.i+1,0,c);target={kind:'card',id:c.id};});return;
 case 'delete-card':{const e=cardList(id);confirmModal('删除选项？',`将删除“${e.e.card.title}”。引用它的规则会在内容校验中提示。`,()=>apply(()=>{e.list.splice(e.i,1);project.play.selected=project.play.selected.filter(s=>s!==id);target={kind:'module',id:e.e.module.id};}));return;}
 case 'transfer-card':transferModal(id);return;
 case 'transfer-confirm':{const destination=$('#transferDest').value;if(!destination)return;apply(()=>{const [mid,rid]=destination.split('|'),m=findModule(mid),list=rid?m.rows.find(r=>r.id===rid).cards:m.cards,src=cardList(id);list.push(src.list.splice(src.i,1)[0]);target={kind:'card',id};});closeModal();return;}
 case 'add-field':apply(()=>C.index(project).get(id).card.fields.push({label:'自定义字段',value:''}));return;
 case 'remove-field':apply(()=>C.index(project).get(id).card.fields.splice(Number(el.dataset.index),1));return;
 case 'image-upload':imagePath=el.dataset.imagePath;$('#imageInput').value='';$('#imageInput').click();return;
 case 'image-remove':apply(()=>{const image=get(el.dataset.path);image.src='';image.name='';});return;
 case 'import':$('#importInput').value='';$('#importInput').click();return;
 case 'sync':syncModal();return;
 case 'sync-tab':syncModal(el.dataset.tab);return;
 case 'md-window':openMarkdownWindow();return;
 case 'download-md':X.textFile(C.markdown(project),X.filename(project.meta.title)+'-创作进度.md','text/markdown;charset=utf-8');toast('已导出当前完整创作进度。');return;
 case 'copy-md':{const s=C.markdown(project);try{await navigator.clipboard.writeText(s);toast('Markdown 已复制。');}catch{const t=$('#mdPreview');if(t){t.focus();t.select();document.execCommand('copy');toast('已尝试复制；也可以手动 Ctrl/Cmd+C。');}}return;}
 case 'download-js':X.textFile(C.js(project),X.filename(project.meta.title)+'-项目存档.js','text/javascript;charset=utf-8');toast('JS 存档已导出，含图片与试玩记录。');return;
 case 'download-json':X.textFile(JSON.stringify(project,null,2),X.filename(project.meta.title)+'-项目存档.json','application/json;charset=utf-8');return;
 case 'download-bundle':toast('正在整理 Markdown、图片与工程存档…');await X.syncBundle(project);toast('同步包已导出。');return;
 case 'download-html':toast('正在把当前项目封装成离线单页…');await X.standalone(project,el.dataset.mode);toast('离线单页已导出。');return;
 case 'save-now':await save();if(!dirty)toast('已保存到当前浏览器。');return;
 case 'raw-json':openModal('高级项目数据',`<p class="hint">应用时会检查 schema、ID 与类型；不会执行代码。复杂批量调整前建议先导出备份。</p><textarea id="rawJSON" class="code-view" spellcheck="false">${E(JSON.stringify(project,null,2))}</textarea><div class="modal-bottom"><button class="btn" data-action="close-modal">取消</button><button class="btn primary" data-action="apply-json">校验并应用</button></div>`,'raw');return;
 case 'apply-json':await replaceProject(C.parse($('#rawJSON').value));return;
 case 'build-summary':openModal('当前构筑摘要',`<textarea id="buildMD" class="code-view" readonly>${E(C.markdown(project,false,true))}</textarea><div class="modal-bottom"><button class="btn primary" data-action="download-build">导出构筑 .md</button></div>`,'build');return;
 case 'download-build':X.textFile(C.markdown(project,false,true),X.filename(project.meta.title)+'-试玩构筑.md','text/markdown;charset=utf-8');return;
 case 'export':exportModal();return;
 case 'run-export':if(exporting)return;exportPrefs={type:$('#exType').value,scope:$('#exScope').value,width:Number($('#exWidth').value),height:Number($('#exHeight').value),scale:Number($('#exScale').value),columns:Number($('#exColumns').value),segmentHeight:Number($('#exHeight').value),placeholders:$('#exPlaceholders').checked,selections:$('#exSelections').checked,status:$('#exStatus').checked,notes:$('#exNotes').checked};
  const output=Object.fromEntries([...C.displayKeys,'pageLabels'].map(k=>[k,$('#ex-'+k).checked]));Object.assign(exportPrefs,output);project.output=output;changed(false);
 exporting=true;el.disabled=true;try{const r=await X.graphics(project,exportPrefs,t=>{$('#exportProgress').textContent=t;});root.ENGRAM_LAST_EXPORT=r;$('#exportProgress').innerHTML=`已生成 ${r.count} 张图件。<div class="library-toolbar"><button class="btn primary" data-action="export-download-ready">保存文件</button><button class="btn" data-action="export-share-ready">系统分享</button></div>`;toast('图件已生成，可点击保存文件或系统分享。');}finally{exporting=false;el.disabled=false;}return;
 case 'help':helpModal();return;
 case 'confirm':{const fn=pendingConfirm;pendingConfirm=null;closeModal();if(fn)await fn();return;}
 case 'close-modal':closeModal();return;
 }
}
function fail(e){console.error(e);toast(e.message||String(e));if($('#exportProgress'))$('#exportProgress').textContent='未完成：'+(e.message||String(e));}
document.addEventListener('click',e=>{const el=e.target.closest('[data-action]');if(!el||el.disabled)return;action(el).catch(fail);});
document.addEventListener('keydown',e=>{
 if(e.key==='Escape'&&!$('#modal').open){closePanels();}

 if((e.key==='Enter'||e.key===' ')&&e.target.matches('[data-action][role=button]')&&!e.target.matches('button')){e.preventDefault();action(e.target).catch(fail);}
 const mod=e.ctrlKey||e.metaKey;if(mod&&e.key.toLowerCase()==='s'){e.preventDefault();if(e.shiftKey)saveAsModal();else saveLinked().catch(fail);}
 const typing=e.target.matches('input,textarea,select,[contenteditable=true]');if(mod&&!typing&&e.key.toLowerCase()==='z'){e.preventDefault();action({dataset:{action:e.shiftKey?'redo':'undo'}}).catch(fail);}if(mod&&!typing&&e.key.toLowerCase()==='y'){e.preventDefault();action({dataset:{action:'redo'}}).catch(fail);}
});
$('#modal').addEventListener('cancel',e=>{if(exporting||fileBusy)e.preventDefault();else modalKind='';});
document.addEventListener('focusin',e=>{if(e.target.matches('[data-bind],[data-answer]'))checkpoint();});
function updateField(el){const path=el.dataset.bind;if(!path)return;let val;if(el.type==='checkbox')val=el.checked;else if(el.dataset.cast==='ids')val=[...el.selectedOptions].map(o=>o.value);else if(['number','range'].includes(el.type)){
 val=el.value===''&&path.endsWith('.points')?null:Number(el.value);if(val!==null&&!Number.isFinite(val))return;
 if(el.min!==''&&val!==null)val=Math.max(Number(el.min),val);if(el.max!==''&&val!==null)val=Math.min(Number(el.max),val);
 }else val=el.value;
 if(path==='theme.mode')changeTheme(val);else set(path,val);
 if(path.endsWith('.type')){const m=get(path.slice(0,-5));if(m.type==='attributes'&&!m.rows.length)m.rows.push(C.row({title:'素质 A',cards:Array.from({length:5},(_,i)=>freshCard('档位 '+(i+1)))}));}
 const refresh=path==='theme.mode'||path.endsWith('.type')||path.endsWith('.visibility')||path.endsWith('.input')||path==='meta.brand';changed(refresh);if(path==='theme.wear'&&$('#wearValue'))$('#wearValue').textContent=val;
}
document.addEventListener('input',e=>{try{const el=e.target;if(el.dataset.refSearch!==undefined){const query=el.value.trim().toLowerCase();el.closest('.ref-picker').querySelectorAll('.ref-list>label').forEach(l=>l.hidden=!l.textContent.toLowerCase().includes(query));}else if(el.dataset.bind)updateField(el);else if(el.dataset.answer){project.play.answers[el.dataset.answer]=el.value;dirty=true;project.meta.modified=new Date().toISOString();Store.journal(project);clearTimeout(timer);timer=setTimeout(save,550);updateLiveMarkdown();}else if(el.id==='search')renderTree();}catch(err){fail(err);}});
document.addEventListener('change',e=>{const el=e.target;if(el.dataset.refPath){apply(()=>{const ids=new Set(get(el.dataset.refPath));if(el.checked)ids.add(el.dataset.refId);else ids.delete(el.dataset.refId);set(el.dataset.refPath,[...ids]);},false);return;}if(el.id==='exRatio'||el.id==='exWidth'){if($('#exRatio')?.value!=='custom'&&$('#exType')?.value!=='segments')$('#exHeight').value=Math.round(Number($('#exWidth').value)*Number($('#exRatio').value));}if(el.id==='exType'&&el.value==='segments')$('#exHeight').value=1600;});
$('#imageInput').addEventListener('change',e=>uploadImage(e.target.files[0],imagePath).catch(fail));$('#importInput').addEventListener('change',e=>importFile(e.target.files[0]).catch(fail));
document.addEventListener('dragstart',e=>{const el=e.target.closest('.tree-item');if(!el||mode!=='edit')return;dragId=el.dataset.id;e.dataTransfer.setData('text/x-engram-module',dragId);e.dataTransfer.effectAllowed='move';});
document.addEventListener('dragover',e=>{const image=e.target.closest('.image-drop'),tree=e.target.closest('.tree-item');if(image||tree||[...e.dataTransfer.types].includes('Files')){e.preventDefault();if(image||tree)(image||tree).classList.add('drag-over');}});
document.addEventListener('dragleave',e=>e.target.closest('.drag-over')?.classList.remove('drag-over'));
document.addEventListener('drop',e=>{e.preventDefault();document.querySelectorAll('.drag-over').forEach(n=>n.classList.remove('drag-over'));const image=e.target.closest('.image-drop'),tree=e.target.closest('.tree-item'),files=e.dataTransfer.files;
 if(image&&files.length){uploadImage(files[0],image.dataset.imagePath).catch(fail);return;}
 if(tree&&dragId&&!files.length){const id=dragId,to=tree.dataset.id;dragId='';if(id===to)return;apply(()=>{const from=project.modules.findIndex(m=>m.id===id),m=project.modules.splice(from,1)[0],dest=project.modules.findIndex(m=>m.id===to);project.modules.splice(dest,0,m);});return;}
 if(files.length&&/\.(js|json|zip)$/i.test(files[0].name))importFile(files[0]).catch(fail);
});
document.addEventListener('dragend',()=>{dragId='';document.querySelectorAll('.drag-over').forEach(n=>n.classList.remove('drag-over'));});
window.addEventListener('pagehide',()=>{if(dirty){Store.journal(project);save().catch(()=>{});}});
window.addEventListener('beforeunload',e=>{if(dirty){save().catch(()=>{});e.preventDefault();e.returnValue='';}});document.addEventListener('visibilitychange',()=>{if(document.hidden&&dirty)save().catch(()=>{});});
async function init(){setInspector(false);if(!document.querySelector('style[data-app-style]')){try{root.ENGRAM_CSS=await (await fetch('styles.css')).text();}catch{}}let boot=null;try{const node=$('#engram-boot');if(node)boot=JSON.parse(node.textContent);}catch(e){fail(e);}
 const stored=await Store.get(key);let recovered=null;
 try{if(stored)recovered=C.normalize(stored);}catch{toast('本地副本无法读取，已回到文件内的初始内容；请导入外部备份。');}
 if(boot?.project){
  project=C.normalize(boot.project);
  // A newly created or imported project has a different ID, but is still the active
  // document at this path. Always prefer saved work over the embedded snapshot.
  if(recovered)project=recovered;
  mode=boot.mode==='play'?'play':'edit';
 }else{project=recovered||root.EngramSeeds.make(new URLSearchParams(location.search).get('template')==='generic'?'generic':'demo');}
 render();if(recovered&&!root.ENGRAM_RECOVERED_DRAFT){dirty=false;syncSaveIndicator(true);$('#saveState').textContent='已读取本机进度';}else await save();if(root.ENGRAM_RECOVERED_DRAFT)toast('已恢复上次中断时尚未提交的草稿。');return true;
}
root.EngramApp={getProject:()=>C.copy(project),loadProject:replaceProject,save,render,selectTarget,saveAsModal,setMode:m=>{mode=m;render();},setScope:(scope,id)=>{canvasScope=scope;if(id)focusId=id;render();},setTheme:m=>{changeTheme(m);changed(true);},Store,openLibrary:libraryModal,openModal,closeModal,toast,apply,changeField:(path,value)=>apply(()=>set(path,value)),isDirty:()=>dirty,ready:null};
$('#fontInput').addEventListener('change',async e=>{try{await root.EngramFonts.import([...e.target.files],'en');render();fontModal();}catch(err){fail(err);}});
$('#cnFontInput').addEventListener('change',async e=>{try{await root.EngramFonts.import([...e.target.files],'cn');render();fontModal();}catch(err){fail(err);}});
window.addEventListener('resize',()=>{document.documentElement.style.setProperty('--sheet-top',document.querySelector('.workspace').getBoundingClientRect().top+'px');syncPanelState();});
document.addEventListener('engram-remote-save',e=>{if(project?.id===e.detail.id)toast('这个项目在另一标签页有新保存；继续编辑发生冲突时会保护为分支。');});
root.EngramApp.ready=init().catch(fail);
})(globalThis);
