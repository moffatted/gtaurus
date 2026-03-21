import { PANEL_ENTRIES, WIZARD_ENTRIES } from './aiCommandRouter.data';
import { rankDescriptors, rankHelpTopics, rankSettings } from './aiCommandRouter.rank';
import type { CommandRouterContext, HybridCommandName } from './aiCommandRouter.types';

export function buildGroundedContext(commandName: HybridCommandName, query: string, context: CommandRouterContext): string {
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
