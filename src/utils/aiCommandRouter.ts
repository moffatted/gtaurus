import {
  PANEL_ENTRIES,
  SHORTCUTS,
  WIZARD_ENTRIES,
} from './aiCommandRouter.data';
import {
  parseStatusMode,
  rankDescriptors,
  rankHelpTopics,
  rankOpenTargets,
  rankSettings,
} from './aiCommandRouter.rank';
import { buildGroundedContext } from './aiCommandRouter.context';
import {
  buildCommandsCard,
  buildCommandsResponse,
  buildHelpCard,
  buildHelpResponse,
  buildRelatedHelpCard,
} from './aiCommandRouter.help';
import { getCommandSuggestions, parseSlashCommand } from './aiCommandRouter.parse';
import {
  buildDescriptorCard,
  buildDescriptorResponse,
  buildOpenCard,
  buildOpenResponse,
  buildSettingsCard,
  buildSettingsResponse,
} from './aiCommandRouter.presenters';
import { buildStatusCard, buildStatusResponseForMode } from './aiCommandRouter.status';
import { buildOpenTargets } from './aiCommandRouter.targets';
import type {
  CommandAction,
  CommandCard,
  CommandResolution,
  CommandRouterContext,
  OpenTargetEntry,
  ParsedSlashCommand,
} from './aiCommandRouter.types';

export type {
  CommandAction,
  CommandCard,
  CommandResolution,
  CommandRouterContext,
  CommandSuggestion,
  ParsedSlashCommand,
} from './aiCommandRouter.types';

function findOpenTargets(query: string): OpenTargetEntry[] {
  return rankOpenTargets(query, buildOpenTargets());
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

export { getCommandSuggestions, parseSlashCommand };

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
    const matches = findOpenTargets(args);
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