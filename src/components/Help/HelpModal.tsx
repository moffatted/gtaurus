/**
 * @file HelpModal.tsx
 * @purpose Interactive modal window for displaying granular help topics and user documentation.
 */
import { useState } from 'react';
import { X, ChevronRight, ChevronDown, BookOpen, Search } from 'lucide-react';
import { useHelpStore } from '../../stores/helpStore';
import { HELP_TOPICS } from './helpContent';
import { getAncestorTopics, getChildTopics, getParentTopic, getTopLevelTopics } from './helpNavigation';
import { getRankedHelpTopicMatches } from './helpSearch';

export function HelpModal() {
  const { isOpen, close, activeTopic, setTopic } = useHelpStore();
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const currentTopic = HELP_TOPICS.find((t) => t.id === activeTopic) || HELP_TOPICS[0];
  const ancestorTopics = getAncestorTopics(HELP_TOPICS, currentTopic.id);
  const currentTopicBreadcrumb = [...ancestorTopics.map((topic) => topic.title), currentTopic.title].join(' / ');
  const isSearching = searchQuery.trim() !== '';

  // Filter topics based on search query
  const matchedEntries = getRankedHelpTopicMatches(HELP_TOPICS, searchQuery);
  const filteredTopics = matchedEntries.map((entry) => entry.topic);
  const matchedTopicIds = new Set(matchedEntries.map((entry) => entry.topic.id));
  const visibleTopicIds = new Set<string>();

  for (const entry of matchedEntries) {
    visibleTopicIds.add(entry.topic.id);

    for (const ancestor of getAncestorTopics(HELP_TOPICS, entry.topic.id)) {
      visibleTopicIds.add(ancestor.id);
    }
  }

  // Separate filtered topics by category
  const filteredGeneral = filteredTopics.filter(t => t.category === 'general');
  const filteredCheatSheets = filteredTopics.filter(t => t.category === 'cheat-sheets');
  const filteredGeneralRoots = isSearching
    ? getTopLevelTopics(HELP_TOPICS).filter((topic) => topic.category === 'general' && visibleTopicIds.has(topic.id))
    : getTopLevelTopics(filteredGeneral);
  const filteredCheatSheetRoots = isSearching
    ? getTopLevelTopics(HELP_TOPICS).filter((topic) => topic.category === 'cheat-sheets' && visibleTopicIds.has(topic.id))
    : filteredCheatSheets;
  const hasResults = filteredGeneral.length > 0 || filteredCheatSheets.length > 0;
  const expandedTopicIds = new Set(ancestorTopics.map((topic) => topic.id));

  if (!isSearching && getChildTopics(HELP_TOPICS, currentTopic.id).length > 0) {
    expandedTopicIds.add(currentTopic.id);
  }

  const renderTopicButton = (topicId: string, nested = false) => {
    const topic = HELP_TOPICS.find((entry) => entry.id === topicId);
    if (!topic) return null;

    const childTopics = getChildTopics(HELP_TOPICS, topic.id);
    const visibleChildTopics = isSearching
      ? childTopics.filter((childTopic) => visibleTopicIds.has(childTopic.id))
      : childTopics;
    const hasChildren = childTopics.length > 0;
    const hasVisibleChildren = visibleChildTopics.length > 0;
    const isExpanded = isSearching ? hasVisibleChildren : expandedTopicIds.has(topic.id);
    const isActive = activeTopic === topic.id;
    const parentTopic = getParentTopic(HELP_TOPICS, topic);
    const isSearchMatch = isSearching && matchedTopicIds.has(topic.id);

    return (
      <div key={topic.id}>
        <button
          data-testid={`help-topic-${topic.id}`}
          data-search-match={isSearchMatch ? 'true' : undefined}
          onClick={() => setTopic(topic.id)}
          aria-expanded={hasChildren ? isExpanded : undefined}
          className={`w-full text-left ${nested ? 'pl-8 pr-3 py-2' : 'px-4 py-2.5'} text-sm font-medium transition-colors flex items-center justify-between gap-2 group ${
            isActive
              ? 'bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] border-r-2 border-[var(--accent-primary)]'
              : isSearchMatch
                ? 'bg-[var(--accent-primary)]/8 text-[var(--text-primary)]'
              : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]'
          }`}
        >
          <span className="min-w-0">
            <span className={`${nested ? 'text-[13px]' : ''} block truncate`}>{topic.title}</span>
            {isSearching && parentTopic && (
              <span className="block text-[11px] uppercase tracking-wide text-[var(--text-tertiary)] truncate">
                {parentTopic.title}
              </span>
            )}
          </span>
          {hasChildren ? (
            isExpanded ? <ChevronDown className="w-4 h-4 flex-shrink-0" /> : <ChevronRight className="w-4 h-4 flex-shrink-0" />
          ) : isActive ? (
            <ChevronRight className="w-4 h-4 flex-shrink-0" />
          ) : null}
        </button>

        {hasChildren && isExpanded && (
          <div className="pb-1">
            {visibleChildTopics.map((childTopic) => renderTopicButton(childTopic.id, true))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity" 
        onClick={close}
      />

      {/* Modal Window */}
      <div className="relative bg-[var(--bg-primary)] w-full max-w-4xl h-[80vh] rounded-xl shadow-2xl border border-[var(--border-color)] flex overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Sidebar */}
        <div className="w-64 bg-[var(--bg-secondary)] border-r border-[var(--border-color)] flex flex-col">
          <div className="p-4 border-b border-[var(--border-color)] flex items-center gap-2 text-[var(--accent-primary)]">
            <BookOpen className="w-5 h-5" />
            <span className="font-bold text-lg">Help Center</span>
          </div>

          {/* Search Input */}
          <div className="px-3 py-3 border-b border-[var(--border-color)]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)] pointer-events-none" />
              <input
                type="text"
                placeholder="Search help..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-9 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-md text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
              />
              {searchQuery.trim() !== '' && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear help search"
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto py-2">
            {!hasResults ? (
              <div className="px-4 py-8 text-center text-sm text-[var(--text-tertiary)]">
                No help topics match your search.
              </div>
            ) : (
              <>
                {/* General Section */}
                {filteredGeneral.length > 0 && (
                  <>
                    <div className="px-4 py-2 text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest">
                      General
                    </div>
                    {filteredGeneralRoots.map((topic) => renderTopicButton(topic.id))}
                  </>
                )}

                {filteredGeneral.length > 0 && filteredCheatSheets.length > 0 && (
                  <div className="my-2 border-t border-[var(--border-color)]/50" />
                )}

                {/* Cheat Sheets Section */}
                {filteredCheatSheets.length > 0 && (
                  <>
                    <div className="px-4 py-2 text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest">
                      Cheat Sheets
                    </div>
                    {filteredCheatSheetRoots.map((topic) => renderTopicButton(topic.id))}
                  </>
                )}
              </>
            )}
          </div>
          
          <div className="p-4 border-t border-[var(--border-color)] text-xs text-[var(--text-tertiary)] text-center">
             Gtaurus Documentation v1.0
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col bg-[var(--bg-primary)] min-w-0">
          {/* Header */}
          <div className="h-16 border-b border-[var(--border-color)] flex items-center justify-between px-8 flex-shrink-0">
             <h1 className="text-xl font-bold text-[var(--text-primary)]">{currentTopicBreadcrumb}</h1>
             <button 
                 onClick={close}
                 className="p-2 rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)] transition-colors"
                 aria-label="Close Help"
             >
                 <X className="w-5 h-5" />
             </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-8 prose prose-invert max-w-none prose-headings:text-[var(--text-primary)] prose-p:text-[var(--text-secondary)] prose-strong:text-[var(--text-primary)] prose-a:text-[var(--accent-primary)]">
              {currentTopic.content}
          </div>
        </div>
      </div>
    </div>
  );
}
