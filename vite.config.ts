import { reactRouter } from "@react-router/dev/vite";
import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";

export default defineConfig({
  // Served from /<repo>/ on GitHub Pages project sites; "/" locally.
  base: process.env.VITE_BASE ?? "/",
  plugins: [reactRouter()],
  // Bind both IPv4 and IPv6 so http://127.0.0.1 and http://localhost both work.
  server: {
    host: true,
  },
  resolve: {
    alias: {
      "~": fileURLToPath(new URL("./app", import.meta.url)),
    },
  },
});
