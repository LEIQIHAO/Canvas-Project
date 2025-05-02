<template>
  <div :style="lineStyle" class="line-shape" />
</template>

<script setup>
import { computed } from 'vue';

// 定义组件的 props
const props = defineProps({
  // 组件完整信息，用于获取样式
  element: {
    type: Object,
    required: false,
  },
});

// 计算线条样式
const lineStyle = computed(() => {
  // 获取完整样式对象，如果 element 存在
  const style = props.element?.style || {};
  // 返回线条样式
  return {
    width: '100%',

    backgroundColor: style.backgroundColor || '#000',
  };
});
</script>

<style scoped>
.line-shape {
  box-sizing: border-box;
}
</style>
