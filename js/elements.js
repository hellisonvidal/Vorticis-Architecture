'use strict';
/* =========================================================================
   Elementos: portas e janelas por tipo, telhado, escada, hachura e arco
   ========================================================================= */
const DOOR_KINDS={giro:'De giro',dupla:'De giro – 2 folhas',correr:'De correr',pivotante:'Pivotante',sanfonada:'Sanfonada'};
const WIN_KINDS={correr:'De correr','maxim-ar':'Maxim-ar',basculante:'Basculante',giro:'De abrir – 2 folhas',fixa:'Fixa'};
const ROOF_KINDS={'1a':'1 água','2a':'2 águas','4a':'4 águas',plano:'Laje plana'};
const HATCHES={diagonal:'Diagonal',cruzada:'Cruzada',ceramica:'Piso cerâmico',madeira:'Madeira / deck',grama:'Grama',solido:'Sólido'};

function normArc(a0,a1){let da=a1-a0;while(da>Math.PI)da-=2*Math.PI;while(da<-Math.PI)da+=2*Math.PI;return{a0,a1:a0+da,ccw:da>0};}
const swing=(c,r,a0,a1,ex)=>({k:'arc',c,r,...normArc(a0,a1),stroke:'L',lw:.7,dash:[4,3],...ex});
const ln=(a,b,lw=1,ex)=>({k:'poly',pts:[a,b],closed:false,stroke:'L',lw,...ex});
function arrowPrims(a,b,size,ex){const d=norm(sub(b,a)),n=perp(d),h=sub(b,mul(d,size));return[ln(a,b,1,ex),ln(b,add(h,mul(n,size*.45)),1,ex),ln(b,sub(h,mul(n,size*.45)),1,ex)];}

