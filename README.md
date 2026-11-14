<p align="center"><img src="icons/icon-192.png" width="96" alt="Vorticis Architecture"></p>

# Vorticis Architecture

Programa de desenho arquitetônico que roda **direto no navegador**, inspirado no fluxo do AutoCAD (linha de comando, snaps, coordenadas digitadas) e do Revit (paredes com espessura, portas e janelas que se encaixam na parede, ambientes com área automática, telhado e vista 3D).

Não precisa de instalação nem de servidor. Funciona offline e pode ser instalado como aplicativo no Windows, Mac, Android ou iPhone. A interface tem faixa de opções no topo, tema claro e escuro e as cores verde e laranja da família Vorticis.

## Como usar

- **Rodar localmente:** baixe o repositório e sirva a pasta por HTTP, por exemplo com `python -m http.server`, abrindo `http://localhost:8000`. Abrindo o `index.html` direto da pasta, o navegador bloqueia o 3D completo e os leitores de DWG e PDF (o resto funciona).
- **Publicar on-line (grátis):** no GitHub, vá em *Settings → Pages → Branch `main` / root*. O app ficará em `https://<usuario>.github.io/Vorticis-Architecture/`.
- **Instalar como app:** abra o endereço publicado no Chrome ou Edge e clique em *Instalar* (ícone na barra de endereço).
- **Sem internet:** todas as bibliotecas estão no próprio repositório (pasta `vendor/`). Depois do primeiro acesso pelo link, o app, o 3D e os leitores de DWG e PDF funcionam totalmente offline.

## Versões e downloads

As versões ficam na página **Releases** do repositório (veja o [histórico de mudanças](CHANGELOG.md)). Cada versão traz:

