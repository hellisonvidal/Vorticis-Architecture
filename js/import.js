'use strict';
/* =========================================================================
   Importação: DWG/BAK, DXF, PDF, SVG, DWFx, imagens e projeto JSON
   ========================================================================= */
// bibliotecas locais (pasta vendor/): funcionam sem internet; caminhos relativos ao endereço da página
const LIB=p=>new URL(p,document.baseURI).href;
const CDN={libredwg:LIB('vendor/libredwg-web/dist/libredwg-web.js'),pdfjs:LIB('vendor/pdfjs/build/pdf.min.mjs'),pdfworker:LIB('vendor/pdfjs/build/pdf.worker.min.mjs')};

/* ---------- entrada de arquivos ---------- */
$('#fileAny').addEventListener('change',e=>{const f=e.target.files[0];e.target.value='';if(f)importFile(f);});
{const wrap=$('#canvasWrap'),hint=$('#dropHint');let n=0;
  wrap.addEventListener('dragenter',e=>{if(e.dataTransfer&&[...e.dataTransfer.types].includes('Files')){n++;hint.hidden=false;e.preventDefault();}});
  wrap.addEventListener('dragover',e=>{if(e.dataTransfer&&[...e.dataTransfer.types].includes('Files'))e.preventDefault();});
  wrap.addEventListener('dragleave',()=>{if(--n<=0){n=0;hint.hidden=true;}});
  wrap.addEventListener('drop',e=>{e.preventDefault();n=0;hint.hidden=true;const f=e.dataTransfer.files&&e.dataTransfer.files[0];if(f)importFile(f);});}
function busy(msg){modal('Importando…','<p>'+esc(msg)+'</p><div class="progress"><i></i></div>',[]);}
function unbusy(){if(dlg.open)dlg.close();}
const ascii4=b=>String.fromCharCode(...b.slice(0,6));
async function importFile(f){
  const ext=(f.name.split('.').pop()||'').toLowerCase(),buf=new Uint8Array(await f.arrayBuffer()),head=ascii4(buf);
  try{
    if(head.startsWith('AC10')||head.startsWith('AC1.')||head.startsWith('AC2.')){busy('Lendo DWG…');const cad=await parseDWG(buf);unbusy();return cadImportDialog(cad,f.name);}
    if(head.startsWith('%PDF'))return pdfImportDialog(buf,f.name);
    if(buf[0]===0x50&&buf[1]===0x4b)return importZip(buf,f.name);
    if(head.startsWith('(DWF V')||head.startsWith('(W2D V'))throw new Error('DWF clássico (binário W2D) não é suportado no navegador. Abra no Autodesk Viewer/DWG TrueView e salve como DWFx, PDF ou DXF.');
    if(ext==='svg'||f.type==='image/svg+xml')return vectorImportDialog(parseSVGText(new TextDecoder().decode(buf)),f.name,'SVG');
    if(['png','jpg','jpeg','gif','bmp','webp'].includes(ext)||/^image\/(png|jpe?g|gif|bmp|webp)$/.test(f.type))return insertImageFile(f);
    const text=new TextDecoder(guessEncoding(buf)).decode(buf),t0=text.trimStart();
    if(t0[0]==='{'){const d=JSON.parse(text);if(d&&Array.isArray(d.objects))return importProjectJSON(d);throw new Error('JSON não é um projeto do Vorticis Architecture.');}
    if(ext==='svg'||/^<(\?xml|svg|!DOCTYPE svg)/i.test(t0)&&/<svg[\s>]/i.test(text))return vectorImportDialog(parseSVGText(text),f.name,'SVG');
    if(head.startsWith('Autoca')&&text.startsWith('AutoCAD Binary DXF'))throw new Error('DXF binário não é suportado. Salve como DXF ASCII.');
    if(/(^|\n)\s*0\s*\r?\n\s*SECTION/.test(text.slice(0,2000))||ext==='dxf'){const cad=parseDXF(text);return cadImportDialog(cad,f.name);}
    if(ext==='bak'||ext==='dwg')throw new Error('Arquivo não parece ser um DWG válido.');
    throw new Error('Formato não reconhecido: .'+ext);
  }catch(e){unbusy();console.error(e);log('Falha ao importar "'+f.name+'": '+(e.message||e),'err');modal('Não foi possível importar','<p>'+esc(e.message||String(e))+'</p>',[{label:'OK',primary:true}]);}
}
function guessEncoding(buf){try{new TextDecoder('utf-8',{fatal:true}).decode(buf.slice(0,Math.min(buf.length,200000)));return'utf-8';}catch(e){return'windows-1252';}}
async function importProjectJSON(d){await saveNow();loadDoc(d,true);let nm=d.name||'Importado';const names=(await store.all()).map(r=>r.name);while(names.includes(nm))nm+=' (importado)';doc.name=nm;$('#projName').value=nm;await saveNow(true);log('Projeto importado: '+nm,'res');}
async function insertImageFile(f){
  try{
    const url=await new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result);r.onerror=()=>rej(r.error);r.readAsDataURL(f);});
    const im=await new Promise((res,rej)=>{const i=new Image();i.onload=()=>res(i);i.onerror=()=>rej(new Error('Imagem inválida'));i.src=url;});
    placeImage(im,url,f.size);
  }catch(err){log('Não foi possível carregar a imagem: '+err.message,'err');}
}
function placeImage(im,url,size,opts={}){
  let data=url;const max=opts.max||2400;
  if(im.naturalWidth>max||im.naturalHeight>max||size>1.5e6){const k=Math.min(1,max/Math.max(im.naturalWidth,im.naturalHeight));const c=document.createElement('canvas');c.width=Math.round(im.naturalWidth*k);c.height=Math.round(im.naturalHeight*k);const g=c.getContext('2d');g.fillStyle='#fff';g.fillRect(0,0,c.width,c.height);g.drawImage(im,0,0,c.width,c.height);data=c.toDataURL('image/jpeg',.88);}
  const id='img'+uid();doc.images[id]=data;
  const w=opts.w||Math.max(1,W/view.s*.5),h=w*im.naturalHeight/im.naturalWidth,p=opts.p||P(view.cx-w/2,view.cy-h/2);
  const o=addObj({type:'image',img:id,p,w,h,rot:0,opacity:opts.opacity??.75,calibrated:!!opts.calibrated});
  sel=new Set([o.id]);commit();openPanel();if(opts.fit)zoomExtents();
  log('Imagem inserida. '+(opts.calibrated?'Escala aplicada pela folha.':'Use "Calibrar escala" para colocá-la em escala real.')+' Depois, "Foto → desenho" gera as paredes.','res');
  return o;
}