/* ---------- portas e janelas ---------- */
function openingBase(o){
  const g=openingGeom(o);if(!g)return null;const{u,n,c,t}=g,h=o.w/2,T=t/2;
  const p1=add(c,mul(u,-h)),p2=add(c,mul(u,h));
  const base=[{k:'poly',pts:[add(p1,mul(n,T+.004)),add(p2,mul(n,T+.004)),sub(p2,mul(n,T+.004)),sub(p1,mul(n,T+.004))],closed:true,fill:'BG',hitFill:true},
    ln(add(p1,mul(n,T)),sub(p1,mul(n,T)),1.2,{stroke:'F'}),ln(add(p2,mul(n,T)),sub(p2,mul(n,T)),1.2,{stroke:'F'})];
  return{g,u,n,c,T,h,p1,p2,base};
}
EXT.prims.door=o=>{
  const b=openingBase(o);if(!b)return[];const{u,n,c,T,p1,p2,base}=b,a=base,kind=o.kind||'giro',sd=o.flip?-1:1,nn=mul(n,sd),w=o.w;
  if(kind==='giro'||kind==='pivotante'){
    const hinge=o.hinge?p2:p1,other=o.hinge?p1:p2,ud=norm(sub(other,hinge));
    if(kind==='giro'){const hf=add(hinge,mul(nn,T)),le=add(hf,mul(nn,w));a.push(ln(hf,le,2),swing(hf,w,angOf(sub(le,hf)),angOf(sub(add(other,mul(nn,T)),hf))));}
    else{const pv=add(add(hinge,mul(ud,w*.18)),mul(nn,T)),e1=add(pv,mul(nn,w*.82)),e2=sub(pv,mul(nn,w*.18));
      a.push(ln(e2,e1,2),swing(pv,w*.82,angOf(sub(e1,pv)),angOf(ud)),swing(pv,w*.18,angOf(sub(e2,pv)),angOf(mul(ud,-1))));}
  }else if(kind==='dupla'){
    for(const[hg,ot]of[[p1,c],[p2,c]]){const hf=add(hg,mul(nn,T)),le=add(hf,mul(nn,w/2));a.push(ln(hf,le,1.8),swing(hf,w/2,angOf(sub(le,hf)),angOf(sub(add(ot,mul(nn,T)),hf))));}
  }else if(kind==='correr'){
    const o1=mul(n,T/3);a.push(ln(add(p1,o1),add(add(c,mul(u,.05)),o1),2.2),ln(sub(add(c,mul(u,-.05)),o1),sub(p2,o1),2.2));
    a.push(...arrowPrims(add(add(c,mul(u,-w*.3)),mul(nn,T+.18)),add(add(c,mul(u,w*.05)),mul(nn,T+.18)),.08));
  }else if(kind==='sanfonada'){
    const pts=[],k=4;for(let i=0;i<=k;i++)pts.push(add(add(p1,mul(u,w*i/k)),mul(nn,T+(i%2?w/(k*1.6):0))));a.push({k:'poly',pts,closed:false,stroke:'L',lw:1.6});
  }
  return a;
};
EXT.prims.window=o=>{
  const b=openingBase(o);if(!b)return[];const{u,n,c,T,p1,p2,base}=b,a=base,kind=o.kind||'correr',sd=o.flip?-1:1,nn=mul(n,sd),w=o.w;
  a.push(ln(add(p1,mul(n,T)),add(p2,mul(n,T)),1),ln(sub(p1,mul(n,T)),sub(p2,mul(n,T)),1));
  if(kind==='correr'){const q=mul(n,T/4);a.push(ln(add(p1,q),add(add(c,mul(u,.06)),q),1.4),ln(sub(add(c,mul(u,-.06)),q),sub(p2,q),1.4));}
  else if(kind==='fixa')a.push(ln(p1,p2,1.4));
  else if(kind==='maxim-ar'||kind==='basculante'){a.push(ln(p1,p2,1.2));const e=add(c,mul(nn,T+w*.22));a.push({k:'poly',pts:[add(p1,mul(nn,T)),e,add(p2,mul(nn,T))],closed:false,stroke:'L',lw:.7,dash:[3,3]});
    if(kind==='basculante'){const e2=sub(c,mul(nn,T+w*.22));a.push({k:'poly',pts:[sub(p1,mul(nn,T)),e2,sub(p2,mul(nn,T))],closed:false,stroke:'L',lw:.7,dash:[3,3]});}}
  else if(kind==='giro'){a.push(ln(p1,p2,1));for(const[hg,ot]of[[p1,c],[p2,c]]){const hf=add(hg,mul(nn,-T)),le=add(hf,mul(nn,-w/2));a.push(ln(hf,le,1.2),swing(hf,w/2,angOf(sub(le,hf)),angOf(sub(add(ot,mul(nn,-T)),hf))));}}
  return a;
};

