import Vue, { VNode, defineComponent, ref, inject, onMounted, onBeforeUnmount, watch } from 'vue';
import {
  tableOptionsInjectKey, tableStoreInjectKey, RowItemType, TableOptions,
} from '@/common/types';
import TableStore from '@/table-store';
import TableRow from './table-row';
import RangeRender from './render/range-render.vue';

const TableBody = defineComponent({

  setup(props) {

    let tableStore: any = inject(tableStoreInjectKey)
    
    const tableOptions: any = inject(tableOptionsInjectKey)
    
    const tableBody = ref<HTMLElement>()

    let scroll: HTMLElement
    let grid = { offsetX: 0, offsetY: 0 };

    onMounted(() => {
      scroll = getScrollElement();
      scroll.addEventListener('scroll', handleScroll);
      handleScroll();
    }) 
    
    
    onBeforeUnmount(() => {
      scroll.removeEventListener('scroll', handleScroll);
    }) 


  const tableBodyListeners = (): Record<string, Function | Function[]> => {
    return {
      ...$listeners,
    };
  }


  const handleScroll = () => {
    changeOffsetIndex();
    tableStore.$emit('hide-tooltip');
  }

  const changeOffsetIndex = () => {
    const { scrollTop, scrollLeft } = scroll;
    grid.offsetX = scrollLeft;
    grid.offsetY = scrollTop;
  }

  const getScrollElement = (): HTMLElement => {
    return $el.closest('.infinite-table--scrollable') as HTMLElement;
  }

  
  // watch(data, () => {
  //   handleScroll();
  // });

   const renderNormalRows = () => {
    return (
      <RangeRender
        data={tableStore.normalData}
        direction="vertical"
        size={tableOptions.rowHeight}
        data-key={tableOptions.rowKey}
        viewport-size={tableStore.layoutSize.viewportHeight - tableStore.fixedData.length * tableOptions.rowHeight}
        offset={grid.offsetY}
        trail-size={2}
        leading-size={2}
        {
          ...{
            scopedSlots: {
              default: (slotProps: { data: RowItemType, index: number }) => {
                const { data, index } = slotProps;
                return (
                  <TableRow
                    index={index + tableStore.fixedData.length}
                    offset-x={grid.offsetX}
                    data={data}
                  />
                );
              },
            },
          }
        }
      />
    );
  }

  const renderFixedRow = () => {
    return (
      <div
        style={{
          position: 'relative',
          transform: `translate3d(0, ${grid.offsetY}px, 1px)`,
        }}
      >
        {
          tableStore.fixedData.map((rowData, index) => (
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
  }

  
    return (
      <div
        ref="tableBody"
        class="infinite-table__body"
        style={{
          height: `${tableStore.layoutSize.viewportHeight}px`,
          'transform-style': tableStore.fixedData.length >= 0 ? 'preserve-3d' : 'initial',
        }}
        {
          ...{
            on: tableBodyListeners,
          }
        }
      >
        {tableStore.fixedData.length > 0 && renderFixedRow()}
        {renderNormalRows()}
        <div
          style={{
            transform: `translateY(${tableStore.normalData.length * tableOptions.rowHeight}px)`,
            width: `${tableStore.allColumnsWidth}px`,
            position: 'absolute',
            height: '1px',
          }}
        />
      </div>
    );
  }

})

export default TableBody
