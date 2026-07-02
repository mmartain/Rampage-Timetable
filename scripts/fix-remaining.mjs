import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
let body = fs.readFileSync(path.join(root, 'src', 'body.html'), 'utf8');
let file = fs.readFileSync(path.join(root, 'src', 'modules', 'app-core.js'), 'utf8');
let inner = file.replace(/^export function initApp\(\) \{\n/, '').replace(/\n\}\n$/, '');

// Body cleanup
body = body.replace(/<img id="shrek-img"[\s\S]*?<img id="runescape-img"[^>]*>\n/, '');
body = body.replace(/<div id="left-btns">[\s\S]*?<\/div>\n\s*/, '');

// Safe removals only
inner = inner.replace(/let discoMode = false;\r?\n/g, '');
inner = inner.replace(/let campingMode = false;\r?\n/g, '');
inner = inner.replace(/let discoHours = \{ start: 25, end: 29 \};\r?\n/g, '');
inner = inner.replace(/let currentLang = 'fr';\r?\n/g, '');
inner = inner.replace(/let discoDayKey = 'vendredi';\r?\n/g, '');
inner = inner.replace(/let campingDayKey = 'jeudi';\r?\n/g, '');
inner = inner.replace(/let profileCampingEnabled = true;\r?\n/g, '');
inner = inner.replace(/let profileDiscoEnabled = true;\r?\n/g, '');
inner = inner.replace(/let campingStageMode = false;\r?\n/g, '');
inner = inner.replace(/const easter = \(opacity[\s\S]*?\};\r?\n\r?\n/g, '');
inner = inner.replace(/const boostedEasterEvents[\s\S]*?function exitOnClick\(/, 'function exitOnClick(');
inner = inner.replace(/updateDiscoBtn\(\);\r?\n/g, '');
inner = inner.replace(/updateCampingBtn\(\);\r?\n/g, '');
inner = inner.replace(/if \(false\)\s*\{\s*\}\s*\r?\n/g, '');
inner = inner.replace(/if \(false\) \{ document\.body\.classList\.remove\('camping-mode'\); updateCampingBtn\(\); \}\s*\r?\n/g, '');
inner = inner.replace(/renderDisco\([^)]*\);\s*/g, '');
inner = inner.replace(/renderCamping\([^)]*\);\s*/g, '');
inner = inner.replace(/stopDisco\([^)]*\);\s*/g, '');
inner = inner.replace(/\s*currentLang\s*=\s*localStorage\.getItem\('lang'\)[^;]*;\s*\r?\n/g, '');
inner = inner.replace(/\s*'en'\s*=\s*localStorage\.getItem\('lang'\)[^;]*;\s*\r?\n/g, '');
inner = inner.replace(/\s*'en'\s*=\s*'fr';\s*/g, '');
inner = inner.replace(/\s*currentLang\s*=\s*'fr';\s*/g, '');
inner = inner.replace(/meta\.labels\[currentLang\]/g, 'meta.labels.en');
inner = inner.replace(/([^a-zA-Z0-9_])currentLang([^a-zA-Z0-9_])/g, "$1'en'$2");
inner = inner.replace(/  discoDayKey\s*=\s*getDiscoDay\(\);\n/g, '');
inner = inner.replace(/  campingDayKey = normalDayKey;\n/g, '');
inner = inner.replace(/  discoMode\s*=\s*false;\n/g, '');
inner = inner.replace(/  campingMode\s*=\s*false;\n/g, '');
inner = inner.replace(/  if \(discoMode\)\s+document\.body\.classList\.add\('disco-mode'\);\n/g, '');

inner = inner.replace(/campingStageMode\s*=\s*false;\s*/g, '');
inner = inner.replace(/campingStageMode\s*=\s*true;\s*/g, '');
inner = inner.replace(/discoMode\s*=\s*false;\s*/g, '');
inner = inner.replace(/campingMode\s*=\s*false;\s*/g, '');
inner = inner.replace(/^\s*discoMode\s*=[^;]+;\s*\r?\n/gm, '');
inner = inner.replace(/^\s*campingMode\s*=[^;]+;\s*\r?\n/gm, '');
inner = inner.replace(/^\s*campingStageMode\s*=[^;]+;\s*\r?\n/gm, '');
inner = inner.replace(/\s*false\s*=\s*true;\s*/g, '');
inner = inner.replace(/\s*profileCampingEnabled\s*=\s*true;\s*/g, '');
inner = inner.replace(/\s*profileDiscoEnabled\s*=\s*true;\s*/g, '');
inner = inner.replace(/\bdiscoMode\b/g, 'false');
inner = inner.replace(/\bcampingMode\b/g, 'false');
inner = inner.replace(/\bcampingStageMode\b/g, 'false');
inner = inner.replace(/\bprofileCampingEnabled\b/g, 'false');
inner = inner.replace(/\bprofileDiscoEnabled\b/g, 'false');
inner = inner.replace(/getCampingStages\(([^)]*)\)/g, '[]');

// Simplify stage header disco branch
inner = inner.replace(/if \(false\) \{\s*nameEl\.style\.color = header\.dataset\.nameColor \|\| '';\s*nameEl\.style\.textShadow = hasTarget \? '0 0 14px #fff, 0 0 6px #fff' : '';\s*\} else \{/g, '{');

// Remove dead else-if branches for disco/camping in rerenderSchedule if still present
inner = inner.replace(/\} else if \(false\) \{\s*\} else if \(favsOnly\)/g, '} else if (favsOnly)');

fs.writeFileSync(path.join(root, 'src', 'body.html'), body);
fs.writeFileSync(path.join(root, 'src', 'modules', 'app-core.js'), `export function initApp() {\n${inner}\n}\n`);
console.log('Safe fix applied');
