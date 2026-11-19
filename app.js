'use strict';
/* global EXERCISES, PHASES, COMPOUNDS, ROUTINE, LEVEL_TITLES, GROUPS, ACHIEVEMENTS, HABITS, XP */

// ================= Estado y almacenamiento =================
const STORE_KEY = 'fitapp.v1';
const SCHEMA_VERSION = 1;

function nextMonday(d = new Date()) {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const dow = x.getDay();
  const add = dow === 1 ? 0 : ((8 - dow) % 7);
  x.setDate(x.getDate() + add);
  return ymd(x);
}

function defaultState() {
  return {
    version: SCHEMA_VERSION,
    profile: { name: 'Federico', age: 23, heightCm: 172, sex: 'm', startDate: nextMonday(), goalWeightKg: null },
    settings: { restSec: 90, incUpper: 2.5, incLower: 5 },
    session: null,          // entrenamiento en curso
    workouts: [],           // entrenamientos terminados
    body: [],               // { date, weightKg, waistCm }
    activities: [],         // { id, date, type: 'bici'|'caminata'|'correr'|'otro', minutes, km, source: 'manual'|'health_connect', externalId }
    habits: {},             // { 'YYYY-MM-DD': { water, sleep, steps } }
    achievements: {},       // { id: 'YYYY-MM-DD' }
    lastLevel: 1,
    // Preparado para próximas versiones:
    nutrition: { targets: null, meals: [], mealPlans: [], shoppingLists: [] },
    integrations: { healthConnect: { enabled: false, lastSync: null }, watch: { model: null } },
  };
}

let state = load();

function load() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) return migrate(JSON.parse(raw));
  } catch (e) { console.warn('No se pudo leer el almacenamiento', e); }
  return defaultState();
}
function migrate(s) {
  const d = defaultState();
  const out = Object.assign({}, d, s);
  out.profile = Object.assign({}, d.profile, s.profile);
  out.settings = Object.assign({}, d.settings, s.settings);
  out.nutrition = Object.assign({}, d.nutrition, s.nutrition);
  out.integrations = Object.assign({}, d.integrations, s.integrations);
  out.version = SCHEMA_VERSION;
  return out;
}
function save() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); }
  catch (e) { toast('⚠️ No se pudo guardar. Exportá un respaldo desde Ajustes.'); }
}
if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});

