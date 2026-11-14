'use strict';
/* ---------- inicialização ---------- */
window.addEventListener('resize',resize);
window.addEventListener('beforeunload',()=>{if(saveTimer){saveNow();}});
(async function init(){
  buildRibbon();updateToggles();
  await store.init();
  resize();
  let loaded=false;
  try{const last=localStorage.getItem('va:last');if(last){const r=await store.get(last);if(r&&r.doc){loadDoc(r.doc);loaded=true;}}}catch(e){}
  if(!loaded){loadDoc(newDoc(await uniqueName()));}
  resetHistory();
  log('Vorticis Architecture '+APP_VERSION+(DESKTOP?' (Windows)':'')+' pronto. Use a faixa de opções acima ou digite AJUDA.');
  if(!DESKTOP&&'serviceWorker' in navigator&&location.protocol.startsWith('http'))navigator.serviceWorker.register('sw.js').catch(()=>{});
})();
