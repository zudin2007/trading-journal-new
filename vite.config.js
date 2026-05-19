import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // For GitHub Pages deployment, uncomment and replace YOUR_REPO_NAME:
  // base: "/YOUR_REPO_NAME/",
});
