import { HelpTopic } from './helpTopics.types';
import { GcodeCheatSheet } from './GcodeCheatSheet';

export const referenceTopics: HelpTopic[] = [
  {
    id: 'about',
    title: 'About',
    category: 'general',
    searchText: 'about gtaurus version alpha information',
    content: (
      <div className="space-y-4 text-center">
        <h2 className="text-2xl font-bold mb-2">Gtaurus</h2>
        <p className="text-[var(--text-secondary)]">v0.1.0-alpha</p>
        <div className="w-16 h-1 w-full bg-[var(--border-color)] my-4 mx-auto" />
        <p className="text-sm">
            A modern CNC dashboard for FluidNC.
        </p>
        <p className="text-xs text-[var(--text-tertiary)] mt-8">
            Created for the maker community.
        </p>
      </div>
    ),
  },
  {
    id: 'gcode-ref',
    title: 'G-code Quick Reference',
    category: 'cheat-sheets',
    searchText: 'gcode reference codes cheat sheet g-code commands quick',
    content: <GcodeCheatSheet />,
  },
];
