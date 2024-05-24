import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import vueJsx from "@vitejs/plugin-vue-jsx";
import copy from "rollup-plugin-copy";
import { resolve } from "path";
// https://vitejs.dev/config/
export default defineConfig({
    plugins: [vue(), vueJsx()],
    build: {
        lib: {
            entry: "src/main.ts",
            name: "InfiniteTableNext",
            fileName: function (format) { return "infinite-table-next.".concat(format, ".js"); }, // 打包后的文件名
        },
        rollupOptions: {
            plugins: [
                copy({
                    targets: [{ src: "src/styles/*", dest: "dist/styles" }],
                    hook: "writeBundle",
                    verbose: true,
                }),
            ],
            external: ["vue"],
            output: {
                globals: {
                    vue: "Vue",
                },
            },
        },
    },
    resolve: {
        alias: {
            "@": resolve(__dirname, "src"),
        },
    },
});
