import Vue from 'vue';
import { TableConfig } from '@/common/types';

const config: TableConfig = {
  minColumnWidth: 80,
};

const configKey = '$TABLE_CONFIG';

// FIXME: 实现一个通过defaults覆盖设置的功能
Object.defineProperty(config, 'minColumnWidth', {
  get():number {
    // const globalConfig = Vue.prototype[configKey] || {};
    const globalConfig = { minColumnWidth: 80 };
    return globalConfig.minColumnWidth || 80;
  },
});

export default config;
