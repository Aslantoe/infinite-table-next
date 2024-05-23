import type { App } from 'vue'
import InfiniteTableNext from './table.vue'

InfiniteTableNext.install = (app: App) => {
  app.component('InfiniteTableNext', InfiniteTableNext)
}
// export { InfiniteTableNext }
export default InfiniteTableNext