/* ---------- telhado ---------- */
// referencial local: cumeeira sempre ao longo do eixo x local
function roofFrame(o){
  const ov=o.overhang??.5,alongY=o.ridgeAxis==='y',rot=(o.rot||0)+(alongY?Math.PI/2:0),w=alongY?o.d:o.w,d=alongY?o.w:o.d;
  const a=w/2+ov,b=d/2+ov,T=q=>add(o.c,rotV(q,rot));
  return{a,b,T,rot,ov,slope:(o.slope??30)/100,base:o.base??S().wallH,kind:o.kind||'2a',flip:!!o.flip};
}
function roofRise(F){return F.kind==='1a'?F.slope*2*F.b:F.kind==='plano'?0:F.slope*F.b;}
EXT.prims.roof=o=>{
  const F=roofFrame(o),{a,b,T}=F,out=[],ts=Math.max(.14,Math.min(.32,Math.min(a,b)/14));
  out.push({k:'poly',pts:[T(P(-a,-b)),T(P(a,-b)),T(P(a,b)),T(P(-a,b))],closed:true,stroke:'L',fill:'L',fillAlpha:.07,lw:1.5});
  const lab=(F.kind==='plano'?'Laje':fmt(o.slope??30,0)+'%');
  const arrow=(q0,q1)=>{out.push(...arrowPrims(T(q0),T(q1),Math.min(.35,dist(q0,q1)*.3)));};
  if(F.kind==='2a'){out.push(ln(T(P(-a,0)),T(P(a,0)),1.6));arrow(P(0,b*.2),P(0,b*.75));arrow(P(0,-b*.2),P(0,-b*.75));
    out.push(txt(T(P(ts*1.4,b*.5)),lab,ts,F.rot),txt(T(P(ts*1.4,-b*.5)),lab,ts,F.rot));}
  else if(F.kind==='4a'){const r=Math.max(0,a-b);out.push(ln(T(P(-r,0)),T(P(r,0)),1.6));for(const[sx,sy]of[[-1,-1],[1,-1],[1,1],[-1,1]])out.push(ln(T(P(sx*r,0)),T(P(sx*a,sy*b)),1.2));
    arrow(P(0,b*.25),P(0,b*.8));arrow(P(0,-b*.25),P(0,-b*.8));arrow(P(r+(a-r)*.25,0),P(r+(a-r)*.8,0));arrow(P(-r-(a-r)*.25,0),P(-r-(a-r)*.8,0));
    out.push(txt(T(P(ts*1.4,b*.55)),lab,ts,F.rot));}
  else if(F.kind==='1a'){const s=F.flip?-1:1;arrow(P(0,s*b*.7),P(0,-s*b*.7));out.push(txt(T(P(ts*1.4,0)),lab,ts,F.rot));}
  else{out.push(txt(T(P(0,0)),'LAJE PLANA',ts,F.rot));}
  return out;
};
const txt=(p,text,size,ang)=>({k:'text',p,text,size,ang:readable(ang||0),color:'L',align:'center',base:'middle'});
EXT.snaps.roof=o=>{const F=roofFrame(o);return[...[P(-F.a,-F.b),P(F.a,-F.b),P(F.a,F.b),P(-F.a,F.b)].map(q=>({p:F.T(q),k:'end'})),{p:o.c,k:'cen'}];};
EXT.segs.roof=o=>{const F=roofFrame(o),c=[P(-F.a,-F.b),P(F.a,-F.b),P(F.a,F.b),P(-F.a,F.b)].map(F.T);return c.map((p,i)=>[p,c[(i+1)%4]]);};
EXT.grips.roof=o=>{const ov=o.overhang??.5,rot=o.rot||0,cn=add(o.c,rotV(P(o.w/2+ov,o.d/2+ov),rot));
  return[{p:o.c,set:p=>{o.c=p;}},{p:cn,set:p=>{const l=rotV(sub(p,o.c),-rot);o.w=Math.max(.5,2*Math.abs(l.x)-2*ov);o.d=Math.max(.5,2*Math.abs(l.y)-2*ov);},base:o.c}];};
