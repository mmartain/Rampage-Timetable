
let accentColor = '#eb0028', accentBg = '#4b000e', accentBorder = '#eb0028';
const SUN_ACCENT_MAP = {
  '#f5d800': '#7a6500',
  '#ff6a00': '#b84a00',
  '#00a848': '#006b2e',
  '#aaa':    '#555555',
};
function getSunAccent(a) { return SUN_ACCENT_MAP[a] || a; }

const SHEET_ID_PROD = '1Vovax0HOLgo6ktqchvsajUFLejK-K_oq1tNC1s8E1VE';
const SHEET_ID_TEST = '1z1sxHzhJWjWlyTdjYGRn1UBuFW8GnauAjQbJeL-3V38';
const IS_LOCAL = ['localhost', '127.0.0.1', ''].includes(location.hostname)
  || /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(location.hostname);
const SHEET_ID = IS_LOCAL ? SHEET_ID_TEST : SHEET_ID_PROD;
let overrides = {};
let discoMode = false;
let campingMode = false;
let profileMode = false;
let favsOnly = false;
let discoHours = { start: 25, end: 29 };
let infoData = {};
let discoStyles = {};
let sheetLoadFailed = false;
let currentLang = 'fr';
let normalDayKey = 'jeudi';
let discoDayKey = 'vendredi';
let campingDayKey = 'jeudi';
let profileEnabledDays = ['jeudi', 'vendredi', 'samedi', 'dimanche'];
let profileCampingEnabled = true;
let profileDiscoEnabled = true;
let profileDancefloorEnabled = true;
let fsShowTitles = true;
let fsShowDay = true;
let fsShowDate = true;
let sunAutoMode = false;
let showRemainingOnly = false;
let fsRemainingOnly = false;
let showFavFillActs = true;
let secondaryStagesMode = false;
let campingStageMode = false;

const DAY_KEYS = ['jeudi', 'vendredi', 'samedi', 'dimanche'];
const FESTIVAL_DAYS = { 2: 'jeudi', 3: 'vendredi', 4: 'samedi', 5: 'dimanche' };
const DISCO_DAYS = { 3: 'vendredi', 4: 'samedi', 5: 'dimanche' };
const DISCO_NIGHT_DAYS = { 4: 'vendredi', 5: 'samedi', 6: 'dimanche' };
const DISCO_STAGE_META = {
  DiscoR: { cssClass: 'act-disco-r', color: '#e63939', labels: { fr: 'ROUGE', en: 'RED', zh: '红' } },
  DiscoB: { cssClass: 'act-disco-b', color: '#3399ff', labels: { fr: 'BLEU',  en: 'BLUE', zh: '蓝' } },
  DiscoG: { cssClass: 'act-disco-g', color: '#00c853', labels: { fr: 'VERT',  en: 'GREEN', zh: '绿' } },
};
const STAGE_ORDER = { mainstage: 0, storm: 1, dome: 2, church: 3, tunnel: 4, jungle: 5, mirror: 6, 'rave cave': 7, camping: 8 };
const makeStageList = stages => stages.map(([name, sub = '']) => ({ name, sub }));
const SECONDARY_STAGES_BY_DAY = {
  vendredi: makeStageList([
    ['Jungle', 'By Born on ROad | Mota'],
    ['Mirror', ''],
    ['Rave Cave', ''],
  ]),
  samedi: makeStageList([
    ['Jungle', 'Star Warz 20 YRS | Mush, Nice, Tasty'],
    ['Mirror', ''],
    ['Rave Cave', ''],
  ]),
  dimanche: makeStageList([
    ['Jungle', 'Etherwood presents:'],
    ['Mirror', 'I.5.2.Y'],
    ['Rave Cave', ''],
  ]),
};
const CAMPING_STAGES_BY_DAY = {
  vendredi: makeStageList([
    ['Camping', ''],
  ]),
  samedi: makeStageList([
    ['Camping', ''],
  ]),
  dimanche: makeStageList([
    ['Camping', ''],
  ]),
};
const CAMPING_STAGE_HOURS = { start: 11, end: 14 };
const stagePriority = name => STAGE_ORDER[String(name || '').toLowerCase()] ?? 99;
const FS_STAGE_ABBREV = { 'Mainstage': 'Main' };
const FAVS_KEY = 'favs';
const TIMELINE_GAP = 8;
const NOW_LINE_LEFT_PX = 55;
const NOW_LINE_RIGHT_PX = -15;
const REMAINING_DAY_CUTOFF_HOUR = 1;
const REMAINING_WINDOW_HOURS = 6;
const REMAINING_PAST_HOURS = 2;
const REMAINING_MIN_FUTURE_HOURS = 4;
const CROSS_SCENE_NOTICE_LEAD_HOURS = 0.5;
const MAX_UPCOMING_SUMMARY_MINUTES = 480;
const CANVAS_MARGIN = -100;
const $ = id => document.getElementById(id);

function getStoredArray(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return Array.isArray(value) ? value : [];
  } catch(e) {
    return [];
  }
}

function getFavs() {
  return getStoredArray(FAVS_KEY);
}

function saveFavs(favs) {
  localStorage.setItem(FAVS_KEY, JSON.stringify(favs));
}

function setThemeVars() {
  const sunAccent = getSunAccent(accentColor);
  [document.documentElement, document.body, $('scaler')].filter(Boolean).forEach(el => {
    el.style.setProperty('--accent', accentColor);
    el.style.setProperty('--accent-bg', accentBg);
    el.style.setProperty('--accent-border', accentBorder);
    el.style.setProperty('--sun-accent', sunAccent);
  });
}

function paintThemedButtons() {
  ['fs-btn', 'settings-btn', 'camping-btn', 'disco-btn', 'favs-btn', 'stage-view-btn'].forEach(id => {
    const btn = $(id);
    if (!btn) return;
    btn.style.removeProperty('background');
    btn.style.removeProperty('border-color');
    btn.style.removeProperty('border-width');
    btn.style.removeProperty('opacity');
    btn.style.removeProperty('filter');
    btn.style.removeProperty('box-shadow');
  });
  updateDiscoBtn();
  updateCampingBtn();
  updateFavsBtn();
  updateSettingsBtn();
  updateFullscreenBtn();
}

function syncColorOptions() {
  document.querySelectorAll('.color-option').forEach(opt => {
    const isCurrent = opt.dataset.accent === accentColor;
    opt.classList.toggle('current', isCurrent);
  });
}

function saveColorPreference(glow = '') {
  localStorage.setItem('color', JSON.stringify({
    accent: accentColor,
    bg: accentBg,
    border: accentBorder,
    glow,
  }));
}

const FESTIVAL_TIME_ZONE = 'Europe/Brussels';
const FESTIVAL_DTF = new Intl.DateTimeFormat('en-GB', {
  timeZone: FESTIVAL_TIME_ZONE,
  year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', second: '2-digit',
  hourCycle: 'h23'
});

function getFestivalParts(date = getNow()) {
  const parts = Object.fromEntries(
    FESTIVAL_DTF.formatToParts(date).filter(p => p.type !== 'literal').map(p => [p.type, p.value])
  );
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    monthIndex: Number(parts.month) - 1,
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
    second: Number(parts.second || 0)
  };
}

function getFestivalHour(cutoffHour = 0) {
  const p = getFestivalParts();
  let h = p.hour + p.minute / 60 + p.second / 3600;
  if (h < cutoffHour) h += 24;
  return h;
}

function getFestivalDateWithCutoff(cutoffHour = 0) {
  const p = getFestivalParts();
  const d = new Date(Date.UTC(p.year, p.monthIndex, p.day));
  if (p.hour < cutoffHour) d.setUTCDate(d.getUTCDate() - 1);
  return { year: d.getUTCFullYear(), monthIndex: d.getUTCMonth(), month: d.getUTCMonth() + 1, day: d.getUTCDate() };
}

function getJuly2026Day(cutoffHour, dayMap, fallback = null) {
  const d = getFestivalDateWithCutoff(cutoffHour);
  if (d.year !== 2026 || d.monthIndex !== 6) return fallback;
  return dayMap[d.day] || fallback;
}

function activeDateKey() {
  return 'date' + currentLang.charAt(0).toUpperCase() + currentLang.slice(1);
}

function getScheduleColumnCount(gridCols) {
  const count = (String(gridCols).match(/1fr/g) || []).length;
  return Math.max(1, Math.min(5, count));
}

const STAGE_TEXT_LAYOUT_BY_COLUMN_COUNT = Object.freeze({
  1: { name: 42, sub: 30, subHeight: 68 },
  2: { name: 34, sub: 25, subHeight: 56 },
  3: { name: 28, sub: 22, subHeight: 50 },
  4: { name: 24, sub: 20, subHeight: 45 },
  5: { name: 21, sub: 18, subHeight: 40 },
});

function getStageTextLayout(columnCount) {
  return STAGE_TEXT_LAYOUT_BY_COLUMN_COUNT[columnCount] || STAGE_TEXT_LAYOUT_BY_COLUMN_COUNT[5];
}

function setScheduleGrid(stageRow, tl, gridCols) {
  const columnCount = getScheduleColumnCount(gridCols);
  const stageText = getStageTextLayout(columnCount);
  stageRow.style.gridTemplateColumns = gridCols;
  stageRow.dataset.columnCount = String(columnCount);
  stageRow.style.setProperty('--stage-name-size', stageText.name + 'px');
  stageRow.style.setProperty('--stage-sub-size', stageText.sub + 'px');
  stageRow.style.setProperty('--stage-sub-height', stageText.subHeight + 'px');
  tl.style.gridTemplateColumns = gridCols;
  tl.dataset.columnCount = String(columnCount);
}

function getActTimeColumnCount(act) {
  return Math.max(1, Math.min(5, Number(act.closest('#tl')?.dataset.columnCount || 5)));
}

function getActTimeWidthRatio(columnCount) {
  const clamped = Math.max(1, Math.min(5, Number(columnCount) || 5));
  const progress = (clamped - 1) / 4;
  return ACT_TEXT_LAYOUT.timeWidthRatioMin + ((ACT_TEXT_LAYOUT.timeWidthRatioMax - ACT_TEXT_LAYOUT.timeWidthRatioMin) * progress);
}

function setTimelineWindow(tl, startHour, endHour) {
  tl.dataset.startHour = String(startHour);
  tl.dataset.endHour = String(endHour);
}

function clearTimelineWindow(tl) {
  delete tl.dataset.startHour;
  delete tl.dataset.endHour;
}
function clearRemainingTimelineState(tl) {
  delete tl.dataset.remainingTimeline;
  delete tl.dataset.remainingBaseStart;
  delete tl.dataset.remainingWindowHours;
}

function setRemainingTimelineState(tl, baseStart, windowHours) {
  tl.dataset.remainingTimeline = '1';
  tl.dataset.remainingBaseStart = String(baseStart);
  tl.dataset.remainingWindowHours = String(windowHours);
}

function resetTimelineScrollTransform() {
  document.querySelectorAll('#tl .stage-col, #tl .grid-line').forEach(el => {
    el.style.transform = '';
    el.style.willChange = '';
  });
  document.querySelectorAll('#axis .tick-label').forEach(el => {
    el.style.transform = '';
    el.style.willChange = '';
  });
}

function applyRemainingTimelineScroll(offsetPx) {
  const offset = Math.max(0, Math.round(offsetPx || 0));
  document.querySelectorAll('#tl .stage-col, #tl .grid-line').forEach(el => {
    el.style.transform = offset ? `translateY(-${offset}px)` : '';
    el.style.willChange = offset ? 'transform' : '';
  });
  document.querySelectorAll('#axis .tick-label').forEach(el => {
    el.style.transform = offset ? `translateY(calc(-50% - ${offset}px))` : '';
    el.style.willChange = offset ? 'transform' : '';
  });
}


function getTimelineWindow(tl, fallbackStart, fallbackEnd) {
  const startHour = parseFloat(tl.dataset.startHour);
  const endHour = parseFloat(tl.dataset.endHour);
  return {
    startHour: Number.isFinite(startHour) ? startHour : fallbackStart,
    endHour: Number.isFinite(endHour) ? endHour : fallbackEnd,
  };
}

function removeTimelineContent(tl) {
  tl.querySelectorAll('.stage-col, #now-line, .grid-line').forEach(el => el.remove());
}

function buildGridLinesFragment(startHour, endHour, scaleHours = endHour - startHour) {
  const frag = document.createDocumentFragment();
  const total = Math.max(0.01, scaleHours);
  for (let h = Math.floor(startHour) + 1; h < endHour; h++) {
    const line = document.createElement('div');
    line.className = 'grid-line';
    line.style.top = (((h - startHour) / total) * 100) + '%';
    frag.appendChild(line);
  }
  return frag;
}

function clearSchedule(stageRow, axis, tl) {
  stageRow.innerHTML = '';
  axis.innerHTML = '';
  removeTimelineContent(tl);
  clearTimelineWindow(tl);
  clearRemainingTimelineState(tl);
  resetTimelineScrollTransform();
}

const ACT_TEXT_LAYOUT = Object.freeze({
  top: 7,
  right: 7,
  bottom: 6,
  left: 8,
  nameMin: 12,

  nameMax: 70,
  nameWidthRatio: 0.95,
  nameHeightRatio: 0.90,
  nameLineHeight: 0.98,
  timeMin: 10,
  timeMax: 76,
  timeWidthRatioMin: 0.50,
  timeWidthRatioMax: 1.00,
  timeLineHeight: 1.02,
  timeMarginTop: 5,
});
let actTextLayoutRAF = 0;
let actTextLayoutsPrecomputing = false;
let actTextLayoutsPrecomputeRemaining = false;
let normalActTextLayoutsReady = false;
const ACT_TEXT_STYLE_CACHE = new Map();

function setImportantStyle(el, prop, value) {
  if (el) el.style.setProperty(prop, value, 'important');
}

function directChildWithClass(parent, className) {
  if (!parent) return null;
  return Array.from(parent.children).find(el => el.classList && el.classList.contains(className)) || null;
}

function prepareActTextBox(act, body, name) {
  setImportantStyle(act, 'display', 'block');
  setImportantStyle(act, 'overflow', 'hidden');

  setImportantStyle(body, 'position', 'absolute');
  setImportantStyle(body, 'top', ACT_TEXT_LAYOUT.top + 'px');
  setImportantStyle(body, 'left', ACT_TEXT_LAYOUT.left + 'px');
  setImportantStyle(body, 'right', ACT_TEXT_LAYOUT.right + 'px');
  setImportantStyle(body, 'bottom', ACT_TEXT_LAYOUT.bottom + 'px');
  setImportantStyle(body, 'width', 'auto');
  setImportantStyle(body, 'height', 'auto');
  setImportantStyle(body, 'display', 'block');
  setImportantStyle(body, 'overflow', 'hidden');
  setImportantStyle(body, 'transform', 'none');
  setImportantStyle(body, 'text-align', 'left');

  setImportantStyle(name, 'position', 'static');
  setImportantStyle(name, 'display', 'inline-block');
  setImportantStyle(name, 'vertical-align', 'top');
  setImportantStyle(name, 'margin', '0');
  setImportantStyle(name, 'padding', '0');
  setImportantStyle(name, 'transform', 'none');
  setImportantStyle(name, 'white-space', 'normal');
  setImportantStyle(name, 'word-break', 'normal');
  setImportantStyle(name, 'overflow-wrap', 'normal');
  setImportantStyle(name, 'text-align', 'left');
  name.style.lineHeight = ACT_TEXT_LAYOUT.nameLineHeight;
}

function prepareActTime(time) {
  if (!time) return;
  time.classList.remove('act-time-hidden');
  setImportantStyle(time, 'position', 'absolute');
  time.style.display = 'block';
  time.style.width = 'max-content';
  time.style.maxWidth = 'none';
  setImportantStyle(time, 'left', '0');
  setImportantStyle(time, 'bottom', '0');
  setImportantStyle(time, 'margin', '0');
  setImportantStyle(time, 'padding', '0');
  setImportantStyle(time, 'transform', 'none');
  setImportantStyle(time, 'white-space', 'nowrap');
  setImportantStyle(time, 'text-align', 'left');
  setImportantStyle(time, 'z-index', '2');
  time.style.lineHeight = ACT_TEXT_LAYOUT.timeLineHeight;
}

function nameFitsInBox(name, fontPx, maxWidthPx, maxHeightPx) {
  name.style.fontSize = fontPx + 'px';
  name.style.maxWidth = maxWidthPx + 'px';
  return Math.ceil(name.scrollWidth) <= Math.ceil(maxWidthPx) + 1
      && Math.ceil(name.scrollHeight) <= Math.ceil(maxHeightPx) + 1;
}

function computeNameFontSize(name, boxW, boxH) {
  const maxWidth = Math.max(1, Math.floor(boxW * ACT_TEXT_LAYOUT.nameWidthRatio));
  const maxHeight = Math.max(1, Math.floor(boxH * ACT_TEXT_LAYOUT.nameHeightRatio));
  let low = ACT_TEXT_LAYOUT.nameMin;
  let high = Math.max(low, Math.min(ACT_TEXT_LAYOUT.nameMax, boxH));
  let best = low;

  for (let i = 0; i < 8; i += 1) {
    const mid = (low + high) / 2;
    if (nameFitsInBox(name, mid, maxWidth, maxHeight)) {
      best = mid;
      low = mid;
    } else {
      high = mid;
    }
  }

  const finalSize = Math.max(ACT_TEXT_LAYOUT.nameMin, Math.floor(best * 10) / 10);
  name.style.fontSize = finalSize + 'px';
  name.style.maxWidth = maxWidth + 'px';
  return finalSize;
}

function timeFitsTargetWidth(time, fontPx, targetWidthPx) {
  time.style.fontSize = fontPx + 'px';
  return Math.ceil(time.scrollWidth) <= Math.ceil(targetWidthPx) + 1;
}

function computeTimeFontSize(time, boxW, boxH, columnCount) {
  const targetWidth = Math.max(1, Math.floor(boxW * getActTimeWidthRatio(columnCount)));
  let low = ACT_TEXT_LAYOUT.timeMin;
  let high = Math.max(low, Math.min(ACT_TEXT_LAYOUT.timeMax, boxH));
  let best = low;

  for (let i = 0; i < 9; i += 1) {
    const mid = (low + high) / 2;
    if (timeFitsTargetWidth(time, mid, targetWidth)) {
      best = mid;
      low = mid;
    } else {
      high = mid;
    }
  }

  const finalSize = Math.max(ACT_TEXT_LAYOUT.timeMin, Math.floor(best * 10) / 10);
  time.style.fontSize = finalSize + 'px';
  return finalSize;
}

function layoutOneActText(act) {
  const body = directChildWithClass(act, 'act-body');
  const name = directChildWithClass(body, 'act-name');
  if (!act || !body || !name) return;

  prepareActTextBox(act, body, name);

  const boxW = Math.floor(act.clientWidth - ACT_TEXT_LAYOUT.left - ACT_TEXT_LAYOUT.right);
  const boxH = Math.floor(act.clientHeight - ACT_TEXT_LAYOUT.top - ACT_TEXT_LAYOUT.bottom);
  if (boxW <= 0 || boxH <= 0) return;

  setImportantStyle(body, 'max-height', boxH + 'px');

  const time = directChildWithClass(body, 'act-time');
  if (time) {
    prepareActTime(time);
    computeTimeFontSize(time, boxW, boxH, getActTimeColumnCount(act));

    // L'heure est un repère visuel indépendant du nom.
    // En colonnes étroites, elle peut légèrement chevaucher le nom,
    // mais elle ne doit plus disparaître parce que le nom prend trop de hauteur.
    if (Math.ceil(time.scrollWidth) > boxW) {
      const currentSize = parseFloat(time.style.fontSize || '0');
      const ratio = boxW / Math.max(1, time.scrollWidth);
      const fittedSize = Math.max(6, Math.floor(currentSize * ratio * 10) / 10);
      time.style.fontSize = fittedSize + 'px';
    }
  }

  computeNameFontSize(name, boxW, boxH);
}

function updateActTextLayout() {
  document.querySelectorAll('.act').forEach(layoutOneActText);
}

function queueActTextLayoutIfMissing() {
  const hasMissingLayout = Array.from(document.querySelectorAll('.act')).some(act => {
    const body = directChildWithClass(act, 'act-body');
    const name = directChildWithClass(body, 'act-name');
    return name && !name.style.fontSize;
  });
  if (hasMissingLayout) queueActTextLayout();
}

function getActTextCacheKey(act, layoutKey = '') {
  return `${layoutKey || act.dataset.layoutKey || 'default'}|${act.id}`;
}

