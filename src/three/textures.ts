import * as THREE from 'three';

export function createSkyGradientTexture(
  topColor: string,
  midColor: string,
  bottomColor: string
): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 16;
  c.height = 512;
  const ctx = c.getContext('2d')!;
  const grad = ctx.createLinearGradient(0, 0, 0, 512);
  grad.addColorStop(0.0, topColor);
  grad.addColorStop(0.55, midColor);
  grad.addColorStop(1.0, bottomColor);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 16, 512);
  const tex = new THREE.CanvasTexture(c);
  tex.needsUpdate = true;
  return tex;
}

export function createHelipadTexture(codeText: string, accentHexStr: string): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 512;
  const ctx = c.getContext('2d')!;

  ctx.fillStyle = '#1e293b';
  ctx.fillRect(0, 0, 512, 512);

  ctx.strokeStyle = '#f8fafc';
  ctx.lineWidth = 14;
  ctx.beginPath();
  ctx.arc(256, 256, 220, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = accentHexStr;
  ctx.lineWidth = 8;
  ctx.setLineDash([28, 18]);
  ctx.beginPath();
  ctx.arc(256, 256, 184, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 180px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('H', 256, 245);

  ctx.fillStyle = accentHexStr;
  ctx.font = 'bold 34px "JetBrains Mono", monospace';
  ctx.fillText(codeText, 256, 390);

  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = 4;
  return tex;
}

export function createSculptedRockCliffGeometry(
  radiusTop: number,
  radiusBottom: number,
  depth: number,
  radialSegs = 16
): THREE.CylinderGeometry {
  const geo = new THREE.CylinderGeometry(radiusTop, radiusBottom, depth, radialSegs, 5);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const vx = pos.getX(i);
    const vy = pos.getY(i);
    const vz = pos.getZ(i);
    if (vy < depth * 0.45) {
      const angle = Math.atan2(vz, vx);
      const noise =
        Math.sin(angle * 5.0 + vy * 0.35) * 1.35 + Math.cos(angle * 3.0 - vy * 0.25) * 0.9;
      const factor = 1 + noise / Math.max(4, radiusTop);
      pos.setX(i, vx * factor);
      pos.setZ(i, vz * factor);
    }
  }
  geo.computeVertexNormals();
  return geo;
}
