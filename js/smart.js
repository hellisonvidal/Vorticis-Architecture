'use strict';
/* =========================================================================
   Ferramentas inteligentes
   ========================================================================= */

/* ---- região delimitada por paredes/linhas ao redor de um ponto (rasterização + contorno) ---- */
function barrierObjects(wallsOnly){return doc.objects.filter(o=>getLayer(o.layer).visible!==false&&(wallsOnly?['wall','door','window']:['wall','line','polyline','arc','circle','door','window']).includes(o.type));}
function regionFromWalls(p,wallsOnly){
  const objs=barrierObjects(wallsOnly);if(!objs.length)return null;
  let x0=Infinity,y0=Infinity,x1=-Infinity,y1=-Infinity;
  for(const o of objs){const b=objBBox(o);if(!b)continue;x0=Math.min(x0,b.x0);y0=Math.min(y0,b.y0);x1=Math.max(x1,b.x1);y1=Math.max(y1,b.y1);}
  if(!(p.x>x0&&p.x<x1&&p.y>y0&&p.y<y1))return null;
  x0-=.5;y0-=.5;x1+=.5;y1+=.5;
  const res=Math.max(.03,Math.max(x1-x0,y1-y0)/1400),w=Math.ceil((x1-x0)/res),h=Math.ceil((y1-y0)/res),m=new Uint8Array(w*h);
  const cell=q=>[Math.floor((q.x-x0)/res),Math.floor((y1-q.y)/res)];
  const mark=(cx,cy)=>{if(cx>=0&&cy>=0&&cx<w&&cy<h)m[cy*w+cx]=1;};
  const fillPoly=pts=>{let a=Infinity,b=Infinity,c=-Infinity,d=-Infinity;for(const q of pts){a=Math.min(a,q.x);b=Math.min(b,q.y);c=Math.max(c,q.x);d=Math.max(d,q.y);}
    const[ca,cd]=cell(P(a,d)),[cc,cb]=cell(P(c,b));for(let yy=Math.max(0,cd);yy<=Math.min(h-1,cb);yy++)for(let xx=Math.max(0,ca);xx<=Math.min(w-1,cc);xx++){const q=P(x0+(xx+.5)*res,y1-(yy+.5)*res);if(pointInPoly(q,pts))m[yy*w+xx]=1;}
    for(let i=0;i<pts.length;i++)drawSeg(pts[i],pts[(i+1)%pts.length]);};
  const drawSeg=(a,b)=>{const L=dist(a,b),n=Math.max(1,Math.ceil(L/(res*.5)));for(let i=0;i<=n;i++){const q=add(a,mul(sub(b,a),i/n)),[cx,cy]=cell(q);mark(cx,cy);}};
  for(const o of objs){
    if(o.type==='wall')fillPoly(wallPoly(o));
    else if(o.type==='door'||o.type==='window'){const g=openingGeom(o);if(g)fillPoly([add(sub(g.c,mul(g.u,o.w/2)),mul(g.n,g.t/2)),add(add(g.c,mul(g.u,o.w/2)),mul(g.n,g.t/2)),sub(add(g.c,mul(g.u,o.w/2)),mul(g.n,g.t/2)),sub(sub(g.c,mul(g.u,o.w/2)),mul(g.n,g.t/2))]);}
    else for(const[a,b]of segsOf(o))drawSeg(a,b);
    if(o.type==='circle'){const pts=ellL(o.c.x,o.c.y,o.r,o.r,64);for(let i=0;i<pts.length;i++)drawSeg(pts[i],pts[(i+1)%pts.length]);}
  }
  const[sx,sy]=cell(p);if(m[sy*w+sx])return null;
  const lab=new Int32Array(w*h).fill(-1),st=[sy*w+sx];lab[sy*w+sx]=0;let border=false,cnt=0;
  while(st.length){const j=st.pop(),x=j%w,y=(j-x)/w;cnt++;if(x===0||y===0||x===w-1||y===h-1){border=true;break;}
    for(const k of[j-1,j+1,j-w,j+w])if(!m[k]&&lab[k]<0){lab[k]=0;st.push(k);}}
  if(border||cnt<4)return null;
  const polys=regionPolys(lab,w,h,new Set([0]));if(!polys.length)return null;
  let pts=polys[0].map(q=>P(x0+q.x*res,y1-q.y*res));
  // encaixa vértices nos cantos reais das faces das paredes
  const cand=[];const faceEdges=[];
  for(const o of doc.objects)if(o.type==='wall'){const wp=wallPoly(o);wp.forEach(q=>cand.push(q));for(let i=0;i<4;i++)faceEdges.push([wp[i],wp[(i+1)%4]]);}
  else if(o.type==='line'){cand.push(o.a,o.b);faceEdges.push([o.a,o.b]);}
  else if(o.type==='polyline'){o.pts.forEach(q=>cand.push(q));segsOf(o).forEach(s=>faceEdges.push(s));}
  const bb=pts.reduce((b,q)=>({x0:Math.min(b.x0,q.x),y0:Math.min(b.y0,q.y),x1:Math.max(b.x1,q.x),y1:Math.max(b.y1,q.y)}),{x0:Infinity,y0:Infinity,x1:-Infinity,y1:-Infinity});
  const nearE=faceEdges.filter(([a,b])=>Math.max(a.x,b.x)>bb.x0-1&&Math.min(a.x,b.x)<bb.x1+1&&Math.max(a.y,b.y)>bb.y0-1&&Math.min(a.y,b.y)<bb.y1+1).slice(0,600);
  for(let i=0;i<nearE.length;i++)for(let j=i+1;j<nearE.length;j++){const da=sub(nearE[i][1],nearE[i][0]),db=sub(nearE[j][1],nearE[j][0]);if(Math.abs(crs(norm(da),norm(db)))<.2)continue;const q=lineInt(nearE[i][0],da,nearE[j][0],db);if(q&&q.x>bb.x0-1&&q.x<bb.x1+1&&q.y>bb.y0-1&&q.y<bb.y1+1)cand.push(q);}
  pts=pts.map(q=>{let bq=q,bd=res*2.5;for(const c of cand){const d=dist(c,q);if(d<bd){bd=d;bq=c;}}return cp(bq);});
  pts=pts.filter((q,i)=>dist(q,pts[(i+1)%pts.length])>1e-6);
  pts=pts.filter((q,i)=>{const a=pts[(i-1+pts.length)%pts.length],b=pts[(i+1)%pts.length];return Math.abs(crs(norm(sub(q,a)),norm(sub(b,q))))>1e-4;});
  return pts.length>=3?pts:null;
}
Tools.autoroom=()=>{const t={prompt:'AMBIENTE AUTOMÁTICO — clique dentro de um espaço fechado por paredes',
  async point(p){const pts=regionFromWalls(p)||closedRegionAt(p);if(!pts){log('Espaço não fechado (verifique se as paredes se encontram) — ou use AM para desenhar.','err');return;}
    const A=Math.abs(polyArea(pts)),name=await askText('Nome do ambiente ('+fmt(A)+' m²)',suggestRoomName(A));if(name===null)return;
    const o=addObj({type:'room',pts,name:name||'Ambiente'});commit();log(o.name+': '+fmt(A)+' m²','res');}};return t;};
