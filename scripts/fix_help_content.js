
import fs from 'fs';

let content = fs.readFileSync('c:/Users/moffa/projects/gtaurus/src/components/Help/helpContent.tsx', 'utf8');

// Fix duplicates
content = content.replace(/category: 'general',\s+id: 'getting-started',\s+title: 'Getting Started',\s+category: 'general'/g, "category: 'general', id: 'getting-started', title: 'Getting Started'");
content = content.replace(/category: 'general',\s+id: '(.+)',\s+title: '(.+)',\s+category: 'general'/g, "category: 'general', id: '$1', title: '$2'");

// Final topic
const gcodeTopic = `
  {
    category: 'cheat-sheets',
    id: 'gcode-ref',
    title: 'G-code Quick Reference',
    content: <GcodeCheatSheet />
  }
];`;

content = content.replace(/}\s+];/g, `}${gcodeTopic}`);

fs.writeFileSync('c:/Users/moffa/projects/gtaurus/src/components/Help/helpContent.tsx', content);
