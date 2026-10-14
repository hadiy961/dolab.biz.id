/**
 * InputController — handles all browser input events for the ArchipelagoEngine.
 *
 * Extracted from ArchipelagoEngine to reduce the God-Class and improve testability.
 * The controller owns: keyboard, mouse (orbit + double-click), wheel, and resize.
 */
import * as THREE from 'three';
import { useLabStore } from '../../store/useLabStore';
import { CameraOrbitState } from './flightPhysicsSystem';

export interface InputControllerCallbacks {
  toggleLandingTakeoff: () => void;
  triggerReturnToHome: () => void;
  captureAerialSnapshot: () => void;
  toggleGuidedTour: () => void;
  triggerLidarScan: () => void;
  cycleCameraMode: () => void;
  cycleAtmosphere: () => void;
  toggleRingChallenge: () => void;
  engageAutopilot: (stationId: number) => void;
  getIslandGroups: () => THREE.Group[];
}

export class InputController {
  private keys: Record<string, boolean> = {};
  boostActive = false;

  constructor(
    private readonly container: HTMLElement,
    private readonly camera: THREE.PerspectiveCamera,
    private readonly camOrbit: CameraOrbitState,
    private readonly callbacks: InputControllerCallbacks
  ) {
    this.setup();
  }

  /** Returns the current key state map (read-only) */
  getKeys(): Readonly<Record<string, boolean>> {
    return this.keys;
  }

  /** Programmatically set a key state (for on-screen touch controls) */
  setTouchKey(code: string, state: boolean): void {
    this.keys[code] = state;
  }

  private onResize = (): void => {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
  };

  private onKeyDown = (e: KeyboardEvent): void => {
    const activeTag = document.activeElement?.tagName;
    if (activeTag && ['INPUT', 'TEXTAREA'].includes(activeTag)) return;

    this.keys[e.code] = true;
    const store = useLabStore.getState();

    switch (e.code) {
      case 'KeyB': this.boostActive = true; break;
      case 'KeyT': this.callbacks.toggleLandingTakeoff(); break;
      case 'KeyH': this.callbacks.triggerReturnToHome(); break;
      case 'KeyM': store.setHangarModalOpen(true); break;
      case 'KeyP': this.callbacks.captureAerialSnapshot(); break;
      case 'KeyG': this.callbacks.toggleGuidedTour(); break;
      case 'KeyF': this.callbacks.triggerLidarScan(); break;
      case 'KeyC': this.callbacks.cycleCameraMode(); break;
      case 'KeyV': this.callbacks.cycleAtmosphere(); break;
      case 'KeyR': this.callbacks.toggleRingChallenge(); break;
      case 'KeyK': store.setTerminalModalOpen(true); break;
    }
  };

  private onKeyUp = (e: KeyboardEvent): void => {
    this.keys[e.code] = false;
    if (e.code === 'KeyB') this.boostActive = false;
  };

  private onMouseDown = (e: MouseEvent): void => {
    this.camOrbit.isDragging = true;
    this.camOrbit.lastX = e.clientX;
    this.camOrbit.lastY = e.clientY;
  };

  private onMouseMove = (e: MouseEvent): void => {
    if (!this.camOrbit.isDragging) return;
    const dx = e.clientX - this.camOrbit.lastX;
    const dy = e.clientY - this.camOrbit.lastY;
    this.camOrbit.lastX = e.clientX;
    this.camOrbit.lastY = e.clientY;
    this.camOrbit.theta -= dx * 0.006;
    this.camOrbit.phi = THREE.MathUtils.clamp(this.camOrbit.phi + dy * 0.005, 0.08, 1.15);
  };

  private onMouseUp = (): void => {
    this.camOrbit.isDragging = false;
  };

  private onWheel = (e: WheelEvent): void => {
    this.camOrbit.distance = THREE.MathUtils.clamp(
      this.camOrbit.distance + e.deltaY * 0.01,
      4.5,
      22.0
    );
  };

  private onDoubleClick = (e: MouseEvent): void => {
    const ndc = new THREE.Vector2(
      (e.clientX / window.innerWidth) * 2 - 1,
      -(e.clientY / window.innerHeight) * 2 + 1
    );
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(ndc, this.camera);

    const islandGroups = this.callbacks.getIslandGroups();
    const hits = raycaster.intersectObjects(islandGroups, true);
    if (hits.length > 0) {
      let hitObj: THREE.Object3D | null = hits[0].object;
      while (hitObj && hitObj.parent && !islandGroups.includes(hitObj as THREE.Group)) {
        hitObj = hitObj.parent;
      }
      const foundIdx = islandGroups.indexOf(hitObj as THREE.Group);
      if (foundIdx !== -1) this.callbacks.engageAutopilot(foundIdx);
    }
  };

  private setup(): void {
    window.addEventListener('resize', this.onResize);
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('mousemove', this.onMouseMove);
    window.addEventListener('mouseup', this.onMouseUp);

    this.container.addEventListener('mousedown', this.onMouseDown);
    this.container.addEventListener('wheel', this.onWheel, { passive: true });
    this.container.addEventListener('dblclick', this.onDoubleClick);
  }

  dispose(): void {
    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('mousemove', this.onMouseMove);
    window.removeEventListener('mouseup', this.onMouseUp);

    this.container.removeEventListener('mousedown', this.onMouseDown);
    this.container.removeEventListener('wheel', this.onWheel);
    this.container.removeEventListener('dblclick', this.onDoubleClick);
  }
}
