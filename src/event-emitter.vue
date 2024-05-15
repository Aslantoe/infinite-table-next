<script lang="tsx">
import { ComponentPublicInstance, defineComponent } from 'vue';

export default defineComponent({
  methods: {
    notify(componentName: string, eventName: string, ...params: unknown[]) {
      let parent = (this.$parent || this.$root) as ComponentPublicInstance;
      let { name } = parent.$options;

      while (parent && (!name || name !== componentName)) {
        parent = parent.$parent as ComponentPublicInstance;

        if (parent) {
          name = parent.$options.name;
        }
      }
      if (parent) {
        parent.$emit.apply(parent, [eventName, ...params]);
      }
    }
  }
});
</script>
