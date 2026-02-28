/**
 * @file testUtils.tsx
 * @purpose Specialized testing utilities for rendering components with global providers and mocking Tauri APIs.
 */
import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi } from 'vitest';

/**
 * Creates a fresh QueryClient for each test to prevent cache bleed
 */
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false, // Turn off retries for tests
      },
      mutations: {
        retry: false,
      },
    },
  });

/**
 * Custom render function that wraps the component with global providers
 */
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  const queryClient = createTestQueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => render(ui, { wrapper: AllTheProviders, ...options });

export * from '@testing-library/react';
export { customRender as render };

/**
 * Provides a utility to mock the expected response of a Tauri `invoke` call
 * Requires `__TAURI_INTERNALS__` to be stubbed in `setupTests.ts`
 */
export function mockTauriInvoke(mockImpl: (cmd: string, args: Record<string, unknown>) => Promise<any>) {
  vi.stubGlobal('__TAURI_INTERNALS__', {
    invoke: vi.fn().mockImplementation(mockImpl),
  });
}
