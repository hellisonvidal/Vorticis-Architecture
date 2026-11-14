'use strict';
/* ---------- ferramentas ---------- */
const Tools={};
function setPrompt(t){$('#promptTxt').textContent=t||'Comando:';const h=document.querySelector('#optbar .hint');if(h&&tool)h.textContent=t||'';}
function startTool(name,...args){
  if(tool)endTool(true);measureOverlay=null;
  const f=Tools[name];if(!f)return log('Comando desconhecido: '+name,'err');
  const t=f(...args);lastCmd=name;
  if(!t){updateToolUI();return;}
  tool=t;tool.name=name;panMode=false;
  setPrompt(t.prompt);updateToolUI();redraw();
}
function endTool(silent){if(tool&&tool.cancel)tool.cancel();tool=null;setPrompt();updateToolUI();redraw();}
function makeChainTool(title,type,makeObj){
  const t={base:null,start:null,prompt:title+' — primeiro ponto (clique ou digite x;y)',
    point(p){if(!t.base){t.base=p;t.start=p;setPrompt(title+' — próximo ponto (comprimento, @dx;dy, @d<ângulo) · Enter termina · F fecha');return;}if(dist(p,t.base)<1e-9)return;addObj(makeObj(t.base,p));commit();t.base=p;},
    value(v){if(/^[fc]$/i.test(v)&&t.start&&t.base&&dist(t.start,t.base)>1e-9){addObj(makeObj(t.base,t.start));commit();endTool();return true;}return false;},
    enter(){endTool();},
    preview(){return t.base?{objs:[{...makeObj(t.base,cur()),layer:layerFor(type)}]}:null;}};
  return t;
}
function makePolyTool(title,minPts,onDone,previewType,allowOpen){
  const t={pts:[],get base(){return t.pts[t.pts.length-1]||null;},prompt:title+' — primeiro ponto',
    point(p){if(t.pts.length>=minPts&&dist(p,t.pts[0])<10/view.s){t.finish(true);return;}t.pts.push(p);setPrompt(title+' — próximo ponto · Enter/F fecha · D desfaz último');},
    value(v){if(/^[fc]$/i.test(v)){t.finish(true);return true;}if(/^d$/i.test(v)){t.pts.pop();return true;}return false;},
    enter(){t.finish(!allowOpen);},
    finish(closed){if(t.pts.length<(closed?minPts:2)){log('Pontos insuficientes.','err');endTool();return;}const pts=t.pts;endTool();onDone(pts,closed);},
    preview(){if(!t.pts.length)return null;const pts=[...t.pts,cur()];return previewType?{objs:[{type:previewType,pts,closed:!allowOpen,name:''}]}:{prims:[{k:'poly',pts,closed:!allowOpen}]};}};
  return t;
}
function makeRectTool(title,onDone,previewFn){
  const t={base:null,prompt:title+' — primeiro canto',
    point(p){if(!t.base){t.base=p;setPrompt(title+' — canto oposto (ou digite LarguraxAltura, ex.: 10x20)');return;}if(Math.abs(p.x-t.base.x)<1e-9||Math.abs(p.y-t.base.y)<1e-9)return;const a=t.base;endTool();onDone(a,p);},
    value(v){const m=v.match(/^(-?[\d.,]+)\s*[xX×*]\s*(-?[\d.,]+)$/);if(m&&t.base){const c=cur(),sx=Math.sign(c.x-t.base.x)||1,sy=Math.sign(c.y-t.base.y)||1;t.point(P(t.base.x+sx*num(m[1]),t.base.y+sy*num(m[2])));return true;}return false;},
    preview(){return t.base?previewFn(t.base,cur()):null;}};
  return t;
}
Tools.select=()=>{panMode=false;return null;};
Tools.pan=()=>{panMode=true;return null;};
Tools.line=()=>makeChainTool('LINHA','line',(a,b)=>({type:'line',a:cp(a),b:cp(b)}));
Tools.wall=()=>makeChainTool('PAREDE','wall',(a,b)=>({type:'wall',a:cp(a),b:cp(b),t:S().wallT,h:S().wallH}));
Tools.polyline=()=>makePolyTool('POLILINHA',2,(pts,closed)=>{addObj({type:'polyline',pts,closed:closed&&pts.length>2});commit();},null,true);
Tools.rect=()=>makeRectTool('RETÂNGULO',(a,b)=>{addObj({type:'polyline',pts:rectPts(a,b),closed:true});commit();},(a,b)=>({objs:[{type:'polyline',pts:rectPts(a,b),closed:true}]}));
Tools.wallrect=()=>makeRectTool('PAREDES RETANGULARES',(a,b)=>{const p=rectPts(a,b);for(let i=0;i<4;i++)addObj({type:'wall',a:p[i],b:p[(i+1)%4],t:S().wallT,h:S().wallH});commit();log('4 paredes criadas ('+fmt(Math.abs(b.x-a.x))+' x '+fmt(Math.abs(b.y-a.y))+' m, eixo).','res');},
  (a,b)=>{const p=rectPts(a,b);return{objs:p.map((q,i)=>({type:'wall',a:q,b:p[(i+1)%4],t:S().wallT,h:S().wallH,id:'pv'+i}))};});
