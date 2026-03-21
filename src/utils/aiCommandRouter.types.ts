import type { Settings } from '../stores/settingsStore';
import type { SettingsTab } from '../stores/uiStore';
import type { MachineStatus } from '../stores/machineStatusStore';

export type HybridCommandName = 'diagnose' | 'gcode';
export type HelpCategoryLabel = 'General' | 'Cheat Sheets';

export interface RankedMatch {
  score: number;
}

export interface HelpMatch extends RankedMatch {
  id: string;
  title: string;
  category: HelpCategoryLabel;
  searchText: string;
}

export interface SettingsEntry extends RankedMatch {
  title: string;
  tab: SettingsTab;
  section: string;
  summary: string;
  keywords: string[];
}

export interface DescriptorEntry extends RankedMatch {
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

export interface OpenTargetEntry extends RankedMatch {
  label: string;
  detail: string;
  keywords: string[];
  actionLabel: string;
  action: CommandAction;
}

export type StatusMode = 'all' | 'live' | 'firmware' | 'config';
