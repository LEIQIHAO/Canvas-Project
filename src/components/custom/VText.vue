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

    <!-- 富文本编辑模式：使用传送门组件(Teleport)将弹窗挂载到body -->
    <Teleport v-if="isEditing" to="body">
      <div class="v-text-editor-modal" @click.self="cancelEditing" @mousedown.stop>
        <div ref="modalContentRef" class="editor-modal-content" @click.stop>
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
                @click.stop
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
                @click.stop
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
                @click.stop="execCommand('bold')"
              >
                <b>B</b>
              </button>
              <button
                class="toolbar-btn"
                :class="{ active: isItalicActive }"
                title="斜体"
                :disabled="!hasSelection"
                @click.stop="execCommand('italic')"
              >
                <i>I</i>
              </button>
              <button
                class="toolbar-btn"
                :class="{ active: isUnderlineActive }"
                title="下划线"
                :disabled="!hasSelection"
                @click.stop="execCommand('underline')"
              >
                <u>U</u>
              </button>
              <button
                class="toolbar-btn"
                :class="{ active: isStrikeThroughActive }"
                title="删除线"
                :disabled="!hasSelection"
                @click.stop="execCommand('strikeThrough')"
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
                  @click.stop
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
                  @click.stop
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
            @click.stop
            @dblclick.stop
          />

          <!-- 底部操作按钮 -->
          <div class="editor-modal-footer">
            <div class="editor-modal-actions">
              <button class="modal-action-btn cancel" @click.stop="cancelEditing">取消</button>
              <button class="modal-action-btn save" @click.stop="saveContent">保存</button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { computed, ref, nextTick, onMounted, onUnmounted, watch } from 'vue';
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
// 添加组件当前ID追踪
let currentComponentId = null;
// 添加当前是否正在进行拖拽操作
let isDraggingOperation = false;
// 添加全局变量跟踪当前正在编辑的文本组件ID
const currentEditingTextId = ref(null);

// 编辑状态和编辑内容
const isEditing = ref(false);
const editRef = ref(null);
// 添加文本选择状态
const hasSelection = ref(false);
// 添加模态框内容区域的引用
const modalContentRef = ref(null);

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

// 自定义事件
const emit = defineEmits(['editing-started', 'editing-ended']);

// 添加全局点击事件处理
const handleGlobalClick = (event) => {
  // 如果正在进行拖拽操作，不处理点击事件
  if (isDraggingOperation) {
    console.log('正在进行拖拽操作，忽略点击事件');
    return;
  }

  if (isEditing.value) {
    // 检查点击是否在弹窗内容区域外
    const isClickOutsideModal =
      modalContentRef.value && !modalContentRef.value.contains(event.target);
    const isClickOnModal = event.target.classList.contains('v-text-editor-modal');

    // 我们已经在模态框上添加了 click.self 事件，这里只处理完全在外部的点击
    // 如果点击在弹窗外且不是弹窗本身，且不是新创建的组件，则关闭弹窗
    if (isClickOutsideModal && !isClickOnModal) {
      // 如果是新创建的组件，我们希望保持编辑状态，不要关闭
      if (isNewlyCreated) {
        console.log('点击在弹窗外部区域，但这是新创建的组件，保持编辑状态');
        return;
      }

      console.log('点击在弹窗外部区域，关闭编辑器');
      // 使用延时确保这个处理在其他点击事件之后执行
      setTimeout(() => {
        cancelEditing();
      }, 50);
    }
  }
};

// 在组件挂载时添加全局事件监听
onMounted(() => {
  document.addEventListener('click', handleGlobalClick);

  // 添加对拖拽操作的监听
  document.addEventListener('dragstart', () => {
    console.log('开始拖拽操作');
    isDraggingOperation = true;
  });

  document.addEventListener('dragend', () => {
    console.log('结束拖拽操作');
    isDraggingOperation = false;
  });

  // 鼠标按下可能是拖拽的开始
  document.addEventListener('mousedown', (event) => {
    // 检查目标元素是否可能是拖拽相关元素
    let target = event.target;
    let isPotentialDragElement = false;

    while (target && target !== document.body) {
      if (
        target.getAttribute('draggable') === 'true' ||
        target.classList.contains('draggable') ||
        target.classList.contains('component-item') ||
        target.classList.contains('material-item')
      ) {
        isPotentialDragElement = true;
        break;
      }
      target = target.parentElement;
    }

    if (isPotentialDragElement) {
      isDraggingOperation = true;
      console.log('可能开始拖拽操作');

      // 使用延时重置拖拽状态，防止短暂点击被误认为是拖拽
      setTimeout(() => {
        if (!event.defaultPrevented && event.button === 0) {
          // 如果是左键单击，且未被阻止
          isDraggingOperation = false;
          console.log('短暂点击不是拖拽，重置状态');
        }
      }, 300);
    }
  });

  // 鼠标释放，可能是拖拽结束
  document.addEventListener('mouseup', () => {
    if (isDraggingOperation) {
      console.log('鼠标释放，结束拖拽操作');
      isDraggingOperation = false;
    }
  });

  // 注册自定义事件，监听其他文本组件的编辑状态
  window.addEventListener('vtext-editing-started', handleOtherTextEditing);

  // 添加拖放创建事件监听
  window.addEventListener('vtext-drag-created', handleDragCreatedText);
});

