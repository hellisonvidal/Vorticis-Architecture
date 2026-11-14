'use strict';
/* =========================================================================
   FOTO → DESENHO  (detecção local de paredes, aberturas e ambientes)
   ========================================================================= */
function imgPixels(o,maxDim){
  const im=getImg(o.img);if(!im)return null;
  const k=Math.min(1,maxDim/Math.max(im.naturalWidth,im.naturalHeight));
  const w=Math.max(1,Math.round(im.naturalWidth*k)),h=Math.max(1,Math.round(im.naturalHeight*k));
  const c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d');
  g.fillStyle='#fff';g.fillRect(0,0,w,h);g.drawImage(im,0,0,w,h);
  return{w,h,data:g.getImageData(0,0,w,h).data,canvas:c};
}
// máscara de pixels escuros (limiar adaptativo + Otsu): funciona com escaneamento e com foto de celular
function darkMask(px,sens){
  const{w,h,data}=px,n=w*h,gr=new Float32Array(n);
  for(let i=0;i<n;i++)gr[i]=.299*data[4*i]+.587*data[4*i+1]+.114*data[4*i+2];
  const W1=w+1,I=new Float64Array(W1*(h+1));
  for(let y=0;y<h;y++){let s=0;for(let x=0;x<w;x++){s+=gr[y*w+x];I[(y+1)*W1+x+1]=I[y*W1+x+1]+s;}}
  const hist=new Array(256).fill(0);for(let i=0;i<n;i++)hist[Math.min(255,gr[i]|0)]++;
  let sum=0;for(let t=0;t<256;t++)sum+=t*hist[t];let sB=0,wB=0,best=0,thr=128;
  for(let t=0;t<256;t++){wB+=hist[t];if(!wB)continue;const wF=n-wB;if(!wF)break;sB+=t*hist[t];const mB=sB/wB,mF=(sum-sB)/wF,v=wB*wF*(mB-mF)*(mB-mF);if(v>best){best=v;thr=t;}}
  const r=Math.max(8,Math.round(Math.max(w,h)/30)),k=.30-.25*sens,m=new Uint8Array(n);
  for(let y=0;y<h;y++){const y0=Math.max(0,y-r),y1=Math.min(h,y+r+1);
    for(let x=0;x<w;x++){const x0=Math.max(0,x-r),x1=Math.min(w,x+r+1),A=(y1-y0)*(x1-x0);
      const s=I[y1*W1+x1]-I[y0*W1+x1]-I[y1*W1+x0]+I[y0*W1+x0],v=gr[y*w+x];
      m[y*w+x]=((v<s/A*(1-k)&&v<thr+25)||v<thr*.55)?1:0;}}
  return m;
}
// agrupa trechos escuros consecutivos em "faixas" (candidatas a parede)
function findBands(get,nR,nC,minLen){
  let active=[];const out=[];
  for(let r=0;r<nR;r++){
    const runs=[];let c=0;
    while(c<nC){if(get(r,c)){let e=c;while(e+1<nC&&get(r,e+1))e++;if(e-c+1>=minLen)runs.push([c,e]);c=e+1;}else c++;}
    const next=[];
    for(const[c0,c1]of runs){
      let hit=null;
      for(const b of active){if(b.used)continue;const ov=Math.min(c1,b.c1)-Math.max(c0,b.c0)+1;if(ov>.6*Math.min(c1-c0+1,b.c1-b.c0+1)){hit=b;break;}}
      if(hit){hit.used=true;hit.r1=r;hit.c0=Math.min(hit.c0,c0);hit.c1=Math.max(hit.c1,c1);next.push(hit);}
      else next.push({r0:r,r1:r,c0,c1,used:true});
    }
    for(const b of active)if(!b.used)out.push(b);
    active=next;active.forEach(b=>{b.used=false;});
  }
  return out.concat(active);
}
// emparelha linhas finas paralelas (paredes desenhadas só com o contorno)
function pairThin(thin,minGap,maxGap){
  // pares candidatos; prefere linhas de mesmo comprimento (contorno de parede) a cotas próximas
  thin.sort((a,b)=>a.r0-b.r0);const cand=[];
  for(let i=0;i<thin.length;i++)for(let j=i+1;j<thin.length;j++){const A=thin[i],B=thin[j],g=B.r0-A.r1-1;if(g<minGap)continue;if(g>maxGap)break;
    const la=A.c1-A.c0+1,lb=B.c1-B.c0+1,ov=Math.min(A.c1,B.c1)-Math.max(A.c0,B.c0)+1;if(ov<.6*Math.min(la,lb))continue;cand.push({i,j,g,q:ov/Math.max(la,lb)});}
  cand.sort((a,b)=>b.q-a.q||a.g-b.g);const used=new Set(),out=[];
  for(const c of cand){if(used.has(c.i)||used.has(c.j))continue;used.add(c.i);used.add(c.j);const A=thin[c.i],B=thin[c.j];out.push({r0:A.r0,r1:B.r1,c0:Math.min(A.c0,B.c0),c1:Math.max(A.c1,B.c1),paired:true,ink:(A.r1-A.r0+1)+(B.r1-B.r0+1)});}
  return out;
}
function detectPlan(px,mpp,opt){
  const{w,h}=px,m=darkMask(px,opt.sens),M=v=>Math.max(1,Math.round(v/mpp));
  const minLen=M(opt.minLen),minT=Math.max(2,M(.06)),maxT=M(.65);
  const H=findBands((r,c)=>m[r*w+c],h,w,minLen),V=findBands((r,c)=>m[c*w+r],w,h,minLen);
  // perfil de "tinta" ao longo da faixa: separa trechos sólidos de vãos (janelas desenhadas com linhas finas)
  const split=(b,o)=>{const t=b.r1-b.r0+1,ink=b.ink||t,thr=.6*ink,out=[];let st=-1,miss=0;
    for(let c=b.c0;c<=b.c1+1;c++){let k=0;if(c<=b.c1)for(let r=b.r0;r<=b.r1;r++)k+=o==='h'?m[r*w+c]:m[c*w+r];
      if(k>=thr){if(st<0)st=c;miss=0;}else if(st>=0){if(++miss>2||c>b.c1){const e=c-miss+1;if(e-st>=Math.max(t*1.5,M(.3)))out.push({o,c:(b.r0+b.r1+1)/2,s0:st,s1:e,t});st=-1;miss=0;}}}
    return out;};
  const toWalls=(bands,o)=>{const thick=[],thin=[];for(const b of bands){const t=b.r1-b.r0+1;if(t>maxT)continue;(t>=minT?thick:thin).push(b);}
    return thick.concat(pairThin(thin,Math.max(1,M(.04)),M(.45))).filter(b=>b.r1-b.r0+1<=maxT).flatMap(b=>split(b,o));};
  let walls=toWalls(H,'h').concat(toWalls(V,'v'));
  // remove duplicatas sobrepostas (mesma direção, mesma linha)
  const dedupe=L=>{L.sort((a,b)=>(b.s1-b.s0)-(a.s1-a.s0));return L.filter((a,i)=>!L.slice(0,i).some(b=>b.o===a.o&&Math.abs(b.c-a.c)<Math.max(a.t,b.t)*.7&&a.s0>=b.s0-3&&a.s1<=b.s1+3));};
  walls=dedupe(walls);
  // encaixa extremidades no eixo da parede perpendicular
  const tol=M(.06);
  for(const W of walls)for(const e of['s0','s1']){let best=null,bd=Infinity;
    for(const Q of walls){if(Q.o===W.o)continue;const d=Math.abs(W[e]-Q.c);if(d<=Q.t/2+W.t/2+tol&&W.c>=Q.s0-W.t-tol&&W.c<=Q.s1+W.t+tol&&d<bd){bd=d;best=Q;}}
    if(best)W[e]=best.c;}
  // vãos entre paredes alinhadas = portas/janelas
  const openings=[];
  if(opt.openings){
    for(const o of['h','v']){
      const L=walls.filter(W=>W.o===o).sort((a,b)=>a.c-b.c||a.s0-b.s0);
      for(let i=0;i<L.length;i++){const A=L[i];if(A.dead)continue;
        for(let j=0;j<L.length;j++){const B=L[j];if(i===j||B.dead||Math.abs(A.c-B.c)>Math.max(A.t,B.t)*.6||B.s0<A.s1)continue;
          const g=B.s0-A.s1;if(g<M(.5)||g>M(2.6))continue;
          if(walls.some(P=>P.o!==o&&!P.dead&&P.c>A.s1+1&&P.c<B.s0-1&&A.c>=P.s0-P.t&&A.c<=P.s1+P.t))continue;
          let dk=0,tot=0;const t2=Math.max(A.t,B.t)/2;
          for(let s=Math.ceil(A.s1+1);s<B.s0-1;s++)for(let c=Math.floor(A.c-t2);c<=A.c+t2;c++){const x=o==='h'?s:c,y=o==='h'?c:s;if(x<0||y<0||x>=w||y>=h)continue;tot++;dk+=m[y*w+x];}
          const kind=tot&&dk/tot>.12?'window':'door',mid=(A.s1+B.s0)/2;
          openings.push({c:o==='h'?P(mid,A.c):P(A.c,mid),w:g,kind});
          A.s1=B.s1;A.t=Math.max(A.t,B.t);B.dead=true;break;}}
    }
    walls=dedupe(walls.filter(W=>!W.dead));
  }
  const res={walls:walls.map(W=>W.o==='h'?{a:P(W.s0,W.c),b:P(W.s1,W.c),t:W.t}:{a:P(W.c,W.s0),b:P(W.c,W.s1),t:W.t}),openings,rooms:[]};
  if(opt.rooms&&walls.length)res.rooms=detectRooms(walls,w,h,mpp);
  return res;
}
function detectRooms(walls,w,h,mpp){
  const wm=new Uint8Array(w*h);
  for(const W of walls){const t2=W.t/2+1,a0=W.s0-t2,a1=W.s1+t2,b0=W.c-t2,b1=W.c+t2;
    const[x0,x1,y0,y1]=W.o==='h'?[a0,a1,b0,b1]:[b0,b1,a0,a1];
    for(let y=Math.max(0,Math.floor(y0));y<Math.min(h,Math.ceil(y1));y++)for(let x=Math.max(0,Math.floor(x0));x<Math.min(w,Math.ceil(x1));x++)wm[y*w+x]=1;}
  const lab=new Int32Array(w*h).fill(-1),info=[];let L=0;const st=[];
  for(let i=0;i<w*h;i++){if(wm[i]||lab[i]>=0)continue;let cnt=0,border=false;st.push(i);lab[i]=L;
    while(st.length){const j=st.pop(),x=j%w,y=(j-x)/w;cnt++;if(x===0||y===0||x===w-1||y===h-1)border=true;
      if(x>0&&!wm[j-1]&&lab[j-1]<0){lab[j-1]=L;st.push(j-1);}if(x<w-1&&!wm[j+1]&&lab[j+1]<0){lab[j+1]=L;st.push(j+1);}
      if(y>0&&!wm[j-w]&&lab[j-w]<0){lab[j-w]=L;st.push(j-w);}if(y<h-1&&!wm[j+w]&&lab[j+w]<0){lab[j+w]=L;st.push(j+w);}}
    info.push({cnt,border});L++;}
  const keep=new Set();info.forEach((r,i)=>{if(!r.border&&r.cnt*mpp*mpp>=1.5)keep.add(i);});
  return regionPolys(lab,w,h,keep).map(pts=>({pts}));
}
function regionPolys(lab,w,h,keep){
  const W1=w+1,E=new Map();
  const add=(L,a,b)=>{let m=E.get(L);if(!m){m=new Map();E.set(L,m);}let l=m.get(a);if(!l){l=[];m.set(a,l);}l.push(b);};
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=y*w+x,L=lab[i];if(!keep.has(L))continue;
    if(y===0||lab[i-w]!==L)add(L,y*W1+x,y*W1+x+1);
    if(x===w-1||lab[i+1]!==L)add(L,y*W1+x+1,(y+1)*W1+x+1);
    if(y===h-1||lab[i+w]!==L)add(L,(y+1)*W1+x+1,(y+1)*W1+x);
    if(x===0||lab[i-1]!==L)add(L,(y+1)*W1+x,y*W1+x);}
  const out=[];
  for(const m of E.values()){let bestLoop=[];
    for(const s of[...m.keys()]){while(m.get(s)&&m.get(s).length){const loop=[s];let cur=m.get(s).pop(),guard=0;
        while(cur!==s&&guard++<1e6){loop.push(cur);const l=m.get(cur);if(!l||!l.length)break;cur=l.pop();}
        if(loop.length>bestLoop.length)bestLoop=loop;}}
    let pts=bestLoop.map(k=>P(k%W1,Math.floor(k/W1)));
    pts=pts.filter((p,i)=>{const a=pts[(i-1+pts.length)%pts.length],b=pts[(i+1)%pts.length];return Math.abs(crs(sub(p,a),sub(b,p)))>1e-9;});
    pts=rdpClosed(pts,1.6);if(pts.length>=3)out.push(pts);}
  return out;
}
function rdp(pts,eps){if(pts.length<3)return pts;let id=0,dm=0;const a=pts[0],b=pts[pts.length-1];for(let i=1;i<pts.length-1;i++){const d=segDist(pts[i],a,b);if(d>dm){dm=d;id=i;}}if(dm<=eps)return[a,b];return rdp(pts.slice(0,id+1),eps).slice(0,-1).concat(rdp(pts.slice(id),eps));}
function rdpClosed(pts,eps){if(pts.length<4)return pts;let far=0,fd=0;pts.forEach((p,i)=>{const d=dist(p,pts[0]);if(d>fd){fd=d;far=i;}});const A=rdp(pts.slice(0,far+1),eps),B=rdp(pts.slice(far).concat([pts[0]]),eps);return A.slice(0,-1).concat(B.slice(0,-1));}

