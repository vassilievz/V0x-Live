import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules/livekit-client") || id.includes("@livekit/components")) {
            return "livekit";
          }
          if (id.includes("node_modules/hls.js")) {
            return "hls";
          }
        },
      },
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:8080",
        changeOrigin: true,
        ws: true,
      },
      "/health": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
      "/ready": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
    },
  },
});