/* ---------- ZIP (leitura) ---------- */
async function inflateRaw(u8){const ds=new DecompressionStream('deflate-raw');const out=new Response(new Blob([u8]).stream().pipeThrough(ds));return new Uint8Array(await out.arrayBuffer());}
function zipEntries(buf){const dv=new DataView(buf.buffer,buf.byteOffset,buf.byteLength);let e=-1;for(let i=buf.length-22;i>=Math.max(0,buf.length-70000);i--)if(dv.getUint32(i,true)===0x06054b50){e=i;break;}
  if(e<0)throw new Error('ZIP inválido');const n=dv.getUint16(e+10,true);let p=dv.getUint32(e+16,true);const out=[];
  for(let i=0;i<n;i++){if(dv.getUint32(p,true)!==0x02014b50)break;const method=dv.getUint16(p+10,true),cs=dv.getUint32(p+20,true),nl=dv.getUint16(p+28,true),xl=dv.getUint16(p+30,true),cl=dv.getUint16(p+32,true),lo=dv.getUint32(p+42,true);
    const name=new TextDecoder().decode(buf.slice(p+46,p+46+nl));const lnl=dv.getUint16(lo+26,true),lxl=dv.getUint16(lo+28,true),start=lo+30+lnl+lxl;
    out.push({name,method,data:buf.subarray(start,start+cs)});p+=46+nl+xl+cl;}
  return out;}
async function zipRead(ent){return ent.method===0?ent.data:await inflateRaw(ent.data);}
async function importZip(buf,name){
  const ents=zipEntries(buf),pages=ents.filter(e=>/\.fpage$/i.test(e.name));
  if(pages.length){const xml=new TextDecoder().decode(await zipRead(pages[0]));const v=parseXPSPage(xml);v.note=pages.length>1?'O arquivo tem '+pages.length+' folhas; importando a primeira.':'';return vectorImportDialog(v,name,'DWFx');}
  if(ents.some(e=>/\.w2d$/i.test(e.name)))throw new Error('DWF clássico (W2D) não é suportado no navegador. Exporte como DWFx, PDF ou DXF no programa de origem.');
  const dxf=ents.find(e=>/\.dxf$/i.test(e.name));if(dxf){const cad=parseDXF(new TextDecoder().decode(await zipRead(dxf)));return cadImportDialog(cad,dxf.name);}
  const dwg=ents.find(e=>/\.dwg$/i.test(e.name));if(dwg){busy('Lendo DWG…');const cad=await parseDWG(await zipRead(dwg));unbusy();return cadImportDialog(cad,dwg.name);}
  throw new Error('ZIP sem desenho reconhecível (DWFx, DXF ou DWG).');
}

/* ---------- DXF (ASCII) ---------- */
function parseDXF(text){
  const L=text.split(/\r\n|\r|\n/),G=[];for(let i=0;i+1<L.length;i+=2){const c=parseInt(L[i],10);if(isNaN(c))continue;G.push([c,L[i+1]]);}
  const cad={entities:[],blocks:new Map(),layers:{},insunits:0};let i=0;
  const f=v=>parseFloat(v),R=D2R;
  const readEntity=()=>{const type=G[i][1].trim();i++;const e={type,layer:'0',_g:[]};while(i<G.length&&G[i][0]!==0){e._g.push(G[i]);i++;}return e;};
  const fin=e=>{const g=e._g,get=(c,d)=>{const x=g.find(p=>p[0]===c);return x?x[1]:d;},n=(c,d=0)=>{const v=get(c);return v==null?d:f(v);};
    e.layer=(get(8,'0')||'0').trim();e.colorIndex=n(62,256);
    switch(e.type){
      case 'LINE':e.startPoint={x:n(10),y:n(20)};e.endPoint={x:n(11),y:n(21)};break;
      case 'CIRCLE':e.center={x:n(10),y:n(20)};e.radius=n(40);break;
      case 'ARC':e.center={x:n(10),y:n(20)};e.radius=n(40);e.startAngle=n(50)*R;e.endAngle=n(51)*R;break;
      case 'LWPOLYLINE':{e.flag=n(70);e.vertices=[];let v=null;for(const[c,val]of g){if(c===10){v={x:f(val),y:0,bulge:0};e.vertices.push(v);}else if(c===20&&v)v.y=f(val);else if(c===42&&v)v.bulge=f(val);}break;}
      case 'POLYLINE':e.flag=n(70);e.vertices=[];break;
      case 'VERTEX':e.x=n(10);e.y=n(20);e.bulge=n(42);e.vflag=n(70);break;
      case 'TEXT':{e.text=get(1,'');e.textHeight=n(40,1);e.rotation=n(50)*R;const h=n(72),v=n(73);e.startPoint={x:n(10),y:n(20)};e.endPoint=(h||v)?{x:n(11),y:n(21)}:null;e.halign=h;e.valign=v;break;}
      case 'MTEXT':{e.text=g.filter(p=>p[0]===3).map(p=>p[1]).join('')+get(1,'');e.textHeight=n(40,1);e.insertionPoint={x:n(10),y:n(20)};const dx=get(11);e.rotation=dx!=null?Math.atan2(n(21),n(11)):n(50)*R;e.attachmentPoint=n(71,1);break;}
      case 'INSERT':e.name=get(2,'');e.insertionPoint={x:n(10),y:n(20)};e.xScale=n(41,1);e.yScale=n(42,1);e.rotation=n(50)*R;e.columnCount=n(70,1);e.rowCount=n(71,1);e.columnSpacing=n(44);e.rowSpacing=n(45);break;
      case 'DIMENSION':e.name=get(2,'');e.definitionPoint={x:n(10),y:n(20)};if(get(13)!=null){e.subDefinitionPoint1={x:n(13),y:n(23)};e.subDefinitionPoint2={x:n(14),y:n(24)};}e.dimensionType=n(70);e.rotationAngle=n(50)*R;e.text=get(1,'');break;
      case 'ELLIPSE':e.center={x:n(10),y:n(20)};e.majorAxisEndPoint={x:n(11),y:n(21)};e.axisRatio=n(40,1);e.startAngle=n(41,0);e.endAngle=n(42,2*Math.PI);break;
      case 'SPLINE':{e.degree=n(71,3);e.flag=n(70);e.knots=g.filter(p=>p[0]===40).map(p=>f(p[1]));e.controlPoints=[];e.fitPoints=[];let cp_=null,fp=null;
        for(const[c,val]of g){if(c===10){cp_={x:f(val),y:0};e.controlPoints.push(cp_);}else if(c===20&&cp_)cp_.y=f(val);else if(c===11){fp={x:f(val),y:0};e.fitPoints.push(fp);}else if(c===21&&fp)fp.y=f(val);}break;}
      case 'SOLID':case 'TRACE':e.corner1={x:n(10),y:n(20)};e.corner2={x:n(11),y:n(21)};e.corner3={x:n(12),y:n(22)};e.corner4={x:n(13,n(12)),y:n(23,n(22))};break;
    }
    delete e._g;return e;};
  const readList=(endTok,target)=>{let poly=null;
    while(i<G.length){const[c,v]=G[i];if(c!==0){i++;continue;}const t=v.trim();if(t===endTok||t==='ENDSEC'||t==='ENDBLK')return;
      const e=fin(readEntity());
      if(e.type==='POLYLINE'){poly=e;target.push(e);}else if(e.type==='VERTEX'){if(poly&&!(e.vflag&16)&&!(e.vflag&128))poly.vertices.push({x:e.x,y:e.y,bulge:e.bulge});}
      else if(e.type==='SEQEND')poly=null;else target.push(e);}};
  while(i<G.length){const[c,v]=G[i];
    if(c===0&&v.trim()==='SECTION'){const name=(G[i+1]||[])[1].trim();i+=2;
      if(name==='HEADER'){while(i<G.length&&!(G[i][0]===0&&G[i][1].trim()==='ENDSEC')){if(G[i][0]===9&&G[i][1].trim()==='$INSUNITS'&&G[i+1])cad.insunits=parseInt(G[i+1][1],10)||0;i++;}}
      else if(name==='TABLES'){while(i<G.length&&!(G[i][0]===0&&G[i][1].trim()==='ENDSEC')){if(G[i][0]===0&&G[i][1].trim()==='LAYER'){i++;let nm='0',col=7,fl=0;while(i<G.length&&G[i][0]!==0){if(G[i][0]===2)nm=G[i][1].trim();if(G[i][0]===62)col=parseInt(G[i][1],10);if(G[i][0]===70)fl=parseInt(G[i][1],10);i++;}cad.layers[nm]={colorIndex:col,off:col<0||(fl&1)};}else i++;}}
      else if(name==='BLOCKS'){while(i<G.length&&!(G[i][0]===0&&G[i][1].trim()==='ENDSEC')){if(G[i][0]===0&&G[i][1].trim()==='BLOCK'){i++;let nm='',bx=0,by=0;while(i<G.length&&G[i][0]!==0){if(G[i][0]===2)nm=G[i][1].trim();if(G[i][0]===10)bx=f(G[i][1]);if(G[i][0]===20)by=f(G[i][1]);i++;}const ents=[];readList('ENDBLK',ents);cad.blocks.set(nm,{base:{x:bx,y:by},entities:ents});if(i<G.length&&G[i][1].trim()==='ENDBLK'){i++;while(i<G.length&&G[i][0]!==0)i++;}}else i++;}}
      else if(name==='ENTITIES'){readList('ENDSEC',cad.entities);}
      else{while(i<G.length&&!(G[i][0]===0&&G[i][1].trim()==='ENDSEC'))i++;}
    }i++;}
  return cad;
}

