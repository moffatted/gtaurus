import { ReactNode } from 'react';

export type HelpCategory = 'general' | 'cheat-sheets';

export interface HelpTopic {
  id: string;
  title: string;
  category: HelpCategory;
  content: ReactNode;
}
