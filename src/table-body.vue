<script lang="tsx">
// @ts-nocheck
import { defineComponent, ref, reactive, h } from "vue";
import { RowItemType } from "./common/types";
import RangeRender from "./render/range-render.vue";
import TableRow from "./table-row.vue";

export default defineComponent({
  name: "TableBody",
  components: { RangeRender, TableRow },
  data() {
    const tableStore = this.$parent;
    const tableOptions = this.$parent.tableOptions;
    const tableBody = ref();
    const scroll = ref();
    const grid = reactive({ offsetX: 0, offsetY: 0 });

    return {
      tableStore,
      tableOptions,
      tableBody,
      scroll,
      grid,
    };
  },

  mounted() {
    this.scroll = this.getScrollElement();
    this.scroll.addEventListener("scroll", this.handleScroll);
    this.handleScroll();
  },

  beforeDestroy() {
    this.scroll.removeEventListener("scroll", this.handleScroll);
  },

  methods: {
    //   @RafDecorator
    handleScroll(): void {
      this.changeOffsetIndex();
      this.tableStore.$emit("hide-tooltip");
    },

    changeOffsetIndex(): void {
      const { scrollTop, scrollLeft } = this.scroll;
      this.grid.offsetX = scrollLeft;
      this.grid.offsetY = scrollTop;
    },

    getScrollElement(): HTMLElement {
      return this.$el.closest(".infinite-table--scrollable") as HTMLElement;
    },

    slots() {
      return {
        default: (slotProps: { data: RowItemType; index: number }) => {
          const { data, index } = slotProps;
          return (
            <TableRow
              tableStore={this.tableStore}
              tableOptions={this.tableOptions}
              index={index + this.tableStore.fixedData.length}
              offset-x={this.grid.offsetX}
              data={data}
            />
          );
        },
      };
    },

    renderNormalRows() {
      const tableStore = this.tableStore;
      return (
        <RangeRender
          data={tableStore.normalData}
          direction="vertical"
          size={this.tableOptions.rowHeight}
          data-key={this.tableOptions.rowKey}
          viewport-size={
            tableStore.layoutSize.viewportHeight -
            tableStore.fixedData.length * this.tableOptions.rowHeight
          }
          offset={this.grid.offsetY}
          trail-size={2}
          leading-size={2}
          v-slots={this.slots()}
        />
      );
    },

    renderFixedRow() {
      return (
        <div
          style={{
            position: "relative",
            transform: `translate(0, ${this.grid.offsetY}px)`,
            zIndex: 1000
          }}
        >
          {this.tableStore.fixedData.map((rowData, index) => (
            <TableRow
              tableStore={this.tableStore}
              tableOptions={this.tableOptions}
              key={index}
              index={index}
              offsetX={this.grid.offsetX}
              data={rowData}
              style="position: relative"
            />
          ))}
        </div>
      );
    },
  },

  watch: {
    data: {
      handler() {
        this.handleScroll();
      },
    },
  },
  render() {
    const tableStore = this.tableStore;
    return (
      <div
        ref="tableBody"
        class="infinite-table__body"
        style={{
          height: `${(tableStore.normalData.length + tableStore.fixedData.length) * this.tableOptions.rowHeight}px`,
          width: `${tableStore.allColumnsWidth}px`,
        }}
      >
        {tableStore.fixedData.length > 0 && this.renderFixedRow()}
        {this.renderNormalRows()}
      </div>
    );
  },
});
</script>
