// Raccourcisseur d'URL sans serveur : les liens vivent dans url/links.json
// du dépôt GitHub Pages ; la page écrit ce fichier par l'API GitHub avec
// un jeton gardé dans le navigateur, et 404.html fait la redirection.

const $ = (s) => document.querySelector(s);
const CFG_KEY = 'url-shortener-cfg';
const LINKS_PATH = 'url/links.json';

// Dépôt deviné d'après l'hôte GitHub Pages (maxlgz.github.io -> maxlgz/maxlgz.github.io)
const host = location.hostname;
const guessOwner = host.endsWith('.github.io') ? host.split('.')[0] : 'maxlgz';
const DEFAULTS = { owner: guessOwner, repo: `${guessOwner}.github.io`, branch: 'claude/piano-learning-app-1mGiF', token: '' };

let cfg = { ...DEFAULTS };
try { cfg = { ...DEFAULTS, ...JSON.parse(localStorage.getItem(CFG_KEY) || '{}') }; } catch { /* stockage indisponible */ }

const BASE = `${location.origin}/url/`;
$('#base-display').textContent = `${location.host}/url/…`;
$('#base-prefix').textContent = `${location.host}/url/`;

// ---------------------------------------------------------------- GitHub
const api = (path, init = {}) => {
  const headers = { Accept: 'application/vnd.github+json', ...(init.headers || {}) };
  if (cfg.token) headers.Authorization = `Bearer ${cfg.token}`;
  return fetch(`https://api.github.com/repos/${cfg.owner}/${cfg.repo}/${path}`, { ...init, headers });
};
const b64encode = (s) => btoa(unescape(encodeURIComponent(s)));
const b64decode = (s) => decodeURIComponent(escape(atob(s.replace(/\n/g, ''))));

let links = {};
let sha = null;   // sha du fichier, nécessaire pour l'écrire

async function loadLinks() {
  // l'API donne l'état exact du dépôt ; sans jeton, 60 requêtes / heure suffisent
  try {
    const r = await api(`contents/${LINKS_PATH}?ref=${encodeURIComponent(cfg.branch)}&t=${Date.now()}`, { cache: 'no-store' });
    if (r.status === 404) { links = {}; sha = null; return 'api'; }
    if (!r.ok) throw new Error(`GitHub ${r.status}`);
    const j = await r.json();
    links = JSON.parse(b64decode(j.content) || '{}');
    sha = j.sha;
    return 'api';
  } catch (err) {
    // repli : la copie publiée par GitHub Pages (jusqu'à 10 minutes de retard)
    const r = await fetch(`./links.json?t=${Date.now()}`, { cache: 'no-store' });
    links = r.ok ? await r.json() : {};
    sha = null;
    return 'pages';
  }
}

async function saveLinks(message) {
  if (!cfg.token) throw new Error('Jeton GitHub manquant — voir Réglages.');
  const body = { message, content: b64encode(JSON.stringify(links, null, 1)), branch: cfg.branch };
  if (sha) body.sha = sha;
  let r = await api(`contents/${LINKS_PATH}`, { method: 'PUT', body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } });
  if (r.status === 409 || r.status === 422) {
    // le fichier a changé entre-temps : on relit, on refusionne, on réessaie une fois
    const mine = { ...links };
    await loadLinks();
    links = { ...links, ...mine };
    body.sha = sha; body.content = b64encode(JSON.stringify(links, null, 1));
    r = await api(`contents/${LINKS_PATH}`, { method: 'PUT', body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } });
  }
  if (!r.ok) {
    const t = await r.text().catch(() => '');
    throw new Error(r.status === 401 ? 'Jeton refusé (401).' : r.status === 403 ? 'Accès refusé (403) : le jeton n’a pas « Contents : Read and write » sur ce dépôt.' : `GitHub ${r.status} ${t.slice(0, 120)}`);
  }
  const j = await r.json();
  sha = j.content.sha;
}

