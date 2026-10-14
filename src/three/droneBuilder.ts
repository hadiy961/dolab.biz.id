import * as THREE from 'three';

export interface WingmanDroneHandle {
  group: THREE.Group;
  prop: THREE.Mesh;
  side: number;
  pos: THREE.Vector3;
  vel: THREE.Vector3;
}

export interface DroneBuildResult {
  droneGroup: THREE.Group;
  gimbalGroup: THREE.Group;
  droneHullMaterial: THREE.MeshStandardMaterial;
  droneCanopyMaterial: THREE.MeshStandardMaterial;
  droneRotors: { group: THREE.Group; dir: number }[];
  droneBlurDiscs: THREE.Mesh[];
  downwashRingMesh: THREE.Mesh;
  droneLandingSpotLight: THREE.SpotLight;
  navSpotlightCone: THREE.Mesh<THREE.ConeGeometry, THREE.MeshBasicMaterial>;
  cargoPodGroup: THREE.Group;
  cargoPodAccentMat: THREE.MeshStandardMaterial;
  groundTargetGroup: THREE.Group;
  altitudeLaserLine: THREE.Line;
  contrailLeftLine: THREE.Line;
  contrailRightLine: THREE.Line;
  contrailLeftHistory: THREE.Vector3[];
  contrailRightHistory: THREE.Vector3[];
  wingmanDrones: WingmanDroneHandle[];
}

export const CONTRAIL_POINTS = 28;

