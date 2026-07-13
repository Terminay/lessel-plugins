#!/usr/bin/env node
/**
 * lessel-plugins Build Script
 * 
 * Generates:
 * 1. registry.json — Master index of all plugins (fetched by CLI)
 * 2. docs/ — GitHub Pages static site (auto-generated, no manual HTML)
 * 
 * Usage:
 *   node scripts/build.js         # Generate registry.json
 *   node scripts/build.js --pages # Generate registry.json + GitHub Pages
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PLUGINS_DIR = path.join(__dirname, '..', 'plugins');
const REGISTRY_PATH = path.join(__dirname, '..', 'registry.json');
const DOCS_DIR = path.join(__dirname, '..', 'docs');
const GENERATE_PAGES = process.argv.includes('--pages');

// ── Scan plugins ─────────────────────────────────────────────────
function scanPlugins() {
  const plugins = [];

  if (!fs.existsSync(PLUGINS_DIR)) {
    console.error('No plugins/ directory found');
    return [];
  }

  const entries = fs.readdirSync(PLUGINS_DIR);
  for (const entry of entries) {
    const pluginDir = path.join(PLUGINS_DIR, entry);
    if (!fs.statSync(pluginDir).isDirectory()) continue;

    const manifestPath = path.join(pluginDir, 'plugin.json');
    if (!fs.existsSync(manifestPath)) {
      console.warn(`  ⚠ ${entry}: no plugin.json found, skipping`);
      continue;
    }

    try {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
      
      // Scan version directories
      const versions = {};
      const versionDirs = fs.readdirSync(pluginDir).filter(f => {
        const fullPath = path.join(pluginDir, f);
        return fs.statSync(fullPath).isDirectory() && /^\d+\.\d+\.\d+$/.test(f);
      });

      for (const ver of versionDirs) {
        const codePath = path.join(pluginDir, ver, 'index.js');
        if (!fs.existsSync(codePath)) {
          console.warn(`  ⚠ ${entry}@${ver}: no index.js found`);
          continue;
        }

        const code = fs.readFileSync(codePath);
        const checksum = crypto.createHash('sha256').update(code).digest('hex');

        versions[ver] = {
          checksum: `sha256:${checksum}`,
          published: fs.statSync(codePath).mtime.toISOString().split('T')[0],
          size: code.length,
        };
      }

      const latestVersion = Object.keys(versions).sort(semverSort).pop() || '';

      plugins.push({
        name: manifest.name || entry,
        description: manifest.description || '',
        author: manifest.author || 'unknown',
        repository: manifest.repository || '',
        schema: manifest.schema || ['*'],
        engines: manifest.engines || { lessel: '>=0.1.0' },
        tags: manifest.tags || [],
        latestVersion,
        versions,
        totalVersions: Object.keys(versions).length,
      });

      console.log(`  ✓ ${entry} (${latestVersion || 'no versions'})`);
    } catch (err) {
      console.error(`  ✗ ${entry}: ${err.message}`);
    }
  }

  return plugins;
}

function semverSort(a, b) {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    if (pa[i] !== pb[i]) return pa[i] - pb[i];
  }
  return 0;
}

// ── Generate registry.json ──────────────────────────────────────
function generateRegistry(plugins) {
  const registry = {
    $schema: 'https://raw.githubusercontent.com/Terminay/lessel-plugins/main/registry.schema.json',
    generated: new Date().toISOString(),
    totalPlugins: plugins.length,
    plugins,
  };

  fs.writeFileSync(REGISTRY_PATH, JSON.stringify(registry, null, 2));
  console.log(`\n📦 registry.json generated (${plugins.length} plugins)`);
}

// ── Generate GitHub Pages ────────────────────────────────────────
function generatePages(plugins) {
  if (!GENERATE_PAGES) return;

  fs.mkdirSync(DOCS_DIR, { recursive: true });

  // Generate index.html — a self-contained page with search
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>lessel Plugin Registry</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0d1117; color: #c9d1d9; min-height: 100vh; }
  .container { max-width: 960px; margin: 0 auto; padding: 2rem; }
  header { text-align: center; margin-bottom: 2rem; }
  header h1 { font-size: 2.5rem; color: #58a6ff; }
  header p { color: #8b949e; margin-top: 0.5rem; }
  header .count { display: inline-block; background: #21262d; color: #58a6ff; padding: 0.25rem 0.75rem; border-radius: 999px; font-size: 0.875rem; margin-top: 0.5rem; }
  .search { width: 100%; padding: 0.75rem 1rem; background: #21262d; border: 1px solid #30363d; border-radius: 6px; color: #c9d1d9; font-size: 1rem; margin-bottom: 1.5rem; }
  .search:focus { outline: none; border-color: #58a6ff; }
  .tags { display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 1.5rem; }
  .tag { padding: 0.25rem 0.75rem; background: #21262d; border: 1px solid #30363d; border-radius: 999px; cursor: pointer; font-size: 0.8rem; color: #8b949e; }
  .tag:hover, .tag.active { border-color: #58a6ff; color: #58a6ff; }
  .plugin { background: #161b22; border: 1px solid #30363d; border-radius: 8px; padding: 1.25rem; margin-bottom: 1rem; }
  .plugin:hover { border-color: #58a6ff; }
  .plugin h3 { font-size: 1.25rem; color: #58a6ff; }
  .plugin .meta { display: flex; gap: 1rem; margin-top: 0.5rem; font-size: 0.85rem; color: #8b949e; }
  .plugin .desc { margin-top: 0.5rem; color: #c9d1d9; }
  .plugin .tags-wrap { display: flex; gap: 0.5rem; flex-wrap: wrap; margin-top: 0.75rem; }
  .plugin .tags-wrap span { padding: 0.125rem 0.5rem; background: #1f2937; border-radius: 4px; font-size: 0.75rem; color: #8b949e; }
  .plugin .install { display: inline-block; margin-top: 0.75rem; padding: 0.375rem 1rem; background: #238636; color: #fff; border-radius: 6px; font-size: 0.85rem; text-decoration: none; }
  .plugin .install:hover { background: #2ea043; }
  .empty { text-align: center; padding: 3rem; color: #8b949e; }
  footer { text-align: center; padding: 2rem; color: #8b949e; font-size: 0.85rem; }
  footer a { color: #58a6ff; }
</style>
</head>
<body>
<div class="container">
  <header>
    <h1>🔌 lessel Plugins</h1>
    <p>Community plugin registry for the lessel message pipeline framework</p>
    <div class="count">${plugins.length} plugin${plugins.length !== 1 ? 's' : ''}</div>
  </header>

  <input type="text" class="search" id="search" placeholder="Search plugins..." oninput="filter()">

  <div class="tags" id="tags"></div>
  <div id="plugins"></div>
  <div class="empty" id="empty" style="display:none">No plugins found matching your search.</div>

  <footer>
    <a href="https://github.com/Terminay/lessel-plugins">lessel-plugins</a> &mdash;
    <a href="https://github.com/Terminay/lessel">lessel framework</a> &mdash;
    Submit plugins via PR
  </footer>
</div>

<script>
const plugins = ${JSON.stringify(plugins)};

// Collect all tags
const allTags = [...new Set(plugins.flatMap(p => p.tags || []))].sort();
const tagEl = document.getElementById('tags');
allTags.forEach(t => {
  const el = document.createElement('span');
  el.className = 'tag';
  el.textContent = t;
  el.onclick = () => { el.classList.toggle('active'); filter(); };
  tagEl.appendChild(el);
});

function filter() {
  const q = document.getElementById('search').value.toLowerCase();
  const activeTags = [...document.querySelectorAll('.tag.active')].map(e => e.textContent);
  const matched = plugins.filter(p => {
    if (q && !p.name.toLowerCase().includes(q) && !p.description.toLowerCase().includes(q) && !p.author.toLowerCase().includes(q)) return false;
    if (activeTags.length && !activeTags.some(t => (p.tags || []).includes(t))) return false;
    return true;
  });
  render(matched);
}

function render(list) {
  const el = document.getElementById('plugins');
  if (list.length === 0) {
    el.innerHTML = '';
    document.getElementById('empty').style.display = 'block';
    return;
  }
  document.getElementById('empty').style.display = 'none';
  el.innerHTML = list.map(p => \`
    <div class="plugin">
      <h3>\${p.name}</h3>
      <div class="meta">
        <span>👤 \${p.author}</span>
        <span>📦 v\${p.latestVersion || '—'}</span>
        <span>📋 \${p.totalVersions} version\${p.totalVersions !== 1 ? 's' : ''}</span>
      </div>
      <div class="desc">\${p.description}</div>
      \${(p.tags || []).length ? '<div class="tags-wrap">' + p.tags.map(t => '<span>' + t + '</span>').join('') + '</div>' : ''}
      <a class="install" href="javascript:void(0)" onclick="navigator.clipboard.writeText('lessel plugin install ' + '\${p.name}'); alert('Copied! Run: lessel plugin install \${p.name}')">📋 lessel plugin install \${p.name}</a>
    </div>
  \`).join('');
}

render(plugins);
</script>
</body>
</html>`;

  fs.writeFileSync(path.join(DOCS_DIR, 'index.html'), html);
  console.log('🌐 GitHub Pages generated at docs/index.html');
}

// ── Run ─────────────────────────────────────────────────────────
console.log('🔍 Scanning plugins...\n');
const plugins = scanPlugins();
generateRegistry(plugins);
generatePages(plugins);
console.log('\n✅ Done!');