/**
 * @file setupTests.ts
 * @purpose Global test configuration and mocks for Vitest/JSDOM, including Tauri API stubbing.
 */
import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Prevent JSDOM errors if any component tries to measure text with canvas
HTMLCanvasElement.prototype.getContext = vi.fn();

// Mock Tauri internals so that transport.invoke() doesn't fail in JSDOM tests
vi.stubGlobal('__TAURI_INTERNALS__', {
  invoke: vi.fn((_cmd: string, _args: Record<string, unknown>) => {
    // console.log(`[Tauri Mock] IPC Command called: ${cmd}`, args);
    return Promise.resolve(null);
  }),
});

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn().mockImplementation((cmd, args) => {
    const tauri = (globalThis as any).__TAURI_INTERNALS__;
    if (tauri?.invoke) {
      return tauri.invoke(cmd, args);
    }
    return Promise.resolve(null);
  })
}));

vi.mock('@tauri-apps/api/event', () => ({
  listen: vi.fn().mockResolvedValue(() => {}), // Returns a mock unlisten function
  emit: vi.fn().mockResolvedValue(null)
}));

// Mock localStorage so stores that persist to it don't throw in the test environment
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
    get length() { return Object.keys(store).length; },
    key: (index: number) => Object.keys(store)[index] ?? null,
  };
})();
vi.stubGlobal('localStorage', localStorageMock);
