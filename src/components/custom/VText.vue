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
      v-html="displayContent"
    />

    <!-- 富文本编辑模式：弹窗形式 -->
    <div v-if="isEditing" class="v-text-editor-modal" @mousedown.self="cancelEditing">
      <div class="editor-modal-content" @mousedown.stop>
        <div class="editor-modal-header">
          <h3>编辑文本</h3>
        </div>

        <div class="editor-toolbar">
          <!-- 字体选择 -->
          <div class="toolbar-group font-family-selector">
            <span class="toolbar-label">字体:</span>
            <select
              :value="currentFontFamily"
              :disabled="!hasSelection"
              @change="setFontFamily"
              @mousedown.stop
            >
              <option value="Arial, sans-serif">Arial</option>
              <option value="'Microsoft YaHei', sans-serif">微软雅黑</option>
              <option value="'SimSun', serif">宋体</option>
              <option value="'SimHei', sans-serif">黑体</option>
              <option value="'KaiTi', serif">楷体</option>
              <option value="'Helvetica', sans-serif">Helvetica</option>
              <option value="'Times New Roman', serif">Times New Roman</option>
            </select>
          </div>

          <!-- 字号选择 -->
          <div class="toolbar-group font-size-selector">
            <span class="toolbar-label">字号:</span>
            <select
              :value="currentFontSize"
              :disabled="!hasSelection"
              @change="setFontSize"
              @mousedown.stop
            >
              <option value="12px">12px</option>
              <option value="14px">14px (默认)</option>
              <option value="16px">16px</option>
              <option value="18px">18px</option>
              <option value="20px">20px</option>
              <option value="24px">24px</option>
              <option value="28px">28px</option>
              <option value="32px">32px</option>
              <option value="36px">36px</option>
              <option value="48px">48px</option>
              <option value="64px">64px</option>
            </select>
          </div>

          <!-- BIUS工具栏 -->
          <div class="toolbar-group bius-group">
            <span class="toolbar-label">格式:</span>
            <button
              class="toolbar-btn"
              :class="{ active: isBoldActive }"
              title="加粗"
              :disabled="!hasSelection"
              @mousedown.stop="execCommand('bold')"
            >
              <b>B</b>
            </button>
            <button
              class="toolbar-btn"
              :class="{ active: isItalicActive }"
              title="斜体"
              :disabled="!hasSelection"
              @mousedown.stop="execCommand('italic')"
            >
              <i>I</i>
            </button>
            <button
              class="toolbar-btn"
              :class="{ active: isUnderlineActive }"
              title="下划线"
              :disabled="!hasSelection"
              @mousedown.stop="execCommand('underline')"
            >
              <u>U</u>
            </button>
            <button
              class="toolbar-btn"
              :class="{ active: isStrikeThroughActive }"
              title="删除线"
              :disabled="!hasSelection"
              @mousedown.stop="execCommand('strikeThrough')"
            >
              <span style="text-decoration: line-through">S</span>
            </button>
          </div>

          <!-- 颜色选择工具 -->
          <div class="toolbar-group color-group">
            <div class="color-picker-wrapper">
              <span class="toolbar-label">文本颜色:</span>
              <div
                ref="foreColorPreviewRef"
                class="color-preview"
                :style="{ backgroundColor: currentTextColor }"
              />
              <input
                type="color"
                :value="currentTextColor"
                title="文字颜色"
                class="color-picker"
                @change="setForeColor"
                @mousedown.stop
              />
            </div>
          </div>

          <div class="toolbar-group bgcolor-group">
            <div class="color-picker-wrapper">
              <span class="toolbar-label">背景色:</span>
              <div
                ref="bgColorPreviewRef"
                class="color-preview"
                :style="{ backgroundColor: currentBgColor }"
              />
              <input
                type="color"
                :value="currentBgColor"
                title="背景颜色"
                class="color-picker"
                @change="setBackColor"
                @mousedown.stop
              />
            </div>
          </div>
        </div>

        <!-- 可编辑区域 -->
        <div
          ref="editRef"
          class="rich-editor"
          :style="editableTextStyle"
          contenteditable="true"
          @keydown.esc="cancelEditing"
          @keydown.ctrl.enter="saveContent"
          @mousedown.stop
          @dblclick.stop
        />

        <!-- 底部操作按钮 -->
        <div class="editor-modal-footer">
          <div class="editor-modal-actions">
            <button class="modal-action-btn cancel" @mousedown.stop="cancelEditing">取消</button>
            <button class="modal-action-btn save" @mousedown.stop="saveContent">保存</button>
          </div>
        </div>
      </div>
    </div>
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
const editRef = ref(null);
// 添加文本选择状态
const hasSelection = ref(false);

