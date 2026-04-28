// Carnet — practice tracking & dashboard.
// Stores per-day { minutes, lessons } in localStorage.
//
// Auto-tracks: increments today's minutes by 1 every 60s when the user
// is actively in École mode with a lesson open AND the tab is visible.

(function () {
  const KEY = 'etude-journal-v1';
  const TICK_MS = 60000;

  const state = {
    timer: null,
  };

  function todayKey() {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  }

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return { days: {}, completedLessons: [] };
      const parsed = JSON.parse(raw);
      return {
        days: parsed.days || {},
        completedLessons: parsed.completedLessons || [],
      };
    } catch (_) {
      return { days: {}, completedLessons: [] };
    }
  }

  function save(j) {
    try { localStorage.setItem(KEY, JSON.stringify(j)); } catch (_) {}
  }

  function record(minutes) {
    const j = load();
    const k = todayKey();
    if (!j.days[k]) j.days[k] = { minutes: 0, lessons: 0 };
    j.days[k].minutes += minutes;
    save(j);
    render();
  }

  function recordLessonCompleted(lessonId) {
    const j = load();
    const k = todayKey();
    if (!j.days[k]) j.days[k] = { minutes: 0, lessons: 0 };
    j.days[k].lessons += 1;
    if (!j.completedLessons.includes(lessonId)) j.completedLessons.push(lessonId);
    save(j);
    render();
  }

  function streak() {
    const j = load();
    const days = j.days;
    let s = 0;
    const d = new Date();
    while (true) {
      const k = d.toISOString().slice(0, 10);
      if (days[k] && days[k].minutes > 0) {
        s++;
        d.setDate(d.getDate() - 1);
      } else break;
    }
    return s;
  }

  function totalMinutes() {
    const j = load();
    return Object.values(j.days).reduce((a, b) => a + (b.minutes || 0), 0);
  }

  function last7Days() {
    const j = load();
    const out = [];
    const d = new Date();
    for (let i = 6; i >= 0; i--) {
      const day = new Date(d);
      day.setDate(d.getDate() - i);
      const k = day.toISOString().slice(0, 10);
      out.push({
        date: k,
        label: ['D', 'L', 'M', 'M', 'J', 'V', 'S'][day.getDay()],
        minutes: (j.days[k] && j.days[k].minutes) || 0,
      });
    }
    return out;
  }

  function formatMinutes(m) {
    if (m < 60) return m + ' min';
    const h = Math.floor(m / 60);
    const mm = m % 60;
    return mm === 0 ? `${h} h` : `${h} h ${mm}`;
  }

  // ------------------------------------------------------------
  // Render
  // ------------------------------------------------------------

  function render() {
    const el = document.getElementById('journal');
    if (!el) return;
    const j = load();
    const s = streak();
    const tot = totalMinutes();
    const completed = j.completedLessons.length;
    const days = last7Days();
    const maxM = Math.max(1, ...days.map((d) => d.minutes));

    el.innerHTML = `
      <div class="journal-stats">
        <div class="jstat">
          <span class="jstat-num">${s}</span>
          <span class="jstat-lab">jour${s > 1 ? 's' : ''} d'affilée</span>
        </div>
        <div class="jstat">
          <span class="jstat-num">${formatMinutes(tot)}</span>
          <span class="jstat-lab">de pratique</span>
        </div>
        <div class="jstat">
          <span class="jstat-num">${completed}</span>
          <span class="jstat-lab">leçon${completed > 1 ? 's' : ''} acquise${completed > 1 ? 's' : ''}</span>
        </div>
      </div>
      <div class="journal-graph">
        ${days.map((d) => `
          <div class="jbar" title="${d.date} — ${d.minutes} min">
            <div class="jbar-fill" style="height:${(d.minutes / maxM) * 100}%"></div>
            <span class="jbar-label">${d.label}</span>
          </div>
        `).join('')}
      </div>
    `;
  }

  // ------------------------------------------------------------
  // Activity tracking — increments when relevant.
  // ------------------------------------------------------------

  function isActivelyPracticing() {
    if (document.hidden) return false;
    if (window.SCHOOL && window.SCHOOL.isLessonRunning && window.SCHOOL.isLessonRunning()) return true;
    // Atelier in progress also counts.
    if (typeof window.lesson === 'object' && window.lesson && window.lesson.running) return true;
    return false;
  }

  function startTracker() {
    if (state.timer) return;
    state.timer = setInterval(() => {
      if (isActivelyPracticing()) {
        record(1);
        if (window.DAILY) window.DAILY.report('minute', 1);
      }
    }, TICK_MS);
  }

  // Public hook for lessons.js to call when a lesson is completed.
  window.JOURNAL = {
    recordLessonCompleted,
    refresh: render,
  };

  function attach() {
    render();
    startTracker();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', attach);
  } else {
    attach();
  }
})();