Tools.circle=()=>{const t={base:null,prompt:'CÍRCULO — centro',
  point(p){if(!t.base){t.base=p;setPrompt('CÍRCULO — raio (clique ou digite)');return;}const r=dist(p,t.base);if(r<1e-9)return;addObj({type:'circle',c:t.base,r});commit();endTool();},
  get wantValue(){return !!t.base;},
  value(v){const r=num(v);if(t.base&&r>0){addObj({type:'circle',c:t.base,r});commit();endTool();return true;}return false;},
  preview(){return t.base?{objs:[{type:'circle',c:t.base,r:dist(cur(),t.base)}]}:null;}};return t;};
Tools.room=()=>{
  const t=makePolyTool('AMBIENTE',3,async(pts)=>{const name=await askText('Nome do ambiente','Ambiente');const o=addObj({type:'room',pts,name:name||'Ambiente'});commit();log(o.name+': '+fmt(Math.abs(polyArea(pts)))+' m²','res');},'room',false);
  t.prompt='AMBIENTE — clique os cantos (ou 2 pontos + LarguraxAltura) · Enter fecha';
  const v0=t.value;t.value=v=>{const m=v.match(/^(-?[\d.,]+)\s*[xX×*]\s*(-?[\d.,]+)$/);if(m&&t.pts.length===1){const b=t.pts[0],c=cur(),sx=Math.sign(c.x-b.x)||1,sy=Math.sign(c.y-b.y)||1;const q=P(b.x+sx*num(m[1]),b.y+sy*num(m[2]));t.pts=rectPts(b,q);t.finish(true);return true;}return v0(v);};
  return t;
};
Tools.terrain=()=>{const t=makePolyTool('TERRENO (desenho livre)',3,async(pts)=>{const name=await askText('Nome do terreno','Terreno');const o=addObj({type:'terrain',pts,name:name||'Terreno',setbacks:pts.map(()=>0)});sel=new Set([o.id]);commit();log('Terreno: área '+fmt(Math.abs(polyArea(pts)))+' m², perímetro '+fmt(polyPerim(pts))+' m','res');},'terrain',false);t.prompt='TERRENO — clique os vértices ou digite comprimentos (ex.: 12, depois 30…) · Enter/F fecha';return t;};
Tools.area=()=>makePolyTool('ÁREA',3,(pts)=>{const A=Math.abs(polyArea(pts));measureOverlay=[{k:'poly',pts,closed:true}];log('Área: '+fmt(A)+' m²  ·  Perímetro: '+fmt(polyPerim(pts))+' m','res');redraw();},null,false);
Tools.measure=()=>{const t={base:null,prompt:'DISTÂNCIA — primeiro ponto',
  point(p){if(!t.base){t.base=p;setPrompt('DISTÂNCIA — segundo ponto');return;}const d=sub(p,t.base);measureOverlay=[{k:'poly',pts:[t.base,p],closed:false}];log('Distância: '+fmt(len(d))+' m  ·  ΔX '+fmt(d.x)+'  ΔY '+fmt(d.y)+'  ·  ângulo '+fmt((angOf(d)*R2D+360)%360,1)+'°','res');t.base=null;setPrompt('DISTÂNCIA — primeiro ponto (Esc sai)');},
  preview(){return t.base?{prims:[{k:'poly',pts:[t.base,cur()],closed:false}]}:null;}};return t;};
