import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Proxies /api calls to the backend during development so the
// frontend can just call fetch("/api/...") without hardcoding a port.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:4000",
        changeOrigin: true,
      },
    },
  },
});
