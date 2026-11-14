'use strict';
/* =========================================================================
   Vorticis Architecture — CAD arquitetônico local-first (HTML único)
   ========================================================================= */
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,7);
const clone=o=>JSON.parse(JSON.stringify(o));
const num=v=>{if(typeof v==='number')return v;const n=parseFloat(String(v).trim().replace(',','.'));return isFinite(n)?n:NaN;};
const fmt=(n,d=2)=>Number(n).toLocaleString('pt-BR',{minimumFractionDigits:d,maximumFractionDigits:d});
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

/* ---------- geometria ---------- */
const P=(x,y)=>({x,y});
const add=(a,b)=>P(a.x+b.x,a.y+b.y), sub=(a,b)=>P(a.x-b.x,a.y-b.y), mul=(a,k)=>P(a.x*k,a.y*k);
const dot=(a,b)=>a.x*b.x+a.y*b.y, crs=(a,b)=>a.x*b.y-a.y*b.x;
const len=a=>Math.hypot(a.x,a.y), dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const norm=a=>{const l=len(a)||1;return P(a.x/l,a.y/l);};
const perp=a=>P(-a.y,a.x);
const mid=(a,b)=>P((a.x+b.x)/2,(a.y+b.y)/2);
const rotV=(v,ang)=>{const s=Math.sin(ang),c=Math.cos(ang);return P(v.x*c-v.y*s,v.x*s+v.y*c);};
const rotP=(p,c,ang)=>add(c,rotV(sub(p,c),ang));
const angOf=a=>Math.atan2(a.y,a.x);
const D2R=Math.PI/180, R2D=180/Math.PI;
const readable=a=>{while(a>Math.PI/2+1e-6)a-=Math.PI;while(a<=-Math.PI/2+1e-6)a+=Math.PI;return a;};
function segDist(p,a,b){const ab=sub(b,a),l2=dot(ab,ab);let t=l2?dot(sub(p,a),ab)/l2:0;t=Math.max(0,Math.min(1,t));return dist(p,add(a,mul(ab,t)));}
function projT(p,a,b){const ab=sub(b,a),l2=dot(ab,ab);return l2?dot(sub(p,a),ab)/l2:0;}
function segInt(a,b,c,d){const r=sub(b,a),s=sub(d,c),den=crs(r,s);if(Math.abs(den)<1e-12)return null;const t=crs(sub(c,a),s)/den,u=crs(sub(c,a),r)/den;if(t<-1e-9||t>1+1e-9||u<-1e-9||u>1+1e-9)return null;return add(a,mul(r,t));}
function lineInt(a,da,b,db){const den=crs(da,db);if(Math.abs(den)<1e-12)return null;const t=crs(sub(b,a),db)/den;return add(a,mul(da,t));}
function polyArea(pts){let s=0;for(let i=0;i<pts.length;i++){const a=pts[i],b=pts[(i+1)%pts.length];s+=a.x*b.y-b.x*a.y;}return s/2;}
function polyPerim(pts,closed=true){let s=0;const n=pts.length;for(let i=0;i<n-(closed?0:1);i++)s+=dist(pts[i],pts[(i+1)%n]);return s;}
function centroid(pts){const A=polyArea(pts);if(Math.abs(A)<1e-9){let x=0,y=0;pts.forEach(p=>{x+=p.x;y+=p.y;});return P(x/pts.length,y/pts.length);}let cx=0,cy=0;for(let i=0;i<pts.length;i++){const a=pts[i],b=pts[(i+1)%pts.length],f=a.x*b.y-b.x*a.y;cx+=(a.x+b.x)*f;cy+=(a.y+b.y)*f;}return P(cx/(6*A),cy/(6*A));}
function pointInPoly(p,pts){let ins=false;for(let i=0,j=pts.length-1;i<pts.length;j=i++){const a=pts[i],b=pts[j];if(((a.y>p.y)!==(b.y>p.y))&&(p.x<(b.x-a.x)*(p.y-a.y)/(b.y-a.y)+a.x))ins=!ins;}return ins;}
function offsetPoly(pts,ds){const n=pts.length,s=Math.sign(polyArea(pts))||1,lines=[];for(let i=0;i<n;i++){const a=pts[i],b=pts[(i+1)%n],d=norm(sub(b,a)),nn=mul(perp(d),s);lines.push({p:add(a,mul(nn,ds[i]||0)),d});}const out=[];for(let i=0;i<n;i++){const L0=lines[(i-1+n)%n],L1=lines[i];out.push(lineInt(L0.p,L0.d,L1.p,L1.d)||L1.p);}return out;}
const rectPts=(a,b)=>[P(a.x,a.y),P(b.x,a.y),P(b.x,b.y),P(a.x,b.y)];
function rectCorners(c,w,d,rot){return[P(-w/2,-d/2),P(w/2,-d/2),P(w/2,d/2),P(-w/2,d/2)].map(q=>add(c,rotV(q,rot)));}
const cp=p=>P(p.x,p.y);

/* ---------- documento ---------- */
const APP_VERSION='1.0.0';
// edição para Windows (Tauri): a página roda dentro do programa e conversa com o Rust
const DESKTOP=!!(window.__TAURI__&&window.__TAURI__.core&&window.__TAURI__.core.invoke);
const tauriInvoke=(cmd,args)=>window.__TAURI__.core.invoke(cmd,args);
const DEFAULT_LAYERS=[
  {id:'geral',name:'Geral',color:'auto'},
  {id:'paredes',name:'Paredes',color:'auto'},
  {id:'esquadrias',name:'Esquadrias',color:'#e3a33b'},
  {id:'ambientes',name:'Ambientes',color:'#c792ea'},
  {id:'mobiliario',name:'Mobiliário',color:'#6fb3d9'},
  {id:'cotas',name:'Cotas',color:'#4fa3ff'},
  {id:'textos',name:'Textos',color:'auto'},
  {id:'terreno',name:'Terreno',color:'#3fb950'},
  {id:'telhado',name:'Telhado',color:'#f97316'},
  {id:'hachuras',name:'Hachuras',color:'#94a3b8'},
  {id:'imagens',name:'Imagens',color:'auto'},
];
const DEFAULT_SETTINGS={gridStep:1,snapStep:0.05,wallT:0.15,wallH:2.8,doorW:0.8,doorH:2.1,winW:1.2,winSill:1.0,winH:1.2,textSize:0.25,dimSize:0.2,blockKind:'cama_casal',autoLayer:true,theme:'auto',mirrorErase:false,doorKind:'giro',winKind:'correr',roofKind:'2a',roofSlope:30,roofOverhang:.5,stairW:1.0,stairRiser:.175,stairTread:.28,hatchPattern:'diagonal',hatchScale:1,offsetDist:.15,arrayRows:1,arrayCols:3,arrayDx:2,arrayDy:2};
const TYPE_LAYER={wall:'paredes',door:'esquadrias',window:'esquadrias',room:'ambientes',block:'mobiliario',dim:'cotas',text:'textos',terrain:'terreno',image:'imagens',roof:'telhado',hatch:'hachuras',stair:'paredes'};
const ORDER={image:0,terrain:1,hatch:2,room:2,polyline:3,line:3,circle:3,arc:3,block:3,stair:4,wall:5,door:6,window:6,roof:6.5,dim:7,text:8};
const TYPE_NAME={line:'Linha',polyline:'Polilinha',circle:'Círculo',wall:'Parede',door:'Porta',window:'Janela',room:'Ambiente',terrain:'Terreno',dim:'Cota',text:'Texto',image:'Imagem',block:'Mobiliário',arc:'Arco',roof:'Telhado',stair:'Escada',hatch:'Hachura'};
function newDoc(name){return{app:'vorticis-architecture',version:1,name:name||'Projeto 1',layers:clone(DEFAULT_LAYERS).map(l=>({...l,visible:true,locked:false})),activeLayer:'geral',objects:[],images:{},settings:{...DEFAULT_SETTINGS},view:null};}
let doc=newDoc();
const getLayer=id=>doc.layers.find(l=>l.id===id)||doc.layers[0];
const getObj=id=>doc.objects.find(o=>o.id===id);
function layerFor(type){if(doc.settings.autoLayer){const id=TYPE_LAYER[type];if(id&&doc.layers.some(l=>l.id===id))return id;}return doc.activeLayer;}
function addObj(o){const n=clone(o);n.id=uid();if(!n.layer)n.layer=layerFor(n.type);doc.objects.push(n);return n;}
const S=()=>doc.settings;

