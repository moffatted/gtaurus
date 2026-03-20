#!/usr/bin/env node

import { execSync } from 'node:child_process';

function run(cmd) {
  return execSync(cmd, { stdio: ['ignore', 'pipe', 'pipe'], encoding: 'utf8' });
}

const detectors = [
  { name: 'Gemini key', regex: /AIza[0-9A-Za-z\-_]{35}/g },
  { name: 'OpenAI key', regex: /sk-[A-Za-z0-9]{20,}/g },
  { name: 'Anthropic key', regex: /sk-ant-[A-Za-z0-9\-_]{20,}/g },
  { name: 'Groq key', regex: /gsk_[A-Za-z0-9]{20,}/g },
  { name: 'OpenRouter key', regex: /sk-or-v1-[A-Za-z0-9\-_]{20,}/g },
  { name: 'Mistral key', regex: /mistral_[A-Za-z0-9\-_]{20,}/g },
];

const allowedPatterns = [
  /YOUR_[A-Z_]+_KEY/,
  /example/i,
  /placeholder/i,
  /Paste your/i,
  /\*\*\*\*\*\*/,
];

function isAllowed(text) {
  return allowedPatterns.some((pattern) => pattern.test(text));
}

let diff = '';
try {
  diff = run('git diff --cached --unified=0 --no-color');
} catch {
  process.exit(0);
}

const findings = [];
const lines = diff.split(/\r?\n/);
let currentFile = 'unknown';

for (const line of lines) {
  if (line.startsWith('+++ b/')) {
    currentFile = line.slice('+++ b/'.length);
    continue;
  }

  if (!line.startsWith('+') || line.startsWith('+++')) {
    continue;
  }

  const content = line.slice(1);
  if (!content || isAllowed(content)) {
    continue;
  }

  for (const detector of detectors) {
    const matches = content.match(detector.regex);
    if (matches && matches.length > 0) {
      findings.push({
        file: currentFile,
        detector: detector.name,
        line: content.trim().slice(0, 200),
      });
    }
  }
}

if (findings.length > 0) {
  console.error('\nBlocked: potential API key detected in staged changes.');
  for (const finding of findings) {
    console.error(`- ${finding.file} [${finding.detector}] :: ${finding.line}`);
  }
  console.error('\nRemove secrets from code and use environment variables or secure local config.');
  process.exit(1);
}

console.log('Secrets check passed (staged changes).');
