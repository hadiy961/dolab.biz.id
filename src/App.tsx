import React, { useEffect, useRef } from 'react';
import { BootScreen } from './components/BootScreen';
import { TopHudBar } from './components/TopHudBar';
import { RadarWidget } from './components/RadarWidget';
import { StationDrawer } from './components/StationDrawer';
import { BottomDock } from './components/BottomDock';
import { ProjectModal } from './components/Modals/ProjectModal';
import { TerminalModal } from './components/Modals/TerminalModal';
import { HangarModal } from './components/Modals/HangarModal';
import { SnapshotModal } from './components/Modals/SnapshotModal';
import { ArchipelagoEngine } from './three/ArchipelagoEngine';
import { useLabStore } from './store/useLabStore';

export const App: React.FC = () => {
  const webglContainerRef = useRef<HTMLDivElement>(null);
  const spatialMarkersRef = useRef<HTMLDivElement>(null);
  const altitudeRef = useRef<HTMLSpanElement>(null);
  const speedRef = useRef<HTMLSpanElement>(null);
  const batteryRef = useRef<HTMLSpanElement>(null);
  const windRef = useRef<HTMLSpanElement>(null);
  const headingRef = useRef<HTMLSpanElement>(null);
  const stationDistanceRef = useRef<HTMLSpanElement>(null);
  const radarCanvasRef = useRef<HTMLCanvasElement>(null);

  const toastMessage = useLabStore((s) => s.toastMessage);
  const setEngine = useLabStore((s) => s.setEngine);

  useEffect(() => {
    if (!webglContainerRef.current) return;

    const engineInstance = new ArchipelagoEngine(webglContainerRef.current, {
      altitudeEl: altitudeRef.current,
      speedEl: speedRef.current,
      batteryEl: batteryRef.current,
      windEl: windRef.current,
      headingEl: headingRef.current,
      stationDistanceEl: stationDistanceRef.current,
      radarCanvas: radarCanvasRef.current,
      spatialMarkersContainer: spatialMarkersRef.current,
    });

    setEngine(engineInstance);

    return () => {
      engineInstance.dispose();
      setEngine(null);
    };
  }, [setEngine]);

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* 1. Pre-Flight Diagnostics Overlay */}
      <BootScreen />

      {/* 2. WebGL 3D Canvas Container */}
      <div
        ref={webglContainerRef}
        className="fixed inset-0 w-full h-full z-[1]"
      />

      {/* 2B. 3D Spatial Floating Waypoint Markers */}
      <div
        ref={spatialMarkersRef}
        className="fixed inset-0 z-10 pointer-events-none overflow-hidden"
      />

      {/* 3. Minimalist & Clean HUD Overlay */}
      <div className="fixed inset-0 z-10 pointer-events-none flex flex-col justify-between p-3 sm:p-4">
        <TopHudBar
          altitudeRef={altitudeRef}
          speedRef={speedRef}
          batteryRef={batteryRef}
          windRef={windRef}
        />

        {/* Center Toast Notification */}
        <div
          className={`self-center aero-glass-dark text-white px-4 py-1.5 rounded-full text-xs font-mono-tech tracking-wide transition-opacity duration-300 pointer-events-none shadow-lg ${
            toastMessage ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {toastMessage || 'SYSTEM READY'}
        </div>

        {/* Middle Area: Bottom-Left Radar & Flight Planner + Right Collapsible Station Drawer */}
        <div className="flex-1 flex items-end md:items-center justify-between my-2 relative overflow-hidden">
          <RadarWidget
            radarCanvasRef={radarCanvasRef}
            headingRef={headingRef}
          />
          <StationDrawer stationDistanceRef={stationDistanceRef} />
        </div>

        {/* Bottom Area: Mobile Touch Pads + 10-Island Quick-Select Dock */}
        <BottomDock />
      </div>

      {/* 4. Interactive Modals */}
      <ProjectModal />
      <TerminalModal />
      <HangarModal />
      <SnapshotModal />
    </div>
  );
};

export default App;
