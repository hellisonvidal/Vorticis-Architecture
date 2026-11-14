'use strict';
/* =========================================================================
   Conversão automática: desenho importado (linhas) -> elementos editáveis
   Paredes (pares de linhas paralelas), portas (vão + arco), janelas (vão + linhas),
   ambientes (textos com nome dentro de áreas fechadas). Funciona com DWG, DXF, PDF, SVG, DWFx.
   ========================================================================= */
const WALL_LAYER_RE=/par(e|é)de|wall|alvenaria|muro|a-wall|arq-par|vedac|vedaç/i;
const CONV_DEFAULT={tMin:.07,tMax:.45,minLen:.25,doors:true,windows:true,rooms:true,removeUsed:true,onlyWallLayers:'auto'};

// polilinha aberta que é na verdade um arco (PDF/SVG desenham arcos como curvas)
function polyAsArc(o){
  if(o.type!=='polyline'||o.closed||o.pts.length<4)return null;const p=o.pts,a=p[0],m=p[Math.floor(p.length/2)],b=p[p.length-1];
  const c=circle3(a,m,b);if(!c)return null;const r=dist(c,a);if(r<.2||r>3)return null;
  for(const q of p)if(Math.abs(dist(q,c)-r)>Math.max(.01,r*.03))return null;
  const sw=Math.abs(p.slice(1).reduce((s,q,i)=>{let d=angOf(sub(q,c))-angOf(sub(p[i],c));while(d>Math.PI)d-=2*Math.PI;while(d<-Math.PI)d+=2*Math.PI;return s+d;},0));
  if(sw<.6||sw>3.3)return null;return{c,r,mid:m,ends:[a,b]};
}
function arcInfo(o){if(o.type==='arc'){const a1=arcFix(o),r=o.r;return{c:o.c,r,mid:add(o.c,P(Math.cos((o.a0+a1)/2)*r,Math.sin((o.a0+a1)/2)*r)),ends:[arcPt(o,o.a0),arcPt(o,a1)]};}return polyAsArc(o);}

