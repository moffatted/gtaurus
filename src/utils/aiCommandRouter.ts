import { HELP_TOPIC_INDEX } from '../components/Help/helpContent';
import type { Settings } from '../stores/settingsStore';
import type { SettingsTab } from '../stores/uiStore';
import type { MachineStatus } from '../stores/machineStatusStore';

type HybridCommandName = 'diagnose' | 'gcode';

type HelpCategoryLabel = 'General' | 'Cheat Sheets';

interface RankedMatch {
  score: number;
}

interface HelpMatch extends RankedMatch {
  id: string;
  title: string;
  category: HelpCategoryLabel;
  searchText: string;
}

interface SettingsEntry extends RankedMatch {
  title: string;
  tab: SettingsTab;
  section: string;
  summary: string;
  keywords: string[];
}

interface DescriptorEntry extends RankedMatch {
  title: string;
  summary: string;
  keywords: string[];
}

export interface ParsedSlashCommand {
  name: string;
  args: string;
  raw: string;
}

export interface CommandRouterContext {
  settings: Settings;
  machine: MachineStatus;
}

export interface OpenSettingsAction {
  type: 'openSettings';
  tab: SettingsTab;
  section: string;
}

export interface OpenHelpAction {
  type: 'openHelp';
  topicId: string;
}

export interface OpenWindowAction {
  type: 'openWindow';
  windowId: 'aiAssistant' | 'fluidNCManager' | 'machineStats' | 'toolChanger' | 'toolLibrary' | 'cameraViewer';
}

export interface SendGcodeAction {
  type: 'sendGcode';
  cmd: string;
}

export type CommandAction = OpenSettingsAction | OpenHelpAction | OpenWindowAction | SendGcodeAction;

export interface CommandCardItem {
  label: string;
  detail?: string;
  actionLabel?: string;
  action?: CommandAction;
}

export interface CommandCard {
  title: string;
  eyebrow?: string;
  summary?: string;
  items?: CommandCardItem[];
  footer?: string;
}

export interface CommandSuggestion {
  id: string;
  label: string;
  template: string;
  summary: string;
}

export type CommandResolution =
  | {
      kind: 'local';
      response: string;
      action?: CommandAction;
      card?: CommandCard;
    }
  | {
      kind: 'hybrid';
      commandName: HybridCommandName;
      responseHint: string;
      userPrompt: string;
      localContext: string;
      relatedCard?: CommandCard;
    }
  | {
      kind: 'unknown';
      response: string;
    };

const SETTINGS_ENTRIES: SettingsEntry[] = [
  {
    title: 'Dashboard',
    tab: 'dashboard',
    section: 'dashboard',
    summary: 'Panel layout, order, default sizing, and dashboard organization.',
    keywords: ['dashboard', 'layout', 'panels', 'widgets'],
    score: 0,
  },
  {
    title: 'Widgets',
    tab: 'dashboard',
    section: 'widgets',
    summary: 'Dashboard widget visibility and arrangement controls.',
    keywords: ['widgets', 'dashboard widgets', 'panel visibility'],
    score: 0,
  },
  {
    title: 'Theme & UX',
    tab: 'ui',
    section: 'theme',
    summary: 'Theme presets, UI scale, and presentation preferences.',
    keywords: ['theme', 'ux', 'ui', 'scale', 'appearance'],
    score: 0,
  },
  {
    title: 'Top Menu',
    tab: 'ui',
    section: 'navigation',
    summary: 'Top-menu button visibility and shortcut access.',
    keywords: ['top menu', 'navigation', 'toolbar', 'buttons'],
    score: 0,
  },
  {
    title: 'Bed Visualizer',
    tab: 'ui',
    section: 'visualizer',
    summary: 'Visualizer display preferences, stock visibility, and mesh rendering.',
    keywords: ['visualizer', 'bed visualizer', 'mesh', 'stock'],
    score: 0,
  },
  {
    title: 'Stats Display',
    tab: 'ui',
    section: 'stats',
    summary: 'Machine statistics display and tracking presentation.',
    keywords: ['stats', 'statistics', 'oee', 'display'],
    score: 0,
  },
  {
    title: 'Camera',
    tab: 'ui',
    section: 'camera',
    summary: 'Camera stream URL, crosshair, and viewer behavior.',
    keywords: ['camera', 'stream', 'crowsnest'],
    score: 0,
  },
  {
    title: 'General',
    tab: 'machine',
    section: 'general',
    summary: 'Units, safe height, bed size, homing orientation, and machine basics.',
    keywords: ['general', 'units', 'safe height', 'bed size', 'homing', 'grbl'],
    score: 0,
  },
  {
    title: 'Connection',
    tab: 'machine',
    section: 'connection',
    summary: 'USB, Telnet, WebSocket bridge, ports, and polling configuration.',
    keywords: ['connection', 'serial', 'usb', 'telnet', 'websocket', 'bridge'],
    score: 0,
  },
  {
    title: 'File Manager',
    tab: 'machine',
    section: 'file-manager',
    summary: 'G-code storage path and file-management behavior.',
    keywords: ['file manager', 'files', 'gcode path', 'storage'],
    score: 0,
  },
  {
    title: 'Probe',
    tab: 'machine',
    section: 'probe',
    summary: 'Probe type, travel, retract, touch-plate geometry, and calibration.',
    keywords: ['probe', 'probing', 'touch plate', 'z offset', 'calibration'],
    score: 0,
  },
  {
    title: 'Spindle',
    tab: 'machine',
    section: 'spindle',
    summary: 'RPM limits, PWM scaling, acceleration, and spindle behavior.',
    keywords: ['spindle', 'rpm', 'pwm', 'speed', 'warmup'],
    score: 0,
  },
  {
    title: 'Macros',
    tab: 'machine',
    section: 'macros',
    summary: 'Saved G-code snippets and one-click macro execution.',
    keywords: ['macros', 'macro', 'snippets', 'tool change'],
    score: 0,
  },
  {
    title: 'Tool Changer',
    tab: 'machine',
    section: 'atc',
    summary: 'ATC positions, tool-change coordinates, and probe automation.',
    keywords: ['tool changer', 'atc', 'tool change'],
    score: 0,
  },
  {
    title: 'Rotary Config',
    tab: 'machine',
    section: 'rotary',
    summary: 'Rotary mode, steps per revolution, roller diameter, and config switching.',
    keywords: ['rotary', '4th axis', 'roller', 'chuck'],
    score: 0,
  },
  {
    title: 'AI Assistant',
    tab: 'machine',
    section: 'ai',
    summary: 'AI tier, API keys, model selection, and concise-mode behavior.',
    keywords: ['ai', 'assistant', 'llm', 'model', 'gemini', 'local'],
    score: 0,
  },
];

