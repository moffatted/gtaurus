import { HelpTopic } from './helpTopics.types';

export type HelpTopicMatch = {
  topic: HelpTopic;
  score: number;
};

function normalizeText(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\s]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function matchesToken(haystack: string, haystackWords: Set<string>, token: string): boolean {
  if (token.length <= 2) {
    return haystackWords.has(token);
  }

  return haystack.includes(token);
}

function scoreTopic(topic: HelpTopic, query: string): number {
  const normalizedQuery = normalizeText(query);
  if (!normalizedQuery) return 0;

  const title = normalizeText(topic.title);
  const searchText = normalizeText(topic.searchText);
  const id = normalizeText(topic.id);
  const haystack = `${title} ${searchText} ${id}`.trim();
  const haystackWords = new Set(haystack.split(' ').filter(Boolean));

  const tokens = normalizedQuery.split(' ').filter(Boolean);
  if (tokens.length === 0) return 0;

  const titlePhrase = title.includes(normalizedQuery);
  const searchPhrase = searchText.includes(normalizedQuery);
  const idPhrase = id.includes(normalizedQuery);
  const allTokensMatch = tokens.every((token) => matchesToken(haystack, haystackWords, token));

  if (!titlePhrase && !searchPhrase && !idPhrase && !allTokensMatch) {
    return -1;
  }

  let score = 0;

  if (titlePhrase) score += 120;
  if (searchPhrase) score += 100;
  if (idPhrase) score += 90;
  if (allTokensMatch) score += 60;

  for (const token of tokens) {
    if (matchesToken(title, new Set(title.split(' ').filter(Boolean)), token)) {
      score += 20;
    }
    if (matchesToken(searchText, haystackWords, token)) {
      score += 10;
    }
  }

  return score;
}

export function getRankedHelpTopicMatches(topics: HelpTopic[], query: string): HelpTopicMatch[] {
  const normalizedQuery = normalizeText(query);
  if (!normalizedQuery) {
    return topics.map((topic) => ({ topic, score: 0 }));
  }

  return topics
    .map((topic) => ({ topic, score: scoreTopic(topic, normalizedQuery) }))
    .filter((entry) => entry.score >= 0)
    .sort((a, b) => b.score - a.score || a.topic.title.localeCompare(b.topic.title));
}

export function filterAndRankHelpTopics(topics: HelpTopic[], query: string): HelpTopic[] {
  return getRankedHelpTopicMatches(topics, query).map((entry) => entry.topic);
}
