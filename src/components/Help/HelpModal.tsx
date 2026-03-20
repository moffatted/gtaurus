/**
 * @file HelpModal.tsx
 * @purpose Interactive modal window for displaying granular help topics and user documentation.
 */
import { useState } from 'react';
import { X, ChevronRight, BookOpen, Search } from 'lucide-react';
import { useHelpStore } from '../../stores/helpStore';
import { HELP_TOPICS } from './helpContent';

export function HelpModal() {
  const { isOpen, close, activeTopic, setTopic } = useHelpStore();
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const currentTopic = HELP_TOPICS.find((t) => t.id === activeTopic) || HELP_TOPICS[0];

  // Filter topics based on search query
  const filteredTopics = searchQuery.trim() === '' 
    ? HELP_TOPICS
    : HELP_TOPICS.filter((topic) =>
        topic.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        topic.searchText.toLowerCase().includes(searchQuery.toLowerCase())
      );

  // Separate filtered topics by category
  const filteredGeneral = filteredTopics.filter(t => t.category === 'general');
  const filteredCheatSheets = filteredTopics.filter(t => t.category === 'cheat-sheets');
  const hasResults = filteredGeneral.length > 0 || filteredCheatSheets.length > 0;

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
                className="w-full pl-9 pr-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-md text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
              />
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
                    {filteredGeneral.map((topic) => (
                      <button
                        key={topic.id}
                        onClick={() => setTopic(topic.id)}
                        className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors flex items-center justify-between group ${
                          activeTopic === topic.id
                            ? 'bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] border-r-2 border-[var(--accent-primary)]'
                            : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]'
                        }`}
                      >
                        {topic.title}
                        {activeTopic === topic.id && <ChevronRight className="w-4 h-4" />}
                      </button>
                    ))}
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
                    {filteredCheatSheets.map((topic) => (
                      <button
                        key={topic.id}
                        onClick={() => setTopic(topic.id)}
                        className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors flex items-center justify-between group ${
                          activeTopic === topic.id
                            ? 'bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] border-r-2 border-[var(--accent-primary)]'
                            : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]'
                        }`}
                      >
                        {topic.title}
                        {activeTopic === topic.id && <ChevronRight className="w-4 h-4" />}
                      </button>
                    ))}
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
             <h1 className="text-xl font-bold text-[var(--text-primary)]">{currentTopic.title}</h1>
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
