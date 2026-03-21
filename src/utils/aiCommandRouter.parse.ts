import { SLASH_COMMANDS } from './aiCommandRouter.data';
import { normalizeCommandText } from './aiCommandRouter.rank';
import { buildHelpTopicSuggestions, buildStatusModeSuggestions } from './aiCommandRouter.suggestions';
import type { CommandSuggestion, ParsedSlashCommand } from './aiCommandRouter.types';

export function parseSlashCommand(input: string): ParsedSlashCommand | null {
  const trimmed = input.trim();
  if (!trimmed.startsWith('/')) return null;

  const body = trimmed.slice(1).trim();
  if (!body) {
    return { name: 'commands', args: '', raw: trimmed };
  }

  const [name, ...rest] = body.split(/\s+/);
  return {
    name: normalizeCommandText(name),
    args: rest.join(' ').trim(),
    raw: trimmed,
  };
}

export function getCommandSuggestions(input: string): CommandSuggestion[] {
  const trimmed = input.trimStart();
  if (!trimmed.startsWith('/')) return [];

  const body = trimmed.slice(1);
  const commandMatch = body.match(/^([^\s]*)(?:\s+(.*))?$/);
  const commandName = normalizeCommandText(commandMatch?.[1] ?? '');
  const argText = (commandMatch?.[2] ?? '').trim();

  if ((commandName === 'help' || commandName === 'docs') && (body.includes(' ') || body.endsWith(' '))) {
    return buildHelpTopicSuggestions(argText);
  }

  if ((commandName === 'status' || commandName === 'stat') && (body.includes(' ') || body.endsWith(' '))) {
    return buildStatusModeSuggestions(argText);
  }

  if (body.includes(' ')) return [];

  const prefix = normalizeCommandText(body);
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
