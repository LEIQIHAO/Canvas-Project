<template>
  <el-tag :style="tagStyle" class="v-tag" :type="tagType" :effect="tagEffect">
    {{ text }}
  </el-tag>
</template>

<script setup>
import { computed } from 'vue';
import { ElTag } from 'element-plus';

// 定义组件的 props
const props = defineProps({
  // 标签文本
  text: {
    type: String,
    required: false,
    default: '标签',
  },
  // 标签类型
  tagType: {
    type: String,
    default: '',
    validator: (value) => ['', 'success', 'info', 'warning', 'danger'].includes(value),
  },
  // 标签效果
  tagEffect: {
    type: String,
    default: 'light',
    validator: (value) => ['dark', 'light', 'plain'].includes(value),
  },
  // 组件完整信息，用于获取样式
  element: {
    type: Object,
    required: false,
  },
});

// 计算标签样式
const tagStyle = computed(() => {
  // 获取完整样式对象，如果 element 存在
  const style = props.element?.style || {};
  // 提取与标签相关的样式
  return {
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
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };
});
</script>

<style scoped>
.v-tag {
  box-sizing: border-box;
}
</style>