const SHORTCUTS = [
  ['?', 'Send status query'],
  ['!', 'Feed hold'],
  ['~', 'Resume or cycle start'],
  ['Ctrl+X', 'Soft reset'],
  ['Up / Down', 'Cycle console history'],
  ['Ctrl+L', 'Clear console log'],
];

const SLASH_COMMANDS = [
  { name: 'commands', template: '/commands', summary: 'Show the available slash commands.' },
  { name: 'help', template: '/help ', summary: 'Search local help topics.' },
  { name: 'status', template: '/status', summary: 'Show live machine state and key FluidNC status commands.' },
  { name: 'settings', template: '/settings probe', summary: 'Search settings sections.' },
  { name: 'shortcuts', template: '/shortcuts', summary: 'Show keyboard shortcuts.' },
  { name: 'wizard', template: '/wizard carve', summary: 'Find a relevant wizard.' },
  { name: 'panel', template: '/panel probe', summary: 'Find a dashboard or top-menu panel.' },
  { name: 'open', template: '/open tool library', summary: 'Open a tool window, help topic, or settings section.' },
  { name: 'diagnose', template: '/diagnose probe fails after connect', summary: 'Run grounded AI troubleshooting.' },
  { name: 'gcode', template: '/gcode safe tool-change macro', summary: 'Generate or explain G-code with grounded context.' },
] as const;

interface OpenTargetEntry extends RankedMatch {
  label: string;
  detail: string;
  keywords: string[];
  actionLabel: string;
  action: CommandAction;
}

type StatusMode = 'all' | 'live' | 'firmware' | 'config';

const WIZARD_ENTRIES: DescriptorEntry[] = [
  {
    title: 'Carve Wizard',
    summary: '11-step preflight for workholding, tooling, zeroing, safety, and start.',
    keywords: ['carve wizard', 'preflight', 'start carve', 'safety checks', 'zero method'],
    score: 0,
  },
  {
    title: 'Machine Setup Wizard',
    summary: 'Connection, dimensions, probe type, axis direction, and homing setup.',
    keywords: ['machine setup wizard', 'connection', 'axis direction', 'homing', 'dimensions'],
    score: 0,
  },
  {
    title: 'Surfacing Wizard',
    summary: 'Surfacing bit selection, pass parameters, preview, and G-code generation.',
    keywords: ['surfacing wizard', 'surfacing', 'spoilboard', 'toolpath preview'],
    score: 0,
  },
  {
    title: 'Job Resume & Recovery',
    summary: 'Recovery workflow for interrupted jobs with checkpoint and safe repositioning.',
    keywords: ['job resume', 'resume wizard', 'recovery', 'checkpoint'],
    score: 0,
  },
];

