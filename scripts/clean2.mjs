import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
let js = fs.readFileSync(path.join(root, 'src', 'modules', 'app.raw.js'), 'utf8');
let css = fs.readFileSync(path.join(root, 'src', 'styles', 'app.raw.css'), 'utf8');
let body = fs.readFileSync(path.join(root, 'src', 'body.raw.html'), 'utf8');

function findFunctionEnd(src, startIdx) {
  let i = startIdx;
  while (i < src.length && src[i] !== '{') i++;
  if (i >= src.length) return -1;
  let depth = 0;
  for (; i < src.length; i++) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}') { depth--; if (depth === 0) return i + 1; }
  }
  return -1;
}

function removeFunctions(src, names) {
  let out = src;
  for (const name of names) {
    for (const prefix of ['function ', 'async function ']) {
      const re = new RegExp(prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + name + '\\s*\\([^)]*\\)\\s*\\{', 'g');
      let m;
      while ((m = re.exec(out)) !== null) {
        const end = findFunctionEnd(out, m.index);
        if (end > m.index) { out = out.slice(0, m.index) + out.slice(end); re.lastIndex = m.index; }
      }
    }
  }
  return out;
}

function removeConstBlock(src, name) {
  const re = new RegExp(`const ${name} = `);
  const m = re.exec(src);
  if (!m) return src;
  let i = m.index;
  while (i < src.length && src[i] !== '=') i++;
  i++; while (i < src.length && /\s/.test(src[i])) i++;
  if (src[i] === '{') {
    const end = findFunctionEnd(src, i);
    if (end > i) return src.slice(0, m.index) + src.slice(end);
  }
  const semi = src.indexOf(';', i);
  return semi > i ? src.slice(0, m.index) + src.slice(semi + 1) : src;
}

// Remove easter const helper + EASTER_EVENTS only
js = removeConstBlock(js, 'EASTER_EVENTS');
js = js.replace(/const easter = \(opacity[\s\S]*?\};\n\n/, '');

const removeFns = [
  'getCurrentDiscoState', 'updateDiscoBtn', 'updateCampingBtn', 'renderCamping', 'renderDisco',
  'hasCampingStage', 'getCampingStages', 'getDiscoDay', 'stopDisco', 'fmtSummaryDurationZh',
  'isLangAction', 'clearLangPressTimer', 'bindProfileLangEasters', 'setEaster', 'triggerEaster', 'updateEasterVisualBoost',
];
js = removeFunctions(js, removeFns);

// Remove shrek/rune block inside DOMContentLoaded
js = js.replace(/  let shrekClicks = 0[\s\S]*?document\.addEventListener\('click', e => \{[\s\S]*?\}\);\n\n/, '');

// Remove easter cron IIFE and setInterval
js = js.replace(/  \(\(\) => \{\s*const p = getFestivalParts\(\);[\s\S]*?\}\)\(\);\n\n/, '');
js = js.replace(/  setInterval\(\(\) => \{\s*const p = getFestivalParts\(\);[\s\S]*?\}, 1000\);\n\n/, '');

// Remove state
for (const v of ['discoMode', 'campingMode', 'discoHours', 'currentLang', 'discoDayKey', 'campingDayKey',
  'profileCampingEnabled', 'profileDiscoEnabled', 'campingStageMode', 'easterActive', 'preEasterState', 'manualLangEaster']) {
  js = js.replace(new RegExp(`let ${v} = [^;]+;\\r?\\n`, 'g'), '');
}
js = js.replace(/const boostedEasterEvents = new Set\(\[[\s\S]*?\]\);\n/, '');
js = js.replace(/let manuallyTriggered = new Set\(\);\n/, '');

// Const blocks
for (const c of ['DISCO_DAYS', 'DISCO_NIGHT_DAYS', 'DISCO_STAGE_META', 'CAMPING_STAGES_BY_DAY', 'CAMPING_STAGE_HOURS']) {
  js = removeConstBlock(js, c);
}

