# Vorticis Architecture

Programa de desenho arquitetônico que roda **direto no navegador**, inspirado no fluxo do AutoCAD (linha de comando, snaps, coordenadas digitadas) e do Revit (paredes com espessura, portas e janelas inseridas na parede, ambientes com área automática e vista 3D).

Não precisa de instalação nem de servidor. É um único arquivo HTML, funciona offline e pode ser instalado como aplicativo no Windows, Mac, Android ou iPhone.

## Como usar

- **Rodar localmente:** baixe o repositório e abra `index.html` no Chrome, Edge ou Firefox.
- **Publicar on-line (grátis):** no GitHub, vá em *Settings → Pages → Branch `main` / root*. O app ficará em `https://<usuario>.github.io/Vorticis-Architecture/`.
- **Instalar como app:** abra o endereço publicado no Chrome ou Edge e clique em *Instalar* (ícone na barra de endereço). Assim ele também funciona sem internet.

## Principais funções

| Área | Funções |
|---|---|
| **Terreno** | Comando `TE`, com quatro modos: **retangular** (frente × profundidade), **lados e ângulos internos** (o lado de fechamento é calculado), **coordenadas X;Y** ou **desenho livre** (`TL`). Mostra área, perímetro, medida de cada lado e vértices (V1, V2…). Tem **recuos** por lado e calcula a **área edificável**. |
| **Foto / imagem** | Comando `IM` para anexar uma foto (do terreno, croqui, planta antiga, imagem de satélite). Permite ajustar opacidade e rotação e **calibrar a escala**: você clica dois pontos de uma medida conhecida e digita o valor real. Também funciona com a câmera do celular. |
| **Arquitetura** | Paredes com espessura e altura (`PA`), paredes retangulares (`PR`, por exemplo `8x12`), **portas** (`PO`) e **janelas** (`JA`) que se encaixam na parede, ambientes com nome e área (`AM`) e biblioteca de mobiliário (`B`): camas, sofá, mesas, banheiro, cozinha, guarda-roupa, carro e árvore. |
| **Desenho** | Linha, polilinha, retângulo, círculo, cotas alinhadas e textos. |
| **Modificar** | Mover, copiar, rotacionar, espelhar, escala, apagar, alças (grips) para editar pontos, arrastar para mover, desfazer/refazer ilimitado e copiar/colar. |
| **Precisão** | Snap a extremidade, ponto médio, centro e interseção; grade; passo do cursor; modo ortogonal. |
| **Entrada de valores** | `5` (comprimento na direção do mouse), `3;4` (absoluto), `@2;0` (relativo), `@5<45` (distância e ângulo), `10x20` (largura × altura). |
| **Camadas** | Cor, visibilidade e travamento. Cada tipo de objeto vai automaticamente para a sua camada. |
| **Vista 3D** | Paredes extrudadas com vãos de portas e janelas, piso dos ambientes, terreno e mobiliário. É possível girar, mover e dar zoom. |
| **Relatórios** | Quadro de áreas com terreno, área edificável, ambientes, área construída estimada e taxa de ocupação. Pode ser exportado em CSV. |
| **Arquivos** | Salvamento automático no navegador e vários projetos. Exporta **DXF (AutoCAD)**, **SVG**, **PNG**, **imagem para impressão/PDF** e **backup JSON**, e importa o backup JSON. |

## Atalhos

`Enter`, `Espaço` ou botão direito confirmam ou repetem o último comando. `Esc` cancela. `Delete` apaga. `Ctrl+Z` e `Ctrl+Y` desfazem e refazem. `Ctrl+C` e `Ctrl+V` copiam e colam. `Ctrl+S` salva. `F3`, `F7`, `F8` e `F9` ligam e desligam OSNAP, grade, orto e passo do cursor. A roda do mouse dá zoom e o botão do meio move a vista. Digite `AJUDA` no app para ver a lista completa.

## Onde ficam os dados

Os projetos ficam salvos no próprio navegador (IndexedDB) do computador ou celular que você está usando. Para levar um projeto para outro aparelho, ou para guardar uma cópia de segurança, use **Exportar → Backup do projeto (JSON)** e depois **Importar** no outro aparelho.

## Estrutura

```
index.html            aplicativo completo (HTML + CSS + JavaScript, sem dependências)
manifest.webmanifest  instalação como aplicativo (PWA)
sw.js                 funcionamento offline
icon.svg              ícone
```

## Próximos passos sugeridos

- Vários pavimentos (térreo e superior) e cortes e fachadas automáticos
- Importar DXF
- Folha de impressão com carimbo e escala exata (1:50, 1:100)
- Hachuras e mais blocos de mobiliário
- Telhado e escadas no 3D
- Sincronização na nuvem (por exemplo, Supabase no plano gratuito) para usar os mesmos projetos em vários dispositivos
