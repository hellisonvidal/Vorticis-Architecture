'use strict';
/* ---------- ícones ---------- */
const IC={
  select:'<path d="M5 3l12 7-5 1.5L9.5 17z"/>',pan:'<path d="M8 13V5.5a1.5 1.5 0 0 1 3 0V12M11 11V4.5a1.5 1.5 0 0 1 3 0V11M14 11V5.5a1.5 1.5 0 0 1 3 0V13M8 13v-1.5a1.5 1.5 0 0 0-3 0V15c0 3.5 2.5 6 6 6h1c3.3 0 5-2.5 5-6v-4.5a1.5 1.5 0 0 1 3 0"/>',
  line:'<path d="M4 20L20 4"/><circle cx="4" cy="20" r="1.6"/><circle cx="20" cy="4" r="1.6"/>',polyline:'<path d="M3 19l5-9 6 5 7-11"/><circle cx="8" cy="10" r="1.2"/><circle cx="14" cy="15" r="1.2"/>',
  rect:'<rect x="4" y="6" width="16" height="12" rx="1"/>',circle:'<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="1"/>',arc:'<path d="M4 18a8 8 0 0 1 16 0"/><circle cx="4" cy="18" r="1.4"/><circle cx="12" cy="10" r="1.4"/><circle cx="20" cy="18" r="1.4"/>',
  wall:'<path d="M3 9h18v6H3z" fill="currentColor" fill-opacity=".25"/><path d="M7 9v6M12 9v6M17 9v6" stroke-width="1"/>',wallrect:'<path d="M3 4h18v16H3zM6 7h12v10H6z" fill="currentColor" fill-opacity=".25" fill-rule="evenodd"/>',
  wallsfrom:'<path d="M3 18L12 6l9 12" stroke-dasharray="2 2"/><path d="M5 20h14" stroke-width="3.5"/>',
  door:'<path d="M3 20h4M17 20h4M7 20V6"/><path d="M7 6a14 14 0 0 1 14 14" stroke-dasharray="3 2"/><path d="M7 6v14" stroke-width="2.6"/>',
  window:'<path d="M3 8h18v8H3z"/><path d="M3 11h11M10 13h11" stroke-width="1.4"/>',
  room:'<path d="M4 4h16v16H4z" stroke-dasharray="3 2"/><path d="M8 11h8M9 14h6"/>',autoroom:'<path d="M3 3h18v18H3z" stroke-width="2.4"/><path d="M8 13l3 3 5-7" class="acc"/>',
  block:'<rect x="4" y="6" width="16" height="12" rx="2"/><path d="M4 10h16M8 6v4M16 6v4"/>',
  dim:'<path d="M4 7v12M20 7v12M4 14h16M7 16.5l-3-2.5 3-2.5M17 11.5l3 2.5-3 2.5"/><path d="M10 10h4"/>',autodim:'<path d="M4 7v12M20 7v12M4 14h16"/><path d="M15 3l1.2 2.3L18.5 6l-2.3 1.2L15 9.5l-1.2-2.3L11.5 6l2.3-.7z" class="acc"/>',
  text:'<path d="M5 5h14M12 5v14M9 19h6"/>',hatch:'<rect x="4" y="4" width="16" height="16" rx="1"/><path d="M4 12l8-8M4 20L20 4M12 20l8-8" stroke-width="1.2"/>',
  roof:'<path d="M2 13L12 4l10 9"/><path d="M5 11v9h14v-9"/><path d="M12 4v16" stroke-dasharray="2 2"/>',autoroof:'<path d="M2 13L12 4l10 9"/><path d="M5 11v9h14v-9"/><path d="M17 1.5l1 2 2 .7-2 .8-1 2-.8-2-2-.8 2-.7z" class="acc"/>',
  stair:'<path d="M3 20h5v-4h4v-4h4V8h5"/><path d="M3 20V8" stroke-dasharray="2 2"/>',
  terrainDlg:'<path d="M3 19l3-13 14 3-2 10z" stroke-dasharray="4 2"/><path d="M9 13h6M12 10v6"/>',terrain:'<path d="M3 19l3-13 14 3-2 10z" stroke-dasharray="4 2"/><path d="M14 15l4 4"/>',
  image:'<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-8 8"/>',calibrate:'<path d="M3 17L17 3l4 4L7 21z"/><path d="M7 13l2 2M10 10l2 2M13 7l2 2"/>',
  photo2d:'<rect x="2" y="5" width="9" height="14" rx="1"/><circle cx="5.5" cy="9.5" r="1.3"/><path d="M12.5 12h3M14 10l2 2-2 2"/><path d="M17 5h5v14h-5z" stroke-width="2.2"/>',
  move:'<path d="M12 3v18M3 12h18M12 3l-3 3M12 3l3 3M12 21l-3-3M12 21l3-3M3 12l3-3M3 12l3 3M21 12l-3-3M21 12l-3 3"/>',copy:'<rect x="8" y="8" width="12" height="12" rx="1.5"/><path d="M4 16V5a1 1 0 0 1 1-1h11"/>',
  rotate:'<path d="M20 12a8 8 0 1 1-3-6.2M20 4v5h-5"/>',mirror:'<path d="M12 3v18" stroke-dasharray="2 2"/><path d="M9 6L3 18h6zM15 6l6 12h-6z"/>',
  scale:'<rect x="3" y="11" width="10" height="10"/><path d="M13 11l8-8M15 3h6v6"/>',erase:'<path d="M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13"/>',
  offset:'<path d="M4 18L18 4"/><path d="M8 20L20 8" stroke-dasharray="3 2"/>',trim:'<path d="M4 12h16M12 4v16"/><path d="M15 9l5-5M15 4l5 5" class="acc"/>',extend:'<path d="M3 12h11" /><path d="M14 12h4" stroke-dasharray="2 2"/><path d="M20 4v16"/>',
  fillet:'<path d="M5 20V8a3 3 0 0 1 3-3h12"/><circle cx="5" cy="5" r="1.6" class="acc"/>',explode:'<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M6 18l2.5-2.5M15.5 8.5L18 6"/>',array:'<rect x="3" y="3" width="6" height="6"/><rect x="15" y="3" width="6" height="6"/><rect x="3" y="15" width="6" height="6"/><rect x="15" y="15" width="6" height="6"/>',
  measure:'<path d="M3 17L17 3l4 4L7 21z"/><path d="M7 13l2 2M10 10l2 2M13 7l2 2"/>',area:'<path d="M4 4h16v16H4z"/><path d="M4 12l8-8M4 20L20 4M12 20l8-8" stroke-width="1"/>',
  new:'<path d="M6 3h8l5 5v13H6z"/><path d="M14 3v5h5M12 11v6M9 14h6"/>',open:'<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
  save:'<path d="M5 3h11l3 3v15H5z"/><path d="M8 3v5h7V3M8 21v-7h8v7"/>',saveas:'<path d="M5 3h11l3 3v7M5 3v18h7"/><path d="M8 3v5h7V3M15 21l5-5-2-2-5 5v2z"/>',
  import:'<path d="M12 3v12M7 10l5 5 5-5"/><path d="M4 17v3h16v-3"/>',export:'<path d="M12 15V3M7 8l5-5 5 5"/><path d="M4 17v3h16v-3"/>',
  dxf:'<path d="M6 3h8l5 5v13H6z"/><path d="M14 3v5h5"/><text x="12.5" y="18" font-size="6.5" text-anchor="middle" fill="currentColor" stroke="none" font-weight="700">DXF</text>',
  pdf:'<path d="M6 3h8l5 5v13H6z"/><path d="M14 3v5h5"/><text x="12.5" y="18" font-size="6.5" text-anchor="middle" fill="currentColor" stroke="none" font-weight="700">PDF</text>',
  ifc:'<path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z"/><path d="M12 12l8-4.5M12 12v9M12 12L4 7.5"/>',obj:'<path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z" fill="currentColor" fill-opacity=".15"/><path d="M12 12l8-4.5M12 12v9M12 12L4 7.5"/>',
  svg:'<path d="M6 3h8l5 5v13H6z"/><path d="M14 3v5h5"/><text x="12.5" y="18" font-size="6.5" text-anchor="middle" fill="currentColor" stroke="none" font-weight="700">SVG</text>',
  png:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 15l5-5 5 5 3-3 5 5"/>',json:'<path d="M8 4c-2 0-2 2-2 4s-1 3-2 4c1 1 2 2 2 4s0 4 2 4M16 4c2 0 2 2 2 4s1 3 2 4c-1 1-2 2-2 4s0 4-2 4"/>',
  print:'<path d="M6 9V3h12v6M6 18H4v-7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v7h-2"/><path d="M7 14h10v7H7z"/>',
  areas:'<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M9 9v11M3 14h18"/>',
  view2d:'<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 12h9v9M12 3v9"/>',view3d:'<path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z"/><path d="M12 12l8-4.5M12 12v9M12 12L4 7.5"/>',
  extents:'<path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5"/>',zoomin:'<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4M8 11h6M11 8v6"/>',zoomout:'<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4M8 11h6"/>',
  theme:'<path d="M12 3a9 9 0 1 0 0 18z" fill="currentColor"/><circle cx="12" cy="12" r="9"/>',grid:'<path d="M3 3h18v18H3zM3 9h18M3 15h18M9 3v18M15 3v18"/>',panel:'<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M15 4v16"/>',
  settings:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
  help:'<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 .9-1 1.7v.5M12 17h.01"/>',undo:'<path d="M9 14L4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 0 12h-3"/>',redo:'<path d="M15 14l5-5-5-5"/><path d="M20 9H10a6 6 0 0 0 0 12h3"/>',
};
const RIBBON=[
  {id:'arquivo',label:'Arquivo',file:true,groups:[
    ['Projeto',[['act:new','Novo','new'],['act:projects','Abrir projeto','open'],['act:save','Salvar','save'],['act:saveas','Salvar como','saveas']]],
    ['Importar',[['act:import','Abrir arquivo','import','DWG, BAK, DXF, PDF, SVG, DWFx, imagem ou projeto JSON'],['act:convert','Converter desenho','wallsfrom','Transforma linhas em paredes, portas, janelas e ambientes editáveis'],['tool:image','Imagem / foto','image']]],
    ['Exportar',[['act:dxf','DXF','dxf','DXF para AutoCAD, BricsCAD, LibreCAD, SketchUp (abre e salva como DWG)'],['act:pdf','PDF','pdf','Prancha em PDF vetorial com escala e carimbo'],['act:ifc','IFC','ifc','Modelo BIM IFC para Revit, ArchiCAD, BIMx'],['act:obj','OBJ 3D','obj','Modelo 3D para SketchUp, Blender, Lumion'],['act:dwg','DWG','dxf','DWG para AutoCAD (no programa para Windows, com o ODA File Converter gratuito)'],['act:svg','SVG','svg'],['act:png','PNG','png'],['act:json','Backup','json','Backup completo do projeto']]],
    ['Saída',[['act:print','Imprimir','print']]]]},
  {id:'inicio',label:'Início',groups:[
    ['Seleção',[['tool:select','Selecionar','select','Selecionar (Esc)'],['tool:pan','Mão','pan','Mover a vista (botão do meio)']]],
    ['Modificar',[['tool:move','Mover','move','M'],['tool:copy','Copiar','copy','CP'],['tool:rotate','Rotacionar','rotate','RO'],['tool:mirror','Espelhar','mirror','ES'],['tool:scale','Escala','scale','ESC'],['tool:erase','Apagar','erase','Delete']]],
    ['Editar',[['tool:offset','Deslocar','offset','OF'],['tool:trim','Aparar','trim','TR'],['tool:extend','Estender','extend','EX'],['tool:fillet','Unir canto','fillet','F'],['act:explode','Explodir','explode','X'],['act:array','Matriz','array','MA']]],
    ['Medir',[['tool:measure','Distância','measure','DI'],['tool:area','Área','area','AR']]]]},
  {id:'desenho',label:'Desenho',groups:[
    ['Formas',[['tool:line','Linha','line','L'],['tool:polyline','Polilinha','polyline','PL'],['tool:rect','Retângulo','rect','REC'],['tool:circle','Círculo','circle','C'],['tool:arc','Arco','arc','A']]],
    ['Anotação',[['tool:text','Texto','text','T'],['tool:dim','Cota','dim','CO'],['tool:hatch','Hachura','hatch','HA']]]]},
  {id:'arq',label:'Arquitetura',groups:[
    ['Paredes',[['tool:wall','Parede','wall','PA'],['tool:wallrect','Retangular','wallrect','PR'],['act:wallsfrom','De linhas','wallsfrom','Converte linhas, polilinhas ou ambientes selecionados em paredes (PDL)']]],
    ['Aberturas',[['tool:door','Porta','door','PO'],['tool:window','Janela','window','JA']]],
    ['Ambientes',[['tool:autoroom','Automático','autoroom','Clique dentro das paredes (AA)'],['tool:room','Desenhar','room','AM']]],
    ['Cobertura',[['act:autoroof','Telhado auto.','autoroof','Telhado sobre as paredes (TA)'],['tool:roof','Telhado','roof','TEL']]],
    ['Circulação',[['tool:stair','Escada','stair','ESD']]],
    ['Interiores',[['tool:block','Mobiliário','block','B']]]]},
  {id:'anotar',label:'Anotar',groups:[
    ['Cotas',[['tool:dim','Cota','dim','CO'],['act:autodim','Cotar paredes','autodim','Cotas automáticas das paredes externas e totais (COT)']]],
    ['Texto',[['tool:text','Texto','text','T']]],['Hachura',[['tool:hatch','Hachura','hatch','HA']]],
    ['Relatórios',[['act:areas','Quadro de áreas','areas','QA']]]]},
  {id:'terreno',label:'Terreno',groups:[
    ['Lote',[['tool:terrainDlg','Por medidas','terrainDlg','TE'],['tool:terrain','Desenho livre','terrain','TL']]],
    ['Foto / imagem',[['tool:image','Anexar','image','IM'],['act:calibrate','Calibrar escala','calibrate'],['act:photo2d','Foto → desenho','photo2d','Gera paredes, portas, janelas e ambientes a partir da foto de uma planta (FD)']]]]},
  {id:'ferr',label:'Ferramentas',groups:[
    ['Automáticas',[['act:convert','Converter desenho','autodim','Transforma linhas importadas (DWG, DXF, PDF…) em paredes, portas, janelas e ambientes editáveis (CONV)'],['tool:autoroom','Ambiente auto.','autoroom'],['act:autodim','Cotar paredes','autodim'],['act:autoroof','Telhado auto.','autoroof'],['act:wallsfrom','Paredes de linhas','wallsfrom'],['act:photo2d','Foto → desenho','photo2d']]],
    ['Edição',[['tool:offset','Deslocar','offset'],['tool:trim','Aparar','trim'],['tool:extend','Estender','extend'],['tool:fillet','Unir canto','fillet'],['act:explode','Explodir','explode'],['act:array','Matriz','array']]],
    ['Análise',[['tool:measure','Distância','measure'],['tool:area','Área','area'],['act:areas','Quadro de áreas','areas']]]]},
  {id:'vista',label:'Vista',groups:[
    ['Vista',[['act:view2d','Planta 2D','view2d'],['act:view3d','Vista 3D','view3d']]],
    ['Navegar',[['act:extents','Enquadrar','extents','Z'],['act:zoomin','Aproximar','zoomin'],['act:zoomout','Afastar','zoomout']]],
    ['Aparência',[['act:theme','Tema','theme','Claro / escuro'],['act:grid','Grade','grid','F7'],['act:panel','Painel','panel']]],
    ['Sistema',[['act:settings','Configurações','settings'],['act:help','Ajuda','help'],['act:about','Sobre','help']]]]},
];
let ribbonTab=(()=>{try{return localStorage.getItem('va:ribbon')||'arq';}catch(e){return'arq';}})();
function buildRibbon(){
  $('#ribbonTabs').innerHTML=RIBBON.map(t=>'<button role="tab" data-rt="'+t.id+'" class="'+(t.file?'file ':'')+(t.id===ribbonTab?'on':'')+'">'+t.label+'</button>').join('')+'<button data-rt="__collapse" title="Recolher/expandir faixa" aria-label="Recolher faixa" style="margin-left:auto">▴</button>';
  const tab=RIBBON.find(t=>t.id===ribbonTab)||RIBBON[1];
  $('#ribbon').innerHTML=tab.groups.map(([g,items])=>'<div class="rgroup"><div class="rbtns">'+items.map(([cmd,label,icon,tip])=>
    '<button class="rb" data-cmd="'+cmd+'" title="'+esc(label+(tip?' — '+tip:''))+'"><svg viewBox="0 0 24 24">'+(IC[icon]||'')+'</svg><span>'+esc(label)+'</span></button>').join('')+'</div><div class="rlabel">'+g+'</div></div>').join('');
  $$('#ribbonTabs [data-rt]').forEach(b=>b.addEventListener('click',()=>{const id=b.dataset.rt;
    if(id==='__collapse'){$('#ribbon').classList.toggle('collapsed');b.textContent=$('#ribbon').classList.contains('collapsed')?'▾':'▴';resize();return;}
    if(id===ribbonTab&&!$('#ribbon').classList.contains('collapsed')){}ribbonTab=id;try{localStorage.setItem('va:ribbon',id);}catch(e){}$('#ribbon').classList.remove('collapsed');buildRibbon();resize();}));
  $$('#ribbon [data-cmd]').forEach(b=>b.addEventListener('click',()=>runRibbon(b.dataset.cmd)));
  markRibbon();
}
function runRibbon(cmd){const[k,v]=cmd.split(':');if(k==='tool'){if(mode3d&&!['image','terrainDlg'].includes(v))setView('2d');startTool(v);}else if(ACT[v])ACT[v]();}
function markRibbon(){const name=tool?tool.name:(panMode?'pan':'select');$$('#ribbon [data-cmd]').forEach(b=>b.classList.toggle('on',b.dataset.cmd==='tool:'+name));}
const OPTS={wall:['wallT','wallH'],wallrect:['wallT','wallH'],door:['doorKind','doorW','doorH'],window:['winKind','winW','winSill','winH'],text:['textSize'],dim:['dimSize'],block:['blockKind'],mirror:['mirrorErase'],
  roof:['roofKind','roofSlope','roofOverhang','@autoroof'],stair:['stairW','stairRiser','stairTread'],hatch:['hatchPattern','hatchScale'],offset:['offsetDist']};