/* ---------- estado da aplicação ---------- */
const prefs=Object.assign({snap:true,grid:true,osnap:true,ortho:false,polar:true},(()=>{try{return JSON.parse(localStorage.getItem('va:prefs')||'{}');}catch(e){return{};}})());
function savePrefs(){try{localStorage.setItem('va:prefs',JSON.stringify(prefs));}catch(e){}}
let view={cx:10,cy:8,s:30};
let sel=new Set(), hoverId=null, tool=null, lastCmd=null, pendingCmd=null, panMode=false, mode3d=false;
let mouseS=P(0,0), mouseW=P(0,0), snapRes={p:P(0,0),k:null}, mouseIn=false;
let drag=null; // {type:'pan'|'grip'|'move'|'window'|'pinch', ...}
let clipboard=null, measureOverlay=null;
const imgCache={};

/* ---------- blocos de mobiliário ---------- */
function rectL(x0,y0,x1,y1){return[P(x0,y0),P(x1,y0),P(x1,y1),P(x0,y1)];}
function ellL(cx,cy,rx,ry,n=28){const a=[];for(let i=0;i<n;i++){const t=i/n*2*Math.PI;a.push(P(cx+rx*Math.cos(t),cy+ry*Math.sin(t)));}return a;}
const pl=(pts,closed=true,ex={})=>({k:'poly',pts,closed,stroke:'L',lw:1,...ex});
const ci=(c,r,ex={})=>({k:'circle',c,r,stroke:'L',lw:1,...ex});
function chair(cx,cy,rot){const b=[rectL(-.2,-.2,.2,.2),[P(-.2,.14),P(.2,.14)]];return [pl(b[0].map(p=>add(P(cx,cy),rotV(p,rot)))),pl(b[1].map(p=>add(P(cx,cy),rotV(p,rot))),false)];}
const BLOCKS={
  cama_casal:{name:'Cama casal',w:1.38,d:1.88,h:.5,draw:(w,d)=>{const x=w/2,y=d/2;return[pl(rectL(-x,-y,x,y)),pl(rectL(-x+.06,y-.36,-.04,y-.08)),pl(rectL(.04,y-.36,x-.06,y-.08)),pl([P(-x,y-.48),P(x,y-.48)],false),pl([P(-x,y-.48),P(x,-y*.15)],false,{lw:.6})];}},
  cama_solteiro:{name:'Cama solteiro',w:.88,d:1.88,h:.5,draw:(w,d)=>{const x=w/2,y=d/2;return[pl(rectL(-x,-y,x,y)),pl(rectL(-x+.08,y-.36,x-.08,y-.08)),pl([P(-x,y-.48),P(x,y-.48)],false),pl([P(-x,y-.48),P(x,-y*.15)],false,{lw:.6})];}},
  sofa:{name:'Sofá',w:2.0,d:.85,h:.8,draw:(w,d)=>{const x=w/2,y=d/2;return[pl(rectL(-x,-y,x,y)),pl(rectL(-x,y-.2,x,y)),pl(rectL(-x,-y,-x+.18,y-.2)),pl(rectL(x-.18,-y,x,y-.2)),pl([P(0,-y),P(0,y-.2)],false,{lw:.6})];}},
  poltrona:{name:'Poltrona',w:.8,d:.8,h:.8,draw:(w,d)=>{const x=w/2,y=d/2;return[pl(rectL(-x,-y,x,y)),pl(rectL(-x,y-.18,x,y)),pl(rectL(-x,-y,-x+.14,y-.18)),pl(rectL(x-.14,-y,x,y-.18))];}},
  mesa4:{name:'Mesa 4 lugares',w:1.2,d:.8,h:.75,draw:(w,d)=>{const x=w/2,y=d/2;return[pl(rectL(-x,-y,x,y)),...chair(-w/4,y+.22,0),...chair(w/4,y+.22,0),...chair(-w/4,-y-.22,Math.PI),...chair(w/4,-y-.22,Math.PI)];}},
  mesa_redonda:{name:'Mesa redonda',w:1.0,d:1.0,h:.75,draw:(w)=>{const r=w/2;return[ci(P(0,0),r),...chair(0,r+.22,0),...chair(0,-r-.22,Math.PI),...chair(r+.22,0,-Math.PI/2),...chair(-r-.22,0,Math.PI/2)];}},
  vaso:{name:'Vaso sanitário',w:.38,d:.65,h:.4,draw:(w,d)=>{const x=w/2,y=d/2;return[pl(rectL(-x,y-.18,x,y)),pl(ellL(0,-.07,x*.9,(d-.18)/2*.95))];}},
  lavatorio:{name:'Lavatório',w:.5,d:.42,h:.85,draw:(w,d)=>{const x=w/2,y=d/2;return[pl(rectL(-x,-y,x,y)),pl(ellL(0,-.03,x*.7,y*.6)),ci(P(0,y-.06),.025)];}},
  chuveiro:{name:'Box / chuveiro',w:.9,d:.9,h:.05,draw:(w,d)=>{const x=w/2,y=d/2;return[pl(rectL(-x,-y,x,y)),pl([P(-x,-y),P(x,y)],false,{lw:.5,dash:[4,3]}),pl([P(-x,y),P(x,-y)],false,{lw:.5,dash:[4,3]}),ci(P(0,0),.04)];}},
  pia:{name:'Pia de cozinha',w:1.2,d:.6,h:.9,draw:(w,d)=>{const x=w/2,y=d/2;return[pl(rectL(-x,-y,x,y)),pl(rectL(-x+.1,-y+.08,-x+.6,y-.1)),ci(P(-x+.35,0),.03),ci(P(-x+.35,y-.05),.025)];}},
  fogao:{name:'Fogão',w:.55,d:.6,h:.9,draw:(w,d)=>{const x=w/2,y=d/2;return[pl(rectL(-x,-y,x,y)),ci(P(-.13,-.1),.08),ci(P(.13,-.1),.08),ci(P(-.13,.15),.08),ci(P(.13,.15),.08)];}},
  geladeira:{name:'Geladeira',w:.7,d:.7,h:1.8,draw:(w,d)=>{const x=w/2,y=d/2;return[pl(rectL(-x,-y,x,y)),pl(rectL(-x+.05,-y+.05,x-.05,y-.05),true,{lw:.5}),pl([P(-x,-y),P(x,y)],false,{lw:.5})];}},
  guarda_roupa:{name:'Guarda-roupa',w:1.6,d:.6,h:2.1,draw:(w,d)=>{const x=w/2,y=d/2;return[pl(rectL(-x,-y,x,y)),pl([P(-x,0),P(x,0)],false,{lw:.5,dash:[5,3]}),pl([P(0,-y),P(0,y)],false,{lw:.6})];}},
  carro:{name:'Carro',w:1.8,d:4.3,h:1.5,draw:(w,d)=>{const x=w/2,y=d/2;const body=[P(-x+.15,-y),P(x-.15,-y),P(x,-y+.3),P(x,y-.4),P(x-.2,y),P(-x+.2,y),P(-x,y-.4),P(-x,-y+.3)];return[pl(body),pl([P(-x+.15,y-1.2),P(x-.15,y-1.2),P(x-.25,y-.65),P(-x+.25,y-.65)]),pl([P(-x+.18,-y+.9),P(x-.18,-y+.9),P(x-.25,-y+.45),P(-x+.25,-y+.45)])];}},
  escrivaninha:{name:'Escrivaninha',w:1.2,d:.6,h:.75,draw:(w,d)=>{const x=w/2,y=d/2;return[pl(rectL(-x,-y,x,y)),...chair(0,-y-.22,Math.PI)];}},
  tanque:{name:'Tanque',w:.6,d:.55,h:.9,draw:(w,d)=>{const x=w/2,y=d/2;return[pl(rectL(-x,-y,x,y)),pl(rectL(-x+.06,-y+.06,x-.06,y-.15)),ci(P(0,y-.08),.025)];}},
  maquina:{name:'Máquina de lavar',w:.6,d:.6,h:.9,draw:(w,d)=>{const x=w/2,y=d/2;return[pl(rectL(-x,-y,x,y)),ci(P(0,-.03),Math.min(x,y)*.7),pl([P(-x,y-.1),P(x,y-.1)],false,{lw:.6})];}},
  piscina:{name:'Piscina',w:3,d:6,h:.05,draw:(w,d)=>{const x=w/2,y=d/2,a=[pl(rectL(-x,-y,x,y),true,{lw:1.4}),pl(rectL(-x+.15,-y+.15,x-.15,y-.15),true,{lw:.6})];for(let i=1;i<=3;i++)a.push(pl([P(-x+.15,y-.15-i*.3),P(-x+.9,y-.15-i*.3)],false,{lw:.5}));for(let k=-1;k<=1;k++)a.push(pl([P(-x*.5,k*d/5),P(-x*.2,k*d/5+.12),P(x*.1,k*d/5),P(x*.4,k*d/5+.12)],false,{lw:.5,dash:[3,2]}));return a;}},
  arvore:{name:'Árvore',w:3,d:3,h:4,draw:(w)=>{const r=w/2,a=[ci(P(0,0),r,{lw:.8}),ci(P(0,0),r*.12)];for(let i=0;i<8;i++){const t=i*Math.PI/4;a.push(pl([P(Math.cos(t)*r*.12,Math.sin(t)*r*.12),P(Math.cos(t)*r*.8,Math.sin(t)*r*.8)],false,{lw:.5}));}return a;}},
};

