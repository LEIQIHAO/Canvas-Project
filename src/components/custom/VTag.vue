<template>
  <div class="v-tag-container">
    <!-- 显示模式 -->
    <div
      v-if="!isEditing"
      :style="tagStyle"
      class="v-tag"
      :class="[`el-tag--${tagType}`, `el-tag--${tagEffect}`]"
      title="双击编辑标签文本"
      @mousedown.stop
      @dblclick.stop="startEditing"
    >
      {{ displayText }}
    </div>

    <!-- 编辑模式 -->
    <textarea
      v-if="isEditing"
      ref="editRef"
      v-model="editableText"
      :style="[tagStyle, editStyle]"
      class="v-tag-editor"
      @blur="saveContent"
      @keydown.enter="saveContent"
      @keydown.esc="cancelEditing"
      @click.stop
      @dblclick.stop
    />
  </div>
</template>

<script setup>
import { computed, ref, nextTick, watch } from 'vue';
import { useCanvasStore } from '@/stores/canvas';

// 获取画布store
const canvasStore = useCanvasStore();

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

// 编辑状态和编辑内容
const isEditing = ref(false);
const editableText = ref('');
const editRef = ref(null);

// 显示的文本，优先使用props中的text，否则从element中获取
const displayText = computed(() => {
  if (props.element?.props?.text) {
    return props.element.props.text;
  } else if (props.text) {
    return props.text;
  }
  return '标签';
});

// 计算标签样式
const tagStyle = computed(() => {
  // 获取完整样式对象，如果 element 存在
  const style = props.element?.style || {};
  // 提取与标签相关的样式
  return {
    fontSize: style.fontSize || '20px',
    fontWeight: style.fontWeight || 'normal',
    lineHeight: style.lineHeight || '1.5',
    letterSpacing: style.letterSpacing || 'normal',
    textAlign: style.textAlign || 'center',
    color: style.color || '',
    borderWidth: style.borderWidth || '1px',
    borderColor: style.borderColor || '',
    borderRadius: style.borderRadius || '4px',
    backgroundColor: style.backgroundColor || '',
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0',
    margin: '0',
    boxSizing: 'border-box',
    userSelect: 'none',
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
  backgroundColor: 'rgba(255, 255, 255, 0.9)',
  zIndex: 1000,
  resize: 'none',
};

// 开始编辑
const startEditing = () => {
  console.log('开始编辑VTag文本');
  isEditing.value = true;
  editableText.value = displayText.value;

  // 使用nextTick确保DOM更新后才获取焦点
  nextTick(() => {
    if (editRef.value) {
      editRef.value.focus();
      // 将光标移动到文本末尾
      const textLength = editableText.value.length;
      editRef.value.setSelectionRange(textLength, textLength);
    }
  });
};

// 实时同步文本内容到store
watch(
  editableText,
  (newText) => {
    if (isEditing.value && props.element?.id) {
      // 实时更新组件属性
      canvasStore.updateComponentProps(props.element.id, { text: newText });
    }
  },
  { immediate: false }
);

// 添加对外部props变化的监听
watch(
  () => props.element?.props?.text,
  (newText) => {
    if (newText !== undefined && !isEditing.value) {
      // 如果文本从外部更新，并且当前不在编辑模式下，则更新显示文本
      if (props.element?.id) {
        // 确保画布上的组件与当前显示同步
        canvasStore.updateComponentProps(props.element.id, { text: newText });
      }
    }
  },
  { immediate: true }
);

// 保存内容
const saveContent = () => {
  if (!isEditing.value) return;
  isEditing.value = false;
  // 不需要再次更新内容，因为已经通过watch实时更新了
};

// 取消编辑
const cancelEditing = () => {
  isEditing.value = false;
};

// 监听组件创建时的选中状态，如果是新创建且被选中的组件，自动进入编辑模式
watch(
  () => props.element?.id,
  (newId, oldId) => {
    if (newId && !oldId && canvasStore.primarySelectedComponent?.id === newId) {
      // 组件刚创建并被选中，立即进入编辑模式
      startEditing();
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
.v-tag-container {
  position: relative;
  width: 100%;
  height: 100%;
}

.v-tag {
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: pointer;
}

/* 编辑模式的文本区域样式 */
.v-tag-editor {
  font-family: inherit;
  text-align: center;
  white-space: pre-wrap;
  word-wrap: break-word;
  box-sizing: border-box;
  user-select: text;
  padding: inherit;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 模拟Element Plus标签样式的类 */
.el-tag--light {
  background-color: #ecf5ff;
  color: #409eff;
  border-color: #d9ecff;
}

.el-tag--dark {
  background-color: #409eff;
  color: #ffffff;
  border-color: #409eff;
}

.el-tag--plain {
  background-color: transparent;
  color: #409eff;
  border-color: #409eff;
}

.el-tag--success {
  background-color: #f0f9eb;
  color: #67c23a;
  border-color: #e1f3d8;
}

.el-tag--info {
  background-color: #f4f4f5;
  color: #909399;
  border-color: #e9e9eb;
}

.el-tag--warning {
  background-color: #fdf6ec;
  color: #e6a23c;
  border-color: #faecd8;
}

.el-tag--danger {
  background-color: #fef0f0;
  color: #f56c6c;
  border-color: #fde2e2;
}
</style>