// 当前样式状态
const currentTextColor = ref('#000000');
const currentBgColor = ref('#ffffff');
const currentFontFamily = ref('Arial, sans-serif');
const currentFontSize = ref('14px');

// BIUS 按钮激活状态 Refs
const isBoldActive = ref(false);
const isItalicActive = ref(false);
const isUnderlineActive = ref(false);
const isStrikeThroughActive = ref(false);

// Refs for preview divs
const foreColorPreviewRef = ref(null);
const bgColorPreviewRef = ref(null);

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
    fontFamily: style.fontFamily || 'Arial, sans-serif',
    fontSize: style.fontSize || '14px',
    fontWeight: style.fontWeight || 'normal',
    fontStyle: style.fontStyle || 'normal',
    textDecoration: style.textDecoration || 'none',
    lineHeight: style.lineHeight || '1.5',
    letterSpacing: style.letterSpacing || 'normal',
    textAlign: style.textAlign || 'left',
    color: style.color || '#000000',
    backgroundColor: style.backgroundColor || 'transparent',
    padding: style.padding || '5px',
    verticalAlign: style.verticalAlign || 'middle',
  };
});

// 编辑区域的样式
const editableTextStyle = computed(() => {
  return {
    ...textStyle.value,
    minHeight: '150px',
    maxHeight: '400px',
  };
});

// 初始化当前样式值
const initCurrentStyles = () => {
  const style = props.element?.style || {};
  currentTextColor.value = style.color || '#000000';
  currentBgColor.value = style.backgroundColor || '#ffffff';
  currentFontFamily.value = style.fontFamily || 'Arial, sans-serif';

  // 确保设置一个有效的字号值
  let fontSize = style.fontSize || '14px';
  // 检查字号是否是有效的选项
  const validFontSizes = [
    '12px',
    '14px',
    '16px',
    '18px',
    '20px',
    '24px',
    '28px',
    '32px',
    '36px',
    '48px',
    '64px',
  ];
  if (!validFontSizes.includes(fontSize)) {
    fontSize = '14px'; // 如果不是有效选项，回退到默认值
  }
  currentFontSize.value = fontSize;

  console.log('初始化字号:', currentFontSize.value);
};

// 开始编辑
const startEditing = () => {
  isEditing.value = true;

  // 先初始化样式状态，确保字体大小等属性设置正确
  initCurrentStyles();

  // 记录原始内容用于调试
  console.log('开始编辑，displayContent:', displayContent.value);
  console.log('开始编辑，props.element.props.content:', props.element?.props?.content);
  console.log('是否新创建组件:', isNewlyCreated);
  console.log('是否空内容创建:', isEmptyCreated);
  console.log('当前字号设置为:', currentFontSize.value);

  // 使用nextTick确保DOM更新后才获取焦点
  nextTick(() => {
    if (editRef.value) {
      // 设置初始内容
      editRef.value.innerHTML = displayContent.value;

      // --- 应用全局样式到编辑器容器 ---
      const globalStyle = props.element?.style || {};
      editRef.value.style.color = globalStyle.color || '#000000';
      editRef.value.style.backgroundColor = globalStyle.backgroundColor || 'transparent';
      // 同时更新颜色选择器的初始状态
      currentTextColor.value = globalStyle.color || '#000000';
      currentBgColor.value = globalStyle.backgroundColor || '#ffffff'; // 注意：背景色预览可能需要白色默认
      // --- End 应用全局样式 ---

      // 进行一些初始化命令，确保编辑环境正确设置
      try {
        // 确保使用CSS样式而不是老式HTML标签
        document.execCommand('styleWithCSS', false, true);
        // 禁用默认的文本处理
        document.execCommand('defaultParagraphSeparator', false, 'div');
      } catch (e) {
        console.error('初始化编辑命令失败:', e);
      }

      // 获取焦点
      editRef.value.focus();

      // 将光标移至末尾
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(editRef.value);
      range.collapse(false); // 折叠到末尾
      selection.removeAllRanges();
      selection.addRange(range);

      // 初始化选择状态
      hasSelection.value = false;

      // 添加选择监听
      document.addEventListener('selectionchange', checkSelection);
    }
  });
};

