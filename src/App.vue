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
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import InfiniteTableNext from "./table.tsx";

const tableData = ref([
  { id: "1", name: "jack", age: "25", address: "star city" },
  { id: "2", name: "alice", age: "26", address: "star city" },
]);

const columns = [
  {
    label: "id",
    prop: "id",
    fixed: "left",
  },
  {
    label: "姓名",
    prop: "name",
  },
  {
    label: "年龄",
    prop: "age",
    sortable: true
  },
  {
    label: "地址",
    prop: "address",
  },
];
</script>

<style scoped></style>