export function buildAeroSondeDrone(
  scene: THREE.Scene,
  initialPos: THREE.Vector3
): DroneBuildResult {
  const droneGroup = new THREE.Group();
  const droneRotors: { group: THREE.Group; dir: number }[] = [];
  const droneBlurDiscs: THREE.Mesh[] = [];

  const droneHullMaterial = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    roughness: 0.22,
    metalness: 0.25,
  });
  const carbonMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.38,
    metalness: 0.65,
  });
  const droneCanopyMaterial = new THREE.MeshStandardMaterial({
    color: 0x0284c7,
    roughness: 0.1,
    metalness: 0.85,
  });
  const copperMotorMat = new THREE.MeshStandardMaterial({
    color: 0xd97706,
    roughness: 0.3,
    metalness: 0.85,
  });

  // 1. Aerodynamic Fuselage Body & Canopy Dome
  const fuselage = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.36, 1.65), droneHullMaterial);
  fuselage.castShadow = true;
  droneGroup.add(fuselage);

  const noseCone = new THREE.Mesh(new THREE.ConeGeometry(0.52, 0.65, 16), droneHullMaterial);
  noseCone.rotation.x = -Math.PI / 2;
  noseCone.position.set(0, 0, -1.12);
  droneGroup.add(noseCone);

  const canopyDome = new THREE.Mesh(new THREE.SphereGeometry(0.46, 20, 12), droneCanopyMaterial);
  canopyDome.scale.set(0.95, 0.52, 1.55);
  canopyDome.position.set(0, 0.18, -0.15);
  droneGroup.add(canopyDome);

  [-1, 1].forEach((side) => {
    const fin = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.42, 0.48), droneHullMaterial);
    fin.position.set(side * 0.36, 0.28, 0.72);
    fin.rotation.z = -side * 0.42;
    droneGroup.add(fin);
  });

  [-0.58, 0.58].forEach((sx) => {
    const skidBar = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 1.45, 8), carbonMat);
    skidBar.rotation.x = Math.PI / 2;
    skidBar.position.set(sx, -0.46, 0);
    const strutF = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.42, 8), carbonMat);
    strutF.position.set(sx * 0.85, -0.25, -0.42);
    const strutR = strutF.clone();
    strutR.position.z = 0.42;
    droneGroup.add(skidBar, strutF, strutR);
  });

  // 1B. Under-Slung Magnetic Payload Pod (Visible during Cargo Transit)
  const cargoPodGroup = new THREE.Group();
  cargoPodGroup.position.set(0, -0.58, 0);
  const cargoPodAccentMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    emissive: 0xf59e0b,
    emissiveIntensity: 0.75,
    roughness: 0.2,
    metalness: 0.5,
  });
  const podCore = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.92, 12), carbonMat);
  podCore.rotation.x = Math.PI / 2;
  podCore.castShadow = true;

  const podRingFront = new THREE.Mesh(
    new THREE.TorusGeometry(0.29, 0.045, 10, 20),
    cargoPodAccentMat
  );
  podRingFront.position.z = -0.26;
  const podRingRear = podRingFront.clone();
  podRingRear.position.z = 0.26;

  const podBeacon = new THREE.Mesh(new THREE.SphereGeometry(0.11, 12, 12), cargoPodAccentMat);
  podBeacon.position.set(0, -0.26, 0);

  [-0.24, 0.24].forEach((cx) => {
    const clampArm = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.36, 0.08), carbonMat);
    clampArm.position.set(cx, 0.24, 0);
    cargoPodGroup.add(clampArm);
  });

  cargoPodGroup.add(podCore, podRingFront, podRingRear, podBeacon);
  cargoPodGroup.visible = false;
  droneGroup.add(cargoPodGroup);

  // 2. Stabilized 3-Axis Front Camera Gimbal & Volumetric Spotlight
  const gimbalGroup = new THREE.Group();
  gimbalGroup.position.set(0, -0.2, -0.92);
  const gimbalSphere = new THREE.Mesh(new THREE.SphereGeometry(0.18, 16, 16), carbonMat);
  const lensRing = new THREE.Mesh(
    new THREE.CylinderGeometry(0.09, 0.09, 0.12, 16),
    new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
  );
  lensRing.rotation.x = Math.PI / 2;
  lensRing.position.z = -0.14;
  gimbalGroup.add(gimbalSphere, lensRing);
  droneGroup.add(gimbalGroup);

  const droneLandingSpotLight = new THREE.SpotLight(0xe0f2fe, 1.2, 46, Math.PI / 4.2, 0.55, 1.1);
  droneLandingSpotLight.position.set(0, -0.28, -0.45);
  droneLandingSpotLight.target.position.set(0, -14, -8.5);
  droneGroup.add(droneLandingSpotLight, droneLandingSpotLight.target);

  const coneGeo = new THREE.ConeGeometry(4.2, 15.0, 24, 1, true);
  coneGeo.translate(0, -7.5, 0);
  const navSpotlightCone = new THREE.Mesh(
    coneGeo,
    new THREE.MeshBasicMaterial({
      color: 0xbae6fd,
      transparent: true,
      opacity: 0.0,
      side: THREE.DoubleSide,
      depthWrite: false,
    })
  );
  navSpotlightCone.position.set(0, -0.25, -0.65);
  navSpotlightCone.rotation.x = -0.52;
  navSpotlightCone.visible = false;
  droneGroup.add(navSpotlightCone);

  // 3. Four Carbon Arms, Ducted Shrouds, Brushless Motors & Spinning Propellers
  const armCoords = [
    { x: -1.15, z: -1.05, color: 0xef4444 },
    { x: 1.15, z: -1.05, color: 0x10b981 },
    { x: -1.15, z: 1.05, color: 0x38bdf8 },
    { x: 1.15, z: 1.05, color: 0x38bdf8 },
  ];

  armCoords.forEach((ac, idx) => {
    const armLen = Math.hypot(ac.x, ac.z);
    const armTube = new THREE.Mesh(
      new THREE.CylinderGeometry(0.055, 0.065, armLen, 10),
      carbonMat
    );
    armTube.position.set(ac.x * 0.5, 0.02, ac.z * 0.5);
    armTube.rotation.z = Math.PI / 2;
    armTube.rotation.y = -Math.atan2(ac.z, ac.x);
    droneGroup.add(armTube);

    const shroud = new THREE.Mesh(new THREE.TorusGeometry(0.68, 0.045, 10, 28), carbonMat);
    shroud.rotation.x = Math.PI / 2;
    shroud.position.set(ac.x, 0.08, ac.z);
    droneGroup.add(shroud);

    const stator = new THREE.Mesh(
      new THREE.CylinderGeometry(0.14, 0.14, 0.14, 14),
      copperMotorMat
    );
    stator.position.set(ac.x, 0.08, ac.z);
    droneGroup.add(stator);

    const navLed = new THREE.Mesh(
      new THREE.SphereGeometry(0.065, 10, 10),
      new THREE.MeshBasicMaterial({ color: ac.color })
    );
    navLed.position.set(ac.x, -0.04, ac.z);
    droneGroup.add(navLed);

    const rotorSpinner = new THREE.Group();
    rotorSpinner.position.set(ac.x, 0.17, ac.z);
    for (let b = 0; b < 3; b++) {
      const bladePivot = new THREE.Group();
      bladePivot.rotation.y = (b / 3) * Math.PI * 2;
      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.015, 0.09), carbonMat);
      blade.position.x = 0.29;
      bladePivot.add(blade);
      rotorSpinner.add(bladePivot);
    }
    droneGroup.add(rotorSpinner);
    droneRotors.push({ group: rotorSpinner, dir: idx % 2 === 0 ? 1 : -1 });

    const blurDisc = new THREE.Mesh(
      new THREE.CylinderGeometry(0.62, 0.62, 0.01, 24),
      new THREE.MeshBasicMaterial({
        color: 0xe2e8f0,
        transparent: true,
        opacity: 0.0,
        depthWrite: false,
      })
    );
    blurDisc.position.set(ac.x, 0.18, ac.z);
    droneGroup.add(blurDisc);
    droneBlurDiscs.push(blurDisc);
  });

  // 4. Downwash Air-Vortex Ring & Ground Target Reticle
  const downwashRingMesh = new THREE.Mesh(
    new THREE.RingGeometry(0.85, 2.25, 36),
    new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.0,
      side: THREE.DoubleSide,
      depthWrite: false,
    })
  );
  downwashRingMesh.rotation.x = -Math.PI / 2;
  scene.add(downwashRingMesh);

  const groundTargetGroup = new THREE.Group();
  const targetOuter = new THREE.Mesh(
    new THREE.RingGeometry(0.65, 0.78, 32),
    new THREE.MeshBasicMaterial({
      color: 0x0ea5e9,
      transparent: true,
      opacity: 0.65,
      side: THREE.DoubleSide,
      depthWrite: false,
    })
  );
  targetOuter.rotation.x = -Math.PI / 2;
  const targetCross = new THREE.Mesh(
    new THREE.RingGeometry(0.12, 0.22, 16),
    new THREE.MeshBasicMaterial({
      color: 0x10b981,
      transparent: true,
      opacity: 0.85,
      side: THREE.DoubleSide,
      depthWrite: false,
    })
  );
  targetCross.rotation.x = -Math.PI / 2;
  groundTargetGroup.add(targetOuter, targetCross);
  scene.add(groundTargetGroup);

  const altitudeLaserLine = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, -10, 0),
    ]),
    new THREE.LineDashedMaterial({
      color: 0x38bdf8,
      dashSize: 0.35,
      gapSize: 0.25,
      transparent: true,
      opacity: 0.45,
    })
  );
  altitudeLaserLine.computeLineDistances();
  scene.add(altitudeLaserLine);

  // 5. Wingtip Contrail Lines & V-Formation Wingman Swarm
  const contrailLeftHistory: THREE.Vector3[] = [];
  const contrailRightHistory: THREE.Vector3[] = [];
  for (let i = 0; i < CONTRAIL_POINTS; i++) {
    contrailLeftHistory.push(initialPos.clone());
    contrailRightHistory.push(initialPos.clone());
  }
  const contrailMat = new THREE.LineBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.0,
  });
  const contrailLeftLine = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(contrailLeftHistory),
    contrailMat
  );
  const contrailRightLine = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(contrailRightHistory),
    contrailMat
  );
  scene.add(contrailLeftLine, contrailRightLine);

  droneGroup.position.copy(initialPos);
  scene.add(droneGroup);

  const wingmanDrones: WingmanDroneHandle[] = [];
  const wingMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    roughness: 0.25,
    metalness: 0.6,
  });
  const frameMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.4,
    metalness: 0.7,
  });

  [-1, 1].forEach((side) => {
    const wGroup = new THREE.Group();
    const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.32, 0), wingMat);
    core.scale.set(1.1, 0.45, 1.4);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.52, 0.035, 8, 24), frameMat);
    ring.rotation.x = Math.PI / 2;
    const prop = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.02, 0.08), wingMat);
    prop.position.y = 0.12;
    wGroup.add(core, ring, prop);
    wGroup.position.set(initialPos.x + side * 2.6, initialPos.y + 0.5, initialPos.z + 2.4);
    wGroup.visible = false;
    scene.add(wGroup);
    wingmanDrones.push({
      group: wGroup,
      prop,
      side,
      pos: wGroup.position.clone(),
      vel: new THREE.Vector3(),
    });
  });

  return {
    droneGroup,
    gimbalGroup,
    droneHullMaterial,
    droneCanopyMaterial,
    droneRotors,
    droneBlurDiscs,
    downwashRingMesh,
    droneLandingSpotLight,
    navSpotlightCone,
    cargoPodGroup,
    cargoPodAccentMat,
    groundTargetGroup,
    altitudeLaserLine,
    contrailLeftLine,
    contrailRightLine,
    contrailLeftHistory,
    contrailRightHistory,
    wingmanDrones,
  };
}