/* ---------- paredes e aberturas ---------- */
function wallInfo(w){const d=sub(w.b,w.a),L=len(d),u=L?mul(d,1/L):P(1,0);return{L,u,n:perp(u)};}
function wallExt(w){let ea=0,eb=0;for(const o of doc.objects){if(o.type!=='wall'||o.id===w.id)continue;for(const q of[o.a,o.b]){if(dist(q,w.a)<1e-4)ea=Math.max(ea,o.t/2);if(dist(q,w.b)<1e-4)eb=Math.max(eb,o.t/2);}}return[Math.min(ea,w.t/2*4),Math.min(eb,w.t/2*4)];}
function wallPoly(w){const{u,n}=wallInfo(w),[ea,eb]=wallExt(w),h=w.t/2,a=sub(w.a,mul(u,ea)),b=add(w.b,mul(u,eb));return[add(a,mul(n,h)),add(b,mul(n,h)),sub(b,mul(n,h)),sub(a,mul(n,h))];}
function openingsOf(wallIds){const s=new Set(wallIds);return doc.objects.filter(o=>(o.type==='door'||o.type==='window')&&s.has(o.wallId));}
function openingGeom(o){const w=getObj(o.wallId);if(!w)return null;const{L,u,n}=wallInfo(w);const off=Math.max(o.w/2,Math.min(L-o.w/2,o.off));const c=add(w.a,mul(u,off));return{w,L,u,n,c,off,t:w.t};}