// 检查文本选择状态并更新按钮激活状态
const checkSelection = () => {
  if (isEditing.value && editRef.value) {
    const selection = window.getSelection();
    let selectionInEditor = false;
    let range = null; // Define range here

    if (selection.rangeCount > 0) {
      range = selection.getRangeAt(0);
      // 确保选区或光标在编辑器内部
      selectionInEditor = editRef.value.contains(range.commonAncestorContainer);
    }

    // 更新 hasSelection (仅在有实际文本被选中时为 true)
    hasSelection.value = selectionInEditor && selection.toString().length > 0;
    console.log('文本选择状态:', hasSelection.value);

    // --- 修改逻辑 ---
    // 只有在实际选中了文本时，才检查并更新按钮状态
    if (hasSelection.value) {
      try {
        isBoldActive.value = document.queryCommandState('bold');
        isItalicActive.value = document.queryCommandState('italic');
        isUnderlineActive.value = document.queryCommandState('underline');
        isStrikeThroughActive.value = document.queryCommandState('strikeThrough');
      } catch (e) {
        console.error('检查命令状态时出错:', e);
        // 出错时也重置
        isBoldActive.value = false;
        isItalicActive.value = false;
        isUnderlineActive.value = false;
        isStrikeThroughActive.value = false;
      }
    } else {
      // 如果没有选中文字（即使光标在里面），则强制按钮为非激活状态
      isBoldActive.value = false;
      isItalicActive.value = false;
      isUnderlineActive.value = false;
      isStrikeThroughActive.value = false;
    }
    // --- 结束修改 ---
  } else {
    // 不在编辑模式，也重置状态
    isBoldActive.value = false;
    isItalicActive.value = false;
    isUnderlineActive.value = false;
    isStrikeThroughActive.value = false;
  }
};

// 保存内容
const saveContent = () => {
  if (!isEditing.value) return;

  // 获取编辑区域的HTML内容
  const content = editRef.value ? editRef.value.innerHTML : '';

  // 立即关闭编辑模式，不产生延迟感
  isEditing.value = false;

  // 清除选择监听
  document.removeEventListener('selectionchange', checkSelection);

  // --- 更新全局样式和内容 ---
  if (props.element?.id) {
    // 1. 更新内容 (HTML 可能包含旧的 span 样式，但会被全局样式覆盖显示)
    canvasStore.updateComponentProps(props.element.id, { content });

    // 2. 更新全局样式 (使用颜色选择器的当前值)
    const newStyle = {
      color: currentTextColor.value,
      backgroundColor: currentBgColor.value === '#ffffff' ? 'transparent' : currentBgColor.value, // 保存时，白色背景通常意味着透明
    };
    canvasStore.updateComponentStyle(props.element.id, newStyle);
    // 注意: 确保 canvasStore 有 updateComponentStyle 方法或 updateComponentProps 能处理 style 更新
    // 如果没有 updateComponentStyle, 可能需要这样:
    // canvasStore.updateComponentProps(props.element.id, { style: newStyle });

    console.log('保存内容和全局样式:', content, newStyle);
  }
  // --- End 更新全局样式和内容 ---

  // 只有当组件是双击创建的空内容组件，且用户没有输入内容时才删除
  if (isEmptyCreated && props.element?.id && (!content || content.trim() === '')) {
    console.log('双击创建的VText内容为空，删除组件');
    // 使用正确的方法删除组件
    canvasStore.deleteComponentById(props.element.id);
    return;
  }

  // 重置标记
  isNewlyCreated = false;
  isEmptyCreated = false;
};