- **`Vorticis.Architecture_x.y.z_x64-setup.exe`** (ou `.msi`): o **programa para Windows**. Basta instalar. Ele funciona sem navegador e sem internet, salva arquivos pela janela "Salvar como" do Windows e **grava DWG** quando o [ODA File Converter](https://www.opendesign.com/guestfiles/oda_file_converter), que é gratuito, está instalado. Sem ele, exporte DXF.
- **`Vorticis-Architecture-vx.y.z-web.zip`**: o app web, para publicar em qualquer servidor.

Para publicar uma nova versão: atualize a versão em `js/core.js` (`APP_VERSION`), `desktop/src-tauri/tauri.conf.json` e `desktop/src-tauri/Cargo.toml`, escreva a seção no `CHANGELOG.md` e envie uma tag (`git tag v1.1.0 && git push origin v1.1.0`). O GitHub Actions monta o instalador do Windows e cria a release sozinho.

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
| **DWG** (AutoCAD) e **BAK** | ✔ leitura no navegador (LibreDWG em WebAssembly, incluído no app) | ✔ no programa para Windows (via ODA File Converter, gratuito); no navegador, via DXF |
| **DXF** | ✔ linhas, polilinhas com arcos, círculos, arcos, elipses, splines, textos, MTEXT, blocos e cotas, com camadas, cores e unidades | ✔ DXF R12, compatível com AutoCAD, BricsCAD, LibreCAD e SketchUp |
| **PDF** | ✔ vetorial (linhas e textos, na escala escolhida) ou como imagem para decalcar | ✔ **prancha vetorial** A4–A0, com escala real (1:50, 1:100…), carimbo, barra de escala, colorida ou em preto e branco |
| **IFC** (BIM) | — | ✔ IFC4 com paredes e aberturas reais, portas, janelas, ambientes, telhado, escada e móveis, para Revit, ArchiCAD e BIMcollab |
| **OBJ** (3D) | — | ✔ OBJ + MTL com materiais, para SketchUp, Blender, Lumion e 3ds Max |
| **DWFx** | ✔ linhas e textos da folha | — |
| **SVG** | ✔ | ✔ |
| **PNG / JPG** | ✔ como imagem (com calibração de escala) | ✔ PNG (planta e 3D) |
| **JSON** (projeto) | ✔ | ✔ backup completo |

Você pode **arrastar e soltar** qualquer arquivo na área de desenho.

**DWG e DWF:** são formatos fechados. O navegador consegue **ler** DWG, mas não **gravar**. O **programa para Windows** grava DWG (versões R9 a 2018) usando o ODA File Converter. Para levar o projeto ao AutoCAD, exporte em **DXF**: o AutoCAD, o BricsCAD e o ZWCAD abrem o arquivo e salvam como DWG em um clique. Para converter vários arquivos de uma vez, use o ODA File Converter (gratuito). O DWF clássico (W2D) não é lido, mas o DWFx é. O PDF em prancha substitui o DWF para enviar a clientes.

## Conversão automática para edição

Ao importar DWG, DXF, PDF, SVG ou DWFx, a opção **Converter automaticamente em elementos editáveis** (ligada por padrão) transforma o desenho em elementos de arquitetura:

| O que há no arquivo | Vira |
|---|---|
| Pares de linhas paralelas a 7–45 cm (preferindo camadas chamadas parede/wall, se existirem) | **Paredes** com a espessura medida, com cantos e encontros em T unidos |
| Vão na parede com arco de abertura (inclusive arcos de PDF, que vêm como curvas) | **Porta** de giro ou de 2 folhas, com o lado da dobradiça e o sentido de abertura |
| Vão ou trecho de parede com linhas de vidro/caixilho | **Janela** |
| Texto com nome de cômodo (SALA, QUARTO…) dentro de um espaço fechado | **Ambiente** com nome e área |
| Cotas lineares e alinhadas do DWG/DXF | **Cotas** editáveis |

O que não for reconhecido (mobiliário, hachuras, detalhes) continua como linhas. Um relatório mostra o que foi convertido, com o botão **Desfazer conversão**. Para converter depois, ou só uma parte selecionada, use **Ferramentas → Converter desenho** (comando `CONV`), que permite ajustar a faixa de espessura e escolher o que reconhecer. Os DXF, PDF e SVG exportados pelo próprio app também voltam como paredes, portas, janelas e ambientes.

## Vista 3D

A vista 3D usa WebGL (three.js), com iluminação, sombras suaves, materiais (reboco, telha, vidro, madeira, grama, água), portas e janelas com caixilhos e vidro, telhado, escada e móveis com volume. Você pode girar, mover e dar zoom com suavidade, ligar e desligar o telhado, as sombras e os contornos, e salvar a imagem. Se o navegador não tiver WebGL, ou se o app for aberto direto da pasta, ela usa um modo 3D simplificado.

## Onde ficam os dados

Os projetos são salvos automaticamente no próprio navegador (IndexedDB). Para levar um projeto a outro aparelho, use **Arquivo → Backup** e depois **Abrir arquivo** no outro aparelho. O app não acessa nenhum serviço externo.

## Estrutura

```
index.html              estrutura da página
css/app.css             visual (tema claro/escuro, verde e laranja)
js/core.js              geometria, documento, desenho 2D, snaps, desfazer
js/tools.js             ferramentas básicas, linha de comando, mouse e teclado
js/elements.js          portas/janelas por tipo, telhado, escada, hachura, arco
js/smart.js             ferramentas inteligentes
js/convert.js           conversão automática de desenho importado em elementos editáveis
js/ui.js                faixa de opções, painel, camadas, diálogos
js/photo.js             foto → desenho
js/io.js                armazenamento e projetos
js/import.js            DWG, DXF, PDF, SVG, DWFx, imagens
js/export.js            DXF, PDF, IFC, OBJ, SVG, PNG
js/view3d.js            modelo 3D e WebGL; view3d-fallback.js = 3D simplificado
vendor/                 bibliotecas de terceiros (three.js, pdf.js, LibreDWG) — veja vendor/LEIA-ME.md
desktop/                programa para Windows (Tauri): src-tauri/ (Rust), prepare.mjs
.github/workflows/      release.yml: gera o instalador do Windows e a release ao enviar uma tag
icon.svg, icons/        ícone (variação do Vorticis Monitor em verde e laranja)
tools/gerar_icone.py    gerador do ícone
```

## Licenças de terceiros

O app inclui three.js (MIT), pdf.js (Apache-2.0) e o leitor de DWG baseado no LibreDWG (**GPL-3.0**). Licenças e endereços do código-fonte estão em `vendor/LEIA-ME.md`. Por causa da GPL do leitor de DWG, ao distribuir o app (inclusive comercialmente), o código do Vorticis Architecture deve ser compatível com a GPL-3.0, ou o leitor de DWG precisa ser removido.

## Próximos passos sugeridos

- Vários pavimentos, cortes e fachadas automáticos
- Folhas múltiplas no PDF e prancha com várias vistas
- Biblioteca de mobiliário maior e importação de blocos DXF como mobiliário
- Exportar DWG direto (exigiria um conversor no servidor)
