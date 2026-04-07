import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    // Local AI: run in another terminal — npx netlify functions:serve --port 9999
    proxy: {
      "/.netlify/functions/claude-proxy": {
        target: process.env.NETLIFY_FUNCTIONS_ORIGIN ?? "http://127.0.0.1:9999",
        changeOrigin: true,
      },
    },
  },
});