EXT.xform.roof=(o,f,opt)=>{o.c=f(o.c);if(opt.k&&opt.k!==1){o.w*=opt.k;o.d*=opt.k;}if(opt.mirror){o.rot=2*opt.axis-(o.rot||0);o.flip=!o.flip;}else o.rot=(o.rot||0)+(opt.ang||0);};
// geometria 3D do telhado: lista de faces (pontos x,y,z) e empenas
function roofFaces(o){
  const F=roofFrame(o),{a,b,base}=F,R=roofRise(F),V=(x,y,z)=>{const q=F.T(P(x,y));return{x:q.x,y:q.y,z};},faces=[],gables=[];
  if(F.kind==='2a'){const zt=base+R;faces.push([V(-a,-b,base),V(a,-b,base),V(a,0,zt),V(-a,0,zt)],[V(a,b,base),V(-a,b,base),V(-a,0,zt),V(a,0,zt)]);
    const gi=b-F.ov;for(const sx of[-1,1]){const x=sx*(a-F.ov);gables.push(sx<0?[V(x,-gi,base),V(x,gi,base),V(x,0,base+F.slope*gi)]:[V(x,gi,base),V(x,-gi,base),V(x,0,base+F.slope*gi)]);}}
  else if(F.kind==='4a'){const r=Math.max(0,a-b),zt=base+R;faces.push([V(-a,-b,base),V(a,-b,base),V(r,0,zt),V(-r,0,zt)],[V(a,b,base),V(-a,b,base),V(-r,0,zt),V(r,0,zt)],[V(a,-b,base),V(a,b,base),V(r,0,zt)],[V(-a,b,base),V(-a,-b,base),V(-r,0,zt)]);}
  else if(F.kind==='1a'){const s=F.flip?-1:1,zh=base+R;const lo=-s*b,hi=s*b;
    faces.push(s>0?[V(-a,lo,base),V(a,lo,base),V(a,hi,zh),V(-a,hi,zh)]:[V(a,lo,base),V(-a,lo,base),V(-a,hi,zh),V(a,hi,zh)]);
    const gi=b-F.ov;for(const sx of[-1,1]){const x=sx*(a-F.ov),y0=-s*gi,y1=s*gi,zz=base+F.slope*2*gi;const tri=[V(x,y0,base),V(x,y1,base),V(x,y1,zz)];gables.push(sx*s<0?tri:tri.reverse());}
    const wy=s*(b-F.ov);gables.push(s>0?[V(-(a-F.ov),wy,base),V(a-F.ov,wy,base),V(a-F.ov,wy,base+F.slope*2*(b-F.ov)),V(-(a-F.ov),wy,base+F.slope*2*(b-F.ov))]:[V(a-F.ov,wy,base),V(-(a-F.ov),wy,base),V(-(a-F.ov),wy,base+F.slope*2*(b-F.ov)),V(a-F.ov,wy,base+F.slope*2*(b-F.ov))]);}
  else{faces.push([V(-a,-b,base+.12),V(a,-b,base+.12),V(a,b,base+.12),V(-a,b,base+.12)]);}
  return{faces,gables,F};
}
function roofAreas(o){const F=roofFrame(o),proj=4*F.a*F.b;return{proj,real:F.kind==='plano'?proj:proj*Math.sqrt(1+F.slope*F.slope),rise:roofRise(F)};}
function fitRoofToWalls(ids){
  const walls=(ids&&ids.length?ids.map(getObj):doc.objects).filter(o=>o&&o.type==='wall');if(!walls.length)return null;
  let ang=0,best=0;for(const w of walls){const L=dist(w.a,w.b);if(L>best){best=L;ang=angOf(sub(w.b,w.a));}}
  ang=((ang%(Math.PI/2))+Math.PI/2)%(Math.PI/2);
  let x0=Infinity,y0=Infinity,x1=-Infinity,y1=-Infinity;
  for(const w of walls)for(const q of wallPoly(w)){const l=rotV(q,-ang);x0=Math.min(x0,l.x);y0=Math.min(y0,l.y);x1=Math.max(x1,l.x);y1=Math.max(y1,l.y);}
  const w=x1-x0,d=y1-y0;return{c:rotV(P((x0+x1)/2,(y0+y1)/2),ang),w,d,rot:ang,ridgeAxis:w>=d?'x':'y',base:Math.max(...walls.map(x=>x.h||S().wallH))};
}
function newRoof(g){const s=S();return{type:'roof',c:g.c,w:g.w,d:g.d,rot:g.rot||0,ridgeAxis:g.ridgeAxis||(g.w>=g.d?'x':'y'),kind:s.roofKind,slope:s.roofSlope,overhang:s.roofOverhang,base:g.base??s.wallH,flip:false};}

