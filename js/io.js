'use strict';
/* ---------- exportação ---------- */
function blobToB64(blob){return new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(String(r.result).split(',')[1]||'');r.onerror=()=>rej(r.error);r.readAsDataURL(blob);});}
async function saveDesktop(name,blob){try{const p=await tauriInvoke('save_file',{name:name.replace(/[\\/:*?"<>|]+/g,'_'),dataB64:await blobToB64(blob)});if(p)log('Arquivo salvo em '+p,'res');}catch(e){log('Falha ao salvar: '+e,'err');}}
function download(name,blob){if(DESKTOP){saveDesktop(name,blob);return;}const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name.replace(/[\\/:*?"<>|]+/g,'_');document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},1000);}

/* ---------- armazenamento (IndexedDB com fallback) ---------- */
const store={db:null,
  async init(){try{this.db=await new Promise((res,rej)=>{const r=indexedDB.open('vorticis-architecture',1);r.onupgradeneeded=()=>r.result.createObjectStore('projects',{keyPath:'name'});r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error);});}catch(e){this.db=null;}},
  os(m){return this.db.transaction('projects',m).objectStore('projects');},
  rq(r){return new Promise((res,rej)=>{r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error);});},
  async put(rec){if(this.db)return this.rq(this.os('readwrite').put(rec));localStorage.setItem('va:p:'+rec.name,JSON.stringify(rec));},
  async get(name){if(this.db)return this.rq(this.os('readonly').get(name));try{return JSON.parse(localStorage.getItem('va:p:'+name));}catch(e){return null;}},
  async all(){if(this.db){const a=await this.rq(this.os('readonly').getAll());return a.map(r=>({name:r.name,updated:r.updated,n:(r.doc.objects||[]).length}));}const a=[];for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k.startsWith('va:p:'))try{const r=JSON.parse(localStorage.getItem(k));a.push({name:r.name,updated:r.updated,n:r.doc.objects.length});}catch(e){}}return a;},
  async del(name){if(this.db)return this.rq(this.os('readwrite').delete(name));localStorage.removeItem('va:p:'+name);}};
function prune(){const used=new Set(doc.objects.filter(o=>o.type==='image').map(o=>o.img));const keep=new Set([...used]);undoStack.concat(redoStack).forEach(s=>{const m=s.match(/"img":"(img[^"]+)"/g);if(m)m.forEach(x=>keep.add(x.slice(7,-1)));});for(const k of Object.keys(doc.images))if(!keep.has(k))delete doc.images[k];}
let saveTimer=null;
function scheduleSave(){clearTimeout(saveTimer);$('#saveInfo').textContent='Alterações não salvas…';saveTimer=setTimeout(()=>saveNow(),800);}
async function saveNow(explicit){clearTimeout(saveTimer);try{prune();doc.view={...view};await store.put({name:doc.name,updated:Date.now(),doc:JSON.parse(JSON.stringify(doc))});try{localStorage.setItem('va:last',doc.name);}catch(e){}$('#saveInfo').textContent='Salvo às '+new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})+(store.db?'':' (armazenamento limitado)');if(explicit)log('Projeto "'+doc.name+'" salvo neste navegador.','res');}catch(e){$('#saveInfo').textContent='Falha ao salvar!';log('Falha ao salvar: '+e.message+' — exporte um backup JSON.','err');}}
function loadDoc(d,fit){
  const base=newDoc(d.name);doc={...base,...d,settings:{...DEFAULT_SETTINGS,...(d.settings||{})},images:d.images||{},layers:(d.layers&&d.layers.length?d.layers:base.layers)};
  if(!doc.layers.some(l=>l.id===doc.activeLayer))doc.activeLayer=doc.layers[0].id;
  doc.objects.forEach(o=>{if(!o.id)o.id=uid();if(!doc.layers.some(l=>l.id===o.layer))o.layer=doc.layers[0].id;});
  for(const k in imgCache)delete imgCache[k];
  sel.clear();hoverId=null;if(tool)endTool();resetHistory();$('#projName').value=doc.name;
  if(d.view&&!fit)view={...d.view};else zoomExtents();
  buildProps();buildLayers();updateToolUI();redraw();if(mode3d){if(T3)T3.fitted=false;refresh3D();}
}
async function projectsDialog(){
  const list=(await store.all()).sort((a,b)=>b.updated-a.updated);
  const html='<table class="t" style="min-width:min(520px,80vw)"><thead><tr><th>Projeto</th><th>Atualizado</th><th class="n">Objetos</th><th></th></tr></thead><tbody>'+
    (list.length?list.map(r=>'<tr><td>'+(r.name===doc.name?'<b>'+esc(r.name)+'</b> <span class="muted">(aberto)</span>':esc(r.name))+'</td><td>'+new Date(r.updated).toLocaleString('pt-BR')+'</td><td class="n">'+r.n+'</td><td style="white-space:nowrap"><button type="button" data-open="'+esc(r.name)+'">Abrir</button> <button type="button" class="danger" data-del="'+esc(r.name)+'">Excluir</button></td></tr>').join(''):'<tr><td colspan="4" class="muted">Nenhum projeto salvo.</td></tr>')+'</tbody></table>'+
    '<p class="muted">Projetos ficam salvos neste navegador/dispositivo. Para levar a outro computador, use Exportar → Backup JSON e depois Importar.</p>';
  modal('Projetos',html,[{label:'Salvar como…',onClick:async()=>{const n=await askText('Salvar como (novo nome)',doc.name+' - cópia');if(n){doc.name=n.trim();$('#projName').value=doc.name;await saveNow(true);}return true;}},{label:'Fechar',primary:true}],body=>{
    body.querySelectorAll('[data-open]').forEach(b=>b.addEventListener('click',async()=>{await saveNow();const r=await store.get(b.dataset.open);if(r){loadDoc(r.doc);log('Projeto aberto: '+r.name);try{localStorage.setItem('va:last',r.name);}catch(e){}}dlg.close();}));
    body.querySelectorAll('[data-del]').forEach(b=>b.addEventListener('click',async()=>{const n=b.dataset.del;if(!confirm('Excluir o projeto "'+n+'"? Esta ação não pode ser desfeita.'))return;await store.del(n);if(n===doc.name){loadDoc(newDoc(await uniqueName()));}b.closest('tr').remove();}));
  });
}
async function uniqueName(){const names=new Set((await store.all()).map(r=>r.name));let i=1;while(names.has('Projeto '+i))i++;return'Projeto '+i;}
async function newProject(){await saveNow();loadDoc(newDoc(await uniqueName()));await saveNow();log('Novo projeto criado: '+doc.name);}
$('#projName').addEventListener('change',async e=>{const nn=e.target.value.trim();if(!nn||nn===doc.name){e.target.value=doc.name;return;}const ex=await store.get(nn);if(ex&&!confirm('Já existe um projeto "'+nn+'". Substituir?')){e.target.value=doc.name;return;}const old=doc.name;doc.name=nn;await saveNow();await store.del(old);log('Projeto renomeado para "'+nn+'".');});

async function saveAsDialog(){const n=await askText('Salvar como (novo nome do projeto)',doc.name+' - cópia');if(!n)return;const nn=n.trim();if(!nn)return;if(await store.get(nn)&&!confirm('Já existe um projeto "'+nn+'". Substituir?'))return;doc.name=nn;$('#projName').value=nn;await saveNow(true);}
