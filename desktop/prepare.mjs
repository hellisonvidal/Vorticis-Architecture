// Copia o app web (raiz do repositório) para desktop/dist, que o Tauri empacota no programa.
import { cpSync, rmSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const here = dirname(fileURLToPath(import.meta.url)), root = join(here, '..'), dist = join(here, 'dist');
rmSync(dist, { recursive: true, force: true });
mkdirSync(dist, { recursive: true });
for (const item of ['index.html', 'manifest.webmanifest', 'icon.svg', 'icons', 'css', 'js', 'vendor']) {
  const src = join(root, item);
  if (!existsSync(src)) throw new Error('Arquivo ausente: ' + item);
  cpSync(src, join(dist, item), { recursive: true });
}
console.log('App copiado para', dist);
