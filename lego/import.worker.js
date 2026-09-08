// Voxelisation hors du fil principal : la page reste vivante pendant le
// calcul, et reçoit l'avancement phase par phase.
import { parseSTL, meshToVoxels } from './voxelize.js';

self.onmessage = (e) => {
  const { files, opts } = e.data;
  try {
    const parts = files.map((f) => ({ name: f.name, group: f.group, tris: parseSTL(f.buffer) }));
    const progress = (phase, frac) => self.postMessage({ type: 'progress', phase, frac });
    const voxels = meshToVoxels(parts, { ...opts, progress });
    self.postMessage({ type: 'done', voxels });
  } catch (err) {
    self.postMessage({ type: 'error', message: err.message || String(err) });
  }
};