function suggestRoomName(A){return A<3.2?'Lavabo':A<6?'Banheiro':A<8.5?'Escritório':A<13?'Quarto':A<22?'Sala':'Sala / cozinha';}

/* ---- cotagem automática ---- */
function autoDimension(){
  const ids=[...sel].filter(id=>{const o=getObj(id);return o&&o.type==='wall';});
  const walls=(ids.length?ids.map(getObj):doc.objects.filter(o=>o.type==='wall'));
  if(!walls.length)return log('Desenhe ou selecione paredes para cotar.','err');
  let x0=Infinity,y0=Infinity,x1=-Infinity,y1=-Infinity;for(const w of walls)for(const q of wallPoly(w)){x0=Math.min(x0,q.x);y0=Math.min(y0,q.y);x1=Math.max(x1,q.x);y1=Math.max(y1,q.y);}
  const c=P((x0+x1)/2,(y0+y1)/2),rooms=doc.objects.filter(o=>o.type==='room');let n=0;const sz=S().dimSize;
  for(const w of walls){const{L,u,nrm=perp(u)}={...wallInfo(w),nrm:wallInfo(w).n};if(L<.3)continue;
    const side=Math.sign(dot(sub(mid(w.a,w.b),c),nrm))||1,probe=add(mid(w.a,w.b),mul(nrm,side*(w.t/2+.3)));
    const exterior=rooms.length?!rooms.some(r=>pointInPoly(probe,r.pts)):(Math.abs(dot(sub(probe,c),nrm))>Math.min(x1-x0,y1-y0)/2-.1);
    if(!exterior)continue;const[ea,eb]=wallExt(w),fa=add(sub(w.a,mul(u,ea)),mul(nrm,side*w.t/2)),fb=add(add(w.b,mul(u,eb)),mul(nrm,side*w.t/2));
    const off=dot(mul(nrm,side),perp(norm(sub(fb,fa))))>0?.6:-.6;
    addObj({type:'dim',a:fa,b:fb,off,size:sz});n++;}
  addObj({type:'dim',a:P(x0,y0),b:P(x1,y0),off:-1.4,size:sz});addObj({type:'dim',a:P(x0,y1),b:P(x0,y0),off:-1.4,size:sz});n+=2;
  commit();log(n+' cotas criadas (paredes externas e medidas totais '+fmt(x1-x0)+' × '+fmt(y1-y0)+' m).','res');
}

