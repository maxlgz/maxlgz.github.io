// ================================================================
// Visualiseur 3D — three.js, rendu par instanciation.
//
// Deux InstancedMesh suffisent pour tout le modèle : un pour les
// corps de pièce (boîtes mises à l'échelle par instance) et un pour
// les tenons (cylindres). Les pièces transparentes ont leur propre
// paire, rendue après les opaques.
// ================================================================

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { COLORS, GROUPS } from './model.js';

const PLATE_U = 0.4;        // 1 plaque = 0,4 tenon (3,2 / 8 mm)
const GAP = 0.04;           // jeu de rendu : laisse voir les joints
const STUD_R = 0.305;
const STUD_H = 0.22;

const ACCENT = new THREE.Color('#ff5a1f');
const DIM = 0.16;

export function createViewer(canvas, model) {
  const { pieces } = model;

  // --- centrage -------------------------------------------------
  const b = model.bbox;
  const cx = (b.min.x + b.max.x) / 2;
  const cz = (b.min.z + b.max.z) / 2;
  const y0 = b.min.y;
  const span = b.max.x - b.min.x;
  const midY = (b.max.y - b.min.y) * PLATE_U * 0.45;   // hauteur de visée

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#0a1218');
  scene.fog = new THREE.Fog('#0a1218', span * 1.9, span * 4.2);

  const camera = new THREE.PerspectiveCamera(36, 1, 0.5, 2000);
  camera.position.set(span * 0.9, span * 0.5, span * 1.05);

  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.07;
  controls.target.set(0, midY, 0);
  controls.minDistance = span * 0.32;
  controls.maxDistance = span * 3.4;
  controls.maxPolarAngle = Math.PI * 0.52;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.45;
  controls.addEventListener('start', () => { controls.autoRotate = false; });

  // --- lumières -------------------------------------------------
  scene.add(new THREE.HemisphereLight('#8fc4d8', '#2a2114', 0.62));
  scene.add(new THREE.AmbientLight('#ffffff', 0.22));

  const key = new THREE.DirectionalLight('#fff6e2', 1.35);
  key.position.set(span * 0.6, span * 0.95, span * 0.45);
  key.castShadow = true;
  key.shadow.mapSize.set(1536, 1536);
  const d = span * 0.72;
  Object.assign(key.shadow.camera, { left: -d, right: d, top: d, bottom: -d, near: 1, far: span * 3.2 });
  key.shadow.bias = -0.0012;
  scene.add(key);

  const fill = new THREE.DirectionalLight('#7fb6cc', 0.55);
  fill.position.set(-span * 0.7, span * 0.35, -span * 0.6);
  scene.add(fill);

  const rim = new THREE.DirectionalLight('#ffca55', 0.4);
  rim.position.set(-span * 0.2, span * 0.15, span * 0.9);
  scene.add(rim);

  // --- sol ------------------------------------------------------
  const ground = new THREE.Mesh(
    new THREE.CircleGeometry(span * 1.35, 64),
    new THREE.MeshStandardMaterial({ color: '#0d1a22', roughness: 0.95, metalness: 0 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.02;
  ground.receiveShadow = true;
  scene.add(ground);

  const grid = new THREE.GridHelper(span * 1.9, Math.round(span * 1.9 / 4), '#1d3440', '#152833');
  grid.material.transparent = true;
  grid.material.opacity = 0.5;
  scene.add(grid);

  // --- tri opaque / transparent ---------------------------------
  const opaque = [], clear = [];
  pieces.forEach((p) => (p.color === 'trans' ? clear : opaque).push(p));

  const studCount = (list) => list.reduce((n, p) => n + p.studs.length, 0);

  const boxGeo = new THREE.BoxGeometry(1, 1, 1);
  const studGeo = new THREE.CylinderGeometry(STUD_R, STUD_R, STUD_H, 10);
  studGeo.translate(0, STUD_H / 2, 0);

  const solidMat = () => new THREE.MeshStandardMaterial({ roughness: 0.42, metalness: 0.03 });
  const clearMat = () => new THREE.MeshPhysicalMaterial({
    roughness: 0.08, metalness: 0, transparent: true, opacity: 0.42,
    transmission: 0.35, thickness: 2, clearcoat: 0.8,
  });

  function makeSet(list, material) {
    const bodies = new THREE.InstancedMesh(boxGeo, material(), Math.max(list.length, 1));
    const studs = new THREE.InstancedMesh(studGeo, material(), Math.max(studCount(list), 1));
    for (const m of [bodies, studs]) {
      m.castShadow = m === bodies; m.receiveShadow = true;
      m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      m.frustumCulled = false;
      scene.add(m);
    }
    return { bodies, studs, list };
  }

  const sets = { opaque: makeSet(opaque, solidMat), clear: makeSet(clear, clearMat) };
  sets.clear.bodies.renderOrder = 2;
  sets.clear.studs.renderOrder = 2;

  // index tenon -> pièce, pour la colorisation
  for (const s of Object.values(sets)) {
    s.studOwner = [];
    s.list.forEach((p, i) => { for (let k = 0; k < p.studs.length; k++) s.studOwner.push(i); });
  }

  // --- état -----------------------------------------------------
  const state = { stage: 0, explode: 0, highlight: null, groupFilter: null };
  const mat4 = new THREE.Matrix4();
  const col = new THREE.Color();
  const HIDDEN = new THREE.Matrix4().makeScale(0, 0, 0);

  const visible = (p) => (state.stage === 0 || p.stage <= state.stage)
    && (!state.groupFilter || p.group === state.groupFilter);

  function offsetFor(p) {
    if (!state.explode) return [0, 0, 0];
    const g = GROUPS[p.group];
    if (!g) return [0, 0, 0];
    const k = state.explode * span * 0.16;
    return [g.dir[0] * k, g.dir[1] * k, g.dir[2] * k];
  }

  function updateMatrices() {
    for (const s of Object.values(sets)) {
      let si = 0;
      s.list.forEach((p, i) => {
        const shown = visible(p);
        const [ox, oy, oz] = offsetFor(p);
        const h = p.h * PLATE_U;
        const px = p.x + p.dx / 2 - cx + ox;
        const py = (p.y - y0) * PLATE_U + h / 2 + oy;
        const pz = p.z + p.dz / 2 - cz + oz;
        if (shown) {
          mat4.makeScale(p.dx - GAP, h - GAP * 0.5, p.dz - GAP);
          mat4.setPosition(px, py, pz);
          s.bodies.setMatrixAt(i, mat4);
        } else {
          s.bodies.setMatrixAt(i, HIDDEN);
        }
        const top = py + h / 2 - GAP * 0.25;
        for (const [a, c] of p.studs) {
          if (shown) {
            mat4.makeScale(1, 1, 1);
            mat4.setPosition(p.x + a + 0.5 - cx + ox, top, p.z + c + 0.5 - cz + oz);
            s.studs.setMatrixAt(si, mat4);
          } else {
            s.studs.setMatrixAt(si, HIDDEN);
          }
          si++;
        }
      });
      s.bodies.instanceMatrix.needsUpdate = true;
      s.studs.instanceMatrix.needsUpdate = true;
      s.bodies.computeBoundingSphere?.();
    }
  }

  function tint(p) {
    col.set(COLORS[p.color].hex);
    if (!state.highlight) return col;
    const h = state.highlight;
    const hit = h.groups
      ? h.groups.includes(p.group)
      : p.part === h.part && (!h.color || p.color === h.color);
    if (hit) col.copy(ACCENT);
    else col.multiplyScalar(DIM).lerp(new THREE.Color('#0a1218'), 0.35);
    return col;
  }

  function updateColors() {
    for (const s of Object.values(sets)) {
      s.list.forEach((p, i) => s.bodies.setColorAt(i, tint(p)));
      s.studOwner.forEach((owner, si) => s.studs.setColorAt(si, tint(s.list[owner])));
      if (s.bodies.instanceColor) s.bodies.instanceColor.needsUpdate = true;
      if (s.studs.instanceColor) s.studs.instanceColor.needsUpdate = true;
    }
  }

  updateMatrices();
  updateColors();

  // --- vues cadrées ---------------------------------------------
  // Chaque cadrage est ajusté sur les sommets réels des pièces, pas sur
  // la boîte englobante : sur une forme aussi allongée, les coins vides
  // de la boîte feraient reculer la caméra pour rien.
  const CORNERS = new Float32Array(pieces.length * 8 * 4);
  {
    let i = 0;
    for (const p of pieces) {
      for (const ax of [p.x, p.x + p.dx]) {
        for (const ay of [p.y, p.y + p.h]) {
          for (const az of [p.z, p.z + p.dz]) {
            CORNERS[i++] = ax - cx;
            CORNERS[i++] = (ay - y0) * PLATE_U;
            CORNERS[i++] = az - cz;
            CORNERS[i++] = ax;                 // x modèle, pour filtrer
          }
        }
      }
    }
  }

  const VIEWS = {
    ensemble:  { dir: [0.78, 0.40, 1.0], fov: 34, margin: 1.2 },   // marge : la rotation lente ne doit rien rogner
    tete:      { dir: [-0.85, 0.28, 0.9], fov: 34, x1: 34, margin: 1.3 },
    babord:    { dir: [0.02, 0.13, 1.0], fov: 30 },
    empennage: { dir: [0.95, 0.28, 0.7], fov: 34, x0: 66, margin: 1.3 },
    dessus:    { dir: [0.04, 1.0, 0.16], fov: 34 },
  };

  const UP = new THREE.Vector3(0, 1, 0);
  function frame(v) {
    const margin = v.margin ?? 1.06;
    const x0 = v.x0 ?? -Infinity, x1 = v.x1 ?? Infinity;
    const dir = new THREE.Vector3(...v.dir).normalize();
    const fwd = dir.clone().negate();
    const right = new THREE.Vector3().crossVectors(fwd, UP).normalize();
    const realUp = new THREE.Vector3().crossVectors(right, fwd).normalize();
    const tv = Math.tan((v.fov * Math.PI) / 360);
    const th = tv * Math.max(camera.aspect, 0.45);

    // centre = milieu de la boîte des points retenus
    let ax0 = Infinity, ax1 = -Infinity, ay0 = Infinity, ay1 = -Infinity, az0 = Infinity, az1 = -Infinity;
    for (let i = 0; i < CORNERS.length; i += 4) {
      if (CORNERS[i + 3] < x0 || CORNERS[i + 3] > x1) continue;
      ax0 = Math.min(ax0, CORNERS[i]); ax1 = Math.max(ax1, CORNERS[i]);
      ay0 = Math.min(ay0, CORNERS[i + 1]); ay1 = Math.max(ay1, CORNERS[i + 1]);
      az0 = Math.min(az0, CORNERS[i + 2]); az1 = Math.max(az1, CORNERS[i + 2]);
    }
    const c = new THREE.Vector3((ax0 + ax1) / 2, (ay0 + ay1) / 2, (az0 + az1) / 2);

    let d = 0;
    for (let i = 0; i < CORNERS.length; i += 4) {
      if (CORNERS[i + 3] < x0 || CORNERS[i + 3] > x1) continue;
      const px = CORNERS[i] - c.x, py = CORNERS[i + 1] - c.y, pz = CORNERS[i + 2] - c.z;
      const f = px * fwd.x + py * fwd.y + pz * fwd.z;
      const r = Math.abs(px * right.x + py * right.y + pz * right.z);
      const u = Math.abs(px * realUp.x + py * realUp.y + pz * realUp.z);
      const need = Math.max(r / th, u / tv) - f;
      if (need > d) d = need;
    }
    return { pos: c.clone().addScaledVector(dir, d * margin), tgt: c, fov: v.fov };
  }

  let anim = null;
  function setView(name, instant = false) {
    const v = VIEWS[name] || VIEWS.ensemble;
    const f = frame(v);
    controls.autoRotate = false;
    if (instant) {
      camera.position.copy(f.pos);
      controls.target.copy(f.tgt);
      camera.fov = f.fov;
      camera.updateProjectionMatrix();
      return;
    }
    anim = {
      t: 0,
      fromPos: camera.position.clone(), toPos: f.pos,
      fromTgt: controls.target.clone(), toTgt: f.tgt,
      fromFov: camera.fov, toFov: f.fov,
    };
  }

  // --- sélection au clic ----------------------------------------
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const listeners = [];
  let down = null;
  canvas.addEventListener('pointerdown', (e) => { down = { x: e.clientX, y: e.clientY }; });
  canvas.addEventListener('pointerup', (e) => {
    if (!down || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 4) return;
    const r = canvas.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    let best = null;
    for (const s of Object.values(sets)) {
      for (const hit of ray.intersectObject(s.bodies, false)) {
        if (!visible(s.list[hit.instanceId])) continue;
        if (!best || hit.distance < best.distance) best = { distance: hit.distance, piece: s.list[hit.instanceId] };
        break;
      }
    }
    listeners.forEach((fn) => fn(best ? best.piece : null));
  });

  // --- boucle ---------------------------------------------------
  let raf = 0;
  function resize() {
    const w = canvas.clientWidth || 1, h = canvas.clientHeight || 1;
    if (canvas.width !== w * renderer.getPixelRatio() || canvas.height !== h * renderer.getPixelRatio()) {
      renderer.setSize(w, h, false);
    }
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  const clock = new THREE.Clock();
  const TRANSITION = 0.9;   // secondes

  function loop() {
    raf = requestAnimationFrame(loop);
    const dt = Math.min(clock.getDelta(), 0.25);
    if (anim) {
      // indexée sur le temps, pas sur les images : la transition dure
      // le même temps sur un portable poussif que sur une carte dédiée
      anim.t = Math.min(1, anim.t + dt / TRANSITION);
      const e = 1 - Math.pow(1 - anim.t, 3);
      camera.position.lerpVectors(anim.fromPos, anim.toPos, e);
      controls.target.lerpVectors(anim.fromTgt, anim.toTgt, e);
      camera.fov = anim.fromFov + (anim.toFov - anim.fromFov) * e;
      camera.updateProjectionMatrix();
      if (anim.t >= 1) anim = null;
    }
    resize();
    controls.update();
    renderer.render(scene, camera);
  }
  resize();
  setView('ensemble', true);
  controls.autoRotate = true;
  loop();

  // Un changement de ratio (rotation d'écran, redimensionnement) doit
  // recadrer tant que l'utilisateur n'a pas pris la main.
  let aspect0 = camera.aspect;
  let touched = false;
  controls.addEventListener('start', () => { touched = true; });
  addEventListener('resize', () => {
    resize();
    if (!touched && Math.abs(camera.aspect - aspect0) > 0.05) {
      aspect0 = camera.aspect;
      const auto = controls.autoRotate;
      setView('ensemble', true);
      controls.autoRotate = auto;
    }
  });

  return {
    setStage(n) { state.stage = n; updateMatrices(); },
    setExplode(v) { state.explode = v; updateMatrices(); },
    setGroupFilter(g) { state.groupFilter = g; updateMatrices(); },
    setHighlight(h) { state.highlight = h; updateColors(); },
    setView,
    onPick(fn) { listeners.push(fn); },
    resize,
    dispose() { cancelAnimationFrame(raf); controls.dispose(); renderer.dispose(); },
  };
}
