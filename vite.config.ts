import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  base: "./",
  plugins: [
    react(),
    VitePWA({
      registerType: "prompt",
      includeAssets: ["icon.svg"],
      manifest: {
        name: "视觉异常发作记录器",
        short_name: "视觉记录",
        description: "本地优先的视觉异常发作记录工具",
        theme_color: "#173f3a",
        background_color: "#f4f1e8",
        display: "standalone",
        start_url: "./",
        icons: [{ src: "icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any maskable" }],
      },
      workbox: { navigateFallback: "index.html", cleanupOutdatedCaches: true },
    }),
  ],
});
