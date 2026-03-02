/**
 * @file vite.config.ts
 * @purpose Vite build tool configuration, including plugins, dev server ports, and vendor chunking strategy.
 */
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig(async ({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const host = process.env.TAURI_DEV_HOST;

  // Detect if running in Tauri environment
  const isTauri = process.env.TAURI_ENV_PLATFORM !== undefined;

  const webPort = parseInt(env.VITE_DEV_PORT_WEB || "3000");
  const tauriPort = parseInt(env.VITE_DEV_PORT_TAURI || "1420");

  return {
    plugins: [react()],
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: './src/setupTests.ts',
      // Exclude end-to-end tests from the vitest test runner
      exclude: [
        '**/node_modules/**',
        '**/dist/**',
        '**/cypress/**',
        '**/.{idea,git,cache,output,temp}/**',
        '**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build,eslint,prettier}.config.*',
        '**/test/**/*.ts', // Exclude our webdriverio tests
      ],
      coverage: {
        provider: 'v8',
        reporter: ['text', 'html'],
        exclude: [
          'node_modules/**',
          'dist/**',
          'src-tauri/**',
          'test/**', // Exclude e2e tests from coverage
          '**/*.d.ts',
          '**/*.test.*',
          '**/*.spec.*',
        ],
      },
    },

    // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
    //
    // 1. prevent Vite from obscuring rust errors (only in Tauri mode)
    clearScreen: isTauri ? false : true,

    // 2. Configure server based on environment
    server: {
      // Use fixed port for Tauri, flexible for web
      port: isTauri ? tauriPort : webPort,
      strictPort: isTauri,
      host: host || true,

      // HMR configuration (only needed for Tauri)
      hmr: host
        ? {
            protocol: "ws",
            host,
            port: tauriPort + 1, // Usually one higher than dev port
          }
        : undefined,

      watch: {
        // 3. tell Vite to ignore watching `src-tauri` (only relevant for Tauri)
        ignored: isTauri ? ["**/src-tauri/**"] : [],
      },
    },

    build: {
      chunkSizeWarningLimit: 1200,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes("node_modules")) {
              if (id.includes("three")) {
                return "vendor-three";
              }
              if (id.includes("dockview")) {
                return "vendor-dockview";
              }
              // Group everything else into a main vendor chunk
              return "vendor";
            }
          },
        },
      },
    },
  };
});
