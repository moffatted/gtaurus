import type { CommandCard, CommandRouterContext, StatusMode } from './aiCommandRouter.types';

export function buildStatusResponseForMode(context: CommandRouterContext, mode: StatusMode): string {
  const { machine, settings } = context;
  const connection = machine.status === 'Disconnected' ? 'Disconnected' : 'Connected';
  const units = settings.general.carvingUnits;

  const liveSection = [
    'Machine status (live app context):',
    `- Connection: ${connection}`,
    `- State: ${machine.status}`,
    `- Firmware: ${machine.firmware}`,
    `- Board: ${machine.board}`,
    `- Machine position: X ${machine.x.mpos.toFixed(3)}, Y ${machine.y.mpos.toFixed(3)}, Z ${machine.z.mpos.toFixed(3)}`,
    `- Work offset: X ${machine.x.wco.toFixed(3)}, Y ${machine.y.wco.toFixed(3)}, Z ${machine.z.wco.toFixed(3)}`,
    `- Feed: ${machine.feed}`,
    `- Spindle: ${machine.spindle}`,
    `- Units: ${units}`,
  ].join('\n');

  const firmwareSection = [
    'FluidNC firmware diagnostics (run in G-code console):',
    '- $I (Build Info): Firmware version, build info, and board details as reported by FluidNC.',
    '- $SS (Startup Show): Replays boot sequence to reveal board/SD detection and config issues.',
    '- $$ (Grbl Settings): Legacy compatibility settings; mostly read-only in FluidNC.',
  ].join('\n');

  const configSection = [
    'FluidNC config diagnostics (run in G-code console):',
    '- $CD (Config Dump): Dumps active YAML configuration in memory.',
    '- $$ (Grbl Settings): Legacy compatibility settings for sender compatibility.',
  ].join('\n');

  if (mode === 'live') {
    return [
      liveSection,
      '',
      'For firmware/build details, run `/status firmware`. For config detail, run `/status config`.',
    ].join('\n');
  }

  if (mode === 'firmware') {
    return [
      firmwareSection,
      '',
      'Also available: `/status live` and `/status config`.',
    ].join('\n');
  }

  if (mode === 'config') {
    return [
      configSection,
      '',
      'Also available: `/status live` and `/status firmware`.',
    ].join('\n');
  }

  return [
    liveSection,
    '',
    firmwareSection,
    '',
    configSection,
    '',
    'Tip: use `/status live`, `/status firmware`, or `/status config` for focused views.',
  ].join('\n');
}

export function buildStatusCard(mode: StatusMode): CommandCard {
  if (mode === 'live') {
    return {
      title: 'Machine Status (Live)',
      eyebrow: 'Status',
      summary: 'Live machine snapshot from GTAurus context. Use firmware/config modes for deeper FluidNC details.',
      items: [
        { label: '/status firmware', detail: 'Build info and startup diagnostics commands.' },
        { label: '/status config', detail: 'YAML config dump and related settings commands.' },
        { label: '?', detail: 'Request an immediate GRBL-style status frame from the controller.', actionLabel: 'Run in Console', action: { type: 'sendGcode', cmd: '?' } },
      ],
    };
  }

  if (mode === 'firmware') {
    return {
      title: 'FluidNC Firmware Status',
      eyebrow: 'Status',
      summary: 'Firmware/build and startup diagnostics commands.',
      items: [
        { label: '$I', detail: 'Firmware version/build info and board details from the controller.', actionLabel: 'Run in Console', action: { type: 'sendGcode', cmd: '$I' } },
        { label: '$SS', detail: 'Replay startup log to inspect board, SD card, and startup/config errors.', actionLabel: 'Run in Console', action: { type: 'sendGcode', cmd: '$SS' } },
        { label: '$$', detail: 'Legacy Grbl settings view, mostly read-only in FluidNC.', actionLabel: 'Run in Console', action: { type: 'sendGcode', cmd: '$$' } },
      ],
    };
  }

  if (mode === 'config') {
    return {
      title: 'FluidNC Config Status',
      eyebrow: 'Status',
      summary: 'Configuration-focused diagnostics commands.',
      items: [
        { label: '$CD', detail: 'Dump active YAML config currently loaded in memory.', actionLabel: 'Run in Console', action: { type: 'sendGcode', cmd: '$CD' } },
        { label: '$$', detail: 'Legacy Grbl settings view for compatibility checks.', actionLabel: 'Run in Console', action: { type: 'sendGcode', cmd: '$$' } },
      ],
    };
  }

  return {
    title: 'Machine + FluidNC Status',
    eyebrow: 'Status',
    summary: 'Use the live snapshot plus these console commands for deeper firmware and config diagnostics.',
    items: [
      { label: '$I', detail: 'Firmware version/build info and board details from the controller.', actionLabel: 'Run in Console', action: { type: 'sendGcode', cmd: '$I' } },
      { label: '$SS', detail: 'Replay startup log to inspect board, SD card, and startup/config errors.', actionLabel: 'Run in Console', action: { type: 'sendGcode', cmd: '$SS' } },
      { label: '$$', detail: 'Legacy Grbl settings view, mostly read-only in FluidNC.', actionLabel: 'Run in Console', action: { type: 'sendGcode', cmd: '$$' } },
      { label: '$CD', detail: 'Dump active YAML config currently loaded in memory.', actionLabel: 'Run in Console', action: { type: 'sendGcode', cmd: '$CD' } },
    ],
  };
}