function nearestWall(p,width){let best=null,bd=Infinity;for(const w of doc.objects){if(w.type!=='wall')continue;const L=getLayer(w.layer);if(L.visible===false||L.locked)continue;const d=segDist(p,w.a,w.b);const{L:wl}=wallInfo(w);if(wl<width+.01)continue;if(d<Math.max(w.t,.5)&&d<bd){bd=d;best=w;}}if(!best)return null;const{L,n}=wallInfo(best);let off=projT(p,best.a,best.b)*L;if(prefs.snap){const st=S().snapStep;off=Math.round(off/st)*st;}off=Math.max(width/2,Math.min(L-width/2,off));return{w:best,off,side:dot(sub(p,best.a),n)<0};}
function makeOpeningTool(kind){
  const title=kind==='door'?'PORTA':'JANELA';
  const t={hit:null,hinge:false,prompt:title+' — clique sobre uma parede (R troca dobradiça; lado segue o cursor)',
    move(){const w=kind==='door'?S().doorW:S().winW;t.hit=nearestWall(mouseW,w);},
    obj(){if(!t.hit)return null;const s=S();return kind==='door'?{type:'door',kind:s.doorKind,wallId:t.hit.w.id,off:t.hit.off,w:s.doorW,h:s.doorH,flip:t.hit.side,hinge:t.hinge}:{type:'window',kind:s.winKind,wallId:t.hit.w.id,off:t.hit.off,w:s.winW,sill:s.winSill,h:s.winH,flip:t.hit.side};},
    point(){t.move();const o=t.obj();if(!o){log('Clique sobre uma parede (mais longa que a abertura).','err');return;}addObj(o);commit();},
    key(k){if(k==='r'){t.hinge=!t.hinge;return true;}return false;},
    preview(){t.move();const o=t.obj();return o?{objs:[o]}:null;}};
  return t;
}
Tools.door=()=>makeOpeningTool('door');
Tools.window=()=>makeOpeningTool('window');
Tools.block=()=>{const t={rot:0,prompt:'MOBILIÁRIO — clique para inserir (R gira 90°; escolha o tipo na barra acima)',
  obj(p){const B=BLOCKS[S().blockKind];return{type:'block',kind:S().blockKind,p,rot:t.rot,w:B.w,d:B.d};},
  point(p){addObj(t.obj(p));commit();},key(k){if(k==='r'){t.rot+=Math.PI/2;return true;}return false;},
  preview(){return{objs:[t.obj(cur())]};}};return t;};
Tools.dim=()=>{const t={a:null,b:null,get base(){return t.b||t.a;},prompt:'COTA — primeiro ponto',
  offOf(p){return dot(sub(p,t.a),perp(norm(sub(t.b,t.a))));},
  reset(){t.a=t.b=null;setPrompt('COTA — primeiro ponto (Esc sai)');},
  point(p){if(!t.a){t.a=p;setPrompt('COTA — segundo ponto');return;}if(!t.b){if(dist(p,t.a)<1e-9)return;t.b=p;setPrompt('COTA — posição da linha (clique ou digite o afastamento)');return;}addObj({type:'dim',a:t.a,b:t.b,off:t.offOf(p)});commit();t.reset();},
  get wantValue(){return !!(t.a&&t.b);},
  value(v){const d=num(v);if(t.a&&t.b&&!isNaN(d)){const sg=Math.sign(t.offOf(cur()))||1;addObj({type:'dim',a:t.a,b:t.b,off:d*sg});commit();t.reset();return true;}return false;},
  preview(){if(t.a&&t.b)return{objs:[{type:'dim',a:t.a,b:t.b,off:t.offOf(cur())}]};if(t.a)return{prims:[{k:'poly',pts:[t.a,cur()],closed:false}]};return null;}};return t;};
