'use strict';
/* =========================================================================
   Vista 3D — modelo geométrico (compartilhado com OBJ/IFC) + WebGL (three.js)
   ========================================================================= */
const MAT3={wall:['#f1ede6',1],gable:['#ece6dc',1],floor:['#c8a07a',1],tile:['#d7dcdf',1],grass:['#6fa35e',1],ground:['#d9dfd8',1],roof:['#b9532c',1],slab:['#c3c8cc',1],
  glass:['#9fd0ee',.32],frame:['#8f99a3',1],door:['#8a5a3b',1],wood:['#a97c52',1],fabric:['#6f8299',1],cushion:['#e9e4da',1],white:['#f6f6f4',1],metal:['#b9c0c7',1],
  car:['#c0392b',1],dark:['#2d3436',1],trunk:['#6b4f3a',1],leaf:['#4f8f45',1],water:['#3aa6d8',.85],stair:['#d9d2c6',1]};
const MAT_NAME={wall:'Parede',gable:'Oitão',floor:'Piso madeira',tile:'Piso cerâmico',grass:'Grama',ground:'Solo',roof:'Telha',slab:'Laje',glass:'Vidro',frame:'Esquadria',door:'Porta',wood:'Madeira',fabric:'Tecido',cushion:'Estofado',white:'Louça',metal:'Metal',car:'Carro',dark:'Escuro',trunk:'Tronco',leaf:'Folhagem',water:'Água',stair:'Escada'};

