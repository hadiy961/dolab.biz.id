/**
 * Audio frequency constants (Hz) for the Avionics Synthesizer.
 * Based on musical pitches & operational tones used throughout the engine.
 */
export const AUDIO_NOTES = {
  // Standard musical pitches (ISO 16)
  A4: 440,
  C5: 523.25,
  E5: 659.25,
  G5: 783.99,
  A5: 880,
  C6: 1046.5,

  // Operational tones
  TAKEOFF: 660,
  LAND: 520,
  RTH: 540,
  AUTOPILOT: 780,
  NEXT_STATION: 760,
  CAMERA_CYCLE: 700,
  ATMOSPHERE: 820,
  LIDAR_SCAN: 960,
  RING_GATE: 980,
  WINGMAN: 920,
  LIVERY: 880,
  FLIGHT_PROFILE: 790,
  CARGO_ABORT: 480,
  CARGO_ASSIGN: 760,
  PLANNER_ON: 860,
  PLANNER_OFF: 680,
  WAYPOINT_ADD_BASE: 780,
  WAYPOINT_REMOVE: 620,
  WAYPOINT_CLEAR: 540,
  WAYPOINT_LOOP: 750,
  WAYPOINT_PRESET: 880,
  WAYPOINT_SKIP: 840,
  PROJECT_FILTER: 760,
  ISLAND_INTERACTION: 740,
  MODAL_HANGAR: 840,
  MODAL_TERMINAL: 890,
  PROJECT_MODAL: 880,
} as const;

/**
 * Musical chord presets used for milestone events.
 */
export const AUDIO_CHORDS = {
  CARGO_PICKUP: [AUDIO_NOTES.A4, 554.37, AUDIO_NOTES.E5] as number[],
  CARGO_DELIVERED: [AUDIO_NOTES.C5, AUDIO_NOTES.E5, AUDIO_NOTES.G5, AUDIO_NOTES.C6] as number[],
  PATROL_START: [AUDIO_NOTES.C5, AUDIO_NOTES.E5, AUDIO_NOTES.G5] as number[],
  SONIC_ETHEREAL: [AUDIO_NOTES.A4, AUDIO_NOTES.E5] as number[],
  SONIC_SOLAR: [AUDIO_NOTES.C5, AUDIO_NOTES.E5, AUDIO_NOTES.G5] as number[],
  SONIC_COSMOS: [392, 587.33, AUDIO_NOTES.A5] as number[],
} as const;

/** Short duration (seconds) for UI feedback beeps */
export const AUDIO_DURATIONS = {
  TINY: 0.04,
  SHORT: 0.05,
  NORMAL: 0.06,
  MEDIUM: 0.08,
  LONG: 0.12,
} as const;