const SLABEL={wallT:'Espessura (m)',wallH:'Altura (m)',doorW:'Largura (m)',doorH:'Altura (m)',winW:'Largura (m)',winSill:'Peitoril (m)',winH:'Altura (m)',textSize:'Tamanho do texto (m)',dimSize:'Tamanho da cota (m)',blockKind:'Tipo',mirrorErase:'Apagar original',gridStep:'Grade (m)',snapStep:'Passo do cursor (m)',
  doorKind:'Tipo',winKind:'Tipo',roofKind:'Tipo',roofSlope:'Inclinação (%)',roofOverhang:'Beiral (m)',stairW:'Largura (m)',stairRiser:'Espelho (m)',stairTread:'Piso (m)',hatchPattern:'Padrão',hatchScale:'Escala',offsetDist:'Distância (m)'};
const CHOICES={doorKind:DOOR_KINDS,winKind:WIN_KINDS,roofKind:ROOF_KINDS,hatchPattern:HATCHES,blockKind:null};
const TOOL_TITLE={select:'Selecionar',pan:'Mover vista'};
function toolTitle(name){if(TOOL_TITLE[name])return TOOL_TITLE[name];for(const t of RIBBON)for(const[,items]of t.groups)for(const[cmd,label]of items)if(cmd==='tool:'+name)return label;return name;}
function updateToolUI(){
  const name=tool?tool.name:(panMode?'pan':'select');markRibbon();
  cv.classList.toggle('pan',panMode&&!tool);
  const ob=$('#optbar'),keys=OPTS[name];
  let h='<span class="tname">'+esc(toolTitle(name))+'</span>';
  if(keys)h+=keys.map(k=>{
    if(k[0]==='@')return'<button type="button" class="sm primary" data-oa="'+k.slice(1)+'">Automático sobre as paredes</button>';
    if(k==='blockKind')return'<label>'+SLABEL[k]+' <select data-s="'+k+'">'+Object.entries(BLOCKS).map(([id,b])=>'<option value="'+id+'"'+(S().blockKind===id?' selected':'')+'>'+b.name+'</option>').join('')+'</select></label>';
    if(CHOICES[k])return'<span class="chips">'+Object.entries(CHOICES[k]).map(([id,t])=>'<button type="button" class="chip'+(S()[k]===id?' on':'')+'" data-c="'+k+'" data-v="'+id+'">'+esc(t)+'</button>').join('')+'</span>';
    if(typeof DEFAULT_SETTINGS[k]==='boolean')return'<label><input type="checkbox" data-s="'+k+'"'+(S()[k]?' checked':'')+'> '+SLABEL[k]+'</label>';
    return'<label>'+SLABEL[k]+' <input class="num" inputmode="decimal" data-s="'+k+'" value="'+fmt(S()[k],k==='roofSlope'?0:2).replace(/\./g,'')+'"></label>';}).join('');
  h+='<span class="hint">'+esc(tool?tool.prompt:'Clique para selecionar · arraste para mover · alças editam pontos · janela esquerda→direita (dentro) / direita→esquerda (cruzando)')+'</span>';
  ob.innerHTML=h;
  ob.querySelectorAll('[data-s]').forEach(el=>el.addEventListener('change',()=>{const k=el.dataset.s;if(el.type==='checkbox')S()[k]=el.checked;else if(el.tagName==='SELECT')S()[k]=el.value;else{const v=num(el.value);if(v>0)S()[k]=v;}scheduleSave();redraw();}));
  ob.querySelectorAll('[data-c]').forEach(el=>el.addEventListener('click',()=>{S()[el.dataset.c]=el.dataset.v;scheduleSave();updateToolUI();redraw();}));
  ob.querySelectorAll('[data-oa]').forEach(el=>el.addEventListener('click',()=>ACT[el.dataset.oa]()));
}

