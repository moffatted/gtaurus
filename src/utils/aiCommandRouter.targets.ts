import { HELP_TOPIC_INDEX } from '../components/Help/helpContent';
import { SETTINGS_ENTRIES } from './aiCommandRouter.data';
import type { OpenTargetEntry } from './aiCommandRouter.types';

export function buildOpenTargets(): OpenTargetEntry[] {
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

export function getHelpTopicQueryText(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}