// 在组件卸载前移除事件监听
onUnmounted(() => {
  document.removeEventListener('click', handleGlobalClick);
  document.removeEventListener('dragstart', () => {
    isDraggingOperation = true;
  });
  document.removeEventListener('dragend', () => {
    isDraggingOperation = false;
  });
  document.removeEventListener('mousedown', () => {});
  document.removeEventListener('mouseup', () => {
    isDraggingOperation = false;
  });

  // 移除自定义事件监听
  window.removeEventListener('vtext-editing-started', handleOtherTextEditing);
  window.removeEventListener('vtext-drag-created', handleDragCreatedText);
});

// 处理其他文本组件开始编辑的事件
const handleOtherTextEditing = (event) => {
  const { textId } = event.detail;

  // 如果当前组件正在编辑，且不是触发事件的组件
  if (isEditing.value && props.element?.id !== textId) {
    console.log(`收到其他文本组件(${textId})开始编辑的通知，关闭当前编辑弹窗`);

    // 如果当前组件是新创建的空组件，则执行取消操作（会删除组件）
    if (
      isEmptyCreated &&
      editRef.value &&
      (!editRef.value.innerHTML || editRef.value.innerHTML.trim() === '')
    ) {
      cancelEditing();
    } else {
      // 否则保存当前内容
      saveContent();
    }
  }
};

// 处理拖放创建文本组件的事件
const handleDragCreatedText = (event) => {
  const { textId, timestamp } = event.detail;

  // 检查是否是当前组件
  if (props.element?.id === textId) {
    console.log(`接收到拖放创建事件，当前组件ID: ${textId}, 时间戳: ${timestamp}`);

    // 如果当前组件不在编辑状态，检查是否有拖放创建标志
    if (!isEditing.value && props.element?.props?.dragDropCreated) {
      console.log(`组件 ${textId} 是拖放创建的，自动进入编辑模式`);

      // 设置为新创建的组件，并启动编辑
      isNewlyCreated = true;
      setTimeout(() => {
        startEditing();
      }, 100);
    }
  }
};

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
  console.log(`%c[VText ${props.element?.id}] startEditing: Entering edit mode.`, 'color: blue');

  // 分发事件通知其他文本组件
  const event = new CustomEvent('vtext-editing-started', {
    detail: { textId: props.element?.id },
  });
  window.dispatchEvent(event);

  // 更新全局编辑状态
  currentEditingTextId.value = props.element?.id;

  isEditing.value = true;
  initCurrentStyles();
  console.log(`[VText ${props.element?.id}] startEditing: displayContent=`, displayContent.value);
  console.log(
    `[VText ${props.element?.id}] startEditing: props.element.props.content=`,
    props.element?.props?.content
  );
  console.log(`[VText ${props.element?.id}] startEditing: isNewlyCreated=`, isNewlyCreated);
  console.log(`[VText ${props.element?.id}] startEditing: isEmptyCreated=`, isEmptyCreated);
  console.log(`[VText ${props.element?.id}] startEditing: currentFontSize=`, currentFontSize.value);

  // 触发编辑开始事件
  emit('editing-started', props.element?.id);

  nextTick(() => {
    if (editRef.value) {
      console.log(
        `[VText ${props.element?.id}] startEditing (nextTick): Setting innerHTML and styles.`
      );
      editRef.value.innerHTML = displayContent.value;
      const globalStyle = props.element?.style || {};
      editRef.value.style.color = globalStyle.color || '#000000';
      editRef.value.style.backgroundColor = globalStyle.backgroundColor || 'transparent';
      currentTextColor.value = globalStyle.color || '#000000';
      currentBgColor.value = globalStyle.backgroundColor || '#ffffff';
      try {
        document.execCommand('styleWithCSS', false, true);
        document.execCommand('defaultParagraphSeparator', false, 'div');
      } catch (e) {
        console.error(
          `[VText ${props.element?.id}] startEditing (nextTick): Error executing init commands:`,
          e
        );
      }
      editRef.value.focus();
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(editRef.value);
      range.collapse(false);
      selection.removeAllRanges();
      selection.addRange(range);
      hasSelection.value = false;

      // 确保弹窗位置不受旋转影响
      ensureModalNotRotated();
      adjustModalPosition();
      console.log(
        `[VText ${props.element?.id}] startEditing (nextTick): Adding selectionchange listener.`
      );
      document.addEventListener('selectionchange', checkSelection);
    } else {
      console.warn(`[VText ${props.element?.id}] startEditing (nextTick): editRef is null.`);
    }
  });
};

