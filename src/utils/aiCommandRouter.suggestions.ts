import { HELP_TOPIC_INDEX } from '../components/Help/helpContent';
import { normalizeCommandText, rankHelpTopics } from './aiCommandRouter.rank';
import { getHelpTopicQueryText } from './aiCommandRouter.targets';
import type { CommandSuggestion } from './aiCommandRouter.types';

export function buildHelpTopicSuggestions(query: string): CommandSuggestion[] {
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

export function buildStatusModeSuggestions(query: string): CommandSuggestion[] {
  const modes = [
    { id: 'status-live', label: '/status live', template: '/status live', summary: 'Live machine snapshot from app context.' },
    { id: 'status-firmware', label: '/status firmware', template: '/status firmware', summary: 'FluidNC firmware and startup diagnostics commands.' },
    { id: 'status-config', label: '/status config', template: '/status config', summary: 'FluidNC configuration diagnostics commands.' },
  ];

  const prefix = normalizeCommandText(query.trim());
  if (!prefix) return modes;
  return modes.filter((mode) => normalizeCommandText(mode.label).includes(prefix) || normalizeCommandText(mode.template).includes(prefix));
}
