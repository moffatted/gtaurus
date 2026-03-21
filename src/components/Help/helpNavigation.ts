import { HelpTopic } from './helpTopics.types';

function createTopicMap(topics: HelpTopic[]): Map<string, HelpTopic> {
  return new Map(topics.map((topic) => [topic.id, topic]));
}

export function getTopLevelTopics(topics: HelpTopic[]): HelpTopic[] {
  return topics.filter((topic) => !topic.parentId);
}

export function getChildTopics(topics: HelpTopic[], parentId: string): HelpTopic[] {
  return topics.filter((topic) => topic.parentId === parentId);
}

export function getAncestorTopics(topics: HelpTopic[], topicId: string): HelpTopic[] {
  const topicMap = createTopicMap(topics);
  const ancestors: HelpTopic[] = [];
  let current = topicMap.get(topicId);

  while (current?.parentId) {
    const parent = topicMap.get(current.parentId);
    if (!parent) {
      break;
    }

    ancestors.unshift(parent);
    current = parent;
  }

  return ancestors;
}

export function getParentTopic(topics: HelpTopic[], topic: HelpTopic): HelpTopic | undefined {
  if (!topic.parentId) {
    return undefined;
  }

  return createTopicMap(topics).get(topic.parentId);
}
