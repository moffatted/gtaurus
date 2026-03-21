import type {
  CommandCard,
  DescriptorEntry,
  OpenTargetEntry,
  SettingsEntry,
} from './aiCommandRouter.types';

export function buildSettingsResponse(query: string, matches: SettingsEntry[]): string {
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

export function buildSettingsCard(query: string, matches: SettingsEntry[]): CommandCard {
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

export function buildDescriptorResponse(label: string, query: string, matches: DescriptorEntry[]): string {
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

export function buildDescriptorCard(label: string, query: string, matches: DescriptorEntry[]): CommandCard {
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

export function buildOpenResponse(query: string, matches: OpenTargetEntry[]): string {
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

export function buildOpenCard(query: string, matches: OpenTargetEntry[]): CommandCard {
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
