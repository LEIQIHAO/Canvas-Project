<template>
  <div :style="buttonStyles" class="v-button" @click.stop @mousedown.stop>
    {{ text }}
  </div>
</template>

<script setup>
import { computed } from 'vue';

// 定义组件的 props
const props = defineProps({
  // 按钮文本
  text: {
    type: String,
    required: true,
    default: '按钮',
  },
  // 组件完整信息，用于获取样式
  element: {
    type: Object,
    required: false,
  },
});

// 计算按钮样式
const buttonStyles = computed(() => {
  // 获取完整样式对象，如果 element 存在
  const style = props.element?.style || {};

  // 提取与按钮相关的样式
  return {
    // 尺寸与位置
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: '0',
    left: '0',
    right: '0',
    bottom: '0',

    // 文本样式
    fontSize: style.fontSize || '20px',
    fontWeight: style.fontWeight || '500',
    lineHeight: style.lineHeight || 'normal',
    letterSpacing: style.letterSpacing || 'normal',
    textAlign: style.textAlign || 'center',
    color: style.color || '#333',
    whiteSpace: 'nowrap',

    // 边框与背景
    borderWidth: style.borderWidth || '1px',
    borderStyle: style.borderStyle || 'solid',
    borderColor: style.borderColor || '#e0e0e0',
    borderRadius: style.borderRadius || '5%',
    backgroundColor: style.backgroundColor || '#fff',

    // 布局
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0',
    margin: '0',
    boxSizing: 'border-box',
    overflow: 'hidden',

    // 交互
    cursor: 'pointer',
    userSelect: 'none',
    pointerEvents: 'auto',
    appearance: 'none',
    outline: '0',
    transition: 'all 0.2s',
  };
});
</script>

<style scoped>
.v-button {
  all: unset;
  box-sizing: border-box;
  display: flex !important;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  cursor: pointer !important;
  pointer-events: auto !important;
}

.v-button:active {
  color: #3a8ee6 !important;
  border-color: #3a8ee6 !important;
}

.v-button:hover {
  background-color: skyblue !important;
  color: white !important;
  cursor: pointer !important;
  z-index: 10 !important;
}
</style>
