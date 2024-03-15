import { defineComponent, ref } from "vue";

export default defineComponent({
  setup() {
    const count = ref(0);
    const handleIncrease = () => {
      count.value++;
    };

    const handleKeyEvent = (e) => {
      console.log(111, e);
      
    }

    return () => (
      <div
        style={{ backgroundColor: "#cef", textAlign: "center" }}

        onkeydown={(evt: KeyboardEvent) => handleKeyEvent(evt)}
      >
        <h1>This is Parent</h1>
        <button onClick={handleIncrease}>Count++</button>
        <p>Parent count is: {count.value}</p>
      </div>
    );
  },
});
