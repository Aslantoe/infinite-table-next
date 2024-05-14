import {
  PropType,
  defineComponent,
  ref,
  inject,
  onMounted,
  onBeforeUnmount,
  watch,
  reactive,
} from "vue";
import { tableOptionsInjectKey, RowItemType } from "@/common/types";
import useTableStore from "@/table-store";
import TableRow from "./table-row";
import RangeRender from "./render/range-render.vue";
import emitter from "./event-emitter";

const TableBody = defineComponent({
  props: {
    normalData: {
      type: Array as PropType<RowItemType[]>,
      required: true,
      default: () => [],
    },
  },
  setup(props, { attrs }) {
    const tableBodyRef = ref();

    const tableOptions: any = inject(tableOptionsInjectKey);

    const {
      layoutSize,
      allColumnsWidth,
      fixedData
    } = useTableStore(tableOptions, "id", "table-body");

    const scroll = ref();
    const grid = reactive({ offsetX: 0, offsetY: 0 });

    onMounted(() => {
      console.log('加载table-body.tsx');

      scroll.value = getScrollElement();
      scroll.value.addEventListener("scroll", handleScroll);
      handleScroll();
    });

    onBeforeUnmount(() => {
      scroll.value.removeEventListener("scroll", handleScroll);
    });

    const handleScroll = () => {
      changeOffsetIndex();
      emitter.emit("hide-tooltip");
    };

    const changeOffsetIndex = () => {
      const { scrollTop, scrollLeft } = scroll.value;
      grid.offsetX = scrollLeft;
      grid.offsetY = scrollTop;
    };

    const getScrollElement = () => {
      return tableBodyRef.value.closest(
        ".infinite-table--scrollable"
      ) as HTMLElement;
    };

    // watch(data, () => {
    //   handleScroll();
    // });

    const slots = {
      default: (slotProps: { data: RowItemType; index: number }) => {
        const { data, index } = slotProps;
        console.log("slots", data, index);
        return (
          <TableRow
            index={index + fixedData.value.length}
            offset-x={grid.offsetX}
            data={data}
          />
        );
      },
    };

    const renderNormalRows = () => (
      <RangeRender
        data={props.normalData}
        direction="vertical"
        size={tableOptions.rowHeight}
        data-key={tableOptions.rowKey}
        viewport-size={
          layoutSize.value.viewportHeight -
          fixedData.value.length * tableOptions.rowHeight
        }
        offset={grid.offsetY}
        trail-size={2}
        leading-size={2}
        v-slots={slots}
      />
    );

    const renderFixedRow = () => (
      <div
        style={{
          position: "relative",
          transform: `translate3d(0, ${grid.offsetY}px, 1px)`,
        }}
      >
        {
          // @ts-ignore
          fixedData.map((rowData, index) => (
            <TableRow
              key={index}
              index={index}
              offsetX={grid.offsetX}
              data={rowData}
              style="position: relative"
            />
          ))
        }
      </div>
    );

    return () => (
      <div
        ref={tableBodyRef}
        class="infinite-table__body"
        style={{
          height: `${layoutSize.value.viewportHeight}px`,
          "transform-style": fixedData.value.length >= 0 ? "preserve-3d" : "initial",
        }}
        {...attrs}
      >
        {fixedData.value.length > 0 && renderFixedRow()}
        {renderNormalRows()}
        <div
          style={{
            transform: `translateY(${
              props.normalData.length * tableOptions.rowHeight
            }px)`,
            width: `${allColumnsWidth.value}px`,
            position: "absolute",
            height: "1px",
          }}
        />
      </div>
    );
  },
});

export default TableBody;