/* ---------- painel de propriedades ---------- */
function field(label,type,get,set,extra={}){return{label,type,get,set,...extra};}
function renderFields(el,fields){
  el.innerHTML=fields.map((f,i)=>{
    const v=f.get?f.get():'';
    if(f.type==='ro')return'<div class="f"><span>'+f.label+'</span><div class="ro">'+esc(v)+'</div></div>';
    if(f.type==='check')return'<div class="f"><span>'+f.label+'</span><input type="checkbox" data-i="'+i+'"'+(v?' checked':'')+'></div>';
    if(f.type==='select')return'<div class="f"><span>'+f.label+'</span><select data-i="'+i+'">'+f.options.map(([k,t])=>'<option value="'+esc(k)+'"'+(k===v?' selected':'')+'>'+esc(t)+'</option>').join('')+'</select></div>';
    if(f.type==='textarea')return'<div class="f"><span>'+f.label+'</span><textarea rows="3" data-i="'+i+'">'+esc(v)+'</textarea></div>';
    if(f.type==='range')return'<div class="f"><span>'+f.label+'</span><input type="range" min="0" max="1" step="0.05" data-i="'+i+'" value="'+v+'"></div>';
    if(f.type==='button')return'<div class="btnrow"><button type="button" data-i="'+i+'"'+(f.cls?' class="'+f.cls+'"':'')+'>'+f.label+'</button></div>';
    if(f.type==='html')return f.html;
    return'<div class="f"><span>'+f.label+'</span><input type="'+(f.type==='num'?'text':'text')+'" inputmode="'+(f.type==='num'?'decimal':'text')+'" data-i="'+i+'" value="'+esc(f.type==='num'?fmt(v,f.dec??3).replace(/\./g,''):v)+'"></div>';
  }).join('');
  el.querySelectorAll('[data-i]').forEach(inp=>{
    const f=fields[+inp.dataset.i];
    if(f.type==='button'){inp.addEventListener('click',f.set);return;}
    const ev=f.type==='range'?'input':'change';
    inp.addEventListener(ev,()=>{let v=f.type==='check'?inp.checked:inp.value;if(f.type==='num'||f.type==='range'){v=num(String(v).replace(/\.(?=\d{3})/g,''));if(isNaN(v))return;if(f.min!=null&&v<f.min)v=f.min;}f.set(v);if(f.type==='range'){redraw();return;}commit();});
    if(f.type==='range')inp.addEventListener('change',()=>commit());
  });
}
const ptFields=(lbl,o,k)=>[field(lbl+' X','num',()=>o[k].x,v=>{o[k]={...o[k],x:v};}),field(lbl+' Y','num',()=>o[k].y,v=>{o[k]={...o[k],y:v};})];
function buildProps(){
  const el=$('#props'),ids=[...sel].filter(id=>getObj(id));
  if(!ids.length){
    const cnt={};doc.objects.forEach(o=>cnt[o.type]=(cnt[o.type]||0)+1);
    const rA=doc.objects.filter(o=>o.type==='room').reduce((s_,o)=>s_+Math.abs(polyArea(o.pts)),0),wL=doc.objects.filter(o=>o.type==='wall').reduce((s_,w)=>s_+dist(w.a,w.b),0),tA=doc.objects.filter(o=>o.type==='terrain').reduce((s_,o)=>s_+Math.abs(polyArea(o.pts)),0);
    el.innerHTML='<div class="ftitle">'+esc(doc.name)+'</div><div class="stat"><div><b>'+fmt(rA,1)+'</b><span>m² de ambientes</span></div><div><b>'+fmt(tA,1)+'</b><span>m² de terreno</span></div><div><b>'+fmt(wL,1)+'</b><span>m de paredes</span></div><div><b>'+((cnt.door||0)+(cnt.window||0))+'</b><span>portas e janelas</span></div></div>'+
      '<div class="muted" style="font-size:12px">'+(Object.keys(cnt).length?Object.entries(cnt).map(([k,v])=>esc(TYPE_NAME[k]||k)+': '+v).join(' · '):'Projeto vazio.')+'</div>'+
      '<div class="note">Dica: <span class="kbd">TE</span> cria o terreno pelas medidas, <span class="kbd">PA</span> desenha paredes, <span class="kbd">AA</span> cria o ambiente com um clique e <span class="kbd">TA</span> gera o telhado. Arraste um arquivo DWG, DXF ou PDF para a tela para importar.</div>';
    return;
  }
  const layerSel=objs=>field('Camada','select',()=>objs[0].layer,v=>{objs.forEach(o=>o.layer=v);},{options:doc.layers.map(l=>[l.id,l.name])});
  if(ids.length>1){const objs=ids.map(getObj);renderFields(el,[field('Seleção','ro',()=>objs.length+' objetos'),layerSel(objs),field('Apagar seleção','button',null,()=>eraseSel(),{cls:'danger'})]);return;}
  const o=getObj(ids[0]),F=[field('','html',null,null,{html:'<div class="ftitle">'+esc(TYPE_NAME[o.type]||o.type)+' <span class="badge">'+esc(getLayer(o.layer).name)+'</span></div>'}),layerSel([o])];
  switch(o.type){
    case 'line':F.push(...ptFields('Início',o,'a'),...ptFields('Fim',o,'b'),field('Comprimento','num',()=>dist(o.a,o.b),v=>{if(v>0)o.b=add(o.a,mul(norm(sub(o.b,o.a)),v));}),field('Ângulo (°)','ro',()=>fmt((angOf(sub(o.b,o.a))*R2D+360)%360,2)));break;
    case 'wall':F.push(...ptFields('Início',o,'a'),...ptFields('Fim',o,'b'),field('Comprimento','num',()=>dist(o.a,o.b),v=>{if(v>0)o.b=add(o.a,mul(norm(sub(o.b,o.a)),v));}),field('Espessura','num',()=>o.t,v=>{if(v>0)o.t=v;}),field('Altura','num',()=>o.h,v=>{if(v>0)o.h=v;}),field('Aberturas','ro',()=>openingsOf([o.id]).length));break;
    case 'polyline':F.push(field('Fechada','check',()=>!!o.closed,v=>{o.closed=v;}),field('Vértices','ro',()=>o.pts.length),field('Comprimento','ro',()=>fmt(polyPerim(o.pts,o.closed))+' m'));if(o.closed)F.push(field('Área','ro',()=>fmt(Math.abs(polyArea(o.pts)))+' m²'));break;
    case 'circle':F.push(...ptFields('Centro',o,'c'),field('Raio','num',()=>o.r,v=>{if(v>0)o.r=v;}),field('Diâmetro','num',()=>o.r*2,v=>{if(v>0)o.r=v/2;}),field('Área','ro',()=>fmt(Math.PI*o.r*o.r)+' m²'));break;
    case 'door':F.push(field('Tipo de porta','select',()=>o.kind||'giro',v=>{o.kind=v;},{options:Object.entries(DOOR_KINDS)}),field('Largura','num',()=>o.w,v=>{if(v>0)o.w=v;}),field('Altura','num',()=>o.h,v=>{if(v>0)o.h=v;}),field('Posição na parede','num',()=>o.off,v=>{o.off=v;}),field('Abrir para o outro lado','check',()=>!!o.flip,v=>{o.flip=v;}),field('Inverter dobradiça','check',()=>!!o.hinge,v=>{o.hinge=v;}));break;
    case 'window':F.push(field('Tipo de janela','select',()=>o.kind||'correr',v=>{o.kind=v;},{options:Object.entries(WIN_KINDS)}),field('Largura','num',()=>o.w,v=>{if(v>0)o.w=v;}),field('Peitoril','num',()=>o.sill,v=>{if(v>=0)o.sill=v;}),field('Altura','num',()=>o.h,v=>{if(v>0)o.h=v;}),field('Posição na parede','num',()=>o.off,v=>{o.off=v;}),field('Abertura para o outro lado','check',()=>!!o.flip,v=>{o.flip=v;}),field('Área de vão','ro',()=>fmt(o.w*o.h)+' m²'));break;
    case 'roof':{const A=roofAreas(o);F.push(field('Tipo','select',()=>o.kind,v=>{o.kind=v;},{options:Object.entries(ROOF_KINDS)}),field('Inclinação (%)','num',()=>o.slope,v=>{if(v>=0)o.slope=v;},{dec:0}),field('Beiral (m)','num',()=>o.overhang,v=>{if(v>=0)o.overhang=v;}),
      field('Altura de apoio (m)','num',()=>o.base,v=>{if(v>=0)o.base=v;}),field('Largura (m)','num',()=>o.w,v=>{if(v>0)o.w=v;}),field('Profundidade (m)','num',()=>o.d,v=>{if(v>0)o.d=v;}),field('Rotação (°)','num',()=>(o.rot||0)*R2D,v=>{o.rot=v*D2R;},{dec:1}),
      field('Área em projeção','ro',()=>fmt(A.proj)+' m²'),field('Área real de telhado','ro',()=>fmt(A.real)+' m²'),field('Altura da cumeeira','ro',()=>fmt(o.base+A.rise)+' m'),
      field('↻ Girar cumeeira','button',null,()=>{o.ridgeAxis=o.ridgeAxis==='y'?'x':'y';commit();}),field('⇅ Inverter caimento (1 água)','button',null,()=>{o.flip=!o.flip;commit();}));break;}
    case 'stair':{const I=stairInfo(o);F.push(field('Largura (m)','num',()=>o.w,v=>{if(v>0)o.w=v;}),field('Degraus (espelhos)','num',()=>o.n,v=>{if(v>=2)o.n=Math.round(v);},{dec:0}),field('Piso (m)','num',()=>o.tread,v=>{if(v>0)o.tread=v;}),field('Altura a vencer (m)','num',()=>o.height||S().wallH,v=>{if(v>0)o.height=v;}),
      field('Espelho','ro',()=>fmt(I.riser*100,1)+' cm'),field('Comprimento','ro',()=>fmt(I.L)+' m'),field('Blondel (2e+p)','ro',()=>fmt((2*I.riser+I.tread)*100,1)+' cm '+((2*I.riser+I.tread)>=.63&&(2*I.riser+I.tread)<=.65?'✔':'(ideal 63–65)')),field('Rotação (°)','num',()=>(o.rot||0)*R2D,v=>{o.rot=v*D2R;},{dec:1}));break;}
    case 'hatch':F.push(field('Padrão','select',()=>o.pattern,v=>{o.pattern=v;},{options:Object.entries(HATCHES)}),field('Escala','num',()=>o.scale||1,v=>{if(v>0)o.scale=v;}),field('Ângulo (°)','num',()=>o.angle||0,v=>{o.angle=v;},{dec:1}),field('Área','ro',()=>fmt(Math.abs(polyArea(o.pts)))+' m²'));break;
    case 'arc':F.push(...ptFields('Centro',o,'c'),field('Raio','num',()=>o.r,v=>{if(v>0)o.r=v;}),field('Ângulo inicial (°)','num',()=>o.a0*R2D,v=>{o.a0=v*D2R;},{dec:1}),field('Ângulo final (°)','num',()=>o.a1*R2D,v=>{o.a1=v*D2R;},{dec:1}),field('Comprimento','ro',()=>fmt(o.r*(arcFix(o)-o.a0))+' m'));break;
    case 'room':F.push(field('Nome','text',()=>o.name||'',v=>{o.name=v;}),field('Área','ro',()=>fmt(Math.abs(polyArea(o.pts)))+' m²'),field('Perímetro','ro',()=>fmt(polyPerim(o.pts))+' m'),field('Piso / acabamento','text',()=>o.floor||'',v=>{o.floor=v;}),field('Tamanho do texto','num',()=>o.size||Math.max(S().textSize,Math.min(.8,Math.sqrt(Math.abs(polyArea(o.pts)))/18)),v=>{if(v>0)o.size=v;}));break;
    case 'terrain':{
      if(!o.setbacks||o.setbacks.length!==o.pts.length)o.setbacks=o.pts.map((_,i)=>(o.setbacks||[])[i]||0);
      F.push(field('Nome','text',()=>o.name||'',v=>{o.name=v;}),field('Área','ro',()=>fmt(Math.abs(polyArea(o.pts)))+' m²'),field('Perímetro','ro',()=>fmt(polyPerim(o.pts))+' m'),field('Tamanho do texto','num',()=>o.size||Math.max(S().textSize,Math.min(3,Math.sqrt(Math.abs(polyArea(o.pts)))/30)),v=>{if(v>0)o.size=v;}));
      F.push(field('','html',null,null,{html:'<div class="muted" style="margin:8px 0 4px">Lados e recuos (afastamentos)</div>'}));
      o.pts.forEach((p,i)=>{const q=o.pts[(i+1)%o.pts.length];F.push(field('V'+(i+1)+'→V'+((i+1)%o.pts.length+1)+' ('+fmt(dist(p,q))+' m)','num',()=>o.setbacks[i]||0,v=>{o.setbacks[i]=Math.max(0,v);},{dec:2}));});
      break;}
    case 'dim':F.push(field('Medida','ro',()=>fmt(dist(o.a,o.b))+' m'),field('Afastamento','num',()=>o.off,v=>{o.off=v;}),field('Texto (opcional)','text',()=>o.text||'',v=>{o.text=v;}),field('Tamanho','num',()=>o.size||S().dimSize,v=>{if(v>0)o.size=v;}));break;
    case 'text':F.push(field('Texto','textarea',()=>o.text,v=>{o.text=v;}),field('Tamanho','num',()=>o.size||S().textSize,v=>{if(v>0)o.size=v;}),field('Ângulo (°)','num',()=>(o.ang||0)*R2D,v=>{o.ang=v*D2R;},{dec:1}),...ptFields('Posição',o,'p'));break;
    case 'image':F.push(field('Largura (m)','num',()=>o.w,v=>{if(v>0){o.h=o.h*v/o.w;o.w=v;}}),field('Altura (m)','num',()=>o.h,v=>{if(v>0){o.w=o.w*v/o.h;o.h=v;}}),field('Rotação (°)','num',()=>(o.rot||0)*R2D,v=>{o.rot=v*D2R;},{dec:1}),field('Opacidade','range',()=>o.opacity??1,v=>{o.opacity=v;}),...ptFields('Canto',o,'p'),
      field('📏 Calibrar escala pela foto','button',null,()=>startTool('calibrate',o.id)),field('🪄 Gerar desenho a partir da foto','button',null,()=>photoDialog(o.id)));break;
    case 'block':{const B=BLOCKS[o.kind];F.push(field('Tipo','select',()=>o.kind,v=>{o.kind=v;o.w=BLOCKS[v].w;o.d=BLOCKS[v].d;},{options:Object.entries(BLOCKS).map(([k,b])=>[k,b.name])}),field('Largura','num',()=>o.w||B.w,v=>{if(v>0)o.w=v;}),field('Profundidade','num',()=>o.d||B.d,v=>{if(v>0)o.d=v;}),field('Rotação (°)','num',()=>(o.rot||0)*R2D,v=>{o.rot=v*D2R;},{dec:1}),field('Espelhado','check',()=>!!o.mirror,v=>{o.mirror=v;}),...ptFields('Posição',o,'p'));break;}
  }
  F.push(field('Apagar','button',null,()=>eraseSel(),{cls:'danger'}));
  renderFields(el,F);
}

