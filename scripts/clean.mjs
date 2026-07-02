/**
 * Clean legacy extract: remove camping, disco, easter eggs, i18n.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
let css = fs.readFileSync(path.join(root, 'src', 'styles', 'app.raw.css'), 'utf8');
let js = fs.readFileSync(path.join(root, 'src', 'modules', 'app.raw.js'), 'utf8');
let body = fs.readFileSync(path.join(root, 'src', 'body.raw.html'), 'utf8');

function removeBlock(src, startMarker, endMarker) {
  const start = src.indexOf(startMarker);
  if (start === -1) return src;
  const end = src.indexOf(endMarker, start + startMarker.length);
  if (end === -1) return src;
  return src.slice(0, start) + src.slice(end);
}

function removeRegex(src, pattern) {
  return src.replace(pattern, '');
}

// --- BODY HTML ---
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
body = body.replace(/aria-label="Couleur #[^"]*"/g, (m) => m.replace('Couleur', 'Color'));
body = body.replace(/aria-label="Mode clair"/g, 'aria-label="Light mode"');
body = body.replace(/aria-label="Paramètres"/g, 'aria-label="Settings"');
body = body.replace(/>(JEUDI|VENDREDI|SAMEDI|DIMANCHE)</g, (m, d) => {
  const map = { JEUDI: 'THURSDAY', VENDREDI: 'FRIDAY', SAMEDI: 'SATURDAY', DIMANCHE: 'SUNDAY' };
  return `>${map[d]}<`;
});
body = body.replace(/id="current-date">02 JUILLET/, 'id="current-date">JULY 02');
body = body.replace(/<button type="button" id="profile-btn"/, '<button type="button" id="help-btn" class="round-btn top-btn" aria-label="Help"><svg width="88" height="88" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.8"><circle cx="12" cy="12" r="10"/><path d="M9.5 9.5a2.5 2.5 0 1 1 4.2 1.8c-.8.6-1.7 1.4-1.7 2.7"/><circle cx="12" cy="17" r="1" fill="#fff" stroke="none"/></svg></button>\n      <button type="button" id="profile-btn"');

// --- CSS ---
const cssBlocks = [
  /  \.easter-img[\s\S]*?#disco-img \{ width: 540px[\s\S]*?\}\n\n/,
  /  body\.disco-mode \{[\s\S]*?\}\n\n/,
  /  body\.disco-mode[\s\S]*?body\.disco-mode \.act-disco-g[\s\S]*?\}\n/,
  /  #camping-btn \{[\s\S]*?\}\n/,
  /  #disco-btn[\s\S]*?#disco-btn\.cross-scene-indicator[\s\S]*?\}\n/,
  /  #left-btns[\s\S]*?#disco-btn \{[^}]*\}\n/,
  /  \.disco-mode \.day-item\[data-day="jeudi"\][\s\S]*?display: none; \}\n/,
  /  body\.camping-mode[\s\S]*?body\.camping-stage-mode[\s\S]*?display: none; \}\n/,
  /  \.camping-card[\s\S]*?\.camping-time \{[\s\S]*?\}\n/,
  /  \.info-col \{[\s\S]*?\}\n/,
  /  \.lang-zh[\s\S]*?\.lang-zh\.is-fullscreen \.day-item\.active \{ font-size: 123px; \}\n/,
  /  body\.easter-active[\s\S]*?body\.easter-visual-boost[\s\S]*?\}\n/,
  /  body\.runescape-active[\s\S]*?body:not\(\.runescape-active\)[\s\S]*?border-left-color: var\(--accent-border\) !important; \}\n/,
  /  body\.comic-sans[\s\S]*?font-family: 'Comic Neue'[\s\S]*?\}\n/,
  /  #fr-img,[\s\S]*?#zh-img \{[\s\S]*?\}\n/,
];
for (const re of cssBlocks) css = css.replace(re, '');

css += `
html[data-viewport="phone"] {
  --edge-gap: 12px;
  --bottom-btn-size: 96px;
}
html[data-viewport="phone"] .content {
  padding: 16px 12px calc(80px + env(safe-area-inset-bottom, 0px));
  padding-left: calc(12px + env(safe-area-inset-left, 0px));
  padding-right: calc(12px + env(safe-area-inset-right, 0px));
}
html[data-viewport="phone"] .day-item { font-size: 28px; }
html[data-viewport="phone"] .day-item.active { font-size: 48px; }
html[data-viewport="phone"] #bottom-bar { padding-bottom: env(safe-area-inset-bottom, 0px); }
html[data-viewport="phone"] .schedule-scroll { overflow-x: auto; -webkit-overflow-scrolling: touch; scrollbar-width: none; }
html[data-viewport="phone"] .schedule-scroll::-webkit-scrollbar { display: none; }
body.phone-scroll { overflow-y: auto; overflow-x: hidden; height: auto; min-height: 100dvh; }
#help-overlay { position: fixed; inset: 0; z-index: 10000; background: rgba(0,0,0,0.92); display: flex; align-items: center; justify-content: center; padding: 24px; }
#help-overlay[hidden] { display: none; }
.help-panel { max-width: 520px; max-height: 90vh; overflow-y: auto; background: #1a1a1a; border: 1px solid rgba(255,255,255,0.2); border-radius: 12px; padding: 28px; color: #fff; }
.help-panel h2 { font-family: 'Bebas Neue', sans-serif; font-size: 36px; letter-spacing: 2px; margin-bottom: 20px; color: var(--accent); }
.help-panel section { margin-bottom: 18px; }
.help-panel h3 { font-size: 14px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px; opacity: 0.7; }
.help-panel p { font-size: 15px; line-height: 1.5; opacity: 0.9; }
.help-panel button { margin-top: 20px; width: 100%; padding: 14px; font-size: 16px; font-weight: 600; border: none; border-radius: 8px; background: var(--accent); color: #fff; cursor: pointer; }
`;

// --- JS state vars ---
js = js.replace(/let discoMode = false;\n/, '');
js = js.replace(/let campingMode = false;\n/, '');
js = js.replace(/let discoHours = \{ start: 25, end: 29 \};\n/, '');
js = js.replace(/let currentLang = 'fr';\n/, '');
js = js.replace(/let discoDayKey = 'vendredi';\n/, '');
js = js.replace(/let campingDayKey = 'jeudi';\n/, '');
js = js.replace(/let profileCampingEnabled = true;\n/, '');
js = js.replace(/let profileDiscoEnabled = true;\n/, '');
js = js.replace(/let campingStageMode = false;\n/, '');

// Constants
js = removeRegex(js, /const DISCO_DAYS = \{[\s\S]*?\};\n/);
js = removeRegex(js, /const DISCO_NIGHT_DAYS = \{[\s\S]*?\};\n/);
js = removeRegex(js, /const DISCO_STAGE_META = \{[\s\S]*?\};\n/);
js = removeRegex(js, /const CAMPING_STAGES_BY_DAY = \{[\s\S]*?\};\n/);
js = removeRegex(js, /const CAMPING_STAGE_HOURS = \{ start: 11, end: 14 \};\n/);

// Functions - use removeBlock for large functions
const fnRemovals = [
  ['function getCurrentDiscoState()', 'function updateDiscoBtn()'],
  ['function updateDiscoBtn()', 'function updateCampingBtn()'],
  ['function updateCampingBtn()', 'function renderCamping('],
  ['function renderCamping(', 'function renderDisco('],
  ['function renderDisco(', 'function makeDay('],
  ['function hasCampingStage(', 'function getSecondaryStages('],
  ['function getCampingStages(', 'function getNormalViewStages('],
  ['function getDiscoDay()', 'function getDefaultDay()'],
  ['function stopDisco(', 'function refreshTimeSensitiveUI()'],
  ['function fmtSummaryDurationZh(', 'function getNowSummaryCopy('],
  ['function isLangAction(', 'function clearLangPressTimer()'],
  ['function clearLangPressTimer()', 'function bindProfileLangEasters('],
  ['function bindProfileLangEasters(', 'function renderProfile()'],
  ['function setEaster(', 'const manuallyTriggered'],
  ['const manuallyTriggered', 'let shrekClicks'],
  ['let shrekClicks', 'function exitOnClick('],
];
for (const [start, end] of fnRemovals) {
  js = removeBlock(js, start, end);
}

// Remove easter cron blocks before exitOnClick
js = removeRegex(js, /const easter = \(opacity[\s\S]*?function exitOnClick\(/, 'function exitOnClick(');

// activeDateKey
js = js.replace(/function activeDateKey\(\) \{[\s\S]*?\}/, "function activeDateKey() { return 'date'; }");

// getSheetStatusCopy
js = js.replace(/function getSheetStatusCopy\(kind\) \{[\s\S]*?\n\}/,
`function getSheetStatusCopy(kind) {
  const copy = { online: 'Data updated', updated: 'Data refreshed', cached: 'Local version loaded', offline: 'Offline: local version', updating: 'Refreshing…', error: 'No local version' };
  return copy[kind] || '';
}`);

js = js.replace(/const locale = currentLang === 'en' \? 'en-GB' : currentLang === 'zh' \? 'zh-CN' : 'fr-FR';/, "const locale = 'en-GB';");

// getNowSummaryCopy
js = js.replace(/function getNowSummaryCopy\(mode, minutes = null\) \{[\s\S]*?\n\}/,
`function getNowSummaryCopy(mode, minutes = null) {
  const dur = minutes === null ? null : fmtSummaryDuration(minutes);
  if (mode === 'now') return 'PLAYING NOW';
  return dur === null ? 'UP NEXT' : \`IN \${dur}\`;
}`);

// getNormalViewStages
js = js.replace(/function getNormalViewStages\(dayKey\) \{[\s\S]*?\n\}/,
`function getNormalViewStages(dayKey) {
  return secondaryStagesMode ? getSecondaryStages(dayKey) : getPrimaryStages(dayKey);
}`);

// getStageViewCycleStages
js = js.replace(/function getStageViewCycleStages\(dayKey\) \{[\s\S]*?\n\}/,
`function getStageViewCycleStages(dayKey) {
  const stages = ['primary'];
  if (hasSecondaryStages(dayKey)) stages.push('secondary');
  return stages;
}`);

// getStageViewLabel - find and replace
js = js.replace(/function getStageViewLabel\([\s\S]*?\n\}/m,
`function getStageViewLabel(next) {
  return { primary: 'Main stages', secondary: 'Secondary stages' }[next] || 'Main stages';
}`);

// applyLanguageUI
js = js.replace(/function applyLanguageUI\(\) \{[\s\S]*?\n\}/,
`function applyLanguageUI() {
  document.querySelectorAll('.day-item').forEach(el => { el.textContent = el.dataset.label || el.textContent; });
  const active = document.querySelector('.day-item.active');
  if (active) $('current-date').textContent = active.dataset.date || '';
}`);

// setLanguage
js = js.replace(/function setLanguage\(code, persist = true\) \{[\s\S]*?\n\}/,
'function setLanguage() { applyLanguageUI(); }');

// applyProfileState
js = js.replace(/function applyProfileState\(\) \{[\s\S]*?\n\}/,
`function applyProfileState() {
  updateStageViewBtn();
}`);

// paintThemedButtons
js = js.replace(/\['fs-btn', 'settings-btn', 'camping-btn', 'disco-btn', 'favs-btn', 'stage-view-btn'\]/,
  "['fs-btn', 'settings-btn', 'favs-btn', 'stage-view-btn', 'help-btn']");
js = js.replace(/\s*updateDiscoBtn\(\);\n\s*updateCampingBtn\(\);\n/g, '\n');

// getSettingsTitle
js = js.replace(/\{ fr: 'PARAMÈTRES', en: 'SETTINGS', zh: '设置' \}\[currentLang\] \|\| 'PARAMÈTRES'/g, "'SETTINGS'");
js = js.replace(/\{ fr: 'FAVORIS', en: 'FAVORITES', zh: '收藏' \}\[currentLang\] \|\| 'FAVORIS'/g, "'FAVORITES'");
js = js.replace(/\{ fr: 'PROGRAMME INDISPONIBLE', en: 'SCHEDULE UNAVAILABLE', zh: '节目单不可用' \}\[currentLang\] \|\| 'PROGRAMME INDISPONIBLE'/g, "'SCHEDULE UNAVAILABLE'");
js = js.replace(/el\.textContent = currentLang === 'zh' \? diff \+ '天' : currentLang === 'en' \? 'D-' \+ diff : 'J-' \+ diff;/, "el.textContent = 'D-' + diff;");
js = js.replace(/el\.textContent = el\.dataset\[currentLang\];/g, 'el.textContent = el.dataset.label;');
js = js.replace(/activeDayEl\.dataset\[activeDateKey\(\)\]/g, 'activeDayEl.dataset.date');

// DOMContentLoaded init
js = js.replace(/  currentLang = localStorage\.getItem\('lang'\) \|\| 'fr';\n\n/, '');
js = js.replace(/  discoDayKey\s*=\s*getDiscoDay\(\);\n/, '');
js = js.replace(/  campingDayKey = normalDayKey;\n/, '');
js = js.replace(/  discoMode\s*=\s*false;\n/, '');
js = js.replace(/  campingMode\s*=\s*false;\n/, '');
js = js.replace(/  if \(campingStageMode\) secondaryStagesMode = false;\n/, '');
js = js.replace(/  profileCampingEnabled[\s\S]*?profileDancefloorEnabled = localStorage\.getItem\('profileDancefloor'\) !== '0';\n\n/,
  "  profileDancefloorEnabled = localStorage.getItem('profileDancefloor') !== '0';\n\n");
js = js.replace(/  if \(discoMode\)\s+document\.body\.classList\.add\('disco-mode'\);\n/, '');
js = js.replace(/  setTimeout\(revealPage, 4000\);\n/, '');
js = js.replace(/  if \(localStorage\.getItem\('rs_unlocked'\)\) document\.body\.classList\.add\('runescape-unlocked'\);\n/, '');

// loadOverrides branches
js = js.replace(/const normalMode = !sheetLoadFailed && !discoMode && !campingMode && !favsOnly;/,
  'const normalMode = !sheetLoadFailed && !favsOnly;');
js = js.replace(/    } else if \(discoMode\) \{[\s\S]*?queueActTextLayout\(\);\n    } else if \(campingMode\) \{[\s\S]*?renderCamping\(campingDayKey\);\n    } else if \(favsOnly\)/,
  '    } else if (favsOnly)');

// updateDaysLeft area - remove updateDiscoBtn/updateCampingBtn calls
js = js.replace(/  updateDiscoBtn\(\);\n  updateCampingBtn\(\);\n/g, '');

// refreshTimeSensitiveUI
js = js.replace(/    updateDiscoBtn\(\);\n    updateCampingBtn\(\);\n/g, '');

// day click handlers
js = js.replace(/        if \(campingStageMode && !hasCampingStage\(selectedDay\)\) return;\n/, '');
js = js.replace(/      if \(discoMode\) \{[\s\S]*?return;\n      \}\n/, '');
js = js.replace(/      if \(campingMode\) \{[\s\S]*?return;\n      \}\n/, '');

// getCurrentSwipeDay
js = js.replace(/return discoMode \? discoDayKey : campingMode \? campingDayKey : normalDayKey;/, 'return normalDayKey;');

// isSwipeBlocked day filter
js = js.replace(/!discoMode && !campingMode && !favsOnly/g, '!favsOnly');

// showDefaultDay
js = js.replace(/campingStageMode = false; /g, '');

// renderProfile labels - replace tr() pattern
js = js.replace(/    const tr = \(map, fallback = ''\) => \(map && \(map\[currentLang\] \|\| map\.fr\)\) \|\| fallback;\n    const labels = \{[\s\S]*?    \};\n\n/,
`    const labels = {
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

js = js.replace(/    makeSection\('display', \[[\s\S]*?\]\);\n/, '');
js = js.replace(/    makeSection\('lang', \[[\s\S]*?\]\);\n/, '');
js = js.replace(/    bindProfileLangEasters\(col\);\n/, '');

// handleProfileAction removals
js = js.replace(/    if \(action === 'camping'\) \{[\s\S]*?\}\n    if \(action === 'disco'\) \{[\s\S]*?\}\n/, '');
js = js.replace(/    if \(isLangAction\(action\)\) \{[\s\S]*?\}\n/, '');

// reset
js = js.replace(/\['favs','rs_unlocked','color','lang',/, "['favs','color','helpSeen',");
js = js.replace(/'profileCamping','profileDisco',/g, '');
js = js.replace(/document\.body\.classList\.remove\('runescape-unlocked'\);\n/, '');
js = js.replace(/      currentLang = 'fr';\n      manualLangEaster = null;\n      applyLanguageUI\(\);\n/, '      applyLanguageUI();\n');
js = js.replace(/      profileCampingEnabled\s+=\s+true;\n      profileDiscoEnabled\s+=\s+true;\n/, '');
js = js.replace(/      if \(discoMode\)\s+\{ stopDisco\(false\); \}\n/, '');
js = js.replace(/      if \(campingMode\)\s+\{ campingMode = false; document\.body\.classList\.remove\('camping-mode'\); updateCampingBtn\(\); \}\n/, '');

// updateEasterVisualBoost in refreshFullscreenState
js = js.replace(/\s*updateEasterVisualBoost\(\);\n/g, '\n');

// canAutoDimBottomButtons
js = js.replace(/return !document\.body\.classList\.contains\('profile-mode'\)\s*&& !document\.body\.classList\.contains\('disco-mode'\)\s*&& !document\.body\.classList\.contains\('camping-mode'\);/,
  "return !document.body.classList.contains('profile-mode');");

// cycleStageView - remove camping references
js = js.replace(/campingStageMode/g, 'false /* removed */');
// Fix broken references from above - need smarter approach for cycleStageView