/* ---------- primitivas (base de desenho, seleção, SVG e DXF) ---------- */
/* ganchos para tipos definidos em elements.js (portas/janelas com tipos, telhado, escada, hachura, arco) */
const EXT={prims:{},snaps:{},segs:{},grips:{},xform:{}};
function prims(o){
  if(EXT.prims[o.type])return EXT.prims[o.type](o);
  const ts=S().textSize;
  switch(o.type){
    case 'line':return[{k:'poly',pts:[o.a,o.b],closed:false,stroke:'L',lw:1.2}];
    case 'polyline':return[{k:'poly',pts:o.pts,closed:!!o.closed,stroke:'L',lw:1.2}];
    case 'circle':return[{k:'circle',c:o.c,r:o.r,stroke:'L',lw:1.2}];
    case 'wall':return[{k:'poly',pts:wallPoly(o),closed:true,stroke:'L',fill:'WF',lw:1.2,hitFill:true}];
    case 'door':case 'window':{
      const g=openingGeom(o);if(!g)return[];
      const{u,n,c,t}=g,h=o.w/2,p1=add(c,mul(u,-h)),p2=add(c,mul(u,h)),T=t/2;
      const a=[{k:'poly',pts:[add(p1,mul(n,T+.004)),add(p2,mul(n,T+.004)),sub(p2,mul(n,T+.004)),sub(p1,mul(n,T+.004))],closed:true,fill:'BG',hitFill:true},
        {k:'poly',pts:[add(p1,mul(n,T)),sub(p1,mul(n,T))],closed:false,stroke:'F',lw:1.2},
        {k:'poly',pts:[add(p2,mul(n,T)),sub(p2,mul(n,T))],closed:false,stroke:'F',lw:1.2}];
      if(o.type==='door'){
        const sd=o.flip?-1:1,nn=mul(n,sd),hinge=o.hinge?p2:p1,other=o.hinge?p1:p2;
        const hf=add(hinge,mul(nn,T)),of=add(other,mul(nn,T)),le=add(hf,mul(nn,o.w));
        const a0=angOf(sub(le,hf)),a1=angOf(sub(of,hf));let da=a1-a0;while(da>Math.PI)da-=2*Math.PI;while(da<-Math.PI)da+=2*Math.PI;
        a.push({k:'poly',pts:[hf,le],closed:false,stroke:'L',lw:2});
        a.push({k:'arc',c:hf,r:o.w,a0,a1,ccw:da>0,stroke:'L',lw:.8,dash:[4,3]});
      }else{
        a.push({k:'poly',pts:[add(p1,mul(n,T)),add(p2,mul(n,T))],closed:false,stroke:'L',lw:1});
        a.push({k:'poly',pts:[sub(p1,mul(n,T)),sub(p2,mul(n,T))],closed:false,stroke:'L',lw:1});
        a.push({k:'poly',pts:[add(p1,mul(n,T/4)),add(p2,mul(n,T/4))],closed:false,stroke:'L',lw:.8});
        a.push({k:'poly',pts:[sub(p1,mul(n,T/4)),sub(p2,mul(n,T/4))],closed:false,stroke:'L',lw:.8});
      }
      return a;
    }
    case 'room':{
      if(o.pts.length<3)return[];
      const A=Math.abs(polyArea(o.pts)),c=centroid(o.pts),sz=o.size||Math.max(ts,Math.min(.8,Math.sqrt(A)/18));
      return[{k:'poly',pts:o.pts,closed:true,stroke:'L',fill:'L',fillAlpha:.10,lw:.8,dash:[5,3]},
        {k:'text',p:add(c,P(0,sz*.65)),text:o.name||'Ambiente',size:sz,ang:0,color:'L',align:'center',base:'middle',bold:true},
        {k:'text',p:sub(c,P(0,sz*.65)),text:fmt(A)+' m²',size:sz*.85,ang:0,color:'L',align:'center',base:'middle'}];
    }
    case 'terrain':{
      const pts=o.pts;if(pts.length<3)return[];
      const sz=o.size||Math.max(ts,Math.min(3,Math.sqrt(Math.abs(polyArea(pts)))/30)),sg=Math.sign(polyArea(pts))||1,n=pts.length,a=[];
      a.push({k:'poly',pts,closed:true,stroke:'L',fill:'L',fillAlpha:.05,lw:2,dash:[14,4,2,4]});
      for(let i=0;i<n;i++){
        const p=pts[i],q=pts[(i+1)%n],d=norm(sub(q,p)),out=mul(perp(d),-sg),L=dist(p,q);
        if(L<1e-6)continue;
        a.push({k:'text',p:add(mid(p,q),mul(out,sz*.75)),text:fmt(L)+' m',size:sz*.8,ang:readable(angOf(d)),color:'L',align:'center',base:'middle'});
        const pr=pts[(i-1+n)%n],d0=norm(sub(p,pr)),inw=add(mul(perp(d0),sg),mul(perp(d),sg)),bis=len(inw)>1e-6?mul(norm(inw),-1):out;
        a.push({k:'circle',c:p,r:sz*.18,stroke:'L',fill:'L',lw:1});
        a.push({k:'text',p:add(p,mul(bis,sz*.9)),text:'V'+(i+1),size:sz*.6,ang:0,color:'L',align:'center',base:'middle'});
      }
      const A=Math.abs(polyArea(pts));let lab=(o.name||'Terreno')+'\nÁrea: '+fmt(A)+' m²\nPerímetro: '+fmt(polyPerim(pts))+' m';
      if(o.setbacks&&o.setbacks.some(v=>v>0)){
        const sp=offsetPoly(pts,o.setbacks);
        a.push({k:'poly',pts:sp,closed:true,stroke:'L',lw:.8,dash:[3,3]});
        lab+='\nÁrea edificável: '+fmt(Math.abs(polyArea(sp)))+' m²';
      }
      // rótulo fora do terreno, junto ao 1º lado (frente), para não cobrir a edificação
      {const p0=pts[0],p1=pts[1],d=norm(sub(p1,p0)),out=mul(perp(d),-sg),nl=lab.split('\n').length;
       a.push({k:'text',p:add(mid(p0,p1),mul(out,sz*(1.9+nl*.6))),text:lab,size:sz,ang:readable(angOf(d)),color:'L',align:'center',base:'middle'});}
      return a;
    }
    case 'dim':{
      const d=sub(o.b,o.a),L=len(d);if(L<1e-9)return[];
      const u=mul(d,1/L),n=perp(u),sz=o.size||S().dimSize,sg=Math.sign(o.off)||1,a2=add(o.a,mul(n,o.off)),b2=add(o.b,mul(n,o.off));
      const ext=sz*.4,gap=Math.min(Math.abs(o.off),sz*.3),tk=mul(norm(add(u,n)),sz*.35);
      const ang=readable(angOf(u)),tn=perp(P(Math.cos(ang),Math.sin(ang)));
      return[
        {k:'poly',pts:[add(o.a,mul(n,sg*gap)),add(a2,mul(n,sg*ext))],closed:false,stroke:'L',lw:.7},
        {k:'poly',pts:[add(o.b,mul(n,sg*gap)),add(b2,mul(n,sg*ext))],closed:false,stroke:'L',lw:.7},
        {k:'poly',pts:[sub(a2,mul(u,ext)),add(b2,mul(u,ext))],closed:false,stroke:'L',lw:.8},
        {k:'poly',pts:[sub(a2,tk),add(a2,tk)],closed:false,stroke:'L',lw:1.6},
        {k:'poly',pts:[sub(b2,tk),add(b2,tk)],closed:false,stroke:'L',lw:1.6},
        {k:'text',p:add(mid(a2,b2),mul(tn,sz*.25)),text:o.text||fmt(L),size:sz,ang,color:'L',align:'center',base:'bottom'}];
    }
    case 'text':return[{k:'text',p:o.p,text:o.text,size:o.size||ts,ang:o.ang||0,color:'L',align:'left',base:'bottom'}];
    case 'image':return[{k:'image',p:o.p,w:o.w,h:o.h,rot:o.rot||0,flip:!!o.flip,img:o.img,opacity:o.opacity??1}];
    case 'block':{
      const B=BLOCKS[o.kind]||BLOCKS.cama_casal,loc=B.draw(o.w||B.w,o.d||B.d),rot=o.rot||0;
      const T=q=>add(o.p,rotV(o.mirror?P(-q.x,q.y):q,rot));
      return loc.map(pr=>pr.k==='poly'?{...pr,pts:pr.pts.map(T)}:{...pr,c:T(pr.c)});
    }
  }
  return[];
}
function textBox(pr){
  const lines=String(pr.text).split('\n'),n=lines.length,w=Math.max(...lines.map(l=>l.length))*pr.size*.58,h=n*pr.size*1.2;
  let x0=pr.align==='center'?-w/2:0,y0=pr.base==='middle'?-h/2:-pr.size*.25;
  const c=[P(x0,y0),P(x0+w,y0),P(x0+w,y0+h),P(x0,y0+h)];
  return c.map(q=>add(pr.p,rotV(q,pr.ang||0)));
}
function imageCorners(pr){const f=pr.flip?-1:1;return[P(0,0),P(f*pr.w,0),P(f*pr.w,pr.h),P(0,pr.h)].map(q=>add(pr.p,rotV(q,pr.rot||0)));}
function primPts(pr){
  if(pr.k==='poly')return pr.pts;
  if(pr.k==='circle'||pr.k==='arc')return[P(pr.c.x-pr.r,pr.c.y-pr.r),P(pr.c.x+pr.r,pr.c.y+pr.r)];
  if(pr.k==='text')return textBox(pr);
  if(pr.k==='image')return imageCorners(pr);
  return[];
}
function primDist(pr,p){
  if(pr.k==='poly'){
    if(pr.hitFill&&pr.closed&&pointInPoly(p,pr.pts))return 0;
    let d=Infinity;const n=pr.pts.length;for(let i=0;i<n-(pr.closed?0:1);i++)d=Math.min(d,segDist(p,pr.pts[i],pr.pts[(i+1)%n]));return d;
  }
  if(pr.k==='circle'){const d=dist(p,pr.c);if(pr.hitFill&&d<pr.r)return 0;return Math.abs(d-pr.r);}
  if(pr.k==='arc')return Math.abs(dist(p,pr.c)-pr.r);
  if(pr.k==='text'){const b=textBox(pr);if(pointInPoly(p,b))return 0;let d=Infinity;for(let i=0;i<4;i++)d=Math.min(d,segDist(p,b[i],b[(i+1)%4]));return d;}
  if(pr.k==='image'){const b=imageCorners(pr);return pointInPoly(p,b)?0:Infinity;}
  return Infinity;
}
function hitObj(o,p){let d=Infinity;for(const pr of prims(o))d=Math.min(d,primDist(pr,p));return d;}
function objBBox(o){let x0=Infinity,y0=Infinity,x1=-Infinity,y1=-Infinity;for(const pr of prims(o))for(const q of primPts(pr)){x0=Math.min(x0,q.x);y0=Math.min(y0,q.y);x1=Math.max(x1,q.x);y1=Math.max(y1,q.y);}return x0<=x1?{x0,y0,x1,y1}:null;}
function docBBox(list){let b=null;for(const o of list||doc.objects){if(getLayer(o.layer).visible===false)continue;const q=objBBox(o);if(!q)continue;b=b?{x0:Math.min(b.x0,q.x0),y0:Math.min(b.y0,q.y0),x1:Math.max(b.x1,q.x1),y1:Math.max(b.y1,q.y1)}:q;}return b;}
function pickAt(p){
  const tol=7/view.s;let best=null,bd=Infinity,bo=-1;
  for(const o of doc.objects){const L=getLayer(o.layer);if(L.visible===false||L.locked)continue;let d=hitObj(o,p);if(d>tol)continue;if(ORDER[o.type]<3)d+=tol*.5;
    if(d<bd-1e-9||(Math.abs(d-bd)<1e-9&&ORDER[o.type]>bo)){bd=d;best=o;bo=ORDER[o.type];}}
  return best;
}

