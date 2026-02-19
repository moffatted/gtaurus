import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// @ts-expect-error process is a nodejs global
const host = process.env.TAURI_DEV_HOST;

// Detect if running in Tauri environment
// @ts-expect-error process is a nodejs global
const isTauri = process.env.TAURI_ENV_PLATFORM !== undefined;

// https://vite.dev/config/
export default defineConfig(async () => ({
  plugins: [react()],

  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  //
  // 1. prevent Vite from obscuring rust errors (only in Tauri mode)
  clearScreen: isTauri ? false : true,
  
  // 2. Configure server based on environment
  server: {
    // Use fixed port for Tauri, flexible for web
    port: isTauri ? 1420 : 3000,
    strictPort: isTauri,
    host: host || false,
    
    // HMR configuration (only needed for Tauri)
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1421,
        }
      : undefined,
    
    watch: {
      // 3. tell Vite to ignore watching `src-tauri` (only relevant for Tauri)
      ignored: isTauri ? ["**/src-tauri/**"] : [],
    },
  },
  
  build: {
    chunkSizeWarningLimit: 1000, 
  },
}));