/* ---------- camadas ---------- */
function buildLayers(){
  const el=$('#layers');
  el.innerHTML='<div class="muted" style="font-size:11px;margin-bottom:4px">Ativa · cor · nome · visível · travada · excluir</div>'+doc.layers.map((l,i)=>'<div class="lay'+(l.visible===false?' off':'')+'" data-i="'+i+'">'+
    '<input type="radio" name="actL" title="Camada ativa"'+(doc.activeLayer===l.id?' checked':'')+' data-a="act">'+
    '<input type="color" title="'+(l.color==='auto'?'Cor automática (clique para escolher)':'Cor')+'" value="'+(l.color==='auto'?(uiDark()?'#e7efe9':'#17221c'):l.color)+'" data-a="color">'+
    '<input class="lname" value="'+esc(l.name)+'" data-a="name" aria-label="Nome da camada">'+
    '<button type="button" data-a="vis" title="Mostrar/ocultar">'+(l.visible===false?'◌':'👁')+'</button>'+
    '<button type="button" data-a="lock" title="Travar/destravar">'+(l.locked?'🔒':'🔓')+'</button>'+
    '<button type="button" data-a="del" title="Excluir camada">✕</button></div>').join('');
  el.querySelectorAll('[data-a]').forEach(c=>{const row=c.closest('.lay'),l=doc.layers[+row.dataset.i],a=c.dataset.a;
    const ev=(a==='name'||a==='color')?'change':(a==='act'?'change':'click');
    c.addEventListener(ev,()=>{
      if(a==='act')doc.activeLayer=l.id;
      if(a==='color')l.color=c.value;
      if(a==='name')l.name=c.value||l.name;
      if(a==='vis')l.visible=l.visible===false;
      if(a==='lock')l.locked=!l.locked;
      if(a==='del'){if(doc.layers.length<=1)return log('É preciso ao menos uma camada.','err');const n=doc.objects.filter(o=>o.layer===l.id).length;if(n&&!confirm('A camada "'+l.name+'" tem '+n+' objeto(s). Eles serão movidos para "'+doc.layers.find(x=>x!==l).name+'". Continuar?'))return;const to=doc.layers.find(x=>x!==l).id;doc.objects.forEach(o=>{if(o.layer===l.id)o.layer=to;});doc.layers=doc.layers.filter(x=>x!==l);if(doc.activeLayer===l.id)doc.activeLayer=to;}
      commit();buildLayers();});});
}
$('#addLayer').addEventListener('click',()=>{const id='c'+uid();doc.layers.push({id,name:'Camada '+(doc.layers.length+1),color:'#'+Math.floor(Math.random()*0xaaaaaa+0x444444).toString(16).padStart(6,'0'),visible:true,locked:false});doc.activeLayer=id;commit();});

