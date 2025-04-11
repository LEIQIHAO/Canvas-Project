<template>
  <div class="circle-shape-container">
    <div :style="circleStyle" class="circle-shape">
      <!-- 圆形可以包含内容（如果有），使用 v-html 以支持 HTML 内容 -->
      <div v-if="propValue" class="circle-content" v-html="propValue" />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

// 定义组件的 props
const props = defineProps({
  // 圆形内部内容（HTML）
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

// 计算圆形样式
const circleStyle = computed(() => {
  // 获取完整样式对象，如果 element 存在
  const style = props.element?.style || {};

  // 处理边框宽度：确保是数字并且不会过粗
  const borderWidth = style.borderWidth !== undefined ? parseInt(style.borderWidth) : 1;

  // 构建基本样式
  const baseStyle = {
    width: '100%',
    height: '100%',
    borderRadius: '50%', // 圆形关键样式
    backgroundColor: style.backgroundColor || '',
    fontSize: style.fontSize || '14px',
    fontWeight: style.fontWeight || 'normal',
    lineHeight: style.lineHeight || 'normal',
    letterSpacing: style.letterSpacing || 'normal',
    textAlign: style.textAlign || 'center',
    color: style.color || '',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    // 清晰设置边框属性
    borderWidth: `${borderWidth}px`,
    borderStyle: style.borderStyle || 'solid',
    borderColor: style.borderColor || '#000',
    boxSizing: 'border-box',
  };

  return baseStyle;
});
</script>

<style scoped>
.circle-shape-container {
  width: 100%;
  height: 100%;
  position: relative;
  box-sizing: border-box;
  display: flex;
  justify-content: center;
  align-items: center;
}

.circle-shape {
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  position: relative;
}

.circle-content {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  user-select: none;
  position: relative;
  z-index: 1;
}
</style>
