// src/index.js
import InfiniteTableNext from "./table.vue";


// 导出组件，以便在其他项目中使用
export { InfiniteTableNext };

// 提供插件安装方法以允许全局注册
const plugin = {
  install(Vue) {
    Vue.component('InfiniteTableNext', InfiniteTableNext);
  }
};

// 默认导出插件
export default plugin;