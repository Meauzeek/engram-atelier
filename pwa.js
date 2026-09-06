/* Installation and offline shell. Drafts stay in IndexedDB, never in the worker cache. */
(function(root){
'use strict';let registration=null,promptEvent=null,updating=false,registrationError='';
function geometry(){const v=visualViewport;const h=v?.height||innerHeight;document.documentElement.style.setProperty('--vvh',h+'px');document.documentElement.style.setProperty('--keyboard-inset',Math.max(0,innerHeight-h-(v?.offsetTop||0))+'px');}
geometry();visualViewport?.addEventListener('resize',geometry);visualViewport?.addEventListener('scroll',geometry);addEventListener('resize',geometry);
addEventListener('beforeinstallprompt',e=>{e.preventDefault();promptEvent=e;});
const offline=()=>{const n=document.querySelector('#offlineNotice');if(n){n.hidden=navigator.onLine;n.textContent='离线模式 · 进度继续保存在本机';}};
addEventListener('online',offline);addEventListener('offline',offline);offline();
async function show(){const app=root.EngramApp,standalone=matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
 app.openModal('安装与离线',`<div class="help-text"><h3>${standalone?'已从主屏幕启动':'把工坊留在主屏幕'}</h3><p>Android：在浏览器菜单选择“安装应用”或“添加到主屏幕”。iPhone / iPad：Safari → 分享 → 添加到主屏幕，启用“作为网页 App 打开”。</p><div class="notice">${registration?.active?'离线程序已就绪。首次完整加载后可断网重新打开；新版本不会覆盖本机项目。':document.getElementById('engram-boot')?'当前是单文件 HTML，不注册离线程序。部署版通过 HTTPS 打开即可安装。':registrationError?'离线程序暂未就绪：'+root.EngramCore.esc(registrationError):'正在准备离线程序。需要 GitHub Pages 的 HTTPS，或电脑 localhost。'}</div><p>离线缓存保存的是编辑器。创作进度另存于本机项目库。电脑、手机和平板各自独立，使用“备份 / 跨设备转移”发送完整 JSON 存档；当前没有自动云同步。</p><p>外部字体未成功载入时会使用本机字形，不影响编辑；可在项目字体窗口选择已有字库，保存在当前设备。</p></div><div class="modal-bottom">${promptEvent&&!standalone?'<button class="btn primary" data-action="pwa-install">安装到主屏幕</button>':''}<button class="btn" data-action="pwa-update">${registration?.waiting?'保存并更新应用':'检查应用更新'}</button><button class="btn" data-action="close-modal">关闭</button></div>`,'install');
}
async function install(){if(!promptEvent){await show();return;}const event=promptEvent;promptEvent=null;await event.prompt();await event.userChoice;await show();}
async function update(){if(!registration){root.EngramApp.toast('尚未注册离线程序；请通过部署后的 HTTPS 网页打开。');return;}await registration.update();if(registration.waiting){updating=true;registration.waiting.postMessage({type:'SKIP_WAITING'});}else root.EngramApp.toast('已检查更新。若新版本正在准备，请稍后再次点击。');}
if('serviceWorker'in navigator){navigator.serviceWorker.addEventListener('controllerchange',()=>{if(updating)location.reload();});}
async function init(){await root.EngramApp.ready;if(!('serviceWorker'in navigator)||!isSecureContext||document.getElementById('engram-boot'))return;
 try{registration=await navigator.serviceWorker.register('./sw.js',{scope:'./',updateViaCache:'none'});registration.addEventListener('updatefound',()=>{const worker=registration.installing;worker?.addEventListener('statechange',()=>{if(worker.state==='installed'&&navigator.serviceWorker.controller)root.EngramApp.toast('新版本已准备好。在“离线 / 安装”中保存并更新，不会清空项目。');});});await navigator.serviceWorker.ready;}
 catch(e){registrationError=e.message;}
}
root.EngramPWA={show,install,update,state:()=>({active:!!registration?.active,waiting:!!registration?.waiting,error:registrationError})};init().catch(e=>{registrationError=e?.message||'离线初始化未完成';});
})(globalThis);