// ================= Utilidades =================
function ymd(d) {
  const z = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`;
}
function parseYmd(s) { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); }
function today() { return ymd(new Date()); }
function fmtDate(s, opts = { weekday: 'short', day: 'numeric', month: 'short' }) {
  return parseYmd(s).toLocaleDateString('es-AR', opts);
}
function esc(s) { return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
function num(v) { const n = parseFloat(String(v).replace(',', '.')); return isFinite(n) ? n : null; }
function fmtNum(n, d = 1) { return n == null ? '–' : Number(n.toFixed(d)).toLocaleString('es-AR'); }
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
const DAY = 86400000;

function weekNumber(dateStr = today()) {
  const start = parseYmd(state.profile.startDate);
  const diff = Math.floor((parseYmd(dateStr) - start) / DAY);
  return Math.max(1, Math.floor(diff / 7) + 1);
}
function phaseFor(week) { return PHASES.find(p => week >= p.from && week <= p.to) || PHASES[PHASES.length - 1]; }
function setsFor(exId, phase) {
  const ex = EXERCISES[exId];
  if (ex.cardio) return 1;
  if (phase.compoundSets && COMPOUNDS.includes(exId)) return phase.compoundSets;
  return phase.sets;
}
function repRange(exId, phase) { return EXERCISES[exId].time ? phase.time : phase.reps; }
function e1rm(kg, reps) { return (kg || 0) * (1 + (reps || 0) / 30); }

// ================= Progresión =================
function lastEntryFor(exId) {
  for (let i = state.workouts.length - 1; i >= 0; i--) {
    const e = state.workouts[i].ex.find(x => x.id === exId);
    if (e && e.sets.some(s => s.done)) return e;
  }
  return null;
}
function suggestion(exId, phase) {
  const ex = EXERCISES[exId];
  const [lo, hi] = repRange(exId, phase);
  const nSets = setsFor(exId, phase);
  if (ex.cardio) return { kg: null, reps: phase.cardio, text: `Objetivo: ${phase.cardio} min a ritmo conversacional.` };
  const last = lastEntryFor(exId);
  if (ex.time) {
    if (!last) return { kg: null, reps: lo, text: `Primera vez: sostené ${lo}-${hi} s por serie.` };
    const best = Math.max(...last.sets.filter(s => s.done).map(s => s.reps || 0));
    const target = Math.min(hi, Math.max(lo, best + 5));
    return { kg: null, reps: target, text: `La última vez: ${best} s. Hoy probá ${target} s.` };
  }
  if (!last) {
    return { kg: null, reps: hi, text: `Primera vez: elegí un peso con el que hagas ${hi} reps dejando ${phase.rir} en reserva. Mejor quedarte corto.` };
  }
  const done = last.sets.filter(s => s.done);
  const topKg = Math.max(...done.map(s => s.kg || 0));
  const atTop = done.filter(s => (s.kg || 0) >= topKg);
  const inc = ex.zone === 'lower' ? state.settings.incLower : (ex.zone === 'upper' ? state.settings.incUpper : 0);
  const lastTxt = done.map(s => s.reps).join('/') + (topKg ? ` reps con ${fmtNum(topKg)} kg` : ' reps');
  if (done.length >= nSets && atTop.every(s => (s.reps || 0) >= hi) && inc > 0) {
    const kg = topKg + inc;
    return { kg, reps: lo, text: `🔼 La última vez: ${lastTxt}. ¡Subí a ${fmtNum(kg)} kg y apuntá a ${lo}+ reps!`, up: true };
  }
  if (atTop.some(s => (s.reps || 0) < lo)) {
    return { kg: topKg || null, reps: lo, text: `La última vez: ${lastTxt}. Mantené el peso y buscá llegar a ${lo} reps en todas.` };
  }
  const target = Math.min(hi, Math.max(...atTop.map(s => s.reps || 0)) + 1);
  return { kg: topKg || null, reps: target, text: `La última vez: ${lastTxt}. Mantené el peso e intentá ${target} reps.` };
}

// ================= Estadísticas, XP y niveles =================
function levelNeed(L, k = 120) { return Math.round(k * Math.pow(L - 1, 1.8)); }
function levelFromXp(xp, k = 120) {
  let L = 1;
  while (levelNeed(L + 1, k) <= xp) L++;
  return { level: L, cur: xp - levelNeed(L, k), span: levelNeed(L + 1, k) - levelNeed(L, k) };
}
function levelTitle(L) { let t = LEVEL_TITLES[0][1]; for (const [n, name] of LEVEL_TITLES) if (L >= n) t = name; return t; }

function computeStats() {
  const s = { xp: 0, workouts: state.workouts.length, sets: 0, prs: 0, bikeKm: 0, cardioMin: 0, weighIns: 0, lost: 0,
    bestWeek: 0, bestStreak: 0, streak: 0, habitStreak: 0, maxWeekTrained: 0, groupXp: {} };
  GROUPS.forEach(g => (s.groupXp[g] = 0));
  const weeks = {};
  for (const w of state.workouts) {
    s.xp += XP.workout;
    s.prs += (w.prs || []).length;
    s.xp += (w.prs || []).length * XP.pr;
    weeks[w.week] = (weeks[w.week] || 0) + 1;
    s.maxWeekTrained = Math.max(s.maxWeekTrained, w.week);
    for (const e of w.ex) {
      const ex = EXERCISES[e.id]; if (!ex) continue;
      for (const st of e.sets) {
        if (!st.done) continue;
        if (ex.cardio) {
          const m = st.reps || 0; s.cardioMin += m; s.xp += m * XP.cardioMin; s.groupXp.Cardio += m * XP.cardioMin;
        } else { s.sets++; s.xp += XP.set; s.groupXp[ex.group] += XP.set; }
      }
    }
  }
  s.bestWeek = Math.max(0, ...Object.values(weeks));
  for (const a of state.activities) {
    const m = a.minutes || 0, km = a.km || 0;
    s.cardioMin += m;
    const ax = m * XP.cardioMin + (a.type === 'bici' ? km * XP.bikeKm : 0);
    s.xp += Math.round(ax); s.groupXp.Cardio += Math.round(ax);
    if (a.type === 'bici') s.bikeKm += km;
  }
  const bodySorted = [...state.body].sort((a, b) => a.date.localeCompare(b.date));
  s.weighIns = bodySorted.filter(b => b.weightKg).length;
  s.xp += s.weighIns * XP.weigh;
  const ws = bodySorted.filter(b => b.weightKg);
  if (ws.length >= 2) s.lost = Math.max(0, ws[0].weightKg - Math.min(...ws.slice(1).map(b => b.weightKg)));
  s.startWeight = ws[0]?.weightKg ?? null;
  s.currentWeight = ws[ws.length - 1]?.weightKg ?? null;
  for (const [, h] of Object.entries(state.habits)) {
    const n = HABITS.filter(x => h[x.id]).length;
    s.xp += n * XP.habit + (n === HABITS.length ? XP.allHabits : 0);
  }
  // Racha de hábitos (días seguidos con los 3)
  let d = new Date(); let hs = 0;
  if (!allHabits(ymd(d))) d.setDate(d.getDate() - 1);
  while (allHabits(ymd(d))) { hs++; d.setDate(d.getDate() - 1); }
  s.habitStreak = hs;
  Object.assign(s, streaks());
  const lv = levelFromXp(s.xp);
  s.level = lv.level; s.levelCur = lv.cur; s.levelSpan = lv.span;
  return s;
}
function allHabits(date) { const h = state.habits[date]; return !!h && HABITS.every(x => h[x.id]); }

// Racha en días hábiles (L-V): un día cuenta si entrenaste o hiciste actividad. Sábado y domingo no cortan.
function streaks() {
  const active = new Set([...state.workouts.map(w => w.date), ...state.activities.map(a => a.date)]);
  if (!active.size) return { streak: 0, bestStreak: 0 };
  const first = [...active].sort()[0];
  let d = parseYmd(first); const end = parseYmd(today());
  let cur = 0, best = 0;
  while (d <= end) {
    const k = ymd(d), dow = d.getDay();
    if (active.has(k)) { cur++; best = Math.max(best, cur); }
    else if (dow !== 0 && dow !== 6 && k !== today()) cur = 0;
    d = new Date(d.getTime() + DAY); d.setHours(0, 0, 0, 0);
  }
  return { streak: cur, bestStreak: best };
}

function checkProgress(silent = false) {
  const s = computeStats();
  const fresh = [];
  for (const a of ACHIEVEMENTS) {
    if (!state.achievements[a.id] && a.check(s)) { state.achievements[a.id] = today(); fresh.push(a); }
  }
  const leveled = s.level > (state.lastLevel || 1);
  state.lastLevel = Math.max(state.lastLevel || 1, s.level);
  save();
  if (!silent) {
    fresh.forEach(a => toast(`${a.em} Logro desbloqueado: ${a.name}`, 'gold'));
    if (leveled) toast(`⬆️ ¡Subiste a nivel ${s.level}! ${levelTitle(s.level)}`, 'gold');
  }
  return { stats: s, fresh, leveled };
}

// ================= Sesión de entrenamiento =================
function startSession(dayNum) {
  const date = today();
  const week = weekNumber(date);
  const phase = phaseFor(week);
  const r = ROUTINE[dayNum];
  state.session = {
    dayNum, date, week, phaseId: phase.id, startedAt: Date.now(),
    ex: r.ex.map(id => {
      const sug = suggestion(id, phase);
      const n = setsFor(id, phase);
      return { id, sets: Array.from({ length: n }, () => ({ kg: sug.kg, reps: null, done: false })) };
    }),
  };
  save();
  go('sesion');
}

function finishSession() {
  const ses = state.session; if (!ses) return;
  const doneSets = ses.ex.reduce((n, e) => n + e.sets.filter(s => s.done).length, 0);
  if (!doneSets) { toast('Marcá al menos una serie como hecha ✔️'); return; }
  const before = computeStats();
  // Récords personales
  const prs = [];
  for (const e of ses.ex) {
    const ex = EXERCISES[e.id]; if (ex.cardio) continue;
    const done = e.sets.filter(s => s.done); if (!done.length) continue;
    const metric = s => ex.time ? (s.reps || 0) : e1rm(s.kg, s.reps);
    let prevBest = null;
    for (const w of state.workouts) for (const pe of w.ex) if (pe.id === e.id) for (const s of pe.sets) if (s.done) prevBest = Math.max(prevBest ?? 0, metric(s));
    const best = Math.max(...done.map(metric));
    if (prevBest != null && best > prevBest + 0.01) prs.push(e.id);
  }
  const w = {
    id: uid(), date: ses.date, dayNum: ses.dayNum, dayKey: ROUTINE[ses.dayNum].key, week: ses.week, phaseId: ses.phaseId,
    durationMin: Math.round((Date.now() - ses.startedAt) / 60000),
    ex: ses.ex.map(e => ({ id: e.id, sets: e.sets.filter(s => s.done).map(s => ({ kg: s.kg, reps: s.reps, done: true })) })).filter(e => e.sets.length),
    prs,
  };
  state.workouts.push(w);
  state.session = null;
  stopRest();
  const { stats, fresh, leveled } = checkProgress(true);
  go('hoy');
  const gained = stats.xp - before.xp;
  modal(`
    <div class="levelup">
      <div style="font-size:48px">🎉</div>
      <h2>¡Entrenamiento terminado!</h2>
      <p class="muted">${w.durationMin} min · ${doneSets} series</p>
      <div class="big">+${gained} XP</div>
      ${leveled ? `<p><span class="pill gold">⬆️ Nivel ${stats.level} · ${esc(levelTitle(stats.level))}</span></p>` : ''}
      ${prs.length ? `<p>⚡ Récords: ${prs.map(id => esc(EXERCISES[id].name)).join(', ')}</p>` : ''}
      ${fresh.map(a => `<p>${a.em} <b>${esc(a.name)}</b> <span class="muted small">${esc(a.desc)}</span></p>`).join('')}
    </div>
    <button class="btn primary block" data-action="close-modal">Genial</button>`);
}

// ================= Temporizador de descanso =================
let restEnd = 0, restTimer = null;
function startRest(sec = state.settings.restSec) {
  restEnd = Date.now() + sec * 1000;
  clearInterval(restTimer);
  restTimer = setInterval(tickRest, 250);
  tickRest();
}
function stopRest() { clearInterval(restTimer); restTimer = null; const el = document.getElementById('rest'); if (el) el.remove(); }
function tickRest() {
  const left = Math.max(0, Math.round((restEnd - Date.now()) / 1000));
  let el = document.getElementById('rest');
  if (!el) {
    el = document.createElement('div'); el.id = 'rest'; el.className = 'rest';
    el.innerHTML = `<span>⏱️</span><span class="t"></span><button data-action="rest-add">+15 s</button><button data-action="rest-stop">✕</button>`;
    document.body.appendChild(el);
  }
  el.querySelector('.t').textContent = left > 0 ? `Descanso ${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}` : '¡A la siguiente serie!';
  if (left <= 0) {
    clearInterval(restTimer); restTimer = null;
    try { navigator.vibrate && navigator.vibrate([200, 100, 200]); } catch (e) {}
    beep();
    setTimeout(() => { if (!restTimer) stopRest(); }, 4000);
  }
}
function beep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.frequency.value = 880; o.connect(g); g.connect(ctx.destination);
    g.gain.setValueAtTime(0.2, ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
    o.start(); o.stop(ctx.currentTime + 0.6);
  } catch (e) {}
}

// ================= UI básica =================
let view = 'hoy';
const app = document.getElementById('app');

function go(v) { view = v; render(); window.scrollTo(0, 0); }

function toast(msg, cls = '') {
  const wrap = document.getElementById('toasts');
  const t = document.createElement('div'); t.className = 'toast ' + cls; t.textContent = msg;
  wrap.appendChild(t); setTimeout(() => t.remove(), 3500);
}
function modal(html) {
  closeModal();
  const bg = document.createElement('div'); bg.className = 'modal-bg'; bg.id = 'modal';
  bg.innerHTML = `<div class="modal">${html}</div>`;
  bg.addEventListener('click', e => { if (e.target === bg) closeModal(); });
  document.body.appendChild(bg);
}
function closeModal() { const m = document.getElementById('modal'); if (m) m.remove(); }

function render() {
  const s = computeStats();
  document.getElementById('hdr-level').textContent = s.level;
  document.getElementById('hdr-title').textContent = levelTitle(s.level);
  document.querySelectorAll('nav.bottom button').forEach(b => b.classList.toggle('on', b.dataset.go === view || (view === 'sesion' && b.dataset.go === 'hoy')));
  const fn = { hoy: viewHoy, rutina: viewRutina, progreso: viewProgreso, cuerpo: viewCuerpo, sesion: viewSesion }[view] || viewHoy;
  app.innerHTML = fn(s);
}

// ---------- Hoy ----------
function viewHoy(s) {
  const t = today(), dow = new Date().getDay();
  const week = weekNumber(t), phase = phaseFor(week);
  const beforeStart = t < state.profile.startDate;
  const doneToday = state.workouts.filter(w => w.date === t);
  const r = ROUTINE[dow];
  let workoutCard;
  if (state.session) {
    const R = ROUTINE[state.session.dayNum];
    workoutCard = `<div class="card"><h3>${R.emoji} ${esc(R.name)} en curso</h3>
      <button class="btn primary block" data-go="sesion">Continuar entrenamiento</button></div>`;
  } else if (doneToday.length) {
    workoutCard = `<div class="card"><h3>✅ Entrenamiento de hoy hecho</h3>
      <p class="muted">${doneToday.map(w => esc(ROUTINE[w.dayNum].name)).join(', ')}. ¡Bien ahí! Descansá, comé bien y tomá agua.</p></div>`;
  } else if (r) {
    workoutCard = `<div class="card"><div class="row between"><h3>${r.emoji} Hoy: ${esc(r.name)}</h3><span class="pill">${r.ex.length} ejercicios</span></div>
      <p class="muted small">${r.ex.map(id => esc(EXERCISES[id].name)).join(' · ')}</p>
      <button class="btn primary block" data-action="start" data-day="${dow}">Empezar entrenamiento</button></div>`;
  } else {
    workoutCard = `<div class="card"><h3>🛋️ Fin de semana: descanso del gimnasio</h3>
      <p class="muted">Ideal para una salida en bici tranqui o una caminata. Registrala abajo y suma XP.</p></div>`;
  }
  const otherDays = Object.entries(ROUTINE).map(([n, d]) => `<button class="btn sm" data-action="start" data-day="${n}">${d.emoji} ${esc(d.name)}</button>`).join('');
  const h = state.habits[t] || {};
  return `
    <div class="card">
      ${beforeStart ? `<p class="small" style="margin-top:0">🗓️ Tu plan arranca el <b>${esc(fmtDate(state.profile.startDate, { weekday: 'long', day: 'numeric', month: 'long' }))}</b>. Igual podés probar la app desde ya.</p>` : ''}
      <div class="row between"><b>Semana ${beforeStart ? 1 : week} · ${esc(phase.name)}</b><span class="pill blue">RIR ${phase.rir}</span></div>
      <p class="muted small" style="margin:6px 0 0">${esc(phase.desc)}</p>
    </div>
    ${workoutCard}
    ${!state.session ? `<details class="card"><summary class="muted">Entrenar otro día de la rutina</summary><div class="row wrap" style="margin-top:10px">${otherDays}</div></details>` : ''}
    <div class="card">
      <div class="row between"><h3>Misiones del día</h3><span class="muted small">+${XP.habit} XP c/u</span></div>
      <div class="habits">${HABITS.map(x => `<button class="habit ${h[x.id] ? 'on' : ''}" data-action="habit" data-h="${x.id}"><span class="em">${x.em}</span>${esc(x.name)}</button>`).join('')}</div>
    </div>
    <div class="card">
      <div class="row between"><b>Nivel ${s.level} · ${esc(levelTitle(s.level))}</b><span class="muted small">${s.levelCur}/${s.levelSpan} XP</span></div>
      <div class="bar" style="margin:8px 0 12px"><span style="width:${Math.round(100 * s.levelCur / s.levelSpan)}%"></span></div>
      <div class="stat-grid">
        <div class="stat"><b>🔥 ${s.streak}</b><span>racha (días hábiles)</span></div>
        <div class="stat"><b>${s.workouts}</b><span>entrenamientos</span></div>
        <div class="stat"><b>${s.currentWeight ? fmtNum(s.currentWeight) : '–'}</b><span>kg actual</span></div>
      </div>
    </div>
    <div class="row">
      <button class="btn grow" data-action="log-weight">⚖️ Registrar peso</button>
      <button class="btn grow" data-action="log-activity">🚴 Registrar bici</button>
    </div>`;
}

// ---------- Sesión ----------
function viewSesion() {
  const ses = state.session;
  if (!ses) return viewHoy(computeStats());
  const phase = PHASES.find(p => p.id === ses.phaseId);
  const R = ROUTINE[ses.dayNum];
  const cards = ses.ex.map((e, i) => {
    const ex = EXERCISES[e.id];
    const sug = suggestion(e.id, phase);
    const [lo, hi] = repRange(e.id, phase);
    const unit = ex.cardio ? 'min' : (ex.time ? 'seg' : 'reps');
    const target = ex.cardio ? `${phase.cardio} min` : `${e.sets.length} × ${lo}-${hi} ${unit}`;
    const showKg = !ex.cardio && !ex.time;
    const rows = e.sets.map((st, j) => `
      <tr class="${st.done ? 'done' : ''}">
        <td class="setno">${j + 1}</td>
        ${showKg ? `<td><input inputmode="decimal" data-ex="${i}" data-set="${j}" data-f="kg" value="${st.kg ?? ''}" placeholder="kg"></td>` : ''}
        <td><input inputmode="numeric" data-ex="${i}" data-set="${j}" data-f="reps" value="${st.reps ?? ''}" placeholder="${sug.reps ?? hi}"></td>
        <td><button class="chk ${st.done ? 'on' : ''}" data-action="toggle-set" data-ex="${i}" data-set="${j}" aria-label="Serie hecha">✔</button></td>
      </tr>`).join('');
    return `<div class="card ex">
      <div class="ex-head">
        ${demoHtml(e.id, true)}
        <div class="grow"><div class="name">${esc(ex.name)}</div><div class="muted small">${target} · ${esc(ex.group)}</div>
          <button class="btn sm" style="margin-top:6px" data-action="guide" data-id="${e.id}">▶️ Ver cómo se hace</button></div>
      </div>
      <div class="suggest">${esc(sug.text)}</div>
      <table class="sets"><thead><tr><th>#</th>${showKg ? '<th>kg</th>' : ''}<th>${unit}</th><th></th></tr></thead><tbody>${rows}</tbody></table>
      ${ex.cardio ? '' : `<div class="row" style="margin-top:8px"><button class="btn sm" data-action="add-set" data-ex="${i}">+ Serie</button>${e.sets.length > 1 ? `<button class="btn sm" data-action="del-set" data-ex="${i}">− Serie</button>` : ''}</div>`}
    </div>`;
  }).join('');
  return `
    <div class="row between" style="margin-bottom:12px">
      <div><h2 style="margin:0">${R.emoji} ${esc(R.name)}</h2><div class="muted small">Semana ${ses.week} · ${esc(phase.name)} · RIR ${phase.rir}</div></div>
    </div>
    <p class="muted small">Completá kg y reps, y tocá ✔ al terminar cada serie: arranca el descanso de ${state.settings.restSec} s. <b>RIR</b> = reps que te quedan en reserva.</p>
    ${cards}
    <button class="btn primary block" data-action="finish">🏁 Terminar entrenamiento</button>
    <button class="btn danger block" style="margin-top:10px" data-action="cancel-session">Descartar entrenamiento</button>`;
}

// ---------- Rutina ----------
function viewRutina() {
  const week = weekNumber(), cur = phaseFor(week);
  const phases = PHASES.map(p => `
    <div class="list-item"><div class="grow">
      <b>${esc(p.name)}</b> <span class="muted small">${p.to > 100 ? `semana ${p.from} en adelante` : `semanas ${p.from}-${p.to}`}</span>
      <div class="muted small">${p.compoundSets ? `${p.compoundSets} series en básicos, ${p.sets} en el resto` : `${p.sets} series`} × ${p.reps[0]}-${p.reps[1]} reps · RIR ${p.rir} · cardio ${p.cardio} min</div>
    </div>${p.id === cur.id ? '<span class="pill green">Actual</span>' : ''}</div>`).join('');
  const days = ['', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
  const routine = Object.entries(ROUTINE).map(([n, d]) => `
    <div class="card"><h3>${days[n]} · ${d.emoji} ${esc(d.name)}</h3>
      ${d.ex.map(id => `<div class="list-item" data-action="guide" data-id="${id}" style="cursor:pointer"><div class="grow">${esc(EXERCISES[id].name)}<div class="muted small">${esc(EXERCISES[id].group)}</div></div><span class="muted">📖</span></div>`).join('')}
    </div>`).join('');
  return `
    <h2>Tu rutina</h2>
    <div class="card"><h3>Plan de reintroducción (6 semanas)</h3>
      <p class="muted small" style="margin-top:0">Pensado para volver después de años sin entrenar: máquinas y mancuernas, técnica primero y cargas que suben de a poco. Calentá 5-10 min antes (bici fija o caminata) y hacé 1 serie liviana del primer ejercicio.</p>
      ${phases}
    </div>
    ${routine}
    <p class="muted small">Tocá un ejercicio para ver cómo hacerlo. Si una máquina está ocupada, usá la alternativa más parecida y anotala igual.</p>`;
}

// ---------- Progreso ----------
function viewProgreso(s) {
  const groups = GROUPS.map(g => {
    const lv = levelFromXp(s.groupXp[g] || 0, 40);
    return `<div style="margin-bottom:10px"><div class="row between small"><span>${esc(g)}</span><span class="muted">Nv ${lv.level}</span></div>
      <div class="bar ${g === 'Cardio' ? 'blue' : ''}"><span style="width:${Math.round(100 * lv.cur / lv.span)}%"></span></div></div>`;
  }).join('');
  const ach = ACHIEVEMENTS.map(a => {
    const got = state.achievements[a.id];
    return `<div class="ach ${got ? '' : 'locked'}" title="${esc(a.desc)}" data-action="ach" data-id="${a.id}"><span class="em">${a.em}</span>${esc(a.name)}</div>`;
  }).join('');
  const hist = [...state.workouts].reverse().slice(0, 15).map(w => {
    const vol = w.ex.reduce((n, e) => n + e.sets.reduce((m, st) => m + (EXERCISES[e.id]?.time || EXERCISES[e.id]?.cardio ? 0 : (st.kg || 0) * (st.reps || 0)), 0), 0);
    return `<div class="list-item" data-action="workout" data-id="${w.id}" style="cursor:pointer"><div class="grow"><b>${esc(ROUTINE[w.dayNum].name)}</b>
      <div class="muted small">${esc(fmtDate(w.date))} · ${w.durationMin} min · ${Math.round(vol).toLocaleString('es-AR')} kg movidos</div></div>
      ${w.prs?.length ? `<span class="pill gold">⚡ ${w.prs.length}</span>` : ''}</div>`;
  }).join('');
  const unlocked = Object.keys(state.achievements).length;
  return `
    <div class="card" style="text-align:center">
      <div class="lvl-badge" style="width:64px;height:64px;font-size:28px;margin:0 auto 8px">${s.level}</div>
      <h2 style="margin:0">${esc(levelTitle(s.level))}</h2>
      <p class="muted small">${s.xp.toLocaleString('es-AR')} XP en total · faltan ${s.levelSpan - s.levelCur} para el nivel ${s.level + 1}</p>
      <div class="bar"><span style="width:${Math.round(100 * s.levelCur / s.levelSpan)}%"></span></div>
    </div>
    <div class="stat-grid" style="margin-bottom:14px">
      <div class="stat"><b>🔥 ${s.streak}</b><span>racha actual</span></div>
      <div class="stat"><b>${s.bestStreak}</b><span>mejor racha</span></div>
      <div class="stat"><b>⚡ ${s.prs}</b><span>récords</span></div>
      <div class="stat"><b>${s.workouts}</b><span>entrenamientos</span></div>
      <div class="stat"><b>${s.sets}</b><span>series</span></div>
      <div class="stat"><b>${fmtNum(s.bikeKm, 0)}</b><span>km en bici</span></div>
    </div>
    <div class="card"><h3>Niveles por grupo muscular</h3>${groups}</div>
    <div class="card"><div class="row between"><h3>Logros</h3><span class="muted small">${unlocked}/${ACHIEVEMENTS.length}</span></div><div class="ach-grid">${ach}</div></div>
    <div class="card"><h3>Historial</h3>${hist || '<div class="empty">Todavía no hay entrenamientos. ¡El primero te espera!</div>'}</div>
    <div class="card small muted"><b>Cómo se gana XP:</b> serie hecha +${XP.set} · entrenamiento terminado +${XP.workout} · récord +${XP.pr} · pesarte +${XP.weigh} · cada misión diaria +${XP.habit} (bonus +${XP.allHabits} si hacés las 3) · cardio +${XP.cardioMin}/min · bici +${XP.bikeKm}/km.</div>`;
}

// ---------- Cuerpo ----------
function weightChart() {
  const pts = [...state.body].filter(b => b.weightKg).sort((a, b) => a.date.localeCompare(b.date));
  if (pts.length < 2) return '<div class="empty small">Con 2 registros o más aparece el gráfico.</div>';
  const W = 320, H = 150, P = 26;
  const xs = pts.map(p => parseYmd(p.date).getTime()), ys = pts.map(p => p.weightKg);
  const x0 = Math.min(...xs), x1 = Math.max(...xs) || x0 + 1;
  const y0 = Math.floor(Math.min(...ys) - 1), y1 = Math.ceil(Math.max(...ys) + 1);
  const X = x => P + (W - P - 8) * ((x - x0) / ((x1 - x0) || 1));
  const Y = y => 8 + (H - 8 - 20) * (1 - (y - y0) / ((y1 - y0) || 1));
  const d = pts.map((p, i) => `${i ? 'L' : 'M'}${X(xs[i]).toFixed(1)},${Y(p.weightKg).toFixed(1)}`).join(' ');
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img" aria-label="Evolución del peso">
    <line x1="${P}" x2="${W - 8}" y1="${Y(y1)}" y2="${Y(y1)}" stroke="#2b303b"/><line x1="${P}" x2="${W - 8}" y1="${Y(y0)}" y2="${Y(y0)}" stroke="#2b303b"/>
    <text x="2" y="${Y(y1) + 4}" fill="#9aa3b2" font-size="10">${y1}</text><text x="2" y="${Y(y0) + 4}" fill="#9aa3b2" font-size="10">${y0}</text>
    <path d="${d}" fill="none" stroke="#4ade80" stroke-width="2.5" stroke-linejoin="round"/>
    ${pts.map((p, i) => `<circle cx="${X(xs[i])}" cy="${Y(p.weightKg)}" r="3" fill="#4ade80"/>`).join('')}
    <text x="${P}" y="${H - 4}" fill="#9aa3b2" font-size="10">${esc(fmtDate(pts[0].date, { day: 'numeric', month: 'short' }))}</text>
    <text x="${W - 8}" y="${H - 4}" fill="#9aa3b2" font-size="10" text-anchor="end">${esc(fmtDate(pts[pts.length - 1].date, { day: 'numeric', month: 'short' }))}</text>
  </svg>`;
}
function nutritionPreview(s) {
  const w = s.currentWeight; if (!w) return '<p class="muted small">Registrá tu peso para ver una estimación de calorías y proteína.</p>';
  const p = state.profile, h = p.heightCm;
  const bmr = 10 * w + 6.25 * h - 5 * p.age + (p.sex === 'f' ? -161 : 5);
  const tdee = bmr * 1.55;
  const target = Math.round((tdee * 0.8) / 50) * 50;
  const refWeight = 25 * Math.pow(h / 100, 2);
  const protein = Math.round((2 * refWeight) / 5) * 5;
  return `<div class="stat-grid">
      <div class="stat"><b>${Math.round(tdee / 50) * 50}</b><span>kcal mantenimiento</span></div>
      <div class="stat"><b>${target}</b><span>kcal para bajar grasa</span></div>
      <div class="stat"><b>${protein} g</b><span>proteína por día</span></div>
    </div>
    <p class="muted small" style="margin-bottom:0">Estimación orientativa (déficit ~20%, para bajar ~0,5-0,8 kg por semana). Priorizá la proteína: es lo que te ayuda a perder grasa sin perder músculo. El plan de comidas económico llega en la próxima versión.</p>`;
}
function viewCuerpo(s) {
  const p = state.profile;
  const bmi = s.currentWeight ? s.currentWeight / Math.pow(p.heightCm / 100, 2) : null;
  const body = [...state.body].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 12).map(b => `
    <div class="list-item"><div class="grow">${esc(fmtDate(b.date))}</div>
      <b>${b.weightKg ? fmtNum(b.weightKg) + ' kg' : ''}</b>${b.waistCm ? `<span class="muted small">${fmtNum(b.waistCm)} cm cintura</span>` : ''}
      <button class="icon-btn" style="font-size:16px" data-action="del-body" data-date="${b.date}" aria-label="Borrar">🗑️</button></div>`).join('');
  const acts = [...state.activities].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 12).map(a => `
    <div class="list-item"><div class="grow">${{ bici: '🚴', caminata: '🚶', correr: '🏃', otro: '🏅' }[a.type] || '🏅'} ${esc(a.type)}<div class="muted small">${esc(fmtDate(a.date))}${a.source !== 'manual' ? ' · ' + esc(a.source) : ''}</div></div>
      <span class="small">${a.minutes ? a.minutes + ' min' : ''}${a.km ? ' · ' + fmtNum(a.km) + ' km' : ''}</span>
      <button class="icon-btn" style="font-size:16px" data-action="del-act" data-id="${a.id}" aria-label="Borrar">🗑️</button></div>`).join('');
  return `
    <h2>Cuerpo y actividad</h2>
    <div class="card">
      <div class="row between"><h3>Peso</h3><button class="btn sm primary" data-action="log-weight">+ Registrar</button></div>
      <div class="stat-grid" style="margin-bottom:10px">
        <div class="stat"><b>${s.startWeight ? fmtNum(s.startWeight) : '–'}</b><span>inicial (kg)</span></div>
        <div class="stat"><b>${s.currentWeight ? fmtNum(s.currentWeight) : '–'}</b><span>actual (kg)</span></div>
        <div class="stat"><b>${s.startWeight && s.currentWeight ? (s.currentWeight - s.startWeight > 0 ? '+' : '') + fmtNum(s.currentWeight - s.startWeight) : '–'}</b><span>diferencia</span></div>
      </div>
      ${weightChart()}
      <p class="muted small">Pesate 1-2 veces por semana, en ayunas y después de ir al baño. Al principio la balanza puede subir por retención de líquido: la cintura suele mostrar mejor el progreso.${bmi ? ` IMC actual: ${fmtNum(bmi)}.` : ''}</p>
      ${body}
    </div>
    <div class="card"><h3>Alimentación (vista previa)</h3>${nutritionPreview(s)}</div>
    <div class="card">
      <div class="row between"><h3>Bici y cardio</h3><button class="btn sm primary" data-action="log-activity">+ Registrar</button></div>
      <p class="muted small" style="margin-top:0">${fmtNum(s.bikeKm, 0)} km en bici acumulados. Las salidas en bici suman XP y cuentan para la racha.</p>
      ${acts || '<div class="empty small">Sin actividades todavía.</div>'}
    </div>
    <div class="card small muted">⌚ <b>Reloj y Health Connect:</b> próximamente la app va a poder leer bici, pasos y frecuencia cardíaca de Samsung Health, Mi Fitness, Strava o tu reloj a través de Health Connect. Por ahora se carga a mano.</div>`;
}