// 取消编辑
const cancelEditing = () => {
  isEditing.value = false;

  // 清除选择监听
  document.removeEventListener('selectionchange', checkSelection);

  // 获取编辑区域的内容
  const content = editRef.value ? editRef.value.innerHTML : '';

  // 只有当组件是双击创建的空内容组件，且用户没有输入内容时才删除
  if (isEmptyCreated && props.element?.id && (!content || content.trim() === '')) {
    console.log('双击创建的VText取消编辑且内容为空，删除组件');
    // 使用正确的方法删除组件
    canvasStore.deleteComponentById(props.element.id);
  }

  // 重置标记
  isNewlyCreated = false;
  isEmptyCreated = false;
};

// 执行富文本命令
const execCommand = (command, value = null) => {
  // 检查是否有文本被选中
  if (hasSelection.value) {
    // 有文本被选中，直接执行命令
    document.execCommand(command, false, value);
    // --- 添加调用 ---
    // 执行命令后，立即检查并更新按钮状态
    checkSelection();
    // --- 结束添加 ---
  } else {
    // 没有文本被选中，提示用户
    console.log('请先选择要设置格式的文本');
    showFormatTip();
  }

  // 确保编辑区域重新获得焦点
  editRef.value?.focus();
};

// 显示格式提示
const showFormatTip = () => {
  const tip = document.createElement('div');
  tip.className = 'format-tip';
  tip.textContent = '请先选择要设置格式的文本';
  editRef.value.parentNode.appendChild(tip);

  // 2秒后移除提示
  setTimeout(() => {
    if (tip.parentNode) {
      tip.parentNode.removeChild(tip);
    }
  }, 2000);
};

// 设置字体族
const setFontFamily = (event) => {
  const fontFamily = event.target.value;
  currentFontFamily.value = fontFamily;

  if (hasSelection.value) {
    execCommand('fontName', fontFamily);
    console.log('应用字体到选中文本:', fontFamily);
  } else {
    showFormatTip();
  }
};

// 设置字体大小
const setFontSize = (event) => {
  const fontSize = event.target.value;
  currentFontSize.value = fontSize;

  if (hasSelection.value) {
    document.execCommand('fontSize', false, '7'); // 使用临时大小

    // 查找所有刚创建的font标签并修改其style
    const spans = editRef.value.querySelectorAll('font[size="7"]');
    spans.forEach((span) => {
      span.removeAttribute('size');
      span.style.fontSize = fontSize;
    });

    console.log('应用字号到选中文本:', fontSize);
  } else {
    showFormatTip();
  }
};

// 设置文字颜色 - 直接应用到编辑器
const setForeColor = async (event) => {
  const color = event.target.value;
  // const previousColor = currentTextColor.value;
  currentTextColor.value = color; // 更新 ref
  // console.log(
  //   `currentTextColor ref updated. Previous: ${previousColor}, New: ${currentTextColor.value}`
  // );

  // 等待下一个 DOM 更新周期
  await nextTick();
  if (foreColorPreviewRef.value) {
    // 在 nextTick 后再次手动设置，尝试触发重绘
    foreColorPreviewRef.value.style.backgroundColor = currentTextColor.value;
    // console.log(
    //   'ForeColor Preview div style after nextTick (manual set):',
    //   foreColorPreviewRef.value.style.backgroundColor
    // );
  }
  // else {
  //   console.log('ForeColor Preview div ref not available after nextTick');
  // }

  if (editRef.value) {
    editRef.value.style.color = color;
    // console.log('全局文本颜色已设置为:', color);
    editRef.value.focus(); // 确保焦点
  }
  // else {
  //   console.warn('无法设置文本颜色：编辑区域引用无效。');
  // }
};

