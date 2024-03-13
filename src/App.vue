<script setup lang="ts">
import HelloWorld from './components/HelloWorld.vue'
import getValue from 'get-value';
import _ from 'lodash';
import { computed, ref, onMounted } from 'vue';
import useTableSelection from '@/hooks/useTableSelectionHooks'
import emitter from "@/event-emitter";


const obj = { name: 'jack' }

const val = getValue(obj, 'name')

const columnStore = ref([{ fixed: 'left', name: '111' }, { fixed: 'right', name: '222' }, { fixed: '', name: '333' }])

const mainColumns = computed(() => {
  return columnStore.value.filter((item) => !item.fixed);
});

const leftFixedColumns = computed(() => {
  return columnStore.value.filter((item) => item.fixed === "left");
});

const rightFixedColumns = computed(() => {
  return columnStore.value.filter((item) => item.fixed === "right");
});

const cArr = _.concat(leftFixedColumns,mainColumns,rightFixedColumns );

const a = mainColumns.value

const focusedRow = ref({ name: 'jack', age: '18' })
const selectedRows = ref([])

const { addSelectedRows } = useTableSelection('a', focusedRow, selectedRows)
 
const handleAdd = () => {
  addSelectedRows([{ name: 'alice', age: '20' }])
}

onMounted(() => {
  emitter.on('current-change', (val)=> {
    console.log(val);
  })
})

</script>

<template>
  <div>
    <button @click="handleAdd">add</button>
    {{ a }}
    <br />
    <br />
    {{ val }}
    <br />
    {{ cArr }}
    <a href="https://vitejs.dev" target="_blank">
      <img src="/vite.svg" class="logo" alt="Vite logo" />
    </a>
    <a href="https://vuejs.org/" target="_blank">
      <img src="./assets/vue.svg" class="logo vue" alt="Vue logo" />
    </a>
  </div>
  <HelloWorld msg="Vite + Vue" />
</template>

<style scoped>
.logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
  transition: filter 300ms;
}
.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}
.logo.vue:hover {
  filter: drop-shadow(0 0 2em #42b883aa);
}
</style>@/hooks/useTableSelectionHooks
