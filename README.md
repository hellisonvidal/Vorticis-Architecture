<p align="center"><img src="icons/icon-192.png" width="96" alt="Vorticis Architecture"></p>

# Vorticis Architecture

Programa de desenho arquitetônico que roda **direto no navegador**, inspirado no fluxo do AutoCAD (linha de comando, snaps, coordenadas digitadas) e do Revit (paredes com espessura, portas e janelas que se encaixam na parede, ambientes com área automática, telhado e vista 3D).

Não precisa de instalação nem de servidor. Funciona offline e pode ser instalado como aplicativo no Windows, Mac, Android ou iPhone. A interface tem faixa de opções no topo, tema claro e escuro e as cores verde e laranja da família Vorticis.

## Como usar

- **Rodar localmente:** baixe o repositório e abra `index.html` no Chrome ou Edge. Para o 3D, a leitura de DWG e o PDF funcionarem, sirva a pasta por HTTP, por exemplo com `python -m http.server`, ou use o GitHub Pages.
- **Publicar on-line (grátis):** no GitHub, vá em *Settings → Pages → Branch `main` / root*. O app ficará em `https://<usuario>.github.io/Vorticis-Architecture/`.
- **Instalar como app:** abra o endereço publicado no Chrome ou Edge e clique em *Instalar* (ícone na barra de endereço).

## Interface

| Aba | Ferramentas |
|---|---|
| **Arquivo** | Novo, abrir, salvar, salvar como · Importar arquivo · Exportar DXF, PDF, IFC, OBJ, SVG, PNG e backup · Imprimir |
| **Início** | Selecionar, mão · Mover, copiar, rotacionar, espelhar, escala, apagar · Deslocar, aparar, estender, unir canto, explodir, matriz · Medir distância e área |
| **Desenho** | Linha, polilinha, retângulo, círculo, arco por 3 pontos · Texto, cota, hachura |
| **Arquitetura** | Parede, paredes retangulares, paredes de linhas · Porta e janela por tipo · Ambiente automático e desenhado · Telhado automático e desenhado · Escada · Mobiliário |
| **Anotar** | Cota, cotagem automática, texto, hachura, quadro de áreas |
| **Terreno** | Terreno por medidas ou desenho livre · Anexar foto, calibrar escala, foto → desenho |
| **Ferramentas** | Atalhos para as ferramentas automáticas, de edição e de análise |
| **Vista** | Planta 2D e 3D · Enquadrar e zoom · Tema claro/escuro, grade, painel · Configurações e ajuda |

A **barra de opções** abaixo da faixa mostra as opções da ferramenta ativa, como o tipo de porta, a espessura da parede, a inclinação do telhado e o padrão de hachura. O painel lateral tem as abas **Propriedades** e **Camadas**. Na parte de baixo ficam a linha de comando e a barra de status (PASSO, GRADE, OSNAP, ORTO, POLAR).

## Elementos de arquitetura

- **Portas:** de giro, de giro com 2 folhas, de correr, pivotante e sanfonada, cada uma com seu símbolo em planta e sua folha no 3D.
- **Janelas:** de correr, maxim-ar, basculante, de abrir (2 folhas) e fixa, com peitoril, altura e área de vão.
- **Telhado (TA / TEL):** um clique em **Telhado automático** cobre as paredes. Os tipos são **1 água, 2 águas, 4 águas e laje plana**. Você ajusta a inclinação (%), o beiral e a altura, gira a cumeeira e inverte o caimento. O programa calcula a área em projeção, a área real do telhado e a altura da cumeeira.
- **Escada (ESD):** é calculada pela altura a vencer, com espelho e piso, e faz a verificação pela fórmula de Blondel.
- **Terreno (TE):** pode ser retangular, por lados e ângulos ou por coordenadas, com recuos por lado e área edificável.

## Ferramentas inteligentes

| Ferramenta | O que faz |
|---|---|
| **Ambiente automático** (`AA`) | Clique dentro das paredes e o ambiente é criado com a área correta, com os vértices encaixados nas faces das paredes. Funciona com formas em L, T etc. |
| **Telhado automático** (`TA`) | Ajusta o telhado ao contorno da edificação, já orientado pela parede mais longa. |
| **Cotar paredes** (`COT`) | Cria as cotas das paredes externas e as medidas totais. |
| **Paredes de linhas** (`PDL`) | Converte linhas, polilinhas ou ambientes (inclusive importados de DWG/DXF/PDF) em paredes. |
| **Foto → desenho** (`FD`) | Gera paredes, portas, janelas e ambientes a partir da foto ou do escaneamento de uma planta. Funciona offline. |
| **Aparar / Estender / Unir canto / Deslocar** | Ferramentas de edição no estilo do AutoCAD (`TR`, `EX`, `F`, `OF`). |
| **Matriz / Explodir** | Cópias em linhas e colunas (`MA`); decompõe blocos, telhados e polilinhas (`X`). |
| **Hachura** (`HA`) | Clique dentro de uma área fechada. Padrões: diagonal, cruzada, piso cerâmico, madeira, grama e sólido. |
| **Snaps e rastreamento** | Extremidade, ponto médio, centro, interseção, perpendicular, mais próximo e **rastreamento polar a cada 15°** (F10). |