Tools.text=()=>{const t={prompt:'TEXTO — clique a posição',async point(p){const s=await askText('Texto','',true);if(s){addObj({type:'text',p,text:s,size:S().textSize,ang:0});commit();}}};return t;};
Tools.image=()=>{$('#fileImg').click();return null;};
Tools.terrainDlg=()=>{terrainDialog();return null;};
Tools.erase=()=>{if(sel.size)eraseSel();else{pendingCmd='erase';log('Selecione objetos e pressione Enter (ou Delete).');}return null;};
function needSel(name){if(sel.size)return false;pendingCmd=name;log('Selecione os objetos e pressione Enter para continuar ('+name.toUpperCase()+').');return true;}
Tools.move=()=>makeMoveCopy(false);
Tools.copy=()=>makeMoveCopy(true);
function makeMoveCopy(copy){
  if(needSel(copy?'copy':'move'))return null;
  const ids=[...sel],title=copy?'COPIAR':'MOVER';
  const t={base:null,prompt:title+' — ponto base',
    point(p){if(!t.base){t.base=p;setPrompt(title+' — ponto de destino (ou distância / @dx;dy)');return;}const d=sub(p,t.base);const nids=applyXform(ids,q=>add(q,d),{},copy);commit();if(copy){log('Copiado. Clique outro destino ou Esc.');}else{sel=new Set(nids);endTool();buildProps();}},
    enter(){endTool();},
    preview(){if(!t.base)return null;const d=sub(cur(),t.base);return{objs:previewXform(ids,q=>add(q,d),{}),prims:[{k:'poly',pts:[t.base,cur()],closed:false}]};}};
  return t;
}
Tools.rotate=()=>{
  if(needSel('rotate'))return null;const ids=[...sel];
  const t={base:null,prompt:'ROTACIONAR — ponto base',
    get wantValue(){return !!t.base;},
    apply(a){applyXform(ids,q=>rotP(q,t.base,a),{ang:a},false);commit();endTool();},
    point(p){if(!t.base){t.base=p;setPrompt('ROTACIONAR — ângulo em graus (anti-horário) ou clique');return;}t.apply(angOf(sub(p,t.base)));},
    value(v){const a=num(v);if(t.base&&!isNaN(a)){t.apply(a*D2R);return true;}return false;},
    preview(){if(!t.base)return null;const a=angOf(sub(cur(),t.base));return{objs:previewXform(ids,q=>rotP(q,t.base,a),{ang:a}),prims:[{k:'poly',pts:[t.base,cur()],closed:false}]};}};
  return t;
};
Tools.scale=()=>{
  if(needSel('scale'))return null;const ids=[...sel];
  const t={base:null,prompt:'ESCALA — ponto base',
    get wantValue(){return !!t.base;},
    apply(k){if(!(k>0))return;applyXform(ids,q=>add(t.base,mul(sub(q,t.base),k)),{k},false);commit();endTool();},
    point(p){if(!t.base){t.base=p;setPrompt('ESCALA — fator (ex.: 2 ou 0,5) ou clique (distância = fator)');return;}t.apply(dist(p,t.base));},
    value(v){const k=num(v);if(t.base&&k>0){t.apply(k);return true;}return false;},
    preview(){if(!t.base)return null;const k=Math.max(.01,dist(cur(),t.base));return{objs:previewXform(ids,q=>add(t.base,mul(sub(q,t.base),k)),{k})};}};
  return t;
};
Tools.mirror=()=>{
  if(needSel('mirror'))return null;const ids=[...sel];
  const refl=(a,b)=>{const u=norm(sub(b,a));return q=>{const v=sub(q,a);return add(a,sub(mul(u,2*dot(v,u)),v));};};
  const t={base:null,prompt:'ESPELHAR — primeiro ponto do eixo',
    point(p){if(!t.base){t.base=p;setPrompt('ESPELHAR — segundo ponto do eixo');return;}if(dist(p,t.base)<1e-9)return;const opt={mirror:true,axis:angOf(sub(p,t.base))};const nids=applyXform(ids,refl(t.base,p),opt,!S().mirrorErase);commit();sel=new Set(nids);endTool();},
    preview(){if(!t.base||dist(cur(),t.base)<1e-9)return null;return{objs:previewXform(ids,refl(t.base,cur()),{mirror:true,axis:angOf(sub(cur(),t.base))}),prims:[{k:'poly',pts:[t.base,cur()],closed:false}]};}};
  return t;
};
Tools.calibrate=(id)=>{
  const im=getObj(id);if(!im)return null;
  const t={a:null,b:null,get base(){return t.a;},prompt:'CALIBRAR IMAGEM — clique o 1º ponto de uma medida conhecida na foto',
    get wantValue(){return !!(t.a&&t.b);},
    point(p){if(!t.a){t.a=p;setPrompt('CALIBRAR — 2º ponto da medida');return;}if(!t.b){if(dist(p,t.a)<1e-9)return;t.b=p;setPrompt('CALIBRAR — digite a distância real em metros (ex.: 12,5) e Enter');return;}},
    value(v){const d=num(v);if(t.a&&t.b&&d>0){const k=d/dist(t.a,t.b),o=getObj(id);o.p=add(t.a,mul(sub(o.p,t.a),k));o.w*=k;o.h*=k;o.calibrated=true;commit();log('Imagem calibrada: fator '+fmt(k,4)+'. Agora a foto está em escala real.','res');endTool();zoomExtents();return true;}return false;},
    preview(){if(t.a&&!t.b)return{prims:[{k:'poly',pts:[t.a,cur()],closed:false}]};if(t.a&&t.b)return{prims:[{k:'poly',pts:[t.a,t.b],closed:false}]};return null;}};
  return t;
};

