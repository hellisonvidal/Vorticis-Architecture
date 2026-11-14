'use strict';
/* =========================================================================
   Exportação: PNG, SVG, DXF, PDF (prancha), IFC (BIM), OBJ (3D), JSON
   ========================================================================= */
function renderToCanvas(maxPx){
  const b=docBBox();if(!b)return null;const pad=Math.max(b.x1-b.x0,b.y1-b.y0)*.05+.5;const x0=b.x0-pad,y0=b.y0-pad,w=b.x1-b.x0+2*pad,h=b.y1-b.y0+2*pad;
  const s=Math.min(maxPx/w,maxPx/h,200);const c=document.createElement('canvas');c.width=Math.ceil(w*s);c.height=Math.ceil(h*s);const g=c.getContext('2d');
  const R={bg:'#ffffff',fg:'#111111',wallFill:'#4a5059',s,export:true,lwk:Math.max(1,c.width/1600)};
  g.fillStyle='#fff';g.fillRect(0,0,c.width,c.height);g.setTransform(s,0,0,-s,-x0*s,(y0+h)*s);drawScene(g,R,doc.objects);return{c,s};
}
async function exportPNG(){const r=renderToCanvas(3200);if(!r)return log('Nada para exportar.','err');r.c.toBlob(b=>download(doc.name+'.png',b));log('PNG exportado ('+r.c.width+'×'+r.c.height+' px).','res');}
function exportSVG(){
  const b=docBBox();if(!b)return log('Nada para exportar.','err');const pad=Math.max(b.x1-b.x0,b.y1-b.y0)*.05+.5;const x0=b.x0-pad,y0=b.y0-pad,w=b.x1-b.x0+2*pad,h=b.y1-b.y0+2*pad,pxw=1600,k=pxw/w;
  const R={bg:'#ffffff',fg:'#111111',wallFill:'#4a5059'};const nf=v=>+v.toFixed(4);
  const out=['<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" data-escala="100" width="'+nf(w*10)+'mm" height="'+nf(h*10)+'mm" viewBox="'+nf(x0)+' '+nf(-(y0+h))+' '+nf(w)+' '+nf(h)+'"><rect x="'+nf(x0)+'" y="'+nf(-(y0+h))+'" width="'+nf(w)+'" height="'+nf(h)+'" fill="#fff"/><g transform="scale(1,-1)" stroke-linecap="round" stroke-linejoin="round">'];
  const st=(pr,L)=>{const s=colorOf(pr.stroke,L,R),f=colorOf(pr.fill,L,R);return' fill="'+(f||'none')+'"'+(f&&pr.fillAlpha!=null?' fill-opacity="'+pr.fillAlpha+'"':'')+(s?' stroke="'+s+'" stroke-width="'+nf((pr.lw||1)/k*1.2)+'"'+(pr.dash?' stroke-dasharray="'+pr.dash.map(v=>nf(v/k*1.5)).join(' ')+'"':''):'');};
  const prim=(pr,L)=>{
    if(pr.k==='poly')return'<'+(pr.closed?'polygon':'polyline')+' points="'+pr.pts.map(p=>nf(p.x)+','+nf(p.y)).join(' ')+'"'+st(pr,L)+'/>';
    if(pr.k==='circle')return'<circle cx="'+nf(pr.c.x)+'" cy="'+nf(pr.c.y)+'" r="'+nf(pr.r)+'"'+st(pr,L)+'/>';
    if(pr.k==='arc'){const p0=add(pr.c,P(Math.cos(pr.a0)*pr.r,Math.sin(pr.a0)*pr.r)),p1=add(pr.c,P(Math.cos(pr.a1)*pr.r,Math.sin(pr.a1)*pr.r));return'<path d="M'+nf(p0.x)+' '+nf(p0.y)+' A'+nf(pr.r)+' '+nf(pr.r)+' 0 0 '+(pr.ccw?1:0)+' '+nf(p1.x)+' '+nf(p1.y)+'"'+st({...pr,fill:null},L)+'/>';}
    if(pr.k==='text'){const lines=String(pr.text).split('\n'),n=lines.length,lh=pr.size*1.2;return'<g transform="translate('+nf(pr.p.x)+' '+nf(pr.p.y)+') rotate('+nf((pr.ang||0)*R2D)+') scale(1,-1)"><text font-family="Arial,sans-serif" font-size="'+nf(pr.size)+'"'+(pr.bold?' font-weight="600"':'')+' fill="'+colorOf(pr.color,L,R)+'" text-anchor="'+(pr.align==='center'?'middle':'start')+'" dominant-baseline="middle">'+lines.map((t,i)=>'<tspan x="0" y="'+nf(pr.base==='middle'?(i-(n-1)/2)*lh:-(n-1-i)*lh-pr.size*.45)+'">'+esc(t)+'</tspan>').join('')+'</text></g>';}
    if(pr.k==='image'){const src=doc.images[pr.img];if(!src)return'';return'<g transform="translate('+nf(pr.p.x)+' '+nf(pr.p.y)+') rotate('+nf((pr.rot||0)*R2D)+')'+(pr.flip?' scale(-1,1)':'')+' scale(1,-1)"><image href="'+src+'" x="0" y="'+nf(-pr.h)+'" width="'+nf(pr.w)+'" height="'+nf(pr.h)+'" opacity="'+pr.opacity+'" preserveAspectRatio="none"/></g>';}
    return'';};
  const objs=doc.objects.filter(o=>getLayer(o.layer).visible!==false).sort((a,b)=>ORDER[a.type]-ORDER[b.type]);
  for(const o of objs){if(o.type==='wall')continue;if(ORDER[o.type]<5){const L=getLayer(o.layer).color;prims(o).forEach(pr=>out.push(prim(pr,L)));}}
  const walls=objs.filter(o=>o.type==='wall');
  walls.forEach(w=>out.push('<polygon points="'+wallPoly(w).map(p=>nf(p.x)+','+nf(p.y)).join(' ')+'" fill="none" stroke="'+colorOf('L',getLayer(w.layer).color,R)+'" stroke-width="'+nf(3/k)+'"/>'));
  walls.forEach(w=>out.push('<polygon points="'+wallPoly(w).map(p=>nf(p.x)+','+nf(p.y)).join(' ')+'" fill="'+R.wallFill+'"/>'));
  for(const o of objs){if(ORDER[o.type]>5){const L=getLayer(o.layer).color;prims(o).forEach(pr=>out.push(prim(pr,L)));}}
  out.push('</g></svg>');download(doc.name+'.svg',new Blob([out.join('\n')],{type:'image/svg+xml'}));log('SVG exportado.','res');
}
function exportDXF(){
  if(!doc.objects.length)return log('Nada para exportar.','err');
  const ACI=[[1,255,0,0],[2,255,255,0],[3,0,255,0],[4,0,255,255],[5,0,0,255],[6,255,0,255],[7,255,255,255],[8,128,128,128],[9,192,192,192],[30,255,127,0],[40,255,191,0],[150,0,127,255],[200,191,127,255]];
  const aci=hex=>{if(!hex||hex==='auto')return 7;const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16);let best=7,bd=Infinity;ACI.forEach(([i,R,G,B])=>{const d=(r-R)**2+(g-G)**2+(b-B)**2;if(d<bd){bd=d;best=i;}});return best;};
  const lname=id=>getLayer(id).name.normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^A-Za-z0-9_-]/g,'_').toUpperCase()||'0';
  const o=[],w=(c,v)=>{o.push(String(c));o.push(typeof v==='number'?(+v.toFixed(6)).toString():String(v));};
  w(0,'SECTION');w(2,'HEADER');w(9,'$ACADVER');w(1,'AC1009');w(9,'$INSUNITS');w(70,6);w(0,'ENDSEC');
  w(0,'SECTION');w(2,'TABLES');w(0,'TABLE');w(2,'LAYER');w(70,doc.layers.length);
  doc.layers.forEach(l=>{w(0,'LAYER');w(2,lname(l.id));w(70,0);w(62,aci(l.color));w(6,'CONTINUOUS');});
  w(0,'ENDTAB');w(0,'ENDSEC');w(0,'SECTION');w(2,'ENTITIES');
  const line=(L,a,b)=>{w(0,'LINE');w(8,L);w(10,a.x);w(20,a.y);w(30,0);w(11,b.x);w(21,b.y);w(31,0);};
  const ascii=s=>String(s).normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/²/g,'2').replace(/[^\x20-\x7e]/g,'?');
  for(const ob of doc.objects){if(getLayer(ob.layer).visible===false||ob.type==='image')continue;const L=lname(ob.layer);
    for(const pr of prims(ob)){
      if(pr.k==='poly'){const n=pr.pts.length;for(let i=0;i<n-(pr.closed?0:1);i++)line(L,pr.pts[i],pr.pts[(i+1)%n]);}
      else if(pr.k==='circle'){w(0,'CIRCLE');w(8,L);w(10,pr.c.x);w(20,pr.c.y);w(30,0);w(40,pr.r);}
      else if(pr.k==='arc'){const a0=(pr.ccw?pr.a0:pr.a1)*R2D,a1=(pr.ccw?pr.a1:pr.a0)*R2D;w(0,'ARC');w(8,L);w(10,pr.c.x);w(20,pr.c.y);w(30,0);w(40,pr.r);w(50,(a0+360)%360);w(51,(a1+360)%360);}
      else if(pr.k==='text'){const lines=String(pr.text).split('\n'),n=lines.length,lh=pr.size*1.2;lines.forEach((t,i)=>{const dy=pr.base==='middle'?-(i-(n-1)/2)*lh:(n-1-i)*lh;const p=add(pr.p,rotV(P(0,dy),pr.ang||0));w(0,'TEXT');w(8,L);w(10,p.x);w(20,p.y);w(30,0);w(40,pr.size);w(1,ascii(t));w(50,(pr.ang||0)*R2D);if(pr.align==='center'||pr.base==='middle'){w(72,pr.align==='center'?1:0);w(11,p.x);w(21,p.y);w(31,0);w(73,pr.base==='middle'?2:1);}});}
    }}
  w(0,'ENDSEC');w(0,'EOF');
  download(doc.name+'.dxf',new Blob([o.join('\r\n')+'\r\n'],{type:'application/dxf'}));log('DXF exportado (abre no AutoCAD, LibreCAD, DraftSight etc.).','res');
}
function exportJSON(){prune();download(doc.name+'.vorticis.json',new Blob([JSON.stringify(doc)],{type:'application/json'}));log('Backup JSON exportado.','res');}
function printPlan(){const r=renderToCanvas(2400);if(!r)return log('Nada para imprimir.','err');const pa=$('#printArea');pa.innerHTML='<h2 style="font:600 16pt Arial;margin:0 0 4mm">'+esc(doc.name)+'</h2><img alt="Planta"><p style="font:9pt Arial">Vorticis Architecture · '+new Date().toLocaleDateString('pt-BR')+' · unidades em metros</p>';const img=pa.querySelector('img');img.onload=()=>setTimeout(()=>window.print(),50);img.src=r.c.toDataURL('image/png');}