const PANEL_ENTRIES: DescriptorEntry[] = [
  {
    title: 'Controls',
    summary: 'DRO, jogging, file controls, and execution controls in one workspace.',
    keywords: ['controls', 'dro', 'jogging', 'execution', 'simulation'],
    score: 0,
  },
  {
    title: 'G-code Console',
    summary: 'Direct command entry, controller responses, and command history.',
    keywords: ['console', 'gcode console', 'command history'],
    score: 0,
  },
  {
    title: 'Bed Visualizer',
    summary: '3D environment view with orientation, camera controls, and setup verification.',
    keywords: ['bed visualizer', '3d', 'visualizer'],
    score: 0,
  },
  {
    title: 'File Manager',
    summary: 'Browse, select, and manage G-code files used for carving or simulation.',
    keywords: ['file manager', 'files', 'gcode'],
    score: 0,
  },
  {
    title: 'Probe Panel',
    summary: 'Axis probing, touch-plate setup, and zero-set workflows.',
    keywords: ['probe panel', 'probing', 'touch plate', 'probe'],
    score: 0,
  },
  {
    title: 'Macros',
    summary: 'One-click execution of saved G-code routines.',
    keywords: ['macros', 'macro panel'],
    score: 0,
  },
  {
    title: 'Workpiece',
    summary: 'Current stock dimensions, offsets, and carve context.',
    keywords: ['workpiece', 'stock', 'offsets'],
    score: 0,
  },
  {
    title: 'Auto-Leveling',
    summary: 'Surface probing grid and compensation for uneven work surfaces.',
    keywords: ['autolevel', 'auto-leveling', 'mesh', 'surface mapping'],
    score: 0,
  },
  {
    title: 'Bit Library',
    summary: 'Tool definitions, active bit selection, and tool-usage tracking.',
    keywords: ['bit library', 'tool library', 'bits'],
    score: 0,
  },
  {
    title: 'Tool Changer',
    summary: 'Manual or assisted tool-change workflows tied to jobs.',
    keywords: ['tool changer', 'atc'],
    score: 0,
  },
  {
    title: 'Machine Stats',
    summary: 'OEE, utilization, and machine history reporting.',
    keywords: ['machine stats', 'stats', 'statistics', 'oee'],
    score: 0,
  },
  {
    title: 'AI Assistant',
    summary: 'Chat assistant for troubleshooting, explanations, and G-code generation.',
    keywords: ['ai assistant', 'assistant', 'ai'],
    score: 0,
  },
  {
    title: 'FluidNC Manager',
    summary: 'Controller-specific configuration and FluidNC maintenance actions.',
    keywords: ['fluidnc manager', 'fluidnc'],
    score: 0,
  },
  {
    title: 'Camera',
    summary: 'Camera stream viewer and alignment aid.',
    keywords: ['camera', 'viewer', 'stream'],
    score: 0,
  },
];

function normalize(text: string): string {
  return text.toLowerCase().trim();
}

function tokenize(text: string): string[] {
  return normalize(text)
    .split(/\s+/)
    .filter(Boolean);
}

function scoreText(query: string, fields: string[]): number {
  const normalizedQuery = normalize(query);
  if (!normalizedQuery) return 0;

  const queryTokens = tokenize(normalizedQuery);
  let score = 0;

  for (const field of fields) {
    const value = normalize(field);
    if (!value) continue;

    if (value === normalizedQuery) score += 120;
    if (value.startsWith(normalizedQuery)) score += 60;
    if (value.includes(normalizedQuery)) score += 30;

    for (const token of queryTokens) {
      if (value === token) score += 40;
      else if (value.startsWith(token)) score += 12;
      else if (value.includes(token)) score += 6;
    }
  }

  return score;
}

function rankHelpTopics(query: string): HelpMatch[] {
  return HELP_TOPIC_INDEX.map((topic) => ({
    ...topic,
    category: (topic.category === 'cheat-sheets' ? 'Cheat Sheets' : 'General') as HelpCategoryLabel,
    score: scoreText(query, [topic.title, topic.searchText]),
  }))
    .filter((topic) => topic.score > 0)
    .sort((left, right) => right.score - left.score || left.title.localeCompare(right.title));
}

function rankSettings(query: string): SettingsEntry[] {
  return SETTINGS_ENTRIES.map((entry) => ({
    ...entry,
    score: scoreText(query, [entry.title, ...entry.keywords]),
  }))
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score || left.title.localeCompare(right.title));
}

