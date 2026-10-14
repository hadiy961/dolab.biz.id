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
  },
};
