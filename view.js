/* Shared DOM renderer: editor, play mode, and all image exports use this view. */
(function(root){
'use strict';const C=root.EngramCore,E=C.esc;
const font={
 rajdhani:'Rajdhani,"Bahnschrift SemiCondensed",Bahnschrift,"Arial Narrow",EngramChinese,EngramHanSerif,"Noto Serif SC","Noto Serif CJK SC","Source Han Serif SC",STZhongsong,SimSun,serif',
 sans:'Rajdhani,"Bahnschrift SemiCondensed",Bahnschrift,"Arial Narrow",EngramChinese,EngramHanSerif,"Noto Serif SC",STZhongsong,SimSun,serif',
 serif:'Rajdhani,"Bahnschrift SemiCondensed",Bahnschrift,"Arial Narrow",EngramChinese,EngramHanSerif,"Noto Serif SC","Noto Serif CJK SC","Source Han Serif SC",STZhongsong,SimSun,serif'
};
function inline(s){return E(s).replace(/`([^`]+)`/g,'<code>$1</code>').replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>').replace(/\*([^*]+)\*/g,'<em>$1</em>');}
function rich(s){
 const lines=String(s||'').split('\n');let out='',para=[],list='';
 const flush=()=>{if(para.length){out+='<p>'+inline(para.join('\n'))+'</p>';para=[];}};
 const end=()=>{if(list){out+='</'+list+'>';list='';}};
 for(const l of lines){if(!l.trim()){flush();end();continue;}
 const h=l.match(/^(#{1,4})\s+(.*)$/),li=l.match(/^\s*(?:([-*])|\d+\.)\s+(.*)$/);
 if(h){flush();end();out+=`<h${Math.min(4,h[1].length+1)}>${inline(h[2])}</h${Math.min(4,h[1].length+1)}>`;}
 else if(/^---+$/.test(l.trim())){flush();end();out+='<hr>';}
 else if(l.startsWith('> ')){flush();end();out+='<blockquote>'+inline(l.slice(2))+'</blockquote>';}
 else if(li){flush();const type=li[1]?'ul':'ol';if(list!==type){end();list=type;out+='<'+type+'>';}out+='<li>'+inline(li[2])+'</li>';}
 else{end();para.push(l);}}
 flush();end();return out;
}
function style(p){const t=p.theme;return `--p-bg:${t.background};--p-surface:${t.surface};--p-text:${t.text};--p-muted:${t.muted};--p-accent:${t.accent};--p-gold:${t.gold||'#315EAE'};--p-positive:${t.positive};--p-negative:${t.negative};--p-line:${t.mode==='dark'?'#414146':'#C7C7CB'};--p-size:${t.bodySize}px;--p-card-title:${t.cardTitleSize||24}px;--p-module-title:${t.moduleTitleSize||32}px;--p-wear:${(t.wear||0)/100};--p-title:${t.titleSize}px;--p-gap:${t.gap}px;--p-radius:${t.radius}px;--p-font:${font[t.font]};--p-ink-accent:${t.mode==='dark'?'color-mix(in srgb,'+t.accent+' 68%,#EAE7E2)':t.accent};--p-wash:${t.mode==='dark'?'#202024':'#E7E7EA'};--p-is-dark:${t.mode==='dark'?1:0}`;}
function classes(p,opts={}){return 'paper'+(p.theme.grid?' grid-bg':'')+(opts.export?' export-doc':'')+(opts.page?' export-page':'')+(p.theme.mode==='dark'?' paper-dark':' paper-light')+(opts.focus?' focus-paper':'')+(p.theme.wear?' patina':'');}
function media(v,p,opts={}){
 if(!v||!v.show)return '';
 const ph=opts.placeholders??p.theme.placeholders;
 if(!v.src&&!ph)return '';
 return `<div class="media ${v.ratio==='auto'?'auto':''}" style="aspect-ratio:${v.ratio==='auto'?(v.src?'auto':'1/1'):v.ratio}">${v.src?`<img src="${E(v.src)}" alt="${E(v.alt)}" style="object-fit:${v.fit};object-position:${v.x}% ${v.y}%" decoding="sync">`:`<div class="media-placeholder"><span class="placeholder-mark">＋</span><span>${E(p.meta.labels.image)}</span></div>`}</div>`+(v.caption||v.credit?`<div class="media-caption">${E(v.caption)}${v.caption&&v.credit?'<br>':''}${v.credit?E(v.credit):''}</div>`:'');
}
function shown(m,p,opts,key){return m.display?.[key]!==false&&(!opts.export||(opts[key]??p.output?.[key])!==false);}
function points(c,p){const kind=c.points===null?'unpriced':c.points>0?'positive':c.points<0?'negative':'neutral';return `<span class="points ${kind}"><span class="points-value">${E(C.fmt(c.points))}</span>${p.meta.tokenSymbol?`<small>${E(p.meta.tokenSymbol)}</small>`:''}</span>`;}
function conditions(c,p,opts){const ix=C.index(p),s=new Set(p.play.selected),name=id=>{const e=ix.get(id);return e&&(opts.author||C.visible(e,s))?(e.card.title||id):'未公开条件';};
 let html='';for(const[key,label]of[['requires','前置'],['excludes','互斥']])if(c[key].length)html+=`<div>${label}：${E(c[key].map(name).join(' / '))}</div>`;
 return html?`<div class="condition-note">${html}</div>`:'';
}
function card(c,m,p,i=0,opts={}){
 const s=new Set(p.play.selected),entry={card:c,module:m},selectable=m.type==='attributes'||m.selection!=='none';
 if(!opts.author&&!C.visible(entry,s))return p.settings.showLocked?'<div class="locked-block">未解锁选项</div>':'';
 const selected=opts.showSelection!==false&&s.has(c.id),editing=!opts.export&&opts.target===c.id;
 const action=opts.export?'':`data-action="${opts.author?'edit-card':selectable?'choose':'noop'}" data-id="${E(c.id)}" tabindex="0" role="button" aria-label="${E(c.title||'未命名选项')}" ${!opts.author&&selectable?`aria-pressed="${selected}"`:''}`;
 const visibleFields=c.fields.filter(f=>f.label||f.value),img=media(c.image,p,opts),idx=[shown(m,p,opts,'cardNumbers')?String(i+1).padStart(2,'0'):'',c.badge].filter(Boolean).join(' / ');
 return `<div class="card ${selected?'is-selected':''} ${editing?'editing':''} ${c.visibility==='author'?'author-only':''} ${img?'has-media':''} ${c.image.ratio==='1/1'?'square-media':''}" ${action} data-card-id="${E(c.id)}" style="--span:${c.span};grid-column:span ${Math.min(c.span,m.layout==='list'?1:(opts.columns||m.columns))}">
 <div class="card-top">${idx?`<span class="card-index">${E(idx)}</span>`:''}${points(c,p)}</div>
 ${img}<div class="card-body">${opts.author&&c.visibility!=='public'?`<span class="author-tag">${c.visibility==='author'?'AUTHOR ONLY':'CONDITIONAL'}</span>`:''}
 <h3>${E(c.title||'未命名选项')}</h3>${c.subtitle?`<div class="card-subtitle">${E(c.subtitle)}</div>`:''}
 ${c.description?`<div class="rich">${rich(c.description)}</div>`:(opts.author?'<span class="ghost-copy">简介待填写</span>':'')}
 ${visibleFields.length?`<dl class="custom-block">${visibleFields.map(f=>`<dt>${E(f.label)}</dt><dd>${E(f.value)}</dd>`).join('')}</dl>`:''}
 ${conditions(c,p,opts)}${opts.notes&&c.notes?`<div class="doc-note">作者备注：${E(c.notes)}</div>`:''}
 <div class="card-foot">${(opts.status??p.theme.showStatus)?`<span class="status-dot ${c.status}"></span><span>${{draft:'草稿',review:'待复核',ready:'已完成'}[c.status]}</span>`:''}${selected?'<span class="selected-mark">✓ 已选择</span>':''}</div></div></div>`;
}
function displayHeading(h,opts={}){if(!h.title&&!h.subtitle)return '';return `<div class="display-heading" data-heading-id="${E(h.id)}" style="text-align:${h.align};--heading-size:${h.size}px;--heading-gap:${h.spacing}px" ${!opts.export&&opts.author?`data-action="edit-heading" data-id="${E(h.id)}" role="button" tabindex="0"`:''}>${h.title?`<h2>${E(h.title)}</h2>`:''}${h.subtitle?`<div>${E(h.subtitle)}</div>`:''}</div>`;}
function headingsAt(m,before,opts={}){const anchors=['start','end',...(m.type==='attributes'?m.rows:m.cards).map(x=>x.id)];return (m.headings||[]).filter(h=>h.before===before||before==='end'&&!anchors.includes(h.before)).map(h=>displayHeading(h,opts)).join('');}
function moduleHeader(m,p,i,opts={}){
 const number=shown(m,p,opts,'moduleNumbers'),title=shown(m,p,opts,'moduleTitles'),subtitle=shown(m,p,opts,'moduleSubtitles'),rule=shown(m,p,opts,'selectionHints');
 const inner=(number?`<span class="module-number">${String(i+1).padStart(2,'0')}</span>`:'')+((title||subtitle&&m.subtitle)?`<div class="module-titlebox">${title?`<h2>${E(m.title||'未命名模块')}</h2>`:''}${subtitle&&m.subtitle?`<span class="module-sub">${E(m.subtitle)}</span>`:''}</div>`:'')+(rule?`<span class="module-rule">${E(m.type==='text'?p.meta.labels.text:m.type==='attributes'?p.meta.labels.attribute:m.selection==='single'?p.meta.labels.single:m.selection==='multi'?p.meta.labels.multi:p.meta.labels.display)}${m.required?' · 必选':''}${m.max?' · ≤'+m.max:''}</span>`:'');
 return (inner?`<div class="module-head" data-module-type="${E(m.type)}" ${!opts.export&&opts.author?`data-action="edit-module" data-id="${E(m.id)}" role="button" tabindex="0"`:''}>${inner}</div>`:'')+(m.description?`<div class="module-desc rich">${rich(m.description)}</div>`:'');
}
function attributeHeader(r,m,p,opts={},continued=false){return shown(m,p,opts,'attributeTitles')?`<div class="attribute-title"><h3 ${!opts.export&&opts.author?`data-action="edit-row" data-id="${E(r.id)}" role="button" tabindex="0"`:''}>${E(r.title||'未命名素质')}${continued?' · 续':''}</h3><span>${E(r.description)}${r.required?' / 必选':''}</span></div>`:'';}
function section(m,p,i,opts={}){
 if(!opts.author&&!C.unlocked(m,new Set(p.play.selected)))return p.settings.showLocked?'<div class="locked-block module">存在尚未解锁的模块</div>':'';
 let content=''; const columns=opts.columns||m.columns;
 if(m.type==='attributes')content=m.rows.map(r=>headingsAt(m,r.id,opts)+`<div class="attribute-row">${attributeHeader(r,m,p,opts)}<div class="cards-grid" style="--columns:${columns}">${r.cards.map((c,ci)=>card(c,m,p,ci,opts)).join('')}</div>${!opts.export&&opts.author?`<button class="add-card" data-action="add-card" data-id="${E(m.id)}" data-row="${E(r.id)}">＋ 添加档位</button>`:''}</div>`).join('');
 else if(m.type==='text')content=`<div class="text-block ${m.textStyle}"><div class="rich">${m.text?rich(m.text):(opts.author?'<span class="ghost-copy">这里是可自由编排的文本模块。</span>':'')}</div>${m.input?`<span class="response-label">${E(m.inputLabel)}</span>${opts.export?`<div class="response-print">${E(p.play.answers[m.id]||'')}</div>`:`<textarea class="response-input" data-answer="${E(m.id)}" placeholder="${opts.author?'可在试玩模式填写；此栏也会随存档保存。':'写下你的记录…'}">${E(p.play.answers[m.id]||'')}</textarea>`}`:''}</div>`;
 else content=`<div class="cards-grid" style="--columns:${columns}">${m.cards.map((c,ci)=>headingsAt(m,c.id,opts)+card(c,m,p,ci,opts)).join('')}</div>`;
 if(m.type!=='text'&&((m.type==='attributes'&&!m.rows.length)||(m.type!=='attributes'&&!m.cards.length)))content+='<div class="empty-module">此模块还没有选项。</div>';
 return `<section class="module ${m.type==='scenario'?'scenario':''} ${m.layout==='list'?'choice-list':''}" id="section-${E(m.id)}" data-module-id="${E(m.id)}" data-module-type="${E(m.type)}">
 ${!opts.export&&opts.author?`<div class="edit-tools"><button data-action="edit-module" data-id="${E(m.id)}">模块设置</button><button data-action="add-heading" data-id="${E(m.id)}">＋ 标题行</button></div>`:''}
 ${opts.author&&m.visibility!=='public'?`<span class="author-tag">${m.visibility==='author'?'仅作者可见':'条件解锁模块'}</span>`:''}
 ${headingsAt(m,'start',opts)}${moduleHeader(m,p,i,opts)}${media(m.image,p,opts)}${content}${headingsAt(m,'end',opts)}
 ${!opts.export&&opts.author&&m.type!=='text'?`<button class="add-card" data-action="${m.type==='attributes'?'add-row':'add-card'}" data-id="${E(m.id)}">＋ ${m.type==='attributes'?'添加素质行':'添加选项'}</button>`:''}
 ${opts.notes&&m.notes?`<div class="doc-note">模块备注：${E(m.notes)}</div>`:''}</section>`;
}
function emblem(){return `<svg class="engram-glyph" viewBox="-10 -10 192 192" aria-hidden="true"><g transform="rotate(-8 85 85)"><path class="glyph-accent" d="M12 0H80V80H0V12Z"/><path class="glyph-ink" fill-rule="evenodd" d="M90 0H170V80H90ZM99 9V71H161V9Z"/><path class="glyph-accent" fill-rule="evenodd" d="M0 90H80V170H0ZM19 94V151H76V94Z"/><path class="glyph-ink" d="M90 90H170V148L148 170H90Z"/><path class="glyph-cut" d="M146 170V146H170"/></g></svg>`;}
function hero(p,opts={}){
 const m=p.meta,brand=root.EngramBrand;
 const useBrand=!!brand && (m.brand==='stellagram'||m.brand==='auto'&&/(?:随星录|STELLAGRAM)/i.test((m.title||'')+' '+(m.subtitle||'')));
 const custom=m.brand==='custom'&&(m.logo.light.src||m.logo.dark.src);
 const customLogo=custom?`<div class="custom-wordmark" style="--logo-width:${m.logo.width}px;text-align:${m.logo.align}"><img class="logo-on-light" src="${E(m.logo.light.src||m.logo.dark.src)}" alt="${E(m.logo.light.alt||m.title)}"><img class="logo-on-dark" src="${E(m.logo.dark.src||m.logo.light.src)}" alt="${E(m.logo.dark.alt||m.title)}">${m.logo.showSubtitle&&m.subtitle?`<div class="hero-subtitle">${E(m.subtitle)}</div>`:''}</div>`:'';
 const logo=customLogo||(useBrand?`<div class="stellagram-wordmark"><img class="logo-on-light" src="${E(brand.light)}" alt="${E(brand.alt)}"><img class="logo-on-dark" src="${E(brand.dark)}" alt="${E(brand.alt)}"></div>`:'');
 const title=logo||`<h1>${E(m.title||'未命名项目')}</h1><div class="hero-subtitle">${E(m.subtitle)}</div>`;
 const right=(m.image.src&&m.image.show)?`<div class="hero-custom-image">${media(m.image,p,opts)}</div>`:p.theme.showDecor?`<div class="hero-decor" aria-hidden="true">${emblem()}<span class="coord">${E(m.labels.record)}</span></div>`:'';
 return `<div class="doc-topline"><span>${E(m.kicker)}</span><span class="edition">${E(m.edition)}</span></div><header class="hero"><div class="hero-main ${right?'':'no-decor'}"><div class="hero-title">${title}<div class="hero-line"></div></div>${right}</div><div class="hero-copy rich">${m.intro?rich(m.intro):opts.author?'<p class="ghost-copy">开场语尚未填写。世界的第一句话，留给你。</p>':''}</div></header>
 ${p.theme.showRules?`<section class="rules"><div class="rules-top"><span class="rules-title">${E(m.labels.initial)}</span><span class="initial">${E(m.initial)} <small>${E(m.tokenSymbol||m.tokenName)}</small></span></div><div class="rich">${m.rules?rich(m.rules):opts.author?'<p class="ghost-copy">填写初始资源、选择约束，以及你希望读者知道的规则。</p>':''}</div></section>`:''}`;
}
function footer(p){if(!p.theme.showFooter)return '';return `<footer class="doc-footer"><div>${E(p.meta.footer)}${p.meta.author?`<br>${E(p.meta.author)}`:''}</div><span class="mono">${E(p.meta.edition)} / ${E(p.meta.labels.end)}</span></footer>`;}
function documentView(p,opts={}){return `<article class="${classes(p,opts)}" style="${E(style(p))}">${hero(p,opts)}${p.modules.length?p.modules.map((m,i)=>section(m,p,i,opts)).join(''):`<div class="empty-state"><span class="mono">A WORLD, UNWRITTEN.</span><h2>从一个空白模块开始</h2><p>添加选项卡、素质矩阵、剧情路线，或任意文本。这里没有预设的世界与结局。</p>${!opts.export?'<button class="btn" data-action="add-module">＋ 添加第一个模块</button>':''}</div>`}${footer(p)}</article>`;}
root.EngramView={rich,style,classes,media,points,card,moduleHeader,attributeHeader,displayHeading,headingsAt,shown,section,hero,footer,document:documentView};
})(globalThis);
