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

## 主题样式修改

新建.scss文件, 应用到 main.ts中

``` scss
$table-text-color: #fff;
$table-header-text-color: #fff ;

$table-background-color: #243443;
$table-header-background-color: #2d2d2d;

$table-row-background-color: #243443;
$table-row-background-color--striped: #2d2d2d;

/* table的字号 */
$table-font-size: 14px;

/* table表头的border-bottom */
$table-header-border-bottom: 1px solid #252629;
/* 行hover高亮  */
$table-row-hover-color: #2050A0;
/* 行选中高亮  */
$table-row-selected-color: #2050A0;
/* 单元格选中的颜色 */
$table-cell-selected-color: #FFFFFF;
$table-cell-selected-text-color: #ffffff;

$table-sortable-color: #fefefe;
/* 可排序列箭头颜色  */
$table-sortable-color--active: $table-row-hover-color;
$table-tooltip-background: #3c9afb;

/* 行之间分割线的颜色 */
$table-row-divider-color: #252629;

/* 重要！一定要将此行内容放到变量下面 */
@import "@cares/infinite-table-next/dist/styles/main";

```

## 常见错误

1、使用 render 报错 ```ReferenceError: React is not defined```

- 原因：项目没有引入vuejsx
- 解决：安装vuejsx相关插件
  