function cacheActTextStyles(layoutKey = '') {
  document.querySelectorAll('.act').forEach(act => {
    const body = directChildWithClass(act, 'act-body');
    const name = directChildWithClass(body, 'act-name');
    const time = directChildWithClass(body, 'act-time');
    if (!name) return;
    ACT_TEXT_STYLE_CACHE.set(getActTextCacheKey(act, layoutKey), {
      bodyMaxHeight: body ? body.style.maxHeight : '',
      nameFontSize: name.style.fontSize,
      nameMaxWidth: name.style.maxWidth,
      timeFontSize: time ? time.style.fontSize : '',
      timeHidden: time ? time.classList.contains('act-time-hidden') : false,
    });
  });
}

function applyCachedActTextStyle(act, layoutKey = '') {
  const cached = ACT_TEXT_STYLE_CACHE.get(getActTextCacheKey(act, layoutKey));
  if (!cached) return;
  const body = directChildWithClass(act, 'act-body');
  const name = directChildWithClass(body, 'act-name');
  const time = directChildWithClass(body, 'act-time');

  // Même base CSS que la passe complète utilisée après un fullscreen on/off,
  // mais sans refaire de mesure texte au changement de jour/scène.
  if (body && name) {
    prepareActTextBox(act, body, name);
    if (cached.bodyMaxHeight) setImportantStyle(body, 'max-height', cached.bodyMaxHeight);
    name.style.fontSize = cached.nameFontSize;
    name.style.maxWidth = cached.nameMaxWidth;
  }
  if (time) {
    prepareActTime(time);
    time.style.fontSize = cached.timeFontSize;
    time.classList.toggle('act-time-hidden', cached.timeHidden);
  }
}

function precomputeNormalDayTextLayouts(finalDayKey) {
  const savedSecondaryMode = secondaryStagesMode;
  const savedCampingStageMode = campingStageMode;
  const safeFinalDay = finalDayKey || normalDayKey || 'jeudi';
  cancelAnimationFrame(actTextLayoutRAF);
  actTextLayoutRAF = 0;
  actTextLayoutsPrecomputing = true;
  actTextLayoutsPrecomputeRemaining = false;
  ACT_TEXT_STYLE_CACHE.clear();

  DAY_KEYS.forEach(dayKey => {
    secondaryStagesMode = false;
    campingStageMode = false;
    renderDay(dayKey);
    updateActTextLayout();
    cacheActTextStyles(dayKey + '|primary');

    if (hasSecondaryStages(dayKey)) {
      secondaryStagesMode = true;
      campingStageMode = false;
      renderDay(dayKey);
      updateActTextLayout();
      cacheActTextStyles(dayKey + '|secondary');
    }

    if (hasCampingStage(dayKey)) {
      secondaryStagesMode = false;
      campingStageMode = true;
      renderDay(dayKey);
      updateActTextLayout();
      cacheActTextStyles(dayKey + '|camping');
    }
  });

  const currentDay = getCurrentFestivalDay();
  if (currentDay) {
    actTextLayoutsPrecomputeRemaining = true;

    secondaryStagesMode = false;
    campingStageMode = false;
    renderDay(currentDay);
    updateActTextLayout();
    cacheActTextStyles(currentDay + '|primary|remaining');

    secondaryStagesMode = true;
    campingStageMode = false;
    renderDay(currentDay);
    updateActTextLayout();
    cacheActTextStyles(currentDay + '|secondary|remaining');

    actTextLayoutsPrecomputeRemaining = false;
  }

  secondaryStagesMode = savedSecondaryMode;
  campingStageMode = savedCampingStageMode;
  actTextLayoutsPrecomputing = false;
  actTextLayoutsPrecomputeRemaining = false;
  normalActTextLayoutsReady = true;
  setActiveDay(safeFinalDay);
  renderDay(safeFinalDay);
}
function queueActTextLayout() {
  cancelAnimationFrame(actTextLayoutRAF);
  actTextLayoutRAF = requestAnimationFrame(() => requestAnimationFrame(updateActTextLayout));
}
function swapSchedule(stageRow, axis, tl, stageFrag, axisFrag, timelineFrag, startHour, endHour, options = {}) {
  stageRow.innerHTML = '';
  stageRow.appendChild(stageFrag);
  axis.innerHTML = '';
  axis.appendChild(axisFrag);
  removeTimelineContent(tl);
  resetTimelineScrollTransform();
  clearRemainingTimelineState(tl);
  if (options.remainingTimeline) {
    setRemainingTimelineState(tl, options.remainingBaseStart, options.remainingWindowHours);
  }
  if (startHour != null && endHour != null) {
    tl.appendChild(buildGridLinesFragment(startHour, endHour, options.scaleHours));
  }
  tl.appendChild(timelineFrag);
  updateStageHeaderSelectionState();
}

function buildStageHeader(name, sub = '', color = accentColor, subColor = '') {
  const d = document.createElement('div');
  d.className = 'stage-header';
  d.style.borderTopColor = color;
  d.dataset.nameColor = color;
  const subStyle = subColor ? ` style="color:${subColor}"` : '';
  d.innerHTML = `<div class="sh-name" data-full-name="${escapeHTML(name)}">${escapeHTML(name)}</div>${sub ? `<div class="sh-sub"${subStyle}>${escapeHTML(sub)}</div>` : ''}`;
  return d;
}

function updateStageHeaderSelectionState() {
  const stageRow = $('stage-row'), tl = $('tl');
  if (!stageRow || !tl) return;
  const headers = stageRow.querySelectorAll('.stage-header');
  const cols = tl.querySelectorAll('.stage-col');
  const isFS = document.body.classList.contains('is-fullscreen');
  const isSun = document.body.classList.contains('sun-mode');
  headers.forEach((header, i) => {
    const nameEl = header.querySelector('.sh-name');
    if (!nameEl) return;
    const fullName = nameEl.dataset.fullName || nameEl.textContent.trim();
    if (isFS) {
      nameEl.textContent = FS_STAGE_ABBREV[fullName] || fullName;
      nameEl.style.color = '#fff';
      nameEl.style.textShadow = '';
      header.classList.remove('sh-bar-glow');
      return;
    }
    nameEl.textContent = fullName;
    const col = cols[i];
    const hasTarget = col && col.querySelector('.act.selected');
    const selectedColor = isSun ? accentColor : '#fff';
    if (discoMode) {
      nameEl.style.color = header.dataset.nameColor || '';
      nameEl.style.textShadow = hasTarget ? '0 0 14px #fff, 0 0 6px #fff' : '';
    } else {
      nameEl.style.color = hasTarget ? selectedColor : (header.dataset.nameColor !== accentColor ? header.dataset.nameColor : '');
      nameEl.style.textShadow = '';
    }
    header.classList.toggle('sh-bar-glow', !!hasTarget);
  });
}

function buildStageHeaderFragment(stages, headerBuilder) {
  const frag = document.createDocumentFragment();
  frag.appendChild(document.createElement('div'));
  stages.forEach(stage => frag.appendChild(headerBuilder(stage)));
  return frag;
}

function buildAxisFragment(startHour, endHour, scaleHours = endHour - startHour) {
  const totalMin = Math.max(0.01, scaleHours) * 60;
  const frag = document.createDocumentFragment();
  for (let h = Math.ceil(startHour); h < endHour; h++) {
    const span = document.createElement('span');
    span.className = 'tick-label';
    span.textContent = fmtAxisH(h);
    span.style.top = (((h - startHour) * 60 / totalMin) * 100) + '%';
    frag.appendChild(span);
  }
  return frag;
}

function positionAct(div, start, end, startHour, endHour) {
  const totalMin = (endHour - startHour) * 60;
  const topPct = ((start - startHour) * 60 / totalMin) * 100;
  const heightPct = ((end - start) * 60 / totalMin) * 100;
  div.style.top = topPct + '%';
  div.style.height = `calc(${heightPct}% - ${TIMELINE_GAP}px)`;
}

function normalizeActIdPart(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'act';
}

function makeLegacyActId(dayKey, stageName, start) {
  return `${dayKey}-${stageName}-${start}`;
}

function makeActFavoriteId(dayKey, stageName, act) {
  const explicit = String(act && act.stableId || '').trim();
  if (!explicit) return makeLegacyActId(dayKey, stageName, act.start);
  return `fav-${dayKey}-${normalizeActIdPart(stageName)}-${normalizeActIdPart(explicit)}`;
}

function getActFavoriteAliases(dayKey, stageName, act) {
  return [...new Set([makeActFavoriteId(dayKey, stageName, act), makeLegacyActId(dayKey, stageName, act.start)].filter(Boolean))];
}

function isActFavorite(favs, dayKey, stageName, act) {
  return getActFavoriteAliases(dayKey, stageName, act).some(id => favs.includes(id));
}

function getActFavoriteAliasesFromElement(el) {
  return [...new Set([el.dataset.favId, el.dataset.legacyFavId, el.id].filter(Boolean))];
}

function getActsFromOverrides(dayKey, stageName, entries = Object.entries(overrides)) {
  return entries
    .reduce((list, [key, ov]) => {
      const [d, stage, startStr] = key.split('|');
      if (d !== dayKey || stage !== stageName) return list;
      const start = parseFloat(startStr);
      if (!Number.isFinite(start)) return list;
      if (!profileDancefloorEnabled && ov.genre === 'dancefloor') return list;
      list.push({ name: ov.name || '', start, end: typeof ov.end === 'number' ? ov.end : start + 1, genre: ov.genre || '', stableId: ov.stableId || '' });
      return list;
    }, [])
    .sort((a, b) => a.start - b.start);
}

function discoActColor(div) {
  if (div.classList.contains('act-disco-r')) return DISCO_STAGE_META.DiscoR.color;
  if (div.classList.contains('act-disco-b')) return DISCO_STAGE_META.DiscoB.color;
  if (div.classList.contains('act-disco-g')) return DISCO_STAGE_META.DiscoG.color;
  return null;
}

function isLockedRuneRaveAct(div) {
  return div.querySelector('.act-name')?.textContent.trim() === 'RuneScape Rave'
      && !document.body.classList.contains('runescape-active')
      && !document.body.classList.contains('runescape-unlocked');
}

function setNormalSelectedActStyle(div) {
  clearNormalSelectedActStyle(div);
  if (isLockedRuneRaveAct(div)) {
    div.style.setProperty('--accent', accentColor);
    div.style.setProperty('--accent-bg', accentBg);
    div.style.setProperty('--accent-border', accentBorder);
    div.style.setProperty('background', 'var(--selected-act-bg)', 'important');
    div.style.setProperty('border-left-color', '#fff');
    div.style.setProperty('border-top-color', 'var(--selected-act-top)', 'important');
    div.style.setProperty('box-shadow', 'var(--selected-act-shadow)', 'important');
    return;
  }
  div.style.setProperty('--accent', accentColor);
  div.style.setProperty('--accent-bg', accentBg);
  div.style.setProperty('--accent-border', accentBorder);
  if (div.classList.contains('act-now') && !document.body.classList.contains('is-fullscreen')) {
    div.style.setProperty('background', 'var(--current-act-bg)', 'important');
    div.style.setProperty('border-left-color', accentBorder, 'important');
    div.style.setProperty('border-top-color', 'var(--current-act-top)', 'important');
    div.style.setProperty('box-shadow', 'var(--current-act-shadow)', 'important');
    return;
  }
  const isFSSun = document.body.classList.contains('is-fullscreen') && document.body.classList.contains('sun-mode') && !document.body.classList.contains('disco-mode');
  div.style.setProperty('background', isFSSun ? '#ffffff' : 'var(--selected-act-bg)', 'important');
  div.style.setProperty('background-color', isFSSun ? '#ffffff' : 'var(--selected-act-bg)', 'important');
  div.style.setProperty('border-left-color', isFSSun ? '#000000' : accentBorder, 'important');
  div.style.setProperty('border-top-color', 'var(--selected-act-top)', 'important');
  div.style.setProperty('box-shadow', 'var(--selected-act-shadow)', 'important');
}

function clearNormalSelectedActStyle(div) {
  div.style.removeProperty('--accent-bg');
  div.style.removeProperty('--accent-border');
  div.style.removeProperty('--accent');
  div.style.removeProperty('background');
  div.style.removeProperty('background-color');
  div.style.removeProperty('border-left-color');
  div.style.removeProperty('border-top-color');
  div.style.removeProperty('box-shadow');
}

function applySavedFavorite(div, favs, mode = 'normal') {
  if (!getActFavoriteAliasesFromElement(div).some(id => favs.includes(id))) return;
  div.classList.add('selected');
  div.setAttribute('aria-pressed', 'true');
  if (mode === 'disco') return;

  setNormalSelectedActStyle(div);
}

function createActElement({ id, favId = id, legacyFavId = id, name, start, end, className = 'act', borderLeftColor = '', favs = [], favMode = 'normal', layoutKey = '', alwaysShowTime = false }) {
  const div = document.createElement('div');
  div.id = id;
  div.className = className;
  div.setAttribute('role', 'button');
  div.setAttribute('tabindex', '0');
  div.setAttribute('aria-pressed', 'false');
  div.dataset.start = start;
  div.dataset.end = end;
  div.dataset.rawName = String(name || '');
  div.dataset.favId = favId;
  if (legacyFavId && legacyFavId !== favId) div.dataset.legacyFavId = legacyFavId;
  if (layoutKey) div.dataset.layoutKey = layoutKey;
  if (borderLeftColor) div.style.borderLeftColor = borderLeftColor;
  const durationMinutes = (end - start) * 60;
  const showTimeInAct = alwaysShowTime || durationMinutes >= 59;
  const timeHtml = showTimeInAct ? `<div class="act-time">${fmtActTimeRange(start, end)}</div>` : '';
  div.innerHTML = `<div class="act-body">${createActNameHTML(name)}${timeHtml}</div>`;
  applySavedFavorite(div, favs, favMode);
  applyCachedActTextStyle(div, layoutKey);
  addActBehavior(div);
  return div;
}

function parseCSVRow(row) {
  const result = [];
  let cur = '';
  let inQ = false;
  for (let i = 0; i < row.length; i++) {
    const ch = row[i];
    if (ch === '"') { inQ = !inQ; }
    else if ((ch === ',' || ch === '\t') && !inQ) { result.push(cur.trim()); cur = ''; }
    else { cur += ch; }
  }
  result.push(cur.trim());
  return result;
}

function parseOverridesFromCsv(text) {
  const parsed = {};
  const parsedInfo = {};
  const parsedStyles = {};
  const rows = (text || '').trim().split(/\r?\n/).map(parseCSVRow);
  if (!rows.length) return { overrides: parsed, infoData: parsedInfo, discoStyles: parsedStyles };

  const dayNames = ['jeudi', 'vendredi', 'samedi', 'dimanche'];
  const normalizeDay = value => (value || '').trim().toLowerCase();

  rows.forEach(row => {
    const values = row.map(v => (v || '').trim());
    if (!values.some(v => v)) return;

    let index = 0;
    while (index < values.length) {
      const rawValue = values[index] || '';
      const day = normalizeDay(rawValue);

      if (dayNames.includes(day)) {
        const stage = values[index + 1] || '';
        const start = values[index + 2] || '';
        const end = values[index + 3] || '';
        const name = values[index + 4] || '';

        if (day && stage && start) {
          const stageNorm = stage.toLowerCase();
          if (stageNorm === 'info') {
            let s = parseTimeStr(start), e = parseTimeStr(end);
            if (!isNaN(s)) {
              if (s < 6) s += 24;
              if (!isNaN(e) && e < 6) e += 24;
              if (!parsedInfo[day]) parsedInfo[day] = [];
              parsedInfo[day].push({ label: name || '', start: s, end: isNaN(e) ? null : e });
            }
          } else if ((stageNorm === 'discor' || stageNorm === 'discob' || stageNorm === 'discog') && start.toLowerCase() === 'genre') {
            const canonical = stageNorm === 'discor' ? 'DiscoR' : stageNorm === 'discob' ? 'DiscoB' : 'DiscoG';
            if (!parsedStyles[day]) parsedStyles[day] = {};
            parsedStyles[day][canonical] = values.slice(index + 3).find(v => v !== '') || '';
          } else {
            const startNum = parseTimeStr(start);
            const endNum = parseTimeStr(end) || null;
            if (!isNaN(startNum)) {
              const key = `${day}|${stage}|${startNum}`;
              const rawStableId = (values[index + 5] || '').trim();
              const hasExplicitStableId = /^id[:=]/i.test(rawStableId);
              const stableId = hasExplicitStableId ? rawStableId.replace(/^id[:=]\s*/i, '').trim() : '';
              const genre = ((values[index + 6] || '') || (hasExplicitStableId ? '' : rawStableId)).toLowerCase().trim();
              parsed[key] = { name: name || '', end: isNaN(endNum) ? null : endNum, genre, stableId };
            }
          }
        }

        index += 5;
        while (index < values.length && !(values[index] || '').trim()) {
          index += 1;
        }
        continue;
      }

      index += 1;
    }
  });

  return { overrides: parsed, infoData: parsedInfo, discoStyles: parsedStyles };
}

const CSV_CACHE_KEY = 'sheet_csv';
const CSV_CACHE_UPDATED_AT_KEY = 'sheet_csv_updated_at';
let sheetStatusKind = '';
let sheetStatusExtra = '';
let sheetRefreshBusy = false;

function getSheetStatusCopy(kind) {
  const copy = {
    online:  { fr: 'Données à jour', en: 'Data updated', zh: '数据已更新' },
    updated: { fr: 'Données mises à jour', en: 'Data refreshed', zh: '数据已刷新' },
    cached:  { fr: 'Version locale chargée', en: 'Local version loaded', zh: '已加载本地版本' },
    offline: { fr: 'Hors ligne : version locale', en: 'Offline: local version', zh: '离线：本地版本' },
    updating:{ fr: 'Mise à jour…', en: 'Refreshing…', zh: '正在刷新…' },
    error:   { fr: 'Aucune version locale', en: 'No local version', zh: '无本地版本' },
  };
  return (copy[kind] && (copy[kind][currentLang] || copy[kind].fr)) || '';
}