const reps = [
  [/function activeDateKey\(\) \{[\s\S]*?\}/, "function activeDateKey() { return 'date'; }"],
  [/const locale = currentLang[^;]+;/, "const locale = 'en-GB';"],
  [/\['fs-btn', 'settings-btn', 'camping-btn', 'disco-btn', 'favs-btn', 'stage-view-btn'\]/, "['fs-btn', 'settings-btn', 'favs-btn', 'stage-view-btn', 'help-btn']"],
  [/updateDiscoBtn\(\);\n\s*updateCampingBtn\(\);\n/g, ''],
  [/updateEasterVisualBoost\(\);\n/g, ''],
  [/const normalMode = !sheetLoadFailed && !discoMode && !campingMode && !favsOnly;/, 'const normalMode = !sheetLoadFailed && !favsOnly;'],
  [/  currentLang = localStorage\.getItem\('lang'\) \|\| 'fr';\n\n/, ''],
  [/  discoDayKey\s*=\s*getDiscoDay\(\);\n/, ''],
  [/  campingDayKey = normalDayKey;\n/, ''],
  [/  discoMode\s*=\s*false;\n/, ''],
  [/  campingMode\s*=\s*false;\n/, ''],
  [/  if \(campingStageMode\) secondaryStagesMode = false;\n/, ''],
  [/  profileCampingEnabled[\s\S]*?profileDancefloorEnabled = localStorage\.getItem\('profileDancefloor'\) !== '0';\n\n/,
    "  profileDancefloorEnabled = localStorage.getItem('profileDancefloor') !== '0';\n\n"],
  [/  if \(discoMode\)\s+document\.body\.classList\.add\('disco-mode'\);\n/, ''],
  [/  setTimeout\(revealPage, 4000\);\n/, ''],
  [/  if \(localStorage\.getItem\('rs_unlocked'\)\)[^\n]+\n/, ''],
  [/el\.textContent = el\.dataset\[currentLang\];/g, 'el.textContent = el.dataset.label;'],
  [/activeDayEl\.dataset\[activeDateKey\(\)\]/g, 'activeDayEl.dataset.date'],
  [/el\.textContent = currentLang === 'zh'[^;]+;/, "el.textContent = 'D-' + diff;"],
  [/\{ fr: 'PARAMÈTRES'[^}]+\}\[currentLang\] \|\| 'PARAMÈTRES'/g, "'SETTINGS'"],
  [/\{ fr: 'FAVORIS'[^}]+\}\[currentLang\] \|\| 'FAVORIS'/g, "'FAVORITES'"],
  [/\{ fr: 'PROGRAMME INDISPONIBLE'[^}]+\}\[currentLang\] \|\| 'PROGRAMME INDISPONIBLE'/g, "'SCHEDULE UNAVAILABLE'"],
  [/return discoMode \? discoDayKey : campingMode \? campingDayKey : normalDayKey;/, 'return normalDayKey;'],
  [/!discoMode && !campingMode && !favsOnly/g, '!favsOnly'],
  [/if \(false && !hasCampingStage\(selectedDay\)\) return;\n\s*/, ''],
  [/campingStageMode = false;\s*\r?\n/g, ''],
  [/campingStageMode = true;\s*\r?\n/g, ''],
  [/return !document\.body\.classList\.contains\('profile-mode'\)\s*&& !document\.body\.classList\.contains\('disco-mode'\)\s*&& !document\.body\.classList\.contains\('camping-mode'\);/,
    "return !document.body.classList.contains('profile-mode');"],
];
for (const [a, b] of reps) js = js.replace(a, b);

js = js.replace(/\} else if \(discoMode\) \{\s*setActiveDay\(discoDayKey\);[\s\S]*?queueActTextLayout\(\);\s*\} else if \(campingMode\) \{\s*setActiveDay\(campingDayKey\);[\s\S]*?renderCamping\(campingDayKey\);\s*\} else if \(favsOnly\)/, '} else if (favsOnly)');
js = js.replace(/      if \(discoMode\) \{\s*discoDayKey = selectedDay;[\s\S]*?queueActTextLayout\(\);\s*return;\s*\}\s*/, '');
js = js.replace(/      if \(campingMode\) \{\s*campingDayKey = selectedDay;[\s\S]*?renderCamping\(campingDayKey\);\s*return;\s*\}\s*/, '');

js = js.replace(/function getSheetStatusCopy\(kind\) \{[\s\S]*?\n\}/,
`function getSheetStatusCopy(kind) {
  const copy = { online: 'Data updated', updated: 'Data refreshed', cached: 'Local version loaded', offline: 'Offline: local version', updating: 'Refreshing…', error: 'No local version' };
  return copy[kind] || '';
}`);

