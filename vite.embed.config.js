import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  root: ".", // since you're running from Chatbot API/frontend
  build: {
    lib: {
      entry: "src/embed-entry.jsx",
      name: "ChatbotEmbed",
      fileName: () => "chatbot-embed.js",
    },
    rollupOptions: {
      output: {
        entryFileNames: "chatbot-embed.js",
      },
    },
    minify: "esbuild",
    target: "es2017",
    outDir: "dist-embed",
  },
  plugins: [react()],
});