/* ---------- ZIP (escrita, sem compressão) ---------- */
const CRC_T=(()=>{const t=new Uint32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xedb88320^(c>>>1):c>>>1;t[n]=c>>>0;}return t;})();
function crc32(u8){let c=0xffffffff;for(let i=0;i<u8.length;i++)c=CRC_T[(c^u8[i])&255]^(c>>>8);return(c^0xffffffff)>>>0;}
function makeZip(files){ // files: [{name, data:Uint8Array|string}]
  const enc=new TextEncoder(),parts=[],central=[];let off=0;
  for(const f of files){const name=enc.encode(f.name),data=typeof f.data==='string'?enc.encode(f.data):f.data,crc=crc32(data);
    const h=new DataView(new ArrayBuffer(30));h.setUint32(0,0x04034b50,true);h.setUint16(4,20,true);h.setUint16(6,0x0800,true);h.setUint16(8,0,true);h.setUint32(14,crc,true);h.setUint32(18,data.length,true);h.setUint32(22,data.length,true);h.setUint16(26,name.length,true);
    parts.push(new Uint8Array(h.buffer),name,data);
    const c=new DataView(new ArrayBuffer(46));c.setUint32(0,0x02014b50,true);c.setUint16(4,20,true);c.setUint16(6,20,true);c.setUint16(8,0x0800,true);c.setUint32(16,crc,true);c.setUint32(20,data.length,true);c.setUint32(24,data.length,true);c.setUint16(28,name.length,true);c.setUint32(42,off,true);
    central.push(new Uint8Array(c.buffer),name);off+=30+name.length+data.length;}
  const csz=central.reduce((s,a)=>s+a.length,0),e=new DataView(new ArrayBuffer(22));e.setUint32(0,0x06054b50,true);e.setUint16(8,files.length,true);e.setUint16(10,files.length,true);e.setUint32(12,csz,true);e.setUint32(16,off,true);
  return new Blob([...parts,...central,new Uint8Array(e.buffer)],{type:'application/zip'});
}

