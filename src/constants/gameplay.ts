/**
 * Gameplay / simulation constants.
 */

// --- Flight plan ---
export const MAX_FLIGHT_PLAN_WAYPOINTS = 12;
export const WAYPOINT_AUDIO_BASE_FREQ = 780;
export const WAYPOINT_AUDIO_STEP = 35; // Hz added per waypoint

// --- Battery ---
export const BATTERY_RTH_THRESHOLD = 8.0; // % below which RTH auto-triggers
export const BATTERY_WARN_THRESHOLD = 35;  // % battery warning level
export const BATTERY_CRITICAL_THRESHOLD = 15; // % battery critical level

// --- Boot sequence ---
export const BOOT_PROGRESS_STEP = 4;    // % per tick
export const BOOT_TICK_INTERVAL_MS = 45;
export const BOOT_COMPLETE_DELAY_MS = 350;
export const BOOT_TAKEOFF_DELAY_MS = 450;

// --- Toast ---
export const TOAST_DURATION_MS = 2800;

// --- Biodome material ---
export const BIODOME_COLORS = [0x4ade80, 0x22d3ee, 0xfacc15] as const;
export const BIODOME_EMISSIVES = [0x10b981, 0x06b6d4, 0xeab308] as const;
export const BIODOME_EMISSIVE_INTENSITY_DIM = 0.35;
export const BIODOME_EMISSIVE_INTENSITY_BRIGHT = 0.85;

// --- Drone livery hex colours ---
export const LIVERY_COLORS = {
  pearl:   { hull: 0xf8fafc, canopy: 0x0284c7 },
  stealth: { hull: 0x1e293b, canopy: 0x38bdf8 },
  rescue:  { hull: 0xf97316, canopy: 0x0f172a },
  royal:   { hull: 0xfbbf24, canopy: 0x1e293b },
} as const;

// --- AI batch load ---
export const AI_HELIX_OVERCLOCK_THRESHOLD = 10; // units above which helixMode = 2