/* ---------- escada reta ---------- */
function stairInfo(o){const n=Math.max(2,o.n|0),tread=o.tread||.28,L=(n-1)*tread,u=P(Math.cos(o.rot||0),Math.sin(o.rot||0)),v=perp(u),hw=(o.w||1)/2;
  const T=(x,y)=>add(o.p,add(mul(v,x),mul(u,y)));return{n,tread,L,u,v,hw,T,riser:o.riser||(o.height||S().wallH)/n};}
EXT.prims.stair=o=>{const S_=stairInfo(o),{n,tread,L,hw,T}=S_,a=[];
  a.push({k:'poly',pts:[T(-hw,0),T(hw,0),T(hw,L),T(-hw,L)],closed:true,stroke:'L',fill:'L',fillAlpha:.05,lw:1.4,hitFill:true});
  for(let i=1;i<n-1;i++)a.push(ln(T(-hw,i*tread),T(hw,i*tread),.8));
  a.push(...arrowPrims(T(0,tread*.4),T(0,L-tread*.3),Math.min(.25,tread*.8)));
  a.push({k:'text',p:T(0,-.25),text:'SOBE',size:Math.min(.25,hw*.5),ang:readable((o.rot||0)-Math.PI/2),color:'L',align:'center',base:'middle'});
  return a;};
EXT.snaps.stair=o=>{const{L,hw,T}=stairInfo(o);return[T(-hw,0),T(hw,0),T(hw,L),T(-hw,L)].map(p=>({p,k:'end'})).concat([{p:o.p,k:'mid'}]);};
EXT.segs.stair=o=>{const{L,hw,T}=stairInfo(o),c=[T(-hw,0),T(hw,0),T(hw,L),T(-hw,L)];return c.map((p,i)=>[p,c[(i+1)%4]]);};
EXT.grips.stair=o=>{const{L,T}=stairInfo(o);return[{p:o.p,set:p=>{o.p=p;}},{p:T(0,L),set:p=>{o.rot=angOf(sub(p,o.p));},base:o.p}];};
EXT.xform.stair=(o,f,opt)=>{o.p=f(o.p);if(opt.k&&opt.k!==1)o.w*=opt.k;o.rot=opt.mirror?2*opt.axis-(o.rot||0):(o.rot||0)+(opt.ang||0);};
function newStair(p,dir){const s=S(),H=s.wallH,n=Math.max(2,Math.round(H/s.stairRiser));return{type:'stair',p,rot:dir,w:s.stairW,n,tread:s.stairTread,height:H};}

/* ---------- hachura ---------- */
function hatchLines(pts,ang,sp){const d=P(Math.cos(ang),Math.sin(ang)),nr=perp(d),pr=pts.map(p=>dot(p,nr));let mn=Math.min(...pr),mx=Math.max(...pr);const out=[];if((mx-mn)/sp>3000)sp=(mx-mn)/3000;
  for(let s=Math.ceil(mn/sp)*sp;s<=mx;s+=sp){const o=mul(nr,s),ts=[];for(let i=0;i<pts.length;i++){const a=pts[i],b=pts[(i+1)%pts.length],da=dot(a,nr)-s,db=dot(b,nr)-s;if((da>0)!==(db>0)){const q=add(a,mul(sub(b,a),da/(da-db)));ts.push(dot(sub(q,o),d));}}
    ts.sort((x,y)=>x-y);for(let i=0;i+1<ts.length;i+=2)out.push([add(o,mul(d,ts[i])),add(o,mul(d,ts[i+1]))]);}
  return out;}
EXT.prims.hatch=o=>{const pts=o.pts;if(pts.length<3)return[];const k=o.scale||1,a=[{k:'poly',pts,closed:true,stroke:'L',lw:.6,hitFill:true,fill:o.pattern==='solido'?'L':null,fillAlpha:.35}];
  const fam={diagonal:[[45,.15]],cruzada:[[45,.2],[-45,.2]],ceramica:[[0,.4],[90,.4]],madeira:[[0,.12]],grama:[[60,.35],[120,.35]]}[o.pattern]||[];
  for(const[ang,sp]of fam)for(const[p,q]of hatchLines(pts,(ang+(o.angle||0))*D2R,sp*k))a.push({k:'poly',pts:[p,q],closed:false,stroke:'L',lw:.5});
  return a;};