/* ---------- linha de comando ---------- */
const ALIASES={A:'arc',ARCO:'arc',TEL:'roof',TELHADO:'roof',ESD:'stair',ESCADA:'stair',HA:'hatch',HACHURA:'hatch',AA:'autoroom',OF:'offset',DESLOCAR:'offset',TR:'trim',APARAR:'trim',EX:'extend',ESTENDER:'extend',F:'fillet',UNIR:'fillet',FD:'photo2d',L:'line',LINHA:'line',PL:'polyline',POLILINHA:'polyline',REC:'rect',RET:'rect',RETANGULO:'rect',C:'circle',CIRC:'circle',CIRCULO:'circle',
  PA:'wall',PAREDE:'wall',PR:'wallrect',PO:'door',PORTA:'door',JA:'window',JANELA:'window',AM:'room',AMBIENTE:'room',B:'block',BLOCO:'block',MOB:'block',
  CO:'dim',COTA:'dim',T:'text',TEXTO:'text',TE:'terrainDlg',TERRENO:'terrainDlg',TL:'terrain',IM:'image',IMAGEM:'image',FOTO:'image',
  M:'move',MOVER:'move',CP:'copy',COPIAR:'copy',RO:'rotate',ROTACIONAR:'rotate',ES:'mirror',ESPELHAR:'mirror',ESC:'scale',ESCALA:'scale',
  APAGAR:'erase',DEL:'erase',E:'erase',DI:'measure',DIST:'measure',AR:'area',AREA:'area',SEL:'select',PAN:'pan'};
const ACTIONS={DWG:()=>exportDWG(),SOBRE:()=>aboutDialog(),CONV:()=>convertDialog(),CONVERTER:()=>convertDialog(),TA:()=>autoRoof(),COT:()=>autoDimension(),PDL:()=>wallsFromSelection(),X:()=>explodeSel(),EXPLODIR:()=>explodeSel(),MA:()=>arrayDialog(),MATRIZ:()=>arrayDialog(),ABRIR:()=>$('#fileAny').click(),IMPORTAR:()=>$('#fileAny').click(),PDF:()=>pdfDialog(),IFC:()=>exportIFC(),OBJ:()=>exportOBJ(),Z:()=>zoomExtents(),ZOOM:()=>zoomExtents(),U:()=>undo(),DES:()=>undo(),DESFAZER:()=>undo(),REF:()=>redo(),REFAZER:()=>redo(),'3D':()=>setView('3d'),'2D':()=>setView('2d'),
  QA:()=>areasDialog(),AREAS:()=>areasDialog(),CONFIG:()=>settingsDialog(),AJUDA:()=>helpDialog(),SALVAR:()=>saveNow(true),PNG:()=>exportPNG(),SVG:()=>exportSVG(),DXF:()=>exportDXF()};
