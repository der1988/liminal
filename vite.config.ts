import { defineConfig } from "vite";
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (
            id.includes("/node_modules/three/src/") ||
            id.includes("/node_modules/three/build/")
          )
            return "three";
          if (id.includes("/node_modules/three/examples/")) return "effects";
        },
      },
    },
  },
});
