import * as THREE from 'three';
import { STATIONS } from '../../data/stations';
import {
  AtmosphereMode,
  CargoMissionPhase,
  FlightPlanWaypoint,
  PayloadMission,
  StationMetadata,
} from '../../types/lab';

export interface SpatialWaypointMarker {
  station: StationMetadata;
  el: HTMLDivElement;
  distEl: HTMLElement | null;
}

export function initSpatialWaypointElements(
  container: HTMLElement | null,
  onSelectStation: (stationId: number) => void
): SpatialWaypointMarker[] {
  if (!container) return [];
  container.innerHTML = '';
  return STATIONS.map((st) => {
    const el = document.createElement('div');
    el.className = 'spatial-waypoint cursor-pointer select-none';
    el.onclick = () => onSelectStation(st.id);
    el.innerHTML = `
      <div class="px-2 py-0.5 rounded-full bg-slate-900/75 hover:bg-sky-600 text-white border border-white/30 backdrop-blur-md shadow-md flex items-center gap-1.5 text-[10px] font-mono-tech transition">
        <span class="w-1.5 h-1.5 rounded-full bg-sky-400"></span>
        <span class="font-bold">${st.code}</span>
        <span class="opacity-80 waypoint-dist">0m</span>
      </div>
    `;
    container.appendChild(el);
    return { station: st, el, distEl: el.querySelector('.waypoint-dist') };
  });
}

export function updateSpatialWaypointProjections(
  markers: SpatialWaypointMarker[],
  dronePos: THREE.Vector3,
  camera: THREE.PerspectiveCamera,
  activeStationId: number
): void {
  if (!markers.length) return;
  const halfW = window.innerWidth / 2;
  const halfH = window.innerHeight / 2;

  markers.forEach((item) => {
    const worldPos = new THREE.Vector3(
      item.station.position.x,
      item.station.position.y + 15.5,
      item.station.position.z - 4.0
    );
    const dist = Math.round(dronePos.distanceTo(worldPos));
    const proj = worldPos.clone().project(camera);

    if (proj.z > 1.0 || dist < 18) {
      item.el.style.opacity = '0';
      item.el.style.pointerEvents = 'none';
    } else {
      const sx = proj.x * halfW + halfW;
      const sy = -proj.y * halfH + halfH;
      item.el.style.left = `${sx}px`;
      item.el.style.top = `${sy}px`;
      item.el.style.opacity = item.station.id === activeStationId ? '0.95' : '0.68';
      item.el.style.pointerEvents = 'auto';
      if (item.distEl) item.distEl.textContent = `${dist}m`;
    }
  });
}

export function drawRadarMinimapCanvas(params: {
  canvas: HTMLCanvasElement | null;
  dronePos: THREE.Vector3;
  droneYaw: number;
  activeStationId: number;
  visitedIslands: number[];
  waypoints: FlightPlanWaypoint[];
  flightPlanActive: boolean;
  flightPlanLoop: boolean;
  activeWaypointIdx: number;
  activeMission: PayloadMission | null;
  cargoPhase: CargoMissionPhase;
  windAngle: number;
  atmosphereMode: AtmosphereMode;
}): void {
  const {
    canvas,
    dronePos,
    droneYaw,
    activeStationId,
    visitedIslands,
    waypoints,
    flightPlanActive,
    flightPlanLoop,
    activeWaypointIdx,
    activeMission,
    cargoPhase,
    windAngle,
    atmosphereMode,
  } = params;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const w = canvas.width;
  const h = canvas.height;
  const cx = w / 2;
  const cy = h / 2;
  const scale = 0.42;

  ctx.clearRect(0, 0, w, h);

  // 1. Concentric range rings
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.18)';
  ctx.lineWidth = 1;
  [24, 48, 72].forEach((r) => {
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
  });

  // 2. Waypoint Flight Plan Route Lines & Numbered Nodes
  if (waypoints.length > 0) {
    ctx.save();
    ctx.strokeStyle = flightPlanActive
      ? 'rgba(56, 189, 248, 0.92)'
      : 'rgba(129, 140, 248, 0.72)';
    ctx.lineWidth = 1.6;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    waypoints.forEach((wp, idx) => {
      const wx = cx + wp.x * scale;
      const wy = cy + wp.z * scale;
      if (idx === 0) ctx.moveTo(wx, wy);
      else ctx.lineTo(wx, wy);
    });
    if (flightPlanLoop && waypoints.length > 2) {
      ctx.lineTo(cx + waypoints[0].x * scale, cy + waypoints[0].z * scale);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    waypoints.forEach((wp, idx) => {
      const wx = cx + wp.x * scale;
      const wy = cy + wp.z * scale;
      const isCurrentWp = flightPlanActive && idx === activeWaypointIdx;
      ctx.fillStyle = isCurrentWp ? '#10b981' : '#818cf8';
      ctx.beginPath();
      ctx.arc(wx, wy, isCurrentWp ? 4.8 : 3.2, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 8px "JetBrains Mono", monospace';
      ctx.fillText(String(idx + 1), wx + 4, wy - 3);
    });
    ctx.restore();
  }

  // 3. Active Cargo Mission Pickup/Dropzone Rings
  if (activeMission && cargoPhase !== 'IDLE') {
    const targetStId =
      cargoPhase === 'AWAITING_PICKUP'
        ? activeMission.originStationId
        : activeMission.destStationId;
    const targetSt = STATIONS[targetStId];
    if (targetSt) {
      const tx = cx + targetSt.position.x * scale;
      const ty = cy + targetSt.position.z * scale;
      ctx.strokeStyle = cargoPhase === 'AWAITING_PICKUP' ? '#f59e0b' : '#10b981';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(tx, ty, 7.5, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  // 4. Floating Island Station Dots
  STATIONS.forEach((st) => {
    const ix = cx + st.position.x * scale;
    const iy = cy + st.position.z * scale;
    const isAct = st.id === activeStationId;
    const isVis = visitedIslands.includes(st.id);
    ctx.fillStyle = isAct
      ? '#38bdf8'
      : isVis
      ? '#10b981'
      : 'rgba(148, 163, 184, 0.7)';
    ctx.beginPath();
    ctx.arc(ix, iy, isAct ? 5.2 : 3.6, 0, Math.PI * 2);
    ctx.fill();
  });

  // 5. Wind Vector Indicator Arrow
  ctx.save();
  ctx.translate(18, 18);
  ctx.rotate(windAngle);
  ctx.strokeStyle = atmosphereMode === 3 ? '#f43f5e' : '#38bdf8';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-6, 0);
  ctx.lineTo(6, 0);
  ctx.lineTo(2, -3);
  ctx.moveTo(6, 0);
  ctx.lineTo(2, 3);
  ctx.stroke();
  ctx.restore();

  // 6. Drone Heading Triangle
  const dx = cx + dronePos.x * scale;
  const dy = cy + dronePos.z * scale;
  ctx.save();
  ctx.translate(dx, dy);
  ctx.rotate(-droneYaw);
  ctx.fillStyle = cargoPhase === 'IN_TRANSIT' ? '#f59e0b' : '#10b981';
  ctx.beginPath();
  ctx.moveTo(0, -5.5);
  ctx.lineTo(-4, 4.5);
  ctx.lineTo(4, 4.5);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}