/* ---------- snaps ---------- */
function snapPts(o){
  if(EXT.snaps[o.type])return EXT.snaps[o.type](o);
  const r=[],E=(p,k)=>r.push({p,k});
  switch(o.type){
    case 'line':E(o.a,'end');E(o.b,'end');E(mid(o.a,o.b),'mid');break;
    case 'wall':E(o.a,'end');E(o.b,'end');E(mid(o.a,o.b),'mid');wallPoly(o).forEach(p=>E(p,'end'));break;
    case 'polyline':case 'room':case 'terrain':{const n=o.pts.length,cl=o.type!=='polyline'||o.closed;o.pts.forEach(p=>E(p,'end'));for(let i=0;i<n-(cl?0:1);i++)E(mid(o.pts[i],o.pts[(i+1)%n]),'mid');break;}
    case 'circle':E(o.c,'cen');[0,1,2,3].forEach(i=>E(add(o.c,P(Math.cos(i*Math.PI/2)*o.r,Math.sin(i*Math.PI/2)*o.r)),'end'));break;
    case 'text':case 'block':E(o.p,'end');break;
    case 'image':imageCorners(prims(o)[0]).forEach(p=>E(p,'end'));break;
    case 'door':case 'window':{const g=openingGeom(o);if(g){E(g.c,'mid');E(add(g.c,mul(g.u,o.w/2)),'end');E(sub(g.c,mul(g.u,o.w/2)),'end');}break;}
  }
  return r;
}
function segsOf(o){
  if(EXT.segs[o.type])return EXT.segs[o.type](o);
  switch(o.type){
    case 'line':case 'wall':return[[o.a,o.b]];
    case 'polyline':case 'room':case 'terrain':{const s=[],n=o.pts.length,cl=o.type!=='polyline'||o.closed;for(let i=0;i<n-(cl?0:1);i++)s.push([o.pts[i],o.pts[(i+1)%n]]);return s;}
  }
  return[];
}
const SNAP_PRI={end:0,int:0,mid:1,cen:1,perp:2,near:3};
function findOsnap(p,exclude){
  const tol=12/view.s;let best=null,bd=Infinity;const near=[];
  for(const o of doc.objects){
    if(exclude&&exclude.has(o.id))continue;if(getLayer(o.layer).visible===false)continue;
    for(const s of snapPts(o)){const d=dist(s.p,p)+SNAP_PRI[s.k]*tol*.15;if(d<tol&&d<bd){bd=d;best=s;}}
    for(const sg of segsOf(o))if(segDist(p,sg[0],sg[1])<tol)near.push(sg);
  }
  // perpendicular (a partir do ponto base) e mais próximo, com prioridade menor
  if(!best){const base=tool&&tool.base;for(const sg of near){const ab=sub(sg[1],sg[0]),l2=dot(ab,ab);if(!l2)continue;
    if(base){const t=dot(sub(base,sg[0]),ab)/l2;if(t>=0&&t<=1){const q=add(sg[0],mul(ab,t));const d=dist(q,p);if(d<tol&&d<bd){bd=d;best={p:q,k:'perp'};}}}}
    if(!best&&near.length){let nb=null,nd=Infinity;for(const sg of near){const t=Math.max(0,Math.min(1,projT(p,sg[0],sg[1]))),q=add(sg[0],mul(sub(sg[1],sg[0]),t)),d=dist(q,p);if(d<nd){nd=d;nb=q;}}if(nb&&nd<tol*.6){best={p:nb,k:'near'};bd=nd;}}}
  if(near.length<40)for(let i=0;i<near.length;i++)for(let j=i+1;j<near.length;j++){const q=segInt(near[i][0],near[i][1],near[j][0],near[j][1]);if(q){const d=dist(q,p);if(d<tol&&d<bd){bd=d;best={p:q,k:'int'};}}}
  return best?{p:cp(best.p),k:best.k}:null;
}
function updateSnap(){
  let p=mouseW,k=null;const base=tool&&tool.base;
  const active=tool||(drag&&(drag.type==='grip'||drag.type==='move'));
  if(active&&prefs.osnap){const r=findOsnap(mouseW,drag&&drag.exclude);if(r){p=r.p;k=r.k;}}
  if(!k&&active){
    const st=S().snapStep;
    if(prefs.ortho&&base){const d=sub(p,base);if(Math.abs(d.x)>=Math.abs(d.y)){p=P(p.x,base.y);if(prefs.snap)p.x=base.x+Math.round((p.x-base.x)/st)*st;}else{p=P(base.x,p.y);if(prefs.snap)p.y=base.y+Math.round((p.y-base.y)/st)*st;}}
    else if(prefs.polar&&base&&len(sub(p,base))>1e-6){const d=sub(p,base),a=angOf(d),step=15*D2R,ar=Math.round(a/step)*step;
      if(Math.abs(a-ar)<3.5*D2R){let L=len(d)*Math.cos(a-ar);if(prefs.snap)L=Math.round(L/st)*st;p=add(base,P(L*Math.cos(ar),L*Math.sin(ar)));snapRes={p,k:null,polar:ar};return;}
      if(prefs.snap)p=P(Math.round(p.x/st)*st,Math.round(p.y/st)*st);}
    else if(prefs.snap)p=P(Math.round(p.x/st)*st,Math.round(p.y/st)*st);
  }
  snapRes={p,k};
}
const cur=()=>snapRes.p;

