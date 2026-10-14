import { Language } from '../types/lab';

export const UI_TRANSLATIONS: Record<
  Language,
  {
    manualMode: string;
    autopilotTo: string;
    docked: string;
    inFlight: string;
    takeoffMsg: string;
    landingMsg: string;
    landedMsg: string;
    scanMsg: string;
    cargoAssigned: string;
    cargoPickedUp: string;
    cargoDelivered: string;
    patrolStarted: string;
    patrolStopped: string;
  }
> = {
  id: {
    manualMode: 'KEMUDI MANUAL AKTIF',
    autopilotTo: 'AUTOPILOT MENUJU: ',
    docked: 'TERHUBUNG DI PULAU',
    inFlight: 'TERBANG BEBAS',
    takeoffMsg: 'LEPAS LANDAS OTOMATIS...',
    landingMsg: 'PENDARATAN PRESISI DI HELIPAD...',
    landedMsg: 'DRONE MENDARAT — PENGISIAN DAYA CEPAT AKTIF',
    scanMsg: 'GELOMBANG SONAR LIDAR DIPANCARKAN',
    cargoAssigned: 'MISI KARGO AKTIF — MENDARAT DI PULAU ASAL UNTUK PICKUP',
    cargoPickedUp: 'MODUL KARGO TERKUNCI — LEPAS LANDAS KE PULAU TUJUAN!',
    cargoDelivered: 'PENGIRIMAN KARGO SUKSES — MODUL RISET DITERIMA!',
    patrolStarted: 'RUTE PATROLI WAYPOINT OTOMATIS DIMULAI',
    patrolStopped: 'RUTE PATROLI WAYPOINT DIHENTIKAN',
  },
  en: {
    manualMode: 'MANUAL FLIGHT ENGAGED',
    autopilotTo: 'AUTOPILOT TO: ',
    docked: 'DOCKED AT ISLAND',
    inFlight: 'AIRBORNE CRUISE',
    takeoffMsg: 'INITIATING AUTO-TAKEOFF...',
    landingMsg: 'PRECISION HELIPAD LANDING...',
    landedMsg: 'TOUCHDOWN CONFIRMED — RAPID SOLAR CHARGING',
    scanMsg: 'LIDAR TOPOGRAPHIC PULSE EMITTED',
    cargoAssigned: 'CARGO MISSION ASSIGNED — LAND AT ORIGIN PAD FOR PICKUP',
    cargoPickedUp: 'PAYLOAD CLAMP LOCKED — TAKE OFF TO DESTINATION ISLAND!',
    cargoDelivered: 'PAYLOAD DELIVERY COMPLETE — RESEARCH MODULE RECEIVED!',
    patrolStarted: 'CUSTOM WAYPOINT PATROL ROUTE ENGAGED',
    patrolStopped: 'WAYPOINT PATROL ROUTE TERMINATED',
  },
};
