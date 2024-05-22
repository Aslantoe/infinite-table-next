<template>
  <div style="width: 100%">
    <InfiniteTableNext
      row-key="id"
      :height="500"
      :data="tableData"
      :table-columns="columns"
    />
  </div>
</template>

<script setup lang="tsx">
// @ts-nocheck
import { ref } from "vue";
import InfiniteTableNext from "./table.vue";

const tableData = ref([
  {
    id: "1",
    date: "2016-05-03",
    age: 25,
    name: "Tom",
    state: "California",
    city: "Los Angeles",
    address: "No. 189, Grove St, Los Angeles",
    zip: "CA 90036",
    tag: "Home",
  },
  {
    id: "2",
    date: "2016-05-02",
    age: 26,
    name: "Tom",
    state: "California",
    city: "Los Angeles",
    address: "No. 189, Grove St, Los Angeles",
    zip: "CA 90036",
    tag: "Office",
  },
  {
    id: "3",
    date: "2016-05-04",
    age: 27,
    name: "Tom",
    state: "California",
    city: "Los Angeles",
    address: "No. 189, Grove St, Los Angeles",
    zip: "CA 90036",
    tag: "Home",
  },
  {
    id: "4",
    date: "2016-05-01",
    name: "Tom",
    age: 18,
    state: "California",
    city: "Los Angeles",
    address: "No. 189, Grove St, Los Angeles",
    zip: "CA 90036",
    tag: "Office",
  },
]);

let columns = ref([
  {
    label: "id",
    prop: "id",
    fixed: "left",
    width: 100,
  },
  {
    label: "日期",
    prop: "date",
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
  },
  {
    label: "州",
    prop: "state",
    width: 100,
  },
  {
    label: "城市",
    prop: "city",
  },
  {
    label: "地址",
    prop: "address",
  },
  {
    label: "zip",
    prop: "zip",
  },
  {
    label: "地址",
    prop: "address",
  },
  {
    label: "Tag",
    prop: "tag",
    fixed: "right",
  },
]);
</script>

<style scoped></style>
