import type { Config } from "@react-router/dev/config";

// On GitHub Pages project sites the app is served from /<repo>/. CI sets
// VITE_BASE to "/<repo>/"; locally it defaults to "/".
const basename = process.env.VITE_BASE ?? "/";

export default {
  ssr: false,
  prerender: true,
  basename,
} satisfies Config;
