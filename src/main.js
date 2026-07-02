import { initApp } from './modules/app-core.js';
import { initHelp } from './modules/help.js';
import bodyHtml from './body.html?raw';
import './styles/app.css';

try {
  const bootTheme = localStorage.getItem('sunMode') === '1' ? 'sun' : 'dark';
  document.documentElement.dataset.bootTheme = bootTheme;
} catch (e) {}

document.querySelector('#app').innerHTML = bodyHtml;

initApp();
initHelp();
