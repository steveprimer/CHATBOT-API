import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  root: ".", // running from Chatbot API/frontend
  define: {
    "process.env.NODE_ENV": JSON.stringify("production"),
    // some libs might access process.env directly
    "process.env": {},
  },
  build: {
    lib: {
      entry: "src/embed-entry.jsx",
      name: "ChatbotEmbed",
      fileName: () => "chatbot-embed.js",
      formats: ["iife"], // immediate-execution bundle for browsers
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
