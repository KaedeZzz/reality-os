import { spawnSync } from 'node:child_process';
import { mkdir, cp, writeFile, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
const result = spawnSync(process.execPath, ['node_modules/next/dist/bin/next', 'build'], {
  cwd: root, stdio: 'inherit', env: { ...process.env, REALITY_DESKTOP: '1', NEXT_PUBLIC_DESKTOP: '1' },
});
if (result.status !== 0) process.exit(result.status ?? 1);
const stage = path.join(root, 'desktop-build');
await mkdir(stage, { recursive: true });
await cp(path.join(root, 'out'), path.join(stage, 'out'), { recursive: true });
await cp(path.join(root, 'desktop/main.cjs'), path.join(stage, 'main.cjs'));
await writeFile(path.join(stage, 'package.json'), JSON.stringify({
  name: 'reality-os-desktop', productName: 'Reality OS', version: manifest.version, main: 'main.cjs',
  description: 'Reality OS personal productivity app', author: 'Reality OS', private: true,
}, null, 2));
const { packager } = await import('@electron/packager');
const outputs = await packager({
  dir: stage, out: path.join(root, 'release'), name: 'Reality OS',
  platform: 'win32', arch: 'x64', overwrite: true, asar: true,
  executableName: 'Reality OS', prune: false,
});
console.log('Desktop app ready:', outputs.join('\n'));