// 设置背景颜色 - 直接应用到编辑器
const setBackColor = async (event) => {
  const color = event.target.value;
  // const previousColor = currentBgColor.value;
  currentBgColor.value = color; // 更新 ref
  // console.log(
  //   `currentBgColor ref updated. Previous: ${previousColor}, New: ${currentBgColor.value}`
  // );

  // 等待下一个 DOM 更新周期
  await nextTick();
  if (bgColorPreviewRef.value) {
    // 在 nextTick 后再次手动设置，尝试触发重绘
    bgColorPreviewRef.value.style.backgroundColor = currentBgColor.value;
    // console.log(
    //   'BgColor Preview div style after nextTick (manual set):',
    //   bgColorPreviewRef.value.style.backgroundColor
    // );
  }
  // else {
  //   console.log('BgColor Preview div ref not available after nextTick');
  // }

  if (editRef.value) {
    editRef.value.style.backgroundColor = color;
    // console.log('全局背景颜色已设置为:', color);
    editRef.value.focus(); // 确保焦点
  }
  // else {
  //   console.warn('无法设置背景颜色：编辑区域引用无效。');
  // }
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
  overflow: hidden; /* 防止文本内容溢出容器 */
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
  overflow: hidden; /* 防止文本溢出 */
}

/* 确保预览模式下正确显示背景色的样式 */
.v-text-inner :deep(span[style*='background-color']) {
  display: inline;
  padding: 0;
  margin: 0;
}

/* 确保内部添加的背景色标签在预览模式下保持正确样式 */
.v-text-inner :deep(font),
.v-text-inner :deep(span) {
  display: inline;
  background-color: inherit;
}

/* 富文本编辑器模态窗口 */
.v-text-editor-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  min-width: 300px;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.6);
  z-index: 10000;
  display: flex;
  justify-content: center;
  align-items: center;
  backdrop-filter: blur(3px);
  pointer-events: all; /* 确保捕获所有指针事件 */
}

.editor-modal-content {
  width: 95%;
  max-width: 1200px;
  min-height: 500px;
  max-height: 85vh;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: modal-fade-in 0.2s ease-out;
  pointer-events: auto; /* 确保弹窗内容接收鼠标事件 */
}

@keyframes modal-fade-in {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.editor-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  background-color: #f5f7fa;
  border-bottom: 1px solid #e6e9f0;
  position: sticky;
  top: 0;
  z-index: 1;
}

.editor-modal-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

/* 底部操作区域 */
.editor-modal-footer {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  padding: 12px 20px;
  background-color: #f5f7fa;
  border-top: 1px solid #e6e9f0;
}

.editor-modal-actions {
  display: flex;
  gap: 10px;
}

.modal-action-btn {
  padding: 8px 16px;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
  font-size: 14px;
}

.modal-action-btn.save {
  background-color: #409eff;
  color: white;
}

.modal-action-btn.save:hover {
  background-color: #2d8cf0;
}

.modal-action-btn.cancel {
  background-color: #f5f7fa;
  color: #606266;
  border: 1px solid #dcdfe6;
}

.modal-action-btn.cancel:hover {
  color: #409eff;
  border-color: #c6e2ff;
  background-color: #ecf5ff;
}

/* 工具栏样式 */
.editor-toolbar {
  display: flex;
  padding: 12px 16px;
  background-color: #f8f9fb;
  border-bottom: 1px solid #e6e9f0;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
}

.toolbar-group {
  display: flex;
  align-items: center;
  margin-right: 12px;
  border-right: 1px solid #e0e0e0;
  padding-right: 12px;
  height: 32px;
}

.toolbar-group:last-child {
  border-right: none;
  margin-right: 0;
}