/* ---------- DWG (LibreDWG em WebAssembly) ---------- */
let LDWG=null;
async function parseDWG(buf){
  if(!LDWG){let m;try{m=await import(CDN.libredwg);}catch(e){throw new Error('Não foi possível carregar o leitor de DWG. Abra o app pelo link (GitHub Pages) ou por um servidor local — abrindo o index.html direto da pasta o navegador bloqueia o leitor.');}LDWG={m,lib:await m.LibreDwg.create()};}
  const{m,lib}=LDWG,ab=buf.buffer.slice(buf.byteOffset,buf.byteOffset+buf.byteLength),d=lib.dwg_read_data(ab,m.Dwg_File_Type.DWG);
  if(d==null)throw new Error('O DWG não pôde ser lido (versão não suportada ou arquivo danificado).');
  const db=lib.convert(d);try{lib.dwg_free(d);}catch(e){}
  const cad={entities:db.entities||[],blocks:new Map(),layers:{},insunits:(db.header&&(db.header.INSUNITS??db.header.insunits))||0};
  for(const b of(db.tables&&db.tables.BLOCK_RECORD?db.tables.BLOCK_RECORD.entries:[]))cad.blocks.set(b.name,{base:b.basePoint||{x:0,y:0},entities:b.entities||[]});
  for(const l of(db.tables&&db.tables.LAYER?db.tables.LAYER.entries:[]))cad.layers[l.name]={colorIndex:l.colorIndex??7,off:(l.colorIndex<0)||l.off||l.frozen||((l.standardFlag||l.flag||0)&1)};
  return cad;
}

/* ---------- cores ACI ---------- */
function aciHex(i){
  i=Math.abs(i|0);const base={1:'#ff0000',2:'#ffff00',3:'#00ff00',4:'#00ffff',5:'#0000ff',6:'#ff00ff',7:'auto',8:'#808080',9:'#c0c0c0'};
  if(base[i])return base[i];if(i>=250&&i<=255){const v=Math.round(51+(i-250)*40.8);return'#'+[v,v,v].map(x=>x.toString(16).padStart(2,'0')).join('');}
  if(i<10||i>249)return'auto';const h=(Math.floor(i/10)-1)*15,d=i%10,vv=[1,1,.8,.8,.6,.6,.5,.5,.3,.3][d],ss=d%2?.5:1;
  const c=vv*ss,x=c*(1-Math.abs((h/60)%2-1)),m=vv-c;let[r,g,b]=h<60?[c,x,0]:h<120?[x,c,0]:h<180?[0,c,x]:h<240?[0,x,c]:h<300?[x,0,c]:[c,0,x];
  return'#'+[r,g,b].map(v=>Math.round((v+m)*255).toString(16).padStart(2,'0')).join('');
}

/* ---------- conversão de entidades CAD para objetos ---------- */
const mAff=(a,b)=>[a[0]*b[0]+a[2]*b[1],a[1]*b[0]+a[3]*b[1],a[0]*b[2]+a[2]*b[3],a[1]*b[2]+a[3]*b[3],a[0]*b[4]+a[2]*b[5]+a[4],a[1]*b[4]+a[3]*b[5]+a[5]];
const mApply=(m,p)=>P(m[0]*p.x+m[2]*p.y+m[4],m[1]*p.x+m[3]*p.y+m[5]);
const vx=p=>p?P(+p.x||0,+p.y||0):P(0,0);
function bulgePts(a,b,bulge){if(!bulge)return[];const th=4*Math.atan(bulge),c2=dist(a,b);if(c2<1e-12)return[];const r=c2/(2*Math.sin(Math.abs(th)/2)),m=mid(a,b),h=Math.sqrt(Math.max(0,r*r-c2*c2/4)),dir=norm(sub(b,a));
  const cen=add(m,mul(perp(dir),(bulge>0?1:-1)*(Math.abs(th)>Math.PI?-h:h)));const a0=angOf(sub(a,cen)),n=Math.max(2,Math.ceil(Math.abs(th)/(Math.PI/18))),out=[];
  for(let k=1;k<n;k++)out.push(add(cen,P(Math.cos(a0+th*k/n)*r,Math.sin(a0+th*k/n)*r)));return out;}
function bspline(ctrl,deg,knots){const n=ctrl.length;if(n<2)return ctrl;deg=Math.min(deg||3,n-1);
  if(!knots||knots.length!==n+deg+1){knots=[];for(let i=0;i<=n+deg;i++)knots.push(i<=deg?0:i>=n?n-deg:i-deg);}
  const out=[],t0=knots[deg],t1=knots[n],steps=Math.max(16,n*8);
  for(let s=0;s<=steps;s++){const t=t0+(t1-t0)*s/steps;let k=deg;while(k<n-1&&t>=knots[k+1])k++;const d=[];for(let j=0;j<=deg;j++)d.push({...ctrl[k-deg+j]});
    for(let r=1;r<=deg;r++)for(let j=deg;j>=r;j--){const i2=k-deg+j,den=knots[i2+deg-r+1]-knots[i2],al=den?(t-knots[i2])/den:0;d[j]={x:(1-al)*d[j-1].x+al*d[j].x,y:(1-al)*d[j-1].y+al*d[j].y};}
    out.push(P(d[deg].x,d[deg].y));}
  return out;}