## Arquivos

| Formato | Importar | Exportar |
|---|---|---|
| **DWG** (AutoCAD) e **BAK** | ✔ leitura no navegador (LibreDWG em WebAssembly, baixado na primeira vez) | Via DXF (veja abaixo) |
| **DXF** | ✔ linhas, polilinhas com arcos, círculos, arcos, elipses, splines, textos, MTEXT, blocos e cotas, com camadas, cores e unidades | ✔ DXF R12, compatível com AutoCAD, BricsCAD, LibreCAD e SketchUp |
| **PDF** | ✔ vetorial (linhas e textos, na escala escolhida) ou como imagem para decalcar | ✔ **prancha vetorial** A4–A0, com escala real (1:50, 1:100…), carimbo, barra de escala, colorida ou em preto e branco |
| **IFC** (BIM) | — | ✔ IFC4 com paredes e aberturas reais, portas, janelas, ambientes, telhado, escada e móveis, para Revit, ArchiCAD e BIMcollab |
| **OBJ** (3D) | — | ✔ OBJ + MTL com materiais, para SketchUp, Blender, Lumion e 3ds Max |
| **DWFx** | ✔ linhas e textos da folha | — |
| **SVG** | ✔ | ✔ |
| **PNG / JPG** | ✔ como imagem (com calibração de escala) | ✔ PNG (planta e 3D) |
| **JSON** (projeto) | ✔ | ✔ backup completo |

Você pode **arrastar e soltar** qualquer arquivo na área de desenho.

**DWG e DWF:** são formatos fechados. O navegador consegue **ler** DWG, mas não **gravar**. Para levar o projeto ao AutoCAD, exporte em **DXF**: o AutoCAD, o BricsCAD e o ZWCAD abrem o arquivo e salvam como DWG em um clique. Para converter vários arquivos de uma vez, use o ODA File Converter (gratuito). O DWF clássico (W2D) não é lido, mas o DWFx é. O PDF em prancha substitui o DWF para enviar a clientes.

## Vista 3D

A vista 3D usa WebGL (three.js), com iluminação, sombras suaves, materiais (reboco, telha, vidro, madeira, grama, água), portas e janelas com caixilhos e vidro, telhado, escada e móveis com volume. Você pode girar, mover e dar zoom com suavidade, ligar e desligar o telhado, as sombras e os contornos, e salvar a imagem. Sem internet na primeira vez, ela usa um modo 3D simplificado.

## Onde ficam os dados

Os projetos são salvos automaticamente no próprio navegador (IndexedDB). Para levar um projeto a outro aparelho, use **Arquivo → Backup** e depois **Abrir arquivo** no outro aparelho. As bibliotecas externas (3D, DWG, PDF) vêm da CDN jsDelivr em versões fixas e ficam em cache depois do primeiro uso.

## Estrutura

```
index.html              estrutura da página
css/app.css             visual (tema claro/escuro, verde e laranja)
js/core.js              geometria, documento, desenho 2D, snaps, desfazer
js/tools.js             ferramentas básicas, linha de comando, mouse e teclado
js/elements.js          portas/janelas por tipo, telhado, escada, hachura, arco
js/smart.js             ferramentas inteligentes
js/ui.js                faixa de opções, painel, camadas, diálogos
js/photo.js             foto → desenho
js/io.js                armazenamento e projetos
js/import.js            DWG, DXF, PDF, SVG, DWFx, imagens
js/export.js            DXF, PDF, IFC, OBJ, SVG, PNG
js/view3d.js            modelo 3D e WebGL; view3d-fallback.js = 3D simplificado
icon.svg, icons/        ícone (variação do Vorticis Monitor em verde e laranja)
tools/gerar_icone.py    gerador do ícone
```

## Próximos passos sugeridos

- Vários pavimentos, cortes e fachadas automáticos
- Folhas múltiplas no PDF e prancha com várias vistas
- Biblioteca de mobiliário maior e importação de blocos DXF como mobiliário
- Exportar DWG direto (exigiria um conversor no servidor)
