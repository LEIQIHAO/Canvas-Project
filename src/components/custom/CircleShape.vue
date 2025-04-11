<template>
  <div :style="circleStyle" class="circle-shape">
    <!-- 圆形可以包含内容（如果有），使用 v-html 以支持 HTML 内容 -->
    <div v-if="propValue" class="circle-content" v-html="propValue" />
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
  // 返回圆形样式
  return {
    width: '100%',
    height: '100%',
    borderRadius: '50%', // 圆形关键样式
    backgroundColor: style.backgroundColor || '',
    borderWidth: style.borderWidth,
    borderStyle: style.borderStyle || 'solid',
    borderColor: style.borderColor || '#000',
    fontSize: style.fontSize,
    fontWeight: style.fontWeight,
    lineHeight: style.lineHeight,
    letterSpacing: style.letterSpacing,
    textAlign: style.textAlign,
    color: style.color,
    display: props.propValue ? 'flex' : 'block', // 如果有内容，使用 flex 布局
    justifyContent: 'center',
    alignItems: 'center',
  };
});
</script>

<style scoped>
.circle-shape {
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
}
</style>