function formatSheetCacheTime(ts = localStorage.getItem(CSV_CACHE_UPDATED_AT_KEY)) {
  const time = Number(ts || 0);
  if (!time) return '';
  const locale = currentLang === 'en' ? 'en-GB' : currentLang === 'zh' ? 'zh-CN' : 'fr-FR';
  try {
    return new Date(time).toLocaleString(locale, { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  } catch(e) {
    return '';
  }
}

function setSheetRefreshBusy(busy) {
  sheetRefreshBusy = Boolean(busy);
  document.querySelectorAll('#sheet-refresh-btn, [data-profile-action="sheet-refresh"]').forEach(btn => {
    btn.setAttribute('aria-busy', sheetRefreshBusy ? 'true' : 'false');
    btn.toggleAttribute('disabled', sheetRefreshBusy);
    btn.classList.toggle('active', !sheetRefreshBusy);
    btn.classList.toggle('feat-disabled', sheetRefreshBusy);
  });
}

function setSheetStatus(kind = sheetStatusKind, extra = sheetStatusExtra) {
  sheetStatusKind = kind || sheetStatusKind;
  sheetStatusExtra = extra || '';
  const el = $('sheet-status');
  if (!el) return;
  const label = getSheetStatusCopy(sheetStatusKind);
  const stamp = formatSheetCacheTime();
  const details = sheetStatusExtra || stamp;
  el.textContent = [label, details].filter(Boolean).join(' · ');
}

function getCachedSheetCsv() {
  try { return localStorage.getItem(CSV_CACHE_KEY) || ''; } catch(e) { return ''; }
}

function saveSheetCsv(text) {
  localStorage.setItem(CSV_CACHE_KEY, text);
  localStorage.setItem(CSV_CACHE_UPDATED_AT_KEY, String(Date.now()));
}

async function fetchSheetCsv() {
  const ctrl = new AbortController();
  const tid = setTimeout(() => ctrl.abort(), 5000);
  try {
    const res = await fetch(`https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv`, { signal: ctrl.signal });
    clearTimeout(tid);
    if (!res.ok) throw new Error(res.status);
    return await res.text();
  } catch(e) {
    clearTimeout(tid);
    return null;
  }
}

function applySheetCsv(text) {
  ({ overrides, infoData, discoStyles } = parseOverridesFromCsv(text));
  ACT_TEXT_STYLE_CACHE.clear();
  normalActTextLayoutsReady = false;
  sheetLoadFailed = false;
}

function rerenderSchedule() {
  if (profileMode) {
    renderProfile();
  } else if (discoMode) {
    renderDisco(discoDayKey);
    queueActTextLayout();
  } else if (campingMode) {
    renderCamping(campingDayKey);
  } else if (favsOnly) {
    renderFavsMode(normalDayKey);
  } else if (!normalActTextLayoutsReady) {
    precomputeNormalDayTextLayouts(normalDayKey);
  } else {
    renderDay(normalDayKey);
  }
  updateNowLine();
  updateCampingBtn();
}

async function refreshSheetInBackground(cachedText) {
  const text = await fetchSheetCsv();
  if (!text) {
    setSheetStatus('offline');
    return;
  }
  if (text === cachedText) {
    setSheetStatus('online');
    return;
  }
  saveSheetCsv(text);
  applySheetCsv(text);
  setSheetStatus('updated');
  rerenderSchedule();
}

async function refreshSheetManually() {
  setSheetRefreshBusy(true);
  setSheetStatus('updating');
  const cached = getCachedSheetCsv();
  const text = await fetchSheetCsv();
  setSheetRefreshBusy(false);

  if (text) {
    saveSheetCsv(text);
    applySheetCsv(text);
    setSheetStatus(text === cached ? 'online' : 'updated');
    rerenderSchedule();
    return true;
  }

  if (cached) {
    try {
      applySheetCsv(cached);
      setSheetStatus('offline');
      rerenderSchedule();
      return true;
    } catch(e) {}
  }

  sheetLoadFailed = true;
  setSheetStatus('error');
  if (profileMode) renderProfile();
  else renderSheetError();
  return false;
}

async function loadOverrides() {
  if (!SHEET_ID) return;

  const cached = getCachedSheetCsv();
  if (cached) {
    try {
      applySheetCsv(cached);
      setSheetStatus('cached');
      refreshSheetInBackground(cached);
      return;
    } catch(e) {
      localStorage.removeItem(CSV_CACHE_KEY);
      localStorage.removeItem(CSV_CACHE_UPDATED_AT_KEY);
    }
  }

  const text = await fetchSheetCsv();
  if (!text) { sheetLoadFailed = true; setSheetStatus('error'); return; }
  saveSheetCsv(text);
  applySheetCsv(text);
  setSheetStatus('online');
}

const easter = (opacity, accent, bg, border, glow, opts = {}) => ({ opacity, accent, bg, border, glow, ...opts });
const EASTER_EVENTS = {
  shrek: easter('0.50', '#3d9e3d', '#0d1f0d', '#3d9e3d', 'rgba(61,158,61,0.4)', { comic: true, triggers: [{h:0, m:0, endH:0, endM:1}] }),
  alien: easter('0.70', '#9200e0', '#260045', '#9200e0', 'rgba(146,0,224,0.4)', { comic: true, triggers: [{h:4, m:20, endH:4, endM:21},{h:16,m:20,endH:16,endM:21}] }),
  fr: easter('0.80', '#0055a4', '#001833', '#0055a4', 'rgba(0,85,164,0.4)', { comic: true, triggers: [] }),
  en: easter('0.70', '#cf142b', '#3d0008', '#cf142b', 'rgba(207,20,43,0.4)', { comic: true, triggers: [{h:2, m:0, endH:2, endM:1},{h:3, m:0, endH:3, endM:1},{h:4, m:0, endH:4, endM:1}] }),
  zh: easter('0.70', '#eb0028', '#4b000e', '#eb0028', 'rgba(235,0,40,0.4)', { comic: true, triggers: [] }),
  disco: easter('0.24', '#ffffff', '#1a1a1a', '#ffffff', 'rgba(255,255,255,0.15)', { blackBg: true, activeDates: ['2026-07-04','2026-07-05','2026-07-06'], triggers: [] }),
  runescape: easter('0.80', '#c8a94e', '#3a2800', '#c8a94e', 'rgba(200,169,78,0.4)', { comic: true, activeDates: ['2026-07-03'], triggers: [{h:16, m:0, endH:17, endM:0}] }),
};

function makeDay(startHour, endHour, stages) {
  return {
    gridCols: `60px ${'1fr '.repeat(stages.length).trim()}`,
    startHour,
    endHour,
    stages: makeStageList(stages)
  };
}

const DAYS = {
  jeudi: makeDay(18, 25, [
    ['Dome', 'By Radar'],
    ['Church'],
    ['Tunnel', 'Dubstep NL × Space Invaderz'],
  ]),
  vendredi: makeDay(14, 25, [
    ['Mainstage', 'By MHITR'],
    ['Storm', 'By DMZ'],
    ['Dome', 'By RUN'],
    ['Church', 'By Vision'],
    ['Tunnel', 'By Vissa'],
  ]),
  samedi: makeDay(14, 25, [
    ['Mainstage', 'By Rampage Recordings'],
    ['Storm', 'By Blacklist'],
    ['Dome', 'By Crucast'],
    ['Church', 'World Of Drum&Bass 35Y'],
    ['Tunnel', 'By Hardstyle Daily'],
  ]),
  dimanche: makeDay(14, 25, [
    ['Mainstage', 'By Monstercat'],
    ['Storm', 'By Dubstep FBI'],
    ['Dome', 'By Club Mozey'],
    ['Church', 'By Ampere Invites'],
    ['Tunnel', 'By Unfaced'],
  ]),
};

function getPrimaryStages(dayKey) {
  return (DAYS[dayKey] && DAYS[dayKey].stages) || [];
}

function hasSecondaryStages(dayKey) {
  return dayKey !== 'jeudi';
}

function hasCampingStage(dayKey) {
  return dayKey !== 'jeudi';
}

function getSecondaryStages(dayKey) {
  return hasSecondaryStages(dayKey) ? (SECONDARY_STAGES_BY_DAY[dayKey] || []) : [];
}

function getCampingStages(dayKey) {
  return hasCampingStage(dayKey) ? (CAMPING_STAGES_BY_DAY[dayKey] || []) : [];
}

function getNormalViewStages(dayKey) {
  if (campingStageMode) return getCampingStages(dayKey);
  return secondaryStagesMode ? getSecondaryStages(dayKey) : getPrimaryStages(dayKey);
}

function getFavoriteCandidateStages(dayKey) {
  const seen = new Set();
  return [...getPrimaryStages(dayKey), ...getSecondaryStages(dayKey)]
    .filter(stage => {
      const key = String(stage.name || '').toLowerCase();
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => stagePriority(a.name) - stagePriority(b.name));
}

function getStageViewCycleStages(dayKey) {
  const stages = ['primary'];
  if (hasSecondaryStages(dayKey)) stages.push('secondary');
  if (profileCampingEnabled && hasCampingStage(dayKey)) stages.push('camping');
  return stages;
}

function getCurrentStageViewState() {
  return campingStageMode ? 'camping' : secondaryStagesMode ? 'secondary' : 'primary';
}

function setStageViewState(state) {
  secondaryStagesMode = state === 'secondary';
  campingStageMode = state === 'camping';
}

function getStageGroup(stageName) {
  const norm = String(stageName || '').trim().toLowerCase();
  if (!norm) return null;
  if (norm === 'discor' || norm === 'discob' || norm === 'discog') return 'disco';
  if (norm === 'camping') return profileCampingEnabled ? 'camping' : null;
  const isSecondary = Object.values(SECONDARY_STAGES_BY_DAY)
    .some(stages => stages.some(stage => stage.name.toLowerCase() === norm));
  if (isSecondary) return 'secondary';
  if (norm === 'info') return 'info';
  return 'primary';
}

function getVisibleStageGroup() {
  if (discoMode) return 'disco';
  const plainScheduleView = !profileMode && !discoMode && !campingMode && !favsOnly;
  if (campingStageMode && plainScheduleView) return 'camping';
  if (secondaryStagesMode && plainScheduleView) return 'secondary';
  if (plainScheduleView) return 'primary';
  return 'other';
}

function isActInCrossSceneNoticeWindow(act, hour) {
  const start = Number(act && act.start);
  const end = Number(act && act.end);
  return Number.isFinite(start) && Number.isFinite(end)
    && hour >= start - CROSS_SCENE_NOTICE_LEAD_HOURS
    && hour < end;
}

function getSelectedNormalNoticeGroups(favs = getFavs(), overrideEntries = Object.entries(overrides)) {
  const groups = new Set();
  const dayKey = getCurrentFestivalDay();
  if (!dayKey) return groups;

  const hour = getFestivalHour(2);
  const stages = [
    ...getPrimaryStages(dayKey),
    ...getSecondaryStages(dayKey),
    ...(profileCampingEnabled ? getCampingStages(dayKey) : []),
  ];

  stages.forEach(stage => {
    const group = getStageGroup(stage.name);
    if (!group || group === 'info') return;
    const hasSelectedInWindow = getActsFromOverrides(dayKey, stage.name, overrideEntries)
      .some(act => isActFavorite(favs, dayKey, stage.name, act) && isActInCrossSceneNoticeWindow(act, hour));
    if (hasSelectedInWindow) groups.add(group);
  });

  return groups;
}

function getSelectedDiscoNoticeGroups(favs = getFavs()) {
  const groups = new Set();
  if (!profileCampingEnabled || !profileDiscoEnabled) return groups;

  const state = getCurrentDiscoState();
  if (!state.active || !state.dayKey) return groups;

  const p = getFestivalParts();
  let hour = p.hour + p.minute / 60 + p.second / 3600;
  if (hour < 6) hour += 24;

  const acts = getDiscoActs(state.dayKey);
  const hasSelectedInWindow = Object.entries(DISCO_STAGE_META).some(([stageName]) =>
    (acts[stageName] || []).some(act =>
      isActFavorite(favs, state.dayKey, stageName, act) && isActInCrossSceneNoticeWindow(act, hour)
    )
  );

  if (hasSelectedInWindow) groups.add('disco');
  return groups;
}

function getSelectedCrossSceneNoticeGroups(favs = getFavs()) {
  return new Set([
    ...getSelectedNormalNoticeGroups(favs),
    ...getSelectedDiscoNoticeGroups(favs),
  ]);
}

function setCrossSceneIndicator(btn, active) {
  if (!btn) return;
  const isVisible = btn.style.visibility !== 'hidden';
  btn.classList.toggle('cross-scene-indicator', Boolean(active && isVisible));
}

function updateCrossSceneIndicators() {
  const groups = getSelectedCrossSceneNoticeGroups();
  const currentGroup = getVisibleStageGroup();
  const hasOtherScheduleGroup = ['primary', 'secondary', 'camping']
    .some(group => groups.has(group) && group !== currentGroup);
  const hasOtherDiscoGroup = groups.has('disco') && currentGroup !== 'disco';

  setCrossSceneIndicator($('stage-view-btn'), hasOtherScheduleGroup);
  setCrossSceneIndicator($('disco-btn'), hasOtherDiscoGroup);
}

function makeStageGridCols(stages) {
  return `60px ${'1fr '.repeat(Math.max(stages.length, 1)).trim()}`;
}

function getTimeZoneOffsetMinutes(date, timeZone) {
  const parts = getFestivalParts(date);
  const asUTC = Date.UTC(parts.year, parts.monthIndex, parts.day, parts.hour, parts.minute, parts.second);
  return (asUTC - date.getTime()) / 60000;
}

function zonedTimeToDate(year, month, day, hour, minute, second, timeZone) {
  const utcGuess = new Date(Date.UTC(year, month - 1, day, hour, minute, second));
  const offset1 = getTimeZoneOffsetMinutes(utcGuess, timeZone);
  const adjusted = new Date(utcGuess.getTime() - offset1 * 60000);
  const offset2 = getTimeZoneOffsetMinutes(adjusted, timeZone);
  return new Date(utcGuess.getTime() - offset2 * 60000);
}

function parseFestivalDateParam(raw) {
  const value = String(raw || '').trim();
  if (/[zZ]|[+-]\d{2}:?\d{2}$/.test(value)) {
    const d = new Date(value);
    return isNaN(d) ? null : d;
  }
  const m = value.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{1,2})(?::(\d{2}))?(?::(\d{2}))?)?$/);
  if (!m) {
    const d = new Date(value);
    return isNaN(d) ? null : d;
  }
  const [, y, mo, d, h = '0', mi = '0', se = '0'] = m;
  return zonedTimeToDate(Number(y), Number(mo), Number(d), Number(h), Number(mi), Number(se), FESTIVAL_TIME_ZONE);
}

