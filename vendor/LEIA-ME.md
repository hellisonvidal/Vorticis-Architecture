# Bibliotecas de terceiros (cópias locais)

Estas bibliotecas são incluídas no repositório para que o Vorticis Architecture funcione
sem internet e sem depender de CDN. Os arquivos são cópias sem modificação dos pacotes npm.

| Pasta | Pacote npm | Versão | Licença | Uso no app | Código-fonte |
|---|---|---|---|---|---|
| `three/` | `three` | 0.186.1 | MIT (`three/LICENSE`) | Vista 3D (WebGL) | https://github.com/mrdoob/three.js/tree/r186 |
| `pdfjs/` | `pdfjs-dist` | 6.4.299 | Apache-2.0 (`pdfjs/LICENSE`) | Importar PDF | https://github.com/mozilla/pdf.js/releases/tag/v6.4.299 |
| `libredwg-web/` | `@mlightcad/libredwg-web` | 0.8.3 | GPL-3.0 (`libredwg-web/COPYING`) | Ler DWG/BAK | https://github.com/mlightcad/libredwg-web e https://www.gnu.org/software/libredwg/ |

## Sobre a GPL-3.0 (leitor de DWG)

O leitor de DWG é baseado no LibreDWG, distribuído sob a GNU GPL versão 3. O código-fonte
correspondente está nos endereços acima (pacote `@mlightcad/libredwg-web` 0.8.3, compilado a
partir do LibreDWG). O texto completo da licença está em `libredwg-web/COPYING`.

Para atualizar: `npm pack <pacote>@<versão>` e copie os mesmos arquivos para as mesmas pastas.