// ---------------------------------------------------------------- liens
const ALPHABET = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
function randomCode(n = 6) {
  const a = new Uint32Array(n); crypto.getRandomValues(a);
  return [...a].map((v) => ALPHABET[v % ALPHABET.length]).join('');
}
const SLUG_RE = /^[A-Za-z0-9_-]{1,32}$/;
const RESERVED = new Set(['index.html', 'links.json', 'app.js', 'style.css']);

function normalizeUrl(s) {
  s = s.trim();
  if (!/^[a-z][a-z0-9+.-]*:/i.test(s)) s = `https://${s}`;
  const u = new URL(s);
  if (!/^https?:$/.test(u.protocol)) throw new Error('Seules les adresses http(s) sont acceptées.');
  return u.href;
}

async function shorten(rawUrl, rawSlug) {
  const url = normalizeUrl(rawUrl);
  let code = rawSlug.trim();
  if (code && !SLUG_RE.test(code)) throw new Error('Alias invalide : lettres, chiffres, - et _ (32 max).');
  await loadLinks();
  if (code) {
    if (RESERVED.has(code) || links[code]) throw new Error(`L’alias « ${code} » est déjà pris.`);
  } else {
    // même cible déjà raccourcie ? on rend le lien existant
    const existing = Object.entries(links).find(([, v]) => v.u === url);
    if (existing) return { code: existing[0], url, reused: true };
    do { code = randomCode(); } while (links[code]);
  }
  links[code] = { u: url, t: new Date().toISOString() };
  await saveLinks(`url: +${code}`);
  return { code, url, reused: false };
}

async function remove(code) {
  await loadLinks();
  if (!links[code]) return;
  delete links[code];
  await saveLinks(`url: -${code}`);
}

// ---------------------------------------------------------------- page
const status = (el, msg, kind = '') => { el.textContent = msg; el.className = `status ${kind}`; };
const fmtDate = (iso) => { try { return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }); } catch { return ''; } };