function stripMText(s){return String(s||'').replace(/\\P/g,'\n').replace(/\\[ACFHQTWfhqtwacp][^;\\]*;/g,'').replace(/\\[LlOoKkNn]/g,'').replace(/\\S([^;]*);/g,'$1').replace(/\\~/g,' ').replace(/[{}]/g,'').replace(/\\\\/g,'\\');}
function cadToObjects(cad,k){
  const out=[],used=new Set(),stats={};const M0=[k,0,0,k,0,0];
  const lay=n=>{used.add(n||'0');return'cad:'+(n||'0');};
  const walk=(ents,M,depth,inhLayer)=>{if(depth>8)return;const det=M[0]*M[3]-M[1]*M[2],sc=Math.sqrt(Math.abs(det))||1;
    for(const e of ents){if(!e||e.isVisible===false)continue;let ln=e.layer||'0';if(ln==='0'&&inhLayer)ln=inhLayer;const L=cad.layers[ln];if(L&&L.off)continue;const layer=lay(ln);stats[e.type]=(stats[e.type]||0)+1;
      const T=p=>mApply(M,vx(p));
      switch(e.type){
        case 'LINE':out.push({type:'line',a:T(e.startPoint),b:T(e.endPoint),layer});break;
        case 'LWPOLYLINE':case 'POLYLINE':case 'POLYLINE2D':case 'POLYLINE3D':{const vs=(e.vertices||[]).map(v=>({p:vx(v.point||v),b:+v.bulge||0}));if(vs.length<2)break;const closed=!!(e.flag&1);const pts=[];
          for(let j=0;j<vs.length;j++){pts.push(vs[j].p);if(j<vs.length-1||closed){const nx=vs[(j+1)%vs.length];pts.push(...bulgePts(vs[j].p,nx.p,vs[j].b));}}
          const wp=pts.map(q=>mApply(M,q));if(wp.length===2&&!closed)out.push({type:'line',a:wp[0],b:wp[1],layer});else out.push({type:'polyline',pts:wp,closed,layer});break;}
        case 'CIRCLE':if(Math.abs(Math.abs(M[0]*M[0]+M[1]*M[1])-Math.abs(M[2]*M[2]+M[3]*M[3]))<1e-9*Math.max(1,sc*sc))out.push({type:'circle',c:T(e.center),r:(+e.radius||0)*sc,layer});else out.push({type:'polyline',pts:ellL(vx(e.center).x,vx(e.center).y,e.radius,e.radius,48).map(q=>mApply(M,q)),closed:true,layer});break;
        case 'ARC':{const c=vx(e.center),r=+e.radius||0,a0=+e.startAngle||0,a1=+e.endAngle||0;const pa=mApply(M,add(c,P(Math.cos(a0)*r,Math.sin(a0)*r))),pb=mApply(M,add(c,P(Math.cos(a1)*r,Math.sin(a1)*r))),C=T(e.center);
          let A0=angOf(sub(pa,C)),A1=angOf(sub(pb,C));if(det<0)[A0,A1]=[A1,A0];out.push({type:'arc',c:C,r:r*sc,a0:A0,a1:A1,layer});break;}
        case 'ELLIPSE':{const c=vx(e.center),ma=vx(e.majorAxisEndPoint),ra=len(ma),rb=ra*(+e.axisRatio||1),rot=angOf(ma);let t0=+e.startAngle||0,t1=+e.endAngle||2*Math.PI;if(t1<=t0)t1+=2*Math.PI;const n=Math.max(12,Math.ceil((t1-t0)/(Math.PI/24))),pts=[];
          for(let j=0;j<=n;j++){const t=t0+(t1-t0)*j/n;pts.push(mApply(M,add(c,rotV(P(Math.cos(t)*ra,Math.sin(t)*rb),rot))));}const closed=Math.abs(t1-t0-2*Math.PI)<1e-6;if(closed)pts.pop();out.push({type:'polyline',pts,closed,layer});break;}
        case 'SPLINE':{const fp=(e.fitPoints||[]).map(vx),cpts=(e.controlPoints||[]).map(vx);const pts=cpts.length>=2?bspline(cpts,e.degree,e.knots):fp;if(pts.length>=2)out.push({type:'polyline',pts:pts.map(q=>mApply(M,q)),closed:!!(e.flag&1),layer});break;}
        case 'TEXT':case 'MTEXT':case 'ATTRIB':{const txt=e.type==='MTEXT'?stripMText(e.text):String(e.text||'');if(!txt.trim())break;const p0=e.type==='MTEXT'?vx(e.insertionPoint):vx((e.halign||e.valign)&&e.endPoint?e.endPoint:e.startPoint||e.insertionPoint);
          const h=(+e.textHeight||1)*sc,rot=(+e.rotation||0)+angOf(P(M[0],M[1]));let p=mApply(M,p0);
          if(e.type==='MTEXT'){const lines=txt.split('\n').length,ap=e.attachmentPoint||1;const row=Math.floor((ap-1)/3);p=add(p,rotV(P(0,-(row===0?h:row===1?(lines*h*1.2)/2:0)),rot));}
          out.push({type:'text',p,text:txt,size:h,ang:rot,layer});break;}
        case 'SOLID':case 'TRACE':out.push({type:'polyline',pts:[e.corner1,e.corner2,e.corner4,e.corner3].map(T),closed:true,layer});break;
        case 'DIMENSION':{const dt=(e.dimensionType|0)&7;
          if(e.subDefinitionPoint1&&e.subDefinitionPoint2&&e.definitionPoint&&(dt===0||dt===1)){ // cota linear/alinhada -> cota editável
            let a=T(e.subDefinitionPoint1),b=T(e.subDefinitionPoint2);const d0=T(e.definitionPoint);
            if(dt===0){const ang=(+e.rotationAngle||0)+angOf(P(M[0],M[1])),u=P(Math.cos(ang),Math.sin(ang)),n=perp(u);b=sub(b,mul(n,dot(sub(b,a),n)));}
            if(dist(a,b)>1e-9){const nn=perp(norm(sub(b,a))),tx=String(e.text||'').trim();out.push({type:'dim',a,b,off:dot(sub(d0,a),nn),text:tx&&tx!=='<>'?stripMText(tx).replace('<>',fmt(dist(a,b))):''});break;}}
          const b=cad.blocks.get(e.name);if(b)walk(b.entities,M,depth+1,ln);break;}
        case 'INSERT':{const b=cad.blocks.get(e.name);if(!b)break;
          const ip=vx(e.insertionPoint),rot=+e.rotation||0,sx=+e.xScale||1,sy=+e.yScale||1,base=vx(b.base),cs=Math.cos(rot),sn=Math.sin(rot);
          const cols=Math.max(1,e.columnCount|0),rows=Math.max(1,e.rowCount|0);
          for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){const off=rotV(P(c*(+e.columnSpacing||0),r*(+e.rowSpacing||0)),rot);
            const Bm=[cs*sx,sn*sx,-sn*sy,cs*sy,ip.x+off.x,ip.y+off.y],Tm=[1,0,0,1,-base.x,-base.y];walk(b.entities,mAff(M,mAff(Bm,Tm)),depth+1,ln);}break;}
      }}};
  walk(cad.entities,M0,0,null);
  return{objs:out,layers:[...used],stats};
}
function guessUnits(cad){
  const map={1:['in',.0254],2:['ft',.3048],4:['mm',.001],5:['cm',.01],6:['m',1]};if(map[cad.insunits])return{u:map[cad.insunits][0],src:'arquivo'};
  const r=cadToObjects(cad,1);const b=docBBox(r.objs.map(o=>({...o,layer:'geral'})));if(!b)return{u:'m',src:'padrão'};const s=Math.max(b.x1-b.x0,b.y1-b.y0);
  return{u:s>1500?'mm':s>150?'cm':'m',src:'estimado pelo tamanho'};
}
const UNIT_K={mm:.001,cm:.01,m:1,in:.0254,ft:.3048};
function cadImportDialog(cad,fname){
  const g=guessUnits(cad),probe=cadToObjects(cad,1),total=probe.objs.length;
  if(!total)return modal('Arquivo sem geometria','<p>Não encontrei linhas, polilinhas, arcos ou textos no espaço do modelo de <b>'+esc(fname)+'</b>.</p>',[{label:'OK',primary:true}]);
  const types=Object.entries(probe.stats).sort((a,b)=>b[1]-a[1]).map(([k,v])=>k+': '+v).join(' · ');
  const html='<p><b>'+esc(fname)+'</b> — '+total+' elementos em '+probe.layers.length+' camadas.</p><p class="muted" style="font-size:12px">'+esc(types)+'</p>'+
    '<div class="grid2"><label>Unidade do desenho ('+g.src+')<select id="ciU">'+Object.entries({mm:'Milímetros',cm:'Centímetros',m:'Metros',in:'Polegadas',ft:'Pés'}).map(([k,t])=>'<option value="'+k+'"'+(k===g.u?' selected':'')+'>'+t+'</option>').join('')+'</select></label>'+
    '<label>Destino<select id="ciM"><option value="new"'+(doc.objects.length?'':' selected')+'>Novo projeto</option><option value="add"'+(doc.objects.length?' selected':'')+'>Inserir no projeto atual</option></select></label></div>'+
    '<p id="ciSz" class="muted"></p><div class="note">Linhas, polilinhas, arcos, círculos, elipses, splines, textos e blocos são importados com suas camadas. As cotas viram cotas editáveis.</div>'+'<label style="display:flex;gap:6px;align-items:center;margin-top:10px"><input type="checkbox" id="impConv" checked> <b>Converter automaticamente em elementos editáveis</b>&nbsp;(paredes, portas, janelas, ambientes)</label>';
  const upd=()=>{const k=UNIT_K[$('#ciU').value];const b=docBBox(probe.objs.map(o=>({...o,layer:'geral'})));if(b)$('#ciSz').textContent='Tamanho resultante: '+fmt((b.x1-b.x0)*k)+' × '+fmt((b.y1-b.y0)*k)+' m';};
  return modal('Importar desenho CAD',html,[{label:'Cancelar',value:null},{label:'Importar',primary:true,onClick:async()=>{
    const k=UNIT_K[$('#ciU').value],mode=$('#ciM').value,conv=$('#impConv').checked;const r=cadToObjects(cad,k);
    if(mode==='new'){await saveNow();loadDoc(newDoc(fname.replace(/\.[^.]+$/,'')),true);const names=(await store.all()).map(x=>x.name);let nm=doc.name;while(names.includes(nm))nm+=' (2)';doc.name=nm;$('#projName').value=nm;}
    for(const ln of r.layers){const id='cad:'+ln;if(!doc.layers.some(l=>l.id===id)){const L=cad.layers[ln];doc.layers.push({id,name:ln,color:L?aciHex(L.colorIndex):'auto',visible:true,locked:false});}}
    const before=new Set(doc.objects.map(o=>o.id));for(const o of r.objs)addObj(o);const added=doc.objects.filter(o=>!before.has(o.id));commit();zoomExtents();sel.clear();buildProps();if(conv)afterImportConvert(added);
    log('Importados '+r.objs.length+' elementos de '+fname+' ('+r.layers.length+' camadas).','res');return true;}}],body=>{$('#ciU').addEventListener('change',upd);upd();});
}

