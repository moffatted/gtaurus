import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SettingsPanel } from './SettingsPanel';

// Mock the Tauri invoke function to prevent actual Tauri calls during tests
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

// Mock the Tauri store plugin to prevent actual file I/O during tests
vi.mock('@tauri-apps/plugin-store', () => ({
  Store: {
    load: vi.fn().mockResolvedValue({
      get: vi.fn().mockResolvedValue(null),
      set: vi.fn().mockResolvedValue(undefined),
      save: vi.fn().mockResolvedValue(undefined),
    }),
  }
}));

describe('SettingsPanel', () => {
  it('renders without crashing', () => {
    // The SettingsPanel only initially renders a settings button (trigger)
    render(<SettingsPanel />);
    const button = screen.getByRole('button', { name: /open settings/i });
    expect(button).toBeInTheDocument();
  });
});
