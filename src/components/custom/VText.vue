<template>
  <!-- 双击文本元素可进入编辑模式 -->
  <div class="v-text-container">
    <!-- 文本显示模式 -->
    <div v-if="!isEditing" :style="textStyle" class="v-text-inner" @dblclick.stop="startEditing">
      {{ displayContent }}
    </div>

    <!-- 编辑模式 -->
    <textarea
      v-if="isEditing"
      ref="editRef"
      v-model="editableContent"
      :style="[textStyle, editStyle]"
      class="v-text-editor"
      @blur="saveContent"
      @keydown.enter="saveContent"
      @keydown.esc="cancelEditing"
      @click.stop
      @dblclick.stop
    />
  </div>
</template>

<script setup>
import { computed, ref, nextTick } from 'vue';
import { useCanvasStore } from '@/stores/canvas';

// 获取画布store
const canvasStore = useCanvasStore();

// 定义组件的 props
const props = defineProps({
  // 文本内容
  content: {
    type: String,
    required: false,
    default: '',
  },
  // 组件完整信息，用于获取样式
  element: {
    type: Object,
    required: false,
  },
});

// 编辑状态和编辑内容
const isEditing = ref(false);
const editableContent = ref('');
const editRef = ref(null);

// 显示的内容，优先使用直接传入的content，否则从element中获取
const displayContent = computed(() => {
  if (props.content) {
    return props.content;
  } else if (props.element?.props?.content) {
    return props.element.props.content;
  }

  return '文字';
});

// 计算文本样式
const textStyle = computed(() => {
  const style = props.element?.style || {};

  return {
    fontSize: style.fontSize || '14px',
    fontWeight: style.fontWeight || 'normal',
    lineHeight: style.lineHeight || '1.5',
    letterSpacing: style.letterSpacing || 'normal',
    textAlign: style.textAlign || 'left',
    color: style.color || '#000000',
    padding: style.padding || '5px',
  };
});

// 额外的编辑框样式
const editStyle = {
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  outline: 'none',
  border: '1px dashed #409EFF',
  backgroundColor: '#fff',
  zIndex: 1000,
  resize: 'none',
};

// 开始编辑
const startEditing = () => {
  isEditing.value = true;
  editableContent.value = displayContent.value;

  nextTick(() => {
    if (editRef.value) {
      editRef.value.focus();
      editRef.value.select();
    }
  });
};

// 保存内容
const saveContent = () => {
  if (!isEditing.value) return;
  isEditing.value = false;

  if (props.element && props.element.id) {
    const componentId = props.element.id;
    const newContent = editableContent.value;

    canvasStore.updateComponentProps(componentId, { content: newContent });
  }
};

// 取消编辑
const cancelEditing = () => {
  isEditing.value = false;
};
</script>

<style scoped>
.v-text-container {
  position: relative;
  width: 100%;
  height: 100%;
}

.v-text-inner {
  /* 确保内部 div 行为正确 */
  width: 100%;
  height: 100%;
  display: table-cell; /* 用于垂直居中 */
  vertical-align: middle; /* 默认垂直对齐 */
  user-select: none; /* 防止文本选择 */
  white-space: pre-wrap; /* 尊重空格并换行文本 */
  word-wrap: break-word; /* 打断长词 */
  box-sizing: border-box; /* 将内边距计入尺寸 */
}

/* 编辑模式的文本区域样式 */
.v-text-editor {
  font-family: inherit;
  white-space: pre-wrap;
  word-wrap: break-word;
  box-sizing: border-box;
  user-select: text;
  padding: inherit;
}
</style>