function convertDrawing(objs,opt={}){
  opt={...CONV_DEFAULT,...S().convert,...opt};
  const rep={walls:0,doors:0,windows:0,rooms:0,removed:0,kept:0};
  const lineObjs=objs.filter(o=>o.type==='line'||o.type==='polyline');
  // ---- segmentos ----
  let segs=[];
  for(const o of lineObjs){const pts=o.type==='line'?[o.a,o.b]:o.pts,n=pts.length,cl=o.type==='polyline'&&o.closed;
    if(o.type==='polyline'&&polyAsArc(o))continue;
    for(let i=0;i<n-(cl?0:1);i++){const a=pts[i],b=pts[(i+1)%n],L=dist(a,b);if(L<.05)continue;const d=mul(sub(b,a),1/L);segs.push({a,b,L,d,n:perp(d),o,used:[],lay:getLayer(o.layer).name});}}
  const total=segs.reduce((s,x)=>s+x.L,0);
  if(opt.onlyWallLayers==='auto'?segs.some(s=>WALL_LAYER_RE.test(s.lay)):opt.onlyWallLayers)segs.forEach(s=>s.cand=WALL_LAYER_RE.test(s.lay));else segs.forEach(s=>s.cand=true);
  // ---- pares paralelos -> trechos de parede ----
  const C=segs.filter(s=>s.cand);C.forEach(s=>{s.x0=Math.min(s.a.x,s.b.x)-opt.tMax;s.x1=Math.max(s.a.x,s.b.x)+opt.tMax;s.y0=Math.min(s.a.y,s.b.y)-opt.tMax;s.y1=Math.max(s.a.y,s.b.y)+opt.tMax;});
  C.sort((p,q)=>p.x0-q.x0);const cand=[];
  for(let i=0;i<C.length;i++){const A=C[i];for(let j=i+1;j<C.length&&C[j].x0<=A.x1;j++){const B=C[j];if(B.y0>A.y1||B.y1<A.y0)continue;
    if(Math.abs(crs(A.d,B.d))>.02)continue;const dd=Math.abs(dot(sub(B.a,A.a),A.n));if(dd<opt.tMin||dd>opt.tMax)continue;
    const t1=dot(sub(B.a,A.a),A.d),t2=dot(sub(B.b,A.a),A.d),o0=Math.max(0,Math.min(t1,t2)),o1=Math.min(A.L,Math.max(t1,t2));if(o1-o0<opt.minLen)continue;
    cand.push({A,B,d:dd,o0,o1});}}
  cand.sort((p,q)=>p.d-q.d||(q.o1-q.o0)-(p.o1-p.o0));
  const subtract=(iv,used)=>{let parts=[iv];for(const[u0,u1]of used){const nx=[];for(const[a,b]of parts){if(u1<=a||u0>=b){nx.push([a,b]);continue;}if(u0>a)nx.push([a,u0]);if(u1<b)nx.push([u1,b]);}parts=nx;}return parts;};
  let pieces=[];
  for(const c of cand){const{A,B}=c,sg=Math.sign(dot(sub(B.a,A.a),A.n))||1,toB=t=>dot(sub(add(A.a,mul(A.d,t)),B.a),B.d);
    let parts=subtract([c.o0,c.o1],A.used).flatMap(([a,b])=>{const q0=toB(a),q1=toB(b),lo=Math.min(q0,q1),hi=Math.max(q0,q1);return subtract([lo,hi],B.used).map(([x,y])=>{const r0=dot(sub(add(B.a,mul(B.d,x)),A.a),A.d),r1=dot(sub(add(B.a,mul(B.d,y)),A.a),A.d);return[Math.min(r0,r1),Math.max(r0,r1)];});});
    for(const[s0,s1]of parts){if(s1-s0<opt.minLen)continue;const off=mul(A.n,sg*c.d/2);
      pieces.push({a:add(add(A.a,mul(A.d,s0)),off),b:add(add(A.a,mul(A.d,s1)),off),t:Math.round(c.d*1000)/1000,src:[A,B]});
      A.used.push([s0,s1]);const q0=toB(s0),q1=toB(s1);B.used.push([Math.min(q0,q1),Math.max(q0,q1)]);}}
  if(opt.debug)(rep.dbg=rep.dbg||[]).push(['pares',pieces.map(w=>[w.a.x,w.a.y,w.b.x,w.b.y,w.t].map(v=>+v.toFixed(3)).join(','))]);
  // ---- une trechos colineares (mesma linha e espessura) ----
  const colin=(p,q,tol=.03)=>Math.abs(crs(norm(sub(p.b,p.a)),norm(sub(q.b,q.a))))<.02&&Math.abs(dot(sub(q.a,p.a),perp(norm(sub(p.b,p.a)))))<tol&&Math.abs(p.t-q.t)<.03;
  const span=(p,q)=>{const u=norm(sub(p.b,p.a)),ts=[0,dist(p.a,p.b),dot(sub(q.a,p.a),u),dot(sub(q.b,p.a),u)];return{u,lo:Math.min(...ts),hi:Math.max(...ts),qa:Math.min(ts[2],ts[3]),qb:Math.max(ts[2],ts[3]),pl:ts[1]};};
  for(let changed=true;changed;){changed=false;
    for(let i=0;i<pieces.length&&!changed;i++)for(let j=i+1;j<pieces.length;j++){const p=pieces[i],q=pieces[j];if(!colin(p,q))continue;const s=span(p,q);
      if(s.qa<=s.pl+.03&&s.qb>=-.03){p.b=add(p.a,mul(s.u,s.hi));p.a=add(p.a,mul(s.u,s.lo));p.t=Math.max(p.t,q.t);p.src.push(...q.src);pieces.splice(j,1);changed=true;break;}}}
  if(opt.debug)(rep.dbg=rep.dbg||[]).push(['colineares',pieces.map(w=>[w.a.x,w.a.y,w.b.x,w.b.y,w.t].map(v=>+v.toFixed(3)).join(','))]);
  // ---- cantos e encontros em T: leva a ponta ao eixo da parede perpendicular ----
  for(const w of pieces)for(const e of['a','b']){let best=null,bd=Infinity;const u=norm(sub(w.b,w.a));
    for(const q of pieces){if(q===w)continue;const v=norm(sub(q.b,q.a));if(Math.abs(crs(u,v))<.5)continue;const x=lineInt(w.a,u,q.a,v);if(!x)continue;
      const d=dist(x,w[e]),Lq=dist(q.a,q.b),tq=dot(sub(x,q.a),v);if(d<=q.t/2+w.t/2+.06&&tq>=-q.t-.06&&tq<=Lq+q.t+.06&&d<bd){bd=d;best=x;}}
    if(best)w[e]=best;}
  for(const w of pieces)for(const e of['a','b'])for(const q of pieces){if(q===w)continue;for(const f of['a','b'])if(dist(w[e],q[f])<.02)q[f]=w[e];}
  if(opt.debug)(rep.dbg=rep.dbg||[]).push(['cantos',pieces.map(w=>[w.a.x,w.a.y,w.b.x,w.b.y,w.t].map(v=>+v.toFixed(3)).join(','))]);
  pieces=pieces.filter(w=>dist(w.a,w.b)>=opt.minLen); // descarta trechos que colapsaram ao unir cantos
  // trechos dentro do vão de outra parede (linhas de caixilho desenhadas em par) viram candidatos a janela
  const inGapPieces=new Set();
  for(const q of pieces){const uq=norm(sub(q.b,q.a));for(const p of pieces){if(p===q||p.t<=q.t+.02||dist(p.a,p.b)<dist(q.a,q.b))continue;const u=norm(sub(p.b,p.a));if(Math.abs(crs(u,uq))>.03)continue;
    if(Math.abs(dot(sub(mid(q.a,q.b),p.a),perp(u)))<p.t/2+.03&&dist(q.a,q.b)<2.8){inGapPieces.add(q);break;}}}
  pieces=pieces.filter(q=>!inGapPieces.has(q));
  const winPieceSegs=[...inGapPieces].map(q=>({a:q.a,b:q.b,L:dist(q.a,q.b),d:norm(sub(q.b,q.a)),used:[],src:q.src}));
  // trechos curtos isolados (barra de escala, molduras) não são paredes
  const conn=w=>pieces.some(q=>q!==w&&['a','b'].some(e=>segDist(w[e],q.a,q.b)<=q.t/2+w.t/2+.05)||['a','b'].some(e=>segDist(q[e],w.a,w.b)<=q.t/2+w.t/2+.05));
  pieces=pieces.filter(w=>dist(w.a,w.b)>=3||conn(w));
  for(const w of pieces)w.t=Math.max(opt.tMin,Math.round(w.t/.005)*.005);
  if(opt.debug)(rep.dbg=rep.dbg||[]).push(['isolados',pieces.map(w=>[w.a.x,w.a.y,w.b.x,w.b.y,w.t].map(v=>+v.toFixed(3)).join(','))]);
  // linhas paralelas DENTRO da espessura (vidro/caixilho) indicam janela: abre um vão ali
  {const srcSet=new Set();const out=[];
    for(const w of pieces){const u=norm(sub(w.b,w.a)),nrm=perp(u),L=dist(w.a,w.b),src=new Set(w.src);const iv=[];
      for(const s of segs){if(src.has(s)||Math.abs(crs(s.d,u))>.03)continue;const off=dot(sub(mid(s.a,s.b),w.a),nrm);if(Math.abs(off)>w.t/2-.012)continue;
        const t0=dot(sub(s.a,w.a),u),t1=dot(sub(s.b,w.a),u),lo=Math.max(0,Math.min(t0,t1)),hi=Math.min(L,Math.max(t0,t1));if(hi-lo>.15)iv.push([lo,hi]);}
      iv.sort((a,b)=>a[0]-b[0]);const mg=[];for(const v of iv){const l=mg[mg.length-1];if(l&&v[0]<=l[1]+.12)l[1]=Math.max(l[1],v[1]);else mg.push(v.slice());}
      let cur=0;for(const[a,b]of mg.filter(v=>v[1]-v[0]>=.35&&v[1]-v[0]<=3)){if(a-cur>=.05)out.push({...w,a:add(w.a,mul(u,cur)),b:add(w.a,mul(u,a)),src:w.src});cur=b;}
      if(cur===0)out.push(w);else if(L-cur>=.05)out.push({...w,a:add(w.a,mul(u,cur)),b:w.b,src:w.src});}
    pieces=out;}
  if(opt.debug)(rep.dbg=rep.dbg||[]).push(['janelas',pieces.map(w=>[w.a.x,w.a.y,w.b.x,w.b.y,w.t].map(v=>+v.toFixed(3)).join(','))]);
  // ---- vãos: portas e janelas ----
  const arcs=objs.map(o=>({o,A:arcInfo(o)})).filter(x=>x.A);const usedArcs=new Set(),openings=[];
  const crossing=(p,g0,g1,u,nrm)=>pieces.some(r=>r!==p&&Math.abs(crs(u,norm(sub(r.b,r.a))))>.5&&(()=>{const x=lineInt(p.a,u,r.a,sub(r.b,r.a));if(!x)return false;const t=dot(sub(x,p.a),u),tr=projT(x,r.a,r.b);return t>g0+.02&&t<g1-.02&&tr>-.02&&tr<1.02;})());
  for(let merged=true;merged;){merged=false;
    outer:for(let i=0;i<pieces.length;i++)for(let j=0;j<pieces.length;j++){if(i===j)continue;const p=pieces[i],q=pieces[j];if(!colin(p,q,.04))continue;
      const u=norm(sub(p.b,p.a)),pl=dist(p.a,p.b),qa=dot(sub(q.a,p.a),u),qb=dot(sub(q.b,p.a),u),q0=Math.min(qa,qb),q1=Math.max(qa,qb);if(q0<pl)continue;
      const g=q0-pl;if(g<.5||g>2.7)continue;const nrm=perp(u);if(crossing(p,pl,q0,u,nrm))continue;
      const g0=add(p.a,mul(u,pl)),g1=add(p.a,mul(u,q0)),gc=mid(g0,g1),t=Math.max(p.t,q.t);let kind=null,extra={};
      if(opt.doors){const near=arcs.filter(x=>!usedArcs.has(x.o.id)&&Math.min(dist(x.A.c,g0),dist(x.A.c,g1))<t/2+.25);
        const single=near.find(x=>Math.abs(x.A.r-g)<Math.max(.12,g*.18));const halves=near.filter(x=>Math.abs(x.A.r-g/2)<Math.max(.08,g*.12));
        if(single){kind='door';const hingeAtQ=dist(single.A.c,g1)<dist(single.A.c,g0);extra={kind:'giro',hinge:hingeAtQ,flip:dot(sub(single.A.mid,gc),nrm)<0,arcs:[single]};}
        else if(halves.length>=2){kind='door';extra={kind:'dupla',hinge:false,flip:dot(sub(halves[0].A.mid,gc),nrm)<0,arcs:halves.slice(0,2)};}}
      if(!kind&&opt.windows){const gp=winPieceSegs.filter(s=>Math.abs(crs(s.d,u))<.03&&Math.abs(dot(sub(mid(s.a,s.b),gc),nrm))<t/2+.03&&dot(sub(mid(s.a,s.b),g0),u)>0&&dot(sub(mid(s.a,s.b),g1),u)<0);
        if(gp.length){kind='window';extra={kind:'correr',lines:[],gp};}}
      if(!kind&&opt.windows){const inGap=segs.filter(s=>Math.abs(crs(s.d,u))<.03&&Math.abs(dot(sub(mid(s.a,s.b),gc),nrm))<t/2+.03&&dot(sub(s.a,g0),u)>-.05&&dot(sub(s.b,g0),u)>-.05&&dot(sub(s.a,g1),u)<.05&&dot(sub(s.b,g1),u)<.05);
        if(inGap.reduce((s_,x)=>s_+x.L,0)>=g*.9){kind='window';extra={kind:'correr',lines:inGap};}}
      if(!kind)continue;
      // une as duas partes numa parede com a abertura
      const lo=Math.min(0,q0),hi=Math.max(pl,q1);const na=add(p.a,mul(u,lo)),nb=add(p.a,mul(u,hi));
      p.a=na;p.b=nb;p.t=t;p.src.push(...q.src);pieces.splice(j,1);
      openings.push({w:p,off:dist(na,gc),width:g,type:kind,...extra});if(extra.arcs)extra.arcs.forEach(x=>usedArcs.add(x.o.id));if(extra.lines)extra.lines.forEach(s=>s.used.push([0,s.L]));if(extra.gp)extra.gp.forEach(g=>g.src.forEach(sg=>sg.used.push([0,sg.L])));
      merged=true;break outer;}}
  if(opt.debug)(rep.dbg=rep.dbg||[]).push(['vaos',pieces.map(w=>[w.a.x,w.a.y,w.b.x,w.b.y,w.t].map(v=>+v.toFixed(3)).join(','))]);
  // folhas de porta (linha do centro do arco até a ponta) também são consumidas
  for(const op of openings)if(op.arcs)for(const x of op.arcs)for(const s of segs){const r=x.A.r;if((dist(s.a,x.A.c)<.06&&Math.abs(s.L-r)<.1)||(dist(s.b,x.A.c)<.06&&Math.abs(s.L-r)<.1))s.used.push([0,s.L]);}
  // ---- cria os objetos ----
  const s_=S(),created=[];
  for(const w of pieces){if(dist(w.a,w.b)<opt.minLen)continue;const o=addObj({type:'wall',a:cp(w.a),b:cp(w.b),t:w.t,h:s_.wallH});w.id=o.id;created.push(o);rep.walls++;}
  for(const op of openings){if(!op.w.id)continue;const L=dist(op.w.a,op.w.b),off=Math.max(op.width/2,Math.min(L-op.width/2,op.off));
    // a direção da parede criada é a->b; a abertura foi medida a partir de a
    const o=op.type==='door'?addObj({type:'door',kind:op.kind,wallId:op.w.id,off,w:op.width,h:s_.doorH,hinge:!!op.hinge,flip:!!op.flip}):addObj({type:'window',kind:op.kind,wallId:op.w.id,off,w:op.width,sill:s_.winSill,h:s_.winH});
    created.push(o);op.type==='door'?rep.doors++:rep.windows++;}
  // ---- remove as linhas consumidas ----
  const del=new Set();
  if(opt.removeUsed){const cov=new Map();for(const s of segs){const u=s.used.slice().sort((a,b)=>a[0]-b[0]);let c=0,e=-Infinity;for(const[a,b]of u){const a2=Math.max(a,e);if(b>a2)c+=b-a2;e=Math.max(e,b);}const k=s.o.id,v=cov.get(k)||{c:0,L:0};v.c+=Math.min(c,s.L);v.L+=s.L;cov.set(k,v);}
    for(const[k,v]of cov)if(v.L&&v.c/v.L>=.8)del.add(k);for(const id of usedArcs)del.add(id);}
  doc.objects=doc.objects.filter(o=>!del.has(o.id));rep.removed=del.size;
  // ---- ambientes a partir de textos com nome ----
  if(opt.rooms&&rep.walls){const texts=objs.filter(o=>o.type==='text'&&doc.objects.includes(o)),seen=[];
    for(const t of texts){const name=String(t.text).split('\n')[0].trim();if(!/[A-Za-zÀ-ú]{3,}/.test(name)||/m²|m2\b|^\d|escala|planta|corte|fachada|cota|vista/i.test(name)||name.length>32)continue;
      const tb=textBox({...t,size:t.size||S().textSize,align:'left',base:'bottom',ang:t.ang||0}),probe=centroid(tb);const pts=regionFromWalls(probe,true);if(!pts)continue;
      const A=Math.abs(polyArea(pts)),c=centroid(pts);if(A<1||A>400||seen.some(s=>dist(s,c)<.05))continue;seen.push(c);
      const nm=name.charAt(0).toUpperCase()+name.slice(1).toLowerCase();created.push(addObj({type:'room',pts,name:nm}));rep.rooms++;
      if(opt.removeUsed)doc.objects=doc.objects.filter(o=>o.id!==t.id);}}
  rep.kept=objs.filter(o=>doc.objects.includes(o)).length;rep.coverage=total?Math.round(segs.filter(s=>s.cand).reduce((s,x)=>s+Math.min(x.L,x.used.reduce((a,[u0,u1])=>a+(u1-u0),0)),0)/total*100):0;
  rep.ids=created.map(o=>o.id);
  return rep;
}
function convertReport(rep,undoable){
  const msg=rep.walls?'Reconhecidos: <b>'+rep.walls+'</b> paredes, <b>'+rep.doors+'</b> portas, <b>'+rep.windows+'</b> janelas e <b>'+rep.rooms+'</b> ambientes.':'Nenhuma parede reconhecida (o desenho não tem pares de linhas paralelas a 7–45 cm).';
  log('Conversão automática: '+rep.walls+' paredes, '+rep.doors+' portas, '+rep.windows+' janelas, '+rep.rooms+' ambientes; '+rep.removed+' linhas convertidas, '+rep.kept+' mantidas.','res');
  return modal('Conversão automática','<p>'+msg+'</p><p class="muted">'+rep.removed+' linhas viraram elementos de arquitetura e '+rep.kept+' elementos ficaram como desenho (mobiliário, hachuras, textos, detalhes). Tudo é editável: selecione um elemento para mudar espessura, tipo de porta/janela, nome do ambiente etc.</p>'+
    '<div class="note">Confira portas e janelas: vãos sem arco nem caixilho ficam como passagem livre. Você pode inserir portas nesses vãos com a ferramenta Porta.</div>',
    [...(undoable?[{label:'Desfazer conversão',onClick:()=>{undo();log('Conversão desfeita: o desenho voltou a ser só linhas.');return true;}}]:[]),{label:'OK',primary:true}]);
}
function convertDialog(){
  const ids=[...sel],src=(ids.length?ids.map(getObj):doc.objects).filter(o=>o&&['line','polyline','arc','text'].includes(o.type));
  if(!src.length)return log('Não há linhas para converter. Importe um DWG/DXF/PDF ou selecione o desenho.','err');
  const c={...CONV_DEFAULT,...S().convert};
  const html='<p>Transforma linhas do desenho '+(ids.length?'<b>selecionado</b>':'<b>inteiro</b>')+' ('+src.length+' elementos) em paredes, portas, janelas e ambientes editáveis.</p>'+
    '<div class="grid2"><label>Espessura mínima de parede (m)<input id="cvMin" value="'+fmt(c.tMin).replace(/\./g,'')+'"></label><label>Espessura máxima de parede (m)<input id="cvMax" value="'+fmt(c.tMax).replace(/\./g,'')+'"></label>'+
    '<label>Camadas de parede<select id="cvLay"><option value="auto">Automático (usa camadas "parede/wall" se existirem)</option><option value="all">Todas as camadas</option></select></label><label>Comprimento mínimo (m)<input id="cvLen" value="'+fmt(c.minLen).replace(/\./g,'')+'"></label></div>'+
    ['doors:Portas (vão com arco de abertura)','windows:Janelas (vão com linhas de caixilho)','rooms:Ambientes (textos com nomes dentro dos cômodos)','removeUsed:Remover as linhas convertidas'].map(x=>{const[k,t]=x.split(':');return'<label style="display:flex;gap:6px;align-items:center;margin-top:6px"><input type="checkbox" id="cv_'+k+'"'+(c[k]?' checked':'')+'> '+t+'</label>';}).join('');
  modal('Converter desenho em elementos editáveis',html,[{label:'Cancelar',value:null},{label:'Converter',primary:true,onClick:()=>{
    const o={tMin:num($('#cvMin').value)||.07,tMax:num($('#cvMax').value)||.45,minLen:num($('#cvLen').value)||.25,onlyWallLayers:$('#cvLay').value==='auto'?'auto':false};
    for(const k of['doors','windows','rooms','removeUsed'])o[k]=$('#cv_'+k).checked;S().convert=o;
    const rep=convertDrawing(src,o);sel=new Set(rep.ids);commit();setTimeout(()=>convertReport(rep,true),0);return true;}}]);
}