function log(msg,cls){const el=$('#log'),d=document.createElement('div');if(cls)d.className=cls;d.textContent=msg;el.appendChild(d);while(el.children.length>60)el.firstChild.remove();el.scrollTop=el.scrollHeight;}
function parsePoint(str,base){
  let s=str.trim(),rel=false;if(s[0]==='@'){rel=true;s=s.slice(1);}
  let m=s.match(/^(-?[\d.,]+)\s*<\s*(-?[\d.,]+)$/);
  if(m){const d=num(m[1]),a=num(m[2])*D2R;if(isNaN(d)||isNaN(a))return null;return add(base||P(0,0),P(d*Math.cos(a),d*Math.sin(a)));}
  m=s.match(/^(-?[\d.,]+)\s*[;\s]\s*(-?[\d.,]+)$/);
  if(m){const x=num(m[1]),y=num(m[2]);if(isNaN(x)||isNaN(y))return null;return rel&&base?add(base,P(x,y)):P(x,y);}
  if(/^-?[\d.,]+$/.test(s)&&base&&!rel){const d=num(s);if(isNaN(d))return null;let dir=sub(cur(),base);dir=len(dir)<1e-9?P(1,0):norm(dir);return add(base,mul(dir,d));}
  return null;
}
function runCommand(raw){
  const k=raw.trim().toUpperCase();
  if(ACTIONS[k]){ACTIONS[k]();return;}
  const t=ALIASES[k]||(Tools[raw.trim()]?raw.trim():null);
  if(t){startTool(t);return;}
  log('Comando desconhecido: '+raw+' (digite AJUDA)','err');
}
function handleCmd(raw){
  const s=raw.trim();if(s)log('› '+s);
  if(tool){
    if(!s){if(tool.enter)tool.enter();else endTool();return;}
    if(tool.wantValue&&tool.value&&tool.value(s)){redraw();return;}
    if(tool.point){const p=parsePoint(s,tool.base);if(p){snapRes={p,k:null};tool.point(p);redraw();return;}}
    if(tool.value&&tool.value(s)){redraw();return;}
    const k=s.toUpperCase();if(ALIASES[k]||ACTIONS[k]){runCommand(s);return;}
    log('Entrada inválida: '+s,'err');return;
  }
  if(!s){if(pendingCmd&&sel.size){const c=pendingCmd;pendingCmd=null;startTool(c);}else if(lastCmd&&lastCmd!=='select')startTool(lastCmd);return;}
  runCommand(s);
}