// ================= Formularios =================
function weightForm() {
  const last = [...state.body].filter(b => b.weightKg).sort((a, b) => b.date.localeCompare(a.date))[0];
  modal(`<h2>⚖️ Registrar peso</h2>
    <form id="f-weight">
      <label class="f">Fecha<input type="date" name="date" value="${today()}" max="${today()}" required></label>
      <div class="grid2">
        <label class="f">Peso (kg)<input name="w" inputmode="decimal" placeholder="${last ? fmtNum(last.weightKg) : 'ej. 95,4'}" required></label>
        <label class="f">Cintura (cm, opcional)<input name="waist" inputmode="decimal" placeholder="a la altura del ombligo"></label>
      </div>
      <button class="btn primary block">Guardar</button>
    </form>`);
}
function activityForm() {
  modal(`<h2>🚴 Registrar actividad</h2>
    <form id="f-act">
      <div class="grid2">
        <label class="f">Tipo<select name="type"><option value="bici">Bici</option><option value="caminata">Caminata</option><option value="correr">Correr</option><option value="otro">Otro</option></select></label>
        <label class="f">Fecha<input type="date" name="date" value="${today()}" max="${today()}" required></label>
        <label class="f">Minutos<input name="min" inputmode="numeric" placeholder="ej. 45" required></label>
        <label class="f">Kilómetros<input name="km" inputmode="decimal" placeholder="ej. 15"></label>
      </div>
      <button class="btn primary block">Guardar</button>
    </form>`);
}
function demoHtml(id, thumb = false) {
  const a = `demos/${id}-0.jpg`, b = `demos/${id}-1.jpg`;
  return `<div class="demo ${thumb ? 'thumb' : ''}" ${thumb ? `data-action="guide" data-id="${id}"` : ''}>
    <img src="${a}" alt="" loading="lazy"><img class="b" src="${b}" alt="Demostración: ${esc(EXERCISES[id].name)}" loading="lazy">
    ${thumb ? '<span class="play">▶</span>' : ''}</div>`;
}
function guideModal(id) {
  const ex = EXERCISES[id];
  const yt = 'https://www.youtube.com/results?search_query=' + encodeURIComponent(ex.q);
  modal(`<h2>${esc(ex.name)}</h2>
    ${demoHtml(id)}
    <div class="credit">Imágenes: free-exercise-db (dominio público)</div>
    <p style="margin:10px 0 0"><span class="pill">${esc(ex.group)}</span></p>
    <h3 style="margin-top:14px">Claves de la técnica</h3>
    <ul class="tips">${ex.tips.map(t => `<li>${esc(t)}</li>`).join('')}</ul>
    <a class="btn block" href="${yt}" target="_blank" rel="noopener" style="text-align:center;text-decoration:none;display:block">▶️ Ver videos en YouTube</a>
    <button class="btn block" style="margin-top:10px" data-action="close-modal">Cerrar</button>`);
}
function workoutModal(id) {
  const w = state.workouts.find(x => x.id === id); if (!w) return;
  modal(`<h2>${esc(ROUTINE[w.dayNum].name)}</h2><p class="muted">${esc(fmtDate(w.date, { weekday: 'long', day: 'numeric', month: 'long' }))} · semana ${w.week} · ${w.durationMin} min</p>
    ${w.ex.map(e => { const ex = EXERCISES[e.id]; return `<div class="list-item"><div class="grow">${esc(ex.name)}${w.prs?.includes(e.id) ? ' ⚡' : ''}
      <div class="muted small">${e.sets.map(s => ex.cardio ? `${s.reps} min` : ex.time ? `${s.reps} s` : `${fmtNum(s.kg || 0)} kg × ${s.reps}`).join(' · ')}</div></div></div>`; }).join('')}
    <button class="btn danger block" style="margin-top:12px" data-action="del-workout" data-id="${w.id}">Borrar este entrenamiento</button>
    <button class="btn block" style="margin-top:10px" data-action="close-modal">Cerrar</button>`);
}
function settingsModal() {
  const p = state.profile, st = state.settings;
  modal(`<h2>⚙️ Ajustes</h2>
    <form id="f-settings">
      <div class="grid2">
        <label class="f">Nombre<input name="name" value="${esc(p.name)}"></label>
        <label class="f">Edad<input name="age" inputmode="numeric" value="${p.age}"></label>
        <label class="f">Altura (cm)<input name="height" inputmode="numeric" value="${p.heightCm}"></label>
        <label class="f">Inicio del plan (lunes)<input type="date" name="start" value="${p.startDate}"></label>
        <label class="f">Descanso entre series (s)<input name="rest" inputmode="numeric" value="${st.restSec}"></label>
        <label class="f">Subida tren superior (kg)<input name="incU" inputmode="decimal" value="${st.incUpper}"></label>
        <label class="f">Subida tren inferior (kg)<input name="incL" inputmode="decimal" value="${st.incLower}"></label>
      </div>
      <button class="btn primary block">Guardar</button>
    </form>
    <h3 style="margin-top:20px">Respaldo</h3>
    <p class="muted small" style="margin-top:0">Los datos se guardan solo en este celular. Exportá un respaldo de vez en cuando (por ejemplo a Google Drive).</p>
    <div class="row"><button class="btn grow" data-action="export">⬇️ Exportar</button><label class="btn grow" style="text-align:center">⬆️ Importar<input type="file" accept="application/json,.json" id="import-file" hidden></label></div>
    <button class="btn danger block" style="margin-top:16px" data-action="reset">Borrar todos los datos</button>
    <p class="muted small" style="text-align:center;margin-top:14px">Versión 1.1</p>`);
}

