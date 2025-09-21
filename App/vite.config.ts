import { defineConfig } from "vite";
import path from "path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { viteStaticCopy } from "vite-plugin-static-copy";
import basicSsl from "@vitejs/plugin-basic-ssl";

export default defineConfig({
  server: {
    host: '0.0.0.0', // Allow external connections
    proxy: {
      '/api': {
        target: 'https://192.168.1.127:3001',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
        secure: false
      }
    }
  },
  plugins: [
    basicSsl(),
    react(),
    tailwindcss(),
    viteStaticCopy({
      targets: [
        {
          src: "node_modules/@tensorflow/tfjs-tflite/dist/*.wasm",
          dest: ".", // copy to dist root
        },
        {
          src: "node_modules/@tensorflow/tfjs-tflite/dist/*.js",
          dest: ".", // copy to dist root
        },
      ],
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
