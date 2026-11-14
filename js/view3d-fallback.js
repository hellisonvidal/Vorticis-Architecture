'use strict';
/* =========================================================================
   3D simplificado (sem WebGL / sem internet): pintor sobre os triângulos do modelo
   ========================================================================= */
const cam={yaw:-2.2,pitch:.6,dist:40,t:{x:10,y:8,z:1}};
function fit3D(){const b=docBBox();if(!b){cam.t={x:10,y:8,z:1};cam.dist=40;return;}cam.t={x:(b.x0+b.x1)/2,y:(b.y0+b.y1)/2,z:1};cam.dist=Math.max(8,Math.hypot(b.x1-b.x0,b.y1-b.y0)*1.15);}
function hex2rgb(h){return[parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)];}
function render3D(){
  const g=g3;g.setTransform(DPR,0,0,DPR,0,0);const dark=uiDark();
  const grd=g.createLinearGradient(0,0,0,H);grd.addColorStop(0,dark?'#1a2621':'#a9cde6');grd.addColorStop(1,dark?'#2b3a33':'#eef3ee');g.fillStyle=grd;g.fillRect(0,0,W,H);
  const cp_=Math.cos(cam.pitch),pos={x:cam.t.x+cam.dist*cp_*Math.cos(cam.yaw),y:cam.t.y+cam.dist*cp_*Math.sin(cam.yaw),z:cam.t.z+cam.dist*Math.sin(cam.pitch)};
  const v3=(a,b)=>({x:a.x-b.x,y:a.y-b.y,z:a.z-b.z}),d3=(a,b)=>a.x*b.x+a.y*b.y+a.z*b.z,c3=(a,b)=>({x:a.y*b.z-a.z*b.y,y:a.z*b.x-a.x*b.z,z:a.x*b.y-a.y*b.x}),n3=a=>{const l=Math.hypot(a.x,a.y,a.z)||1;return{x:a.x/l,y:a.y/l,z:a.z/l};};
  const f=n3(v3(cam.t,pos));let r=n3(c3(f,{x:0,y:0,z:1}));if(!isFinite(r.x)||Math.hypot(r.x,r.y,r.z)<.5)r={x:1,y:0,z:0};const up=c3(r,f),FL=Math.min(W,H)*1.1,light=n3({x:.45,y:.3,z:.85});
  const model=buildModel(),faces=[];
  for(const k in model.g){const b=model.g[k];if(b.grp==='roof'&&!v3Opts.roof)continue;const[col,op]=MAT3[b.mat]||['#cccccc',1],rgb=hex2rgb(col),ds=b.grp!=='main';
    for(let i=0;i<b.v.length;i+=9){const P3=[{x:b.v[i],y:b.v[i+1],z:b.v[i+2]},{x:b.v[i+3],y:b.v[i+4],z:b.v[i+5]},{x:b.v[i+6],y:b.v[i+7],z:b.v[i+8]}];
      let nn=n3(c3(v3(P3[1],P3[0]),v3(P3[2],P3[0])));if(d3(nn,v3(pos,P3[0]))<=0){if(!ds&&op>=1)continue;nn={x:-nn.x,y:-nn.y,z:-nn.z};}
      let ok=true,depth=0;const sp=P3.map(p=>{const v=v3(p,pos),z=d3(v,f);if(z<.1)ok=false;depth+=z;return[W/2+d3(v,r)/z*FL,H/2-d3(v,up)/z*FL];});
      if(!ok)continue;const sh=.6+.4*Math.max(0,d3(nn,light));faces.push({sp,depth,col:rgb.map(c=>Math.round(c*sh)),op});}}
  faces.sort((a,b)=>b.depth-a.depth);
  for(const fc of faces){g.beginPath();g.moveTo(fc.sp[0][0],fc.sp[0][1]);g.lineTo(fc.sp[1][0],fc.sp[1][1]);g.lineTo(fc.sp[2][0],fc.sp[2][1]);g.closePath();g.globalAlpha=fc.op;g.fillStyle=g.strokeStyle='rgb('+fc.col.join(',')+')';g.lineWidth=.5;g.fill();g.stroke();g.globalAlpha=1;}
  if(!faces.length){g.fillStyle=dark?'#cfe':'#234';g.font='15px system-ui';g.textAlign='center';g.fillText('Desenhe paredes (PA), ambientes ou terreno para ver o modelo 3D.',W/2,H/2);}
}
let d3drag=null;
cv3.addEventListener('contextmenu',e=>e.preventDefault());
cv3.addEventListener('pointerdown',e=>{cv3.setPointerCapture(e.pointerId);d3drag={x:e.clientX,y:e.clientY,pan:e.shiftKey||e.button===2||e.button===1};});
cv3.addEventListener('pointermove',e=>{if(!d3drag)return;const dx=e.clientX-d3drag.x,dy=e.clientY-d3drag.y;d3drag.x=e.clientX;d3drag.y=e.clientY;
  if(d3drag.pan){const k=cam.dist/700,sy=Math.sin(cam.yaw),cy=Math.cos(cam.yaw);cam.t.x-=(dx*sy-dy*cy)*k;cam.t.y-=(-dx*cy-dy*sy)*k;}
  else{cam.yaw-=dx*.008;cam.pitch=Math.max(.03,Math.min(1.55,cam.pitch+dy*.008));}render3D();});
cv3.addEventListener('pointerup',()=>{d3drag=null;});
cv3.addEventListener('wheel',e=>{e.preventDefault();cam.dist=Math.max(1,Math.min(2000,cam.dist*Math.pow(1.0015,e.deltaY)));render3D();},{passive:false});