// 新增函数：确保弹窗不受组件旋转影响
const ensureModalNotRotated = () => {
  const modal = document.querySelector('.v-text-editor-modal');
  if (modal) {
    // 重置可能继承的旋转变换
    modal.style.transform = 'none';
    if (modalContentRef.value) {
      modalContentRef.value.style.transform = 'none';
    }
  }
};

// 新增函数：调整弹窗位置
const adjustModalPosition = () => {
  nextTick(() => {
    // 获取编辑器内容区域元素
    if (!modalContentRef.value) return;

    // 设置安全边距（像素）
    const margin = 50;

    // 获取内容区域的位置和尺寸
    const rect = modalContentRef.value.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;

    // 检查是否超出视口边界
    let translateX = 0;
    let translateY = 0;

    // 检查顶部边界
    if (rect.top < margin) {
      translateY = margin - rect.top;
    }

    // 检查底部边界 - 如果顶部已经调整，需要重新计算
    if (rect.bottom + translateY > viewportHeight - margin) {
      // 优先保证不超出底部
      translateY = viewportHeight - margin - rect.bottom;
    }

    // 检查左侧边界
    if (rect.left < margin) {
      translateX = margin - rect.left;
    }

    // 检查右侧边界
    if (rect.right + translateX > viewportWidth - margin) {
      translateX = viewportWidth - margin - rect.right;
    }

    // 应用变换
    if (translateX !== 0 || translateY !== 0) {
      modalContentRef.value.style.transform = `translate(${translateX}px, ${translateY}px)`;
      console.log(`调整弹窗位置: translateX=${translateX}px, translateY=${translateY}px`);
    }
  });
};

