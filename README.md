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

## Deploy (image → registry → manage_56)

Development native di mesin sendiri; produksi menjalankan image nginx self-contained dari Docker Hub.
Source tidak pernah ada di server produksi — yang tinggal di sana cuma file compose + image.

```sh
npm ci && npm run dev      # dev server + HMR (localhost:5173)
./deploy/deploy.sh status            # apa yang jalan di prod + probe publik
./deploy/deploy.sh preview           # dispatch CI -> tarik :preview -> buka di 127.0.0.1
./deploy/deploy.sh preview --local   # build di mesin ini (butuh Docker, tanpa gh)
./deploy/deploy.sh publish           # dispatch CI -> push :preview, prod tidak disentuh
./deploy/deploy.sh use <tag>         # ganti tag prod (stable|beta|preview|sha-xxx|1.0.0-stable)
./deploy/deploy.sh release v1.0.0-stable   # tag + push -> CI build & rilis
./deploy/deploy.sh local             # build+push darurat tanpa CI
```

Skrip ditulis POSIX `sh`, jadi jalan di Linux, macOS, dan Windows lewat Git Bash/WSL.
Yang wajib ada di PATH: `docker`; `gh` untuk perintah yang memanggil CI; `ssh`/`scp` untuk perintah prod.

| Pemicu | Image Docker Hub | GitHub |
|---|---|---|
| `./deploy/deploy.sh preview` (manual) | `:preview` | tidak ada rilis |
| `./deploy/deploy.sh preview --local` | hanya lokal, tidak di-push | tidak ada rilis |
| tag `v*-beta*` | `:beta`, `:<versi>`, `:sha` | prerelease |
| tag `v*-stable` | `:stable`, `:latest`, `:<versi>`, `:<major>.<minor>`, `:sha` | release (latest) |

Commit ke `main` tidak memicu build apa pun: Actions hanya jalan saat skrip ini memanggilnya atau
saat tag rilis di-push. Produksi mengikuti `:stable` (`pull_policy: always`).

| Objek | Nilai |
|---|---|
| Build host | dev126 (`/home/hadiyatna/project/dolab.biz.id`) — tanpa container |
| Prod host | manage_56, compose di `/data/web/dolab-web/` |
| Container | `dolab-web`, publish `0.0.0.0:3001 -> 80`, `restart: unless-stopped` |
| Tunnel | `62130f66-9651-46da-91f6-7ee0b18c8bb5`, ingress `dolab.biz.id -> http://100.126.95.52:3001` |
| DNS | `dolab.biz.id` → CNAME tunnel tersebut (proxied) |