// Labels in stage view for i18n
js = js.replace(/primary: \{ fr: 'Scènes principales', en: 'Main stages', zh: '主舞台' \},\s*secondary: \{ fr: 'Scènes secondaires', en: 'Secondary stages', zh: '副舞台' \},\s*camping: \{ fr: 'Camping', en: 'Camping', zh: '营地' \},/,
  "primary: 'Main stages', secondary: 'Secondary stages',");

js = js.replace(/labels\[next\]\?\.\[currentLang\] \|\| labels\[next\]\?\.fr \|\| 'Camping'/g, "labels[next] || 'Main stages'");

// DISCO labels in meta - simplify if still referenced
js = js.replace(/meta\.labels\[currentLang\]/g, "meta.labels.en");

// Phone scaling patch in applyScale - inject width-first
const applyScalePatch = `    const isPhone = vw <= 560 && !isFS;
    document.documentElement.dataset.viewport = isPhone ? 'phone' : 'desktop';
    document.body.classList.toggle('phone-scroll', isPhone && !isFS);
`;
js = js.replace(/    const viewportScale = Math\.min\(vw \/ baseW, vh \/ baseH\);/,
  applyScalePatch + `    let viewportScale = Math.min(vw / baseW, vh / baseH);
    if (vw <= 560 && !document.body.classList.contains('is-fullscreen')) {
      viewportScale = vw / baseW;
    }`);

// Export for module
const moduleJs = `// Rampage Timetable — cleaned from legacy monolith
export function initApp() {
${js}
}
`;

fs.writeFileSync(path.join(root, 'src', 'styles', 'app.css'), css);
fs.writeFileSync(path.join(root, 'src', 'body.html'), body);
fs.writeFileSync(path.join(root, 'src', 'modules', 'app-core.js'), moduleJs);

console.log('Cleaned:', css.length, 'css,', moduleJs.length, 'js module');
