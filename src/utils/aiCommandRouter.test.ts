import { describe, expect, it } from 'vitest';
import { getCommandSuggestions, parseSlashCommand, resolveSlashCommand } from './aiCommandRouter';
import { DEFAULT_SETTINGS } from '../stores/settingsStore';
import type { MachineStatus } from '../stores/machineStatusStore';

const machine: MachineStatus = {
  status: 'Idle',
  x: { mpos: 10, wco: 1 },
  y: { mpos: 20, wco: 2 },
  z: { mpos: 30, wco: 3 },
  feed: 500,
  spindle: 12000,
  isSpindleActive: true,
  firmware: 'FluidNC',
  buildInfo: 'test-build',
  board: 'ESP32',
  pins: 'P',
};

describe('aiCommandRouter', () => {
  it('parses slash commands', () => {
    expect(parseSlashCommand('/help probing')).toEqual({
      name: 'help',
      args: 'probing',
      raw: '/help probing',
    });
  });

  it('maps empty slash to commands', () => {
    expect(parseSlashCommand('/')).toEqual({
      name: 'commands',
      args: '',
      raw: '/',
    });
  });

  it('suggests commands from partial slash input', () => {
    const suggestions = getCommandSuggestions('/he');
    expect(suggestions.some((suggestion) => suggestion.label === '/help')).toBe(true);
  });

  it('suggests help topics from /help input text', () => {
    const suggestions = getCommandSuggestions('/help pro');
    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions.some((suggestion) => suggestion.template.startsWith('/help'))).toBe(true);
  });

  it('suggests status modes from /status input text', () => {
    const suggestions = getCommandSuggestions('/status f');
    expect(suggestions.some((suggestion) => suggestion.template === '/status firmware')).toBe(true);
  });

  it('resolves settings command with open action for strong matches', () => {
    const parsed = parseSlashCommand('/settings probe');
    if (!parsed) throw new Error('Expected parsed slash command');

    const result = resolveSlashCommand(parsed, { settings: DEFAULT_SETTINGS, machine });
    expect(result.kind).toBe('local');
    if (result.kind !== 'local') return;
    expect(result.action).toEqual({
      type: 'openSettings',
      tab: 'machine',
      section: 'probe',
    });
  });

  it('resolves status with FluidNC diagnostic command guidance', () => {
    const parsed = parseSlashCommand('/status');
    if (!parsed) throw new Error('Expected parsed slash command');

    const result = resolveSlashCommand(parsed, { settings: DEFAULT_SETTINGS, machine });
    expect(result.kind).toBe('local');
    if (result.kind !== 'local') return;

    expect(result.response).toContain('Machine status (live app context):');
    expect(result.response).toContain('$I');
    expect(result.response).toContain('$SS');
    expect(result.response).toContain('$$');
    expect(result.response).toContain('$CD');
    expect(result.card?.title).toBe('Machine + FluidNC Status');
  });

  it('resolves status firmware mode', () => {
    const parsed = parseSlashCommand('/status firmware');
    if (!parsed) throw new Error('Expected parsed slash command');

    const result = resolveSlashCommand(parsed, { settings: DEFAULT_SETTINGS, machine });
    expect(result.kind).toBe('local');
    if (result.kind !== 'local') return;

    expect(result.response).toContain('FluidNC firmware diagnostics');
    expect(result.response).toContain('$I');
    expect(result.response).toContain('$SS');
    expect(result.card?.title).toBe('FluidNC Firmware Status');
    expect(result.action).toEqual({ type: 'sendGcode', cmd: '$I' });
  });

  it('resolves status config mode', () => {
    const parsed = parseSlashCommand('/status config');
    if (!parsed) throw new Error('Expected parsed slash command');

    const result = resolveSlashCommand(parsed, { settings: DEFAULT_SETTINGS, machine });
    expect(result.kind).toBe('local');
    if (result.kind !== 'local') return;

    expect(result.response).toContain('FluidNC config diagnostics');
    expect(result.response).toContain('$CD');
    expect(result.card?.title).toBe('FluidNC Config Status');
    expect(result.action).toEqual({ type: 'sendGcode', cmd: '$CD' });
  });

  it('resolves status live mode', () => {
    const parsed = parseSlashCommand('/status live');
    if (!parsed) throw new Error('Expected parsed slash command');

    const result = resolveSlashCommand(parsed, { settings: DEFAULT_SETTINGS, machine });
    expect(result.kind).toBe('local');
    if (result.kind !== 'local') return;

    expect(result.response).toContain('Machine status (live app context):');
    expect(result.action).toEqual({ type: 'sendGcode', cmd: '?' });
  });

  it('resolves diagnose to hybrid mode', () => {
    const parsed = parseSlashCommand('/diagnose probe fails after connect');
    if (!parsed) throw new Error('Expected parsed slash command');

    const result = resolveSlashCommand(parsed, { settings: DEFAULT_SETTINGS, machine });
    expect(result.kind).toBe('hybrid');
    if (result.kind !== 'hybrid') return;
    expect(result.commandName).toBe('diagnose');
    expect(result.localContext).toContain('Relevant local help topics');
    expect(result.relatedCard?.title).toContain('Related Help');
  });

  it('resolves open to a direct action target', () => {
    const parsed = parseSlashCommand('/open tool library');
    if (!parsed) throw new Error('Expected parsed slash command');

    const result = resolveSlashCommand(parsed, { settings: DEFAULT_SETTINGS, machine });
    expect(result.kind).toBe('local');
    if (result.kind !== 'local') return;
    expect(result.action).toEqual({
      type: 'openWindow',
      windowId: 'toolLibrary',
    });
  });
});