/* ---- paredes a partir de linhas / polilinhas / ambientes ---- */
function wallsFromSelection(){
  const objs=[...sel].map(getObj).filter(Boolean);if(!objs.length)return log('Selecione linhas, polilinhas ou ambientes e repita.','err');
  const t=S().wallT,h=S().wallH;let n=0;
  for(const o of objs){
    if(o.type==='line'){addObj({type:'wall',a:cp(o.a),b:cp(o.b),t,h});n++;}
    else if(o.type==='polyline'){segsOf(o).forEach(([a,b])=>{addObj({type:'wall',a:cp(a),b:cp(b),t,h});n++;});}
    else if(o.type==='room'||o.type==='hatch'){const pts=offsetPoly(o.pts,o.pts.map(()=>-t/2));for(let i=0;i<pts.length;i++){addObj({type:'wall',a:pts[i],b:pts[(i+1)%pts.length],t,h});n++;}}
  }
  if(!n)return log('Nenhum objeto compatível (linha, polilinha ou ambiente).','err');
  commit();log(n+' paredes criadas com '+fmt(t)+' m de espessura.','res');
}

/* ---- explodir ---- */
function explodeSel(){const objs=[...sel].map(getObj).filter(o=>o&&['polyline','room','terrain','hatch','block','roof','stair','dim'].includes(o.type));if(!objs.length)return log('Selecione polilinhas, ambientes, blocos, cotas ou telhados para explodir.','err');
  const ids=new Set(objs.map(o=>o.id)),out=[];
  for(const o of objs){if(o.type==='polyline'||o.type==='room'||o.type==='terrain'||o.type==='hatch'){segsOf(o).forEach(([a,b])=>out.push(addObj({type:'line',a:cp(a),b:cp(b),layer:o.layer})));}
    else for(const pr of prims(o)){if(pr.k==='poly'){const n=pr.pts.length;for(let i=0;i<n-(pr.closed?0:1);i++)out.push(addObj({type:'line',a:cp(pr.pts[i]),b:cp(pr.pts[(i+1)%n]),layer:o.layer}));}
      else if(pr.k==='circle')out.push(addObj({type:'circle',c:cp(pr.c),r:pr.r,layer:o.layer}));else if(pr.k==='arc')out.push(addObj({type:'arc',c:cp(pr.c),r:pr.r,a0:pr.ccw?pr.a0:pr.a1,a1:pr.ccw?pr.a1:pr.a0,layer:o.layer}));
      else if(pr.k==='text')out.push(addObj({type:'text',p:cp(pr.p),text:pr.text,size:pr.size,ang:pr.ang,layer:o.layer}));}}
  doc.objects=doc.objects.filter(o=>!ids.has(o.id));sel=new Set(out.map(o=>o.id));commit();log(objs.length+' objeto(s) explodido(s) em '+out.length+' elementos.','res');}

