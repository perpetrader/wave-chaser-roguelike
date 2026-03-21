import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  base: "/wave-chaser-roguelike/",
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "characters/*", "images/*"],
      manifest: {
        name: "Wave Chaser: Roguelike",
        short_name: "Wave Chaser",
        description: "Touch the waves without getting too wet! A roguelike wave chasing game.",
        theme_color: "#0f172a",
        background_color: "#0f172a",
        display: "standalone",
        orientation: "portrait",
        start_url: "/wave-chaser-roguelike/",
        icons: [
          {
            src: "/wave-chaser-roguelike/pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/wave-chaser-roguelike/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "/wave-chaser-roguelike/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,jpg,webp}"],
        // Exclude large audio files from precaching - they'll be cached on-demand
        navigateFallback: null,
        runtimeCaching: [
          {
            urlPattern: /\.(?:ogg|m4a|wav|mp3)$/i,
            handler: "CacheFirst",
            options: {
              cacheName: "audio-cache",
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
              rangeRequests: true,
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-cache",
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
            },
          },
        ],
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