// converte o resultado (em pixels da imagem) para objetos do projeto
function importVector(res,o,px,opt){
  const sx=o.w/px.w,sy=o.h/px.h,mpp=(sx+sy)/2;
  const T=q=>{const l=P(q.x*sx*(o.flip?-1:1),(px.h-q.y)*sy);return add(o.p,rotV(l,o.rot||0));};
  const ids=[],nw=[],s=S();
  for(const wl of res.walls){const a=T(wl.a),b=T(wl.b);if(dist(a,b)<.3)continue;
    const t=opt.thick>0?opt.thick:Math.round(Math.min(.6,Math.max(.08,Math.round(wl.t*mpp/.025)*.025))*1000)/1000;
    const n=addObj({type:'wall',a,b,t,h:s.wallH});nw.push(n);ids.push(n.id);}
  for(const op of res.openings||[]){const c=T(op.c),wd=Math.max(.5,op.w*mpp);let best=null,bd=Infinity;
    for(const w of nw){const d=segDist(c,w.a,w.b);if(d<bd){bd=d;best=w;}}
    if(!best||bd>best.t+.4)continue;const L=dist(best.a,best.b);if(L<wd+.05)continue;
    const off=Math.max(wd/2,Math.min(L-wd/2,projT(c,best.a,best.b)*L));
    const n=op.kind==='window'?addObj({type:'window',wallId:best.id,off,w:wd,sill:s.winSill,h:s.winH}):addObj({type:'door',wallId:best.id,off,w:wd,h:s.doorH,flip:false,hinge:false});ids.push(n.id);}
  let k=1;for(const r of res.rooms||[]){const pts=r.pts.map(T);if(pts.length<3||Math.abs(polyArea(pts))<1)continue;
    const n=addObj({type:'room',pts,name:r.name||('Ambiente '+k++)});ids.push(n.id);}
  return ids;
}
function drawDetection(cvs,px,res){
  const g=cvs.getContext('2d'),k=Math.min(cvs.width/px.w,cvs.height/px.h),ox=(cvs.width-px.w*k)/2,oy=(cvs.height-px.h*k)/2,T=q=>[ox+q.x*k,oy+q.y*k];
  g.fillStyle='#fff';g.fillRect(0,0,cvs.width,cvs.height);g.globalAlpha=.55;g.drawImage(px.canvas,ox,oy,px.w*k,px.h*k);g.globalAlpha=1;
  if(!res)return;
  for(const r of res.rooms||[]){g.beginPath();r.pts.forEach((q,i)=>{const[x,y]=T(q);i?g.lineTo(x,y):g.moveTo(x,y);});g.closePath();g.fillStyle='rgba(120,90,220,.18)';g.fill();
    if(r.name){const c=centroid(r.pts),[x,y]=T(c);g.fillStyle='#5b3cc4';g.font='11px system-ui';g.textAlign='center';g.fillText(r.name,x,y);}}
  g.lineCap='square';for(const wl of res.walls){const[a,b]=[T(wl.a),T(wl.b)];g.strokeStyle='rgba(220,40,40,.85)';g.lineWidth=Math.max(2,wl.t*k);g.beginPath();g.moveTo(a[0],a[1]);g.lineTo(b[0],b[1]);g.stroke();}
  for(const op of res.openings||[]){const[x,y]=T(op.c);g.fillStyle=op.kind==='window'?'#1f8fff':'#ff9800';g.beginPath();g.arc(x,y,Math.max(4,op.w*k/2),0,7);g.globalAlpha=.6;g.fill();g.globalAlpha=1;}
}
function photoDialog(id){
  let o=id?getObj(id):null;
  if(!o||o.type!=='image')o=[...sel].map(getObj).find(x=>x&&x.type==='image')||doc.objects.find(x=>x.type==='image');
  if(!o){log('Anexe primeiro uma foto ou imagem da planta (comando IM).','err');$('#fileImg').click();return;}
  if(!getImg(o.img)){log('A imagem ainda está carregando, tente de novo.','err');return;}
  const px=imgPixels(o,900);let res=null,method='local',timer=null;
  const html='<div class="photoWrap"><div><canvas id="pvC" width="560" height="400" class="pvc"></canvas><div id="pvInfo" class="muted" style="margin-top:6px"></div>'+
    '<div class="muted" style="font-size:12px;margin-top:4px">Vermelho: paredes · Laranja: portas · Azul: janelas · Roxo: ambientes</div></div>'+
    '<div class="col" style="display:flex;flex-direction:column;gap:9px">'+
    '<label>Largura real da imagem (m)<input id="pdW" value="'+fmt(o.w).replace(/\./g,'')+'"></label>'+
    '<div class="muted" style="font-size:12px;margin-top:-4px">'+(o.calibrated?'✔ Escala calibrada.':'Dica: use "Calibrar escala" na imagem para ter medidas exatas.')+'</div>'+
    '<label>Sensibilidade <input type="range" id="pdS" min="0" max="1" step="0.05" value="0.5"></label>'+
    '<label>Comprimento mínimo de parede (m)<input id="pdL" value="0,6"></label>'+
    '<label>Espessura fixa das paredes (m, 0 = automática)<input id="pdT" value="0"></label>'+
    '<label style="flex-direction:row;align-items:center;gap:6px"><input type="checkbox" id="pdO" checked> Detectar portas e janelas</label>'+
    '<label style="flex-direction:row;align-items:center;gap:6px"><input type="checkbox" id="pdR" checked> Detectar ambientes (com área)</label>'+'<div class="note">Funciona melhor com plantas fotografadas de frente, com boa luz, ou escaneadas. Paredes retas na horizontal/vertical.</div></div></div>';
  const mppNow=()=>{const W=num($('#pdW').value);return(W>0?W:o.w)/px.w;};
  const opts=()=>({sens:+$('#pdS').value,minLen:Math.max(.2,num($('#pdL').value)||.6),openings:$('#pdO').checked,rooms:$('#pdR').checked});
  const info=()=>{$('#pvInfo').textContent=res?res.walls.length+' paredes · '+res.openings.filter(x=>x.kind==='door').length+' portas · '+res.openings.filter(x=>x.kind==='window').length+' janelas · '+res.rooms.length+' ambientes':'';};
  const run=()=>{if(method!=='local')return;try{res=detectPlan(px,mppNow(),opts());}catch(e){res=null;log('Falha na detecção: '+e.message,'err');}drawDetection($('#pvC'),px,res);info();};
  const sched=()=>{clearTimeout(timer);timer=setTimeout(run,220);};
  modal('Gerar desenho a partir da foto',html,[{label:'Cancelar',value:null},{label:'Criar desenho',primary:true,onClick:()=>{
    if(!res||!res.walls.length){alert('Nenhuma parede detectada. Ajuste a sensibilidade ou a largura real da imagem.');return false;}
    const nw=num($('#pdW').value);if(nw>0&&Math.abs(nw-o.w)>1e-6){o.h=o.h*nw/o.w;o.w=nw;}
    const ids=importVector(res,o,px,{thick:num($('#pdT').value)||0});o.opacity=Math.min(o.opacity??1,.35);
    sel=new Set(ids);commit();zoomExtents();
    log('Desenho gerado a partir da foto: '+ids.length+' objetos. Confira e ajuste as medidas; a foto ficou mais transparente ao fundo.','res');return true;}}],
    body=>{
      run();
      body.querySelectorAll('#pdS,#pdL,#pdO,#pdR,#pdW').forEach(e=>e.addEventListener('input',sched));
    });
}