/* ---- unir cantos (concordância raio zero) ---- */
function linearEnds(o){return o.type==='line'||o.type==='wall';}
Tools.fillet=()=>{const t={first:null,prompt:'UNIR CANTO — clique a primeira parede/linha (perto da ponta a ajustar)',
  point(p){const o=pickAt(p);if(!o||!linearEnds(o)){log('Clique uma parede ou linha.','err');return;}
    if(!t.first){t.first={o,p};setPrompt('UNIR CANTO — clique a segunda parede/linha');sel=new Set([o.id]);return;}
    const A=t.first.o,B=o;if(A.id===B.id)return;const q=lineInt(A.a,sub(A.b,A.a),B.a,sub(B.b,B.a));if(!q){log('As peças são paralelas.','err');return;}
    for(const[O,pk]of[[A,t.first.p],[B,p]]){const keepA=dist(pk,O.a)<dist(pk,O.b);if(keepA)O.b=q;else{const old=O.a;O.a=q;if(O.type==='wall')shiftOpenings(O,dist(q,old)*(dot(sub(old,q),norm(sub(O.b,q)))>0?1:-1));}}
    sel.clear();commit();t.first=null;setPrompt('UNIR CANTO — primeira parede/linha (Esc sai)');}};return t;};
function shiftOpenings(w,d){for(const o of openingsOf([w.id]))o.off+=d;}

/* ---- deslocar (offset) ---- */
Tools.offset=()=>{const t={obj:null,prompt:'DESLOCAR — clique o objeto (linha, polilinha, parede, círculo, arco, ambiente)',
  get wantValue(){return true;},
  value(v){const d=num(v);if(d>0){S().offsetDist=d;updateToolUI();setPrompt('DESLOCAR — distância '+fmt(d)+' m · clique o objeto');return true;}return false;},
  point(p){if(!t.obj){const o=pickAt(p);if(!o||!['line','polyline','wall','circle','arc','room'].includes(o.type)){log('Objeto não suportado.','err');return;}t.obj=o;sel=new Set([o.id]);setPrompt('DESLOCAR — clique o lado');return;}
    const n=offsetObj(t.obj,p,S().offsetDist);if(n){addObj(n);commit();}t.obj=null;sel.clear();setPrompt('DESLOCAR — clique outro objeto (distância '+fmt(S().offsetDist)+' m)');},
  preview(){return t.obj?{objs:[offsetObj(t.obj,cur(),S().offsetDist)].filter(Boolean)}:null;}};return t;};
function offsetObj(o,p,d){
  const side=(a,b)=>Math.sign(crs(sub(b,a),sub(p,a)))||1;
  if(o.type==='line'||o.type==='wall'){const n=mul(perp(norm(sub(o.b,o.a))),d*side(o.a,o.b));const r={...clone(o),a:add(o.a,n),b:add(o.b,n)};delete r.id;return r;}
  if(o.type==='circle'){const r=dist(p,o.c)>o.r?o.r+d:Math.max(.001,o.r-d);return{type:'circle',c:cp(o.c),r,layer:o.layer};}
  if(o.type==='arc'){const r=dist(p,o.c)>o.r?o.r+d:Math.max(.001,o.r-d);return{type:'arc',c:cp(o.c),r,a0:o.a0,a1:o.a1,layer:o.layer};}
  if(o.type==='room'||(o.type==='polyline'&&o.closed)){const inside=pointInPoly(p,o.pts),pts=offsetPoly(o.pts,o.pts.map(()=>inside?d:-d));return{type:'polyline',pts,closed:true,layer:o.layer};}
  if(o.type==='polyline'){let bi=0,bd=Infinity;for(let i=0;i<o.pts.length-1;i++){const dd=segDist(p,o.pts[i],o.pts[i+1]);if(dd<bd){bd=dd;bi=i;}}
    const s=side(o.pts[bi],o.pts[bi+1]),L=[];for(let i=0;i<o.pts.length-1;i++){const a=o.pts[i],b=o.pts[i+1],n=mul(perp(norm(sub(b,a))),d*s);L.push({p:add(a,n),d:sub(b,a),q:add(b,n)});}
    const pts=[L[0].p];for(let i=1;i<L.length;i++)pts.push(lineInt(L[i-1].p,L[i-1].d,L[i].p,L[i].d)||L[i].p);pts.push(L[L.length-1].q);return{type:'polyline',pts,closed:false,layer:o.layer};}
  return null;
}

