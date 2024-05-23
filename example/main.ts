import { createApp } from 'vue'
// import BasicUsage from './demos/basic-usage.vue';
// import Demo from './demo.vue'
// import jsxcolumn from './demos/jsx-column.vue'
// import customrowattrs from './demos/custom-row-attrs.vue'
// import dragheaderorder from './demos/drag-header-order.vue'
// import fixedcolumn from './demos/fixed-column.vue'
// import headercolumnresize from './demos/header-column-resize.vue'
// import highlightcurrentrow from './demos/highlight-current-row.vue'
// import rowdraggable from './demos/row-draggable.vue'
import allfeatures from './demos/all-features.vue'
import InfiniteTableNext from '../src/main'

//@ts-ignore
createApp(allfeatures).use(InfiniteTableNext).mount('#app')
