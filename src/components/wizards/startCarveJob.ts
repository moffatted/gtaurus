import { transport } from '../../services/transportService';

interface MacroLike {
  id: string;
  content: string;
}

interface StartCarveJobParams {
  machineStatus: string;
  activeFilePath: string;
  feedRate: number;
  postJobAction: boolean;
  postJobMacroId: string | null;
  macros: MacroLike[];
  clearSimulation: () => void;
  clearActualPath: () => void;
}

export async function startCarveJob(params: StartCarveJobParams): Promise<string> {
  const {
    machineStatus,
    activeFilePath,
    feedRate,
    postJobAction,
    postJobMacroId,
    macros,
    clearSimulation,
    clearActualPath,
  } = params;

  if (machineStatus === 'Alarm') {
    await transport.invoke('send_gcode', { cmd: '$X' });
  }

  let postJobGcode: string | undefined;
  if (postJobAction && postJobMacroId) {
    const macro = macros.find((item) => item.id === postJobMacroId);
    if (macro) {
      postJobGcode = macro.content;
    }
  }

  clearSimulation();
  clearActualPath();

  return transport.invoke<string>('stream_local_gcode', {
    path: activeFilePath,
    feedRateOverride: feedRate,
    postJobGcode,
  });
}