/* ---------- geometria vetorial de páginas (PDF, SVG, DWFx) ---------- */
// resultado comum: {paths:[{pts,closed}], texts:[{p,text,size,ang}], mmPerUnit, w, h}
function pathDataToPolys(d,M){ // sintaxe SVG/XPS: M L H V C S Q T A Z (abs/rel)
  const toks=String(d).replace(/F[01]/,'').match(/[MmLlHhVvCcSsQqTtAaZz]|-?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?/gi)||[];let i=0,cmd='',cur=P(0,0),start=P(0,0),lastC=null,lastQ=null;const polys=[];let pts=[];
  const nm=()=>parseFloat(toks[i++]);const push=p=>{pts.push(mApply(M,p));};const flush=cl=>{if(pts.length>=2)polys.push({pts,closed:!!cl});pts=[];};
  const cubic=(p0,p1,p2,p3)=>{for(let k=1;k<=8;k++){const t=k/8,u=1-t;push(P(u*u*u*p0.x+3*u*u*t*p1.x+3*u*t*t*p2.x+t*t*t*p3.x,u*u*u*p0.y+3*u*u*t*p1.y+3*u*t*t*p2.y+t*t*t*p3.y));}};
  const quad=(p0,p1,p2)=>{for(let k=1;k<=6;k++){const t=k/6,u=1-t;push(P(u*u*p0.x+2*u*t*p1.x+t*t*p2.x,u*u*p0.y+2*u*t*p1.y+t*t*p2.y));}};
  const arcTo=(p0,rx,ry,phi,fa,fs,p1)=>{if(!rx||!ry){push(p1);return;}const c=Math.cos(phi*D2R),s=Math.sin(phi*D2R),dx=(p0.x-p1.x)/2,dy=(p0.y-p1.y)/2,x1=c*dx+s*dy,y1=-s*dx+c*dy;rx=Math.abs(rx);ry=Math.abs(ry);const lam=x1*x1/(rx*rx)+y1*y1/(ry*ry);if(lam>1){rx*=Math.sqrt(lam);ry*=Math.sqrt(lam);}
    const sg=(fa===fs?-1:1),num_=rx*rx*ry*ry-rx*rx*y1*y1-ry*ry*x1*x1,co=sg*Math.sqrt(Math.max(0,num_/(rx*rx*y1*y1+ry*ry*x1*x1))),cx1=co*rx*y1/ry,cy1=-co*ry*x1/rx,cx=c*cx1-s*cy1+(p0.x+p1.x)/2,cy=s*cx1+c*cy1+(p0.y+p1.y)/2;
    const ang=(ux,uy,vx_,vy)=>Math.atan2(ux*vy-uy*vx_,ux*vx_+uy*vy);let t1=ang(1,0,(x1-cx1)/rx,(y1-cy1)/ry),dt=ang((x1-cx1)/rx,(y1-cy1)/ry,(-x1-cx1)/rx,(-y1-cy1)/ry);if(!fs&&dt>0)dt-=2*Math.PI;if(fs&&dt<0)dt+=2*Math.PI;
    const n=Math.max(4,Math.ceil(Math.abs(dt)/(Math.PI/16)));for(let k=1;k<=n;k++){const t=t1+dt*k/n;push(P(cx+rx*Math.cos(t)*c-ry*Math.sin(t)*s,cy+rx*Math.cos(t)*s+ry*Math.sin(t)*c));}};
  while(i<toks.length){if(/[a-z]/i.test(toks[i]))cmd=toks[i++];const rel=cmd===cmd.toLowerCase(),C=cmd.toUpperCase(),o=rel?cur:P(0,0);
    if(C==='Z'){if(pts.length){pts.push(mApply(M,start));flush(true);}cur=start;lastC=lastQ=null;if(i<toks.length&&!/[a-z]/i.test(toks[i]))cmd='L';continue;}
    if(i>=toks.length||/[a-z]/i.test(toks[i])){continue;}
    if(C==='M'){flush(false);cur=add(o,P(nm(),nm()));start=cur;push(cur);cmd=rel?'l':'L';}
    else if(C==='L'){cur=add(o,P(nm(),nm()));push(cur);}
    else if(C==='H'){cur=P((rel?cur.x:0)+nm(),cur.y);push(cur);}
    else if(C==='V'){cur=P(cur.x,(rel?cur.y:0)+nm());push(cur);}
    else if(C==='C'){const p1=add(o,P(nm(),nm())),p2=add(o,P(nm(),nm())),p3=add(o,P(nm(),nm()));cubic(cur,p1,p2,p3);lastC=p2;cur=p3;continue;}
    else if(C==='S'){const p1=lastC?sub(mul(cur,2),lastC):cur,p2=add(o,P(nm(),nm())),p3=add(o,P(nm(),nm()));cubic(cur,p1,p2,p3);lastC=p2;cur=p3;continue;}
    else if(C==='Q'){const p1=add(o,P(nm(),nm())),p2=add(o,P(nm(),nm()));quad(cur,p1,p2);lastQ=p1;cur=p2;continue;}
    else if(C==='T'){const p1=lastQ?sub(mul(cur,2),lastQ):cur,p2=add(o,P(nm(),nm()));quad(cur,p1,p2);lastQ=p1;cur=p2;continue;}
    else if(C==='A'){const rx=nm(),ry=nm(),ph=nm(),fa=nm(),fs=nm(),p1=add(o,P(nm(),nm()));arcTo(cur,rx,ry,ph,fa,fs,p1);cur=p1;}
    else i++;
    lastC=lastQ=null;}
  flush(false);return polys;
}
function parseTransformAttr(t){let M=[1,0,0,1,0,0];if(!t)return M;const re=/(matrix|translate|scale|rotate|skewX|skewY)\s*\(([^)]*)\)/g;let m;
  while((m=re.exec(t))){const a=m[2].split(/[\s,]+/).filter(Boolean).map(Number);let T=[1,0,0,1,0,0];
    if(m[1]==='matrix')T=a;else if(m[1]==='translate')T=[1,0,0,1,a[0]||0,a[1]||0];else if(m[1]==='scale')T=[a[0],0,0,a[1]??a[0],0,0];
    else if(m[1]==='rotate'){const r=(a[0]||0)*D2R,c=Math.cos(r),s=Math.sin(r);T=[c,s,-s,c,0,0];if(a.length>2)T=mAff(mAff([1,0,0,1,a[1],a[2]],T),[1,0,0,1,-a[1],-a[2]]);}
    else if(m[1]==='skewX')T=[1,0,Math.tan(a[0]*D2R),1,0,0];else T=[1,Math.tan(a[0]*D2R),0,1,0,0];M=mAff(M,T);}
  return M;}
