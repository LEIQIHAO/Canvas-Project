<script setup>
import { useCounterStore } from '../stores/counter';
import DataFetcher from '../components/DataFetcher.vue';

const counterStore = useCounterStore();
</script>

<template>
  <div class="home">
    <h1>Home页面</h1>
    <div class="counter">
      <p>当前计数: {{ counterStore.count }}</p>
      <p>双倍计数: {{ counterStore.doubleCount }}</p>
      <button @click="counterStore.increment()">增加</button>
    </div>
    <DataFetcher />
    <div class="navigation">
      <router-link to="/about"> 前往About页面 </router-link>
    </div>
  </div>
</template>

<style scoped>
.home {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  text-align: center;
}
.counter {
  margin: 2rem 0;
  padding: 1rem;
  background-color: #f5f5f5;
  border-radius: 8px;
}
button {
  padding: 0.5rem 1rem;
  background-color: #42b883;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
}
button:hover {
  background-color: #369e6c;
}
</style>