/* ---------- interação com o canvas ---------- */
const pointers=new Map();
function updateMouse(e){const r=cv.getBoundingClientRect();mouseS=P(e.clientX-r.left,e.clientY-r.top);mouseW=toW(mouseS.x,mouseS.y);}
function setCoords(){const p=(tool||drag)?cur():mouseW;$('#coords').textContent='X '+fmt(p.x)+'  Y '+fmt(p.y);}
function hitGrip(){for(const id of sel){const o=getObj(id);if(!o)continue;for(const g of grips(o)){const q=toS(g.p);if(Math.abs(q.x-mouseS.x)<7&&Math.abs(q.y-mouseS.y)<7)return{o,g};}}return null;}
cv.addEventListener('contextmenu',e=>e.preventDefault());
cv.addEventListener('pointerdown',e=>{
  cv.setPointerCapture(e.pointerId);updateMouse(e);mouseIn=true;pointers.set(e.pointerId,{...mouseS});
  if(pointers.size===2){const[a,b]=[...pointers.values()];drag={type:'pinch',d0:dist(a,b),s0:view.s,c0:toW((a.x+b.x)/2,(a.y+b.y)/2)};return;}
  if(e.button===1||(e.button===0&&panMode)||e.button===2){drag={type:'pan',s:{...mouseS},v:{...view},btn:e.button,moved:false};return;}
  if(e.button!==0)return;
  if(tool){updateSnap();if(tool.point)tool.point(cur());redraw();return;}
  const gh=hitGrip();
  if(gh){drag={type:'grip',o:gh.o,g:gh.g,orig:clone(gh.o),exclude:new Set([gh.o.id]),base:gh.g.base};return;}
  const o=pickAt(mouseW);
  if(o){
    if(e.shiftKey||e.ctrlKey){sel.has(o.id)?sel.delete(o.id):sel.add(o.id);}
    else if(!sel.has(o.id))sel=new Set([o.id]);
    buildProps();
    drag={type:'move',start:null,startS:{...mouseS},orig:[...sel].map(id=>clone(getObj(id))),exclude:new Set(selectionWithOpenings([...sel])),moved:false};
    redraw();return;
  }
  drag={type:'window',a:mouseW,add:e.shiftKey||e.ctrlKey};
});
cv.addEventListener('pointermove',e=>{
  updateMouse(e);mouseIn=true;if(pointers.has(e.pointerId))pointers.set(e.pointerId,{...mouseS});
  if(drag&&drag.type==='pinch'&&pointers.size===2){const[a,b]=[...pointers.values()];const s=Math.max(.5,Math.min(5000,drag.s0*dist(a,b)/drag.d0));view.s=s;const m=P((a.x+b.x)/2,(a.y+b.y)/2);view.cx=drag.c0.x-(m.x-W/2)/s;view.cy=drag.c0.y+(m.y-H/2)/s;redraw();return;}
  if(drag&&drag.type==='pan'){const dx=mouseS.x-drag.s.x,dy=mouseS.y-drag.s.y;if(Math.abs(dx)+Math.abs(dy)>3)drag.moved=true;view.cx=drag.v.cx-dx/view.s;view.cy=drag.v.cy+dy/view.s;redraw();return;}
  if(drag&&drag.type==='grip'){
    const tb=tool;tool=drag.base?{base:drag.base}:null;updateSnap();tool=tb;
    Object.assign(drag.o,clone(drag.orig));drag.g.set(cur());setCoords();redraw();return;
  }
  if(drag&&drag.type==='move'){
    if(!drag.moved&&dist(mouseS,drag.startS)<4)return;
    updateSnap();if(!drag.start){drag.start=cur();drag.moved=true;}
    const d=sub(cur(),drag.start);
    for(const orig of drag.orig){const o=getObj(orig.id);if(!o)continue;Object.assign(o,clone(orig));if(o.type!=='door'&&o.type!=='window')xformObj(o,q=>add(q,d),{});}
    setCoords();redraw();return;
  }
  if(tool){updateSnap();if(tool.move)tool.move();}
  else if(!drag){const o=pickAt(mouseW);const h=o?o.id:null;if(h!==hoverId){hoverId=h;}}
  setCoords();redraw();
});
function endPointer(e){
  pointers.delete(e.pointerId);
  if(!drag)return;
  const d=drag;
  if(d.type==='pinch'){if(pointers.size===0)drag=null;return;}
  drag=null;
  if(d.type==='pan'){if(d.btn===2&&!d.moved){handleCmd('');}return;}
  if(d.type==='grip'){commit();return;}
  if(d.type==='move'){if(d.moved)commit();return;}
  if(d.type==='window'){
    const a=toS(d.a),b=mouseS;
    if(Math.abs(a.x-b.x)<4&&Math.abs(a.y-b.y)<4){if(!d.add)sel.clear();buildProps();redraw();return;}
    const w0=d.a,w1=mouseW,x0=Math.min(w0.x,w1.x),x1=Math.max(w0.x,w1.x),y0=Math.min(w0.y,w1.y),y1=Math.max(w0.y,w1.y),cross=b.x<a.x;
    if(!d.add)sel.clear();
    for(const o of doc.objects){const L=getLayer(o.layer);if(L.visible===false||L.locked)continue;const bb=objBBox(o);if(!bb)continue;
      const inside=bb.x0>=x0&&bb.x1<=x1&&bb.y0>=y0&&bb.y1<=y1,over=bb.x0<=x1&&bb.x1>=x0&&bb.y0<=y1&&bb.y1>=y0;
      if(inside||(cross&&over))sel.add(o.id);}
    buildProps();redraw();if(sel.size)log(sel.size+' objeto(s) selecionado(s).');
  }
}
cv.addEventListener('pointerup',endPointer);
cv.addEventListener('pointercancel',endPointer);
cv.addEventListener('pointerleave',()=>{mouseIn=false;hoverId=null;redraw();});
cv.addEventListener('wheel',e=>{e.preventDefault();updateMouse(e);zoomAt(mouseS,Math.pow(1.0015,-e.deltaY*(e.deltaMode===1?30:1)));},{passive:false});
cv.addEventListener('dblclick',e=>{if(tool)return;const o=pickAt(mouseW);if(o&&(o.type==='text'||o.type==='room'||o.type==='terrain')){openPanel();setTimeout(()=>{const f=$('#props input[type=text],#props textarea');if(f)f.focus();},0);}});
function zoomAt(sp,f){const w=toW(sp.x,sp.y);view.s=Math.max(.5,Math.min(5000,view.s*f));view.cx=w.x-(sp.x-W/2)/view.s;view.cy=w.y+(sp.y-H/2)/view.s;updateSnap();redraw();}
function zoomExtents(){if(mode3d){fit3DView('iso');return;}const b=docBBox();if(!b){view={cx:10,cy:8,s:30};redraw();return;}const w=Math.max(b.x1-b.x0,1),h=Math.max(b.y1-b.y0,1);view.s=Math.max(.5,Math.min(5000,Math.min(W/w,H/h)*.85));view.cx=(b.x0+b.x1)/2;view.cy=(b.y0+b.y1)/2;redraw();}