/* ---------- diálogos ---------- */
const dlg=$('#dlg');
let dlgFinish=null;
function modal(title,html,buttons,onOpen){
  return new Promise(res=>{
    if(dlg.open&&dlgFinish){const f=dlgFinish;dlgFinish=null;f(undefined,true);}
    $('#dlgTitle').textContent=title;$('#dlgBody').innerHTML=html;const bt=$('#dlgBtns');bt.innerHTML='';bt.hidden=!buttons.length;
    let done=false;const finish=(v,keepOpen)=>{if(done)return;done=true;if(dlgFinish===finish)dlgFinish=null;if(!keepOpen&&dlg.open)dlg.close();res(v);};
    dlgFinish=finish;
    buttons.forEach(b=>{const e=document.createElement('button');e.type='button';e.textContent=b.label;if(b.primary)e.className='primary';e.addEventListener('click',async()=>{const r=b.onClick?await b.onClick():b.value;if(r===false)return;finish(r);});bt.appendChild(e);});
    if(!dlg.open)dlg.showModal();if(onOpen)onOpen($('#dlgBody'));
  });
}
dlg.addEventListener('close',()=>{if(dlgFinish){const f=dlgFinish;dlgFinish=null;f(undefined,true);}});
async function askText(title,def,multi){
  const html=multi?'<textarea id="askV" rows="4" style="width:min(420px,80vw)">'+esc(def||'')+'</textarea>':'<input id="askV" style="width:min(360px,80vw)" value="'+esc(def||'')+'">';
  return modal(title,html,[{label:'Cancelar',value:null},{label:'OK',primary:true,onClick:()=>$('#askV').value}],b=>{const i=b.querySelector('#askV');i.focus();i.select&&i.select();i.addEventListener('keydown',e=>{if(e.key==='Enter'&&(!multi||e.ctrlKey)){e.preventDefault();dlg.querySelector('#dlgBtns .primary').click();}});});
}