/* ---- aparar e estender ---- */
function allSegsExcept(id){const s=[];for(const o of doc.objects){if(o.id===id||getLayer(o.layer).visible===false)continue;
  if(o.type==='wall'){const wp=wallPoly(o);s.push([o.a,o.b]);for(let i=0;i<4;i++)s.push([wp[i],wp[(i+1)%4]]);}else s.push(...segsOf(o));}return s;}
Tools.trim=()=>{const t={prompt:'APARAR — clique o trecho de linha/parede a remover (entre interseções)',
  point(p){const o=pickAt(p);if(!o||!linearEnds(o)){log('Clique uma linha ou parede.','err');return;}
    const d=sub(o.b,o.a),ts=[0,1];for(const[a,b]of allSegsExcept(o.id)){const q=segInt(o.a,o.b,a,b);if(q){const tt=projT(q,o.a,o.b);if(tt>1e-6&&tt<1-1e-6)ts.push(tt);}}
    if(ts.length<3){log('Nenhuma interseção para aparar.','err');return;}ts.sort((x,y)=>x-y);const tp=projT(p,o.a,o.b);let i=0;while(i<ts.length-2&&ts[i+1]<tp)i++;
    const t0=ts[i],t1=ts[i+1],A=add(o.a,mul(d,t0)),B=add(o.a,mul(d,t1));
    if(t0<1e-6&&t1>1-1e-6){log('Nada a aparar.','err');return;}
    if(t0<1e-6){o.a=B;if(o.type==='wall')shiftOpenings(o,-len(d)*t1);}
    else if(t1>1-1e-6)o.b=A;
    else{const n=clone(o);n.id=uid();n.a=B;o.b=A;doc.objects.push(n);if(o.type==='wall'){for(const op of openingsOf([o.id])){if(op.off>len(d)*t0){op.wallId=n.id;op.off-=len(d)*t1;}}}}
    commit();}};return t;};
Tools.extend=()=>{const t={prompt:'ESTENDER — clique perto da ponta da linha/parede a estender',
  point(p){const o=pickAt(p);if(!o||!linearEnds(o)){log('Clique uma linha ou parede.','err');return;}
    const endB=dist(p,o.b)<dist(p,o.a),from=endB?o.b:o.a,dir=norm(endB?sub(o.b,o.a):sub(o.a,o.b));let best=null,bd=Infinity;
    for(const[a,b]of allSegsExcept(o.id)){const q=lineInt(from,dir,a,sub(b,a));if(!q)continue;const tq=projT(q,a,b);if(tq<-1e-6||tq>1+1e-6)continue;const s=dot(sub(q,from),dir);if(s>1e-6&&s<bd){bd=s;best=q;}}
    if(!best){log('Nenhum limite encontrado na direção.','err');return;}if(endB)o.b=best;else{o.a=best;if(o.type==='wall')shiftOpenings(o,bd);}commit();}};return t;};

/* ---- matriz retangular ---- */
async function arrayDialog(){
  if(!sel.size)return log('Selecione os objetos e use Matriz.','err');const s=S();
  const r=await modal('Matriz retangular','<div class="grid2"><label>Linhas<input id="arR" value="'+s.arrayRows+'"></label><label>Colunas<input id="arC" value="'+s.arrayCols+'"></label><label>Distância entre colunas (m)<input id="arX" value="'+fmt(s.arrayDx).replace(/\./g,'')+'"></label><label>Distância entre linhas (m)<input id="arY" value="'+fmt(s.arrayDy).replace(/\./g,'')+'"></label></div>',
    [{label:'Cancelar',value:null},{label:'Criar matriz',primary:true,onClick:()=>({r:Math.max(1,num($('#arR').value)|0),c:Math.max(1,num($('#arC').value)|0),dx:num($('#arX').value)||0,dy:num($('#arY').value)||0})}]);
  if(!r)return;Object.assign(s,{arrayRows:r.r,arrayCols:r.c,arrayDx:r.dx,arrayDy:r.dy});const ids=[...sel];let n=0;
  for(let i=0;i<r.r;i++)for(let j=0;j<r.c;j++){if(!i&&!j)continue;const d=P(j*r.dx,i*r.dy);applyXform(ids,q=>add(q,d),{},true);n++;}
  commit();log('Matriz criada: '+n+' cópias.','res');
}
