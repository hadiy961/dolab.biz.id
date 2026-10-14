import React from 'react';
import {
  BiodomeProjectsPanel,
  BioObservatoryPanel,
  SanctuaryPanel,
} from './islands/SanctuaryBioBiodomePanels';
import {
  HelixAiPanel,
  HydroValleyPanel,
  SolarCorePanel,
} from './islands/HydroHelixSolarPanels';
import {
  SettingsHangarPanel,
  SonicStagePanel,
  SummitSpirePanel,
  ZenGardenPanel,
} from './islands/HangarZenSonicSummitPanels';

interface IslandContentPanelsProps {
  stationId: number;
}

export const IslandContentPanels: React.FC<IslandContentPanelsProps> = ({
  stationId,
}) => {
  switch (stationId) {
    case 0:
      return <SanctuaryPanel />;
    case 1:
      return <BioObservatoryPanel />;
    case 2:
      return <BiodomeProjectsPanel />;
    case 3:
      return <HydroValleyPanel />;
    case 4:
      return <HelixAiPanel />;
    case 5:
      return <SolarCorePanel />;
    case 6:
      return <SettingsHangarPanel />;
    case 7:
      return <ZenGardenPanel />;
    case 8:
      return <SonicStagePanel />;
    default:
      return <SummitSpirePanel />;
  }
};
