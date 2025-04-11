<template>
  <div class="rect-shape">
    <!-- 这里我们需要使用VText组件来显示内容，而不是直接在矩形上设置样式 -->
  </div>
</template>

<script setup>
import { computed } from 'vue';

// 定义组件的 props
const props = defineProps({
  // 矩形内部内容（HTML）
  propValue: {
    type: String,
    default: '',
  },
  // 组件完整信息，用于获取样式
  element: {
    type: Object,
    required: false,
  },
});

// 注意：visual-drag-demo中，RectShape只是一个容器
// 所有样式应该在编辑器的画布层级设置，而不是在组件内部设置
</script>

<style scoped>
.rect-shape {
  width: 100%;
  height: 100%;
  overflow: auto;
}
</style>
