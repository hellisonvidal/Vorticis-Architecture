'use strict';
/* ---------- inicialização ---------- */
let appReady=false;
window.addEventListener('resize',resize);
window.addEventListener('beforeunload',()=>{if(saveTimer){saveNow();}});
(async function init(){
  buildRibbon();updateToggles();
  if(ANDROID||matchMedia('(pointer:coarse)').matches)document.documentElement.classList.add('touch');
  await store.init();
  resize();
  let loaded=false;
  try{const last=localStorage.getItem('va:last');if(last){const r=await store.get(last);if(r&&r.doc){loadDoc(r.doc);loaded=true;}}}catch(e){}
  if(!loaded){loadDoc(newDoc(await uniqueName()));}
  resetHistory();
  appReady=true;if(window.__openQueue)window.__openQueue.splice(0).forEach(f=>f());
  log('Vorticis Architecture '+APP_VERSION+(PLATFORM?' ('+PLATFORM+')':'')+' pronto. Use a faixa de opções acima ou digite AJUDA.');
  if(!DESKTOP&&!ANDROID&&'serviceWorker' in navigator&&location.protocol.startsWith('http'))navigator.serviceWorker.register('sw.js').catch(()=>{});
})();

/* ---------- integração com o app Android ---------- */
// arquivo aberto pelo Android ("Abrir com" / "Compartilhar"): chega em base64
window.androidOpenFile=(name,b64)=>{const run=()=>{const bin=atob(b64),u=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)u[i]=bin.charCodeAt(i);if(mode3d)setView('2d');importFile(new File([u],name||'arquivo'));};
  if(appReady)run();else(window.__openQueue=window.__openQueue||[]).push(run);};
// botão Voltar do Android: fecha janela, painel, ferramenta ou 3D antes de sair
window.androidBack=()=>{const d=$('#dlg');if(d.open){d.close();return true;}
  const m=$('#main');if(m.classList.contains('panelopen')){togglePanel();return true;}
  if(tool||sel.size||pendingCmd){cancelAction();return true;}
  if(mode3d){setView('2d');return true;}return false;};
window.androidPause=()=>{try{saveNow();}catch(e){}};