/* ---------- desfazer/refazer ---------- */
let undoStack=[],redoStack=[],lastState=null;
const snapshot=()=>JSON.stringify({layers:doc.layers,objects:doc.objects,activeLayer:doc.activeLayer});
function resetHistory(){undoStack=[];redoStack=[];lastState=snapshot();}
function commit(){const s=snapshot();if(s===lastState)return;undoStack.push(lastState);if(undoStack.length>200)undoStack.shift();redoStack=[];lastState=s;changed();}
function restoreState(s){const o=JSON.parse(s);doc.layers=o.layers;doc.objects=o.objects;doc.activeLayer=o.activeLayer;for(const id of[...sel])if(!getObj(id))sel.delete(id);lastState=s;changed();}
function undo(){if(!undoStack.length)return log('Nada para desfazer.');redoStack.push(snapshot());restoreState(undoStack.pop());log('Desfeito.');}
function redo(){if(!redoStack.length)return log('Nada para refazer.');undoStack.push(snapshot());restoreState(redoStack.pop());log('Refeito.');}
let v3Timer=null;
function changed(){scheduleSave();buildProps();buildLayers();redraw();if(mode3d){clearTimeout(v3Timer);v3Timer=setTimeout(()=>refresh3D(),120);}}

/* ---------- canvas 2D ---------- */
const cv=$('#cv'),ctx=cv.getContext('2d'),cv3=$('#cv3'),g3=cv3.getContext('2d');
let W=0,H=0,DPR=1,needDraw=false;
function uiDark(){const t=document.documentElement.dataset.theme;if(t==='light')return false;if(t==='dark')return true;return!(window.matchMedia&&matchMedia('(prefers-color-scheme: light)').matches);}
function themeR(){const dark=uiDark();return dark?{bg:'#111815',fg:'#e7efe9',wallFill:'#5f6f67',accent:'#4ade80',gridMin:'rgba(255,255,255,0.04)',gridMaj:'rgba(255,255,255,0.10)',sel:'#4ade80',hover:'rgba(74,222,128,0.4)',snap:'#fb923c'}:{bg:'#fbfcfb',fg:'#17221c',wallFill:'#4b5852',accent:'#16a34a',gridMin:'rgba(0,0,0,0.05)',gridMaj:'rgba(0,0,0,0.11)',sel:'#16a34a',hover:'rgba(22,163,74,0.35)',snap:'#ea580c'};}
function resize(){const r=$('#canvasWrap').getBoundingClientRect();DPR=window.devicePixelRatio||1;W=Math.max(1,r.width);H=Math.max(1,r.height);for(const c of[cv,cv3]){c.width=Math.round(W*DPR);c.height=Math.round(H*DPR);c.style.width=W+'px';c.style.height=H+'px';}redraw();if(mode3d){if(T3&&T3.renderer){T3.renderer.setSize(W,H,false);T3.renderer.domElement.style.width=W+'px';T3.renderer.domElement.style.height=H+'px';T3.camera.aspect=W/H;T3.camera.updateProjectionMatrix();}else if(T3===false)render3D();}}
const toS=p=>P((p.x-view.cx)*view.s+W/2,H/2-(p.y-view.cy)*view.s);
const toW=(x,y)=>P((x-W/2)/view.s+view.cx,(H/2-y)/view.s+view.cy);
function redraw(){if(!needDraw){needDraw=true;requestAnimationFrame(render);}}
function colorOf(c,L,R){if(!c)return null;if(c==='L')return(!L||L==='auto')?R.fg:L;if(c==='F')return R.fg;if(c==='BG')return R.bg;if(c==='WF')return R.wallFill;return c;}
function getImg(id){if(!id||!doc.images[id])return null;let im=imgCache[id];if(!im){im=new Image();im.onload=()=>{redraw();};im.src=doc.images[id];imgCache[id]=im;}return im.complete&&im.naturalWidth?im:null;}
function drawPrim(g,pr,L,R,ov){
  const s=R.s;g.save();
  if(pr.k==='text'){
    const px=pr.size*s;if(px<2.5&&!R.export){g.restore();return;}
    g.translate(pr.p.x,pr.p.y);g.rotate(pr.ang||0);g.scale(1/s,-1/s);
    g.font=(pr.bold?'600 ':'')+px+'px system-ui,-apple-system,Segoe UI,Arial,sans-serif';
    g.fillStyle=ov?ov.stroke:colorOf(pr.color,L,R);g.textAlign=pr.align||'left';g.textBaseline='middle';
    const lines=String(pr.text).split('\n'),n=lines.length,lh=px*1.2;
    lines.forEach((t,i)=>{const y=pr.base==='middle'?(i-(n-1)/2)*lh:-(n-1-i)*lh-px*.45;g.fillText(t,0,y);});
    g.restore();return;
  }
  if(pr.k==='image'){
    if(ov){const c=imageCorners(pr);g.beginPath();c.forEach((q,i)=>i?g.lineTo(q.x,q.y):g.moveTo(q.x,q.y));g.closePath();g.lineWidth=ov.lw/s;g.setLineDash((ov.dash||[]).map(v=>v/s));g.strokeStyle=ov.stroke;g.stroke();g.restore();return;}
    const im=getImg(pr.img);g.translate(pr.p.x,pr.p.y);g.rotate(pr.rot||0);if(pr.flip)g.scale(-1,1);g.scale(1,-1);
    if(im){g.globalAlpha=pr.opacity;g.drawImage(im,0,-pr.h,pr.w,pr.h);}else{g.strokeStyle=R.fg;g.lineWidth=1/s;g.strokeRect(0,-pr.h,pr.w,pr.h);}
    g.restore();return;
  }
  g.beginPath();
  if(pr.k==='poly'){pr.pts.forEach((q,i)=>i?g.lineTo(q.x,q.y):g.moveTo(q.x,q.y));if(pr.closed)g.closePath();}
  else if(pr.k==='circle')g.arc(pr.c.x,pr.c.y,pr.r,0,Math.PI*2);
  else if(pr.k==='arc')g.arc(pr.c.x,pr.c.y,pr.r,pr.a0,pr.a1,!pr.ccw);
  const fill=ov?null:colorOf(pr.fill,L,R);
  if(fill){g.globalAlpha=pr.fillAlpha??1;g.fillStyle=fill;g.fill();g.globalAlpha=1;}
  const stroke=ov?ov.stroke:colorOf(pr.stroke,L,R);
  if(stroke){g.lineWidth=(ov?ov.lw:(pr.lw||1))*(R.lwk||1)/s;const dsh=ov?ov.dash:pr.dash;g.setLineDash(dsh?dsh.map(v=>v/s):[]);g.strokeStyle=stroke;if(ov&&ov.alpha)g.globalAlpha=ov.alpha;g.lineCap='round';g.lineJoin='round';g.stroke();}
  g.restore();
}
function drawObj(g,o,R,ov){const L=getLayer(o.layer).color;for(const pr of prims(o))drawPrim(g,pr,L,R,ov);}
function drawScene(g,R,list){
  const objs=list.filter(o=>getLayer(o.layer).visible!==false).sort((a,b)=>ORDER[a.type]-ORDER[b.type]);
  const walls=objs.filter(o=>o.type==='wall');
  for(const o of objs)if(ORDER[o.type]<5)drawObj(g,o,R);
  const wp=walls.map(w=>({w,pts:wallPoly(w)}));
  for(const{w,pts}of wp){g.beginPath();pts.forEach((q,i)=>i?g.lineTo(q.x,q.y):g.moveTo(q.x,q.y));g.closePath();g.lineWidth=2.6*(R.lwk||1)/R.s;g.lineJoin='miter';g.strokeStyle=colorOf('L',getLayer(w.layer).color,R);g.stroke();}
  for(const{pts}of wp){g.beginPath();pts.forEach((q,i)=>i?g.lineTo(q.x,q.y):g.moveTo(q.x,q.y));g.closePath();g.fillStyle=R.wallFill;g.fill();}
  for(const o of objs)if(ORDER[o.type]>5)drawObj(g,o,R);
}
function drawGrid(g,R){
  if(!prefs.grid)return;let st=S().gridStep||1;while(st*view.s<10)st*=5;while(st*view.s>120)st/=5;
  const a=toW(0,H),b=toW(W,0),maj=st*5;
  const lines=(step,col)=>{g.beginPath();for(let x=Math.floor(a.x/step)*step;x<=b.x;x+=step){const sx=Math.round(toS(P(x,0)).x)+.5;g.moveTo(sx,0);g.lineTo(sx,H);}for(let y=Math.floor(a.y/step)*step;y<=b.y;y+=step){const sy=Math.round(toS(P(0,y)).y)+.5;g.moveTo(0,sy);g.lineTo(W,sy);}g.strokeStyle=col;g.lineWidth=1;g.stroke();};
  lines(st,R.gridMin);lines(maj,R.gridMaj);
  const o=toS(P(0,0));g.lineWidth=1.5;g.strokeStyle='rgba(255,90,90,.7)';g.beginPath();g.moveTo(o.x,o.y);g.lineTo(o.x+40,o.y);g.stroke();g.strokeStyle='rgba(90,200,120,.8)';g.beginPath();g.moveTo(o.x,o.y);g.lineTo(o.x,o.y-40);g.stroke();
}
function worldTransform(g){const s=view.s;g.setTransform(DPR*s,0,0,-DPR*s,DPR*(W/2-view.cx*s),DPR*(H/2+view.cy*s));}
function render(){
  needDraw=false;if(mode3d)return;
  const R={...themeR(),s:view.s},g=ctx;
  g.setTransform(DPR,0,0,DPR,0,0);g.fillStyle=R.bg;g.fillRect(0,0,W,H);
  drawGrid(g,R);
  worldTransform(g);
  drawScene(g,R,doc.objects);
  if(hoverId&&!sel.has(hoverId)){const o=getObj(hoverId);if(o)drawObj(g,o,R,{stroke:R.hover,lw:4});}
  for(const id of sel){const o=getObj(id);if(o)drawObj(g,o,R,{stroke:R.sel,lw:2,dash:[6,4]});}
  if(tool&&tool.preview){const pv=tool.preview();if(pv){(pv.objs||[]).forEach(o=>{o.layer=o.layer||layerFor(o.type);drawObj(g,o,R);});(pv.prims||[]).forEach(pr=>drawPrim(g,pr,null,R,{stroke:R.accent,lw:1,dash:[5,4]}));}}
  if(snapRes.polar!=null&&tool&&tool.base&&mouseIn){const b=tool.base,q=add(b,P(Math.cos(snapRes.polar)*1e4/view.s,Math.sin(snapRes.polar)*1e4/view.s));drawPrim(g,{k:'poly',pts:[b,q],closed:false},null,R,{stroke:R.snap,lw:.8,dash:[2,5]});}
  if(measureOverlay)measureOverlay.forEach(pr=>drawPrim(g,pr,null,R,{stroke:R.snap,lw:1.6,dash:[6,3]}));
  g.setTransform(DPR,0,0,DPR,0,0);
  // grips
  if(!tool&&sel.size&&sel.size<=30){g.fillStyle=R.sel;g.strokeStyle=R.bg;for(const id of sel){const o=getObj(id);if(!o)continue;for(const gr of grips(o)){const q=toS(gr.p);g.fillRect(q.x-4,q.y-4,8,8);g.strokeRect(q.x-4.5,q.y-4.5,9,9);}}}
  // janela de seleção
  if(drag&&drag.type==='window'){const a=toS(drag.a),b=mouseS,cross=b.x<a.x;g.fillStyle=cross?'rgba(60,200,120,.12)':'rgba(77,163,255,.12)';g.strokeStyle=cross?'#3fb950':R.sel;g.setLineDash(cross?[5,4]:[]);g.fillRect(Math.min(a.x,b.x),Math.min(a.y,b.y),Math.abs(b.x-a.x),Math.abs(b.y-a.y));g.strokeRect(Math.min(a.x,b.x)+.5,Math.min(a.y,b.y)+.5,Math.abs(b.x-a.x),Math.abs(b.y-a.y));g.setLineDash([]);}
  // marcador de snap
  if(mouseIn&&snapRes.k&&(tool||drag)){const q=toS(snapRes.p);g.strokeStyle=R.snap;g.lineWidth=2;g.beginPath();
    if(snapRes.k==='end')g.rect(q.x-6,q.y-6,12,12);else if(snapRes.k==='mid'){g.moveTo(q.x,q.y-7);g.lineTo(q.x+7,q.y+5);g.lineTo(q.x-7,q.y+5);g.closePath();}else if(snapRes.k==='cen')g.arc(q.x,q.y,6,0,7);else if(snapRes.k==='perp'){g.moveTo(q.x-6,q.y+6);g.lineTo(q.x+6,q.y+6);g.moveTo(q.x-6,q.y+6);g.lineTo(q.x-6,q.y-6);g.moveTo(q.x-6,q.y);g.lineTo(q.x,q.y);g.lineTo(q.x,q.y+6);}else if(snapRes.k==='near'){g.moveTo(q.x-6,q.y-6);g.lineTo(q.x+6,q.y-6);g.lineTo(q.x-6,q.y+6);g.lineTo(q.x+6,q.y+6);g.closePath();}else{g.moveTo(q.x-6,q.y-6);g.lineTo(q.x+6,q.y+6);g.moveTo(q.x+6,q.y-6);g.lineTo(q.x-6,q.y+6);}g.stroke();}
  if(!doc.objects.length&&!tool){g.fillStyle=R.fg;g.globalAlpha=.55;g.textAlign='center';g.font='15px system-ui,sans-serif';
    (W<700?['Comece um projeto:','TE — terreno por dimensões','PA — paredes · PR — retangulares','IM — anexar foto','PO / JA — portas e janelas','AM — ambientes com área']:['Comece um projeto:','TE — terreno por dimensões  ·  PA — paredes  ·  PR — paredes retangulares','IM — anexar foto  ·  PO/JA — portas e janelas  ·  AM — ambientes','Use a faixa de opções acima, arraste um arquivo DWG/DXF/PDF para cá ou digite um comando.']).forEach((t,i,a)=>g.fillText(t,W/2,H/2-a.length*12+i*24));g.globalAlpha=1;}
  // dica dinâmica
  const tip=$('#tip');
  if(mouseIn&&tool&&tool.base){const p=cur(),d=dist(tool.base,p),a=angOf(sub(p,tool.base))*R2D;tip.style.display='block';tip.textContent=fmt(d)+' m  ∠ '+fmt((a+360)%360,1)+'°';tip.style.left=(mouseS.x+16)+'px';tip.style.top=(mouseS.y+16)+'px';}
  else tip.style.display='none';
  $('#zoomInfo').textContent='Zoom: '+fmt(view.s,1)+' px/m';
}

