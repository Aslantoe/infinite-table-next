<template>
  <div>
    <infinite-table-next
      row-key="id"
      header-resizeable
      height="500px"
      :data="tableData"
      :table-columns="columns"
      @column-resize="handleColumnResize"
    ></infinite-table-next>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

const handleColumnResize = (columnIndex, _column, size) => {
  columns.value[columnIndex].width += size;
};

const columns = ref([
  {
    label: "日期",
    prop: "date",
    width: 200
  },
  {
    label: "姓名",
    prop: "name",
    width: 200
  },
  {
    label: "地址",
    prop: "address",
    width: 200
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
