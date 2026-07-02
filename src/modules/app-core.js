export function initApp() {

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
let profileMode = false;
let favsOnly = false;
let infoData = {};
let discoStyles = {};
let sheetLoadFailed = false;
let normalDayKey = 'jeudi';
let profileEnabledDays = ['jeudi', 'vendredi', 'samedi', 'dimanche'];
let profileDancefloorEnabled = true;
let fsShowTitles = true;
let fsShowDay = true;
let fsShowDate = true;
let sunAutoMode = false;
let showRemainingOnly = false;
let fsRemainingOnly = false;
let showFavFillActs = true;
let secondaryStagesMode = false;

const DAY_KEYS = ['jeudi', 'vendredi', 'samedi', 'dimanche'];
const FESTIVAL_DAYS = { 2: 'jeudi', 3: 'vendredi', 4: 'samedi', 5: 'dimanche' };
;
;
;
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
const stagePriority = name => STAGE_ORDER[String(name || '').toLowerCase()] ?? 99;
const FS_STAGE_ABBREV = { 'Mainstage': 'Main' };
const FAVS_KEY = 'favs';
const TIMELINE_GAP = 8;
const AXIS_COL_PX = 88;
const NOW_LINE_LEFT_PX = AXIS_COL_PX - 5;
const PX_PER_HOUR_DESKTOP = 72;
const PX_PER_HOUR_PHONE = 80;
const STAGE_COL_MIN_PX = 200;
const STAGE_GRID_GAP_PX = 9;
const H_SCROLL_MIN_STAGES = 4;
const NOW_LINE_RIGHT_PX = -15;
const REMAINING_DAY_CUTOFF_HOUR = 1;
const REMAINING_WINDOW_HOURS = 6;
const REMAINING_PAST_HOURS = 2;
const REMAINING_MIN_FUTURE_HOURS = 4;
const CROSS_SCENE_NOTICE_LEAD_HOURS = 0.5;
const MAX_UPCOMING_SUMMARY_MINUTES = 480;
const CANVAS_MARGIN = -100;
let scrollTimelineAutoScrollPending = false;
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
  ['fs-btn', 'settings-btn', 'favs-btn', 'stage-view-btn', 'help-btn'].forEach(id => {
    const btn = $(id);
    if (!btn) return;
    btn.style.removeProperty('background');
    btn.style.removeProperty('border-color');
    btn.style.removeProperty('border-width');
    btn.style.removeProperty('opacity');
    btn.style.removeProperty('filter');
    btn.style.removeProperty('box-shadow');
  });
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

function activeDateKey() { return 'date'; }

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

function isScrollTimelineMode() {
  return !document.body.classList.contains('is-fullscreen');
}

function isPhoneScrollLayout() {
  return document.documentElement.dataset.viewport === 'phone' && isScrollTimelineMode();
}

function getPxPerHour() {
  if (!isScrollTimelineMode()) return null;
  return isPhoneScrollLayout() ? PX_PER_HOUR_PHONE : PX_PER_HOUR_DESKTOP;
}

function getTimelinePixelHeight(startHour, endHour) {
  const pxPerHour = getPxPerHour();
  if (!pxPerHour) return null;
  return Math.max(pxPerHour, Math.round((endHour - startHour) * pxPerHour));
}

function applyTimelinePixelHeight(tl, axis, startHour, endHour) {
  const heightPx = getTimelinePixelHeight(startHour, endHour);
  const pxPerHour = getPxPerHour();
  if (!heightPx || !pxPerHour) {
    if (tl) {
      tl.style.height = '';
      tl.style.minHeight = '';
    }
    if (axis) axis.style.height = '';
    document.documentElement.style.removeProperty('--timeline-px-height');
    document.documentElement.style.removeProperty('--px-per-hour');
    return;
  }
  tl.style.height = heightPx + 'px';
  tl.style.minHeight = heightPx + 'px';
  axis.style.height = heightPx + 'px';
  document.documentElement.style.setProperty('--timeline-px-height', heightPx + 'px');
  document.documentElement.style.setProperty('--px-per-hour', pxPerHour + 'px');
}

function scrollToNow() {
  if (!isScrollTimelineMode()) return;
  const scroll = document.querySelector('.schedule-scroll');
  const tl = $('tl');
  if (!scroll || !tl) return;

  const festivalDay = getCurrentFestivalDay();
  const activeDay = document.querySelector('.day-item.active');
  if (!festivalDay || !activeDay || activeDay.dataset.day !== festivalDay) return;

  const day = DAYS[festivalDay];
  const h = getFestivalHour(REMAINING_DAY_CUTOFF_HOUR);
  const view = getTimelineWindow(tl, day.startHour, day.endHour);
  if (h < view.startHour || h >= view.endHour) return;

  const pxPerHour = getPxPerHour();
  if (!pxPerHour) return;

  const nowY = (h - view.startHour) * pxPerHour;
  scroll.scrollTop = Math.max(0, nowY - scroll.clientHeight * 0.28);
  scrollTimelineAutoScrollPending = false;
}

function queueScrollToNow() {
  if (!isScrollTimelineMode()) return;
  scrollTimelineAutoScrollPending = true;
  requestAnimationFrame(() => requestAnimationFrame(scrollToNow));
}

function getHScrollThreshold() {
  return isPhoneScrollLayout() ? 3 : H_SCROLL_MIN_STAGES;
}

function getStageColMinPx() {
  return isPhoneScrollLayout() ? 260 : STAGE_COL_MIN_PX;
}

function makeAxisGridCols(stageCount = 1) {
  const count = Math.max(stageCount, 1);
  const minCol = getStageColMinPx();
  if (isScrollTimelineMode() && count >= getHScrollThreshold()) {
    const stageCols = Array(count).fill(`minmax(${minCol}px, 1fr)`).join(' ');
    return `${AXIS_COL_PX}px ${stageCols}`;
  }
  return `${AXIS_COL_PX}px ${'1fr '.repeat(count).trim()}`;
}

function applyScheduleHorizontalLayout(stageRow, tl, columnCount) {
  const threshold = getHScrollThreshold();
  const useHScroll = isScrollTimelineMode() && columnCount >= threshold;
  document.body.classList.toggle('schedule-h-scroll-active', useHScroll);
  if (!stageRow || !tl) return;
  if (!useHScroll) {
    stageRow.style.minWidth = '';
    tl.style.minWidth = '';
    return;
  }
  const minCol = getStageColMinPx();
  const minWidth = AXIS_COL_PX + columnCount * minCol + Math.max(0, columnCount - 1) * STAGE_GRID_GAP_PX;
  stageRow.style.minWidth = minWidth + 'px';
  tl.style.minWidth = minWidth + 'px';
}

function setScheduleGrid(stageRow, tl, gridCols) {
  const columnCount = getScheduleColumnCount(gridCols);
  const stageText = getStageTextLayout(columnCount);
  const gridLineLeft = `${AXIS_COL_PX + 2}px`;
  stageRow.style.gridTemplateColumns = gridCols;
  stageRow.dataset.columnCount = String(columnCount);
  stageRow.style.setProperty('--stage-name-size', stageText.name + 'px');
  stageRow.style.setProperty('--stage-sub-size', stageText.sub + 'px');
  stageRow.style.setProperty('--stage-sub-height', stageText.subHeight + 'px');
  stageRow.style.setProperty('--axis-col-width', `${AXIS_COL_PX}px`);
  tl.style.gridTemplateColumns = gridCols;
  tl.dataset.columnCount = String(columnCount);
  tl.style.setProperty('--axis-col-width', `${AXIS_COL_PX}px`);
  tl.style.setProperty('--grid-line-left', gridLineLeft);
  applyScheduleHorizontalLayout(stageRow, tl, columnCount);
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
  const pxPerHour = getPxPerHour();
  const total = Math.max(0.01, scaleHours);
  for (let h = Math.floor(startHour) + 1; h < endHour; h++) {
    const line = document.createElement('div');
    line.className = 'grid-line';
    if (pxPerHour) line.style.top = ((h - startHour) * pxPerHour) + 'px';
    else line.style.top = (((h - startHour) / total) * 100) + '%';
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

function layoutOneActTextScroll(act) {
  const body = directChildWithClass(act, 'act-body');
  const name = directChildWithClass(body, 'act-name');
  if (!act || !body || !name) return;

  prepareActTextBox(act, body, name);
  const time = directChildWithClass(body, 'act-time');
  if (time) prepareActTime(time);

  const durationMin = (parseFloat(act.dataset.end) - parseFloat(act.dataset.start)) * 60;
  let nameSize;
  let timeSize;
  if (durationMin >= 90) { nameSize = 18; timeSize = 13; }
  else if (durationMin >= 59) { nameSize = 15; timeSize = 12; }
  else if (durationMin >= 30) { nameSize = 13; timeSize = 0; }
  else { nameSize = 11; timeSize = 0; }

  if (isPhoneScrollLayout()) {
    nameSize += 2;
    if (timeSize) timeSize += 1;
  }

  name.style.fontSize = nameSize + 'px';
  name.style.maxWidth = '';
  if (time) {
    if (timeSize) {
      time.style.fontSize = timeSize + 'px';
      time.classList.remove('act-time-hidden');
    } else {
      time.classList.add('act-time-hidden');
    }
  }
}

function updateActTextLayout() {
  if (isScrollTimelineMode()) {
    document.querySelectorAll('.act').forEach(layoutOneActTextScroll);
    return;
  }
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
  if (isScrollTimelineMode()) {
    const safeFinalDay = finalDayKey || normalDayKey || 'jeudi';
    normalActTextLayoutsReady = false;
    setActiveDay(safeFinalDay);
    renderDay(safeFinalDay);
    return;
  }
  const savedSecondaryMode = secondaryStagesMode;
  const savedCampingStageMode = false;
  const safeFinalDay = finalDayKey || normalDayKey || 'jeudi';
  cancelAnimationFrame(actTextLayoutRAF);
  actTextLayoutRAF = 0;
  actTextLayoutsPrecomputing = true;
  actTextLayoutsPrecomputeRemaining = false;
  ACT_TEXT_STYLE_CACHE.clear();

  DAY_KEYS.forEach(dayKey => {
    secondaryStagesMode = false;
        renderDay(dayKey);
    updateActTextLayout();
    cacheActTextStyles(dayKey + '|primary');

    if (hasSecondaryStages(dayKey)) {
      secondaryStagesMode = true;
            renderDay(dayKey);
      updateActTextLayout();
      cacheActTextStyles(dayKey + '|secondary');
    }
  });

  const currentDay = getCurrentFestivalDay();
  if (currentDay) {
    actTextLayoutsPrecomputeRemaining = true;

    secondaryStagesMode = false;
        renderDay(currentDay);
    updateActTextLayout();
    cacheActTextStyles(currentDay + '|primary|remaining');

    secondaryStagesMode = true;
        renderDay(currentDay);
    updateActTextLayout();
    cacheActTextStyles(currentDay + '|secondary|remaining');

    actTextLayoutsPrecomputeRemaining = false;
  }

  secondaryStagesMode = savedSecondaryMode;
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
  applyTimelinePixelHeight(tl, axis, startHour, endHour);
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
    {
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
  const pxPerHour = getPxPerHour();
  const totalMin = Math.max(0.01, scaleHours) * 60;
  const frag = document.createDocumentFragment();
  for (let h = Math.ceil(startHour); h < endHour; h++) {
    const span = document.createElement('span');
    span.className = 'tick-label';
    span.textContent = fmtAxisH(h);
    if (pxPerHour) span.style.top = ((h - startHour) * pxPerHour) + 'px';
    else span.style.top = (((h - startHour) * 60 / totalMin) * 100) + '%';
    frag.appendChild(span);
  }
  return frag;
}

function positionAct(div, start, end, startHour, endHour) {
  const pxPerHour = getPxPerHour();
  if (pxPerHour) {
    const topPx = (start - startHour) * pxPerHour;
    const heightPx = (end - start) * pxPerHour - TIMELINE_GAP;
    div.style.top = topPx + 'px';
    div.style.height = Math.max(28, heightPx) + 'px';
    return;
  }
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

function discoActColor() {
  return null;
}

function setNormalSelectedActStyle(div) {
  clearNormalSelectedActStyle(div);
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
  const isFSSun = document.body.classList.contains('is-fullscreen') && document.body.classList.contains('sun-mode');
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
  const copy = { online: 'Data updated', updated: 'Data refreshed', cached: 'Local version loaded', offline: 'Offline: local version', updating: 'Refreshing…', error: 'No local version' };
  return copy[kind] || '';
}

function formatSheetCacheTime(ts = localStorage.getItem(CSV_CACHE_UPDATED_AT_KEY)) {
  const time = Number(ts || 0);
  if (!time) return '';
  const locale = 'en-GB';
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
  } else if (favsOnly) {
    renderFavsMode(normalDayKey);
  } else if (!normalActTextLayoutsReady) {
    precomputeNormalDayTextLayouts(normalDayKey);
  } else {
    renderDay(normalDayKey);
  }
  updateNowLine();
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


function makeDay(startHour, endHour, stages) {
  return {
    gridCols: makeAxisGridCols(stages.length),
    startHour,
    endHour,
    stages: makeStageList(stages),
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



function getSecondaryStages(dayKey) {
  return hasSecondaryStages(dayKey) ? (SECONDARY_STAGES_BY_DAY[dayKey] || []) : [];
}



function getNormalViewStages(dayKey) {
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
  return stages;
}

function getCurrentStageViewState() {
  return secondaryStagesMode ? 'secondary' : 'primary';
}

function setStageViewState(state) {
  secondaryStagesMode = state === 'secondary';
}

function getStageGroup(stageName) {
  const norm = String(stageName || '').trim().toLowerCase();
  if (!norm) return null;
  if (norm === 'discor' || norm === 'discob' || norm === 'discog') return null;
  if (norm === 'camping') return null;
  const isSecondary = Object.values(SECONDARY_STAGES_BY_DAY)
    .some(stages => stages.some(stage => stage.name.toLowerCase() === norm));
  if (isSecondary) return 'secondary';
  if (norm === 'info') return 'info';
  return 'primary';
}

function getVisibleStageGroup() {
  const plainScheduleView = !profileMode && !favsOnly;
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

function getSelectedCrossSceneNoticeGroups(favs = getFavs()) {
  return getSelectedNormalNoticeGroups(favs);
}

function setCrossSceneIndicator(btn, active) {
  if (!btn) return;
  const isVisible = btn.style.visibility !== 'hidden';
  btn.classList.toggle('cross-scene-indicator', Boolean(active && isVisible));
}

function updateCrossSceneIndicators() {
  const groups = getSelectedCrossSceneNoticeGroups();
  const currentGroup = getVisibleStageGroup();
  const hasOtherScheduleGroup = ['primary', 'secondary']
    .some(group => groups.has(group) && group !== currentGroup);

  setCrossSceneIndicator($('stage-view-btn'), hasOtherScheduleGroup);
}

function makeStageGridCols(stagesOrCount) {
  const count = typeof stagesOrCount === 'number' ? stagesOrCount : stagesOrCount.length;
  return makeAxisGridCols(count);
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



function getNowSummaryCopy(mode, minutes = null) {
  const dur = minutes === null ? null : fmtSummaryDuration(minutes);
  if (mode === 'now') return 'PLAYING NOW';
  return dur === null ? 'UP NEXT' : `IN ${dur}`;
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
  if (norm === 'camping') return false;
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

  if (oldDayVisible !== newDayVisible) updateFavsBtn();
}

function syncFavoritesModeAfterActToggle(div, selected, oldFavs, newFavs) {
  if (!favsOnly) return;

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
      updateNowSummary(getFestivalHour(2));
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
  setScheduleGrid(stageRow, tl, makeAxisGridCols(1));
  setTimelineWindow(tl, startHour, endHour);
  axis.appendChild(buildAxisFragment(startHour, endHour));
  tl.appendChild(buildGridLinesFragment(startHour, endHour));
  const msg = document.createElement('div');
  msg.id = 'sheet-error';
  msg.textContent = message || ('SCHEDULE UNAVAILABLE');
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

function getFavRenderActs(dayKey, stageName, favoriteActs) {
  return favoriteActs;
}

function getFavDays(favs = getFavs()) {
  const overrideEntries = Object.entries(overrides);
  return DAY_KEYS.filter(dayKey => getFavStageActs(dayKey, favs, overrideEntries).length > 0);
}

function updateFavDayVisibility(favDays = getFavDays()) {
  const allowed = new Set(profileEnabledDays);
  const base = DAY_KEYS.filter(d => allowed.has(d));
  const visible = new Set(favsOnly ? favDays.filter(d => allowed.has(d)) : base);
  const hideSecondaryUnavailableDay = secondaryStagesMode && !favsOnly && !profileMode;
  document.querySelectorAll('.day-item').forEach(el => {
    const dayKey = el.dataset.day;
    const shouldHide = hideSecondaryUnavailableDay && !hasSecondaryStages(dayKey);
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
      document.body.classList.remove('favs-only');
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

  const allSelected = stageActs.flatMap(s => s.acts);
  const timeWindow = remainingActive
    ? getRemainingTimelineWindow(day, allSelected)
    : getCompactTimeWindow(day, allSelected);
  const { startHour, endHour, axisEndHour = endHour, scaleHours = endHour - startHour } = timeWindow;

  const stageRow = $('stage-row'), tl = $('tl'), axis = $('axis');
  document.body.classList.remove(...DAY_KEYS.map(d => 'day-' + d));
  document.body.classList.add('day-' + dayKey);

  setScheduleGrid(stageRow, tl, makeAxisGridCols(stageActs.length));
  setTimelineWindow(tl, startHour, endHour);

  const stageFrag    = buildStageHeaderFragment(stageActs.map(s => s.stage), s => buildStageHeader(s.name, s.sub));
  const axisFrag     = buildAxisFragment(startHour, axisEndHour, scaleHours);
  const timelineFrag = document.createDocumentFragment();

  stageActs.forEach(({ stage, acts }) => {
    const col = document.createElement('div');
    col.className = 'stage-col';
    const renderActs = getFavRenderActs(dayKey, stage.name, acts)
      .filter(act => !remainingActive || shouldShowActForCurrentView(dayKey, stage.name, act, favs));
    renderActs.forEach(act => {
      const div = createActElement({
        id: makeLegacyActId(dayKey, stage.name, act.start),
        favId: makeActFavoriteId(dayKey, stage.name, act),
        legacyFavId: makeLegacyActId(dayKey, stage.name, act.start),
        name: act.name, start: act.start, end: act.end,
        className: 'act',
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
  if (isScrollTimelineMode()) {
    updateActTextLayout();
    queueScrollToNow();
  }
}

function renderDay(dayKey) {
  const day = DAYS[dayKey];
  const stageRow = $('stage-row');
  const tl = $('tl');
  const axis = $('axis');
  const favs = getFavs();
  const overrideEntries = Object.entries(overrides);

  if (secondaryStagesMode && !hasSecondaryStages(dayKey)) secondaryStagesMode = false;

  document.body.classList.remove(...DAY_KEYS.map(d => 'day-' + d));
  document.body.classList.add('day-' + dayKey);
  document.body.classList.toggle('secondary-stages-mode', !!secondaryStagesMode);
  const stages = getNormalViewStages(dayKey);
  const actsByStage = stages.map(stage => ({ stage, acts: getActsFromOverrides(dayKey, stage.name, overrideEntries)
      .filter(act => shouldShowActForCurrentView(dayKey, stage.name, act, favs)) }));
  const remainingActive = isRemainingModeActiveForDay(dayKey);
  const allVisibleActs = actsByStage.flatMap(s => s.acts);
  const timeWindow = remainingActive
      ? getRemainingTimelineWindow(day, allVisibleActs)
      : { startHour: day.startHour, endHour: day.endHour, axisEndHour: day.endHour, scaleHours: day.endHour - day.startHour };
  const { startHour, endHour, axisEndHour, scaleHours } = timeWindow;

  setScheduleGrid(stageRow, tl, makeStageGridCols(stages.length));
  setTimelineWindow(tl, startHour, endHour);

  const layoutKey = dayKey + (secondaryStagesMode ? '|secondary' : '|primary') + (remainingActive ? '|remaining' : '');
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
        className: 'act',
        favs,
        layoutKey,
        alwaysShowTime: false,
      });
      positionAct(div, act.start, act.end, startHour, endHour);
      col.appendChild(div);
    });

    timelineFrag.appendChild(col);
  });

  swapSchedule(stageRow, axis, tl, stageFrag, axisFrag, timelineFrag, startHour, axisEndHour, timeWindow);
  if (!actTextLayoutsPrecomputing && !normalActTextLayoutsReady) queueActTextLayoutIfMissing();
  else if (isScrollTimelineMode()) updateActTextLayout();
  updateNowLine();
  updateResetBtn();
  queueLayoutRefresh();
  if (isScrollTimelineMode()) queueScrollToNow();
}



function updateFavsBtn() {
  const btn = $('favs-btn');
  if (!btn) return;
  const show = favsOnly || getFavDays().includes(normalDayKey);
  btn.style.display = 'flex';
  btn.style.visibility = show ? 'visible' : 'hidden';
  btn.style.pointerEvents = show ? 'auto' : 'none';
  setUtilityButtonState(btn, true, favsOnly);
}

function updateResetBtn() {
  const wrap = $('reset-wrap');
  const hasFavs = getFavs().length > 0;
  const hasProfileChange = !profileDancefloorEnabled
    || sunAutoMode || !showRemainingOnly || fsRemainingOnly || !showFavFillActs
    || !fsShowTitles || !fsShowDay || !fsShowDate
    || DAY_KEYS.some(d => !profileEnabledDays.includes(d));
  if (wrap) wrap.style.display = (hasFavs || hasProfileChange) ? 'block' : 'none';
  if (!hasFavs && favsOnly) {
    favsOnly = false;
      document.body.classList.remove('favs-only');
    updateFavDayVisibility(DAY_KEYS);
    updateFavsBtn();
    if (!profileMode && !favsOnly) renderDay(normalDayKey);
  }
  updateFavsBtn();
}

function getCurrentFestivalDay() {
  return getJuly2026Day(2, FESTIVAL_DAYS, null);
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

  if (profileMode) {
    resetTimelineScrollTransform();
    if (existing) existing.remove();
    document.querySelectorAll('.act').forEach(act => {
      act.classList.remove('act-now', 'act-past');
    });
    updateStageHeaderSelectionState();
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

  const plainScheduleView = !profileMode && !favsOnly;
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
  let lineTopPx = null;
  const pxPerHour = getPxPerHour();

  if (isRemainingTimeline && Number.isFinite(remainingBaseStart)) {
    resetTimelineScrollTransform();
    lineVisible = h >= view.startHour && h < day.endHour;
    if (lineVisible) {
      if (pxPerHour) lineTopPx = (h - view.startHour) * pxPerHour;
      else {
        const totalMin = (view.endHour - view.startHour) * 60;
        lineTopPct = ((h - view.startHour) * 60) / totalMin * 100;
      }
    }
  } else {
    resetTimelineScrollTransform();
    if (lineVisible) {
      if (pxPerHour) lineTopPx = (h - view.startHour) * pxPerHour;
      else {
        const totalMin = (view.endHour - view.startHour) * 60;
        lineTopPct = ((h - view.startHour) * 60) / totalMin * 100;
      }
    }
  }

  if (lineVisible && (lineTopPx !== null || lineTopPct !== null)) {
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
    line.style.top = lineTopPx !== null ? lineTopPx + 'px' : lineTopPct + '%';
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

function queueLayoutRefresh() {
  requestAnimationFrame(() => window.dispatchEvent(new Event('resize')));
}

let booted = false;
function bootApp() {
  if (booted) return;
  booted = true;
  const _curFestDay = getCurrentFestivalDay();
  normalDayKey = _curFestDay || 'jeudi';
  favsOnly = false;
  secondaryStagesMode = false;
  profileEnabledDays = JSON.parse(localStorage.getItem('profileEnabledDays') || '["jeudi","vendredi","samedi","dimanche"]');
  profileDancefloorEnabled = localStorage.getItem('profileDancefloor') !== '0';
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
    el.textContent = el.dataset.label;
  });
  updateFavDayVisibility();
  ensureActiveDay(normalDayKey);
  const activeDayEl = document.querySelector(`.day-item[data-day="${normalDayKey}"]`);
  if (activeDayEl) {
    $('current-date').textContent = activeDayEl.dataset.date;
  }
  let pageRevealed = false;
  function revealPage() {
    if (pageRevealed) return;
    ensureActiveDay(normalDayKey || getDefaultDay());
    pageRevealed = true;
    document.body.style.opacity = '1';
    document.documentElement.classList.add('page-revealed');
    queueLayoutRefresh();
    queueScrollToNow();
  }

  loadOverrides().then(() => {
    const normalMode = !sheetLoadFailed && !favsOnly;

    if (sheetLoadFailed) {
      renderSheetError();
    } else if (favsOnly) {
      renderFavsMode(normalDayKey);
    }
    updateNowLine();
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

  function updateDaysLeft() {
    const el = $('days-left');
    if (!el) return;
    const p = getFestivalDateWithCutoff(0);
    const today = Date.UTC(p.year, p.monthIndex, p.day);
    const diff = Math.ceil((Date.UTC(2026, 6, 2) - today) / 86400000);
    const festivalOver = today > Date.UTC(2026, 6, 5);
    if (diff <= 0 || festivalOver) { el.textContent = ''; return; }
    el.textContent = 'D-' + diff;
  }
  updateDaysLeft();
    
  setInterval(refreshTimeSensitiveUI, 60000);

  let bottomButtonsIdleTimer = 0;
  function canAutoDimBottomButtons() {
    return !document.body.classList.contains('profile-mode');
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
  const showDefaultDay = () => { secondaryStagesMode = false; updateFavDayVisibility(DAY_KEYS); selectDefaultDay(); if (!normalActTextLayoutsReady) precomputeNormalDayTextLayouts(normalDayKey); else renderDay(normalDayKey); updateStageViewBtn(); };
  

  function refreshTimeSensitiveUI() {
    updateNowLine();
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
      if (!favsOnly) {
        if (secondaryStagesMode && !hasSecondaryStages(selectedDay)) return;
      }
      if (profileMode) {
        profileMode = false;
        document.body.classList.remove('profile-mode');
        updateProfileBtn();
        setTitle('Rampage Open Air 2026');
      }
      normalDayKey = selectedDay;
      setActiveDay(normalDayKey);
      if (favsOnly) { renderFavsMode(selectedDay); } else { renderDay(normalDayKey); }
            updateStageViewBtn();
    });
  });

  function isSwipeBlocked(target) {
    return sheetLoadFailed || profileMode
      || Boolean(target && target.closest('#settings-popover, .color-menu, .profile-mode-col, button, input, textarea, select, a'));
  }

  function getCurrentSwipeDay() {
    return normalDayKey;
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
    return 'SETTINGS';
  }

  function applyLanguageUI() {
    document.querySelectorAll('.day-item').forEach(el => { el.textContent = el.dataset.label || el.textContent; });
    const active = document.querySelector('.day-item.active');
    if (active && $('current-date')) $('current-date').textContent = active.dataset.date || '';
  }

  applyLanguageUI();

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

  function isPlainScheduleView() {
    return !profileMode && !favsOnly;
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
        { x: 2, width: 2.8 }, { x: 6.3, width: 2.8 }, { x: 10.6, width: 2.8 },
        { x: 14.9, width: 2.8 }, { x: 19.2, width: 2.8 },
      ],
      secondary: [
        { x: 3, width: 5 }, { x: 9.5, width: 5 }, { x: 16, width: 5 },
      ],
    }[targetState] || [
      { x: 3, width: 5 }, { x: 9.5, width: 5 }, { x: 16, width: 5 },
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
    return next === 'secondary' ? 'Secondary stages' : 'Main stages';
  }

  function updateStageViewBtn() {
    const btn = $('stage-view-btn');
    if (!btn) return;
    const inSchedule = isPlainScheduleView();
    const activeDay = document.querySelector('.day-item.active')?.dataset.day || normalDayKey;
    const cycle = getStageViewCycleStages(activeDay);
    const hasExtraView = cycle.length > 1;
    const canUseStageView = inSchedule && hasExtraView;
    if (inSchedule && !hasExtraView) setStageViewState('primary');
    const currentState = getCurrentStageViewState();
    const isExtraView = canUseStageView && currentState !== 'primary';
    document.body.classList.toggle('secondary-stages-mode', canUseStageView && secondaryStagesMode);
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

  function applyProfileState() {
    updateStageViewBtn();
  }

  function toggleStoredFlag(key, value) {
    localStorage.setItem(key, value ? '1' : '0');
  }

  function renderProfile() {
    const stageRow = $('stage-row'), tl = $('tl'), axis = $('axis');
    clearSchedule(stageRow, axis, tl);
    setScheduleGrid(stageRow, tl, makeAxisGridCols(1));
    stageRow.appendChild(buildStageHeaderFragment([{ name: getSettingsTitle(), sub: '' }], s => buildStageHeader(s.name, s.sub)));

    const col = document.createElement('div');
    col.className = 'stage-col profile-mode-col';

    const makeBtn = (className, action, text, active, disabled = false) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = className + (active ? ' active' : '') + (disabled ? ' feat-disabled' : '');
      btn.dataset.profileAction = action;
      btn.textContent = text;
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
      if (disabled) { btn.disabled = true; btn.setAttribute('aria-disabled', 'true'); }
      return btn;
    };
    const makeSection = (titleText, rows) => {
      const section = document.createElement('div');
      section.className = 'profile-mode-section';
      const title = document.createElement('div');
      title.className = 'profile-mode-section-title';
      title.textContent = titleText;
      section.append(title, ...rows);
      col.appendChild(section);
    };
    const makeRow = (items, className = 'profile-mode-row') => {
      const row = document.createElement('div');
      row.className = className;
      items.forEach(item => row.appendChild(makeBtn(...item)));
      return row;
    };

    const dayLabels = { jeudi: 'THURSDAY', vendredi: 'FRIDAY', samedi: 'SATURDAY', dimanche: 'SUNDAY' };
    makeSection('DISPLAY', [
      makeRow(DAY_KEYS.map(day => ['profile-mode-day-btn', 'day-' + day, dayLabels[day], profileEnabledDays.includes(day)])),
    ]);
    makeSection('FULLSCREEN / WALLPAPER', [makeRow([
      ['profile-mode-day-btn', 'fs-titles', 'TITLES', fsShowTitles],
      ['profile-mode-day-btn', 'fs-day', 'DAY', fsShowDay],
      ['profile-mode-day-btn', 'fs-date', 'DATE', fsShowDate],
      ['profile-mode-day-btn profile-mode-choice-btn', 'fs-view', fsRemainingOnly ? 'UPCOMING' : 'FULL DAY', true],
    ])]);
    makeSection('DAY VIEW', [makeRow([
      ['profile-mode-sun-btn profile-mode-choice-btn', 'remaining-view', showRemainingOnly ? 'UPCOMING' : 'FULL DAY', true],
      ['profile-mode-sun-btn', 'fav-fill', showFavFillActs ? 'FILL' : 'ONLY', showFavFillActs],
      ['profile-mode-sun-btn', 'sun-auto', 'AUTO (8AM-8PM)', sunAutoMode],
    ])]);
    makeSection('FILTERS', [makeRow([
      ['profile-mode-day-btn', 'dancefloor', 'DANCEFLOOR', !profileDancefloorEnabled],
    ])]);
    makeSection('DATA', [makeRow([
      ['profile-mode-update-btn', 'sheet-refresh', 'UPDATE', false],
    ])]);

    const statusEl = document.createElement('div');
    statusEl.id = 'sheet-status';
    statusEl.className = 'profile-mode-sheet-status';
    col.appendChild(statusEl);
    setSheetStatus();

    tl.appendChild(col);
    updateNowLine();
  }

  function handleProfileAction(btn) {
    const action = btn.dataset.profileAction;
    const rerender = () => renderProfile();
    if (action === 'fs-titles') { fsShowTitles = !fsShowTitles; toggleStoredFlag('fsShowTitles', fsShowTitles); applyFullscreenVisibilityPrefs(); return rerender(); }
    if (action === 'fs-day') { fsShowDay = !fsShowDay; toggleStoredFlag('fsShowDay', fsShowDay); applyFullscreenVisibilityPrefs(); return rerender(); }
    if (action === 'fs-date') { fsShowDate = !fsShowDate; toggleStoredFlag('fsShowDate', fsShowDate); applyFullscreenVisibilityPrefs(); return rerender(); }
    if (action === 'fs-view') { fsRemainingOnly = !fsRemainingOnly; toggleStoredFlag('fsRemainingOnly', fsRemainingOnly); return rerender(); }
    if (action === 'remaining-view') {
      showRemainingOnly = !showRemainingOnly;
      toggleStoredFlag('showRemainingOnly', showRemainingOnly);
      document.body.classList.toggle('remaining-only', showRemainingOnly);
      return rerender();
    }
    if (action === 'fav-fill') { showFavFillActs = !showFavFillActs; toggleStoredFlag('showFavFillActs', showFavFillActs); return rerender(); }
    if (action === 'sun-auto') {
      sunAutoMode = !sunAutoMode;
      toggleStoredFlag('sunAutoMode', sunAutoMode);
      if (sunAutoMode) sunMode = getScheduledSunMode();
      toggleStoredFlag('sunMode', sunMode);
      applySunMode();
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

  const lightModeBtn = $('light-mode-btn');
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
  lightModeBtn?.addEventListener('click', e => {
    e.stopPropagation();
    sunMode = !sunMode;
    localStorage.setItem('sunMode', sunMode ? '1' : '0');
    applySunMode();
    if (profileMode) renderProfile();
  });

  const colorBtn = $('color-btn');
  const colorMenu = $('color-menu');
  const updateColorMenuBtn = () => {
    if (colorBtn) colorBtn.classList.toggle('control-active', colorMenu?.classList.contains('open'));
  };
  colorBtn?.addEventListener('click', e => {
    e.stopPropagation();
    colorMenu?.classList.toggle('open');
    updateColorMenuBtn();
  });

  const settingsBtn = $('settings-btn');
  const bottomBar = $('bottom-bar');
  settingsBtn?.addEventListener('click', e => {
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
    $('settings-popover')?.setAttribute('aria-hidden', open ? 'false' : 'true');
    if (!open) colorMenu?.classList.remove('open');
    updateSettingsBtn();
    updateColorMenuBtn();
  });

  document.addEventListener('click', e => {
    const btn = e.target.closest('[data-profile-action]');
    if (btn && document.body.classList.contains('profile-mode')) {
      e.stopPropagation();
      handleProfileAction(btn);
    }
  });

  const profileBtn = $('profile-btn');
  profileBtn?.addEventListener('click', e => {
    e.stopPropagation();
    profileMode = !profileMode;
    document.body.classList.toggle('profile-mode', profileMode);
    if (profileMode) {
      bottomBar?.classList.remove('settings-open');
      settingsBtn?.setAttribute('aria-expanded', 'false');
      $('settings-popover')?.setAttribute('aria-hidden', 'true');
      colorMenu?.classList.remove('open');
      updateSettingsBtn();
      updateColorMenuBtn();
      if (favsOnly) { favsOnly = false; document.body.classList.remove('favs-only'); updateFavsBtn(); updateFavDayVisibility(); }
      secondaryStagesMode = false;
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
  favsBtn?.addEventListener('click', e => {
    e.stopPropagation();
    if (profileMode) { profileMode = false; document.body.classList.remove('profile-mode'); updateProfileBtn(); }
    favsOnly = !favsOnly;
    document.body.classList.toggle('favs-only', favsOnly);
    secondaryStagesMode = false;
    if (favsOnly) {
      setTitle('FAVORITES');
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
  stageViewBtn?.addEventListener('click', e => {
    e.stopPropagation();
    if (!isPlainScheduleView()) {
      secondaryStagesMode = false;
      favsOnly = false;
      profileMode = false;
      document.body.classList.remove('favs-only', 'profile-mode');
      updateFavsBtn();
      updateProfileBtn();
      setTitle('Rampage Open Air 2026');
      showDefaultDay();
      return;
    }
    const cycle = getStageViewCycleStages(normalDayKey);
    if (cycle.length < 2) { updateStageViewBtn(); return; }
    const currentIndex = Math.max(0, cycle.indexOf(getCurrentStageViewState()));
    setStageViewState(cycle[(currentIndex + 1) % cycle.length]);
    setTitle('Rampage Open Air 2026');
    const visibleDays = secondaryStagesMode
      ? DAY_KEYS.filter(day => getStageViewCycleStages(day).includes('secondary'))
      : DAY_KEYS;
    updateFavDayVisibility(visibleDays);
    if (secondaryStagesMode && !visibleDays.includes(normalDayKey)) {
      normalDayKey = visibleDays[0] || 'vendredi';
    }
    setActiveDay(normalDayKey);
    if (!normalActTextLayoutsReady) precomputeNormalDayTextLayouts(normalDayKey);
    else renderDay(normalDayKey);
    updateStageViewBtn();
  });
  document.addEventListener('favschange', () => { updateStageViewBtn(); updateCrossSceneIndicators(); });

  document.addEventListener('click', () => {
    colorMenu?.classList.remove('open');
    updateColorMenuBtn();
  });

  function applyColorOption(opt) {
    if (!opt) return;
    accentColor = opt.dataset.accent;
    accentBg = opt.dataset.bg;
    accentBorder = opt.dataset.border;
    colorMenu?.classList.remove('open');
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
  }

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

  function clampValue(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function clampFullscreenZoom(value) {
    return clampValue(value, 0.55, 1);
  }

  function touchDistance(touches) {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.hypot(dx, dy);
  }

  function isPhoneLikeViewport(vw, vh) {
    const portrait = vh > vw * 1.35;
    const narrow = vw <= 560;
    const mobileUA = /Android|iPhone|iPod|Mobile/i.test(navigator.userAgent || '');
    const coarsePointer = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
    return portrait && (narrow || mobileUA || coarsePointer);
  }

  function isPhoneLikeFullscreenViewport(vw, vh) {
    return isPhoneLikeViewport(vw, vh);
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
    const vw = (vv && vv.width) ? vv.width : window.innerWidth;
    const vh = (vv && vv.height) ? vv.height : window.innerHeight;
    const baseW = 1080;
    const baseH = 1920;
    const isFS = document.body.classList.contains('is-fullscreen');
    document.body.classList.toggle('scroll-timeline', !isFS);

    if (!isFS) {
      const isPhone = isPhoneLikeViewport(vw, vh);
      document.documentElement.dataset.viewport = isPhone ? 'phone' : 'desktop';
      document.body.classList.toggle('phone-scroll', false);

      scaler.style.position = 'relative';
      scaler.style.width = '100%';
      scaler.style.maxWidth = baseW + 'px';
      scaler.style.height = 'auto';
      scaler.style.minHeight = '100dvh';
      scaler.style.transform = 'none';
      scaler.style.left = '0';
      scaler.style.top = '0';
      scaler.style.margin = '0 auto';
      scaler.style.touchAction = '';

      const tl = $('tl');
      const axis = $('axis');
      const stageRow = $('stage-row');
      if (tl && axis) {
        const view = getTimelineWindow(tl, 0, 24);
        if (tl.dataset.startHour) {
          applyTimelinePixelHeight(tl, axis, view.startHour, view.endHour);
          const columnCount = parseInt(tl.dataset.columnCount || '0', 10);
          if (columnCount) applyScheduleHorizontalLayout(stageRow, tl, columnCount);
        }
      }
      if (scrollTimelineAutoScrollPending) queueScrollToNow();
      return;
    }

    const isPhone = isPhoneLikeViewport(vw, vh);
    document.documentElement.dataset.viewport = isPhone ? 'phone' : 'desktop';
    document.body.classList.toggle('phone-scroll', isPhone);

    scaler.style.position = 'absolute';
    scaler.style.maxWidth = '';
    scaler.style.margin = '';
    scaler.style.minHeight = '';

    const viewportScale = isPhone
      ? vw / baseW
      : Math.min(vw / baseW, vh / baseH);
    const phoneCaptureFS = isFS && isPhoneLikeFullscreenViewport(vw, vh);
    let virtualH = baseH;
    let displayScale = viewportScale;
    let left = isPhone ? 0 : Math.max(CANVAS_MARGIN, (vw - baseW * displayScale) / 2);
    let top = isPhone ? 0 : Math.max(CANVAS_MARGIN, (vh - baseH * displayScale) / 2);

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
    scaler.style.top = top + 'px';
    if (isPhone) scaler.style.touchAction = 'pan-y';
    else scaler.style.touchAction = 'none';
  }

  function syncFullscreenSunActStyles() {
    const forceNeutral = document.body.classList.contains('sun-mode')
      && document.body.classList.contains('is-fullscreen');
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
    document.body.classList.remove('scroll-timeline');
    document.body.classList.add('is-fullscreen');
    if (!profileMode && !favsOnly) renderDay(normalDayKey);
    applyScale();
    refreshFullscreenState();
    updateFullscreenBtn();
    applyAccentToElements();
    syncFullscreenLayout();
    queueActTextLayout();
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
    if (!profileMode && !favsOnly) renderDay(normalDayKey);
    resetFullscreenCaptureTransform();
    applyScale();
    refreshFullscreenState();
    setTimeout(refreshFullscreenState, 0);
    updateFullscreenBtn();
    applyAccentToElements();
    updateActTextLayout();
    queueScrollToNow();
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

      ['favs','color','helpSeen','sunMode','sunAutoMode','showRemainingOnly','fsRemainingOnly','showFavFillActs','fsShowTitles','fsShowDay','fsShowDate','profileDancefloor','profileEnabledDays'].forEach(k => localStorage.removeItem(k));

      document.querySelectorAll('.act.selected').forEach(el => {
        el.classList.remove('selected');
        clearNormalSelectedActStyle(el);
        el.style.borderLeftColor = '';
      });

      applyColorOption(document.querySelector('.color-option'));
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
      applyFullscreenVisibilityPrefs();profileDancefloorEnabled = true;
      profileEnabledDays       = ['jeudi', 'vendredi', 'samedi', 'dimanche'];
      applyProfileState();
      updateFavDayVisibility();

      if (profileMode) { profileMode = false; document.body.classList.remove('profile-mode'); updateProfileBtn(); }
      if (favsOnly)    { favsOnly = false; document.body.classList.remove('favs-only'); updateFavsBtn(); }
      setTitle('Rampage Open Air 2026');
      showDefaultDay();
      updateStageHeaderSelectionState();
      updateResetBtn();
    }
  });

      function exitOnClick(e) {
    if (suppressNextExitClick) {
      suppressNextExitClick = false;
      return;
    }
    if (!e.target.closest('.act') && !e.target.closest('.day-item')) {
      leaveFS();
    }
  }

}

  document.addEventListener('DOMContentLoaded', bootApp);
  if (document.readyState !== 'loading') bootApp();

}
