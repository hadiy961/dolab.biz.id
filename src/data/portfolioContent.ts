import {
  ProjectCaseStudy,
  PublicationItem,
  TechSkillBenchmark,
} from '../types/lab';

export const PROJECT_CASE_STUDIES: ProjectCaseStudy[] = [
  {
    title: 'Autonomous Swarm UAV Telemetry Mesh',
    category: 'AEROSPACE',
    tag: 'AEROSPACE & WEBGL',
    descId:
      'Sistem komando dan kendali real-time untuk mengoordinasikan 24 drone otonom menggunakan WebRTC DataChannels, visualisasi peta 3D Three.js, dan algoritma penghindaran rintangan berbasis LiDAR.',
    descEn:
      'Real-time command and control mesh coordinating 24 autonomous quadcopters using WebRTC DataChannels, Three.js 3D digital twin visualization, and LiDAR obstacle avoidance.',
    stack: 'Stack: TypeScript • Three.js • WebRTC • Go • ROS2 Bridge',
    metrics: 'Latency: < 18ms End-to-End | 60 FPS Telemetry Stream',
  },
  {
    title: 'Neural Edge Vision & Thermal Inspector',
    category: 'AI',
    tag: 'COMPUTER VISION AI',
    descId:
      'Pipeline deteksi anomali termal otomatis pada gardu energi dan turbin angin menggunakan model kuantisasi TensorRT di atas perangkat Jetson Orin Nano.',
    descEn:
      'Automated thermal anomaly detection pipeline for wind turbines and solar substations running quantized TensorRT vision models on airborne edge compute.',
    stack: 'Stack: Python • PyTorch • TensorRT • FastAPI • WebSockets',
    metrics: 'Accuracy: 98.4% mAP | Inference: 11ms @ Edge',
  },
  {
    title: 'Cloud-Native Digital Twin Smart City',
    category: 'SPATIAL',
    tag: 'SPATIAL COMPUTING',
    descId:
      'Platform kembaran digital skala kota yang mengintegrasikan sensor IoT kualitas udara, mikro-iklim, dan simulasi bayangan matahari secara real-time di browser.',
    descEn:
      'City-scale digital twin platform integrating real-time IoT air quality sensors, micro-climate wind flows, and custom GLSL solar shadow simulation.',
    stack: 'Stack: React • WebGL / GLSL • Node.js • TimescaleDB',
    metrics: 'Capacity: 150,000+ Live Sensor Nodes',
  },
];

export const TECH_SKILL_BENCHMARKS: TechSkillBenchmark[] = [
  {
    name: 'Three.js / WebGL / Custom GLSL',
    pct: 96,
    color: 'bg-cyan-500',
    textCol: 'text-cyan-600',
    detailId:
      '60 FPS stabil dengan instanced mesh, custom shader atmosferik, dan raycasting spasial.',
    detailEn:
      'Sustained 60 FPS with instanced geometry, custom atmospheric shaders, and spatial raycasting.',
    bench: 'Draw Calls: 42 | Frame Budget: 6.4ms | VRAM: 38MB',
  },
  {
    name: 'TypeScript / React / Next.js',
    pct: 98,
    color: 'bg-sky-500',
    textCol: 'text-sky-600',
    detailId:
      'Arsitektur state terdistribusi, micro-frontends, dan dashboard telemetri real-time.',
    detailEn:
      'Distributed state architecture, modular micro-frontends, and real-time telemetry dashboards.',
    bench: 'TTI: 0.7s | Lighthouse: 99/100 | Strict Type Coverage: 100%',
  },
  {
    name: 'Go / Python / WebRTC / Docker',
    pct: 92,
    color: 'bg-indigo-500',
    textCol: 'text-indigo-600',
    detailId:
      'Broker telemetri berlatensi ultra-rendah, pipeline inferensi AI, dan orkestrasi kontainer.',
    detailEn:
      'Ultra-low-latency telemetry brokers, edge AI inference pipelines, and container orchestration.',
    bench: 'Throughput: 140k msg/s | P99 Latency: 11.2ms | Uptime: 99.98%',
  },
];

export const PUBLICATIONS_DATA: PublicationItem[] = [
  {
    title: 'Speaker: WebGL Digital Twins at Scale',
    venue: 'Spatial Computing Summit • 2025',
    summaryId:
      'Membahas teknik optimasi scene graph, frustum culling, dan sinkronisasi WebSocket 60Hz untuk ratusan sensor IoT di browser.',
    summaryEn:
      'Deep-dive into scene-graph optimization, frustum culling, and 60Hz WebSocket state sync for city-scale browser digital twins.',
    code: 'renderer.info.render.calls // Optimized < 50 draw calls',
  },
  {
    title: 'Open-Source: Low-Latency Drone Telemetry SDK',
    venue: 'GitHub Open-Source • 1.8k ★',
    summaryId:
      'Pustaka TypeScript & Go ringan untuk streaming paket sikap terbang (quaternions & IMU) via WebRTC DataChannels.',
    summaryEn:
      'Lightweight TypeScript & Go library for streaming 6-DoF quaternion attitude packets over WebRTC DataChannels.',
    code: 'uavMesh.subscribe("imu/attitude", pkt => syncGimbal(pkt));',
  },
];