EXT.snaps.hatch=o=>o.pts.map(p=>({p,k:'end'}));
EXT.segs.hatch=o=>o.pts.map((p,i)=>[p,o.pts[(i+1)%o.pts.length]]);
EXT.grips.hatch=o=>o.pts.map((q,i)=>({p:q,set:p=>{o.pts[i]=p;}}));
EXT.xform.hatch=(o,f,opt)=>{o.pts=o.pts.map(f);if(opt.k)o.scale=(o.scale||1)*opt.k;};

/* ---------- arco ---------- */
function arcFix(o){let a1=o.a1;while(a1<=o.a0)a1+=2*Math.PI;return a1;}
EXT.prims.arc=o=>[{k:'arc',c:o.c,r:o.r,a0:o.a0,a1:arcFix(o),ccw:true,stroke:'L',lw:1.2}];
const arcPt=(o,a)=>add(o.c,P(Math.cos(a)*o.r,Math.sin(a)*o.r));
EXT.snaps.arc=o=>[{p:o.c,k:'cen'},{p:arcPt(o,o.a0),k:'end'},{p:arcPt(o,arcFix(o)),k:'end'},{p:arcPt(o,(o.a0+arcFix(o))/2),k:'mid'}];
EXT.segs.arc=o=>{const a1=arcFix(o),n=24,s=[];for(let i=0;i<n;i++)s.push([arcPt(o,o.a0+(a1-o.a0)*i/n),arcPt(o,o.a0+(a1-o.a0)*(i+1)/n)]);return s;};
EXT.grips.arc=o=>[{p:o.c,set:p=>{o.c=p;}},{p:arcPt(o,o.a0),set:p=>{o.a0=angOf(sub(p,o.c));},base:o.c},{p:arcPt(o,arcFix(o)),set:p=>{o.a1=angOf(sub(p,o.c));},base:o.c},{p:arcPt(o,(o.a0+arcFix(o))/2),set:p=>{o.r=Math.max(.001,dist(p,o.c));},base:o.c}];
EXT.xform.arc=(o,f,opt)=>{o.c=f(o.c);o.r*=opt.k||1;if(opt.mirror){const a0=o.a0,a1=arcFix(o);o.a0=2*opt.axis-a1;o.a1=2*opt.axis-a0;}else{o.a0+=opt.ang||0;o.a1+=opt.ang||0;}};
function circle3(a,b,c){const d=2*(a.x*(b.y-c.y)+b.x*(c.y-a.y)+c.x*(a.y-b.y));if(Math.abs(d)<1e-12)return null;
  const a2=dot(a,a),b2=dot(b,b),c2=dot(c,c),ux=(a2*(b.y-c.y)+b2*(c.y-a.y)+c2*(a.y-b.y))/d,uy=(a2*(c.x-b.x)+b2*(a.x-c.x)+c2*(b.x-a.x))/d;return P(ux,uy);}
function arcFrom3(a,m,b){const c=circle3(a,m,b);if(!c)return null;const r=dist(c,a),A=angOf(sub(a,c)),M=angOf(sub(m,c)),B=angOf(sub(b,c));
  const norm2=x=>((x%(2*Math.PI))+2*Math.PI)%(2*Math.PI),ccw=norm2(M-A)<norm2(B-A);return ccw?{type:'arc',c,r,a0:A,a1:B}:{type:'arc',c,r,a0:B,a1:A};}

