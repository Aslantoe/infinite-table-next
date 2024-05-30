<template>
  <div>
    <infinite-table-next
      tableKey="a"
      row-key="id"
      height="250px"
      highlight-current-row
      :data="tableData"
      :table-columns="columns"
      @current-change="handleCurrentChange"
    ></infinite-table-next>
    ------
    <infinite-table-next
      tableKey="b"
      row-key="id"
      height="240px"
      highlight-current-row
      :data="tableData"
      :table-columns="columns"
      @current-change="handleCurrentChange1"
    ></infinite-table-next>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

const handleCurrentChange = (row) => {
  console.log("当前行", row);
};

const handleCurrentChange1 = (row) => {
  console.log("当前行1", row);
};

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
