/**
 * One-time migration: extract legacy index.html into Vite src structure,
 * stripping camping, disco, easter eggs, and i18n.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const legacyPath = path.join(root, 'legacy', 'index.html');

if (!fs.existsSync(legacyPath)) {
  const src = path.join(root, 'index.html');
  if (fs.existsSync(src)) {
    fs.mkdirSync(path.join(root, 'legacy'), { recursive: true });
    fs.copyFileSync(src, legacyPath);
  }
}

const html = fs.readFileSync(legacyPath, 'utf8');

// Extract CSS
const styleMatch = html.match(/<style>([\s\S]*?)<\/style>/);
let css = styleMatch ? styleMatch[1] : '';

// Extract JS (main script block after body)
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
let js = scripts.length > 1 ? scripts[scripts.length - 1][1] : (scripts[0]?.[1] || '');

// --- CSS cleanup ---
const cssRemovals = [
  /\.easter-img[\s\S]*?(?=\n  [.#a-z])/g,
  /body\.easter-active[\s\S]*?(?=\n  [.#a-z])/g,
  /\.comic-sans[\s\S]*?(?=\n  [.#a-z])/g,
  /body\.runescape[\s\S]*?(?=\n  [.#a-z])/g,
  /body\.disco-mode[\s\S]*?(?=\n  [.#a-z{])/g,
  /\.disco-mode[\s\S]*?(?=\n  [.#a-z])/g,
  /#camping-btn[\s\S]*?(?=\n  [.#a-z])/g,
  /#disco-btn[\s\S]*?(?=\n  [.#a-z])/g,
  /#left-btns[\s\S]*?(?=\n  [.#a-z])/g,
  /\.camping-card[\s\S]*?(?=\n  [.#a-z])/g,
  /\.info-col[\s\S]*?(?=\n  [.#a-z])/g,
  /\.lang-zh[\s\S]*?(?=\n  [.#a-z])/g,
  /body\.camping-mode[\s\S]*?(?=\n  [.#a-z])/g,
  /body\.secondary-stages-mode \.day-item\[data-day="jeudi"\][\s\S]*?display: none;\s*\}/g,
];
for (const re of cssRemovals) css = css.replace(re, '');

// Phone layout additions
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
html[data-viewport="phone"] #bottom-bar {
  padding-bottom: env(safe-area-inset-bottom, 0px);
}
html[data-viewport="phone"] .stage-scroll-wrap {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}
html[data-viewport="phone"] .stage-scroll-wrap::-webkit-scrollbar { display: none; }

#help-overlay {
  position: fixed;
  inset: 0;
  z-index: 10000;
  background: rgba(0,0,0,0.92);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  padding-top: calc(24px + env(safe-area-inset-top, 0px));
  padding-bottom: calc(24px + env(safe-area-inset-bottom, 0px));
}
#help-overlay[hidden] { display: none; }
.help-panel {
  max-width: 520px;
  max-height: 90vh;
  overflow-y: auto;
  background: #1a1a1a;
  border: 1px solid rgba(255,255,255,0.2);
  border-radius: 12px;
  padding: 28px;
  color: #fff;
  font-family: 'Inter', sans-serif;
}
.help-panel h2 {
  font-family: 'Bebas Neue', sans-serif;
  font-size: 36px;
  letter-spacing: 2px;
  margin-bottom: 20px;
  color: var(--accent, #eb0028);
}
.help-panel section { margin-bottom: 18px; }
.help-panel h3 { font-size: 14px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px; opacity: 0.7; }
.help-panel p { font-size: 15px; line-height: 1.5; opacity: 0.9; }
.help-panel button {
  margin-top: 20px;
  width: 100%;
  padding: 14px;
  font-size: 16px;
  font-weight: 600;
  border: none;
  border-radius: 8px;
  background: var(--accent, #eb0028);
  color: #fff;
  cursor: pointer;
}
body.phone-scroll { overflow-y: auto; overflow-x: hidden; height: auto; min-height: 100dvh; }
`;

// --- JS cleanup ---
// Remove easter egg block (EASTER_EVENTS through end of setInterval easter)
js = js.replace(/const easter = \(opacity[\s\S]*?\}, 1000\);\s*\n/, '');

// Remove camping/disco state and related
js = js.replace(/let discoMode = false;\n/, '');
js = js.replace(/let campingMode = false;\n/, '');
js = js.replace(/let discoHours = \{ start: 25, end: 29 \};\n/, '');
js = js.replace(/let discoDayKey = 'vendredi';\n/, '');
js = js.replace(/let campingDayKey = 'jeudi';\n/, '');
js = js.replace(/let profileCampingEnabled = true;\n/, '');
js = js.replace(/let profileDiscoEnabled = true;\n/, '');
js = js.replace(/let campingStageMode = false;\n/, '');

// Remove DISCO constants blocks
js = js.replace(/const DISCO_DAYS = \{[\s\S]*?\};\n/, '');
js = js.replace(/const DISCO_NIGHT_DAYS = \{[\s\S]*?\};\n/, '');
js = js.replace(/const DISCO_STAGE_META = \{[\s\S]*?\};\n/, '');
js = js.replace(/const CAMPING_STAGES_BY_DAY = \{[\s\S]*?\};\n/, '');
js = js.replace(/const CAMPING_STAGE_HOURS = \{ start: 11, end: 14 \};\n/, '');

// Remove currentLang - replace with English-only helpers
js = js.replace(/let currentLang = 'fr';\n/, '');

// Simplify i18n lookups - replace common patterns
js = js.replace(/function activeDateKey\(\) \{\s*return 'date' \+ currentLang\.charAt\(0\)\.toUpperCase\(\) \+ currentLang\.slice\(1\);\s*\}/,
  "function activeDateKey() { return 'dateEn'; }");

js = js.replace(/function getSheetStatusCopy\(kind\) \{\s*const copy = \{[\s\S]*?\};\s*return \(copy\[kind\] && \(copy\[kind\]\[currentLang\] \|\| copy\[kind\]\.fr\)\) \|\| '';\s*\}/,
`function getSheetStatusCopy(kind) {
  const copy = {
    online: 'Data updated',
    updated: 'Data refreshed',
    cached: 'Local version loaded',
    offline: 'Offline: local version',
    updating: 'Refreshing…',
    error: 'No local version',
  };
  return copy[kind] || '';
}`);

js = js.replace(/const locale = currentLang === 'en' \? 'en-GB' : currentLang === 'zh' \? 'zh-CN' : 'fr-FR';/,
  "const locale = 'en-GB';");

// Remove fmtSummaryDurationZh and simplify getNowSummaryCopy
js = js.replace(/function fmtSummaryDurationZh\([\s\S]*?\}\n\n/, '');
js = js.replace(/function getNowSummaryCopy\(mode, minutes = null\) \{[\s\S]*?\}\n/,
`function getNowSummaryCopy(mode, minutes = null) {
  const dur = minutes === null ? null : fmtSummaryDuration(minutes);
  if (mode === 'now') return 'PLAYING NOW';
  return dur === null ? 'UP NEXT' : \`IN \${dur}\`;
}
`);

// Remove renderCamping, renderDisco, getCurrentDiscoState, updateDiscoBtn, updateCampingBtn functions
js = js.replace(/function getCurrentDiscoState\(\) \{[\s\S]*?\}\n\n/, '');
js = js.replace(/function updateDiscoBtn\(\) \{[\s\S]*?\}\n\n/, '');
js = js.replace(/function updateCampingBtn\(\) \{[\s\S]*?\}\n\n/, '');
js = js.replace(/function renderCamping\(dayKey\) \{[\s\S]*?\}\n\n/, '');
js = js.replace(/function renderDisco\([\s\S]*?\n\}\n\n/, '');

// Remove bindProfileLangEasters and lang easter vars
js = js.replace(/let langPressTimer = null;\n[\s\S]*?function bindProfileLangEasters\(col\) \{[\s\S]*?\}\n\n/, '');

// Remove shrek/rune click listeners at end
js = js.replace(/let shrekClicks = 0[\s\S]*?document\.addEventListener\('click', e => \{[\s\S]*?\}\);\s*\n\n/, '');

// Remove easter cron IIFE
js = js.replace(/\(\(\) => \{\s*const p = getFestivalParts\(\);[\s\S]*?\}\)\(\);\s*\n\n/, '');

// Remove updateEasterVisualBoost calls
js = js.replace(/\s*updateEasterVisualBoost\(\);\n/g, '\n');
js = js.replace(/function updateEasterVisualBoost\(\) \{[\s\S]*?\}\n\n/, '');
js = js.replace(/function setEaster\(mode\) \{[\s\S]*?\}\n\n/, '');
js = js.replace(/function triggerEaster\(key\) \{[\s\S]*?\}\n\n/, '');
js = js.replace(/let easterActive = null;\n/, '');
js = js.replace(/let preEasterState = null;\n/, '');
js = js.replace(/const boostedEasterEvents = new Set\(\[[\s\S]*?\]\);\n/, '');
js = js.replace(/let manualLangEaster = null;\n/, '');

// Fix paintThemedButtons - remove disco/camping btn refs
js = js.replace(/\['fs-btn', 'settings-btn', 'camping-btn', 'disco-btn', 'favs-btn', 'stage-view-btn'\]/,
  "['fs-btn', 'settings-btn', 'favs-btn', 'stage-view-btn']");
js = js.replace(/\s*updateDiscoBtn\(\);\n\s*updateCampingBtn\(\);\n/, '\n');

// applyLanguageUI simplification
js = js.replace(/function applyLanguageUI\(\) \{[\s\S]*?\}\n\n/,
`function applyLanguageUI() {
  document.body.classList.remove('lang-zh');
  document.querySelectorAll('.day-item').forEach(el => {
    el.textContent = el.dataset.en || el.textContent;
  });
  const active = document.querySelector('.day-item.active');
  if (active) $('current-date').textContent = active.dataset.dateEn || '';
}

`);

// getSettingsTitle
js = js.replace(/\{ fr: 'PARAMÈTRES', en: 'SETTINGS', zh: '设置' \}\[currentLang\] \|\| 'PARAMÈTRES'/g, "'SETTINGS'");

// FAVORIS titles
js = js.replace(/\{ fr: 'FAVORIS', en: 'FAVORITES', zh: '收藏' \}\[currentLang\] \|\| 'FAVORIS'/g, "'FAVORITES'");

// sheet error message
js = js.replace(/\{ fr: 'PROGRAMME INDISPONIBLE', en: 'SCHEDULE UNAVAILABLE', zh: '节目单不可用' \}\[currentLang\] \|\| 'PROGRAMME INDISPONIBLE'/g,
  "'SCHEDULE UNAVAILABLE'");

// days left
js = js.replace(/el\.textContent = currentLang === 'zh' \? diff \+ '天' : currentLang === 'en' \? 'D-' \+ diff : 'J-' \+ diff;/,
  "el.textContent = 'D-' + diff;");

// DOMContentLoaded - remove currentLang init
js = js.replace(/currentLang = localStorage\.getItem\('lang'\) \|\| 'fr';\n\n/, '');
js = js.replace(/discoDayKey\s*=\s*getDiscoDay\(\);\n/, '');
js = js.replace(/campingDayKey = normalDayKey;\n/, '');
js = js.replace(/discoMode\s*=\s*false;\n/, '');
js = js.replace(/campingMode\s*=\s*false;\n/, '');
js = js.replace(/if \(campingStageMode\) secondaryStagesMode = false;\n/, '');
js = js.replace(/profileCampingEnabled[\s\S]*?profileDancefloorEnabled = localStorage\.getItem\('profileDancefloor'\) !== '0';\n\n/,
  "profileDancefloorEnabled = localStorage.getItem('profileDancefloor') !== '0';\n\n");
js = js.replace(/if \(discoMode\)\s+document\.body\.classList\.add\('disco-mode'\);\n/, '');
js = js.replace(/el\.textContent = el\.dataset\[currentLang\];/g, 'el.textContent = el.dataset.en;');

// Remove 4s reveal timeout - change to immediate fallback only if needed
js = js.replace(/setTimeout\(revealPage, 4000\);\n/, '');

// stopDisco function
js = js.replace(/function stopDisco\(renderNormal = true\) \{[\s\S]*?\}\n\n/, '');

// Remove setLanguage function body references - keep simplified
js = js.replace(/function setLanguage\(code, persist = true\) \{[\s\S]*?\}\n\n/,
`function setLanguage() { applyLanguageUI(); }

`);

// Profile render - remove tr() and lang section, simplify labels to English
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

// Profile display section - remove camping/disco rows and lang section
js = js.replace(/makeSection\('display', \[[\s\S]*?\]\);\n/, '');
js = js.replace(/makeSection\('lang', \[[\s\S]*?\]\);\n/, '');
js = js.replace(/bindProfileLangEasters\(col\);\n/, '');

// showDefaultDay - remove campingStageMode
js = js.replace(/campingStageMode = false; /g, '');

// getStageViewCycle - remove camping
js = js.replace(/function getStageViewCycleStages\(dayKey\) \{[\s\S]*?\}\n/,
`function getStageViewCycleStages(dayKey) {
  const stages = ['primary'];
  if (hasSecondaryStages(dayKey)) stages.push('secondary');
  return stages;
}
`);

js = js.replace(/function hasCampingStage\(dayKey\) \{[\s\S]*?\}\n\n/, '');
js = js.replace(/function getCampingStages\(dayKey\) \{[\s\S]*?\}\n\n/, '');

// getNormalViewStages
js = js.replace(/function getNormalViewStages\(dayKey\) \{[\s\S]*?\}\n/,
`function getNormalViewStages(dayKey) {
  return secondaryStagesMode ? getSecondaryStages(dayKey) : getPrimaryStages(dayKey);
}
`);

// applyProfileState - remove camping/disco
js = js.replace(/function applyProfileState\(\) \{[\s\S]*?\}\n\n/,
`function applyProfileState() {
  updateStageViewBtn();
}

`);

// handleProfileAction - remove camping, disco, lang actions
js = js.replace(/if \(action === 'camping'\) \{[\s\S]*?\}\n    if \(action === 'disco'\) \{[\s\S]*?\}\n/, '');
js = js.replace(/if \(isLangAction\(action\)\) \{[\s\S]*?\}\n/, '');
js = js.replace(/function isLangAction\(action\) \{[\s\S]*?\}\n\n/, '');

// reset handler - remove lang, rs_unlocked, profileCamping, profileDisco
js = js.replace(/\['favs','rs_unlocked','color','lang','sunMode'/, "['favs','color','sunMode','helpSeen'");
js = js.replace(/'profileCamping','profileDisco',/g, '');
js = js.replace(/document\.body\.classList\.remove\('runescape-unlocked'\);\n/, '');
js = js.replace(/currentLang = 'fr';\n\s*manualLangEaster = null;\n\s*applyLanguageUI\(\);\n/, 'applyLanguageUI();\n');
js = js.replace(/profileCampingEnabled\s*=\s*true;\n\s*profileDiscoEnabled\s*=\s*true;\n/, '');
js = js.replace(/if \(discoMode\)\s*\{ stopDisco\(false\); \}\n/, '');
js = js.replace(/if \(campingMode\)\s*\{ campingMode = false; document\.body\.classList\.remove\('camping-mode'\); updateCampingBtn\(\); \}\n/, '');
js = js.replace(/if \(localStorage\.getItem\('rs_unlocked'\)\) document\.body\.classList\.add\('runescape-unlocked'\);\n/, '');

// loadOverrides boot branches
js = js.replace(/const normalMode = !sheetLoadFailed && !discoMode && !campingMode && !favsOnly;/,
  'const normalMode = !sheetLoadFailed && !favsOnly;');
js = js.replace(/} else if \(discoMode\) \{[\s\S]*?\} else if \(campingMode\) \{[\s\S]*?\}/, '');

// day item click - remove disco/camping branches
js = js.replace(/if \(campingStageMode && !hasCampingStage\(selectedDay\)\) return;\n/, '');
js = js.replace(/if \(discoMode\) \{[\s\S]*?return;\s*\}\n/, '');
js = js.replace(/if \(campingMode\) \{[\s\S]*?return;\s*\}\n/, '');

// isSwipeBlocked - remove profile check issues
js = js.replace(/!discoMode && !campingMode && !favsOnly/g, '!favsOnly');
js = js.replace(/return discoMode \? discoDayKey : campingMode \? campingDayKey : normalDayKey;/,
  'return normalDayKey;');

// getDiscoDay - remove if exists
js = js.replace(/function getDiscoDay\(\) \{[\s\S]*?\}\n\n/, '');

// getStageViewLabel
js = js.replace(/function getStageViewLabel\(next\) \{[\s\S]*?\}\n/,
`function getStageViewLabel(next) {
  const labels = { primary: 'Main stages', secondary: 'Secondary stages' };
  return labels[next] || 'Main stages';
}
`);

// bottom buttons idle - remove disco/camping checks
js = js.replace(/return !document\.body\.classList\.contains\('profile-mode'\)\s*&& !document\.body\.classList\.contains\('disco-mode'\)\s*&& !document\.body\.classList\.contains\('camping-mode'\);/,
  "return !document.body.classList.contains('profile-mode');");

// Disco act color references in normal mode - keep discoActColor if used for genre

// Write outputs
const srcDir = path.join(root, 'src');
const stylesDir = path.join(srcDir, 'styles');
const modulesDir = path.join(srcDir, 'modules');
fs.mkdirSync(stylesDir, { recursive: true });
fs.mkdirSync(modulesDir, { recursive: true });

fs.writeFileSync(path.join(stylesDir, 'app.css'), css.trim() + '\n');

// Split JS into app.js (main boot will import)
fs.writeFileSync(path.join(modulesDir, 'app-core.js'), js);

console.log('Migration extracted CSS and JS to src/');
console.log('CSS length:', css.length);
console.log('JS length:', js.length);
