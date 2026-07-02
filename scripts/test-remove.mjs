import fs from 'fs';
let js = fs.readFileSync('src/modules/app.raw.js', 'utf8');

function findFunctionEnd(src, startIdx) {
  let i = startIdx;
  while (i < src.length && src[i] !== '{') i++;
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
      const re = new RegExp(prefix + name + '\\s*\\([^)]*\\)\\s*\\{', 'g');
      let m;
      while ((m = re.exec(out)) !== null) {
        const end = findFunctionEnd(out, m.index);
        console.log('Removed', name, 'at', m.index, 'len', end - m.index);
        if (end > m.index) { out = out.slice(0, m.index) + out.slice(end); re.lastIndex = m.index; }
      }
    }
  }
  return out;
}

const names = ['getCurrentDiscoState', 'updateDiscoBtn', 'updateCampingBtn', 'renderCamping', 'renderDisco', 'hasCampingStage', 'getCampingStages', 'getDiscoDay', 'stopDisco'];
js = removeFunctions(js, names);
console.log('renderDay', /function renderDay/.test(js));
console.log('loadOverrides', /async function loadOverrides/.test(js));
