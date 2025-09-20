import { defineConfig } from "vite";
import path from "path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { viteStaticCopy } from "vite-plugin-static-copy";

export default defineConfig({
  plugins: [
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
