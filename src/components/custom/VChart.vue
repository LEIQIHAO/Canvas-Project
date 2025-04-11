<template>
  <div class="v-chart">
    <div class="chart-placeholder">
      <div class="chart-icon">📊</div>
      <div class="chart-text">图表组件</div>
      <div class="chart-note">实际使用需要安装echarts和vue-echarts</div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  // 图表配置
  propValue: {
    type: Object,
    default: () => ({}),
  },
  element: {
    type: Object,
    required: false,
  },
});

// 实际项目中，这里会使用echarts渲染图表
// 本实现仅提供一个占位符，完整实现请参考visual-drag-demo
</script>

<style scoped>
.v-chart {
  width: 100%;
  height: 100%;
  background-color: #f5f7fa;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.chart-placeholder {
  text-align: center;
  color: #909399;
}

.chart-icon {
  font-size: 28px;
  margin-bottom: 8px;
}

.chart-text {
  font-size: 16px;
  margin-bottom: 4px;
}

.chart-note {
  font-size: 12px;
  color: #c0c4cc;
}
</style>