/* ---- terreno por dimensões ---- */
function terrainFromSides(rows,startAz){
  let cur=P(0,0),dir=startAz*D2R;const pts=[P(0,0)];
  rows.forEach((r,i)=>{cur=add(cur,P(r.L*Math.cos(dir),r.L*Math.sin(dir)));pts.push(cur);dir+=(180-r.ang)*D2R;});
  const gap=dist(pts[pts.length-1],pts[0]);if(gap<0.01)pts.pop();
  return{pts,gap};
}
function polyPreviewSVG(pts,extra){
  if(!pts||pts.length<2)return'<svg viewBox="0 0 300 220"></svg>';
  let x0=Infinity,y0=Infinity,x1=-Infinity,y1=-Infinity;const all=[...pts,...(extra||[])];all.forEach(p=>{x0=Math.min(x0,p.x);y0=Math.min(y0,p.y);x1=Math.max(x1,p.x);y1=Math.max(y1,p.y);});
  const w=Math.max(x1-x0,1e-6),h=Math.max(y1-y0,1e-6),k=Math.min(240/w,170/h),ox=150-(x0+w/2)*k,oy=110+(y0+h/2)*k,T=p=>[ox+p.x*k,oy-p.y*k];
  const sg=Math.sign(polyArea(pts))||1;let s='<svg viewBox="0 0 300 220"><polygon points="'+pts.map(p=>T(p).join(',')).join(' ')+'" fill="rgba(63,185,80,.15)" stroke="#3fb950" stroke-width="2"/>';
  if(extra&&extra.length>2)s+='<polygon points="'+extra.map(p=>T(p).join(',')).join(' ')+'" fill="none" stroke="#e3a33b" stroke-dasharray="4 3"/>';
  pts.forEach((p,i)=>{const q=pts[(i+1)%pts.length],m=mid(p,q),d=norm(sub(q,p)),o=mul(perp(d),-sg),t=T(add(m,mul(o,12/k)));s+='<text x="'+t[0]+'" y="'+t[1]+'" font-size="10" fill="currentColor" text-anchor="middle" dominant-baseline="middle">'+fmt(dist(p,q))+'</text>';const v=T(p);s+='<circle cx="'+v[0]+'" cy="'+v[1]+'" r="2.5" fill="#3fb950"/>';});
  return s+'</svg>';
}
function terrainDialog(){
  let mode='rect';
  const sideRows=[{L:12,ang:90},{L:30,ang:90},{L:12,ang:90},{L:30,ang:90}];
  const html='<div class="dtabs"><button type="button" data-m="rect" class="on">Retangular</button><button type="button" data-m="sides">Lados e ângulos</button><button type="button" data-m="coords">Coordenadas</button><button type="button" data-m="draw">Desenhar à mão</button></div>'+
  '<div class="terrWrap"><div id="tForm"></div><div class="prev"><div id="tPrev"></div><div class="info" id="tInfo"></div></div></div>'+
  '<div class="grid2" style="margin-top:12px"><label>Nome<input id="tName" value="Terreno"></label><label>Origem (canto inicial) X;Y<input id="tOrig" value="0;0"></label></div>';
  const forms={
    rect:()=>'<div class="grid2"><label>Frente / testada (m)<input data-k="f" value="12"></label><label>Profundidade (m)<input data-k="p" value="30"></label></div>'+
      '<div class="muted" style="margin:12px 0 6px">Recuos obrigatórios (opcional)</div><div class="grid2"><label>Frontal (m)<input data-k="rf" value="0"></label><label>Fundos (m)<input data-k="rfu" value="0"></label><label>Lateral esquerda (m)<input data-k="re" value="0"></label><label>Lateral direita (m)<input data-k="rd" value="0"></label></div>',
    sides:()=>'<div class="muted" style="margin-bottom:6px">Percorra o terreno no sentido anti-horário. Ângulo interno = ângulo no vértice ao final do lado. Se não fechar, o último lado é calculado.</div>'+
      '<label class="muted" style="display:flex;gap:6px;align-items:center;margin-bottom:6px">Direção do 1º lado (°, 0 = para a direita) <input data-k="az" value="0" style="width:70px"></label>'+
      '<table class="t"><thead><tr><th>Lado</th><th class="n">Comprimento (m)</th><th class="n">Ângulo interno (°)</th><th></th></tr></thead><tbody>'+
      sideRows.map((r,i)=>'<tr><td>L'+(i+1)+'</td><td class="n"><input data-r="'+i+'" data-f="L" value="'+fmt(r.L).replace(/\./g,'')+'"></td><td class="n"><input data-r="'+i+'" data-f="ang" value="'+fmt(r.ang).replace(/\./g,'')+'"></td><td><button type="button" data-del="'+i+'">✕</button></td></tr>').join('')+
      '</tbody></table><div class="btnrow"><button type="button" id="addSide">+ Lado</button></div>',
    coords:()=>'<div class="muted" style="margin-bottom:6px">Um vértice por linha, no formato X;Y (metros). Ex.: <span class="kbd">0;0</span></div><textarea data-k="coords" rows="9" style="width:100%">0;0\n15;0\n17;25\n-1;28</textarea>',
    draw:()=>'<p>Feche esta janela e clique os vértices na planta.</p><p class="muted">Dica: após o primeiro ponto, digite o comprimento do lado na linha de comando e aponte a direção com o mouse (use ORTO/F8 para ângulos retos). Digite <span class="kbd">F</span> para fechar.</p>',
  };
  let computed={pts:[],setbacks:[]};
  const read=k=>{const e=$('#tForm [data-k="'+k+'"]');return e?num(e.value):NaN;};
  const update=()=>{
    const info=$('#tInfo');let pts=[],sb=[],msg='';
    const o=parsePoint($('#tOrig').value||'0;0',null)||P(0,0);
    if(mode==='rect'){const f=read('f'),p=read('p');if(f>0&&p>0){pts=[P(0,0),P(f,0),P(f,p),P(0,p)];sb=[read('rf')||0,read('rd')||0,read('rfu')||0,read('re')||0];}else msg='Informe frente e profundidade.';}
    else if(mode==='sides'){const rows=sideRows.filter(r=>r.L>0);if(rows.length>=2){const r=terrainFromSides(rows,read('az')||0);pts=r.pts;sb=pts.map(()=>0);if(r.gap>=.01)msg='Lado de fechamento calculado: '+fmt(r.gap)+' m';}else msg='Informe ao menos 2 lados.';}
    else if(mode==='coords'){const t=($('#tForm [data-k="coords"]')||{}).value||'';pts=t.split(/\n+/).map(l=>parsePoint(l,null)).filter(Boolean);sb=pts.map(()=>0);if(pts.length<3)msg='Informe ao menos 3 vértices válidos.';}
    pts=pts.map(p=>add(p,o));
    if(pts.length>=3&&polyArea(pts)<0&&mode==='coords'){/* mantém a ordem informada */}
    computed={pts,setbacks:sb};
    const inner=pts.length>=3&&sb.some(v=>v>0)?offsetPoly(pts,sb):null;
    $('#tPrev').innerHTML=mode==='draw'?'':polyPreviewSVG(pts,inner);
    info.innerHTML=pts.length>=3?'Área: <b>'+fmt(Math.abs(polyArea(pts)))+' m²</b> · Perímetro: '+fmt(polyPerim(pts))+' m'+(inner?'<br>Área edificável (recuos): '+fmt(Math.abs(polyArea(inner)))+' m²':'')+(msg?'<br>'+esc(msg):''):esc(msg);
  };
  const setMode=m=>{mode=m;$$('#dlgBody .dtabs button').forEach(b=>b.classList.toggle('on',b.dataset.m===m));$('#tForm').innerHTML=forms[m]();bindForm();update();};
  const bindForm=()=>{
    $$('#tForm input,#tForm textarea').forEach(i=>i.addEventListener('input',()=>{if(i.dataset.r!=null){sideRows[+i.dataset.r][i.dataset.f]=num(i.value)||0;}update();}));
    $$('#tForm [data-del]').forEach(b=>b.addEventListener('click',()=>{if(sideRows.length>2){sideRows.splice(+b.dataset.del,1);setMode('sides');}}));
    const a=$('#addSide');if(a)a.addEventListener('click',()=>{sideRows.push({L:10,ang:90});setMode('sides');});
  };
  modal('Terreno por dimensões',html,[{label:'Cancelar',value:null},{label:'Gerar terreno',primary:true,onClick:()=>{
    if(mode==='draw'){setTimeout(()=>startTool('terrain'),0);return true;}
    if(computed.pts.length<3){alert('Dimensões inválidas.');return false;}
    const o=addObj({type:'terrain',pts:computed.pts,setbacks:computed.setbacks,name:$('#tName').value||'Terreno'});
    sel=new Set([o.id]);commit();zoomExtents();log('Terreno gerado: '+fmt(Math.abs(polyArea(o.pts)))+' m²','res');return true;}}],
    body=>{body.querySelectorAll('.dtabs button').forEach(b=>b.addEventListener('click',()=>setMode(b.dataset.m)));$('#tOrig').addEventListener('input',update);setMode('rect');});
}