/* ---------- ferramentas dos elementos ---------- */
Tools.arc=()=>{const t={pts:[],get base(){return t.pts[t.pts.length-1]||null;},prompt:'ARCO — ponto inicial',
  point(p){t.pts.push(p);if(t.pts.length===1)setPrompt('ARCO — segundo ponto (no arco)');else if(t.pts.length===2)setPrompt('ARCO — ponto final');else{const a=arcFrom3(...t.pts);if(a){addObj(a);commit();}endTool();}},
  preview(){if(t.pts.length===2){const a=arcFrom3(t.pts[0],t.pts[1],cur());return a?{objs:[a]}:null;}if(t.pts.length===1)return{prims:[{k:'poly',pts:[t.pts[0],cur()],closed:false}]};return null;}};return t;};
Tools.roof=()=>{
  const t=makeRectTool('TELHADO',(a,b)=>{const c=mid(a,b),w=Math.abs(b.x-a.x),d=Math.abs(b.y-a.y);const o=addObj(newRoof({c,w,d,rot:0}));sel=new Set([o.id]);commit();log('Telhado criado: '+ROOF_KINDS[o.kind]+', '+fmt(o.slope,0)+'%. Ajuste tipo, inclinação e beiral no painel.','res');},
    (a,b)=>({objs:[newRoof({c:mid(a,b),w:Math.abs(b.x-a.x)||.01,d:Math.abs(b.y-a.y)||.01,rot:0})]}));
  t.prompt='TELHADO — desenhe o contorno das paredes externas (2 cantos ou LarguraxProfundidade), ou use "Automático" acima';
  return t;
};
function autoRoof(){const g=fitRoofToWalls([...sel].length?[...sel]:null);if(!g){log('Desenhe paredes primeiro (ou selecione as paredes da edificação).','err');return;}
  const o=addObj(newRoof(g));sel=new Set([o.id]);commit();if(tool&&tool.name==='roof')endTool();log('Telhado automático: '+fmt(g.w)+' × '+fmt(g.d)+' m + beiral '+fmt(o.overhang)+' m, '+ROOF_KINDS[o.kind]+'.','res');}
Tools.stair=()=>{const t={base:null,prompt:'ESCADA — clique o pé da escada (centro do primeiro degrau)',
  point(p){if(!t.base){t.base=p;setPrompt('ESCADA — clique a direção de subida');return;}if(dist(p,t.base)<1e-6)return;const o=addObj(newStair(t.base,angOf(sub(p,t.base))));sel=new Set([o.id]);commit();
    const I=stairInfo(o);log('Escada: '+I.n+' degraus, espelho '+fmt(I.riser*100,1)+' cm, piso '+fmt(I.tread*100,0)+' cm, comprimento '+fmt(I.L)+' m.','res');endTool();},
  preview(){return t.base&&dist(cur(),t.base)>1e-6?{objs:[newStair(t.base,angOf(sub(cur(),t.base)))]}:null;}};return t;};
Tools.hatch=()=>{const t={prompt:'HACHURA — clique dentro de uma área fechada (ambiente, polilinha, terreno ou região entre paredes)',
  point(p){const pts=closedRegionAt(p);if(!pts){log('Não achei uma área fechada nesse ponto.','err');return;}addObj({type:'hatch',pts,pattern:S().hatchPattern,scale:S().hatchScale,angle:0});commit();log('Hachura criada ('+fmt(Math.abs(polyArea(pts)))+' m²).','res');}};return t;};
// região fechada no ponto: objeto fechado mais interno, senão região delimitada por paredes/linhas
function closedRegionAt(p){
  let best=null,ba=Infinity;
  for(const o of doc.objects){let pts=null;if(o.type==='room'||o.type==='terrain'||o.type==='hatch')pts=o.pts;else if(o.type==='polyline'&&o.closed)pts=o.pts;else if(o.type==='circle'){pts=ellL(o.c.x,o.c.y,o.r,o.r,48);}
    if(pts&&pts.length>2&&pointInPoly(p,pts)){const A=Math.abs(polyArea(pts));if(A<ba){ba=A;best=pts;}}}
  const r=regionFromWalls(p);if(r&&(!best||Math.abs(polyArea(r))<ba))return r;
  return best?best.map(cp):null;
}