// ================= Eventos =================
document.addEventListener('click', e => {
  const goBtn = e.target.closest('[data-go]');
  if (goBtn) { go(goBtn.dataset.go); return; }
  const el = e.target.closest('[data-action]'); if (!el) return;
  const a = el.dataset.action;
  const ses = state.session;
  switch (a) {
    case 'start':
      if (state.session && !confirm('Ya tenés un entrenamiento en curso. ¿Descartarlo y empezar otro?')) return;
      startSession(Number(el.dataset.day)); break;
    case 'toggle-set': {
      const ex = ses.ex[+el.dataset.ex], st = ex.sets[+el.dataset.set];
      if (!st.done) {
        const exd = EXERCISES[ex.id];
        const phase = PHASES.find(p => p.id === ses.phaseId);
        if (st.reps == null) st.reps = suggestion(ex.id, phase).reps ?? repRange(ex.id, phase)[1];
        if (!exd.cardio && !exd.time && st.kg == null) { toast('Cargá el peso (kg) de la serie'); return; }
        st.done = true;
        if (!exd.cardio) startRest();
        // completar el peso de las series siguientes si están vacías
        ex.sets.forEach((s2, k) => { if (k > +el.dataset.set && s2.kg == null) s2.kg = st.kg; });
      } else st.done = false;
      save(); render(); break;
    }
    case 'add-set': { const ex = ses.ex[+el.dataset.ex]; const last = ex.sets[ex.sets.length - 1]; ex.sets.push({ kg: last?.kg ?? null, reps: null, done: false }); save(); render(); break; }
    case 'del-set': { const ex = ses.ex[+el.dataset.ex]; if (ex.sets.length > 1) ex.sets.pop(); save(); render(); break; }
    case 'finish': finishSession(); break;
    case 'cancel-session': if (confirm('¿Descartar este entrenamiento? No se va a guardar.')) { state.session = null; stopRest(); save(); go('hoy'); } break;
    case 'guide': guideModal(el.dataset.id); break;
    case 'close-modal': closeModal(); break;
    case 'habit': {
      const t = today(); state.habits[t] = state.habits[t] || {};
      state.habits[t][el.dataset.h] = !state.habits[t][el.dataset.h];
      if (state.habits[t][el.dataset.h]) toast(`+${XP.habit} XP` + (allHabits(t) ? ` · ¡las 3 misiones! +${XP.allHabits}` : ''));
      save(); checkProgress(); render(); break;
    }
    case 'log-weight': weightForm(); break;
    case 'log-activity': activityForm(); break;
    case 'del-body': if (confirm('¿Borrar este registro?')) { state.body = state.body.filter(b => b.date !== el.dataset.date); save(); render(); } break;
    case 'del-act': if (confirm('¿Borrar esta actividad?')) { state.activities = state.activities.filter(x => x.id !== el.dataset.id); save(); render(); } break;
    case 'workout': workoutModal(el.dataset.id); break;
    case 'del-workout': if (confirm('¿Borrar este entrenamiento del historial?')) { state.workouts = state.workouts.filter(w => w.id !== el.dataset.id); save(); closeModal(); render(); } break;
    case 'ach': { const x = ACHIEVEMENTS.find(q => q.id === el.dataset.id); const got = state.achievements[x.id]; toast(`${x.em} ${x.name}: ${x.desc}${got ? ` · ✅ ${fmtDate(got, { day: 'numeric', month: 'short' })}` : ''}`); break; }
    case 'settings': settingsModal(); break;
    case 'export': exportData(); break;
    case 'reset':
      if (confirm('Esto borra TODO (entrenamientos, peso, logros). ¿Seguro?') && confirm('¿Exportaste un respaldo? Última confirmación.')) { state = defaultState(); save(); closeModal(); go('hoy'); }
      break;
    case 'rest-add': restEnd = Math.max(restEnd, Date.now()) + 15000; if (!restTimer) { restTimer = setInterval(tickRest, 250); } tickRest(); break;
    case 'rest-stop': stopRest(); break;
  }
});