/* ---------- OBJ + MTL (modelo 3D) ---------- */
function exportOBJ(){
  const m=buildModel();if(!Object.values(m.g).some(b=>b.v.length))return log('Nada em 3D para exportar (desenhe paredes, ambientes, telhado…).','err');
  const base=doc.name.replace(/[^\w\- ]+/g,'_')||'modelo',o=['# Vorticis Architecture — '+doc.name,'# Unidades: metros, Y para cima','mtllib '+base+'.mtl'],mtl=['# Materiais Vorticis Architecture'];let vi=1;const used=new Set();
  for(const k in m.g){const b=m.g[k];if(!b.v.length)continue;used.add(b.mat);o.push('o '+(b.grp==='roof'?'Telhado':b.grp==='site'?'Terreno':'Edificacao')+'_'+b.mat,'usemtl '+b.mat);
    for(let i=0;i<b.v.length;i+=3)o.push('v '+b.v[i].toFixed(4)+' '+b.v[i+2].toFixed(4)+' '+(-b.v[i+1]).toFixed(4));
    for(let i=0;i<b.v.length/9;i++){o.push('f '+vi+' '+(vi+1)+' '+(vi+2));vi+=3;}}
  for(const k of used){const[c,op]=MAT3[k]||['#cccccc',1],rgb=[1,3,5].map(i=>(parseInt(c.slice(i,i+2),16)/255).toFixed(3)).join(' ');mtl.push('newmtl '+k,'Kd '+rgb,'Ka 0 0 0','Ks 0.05 0.05 0.05','d '+op,'illum 2','');}
  download(base+' (OBJ).zip',makeZip([{name:base+'.obj',data:o.join('\n')},{name:base+'.mtl',data:mtl.join('\n')}]));
  log('Modelo 3D exportado em OBJ+MTL ('+(vi-1)/3+' triângulos). Abre no SketchUp, Blender, Lumion, 3ds Max.','res');
}

