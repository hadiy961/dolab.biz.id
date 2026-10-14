# Hadiyatna Sky Archipelago Lab (`dolab.biz.id`) — v4.6.0 (Modular Edition)

Interactive 10-Island 3D Sky Archipelago Research Lab & Drone Portfolio built with **React 18, TypeScript, Three.js, Zustand, and Tailwind CSS**.

## Modular Codebase Structure (`src/`)

```text
src/
├── App.tsx                                   # Root layout & 60Hz telemetry ref wiring
├── main.tsx                                  # React DOM entry point
├── index.css                                 # Tailwind + Aero-Glass utilities
├── types/
│   └── lab.ts                                # Domain interfaces & union types
├── data/
│   ├── stations.ts                           # 10 Floating Island coordinates & metadata
│   ├── flightAndWeather.ts                   # Flight PID profiles, 5 Weather presets, Route presets
│   ├── cargoMissions.ts                      # 4 Inter-island Payload Delivery missions
│   ├── portfolioContent.ts                   # Case studies, Tech benchmarks, Publications
│   ├── projects.ts                           # Barrel re-export module
│   └── translations.ts                       # Bilingual (ID/EN) HUD & status strings
├── services/
│   └── audioSynth.ts                         # Web Audio API rotor synth & harmonic chords
├── store/
│   └── useLabStore.ts                        # Single-source-of-truth Zustand store
├── three/
│   ├── ArchipelagoEngine.ts                  # Core WebGL orchestrator & bridge API
│   ├── droneBuilder.ts                       # Aero-Sonde V4 mesh, cargo pod & spotlight cone
│   ├── islandBuilders.ts                     # Archipelago builder orchestrator & sky-path arcs
│   ├── textures.ts                           # Procedural sky gradient, helipad & rock cliff geo
│   ├── islands/
│   │   ├── islandTypesAndMaterials.ts        # Shared island PBR materials & FX handles
│   │   ├── baseIslandPlatform.ts             # Cliff, gravity ring, meadow, helipad & trees
│   │   ├── bespokeStructuresA.ts             # Bespoke 3D architecture for Islands 00–04
│   │   └── bespokeStructuresB.ts             # Bespoke 3D architecture for Islands 05–09
│   └── systems/
│       ├── environmentProps.ts               # Clouds, birds, LiDAR, ring gates, cargo & rain meshes
│       ├── flightPhysicsSystem.ts            # 6-DoF physics, cargo weight/damping, autopilot & camera
│       ├── islandAnimations.ts               # Per-island interactive 3D FX & beacon animations
│       ├── radarRenderer.ts                  # 2D Canvas radar minimap & 3D HTML waypoint projection
│       └── weatherSystem.ts                  # 5-Mode atmosphere lighting, wind vector & lightning
└── components/
    ├── BootScreen.tsx                        # Pre-flight diagnostics overlay
    ├── TopHudBar.tsx                         # Top telemetry bar & quick controls
    ├── CargoMissionBanner.tsx                # Active cargo pickup/transit HUD banner
    ├── RadarWidget.tsx                       # Interactive 2D radar & patrol controls
    ├── FlightPlannerDrawer.tsx               # Multi-waypoint altitude/speed segment editor
    ├── StationDrawer.tsx                     # Collapsible right-hand island portfolio drawer
    ├── IslandContentPanels.tsx               # Station 00–09 panel router
    ├── BottomDock.tsx                        # Mobile touch flight pads & 10-island dock
    ├── islands/
    │   ├── SanctuaryBioBiodomePanels.tsx     # UI panels for ISL-00, ISL-01, ISL-02
    │   ├── HydroHelixSolarPanels.tsx         # UI panels for ISL-03, ISL-04, ISL-05
    │   └── HangarZenSonicSummitPanels.tsx    # UI panels for ISL-06, ISL-07, ISL-08, ISL-09
    └── Modals/
        ├── HangarModal.tsx                   # Payload missions board, 5-weather lab & tuning
        ├── ProjectModal.tsx                  # Case study technical blueprint modal
        ├── SnapshotModal.tsx                 # Aerial recon photo preview & PNG download
        └── TerminalModal.tsx                 # CV dossier download & AERO-OS CLI shell
```
