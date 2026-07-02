const HELP_KEY = 'helpSeen';

const SECTIONS = [
  { title: 'Schedule', text: 'Tap a day to switch. Swipe left or right on the timetable to change days.' },
  { title: 'Favorites', text: 'Tap an act to star it. Open Favorites to see your picks across stages.' },
  { title: 'Stages', text: 'Use the stage button to cycle between main and secondary stages. Thursday has no secondary stages.' },
  { title: 'Fullscreen', text: 'Fullscreen is for TV or wallpaper view. Tap outside acts to exit. Pinch to zoom on phone.' },
  { title: 'Offline', text: 'The schedule is cached on first load and works without signal at the festival.' },
  { title: 'Refresh', text: 'Open Settings → Update to pull the latest changes from the sheet.' },
  { title: 'Theme', text: 'Pick an accent color and toggle light or sun mode from Settings.' },
];

function buildHelpOverlay() {
  const overlay = document.createElement('div');
  overlay.id = 'help-overlay';
  overlay.hidden = true;
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-labelledby', 'help-title');

  const panel = document.createElement('div');
  panel.className = 'help-panel';
  panel.innerHTML = `<h2 id="help-title">Rampage Timetable</h2>` +
    SECTIONS.map(s => `<section><h3>${s.title}</h3><p>${s.text}</p></section>`).join('') +
    `<button type="button" id="help-dismiss">Got it</button>`;

  overlay.appendChild(panel);
  document.body.appendChild(overlay);

  overlay.addEventListener('click', e => {
    if (e.target === overlay) hideHelp(false);
  });
  panel.querySelector('#help-dismiss').addEventListener('click', () => hideHelp(true));

  return overlay;
}

let overlay;

export function showHelp(markSeen = false) {
  if (!overlay) overlay = buildHelpOverlay();
  overlay.hidden = false;
  if (markSeen) localStorage.setItem(HELP_KEY, '1');
}

export function hideHelp(markSeen = true) {
  if (!overlay) return;
  overlay.hidden = true;
  if (markSeen) localStorage.setItem(HELP_KEY, '1');
}

export function initHelp() {
  const helpBtn = document.getElementById('help-btn');
  if (helpBtn) helpBtn.addEventListener('click', () => showHelp(false));

  if (localStorage.getItem(HELP_KEY) !== '1') {
    requestAnimationFrame(() => showHelp(false));
  }
}
