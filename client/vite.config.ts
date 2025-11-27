import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react'
import tailwindcss from "@tailwindcss/vite"
import path from "path"


export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());

  const BASE_URL = `${env.VITE_NODE_ENV ? "/rec-movie/" : "/"}`;

  return {
    plugins: [react(), tailwindcss()],
    base: BASE_URL,
    build: {
      outDir: 'dist',
      assetsDir: 'assets'
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});