/* ---------- IFC 4 (BIM) ---------- */
function ifcGuid(){const c='0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz_$';let s=c[Math.floor(Math.random()*4)];for(let i=0;i<21;i++)s+=c[Math.floor(Math.random()*64)];return s;}
function ifcStr(s){return"'"+String(s??'').replace(/\\/g,'\\\\').replace(/'/g,"''").replace(/[^\x20-\x7e]/g,ch=>'\\X2\\'+ch.charCodeAt(0).toString(16).toUpperCase().padStart(4,'0')+'\\X0\\')+"'";}
const ifcN=x=>{const s=(Math.round(x*1e6)/1e6).toString();return/[.eE]/.test(s)?s:s+'.';};
function exportIFC(){
  const L=[],add_=e=>{L.push(e);return'#'+L.length;},s=S(),vis=o=>getLayer(o.layer).visible!==false;
  const pt3=(x,y,z)=>add_('IFCCARTESIANPOINT(('+ifcN(x)+','+ifcN(y)+','+ifcN(z)+'))'),pt2=(x,y)=>add_('IFCCARTESIANPOINT(('+ifcN(x)+','+ifcN(y)+'))'),dir3=(x,y,z)=>add_('IFCDIRECTION(('+ifcN(x)+','+ifcN(y)+','+ifcN(z)+'))');
  const ax3=(p,z,x)=>add_('IFCAXIS2PLACEMENT3D('+p+','+(z||'$')+','+(x||'$')+')'),place=(rel,ax)=>add_('IFCLOCALPLACEMENT('+(rel||'$')+','+ax+')');
  const o0=pt3(0,0,0),Z=dir3(0,0,1),X=dir3(1,0,0),wcs=ax3(o0,Z,X);
  const ctx=add_('IFCGEOMETRICREPRESENTATIONCONTEXT($,\'Model\',3,1.E-05,'+wcs+',$)'),body=add_('IFCGEOMETRICREPRESENTATIONSUBCONTEXT(\'Body\',\'Model\',*,*,*,*,'+ctx+',$,.MODEL_VIEW.,$)');
  const u1=add_('IFCSIUNIT(*,.LENGTHUNIT.,$,.METRE.)'),u2=add_('IFCSIUNIT(*,.AREAUNIT.,$,.SQUARE_METRE.)'),u3=add_('IFCSIUNIT(*,.VOLUMEUNIT.,$,.CUBIC_METRE.)'),u4=add_('IFCSIUNIT(*,.PLANEANGLEUNIT.,$,.RADIAN.)');
  const units=add_('IFCUNITASSIGNMENT(('+[u1,u2,u3,u4].join(',')+'))');
  const proj=add_('IFCPROJECT(\''+ifcGuid()+'\',$,'+ifcStr(doc.name)+',$,$,$,$,('+ctx+'),'+units+')');
  const sitePl=place(null,ax3(o0)),site=add_('IFCSITE(\''+ifcGuid()+'\',$,\'Terreno\',$,$,'+sitePl+',$,$,.ELEMENT.,$,$,$,$,$)');
  const bldPl=place(sitePl,ax3(o0)),bld=add_('IFCBUILDING(\''+ifcGuid()+'\',$,'+ifcStr(doc.name)+',$,$,'+bldPl+',$,$,.ELEMENT.,$,$,$)');
  const stPl=place(bldPl,ax3(o0)),storey=add_('IFCBUILDINGSTOREY(\''+ifcGuid()+'\',$,\'Térreo\',$,$,'+stPl+',$,$,.ELEMENT.,0.)');
  add_('IFCRELAGGREGATES(\''+ifcGuid()+'\',$,$,$,'+proj+',('+site+'))');add_('IFCRELAGGREGATES(\''+ifcGuid()+'\',$,$,$,'+site+',('+bld+'))');add_('IFCRELAGGREGATES(\''+ifcGuid()+'\',$,$,$,'+bld+',('+storey+'))');
  const shape=(items,type)=>add_('IFCPRODUCTDEFINITIONSHAPE($,$,('+add_('IFCSHAPEREPRESENTATION('+body+',\'Body\',\''+type+'\',('+items.join(',')+'))')+'))');
  const rectSolid=(cx,cy,w,d,h,z0=0)=>{const prof=add_('IFCRECTANGLEPROFILEDEF(.AREA.,$,'+add_('IFCAXIS2PLACEMENT2D('+pt2(cx,cy)+',$)')+','+ifcN(w)+','+ifcN(d)+')');return add_('IFCEXTRUDEDAREASOLID('+prof+','+ax3(pt3(0,0,z0))+','+Z+','+ifcN(h)+')');};
  const polySolid=(pts,h,z0=0)=>{const pl=add_('IFCPOLYLINE(('+[...pts,pts[0]].map(q=>pt2(q.x,q.y)).join(',')+'))');const prof=add_('IFCARBITRARYCLOSEDPROFILEDEF(.AREA.,$,'+pl+')');return add_('IFCEXTRUDEDAREASOLID('+prof+','+ax3(pt3(0,0,z0))+','+Z+','+ifcN(h)+')');};
  const meshSolid=m=>{const pts=[],idx=[],key=new Map();for(const k in m.g){const v=m.g[k].v;for(let i=0;i<v.length;i+=9){const tri=[];for(let j=0;j<9;j+=3){const kk=v[i+j].toFixed(4)+','+v[i+j+1].toFixed(4)+','+v[i+j+2].toFixed(4);let n=key.get(kk);if(n==null){pts.push([v[i+j],v[i+j+1],v[i+j+2]]);n=pts.length;key.set(kk,n);}tri.push(n);}if(tri[0]!==tri[1]&&tri[1]!==tri[2]&&tri[0]!==tri[2])idx.push(tri);}}
    if(!idx.length)return null;const pl=add_('IFCCARTESIANPOINTLIST3D(('+pts.map(p=>'('+p.map(ifcN).join(',')+')').join(',')+'),$)');return add_('IFCTRIANGULATEDFACESET('+pl+',$,$,('+idx.map(t=>'('+t.join(',')+')').join(',')+'),$)');};
  const contained=[],spaces=[];let nW=0,nD=0,nJ=0,nS=0,nR=0,nF=0;
  for(const w of doc.objects.filter(o=>o.type==='wall'&&vis(o))){const{L:len_,u}=wallInfo(w),[ea,eb]=wallExt(w),H=w.h||s.wallH;if(len_<1e-3)continue;
    const wpl=place(stPl,ax3(pt3(w.a.x,w.a.y,0),Z,dir3(u.x,u.y,0)));const solid=rectSolid((len_+eb-ea)/2,0,len_+ea+eb,w.t,H);
    const wall=add_('IFCWALL(\''+ifcGuid()+'\',$,\'Parede\',$,$,'+wpl+','+shape([solid],'SweptSolid')+',$,.STANDARD.)');contained.push(wall);nW++;
    for(const op of openingsOf([w.id]).filter(vis)){const off=Math.max(op.w/2,Math.min(len_-op.w/2,op.off)),isD=op.type==='door',z0=isD?0:(op.sill??1),h=isD?Math.min(op.h||2.1,H):Math.min(op.h??1.2,H-z0);
      const opl=place(wpl,ax3(pt3(off,0,z0))),o_=add_('IFCOPENINGELEMENT(\''+ifcGuid()+'\',$,\'Abertura\',$,$,'+opl+','+shape([rectSolid(0,0,op.w,w.t+.1,h)],'SweptSolid')+',$,.OPENING.)');
      add_('IFCRELVOIDSELEMENT(\''+ifcGuid()+'\',$,$,$,'+wall+','+o_+')');
      const fpl=place(opl,ax3(pt3(0,0,0))),fsh=shape([rectSolid(0,0,op.w,isD?.04:.06,h)],'SweptSolid');
      const el=isD?add_('IFCDOOR(\''+ifcGuid()+'\',$,'+ifcStr('Porta '+(DOOR_KINDS[op.kind||'giro']||''))+',$,$,'+fpl+','+fsh+',$,'+ifcN(h)+','+ifcN(op.w)+',.DOOR.,'+(op.kind==='correr'?'.SLIDING_TO_LEFT.':op.kind==='dupla'?'.DOUBLE_DOOR_SINGLE_SWING.':'.SINGLE_SWING_LEFT.')+',$)')
        :add_('IFCWINDOW(\''+ifcGuid()+'\',$,'+ifcStr('Janela '+(WIN_KINDS[op.kind||'correr']||''))+',$,$,'+fpl+','+fsh+',$,'+ifcN(h)+','+ifcN(op.w)+',.WINDOW.,.SINGLE_PANEL.,$)');
      add_('IFCRELFILLSELEMENT(\''+ifcGuid()+'\',$,$,$,'+o_+','+el+')');contained.push(el);isD?nD++:nJ++;}}
  for(const r of doc.objects.filter(o=>o.type==='room'&&vis(o))){const pts=polyArea(r.pts)<0?[...r.pts].reverse():r.pts;const spl=place(stPl,ax3(o0));
    spaces.push(add_('IFCSPACE(\''+ifcGuid()+'\',$,'+ifcStr(r.name||'Ambiente')+',$,$,'+spl+','+shape([polySolid(pts,s.wallH)],'SweptSolid')+','+ifcStr(r.name||'Ambiente')+',.ELEMENT.,.INTERNAL.,$)'));nS++;}
  const meshOf=fn=>{const m=Model();fn(m);return meshSolid(m);};
  for(const o of doc.objects.filter(x=>x.type==='roof'&&vis(x))){const sol=meshOf(m=>{const{faces,gables}=roofFaces(o);faces.forEach(f=>m.poly3('roof',f));gables.forEach(f=>m.poly3('gable',f));});if(!sol)continue;
    contained.push(add_('IFCROOF(\''+ifcGuid()+'\',$,'+ifcStr('Telhado '+ROOF_KINDS[o.kind])+',$,$,'+place(stPl,ax3(o0))+','+shape([sol],'Tessellation')+',$,'+({'1a':'.SHED_ROOF.','2a':'.GABLE_ROOF.','4a':'.HIP_ROOF.',plano:'.FLAT_ROOF.'}[o.kind]||'.NOTDEFINED.')+')'));nR++;}
  for(const o of doc.objects.filter(x=>x.type==='stair'&&vis(x))){const I=stairInfo(o);const sol=meshOf(m=>{for(let i=0;i<I.n-1;i++)m.box('stair',I.T(0,(i+.5)*I.tread),o.w,I.tread,(o.rot||0)-Math.PI/2,0,(i+1)*I.riser);});if(sol)contained.push(add_('IFCSTAIR(\''+ifcGuid()+'\',$,\'Escada\',$,$,'+place(stPl,ax3(o0))+','+shape([sol],'Tessellation')+',$,.STRAIGHT_RUN_STAIR.)'));}
  for(const o of doc.objects.filter(x=>x.type==='block'&&vis(x))){const sol=meshOf(m=>block3D(m,o));if(!sol)continue;contained.push(add_('IFCFURNITURE(\''+ifcGuid()+'\',$,'+ifcStr(BLOCKS[o.kind]?.name||'Mobiliário')+',$,$,'+place(stPl,ax3(o0))+','+shape([sol],'Tessellation')+',$,.NOTDEFINED.)'));nF++;}
  if(spaces.length)add_('IFCRELAGGREGATES(\''+ifcGuid()+'\',$,$,$,'+storey+',('+spaces.join(',')+'))');
  if(contained.length)add_('IFCRELCONTAINEDINSPATIALSTRUCTURE(\''+ifcGuid()+'\',$,$,$,('+contained.join(',')+'),'+storey+')');
  if(!nW&&!nS&&!nR)return log('Nada para exportar em IFC: desenhe paredes, ambientes ou telhado.','err');
  const now=new Date().toISOString().slice(0,19);
  const txt='ISO-10303-21;\nHEADER;\nFILE_DESCRIPTION((\'ViewDefinition [ReferenceView]\'),\'2;1\');\nFILE_NAME('+ifcStr(doc.name+'.ifc')+',\''+now+'\',(\'\'),(\'\'),\'Vorticis Architecture\',\'Vorticis Architecture\',\'\');\nFILE_SCHEMA((\'IFC4\'));\nENDSEC;\nDATA;\n'+L.map((e,i)=>'#'+(i+1)+'='+e+';').join('\n')+'\nENDSEC;\nEND-ISO-10303-21;\n';
  download(doc.name+'.ifc',new Blob([txt],{type:'application/x-step'}));
  log('IFC exportado: '+nW+' paredes, '+nD+' portas, '+nJ+' janelas, '+nS+' ambientes, '+nR+' telhados, '+nF+' móveis. Abre no Revit, ArchiCAD, BIMcollab, BIMx.','res');
}

/* ---------- PDF vetorial em prancha (com escala e carimbo) ---------- */
const PAPERS={A4:[297,210],A3:[420,297],A2:[594,420],A1:[841,594],A0:[1189,841]};
const SCALES=[10,20,25,50,75,100,125,150,200,250,500,1000,2000];
const CP1252={0x20AC:0x80,0x201A:0x82,0x192:0x83,0x201E:0x84,0x2026:0x85,0x2020:0x86,0x2021:0x87,0x2C6:0x88,0x2030:0x89,0x160:0x8A,0x2039:0x8B,0x152:0x8C,0x2018:0x91,0x2019:0x92,0x201C:0x93,0x201D:0x94,0x2022:0x95,0x2013:0x96,0x2014:0x97,0x2DC:0x98,0x2122:0x99,0x161:0x9A,0x203A:0x9B,0x153:0x9C,0x178:0x9F};
function pdfText(s){let o='';for(const ch of String(s)){let c=ch.codePointAt(0);if(c>255)c=CP1252[c]??63;else if(c>=0x80&&c<0xa0)c=63;
  if(c===40||c===41||c===92)o+='\\'+ch;else if(c<32||c>126)o+='\\'+c.toString(8).padStart(3,'0');else o+=ch;}return'('+o+')';}
function sheetLayout(o){
  const[pw0,ph0]=PAPERS[o.paper],[pw,ph]=o.portrait?[ph0,pw0]:[pw0,ph0],ml=20,m=10,tbH=o.paper==='A4'?32:40,tbW=Math.min(180,pw-ml-m);
  const frame={x:ml,y:m,w:pw-ml-m,h:ph-2*m},area={x:frame.x+5,y:frame.y+tbH+5,w:frame.w-10,h:frame.h-tbH-10};
  const b=docBBox(doc.objects.filter(x=>o.images||x.type!=='image'));let scale=o.scale;
  if(b&&(scale==='fit'||!scale)){const need=Math.max((b.x1-b.x0)*1000/area.w,(b.y1-b.y0)*1000/area.h);scale=SCALES.find(s=>s>=need)||Math.ceil(need/1000)*1000;}
  scale=+scale||100;const fits=b?((b.x1-b.x0)*1000/scale<=area.w+.1&&(b.y1-b.y0)*1000/scale<=area.h+.1):true;
  return{pw,ph,frame,area,tb:{x:frame.x+frame.w-tbW,y:frame.y,w:tbW,h:tbH},scale,b,fits};
}
async function buildPDF(o){
  const Lo=sheetLayout(o),{pw,ph,area,b,scale}=Lo,mm=72/25.4,c=[],gs=new Map(),imgs=[];
  const k=1000/scale,cx=b?(b.x0+b.x1)/2:0,cy=b?(b.y0+b.y1)/2:0,ax=area.x+area.w/2,ay=area.y+area.h/2;
  const X=q=>((ax+(q.x-cx)*k)*mm).toFixed(2),Y=q=>((ay+(q.y-cy)*k)*mm).toFixed(2);
  const col=(cl,Lcol)=>{let h=cl==='L'?Lcol:cl==='F'?'auto':cl==='WF'?'#4a5059':cl==='BG'?'#ffffff':cl;if(!h||h==='auto')h='#111111';if(o.mono&&cl!=='BG')h=cl==='WF'?'#555555':'#111111';
    return[1,3,5].map(i=>(parseInt(h.slice(i,i+2),16)/255).toFixed(3)).join(' ');};
  const alpha=a=>{if(a==null||a>=1)return'';const key='GS'+Math.round(a*100);gs.set(key,a);return'/'+key+' gs ';};
  const path=(pts,closed)=>{let s=X(pts[0])+' '+Y(pts[0])+' m ';for(let i=1;i<pts.length;i++)s+=X(pts[i])+' '+Y(pts[i])+' l ';return s+(closed?'h ':'');};
  const lw=v=>(Math.max(.1,(v||1)*.18*(o.lwk||1))*mm).toFixed(2);
  const emit=(pr,Lcol,ovFill)=>{
    if(pr.k==='poly'||pr.k==='circle'||pr.k==='arc'){let pts=pr.pts,closed=pr.closed;
      if(pr.k==='circle'){pts=ellL(pr.c.x,pr.c.y,pr.r,pr.r,64);closed=true;}
      if(pr.k==='arc'){const a1=pr.ccw?pr.a1:pr.a0,a0=pr.ccw?pr.a0:pr.a1;let A1=a1;while(A1<a0)A1+=2*Math.PI;const n=Math.max(8,Math.ceil((A1-a0)/(Math.PI/24)));pts=[];for(let i=0;i<=n;i++){const t=a0+(A1-a0)*i/n;pts.push(add(pr.c,P(Math.cos(t)*pr.r,Math.sin(t)*pr.r)));}closed=false;}
      if(!pts||pts.length<2)return;const fill=ovFill!==undefined?ovFill:pr.fill;
      if(fill){c.push('q '+alpha(pr.fillAlpha)+col(fill,Lcol)+' rg '+path(pts,true)+'f Q');}
      if(pr.stroke&&ovFill===undefined){c.push('q '+col(pr.stroke,Lcol)+' RG '+lw(pr.lw)+' w '+(pr.dash?'['+pr.dash.map(d=>(d*.18*mm).toFixed(2)).join(' ')+'] 0 d ':'')+'1 J 1 j '+path(pts,closed)+'S Q');}
    }else if(pr.k==='text'){const sz=pr.size*k*mm;if(sz<1.2)return;const lines=String(pr.text).split('\n'),n=lines.length,cs=Math.cos(pr.ang||0),sn=Math.sin(pr.ang||0),bold=pr.bold?'/F2':'/F1';
      lines.forEach((t,i)=>{const dy=pr.base==='middle'?((n-1)/2-i)*1.2*pr.size-pr.size*.35:(n-1-i)*1.2*pr.size,wd=pr.align==='center'?t.length*pr.size*.52:0;
        const q=add(pr.p,rotV(P(-wd/2,dy),pr.ang||0));c.push('BT '+bold+' '+sz.toFixed(2)+' Tf '+col(pr.color||'L',Lcol)+' rg '+cs.toFixed(4)+' '+sn.toFixed(4)+' '+(-sn).toFixed(4)+' '+cs.toFixed(4)+' '+X(q)+' '+Y(q)+' Tm '+pdfText(t)+' Tj ET');});}
    else if(pr.k==='image'&&o.images){const src=doc.images[pr.img];if(!src)return;imgs.push({src,pr});const nm='/Im'+imgs.length,w=pr.w*k*mm,h=pr.h*k*mm,cs=Math.cos(pr.rot||0),sn=Math.sin(pr.rot||0),f=pr.flip?-1:1;
      c.push('q '+alpha(pr.opacity)+(f*w*cs).toFixed(3)+' '+(f*w*sn).toFixed(3)+' '+(-h*sn).toFixed(3)+' '+(h*cs).toFixed(3)+' '+X(pr.p)+' '+Y(pr.p)+' cm '+nm+' Do Q');}
  };
  // área do desenho (recorte)
  c.push('q '+(area.x*mm).toFixed(2)+' '+(area.y*mm).toFixed(2)+' '+(area.w*mm).toFixed(2)+' '+(area.h*mm).toFixed(2)+' re W n');
  const objs=doc.objects.filter(x=>getLayer(x.layer).visible!==false).sort((a,b2)=>ORDER[a.type]-ORDER[b2.type]);
  for(const ob of objs)if(ORDER[ob.type]<5)prims(ob).forEach(pr=>emit(pr,getLayer(ob.layer).color));
  const walls=objs.filter(x=>x.type==='wall');
  for(const w of walls)c.push('q '+col('L',getLayer(w.layer).color)+' RG '+lw(2.6)+' w 0 j '+path(wallPoly(w),true)+'S Q');
  for(const w of walls)emit({k:'poly',pts:wallPoly(w),closed:true},null,'WF');
  for(const ob of objs)if(ORDER[ob.type]>5)prims(ob).forEach(pr=>emit(pr,getLayer(ob.layer).color));
  c.push('Q');
  // moldura e carimbo
  const R=(x,y,w,h)=>(x*mm).toFixed(2)+' '+(y*mm).toFixed(2)+' '+(w*mm).toFixed(2)+' '+(h*mm).toFixed(2)+' re';
  const T=(x,y,s,t,bold)=>c.push('BT '+(bold?'/F2':'/F1')+' '+(s*mm).toFixed(2)+' Tf 0 0 0 rg '+(x*mm).toFixed(2)+' '+(y*mm).toFixed(2)+' Td '+pdfText(t)+' Tj ET');
  const F=Lo.frame,tb=Lo.tb;c.push('0 0 0 RG '+(.5*mm).toFixed(2)+' w '+R(F.x,F.y,F.w,F.h)+' S');
  c.push('0 0 0 RG '+(.35*mm).toFixed(2)+' w '+R(tb.x,tb.y,tb.w,tb.h)+' S');
  const r1=tb.y+tb.h*.62,r2=tb.y+tb.h*.3,c1=tb.x+tb.w*.62;
  c.push((.2*mm).toFixed(2)+' w '+(tb.x*mm).toFixed(2)+' '+(r1*mm).toFixed(2)+' m '+((tb.x+tb.w)*mm).toFixed(2)+' '+(r1*mm).toFixed(2)+' l S '+(tb.x*mm).toFixed(2)+' '+(r2*mm).toFixed(2)+' m '+((tb.x+tb.w)*mm).toFixed(2)+' '+(r2*mm).toFixed(2)+' l S '+(c1*mm).toFixed(2)+' '+(tb.y*mm).toFixed(2)+' m '+(c1*mm).toFixed(2)+' '+(r1*mm).toFixed(2)+' l S');
  // marca (losango verde/laranja)
  c.push('q 0.086 0.639 0.290 rg '+((tb.x+4)*mm).toFixed(2)+' '+((r1+tb.h*.19)*mm).toFixed(2)+' m '+((tb.x+8)*mm).toFixed(2)+' '+((r1+tb.h*.19+4)*mm).toFixed(2)+' l '+((tb.x+12)*mm).toFixed(2)+' '+((r1+tb.h*.19)*mm).toFixed(2)+' l '+((tb.x+8)*mm).toFixed(2)+' '+((r1+tb.h*.19-4)*mm).toFixed(2)+' l h f 0.976 0.451 0.086 rg '+((tb.x+8)*mm).toFixed(2)+' '+((r1+tb.h*.19)*mm).toFixed(2)+' m '+((tb.x+12)*mm).toFixed(2)+' '+((r1+tb.h*.19)*mm).toFixed(2)+' l '+((tb.x+8)*mm).toFixed(2)+' '+((r1+tb.h*.19-4)*mm).toFixed(2)+' l h f Q');
  T(tb.x+15,r1+tb.h*.25,4.2,o.project||doc.name,true);T(tb.x+15,r1+tb.h*.08,2.4,'VORTICIS ARCHITECTURE');
  T(tb.x+3,r2+tb.h*.2,2,'CONTEÚDO');T(tb.x+3,r2+tb.h*.06,3.2,o.title||'Planta baixa',true);
  T(c1+3,r2+tb.h*.2,2,'ESCALA');T(c1+3,r2+tb.h*.06,3.2,'1:'+scale,true);
  T(tb.x+3,tb.y+tb.h*.16,2,'RESPONSÁVEL');T(tb.x+3,tb.y+tb.h*.05,2.8,o.author||'—');
  T(c1+3,tb.y+tb.h*.16,2,'DATA / FOLHA');T(c1+3,tb.y+tb.h*.05,2.8,(o.date||new Date().toLocaleDateString('pt-BR'))+'   '+(o.sheet||'01/01'));
  T(F.x+2,F.y+F.h-4,2,'Unidades em metros · '+o.paper+(o.portrait?' retrato':' paisagem'));
  // barra de escala
  const bl=[1,2,5,10,20,50].find(v=>v*k>=25)||50,bx=F.x+5,by=F.y+6;for(let i=0;i<4;i++)c.push((i%2?'1 1 1':'0 0 0')+' rg 0 0 0 RG '+(.2*mm).toFixed(2)+' w '+R(bx+i*bl*k/4,by,bl*k/4,1.6)+' B');T(bx,by+2.6,2.2,'0');T(bx+bl*k-3,by+2.6,2.2,bl+' m');
  // monta o arquivo
  const enc=new TextEncoder(),content=enc.encode(c.join('\n'));let stream=content,filter='';
  if(typeof CompressionStream!=='undefined'){try{stream=new Uint8Array(await new Response(new Blob([content]).stream().pipeThrough(new CompressionStream('deflate'))).arrayBuffer());filter='/Filter /FlateDecode ';}catch(e){stream=content;}}
  const objsP=[];const add2=x=>{objsP.push(x);return objsP.length;};
  const fontN=add2('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>'),fontB=add2('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>');
  const imgRefs=[];for(let i=0;i<imgs.length;i++){const jpg=await toJpegBytes(imgs[i].src);imgRefs.push('/Im'+(i+1)+' '+add2({head:'<< /Type /XObject /Subtype /Image /Width '+jpg.w+' /Height '+jpg.h+' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length '+jpg.bytes.length+' >>',bin:jpg.bytes})+' 0 R');}
  const cont=add2({head:'<< '+filter+'/Length '+stream.length+' >>',bin:stream});
  const gsStr=[...gs].map(([kk,a])=>'/'+kk+' << /Type /ExtGState /ca '+a+' /CA '+a+' >>').join(' ');
  const pagesN=objsP.length+2,page=add2('<< /Type /Page /Parent '+pagesN+' 0 R /MediaBox [0 0 '+(pw*mm).toFixed(2)+' '+(ph*mm).toFixed(2)+'] /Resources << /Font << /F1 '+fontN+' 0 R /F2 '+fontB+' 0 R >> /ExtGState << '+gsStr+' >> /XObject << '+imgRefs.join(' ')+' >> >> /Contents '+cont+' 0 R >>');
  const pages=add2('<< /Type /Pages /Kids ['+page+' 0 R] /Count 1 >>');const cat=add2('<< /Type /Catalog /Pages '+pages+' 0 R >>');
  const info=add2('<< /Title '+pdfText(o.project||doc.name)+' /Creator (Vorticis Architecture) /Producer (Vorticis Architecture) >>');
  const parts=[enc.encode('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n')],offs=[];let pos=parts[0].length;
  objsP.forEach((ob,i)=>{offs.push(pos);let chunk;if(typeof ob==='string')chunk=[enc.encode((i+1)+' 0 obj\n'+ob+'\nendobj\n')];else chunk=[enc.encode((i+1)+' 0 obj\n'+ob.head+'\nstream\n'),ob.bin,enc.encode('\nendstream\nendobj\n')];for(const p of chunk){parts.push(p);pos+=p.length;}});
  const xref='xref\n0 '+(objsP.length+1)+'\n0000000000 65535 f \n'+offs.map(o2=>String(o2).padStart(10,'0')+' 00000 n \n').join('')+'trailer\n<< /Size '+(objsP.length+1)+' /Root '+cat+' 0 R /Info '+info+' 0 R >>\nstartxref\n'+pos+'\n%%EOF\n';
  parts.push(enc.encode(xref));
  return{blob:new Blob(parts,{type:'application/pdf'}),Lo};
}
async function toJpegBytes(src){const im=await new Promise((res,rej)=>{const i=new Image();i.onload=()=>res(i);i.onerror=rej;i.src=src;});const c=document.createElement('canvas');c.width=im.naturalWidth;c.height=im.naturalHeight;const g=c.getContext('2d');g.fillStyle='#fff';g.fillRect(0,0,c.width,c.height);g.drawImage(im,0,0);
  const b64=c.toDataURL('image/jpeg',.88).split(',')[1],bin=atob(b64),u=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)u[i]=bin.charCodeAt(i);return{bytes:u,w:c.width,h:c.height};}
function pdfDialog(){
  if(!doc.objects.length)return log('Nada para exportar.','err');
  const st=(()=>{try{return JSON.parse(localStorage.getItem('va:pdf')||'{}');}catch(e){return{};}})();
  const o={paper:st.paper||'A3',portrait:!!st.portrait,scale:st.scale||'fit',mono:!!st.mono,images:st.images!==false,author:st.author||'',title:st.title||'Planta baixa',project:doc.name,sheet:'01/01',date:new Date().toLocaleDateString('pt-BR')};
  const html='<div class="terrWrap"><div class="grid2">'+
    '<label>Papel<select id="pfP">'+Object.keys(PAPERS).map(p=>'<option'+(p===o.paper?' selected':'')+'>'+p+'</option>').join('')+'</select></label>'+
    '<label>Orientação<select id="pfO"><option value="0"'+(o.portrait?'':' selected')+'>Paisagem</option><option value="1"'+(o.portrait?' selected':'')+'>Retrato</option></select></label>'+
    '<label>Escala<select id="pfS"><option value="fit">Ajustar à folha</option>'+SCALES.map(s=>'<option value="'+s+'"'+(String(s)===String(o.scale)?' selected':'')+'>1:'+s+'</option>').join('')+'</select></label>'+
    '<label>Cores<select id="pfC"><option value="0"'+(o.mono?'':' selected')+'>Coloridas (cores das camadas)</option><option value="1"'+(o.mono?' selected':'')+'>Preto e branco</option></select></label>'+
    '<label>Projeto<input id="pfPr" value="'+esc(o.project)+'"></label><label>Conteúdo da folha<input id="pfT" value="'+esc(o.title)+'"></label>'+
    '<label>Responsável técnico<input id="pfA" value="'+esc(o.author)+'"></label><label>Folha<input id="pfF" value="01/01"></label>'+
    '<label style="flex-direction:row;align-items:center;gap:6px"><input type="checkbox" id="pfI"'+(o.images?' checked':'')+'> Incluir imagens/fotos</label></div>'+
    '<div class="prev"><canvas id="pfPrev" width="560" height="400" style="width:100%;height:auto;background:#fff;border-radius:6px"></canvas><div class="info" id="pfInfo"></div></div></div>';
  const read=()=>Object.assign(o,{paper:$('#pfP').value,portrait:$('#pfO').value==='1',scale:$('#pfS').value,mono:$('#pfC').value==='1',images:$('#pfI').checked,author:$('#pfA').value,title:$('#pfT').value,project:$('#pfPr').value,sheet:$('#pfF').value});
  const prev=()=>{read();const Lo=sheetLayout(o),cvp=$('#pfPrev'),g=cvp.getContext('2d'),s=Math.min(cvp.width/Lo.pw,cvp.height/Lo.ph)*.94,ox=(cvp.width-Lo.pw*s)/2,oy=(cvp.height-Lo.ph*s)/2;
    g.setTransform(1,0,0,1,0,0);g.fillStyle='#e8ece9';g.fillRect(0,0,cvp.width,cvp.height);g.fillStyle='#fff';g.fillRect(ox,oy,Lo.pw*s,Lo.ph*s);
    const R2=(x,y,w,h)=>[ox+x*s,oy+(Lo.ph-y-h)*s,w*s,h*s];g.strokeStyle='#000';g.lineWidth=1;g.strokeRect(...R2(Lo.frame.x,Lo.frame.y,Lo.frame.w,Lo.frame.h));g.strokeRect(...R2(Lo.tb.x,Lo.tb.y,Lo.tb.w,Lo.tb.h));
    if(Lo.b){const k=1000/Lo.scale*s,cx=(Lo.b.x0+Lo.b.x1)/2,cy=(Lo.b.y0+Lo.b.y1)/2,ax=ox+(Lo.area.x+Lo.area.w/2)*s,ay=oy+(Lo.ph-Lo.area.y-Lo.area.h/2)*s;
      g.save();g.beginPath();g.rect(...R2(Lo.area.x,Lo.area.y,Lo.area.w,Lo.area.h));g.clip();g.setTransform(k,0,0,-k,ax-cx*k,ay+cy*k);
      drawScene(g,{bg:'#ffffff',fg:'#111111',wallFill:'#4a5059',s:k,export:true},doc.objects.filter(x=>o.images||x.type!=='image'));g.restore();}
    $('#pfInfo').innerHTML='Escala <b>1:'+Lo.scale+'</b> · folha '+o.paper+' ('+Lo.pw+'×'+Lo.ph+' mm) · '+(Lo.fits?'<span style="color:var(--ok)">o desenho cabe na folha</span>':'<span class="err">o desenho não cabe: escolha escala maior ou papel maior</span>');};
  modal('Exportar PDF (prancha)',html,[{label:'Cancelar',value:null},{label:'Gerar PDF',primary:true,onClick:async()=>{read();try{localStorage.setItem('va:pdf',JSON.stringify({paper:o.paper,portrait:o.portrait,scale:o.scale,mono:o.mono,images:o.images,author:o.author,title:o.title}));}catch(e){}
    const{blob,Lo}=await buildPDF(o);download(doc.name+' - '+o.paper+' 1-'+Lo.scale+'.pdf',blob);log('PDF exportado: '+o.paper+', escala 1:'+Lo.scale+' (vetorial, com carimbo).','res');return true;}}],
    body=>{body.querySelectorAll('select,input').forEach(e=>e.addEventListener('input',prev));body.querySelectorAll('select').forEach(e=>e.addEventListener('change',prev));prev();});
}
function dwgInfo(){
  modal('DWG e DWF','<p>Os formatos <b>DWG</b> e <b>DWF</b> são fechados (da Autodesk). O Vorticis <b>lê DWG</b> (e BAK) e DWFx, mas o navegador não consegue <b>gravar</b> DWG/DWF.</p>'+
    '<p>Para levar o projeto ao AutoCAD use <b>DXF</b>: o AutoCAD, BricsCAD, ZWCAD e DraftSight abrem o DXF e salvam como DWG em um clique (Arquivo → Salvar como → DWG). Para converter vários arquivos de uma vez, o <b>ODA File Converter</b> (gratuito) transforma DXF em DWG.</p>'+
    '<p>Para visualização e envio a clientes, use o <b>PDF</b> em prancha, que substitui o DWF.</p>',
    [{label:'Fechar',value:null},{label:'Exportar PDF',onClick:()=>{setTimeout(pdfDialog,0);return true;}},{label:'Exportar DXF',primary:true,onClick:()=>{exportDXF();return true;}}]);
}
