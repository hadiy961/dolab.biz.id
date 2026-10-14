import { PayloadMission } from '../types/lab';

export const PAYLOAD_MISSIONS: PayloadMission[] = [
  {
    id: 'fusion-cell',
    code: 'CRG-01',
    originStationId: 5, // ISL-05 Solar Core
    destStationId: 4, // ISL-04 Helix AI
    weightKg: 5.4,
    colorHex: 0xf59e0b,
    speedMultiplier: 0.81,
    dampingMultiplier: 0.58,
    tiltMultiplier: 1.32,
    batteryDrainMultiplier: 1.65,
    title: {
      id: 'Sel Fusi Tokamak → Helix AI',
      en: 'Tokamak Fusion Cell → Helix AI',
    },
    desc: {
      id: 'Angkut inti plasma magnetik 5.4 kg dari ISL-05 Solar Core ke menara komputasi ISL-04 Helix AI untuk suplai klaster neural.',
      en: 'Transport a 5.4 kg magnetic plasma core from ISL-05 Solar Core to ISL-04 Helix AI Spire to power neural inference.',
    },
  },
  {
    id: 'cryo-flora',
    code: 'CRG-02',
    originStationId: 2, // ISL-02 R&D Biodome
    destStationId: 1, // ISL-01 Bio Studio
    weightKg: 3.2,
    colorHex: 0x10b981,
    speedMultiplier: 0.9,
    dampingMultiplier: 0.75,
    tiltMultiplier: 1.18,
    batteryDrainMultiplier: 1.35,
    title: {
      id: 'Kapsul Bio-Krio → Observatorium',
      en: 'Cryo-Flora Pod → Bio Studio',
    },
    desc: {
      id: 'Kirim spesimen flora bioluminesensi 3.2 kg dari ISL-02 Biodome menuju laboratorium analisis ISL-01 Bio Studio.',
      en: 'Deliver a 3.2 kg bioluminescent flora specimen from ISL-02 R&D Biodome to ISL-01 Observatory Lab.',
    },
  },
  {
    id: 'quantum-uplink',
    code: 'CRG-03',
    originStationId: 4, // ISL-04 Helix AI
    destStationId: 9, // ISL-09 Summit Spire
    weightKg: 6.8,
    colorHex: 0xa855f7,
    speedMultiplier: 0.74,
    dampingMultiplier: 0.48,
    tiltMultiplier: 1.42,
    batteryDrainMultiplier: 1.88,
    title: {
      id: 'Transponder Kuantum → Puncak 09',
      en: 'Quantum Transponder → Summit 09',
    },
    desc: {
      id: 'Misi kargo berat (+92m alt): Bawa modul enkripsi kuantum 6.8 kg dari ISL-04 menuju antena luar angkasa ISL-09 Summit Spire.',
      en: 'Heavy high-altitude haul (+92m): Carry a 6.8 kg quantum encryption module from ISL-04 to ISL-09 Deep-Space Array.',
    },
  },
  {
    id: 'acoustic-resonator',
    code: 'CRG-04',
    originStationId: 8, // ISL-08 Sonic Stage
    destStationId: 7, // ISL-07 Zen Garden
    weightKg: 4.1,
    colorHex: 0x14b8a6,
    speedMultiplier: 0.86,
    dampingMultiplier: 0.66,
    tiltMultiplier: 1.25,
    batteryDrainMultiplier: 1.48,
    title: {
      id: 'Resonator Akustik → Taman Zen',
      en: 'Harmonic Resonator → Zen Garden',
    },
    desc: {
      id: 'Antarkan modul garpu tala kinetik 4.1 kg dari amfiteater ISL-08 menuju paviliun meditasi ISL-07 Zen Pagoda.',
      en: 'Transport a 4.1 kg kinetic harmonic tuning module from ISL-08 Sonic Stage to ISL-07 Zen Pagoda.',
    },
  },
];
