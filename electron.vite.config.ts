import { readdirSync } from "fs";
import { defineConfig } from "electron-vite";
import react from "@vitejs/plugin-react";
import { nodePolyfills } from "vite-plugin-node-polyfills";
import { resolve, join, basename, extname } from "path";

const protectedStrings = [
  "67keeperA@", // ENCRYPT_KEY
  "autocryptoA@23", // FILE_KEY
];

const migrationProdDir = resolve(
  __dirname,
  "src/electron/database/migration/prod",
);
const migrationEntries: Record<string, string> = {};
try {
  for (const file of readdirSync(migrationProdDir)) {
    if (extname(file) === ".ts") {
      const name = basename(file, ".ts");
      migrationEntries[`migration/prod/${name}`] = join(migrationProdDir, file);
    }
  }
} catch (_) {
  // prod folder may not exist yet
}

export default defineConfig(({ mode }) => ({
  main: {
    build: {
      outDir: "dist/electron/main",
      lib: {
        entry: {
          index: resolve(__dirname, "src/electron/main.ts"),
          ...migrationEntries,
        },
      },
      rollupOptions: {
        output: {
          entryFileNames: "[name].js",
        },
      },
      bytecode: {
        protectedStrings,
        transformArrowFunctions: false,
      },
    },
    resolve: {
      alias: {
        "@": resolve(__dirname, "src"),
      },
    },
  },
  preload: {
    build: {
      outDir: "dist/electron/preload",
      lib: {
        entry: resolve(__dirname, "src/electron/preload.ts"),
      },
      rollupOptions: {
        output: {
          entryFileNames: "index.js",
        },
      },
      bytecode: {
        protectedStrings,
        transformArrowFunctions: false,
      },
    },
    resolve: {
      alias: {
        "@": resolve(__dirname, "src"),
      },
    },
  },
  renderer: {
    plugins: [
      react(),
      nodePolyfills({
        globals: {
          Buffer: true,
          global: true,
          process: true,
        },
      }),
    ],
    root: ".",
    base: mode === "development" ? "/" : "./",
    build: {
      outDir: "build",
      rollupOptions: {
        input: {
          index: resolve(__dirname, "index.html"),
        },
      },
    },
    resolve: {
      alias: {
        "@": resolve(__dirname, "src"),
        "fs/promises": resolve(__dirname, "src/stubs/fsPromises.ts"),
      },
    },
    define: {
      global: "globalThis",
    },
    optimizeDeps: {
      esbuildOptions: {
        define: {
          global: "globalThis",
        },
      },
    },
    server: {
      port: 4000,
    },
  },
}));
