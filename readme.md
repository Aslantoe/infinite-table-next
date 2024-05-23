# InfiniteTableNext

## 安装

通过 pnpm 或 yarn 安装：

```bash
pnpm @cares/infinite-table-next
# 或
yarn @cares/infinite-table-next
```

## 基本用法

```vue
<template>
  <div style="width: 800px">
    Demo
    <InfiniteTableNext
      row-key="id"
      :data="tableData"
      :table-columns="columns"
      height="500px"
    />
    <Draw
      v-model="shapes"
      :svg-prop="svgProp"
      :data-scale="dataScale"
      :disable-level="level"
    />
  </div>
</template>
<script setup lang="ts">
import InfiniteTableNext from "@cares/infinite-table-next";
import "@cares/infinite-table-next/dist/style.css";

import { ref } from "vue";

const columns = ref([
  {
    label: "日期",
    prop: "date",
  },
  {
    label: "姓名",
    prop: "name",
  },
  {
    label: "地址",
    prop: "address",
  },
]);
const tableData = [
  {
    id: 1,
    date: "2016-05-02",
    name: "王小虎",
    address: "上海市普陀区金沙江路 1518 弄",
  },
  {
    id: 2,
    date: "2016-05-04",
    name: "王小虎",
    address: "上海市普陀区金沙江路 1517 弄",
  },
  {
    id: 3,
    date: "2016-05-01",
    name: "王小虎",
    address: "上海市普陀区金沙江路 1519 弄",
  },
  {
    id: 4,
    date: "2016-05-03",
    name: "王小虎",
    address: "上海市普陀区金沙江路 1516 弄",
  },
];
</script>
```

## 常见错误

1、使用 render 报错 ```ReferenceError: React is not defined```

- 原因：项目没有引入vuejsx
- 解决：安装vuejsx相关插件
  