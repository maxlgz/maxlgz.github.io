// Alibi — enquête guidée : une bulle accompagne le joueur pas à pas sur le vrai écran de partie.
// Le jeu (mountGame, option `guide`) appelle attach(api), allow(action), emit(évènement),
// remind(message), accuseHTML(), quit() et destroy().
import { openModal, esc } from './game.js';
import { play } from './sound.js';

const CHAPTERS = 8;
const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function createGuide({ onQuit, onFirst, onHome } = {}) {
  let api = null;
  let idx = 0;
  let bubble = null;
  let rings = [];
  let hand = null;
  let raf = 0;
  let observer = null;
  let lastInput = 'pointer';
  let finished = false;
  let destroyed = false;
  let remindTimer = null;

  const cell = (r, c) => api.board.cells[r][c];
  const card = (id) => api.cardEls[id];
  const pick = (id) => api.pickEls[id];
  const clueLi = (id, i) => card(id).querySelector(`li[data-i="${i}"]`);
  const oneTap = () => !!(api && api.settings().oneTap);
  const wide = () => !!(api && api.wide());
  const S = () => api.state();
  const isAt = (id, r, c) => { const p = S().placements[id]; return !!(p && p[0] === r && p[1] === c); };
  const hasNote = (r, c, id) => (S().notes[`${r},${c}`] || []).includes(id);
  const pickTarget = (id) => (wide() ? card(id) : pick(id));
  const rowCells = (r) => api.board.cells[r];
  const colCells = (c) => api.board.cells.map((row) => row[c]);

  // Gestes, selon le réglage « pose en un toucher ».
  const G = {
    place: () => (oneTap() ? 'touchez' : 'gardez le doigt appuyé sur'),
    placeNoun: () => (oneTap() ? 'un simple toucher' : 'un appui long'),
    note: () => (oneTap() ? 'un appui long' : 'un toucher bref'),
  };
  const kbd = (txt) => (wide() ? `<small class="guide-kbd">${txt}</small>` : '');
  const placeKbd = () => kbd('À la souris : double-clic ou clic droit. Au clavier : flèches, puis Maj+Entrée (ou P).');

  const nudgeSelect = (id, name) => (a) => (a.type === 'select' && a.id === id ? true : `Touchez la fiche de ${name}${wide() ? '' : ' ou son jeton sous le plan'}.`);

  /* ------------------------------------------------------------------ */
  /* Parcours                                                            */
  /* ------------------------------------------------------------------ */
  const STEPS = [
    {
      ch: 1, id: 'welcome', next: 'C’est parti !',
      targets: () => [],
      anchor: () => api.screen.querySelector('.board-wrap'),
      text: () => `<b>Bienvenue à la guinguette !</b> Barnabé, l’accordéoniste, a été tué pendant le bal. Cinq personnes, cinq témoignages qui ne mentent jamais : je vous montre comment les croiser, pas à pas.`,
      allow: () => 'Lisez la bulle, puis touchez « C’est parti ! ».',
    },
    {
      ch: 1, id: 'read',
      targets: () => [card('F')],
      text: () => `Chaque fiche rassemble le témoignage d’une personne. Lisez celle de <b>Firmin</b> : il était assis sur le tabouret. Touchez sa fiche pour le choisir.`,
      allow: (a) => (a.type === 'select' && a.id === 'F' ? true : 'Commençons par Firmin : touchez sa fiche.'),
      done: () => S().selected === 'F',
    },
    {
      ch: 2, id: 'object', next: 'Je le vois',
      targets: () => [cell(3, 3)],
      enter: () => api.flashType('stool'),
      text: () => `Où est ce tabouret ? Le voici, en surbrillance dans la <b>Buvette</b>. Les objets dont parlent les témoignages sont dessinés sur le plan ; la légende du plan les nomme tous.`,
      allow: () => 'Repérez le tabouret en surbrillance, puis touchez « Je le vois ».',
    },
    {
      ch: 3, id: 'place', gesture: true,
      targets: () => [cell(3, 3)],
      text: () => (oneTap()
        ? `Posez Firmin sur le tabouret. Vous avez activé la <b>pose en un toucher</b> : <b>touchez simplement</b> la case. (Chez vous, l’appui long sert aux notes.)${placeKbd()}`
        : `Posez Firmin sur le tabouret : <b>gardez le doigt appuyé</b> sur la case jusqu’à ce que le cercle se remplisse.${placeKbd()}`),
      allow: (a) => {
        if (a.type === 'place' && a.id === 'F' && a.r === 3 && a.c === 3) return true;
        if (a.type === 'select' && a.id === 'F') return true;
        if (a.type === 'note' && a.r === 3 && a.c === 3) return `Presque ! ${oneTap() ? 'L’appui long' : 'Un toucher bref'} ne pose qu’une note au crayon. Pour poser Firmin, ${G.place()} la case du tabouret${oneTap() ? '' : ' un peu plus longtemps'}.`;
        return `Firmin était sur le tabouret : ${G.place()} cette case-là.`;
      },
      done: () => isAt('F', 3, 3),
    },
    {
      ch: 4, id: 'crosses', next: 'Compris', soft: true,
      targets: () => [rowCells(3), colCells(3)],
      anchor: () => cell(3, 3),
      text: () => `Bien joué ! Chaque ligne et chaque colonne n’accueille <b>qu’une seule personne</b>. Le jeu barre donc d’office d’une croix le reste de sa ligne et de sa colonne : personne d’autre ne peut s’y tenir.`,
      allow: () => 'Regardez les croix, puis touchez « Compris ».',
    },
    {
      ch: 5, id: 'lison',
      targets: () => [card('L')],
      text: () => `Au tour de <b>Lison</b> : elle était dans la <b>Tonnelle</b>. Touchez sa fiche pour la choisir.`,
      allow: (a) => (a.type === 'select' && a.id === 'L' ? true : 'Choisissez Lison : touchez sa fiche.'),
      done: () => S().selected === 'L',
    },
    {
      ch: 5, id: 'notes',
      targets: () => [cell(2, 0), cell(4, 1)],
      text: () => `Dans la Tonnelle, seules <b>deux cases</b> restent libres : les autres sont barrées ou prises par un objet. On ne sait pas encore laquelle est la bonne : notez Lison <b>au crayon</b> sur les deux, d’${G.note()} sur chaque case.${kbd('Au clavier : Entrée pose une note.')}`,
      allow: (a) => {
        const ok = (a.r === 2 && a.c === 0) || (a.r === 4 && a.c === 1);
        if (a.type === 'note' && a.id === 'L' && ok) return true;
        if (a.type === 'select' && a.id === 'L') return true;
        if (a.type === 'place') return `Pas encore ! On hésite entre deux cases : une simple note au crayon suffit (${G.note()}).`;
        return `Notez Lison sur les deux cases en surbrillance (${G.note()} sur chacune).`;
      },
      done: () => hasNote(2, 0, 'L') && hasNote(4, 1, 'L'),
    },
    {
      ch: 5, id: 'decide',
      targets: () => (wide() ? [cell(4, 1), cell(4, 0), clueLi('L', 1)] : [cell(4, 1), cell(4, 0)]),
      anchor: () => cell(4, 1),
      text: () => `Son deuxième indice tranche : elle était <b>à côté du tonneau</b>. Seule la case du bas touche le tonneau (dans la même pièce). Posez Lison dessus, d’${G.placeNoun()} : ses notes s’effacent toutes seules.`,
      allow: (a) => {
        if (a.type === 'place' && a.id === 'L' && a.r === 4 && a.c === 1) return true;
        if (a.type === 'select' && a.id === 'L') return true;
        if (a.type === 'place' && a.id === 'L') return 'Cette case-là ne touche pas le tonneau. Essayez celle du bas, juste à côté.';
        return `Posez Lison sur la case à côté du tonneau (${G.placeNoun()}).`;
      },
      done: () => isAt('L', 4, 1),
    },
    {
      ch: 6, id: 'crossTool',
      targets: () => (wide() ? [api.tools.cross, cell(2, 2), clueLi('F', 1)] : [api.tools.cross, cell(2, 2)]),
      anchor: () => cell(2, 2),
      text: () => `Firmin a aussi dit qu’il était <b>seul dans sa pièce</b> : personne d’autre à la Buvette. Sa dernière case libre, en surbrillance, peut donc être barrée. Activez l’outil <b>Croix</b> dans la barre d’outils.`,
      allow: (a) => (a.type === 'tool' && a.tool === 'cross' && a.on ? true : 'Touchez d’abord l’outil « Croix » dans la barre d’outils.'),
      done: () => S().mode === 'cross',
    },
    {
      ch: 6, id: 'crossCell',
      targets: () => [cell(2, 2)],
      text: () => `L’outil Croix est actif. Touchez la case en surbrillance pour y poser une croix : c’est votre pense-bête, « personne ici ».`,
      allow: (a) => (a.type === 'cross' && a.r === 2 && a.c === 2 ? true : 'Posez la croix sur la case en surbrillance de la Buvette.'),
      done: () => !!S().crosses['2,2'],
    },
    {
      ch: 6, id: 'crossOff',
      targets: () => [api.tools.cross],
      text: () => `Parfait ! Touchez à nouveau l’outil <b>Croix</b> pour le ranger et revenir aux poses.`,
      allow: (a) => (a.type === 'tool' && a.tool === 'cross' && !a.on ? true : 'Rangez d’abord l’outil Croix : touchez-le à nouveau.'),
      done: () => S().mode == null,
    },
    {
      ch: 6, id: 'oscar',
      targets: () => [pickTarget('O')],
      text: () => `<b>Oscar</b> était allongé sur le transat, au Ponton. Choisissez-le${wide() ? ' (sa fiche)' : ' : son jeton est juste sous le plan'}.`,
      allow: nudgeSelect('O', 'Oscar'),
      done: () => S().selected === 'O',
    },
    {
      ch: 6, id: 'oscarPlace',
      targets: () => [cell(1, 4)],
      text: () => `Le transat est en surbrillance : posez Oscar dessus (${G.placeNoun()}).`,
      allow: (a) => {
        if (a.type === 'place' && a.id === 'O' && a.r === 1 && a.c === 4) return true;
        if (a.type === 'select' && a.id === 'O') return true;
        return `Posez Oscar sur le transat (${G.placeNoun()}).`;
      },
      done: () => isAt('O', 1, 4),
    },
    {
      ch: 7, id: 'victim',
      targets: () => [card('B')],
      text: () => `Restent Nora et Barnabé, et deux cases libres. Lisez la fiche de <b>Barnabé</b> : la victime était <b>seule avec son meurtrier</b>, donc exactement deux personnes dans sa pièce. Touchez sa fiche.`,
      allow: (a) => (a.type === 'select' && a.id === 'B' ? true : 'Touchez la fiche de Barnabé, la victime.'),
      done: () => S().selected === 'B',
    },
    {
      ch: 7, id: 'victimPlace',
      targets: () => [cell(2, 0), cell(0, 2)],
      anchor: () => cell(2, 0),
      text: () => `Dans la Salle de bal, Barnabé serait tout seul : impossible ! Il était donc à la <b>Tonnelle</b>, avec Lison. Posez-le sur la case libre de la Tonnelle (${G.placeNoun()}).`,
      allow: (a) => {
        if (a.type === 'place' && a.id === 'B' && a.r === 2 && a.c === 0) return true;
        if (a.type === 'select' && a.id === 'B') return true;
        if (a.type === 'place' && a.id === 'B') return 'Dans la Salle de bal, Barnabé serait seul. Or la victime partageait sa pièce avec une seule personne : visez la Tonnelle.';
        return `Posez Barnabé dans la Tonnelle (${G.placeNoun()}).`;
      },
      done: () => isAt('B', 2, 0),
    },
    {
      ch: 7, id: 'nora',
      targets: () => [pickTarget('N'), cell(0, 2)],
      anchor: () => cell(0, 2),
      text: () => `Et <b>Nora</b> prend la dernière case, dans la Salle de bal (elle n’était pas au Ponton : ça colle). Choisissez-la, puis posez-la (${G.placeNoun()}).`,
      allow: (a) => {
        if (a.type === 'select' && a.id === 'N') return true;
        if (a.type === 'place' && a.id === 'N' && a.r === 0 && a.c === 2) return true;
        if (a.type === 'place' && S().selected !== 'N') return 'Choisissez d’abord Nora (sa fiche ou son jeton).';
        return `Posez Nora sur la case libre de la Salle de bal (${G.placeNoun()}).`;
      },
      done: () => isAt('N', 0, 2),
    },
    {
      ch: 8, id: 'validate',
      targets: () => [api.tools.validate],
      text: () => `Tout le monde est sur le plan, et les points des fiches passent au vert. Touchez <b>Valider</b> pour vérifier votre plan.`,
      allow: (a) => (a.type === 'tool' && a.tool === 'validate' ? true : 'Il ne reste qu’à toucher « Valider ».'),
      done: () => S().phase === 'accuse',
    },
    {
      ch: 8, id: 'accuse', hidden: true,
      targets: () => [],
      text: () => '',
      allow: (a) => {
        if (a.type !== 'accuse') return 'Désignez le coupable dans la fenêtre.';
        if (a.ok) return true;
        const name = (api.byId[a.id] && api.byId[a.id].name) || '';
        return `Pas ${name} : qui partageait la Tonnelle avec Barnabé ?`;
      },
    },
  ];
  const step = () => STEPS[idx];

  /* ------------------------------------------------------------------ */
  /* Bulle et surbrillances                                              */
  /* ------------------------------------------------------------------ */
  function buildBubble() {
    bubble = document.createElement('section');
    bubble.className = 'guide-bubble';
    bubble.setAttribute('aria-label', 'Enquête guidée');
    bubble.innerHTML = `<div class="guide-head"><span class="guide-step"></span>
        <button type="button" class="btn btn--ghost btn--small guide-quit" data-g="quit">Quitter le guide</button></div>
      <p class="guide-text" aria-live="polite"></p>
      <p class="guide-remind" role="status" aria-live="assertive"></p>
      <div class="guide-actions"></div>
      <span class="guide-arrow" aria-hidden="true"></span>`;
    // Juste après l’en-tête dans l’ordre du document : au clavier, la bulle vient avant le plan.
    api.topbar.after(bubble);
    bubble.addEventListener('click', (e) => {
      const b = e.target.closest('[data-g]');
      if (!b) return;
      if (b.dataset.g === 'quit') { play('tap'); quit(); return; }
      if (b.dataset.g === 'next') { play('tap'); advance(); }
    });
  }

  function clearRings() {
    rings.forEach((r) => r.remove());
    rings = [];
    if (hand) { hand.remove(); hand = null; }
    document.querySelectorAll('.guide-target').forEach((el) => el.classList.remove('guide-target'));
  }

  const flat = (t) => (Array.isArray(t) ? t.flat(Infinity) : [t]).filter(Boolean);
  function rectOf(t) {
    const els = flat(t);
    if (!els.length) return null;
    let top = Infinity; let left = Infinity; let right = -Infinity; let bottom = -Infinity;
    for (const el of els) {
      const r = el.getBoundingClientRect();
      top = Math.min(top, r.top); left = Math.min(left, r.left);
      right = Math.max(right, r.right); bottom = Math.max(bottom, r.bottom);
    }
    return { top, left, right, bottom, width: right - left, height: bottom - top };
  }
  const inToolbar = (t) => flat(t).every((el) => el.closest && el.closest('.toolbar'));

  function enterStep() {
    clearRings();
    if (!bubble || destroyed) return;
    const s = step();
    if (s.enter) s.enter();
    bubble.hidden = !!s.hidden;
    if (s.hidden) return;
    bubble.querySelector('.guide-step').textContent = `Étape ${s.ch} sur ${CHAPTERS}`;
    bubble.querySelector('.guide-text').innerHTML = s.text();
    const rem = bubble.querySelector('.guide-remind');
    rem.textContent = '';
    rem.hidden = true;
    bubble.querySelector('.guide-actions').innerHTML = s.next
      ? `<button type="button" class="btn btn--primary btn--small" data-g="next">${esc(s.next)}</button>` : '';
    bubble.dataset.step = s.id;
    const targets = s.targets();
    targets.forEach((t) => {
      const ring = document.createElement('span');
      ring.className = 'guide-ring';
      ring.setAttribute('aria-hidden', 'true');
      document.body.appendChild(ring);
      rings.push(ring);
      flat(t).forEach((el) => el.classList.add('guide-target'));
      ring._t = t;
    });
    if (s.gesture && targets.length) {
      hand = document.createElement('span');
      hand.className = `guide-hand${oneTap() ? ' guide-hand--tap' : ''}`;
      hand.setAttribute('aria-hidden', 'true');
      hand.innerHTML = `<svg viewBox="0 0 100 100"><circle class="gh-track" cx="50" cy="50" r="40"/><circle class="gh-fill" cx="50" cy="50" r="40"/></svg><span class="gh-dot"></span><span class="gh-label">${oneTap() ? 'Toucher' : 'Maintenir'}</span>`;
      document.body.appendChild(hand);
    }
    reveal();
    if (!layout()) refit();
    if (lastInput === 'key') {
      const nb = bubble.querySelector('[data-g="next"]');
      const first = flat(targets[0] || [])[0];
      const f = nb || (first && first.matches('button, [tabindex]') ? first : null);
      if (f) { try { f.focus({ preventScroll: true }); } catch { f.focus(); } }
    }
  }

  function region() {
    const vv = window.visualViewport;
    const vw = vv ? vv.width : window.innerWidth;
    const vh = vv ? vv.height : window.innerHeight;
    let top = 8;
    let bottom = vh - 8;
    const tb = api.topbar.getBoundingClientRect();
    if (tb.bottom > 0) top = Math.max(top, tb.bottom + 8);
    if (!wide()) {
      const bar = api.screen.querySelector('.toolbar').getBoundingClientRect();
      bottom = Math.min(bottom, bar.top - 8);
    }
    return { top, bottom, left: 8, right: vw - 8 };
  }

  // Fait entrer les éléments à toucher dans la zone utile (sous l'en-tête, au-dessus de la barre d'outils).
  function reveal() {
    const s = step();
    const anchorEl = s.anchor ? s.anchor() : null;
    const ts = s.targets().filter((t) => wide() || !inToolbar(t));
    const scrollers = new Set();
    ts.concat(anchorEl ? [anchorEl] : []).forEach((t) => flat(t).forEach((el) => {
      const sc = el.closest && el.closest('.cards-scroll');
      if (sc && wide()) scrollers.add(el);
    }));
    scrollers.forEach((el) => { try { el.scrollIntoView({ block: 'nearest', inline: 'nearest' }); } catch { /* rien */ } });
    const box = rectOf(ts.length ? ts : (anchorEl ? [anchorEl] : []));
    if (!box) return;
    const R = region();
    const h = R.bottom - R.top;
    if (box.top >= R.top && box.bottom <= R.bottom) return;
    const want = box.height < h ? R.top + (h - box.height) / 2 : R.top;
    window.scrollBy(0, box.top - want);
  }
  // Petit écran : si la bulle ne trouve pas de place libre, on fait défiler pour lui en laisser
  // une, sous les éléments visés (ou au-dessus), puis on recalcule.
  function refit() {
    const s = step();
    const ts = (!wide() && s.soft && s.anchor) ? [s.anchor()] : s.targets().filter((t) => wide() || !inToolbar(t));
    const box = rectOf(ts.length ? ts : (s.anchor ? [s.anchor()] : []));
    if (!box || !bubble) return;
    const R = region();
    const h = bubble.offsetHeight;
    if (box.height + h + 30 > R.bottom - R.top) return;
    const y0 = window.scrollY;
    window.scrollBy(0, box.top - (R.top + 6));
    if (layout()) return;
    window.scrollTo(0, y0);
    const b2 = rectOf(ts.length ? ts : [s.anchor()]);
    window.scrollBy(0, b2.bottom - (R.bottom - 6));
    if (!layout()) { window.scrollTo(0, y0); layout(); }
  }

  const hit = (a, b, pad = 6) => a.left < b.right + pad && a.right > b.left - pad && a.top < b.bottom + pad && a.bottom > b.top - pad;

  function layout() {
    if (!bubble || destroyed || !api) return true;
    const s = step();
    rings.forEach((ring) => {
      const r = rectOf(ring._t);
      if (!r) return;
      const pad = 3;
      // l'anneau ne déborde jamais sur l'en-tête, ni (sur téléphone) sur la barre d'outils
      const lo = api.topbar.getBoundingClientRect().bottom;
      const hi = (!wide() && !inToolbar(ring._t)) ? api.screen.querySelector('.toolbar').getBoundingClientRect().top : window.innerHeight;
      const top = Math.max(r.top - pad, lo);
      const bottom = Math.min(r.bottom + pad, hi);
      ring.hidden = bottom - top < 8;
      ring.style.left = `${r.left - pad}px`;
      ring.style.top = `${top}px`;
      ring.style.width = `${r.width + 2 * pad}px`;
      ring.style.height = `${Math.max(0, bottom - top)}px`;
    });
    if (hand && rings[0]) {
      const r = rectOf(rings[0]._t);
      const size = Math.max(44, Math.min(72, r.width));
      hand.style.width = `${size}px`;
      hand.style.height = `${size}px`;
      hand.style.left = `${r.left + r.width / 2 - size / 2}px`;
      hand.style.top = `${r.top + r.height / 2 - size / 2}px`;
    }
    if (s.hidden) return true;
    const R = region();
    const vw = R.right + 8;
    const w = wide() ? Math.min(360, vw - 16) : Math.min(440, vw - 16);
    bubble.style.width = `${w}px`;
    const h = bubble.offsetHeight;
    const extra = [];
    if (hand) extra.push(hand.getBoundingClientRect(), hand.querySelector('.gh-label').getBoundingClientRect());
    const status = api.statusEl;
    if (!wide() && status.classList.contains('is-on') && status.textContent) extra.push(status.getBoundingClientRect());
    if (wide()) extra.push(api.screen.querySelector('.toolbar').getBoundingClientRect());
    const sets = [s.targets().map(rectOf).filter(Boolean).concat(extra)];
    // Étape d'information (« soft ») : faute de place, la bulle peut mordre sur la surbrillance, jamais sur l'ancre.
    if (!wide() && s.soft && s.anchor) sets.push([rectOf(s.anchor())].concat(extra));
    let obstacles = sets[0];
    const anchorEl = s.anchor ? s.anchor() : null;
    const A = (anchorEl && rectOf(anchorEl)) || obstacles[0] || { top: R.top, bottom: R.top, left: R.left, right: R.right, width: R.right - R.left, height: 0 };
    const acx = A.left + A.width / 2;
    const acy = A.top + A.height / 2;
    const clampX = (x) => Math.max(R.left, Math.min(R.right - w, x));
    const clampY = (y) => Math.max(R.top, Math.min(R.bottom - h, y));
    const fits = (x, y) => {
      if (x < R.left - 0.5 || x + w > R.right + 0.5 || y < R.top - 0.5 || y + h > R.bottom + 0.5) return false;
      const b = { left: x, right: x + w, top: y, bottom: y + h };
      return !obstacles.some((o) => hit(b, o));
    };
    let best = null;
    for (const set of sets) {
      obstacles = set;
      const cands = [];
      // Grand écran : un élément du plan → la bulle se range à droite du plan, sans le couvrir.
      const firstEl = anchorEl || flat(s.targets())[0];
      if (wide() && firstEl && api.board.el.contains(firstEl)) {
        const bx = api.board.el.getBoundingClientRect().right + 18;
        cands.push({ x: bx, y: clampY(acy - h / 2), side: 'left' });
        let alt = null; let bestD = Infinity;
        for (let y = R.top; y <= R.bottom - h; y += 6) {
          if (!fits(bx, y)) continue;
          const d = Math.abs(y + h / 2 - acy);
          if (d < bestD) { bestD = d; alt = { x: bx, y, side: 'left' }; }
        }
        if (alt) cands.push(alt);
      }
      cands.push(
        { x: clampX(acx - w / 2), y: A.bottom + 14, side: 'top' },
        { x: clampX(acx - w / 2), y: A.top - 14 - h, side: 'bottom' },
      );
      if (wide()) {
        cands.push({ x: A.right + 14, y: clampY(acy - h / 2), side: 'left' });
        cands.push({ x: A.left - 14 - w, y: clampY(acy - h / 2), side: 'right' });
      }
      best = cands.find((c) => fits(c.x, c.y));
      if (!best) {
        let bestD = Infinity;
        for (let y = R.top; y <= R.bottom - h; y += 6) {
          const x = clampX(acx - w / 2);
          if (!fits(x, y)) continue;
          const d = Math.abs(y + h / 2 - acy);
          if (d < bestD) { bestD = d; best = { x, y, side: y + h / 2 < acy ? 'bottom' : 'top' }; }
        }
      }
      if (best) break;
    }
    const found = !!best;
    if (!best) best = { x: clampX(acx - w / 2), y: Math.max(R.top, R.bottom - h), side: 'none' };
    bubble.style.left = `${Math.round(best.x)}px`;
    bubble.style.top = `${Math.round(best.y)}px`;
    // flèche vers l'élément visé
    const arrow = bubble.querySelector('.guide-arrow');
    const showArrow = !!(anchorEl || obstacles.length) && best.side !== 'none'
      && ((best.side === 'top' && best.y >= A.bottom) || (best.side === 'bottom' && best.y + h <= A.top) || best.side === 'left' || best.side === 'right');
    arrow.hidden = !showArrow;
    bubble.dataset.side = best.side;
    if (showArrow) {
      if (best.side === 'top' || best.side === 'bottom') {
        arrow.style.left = `${Math.max(18, Math.min(w - 34, acx - best.x - 8))}px`;
        arrow.style.top = '';
      } else {
        arrow.style.top = `${Math.max(18, Math.min(h - 34, acy - best.y - 8))}px`;
        arrow.style.left = '';
      }
    }
    return found;
  }
  const schedule = () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; layout(); }); };

  function advance() {
    if (finished || destroyed) return;
    idx = Math.min(STEPS.length - 1, idx + 1);
    while (STEPS[idx].done && STEPS[idx].done() && idx < STEPS.length - 1) idx++;
    enterStep();
  }

  function checkDone() {
    const s = step();
    if (s.done && s.done()) advance();
  }

  function remind(msg) {
    if (!bubble || step().hidden) return;
    const rem = bubble.querySelector('.guide-remind');
    rem.hidden = false;
    rem.innerHTML = msg;
    rem.classList.remove('wiggle');
    void rem.offsetWidth;
    if (!reduceMotion()) rem.classList.add('wiggle');
    clearTimeout(remindTimer);
    remindTimer = setTimeout(() => rem.classList.remove('wiggle'), 500);
    layout();
  }

  function finish() {
    finished = true;
    clearRings();
    if (bubble) bubble.hidden = true;
    openModal((body, close) => {
      body.innerHTML = `<div class="modal-kicker">Enquête guidée</div>
        <h2>Bravo, détective !</h2>
        <p>Lison était la meurtrière. Vous savez maintenant lire un témoignage, poser des notes et des personnages, barrer une case et démasquer le coupable grâce à la règle de la victime.</p>
        <p>Prêt pour une vraie enquête ?</p>
        <div class="modal-actions guide-end-actions">
          <button type="button" class="btn btn--ghost" data-e="home">Accueil</button>
          <button type="button" class="btn btn--accent" data-e="first" autofocus>Première énigme</button>
        </div>`;
      body.addEventListener('click', (e) => {
        const b = e.target.closest('[data-e]');
        if (!b) return;
        close(true);
        if (b.dataset.e === 'first') { if (onFirst) onFirst(); } else if (onHome) onHome();
      });
    }, { label: 'Enquête guidée terminée', className: 'modal--guide-end', silent: true, onCancel: () => { if (onHome) onHome(); } });
  }

  function quit() {
    if (destroyed) return;
    if (onQuit) onQuit();
  }

  const onKey = (e) => { if (e.key === 'Tab' || e.key === 'Enter' || e.key === ' ' || e.key.startsWith('Arrow')) lastInput = 'key'; };
  const onPtr = () => { lastInput = 'pointer'; };

  return {
    attach(a) {
      api = a;
      buildBubble();
      window.addEventListener('resize', schedule);
      window.addEventListener('scroll', schedule, true);
      if (window.visualViewport) window.visualViewport.addEventListener('resize', schedule);
      document.addEventListener('keydown', onKey, true);
      document.addEventListener('pointerdown', onPtr, true);
      try {
        observer = new MutationObserver(schedule);
        observer.observe(api.statusEl, { attributes: true, childList: true, characterData: true, subtree: true });
      } catch { observer = null; }
      // premier affichage une fois le plateau en place
      requestAnimationFrame(() => { if (!destroyed) enterStep(); });
    },
    allow(action) {
      if (finished || destroyed) return true;
      const s = step();
      return s.allow ? s.allow(action) : true;
    },
    remind,
    emit(ev) {
      if (!api || destroyed || finished) return;
      if (ev === 'won') { finish(); return; }
      if (ev === 'back' && step().id === 'accuse') { idx = STEPS.findIndex((x) => x.id === 'validate'); enterStep(); return; }
      if (ev === 'settings') { enterStep(); return; }
      if (!bubble) return;
      checkDone();
      schedule();
    },
    accuseHTML() {
      return `<div class="guide-note"><p><b>Enquête guidée.</b> Barnabé était à la Tonnelle avec une seule autre personne : celle que vous y avez posée. Touchez son portrait.</p>
        <button type="button" class="btn btn--ghost btn--small" data-guide-quit>Quitter le guide</button></div>`;
    },
    quit,
    get step() { return step().id; },
    destroy() {
      destroyed = true;
      cancelAnimationFrame(raf);
      clearTimeout(remindTimer);
      clearRings();
      if (bubble) bubble.remove();
      bubble = null;
      if (observer) observer.disconnect();
      window.removeEventListener('resize', schedule);
      window.removeEventListener('scroll', schedule, true);
      if (window.visualViewport) window.visualViewport.removeEventListener('resize', schedule);
      document.removeEventListener('keydown', onKey, true);
      document.removeEventListener('pointerdown', onPtr, true);
    },
  };
}