/* ---- construtor de malhas ---- */
function earcut2(pts){ // triangulação por orelhas (polígono simples) -> índices
  const n=pts.length;if(n<3)return[];let idx=[...Array(n).keys()];if(polyArea(pts)<0)idx.reverse();const out=[];let guard=0;
  const inTri=(p,a,b,c)=>crs(sub(b,a),sub(p,a))>=-1e-12&&crs(sub(c,b),sub(p,b))>=-1e-12&&crs(sub(a,c),sub(p,c))>=-1e-12;
  while(idx.length>3&&guard++<5000){let cut=false;
    for(let i=0;i<idx.length;i++){const ia=idx[(i-1+idx.length)%idx.length],ib=idx[i],ic=idx[(i+1)%idx.length],a=pts[ia],b=pts[ib],c=pts[ic];
      if(crs(sub(b,a),sub(c,b))<=1e-12)continue;let ok=true;for(const j of idx){if(j===ia||j===ib||j===ic)continue;if(inTri(pts[j],a,b,c)){ok=false;break;}}
      if(ok){out.push([ia,ib,ic]);idx.splice(i,1);cut=true;break;}}
    if(!cut)break;}
  if(idx.length===3)out.push(idx.slice());else if(idx.length>3)for(let i=1;i<idx.length-1;i++)out.push([idx[0],idx[i],idx[i+1]]);
  return out;
}
function Model(){
  const m={g:{},grp:{}};
  const bucket=(mat,grp)=>{const k=(grp||'main')+'|'+mat;return m.g[k]||(m.g[k]={mat,grp:grp||'main',v:[]});};
  m.tri=(mat,a,b,c,grp)=>{bucket(mat,grp).v.push(a.x,a.y,a.z,b.x,b.y,b.z,c.x,c.y,c.z);};
  m.poly3=(mat,pts,grp)=>{for(let i=1;i<pts.length-1;i++)m.tri(mat,pts[0],pts[i],pts[i+1],grp);};
  m.flat=(mat,pts,z,up=true,grp)=>{const tr=earcut2(pts),ccw=polyArea(pts)>0;for(const[a,b,c]of tr){const A={x:pts[a].x,y:pts[a].y,z},B={x:pts[b].x,y:pts[b].y,z},C={x:pts[c].x,y:pts[c].y,z};
    const flip=(ccw?polyArea([pts[a],pts[b],pts[c]])>0:polyArea([pts[a],pts[b],pts[c]])>0)!==up;flip?m.tri(mat,A,C,B,grp):m.tri(mat,A,B,C,grp);}};
  m.prism=(mat,pts,z0,z1,grp)=>{let b=pts;if(polyArea(b)<0)b=[...b].reverse();m.flat(mat,b,z1,true,grp);m.flat(mat,b,z0,false,grp);
    for(let i=0;i<b.length;i++){const p=b[i],q=b[(i+1)%b.length];m.poly3(mat,[{x:p.x,y:p.y,z:z0},{x:q.x,y:q.y,z:z0},{x:q.x,y:q.y,z:z1},{x:p.x,y:p.y,z:z1}],grp);}};
  m.box=(mat,c,w,d,rot,z0,z1,grp)=>m.prism(mat,rectCorners(c,w,d,rot||0),z0,z1,grp);
  m.cyl=(mat,c,r,z0,z1,n=12,grp)=>m.prism(mat,ellL(c.x,c.y,r,r,n),z0,z1,grp);
  m.sphere=(mat,c,r,z,grp,sx=1)=>{const la=7,lo=12,V=(i,j)=>{const t=Math.PI*i/la,f=2*Math.PI*j/lo;return{x:c.x+r*sx*Math.sin(t)*Math.cos(f),y:c.y+r*sx*Math.sin(t)*Math.sin(f),z:z+r*Math.cos(t)};};
    for(let i=0;i<la;i++)for(let j=0;j<lo;j++){const a=V(i,j),b=V(i+1,j),c2=V(i+1,j+1),d=V(i,j+1);m.tri(mat,a,b,c2,grp);m.tri(mat,a,c2,d,grp);}};
  return m;
}
const WET=/banh|wc|lavabo|cozinha|servi|lavand|copa|varanda|garag|área ext/i;
function buildModel(opts={}){
  const m=Model(),vis=o=>getLayer(o.layer).visible!==false,s=S();
  const objs=doc.objects.filter(vis);
  // terreno e solo
  let bb=docBBox(objs.filter(o=>o.type!=='image'))||{x0:0,y0:0,x1:10,y1:10};const pad=Math.max(8,Math.max(bb.x1-bb.x0,bb.y1-bb.y0)*.6);
  m.ground={x0:bb.x0-pad,y0:bb.y0-pad,x1:bb.x1+pad,y1:bb.y1+pad};
  for(const o of objs){
    if(o.type==='terrain')m.flat('grass',o.pts,.005,true,'site');
    if(o.type==='room')m.prism(WET.test(o.name||'')?'tile':'floor',o.pts,0,.03);
    if(o.type==='hatch'&&/grama|madeira|ceramica/.test(o.pattern))m.flat(o.pattern==='grama'?'grass':o.pattern==='madeira'?'wood':'tile',o.pts,.012);
    if(o.type==='block')block3D(m,o);
    if(o.type==='stair'){const I=stairInfo(o);for(let i=0;i<I.n-1;i++){const c=I.T(0,(i+.5)*I.tread);m.box('stair',c,o.w,I.tread,(o.rot||0)-Math.PI/2,0,(i+1)*I.riser);}}
    if(o.type==='roof'){const{faces,gables}=roofFaces(o);faces.forEach(f=>m.poly3(o.kind==='plano'?'slab':'roof',f,'roof'));gables.forEach(f=>m.poly3('gable',f,'roof'));
      if(o.kind==='plano'){const F=roofFrame(o);m.prism('slab',[P(-F.a,-F.b),P(F.a,-F.b),P(F.a,F.b),P(-F.a,F.b)].map(F.T),F.base,F.base+.12,'roof');}}
  }
  for(const w of objs){if(w.type!=='wall')continue;
    const{L,u,n}=wallInfo(w),[ea,eb]=wallExt(w),H=w.h||s.wallH,t=w.t/2;
    const at=(sv,o2)=>add(add(w.a,mul(u,sv)),mul(n,o2));
    const seg=(s0,s1,z0,z1,mat='wall')=>{if(s1-s0<1e-4||z1-z0<1e-4)return;m.prism(mat,[at(s0,t),at(s1,t),at(s1,-t),at(s0,-t)],z0,z1);};
    const ops=openingsOf([w.id]).filter(vis).map(o=>{const off=Math.max(o.w/2,Math.min(L-o.w/2,o.off));return{o,s0:off-o.w/2,s1:off+o.w/2};}).sort((a,b)=>a.s0-b.s0);
    let c=-ea;
    for(const op of ops){if(op.s0>c)seg(c,op.s0,0,H);const s0=Math.max(c,op.s0),o=op.o;
      if(o.type==='door'){const dh=Math.min(o.h||2.1,H);seg(s0,op.s1,dh,H);door3D(m,w,o,op.s0,op.s1,dh,at,t);}
      else{const si=o.sill??1,hh=Math.min((o.h??1.2),H-si);seg(s0,op.s1,0,si);seg(s0,op.s1,si+hh,H);window3D(m,o,op.s0,op.s1,si,si+hh,at,t);}
      c=Math.max(c,op.s1);}
    if(c<L+eb)seg(c,L+eb,0,H);
  }
  return m;
}
function door3D(m,w,o,s0,s1,h,at,t){
  const fw=.05,kind=o.kind||'giro',sd=o.flip?1:-1,lt=.04;
  m.prism('frame',[at(s0,t),at(s0+fw,t),at(s0+fw,-t),at(s0,-t)],0,h);m.prism('frame',[at(s1-fw,t),at(s1,t),at(s1,-t),at(s1-fw,-t)],0,h);m.prism('frame',[at(s0,t),at(s1,t),at(s1,-t),at(s0,-t)],h-fw,h);
  const a=s0+fw,b=s1-fw,mid=(a+b)/2,leaf=(x0,x1,off)=>m.prism('door',[at(x0,off+lt/2),at(x1,off+lt/2),at(x1,off-lt/2),at(x0,off-lt/2)],.01,h-fw);
  if(kind==='correr'){leaf(a,mid+.04,t*.3);leaf(mid-.04,b,-t*.3);}
  else if(kind==='dupla'){leaf(a,mid-.005,sd*(t-lt));leaf(mid+.005,b,sd*(t-lt));}
  else if(kind==='sanfonada'){const k=4;for(let i=0;i<k;i++)leaf(a+(b-a)*i/k+.01,a+(b-a)*(i+1)/k-.01,(i%2?1:-1)*.03);}
  else leaf(a,b,sd*(t-lt));
}
function window3D(m,o,s0,s1,z0,z1,at,t){
  const fw=.05,kind=o.kind||'correr';
  m.prism('frame',[at(s0,t*.6),at(s1,t*.6),at(s1,-t*.6),at(s0,-t*.6)],z0,z0+fw);m.prism('frame',[at(s0,t*.6),at(s1,t*.6),at(s1,-t*.6),at(s0,-t*.6)],z1-fw,z1);
  m.prism('frame',[at(s0,t*.6),at(s0+fw,t*.6),at(s0+fw,-t*.6),at(s0,-t*.6)],z0,z1);m.prism('frame',[at(s1-fw,t*.6),at(s1,t*.6),at(s1,-t*.6),at(s1-fw,-t*.6)],z0,z1);
  // peitoril externo
  m.prism('slab',[at(s0-.03,-t-.04),at(s1+.03,-t-.04),at(s1+.03,t*.6),at(s0-.03,t*.6)],z0-.03,z0);
  const glass=(x0,x1,off,za=z0+fw,zb=z1-fw)=>m.prism('glass',[at(x0,off+.006),at(x1,off+.006),at(x1,off-.006),at(x0,off-.006)],za,zb);
  const mid=(s0+s1)/2;
  if(kind==='correr'){glass(s0+fw,mid+.03,t*.2);glass(mid-.03,s1-fw,-t*.2);m.prism('frame',[at(mid-.02,t*.3),at(mid+.02,t*.3),at(mid+.02,-t*.3),at(mid-.02,-t*.3)],z0,z1);}
  else if(kind==='giro'){glass(s0+fw,mid-.01,0);glass(mid+.01,s1-fw,0);m.prism('frame',[at(mid-.02,t*.3),at(mid+.02,t*.3),at(mid+.02,-t*.3),at(mid-.02,-t*.3)],z0,z1);}
  else if(kind==='basculante'||kind==='maxim-ar'){const k=kind==='basculante'?3:2;for(let i=0;i<k;i++){const za=z0+fw+(z1-z0-2*fw)*i/k,zb=z0+fw+(z1-z0-2*fw)*(i+1)/k;glass(s0+fw,s1-fw,0,za+.01,zb-.01);if(i)m.prism('frame',[at(s0,t*.3),at(s1,t*.3),at(s1,-t*.3),at(s0,-t*.3)],za-.015,za+.015);}}
  else glass(s0+fw,s1-fw,0);
}
function block3D(m,o){
  const B=BLOCKS[o.kind];if(!B)return;const w=o.w||B.w,d=o.d||B.d,rot=o.rot||0,mir=o.mirror?-1:1;
  const L=(x,y)=>add(o.p,rotV(P(mir*x,y),rot)),bx=(mat,x,y,ww,dd,z0,z1)=>m.box(mat,L(x,y),ww,dd,rot,z0,z1);
  const x=w/2,y=d/2;
  switch(o.kind){
    case 'cama_casal':case 'cama_solteiro':bx('wood',0,0,w,d,0,.28);bx('white',0,-.05,w-.06,d-.16,.28,.5);bx('wood',0,y-.04,w,.08,0,.95);
      if(o.kind==='cama_casal'){bx('cushion',-w/4,y-.28,w/2-.12,.32,.5,.62);bx('cushion',w/4,y-.28,w/2-.12,.32,.5,.62);}else bx('cushion',0,y-.28,w-.2,.32,.5,.62);
      bx('fabric',0,-y*.35,w-.04,d*.55,.5,.54);break;
    case 'sofa':case 'poltrona':{const ar=o.kind==='sofa'?.18:.14;bx('fabric',0,0,w,d,.08,.42);bx('fabric',0,y-.1,w,.2,.42,.85);bx('fabric',-x+ar/2,0,ar,d,.42,.62);bx('fabric',x-ar/2,0,ar,d,.42,.62);bx('cushion',0,-.06,w-2*ar,d-.24,.42,.5);break;}
    case 'mesa4':case 'escrivaninha':bx('wood',0,0,w,d,.72,.76);for(const[sx,sy]of[[-1,-1],[1,-1],[1,1],[-1,1]])bx('wood',sx*(x-.05),sy*(y-.05),.05,.05,0,.72);
      for(const pr of(o.kind==='mesa4'?[[-w/4,y+.22,0],[w/4,y+.22,0],[-w/4,-y-.22,1],[w/4,-y-.22,1]]:[[0,-y-.22,1]]))chair3D(m,L(pr[0],pr[1]),rot+(pr[2]?Math.PI:0));break;
    case 'mesa_redonda':m.cyl('wood',o.p,w/2,.72,.76,24);m.cyl('wood',o.p,.06,0,.72,8);for(const a of[0,Math.PI/2,Math.PI,-Math.PI/2])chair3D(m,add(o.p,rotV(P(0,w/2+.22),rot+a)),rot+a);break;
    case 'vaso':bx('white',0,-.07,.36,.5,0,.4);bx('white',0,y-.09,w,.18,.2,.75);break;
    case 'lavatorio':bx('white',0,0,w,d,.78,.86);bx('white',0,y-.05,.1,.1,0,.78);break;
    case 'chuveiro':bx('white',0,0,w,d,0,.05);bx('glass',0,-y+.01,w,.02,.05,2);bx('glass',-x+.01,0,.02,d,.05,2);break;
    case 'pia':bx('wood',0,0,w,d,.1,.86);bx('slab',0,0,w+.02,d+.02,.86,.9);break;
    case 'fogao':bx('metal',0,0,w,d,0,.9);bx('dark',0,0,w-.04,d-.04,.9,.92);break;
    case 'geladeira':bx('white',0,0,w,d,0,1.8);break;
    case 'guarda_roupa':bx('wood',0,0,w,d,0,2.1);break;
    case 'tanque':case 'maquina':bx('white',0,0,w,d,0,.9);break;
    case 'carro':bx('car',0,0,w,d,.25,.8);bx('car',0,-.2,w-.1,d*.5,.8,1.35);bx('glass',0,-.2,w-.05,d*.5-.1,.85,1.3);for(const[sx,sy]of[[-1,-1],[1,-1],[1,1],[-1,1]])m.box('dark',L(sx*(x-.1),sy*(y-.75)),.22,.62,rot,0,.5);break;
    case 'arvore':m.cyl('trunk',o.p,.12,0,2.2,8);m.sphere('leaf',o.p,Math.min(w,d)/2*.85,2.2+Math.min(w,d)/2*.6);break;
    case 'piscina':m.flat('water',rectCorners(o.p,w,d,rot),.02);m.prism('slab',rectCorners(o.p,w+.5,d+.5,rot),0,.04);m.flat('water',rectCorners(o.p,w,d,rot),.045);break;
    default:bx('fabric',0,0,w,d,0,B.h||.5);
  }
}
function chair3D(m,c,rot){m.box('wood',c,.42,.42,rot,.42,.46);m.box('wood',add(c,rotV(P(0,.19),rot)),.42,.04,rot,.46,.9);for(const[sx,sy]of[[-1,-1],[1,-1],[1,1],[-1,1]])m.box('wood',add(c,rotV(P(sx*.18,sy*.18),rot)),.04,.04,rot,0,.42);}

