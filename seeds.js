/* Neutral templates. All names and prices below are editable placeholders. */
(function(root){
  const C=root.EngramCore;
  function cards(n,label){return Array.from({length:n},(_,i)=>C.card({title:`${label} ${String(i+1).padStart(2,'0')}`,subtitle:'',description:'',points:null}));}
  function make(kind='stellagram'){
    const generic=kind==='generic';
    const base={schema:C.SCHEMA,version:1,id:C.uid('project'),meta:{title:generic?'未命名世界':'随星录',subtitle:generic?'CHOOSE YOUR OWN ADVENTURE':'STELLAGRAM OF WHIMSIES',kicker:generic?'CYOA / BLANK TEMPLATE':'ENGRAM / CHARACTER CONFIGURATION',edition:'0.5',author:'',
      intro:generic?'':'',rules:'',footer:'',brand:generic?'none':'stellagram',tokenName:generic?'代币（待命名）':'铟锭',tokenSymbol:generic?'':'IN',initial:0,
      notes:generic?'':'本文件仅预留创作结构，不代替正式世界观设定。初始资源 0 为占位值；卡片留空的数值表示尚未定价。\n\n已确认：H 级统称“象胥 / Haltija”，不再仅指 Hakamori。四大机关的四方分支后置展示，不在开局直接展开。\n\n默认代币为铟锭 / IN（Ingot），可自由修改。'},theme:{},settings:{},modules:[],play:{selected:[],answers:{}}};
    if(kind==='demo'&&root.ENGRAM_DEMO){const p=C.normalize(root.ENGRAM_DEMO);p.id=C.uid('project');p.meta.created=p.meta.modified=new Date().toISOString();return p;}
    if(!generic){
      base.modules=[
        C.section({title:'世界状态',subtitle:'WORLD STATE',columns:5,cards:cards(5,'状态')}),
        C.section({title:'身份与权限',subtitle:'STATUS / ACCESS',columns:5,cards:cards(5,'身份')}),
        C.section({title:'存在分辨率',subtitle:'RESOLUTION',columns:4,cards:cards(4,'层级')}),
        C.section({title:'基础素质',subtitle:'ATTRIBUTES',type:'attributes',columns:5,rows:Array.from({length:4},(_,i)=>C.row({title:`素质 ${'ABCD'[i]}`,cards:cards(5,'档位')}))}),
        C.section({title:'核心设定',subtitle:'CANON TAGS',selection:'multi',columns:3,cards:cards(3,'设定')}),
        C.section({title:'其他设定',subtitle:'WORLD TAGS',selection:'multi',columns:3,cards:cards(3,'设定')}),
        C.section({title:'特殊设定',subtitle:'PERSONAL TAGS',selection:'multi',columns:3,cards:cards(3,'设定')}),
        C.section({title:'大型路线',subtitle:'SCENARIOS',type:'scenario',columns:1,selection:'multi',cards:cards(2,'路线').map(c=>({...c,image:{...c.image,ratio:'1/1'},fields:[{label:'目标',value:''},{label:'达成结果',value:''}]}))}),
        C.section({title:'构筑笔记',subtitle:'FIELD NOTES',type:'text',text:'',input:true,inputLabel:'为这次开局留下记录',image:{show:false}})
      ];
    }
    const p=C.normalize(base);p.modules.forEach(m=>m.display.cardNumbers=false);p.output.moduleNumbers=false;p.output.cardNumbers=false;return p;
  }
  root.EngramSeeds={make};
})(globalThis);