/* ---- quadro de áreas ---- */
function areasDialog(){
  const ter=doc.objects.filter(o=>o.type==='terrain'),rooms=doc.objects.filter(o=>o.type==='room'),walls=doc.objects.filter(o=>o.type==='wall');
  const tA=ter.reduce((s,o)=>s+Math.abs(polyArea(o.pts)),0),rA=rooms.reduce((s,o)=>s+Math.abs(polyArea(o.pts)),0),wA=walls.reduce((s,w)=>s+dist(w.a,w.b)*w.t,0);
  const built=rA+wA;
  let h='<table class="t"><thead><tr><th>Item</th><th class="n">Área (m²)</th><th class="n">Perímetro (m)</th></tr></thead><tbody>';
  ter.forEach(o=>{h+='<tr><td><b>'+esc(o.name||'Terreno')+'</b></td><td class="n">'+fmt(Math.abs(polyArea(o.pts)))+'</td><td class="n">'+fmt(polyPerim(o.pts))+'</td></tr>';if(o.setbacks&&o.setbacks.some(v=>v>0))h+='<tr><td>&nbsp;&nbsp;Área edificável (recuos)</td><td class="n">'+fmt(Math.abs(polyArea(offsetPoly(o.pts,o.setbacks))))+'</td><td></td></tr>';});
  rooms.forEach(o=>{h+='<tr><td>'+esc(o.name||'Ambiente')+(o.floor?' <span class="muted">('+esc(o.floor)+')</span>':'')+'</td><td class="n">'+fmt(Math.abs(polyArea(o.pts)))+'</td><td class="n">'+fmt(polyPerim(o.pts))+'</td></tr>';});
  h+='<tr><td><b>Total área útil (ambientes)</b></td><td class="n"><b>'+fmt(rA)+'</b></td><td></td></tr>';
  h+='<tr><td>Área de paredes (projeção)</td><td class="n">'+fmt(wA)+'</td><td></td></tr>';
  h+='<tr><td><b>Área construída estimada</b></td><td class="n"><b>'+fmt(built)+'</b></td><td></td></tr>';
  if(tA>0)h+='<tr><td><b>Taxa de ocupação estimada</b></td><td class="n"><b>'+fmt(built/tA*100,1)+' %</b></td><td></td></tr>';
  h+='</tbody></table><p class="muted" style="max-width:520px">Área construída = soma dos ambientes + projeção das paredes. Valores estimados para estudo; confira com a legislação municipal.</p>';
  const csv=()=>{const rows=[['Item','Area (m2)','Perimetro (m)']];ter.forEach(o=>rows.push([o.name||'Terreno',Math.abs(polyArea(o.pts)).toFixed(2),polyPerim(o.pts).toFixed(2)]));rooms.forEach(o=>rows.push([o.name||'Ambiente',Math.abs(polyArea(o.pts)).toFixed(2),polyPerim(o.pts).toFixed(2)]));rows.push(['Area util',rA.toFixed(2),'']);rows.push(['Area construida estimada',built.toFixed(2),'']);download(doc.name+' - quadro de areas.csv',new Blob(['﻿'+rows.map(r=>r.map(c=>'"'+String(c).replace(/"/g,'""')+'"').join(';')).join('\n')],{type:'text/csv'}));return false;};
  modal('Quadro de áreas — '+doc.name,h,[{label:'Exportar CSV',onClick:csv},{label:'Fechar',primary:true}]);
}

/* ---- configurações e ajuda ---- */
function settingsDialog(){
  const keys=['gridStep','snapStep','wallT','wallH','doorW','doorH','winW','winSill','winH','textSize','dimSize','roofSlope','roofOverhang','stairRiser','stairTread'];
  const lbl={...SLABEL,roofSlope:'Inclinação do telhado (%)',roofOverhang:'Beiral (m)',stairRiser:'Espelho da escada (m)',stairTread:'Piso da escada (m)',wallT:'Espessura de parede (m)',wallH:'Altura de parede (m)',doorW:'Largura de porta (m)',doorH:'Altura de porta (m)',winW:'Largura de janela (m)',winSill:'Peitoril de janela (m)',winH:'Altura de janela (m)'};
  const html='<div class="grid2">'+keys.map(k=>'<label>'+lbl[k]+'<input data-k="'+k+'" value="'+fmt(S()[k],2).replace(/\./g,'')+'"></label>').join('')+
    '<label style="flex-direction:row;align-items:center;gap:6px;margin-top:18px"><input type="checkbox" data-k="autoLayer"'+(S().autoLayer?' checked':'')+'> Camada automática por tipo</label></div>';
  modal('Configurações do projeto',html,[{label:'Cancelar',value:null},{label:'Aplicar',primary:true,onClick:()=>{
    $$('#dlgBody [data-k]').forEach(i=>{const k=i.dataset.k;if(i.type==='checkbox')S()[k]=i.checked;else if(i.tagName==='SELECT')S()[k]=i.value;else{const v=num(i.value);if(v>0)S()[k]=v;}});
    scheduleSave();buildLayers();updateToolUI();redraw();return true;}}]);
}
function helpDialog(){
  const cmds=[['TE','Terreno por dimensões (retangular, lados/ângulos, coordenadas)'],['TL','Terreno desenho livre'],['IM','Anexar foto/imagem (depois: Calibrar escala)'],['FD','Foto → desenho automático'],['PA / PR','Parede / paredes retangulares (ex.: 8x12)'],['PDL','Paredes a partir de linhas/ambientes'],['PO / JA','Porta / Janela (tipos na barra de opções)'],['AA / AM','Ambiente automático (clique) / desenhar'],['TA / TEL','Telhado automático / desenhar'],['ESD','Escada'],['HA','Hachura'],['A','Arco por 3 pontos'],['OF / TR / EX','Deslocar / Aparar / Estender'],['F / X / MA','Unir canto / Explodir / Matriz'],['COT','Cotar paredes automaticamente'],['ABRIR','Importar DWG, DXF, PDF, SVG, DWFx'],['B','Mobiliário (camas, sofá, banheiro, cozinha, carro, árvore)'],['L / PL','Linha / Polilinha'],['REC / C','Retângulo / Círculo'],['CO','Cota alinhada'],['T','Texto'],['M / CP','Mover / Copiar'],['RO / ES / ESC','Rotacionar / Espelhar / Escala'],['DI / AR','Medir distância / área'],['QA','Quadro de áreas'],['Z','Enquadrar tudo'],['3D / 2D','Alternar vistas'],['U / REF','Desfazer / Refazer']];
  const keys=[['Enter / Espaço / botão direito','Confirmar, terminar ou repetir último comando'],['Esc','Cancelar / limpar seleção'],['Delete','Apagar seleção'],['Ctrl+Z / Ctrl+Y','Desfazer / Refazer'],['Ctrl+C / Ctrl+V','Copiar / Colar no cursor'],['Ctrl+A','Selecionar tudo'],['Ctrl+S','Salvar'],['F3 / F7 / F8 / F9 / F10','OSNAP / Grade / Orto / Passo / Polar'],['Roda do mouse','Zoom no cursor'],['Botão do meio','Mover a vista'],['R (porta/mobiliário)','Inverter dobradiça / girar 90°']];
  const inputs=[['5','Comprimento na direção do cursor'],['3;4','Coordenada absoluta X;Y'],['@2;0','Relativa ao último ponto'],['@5<45','Distância e ângulo'],['10x20','Largura × altura (retângulos, paredes, ambientes)'],['F','Fechar polígono'],['D','Desfazer último vértice']];
  const tbl=a=>'<table class="t">'+a.map(([k,v])=>'<tr><td><span class="kbd">'+esc(k)+'</span></td><td>'+esc(v)+'</td></tr>').join('')+'</table>';
  modal('Ajuda — Vorticis Architecture','<div class="help-grid"><div><h3>Comandos</h3>'+tbl(cmds)+'</div><div><h3>Entrada de valores</h3>'+tbl(inputs)+'<h3>Atalhos</h3>'+tbl(keys)+'</div></div><p class="muted">Unidade: metros. Decimais com vírgula ou ponto. Projetos ficam salvos neste navegador (automático); use Exportar → Backup JSON para guardar uma cópia.</p>',[{label:'Fechar',primary:true}]);
}

/* ---------- imagem / foto ---------- */
$('#fileImg').addEventListener('change',e=>{const f=e.target.files[0];e.target.value='';if(f)insertImageFile(f);});

/* ---------- menus e ações ---------- */
function openPanel(){const m=$('#main');m.classList.remove('nopanel');m.classList.add('panelopen');}
function togglePanel(){const m=$('#main');if(innerWidth<=980)m.classList.toggle('panelopen');else m.classList.toggle('nopanel');setTimeout(resize,0);}
$('#panelToggle').addEventListener('click',togglePanel);
$$('.ptabs [data-ptab]').forEach(b=>b.addEventListener('click',()=>{$$('.ptabs [data-ptab]').forEach(x=>x.classList.toggle('on',x===b));$('#pt-props').hidden=b.dataset.ptab!=='props';$('#pt-layers').hidden=b.dataset.ptab!=='layers';}));
function setTheme(t){const r=document.documentElement;if(t)r.dataset.theme=t;else delete r.dataset.theme;try{if(t)localStorage.setItem('va:theme',t);else localStorage.removeItem('va:theme');}catch(e){}
  document.querySelector('meta[name=theme-color]').content=uiDark()?'#0f1512':'#ffffff';buildLayers();redraw();if(mode3d)refresh3D();}
function toggleTheme(){setTheme(uiDark()?'light':'dark');}
$('#themeBtn').addEventListener('click',toggleTheme);
if(window.matchMedia)matchMedia('(prefers-color-scheme: light)').addEventListener('change',()=>{if(!document.documentElement.dataset.theme){redraw();buildLayers();}});
function selectedImage(){return[...sel].map(getObj).find(o=>o&&o.type==='image')||doc.objects.find(o=>o.type==='image');}
const ACT={new:()=>newProject(),projects:()=>projectsDialog(),save:()=>saveNow(true),saveas:()=>saveAsDialog(),png:()=>exportPNG(),svg:()=>exportSVG(),dxf:()=>exportDXF(),json:()=>exportJSON(),print:()=>printPlan(),pdf:()=>pdfDialog(),ifc:()=>exportIFC(),obj:()=>exportOBJ(),
  import:()=>$('#fileAny').click(),areas:()=>areasDialog(),settings:()=>settingsDialog(),help:()=>helpDialog(),undo:()=>undo(),redo:()=>redo(),
  view2d:()=>setView('2d'),view3d:()=>setView('3d'),theme:()=>toggleTheme(),grid:()=>toggle('grid'),panel:()=>togglePanel(),
  autoroof:()=>autoRoof(),autodim:()=>autoDimension(),wallsfrom:()=>wallsFromSelection(),explode:()=>explodeSel(),array:()=>arrayDialog(),
  photo2d:()=>{if(mode3d)setView('2d');photoDialog();},calibrate:()=>{const o=selectedImage();if(!o){log('Anexe uma imagem primeiro (IM).','err');return;}if(mode3d)setView('2d');startTool('calibrate',o.id);},
  zoomin:()=>mode3d?zoom3D(1/1.25):zoomAt(P(W/2,H/2),1.25),zoomout:()=>mode3d?zoom3D(1.25):zoomAt(P(W/2,H/2),1/1.25),extents:()=>zoomExtents(),dwg:()=>exportDWG(),about:()=>aboutDialog(),convert:()=>convertDialog(),
  enter:()=>handleCmd(''),esc:()=>cancelAction(),erase:()=>eraseSel()};
$$('[data-act]').forEach(b=>b.addEventListener('click',()=>ACT[b.dataset.act]()));

function aboutDialog(){
  modal('Sobre o Vorticis Architecture','<div style="display:flex;gap:16px;align-items:center"><img src="icons/icon-192.png" width="72" height="72" alt=""><div><div style="font-size:18px;font-weight:700">Vorticis Architecture</div>'+
    '<div>Versão <b>'+APP_VERSION+'</b> · '+(DESKTOP?'programa para Windows':ANDROID?'app para Android':'edição web (navegador)')+'</div><div class="muted" style="font-size:12px">CAD arquitetônico: planta, 3D e arquivos DWG, DXF, PDF, IFC</div></div></div>'+
    '<p class="muted" style="font-size:12px;margin-top:14px">Bibliotecas incluídas: three.js (MIT), pdf.js (Apache-2.0) e leitor de DWG baseado no LibreDWG (GPL-3.0). Exportação DWG pelo ODA File Converter (programa separado, gratuito).</p>'+
    '<p style="font-size:12px">github.com/hellisonvidal/Vorticis-Architecture</p>',[{label:'Fechar',primary:true}]);
}