/* ---------- alças (grips) ---------- */
function grips(o){
  if(EXT.grips[o.type])return EXT.grips[o.type](o);
  const r=[],G=(p,set,base)=>r.push({p,set,base});
  switch(o.type){
    case 'line':case 'wall':G(o.a,p=>{o.a=p;},o.b);G(o.b,p=>{o.b=p;},o.a);G(mid(o.a,o.b),p=>{const d=sub(p,mid(o.a,o.b));o.a=add(o.a,d);o.b=add(o.b,d);});break;
    case 'polyline':case 'room':case 'terrain':o.pts.forEach((q,i)=>G(q,p=>{o.pts[i]=p;},o.pts[(i-1+o.pts.length)%o.pts.length]));break;
    case 'circle':G(o.c,p=>{o.c=p;});G(add(o.c,P(o.r,0)),p=>{o.r=Math.max(.001,dist(p,o.c));},o.c);break;
    case 'dim':{G(o.a,p=>{o.a=p;});G(o.b,p=>{o.b=p;});const n=perp(norm(sub(o.b,o.a)));G(add(mid(o.a,o.b),mul(n,o.off)),p=>{o.off=dot(sub(p,o.a),n);});break;}
    case 'text':case 'block':G(o.p,p=>{o.p=p;});break;
    case 'image':{const c=imageCorners(prims(o)[0]);G(o.p,p=>{o.p=p;});G(c[2],p=>{const l=rotV(sub(p,o.p),-(o.rot||0)),nw=Math.max(.05,Math.abs(l.x));o.h=o.h*nw/o.w;o.w=nw;},o.p);break;}
    case 'door':case 'window':{const g=openingGeom(o);if(g)G(g.c,p=>{const w=getObj(o.wallId);const L=wallInfo(w).L;o.off=Math.max(o.w/2,Math.min(L-o.w/2,projT(p,w.a,w.b)*L));});break;}
  }
  return r;
}

