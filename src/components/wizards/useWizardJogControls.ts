import { useEffect, useState } from 'react';
import { transport } from '../../services/transportService';
import type { GeneralSettings } from '../../stores/settingsStore';

export function useWizardJogControls(general: GeneralSettings, isIdle: boolean) {
  const isMetric = general.carvingUnits === 'mm';
  const unitLabel = isMetric ? 'mm' : 'in';
  const [stepSize, setStepSize] = useState<number>(isMetric ? 10 : 0.5);
  const stepSizes = isMetric ? [0.05, 0.1, 1, 5, 10, 100] : [0.001, 0.01, 0.05, 0.1, 0.5, 1];

  useEffect(() => {
    const nextIsMetric = general.carvingUnits === 'mm';
    setStepSize(nextIsMetric ? 10 : 0.5);
  }, [general.carvingUnits]);

  const handleJog = (x: number, y: number, z: number) => {
    if (!isIdle) return;
    const feed = 1000;

    let dirX = x;
    let dirY = y;
    let dirZ = z;
    if (general.reverseX) dirX *= -1;
    if (general.reverseY) dirY *= -1;
    if (general.reverseZ) dirZ *= -1;

    const cmd = `$J=G91 G21 X${dirX * stepSize} Y${dirY * stepSize} Z${dirZ * stepSize} F${feed}`;
    transport.invoke('send_gcode', { cmd }).catch(console.error);
  };

  return {
    isMetric,
    unitLabel,
    stepSize,
    setStepSize,
    stepSizes,
    handleJog,
  };
}
