# Histórico de versões

Todas as mudanças importantes do Vorticis Architecture. As versões seguem o formato MAIOR.MENOR.CORREÇÃO.

## [1.0.0] - 2026-11-14

Primeira versão publicada.

### Como usar
- **No navegador:** pelo link do GitHub Pages. Depois do primeiro acesso, funciona sem internet e pode ser instalado como aplicativo (botão *Instalar* do Chrome/Edge).
- **No Windows:** baixe o instalador `.exe` (ou `.msi`) desta página e instale. O programa salva arquivos com a janela "Salvar como" do Windows e grava **DWG** quando o ODA File Converter (gratuito) está instalado.
- **No Android:** baixe o `-android.apk` desta página no celular e instale (Android 7 ou mais novo). Abre desenhos pelo "Abrir com" e "Compartilhar" e salva onde você escolher.
- **App web compactado:** o arquivo `-web.zip` pode ser publicado em qualquer servidor.

### Desenho e arquitetura
- Faixa de opções no topo (Arquivo, Início, Desenho, Arquitetura, Anotar, Terreno, Ferramentas, Vista), barra de opções da ferramenta, painel de propriedades e camadas, linha de comando no estilo do AutoCAD.
- Tema claro e escuro; ícone e cores verde/laranja da família Vorticis.
- Paredes com espessura e altura; portas (giro, 2 folhas, correr, pivotante, sanfonada) e janelas (correr, maxim-ar, basculante, abrir, fixa).
- Telhado de 1, 2 ou 4 águas e laje plana, automático sobre as paredes ou desenhado, com inclinação, beiral e áreas.
- Escada reta calculada pela altura (com verificação de Blondel), mobiliário, hachuras, cotas e textos.
- Terreno por medidas (retangular, lados e ângulos, coordenadas) com recuos e área edificável.
- Quadro de áreas com taxa de ocupação (exporta CSV).

### Ferramentas inteligentes
- Ambiente automático por clique, telhado automático, cotagem automática, paredes a partir de linhas.
- Aparar, estender, unir canto, deslocar, matriz, explodir, arco por 3 pontos.
- Snaps de extremidade, meio, centro, interseção, perpendicular e mais próximo; rastreamento polar a cada 15°.
- Foto → desenho: gera paredes, portas, janelas e ambientes a partir da foto de uma planta.

### Arquivos
- Importa DWG/BAK (LibreDWG), DXF, PDF (vetorial ou imagem), SVG, DWFx, imagens e projeto JSON, com arrastar e soltar.
- **Conversão automática** do desenho importado em paredes, portas, janelas, ambientes e cotas editáveis.
- Exporta DXF, PDF em prancha (A4–A0, escala, carimbo), IFC4 para Revit/ArchiCAD, OBJ 3D, SVG, PNG e backup JSON.
- No programa para Windows: exporta DWG via ODA File Converter.

### 3D
- Vista 3D em WebGL com luz, sombras, materiais, esquadrias com vidro, telhado e móveis; modo simplificado quando não há WebGL.

### Celular e tablet
- Botões de toque **Concluir**, **Cancelar** e **Apagar** (Enter, Esc e Delete), botões maiores e zoom com dois dedos.
- App para Android com ícone adaptável, botão Voltar que fecha janelas e ferramentas, e salvamento automático ao sair.

### Funcionamento offline
- Bibliotecas incluídas no próprio app (pasta `vendor/`), sem depender de internet.
