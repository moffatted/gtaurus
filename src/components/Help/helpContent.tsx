/**
 * @file helpContent.tsx
 * @purpose Central help topic registry — re-exports types and assembles all topic groups.
 */
export type { HelpCategory, HelpTopic } from './helpTopics.types';
import { generalTopics } from './helpTopics.general';
import { wizardTopics } from './helpTopics.wizards';
import { featureTopics } from './helpTopics.features';
import { panelTopics } from './helpTopics.panels';
import { settingsTopics } from './helpTopics.settings';
import { referenceTopics } from './helpTopics.reference';

export const HELP_TOPICS = [
  ...generalTopics,
  ...wizardTopics,
  ...featureTopics,
  ...panelTopics,
  ...settingsTopics,
  ...referenceTopics,
];

export const HELP_TOPIC_INDEX = HELP_TOPICS.map((topic) => ({
  id: topic.id,
  title: topic.title,
  category: topic.category,
  searchText: topic.searchText,
}));
