<script lang="tsx">
import {
  defineComponent,
  ref,
  onMounted,
  onBeforeUnmount,
  nextTick,
} from "vue";
import { portal } from "./utils/directives";
import { isEmpty } from "./utils/object";
import { createPopper } from "@popperjs/core/lib/popper-lite";
import arrow from "@popperjs/core/lib/modifiers/arrow";
import preventOverflow from "@popperjs/core/lib/modifiers/preventOverflow";
import flip from "@popperjs/core/lib/modifiers/flip";
import { eventBus } from "./eventBus";
export default defineComponent({
  name: "TooltipRender",
  directives: {
    portal,
  },
  setup() {
    const popperRef = ref();
    const tooltipVisible = ref<Boolean>(false);
    const _tooltipVnode = ref();
    const _tooltipWrapperClass = ref();
    const _tooltip = ref();

    onMounted(() => {
      eventBus.on("hide-tooltip", () => {
        handleHideTooltip();
      });
      eventBus.on("show-tooltip", (data) => {
        console.log(11111, data);
        const { element, textVNode, wrapperClass } = data;
        handleShowTooltip(element, textVNode, wrapperClass );
      });
    });

    onBeforeUnmount(() => {
      handleHideTooltip();
    });

    const handleShowTooltip = (
      element: HTMLElement,
      textVNode,
      wrapperClass: Record<string, boolean>
    ) => {
      if (element instanceof HTMLElement) {
        // tooltip 遇到textContent为空的情况会报错
        if (!isEmpty(textVNode)) {
          _tooltipVnode.value = textVNode;
          _tooltipWrapperClass.value = wrapperClass;
          tooltipVisible.value = true;
          nextTick(() => {
            _tooltip.value = createPopper(element, popperRef.value, {
              placement: "top",
              modifiers: [arrow, preventOverflow, flip],
            });
          });
        }
      }
    };

    const handleHideTooltip = () => {
      tooltipVisible.value = false;
      if (_tooltip) {
        // _tooltip.value.destroy();
        _tooltip.value = undefined;
      }
    };

    return () =>
      tooltipVisible.value && (
        <div
          v-portal
          ref="popper"
          class={["infinite-table__tooltip", _tooltipWrapperClass.value]}
          role="tooltip"
        >
          {_tooltipVnode.value}
          <div class="tooltip-arrow" data-popper-arrow="true" />
        </div>
      );
  },
});
</script>
