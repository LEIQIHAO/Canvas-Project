<template>
  <!-- 双击文本元素可进入编辑模式 -->
  <div class="v-text-container">
    <!-- 文本显示模式 -->
    <div
      v-if="!isEditing"
      :style="textStyle"
      class="v-text-inner"
      title="双击编辑文本内容"
      @dblclick.stop="startEditing"
    >
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
import { computed, ref, nextTick, onMounted, watch } from 'vue';
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

// 检查是否是新创建的组件
let isNewlyCreated = false;
// 是否是双击创建的组件（内容为空）
let isEmptyCreated = false;

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

  return '';
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
    verticalAlign: style.verticalAlign || 'middle',
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
  backgroundColor: 'transparent', // 设置为透明背景
  zIndex: 1000,
  resize: 'none',
};

// 开始编辑
const startEditing = () => {
  isEditing.value = true;

  // 记录原始内容用于调试
  console.log('开始编辑，displayContent:', displayContent.value);
  console.log('开始编辑，props.element.props.content:', props.element?.props?.content);
  console.log('是否新创建组件:', isNewlyCreated);
  console.log('是否空内容创建:', isEmptyCreated);

  // 如果是新创建的空内容组件，不强制修改内容为空字符串
  editableContent.value = displayContent.value;

  // 使用nextTick确保DOM更新后才获取焦点
  nextTick(() => {
    if (editRef.value) {
      editRef.value.focus();

      // 将光标移动到文本末尾而不是选中全部文本
      const textLength = editableContent.value.length;
      editRef.value.setSelectionRange(textLength, textLength);
    }
  });
};

// 实时同步文本内容到store
watch(
  editableContent,
  (newContent) => {
    if (isEditing.value && props.element?.id) {
      // 实时更新组件属性
      canvasStore.updateComponentProps(props.element.id, { content: newContent });
    }
  },
  { immediate: false }
);

// 保存内容
const saveContent = () => {
  if (!isEditing.value) return;

  // 立即关闭编辑模式，不产生延迟感
  isEditing.value = false;

  // 只有当组件是双击创建的空内容组件，且用户没有输入内容时才删除
  if (
    isEmptyCreated &&
    props.element?.id &&
    (!editableContent.value || editableContent.value.trim() === '')
  ) {
    console.log('双击创建的VText内容为空，删除组件');
    // 使用正确的方法删除组件
    canvasStore.deleteComponentById(props.element.id);
    return;
  }

  // 重置标记
  isNewlyCreated = false;
  isEmptyCreated = false;

  // 不需要再次更新内容，因为已经通过watch实时更新了
};

// 取消编辑
const cancelEditing = () => {
  isEditing.value = false;

  // 只有当组件是双击创建的空内容组件，且用户没有输入内容时才删除
  if (
    isEmptyCreated &&
    props.element?.id &&
    (!editableContent.value || editableContent.value.trim() === '')
  ) {
    console.log('双击创建的VText取消编辑且内容为空，删除组件');
    // 使用正确的方法删除组件
    canvasStore.deleteComponentById(props.element.id);
  }

  // 重置标记
  isNewlyCreated = false;
  isEmptyCreated = false;
};

// 监听组件创建时的选中状态，如果是新创建且被选中的组件，自动进入编辑模式
watch(
  () => props.element?.id,
  (newId, oldId) => {
    if (newId && !oldId) {
      console.log('新创建的VText组件:', props.element);
      console.log('VText组件props:', props.element?.props);
      console.log('主选中组件:', canvasStore.primarySelectedComponent);

      isNewlyCreated = true; // 标记为新创建的组件

      // 检查是否是双击创建的空内容VText
      if (props.element?.props?.content === '') {
        isEmptyCreated = true;
      }

      if (canvasStore.primarySelectedComponent?.id === newId) {
        // 组件刚创建并被选中，立即进入编辑模式，不使用延迟
        console.log('立即进入编辑模式');
        startEditing();
      }
    }
  },
  { immediate: true }
);

// 监听失焦事件，确保编辑状态及时关闭
watch(
  () => canvasStore.primarySelectedComponent?.id,
  (newId) => {
    // 如果当前组件不再是主选中组件，并且正在编辑，则立即保存并退出编辑
    if (isEditing.value && props.element?.id !== newId) {
      saveContent();
    }
  }
);
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
  vertical-align: inherit; /* 继承父元素的垂直对齐方式 */
  user-select: none; /* 防止文本选择 */
  white-space: pre-wrap; /* 尊重空格并换行文本 */
  word-wrap: break-word; /* 打断长词 */
  box-sizing: border-box; /* 将内边距计入尺寸 */
  cursor: text; /* 显示文本编辑光标，提示可编辑 */
}

/* 编辑模式的文本区域样式 */
.v-text-editor {
  font-family: inherit;
  white-space: pre-wrap;
  word-wrap: break-word;
  box-sizing: border-box;
  user-select: text;
  padding: inherit;
  vertical-align: inherit; /* 继承垂直对齐方式 */
  text-align: inherit; /* 继承水平对齐方式 */
}
</style>
