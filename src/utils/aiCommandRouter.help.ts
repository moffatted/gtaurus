import { HELP_TOPIC_INDEX } from '../components/Help/helpContent';
import { rankHelpTopics } from './aiCommandRouter.rank';
import type { CommandCard, HelpMatch } from './aiCommandRouter.types';

function formatHelpMatches(matches: HelpMatch[]): string {
  return matches
    .map((match) => `- ${match.title} (${match.category})`)
    .join('\n');
}

export function buildCommandsResponse(): string {
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

export function buildCommandsCard(): CommandCard {
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

export function buildHelpResponse(query: string): string {
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

export function buildHelpCard(query: string): CommandCard {
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

export function buildRelatedHelpCard(query: string, matches: HelpMatch[]): CommandCard | undefined {
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
