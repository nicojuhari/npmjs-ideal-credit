// vite.config.js
import { resolve } from "path";
import { defineConfig } from "vite";

export default defineConfig({
    build: {
        lib: {
            entry: resolve(__dirname, "./index.js"),
            name: "ideal-credit",
            formats: ["es", "umd"],
        },
    },
});
