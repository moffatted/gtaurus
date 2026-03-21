import { HELP_TOPIC_INDEX } from '../components/Help/helpContent';
import { SETTINGS_ENTRIES } from './aiCommandRouter.data';
import type {
  DescriptorEntry,
  HelpCategoryLabel,
  HelpMatch,
  OpenTargetEntry,
  SettingsEntry,
  StatusMode,
} from './aiCommandRouter.types';

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

export function rankHelpTopics(query: string): HelpMatch[] {
  return HELP_TOPIC_INDEX.map((topic) => ({
    ...topic,
    category: (topic.category === 'cheat-sheets' ? 'Cheat Sheets' : 'General') as HelpCategoryLabel,
    score: scoreText(query, [topic.title, topic.searchText]),
  }))
    .filter((topic) => topic.score > 0)
    .sort((left, right) => right.score - left.score || left.title.localeCompare(right.title));
}

export function rankSettings(query: string): SettingsEntry[] {
  return SETTINGS_ENTRIES.map((entry) => ({
    ...entry,
    score: scoreText(query, [entry.title, ...entry.keywords]),
  }))
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score || left.title.localeCompare(right.title));
}

export function rankDescriptors(query: string, entries: DescriptorEntry[]): DescriptorEntry[] {
  return entries
    .map((entry) => ({
      ...entry,
      score: scoreText(query, [entry.title, ...entry.keywords]),
    }))
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score || left.title.localeCompare(right.title));
}

export function rankOpenTargets(query: string, openTargets: OpenTargetEntry[]): OpenTargetEntry[] {
  return openTargets
    .map((entry) => ({
      ...entry,
      score: scoreText(query, [entry.label, entry.detail, ...entry.keywords]),
    }))
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score || left.label.localeCompare(right.label));
}

export function parseStatusMode(args: string): { mode: StatusMode; normalizedArgs: string } {
  const normalizedArgs = normalize(args);
  if (!normalizedArgs) return { mode: 'all', normalizedArgs };

  const [token] = normalizedArgs.split(/\s+/);
  if (token === 'live') return { mode: 'live', normalizedArgs };
  if (token === 'firmware' || token === 'fw' || token === 'build' || token === 'startup') return { mode: 'firmware', normalizedArgs };
  if (token === 'config' || token === 'cfg' || token === 'yaml' || token === 'settings') return { mode: 'config', normalizedArgs };

  return { mode: 'all', normalizedArgs };
}

export function normalizeCommandText(text: string): string {
  return normalize(text);
}