/* ---- WebGL com three.js ---- */
let T3=null,T3loading=null,v3Opts={roof:true,shadow:true,edges:true};
async function init3D(){
  if(T3||T3===false)return T3;if(T3loading)return T3loading;
  T3loading=(async()=>{try{
    const THREE=await import('three'),{OrbitControls}=await import('three/addons/controls/OrbitControls.js');
    const host=$('#view3d'),renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});
    renderer.setPixelRatio(Math.min(2,window.devicePixelRatio||1));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
    renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;host.appendChild(renderer.domElement);
    const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(45,1,.1,5000),controls=new OrbitControls(camera,renderer.domElement);
    controls.enableDamping=true;controls.dampingFactor=.08;controls.maxPolarAngle=Math.PI*.495;controls.screenSpacePanning=true;
    const hemi=new THREE.HemisphereLight(0xdfefff,0x6b7a5c,1.1),sun=new THREE.DirectionalLight(0xfff3e0,2.4);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.bias=-.0004;sun.shadow.normalBias=.03;
    scene.add(hemi,sun,sun.target);const group=new THREE.Group();scene.add(group);
    T3={THREE,renderer,scene,camera,controls,sun,hemi,group,fitted:false};
    controls.addEventListener('change',()=>{T3.dirty=true;});
    const loop=()=>{if(!mode3d||!T3){T3.looping=false;return;}controls.update();renderer.render(scene,camera);requestAnimationFrame(loop);};T3.start=()=>{if(!T3.looping){T3.looping=true;requestAnimationFrame(loop);}};
    return T3;
  }catch(e){console.warn('3D WebGL indisponível:',e);T3=false;return false;}})();
  return T3loading;
}
function toThree(T,model){
  const{THREE}=T,g=new THREE.Group(),dark=uiDark();
  for(const k in model.g){const b=model.g[k];if(!b.v.length)continue;if(b.grp==='roof'&&!v3Opts.roof)continue;
    const geo=new THREE.BufferGeometry(),arr=new Float32Array(b.v.length);for(let i=0;i<b.v.length;i+=3){arr[i]=b.v[i];arr[i+1]=b.v[i+2];arr[i+2]=-b.v[i+1];}
    geo.setAttribute('position',new THREE.BufferAttribute(arr,3));geo.computeVertexNormals();
    const[col,op]=MAT3[b.mat]||['#cccccc',1],tr=op<1;
    const mat=b.mat==='glass'?new THREE.MeshPhysicalMaterial({color:col,transparent:true,opacity:op,roughness:.05,metalness:0,side:THREE.DoubleSide,depthWrite:false})
      :new THREE.MeshStandardMaterial({color:col,roughness:b.mat==='water'?.15:b.mat==='metal'||b.mat==='car'?.45:.85,metalness:b.mat==='metal'?.4:0,transparent:tr,opacity:op,side:(b.grp==='roof'||b.grp==='site'||b.mat==='water')?THREE.DoubleSide:THREE.FrontSide,flatShading:true});
    const mesh=new THREE.Mesh(geo,mat);mesh.castShadow=!tr&&b.mat!=='grass';mesh.receiveShadow=true;g.add(mesh);
    if(v3Opts.edges&&!tr&&!['grass','ground','water'].includes(b.mat)){const e=new THREE.LineSegments(new THREE.EdgesGeometry(geo,28),new THREE.LineBasicMaterial({color:dark?0x1b2420:0x3a4540,transparent:true,opacity:.28}));g.add(e);}
  }
  // solo
  const G=model.ground,pl=new THREE.Mesh(new THREE.PlaneGeometry(G.x1-G.x0,G.y1-G.y0),new THREE.MeshStandardMaterial({color:dark?0x55635a:0xdfe6de,roughness:1}));
  pl.rotation.x=-Math.PI/2;pl.position.set((G.x0+G.x1)/2,-.01,-(G.y0+G.y1)/2);pl.receiveShadow=true;g.add(pl);
  return g;
}
async function refresh3D(){
  if(!mode3d)return;const T=await init3D();
  if(!T){$('#view3d').hidden=true;cv3.hidden=false;$('#v3info').textContent='Modo 3D simplificado (WebGL/internet indisponível)';render3D();return;}
  $('#view3d').hidden=false;cv3.hidden=true;$('#v3info').textContent='';
  const{THREE,scene,group,renderer,sun,camera}=T;
  while(group.children.length){const c=group.children.pop();c.traverse(x=>{if(x.geometry)x.geometry.dispose();if(x.material)x.material.dispose();});}
  const model=buildModel();group.add(toThree(T,model));
  const dark=uiDark();scene.background=new THREE.Color(dark?0x1a2621:0xcfe3ef);scene.fog=new THREE.Fog(scene.background,200,900);
  renderer.shadowMap.enabled=v3Opts.shadow;sun.castShadow=v3Opts.shadow;
  const box=new THREE.Box3().setFromObject(group),c=box.getCenter(new THREE.Vector3()),sz=box.getSize(new THREE.Vector3()),R=Math.max(10,sz.length()*.6);
  sun.position.set(c.x+R*.6,c.y+R*1.1,c.z+R*.45);sun.target.position.copy(c);const sc=sun.shadow.camera;sc.left=-R;sc.right=R;sc.top=R;sc.bottom=-R;sc.near=.5;sc.far=R*4;sc.updateProjectionMatrix();
  renderer.setSize(W,H,false);renderer.domElement.style.width=W+'px';renderer.domElement.style.height=H+'px';camera.aspect=W/H;camera.updateProjectionMatrix();
  if(!T.fitted){fit3DView('iso');T.fitted=true;}
  T.start();
}
function fit3DView(kind){
  if(!T3){fit3D();if(kind==='top'){cam.pitch=1.55;cam.yaw=-Math.PI/2;}if(kind==='front'){cam.yaw=-Math.PI/2;cam.pitch=.08;}render3D();return;}
  const{THREE,group,camera,controls}=T3,box=new THREE.Box3().setFromObject(group);if(box.isEmpty())return;
  // enquadra a edificação (ignora o solo amplo)
  const vis_=doc.objects.filter(o=>o.type!=='image'&&getLayer(o.layer).visible!==false),bld=vis_.filter(o=>['wall','roof','room','stair'].includes(o.type));const b=docBBox(bld.length?bld:vis_);const c=b?new THREE.Vector3((b.x0+b.x1)/2,1.2,-(b.y0+b.y1)/2):box.getCenter(new THREE.Vector3());
  const r=b?Math.max(5,Math.hypot(b.x1-b.x0,b.y1-b.y0)*.58):20,d=r/Math.sin(camera.fov*Math.PI/360);
  const dir=kind==='top'?new THREE.Vector3(0,1,.0001):kind==='front'?new THREE.Vector3(0,.12,1):new THREE.Vector3(.75,.62,.95);
  camera.position.copy(c).add(dir.normalize().multiplyScalar(d));controls.target.copy(c);camera.near=Math.max(.05,d/500);camera.far=d*30;camera.updateProjectionMatrix();controls.update();
}
function zoom3D(f){if(T3){const{camera,controls}=T3,v=camera.position.clone().sub(controls.target).multiplyScalar(f);camera.position.copy(controls.target).add(v);controls.update();}else{cam.dist*=f;render3D();}}
function save3DPng(){if(T3){T3.controls.update();T3.renderer.render(T3.scene,T3.camera);T3.renderer.domElement.toBlob(b=>download(doc.name+' - 3D.png',b));}else cv3.toBlob(b=>download(doc.name+' - 3D.png',b));log('Imagem 3D salva.','res');}
function setView(v){
  mode3d=v==='3d';$$('#titlebar [data-view]').forEach(b=>b.classList.toggle('on',b.dataset.view===v));
  cv.hidden=mode3d;$('#view3dBar').hidden=!mode3d;$('#tip').style.display='none';
  if(mode3d){if(tool)endTool();$('#v3info').textContent='Carregando 3D…';refresh3D();}else{$('#view3d').hidden=true;cv3.hidden=true;redraw();}
}
$$('#titlebar [data-view]').forEach(b=>b.addEventListener('click',()=>setView(b.dataset.view)));
$$('[data-v3]').forEach(b=>b.addEventListener('click',()=>{const v=b.dataset.v3;if(v==='png')save3DPng();else fit3DView(v==='fit'?'iso':v);}));
$('#v3roof').addEventListener('change',e=>{v3Opts.roof=e.target.checked;refresh3D();});
$('#v3shadow').addEventListener('change',e=>{v3Opts.shadow=e.target.checked;refresh3D();});
$('#v3edges').addEventListener('change',e=>{v3Opts.edges=e.target.checked;refresh3D();});
