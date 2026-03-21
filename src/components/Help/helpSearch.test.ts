import { describe, expect, it } from 'vitest';
import type { HelpTopic } from './helpTopics.types';
import { filterAndRankHelpTopics } from './helpSearch';

const TOPICS: HelpTopic[] = [
  {
    id: 'settings-machine-system',
    title: 'Settings: Machine & System',
    category: 'general',
    searchText: 'settings machine system ai assistant clients providers models',
    content: null,
  },
  {
    id: 'top-menu-panels',
    title: 'Top Menu Panels',
    category: 'general',
    searchText: 'top menu ai assistant shortcuts',
    content: null,
  },
  {
    id: 'visualizer',
    title: 'Bed Visualizer',
    category: 'general',
    searchText: 'visualizer camera coordinates',
    content: null,
  },
];

describe('filterAndRankHelpTopics', () => {
  it('matches short token queries like ai by word token instead of substring noise', () => {
    const results = filterAndRankHelpTopics(TOPICS, 'ai');
    expect(results.map((r) => r.id)).toEqual(['settings-machine-system', 'top-menu-panels']);
  });

  it('matches multi-token phrase queries across search text', () => {
    const results = filterAndRankHelpTopics(TOPICS, 'ai assistant');
    expect(results.length).toBe(2);
    expect(results[0].id).toBe('settings-machine-system');
  });

  it('returns all topics for blank queries', () => {
    const results = filterAndRankHelpTopics(TOPICS, '   ');
    expect(results).toHaveLength(3);
  });
});