function svgLen(v,def){if(v==null)return def;const m=String(v).match(/^\s*([\d.]+)\s*(mm|cm|in|pt|px|m)?/);if(!m)return def;const k={mm:1,cm:10,in:25.4,pt:25.4/72,px:25.4/96,m:1000}[m[2]||'px'];return parseFloat(m[1])*k;}
function parseSVGText(text){
  const docx=new DOMParser().parseFromString(text,'image/svg+xml'),svg=docx.documentElement;if(!svg||svg.nodeName.toLowerCase()!=='svg')throw new Error('SVG inválido.');
  const vb=(svg.getAttribute('viewBox')||'').split(/[\s,]+/).map(Number),wmm=svgLen(svg.getAttribute('width'),null);
  let mmPerUnit=25.4/96;if(vb.length===4&&wmm&&vb[2])mmPerUnit=wmm/vb[2];
  const res={paths:[],texts:[],mmPerUnit,scaleHint:parseInt(svg.getAttribute('data-escala'),10)||null};const nAttr=(el,a,d=0)=>{const v=parseFloat(el.getAttribute(a));return isFinite(v)?v:d;};
  const walk=(el,M)=>{for(const c of el.children){const tag=c.nodeName.replace(/^.*:/,'').toLowerCase();if(['defs','style','script','title','metadata','clippath','mask','pattern','symbol','marker'].includes(tag))continue;
    if(c.getAttribute('display')==='none'||c.getAttribute('visibility')==='hidden')continue;const Mc=mAff(M,parseTransformAttr(c.getAttribute('transform')));
    if(tag==='g'||tag==='a'||tag==='svg'){walk(c,Mc);continue;}
    if(tag==='line'){res.paths.push({pts:[mApply(Mc,P(nAttr(c,'x1'),nAttr(c,'y1'))),mApply(Mc,P(nAttr(c,'x2'),nAttr(c,'y2')))],closed:false});}
    else if(tag==='polyline'||tag==='polygon'){const v=(c.getAttribute('points')||'').trim().split(/[\s,]+/).map(Number),pts=[];for(let k=0;k+1<v.length;k+=2)pts.push(mApply(Mc,P(v[k],v[k+1])));if(pts.length>1)res.paths.push({pts,closed:tag==='polygon'});}
    else if(tag==='rect'){const x=nAttr(c,'x'),y=nAttr(c,'y'),w=nAttr(c,'width'),h=nAttr(c,'height');if(w>0&&h>0)res.paths.push({pts:rectPts(P(x,y),P(x+w,y+h)).map(q=>mApply(Mc,q)),closed:true});}
    else if(tag==='circle'||tag==='ellipse'){const cx=nAttr(c,'cx'),cy=nAttr(c,'cy'),rx=tag==='circle'?nAttr(c,'r'):nAttr(c,'rx'),ry=tag==='circle'?rx:nAttr(c,'ry');if(rx>0)res.paths.push({pts:ellL(cx,cy,rx,ry,40).map(q=>mApply(Mc,q)),closed:true});}
    else if(tag==='path'){res.paths.push(...pathDataToPolys(c.getAttribute('d')||'',Mc));}
    else if(tag==='text'){const ts_=[...c.children].filter(x=>x.nodeName.replace(/^.*:/,'').toLowerCase()==='tspan');const t=(ts_.length?ts_.map(x=>x.textContent).join('\n'):(c.textContent||'')).trim();if(t){const fs=nAttr(c,'font-size',parseFloat((c.getAttribute('style')||'').match(/font-size:\s*([\d.]+)/)?.[1])||12);const p=mApply(Mc,P(nAttr(c,'x'),nAttr(c,'y')));const a=mApply(Mc,P(nAttr(c,'x')+1,nAttr(c,'y')));res.texts.push({p,text:t,size:fs*Math.hypot(Mc[0],Mc[1]),ang:angOf(sub(a,p))});}}
  }};
  walk(svg,[1,0,0,1,0,0]);
  // SVG tem y para baixo: inverte
  res.paths.forEach(pa=>pa.pts=pa.pts.map(q=>P(q.x,-q.y)));res.texts.forEach(t=>{t.p=P(t.p.x,-t.p.y);t.ang=-t.ang;});
  return res;
}
function parseXPSPage(xml){
  const d=new DOMParser().parseFromString(xml,'application/xml'),res={paths:[],texts:[],mmPerUnit:25.4/96};
  const mt=s=>{if(!s||s[0]==='{')return[1,0,0,1,0,0];const a=s.split(/[\s,]+/).map(Number);return a.length===6&&a.every(isFinite)?a:[1,0,0,1,0,0];};
  const walk=(el,M)=>{for(const c of el.children){const tag=c.localName,Mc=mAff(M,mt(c.getAttribute('RenderTransform')));
    if(tag==='Canvas'){walk(c,Mc);continue;}
    if(tag==='Path'){let data=c.getAttribute('Data');if(!data){const pg=c.getElementsByTagName('PathGeometry')[0];data=pg&&pg.getAttribute('Figures');}if(data&&data[0]!=='{')res.paths.push(...pathDataToPolys(data,Mc));}
    else if(tag==='Glyphs'){const t=c.getAttribute('UnicodeString');if(t&&t[0]!=='{'){const p=mApply(Mc,P(+c.getAttribute('OriginX')||0,+c.getAttribute('OriginY')||0)),a=mApply(Mc,P((+c.getAttribute('OriginX')||0)+1,+c.getAttribute('OriginY')||0));res.texts.push({p,text:t,size:(+c.getAttribute('FontRenderingEmSize')||10)*Math.hypot(Mc[0],Mc[1]),ang:angOf(sub(a,p))});}}}};
  walk(d.documentElement,[1,0,0,1,0,0]);res.paths.forEach(pa=>pa.pts=pa.pts.map(q=>P(q.x,-q.y)));res.texts.forEach(t=>{t.p=P(t.p.x,-t.p.y);t.ang=-t.ang;});
  return res;
}

