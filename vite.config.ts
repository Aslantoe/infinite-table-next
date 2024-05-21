import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import vueJsx from "@vitejs/plugin-vue-jsx";
import { resolve } from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue(), vueJsx()],
  build: {
    // 输出目录，默认'dist'
    outDir: "dist",
    // 生成包的模式，设为库模式
    lib: {
      // 入口文件
      entry: "src/index.js",
      // 库的名字
      name: "InfiniteTableNext",
      // 文件名
      fileName: (format) => `InfiniteTableNext.${format}.js`,
      formats: ["es", "cjs", "umd"], // 支持的模块格式
    },
    // Rollup 打包选项
    rollupOptions: {
      // 确保外部化处理那些你不想打包进库的依赖
      external: ["vue"],
      input: {
        index: resolve(__dirname, "src/index.html"),
        demo: resolve(__dirname, "example/demo.html"),
      },
      // 指定输出格式
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
