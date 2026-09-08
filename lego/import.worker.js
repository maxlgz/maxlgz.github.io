// Voxelisation hors du fil principal : la page reste vivante pendant le
// calcul, et reçoit l'avancement phase par phase. Le message « inspect »
// ne fait que mesurer l'emprise de chaque fichier.
import { parseSTL, meshToVoxels, inspect } from './voxelize.js';

self.onmessage = (e) => {
  const { type, files, opts } = e.data;
  try {
    if (type === 'inspect') {
      const out = files.map((f) => { try { return { name: f.name, ...inspect(parseSTL(f.buffer)) }; } catch (err) { return { name: f.name, error: err.message }; } });
      self.postMessage({ type: 'inspected', files: out });
      return;
    }
    const parts = files.map((f) => ({ name: f.name, group: f.group, tris: parseSTL(f.buffer) }));
    const progress = (phase, frac) => self.postMessage({ type: 'progress', phase, frac });
    const voxels = meshToVoxels(parts, { ...opts, progress });
    self.postMessage({ type: 'done', voxels });
  } catch (err) {
    self.postMessage({ type: 'error', message: err.message || String(err) });
  }
};
