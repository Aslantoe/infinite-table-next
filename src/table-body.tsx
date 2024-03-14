import Vue, { VNode, defineComponent, ref, inject, onMounted, onBeforeUnmount, watch } from 'vue';
import {
  tableOptionsInjectKey, tableStoreInjectKey, RowItemType, TableOptions,
} from '@/common/types';
import useTableStore from '@/table-store';
import useTableData from './hooks/useTableDataHooks';
import TableRow from './table-row';
import RangeRender from './render/range-render.vue';
import emitter from './event-emitter';
import useTableColumn from './hooks/useTbaleColumnHooks';

const TableBody = defineComponent({

  setup(props, { attrs }) {
    // let tableStore: any = inject(tableStoreInjectKey)
    
    
    const tableOptions: any = inject(tableOptionsInjectKey)
    
    const { layoutSize } = useTableStore(tableOptions)
    const { fixedData, normalData } = useTableData()
    const { allColumnsWidth } = useTableColumn()

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


  const handleScroll = () => {
    changeOffsetIndex();
    emitter.emit('hide-tooltip');
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
        data={normalData.value}
        direction="vertical"
        size={tableOptions.rowHeight}
        data-key={tableOptions.rowKey}
        viewport-size={layoutSize.value.viewportHeight - fixedData.length * tableOptions.rowHeight}
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
                    index={index + fixedData.length}
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
  }

  
    return (
      <div
        ref="tableBody"
        class="infinite-table__body"
        style={{
          height: `${layoutSize.value.viewportHeight}px`,
          'transform-style': fixedData.length >= 0 ? 'preserve-3d' : 'initial',
        }}
        {...attrs}
      >
        {fixedData.length > 0 && renderFixedRow()}
        {renderNormalRows()}
        <div
          style={{
            transform: `translateY(${normalData.value.length * tableOptions.rowHeight}px)`,
            width: `${allColumnsWidth.value}px`,
            position: 'absolute',
            height: '1px',
          }}
        />
      </div>
    );
  }

})

export default TableBody