.toolbar-label {
  font-size: 13px;
  color: #606266;
  margin-right: 6px;
  white-space: nowrap;
}

.toolbar-btn {
  margin: 0 3px;
  padding: 5px 10px;
  background: white;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  height: 30px;
  width: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.toolbar-btn:hover:not(:disabled) {
  background-color: #f0f2f5;
  border-color: #c0c4cc;
}

.toolbar-btn.active {
  background-color: #ecf5ff;
  border-color: #409eff;
  color: #409eff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
}

.toolbar-btn:disabled,
select:disabled,
input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background-color: #f5f5f5;
  border-color: #e0e0e0;
}

.font-family-selector select,
.font-size-selector select {
  padding: 6px 10px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  cursor: pointer;
  outline: none;
  background-color: white;
  min-width: 120px;
  height: 30px;
  font-size: 13px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.font-family-selector select:hover:not(:disabled),
.font-size-selector select:hover:not(:disabled) {
  border-color: #c0c4cc;
}

.font-family-selector select:focus:not(:disabled),
.font-size-selector select:focus:not(:disabled) {
  border-color: #409eff;
}

.color-picker-wrapper {
  display: flex;
  align-items: center;
  gap: 6px;
  position: relative;
}

.color-preview {
  width: 20px;
  height: 20px;
  border-radius: 3px;
  border: 1px solid #dcdfe6;
  position: relative;
  overflow: hidden;
}

.color-picker {
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  padding: 0;
  background: none;
  overflow: hidden;
  opacity: 0;
  position: absolute;
  right: 0;
}

/* 可编辑区域样式 */
.rich-editor {
  flex: 1;
  overflow-y: auto;
  padding: 25px;
  outline: none;
  white-space: pre-wrap;
  word-wrap: break-word;
  min-height: 350px;
  width: calc(100% - 40px);
  border: 1px solid #e6e9f0;
  margin: 20px;
  border-radius: 6px;
  line-height: 1.6;
  font-size: 14px;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.05);
  transition: all 0.2s ease;
}

/* --- CSS 调整：允许编辑器内显示颜色 --- */

/* 基础样式，确保 span 正确显示 */
.rich-editor :deep(span) {
  display: inline !important; /* 保持内联显示 */
  /* 移除 inherit !important，允许 style 属性生效 */
}

/* 特定处理带颜色的 span，确保 style 属性优先 */
.rich-editor :deep(span[style*='color']) {
  /* 不需要特殊规则，让 style 属性自然生效 */
}
.rich-editor :deep(span[style*='background-color']) {
  /* 不需要特殊规则，让 style 属性自然生效 */
  /* 可能需要 padding 来更好地显示背景色 */
  /* padding: 0 1px; */
}

/* --- 预览区域样式保持不变 --- */
.v-text-inner :deep(span[style*='color']) {
  color: inherit !important;
}
.v-text-inner :deep(span[style*='background-color']) {
  background-color: inherit !important;
}
.v-text-inner :deep(span) {
  display: inline !important;
  background-color: inherit; /* 预览时可能需要继承背景 */
}

/* --- 其他样式 --- */
.rich-editor :deep(font) {
  display: inline !important;
}

.rich-editor:focus {
  border-color: #409eff;
  box-shadow: inset 0 1px 3px rgba(64, 158, 255, 0.1);
}

/* 富文本编辑提示样式 */
.format-tip {
  position: absolute;
  bottom: 70px;
  left: 50%;
  transform: translateX(-50%);
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 8px 16px;
  border-radius: 4px;
  font-size: 14px;
  z-index: 10;
  animation: fadein 0.3s;
}

@keyframes fadein {
  from {
    opacity: 0;
    transform: translate(-50%, 10px);
  }
  to {
    opacity: 1;
    transform: translate(-50%, 0);
  }
}

/* 添加一些辅助样式 */
.rich-editor ::selection {
  background-color: rgba(64, 158, 255, 0.3); /* 更明显的选择高亮 */
}
</style>
