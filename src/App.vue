<template>
  <div style="width: 800px;">
    <InfiniteTableNext
      row-key="id"
      :height="500"
      :data="tableData"
      :striped="false"
      :table-columns="columns"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import InfiniteTableNext from "./table.tsx";

const tableData = ref([{ id: "1", name: "jack", age: "25" }]);

const columns = [
  {
    label: "id",
    prop: "id",
    fixed: 'left'
  },
  {
    label: "姓名",
    prop: "name",
  },
  {
    label: "年龄",
    prop: "age",
  },
];
</script>

<style scoped></style>
