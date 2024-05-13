<template>
  <div style="width: 800px">
    <InfiniteTableNext
      row-key="id"
      :height="500"
      :data="tableData"
      :striped="true"
      :header-order-draggable="true"
      :headerResizeable="true"
      :table-columns="columns"
      @column-resize="handleColumnResize"
    />
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from "vue";
import InfiniteTableNext from "./table.tsx";

const tableData = ref([
  { id: "1", name: "jack", age: "25", address: "star city" },
  { id: "2", name: "alice", age: "26", address: "star city" },
]);

const handleColumnResize = (columnIndex, column, size) => {
  console.log('handleColumnResize', columnIndex, column, size);
  columns[columnIndex].width += size;
}

const columns = reactive([
  {
    label: "id",
    prop: "id",
    fixed: "left",
    width: 100,
  },
  {
    label: "姓名",
    prop: "name",
    width: 100,
  },
  {
    label: "年龄",
    prop: "age",
    width: 100,
    sortable: true
  },
  {
    label: "地址",
    prop: "address",
    width: 50,
  },
]);
</script>

<style scoped></style>
