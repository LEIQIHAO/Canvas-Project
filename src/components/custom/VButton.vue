<template>
  <el-button :style="buttonStyle" class="v-button">
    {{ text }}
  </el-button>
</template>

<script setup>
import { computed } from 'vue';
import { ElButton } from 'element-plus';

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
const buttonStyle = computed(() => {
  // 获取完整样式对象，如果 element 存在
  const style = props.element?.style || {};
  // 提取与按钮相关的样式
  return {
    width: '100%',
    height: '100%',
    fontSize: style.fontSize,
    fontWeight: style.fontWeight,
    lineHeight: style.lineHeight,
    letterSpacing: style.letterSpacing,
    textAlign: style.textAlign,
    color: style.color,
    borderWidth: style.borderWidth,
    borderColor: style.borderColor,
    borderRadius: style.borderRadius,
    backgroundColor: style.backgroundColor,
  };
});
</script>

<style scoped>
.v-button {
  display: block;
  box-sizing: border-box;
}
</style>