/* ---------- teclado ---------- */
const cmdEl=$('#cmd');
cmdEl.addEventListener('keydown',e=>{if(e.key==='Enter'||(e.key===' '&&!cmdEl.value.trim()&&!/\d/.test(cmdEl.value))){e.preventDefault();const v=cmdEl.value;cmdEl.value='';handleCmd(v);}});
function cancelAction(){cmdEl.value='';pendingCmd=null;measureOverlay=null;if(tool)endTool();else{sel.clear();buildProps();}if(drag&&drag.type!=='pan'){drag=null;}redraw();}
document.addEventListener('keydown',e=>{
  if($('#dlg').open)return;
  const tg=e.target,tag=tg.tagName,isCmd=tg===cmdEl;
  const typing=!isCmd&&(tag==='INPUT'||tag==='TEXTAREA'||tag==='SELECT'||tg.isContentEditable);
  if(typing)return;
  const k=e.key;
  if(e.ctrlKey||e.metaKey){const l=k.toLowerCase();
    if(l==='z'){e.preventDefault();e.shiftKey?redo():undo();}
    else if(l==='y'){e.preventDefault();redo();}
    else if(l==='s'){e.preventDefault();saveNow(true);}
    else if(l==='a'&&!isCmd){e.preventDefault();sel=new Set(doc.objects.filter(o=>{const L=getLayer(o.layer);return L.visible!==false&&!L.locked;}).map(o=>o.id));buildProps();redraw();}
    else if(l==='c'&&!isCmd&&sel.size){clipboard=selectionWithOpenings([...sel]).map(id=>clone(getObj(id)));log(clipboard.length+' objeto(s) copiado(s) para a área de transferência.');}
    else if(l==='v'&&!isCmd&&clipboard){pasteClip();}
    return;}
  if(k==='F3'){e.preventDefault();toggle('osnap');return;}
  if(k==='F7'){e.preventDefault();toggle('grid');return;}
  if(k==='F8'){e.preventDefault();toggle('ortho');return;}
  if(k==='F9'){e.preventDefault();toggle('snap');return;}
  if(k==='F10'){e.preventDefault();toggle('polar');return;}
  if(k==='Escape'){cancelAction();return;}
  if(isCmd&&cmdEl.value)return;
  if(!isCmd&&(k==='Delete'||k==='Backspace')&&!tool){e.preventDefault();eraseSel();return;}
  if(!isCmd&&(k==='Enter'||k===' ')){e.preventDefault();handleCmd('');return;}
  if(tool&&tool.key&&k.length===1&&tool.key(k.toLowerCase())){e.preventDefault();redraw();return;}
  if(!isCmd&&k.length===1&&!e.altKey){cmdEl.focus();}
});
function pasteClip(){const ids=clipboard.map(o=>o.id),b=docBBox(clipboard)||{x0:0,y0:0};const d=sub(mouseIn?cur():P(view.cx,view.cy),P(b.x0,b.y0));const map={},out=[];for(const o of clipboard){const n=clone(o);n.id=uid();map[o.id]=n.id;out.push(n);}
  for(const n of out){if(n.type==='door'||n.type==='window'){if(!map[n.wallId])continue;n.wallId=map[n.wallId];}else xformObj(n,q=>add(q,d),{});doc.objects.push(n);}sel=new Set(out.map(o=>o.id));commit();log(out.length+' objeto(s) colado(s).');}
function toggle(k){prefs[k]=!prefs[k];savePrefs();updateToggles();updateSnap();redraw();log(k.toUpperCase()+': '+(prefs[k]?'ligado':'desligado'));}
function updateToggles(){$$('.tg').forEach(b=>b.classList.toggle('on',!!prefs[b.dataset.tg]));}
$$('.tg').forEach(b=>b.addEventListener('click',()=>toggle(b.dataset.tg)));


Tools.photo2d=()=>{photoDialog();return null;};
