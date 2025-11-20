import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    headers: {
      // Ensure WASM files are served with correct MIME type
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin',
    },
  },
  optimizeDeps: {
    // Exclude walrus-wasm from optimization to allow proper WASM loading
    exclude: ['@mysten/walrus-wasm'],
  },
});