js = js.replace(/function getNowSummaryCopy\(mode, minutes = null\) \{[\s\S]*?\n\}/,
`function getNowSummaryCopy(mode, minutes = null) {
  const dur = minutes === null ? null : fmtSummaryDuration(minutes);
  if (mode === 'now') return 'PLAYING NOW';
  return dur === null ? 'UP NEXT' : \`IN \${dur}\`;
}`);

js = js.replace(/function getNormalViewStages\(dayKey\) \{[\s\S]*?\n\}/,
`function getNormalViewStages(dayKey) {
  return secondaryStagesMode ? getSecondaryStages(dayKey) : getPrimaryStages(dayKey);
}`);

js = js.replace(/function getStageViewCycleStages\(dayKey\) \{[\s\S]*?\n\}/,
`function getStageViewCycleStages(dayKey) {
  const stages = ['primary'];
  if (hasSecondaryStages(dayKey)) stages.push('secondary');
  return stages;
}`);

js = js.replace(/function getStageViewLabel\([\s\S]*?\n\}/m,
`function getStageViewLabel(next) {
  return { primary: 'Main stages', secondary: 'Secondary stages' }[next] || 'Main stages';
}`);

js = js.replace(/function applyLanguageUI\(\) \{[\s\S]*?\n\}/,
`function applyLanguageUI() {
  document.querySelectorAll('.day-item').forEach(el => { el.textContent = el.dataset.label || el.textContent; });
  const active = document.querySelector('.day-item.active');
  if (active && $('current-date')) $('current-date').textContent = active.dataset.date || '';
}`);

js = js.replace(/function setLanguage\(code, persist = true\) \{[\s\S]*?\n\}/, 'function setLanguage() { applyLanguageUI(); }');
js = js.replace(/function applyProfileState\(\) \{[\s\S]*?\n\}/, 'function applyProfileState() { updateStageViewBtn(); }');

js = js.replace(/makeSection\('display', \[[\s\S]*?\]\);\n/, '');
js = js.replace(/makeSection\('lang', \[[\s\S]*?\]\);\n/, '');
js = js.replace(/bindProfileLangEasters\(col\);\n/, '');
js = js.replace(/if \(action === 'camping'\) \{[\s\S]*?\}\s*if \(action === 'disco'\) \{[\s\S]*?\}\s*/, '');
js = js.replace(/if \(isLangAction\(action\)\) \{[\s\S]*?\}\s*/, '');

js = js.replace(/const tr = \(map, fallback = ''\) => \(map && \(map\[currentLang\] \|\| map\.fr\)\) \|\| fallback;\s*const labels = \{[\s\S]*?\};\n\n/,
`const labels = {
      sections: { display: 'DISPLAY', fullscreen: 'FULLSCREEN/WALLPAPER', view: 'DAY VIEW', favFill: 'FAVORITES', sun: 'SUN', filters: 'FILTERS', data: 'DATA' },
      features: { dancefloor: 'DANCEFLOOR', update: 'UPDATE' },
      view: { full: 'FULL DAY', remaining: 'UPCOMING' },
      favFill: { off: 'ONLY', on: 'FILL' },
      sun: { auto: 'AUTO (8AM-8PM)' },
      days: { jeudi: 'THURSDAY', vendredi: 'FRIDAY', samedi: 'SATURDAY', dimanche: 'SUNDAY' },
      fs: { titles: 'TITLES', day: 'DAY', date: 'DATE', view: 'VIEW' },
    };

`);
js = js.replace(/tr\(labels\.sections\[key\]\)/g, 'labels.sections[key]');
js = js.replace(/tr\(labels\.sections\.view\)/g, 'labels.sections.view');
js = js.replace(/tr\(labels\.sections\.favFill\)/g, 'labels.sections.favFill');
js = js.replace(/tr\(labels\.sections\.sun\)/g, 'labels.sections.sun');
js = js.replace(/tr\(labels\.features\.(\w+)\)/g, 'labels.features.$1');
js = js.replace(/tr\(labels\.view\.(\w+)\)/g, 'labels.view.$1');
js = js.replace(/tr\(labels\.favFill\.(\w+)\)/g, 'labels.favFill.$1');
js = js.replace(/tr\(labels\.sun\.auto\)/g, 'labels.sun.auto');
js = js.replace(/tr\(labels\.days\[day\], day\)/g, 'labels.days[day]');
js = js.replace(/tr\(labels\.fs\.(\w+)\)/g, 'labels.fs.$1');

