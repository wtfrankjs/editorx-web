const fs = require('fs');
const path = require('path');

const workspace = path.resolve(__dirname, '..');
const srcDir = path.join(workspace, 'src');
const langFile = path.join(srcDir, 'contexts', 'LanguageContext.tsx');

function walk(dir) {
  const files = [];
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      files.push(...walk(full));
    } else if (stat.isFile()) {
      files.push(full);
    }
  }
  return files;
}

function collectUsedKeys() {
  const files = walk(srcDir).filter(f => f.endsWith('.tsx') || f.endsWith('.ts') || f.endsWith('.jsx') || f.endsWith('.js'));
  const keySet = new Set();
  const pattern = /t\(\s*['"]([a-zA-Z0-9_.-]+)['"]\s*\)/g;
  for (const f of files) {
    const txt = fs.readFileSync(f, 'utf8');
    let m;
    while ((m = pattern.exec(txt)) !== null) {
      keySet.add(m[1]);
    }
  }
  return Array.from(keySet).sort();
}

function parseTranslations() {
  const txt = fs.readFileSync(langFile, 'utf8');
  const lines = txt.split(/\r?\n/);
  const result = {};
  let current = null;
  const langHeader = /^\s*([a-z]{2})\s*:\s*\{/;
  const keyLine = /^\s*['"]([\w.\-]+)['"]\s*:\s*/;
  for (const line of lines) {
    const lh = line.match(langHeader);
    if (lh) {
      current = lh[1];
      result[current] = {};
      continue;
    }
    if (!current) continue;
    const kl = line.match(keyLine);
    if (kl) {
      const key = kl[1];
      result[current][key] = true;
    }
  }
  return result;
}

function main() {
  const used = collectUsedKeys();
  const translations = parseTranslations();
  const langs = Object.keys(translations).sort();
  const missing = {};
  for (const lang of langs) missing[lang] = [];

  for (const key of used) {
    for (const lang of langs) {
      if (!translations[lang][key]) missing[lang].push(key);
    }
  }

  console.log('Found', used.length, 'unique used keys. Languages:', langs.join(', '));
  for (const lang of langs) {
    console.log('\n====', lang, 'missing count:', missing[lang].length, '====');
    if (missing[lang].length > 0) {
      console.log(missing[lang].slice(0,200).join('\n'));
      if (missing[lang].length > 200) console.log('\n... (truncated)');
    }
  }
  // write report
  fs.writeFileSync(path.join(workspace, 'i18n-missing-report.json'), JSON.stringify({ used, missing }, null, 2));
  console.log('\nReport written to i18n-missing-report.json');
}

main();
