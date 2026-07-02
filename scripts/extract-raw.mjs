import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const html = fs.readFileSync(path.join(root, 'legacy', 'index.html'), 'utf8');

const styleMatch = html.match(/<style>([\s\S]*?)<\/style>/);
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
const bodyMatch = html.match(/<body>([\s\S]*?)<script>/);

fs.mkdirSync(path.join(root, 'src', 'styles'), { recursive: true });
fs.mkdirSync(path.join(root, 'src', 'modules'), { recursive: true });

fs.writeFileSync(path.join(root, 'src', 'styles', 'app.raw.css'), styleMatch[1]);
fs.writeFileSync(path.join(root, 'src', 'modules', 'app.raw.js'), scripts[scripts.length - 1][1]);
fs.writeFileSync(path.join(root, 'src', 'body.raw.html'), bodyMatch[1].trim());

console.log('Raw extract:', styleMatch[1].length, 'css,', scripts[scripts.length - 1][1].length, 'js');