document.addEventListener('input', e => {
  const t = e.target;
  if (t.dataset && t.dataset.f && state.session) {
    const st = state.session.ex[+t.dataset.ex].sets[+t.dataset.set];
    st[t.dataset.f] = num(t.value);
    save();
  }
});

document.addEventListener('change', e => {
  if (e.target.id === 'import-file') importData(e.target.files[0]);
});

document.addEventListener('submit', e => {
  e.preventDefault();
  const f = e.target, d = Object.fromEntries(new FormData(f));
  if (f.id === 'f-weight') {
    const w = num(d.w); if (!w || w < 30 || w > 300) { toast('Revisá el peso'); return; }
    state.body = state.body.filter(b => b.date !== d.date);
    state.body.push({ date: d.date, weightKg: w, waistCm: num(d.waist) });
    toast(`+${XP.weigh} XP · peso guardado`);
  } else if (f.id === 'f-act') {
    const m = num(d.min); if (!m) { toast('Cargá los minutos'); return; }
    state.activities.push({ id: uid(), date: d.date, type: d.type, minutes: Math.round(m), km: num(d.km), source: 'manual', externalId: null });
    toast('Actividad guardada 💪');
  } else if (f.id === 'f-settings') {
    const p = state.profile;
    p.name = d.name || p.name; p.age = num(d.age) || p.age; p.heightCm = num(d.height) || p.heightCm;
    if (d.start) p.startDate = d.start;
    state.settings.restSec = num(d.rest) || state.settings.restSec;
    state.settings.incUpper = num(d.incU) ?? state.settings.incUpper;
    state.settings.incLower = num(d.incL) ?? state.settings.incLower;
    toast('Ajustes guardados');
  }
  save(); closeModal(); checkProgress(); render();
});

function exportData() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = `fitness-respaldo-${today()}.json`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
function importData(file) {
  if (!file) return;
  const r = new FileReader();
  r.onload = () => {
    try {
      const data = JSON.parse(r.result);
      if (!data || !Array.isArray(data.workouts)) throw new Error('formato');
      if (!confirm('Esto reemplaza los datos actuales por los del respaldo. ¿Continuar?')) return;
      state = migrate(data); save(); closeModal(); toast('Respaldo importado ✅'); go('hoy');
    } catch (err) { toast('El archivo no es un respaldo válido'); }
  };
  r.readAsText(file);
}

// ================= Inicio =================
checkProgress(true);
render();
if (state.session) toast('Tenés un entrenamiento en curso');
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
