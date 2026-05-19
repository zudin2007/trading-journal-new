import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Use relative base path so the app works under any subpath
// (e.g. https://username.github.io/trading-journal/)
export default defineConfig({
  base: "./",
  plugins: [react()],
  build: {
    outDir: "dist",
  },
});