function renderList() {
  const q = $('#filter').value.trim().toLowerCase();
  const rows = Object.entries(links)
    .filter(([c, v]) => !q || c.toLowerCase().includes(q) || v.u.toLowerCase().includes(q))
    .sort((a, b) => (b[1].t || '').localeCompare(a[1].t || ''));
  $('#count').textContent = Object.keys(links).length;
  const box = $('#list');
  if (!rows.length) { box.innerHTML = `<p class="empty">${q ? 'Aucun lien ne correspond.' : 'Aucun lien pour l’instant.'}</p>`; return; }
  box.innerHTML = `<div style="overflow-x:auto"><table><thead><tr><th>Court</th><th>Cible</th><th>Créé</th><th></th></tr></thead><tbody>${rows.map(([c, v]) => `
    <tr data-code="${c}">
      <td class="code"><a href="${BASE}${c}" target="_blank" rel="noopener">/url/${c}</a></td>
      <td class="target" title="${escapeHtml(v.u)}"><a href="${escapeHtml(v.u)}" target="_blank" rel="noopener" style="color:inherit">${escapeHtml(v.u)}</a></td>
      <td class="when">${fmtDate(v.t)}</td>
      <td class="ops"><button class="small" data-copy="${c}">Copier</button> <button class="small danger" data-del="${c}">Supprimer</button></td>
    </tr>`).join('')}</tbody></table></div>`;
}
function escapeHtml(s) { return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

async function copyText(t, btn) {
  try { await navigator.clipboard.writeText(t); if (btn) { const o = btn.textContent; btn.textContent = 'Copié ✓'; setTimeout(() => { btn.textContent = o; }, 1200); } }
  catch { prompt('Copier :', t); }
}

$('#form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = $('#go'); btn.disabled = true;
  status($('#status'), 'Enregistrement dans le dépôt…');
  $('#result').classList.remove('show');
  try {
    const { code, url, reused } = await shorten($('#url').value, $('#slug').value);
    const short = `${BASE}${code}`;
    $('#result-link').textContent = short.replace(/^https?:\/\//, '');
    $('#result-link').href = short;
    $('#result-target').textContent = url;
    $('#result-note').textContent = reused ? 'Cette adresse était déjà raccourcie : voici son lien.' : 'Publié. Actif tout de suite via le dépôt, et sur GitHub Pages sous une minute.';
    $('#result').classList.add('show');
    $('#result').dataset.short = short;
    status($('#status'), '', 'ok');
    $('#url').value = ''; $('#slug').value = '';
    renderList();
    copyText(short);
  } catch (err) {
    status($('#status'), err.message, 'err');
  } finally { btn.disabled = false; }
});
$('#copy').addEventListener('click', (e) => copyText($('#result').dataset.short, e.target));
$('#preview').addEventListener('click', () => window.open(`${$('#result').dataset.short}+`, '_blank'));

$('#list').addEventListener('click', async (e) => {
  const b = e.target.closest('button'); if (!b) return;
  if (b.dataset.copy) return copyText(`${BASE}${b.dataset.copy}`, b);
  if (b.dataset.del) {
    const c = b.dataset.del;
    if (!confirm(`Supprimer /url/${c} ?`)) return;
    b.disabled = true;
    try { await remove(c); renderList(); } catch (err) { alert(err.message); b.disabled = false; }
  }
});
$('#filter').addEventListener('input', renderList);
$('#refresh').addEventListener('click', async () => { $('#refresh').disabled = true; await loadLinks(); renderList(); $('#refresh').disabled = false; });

// --- réglages ------------------------------------------------------
const fill = () => { $('#cfg-owner').value = cfg.owner; $('#cfg-repo').value = cfg.repo; $('#cfg-branch').value = cfg.branch; $('#cfg-token').value = cfg.token; };
fill();
$('#cfg-save').addEventListener('click', async () => {
  cfg = { owner: $('#cfg-owner').value.trim(), repo: $('#cfg-repo').value.trim(), branch: $('#cfg-branch').value.trim(), token: $('#cfg-token').value.trim() };
  try { localStorage.setItem(CFG_KEY, JSON.stringify(cfg)); status($('#cfg-status'), 'Enregistré dans ce navigateur.', 'ok'); }
  catch { status($('#cfg-status'), 'Impossible d’enregistrer (stockage local bloqué).', 'err'); }
  await loadLinks(); renderList();
});
$('#cfg-forget').addEventListener('click', () => { cfg.token = ''; $('#cfg-token').value = ''; try { localStorage.setItem(CFG_KEY, JSON.stringify(cfg)); } catch { /* rien */ } status($('#cfg-status'), 'Jeton oublié.'); });
$('#cfg-test').addEventListener('click', async () => {
  status($('#cfg-status'), 'Test…');
  try {
    const r = await api(`branches/${encodeURIComponent(cfg.branch)}`);
    if (!r.ok) throw new Error(r.status === 404 ? 'Dépôt ou branche introuvable.' : `GitHub ${r.status}`);
    const w = cfg.token ? await api('').then((x) => x.json()).then((j) => j.permissions) : null;
    status($('#cfg-status'), `Branche ${cfg.branch} trouvée${w ? (w.push ? ' · écriture autorisée ✓' : ' · mais le jeton ne peut pas écrire') : ' · sans jeton : lecture seule'}.`, w && !w.push ? 'err' : 'ok');
  } catch (err) { status($('#cfg-status'), err.message, 'err'); }
});

// bookmarklet : ouvre cette page pré-remplie avec l'adresse courante
$('#bookmarklet').href = `javascript:void(window.open('${BASE}?u='+encodeURIComponent(location.href),'_blank'))`;
const pre = new URLSearchParams(location.search).get('u');
if (pre) { $('#url').value = pre; history.replaceState(null, '', location.pathname); }

// --- démarrage ------------------------------------------------------
if (!cfg.token) status($('#status'), 'Aucun jeton GitHub : la création est désactivée, voir Réglages.', '');
loadLinks().then(renderList);