/* ---------- PDF (pdf.js) ---------- */
let PDFJS=null;
async function loadPdfjs(){if(PDFJS)return PDFJS;let m;try{m=await import(CDN.pdfjs);}catch(e){throw new Error('Não foi possível carregar o leitor de PDF. Abra o app pelo link (GitHub Pages) ou por um servidor local — abrindo o index.html direto da pasta o navegador bloqueia o leitor.');}m.GlobalWorkerOptions.workerSrc=CDN.pdfworker;PDFJS=m;return m;}
async function pdfPageVectors(page){
  const pj=PDFJS,ops=await page.getOperatorList(),O=pj.OPS,res={paths:[],texts:[],mmPerUnit:25.4/72};let M=[1,0,0,1,0,0];const stack=[];
  const paint=new Set([O.stroke,O.closeStroke,O.fill,O.eoFill,O.fillStroke,O.eoFillStroke,O.closeFillStroke,O.closeEOFillStroke].filter(x=>x!=null));
  for(let k=0;k<ops.fnArray.length;k++){const fn=ops.fnArray[k],a=ops.argsArray[k];
    if(fn===O.save)stack.push(M);else if(fn===O.restore)M=stack.pop()||[1,0,0,1,0,0];else if(fn===O.transform)M=mAff(M,a);
    else if(fn===O.paintFormXObjectBegin){stack.push(M);if(a&&a[0]&&a[0].length===6)M=mAff(M,a[0]);}else if(fn===O.paintFormXObjectEnd)M=stack.pop()||[1,0,0,1,0,0];
    else if(fn===O.constructPath){const op=a[0],data=a[1]&&a[1][0];if(!paint.has(op)||!data)continue;const closedPaint=op===O.closeStroke||op===O.closeFillStroke||op===O.closeEOFillStroke;
      let pts=[],cur=P(0,0),st=P(0,0);const fl=cl=>{if(pts.length>=2)res.paths.push({pts,closed:cl});pts=[];};
      for(let i=0;i<data.length;){const c=data[i++];
        if(c===0){fl(false);cur=P(data[i++],data[i++]);st=cur;pts.push(mApply(M,cur));}
        else if(c===1){cur=P(data[i++],data[i++]);pts.push(mApply(M,cur));}
        else if(c===2){const p1=P(data[i++],data[i++]),p2=P(data[i++],data[i++]),p3=P(data[i++],data[i++]);for(let s=1;s<=6;s++){const t=s/6,u=1-t;pts.push(mApply(M,P(u*u*u*cur.x+3*u*u*t*p1.x+3*u*t*t*p2.x+t*t*t*p3.x,u*u*u*cur.y+3*u*u*t*p1.y+3*u*t*t*p2.y+t*t*t*p3.y)));}cur=p3;}
        else if(c===3){const p1=P(data[i++],data[i++]),p2=P(data[i++],data[i++]);for(let s=1;s<=5;s++){const t=s/5,u=1-t;pts.push(mApply(M,P(u*u*cur.x+2*u*t*p1.x+t*t*p2.x,u*u*cur.y+2*u*t*p1.y+t*t*p2.y)));}cur=p2;}
        else if(c===4){if(pts.length)pts.push(mApply(M,st));fl(true);cur=st;}
        else break;}
      fl(closedPaint);}}
  const tc=await page.getTextContent();
  for(const it of tc.items){if(!it.str||!it.str.trim())continue;const t=it.transform,size=Math.hypot(t[2],t[3])||Math.hypot(t[0],t[1]);res.texts.push({p:P(t[4],t[5]),text:it.str,size,ang:Math.atan2(t[1],t[0])});}
  return res;
}
async function pdfImportDialog(buf,fname){
  busy('Lendo PDF…');let pj,pdf;try{pj=await loadPdfjs();pdf=await pj.getDocument({data:buf.slice()}).promise;}catch(e){unbusy();throw e;}unbusy();
  const n=pdf.numPages;
  const html='<p><b>'+esc(fname)+'</b> — '+n+' página(s).</p><div class="grid2"><label>Página<input id="ppN" type="number" min="1" max="'+n+'" value="1"></label>'+
    '<label>Importar como<select id="ppMode"><option value="vec">Desenho vetorial (linhas e textos)</option><option value="img">Imagem (para decalcar / Foto → desenho)</option></select></label>'+
    '<label>Escala da folha<select id="ppS">'+[1,10,20,25,50,75,100,125,200,250,500,1000].map(s=>'<option value="'+s+'"'+(s===100?' selected':'')+'>1:'+s+'</option>').join('')+'</select></label>'+
    '<label>Destino<select id="ppM"><option value="new"'+(doc.objects.length?'':' selected')+'>Novo projeto</option><option value="add"'+(doc.objects.length?' selected':'')+'>Inserir no projeto atual</option></select></label></div>'+
    '<label style="display:flex;gap:6px;align-items:center;margin-top:8px"><input type="checkbox" id="ppT" checked> Importar textos</label>'+'<label style="display:flex;gap:6px;align-items:center;margin-top:10px"><input type="checkbox" id="impConv" checked> <b>Converter automaticamente em elementos editáveis</b>&nbsp;(paredes, portas, janelas, ambientes)</label>'+
    '<div class="note">PDFs gerados por programas de CAD têm linhas vetoriais: escolha a escala em que a folha foi plotada (ex.: 1:50) para obter medidas reais. PDFs escaneados viram imagem.</div>';
  return modal('Importar PDF',html,[{label:'Cancelar',value:null},{label:'Importar',primary:true,onClick:async()=>{
    const pn=Math.min(n,Math.max(1,num($('#ppN').value)|0)),mode=$('#ppMode').value,sc=+$('#ppS').value,dest=$('#ppM').value,txt=$('#ppT').checked,conv=$('#impConv').checked;
    busy('Processando página '+pn+'…');try{const page=await pdf.getPage(pn);
      if(dest==='new'){await saveNow();loadDoc(newDoc(await uniqueNameFrom(fname)),true);}
      if(mode==='img'){const vp=page.getViewport({scale:Math.min(4,3000/Math.max(page.view[2],page.view[3]))}),c=document.createElement('canvas');c.width=vp.width;c.height=vp.height;await page.render({canvasContext:c.getContext('2d'),viewport:vp,canvas:c}).promise;
        const url=c.toDataURL('image/jpeg',.9),im=await new Promise(r=>{const i=new Image();i.onload=()=>r(i);i.src=url;});const wm=(page.view[2]-page.view[0])*25.4/72/1000*sc;unbusy();placeImage(im,url,0,{w:wm,p:P(0,0),opacity:.8,calibrated:true,fit:true,max:3000});return true;}
      const v=await pdfPageVectors(page);if(!txt)v.texts=[];unbusy();addVectorPage(v,sc,fname,conv);return true;}catch(e){unbusy();log('Falha ao ler o PDF: '+e.message,'err');return true;}}}]);
}
async function uniqueNameFrom(fname){const base=fname.replace(/\.[^.]+$/,'');const names=(await store.all()).map(x=>x.name);let nm=base;while(names.includes(nm))nm+=' (2)';return nm;}
function vectorImportDialog(v,fname,kind){
  if(!v.paths.length&&!v.texts.length)return modal('Arquivo sem geometria','<p>Não encontrei linhas em '+esc(fname)+'.</p>',[{label:'OK',primary:true}]);
  const html='<p><b>'+esc(fname)+'</b> — '+v.paths.length+' traços e '+v.texts.length+' textos.'+(v.note?' '+esc(v.note):'')+'</p><div class="grid2">'+
    '<label>Escala do desenho<select id="vS">'+[1,10,20,25,50,75,100,125,200,250,500,1000].map(s=>'<option value="'+s+'"'+(s===(v.scaleHint||(kind==='SVG'?1:100))?' selected':'')+'>1:'+s+'</option>').join('')+'</select></label>'+
    '<label>Destino<select id="vM"><option value="new"'+(doc.objects.length?'':' selected')+'>Novo projeto</option><option value="add"'+(doc.objects.length?' selected':'')+'>Inserir no projeto atual</option></select></label></div><p id="vSz" class="muted"></p>'+'<label style="display:flex;gap:6px;align-items:center;margin-top:10px"><input type="checkbox" id="impConv" checked> <b>Converter automaticamente em elementos editáveis</b>&nbsp;(paredes, portas, janelas, ambientes)</label>';
  const upd=()=>{const k=v.mmPerUnit/1000*(+$('#vS').value);let x0=Infinity,y0=Infinity,x1=-Infinity,y1=-Infinity;for(const pa of v.paths)for(const q of pa.pts){x0=Math.min(x0,q.x);y0=Math.min(y0,q.y);x1=Math.max(x1,q.x);y1=Math.max(y1,q.y);}if(isFinite(x0))$('#vSz').textContent='Tamanho resultante: '+fmt((x1-x0)*k)+' × '+fmt((y1-y0)*k)+' m';};
  return modal('Importar '+kind,html,[{label:'Cancelar',value:null},{label:'Importar',primary:true,onClick:async()=>{const sc=+$('#vS').value,conv=$('#impConv').checked;if($('#vM').value==='new'){await saveNow();loadDoc(newDoc(await uniqueNameFrom(fname)),true);}addVectorPage(v,sc,fname,conv);return true;}}],body=>{$('#vS').addEventListener('change',upd);upd();});
}
function addVectorPage(v,scale,fname,conv){
  const before=new Set(doc.objects.map(o=>o.id));
  const k=v.mmPerUnit/1000*scale,lid='imp:'+fname.replace(/\.[^.]+$/,'').slice(0,30);
  if(!doc.layers.some(l=>l.id===lid))doc.layers.push({id:lid,name:fname.replace(/\.[^.]+$/,'').slice(0,30),color:'auto',visible:true,locked:false});
  let x0=Infinity,y0=Infinity;for(const pa of v.paths)for(const q of pa.pts){x0=Math.min(x0,q.x);y0=Math.min(y0,q.y);}if(!isFinite(x0)){x0=0;y0=0;}
  const T=q=>P((q.x-x0)*k,(q.y-y0)*k);let n=0;
  for(const pa of v.paths){const pts=pa.pts.map(T).filter((q,i,a)=>!i||dist(q,a[i-1])>1e-6);if(pts.length<2)continue;if(pa.closed&&pts.length>2&&dist(pts[0],pts[pts.length-1])<1e-6)pts.pop();
    if(pts.length===2&&!pa.closed)addObj({type:'line',a:pts[0],b:pts[1],layer:lid});else addObj({type:'polyline',pts,closed:pa.closed&&pts.length>2,layer:lid});n++;}
  for(const t of v.texts){addObj({type:'text',p:T(t.p),text:t.text,size:Math.max(.01,t.size*k),ang:t.ang,layer:lid});n++;}
  commit();zoomExtents();log('Importados '+n+' elementos de '+fname+' (escala 1:'+scale+'). Confira uma medida conhecida com DI; se precisar, use Escala (ESC).','res');
  if(conv)afterImportConvert(doc.objects.filter(o=>!before.has(o.id)));
}

// conversão automática logo após importar (pode ser desfeita com Ctrl+Z ou pelo botão do relatório)
function afterImportConvert(added){const rep=convertDrawing(added);if(rep.walls||rep.rooms){commit();setTimeout(()=>convertReport(rep,true),0);}else setTimeout(()=>convertReport(rep,false),0);}