function rankDescriptors(query: string, entries: DescriptorEntry[]): DescriptorEntry[] {
  return entries
    .map((entry) => ({
      ...entry,
      score: scoreText(query, [entry.title, ...entry.keywords]),
    }))
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score || left.title.localeCompare(right.title));
}

function buildOpenTargets(): OpenTargetEntry[] {
  const helpTargets: OpenTargetEntry[] = HELP_TOPIC_INDEX.map((topic) => ({
    label: topic.title,
    detail: topic.category === 'cheat-sheets' ? 'Help topic: cheat sheet' : 'Help topic',
    keywords: [topic.title, topic.searchText, 'help', 'docs', 'documentation'],
    actionLabel: 'Open Help',
    action: {
      type: 'openHelp',
      topicId: topic.id,
    },
    score: 0,
  }));

  const settingsTargets: OpenTargetEntry[] = SETTINGS_ENTRIES.map((entry) => ({
    label: `Settings: ${entry.title}`,
    detail: entry.summary,
    keywords: [entry.title, ...entry.keywords, 'settings'],
    actionLabel: 'Open Settings',
    action: {
      type: 'openSettings',
      tab: entry.tab,
      section: entry.section,
    },
    score: 0,
  }));

  const windowTargets: OpenTargetEntry[] = [
    {
      label: 'AI Assistant',
      detail: 'Open the AI Assistant floating window.',
      keywords: ['ai assistant', 'assistant', 'ai'],
      actionLabel: 'Open Window',
      action: { type: 'openWindow', windowId: 'aiAssistant' },
      score: 0,
    },
    {
      label: 'FluidNC Manager',
      detail: 'Open the FluidNC Manager tool window.',
      keywords: ['fluidnc manager', 'fluidnc', 'manager'],
      actionLabel: 'Open Window',
      action: { type: 'openWindow', windowId: 'fluidNCManager' },
      score: 0,
    },
    {
      label: 'Machine Stats',
      detail: 'Open the Machine Statistics window.',
      keywords: ['machine stats', 'stats', 'statistics', 'oee'],
      actionLabel: 'Open Window',
      action: { type: 'openWindow', windowId: 'machineStats' },
      score: 0,
    },
    {
      label: 'Tool Changer',
      detail: 'Open the Tool Changer window.',
      keywords: ['tool changer', 'atc', 'tool'],
      actionLabel: 'Open Window',
      action: { type: 'openWindow', windowId: 'toolChanger' },
      score: 0,
    },
    {
      label: 'Bit Library',
      detail: 'Open the Bit Library window.',
      keywords: ['bit library', 'tool library', 'bits', 'tooling'],
      actionLabel: 'Open Window',
      action: { type: 'openWindow', windowId: 'toolLibrary' },
      score: 0,
    },
    {
      label: 'Camera Viewer',
      detail: 'Open the camera viewer window.',
      keywords: ['camera', 'camera viewer', 'stream'],
      actionLabel: 'Open Window',
      action: { type: 'openWindow', windowId: 'cameraViewer' },
      score: 0,
    },
    {
      label: 'Controls Panel',
      detail: 'Open Dashboard settings to configure or locate the Controls panel.',
      keywords: ['controls panel', 'controls', 'dro', 'jogging'],
      actionLabel: 'Open Settings',
      action: { type: 'openSettings', tab: 'dashboard', section: 'widgets' },
      score: 0,
    },
    {
      label: 'Probe Panel',
      detail: 'Open Probe settings or get to probing workflows quickly.',
      keywords: ['probe panel', 'probe', 'probing', 'touch plate'],
      actionLabel: 'Open Settings',
      action: { type: 'openSettings', tab: 'machine', section: 'probe' },
      score: 0,
    },
    {
      label: 'Macros Panel',
      detail: 'Open Macro settings and saved routines.',
      keywords: ['macros panel', 'macros', 'macro'],
      actionLabel: 'Open Settings',
      action: { type: 'openSettings', tab: 'machine', section: 'macros' },
      score: 0,
    },
  ];

  return [...windowTargets, ...settingsTargets, ...helpTargets];
}

function rankOpenTargets(query: string): OpenTargetEntry[] {
  return buildOpenTargets()
    .map((entry) => ({
      ...entry,
      score: scoreText(query, [entry.label, entry.detail, ...entry.keywords]),
    }))
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score || left.label.localeCompare(right.label));
}