// 新增函数：重置弹窗 transform 样式
const resetModalTransform = () => {
  if (modalContentRef.value) {
    modalContentRef.value.style.transform = '';
  }
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

// 监听组件创建时的选中状态，如果是新创建且被选中的组件，自动进入编辑模式
watch(
  () => props.element?.id,
  (newId, oldId) => {
    console.log(`[VText Watcher 1 - Creation/ID Change] Triggered. newId=${newId}, oldId=${oldId}`);

    // 记录当前组件ID
    currentComponentId = newId;

    // 如果ID从无到有，说明是新创建的组件
    if (newId && !oldId) {
      console.log(`[VText Watcher 1] New component detected: ${newId}`);
      isNewlyCreated = true; // 标记为新创建的组件
      if (props.element?.props?.content === '') {
        isEmptyCreated = true;
        console.log(`[VText Watcher 1] Component ${newId} marked as isEmptyCreated.`);
      }

      // 使用 nextTick 延迟检查和启动编辑
      nextTick(() => {
        const currentSelectedId = canvasStore.primarySelectedComponent?.id;
        console.log(
          `[VText Watcher 1 (nextTick)] Checking selection. Current selected ID: ${currentSelectedId}, Component ID: ${newId}`
        );
        // 在 nextTick 中再次检查，确保选中状态稳定
        if (currentSelectedId === newId) {
          console.log(
            `%c[VText Watcher 1 (nextTick)] Component ${newId} is primary selected. Calling startEditing().`,
            'color: magenta'
          );
          // 为所有新创建的文本组件启动编辑模式，包括拖拽放置的
          startEditing();

          // 不要在这里重置 isNewlyCreated
        } else {
          console.log(
            `[VText Watcher 1 (nextTick)] Component ${newId} is NOT primary selected. Resetting isNewlyCreated.`
          );
          // 如果延迟检查后发现不再被选中，也需要重置标志
          isNewlyCreated = false;
        }
      });
    }
  },
  { immediate: true } // immediate 确保组件加载时运行一次
);

// 添加一个Map来存储已编辑过的组件ID
const editedComponentIds = new Map();

// 移除之前的监听primarySelectedComponent的复杂逻辑，简化为只监听选择变化
watch(
  () => canvasStore.primarySelectedComponent,
  (newSelectedComponent) => {
    // 只记录日志，不再执行自动编辑逻辑
    if (
      newSelectedComponent &&
      newSelectedComponent.id === props.element?.id &&
      newSelectedComponent.key === 'VText'
    ) {
      console.log(
        `[VText Selected] Component ${newSelectedComponent.id} selected, dragDropCreated=${props.element?.props?.dragDropCreated}`
      );
    }
  }
);

// 监听失焦事件 (主选中组件变化)，确保编辑状态及时关闭
watch(
  () => canvasStore.primarySelectedComponent?.id,
  (newSelectedId, oldSelectedId) => {
    console.log(
      `[VText Watcher 2 - Selection Change] Triggered. Element ID: ${props.element?.id}, New selected ID: ${newSelectedId}, Old selected ID: ${oldSelectedId}, Is Editing: ${isEditing.value}`
    );

    // 如果组件正在编辑，而且不再被选中，并且不是新创建的组件
    // 注意：只有当编辑组件不是新选择的组件时才保存内容
    if (isEditing.value && props.element?.id !== newSelectedId) {
      // 如果是新创建的组件但失去选中，此时保持编辑状态，不要保存
      if (isNewlyCreated) {
        console.log(
          `[VText Watcher 2] Component ${props.element?.id} is newly created, skipping auto-save.`
        );
        return;
      }

      console.log(
        `%c[VText Watcher 2] Component ${props.element?.id} is editing and no longer selected (new selected: ${newSelectedId}). Calling saveContent().`,
        'color: purple'
      );
      saveContent();
    } else {
      console.log(`[VText Watcher 2] Condition not met for auto-save/close.`);
    }
  }
  // 不使用 immediate: true
);

// 保存内容
const saveContent = () => {
  console.log(
    `%c[VText ${props.element?.id}] saveContent: Attempting to save. isEditing=${isEditing.value}`,
    'color: green'
  );
  if (!isEditing.value) return;
  const content = editRef.value ? editRef.value.innerHTML : '';
  console.log(`[VText ${props.element?.id}] saveContent: Content to save=`, content);
  isEditing.value = false;
  console.log(`[VText ${props.element?.id}] saveContent: Removing selectionchange listener.`);
  document.removeEventListener('selectionchange', checkSelection);
  resetModalTransform(); // Ensure this is called correctly

  // 清除全局编辑状态
  if (currentEditingTextId.value === props.element?.id) {
    currentEditingTextId.value = null;
  }

  // 触发编辑结束事件
  emit('editing-ended', props.element?.id);

  if (props.element?.id) {
    // ... (更新 store)
    canvasStore.updateComponentProps(props.element.id, { content });
    const newStyle = {
      color: currentTextColor.value,
      backgroundColor: currentBgColor.value === '#ffffff' ? 'transparent' : currentBgColor.value,
    };
    canvasStore.updateComponentStyle(props.element.id, newStyle);
    console.log(`[VText ${props.element?.id}] saveContent: Updated store props & style.`, newStyle);
  }
  if (isEmptyCreated && props.element?.id && (!content || content.trim() === '')) {
    console.log(
      `%c[VText ${props.element?.id}] saveContent: Empty content on empty-created component, deleting.`,
      'color: orange'
    );
    canvasStore.deleteComponentById(props.element.id);
    return;
  }
  // 在成功保存后重置标志位
  isNewlyCreated = false;
  isEmptyCreated = false;
  console.log(`[VText ${props.element?.id}] saveContent: Finished saving.`);
};

// 取消编辑
const cancelEditing = () => {
  console.log(
    `%c[VText ${props.element?.id}] cancelEditing: Attempting to cancel. isEditing=${isEditing.value}, isNewlyCreated=${isNewlyCreated}`,
    'color: red'
  );
  if (!isEditing.value) return; // 添加检查，防止重复执行

  // 确保所有事件监听器被正确移除
  document.removeEventListener('selectionchange', checkSelection);

  const content = editRef.value ? editRef.value.innerHTML : '';
  isEditing.value = false;
  console.log(`[VText ${props.element?.id}] cancelEditing: Removing selectionchange listener.`);

  // 清除全局编辑状态
  if (currentEditingTextId.value === props.element?.id) {
    currentEditingTextId.value = null;
  }

  // 触发编辑结束事件
  emit('editing-ended', props.element?.id);

  // 重置弹窗位置
  resetModalTransform();

  // 处理空内容的组件
  if ((isEmptyCreated || (isNewlyCreated && content.trim() === '')) && props.element?.id) {
    console.log(
      `%c[VText ${props.element?.id}] cancelEditing: Empty content on newly-created component, deleting.`,
      'color: orange'
    );
    canvasStore.deleteComponentById(props.element.id);
  }
  // 在取消编辑后重置标志位
  isNewlyCreated = false;
  isEmptyCreated = false;
  console.log(`[VText ${props.element?.id}] cancelEditing: Finished cancelling.`);
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
  /* 确保模态框不受组件旋转影响 */
  transform: none !important;
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
  /* 确保弹窗内容不受组件旋转影响 */
  transform: none !important;
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
