import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// GitHub Pages: https://<조직명>.github.io/gardenstate-web/
export default defineConfig({
  base: "/gardenstate-web/",
  plugins: [react()],
  resolve: { tsconfigPaths: true },
});