function getHelpTopicQueryText(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function buildHelpTopicSuggestions(query: string): CommandSuggestion[] {
  const matches = query.trim()
    ? rankHelpTopics(query).slice(0, 6)
    : HELP_TOPIC_INDEX.slice(0, 6).map((topic) => ({
        ...topic,
        category: topic.category === 'cheat-sheets' ? 'Cheat Sheets' : 'General',
        score: 1,
      }));

  return matches.map((match) => ({
    id: `help-${match.id}`,
    label: match.title,
    template: `/help ${getHelpTopicQueryText(match.title)}`,
    summary: match.category === 'Cheat Sheets' ? 'Help topic (cheat sheet)' : 'Help topic',
  }));
}

function buildStatusModeSuggestions(query: string): CommandSuggestion[] {
  const modes = [
    { id: 'status-live', label: '/status live', template: '/status live', summary: 'Live machine snapshot from app context.' },
    { id: 'status-firmware', label: '/status firmware', template: '/status firmware', summary: 'FluidNC firmware and startup diagnostics commands.' },
    { id: 'status-config', label: '/status config', template: '/status config', summary: 'FluidNC configuration diagnostics commands.' },
  ];

  const prefix = normalize(query.trim());
  if (!prefix) return modes;
  return modes.filter((mode) => normalize(mode.label).includes(prefix) || normalize(mode.template).includes(prefix));
}

function formatHelpMatches(matches: HelpMatch[]): string {
  return matches
    .map((match) => `- ${match.title} (${match.category})`)
    .join('\n');
}

function buildCommandsResponse(): string {
  return [
    'Available slash commands:',
    '- /commands: Show the command list.',
    '- /help <topic>: Search local help topics.',
    '- /status: Show current machine state plus key FluidNC status commands.',
    '- /settings <query>: Search settings sections.',
    '- /shortcuts: Show keyboard shortcuts.',
    '- /wizard <query>: Find the right wizard.',
    '- /panel <query>: Find a dashboard or top-menu panel.',
    '- /open <target>: Open a tool window, help topic, or settings section.',
    '- /diagnose <issue>: Use machine state plus help context for troubleshooting.',
    '- /gcode <request>: Generate or explain G-code with machine-aware context.',
  ].join('\n');
}

function buildCommandsCard(): CommandCard {
  return {
    title: 'Available Slash Commands',
    eyebrow: 'Local + Grounded AI',
    summary: 'Use slash commands when you want deterministic product help, live machine summaries, or grounded AI workflows.',
    items: [
      { label: '/help <topic>', detail: 'Search local help topics and documentation.' },
      { label: '/status', detail: 'Show current machine state and FluidNC diagnostic commands.' },
      { label: '/settings <query>', detail: 'Search settings sections and jump to the best match.' },
      { label: '/shortcuts', detail: 'Show keyboard shortcuts.' },
      { label: '/wizard <query>', detail: 'Find the right setup or carve wizard.' },
      { label: '/panel <query>', detail: 'Find dashboard and top-menu panels.' },
      { label: '/open <target>', detail: 'Open a tool window, settings section, or help topic.' },
      { label: '/diagnose <issue>', detail: 'Ground the AI with local context and machine state.' },
      { label: '/gcode <request>', detail: 'Ask for G-code generation with grounded context.' },
    ],
  };
}

function buildHelpResponse(query: string): string {
  if (!query) {
    const starterTopics = HELP_TOPIC_INDEX.slice(0, 8).map((topic) => `- ${topic.title}`);
    return [
      'Help topics are available locally. Try `/help probing`, `/help homing`, or `/help shortcuts`.',
      'Popular topics:',
      ...starterTopics,
    ].join('\n');
  }

  const matches = rankHelpTopics(query).slice(0, 5);
  if (matches.length === 0) {
    return [
      `No local help topic matched "${query}".`,
      'Try broader terms like `probe`, `homing`, `wizard`, `resume`, or `settings`.',
      'If you want reasoning with machine context, use `/diagnose <issue>`.',
    ].join('\n');
  }

  return [
    `Local help matches for "${query}":`,
    formatHelpMatches(matches),
    '',
    'Tip: use `/diagnose <issue>` when you want AI reasoning grounded in these help topics and current machine state.',
  ].join('\n');
}

function buildHelpCard(query: string): CommandCard {
  if (!query) {
    return {
      title: 'Local Help Topics',
      eyebrow: 'Help Search',
      summary: 'Search local documentation with `/help <topic>`. Popular topics are shown below.',
      items: HELP_TOPIC_INDEX.slice(0, 6).map((topic) => ({
        label: topic.title,
        detail: topic.category === 'cheat-sheets' ? 'Cheat Sheet' : 'General Help',
        actionLabel: 'Open Help',
        action: {
          type: 'openHelp',
          topicId: topic.id,
        },
      })),
    };
  }

  const matches = rankHelpTopics(query).slice(0, 5);
  if (matches.length === 0) {
    return {
      title: `No Help Match for "${query}"`,
      eyebrow: 'Help Search',
      summary: 'Try broader terms like probe, homing, wizard, resume, or settings.',
      footer: 'If you want reasoning with machine context, use /diagnose <issue>.',
    };
  }

  return {
    title: `Help Matches for "${query}"`,
    eyebrow: 'Help Search',
    summary: 'Open a topic directly or switch to /diagnose when you want grounded troubleshooting.',
    items: matches.map((match) => ({
      label: match.title,
      detail: match.category,
      actionLabel: 'Open Help',
      action: {
        type: 'openHelp',
        topicId: match.id,
      },
    })),
    footer: 'Use /diagnose <issue> when you want AI reasoning grounded in these topics and current machine state.',
  };
}

function parseStatusMode(args: string): { mode: StatusMode; normalizedArgs: string } {
  const normalizedArgs = normalize(args);
  if (!normalizedArgs) return { mode: 'all', normalizedArgs };

  const [token] = normalizedArgs.split(/\s+/);
  if (token === 'live') return { mode: 'live', normalizedArgs };
  if (token === 'firmware' || token === 'fw' || token === 'build' || token === 'startup') return { mode: 'firmware', normalizedArgs };
  if (token === 'config' || token === 'cfg' || token === 'yaml' || token === 'settings') return { mode: 'config', normalizedArgs };

  return { mode: 'all', normalizedArgs };
}

function buildStatusResponseForMode(context: CommandRouterContext, mode: StatusMode): string {
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

function buildStatusCard(mode: StatusMode): CommandCard {
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

function buildSettingsResponse(query: string, matches: SettingsEntry[]): string {
  if (!query) {
    return [
      'Search settings with `/settings <query>`.',
      'Examples:',
      '- /settings probe',
      '- /settings connection',
      '- /settings theme',
      '- /settings ai',
    ].join('\n');
  }

  if (matches.length === 0) {
    return [
      `No settings section matched "${query}".`,
      'Try terms like `probe`, `connection`, `spindle`, `theme`, `camera`, or `ai`.',
    ].join('\n');
  }

  return [
    `Settings matches for "${query}":`,
    ...matches.slice(0, 4).map((match) => `- ${match.title}: ${match.summary}`),
  ].join('\n');
}

function buildSettingsCard(query: string, matches: SettingsEntry[]): CommandCard {
  if (!query) {
    return {
      title: 'Settings Search',
      eyebrow: 'Settings',
      summary: 'Search settings sections with commands like `/settings probe`, `/settings connection`, or `/settings ai`.',
    };
  }

  if (matches.length === 0) {
    return {
      title: `No Settings Match for "${query}"`,
      eyebrow: 'Settings',
      summary: 'Try terms like probe, connection, spindle, theme, camera, or ai.',
    };
  }

  return {
    title: `Settings Matches for "${query}"`,
    eyebrow: 'Settings',
    items: matches.slice(0, 4).map((match) => ({
      label: match.title,
      detail: match.summary,
      actionLabel: 'Open Settings',
      action: {
        type: 'openSettings',
        tab: match.tab,
        section: match.section,
      },
    })),
  };
}

function buildShortcutsResponse(): string {
  return [
    'Keyboard shortcuts:',
    ...SHORTCUTS.map(([shortcut, description]) => `- ${shortcut}: ${description}`),
  ].join('\n');
}

function buildShortcutsCard(): CommandCard {
  return {
    title: 'Keyboard Shortcuts',
    eyebrow: 'Shortcuts',
    items: SHORTCUTS.map(([shortcut, description]) => ({
      label: shortcut,
      detail: description,
    })),
  };
}

function buildDescriptorResponse(label: string, query: string, matches: DescriptorEntry[]): string {
  if (!query) {
    return `Search ${label.toLowerCase()}s with "/${label.toLowerCase()} <query>".`;
  }

  if (matches.length === 0) {
    return `No ${label.toLowerCase()} matched "${query}".`;
  }

  return [
    `${label} matches for "${query}":`,
    ...matches.slice(0, 4).map((match) => `- ${match.title}: ${match.summary}`),
  ].join('\n');
}

function buildDescriptorCard(label: string, query: string, matches: DescriptorEntry[]): CommandCard {
  if (!query) {
    return {
      title: `${label} Search`,
      eyebrow: label,
      summary: `Search ${label.toLowerCase()}s with /${label.toLowerCase()} <query>.`,
    };
  }

  if (matches.length === 0) {
    return {
      title: `No ${label} Match for "${query}"`,
      eyebrow: label,
    };
  }

  return {
    title: `${label} Matches for "${query}"`,
    eyebrow: label,
    items: matches.slice(0, 4).map((match) => ({
      label: match.title,
      detail: match.summary,
    })),
  };
}

function buildOpenResponse(query: string, matches: OpenTargetEntry[]): string {
  if (!query) {
    return [
      'Open a tool window, settings section, or help topic with `/open <target>`.',
      'Examples:',
      '- /open tool library',
      '- /open probing',
      '- /open camera',
      '- /open settings ai',
    ].join('\n');
  }

  if (matches.length === 0) {
    return `No openable target matched "${query}".`;
  }

  return [
    `Open targets for "${query}":`,
    ...matches.slice(0, 5).map((match) => `- ${match.label}: ${match.detail}`),
  ].join('\n');
}

function buildOpenCard(query: string, matches: OpenTargetEntry[]): CommandCard {
  if (!query) {
    return {
      title: 'Open Target Search',
      eyebrow: 'Open',
      summary: 'Open a tool window, settings section, or help topic directly from the assistant.',
      items: [
        { label: '/open tool library', detail: 'Jump to the Bit Library window.' },
        { label: '/open probing', detail: 'Open the most relevant help or settings for probing.' },
        { label: '/open camera', detail: 'Open the camera viewer or camera settings.' },
      ],
    };
  }

  if (matches.length === 0) {
    return {
      title: `No Open Target for "${query}"`,
      eyebrow: 'Open',
      summary: 'Try tool library, camera, tool changer, fluidnc, probing, or ai.',
    };
  }

  return {
    title: `Open Targets for "${query}"`,
    eyebrow: 'Open',
    items: matches.slice(0, 5).map((match) => ({
      label: match.label,
      detail: match.detail,
      actionLabel: match.actionLabel,
      action: match.action,
    })),
  };
}

function buildRelatedHelpCard(query: string, matches: HelpMatch[]): CommandCard | undefined {
  if (matches.length === 0) return undefined;

  return {
    title: `Related Help for "${query}"`,
    eyebrow: 'Grounded Context',
    summary: 'These help topics were included in the grounded AI context.',
    items: matches.map((match) => ({
      label: match.title,
      detail: match.category,
      actionLabel: 'Open Help',
      action: {
        type: 'openHelp',
        topicId: match.id,
      },
    })),
  };
}

function buildGroundedContext(commandName: HybridCommandName, query: string, context: CommandRouterContext): string {
  const helpMatches = rankHelpTopics(query).slice(0, 3);
  const settingsMatches = rankSettings(query).slice(0, 2);
  const wizardMatches = rankDescriptors(query, WIZARD_ENTRIES).slice(0, 2);
  const panelMatches = rankDescriptors(query, PANEL_ENTRIES).slice(0, 2);

  const sections = [
    `Slash command mode: /${commandName}`,
    `User request: ${query}`,
    `Current carving units: ${context.settings.general.carvingUnits}`,
    `Current machine state: ${context.machine.status}`,
  ];

  if (helpMatches.length > 0) {
    sections.push(
      'Relevant local help topics:',
      ...helpMatches.map((match) => `- ${match.title} [${match.category}] keywords: ${match.searchText}`),
    );
  }

  if (settingsMatches.length > 0) {
    sections.push(
      'Relevant settings sections:',
      ...settingsMatches.map((match) => `- ${match.title}: ${match.summary}`),
    );
  }

  if (wizardMatches.length > 0) {
    sections.push(
      'Relevant wizards:',
      ...wizardMatches.map((match) => `- ${match.title}: ${match.summary}`),
    );
  }

  if (panelMatches.length > 0) {
    sections.push(
      'Relevant panels:',
      ...panelMatches.map((match) => `- ${match.title}: ${match.summary}`),
    );
  }

  return sections.join('\n');
}

export function parseSlashCommand(input: string): ParsedSlashCommand | null {
  const trimmed = input.trim();
  if (!trimmed.startsWith('/')) return null;

  const body = trimmed.slice(1).trim();
  if (!body) {
    return { name: 'commands', args: '', raw: trimmed };
  }

  const [name, ...rest] = body.split(/\s+/);
  return {
    name: normalize(name),
    args: rest.join(' ').trim(),
    raw: trimmed,
  };
}

export function getCommandSuggestions(input: string): CommandSuggestion[] {
  const trimmed = input.trimStart();
  if (!trimmed.startsWith('/')) return [];

  const body = trimmed.slice(1);
  const commandMatch = body.match(/^([^\s]*)(?:\s+(.*))?$/);
  const commandName = normalize(commandMatch?.[1] ?? '');
  const argText = (commandMatch?.[2] ?? '').trim();

  if ((commandName === 'help' || commandName === 'docs') && (body.includes(' ') || body.endsWith(' '))) {
    return buildHelpTopicSuggestions(argText);
  }

  if ((commandName === 'status' || commandName === 'stat') && (body.includes(' ') || body.endsWith(' '))) {
    return buildStatusModeSuggestions(argText);
  }

  if (body.includes(' ')) return [];

  const prefix = normalize(body);
  if (!prefix) {
    return SLASH_COMMANDS.slice(0, 6).map((command) => ({
      id: `cmd-${command.name}`,
      label: `/${command.name}`,
      template: command.template,
      summary: command.summary,
    }));
  }

  return SLASH_COMMANDS
    .filter((command) => command.name.startsWith(prefix))
    .slice(0, 6)
    .map((command) => ({
      id: `cmd-${command.name}`,
      label: `/${command.name}`,
      template: command.template,
      summary: command.summary,
    }));
}

export function resolveSlashCommand(parsed: ParsedSlashCommand, context: CommandRouterContext): CommandResolution {
  const args = parsed.args.trim();

  const alias = parsed.name === 'docs' ? 'help' : parsed.name === 'wiz' ? 'wizard' : parsed.name === 'stat' ? 'status' : parsed.name === 'cfg' ? 'settings' : parsed.name;

  if (alias === 'commands') {
    return { kind: 'local', response: buildCommandsResponse(), card: buildCommandsCard() };
  }

  if (alias === 'help') {
    return { kind: 'local', response: buildHelpResponse(args), card: buildHelpCard(args) };
  }

  if (alias === 'status') {
    const { mode } = parseStatusMode(args);
    const action: CommandAction | undefined = mode === 'firmware'
      ? { type: 'sendGcode', cmd: '$I' as const }
      : mode === 'config'
        ? { type: 'sendGcode', cmd: '$CD' as const }
        : mode === 'live'
          ? { type: 'sendGcode', cmd: '?' as const }
          : undefined;

    return { kind: 'local', response: buildStatusResponseForMode(context, mode), card: buildStatusCard(mode), action };
  }

  if (alias === 'settings') {
    const matches = rankSettings(args);
    const bestMatch = matches[0];
    const isConfident = !!bestMatch && args.length > 0 && bestMatch.score >= 60;
    return {
      kind: 'local',
      response: isConfident
        ? [`Opened Settings > ${bestMatch.tab === 'dashboard' ? 'Dashboard' : bestMatch.tab === 'ui' ? 'UI' : 'Machine'} > ${bestMatch.title}.`, buildSettingsResponse(args, matches)].join('\n\n')
        : buildSettingsResponse(args, matches),
      card: buildSettingsCard(args, matches),
      action: isConfident
        ? {
            type: 'openSettings',
            tab: bestMatch.tab,
            section: bestMatch.section,
          }
        : undefined,
    };
  }

  if (alias === 'shortcuts') {
    return { kind: 'local', response: buildShortcutsResponse(), card: buildShortcutsCard() };
  }

  if (alias === 'wizard') {
    const matches = rankDescriptors(args, WIZARD_ENTRIES);
    return { kind: 'local', response: buildDescriptorResponse('Wizard', args, matches), card: buildDescriptorCard('Wizard', args, matches) };
  }

  if (alias === 'panel') {
    const matches = rankDescriptors(args, PANEL_ENTRIES);
    return { kind: 'local', response: buildDescriptorResponse('Panel', args, matches), card: buildDescriptorCard('Panel', args, matches) };
  }

  if (alias === 'open') {
    const matches = rankOpenTargets(args);
    const bestMatch = matches[0];
    const isConfident = !!bestMatch && args.length > 0 && bestMatch.score >= 70;

    return {
      kind: 'local',
      response: isConfident ? `Opened ${bestMatch.label}.` : buildOpenResponse(args, matches),
      card: buildOpenCard(args, matches),
      action: isConfident ? bestMatch.action : undefined,
    };
  }

  if (alias === 'diagnose' || alias === 'gcode') {
    if (!args) {
      return {
        kind: 'local',
        response: alias === 'diagnose'
          ? 'Usage: /diagnose <issue>. Example: /diagnose probe fails after connecting'
          : 'Usage: /gcode <request>. Example: /gcode tool-change macro to move to a safe front-left position',
      };
    }

    const relatedHelpMatches = rankHelpTopics(args).slice(0, 3);

    return {
      kind: 'hybrid',
      commandName: alias,
      responseHint: alias === 'diagnose'
        ? 'Running grounded diagnosis using machine state and local help context...'
        : 'Generating a grounded G-code answer using machine state and local help context... ',
      userPrompt: args,
      localContext: buildGroundedContext(alias, args, context),
      relatedCard: buildRelatedHelpCard(args, relatedHelpMatches),
    };
  }

  return {
    kind: 'unknown',
    response: `Unknown command: /${parsed.name}\nTry /commands`,
  };
}