js = js.replace(/\['favs','rs_unlocked','color','lang',/, "['favs','color','helpSeen',");
js = js.replace(/'profileCamping','profileDisco',/g, '');
js = js.replace(/document\.body\.classList\.remove\('runescape-unlocked'\);\n/, '');
js = js.replace(/currentLang = 'fr';\n\s*manualLangEaster = null;\n\s*/, '');
js = js.replace(/profileCampingEnabled\s*=\s*true;\n\s*profileDiscoEnabled\s*=\s*true;\n/, '');
js = js.replace(/if \(discoMode\) \{ stopDisco\(false\); \}\n/, '');
js = js.replace(/if \(campingMode\) \{ campingMode = false; document\.body\.classList\.remove\('camping-mode'\); updateCampingBtn\(\); \}\n/, '');

js = js.replace(/const viewportScale = Math\.min\(vw \/ baseW, vh \/ baseH\);/,
`document.documentElement.dataset.viewport = (vw <= 560 && !document.body.classList.contains('is-fullscreen')) ? 'phone' : 'desktop';
    document.body.classList.toggle('phone-scroll', vw <= 560 && !document.body.classList.contains('is-fullscreen'));
    let viewportScale = Math.min(vw / baseW, vh / baseH);
    if (vw <= 560 && !document.body.classList.contains('is-fullscreen')) viewportScale = vw / baseW;`);

// Body
body = body.replace(/<img id="shrek-img"[\s\S]*?<img id="runescape-img"[^>]*>\n/, '');
body = body.replace(/<div id="left-btns">[\s\S]*?<\/div>\n\s*<div id="right-btns">/, '<div id="right-btns">');
body = body.replace(/data-date-fr="[^"]*"\s*/g, '');
body = body.replace(/data-date-zh="[^"]*"\s*/g, '');
body = body.replace(/data-date-en="/g, 'data-date="');
body = body.replace(/data-fr="[^"]*"\s*/g, '');
body = body.replace(/data-zh="[^"]*"\s*/g, '');
body = body.replace(/data-en="/g, 'data-label="');
body = body.replace(/aria-label="Favoris"/g, 'aria-label="Favorites"');
body = body.replace(/aria-label="Scènes secondaires"/g, 'aria-label="Secondary stages"');
body = body.replace(/aria-label="Plein écran"/g, 'aria-label="Fullscreen"');
body = body.replace(/aria-label="Réinitialiser"/g, 'aria-label="Reset"');
body = body.replace(/aria-label="Choisir la couleur"/g, 'aria-label="Pick color"');
body = body.replace(/aria-label="Couleur ([^"]*)"/g, 'aria-label="Color $1"');
body = body.replace(/aria-label="Mode clair"/g, 'aria-label="Light mode"');
body = body.replace(/aria-label="Paramètres"/g, 'aria-label="Settings"');
body = body.replace(/>(JEUDI|VENDREDI|SAMEDI|DIMANCHE)</g, (_, d) => ({ JEUDI: '>THURSDAY<', VENDREDI: '>FRIDAY<', SAMEDI: '>SATURDAY<', DIMANCHE: '>SUNDAY<' })[d]);
body = body.replace(/id="current-date">02 JUILLET/, 'id="current-date">JULY 02');
body = body.replace(/<button type="button" id="profile-btn"/,
  '<button type="button" id="help-btn" class="round-btn top-btn" aria-label="Help"><svg width="88" height="88" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.8"><circle cx="12" cy="12" r="10"/><path d="M9.5 9.5a2.5 2.5 0 1 1 4.2 1.8c-.8.6-1.7 1.4-1.7 2.7"/><circle cx="12" cy="17" r="1" fill="#fff" stroke="none"/></svg></button>\n      <button type="button" id="profile-btn"');

css = css.replace(/  \.easter-img[\s\S]*?#disco-img \{ width: 540px; height: 960px; left: 270px; \}\n\n/, '');
css += fs.readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), 'phone-help.css'), 'utf8');

const out = `export function initApp() {\n${js}\n}\n`;
fs.writeFileSync(path.join(root, 'src', 'modules', 'app-core.js'), out);
fs.writeFileSync(path.join(root, 'src', 'styles', 'app.css'), css);
fs.writeFileSync(path.join(root, 'src', 'body.html'), body);
const checks = ['function renderDay', 'function enterFS', 'DOMContentLoaded', 'function loadOverrides'];
for (const c of checks) console.log(c, out.includes(c) ? 'OK' : 'MISSING');
console.log('Lines:', out.split('\n').length);
