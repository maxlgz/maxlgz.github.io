// Défi du jour — un objectif renouvelé chaque jour, généré déterministe à
// partir de la date courante (même défi pour tout le monde le même jour).
//
// Public:
//   window.DAILY.report(event, amount = 1)
//     Events:
//       'note-hit'      — une note correcte (École ou Atelier)
//       'lesson-done'   — une leçon École complétée pour la 1re fois
//       'rhythm-pass'   — un exercice rythme passé (≥70%)
//       'chord-done'    — un accord plein
//       'song-done'     — un morceau Atelier joué jusqu'au bout
//       'combo'         — un palier de combo Atelier (×25, ×50…)
//       'minute'        — une minute de pratique active
//       'improv'        — un mesure d'improvisation jouée
//
//   window.DAILY.refresh()        — re-render l'UI
//   window.DAILY.getCurrent()     — { challenge, progress, done, bonusXp }
//   window.DAILY.reset()          — efface la progression d'aujourd'hui (debug)

(function () {
  // ------------------------------------------------------------
  // Pool de défis. {id, label, hint, target, event, bonusXp}
  // ------------------------------------------------------------

  const POOL = [
    {
      id: 'notes-50', event: 'note-hit', target: 50, bonusXp: 25,
      label: 'Cinquante notes en place',
      hint: 'Joue 50 notes correctes — toutes sources confondues (École, Atelier, micro).',
      icon: '♪',
    },
    {
      id: 'notes-120', event: 'note-hit', target: 120, bonusXp: 40,
      label: 'Cent vingt notes',
      hint: 'Une vraie petite session. 120 notes correctes dans la journée.',
      icon: '♪',
    },
    {
      id: 'lesson-1', event: 'lesson-done', target: 1, bonusXp: 30,
      label: 'Boucler une leçon',
      hint: 'Termine n\'importe quelle leçon École aujourd\'hui.',
      icon: '✦',
    },
    {
      id: 'lesson-2', event: 'lesson-done', target: 2, bonusXp: 50,
      label: 'Deux leçons en une journée',
      hint: 'Acquiers deux leçons École distinctes.',
      icon: '✦',
    },
    {
      id: 'rhythm-1', event: 'rhythm-pass', target: 1, bonusXp: 25,
      label: 'Un exercice rythme propre',
      hint: 'Réussis un exercice rythme avec ≥ 70 % de précision.',
      icon: '𝅘𝅥',
    },
    {
      id: 'rhythm-3', event: 'rhythm-pass', target: 3, bonusXp: 45,
      label: 'Trois rythmes propres',
      hint: 'Trois exercices rythme à ≥ 70 %. Solide.',
      icon: '𝅘𝅥',
    },
    {
      id: 'chord-3', event: 'chord-done', target: 3, bonusXp: 25,
      label: 'Trois accords pleins',
      hint: 'Plaque trois accords parfaits dans la journée.',
      icon: '⌬',
    },
    {
      id: 'song-1', event: 'song-done', target: 1, bonusXp: 35,
      label: 'Un morceau bouclé',
      hint: 'Joue un morceau Atelier jusqu\'à la dernière note.',
      icon: '♫',
    },
    {
      id: 'combo-25', event: 'combo', target: 1, bonusXp: 30,
      label: 'Combo ×25 ou plus',
      hint: 'Maintiens un combo Atelier à 25 notes consécutives.',
      icon: '⚡',
    },
    {
      id: 'minutes-5', event: 'minute', target: 5, bonusXp: 20,
      label: 'Cinq minutes au piano',
      hint: 'Pratique au moins 5 minutes aujourd\'hui — n\'importe quel mode.',
      icon: '⌛',
    },
    {
      id: 'minutes-15', event: 'minute', target: 15, bonusXp: 50,
      label: 'Un quart d\'heure de travail',
      hint: '15 minutes de pratique active aujourd\'hui.',
      icon: '⌛',
    },
    {
      id: 'improv-4', event: 'improv', target: 4, bonusXp: 20,
      label: 'Quatre mesures d\'impro',
      hint: 'Lance une grille d\'improvisation, tiens-la 4 mesures.',
      icon: '✺',
    },
  ];

  // ------------------------------------------------------------
  // Date helpers
  // ------------------------------------------------------------

  function todayKey() {
    return new Date().toISOString().slice(0, 10);
  }

  function hashString(s) {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function pickFor(dateStr) {
    return POOL[hashString(dateStr) % POOL.length];
  }

  // ------------------------------------------------------------
  // Persistance
  // ------------------------------------------------------------

  const STORAGE = 'etude-daily-v1';

  function loadAll() {
    try {
      const raw = localStorage.getItem(STORAGE);
      return raw ? JSON.parse(raw) : { history: {} };
    } catch (_) { return { history: {} }; }
  }

  function saveAll(data) {
    try { localStorage.setItem(STORAGE, JSON.stringify(data)); } catch (_) {}
  }

  function getOrInitToday() {
    const all = loadAll();
    const k = todayKey();
    if (!all.history[k]) {
      const challenge = pickFor(k);
      all.history[k] = {
        id: challenge.id,
        progress: 0,
        done: false,
        claimedXp: false,
      };
      saveAll(all);
    }
    return { all, day: all.history[k] };
  }

  // ------------------------------------------------------------
  // Reporting events
  // ------------------------------------------------------------

  function report(event, amount = 1) {
    const { all, day } = getOrInitToday();
    if (day.done) return;
    const challenge = POOL.find((p) => p.id === day.id);
    if (!challenge) return;
    if (challenge.event !== event) return;
    day.progress = Math.min(challenge.target, day.progress + amount);
    if (day.progress >= challenge.target) {
      day.done = true;
      celebrate(challenge);
    }
    saveAll(all);
    render();
  }

  function celebrate(challenge) {
    if (window.MASCOT) {
      window.MASCOT.celebrate('daily', { xp: challenge.bonusXp });
      window.MASCOT.say(`Défi du jour acquis ✦ +${challenge.bonusXp} XP bonus.`,
        { force: true, important: true, durationMs: 4000 });
    }
    const all = loadAll();
    const day = all.history[todayKey()];
    if (day && !day.claimedXp) {
      day.claimedXp = true;
      saveAll(all);
    }
  }

  function reset() {
    const all = loadAll();
    delete all.history[todayKey()];
    saveAll(all);
    render();
  }

  // ------------------------------------------------------------
  // UI
  // ------------------------------------------------------------

  function render() {
    const el = document.getElementById('daily');
    if (!el) return;
    const { day } = getOrInitToday();
    const challenge = POOL.find((p) => p.id === day.id);
    if (!challenge) { el.innerHTML = ''; return; }

    const pct = Math.round((day.progress / challenge.target) * 100);
    const dateLabel = new Date().toLocaleDateString('fr-FR', {
      weekday: 'long', day: 'numeric', month: 'long',
    });

    el.innerHTML = `
      <article class="daily-card${day.done ? ' is-done' : ''}">
        <header class="daily-head">
          <span class="daily-eyebrow">${dateLabel}</span>
          <span class="daily-bonus">+${challenge.bonusXp} XP bonus</span>
        </header>
        <div class="daily-main">
          <span class="daily-icon" aria-hidden="true">${challenge.icon}</span>
          <div class="daily-text">
            <h3 class="daily-title">${challenge.label}</h3>
            <p class="daily-hint">${challenge.hint}</p>
          </div>
        </div>
        <div class="daily-progress">
          <div class="daily-progress-bar">
            <div class="daily-progress-fill" style="width:${pct}%"></div>
          </div>
          <span class="daily-progress-label">
            ${day.done ? '<strong>Acquis ✓</strong>' : `<strong>${day.progress}</strong> / ${challenge.target}`}
          </span>
        </div>
      </article>
    `;
  }

  // ------------------------------------------------------------
  // Boot — annonce le défi à Sol au load (une fois par jour).
  // ------------------------------------------------------------

  function announceIfNew() {
    const all = loadAll();
    const k = todayKey();
    const day = all.history[k];
    if (!day || day.done) return;
    const announcedKey = 'etude-daily-announced';
    let announced = '';
    try { announced = localStorage.getItem(announcedKey) || ''; } catch (_) {}
    if (announced === k) return;
    try { localStorage.setItem(announcedKey, k); } catch (_) {}
    const challenge = POOL.find((p) => p.id === day.id);
    if (!challenge || !window.MASCOT) return;
    setTimeout(() => {
      window.MASCOT.say(`Défi du jour : ${challenge.label}.`,
        { force: true, important: true, durationMs: 4500 });
    }, 3500);
  }

  function attach() {
    getOrInitToday();
    render();
    announceIfNew();
  }

  window.DAILY = {
    report, refresh: render, getCurrent: () => {
      const { day } = getOrInitToday();
      const challenge = POOL.find((p) => p.id === day.id);
      return { challenge, progress: day.progress, done: day.done, bonusXp: challenge?.bonusXp || 0 };
    }, reset,
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', attach);
  } else {
    attach();
  }
})();