function getUrlTimeParam() {
  const readSearchParams = value => {
    try {
      const p = new URLSearchParams(value || '');
      return p.get('t') || p.get('time') || '';
    } catch(e) {
      return '';
    }
  };

  let value = readSearchParams(location.search);
  if (value) return value;

  const hash = String(location.hash || '');
  if (hash) {
    const hashQuery = hash.includes('?') ? hash.slice(hash.indexOf('?')) : hash.replace(/^#/, '?');
    value = readSearchParams(hashQuery);
    if (value) return value;
  }

  const hrefMatch = String(location.href || '').match(/[?#&]t=([^&#]+)/);
  if (hrefMatch) {
    try { return decodeURIComponent(hrefMatch[1].replace(/\+/g, ' ')); } catch(e) { return hrefMatch[1]; }
  }

  return '';
}

function getNowOverrideFromUrl() {
  const raw = getUrlTimeParam();
  if (!raw) return null;
  return parseFestivalDateParam(raw);
}

function getNow() {
  const override = getNowOverrideFromUrl();
  return override || new Date();
}

function ymd(date = getNow()) {
  const p = getFestivalParts(date);
  return `${p.year}-${String(p.month).padStart(2,'0')}-${String(p.day).padStart(2,'0')}`;
}

function parseTimeStr(str) {
  const s = (str || '').trim().replace(',', '.');
  if (s.includes(':')) {
    const [hPart, mPart] = s.split(':');
    const h = parseInt(hPart, 10), m = parseInt(mPart, 10);
    if (!isNaN(h) && !isNaN(m)) return h + m / 60;
  }
  return parseFloat(s);
}

function formatHourParts(h) {
  const hh = h >= 24 ? h - 24 : h;
  const totalMin = Math.round((h % 1) * 60);
  return {
    hour: String(Math.floor(hh)).padStart(2, '0'),
    minute: String(totalMin).padStart(2, '0'),
  };
}

function fmtAxisH(h) {
  const { hour, minute } = formatHourParts(h);
  return `${hour}:${minute}`;
}

function fmtActH(h) {
  const { hour, minute } = formatHourParts(h);
  return `${hour} : ${minute}`;
}

function fmtActTimeRange(start, end) {
  return `${fmtActH(start)} - ${fmtActH(end)}`;
}

function setNowSummary(html = '') {
  const el = $('now-summary');
  if (!el) return;
  const hasContent = Boolean(html);
  el.innerHTML = hasContent ? html : '';
  el.classList.toggle('has-content', hasContent);
}

function getRenderedActs() {
  return [...document.querySelectorAll('#tl .act')].filter(act => act.offsetParent !== null);
}

function getActSummaryMeta(act) {
  if (!act) return null;
  const name = formatActDisplayName(act.dataset.rawName || act.querySelector('.act-name')?.textContent || '').trim();
  const start = parseFloat(act.dataset.start);
  const end = parseFloat(act.dataset.end);
  if (!name || !Number.isFinite(start) || !Number.isFinite(end)) return null;
  const col = act.closest('.stage-col');
  const cols = [...document.querySelectorAll('#tl .stage-col')];
  const idx = Math.max(0, cols.indexOf(col));
  const header = document.querySelectorAll('#stage-row .stage-header')[idx];
  const stage = header?.querySelector('.sh-name')?.textContent.trim() || '';
  return { name, stage, start, end };
}

function fmtSummaryDuration(minutes) {
  if (minutes < 60) return `${minutes}MIN`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}H` : `${h}H${String(m).padStart(2, '0')}`;
}

function fmtSummaryDurationZh(minutes) {
  if (minutes < 60) return `${minutes}分钟`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}小时` : `${h}小时${m}分`;
}

function getNowSummaryCopy(mode, minutes = null) {
  const dur = minutes === null ? null : fmtSummaryDuration(minutes);
  const durZh = minutes === null ? null : fmtSummaryDurationZh(minutes);
  const copy = {
    fr: {
      now: 'EN CE MOMENT',
      next: dur === null ? 'À VENIR' : `DANS ${dur}`,
    },
    en: {
      now: 'PLAYING NOW',
      next: dur === null ? 'UP NEXT' : `IN ${dur}`,
    },
    zh: {
      now: '正在演出',
      next: durZh === null ? '即将开始' : `${durZh}后`,
    },
  };
  const langCopy = copy[currentLang] || copy.en;
  return mode === 'now' ? langCopy.now : langCopy.next;
}

function formatNowSummaryRow(meta) {
  return `<span class="summary-stage">${escapeHTML(meta.stage)}</span> - ${escapeHTML(meta.name)}`;
}

function renderNowSummarySection(kicker, acts) {
  const rows = acts.map(meta => `<span class="summary-row">${formatNowSummaryRow(meta)}</span>`).join('');
  return `<div class="summary-section"><span class="summary-kicker">${kicker}</span><div class="summary-list">${rows}</div></div>`;
}

function getUpcomingSummaryGroups(metas, hour, budget) {
  if (budget < 2) return [];
  const selected = metas
    .filter(meta => meta && meta.name && meta.start > hour && meta.selected)
    .sort((a, b) => a.start - b.start || stagePriority(a.stage) - stagePriority(b.stage));
  if (!selected.length) return [];

  const groups = [];
  let i = 0;
  while (i < selected.length) {
    const t = selected[i].start;
    const minutes = Math.max(0, Math.ceil((t - hour) * 60 - 1e-6));
    if (minutes > MAX_UPCOMING_SUMMARY_MINUTES) break;
    const groupActs = [];
    while (i < selected.length && Math.abs(selected[i].start - t) < 0.0001) groupActs.push(selected[i++]);
    groups.push({ minutes, acts: groupActs.sort((a, b) => stagePriority(a.stage) - stagePriority(b.stage) || a.name.localeCompare(b.name)) });
  }
  if (!groups.length) return [];

  const result = [];
  let remaining = budget;
  for (const group of groups) {
    if (remaining < 2) break;
    const actsToShow = group.acts.slice(0, remaining - 1);
    result.push({ kicker: getNowSummaryCopy('next', group.minutes), acts: actsToShow });
    remaining -= 1 + actsToShow.length;
  }
  return result;
}

function isNowSummaryStage(stageName) {
  const norm = String(stageName || '').trim().toLowerCase();
  if (!norm || norm === 'info') return false;
  if (norm === 'discor' || norm === 'discob' || norm === 'discog') return false;
  if (norm === 'camping' && !profileCampingEnabled) return false;
  return true;
}

function getNowSummaryStageNames(dayKey, entries = Object.entries(overrides)) {
  return [...new Set(entries
    .map(([key]) => {
      const [day, stage] = key.split('|');
      return day === dayKey && isNowSummaryStage(stage) ? stage : '';
    })
    .filter(Boolean))]
    .sort((a, b) => stagePriority(a) - stagePriority(b) || a.localeCompare(b));
}

function getNowSummaryState() {
  const dayKey = getCurrentFestivalDay();
  const day = DAYS[dayKey];
  if (!dayKey || !day) return null;

  const hour = getFestivalHour(2);
  if (!Number.isFinite(hour) || hour >= day.endHour) return null;

  return { dayKey, hour };
}

function getNowSummaryMetas(dayKey) {
  if (!dayKey) return [];

  const favs = getFavs();
  if (!favs.length) return [];

  const entries = Object.entries(overrides);
  const metas = [];
  const seen = new Set();

  getNowSummaryStageNames(dayKey, entries).forEach(stageName => {
    getActsFromOverrides(dayKey, stageName, entries).forEach(act => {
      if (!isActFavorite(favs, dayKey, stageName, act)) return;

      const meta = {
        name: formatActDisplayName(act.name).trim(),
        stage: stageName,
        start: act.start,
        end: act.end,
        selected: true,
      };
      if (!meta.name || !Number.isFinite(meta.start) || !Number.isFinite(meta.end)) return;

      const key = `${meta.stage}|${meta.start}|${meta.end}|${meta.name}`;
      if (seen.has(key)) return;
      seen.add(key);
      metas.push(meta);
    });
  });

  return metas;
}

function updateNowSummary(hour = null) {
  if (document.body.classList.contains('is-fullscreen') || sheetLoadFailed) {
    setNowSummary('');
    return;
  }

  const summaryState = getNowSummaryState();
  if (!summaryState) {
    setNowSummary('');
    return;
  }

  const { dayKey, hour: summaryHour } = summaryState;
  const MAX_LINES = 6;
  const metas = getNowSummaryMetas(dayKey);
  if (!metas.length) {
    setNowSummary('');
    return;
  }

  const visibleNowActs = metas
    .filter(meta => summaryHour >= meta.start && summaryHour < meta.end)
    .sort((a, b) => stagePriority(a.stage) - stagePriority(b.stage) || a.name.localeCompare(b.name));

  let html = '';
  let remaining = MAX_LINES;

  if (visibleNowActs.length) {
    const nowSlice = visibleNowActs.slice(0, remaining - 1);
    html += renderNowSummarySection(getNowSummaryCopy('now'), nowSlice);
    remaining -= 1 + nowSlice.length;
  }

  for (const group of getUpcomingSummaryGroups(metas, summaryHour, remaining)) {
    html += renderNowSummarySection(group.kicker, group.acts);
  }

  setNowSummary(html);
}

function hasNormalFavForDay(dayKey, favs) {
  const stages = getFavoriteCandidateStages(dayKey);
  if (!stages.length) return false;
  const validStages = new Set(stages.map(stage => stage.name));
  const prefix = `${dayKey}-`;
  if (favs.some(id => {
    if (!id.startsWith(prefix)) return false;
    const rest = id.slice(prefix.length);
    const stage = rest.slice(0, rest.lastIndexOf('-'));
    return validStages.has(stage);
  })) return true;
  return getFavStageActs(dayKey, favs).length > 0;
}

function getFavLayoutSignature(dayKey, favs) {
  const day = DAYS[dayKey];
  const stageActs = getFavStageActs(dayKey, favs);
  if (!day || !stageActs.length) return 'empty';

  const allActs = stageActs.flatMap(stage => stage.acts);
  let startHour = Math.floor(Math.min(...allActs.map(act => act.start)));
  let endHour = Math.ceil(Math.max(...allActs.map(act => act.end)));
  const MIN_RANGE = 2;

  if (endHour - startHour < MIN_RANGE) {
    const pad = (MIN_RANGE - (endHour - startHour)) / 2;
    startHour = Math.max(day.startHour, Math.floor(startHour - pad));
    endHour = Math.min(day.endHour, Math.ceil(endHour + pad));
  }

  return `${stageActs.map(stage => stage.stage.name).join('|')}@${startHour}-${endHour}`;
}

function syncFavoriteControlsAfterActToggle(oldFavs, newFavs, dayKey) {
  const oldHasFavs = oldFavs.length > 0;
  const newHasFavs = newFavs.length > 0;
  const oldDayVisible = hasNormalFavForDay(dayKey, oldFavs);
  const newDayVisible = hasNormalFavForDay(dayKey, newFavs);

  if (oldHasFavs !== newHasFavs) {
    updateResetBtn();
    return;
  }

  if (!discoMode && !campingMode && oldDayVisible !== newDayVisible) updateFavsBtn();
}

function syncFavoritesModeAfterActToggle(div, selected, oldFavs, newFavs) {
  if (!favsOnly || discoMode || campingMode) return;

  const oldSignature = getFavLayoutSignature(normalDayKey, oldFavs);
  const newSignature = getFavLayoutSignature(normalDayKey, newFavs);
  if (oldSignature !== newSignature || selected) {
    renderFavsMode(normalDayKey);
    return;
  }

  div.remove();
  updateStageHeaderSelectionState();
}

function setActSelectedState(div, selected, discoColor) {
  div.classList.toggle('selected', selected);
  div.setAttribute('aria-pressed', selected ? 'true' : 'false');

  if (selected) {
    if (discoColor) {
      div.style.background = '';
      div.style.borderLeftColor = '#fff';
    } else {
      setNormalSelectedActStyle(div);
    }
    return;
  }

  clearNormalSelectedActStyle(div);
  div.style.borderLeftColor = discoColor || '';
  div.style.borderTopColor = '';
}

function addActBehavior(div) {
  const toggleFavorite = () => {
    const oldFavs = getFavs();
    const selected = !div.classList.contains('selected');
    const discoColor = discoActColor(div);
    const aliases = getActFavoriteAliasesFromElement(div);
    const primaryFavId = div.dataset.favId || div.id;
    const newFavs = selected
      ? [...new Set([...oldFavs.filter(id => !aliases.includes(id)), primaryFavId])]
      : oldFavs.filter(id => !aliases.includes(id));

    setActSelectedState(div, selected, discoColor);
    saveFavs(newFavs);
    document.dispatchEvent(new CustomEvent('favschange'));
    updateStageHeaderSelectionState();
    updateCrossSceneIndicators();

    if (!document.body.classList.contains('is-fullscreen')) {
      updateNowSummary(getFestivalHour(discoMode ? 6 : 2));
    }

    syncFavoriteControlsAfterActToggle(oldFavs, newFavs, normalDayKey);
    syncFavoritesModeAfterActToggle(div, selected, oldFavs, newFavs);
  };

  div.addEventListener('click', toggleFavorite);
  div.addEventListener('keydown', e => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    e.preventDefault();
    toggleFavorite();
  });
}

function escapeHTML(v) {
  return String(v || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
}

function formatActDisplayName(name) {
  const clean = name === '?' ? '' : String(name || '');
  return clean.replace(/_/g, ' ').replace(/-/g, '‑');
}

function createActNameHTML(name) {
  const display = formatActDisplayName(name);
  const safe    = escapeHTML(display);
  return `<div class="act-name" title="${safe}">${safe}</div>`;
}
function renderSheetError(message = '') {
  const stageRow = $('stage-row'), axis = $('axis'), tl = $('tl');
  const startHour = 14, endHour = 24;
  clearSchedule(stageRow, axis, tl);
  setScheduleGrid(stageRow, tl, '60px 1fr');
  setTimelineWindow(tl, startHour, endHour);
  axis.appendChild(buildAxisFragment(startHour, endHour));
  tl.appendChild(buildGridLinesFragment(startHour, endHour));
  const msg = document.createElement('div');
  msg.id = 'sheet-error';
  msg.textContent = message || ({ fr: 'PROGRAMME INDISPONIBLE', en: 'SCHEDULE UNAVAILABLE', zh: '节目单不可用' }[currentLang] || 'PROGRAMME INDISPONIBLE');
  tl.appendChild(msg);
}

function getFavStageActs(dayKey, favs = getFavs(), overrideEntries = Object.entries(overrides)) {
  if (!DAYS[dayKey]) return [];
  return getFavoriteCandidateStages(dayKey)
    .map(stage => ({
      stage,
      acts: getActsFromOverrides(dayKey, stage.name, overrideEntries)
        .filter(act => isActFavorite(favs, dayKey, stage.name, act))
    }))
    .filter(s => s.acts.length > 0)
    .sort((a, b) => stagePriority(a.stage.name) - stagePriority(b.stage.name))
    .slice(0, 5);
}

function getFavRenderActs(dayKey, stageName, favoriteActs, startHour, endHour, overrideEntries = Object.entries(overrides)) {
  if (!showFavFillActs) return favoriteActs;
  return getActsFromOverrides(dayKey, stageName, overrideEntries)
    .filter(act => act.start >= startHour && act.end <= endHour)
    .sort((a, b) => a.start - b.start);
}

function getFavDays(favs = getFavs()) {
  const overrideEntries = Object.entries(overrides);
  return DAY_KEYS.filter(dayKey => getFavStageActs(dayKey, favs, overrideEntries).length > 0);
}

function updateFavDayVisibility(favDays = getFavDays()) {
  const allowed = new Set(profileEnabledDays);
  const base = DAY_KEYS.filter(d => allowed.has(d));
  const visible = new Set(favsOnly ? favDays.filter(d => allowed.has(d)) : base);
  const hideSecondaryUnavailableDay = secondaryStagesMode && !favsOnly && !discoMode && !campingMode && !profileMode;
  const hideCampingUnavailableDay = campingStageMode && !profileCampingEnabled && !favsOnly && !discoMode && !campingMode && !profileMode;
  const hideCampingViewDay = campingStageMode && !favsOnly && !discoMode && !campingMode && !profileMode;
  document.querySelectorAll('.day-item').forEach(el => {
    const dayKey = el.dataset.day;
    const shouldHide = (hideSecondaryUnavailableDay && !hasSecondaryStages(dayKey)) || (hideCampingViewDay && !hasCampingStage(dayKey)) || hideCampingUnavailableDay;
    el.style.display = visible.has(dayKey) && !shouldHide ? '' : 'none';
  });
}

function getFavRenderDay(preferredDay = normalDayKey) {
  const favDays = getFavDays();
  if (!favDays.length) return null;
  return favDays.includes(preferredDay) ? preferredDay : favDays[0];
}

function renderFavsMode(preferredDay = normalDayKey) {
  const dayKey = getFavRenderDay(preferredDay);
  updateFavDayVisibility();
  if (!dayKey) {
    favsOnly = false;
    document.body.classList.remove('favs-only', 'camping-stage-mode');
    updateFavDayVisibility(DAY_KEYS);
    updateFavsBtn();
    const titleEl = document.querySelector('.label span');
    if (titleEl) titleEl.textContent = 'Rampage Open Air 2026';
    renderDay(normalDayKey);
    return;
  }
  normalDayKey = dayKey;
  setActiveDay(normalDayKey);
  renderFavs(normalDayKey);
  queueActTextLayout();
}
function renderFavs(dayKey) {
  const day = DAYS[dayKey];
  if (!day) return;

  const favs = getFavs();
  const overrideEntries = Object.entries(overrides);
  const remainingActive = isRemainingModeActiveForDay(dayKey);
  const stageActs = getFavStageActs(dayKey, favs, overrideEntries)
    .map(stage => ({
      stage: stage.stage,
      acts: remainingActive
        ? stage.acts.filter(act => shouldShowActForCurrentView(dayKey, stage.stage.name, act, favs))
        : stage.acts
    }))
    .filter(stage => stage.acts.length > 0);
  if (!stageActs.length) {
    clearSchedule($('stage-row'), $('axis'), $('tl'));
    updateNowLine();
    return;
  }

  const N = stageActs.length;

  const allSelected = stageActs.flatMap(s => s.acts);
  const timeWindow = remainingActive
    ? getRemainingTimelineWindow(day, allSelected)
    : getCompactTimeWindow(day, allSelected);
  const { startHour, endHour, axisEndHour = endHour, scaleHours = endHour - startHour } = timeWindow;

  const stageRow = $('stage-row'), tl = $('tl'), axis = $('axis');
  document.body.classList.remove(...DAY_KEYS.map(d => 'day-' + d));
  document.body.classList.add('day-' + dayKey);

  setScheduleGrid(stageRow, tl, `60px ${'1fr '.repeat(N).trim()}`);
  setTimelineWindow(tl, startHour, endHour);

  const stageFrag    = buildStageHeaderFragment(stageActs.map(s => s.stage), s => buildStageHeader(s.name, s.sub));
  const axisFrag     = buildAxisFragment(startHour, axisEndHour, scaleHours);
  const timelineFrag = document.createDocumentFragment();

  stageActs.forEach(({ stage, acts }) => {
    const col = document.createElement('div');
    col.className = 'stage-col';
    const renderActs = getFavRenderActs(dayKey, stage.name, acts, startHour, endHour, overrideEntries)
      .filter(act => !remainingActive || shouldShowActForCurrentView(dayKey, stage.name, act, favs));
    renderActs.forEach(act => {
      const div = createActElement({
        id: makeLegacyActId(dayKey, stage.name, act.start),
        favId: makeActFavoriteId(dayKey, stage.name, act),
        legacyFavId: makeLegacyActId(dayKey, stage.name, act.start),
        name: act.name, start: act.start, end: act.end,
        className: 'act' + (act.name === 'RuneScape Rave' ? ' act-runescape' : ''),
        favs,
      });
      positionAct(div, act.start, act.end, startHour, endHour);
      col.appendChild(div);
    });
    timelineFrag.appendChild(col);
  });

  swapSchedule(stageRow, axis, tl, stageFrag, axisFrag, timelineFrag, startHour, axisEndHour, timeWindow);
  updateNowLine();
  updateResetBtn();
}

function renderDay(dayKey) {
  const day = DAYS[dayKey];
  const stageRow = $('stage-row');
  const tl = $('tl');
  const axis = $('axis');
  const favs = getFavs();
  const overrideEntries = Object.entries(overrides);

  if (secondaryStagesMode && !hasSecondaryStages(dayKey)) secondaryStagesMode = false;
  if (campingStageMode && !hasCampingStage(dayKey)) campingStageMode = false;
  if (campingStageMode) secondaryStagesMode = false;

  document.body.classList.remove(...DAY_KEYS.map(d => 'day-' + d));
  document.body.classList.add('day-' + dayKey);
  document.body.classList.toggle('secondary-stages-mode', !!secondaryStagesMode);
  document.body.classList.toggle('camping-stage-mode', !!campingStageMode);
  const stages = getNormalViewStages(dayKey);
  const actsByStage = stages.map(stage => ({
    stage,
    acts: getActsFromOverrides(dayKey, stage.name, overrideEntries)
      .filter(act => campingStageMode || shouldShowActForCurrentView(dayKey, stage.name, act, favs)),
  }));
  const remainingActive = !campingStageMode && isRemainingModeActiveForDay(dayKey);
  const allVisibleActs = actsByStage.flatMap(s => s.acts);
  const timeWindow = campingStageMode
    ? { startHour: CAMPING_STAGE_HOURS.start, endHour: CAMPING_STAGE_HOURS.end, axisEndHour: CAMPING_STAGE_HOURS.end, scaleHours: CAMPING_STAGE_HOURS.end - CAMPING_STAGE_HOURS.start }
    : remainingActive
      ? getRemainingTimelineWindow(day, allVisibleActs)
      : { startHour: day.startHour, endHour: day.endHour, axisEndHour: day.endHour, scaleHours: day.endHour - day.startHour };
  const { startHour, endHour, axisEndHour, scaleHours } = timeWindow;

  setScheduleGrid(stageRow, tl, makeStageGridCols(stages));
  setTimelineWindow(tl, startHour, endHour);

  const layoutKey = dayKey + (campingStageMode ? '|camping' : secondaryStagesMode ? '|secondary' : '|primary') + (remainingActive ? '|remaining' : '');
  const stageFrag = buildStageHeaderFragment(stages, s => buildStageHeader(s.name, s.sub));
  const axisFrag = buildAxisFragment(startHour, axisEndHour, scaleHours);
  const timelineFrag = document.createDocumentFragment();

  actsByStage.forEach(({ stage, acts }) => {
    const col = document.createElement('div');
    col.className = 'stage-col';

    acts.forEach(act => {
      const div = createActElement({
        id: makeLegacyActId(dayKey, stage.name, act.start),
        favId: makeActFavoriteId(dayKey, stage.name, act),
        legacyFavId: makeLegacyActId(dayKey, stage.name, act.start),
        name: act.name,
        start: act.start,
        end: act.end,
        className: 'act' + (act.name === 'RuneScape Rave' ? ' act-runescape' : ''),
        favs,
        layoutKey,
        alwaysShowTime: campingStageMode,
      });
      positionAct(div, act.start, act.end, startHour, endHour);
      col.appendChild(div);
    });

    timelineFrag.appendChild(col);
  });

  swapSchedule(stageRow, axis, tl, stageFrag, axisFrag, timelineFrag, startHour, axisEndHour, timeWindow);
  if (!actTextLayoutsPrecomputing && !normalActTextLayoutsReady) queueActTextLayoutIfMissing();
  updateNowLine();
  updateResetBtn();
}

function getDiscoActs(dayKey) {
  const result = { DiscoR: [], DiscoB: [], DiscoG: [] };

  Object.entries(overrides).forEach(([key, ov]) => {
    const [d, stage, startStr] = key.split('|');
    if (d !== dayKey) return;

    const norm = stage.toLowerCase();
    const bucket = norm === 'discor' ? 'DiscoR' : norm === 'discob' ? 'DiscoB' : norm === 'discog' ? 'DiscoG' : null;
    if (!bucket) return;

    const rawStart = parseFloat(startStr);
    if (!Number.isFinite(rawStart)) return;
    const rawEnd = typeof ov.end === 'number' ? ov.end : rawStart + 1;
    result[bucket].push({
      name: ov.name || '',
      start: rawStart < 6 ? rawStart + 24 : rawStart,
      end: rawEnd < 6 ? rawEnd + 24 : rawEnd,
      stableId: ov.stableId || '',
    });
  });

  Object.values(result).forEach(list => list.sort((a, b) => a.start - b.start));
  return result;
}

function renderDisco(dayKey) {
  const acts = getDiscoActs(dayKey);
  const stageRow = $('stage-row');
  const tl = $('tl');
  const axis = $('axis');
  const favs = getFavs();
  const dayStyles = discoStyles[dayKey] || {};

  const stages = Object.entries(DISCO_STAGE_META)
    .map(([key, meta]) => ({ key, ...meta, label: meta.labels[currentLang], style: dayStyles[key] || '' }))
    .filter(stage => acts[stage.key].some(a => a.name !== ''));

  const allActs = stages.flatMap(stage => acts[stage.key].filter(act => shouldShowActForCurrentView(dayKey, stage.key, act, favs, 6, DISCO_DAYS)));
  const gridCols = `60px ${'1fr '.repeat(Math.max(stages.length, 1)).trim()}`;
  setScheduleGrid(stageRow, tl, gridCols);

  const stageFrag = buildStageHeaderFragment(stages, stage => buildStageHeader(stage.label, stage.style, stage.color, stage.color));
  if (!allActs.length) {
    clearSchedule(stageRow, axis, tl);
    stageRow.appendChild(stageFrag);
    return;
  }

  const startHour = Math.floor(Math.min(...allActs.map(a => a.start)));
  const endHour = Math.ceil(Math.max(...allActs.map(a => a.end)));
  discoHours = { start: startHour, end: endHour };
  setTimelineWindow(tl, startHour, endHour);

  const axisFrag = buildAxisFragment(startHour, endHour);
  const timelineFrag = document.createDocumentFragment();

  stages.forEach(stage => {
    const col = document.createElement('div');
    col.className = 'stage-col';

    acts[stage.key]
      .filter(act => shouldShowActForCurrentView(dayKey, stage.key, act, favs, 6, DISCO_DAYS))
      .forEach(act => {
      if (!act.name) return;
      const div = createActElement({
        id: makeLegacyActId(dayKey, stage.key, act.start),
        favId: makeActFavoriteId(dayKey, stage.key, act),
        legacyFavId: makeLegacyActId(dayKey, stage.key, act.start),
        name: act.name,
        start: act.start,
        end: act.end,
        className: `act ${stage.cssClass}`,
        borderLeftColor: stage.color,
        favs,
        favMode: 'disco',
      });
      positionAct(div, act.start, act.end, startHour, endHour);
      col.appendChild(div);
    });

    timelineFrag.appendChild(col);
  });

  swapSchedule(stageRow, axis, tl, stageFrag, axisFrag, timelineFrag, startHour, endHour);
  updateNowLine();
  updateResetBtn();
}

function updateFavsBtn() {
  const btn = $('favs-btn');
  if (!btn) return;
  const show = favsOnly || (!discoMode && !campingMode && getFavDays().includes(normalDayKey));
  btn.style.display = 'flex';
  btn.style.visibility = show ? 'visible' : 'hidden';
  btn.style.pointerEvents = show ? 'auto' : 'none';
  setUtilityButtonState(btn, true, favsOnly);
}

function updateResetBtn() {
  const wrap = $('reset-wrap');
  const hasFavs = getFavs().length > 0;
  const hasProfileChange = !profileCampingEnabled || !profileDiscoEnabled || !profileDancefloorEnabled
    || sunAutoMode || !showRemainingOnly || fsRemainingOnly || !showFavFillActs
    || !fsShowTitles || !fsShowDay || !fsShowDate
    || DAY_KEYS.some(d => !profileEnabledDays.includes(d));
  if (wrap) wrap.style.display = (hasFavs || hasProfileChange) ? 'block' : 'none';
  if (!hasFavs && favsOnly) {
    favsOnly = false;
    document.body.classList.remove('favs-only', 'camping-stage-mode');
    updateFavDayVisibility(DAY_KEYS);
    updateFavsBtn();
    if (!discoMode && !campingMode) renderDay(normalDayKey);
  }
  updateFavsBtn();
}

function getCurrentFestivalDay() {
  return getJuly2026Day(2, FESTIVAL_DAYS, null);
}

function getDiscoDay() {
  return getJuly2026Day(6, DISCO_DAYS, 'vendredi');
}

function getDefaultDay() {
  return getCurrentFestivalDay() || 'jeudi';
}

function getRemainingViewEnabledForCurrentRender() {
  if (actTextLayoutsPrecomputing) return actTextLayoutsPrecomputeRemaining;
  if (document.body.classList.contains('is-fullscreen')) return fsRemainingOnly;
  return showRemainingOnly;
}

function isRemainingModeActiveForDay(dayKey, cutoffHour = REMAINING_DAY_CUTOFF_HOUR, dayMap = FESTIVAL_DAYS) {
  if (!getRemainingViewEnabledForCurrentRender()) return false;
  const currentDay = getJuly2026Day(cutoffHour, dayMap, null);
  if (!currentDay || dayKey !== currentDay) return false;

  const day = DAYS[dayKey];
  if (!day) return false;
  const h = getFestivalHour(cutoffHour);
  return h >= day.startHour && h < day.endHour;
}

function getRemainingCutoffForDay(dayKey, cutoffHour = REMAINING_DAY_CUTOFF_HOUR, dayMap = FESTIVAL_DAYS) {
  return isRemainingModeActiveForDay(dayKey, cutoffHour, dayMap) ? getFestivalHour(cutoffHour) : null;
}

function getCompactTimeWindow(day, acts) {
  if (!day || !acts.length) return { startHour: day?.startHour ?? 14, endHour: day?.endHour ?? 24 };

  let startHour = Math.floor(Math.min(...acts.map(a => a.start)));
  let endHour   = Math.ceil(Math.max(...acts.map(a => a.end)));
  const MIN_RANGE = 2;
  if (endHour - startHour < MIN_RANGE) {
    const pad = (MIN_RANGE - (endHour - startHour)) / 2;
    startHour = Math.max(day.startHour, Math.floor(startHour - pad));
    endHour   = Math.min(day.endHour,   Math.ceil(endHour   + pad));
  }
  return { startHour, endHour };
}

function getRemainingTimelineWindow(day, acts) {
  const dayStart = day?.startHour ?? 14;
  const dayEnd = day?.endHour ?? (dayStart + REMAINING_WINDOW_HOURS);
  const nowHour = getFestivalHour(REMAINING_DAY_CUTOFF_HOUR);
  const hasLiveNow = Number.isFinite(nowHour) && nowHour >= dayStart && nowHour < dayEnd;
  const startHour = hasLiveNow
    ? Math.max(dayStart, nowHour - REMAINING_PAST_HOURS)
    : dayStart;
  const endByDay = Math.max(dayEnd, startHour + REMAINING_WINDOW_HOURS);
  const endByFuture = hasLiveNow ? nowHour + REMAINING_MIN_FUTURE_HOURS : endByDay;
  const endHour = Math.max(endByDay, endByFuture);
  const scaleHours = Math.max(REMAINING_WINDOW_HOURS, endHour - startHour);
  const axisEndHour = endHour;

  return {
    startHour,
    endHour,
    axisEndHour,
    scaleHours,
    remainingTimeline: true,
    remainingBaseStart: startHour,
    remainingWindowHours: scaleHours,
  };
}

function shouldShowActForCurrentView(dayKey, stageName, act, favs, cutoffHour = REMAINING_DAY_CUTOFF_HOUR, dayMap = FESTIVAL_DAYS) {
  if (dayMap === DISCO_DAYS) return true;
  const cutoff = getRemainingCutoffForDay(dayKey, cutoffHour, dayMap);
  if (cutoff === null) return true;
  const start = Number(act && act.start);
  const end = Number(act && act.end);
  if (!Number.isFinite(start) || !Number.isFinite(end)) return false;
  if (end <= cutoff) return false;
  if (start < cutoff - REMAINING_PAST_HOURS) return false;
  return true;
}

function shouldShowInfoForCurrentView(dayKey, item) {
  const cutoff = getRemainingCutoffForDay(dayKey, REMAINING_DAY_CUTOFF_HOUR, FESTIVAL_DAYS);
  if (cutoff === null) return true;
  const end = Number(item && item.end);
  const start = Number(item && item.start);
  return Number.isFinite(end) ? end > cutoff : !Number.isFinite(start) || start >= cutoff;
}

function setActiveDay(day) {
  document.querySelectorAll('.day-item').forEach(d => {
    const active = d.dataset.day === day;
    d.classList.toggle('active', active);
    if (active) $('current-date').textContent = d.dataset[activeDateKey()] || '';
  });
}

function ensureActiveDay(day = normalDayKey || getDefaultDay()) {
  if (!day || document.querySelector('.day-item.active')) return;
  setActiveDay(day);
}

function setUtilityButtonState(btn, isAvailable = true, isOpen = false) {
  if (!btn) return;
  btn.classList.toggle('control-active', Boolean(isOpen));
  btn.classList.toggle('control-unavailable', !isAvailable && !isOpen);
  btn.setAttribute('aria-pressed', isOpen ? 'true' : 'false');
}

function updateSettingsBtn() {
  const btn = $('settings-btn');
  const bottomBar = $('bottom-bar');
  setUtilityButtonState(btn, true, Boolean(bottomBar && bottomBar.classList.contains('settings-open')));
}

function updateFullscreenBtn() {
  setUtilityButtonState($('fs-btn'), true, document.body.classList.contains('is-fullscreen'));
}

function getCurrentInfoDay() {
  return getJuly2026Day(6, FESTIVAL_DAYS, null);
}

function isInfoItemActive(item, h) {
  const start = Number(item && item.start);
  const end = Number(item && item.end);

  if (!Number.isFinite(start) || !Number.isFinite(end)) return false;

  return start <= h && h < end;
}

function isSilentDiscoInfoItem(item) {
  const label = String(item && item.label || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
  return /silent\s*disco/.test(label);
}

function isInfoCurrentlyActive() {
  const h = getFestivalHour(6);
  const dayKey = getCurrentInfoDay();
  if (!dayKey) return false;
  const items = infoData[dayKey] || [];
  return items.some(item => !isSilentDiscoInfoItem(item) && isInfoItemActive(item, h));
}

function getCurrentDiscoState() {
  const p = getFestivalParts();
  const active = p.year === 2026 && p.monthIndex === 6 && p.hour >= 0 && p.hour < 6;
  if (!active) return { active: false, inPeak: false, dayKey: null };

  const dayKey = DISCO_NIGHT_DAYS[p.day] || null;
  return dayKey ? { active: true, inPeak: true, dayKey } : { active: false, inPeak: false, dayKey: null };
}

function updateDiscoBtn() {
  const btn = $('disco-btn');
  if (!btn) return false;
  const state = getCurrentDiscoState();
  setUtilityButtonState(btn, state.active, discoMode);
  updateCrossSceneIndicators();
  return state.active;
}

function updateCampingBtn() {
  const btn = $('camping-btn');
  if (!btn) return false;
  const hasActive = isInfoCurrentlyActive();
  setUtilityButtonState(btn, hasActive, campingMode);
  return hasActive;
}

function renderCamping(dayKey) {
  const stageRow = $('stage-row');
  const tl = $('tl');
  const axis = $('axis');
  clearSchedule(stageRow, axis, tl);
  setScheduleGrid(stageRow, tl, '60px 1fr');

  const stageFrag = buildStageHeaderFragment([{ name: 'INFOS', sub: '' }], s => buildStageHeader(s.name, s.sub));
  stageRow.appendChild(stageFrag);

  const col = document.createElement('div');
  col.className = 'stage-col info-col';

  const h = getFestivalHour(6);

  const todayKey = getCurrentInfoDay();
  (infoData[dayKey] || [])
    .filter(item => shouldShowInfoForCurrentView(dayKey, item))
    .forEach(item => {
    const isActive = todayKey === dayKey && isInfoItemActive(item, h);
    const card = document.createElement('div');
    card.className = 'camping-card' + (isActive ? ' camping-card-active' : '');
    if (isActive) card.style.borderLeftColor = accentColor;
    const timeStr = item.end !== null ? fmtActTimeRange(item.start, item.end) : fmtActH(item.start);
    card.innerHTML = `<div class="camping-label">${escapeHTML(item.label)}</div><div class="camping-time">${timeStr}</div>`;
    col.appendChild(card);
  });

  tl.appendChild(col);
  updateResetBtn();
}

function updateNowLine() {
  const tl = $('tl');
  const existing = $('now-line');
  const isFullscreen = document.body.classList.contains('is-fullscreen');

  if (sheetLoadFailed) {
    resetTimelineScrollTransform();
    if (existing) existing.remove();
    setNowSummary('');
    document.querySelectorAll('.act').forEach(act => {
      act.classList.remove('act-now', 'act-past');
    });
    updateStageHeaderSelectionState();
    updateCrossSceneIndicators();
    return;
  }

  if (isFullscreen) {
    resetTimelineScrollTransform();
    if (existing) existing.remove();
    setNowSummary('');
    document.querySelectorAll('.act').forEach(act => {
      act.classList.remove('act-now', 'act-past');
    });
    updateStageHeaderSelectionState();
    updateCrossSceneIndicators();
    return;
  }

  updateNowSummary();

  if (campingMode || profileMode) {
    resetTimelineScrollTransform();
    if (existing) existing.remove();
    document.querySelectorAll('.act').forEach(act => {
      act.classList.remove('act-now', 'act-past');
    });
    updateStageHeaderSelectionState();
    updateCrossSceneIndicators();
    return;
  }

  if (discoMode) {
    resetTimelineScrollTransform();
    const renderedDay = document.querySelector('.day-item.active')?.dataset.day;
    if (renderedDay && renderedDay !== getDiscoDay()) {
      if (existing) existing.remove();
      updateNowSummary();
      document.querySelectorAll('.act').forEach(act => {
        act.classList.remove('act-now', 'act-past');
      });
      updateStageHeaderSelectionState();
      updateCrossSceneIndicators();
      return;
    }
    const p = getFestivalParts();
    const inFestival = p.year === 2026 && p.monthIndex === 6 && (((p.day === 4 || p.day === 5) && p.hour < 6) || (p.day === 6 && p.hour < 5));
    let h = p.hour + p.minute / 60 + p.second / 3600;
    if (h < 6) h += 24;
    if (!inFestival || h < discoHours.start || h >= discoHours.end) {
      if (existing) existing.remove();
      updateNowSummary();
      document.querySelectorAll('.act').forEach(act => {
        act.classList.remove('act-now');
        act.classList.remove('act-past');
      });
      updateStageHeaderSelectionState();
      updateCrossSceneIndicators();
      return;
    }
    const totalMin = (discoHours.end - discoHours.start) * 60;
    const topPct   = ((h - discoHours.start) * 60) / totalMin * 100;
    const line = existing || document.createElement('div');
    line.id = 'now-line';
    if (!existing) {
      Object.assign(line.style, { position: 'absolute', left: NOW_LINE_LEFT_PX + 'px', right: NOW_LINE_RIGHT_PX + 'px', height: '6px', background: 'var(--accent)', boxShadow: '0 0 16px var(--accent), 0 0 0 1px rgba(255,255,255,0.65)', zIndex: '0', pointerEvents: 'none', transform: 'translateY(-50%)' });
      tl.appendChild(line);
    }
    line.style.height = '6px';
    line.style.transform = 'translateY(-50%)';
    line.style.boxShadow = '0 0 16px var(--accent), 0 0 0 1px rgba(255,255,255,0.65)';
    line.style.top = topPct + '%';
    document.querySelectorAll('.act').forEach(act => {
      const s = parseFloat(act.dataset.start), e = parseFloat(act.dataset.end);
      act.classList.toggle('act-now',  h >= s && h < e);
      act.classList.toggle('act-past', h >= e);
    });
    updateNowSummary(h);
    updateCrossSceneIndicators();
    return;
  }

  if (campingStageMode) {
    resetTimelineScrollTransform();
    const renderedDay = document.querySelector('.day-item.active')?.dataset.day;
    const festivalDayForCamping = getCurrentFestivalDay();
    const h = getFestivalHour(2);
    const validDay = renderedDay && renderedDay === festivalDayForCamping && hasCampingStage(renderedDay);
    const inCampingHours = h >= CAMPING_STAGE_HOURS.start && h < CAMPING_STAGE_HOURS.end;

    if (!validDay || !inCampingHours) {
      if (existing) existing.remove();
      document.querySelectorAll('.act').forEach(act => {
        const e = parseFloat(act.dataset.end);
        act.classList.toggle('act-past', validDay && Number.isFinite(e) && h >= e);
        act.classList.remove('act-now');
      });
      updateStageHeaderSelectionState();
      updateNowSummary(h);
      updateCrossSceneIndicators();
      return;
    }

    const totalMin = (CAMPING_STAGE_HOURS.end - CAMPING_STAGE_HOURS.start) * 60;
    const topPct = ((h - CAMPING_STAGE_HOURS.start) * 60) / totalMin * 100;
    const line = existing || document.createElement('div');
    line.id = 'now-line';
    if (!existing) {
      Object.assign(line.style, {
        position: 'absolute', left: NOW_LINE_LEFT_PX + 'px', right: NOW_LINE_RIGHT_PX + 'px',
        height: '6px', background: 'var(--accent)',
        boxShadow: '0 0 16px var(--accent), 0 0 0 1px rgba(255,255,255,0.65)',
        zIndex: '0', pointerEvents: 'none', transform: 'translateY(-50%)'
      });
      tl.appendChild(line);
    }
    line.style.height = '6px';
    line.style.transform = 'translateY(-50%)';
    line.style.boxShadow = '0 0 16px var(--accent), 0 0 0 1px rgba(255,255,255,0.65)';
    line.style.top = topPct + '%';

    document.querySelectorAll('.act').forEach(act => {
      const s = parseFloat(act.dataset.start);
      const e = parseFloat(act.dataset.end);
      act.classList.toggle('act-now', h >= s && h < e);
      act.classList.toggle('act-past', h >= e);
    });
    updateStageHeaderSelectionState();
    updateNowSummary(h);
    updateCrossSceneIndicators();
    return;
  }

  const festivalDay = getCurrentFestivalDay();
  const activeDay = document.querySelector('.day-item.active');
  const festivalIdx = festivalDay ? DAY_KEYS.indexOf(festivalDay) : -1;
  const viewedIdx = activeDay ? DAY_KEYS.indexOf(activeDay.dataset.day) : -1;

  if (festivalDay && viewedIdx < festivalIdx) {
    resetTimelineScrollTransform();
    if (existing) existing.remove();
    updateNowSummary();
    document.querySelectorAll('.act').forEach(act => {
      act.classList.add('act-past');
      act.classList.remove('act-now');
    });
    updateCrossSceneIndicators();
    return;
  }

  if (!festivalDay || !activeDay || activeDay.dataset.day !== festivalDay) {
    resetTimelineScrollTransform();
    if (existing) existing.remove();
    updateNowSummary();
    updateCrossSceneIndicators();
    return;
  }

  const plainScheduleView = !profileMode && !discoMode && !campingMode && !favsOnly;
  const renderedRemainingTimeline = tl.dataset.remainingTimeline === '1';
  const shouldUseRemainingTimeline = isRemainingModeActiveForDay(activeDay.dataset.day);
  const day = DAYS[festivalDay];
  if (plainScheduleView && renderedRemainingTimeline !== shouldUseRemainingTimeline) {
    renderDay(activeDay.dataset.day);
    return;
  }
  if (plainScheduleView && shouldUseRemainingTimeline && renderedRemainingTimeline) {
    const expectedWindow = getRemainingTimelineWindow(day, []);
    const currentWindow = getTimelineWindow(tl, day.startHour, day.endHour);
    const currentScale = parseFloat(tl.dataset.remainingWindowHours);
    const windowChanged = Math.abs(currentWindow.startHour - expectedWindow.startHour) > 0.01
      || Math.abs(currentWindow.endHour - expectedWindow.endHour) > 0.01
      || Math.abs((Number.isFinite(currentScale) ? currentScale : REMAINING_WINDOW_HOURS) - expectedWindow.scaleHours) > 0.01;
    if (windowChanged) {
      renderDay(activeDay.dataset.day);
      return;
    }
  }

  const h = getFestivalHour(REMAINING_DAY_CUTOFF_HOUR);

  if (h < day.startHour || h >= day.endHour) {
    resetTimelineScrollTransform();
    if (existing) existing.remove();
    updateNowSummary();
    return;
  }

  const view = getTimelineWindow(tl, day.startHour, day.endHour);
  const isRemainingTimeline = tl.dataset.remainingTimeline === '1';
  const remainingBaseStart = parseFloat(tl.dataset.remainingBaseStart);
  const remainingWindowHours = parseFloat(tl.dataset.remainingWindowHours) || REMAINING_WINDOW_HOURS;
  let lineVisible = h >= view.startHour && h < view.endHour;
  let lineTopPct = null;

  if (isRemainingTimeline && Number.isFinite(remainingBaseStart)) {
    resetTimelineScrollTransform();
    lineVisible = h >= view.startHour && h < day.endHour;
    if (lineVisible) {
      const totalMin = (view.endHour - view.startHour) * 60;
      lineTopPct = ((h - view.startHour) * 60) / totalMin * 100;
    }
  } else {
    resetTimelineScrollTransform();
    if (lineVisible) {
      const totalMin = (view.endHour - view.startHour) * 60;
      lineTopPct = ((h - view.startHour) * 60) / totalMin * 100;
    }
  }

  if (lineVisible && lineTopPct !== null) {
    const line = existing || document.createElement('div');
    line.id = 'now-line';
    if (!existing) {
      Object.assign(line.style, {
        position: 'absolute', left: NOW_LINE_LEFT_PX + 'px', right: NOW_LINE_RIGHT_PX + 'px',
        height: '6px', background: 'var(--accent)',
        boxShadow: '0 0 16px var(--accent), 0 0 0 1px rgba(255,255,255,0.65)',
        zIndex: '0', pointerEvents: 'none', transform: 'translateY(-50%)'
      });
      tl.appendChild(line);
    }
    line.style.height = '6px';
    line.style.transform = 'translateY(-50%)';
    line.style.boxShadow = '0 0 16px var(--accent), 0 0 0 1px rgba(255,255,255,0.65)';
    line.style.top = lineTopPct + '%';
  } else if (existing) {
    existing.remove();
  }

  document.querySelectorAll('.act').forEach(act => {
    const s = parseFloat(act.dataset.start);
    const e = parseFloat(act.dataset.end);
    const isNow = h >= s && h < e;
    act.classList.toggle('act-now', isNow);
    act.classList.toggle('act-past', h >= e);
    if (act.classList.contains('selected') && !discoActColor(act)) {
      setNormalSelectedActStyle(act);
    } else {
      act.style.borderLeftColor = '';
      act.style.borderTopColor = '';
    }
  });
  updateStageHeaderSelectionState();
  updateNowSummary(h);
  updateCrossSceneIndicators();
}

function waitForActLayoutFontsReady(timeoutMs = 3000) {
  if (!document.fonts || !document.fonts.ready) return Promise.resolve();
  return Promise.race([
    document.fonts.ready.catch(() => {}),
    new Promise(resolve => setTimeout(resolve, timeoutMs)),
  ]);
}

document.addEventListener('DOMContentLoaded', () => {
  currentLang = localStorage.getItem('lang') || 'fr';

  const _curFestDay = getCurrentFestivalDay();
  normalDayKey = _curFestDay || 'jeudi';
  discoDayKey   = getDiscoDay();
  campingDayKey = normalDayKey;
  discoMode     = false;
  campingMode   = false;
  favsOnly      = false;
  secondaryStagesMode = false;
  campingStageMode = false;
  if (campingStageMode) secondaryStagesMode = false;
  profileEnabledDays = JSON.parse(localStorage.getItem('profileEnabledDays') || '["jeudi","vendredi","samedi","dimanche"]');
  profileDancefloorEnabled = localStorage.getItem('profileDancefloor') !== '0';

  if (discoMode)  document.body.classList.add('disco-mode');
  if (favsOnly)   document.body.classList.add('favs-only');

  try {
    const saved = JSON.parse(localStorage.getItem('color'));
    if (saved) {
      accentColor = saved.accent; accentBg = saved.bg; accentBorder = saved.border;
      setThemeVars();
      syncColorOptions();
      document.querySelectorAll('.label').forEach(el => el.style.color = accentColor);
      const dlEl = $('days-left');
      if (dlEl) dlEl.style.color = accentColor;
      const cb = $('color-btn');
      if (cb) cb.style.background = accentColor;
      paintThemedButtons();
    }
  } catch(e) {}
  setThemeVars();
  paintThemedButtons();

  document.querySelectorAll('.day-item').forEach(el => {
    el.classList.toggle('active', el.dataset.day === normalDayKey);
    el.textContent = el.dataset[currentLang];
  });
  updateFavDayVisibility();
  ensureActiveDay(normalDayKey);
  const activeDayEl = document.querySelector(`.day-item[data-day="${normalDayKey}"]`);
  if (activeDayEl) {
    $('current-date').textContent = activeDayEl.dataset[activeDateKey()];
  }
  let pageRevealed = false;
  function revealPage() {
    if (pageRevealed) return;
    ensureActiveDay(normalDayKey || getDefaultDay());
    pageRevealed = true;
    document.body.style.opacity = '1';
    document.documentElement.classList.add('page-revealed');
  }
  setTimeout(revealPage, 4000);

  loadOverrides().then(() => {
    const normalMode = !sheetLoadFailed && !discoMode && !campingMode && !favsOnly;

    if (sheetLoadFailed) {
      renderSheetError();
    } else if (discoMode) {
      setActiveDay(discoDayKey);
      document.querySelector('.label span').textContent = 'Silent Disco';
      renderDisco(discoDayKey);
      queueActTextLayout();
    } else if (campingMode) {
      setActiveDay(campingDayKey);
      renderCamping(campingDayKey);
    } else if (favsOnly) {
      renderFavsMode(normalDayKey);
    }
    updateNowLine();
    updateCampingBtn();
    updateStageViewBtn();

    if (normalMode) {
      requestAnimationFrame(() => requestAnimationFrame(() => {
        waitForActLayoutFontsReady().then(() => {
          setActiveDay(normalDayKey);
          precomputeNormalDayTextLayouts(normalDayKey);
          updateNowLine();
          revealPage();
        });
      }));
    } else {
      requestAnimationFrame(() => requestAnimationFrame(() => {
        revealPage();
      }));
    }
  });
  if (localStorage.getItem('rs_unlocked')) document.body.classList.add('runescape-unlocked');

  function updateDaysLeft() {
    const el = $('days-left');
    if (!el) return;
    const p = getFestivalDateWithCutoff(0);
    const today = Date.UTC(p.year, p.monthIndex, p.day);
    const diff = Math.ceil((Date.UTC(2026, 6, 2) - today) / 86400000);
    const festivalOver = today > Date.UTC(2026, 6, 5);
    if (diff <= 0 || festivalOver) { el.textContent = ''; return; }
    el.textContent = currentLang === 'zh' ? diff + '天' : currentLang === 'en' ? 'D-' + diff : 'J-' + diff;
  }
  updateDaysLeft();
  updateDiscoBtn();
  updateCampingBtn();

  setInterval(refreshTimeSensitiveUI, 60000);

  let bottomButtonsIdleTimer = 0;
  function canAutoDimBottomButtons() {
    return !document.body.classList.contains('profile-mode')
      && !document.body.classList.contains('disco-mode')
      && !document.body.classList.contains('camping-mode');
  }

  function scheduleBottomButtonsIdle() {
    document.body.classList.remove('bottom-buttons-idle');
    clearTimeout(bottomButtonsIdleTimer);
    bottomButtonsIdleTimer = setTimeout(() => {
      if (canAutoDimBottomButtons()) document.body.classList.add('bottom-buttons-idle');
    }, 2000);
  }
  const bottomBarEl = $('bottom-bar');
  if (bottomBarEl) {
    ['pointerdown', 'keydown'].forEach(type => {
      bottomBarEl.addEventListener(type, e => {
        if (e.target.closest('.bottom-btn')) scheduleBottomButtonsIdle();
      }, true);
    });
    scheduleBottomButtonsIdle();
  }

  const setTitle = title => document.querySelector('.label span').textContent = title;
  const selectDefaultDay = () => { normalDayKey = getDefaultDay(); setActiveDay(normalDayKey); };
  const showDefaultDay = () => { secondaryStagesMode = false; campingStageMode = false; updateFavDayVisibility(DAY_KEYS); selectDefaultDay(); if (!normalActTextLayoutsReady) precomputeNormalDayTextLayouts(normalDayKey); else renderDay(normalDayKey); updateStageViewBtn(); };
  function stopDisco(renderNormal = true) {
    discoMode = false;
    updateDiscoBtn();
    setTitle('Rampage Open Air 2026');
    document.body.classList.remove('disco-mode');
    if (easterActive === 'disco') triggerEaster('disco');
    if (renderNormal) showDefaultDay();
  }

  function refreshTimeSensitiveUI() {
    updateNowLine();
    updateDiscoBtn();
    updateCampingBtn();
    updateCrossSceneIndicators();
  }

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) refreshTimeSensitiveUI();
  });
  window.addEventListener('focus', refreshTimeSensitiveUI);

  let daySwipeAnimationTimer = null;
  function playDaySwipeAnimation(direction) {
    const cls = direction > 0 ? 'day-swipe-enter-next' : 'day-swipe-enter-prev';
    document.body.classList.remove('day-swipe-animating', 'day-swipe-enter-next', 'day-swipe-enter-prev');
    void document.body.offsetWidth;
    document.body.classList.add('day-swipe-animating', cls);
    clearTimeout(daySwipeAnimationTimer);
    daySwipeAnimationTimer = setTimeout(() => {
      document.body.classList.remove('day-swipe-animating', 'day-swipe-enter-next', 'day-swipe-enter-prev');
    }, 260);
  }

  document.querySelectorAll('.day-item').forEach(el => {
    el.addEventListener('click', () => {
      const selectedDay = el.dataset.day;
      if (!discoMode && !campingMode && !favsOnly) {
        if (secondaryStagesMode && !hasSecondaryStages(selectedDay)) return;
        if (campingStageMode && !hasCampingStage(selectedDay)) return;
      }
      if (profileMode) {
        profileMode = false;
        document.body.classList.remove('profile-mode');
        updateProfileBtn();
        setTitle('Rampage Open Air 2026');
      }
      if (discoMode) {
        discoDayKey = selectedDay;
        setActiveDay(discoDayKey);
        renderDisco(discoDayKey);
        queueActTextLayout();
        return;
      }
      if (campingMode) {
        campingDayKey = selectedDay;
        setActiveDay(campingDayKey);
        renderCamping(campingDayKey);
        return;
      }
      normalDayKey = selectedDay;
      setActiveDay(normalDayKey);
      if (favsOnly) { renderFavsMode(selectedDay); } else { renderDay(normalDayKey); }
      updateCampingBtn();
      updateStageViewBtn();
    });
  });

  function isSwipeBlocked(target) {
    return sheetLoadFailed || profileMode
      || Boolean(target && target.closest('#settings-popover, .color-menu, .profile-mode-col, button, input, textarea, select, a'));
  }

  function getCurrentSwipeDay() {
    return discoMode ? discoDayKey : campingMode ? campingDayKey : normalDayKey;
  }

  function getSwipeDayKeys() {
    return DAY_KEYS.filter(dayKey => {
      const el = document.querySelector(`.day-item[data-day="${dayKey}"]`);
      if (!el) return false;
      return getComputedStyle(el).display !== 'none' && getComputedStyle(el).visibility !== 'hidden';
    });
  }

  function changeDayBySwipe(direction) {
    const keys = getSwipeDayKeys();
    if (keys.length < 2) return false;

    const current = getCurrentSwipeDay();
    const index = keys.indexOf(current);
    if (index === -1) return false;

    const targetDay = keys[index + direction];
    if (!targetDay) return false;

    const targetEl = document.querySelector(`.day-item[data-day="${targetDay}"]`);
    if (!targetEl) return false;

    targetEl.click();
    playDaySwipeAnimation(direction);
    return true;
  }

  let daySwipeStart = null;
  let suppressSwipeClickUntil = 0;
  const SWIPE_MIN_DISTANCE = 86;
  const SWIPE_FAST_DISTANCE = 56;
  const SWIPE_MIN_VELOCITY = 0.42;
  const SWIPE_MAX_VERTICAL = 145;
  const SWIPE_AXIS_RATIO = 1.18;
  const PEEK_START_DISTANCE = 18;
  const PEEK_MAX_OFFSET = 260;

  function setPeekOffset(px, dragging = false) {
    const content = document.querySelector('.content');
    if (!content) return;
    const y = Math.max(-PEEK_MAX_OFFSET, Math.min(0, Math.round(px)));
    content.style.setProperty('--peek-y', y + 'px');
    document.body.classList.toggle('peek-dragging', dragging);
  }

  function resetPeekOffset() {
    document.body.classList.remove('peek-dragging');
    const content = document.querySelector('.content');
    if (!content) return;
    content.style.setProperty('--peek-y', '0px');
  }

  function startDaySwipe(clientX, clientY, target, pointerId = null) {
    if (isSwipeBlocked(target)) return;
    daySwipeStart = { x: clientX, y: clientY, pointerId, time: Date.now(), axis: null, peekMoved: false };
  }

  function moveDaySwipe(clientX, clientY, pointerId = null) {
    if (!daySwipeStart) return false;
    if (daySwipeStart.pointerId !== null && pointerId !== null && daySwipeStart.pointerId !== pointerId) return false;

    const dx = clientX - daySwipeStart.x;
    const dy = clientY - daySwipeStart.y;
    const absX = Math.abs(dx);
    const absY = Math.abs(dy);

    if (!daySwipeStart.axis && Math.max(absX, absY) >= PEEK_START_DISTANCE) {
      daySwipeStart.axis = absY > absX * 1.05 ? 'y' : 'x';
    }

    if (daySwipeStart.axis !== 'y') return false;

    if (dy < -PEEK_START_DISTANCE) {
      const eased = Math.max(-PEEK_MAX_OFFSET, dy * 0.86);
      daySwipeStart.peekMoved = true;
      setPeekOffset(eased, true);
      return true;
    }

    if (daySwipeStart.peekMoved) {
      setPeekOffset(0, true);
      return true;
    }

    return false;
  }

  function finishDaySwipe(clientX, clientY, pointerId = null) {
    if (!daySwipeStart) return false;
    if (daySwipeStart.pointerId !== null && pointerId !== null && daySwipeStart.pointerId !== pointerId) return false;

    const dx = clientX - daySwipeStart.x;
    const dy = clientY - daySwipeStart.y;
    const dt = Math.max(1, Date.now() - daySwipeStart.time);
    const wasVerticalPeek = daySwipeStart.axis === 'y' || daySwipeStart.peekMoved;
    daySwipeStart = null;

    if (wasVerticalPeek) {
      resetPeekOffset();
      if (Math.abs(dy) >= PEEK_START_DISTANCE) {
        suppressSwipeClickUntil = Date.now() + 350;
        return true;
      }
      return false;
    }

    const absX = Math.abs(dx);
    const absY = Math.abs(dy);
    const isHorizontal = absX > absY * SWIPE_AXIS_RATIO && absY < SWIPE_MAX_VERTICAL;
    const isLongEnough = absX >= SWIPE_MIN_DISTANCE;
    const isFastEnough = absX >= SWIPE_FAST_DISTANCE && absX / dt >= SWIPE_MIN_VELOCITY;
    if (!isHorizontal || (!isLongEnough && !isFastEnough)) return false;

    const direction = dx < 0 ? 1 : -1;
    if (!changeDayBySwipe(direction)) return false;

    suppressSwipeClickUntil = Date.now() + 450;
    return true;
  }

  const swipeSurface = $('scaler') || document.body;
  if ('PointerEvent' in window) {
    swipeSurface.addEventListener('pointerdown', e => {
      if (e.button !== 0 || e.isPrimary === false) return;
      startDaySwipe(e.clientX, e.clientY, e.target, e.pointerId);
    });
    swipeSurface.addEventListener('pointermove', e => {
      if (moveDaySwipe(e.clientX, e.clientY, e.pointerId)) e.preventDefault();
    });
    swipeSurface.addEventListener('pointerup', e => {
      if (finishDaySwipe(e.clientX, e.clientY, e.pointerId)) e.preventDefault();
    });
    swipeSurface.addEventListener('pointercancel', () => { daySwipeStart = null; resetPeekOffset(); });
  } else {
    swipeSurface.addEventListener('touchstart', e => {
      if (e.touches.length !== 1) return;
      const t = e.touches[0];
      startDaySwipe(t.clientX, t.clientY, e.target, null);
    }, { passive: true });
    swipeSurface.addEventListener('touchmove', e => {
      const t = e.touches && e.touches[0];
      if (!t) return;
      if (moveDaySwipe(t.clientX, t.clientY, null)) e.preventDefault();
    }, { passive: false });
    swipeSurface.addEventListener('touchend', e => {
      const t = e.changedTouches && e.changedTouches[0];
      if (!t) return;
      if (finishDaySwipe(t.clientX, t.clientY, null)) e.preventDefault();
    }, { passive: false });
    swipeSurface.addEventListener('touchcancel', () => { daySwipeStart = null; resetPeekOffset(); }, { passive: true });
  }

  document.addEventListener('click', e => {
    if (Date.now() > suppressSwipeClickUntil) return;
    e.preventDefault();
    e.stopPropagation();
  }, true);

  function getSettingsTitle() {
    return { fr: 'PARAMÈTRES', en: 'SETTINGS', zh: '设置' }[currentLang] || 'PARAMÈTRES';
  }

  function applyLanguageUI() {
    document.body.classList.toggle('lang-zh', currentLang === 'zh');
    document.querySelectorAll('.day-item').forEach(el => { el.textContent = el.dataset[currentLang]; });
    const active = document.querySelector('.day-item.active');
    if (active) $('current-date').textContent = active.dataset[activeDateKey()] || '';
  }

  function setLanguage(code, rerender = true) {
    currentLang = code;
    localStorage.setItem('lang', currentLang);
    applyLanguageUI();
    updateDaysLeft();
    setSheetStatus();
    if (!rerender) return;

    if (discoMode) { renderDisco(discoDayKey); queueActTextLayout(); }
    else if (campingMode) renderCamping(campingDayKey);
    else if (profileMode) { setTitle(getSettingsTitle()); renderProfile(); }
    else if (favsOnly) { setTitle({ fr: 'FAVORIS', en: 'FAVORITES', zh: '收藏' }[currentLang] || 'FAVORIS'); renderFavsMode(normalDayKey); }
    updateNowLine();
  }

  applyLanguageUI();
  const lightModeBtn = $('light-mode-btn');
  sunAutoMode = localStorage.getItem('sunAutoMode') === '1';

  function getScheduledSunMode() {
    const hour = getFestivalParts().hour;
    return hour >= 8 && hour < 20;
  }

  function resolveInitialSunMode() {
    return sunAutoMode ? getScheduledSunMode() : localStorage.getItem('sunMode') === '1';
  }

  let sunMode = resolveInitialSunMode();

  const applySunMode = () => {
    document.body.classList.toggle('light-mode', sunMode);
    document.body.classList.toggle('sun-mode', sunMode);
    setUtilityButtonState(lightModeBtn, true, sunMode);
    syncFullscreenSunActStyles();
  };

  applySunMode();

  lightModeBtn.addEventListener('click', e => {
    e.stopPropagation();
    sunMode = !sunMode;
    localStorage.setItem('sunMode', sunMode ? '1' : '0');
    applySunMode();
    if (profileMode) renderProfile();
  });

  const colorBtn = $('color-btn');
  const colorMenu = $('color-menu');
  const updateColorMenuBtn = () => {
    if (colorBtn) colorBtn.classList.toggle('control-active', colorMenu.classList.contains('open'));
  };
  colorBtn.addEventListener('click', e => {
    e.stopPropagation();
    colorMenu.classList.toggle('open');
    updateColorMenuBtn();
  });

  const settingsBtn = $('settings-btn');
  const bottomBar = $('bottom-bar');
  settingsBtn.addEventListener('click', e => {
    e.stopPropagation();
    if (profileMode) {
      profileMode = false;
      document.body.classList.remove('profile-mode');
      setTitle('Rampage Open Air 2026');
      showDefaultDay();
      updateProfileBtn();
    }
    const open = bottomBar.classList.toggle('settings-open');
    settingsBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    $('settings-popover').setAttribute('aria-hidden', open ? 'false' : 'true');
    if (!open) colorMenu.classList.remove('open');
    updateSettingsBtn();
    updateColorMenuBtn();
  });

  const discoBtn = $('disco-btn');
  discoBtn.addEventListener('click', e => {
    e.stopPropagation();
    if (profileMode) { profileMode = false; document.body.classList.remove('profile-mode'); updateProfileBtn(); }
    if (campingMode) { campingMode = false; document.body.classList.remove('camping-mode'); updateCampingBtn(); }

    favsOnly = false;
    secondaryStagesMode = false;
    campingStageMode = false;
    document.body.classList.remove('favs-only', 'camping-stage-mode');
    updateFavDayVisibility(DAY_KEYS);
    updateFavsBtn();
    updateStageViewBtn();

    discoMode = !discoMode;
    if (!discoMode) { stopDisco(true); return; }

    document.body.classList.add('disco-mode');
    if (easterActive !== 'disco') triggerEaster('disco');
    discoDayKey = getDiscoDay();
    setActiveDay(discoDayKey);
    setTitle('Silent Disco');
    renderDisco(discoDayKey);
    queueActTextLayout();
    updateDiscoBtn();
    updateStageViewBtn();
  });

  const campingBtn = $('camping-btn');
  campingBtn.addEventListener('click', e => {
    e.stopPropagation();
    if (profileMode) { profileMode = false; document.body.classList.remove('profile-mode'); updateProfileBtn(); }
    if (discoMode) { stopDisco(false); selectDefaultDay(); updateDiscoBtn(); }

    favsOnly = false;
    secondaryStagesMode = false;
    campingStageMode = false;
    document.body.classList.remove('favs-only', 'camping-stage-mode');
    updateFavDayVisibility(DAY_KEYS);
    updateFavsBtn();
    updateStageViewBtn();

    campingMode = !campingMode;
    document.body.classList.toggle('camping-mode', campingMode);
    if (campingMode) {
      updateCampingBtn();
      campingDayKey = normalDayKey;
      setActiveDay(campingDayKey);
      renderCamping(campingDayKey);
      updateStageViewBtn();
      return;
    }

    showDefaultDay();
    updateCampingBtn();
    updateStageViewBtn();
  });

  profileCampingEnabled    = localStorage.getItem('profileCamping')    !== '0';
  profileDiscoEnabled      = localStorage.getItem('profileDisco')      !== '0';
  profileDancefloorEnabled = localStorage.getItem('profileDancefloor') !== '0';
  profileEnabledDays = JSON.parse(localStorage.getItem('profileEnabledDays') || '["jeudi","vendredi","samedi","dimanche"]');
  fsShowTitles = localStorage.getItem('fsShowTitles') !== '0';
  fsShowDay = localStorage.getItem('fsShowDay') !== '0';
  fsShowDate = localStorage.getItem('fsShowDate') !== '0';
  sunAutoMode = localStorage.getItem('sunAutoMode') === '1';
  showRemainingOnly = localStorage.getItem('showRemainingOnly') !== '0';
  fsRemainingOnly = localStorage.getItem('fsRemainingOnly') === '1';
  showFavFillActs = localStorage.getItem('showFavFillActs') !== '0';
  document.body.classList.toggle('remaining-only', showRemainingOnly);

  function applyFullscreenVisibilityPrefs() {
    document.body.classList.toggle('fs-hide-titles', !fsShowTitles);
    document.body.classList.toggle('fs-hide-day', !fsShowDay);
    document.body.classList.toggle('fs-hide-date', !fsShowDate);
  }
  applyFullscreenVisibilityPrefs();

  function setBottomSlotVisible(btn, visible) {
    if (!btn) return;
    btn.style.display = 'flex';
    btn.style.visibility = visible ? 'visible' : 'hidden';
    btn.style.pointerEvents = visible ? 'auto' : 'none';
  }

  function isPlainScheduleView() {
    return !profileMode && !discoMode && !campingMode && !favsOnly;
  }

  function getNextStageViewState() {
    const activeDay = document.querySelector('.day-item.active')?.dataset.day || normalDayKey;
    const cycle = getStageViewCycleStages(activeDay);
    const current = getCurrentStageViewState();
    return cycle[(Math.max(0, cycle.indexOf(current)) + 1) % cycle.length] || 'primary';
  }

  function getStageViewIconSvg(targetState) {
    const bars = {
      primary: [
        { x: 2, width: 2.8 },
        { x: 6.3, width: 2.8 },
        { x: 10.6, width: 2.8 },
        { x: 14.9, width: 2.8 },
        { x: 19.2, width: 2.8 },
      ],
      secondary: [
        { x: 3, width: 5 },
        { x: 9.5, width: 5 },
        { x: 16, width: 5 },
      ],
      camping: [
        { x: 8.75, width: 6.5 },
      ],
    }[targetState] || [
      { x: 3, width: 5 },
      { x: 9.5, width: 5 },
      { x: 16, width: 5 },
    ];

    const rects = bars.map(bar => `<rect x="${bar.x}" y="4" width="${bar.width}" height="16" rx="1"/>`).join('');
    return `<svg width="92" height="92" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${rects}</svg>`;
  }

  function updateStageViewIcon(btn, targetState) {
    if (!btn || btn.dataset.stageIconTarget === targetState) return;
    btn.dataset.stageIconTarget = targetState;
    btn.innerHTML = getStageViewIconSvg(targetState);
  }

  function getStageViewTargetLabel() {
    const next = getNextStageViewState();
    const labels = {
      primary: { fr: 'Scènes principales', en: 'Main stages', zh: '主舞台' },
      secondary: { fr: 'Scènes secondaires', en: 'Secondary stages', zh: '副舞台' },
      camping: { fr: 'Camping', en: 'Camping', zh: '营地' },
    };
    return labels[next]?.[currentLang] || labels[next]?.fr || 'Camping';
  }

  function updateStageViewBtn() {
    const btn = $('stage-view-btn');
    if (!btn) return;
    const inSchedule = isPlainScheduleView();
    const activeDay = document.querySelector('.day-item.active')?.dataset.day || normalDayKey;
    const cycle = getStageViewCycleStages(activeDay);
    const hasExtraView = cycle.length > 1;
    const canUseStageView = inSchedule && hasExtraView;

    if (!profileCampingEnabled && campingStageMode) {
      campingStageMode = false;
      secondaryStagesMode = hasSecondaryStages(activeDay);
    }
    if (inSchedule && !hasExtraView) setStageViewState('primary');
    if (campingStageMode) secondaryStagesMode = false;

    const currentState = getCurrentStageViewState();
    const isExtraView = canUseStageView && currentState !== 'primary';
    document.body.classList.toggle('secondary-stages-mode', canUseStageView && secondaryStagesMode);
    document.body.classList.toggle('camping-stage-mode', canUseStageView && campingStageMode);
    setUtilityButtonState(btn, canUseStageView, isExtraView);
    updateCrossSceneIndicators();
    btn.disabled = inSchedule && !hasExtraView;
    btn.setAttribute('aria-disabled', btn.disabled ? 'true' : 'false');
    const targetState = getNextStageViewState();
    updateStageViewIcon(btn, targetState);
    const label = getStageViewTargetLabel();
    btn.setAttribute('aria-label', label);
    btn.title = label;
  }


  function returnToPrimaryScheduleFromAnyMode() {
    const activeDay = document.querySelector('.day-item.active')?.dataset.day;
    if (activeDay && DAY_KEYS.includes(activeDay)) normalDayKey = activeDay;

    if (profileMode) { profileMode = false; document.body.classList.remove('profile-mode'); updateProfileBtn(); }
    if (discoMode) { stopDisco(false); }
    if (campingMode) { campingMode = false; document.body.classList.remove('camping-mode'); updateCampingBtn(); }
    if (favsOnly) { favsOnly = false; document.body.classList.remove('favs-only', 'camping-stage-mode'); updateFavsBtn(); }

    secondaryStagesMode = false;
    campingStageMode = false;
    updateFavDayVisibility(DAY_KEYS);
    setTitle('Rampage Open Air 2026');
    setActiveDay(normalDayKey);
    if (!normalActTextLayoutsReady) precomputeNormalDayTextLayouts(normalDayKey);
    else renderDay(normalDayKey);
    updateDiscoBtn();
    updateCampingBtn();
    updateFavsBtn();
    updateStageViewBtn();
  }

  function applyProfileState() {
    const cBtn = $('camping-btn');
    const dBtn = $('disco-btn');
    setBottomSlotVisible(cBtn, profileCampingEnabled);
    setBottomSlotVisible(dBtn, profileCampingEnabled && profileDiscoEnabled);

    if (!profileCampingEnabled && campingMode) {
      campingMode = false;
      document.body.classList.remove('camping-mode');
      updateCampingBtn();
      if (!profileMode) showDefaultDay();
    }
    if (!profileCampingEnabled && campingStageMode) {
      campingStageMode = false;
      secondaryStagesMode = hasSecondaryStages(normalDayKey);
      if (!profileMode && isPlainScheduleView()) renderDay(normalDayKey);
    }
    if ((!profileCampingEnabled || !profileDiscoEnabled) && discoMode) {
      stopDisco(!profileMode);
    }
    updateStageViewBtn();
  }

  let langPressTimer = null;
  let langDidLong = false;
  let manualLangEaster = null;

  function isLangAction(action) {
    return action && action.startsWith('lang-');
  }

  function clearLangPressTimer() {
    if (!langPressTimer) return;
    clearTimeout(langPressTimer);
    langPressTimer = null;
  }

  function bindProfileLangEasters(col) {
    col.addEventListener('contextmenu', e => {
      if (e.target.closest('[data-profile-action^="lang-"]')) e.preventDefault();
    });

    col.addEventListener('pointerdown', e => {
      const btn = e.target.closest('[data-profile-action^="lang-"]');
      if (!btn) return;

      clearLangPressTimer();
      langDidLong = false;

      const code = btn.dataset.profileAction.slice(5);
      try { btn.setPointerCapture(e.pointerId); } catch (err) {}

      langPressTimer = setTimeout(() => {
        langPressTimer = null;
        langDidLong = true;
        manualLangEaster = code;
        triggerEaster(code);
      }, 5000);
    });

    ['pointerup', 'pointercancel', 'pointerleave'].forEach(type => {
      col.addEventListener(type, clearLangPressTimer);
    });
  }

  function renderProfile() {
    const stageRow = $('stage-row'), tl = $('tl'), axis = $('axis');
    clearSchedule(stageRow, axis, tl);
    setScheduleGrid(stageRow, tl, '60px 1fr');
    stageRow.appendChild(buildStageHeaderFragment([{ name: getSettingsTitle(), sub: '' }], s => buildStageHeader(s.name, s.sub)));

    const tr = (map, fallback = '') => (map && (map[currentLang] || map.fr)) || fallback;
    const labels = {
      sections: {
        display: { fr: 'AFFICHAGE', en: 'DISPLAY', zh: '显示' },
        lang: { fr: 'LANGUE', en: 'LANGUAGE', zh: '语言' },
        fullscreen: { fr: 'PLEIN ÉCRAN/FOND D’ÉCRAN', en: 'FULLSCREEN/WALLPAPER', zh: '全屏/壁纸' },
        view: { fr: 'JOURNÉE', en: 'DAY VIEW', zh: '日程' },
        favFill: { fr: 'FAVORIS', en: 'FAVORITES', zh: '收藏' },
        sun: { fr: 'SOLEIL', en: 'SUN', zh: '阳光' },
        filters: { fr: 'FILTRES', en: 'FILTERS', zh: '筛选' },
        data: { fr: 'DONNÉES', en: 'DATA', zh: '数据' },
      },
      features: {
        camping: { fr: 'CAMPING', en: 'CAMPING', zh: '营地' },
        disco: { fr: 'SILENT DISCO', en: 'SILENT DISCO', zh: '无声迪斯科' },
        dancefloor: { fr: 'DANCEFLOOR', en: 'DANCEFLOOR', zh: '舞池' },
        update: { fr: 'UPDATE', en: 'UPDATE', zh: '更新' },
      },
      view: {
        full: { fr: 'COMPLÈTE', en: 'FULL DAY', zh: '整天' },
        remaining: { fr: 'À VENIR', en: 'UPCOMING', zh: '剩余' },
      },
      favFill: {
        off: { fr: 'SEULS', en: 'ONLY', zh: '仅收藏' },
        on: { fr: 'REMPLIR', en: 'FILL', zh: '填充' },
      },
      sun: {
        auto: { fr: 'AUTO (8H-20H)', en: 'AUTO (8AM-8PM)', zh: '自动 (8点-20点)' },
      },
      days: {
        jeudi: { fr: 'JEUDI', en: 'THURSDAY', zh: '周四' },
        vendredi: { fr: 'VENDREDI', en: 'FRIDAY', zh: '周五' },
        samedi: { fr: 'SAMEDI', en: 'SATURDAY', zh: '周六' },
        dimanche: { fr: 'DIMANCHE', en: 'SUNDAY', zh: '周日' },
      },
      fs: {
        titles: { fr: 'TITRES', en: 'TITLES', zh: '标题' },
        day: { fr: 'JOUR', en: 'DAY', zh: '星期' },
        date: { fr: 'DATE', en: 'DATE', zh: '日期' },
        view: { fr: 'VUE', en: 'VIEW', zh: '视图' },
      },
    };

    const col = document.createElement('div');
    col.className = 'stage-col profile-mode-col';

    const makeBtn = (className, action, text, active, disabled = false) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = className + (active ? ' active' : '') + (disabled ? ' feat-disabled' : '');
      btn.dataset.profileAction = action;
      btn.textContent = text;
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
      if (disabled) {
        btn.disabled = true;
        btn.setAttribute('aria-disabled', 'true');
      }
      return btn;
    };
    const makeSection = (key, rows, titleId = '') => {
      const section = document.createElement('div');
      section.className = 'profile-mode-section';
      const title = document.createElement('div');
      title.className = 'profile-mode-section-title';
      if (titleId) title.id = titleId;
      title.textContent = tr(labels.sections[key]);
      section.append(title, ...rows);
      col.appendChild(section);
    };
    const makeRow = (items, className = 'profile-mode-row') => {
      const row = document.createElement('div');
      row.className = className;
      items.forEach(item => row.appendChild(makeBtn(...item)));
      return row;
    };
    const makeTitledButtonColumn = (titleText, btnSpec) => {
      const block = document.createElement('div');
      block.className = 'profile-mode-setting-col';
      const title = document.createElement('div');
      title.className = 'profile-mode-section-title';
      title.textContent = titleText;
      block.append(title, makeBtn(...btnSpec));
      return block;
    };
    const makeDualSettingsRow = () => {
      const row = document.createElement('div');
      row.className = 'profile-mode-dual-settings-row';
      row.append(
        makeTitledButtonColumn(tr(labels.sections.view), ['profile-mode-sun-btn profile-mode-choice-btn', 'remaining-view', showRemainingOnly ? tr(labels.view.remaining) : tr(labels.view.full), true]),
        makeTitledButtonColumn(tr(labels.sections.favFill), ['profile-mode-sun-btn', 'fav-fill', showFavFillActs ? tr(labels.favFill.on) : tr(labels.favFill.off), showFavFillActs]),
        makeTitledButtonColumn(tr(labels.sections.sun), ['profile-mode-sun-btn', 'sun-auto', tr(labels.sun.auto), sunAutoMode])
      );
      return row;
    };

    makeSection('display', [
      makeRow([
        ['profile-mode-feat-btn', 'camping', tr(labels.features.camping), profileCampingEnabled],
        ['profile-mode-feat-btn', 'disco', tr(labels.features.disco), profileDiscoEnabled, !profileCampingEnabled],
      ]),
      makeRow(DAY_KEYS.map(day => ['profile-mode-day-btn', 'day-' + day, tr(labels.days[day], day), profileEnabledDays.includes(day)])),
    ]);
    makeSection('lang', [makeRow([['fr','FR'],['en','EN'],['zh','ZH']].map(([code, label]) => ['profile-mode-day-btn', 'lang-' + code, label, currentLang === code]))]);
    makeSection('fullscreen', [makeRow([
      ['profile-mode-day-btn', 'fs-titles', tr(labels.fs.titles), fsShowTitles],
      ['profile-mode-day-btn', 'fs-day', tr(labels.fs.day), fsShowDay],
      ['profile-mode-day-btn', 'fs-date', tr(labels.fs.date), fsShowDate],
      ['profile-mode-day-btn profile-mode-choice-btn', 'fs-view', fsRemainingOnly ? tr(labels.view.remaining) : tr(labels.view.full), true],
    ])]);
    col.appendChild(makeDualSettingsRow());
    makeSection('filters', [makeRow([
      ['profile-mode-day-btn', 'dancefloor', tr(labels.features.dancefloor), !profileDancefloorEnabled],
    ], 'profile-mode-row profile-mode-filter-row')]);
    makeSection('data', [makeRow([
      ['profile-mode-sun-btn profile-mode-update-btn', 'sheet-refresh', tr(labels.features.update), !sheetRefreshBusy],
    ], 'profile-mode-row profile-mode-update-row')], 'sheet-status');

    tl.appendChild(col);
    setSheetStatus();
    setSheetRefreshBusy(sheetRefreshBusy);
    col.addEventListener('click', handleProfileAction);
    bindProfileLangEasters(col);
    updateResetBtn();
  }

  function toggleStoredFlag(key, value) {
    localStorage.setItem(key, value ? '1' : '0');
  }

  function handleProfileAction(e) {
    const btn = e.target.closest('[data-profile-action]');
    if (!btn) return;
    const action = btn.dataset.profileAction;
    const rerender = () => renderProfile();

    if (action === 'fs-titles') { fsShowTitles = !fsShowTitles; toggleStoredFlag('fsShowTitles', fsShowTitles); applyFullscreenVisibilityPrefs(); return rerender(); }
    if (action === 'fs-day')    { fsShowDay = !fsShowDay;       toggleStoredFlag('fsShowDay', fsShowDay);       applyFullscreenVisibilityPrefs(); return rerender(); }
    if (action === 'fs-date')   { fsShowDate = !fsShowDate;     toggleStoredFlag('fsShowDate', fsShowDate);     applyFullscreenVisibilityPrefs(); return rerender(); }
    if (action === 'fs-view') {
      fsRemainingOnly = !fsRemainingOnly;
      toggleStoredFlag('fsRemainingOnly', fsRemainingOnly);
      return rerender();
    }
    if (action === 'remaining-view') {
      showRemainingOnly = !showRemainingOnly;
      toggleStoredFlag('showRemainingOnly', showRemainingOnly);
      document.body.classList.toggle('remaining-only', showRemainingOnly);
      return rerender();
    }
    if (action === 'fav-fill') {
      showFavFillActs = !showFavFillActs;
      toggleStoredFlag('showFavFillActs', showFavFillActs);
      return rerender();
    }
    if (action === 'sun-auto') {
      sunAutoMode = !sunAutoMode;
      toggleStoredFlag('sunAutoMode', sunAutoMode);
      if (sunAutoMode) sunMode = getScheduledSunMode();
      toggleStoredFlag('sunMode', sunMode);
      applySunMode();
      return rerender();
    }
    if (action === 'camping') {
      profileCampingEnabled = !profileCampingEnabled;
      toggleStoredFlag('profileCamping', profileCampingEnabled);
      applyProfileState();
      return rerender();
    }
    if (action === 'disco') {
      if (!profileCampingEnabled) return;
      profileDiscoEnabled = !profileDiscoEnabled;
      toggleStoredFlag('profileDisco', profileDiscoEnabled);
      applyProfileState();
      return rerender();
    }
    if (action === 'dancefloor') {
      profileDancefloorEnabled = !profileDancefloorEnabled;
      toggleStoredFlag('profileDancefloor', profileDancefloorEnabled);
      btn.classList.toggle('active', !profileDancefloorEnabled);
      btn.setAttribute('aria-pressed', !profileDancefloorEnabled ? 'true' : 'false');
      if (!profileMode) rerenderSchedule();
      return rerender();
    }
    if (action === 'sheet-refresh') {
      if (sheetRefreshBusy) return;
      refreshSheetManually();
      return;
    }
    if (isLangAction(action)) {
      const code = action.slice(5);
      if (langDidLong) { langDidLong = false; return; }

      if (manualLangEaster && easterActive === manualLangEaster) {
        triggerEaster(manualLangEaster);
        manualLangEaster = null;
        if (code === currentLang) return rerender();
      }

      setLanguage(code, false);
      setTitle(getSettingsTitle());
      return rerender();
    }
    if (action.startsWith('day-')) {
      const day = action.slice(4);
      const idx = profileEnabledDays.indexOf(day);
      if (idx === -1) profileEnabledDays.push(day);
      else if (profileEnabledDays.length > 1) profileEnabledDays.splice(idx, 1);
      profileEnabledDays.sort((a, b) => DAY_KEYS.indexOf(a) - DAY_KEYS.indexOf(b));
      localStorage.setItem('profileEnabledDays', JSON.stringify(profileEnabledDays));
      updateFavDayVisibility();
      if (!profileEnabledDays.includes(normalDayKey)) {
        const first = DAY_KEYS.find(d => profileEnabledDays.includes(d));
        if (first) { normalDayKey = first; setActiveDay(first); }
      }
      applyProfileState();
      return rerender();
    }
  }

  function updateProfileBtn() {
    setUtilityButtonState($('profile-btn'), true, profileMode);
  }

  applyProfileState();

  const profileBtn = $('profile-btn');
  profileBtn.addEventListener('click', e => {
    e.stopPropagation();
    profileMode = !profileMode;
    document.body.classList.toggle('profile-mode', profileMode);

    if (profileMode) {
      if (bottomBar) bottomBar.classList.remove('settings-open');
      if (settingsBtn) settingsBtn.setAttribute('aria-expanded', 'false');
      const popover = $('settings-popover');
      if (popover) popover.setAttribute('aria-hidden', 'true');
      if (colorMenu) colorMenu.classList.remove('open');
      updateSettingsBtn();
      updateColorMenuBtn();
      if (discoMode)   { stopDisco(false); }
      if (campingMode) { campingMode = false; document.body.classList.remove('camping-mode'); updateCampingBtn(); }
      if (favsOnly)    { favsOnly = false; document.body.classList.remove('favs-only', 'camping-stage-mode'); updateFavsBtn(); updateFavDayVisibility(); }
      secondaryStagesMode = false;
      campingStageMode = false;
      updateStageViewBtn();
      setTitle(getSettingsTitle());
      renderProfile();
    } else {
      setTitle('Rampage Open Air 2026');
      showDefaultDay();
    }
    updateProfileBtn();
  });

  const favsBtn = $('favs-btn');
  favsBtn.addEventListener('click', e => {
    e.stopPropagation();
    if (profileMode) { profileMode = false; document.body.classList.remove('profile-mode'); updateProfileBtn(); }
    favsOnly = !favsOnly;
    document.body.classList.toggle('favs-only', favsOnly);
    secondaryStagesMode = false;
    campingStageMode = false;
    if (favsOnly) {
      setTitle({ fr: 'FAVORIS', en: 'FAVORITES', zh: '收藏' }[currentLang] || 'FAVORIS');
      renderFavsMode(normalDayKey);
    } else {
      setTitle('Rampage Open Air 2026');
      updateFavDayVisibility();
      renderDay(normalDayKey);
    }
    updateFavsBtn();
    updateStageViewBtn();
  });

  const stageViewBtn = $('stage-view-btn');
  if (stageViewBtn) {
    stageViewBtn.addEventListener('click', e => {
      e.stopPropagation();
      if (!isPlainScheduleView()) {
        returnToPrimaryScheduleFromAnyMode();
        return;
      }
      const cycle = getStageViewCycleStages(normalDayKey);
      if (cycle.length < 2) {
        updateStageViewBtn();
        return;
      }
      const currentState = getCurrentStageViewState();
      const currentIndex = Math.max(0, cycle.indexOf(currentState));
      setStageViewState(cycle[(currentIndex + 1) % cycle.length]);
      setTitle('Rampage Open Air 2026');
      const visibleDays = (secondaryStagesMode || campingStageMode)
        ? DAY_KEYS.filter(day => getStageViewCycleStages(day).includes(getCurrentStageViewState()))
        : DAY_KEYS;
      updateFavDayVisibility(visibleDays);
      if ((secondaryStagesMode || campingStageMode) && !visibleDays.includes(normalDayKey)) {
        normalDayKey = visibleDays[0] || 'vendredi';
      }
      setActiveDay(normalDayKey);
      if (!normalActTextLayoutsReady) precomputeNormalDayTextLayouts(normalDayKey);
      else renderDay(normalDayKey);
      updateStageViewBtn();
    });
    updateStageViewBtn();
  }
  document.addEventListener('favschange', () => { updateStageViewBtn(); updateCrossSceneIndicators(); });

  document.addEventListener('click', () => {
    colorMenu.classList.remove('open');
    updateColorMenuBtn();
  });
  function applyColorOption(opt) {
    accentColor = opt.dataset.accent;
    accentBg = opt.dataset.bg;
    accentBorder = opt.dataset.border;
    colorMenu.classList.remove('open');
    updateColorMenuBtn();
    applyAccentToElements();
    syncColorOptions();
    saveColorPreference(opt.dataset.glow);
  }

  document.querySelectorAll('.color-option').forEach(opt => {
    opt.addEventListener('click', e => {
      e.stopPropagation();
      applyColorOption(opt);
    });
  });

  let fullscreenZoom = 1;
  let fullscreenPanX = 0;
  let fullscreenPanY = 0;
  let pinchStartDistance = 0;
  let pinchStartZoom = 1;
  let panStartX = 0;
  let panStartY = 0;
  let panStartTouchX = 0;
  let panStartTouchY = 0;
  let suppressNextExitClick = false;
  let fullscreenBaseScale = 1;

  function clampFullscreenZoom(value) {
    return clampValue(value, 0.55, 1);
  }

  function touchDistance(touches) {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.hypot(dx, dy);
  }

  function clampValue(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function isPhoneLikeFullscreenViewport(vw, vh) {
    const portrait = vh > vw * 1.35;
    const narrow = vw <= 560;
    const mobileUA = /Android|iPhone|iPod|Mobile/i.test(navigator.userAgent || '');
    const coarsePointer = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
    return portrait && (narrow || mobileUA || coarsePointer);
  }

  function applyFullscreenCapturePads(isFS, isPhoneCapture, virtualH) {
    const root = document.documentElement;
    if (!isFS || !isPhoneCapture) {
      root.style.setProperty('--fs-pad-top', '25px');
      root.style.setProperty('--fs-pad-right', '62px');
      root.style.setProperty('--fs-pad-bottom', '100px');
      root.style.setProperty('--fs-pad-left', '62px');
      return;
    }

    const topPad = Math.round(clampValue(virtualH * 0.055, 90, 135));
    const bottomPad = Math.round(clampValue(virtualH * 0.048, 95, 135));
    const sidePad = 65;

    root.style.setProperty('--fs-pad-top', topPad + 'px');
    root.style.setProperty('--fs-pad-right', sidePad + 'px');
    root.style.setProperty('--fs-pad-bottom', bottomPad + 'px');
    root.style.setProperty('--fs-pad-left', sidePad + 'px');
  }

  function clampFullscreenPan(displayScale, vw, vh, virtualH = 1920) {
    const scaledW = 1080 * displayScale;
    const scaledH = virtualH * displayScale;
    const maxX = Math.max(0, (scaledW - vw) / 2);
    const maxY = Math.max(0, (scaledH - vh) / 2);
    fullscreenPanX = Math.max(-maxX, Math.min(maxX, fullscreenPanX));
    fullscreenPanY = Math.max(-maxY, Math.min(maxY, fullscreenPanY));
  }
  function applyScale() {
    const scaler = $('scaler');
    const vv = window.visualViewport;
    const vw = (vv && vv.width)  ? vv.width  : window.innerWidth;
    const vh = (vv && vv.height) ? vv.height : window.innerHeight;
    const baseW = 1080;
    const baseH = 1920;
    const viewportScale = Math.min(vw / baseW, vh / baseH);
    const isFS = document.body.classList.contains('is-fullscreen');
    const phoneCaptureFS = isFS && isPhoneLikeFullscreenViewport(vw, vh);
    let virtualH = baseH;
    let displayScale = viewportScale;
    let left = Math.max(CANVAS_MARGIN, (vw - baseW * displayScale) / 2);
    let top = Math.max(CANVAS_MARGIN, (vh - baseH * displayScale) / 2);

    if (!isFS) {
      fullscreenBaseScale = viewportScale;
      fullscreenPanX = 0;
      fullscreenPanY = 0;
    } else if (phoneCaptureFS) {
      const phoneBaseScale = vw / baseW;
      virtualH = Math.max(baseH, Math.ceil(vh / phoneBaseScale));
      displayScale = phoneBaseScale * fullscreenZoom;
      fullscreenPanX = 0;
      fullscreenPanY = 0;
      left = (vw - baseW * displayScale) / 2;
      top = (vh - virtualH * displayScale) / 2;
    } else {
      const fsMaxScale = Math.min(fullscreenBaseScale, (vh - CANVAS_MARGIN * 2) / baseH, (vw - CANVAS_MARGIN * 2) / baseW);
      displayScale = fsMaxScale * fullscreenZoom;
      clampFullscreenPan(displayScale, vw, vh, baseH);
      left = Math.max(CANVAS_MARGIN, (vw - baseW * displayScale) / 2) + fullscreenPanX;
      top = Math.max(CANVAS_MARGIN, (vh - baseH * displayScale) / 2) + fullscreenPanY;
    }

    applyFullscreenCapturePads(isFS, phoneCaptureFS, virtualH);

    scaler.style.width = baseW + 'px';
    scaler.style.height = virtualH + 'px';
    scaler.style.transform = `scale(${displayScale})`;
    scaler.style.left = left + 'px';
    scaler.style.top  = top + 'px';
  }

  function syncFullscreenSunActStyles() {
  const forceNeutral = document.body.classList.contains('sun-mode')
    && document.body.classList.contains('is-fullscreen')
    && !document.body.classList.contains('disco-mode');

  document.querySelectorAll('.act:not(.selected)').forEach(act => {
    if (forceNeutral) {
      act.style.setProperty('background', '#ffffff', 'important');
      act.style.setProperty('background-color', '#ffffff', 'important');
      act.style.setProperty('background-image', 'none', 'important');
      act.style.setProperty('opacity', '1', 'important');
      act.style.setProperty('filter', 'none', 'important');
      return;
    }
    act.style.removeProperty('background');
    act.style.removeProperty('background-color');
    act.style.removeProperty('background-image');
    act.style.removeProperty('opacity');
    act.style.removeProperty('filter');
  });
}

function refreshFullscreenState() {
  updateEasterVisualBoost();
  updateNowLine();
  syncFullscreenSunActStyles();
}

  let responsiveLayoutRAF = 0;
  function queueResponsiveLayout() {
    cancelAnimationFrame(responsiveLayoutRAF);
    responsiveLayoutRAF = requestAnimationFrame(applyScale);
  }

  applyScale();
  window.addEventListener('resize', queueResponsiveLayout);
  if (window.visualViewport) window.visualViewport.addEventListener('resize', queueResponsiveLayout);
  document.addEventListener('touchstart', e => {
    if (!document.body.classList.contains('is-fullscreen')) return;

    const vv = window.visualViewport;
    const vw = (vv && vv.width) ? vv.width : window.innerWidth;
    const vh = (vv && vv.height) ? vv.height : window.innerHeight;
    if (isPhoneLikeFullscreenViewport(vw, vh) && e.touches.length !== 2) {
      resetFullscreenCaptureTransform();
      return;
    }

    if (e.touches.length === 2) {
      pinchStartDistance = touchDistance(e.touches);
      pinchStartZoom = fullscreenZoom;
      e.preventDefault();
      return;
    }

    if (e.touches.length === 1) {
      panStartTouchX = e.touches[0].clientX;
      panStartTouchY = e.touches[0].clientY;
      panStartX = fullscreenPanX;
      panStartY = fullscreenPanY;
    }
  }, { passive: false });

  document.addEventListener('touchmove', e => {
    if (!document.body.classList.contains('is-fullscreen')) return;

    const vv = window.visualViewport;
    const vw = (vv && vv.width) ? vv.width : window.innerWidth;
    const vh = (vv && vv.height) ? vv.height : window.innerHeight;
    if (isPhoneLikeFullscreenViewport(vw, vh) && e.touches.length !== 2) {
      resetFullscreenCaptureTransform();
      applyScale();
      e.preventDefault();
      return;
    }

    if (e.touches.length === 2 && pinchStartDistance) {
      fullscreenZoom = clampFullscreenZoom(pinchStartZoom * (touchDistance(e.touches) / pinchStartDistance));
      suppressNextExitClick = true;
      applyScale();
      e.preventDefault();
      return;
    }

    if (e.touches.length === 1) {
      const dx = e.touches[0].clientX - panStartTouchX;
      const dy = e.touches[0].clientY - panStartTouchY;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) suppressNextExitClick = true;
      fullscreenPanX = panStartX + dx;
      fullscreenPanY = panStartY + dy;
      applyScale();
      e.preventDefault();
    }
  }, { passive: false });

  document.addEventListener('touchend', e => {
    if (e.touches.length < 2) pinchStartDistance = 0;
  });

  const fsBtn = $('fs-btn');
  let appFS = false;

  function syncFullscreenLayout() {
    requestAnimationFrame(() => {
      applyScale();
      if (document.body.classList.contains('is-fullscreen')) queueActTextLayout();
      requestAnimationFrame(() => {
        applyScale();
        if (document.body.classList.contains('is-fullscreen')) queueActTextLayout();
      });
    });
  }

  function resetFullscreenCaptureTransform() {
    fullscreenZoom = 1;
    fullscreenPanX = 0;
    fullscreenPanY = 0;
    pinchStartDistance = 0;
  }

  function enterFS() {
    appFS = true;
    resetFullscreenCaptureTransform();
    document.body.classList.add('is-fullscreen');
    if (!profileMode && !discoMode && !campingMode && !favsOnly) renderDay(normalDayKey);
    applyScale();
    refreshFullscreenState();
    updateFullscreenBtn();
    applyAccentToElements();
    syncFullscreenLayout();
    setTimeout(refreshFullscreenState, 0);
    document.addEventListener('click', exitOnClick);
    const el = document.documentElement;
    const req = el.requestFullscreen || el.webkitRequestFullscreen || el.mozRequestFullScreen;
    if (req) {
      const fsRequest = req.call(el);
      if (fsRequest && typeof fsRequest.then === 'function') fsRequest.then(() => { syncFullscreenLayout(); refreshFullscreenState(); }).catch(() => {});
      else { syncFullscreenLayout(); refreshFullscreenState(); }
    }
  }

  function leaveFS() {
    appFS = false;
    document.body.classList.remove('is-fullscreen', 'fs-safe-guides');
    if (!profileMode && !discoMode && !campingMode && !favsOnly) renderDay(normalDayKey);
    resetFullscreenCaptureTransform();
    applyScale();
    refreshFullscreenState();
    setTimeout(refreshFullscreenState, 0);
    updateFullscreenBtn();
    applyAccentToElements();
    queueActTextLayout();
    document.removeEventListener('click', exitOnClick);
    const exit = document.exitFullscreen || document.webkitExitFullscreen || document.mozCancelFullScreen;
    if (exit && (document.fullscreenElement || document.webkitFullscreenElement)) exit.call(document).catch(() => {});
  }

  fsBtn.addEventListener('click', e => {
    e.stopPropagation();
    appFS ? leaveFS() : enterFS();
  });

  function onFSChange() {
    const nativeFS = !!(document.fullscreenElement || document.webkitFullscreenElement);
    if (nativeFS && appFS) { syncFullscreenLayout(); return; }
    if (!nativeFS && appFS) leaveFS();
  }
  document.addEventListener('fullscreenchange', onFSChange);
  document.addEventListener('webkitfullscreenchange', onFSChange);

  let fsSafeGuideTimer = null;
  function clearFsSafeGuideTimer() {
    clearTimeout(fsSafeGuideTimer);
    fsSafeGuideTimer = null;
  }
  $('current-date')?.addEventListener('pointerdown', () => {
    if (!document.body.classList.contains('is-fullscreen')) return;
    clearFsSafeGuideTimer();
    fsSafeGuideTimer = setTimeout(() => {
      document.body.classList.toggle('fs-safe-guides');
      suppressNextExitClick = true;
    }, 900);
  });
  ['pointerup', 'pointercancel', 'pointerleave'].forEach(type => {
    $('current-date')?.addEventListener(type, clearFsSafeGuideTimer);
  });

  const resetBtn = $('reset-btn');
  const resetLabel = $('reset-label');
  let resetStep = 0, resetTimer = null;
  const resetDeactivate = () => {
    resetStep = 0;
    resetBtn.style.borderColor = 'rgba(255,255,255,0.68)';
    resetBtn.style.background = 'rgba(255,255,255,0.24)';
    resetLabel.style.display = 'none';
  };
  updateResetBtn();
  resetBtn.addEventListener('click', e => {
    e.stopPropagation();
    clearTimeout(resetTimer);
    if (resetStep === 0) {
      resetStep = 1;
      resetBtn.style.borderColor = '#ff4444';
      resetBtn.style.background = '#ff000022';
      resetLabel.textContent = 'RESET?';
      resetLabel.style.display = 'block';
      resetTimer = setTimeout(resetDeactivate, 5000);
    } else if (resetStep === 1) {
      resetStep = 2;
      resetLabel.textContent = 'SURE?';
      resetTimer = setTimeout(resetDeactivate, 5000);
    } else {
      resetDeactivate();

      ['favs','rs_unlocked','color','lang','sunMode','sunAutoMode','showRemainingOnly','fsRemainingOnly','showFavFillActs','fsShowTitles','fsShowDay','fsShowDate','profileCamping','profileDisco','profileDancefloor','profileEnabledDays'].forEach(k => localStorage.removeItem(k));

      document.body.classList.remove('runescape-unlocked');
      document.querySelectorAll('.act.selected').forEach(el => {
        el.classList.remove('selected');
        clearNormalSelectedActStyle(el);
        el.style.borderLeftColor = '';
      });

      applyColorOption(document.querySelector('.color-option'));

      currentLang = 'fr';
      manualLangEaster = null;
      applyLanguageUI();
      updateDaysLeft();

      sunAutoMode = false;
      showRemainingOnly = true;
      fsRemainingOnly = false;
      showFavFillActs = true;
      document.body.classList.add('remaining-only');
      sunMode = false;
      applySunMode();

      fsShowTitles = true;
      fsShowDay = true;
      fsShowDate = true;
      applyFullscreenVisibilityPrefs();

      profileCampingEnabled    = true;
      profileDiscoEnabled      = true;
      profileDancefloorEnabled = true;
      profileEnabledDays       = ['jeudi', 'vendredi', 'samedi', 'dimanche'];
      applyProfileState();
      updateFavDayVisibility();

      if (profileMode) { profileMode = false; document.body.classList.remove('profile-mode'); updateProfileBtn(); }
      if (discoMode)   { stopDisco(false); }
      if (campingMode) { campingMode = false; document.body.classList.remove('camping-mode'); updateCampingBtn(); }
      if (favsOnly)    { favsOnly = false; document.body.classList.remove('favs-only', 'camping-stage-mode'); updateFavsBtn(); }
      setTitle('Rampage Open Air 2026');
      showDefaultDay();
      updateStageHeaderSelectionState();
      updateResetBtn();
    }
  });

  let easterActive = null;
  let preEasterState = null;
  const boostedEasterEvents = new Set(['shrek', 'alien', 'runescape', 'fr', 'en', 'zh']);

  function updateEasterVisualBoost() {
    document.body.classList.toggle(
      'easter-visual-boost',
      document.body.classList.contains('is-fullscreen') && boostedEasterEvents.has(easterActive)
    );
  }

  function applyAccentToElements() {
    setThemeVars();
    syncColorOptions();
    if (colorBtn) colorBtn.style.background = accentColor;
    paintThemedButtons();
    document.querySelectorAll('.label').forEach(el => el.style.color = accentColor);
    const dlElA = $('days-left'); if (dlElA) dlElA.style.color = accentColor;
    document.querySelectorAll('.stage-header').forEach(el => {
      el.dataset.nameColor = accentColor;
      el.style.borderTopColor = accentColor;
    });
    updateStageHeaderSelectionState();
    document.querySelectorAll('.act.selected').forEach(el => { if (!discoActColor(el)) setNormalSelectedActStyle(el); });
    const nl = $('now-line');
    if (nl) { nl.style.background = accentColor; nl.style.boxShadow = `0 0 16px ${accentColor}, 0 0 0 1px rgba(255,255,255,0.65)`; }
    document.querySelectorAll('.camping-card-active').forEach(el => el.style.borderLeftColor = accentColor);
  }

  function setEaster(mode) {
    const wasActive = easterActive;
    easterActive = easterActive === mode ? null : mode;
    Object.entries(EASTER_EVENTS).forEach(([k, cfg]) => {
      $(k + '-img').style.opacity = easterActive === k ? cfg.opacity : '0';
    });
    document.body.classList.toggle('easter-active', easterActive !== null);
    document.body.classList.toggle('runescape-active', easterActive === 'runescape');
    updateEasterVisualBoost();
    if (easterActive === 'runescape') document.body.classList.add('runescape-unlocked');
    if (easterActive) {
      const cfg = EASTER_EVENTS[easterActive];
      preEasterState = { accent: accentColor, bg: accentBg, border: accentBorder, bgFull: document.querySelector('.bg-full').style.background };
      accentColor = cfg.accent; accentBg = cfg.bg; accentBorder = cfg.border;
      document.querySelector('.bg-full').style.background = cfg.blackBg ? '#0d0d0d' : `linear-gradient(to bottom, #0d0d0d 0%, transparent 15%, transparent 85%, #0d0d0d 100%), radial-gradient(ellipse at 50% 50%, ${cfg.glow} 0%, #0d0d0d 70%)`;
      applyAccentToElements();
    } else if (wasActive && preEasterState) {
      accentColor = preEasterState.accent; accentBg = preEasterState.bg; accentBorder = preEasterState.border;
      document.querySelector('.bg-full').style.background = preEasterState.bgFull;
      applyAccentToElements();
      preEasterState = null;
    }
  }

  const manuallyTriggered = new Set();
  function triggerEaster(key) {
    const wasActive = easterActive === key;
    if (wasActive) manuallyTriggered.delete(key);
    else manuallyTriggered.add(key);
    setEaster(key);
    const cfg = EASTER_EVENTS[key];
    if (cfg.comic) { $('scaler').classList.toggle('comic-sans', !wasActive); }
  }

  let shrekClicks = 0, shrekTimer;
  let comicClicks = 0, comicTimer;
  let runeClicks = 0, runeTimer;
  const easterLabel = document.querySelector('.label');
  const easterDate = $('current-date');

  document.addEventListener('pointerdown', (e) => {
    if (e.target.closest('.label')) {
      if (shrekClicks === 0) shrekTimer = setTimeout(() => shrekClicks = 0, 5000);
      shrekClicks++;
      easterLabel.style.color = '#fff';
      setTimeout(() => easterLabel.style.color = accentColor, 200);
      if (shrekClicks >= 5) { shrekClicks = 0; clearTimeout(shrekTimer); triggerEaster('shrek'); }
    }
    if (e.target.closest('#current-date')) {
      if (comicClicks === 0) comicTimer = setTimeout(() => comicClicks = 0, 5000);
      comicClicks++;
      easterDate.style.color = '#fff';
      setTimeout(() => easterDate.style.color = '', 200);
      if (comicClicks >= 5) { comicClicks = 0; clearTimeout(comicTimer); triggerEaster('alien'); }
    }
  });

  document.addEventListener('click', e => {
    const act = e.target.closest('.act');
    if (!act || act.querySelector('.act-name')?.textContent.trim() !== 'RuneScape Rave') return;
    if (runeClicks === 0) runeTimer = setTimeout(() => runeClicks = 0, 5000);
    runeClicks++;
    if (runeClicks >= 6) {
      runeClicks = 0; clearTimeout(runeTimer);
      localStorage.setItem('rs_unlocked', '1');
      document.body.classList.add('runescape-unlocked');
      triggerEaster('runescape');
    }
  });

  (() => {
    const p = getFestivalParts();
    const h = p.hour, m = p.minute;
    const nowMins = h * 60 + m;
    const todayStr = ymd();
    let exactKey = null, windowKey = null;
    Object.entries(EASTER_EVENTS).forEach(([key, cfg]) => {
      if (cfg.activeDates && !cfg.activeDates.includes(todayStr)) return;
      const inWindow = cfg.triggers.some(t => nowMins >= t.h * 60 + t.m && nowMins < t.endH * 60 + (t.endM ?? 0));
      if (!inWindow) return;
      const isExact = cfg.triggers.some(t => t.h === h && t.m === m);
      if (isExact) exactKey = key;
      else windowKey = key;
    });
    const toActivate = exactKey ?? windowKey;
    if (toActivate) {
      setEaster(toActivate);
      if (EASTER_EVENTS[toActivate].comic) { $('scaler').classList.add('comic-sans'); }
    }
  })();

  setInterval(() => {
    const p = getFestivalParts();
    const h = p.hour, m = p.minute;
    const nowMins = h * 60 + m;
    const todayStr = ymd();
    Object.entries(EASTER_EVENTS).forEach(([key, cfg]) => {
      if (manuallyTriggered.has(key)) return;
      if (cfg.activeDates && !cfg.activeDates.includes(todayStr)) return;
      const inWindow = cfg.triggers.some(t => nowMins >= t.h * 60 + t.m && nowMins < t.endH * 60 + (t.endM ?? 0));
      if (inWindow && easterActive !== key) {
        setEaster(key);
        if (cfg.comic) $('scaler').classList.add('comic-sans');
      } else if (!inWindow && easterActive === key) {
        setEaster(key);
        if (cfg.comic) $('scaler').classList.remove('comic-sans');
      }
    });
  }, 1000);

  function exitOnClick(e) {
    if (suppressNextExitClick) {
      suppressNextExitClick = false;
      return;
    }
    if (!e.target.closest('.act') && !e.target.closest('.day-item')) {
      leaveFS();
    }
  }

});
