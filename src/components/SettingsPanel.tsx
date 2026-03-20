/**
 * @file SettingsPanel.tsx
 * @purpose Comprehensive configuration interface for application, UI, and machine-specific settings.
 */
import { useState, useRef, useEffect } from 'react';
import {
  Settings, X, Search, Bot,
  Palette, LayoutGrid, Play,
} from 'lucide-react';
import { Tooltip } from './ui/Tooltip';
import { useUIStore } from '../stores/uiStore';
import { MachineSetupWizard } from './wizards/MachineSetupWizard';
import { useMachineStore } from '../stores/machineStore';
import { SettingsSection } from './settings/SettingsSection';
import { SETTINGS_SECTIONS as SECTIONS, getSectionContent } from './settings/settingsSections';

// ─── SettingsPanel ───────────────────────────────────────────────────────────

export function SettingsPanel() {
  const { settingsOpen, settingsTab, settingsSection, closeSettings, setSettingsTab } = useUIStore();
  const { hasHomed } = useMachineStore();
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [panelWidth, setPanelWidth] = useState(1024);
  const [panelHeight, setPanelHeight] = useState(780);
  const [sidebarWidth, setSidebarWidth] = useState(224);
  const searchRef = useRef<HTMLInputElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

  const persistLayout = (next: { width?: number; height?: number; sidebarWidth?: number }) => {
    try {
      const raw = localStorage.getItem('settingsPanelLayout');
      const parsed = raw ? JSON.parse(raw) : {};
      const merged = {
        width: next.width ?? parsed.width ?? panelWidth,
        height: next.height ?? parsed.height ?? panelHeight,
        sidebarWidth: next.sidebarWidth ?? parsed.sidebarWidth ?? sidebarWidth,
      };
      localStorage.setItem('settingsPanelLayout', JSON.stringify(merged));
    } catch {
      // ignore localStorage write failures
    }
  };

  const handlePanelResizeStart = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = panelWidth;
    const startHeight = panelHeight;
    let lastWidth = startWidth;
    let lastHeight = startHeight;
    const maxWidth = Math.max(820, window.innerWidth - 32);
    const maxHeight = Math.max(560, window.innerHeight - 32);

    const onMouseMove = (moveEvent: MouseEvent) => {
      const nextWidth = clamp(startWidth + (moveEvent.clientX - startX), 820, maxWidth);
      const nextHeight = clamp(startHeight + (moveEvent.clientY - startY), 560, maxHeight);
      lastWidth = nextWidth;
      lastHeight = nextHeight;
      setPanelWidth(nextWidth);
      setPanelHeight(nextHeight);
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      persistLayout({ width: lastWidth, height: lastHeight });
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  const handleSidebarResizeStart = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = sidebarWidth;
    let lastWidth = startWidth;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const nextWidth = clamp(startWidth + (moveEvent.clientX - startX), 184, 380);
      lastWidth = nextWidth;
      setSidebarWidth(nextWidth);
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      persistLayout({ sidebarWidth: lastWidth });
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  useEffect(() => {
    try {
      const raw = localStorage.getItem('settingsPanelLayout');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (typeof parsed.width === 'number') {
          setPanelWidth(clamp(parsed.width, 820, Math.max(820, window.innerWidth - 32)));
        }
        if (typeof parsed.height === 'number') {
          setPanelHeight(clamp(parsed.height, 560, Math.max(560, window.innerHeight - 32)));
        }
        if (typeof parsed.sidebarWidth === 'number') {
          setSidebarWidth(clamp(parsed.sidebarWidth, 184, 380));
        }
      }
    } catch {
      // ignore localStorage read failures
    }
  }, []);

  useEffect(() => {
    const onWindowResize = () => {
      setPanelWidth((w) => clamp(w, 820, Math.max(820, window.innerWidth - 32)));
      setPanelHeight((h) => clamp(h, 560, Math.max(560, window.innerHeight - 32)));
      setSidebarWidth((w) => clamp(w, 184, 380));
    };

    window.addEventListener('resize', onWindowResize);
    return () => window.removeEventListener('resize', onWindowResize);
  }, []);

  useEffect(() => {
    if (settingsOpen) {
      setTimeout(() => searchRef.current?.focus(), 50);
      
      // Auto-scroll to section if provided
      if (settingsSection) {
        setTimeout(() => {
          const el = document.getElementById(`settings-section-${settingsSection}`);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 150);
      }
    } else {
      setSearch('');
    }
  }, [settingsOpen, settingsSection]);

  const query = search.trim().toLowerCase();
  const isMachineView = !query && settingsTab === 'machine';
  
  // If searching, show all matches. Otherwise, filter by active tab.
  const visibleSections = SECTIONS.filter((s) => {
    const matchesSearch = s.title.toLowerCase().includes(query);
    if (query) return matchesSearch;
    return s.tab === settingsTab;
  });

  return (
    <>
      {/* Trigger */}
      <Tooltip content="Settings & Preferences" position="bottom">
        <button
          data-testid="settings-panel-trigger"
          onClick={() => useUIStore.getState().openSettings()}
          className="p-2 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors duration-200 cursor-pointer"
          aria-label="Open settings"
        >
          <Settings className="w-5 h-5 text-[var(--text-secondary)]" />
        </button>
      </Tooltip>

      {/* Modal */}
      {settingsOpen && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm p-4"
          onClick={closeSettings}
        >
          <div
            className="bg-[var(--bg-secondary)] rounded-xl shadow-2xl border border-[var(--border-color)] overflow-hidden flex flex-col relative"
            style={{
              width: `${panelWidth}px`,
              height: `${panelHeight}px`,
              minWidth: '820px',
              minHeight: '560px',
              maxWidth: 'calc(100vw - 2rem)',
              maxHeight: 'calc(100vh - 2rem)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-color)] bg-[var(--bg-header)] flex-shrink-0">
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">Settings</h2>
              <button
                onClick={closeSettings}
                className="p-1.5 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors duration-200 cursor-pointer"
                aria-label="Close settings"
              >
                <X className="w-5 h-5 text-[var(--text-secondary)]" />
              </button>
            </div>

            {/* Quick Setup Wizard Banner */}
            <div className="mx-4 mt-4 p-3 bg-blue-600/10 rounded-xl border border-blue-500/30 flex items-center justify-between gap-4 group hover:bg-blue-600/15 transition-all duration-300">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-500 shrink-0 shadow-inner group-hover:scale-110 transition-transform duration-300">
                    <Bot className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[var(--text-primary)] leading-tight">Quick Setup Wizard</h4>
                    <p className="text-[10px] text-[var(--text-tertiary)] line-clamp-1">Connection, Axis Direction & Homing Calibration.</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsWizardOpen(true)}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[11px] font-bold transition-all shadow-lg shadow-blue-500/20 active:scale-95 flex items-center gap-1.5 shrink-0"
                >
                  <Play className="w-3 h-3" />
                  {hasHomed ? 'Restart' : 'Start'}
                </button>
            </div>

            {/* Search and Tabs Container */}
            <div className="px-4 py-3 border-b border-[var(--border-color)] bg-[var(--bg-header)] flex-shrink-0 space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)] pointer-events-none" />
                <input
                  ref={searchRef}
                  type="text"
                  placeholder="Search settings…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] transition-all duration-200"
                />
              </div>

              {!query && (
                <div className="flex p-1 bg-[var(--bg-tertiary)] rounded-lg border border-[var(--border-color)]">
                    <button
                        onClick={() => setSettingsTab('dashboard')}
                        className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-md text-xs font-semibold transition-all duration-200 cursor-pointer ${
                            settingsTab === 'dashboard'
                                ? 'bg-[var(--bg-secondary)] text-[var(--accent-primary)] shadow-sm border border-[var(--border-color)]'
                                : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
                        }`}
                    >
                        <LayoutGrid className="w-3.5 h-3.5" />
                        Dashboard
                    </button>
                    <button
                        onClick={() => setSettingsTab('ui')}
                        className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-md text-xs font-semibold transition-all duration-200 cursor-pointer ${
                            settingsTab === 'ui'
                                ? 'bg-[var(--bg-secondary)] text-[var(--accent-primary)] shadow-sm border border-[var(--border-color)]'
                                : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
                        }`}
                    >
                        <Palette className="w-3.5 h-3.5" />
                        UI Controls
                    </button>
                    <button
                        onClick={() => setSettingsTab('machine')}
                        className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-md text-xs font-semibold transition-all duration-200 cursor-pointer ${
                            settingsTab === 'machine'
                                ? 'bg-[var(--bg-secondary)] text-[var(--accent-primary)] shadow-sm border border-[var(--border-color)]'
                                : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
                        }`}
                    >
                        <Settings className="w-3.5 h-3.5" />
                        Machine & System
                    </button>
                </div>
              )}
            </div>

            {/* Main Content Area with Optional Sidebar */}
            <div className="flex flex-1 overflow-hidden relative">
              {/* Sidebar - only show if not searching and we are in UI or Machine tabs */}
              {!query && (settingsTab === 'ui' || settingsTab === 'machine') && (
                <div
                  className="bg-[var(--bg-tertiary)]/30 border-r border-[var(--border-color)] overflow-y-auto py-6 flex-shrink-0 hidden md:block select-none"
                  style={{ width: `${sidebarWidth}px` }}
                >
                  <div className="px-4 space-y-1">
                    <div className="px-2 mb-4">
                      <span className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest opacity-60">
                        {settingsTab === 'ui' ? 'UI Navigation' : 'Machine Navigation'}
                      </span>
                    </div>
                    {visibleSections.map((section) => (
                      <button
                        key={section.id}
                        onClick={() => {
                          const el = document.getElementById(`settings-section-${section.id}`);
                          if (el) {
                            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                          }
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--accent-primary)] hover:bg-[var(--bg-tertiary)] transition-all duration-200 group text-left border border-transparent hover:border-[var(--border-color)] active:scale-[0.98]"
                      >
                        <span className="p-1.5 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)] group-hover:border-[var(--accent-primary)]/30 group-hover:shadow-sm transition-all duration-200">
                          {section.icon}
                        </span>
                        <span className="truncate">{section.title}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {!query && (settingsTab === 'ui' || settingsTab === 'machine') && (
                <div
                  className="hidden md:block w-1.5 cursor-col-resize bg-transparent hover:bg-[var(--accent-primary)]/20 active:bg-[var(--accent-primary)]/30 transition-colors"
                  onMouseDown={handleSidebarResizeStart}
                  role="separator"
                  aria-orientation="vertical"
                  aria-label="Resize settings navigation"
                />
              )}

              {/* Scrollable sections */}
              <div 
                ref={scrollContainerRef} 
                className={`overflow-y-auto flex-1 custom-scrollbar scroll-smooth ${
                  isMachineView ? 'px-4 py-5 space-y-5' : 'px-6 py-8 space-y-8'
                }`}
              >
                {visibleSections.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <Search className="w-10 h-10 text-[var(--text-tertiary)] mb-4 opacity-50" />
                    <p className="text-base font-semibold text-[var(--text-secondary)]">
                      No results found for "{search}"
                    </p>
                    <p className="text-sm text-[var(--text-tertiary)] mt-2">
                      Try searching for a different setting or feature.
                    </p>
                  </div>
                ) : (
                  <div className={`max-w-3xl mx-auto ${isMachineView ? 'space-y-6' : 'space-y-10'}`}>
                    {visibleSections.map((section) => (
                      <div key={section.id} id={`settings-section-${section.id}`} className="scroll-mt-8">
                        <SettingsSection title={section.title} icon={section.icon} compact={section.tab === 'machine'}>
                          {getSectionContent(section.id)}
                        </SettingsSection>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="px-4 py-3 border-t border-[var(--border-color)] bg-[var(--bg-header)] flex justify-end flex-shrink-0">
              <button
                onClick={closeSettings}
                className="px-5 py-2 bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-white rounded-lg text-sm font-medium transition-colors duration-200 cursor-pointer shadow-sm hover:shadow-md"
              >
                Done
              </button>
            </div>

            <div
              className="absolute right-0 bottom-0 w-5 h-5 cursor-nwse-resize"
              onMouseDown={handlePanelResizeStart}
              role="separator"
              aria-orientation="vertical"
              aria-label="Resize settings panel"
            >
              <div className="absolute right-1 bottom-1 w-3 h-3 border-r-2 border-b-2 border-[var(--text-tertiary)]/60" />
            </div>
          </div>
        </div>
      )}

      <MachineSetupWizard 
        isOpen={isWizardOpen} 
        onClose={() => setIsWizardOpen(false)} 
      />
    </>
  );
}
