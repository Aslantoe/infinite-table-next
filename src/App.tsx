import { defineComponent, ref } from "vue";

export default defineComponent({
  setup() {
    const count = ref(0);
    const handleIncrease = () => {
      count.value++;
    };

    return () => (
      <div
        style={{ padding: 10, backgroundColor: "#cef", textAlign: "center" }}
      >
        <h1>This is Parent</h1>
        <button onClick={handleIncrease}>Count++</button>
        <p>Parent count is: {count.value}</p>
      </div>
    );
  },
});
