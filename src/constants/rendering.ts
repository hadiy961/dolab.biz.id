/**
 * Three.js / WebGL rendering constants.
 * Centralising these avoids magic numbers scattered through ArchipelagoEngine.ts.
 */

// --- Scene / World ---
export const SKY_DOME_RADIUS = 950;
export const FOG_DENSITY = 0.0014;
export const ISLAND_PROXIMITY_THRESHOLD = 28.0; // metres — triggers activeStation change
export const LANDING_LASER_AGL_RANGE = 28.0;    // metres — altitude laser visible range

// --- Shadow map ---
export const SHADOW_MAP_SIZE = 2048;
export const SHADOW_CAMERA_DEPTH = 220; // half-extent of sun shadow frustum

// --- Camera ---
export const CAMERA_FOV = 58;
export const CAMERA_NEAR = 0.2;
export const CAMERA_FAR = 1600;
export const CAMERA_ZOOM_MIN = 4.5;
export const CAMERA_ZOOM_MAX = 22.0;

// --- Lights ---
export const SUN_COLOR = 0xfffbeb;
export const HEMI_SKY_COLOR = 0xe0f2fe;
export const HEMI_GROUND_COLOR = 0x94a3b8;
export const SUN_INTENSITY = 1.35;
export const HEMI_INTENSITY = 0.95;

// --- LiDAR ring ---
export const LIDAR_EXPAND_SPEED = 55;  // units/s
export const LIDAR_MAX_RADIUS = 95;

// --- Downwash ring ---
export const DOWNWASH_AGL_MAX = 7.5; // metres above ground level
export const DOWNWASH_THROTTLE_MIN = 0.15;

// --- Contrail ---
export const CONTRAIL_SPEED_THRESHOLD = 5.0; // m/s
export const CONTRAIL_SPEED_SCALE = 22.0;
export const CONTRAIL_OPACITY_MAX = 0.55;

// --- Guided tour ---
export const TOUR_STATION_DWELL_S = 6.0; // seconds at each island
export const TOUR_ORBIT_RATE = 0.24;     // radians/s theta drift

// --- Snapshot overlay ---
export const SNAPSHOT_BAR_HEIGHT_RATIO = 0.065;
export const SNAPSHOT_BAR_OPACITY = 0.82;

// --- Ring challenge gate ---
export const RING_GATE_PASS_RADIUS = 4.5; // metres proximity trigger