/* ---------- transformações ---------- */
function xformObj(o,f,opt={}){
  if(EXT.xform[o.type])return EXT.xform[o.type](o,f,opt);
  const k=opt.k||1,ang=opt.ang||0;
  switch(o.type){
    case 'line':case 'wall':o.a=f(o.a);o.b=f(o.b);break;
    case 'dim':o.a=f(o.a);o.b=f(o.b);o.off*=k;if(opt.mirror)o.off=-o.off;break;
    case 'polyline':case 'room':case 'terrain':o.pts=o.pts.map(f);if(o.setbacks&&opt.mirror){}break;
    case 'circle':o.c=f(o.c);o.r*=k;break;
    case 'text':o.p=f(o.p);if(o.size)o.size*=k;o.ang=opt.mirror?readable(2*opt.axis-(o.ang||0)):(o.ang||0)+ang;break;
    case 'block':o.p=f(o.p);if(k!==1){o.w=(o.w||BLOCKS[o.kind].w)*k;o.d=(o.d||BLOCKS[o.kind].d)*k;}if(opt.mirror){o.rot=2*opt.axis-(o.rot||0);o.mirror=!o.mirror;}else o.rot=(o.rot||0)+ang;break;
    case 'image':o.p=f(o.p);o.w*=k;o.h*=k;if(opt.mirror){o.rot=2*opt.axis-(o.rot||0);o.flip=!o.flip;}else o.rot=(o.rot||0)+ang;break;
    case 'door':case 'window':if(opt.mirror)o.flip=!o.flip;if(k!==1)o.off*=k;break;
  }
}
function selectionWithOpenings(ids){const s=new Set(ids);const walls=ids.filter(id=>{const o=getObj(id);return o&&o.type==='wall';});openingsOf(walls).forEach(o=>s.add(o.id));return[...s];}
function applyXform(ids,f,opt,copy){
  const all=selectionWithOpenings(ids),map={},out=[];
  if(copy){
    for(const id of all){const o=getObj(id);if(!o)continue;if((o.type==='door'||o.type==='window')&&!all.includes(o.wallId))continue;const n=clone(o);n.id=uid();map[o.id]=n.id;out.push(n);}
    for(const n of out){if(n.type==='door'||n.type==='window')n.wallId=map[n.wallId];xformObj(n,f,opt);doc.objects.push(n);}
    return out.map(o=>o.id);
  }
  for(const id of all){const o=getObj(id);if(!o)continue;if((o.type==='door'||o.type==='window')&&!opt.mirror&&!(opt.k&&opt.k!==1))continue;if((o.type==='door'||o.type==='window')&&!all.includes(o.wallId))continue;xformObj(o,f,opt);}
  return ids;
}
function previewXform(ids,f,opt){const all=selectionWithOpenings(ids).map(getObj).filter(o=>o&&o.type!=='door'&&o.type!=='window');return all.map(o=>{const n=clone(o);xformObj(n,f,opt);return n;});}
function eraseSel(){if(!sel.size)return log('Nada selecionado.');const all=new Set(selectionWithOpenings([...sel]));const n=all.size;doc.objects=doc.objects.filter(o=>!all.has(o.id));sel.clear();commit();log(n+' objeto(s) apagado(s).');}

