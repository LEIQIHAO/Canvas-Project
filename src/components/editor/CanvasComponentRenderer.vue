<template>
  <div
    :style="componentStyleWithTransform"
    :class="['canvas-component', { selected: isSelected, group: component.key === 'group' }]"
    :data-component-id="component.id"
    :data-component-key="component.key"
    @click.stop="emitComponentClick"
    @mousedown.self.stop.prevent="emitComponentMouseDown"
    @dblclick.stop="handleDoubleClick"
  >
    <!-- Render actual component or group children -->
    <component
      :is="actualComponentType"
      v-if="component.key !== 'group'"
      v-bind="component.props"
      :element="component"
      class="component-inner"
      :class="{ 'allow-pointer-events': component.key === 'VUpload' }"
      style="width: 100%; height: 100%; display: block; box-sizing: border-box"
      @click="emitComponentClick"
      @mousedown="emitComponentMouseDown"
    />

    <!-- 递归渲染组组件的子组件 -->
    <template v-if="component.key === 'group' && component.children">
      <CanvasComponentRenderer
        v-for="child in component.children"
        :key="child.id"
        :component="child"
        :is-selected="false"
        :is-primary-selection="false"
        :get-component-by-type="getComponentByType"
      />
    </template>

    <!-- Resize Handles -->
    <div v-if="isPrimarySelection" class="resize-handles">
      <!-- Standard Handles - 针对直线组件只显示上下左右四个控制点 -->
      <div
        v-if="component.key !== 'LineShape'"
        class="resize-handle top-left"
        :style="{ cursor: getResizeHandleCursor('top-left') }"
        @mousedown.stop.prevent="emitResizeMouseDown('top-left', $event)"
      />
      <div
        class="resize-handle top-center"
        :style="{ cursor: getResizeHandleCursor('top-center') }"
        @mousedown.stop.prevent="emitResizeMouseDown('top-center', $event)"
      />
      <div
        v-if="component.key !== 'LineShape'"
        class="resize-handle top-right"
        :style="{ cursor: getResizeHandleCursor('top-right') }"
        @mousedown.stop.prevent="emitResizeMouseDown('top-right', $event)"
      />
      <div
        class="resize-handle middle-left"
        :style="{ cursor: getResizeHandleCursor('middle-left') }"
        @mousedown.stop.prevent="emitResizeMouseDown('middle-left', $event)"
      />
      <div
        class="resize-handle middle-right"
        :style="{ cursor: getResizeHandleCursor('middle-right') }"
        @mousedown.stop.prevent="emitResizeMouseDown('middle-right', $event)"
      />
      <div
        v-if="component.key !== 'LineShape'"
        class="resize-handle bottom-left"
        :style="{ cursor: getResizeHandleCursor('bottom-left') }"
        @mousedown.stop.prevent="emitResizeMouseDown('bottom-left', $event)"
      />
      <div
        class="resize-handle bottom-center"
        :style="{ cursor: getResizeHandleCursor('bottom-center') }"
        @mousedown.stop.prevent="emitResizeMouseDown('bottom-center', $event)"
      />
      <div
        v-if="component.key !== 'LineShape'"
        class="resize-handle bottom-right"
        :style="{ cursor: getResizeHandleCursor('bottom-right') }"
        @mousedown.stop.prevent="emitResizeMouseDown('bottom-right', $event)"
      />
      <!-- Rotation Handle -->
      <div
        class="resize-handle rotate-handle"
        title="旋转组件"
        @mousedown.stop.prevent="emitRotateMouseDown($event)"
      >
        <svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
          <path
            fill="currentColor"
            d="M784.4 264.6c-9.2-10.1-23.3-11-33.4-1.8l-56.5 51.3a337.4 337.4 0 0 0-278.1-95.9V102c0-13.3-10.7-24-24-24s-24 10.7-24 24v116.2A337.4 337.4 0 0 0 90.2 314L35 262.8c-10-9.2-24.2-8.4-33.4 1.8-9.2 10.1-8.4 24.2 1.8 33.4l49.1 44.5A384 384 0 0 1 512 128c111.6 0 213.1 47.8 283.4 126.3l50.9-46.2c10.2-9.2 11-23.3 1.8-33.4zm-54.5 495.2c9.2 10.1 23.3 11 33.4 1.8l56.5-51.3a337.4 337.4 0 0 0 278.1 95.9V922c0 13.3 10.7 24 24 24s24-10.7 24-24V805.8a337.4 337.4 0 0 0-278.2-95.9l55.1-50c10-9.2 10.8-23.3 1.8-33.4-9.2-10.1-23.3-11-33.4-1.8l-55.8 50.6A384 384 0 0 1 512 896c-111.6 0-213.1-47.8-283.4-126.3l-50.9 46.2c-10.1 9.2-11 23.3-1.8 33.4 9.2 10.1 23.3 11 33.4 1.8l50.2-45.6A381.7 381.7 0 0 1 512 896a381.7 381.7 0 0 1 217.9-66.2z"
          />
        </svg>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, defineAsyncComponent, watch } from 'vue';

// Define component name for recursive usage
// Need to import self for recursive template usage
// const CanvasComponentRenderer = defineAsyncComponent(() => import('./CanvasComponentRenderer.vue'));
// Using name directly is often sufficient for self-reference in templates
import CanvasComponentRenderer from './CanvasComponentRenderer.vue';

const props = defineProps({
  component: {
    type: Object,
    required: true,
  },
  isSelected: {
    type: Boolean,
    default: false,
  },
  isPrimarySelection: {
    // Only one component can be primary (shows handles)
    type: Boolean,
    default: false,
  },
  getComponentByType: {
    // Function passed from Editor to resolve component types
    type: Function,
    required: true,
  },
});

const emit = defineEmits([
  'component-click', // (component, event)
  'component-mousedown', // (component, event)
  'resize-mousedown', // (component, event, direction)
  'rotate-mousedown', // (component, event)
]);

// Combine style and transform for the wrapper div
const componentStyleWithTransform = computed(() => {
  // Base style includes position, size, zIndex, transform (rotation)
  const style = { ...(props.component.style || {}) };

  // 确保zIndex是数字类型，并且有合理的默认值
  if (style.zIndex === undefined || style.zIndex === null) {
    console.warn(`组件 ${props.component.id} 没有设置 zIndex，使用默认值 1`);
    style.zIndex = 1;
  }

  // 确保zIndex是数字（不是字符串）
  if (typeof style.zIndex === 'string') {
    style.zIndex = parseInt(style.zIndex, 10) || 1;
  }

  console.log(`组件 ${props.component.id} (${props.component.key}) 应用的 zIndex: ${style.zIndex}`);

  // Rotation is already part of the style.transform
  return style;
});

// Get the actual Vue component type (e.g., ElButton, span, div)
const actualComponentType = computed(() => {
  const type = props.getComponentByType(props.component.key);
  console.log(`获取组件类型: ${props.component.key} -> `, type);
  return type;
});

// 计算组件的旋转角度
const rotationAngle = computed(() => {
  const transformStyle = props.component.style?.transform || '';
  const rotateMatch = transformStyle.match(/rotate\(([-+]?[0-9]*\.?[0-9]+)deg\)/);
  return rotateMatch ? parseInt(rotateMatch[1], 10) : 0;
});

// 根据组件旋转角度和控制点方向返回光标样式类名
const getResizeHandleCursor = (direction) => {
  // 获取组件旋转角度
  const componentAngle = rotationAngle.value || 0;

  // 控制点基础角度
  const directionAngles = {
    'top-center': 0,
    'top-right': 45,
    'middle-right': 90,
    'bottom-right': 135,
    'bottom-center': 180,
    'bottom-left': 225,
    'middle-left': 270,
    'top-left': 315,
  };

  // 如果不是有效方向，返回默认光标
  if (!directionAngles[direction]) {
    return 'default';
  }

  // 计算控制点旋转后的角度
  let rotatedAngle = (directionAngles[direction] + componentAngle) % 360;
  if (rotatedAngle < 0) rotatedAngle += 360;

  // 根据旋转后的角度确定光标样式
  // 每45度一个区间
  const cursorTypes = [
    'ns-resize', // 0度 - 上下
    'nesw-resize', // 45度 - 右上-左下
    'ew-resize', // 90度 - 左右
    'nwse-resize', // 135度 - 左上-右下
    'ns-resize', // 180度 - 上下
    'nesw-resize', // 225度 - 右上-左下
    'ew-resize', // 270度 - 左右
    'nwse-resize', // 315度 - 左上-右下
  ];

  const index = Math.round(rotatedAngle / 45) % 8;
  return cursorTypes[index];
};

// 调试用：监视组件变化
watch(
  () => props.component,
  (newVal) => {
    console.log('组件更新:', {
      id: newVal.id,
      key: newVal.key,
      style: newVal.style,
      props: newVal.props,
    });
  },
  { deep: true }
);

// --- Event Emitters ---
const emitComponentClick = (event) => {
  // 如果是VUpload组件，仍然允许点击组件进行选择
  // 但内部的按钮点击会通过事件冒泡阻止，不会触发这里的选择功能
  emit('component-click', props.component, event);
};

const emitComponentMouseDown = (event) => {
  // 如果是VUpload组件，仍然允许鼠标按下，以便可以选中和移动组件
  // 但内部的按钮点击会通过事件冒泡阻止，不会触发移动功能
  emit('component-mousedown', props.component, event);
};

const emitResizeMouseDown = (direction, event) => {
  // event.stopPropagation(); // Already stopped in template
  emit('resize-mousedown', props.component, event, direction);
};

const emitRotateMouseDown = (event) => {
  // event.stopPropagation(); // Already stopped in template
  emit('rotate-mousedown', props.component, event);
};

const handleDoubleClick = (event) => {
  // 如果当前组件是文本组件，则进入编辑模式
  if (props.component.key === 'VText') {
    console.log('文本组件双击，尝试进入编辑模式');

    // 获取组件内部的引用
    const componentElement = event.currentTarget;
    if (componentElement) {
      // 找到文本显示元素
      const textInner = componentElement.querySelector('.v-text-inner');
      if (textInner) {
        // 手动触发文本元素的双击事件
        textInner.dispatchEvent(
          new MouseEvent('dblclick', {
            bubbles: true,
            cancelable: true,
            view: window,
          })
        );
      } else {
        console.log('未找到文本显示元素');
      }
    }
  }
};
</script>

<style scoped>
/* Styles moved from Editor.vue - these apply to the wrapper div */
.canvas-component {
  position: absolute;
  cursor: move;
  /* Default border, might be overridden for specific types */
  border: 1px solid transparent;
  transition: border-color 0.2s;
  transform-origin: center center;
  box-sizing: border-box; /* Ensure border doesn't affect layout */
  overflow: visible; /* Needed for handles to show outside bounds */
}

/* 特殊处理矩形组件，移除外部边框 */
.canvas-component[data-component-key='RectShape'] {
  border: none;
}

/* 添加圆形组件的处理，移除额外边框 */
.canvas-component[data-component-key='CircleShape'] {
  border: none !important;
}

.canvas-component.group {
  /* Groups might have a specific border or background when selected */
  border: 1px dashed transparent; /* Group border only shown when selected */
  /* background-color: rgba(0, 0, 255, 0.05); */ /* Optional: subtle bg for groups */
  overflow: hidden; /* Groups should clip children? Or visible? */
}

/* NEW: Remove border specifically for SVG components */
.canvas-component[data-component-key^='SVG'] {
  border: none !important;
}

.canvas-component.selected {
  /* Highlight selected components/groups */
  /* Use outline instead of border for non-SVG components to avoid layout shifts */
  outline: 1px dashed #409eff;
  outline-offset: 0px; /* Adjust if needed */
  /* Keep border transparent for non-SVGs, border none for SVGs handles the rest */
  border: 1px solid transparent;
  z-index: 100 !important; /* Bring selected to front visually (adjust zIndex if needed) */
}

/* 矩形组件被选中时也不显示外部边框 */
.canvas-component.selected[data-component-key='RectShape'] {
  outline: none;
  border: none;
}

/* 对圆形组件也移除选中时的外部边框 */
.canvas-component.selected[data-component-key='CircleShape'] {
  outline: none;
  border: none;
}

/* Special case for SVGs: ensure outline is also removed when selected */
.canvas-component.selected[data-component-key^='SVG'] {
  outline: none;
  /* Border is already handled above */
}

/* Resize Handles Container - positioned relative to the .canvas-component div */
.resize-handles {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none; /* Container doesn't block underlying interactions */
  z-index: 101; /* Ensure handles are above selected border */
}

/* Individual Resize Handle Style */
.resize-handle {
  position: absolute;
  width: 8px;
  height: 8px;
  background-color: #fff;
  border: 1px solid #409eff;
  border-radius: 50%; /* Circular handles */
  pointer-events: auto; /* Handles must be interactive */
}

/* Positioning Handles (relative to the component's border-box) */
.resize-handle.top-left {
  top: -4px;
  left: -4px;
}
.resize-handle.top-center {
  top: -4px;
  left: 50%;
  transform: translateX(-50%);
}
.resize-handle.top-right {
  top: -4px;
  right: -4px;
}
.resize-handle.middle-left {
  top: 50%;
  left: -4px;
  transform: translateY(-50%);
}
.resize-handle.middle-right {
  top: 50%;
  right: -4px;
  transform: translateY(-50%);
}
.resize-handle.bottom-left {
  bottom: -4px;
  left: -4px;
}
.resize-handle.bottom-center {
  bottom: -4px;
  left: 50%;
  transform: translateX(-50%);
}
.resize-handle.bottom-right {
  bottom: -4px;
  right: -4px;
}

/* Rotation Handle */
.resize-handle.rotate-handle {
  top: -25px; /* Position above the top-center handle */
  left: 50%;
  transform: translateX(-50%);
  width: 18px; /* 增大尺寸 */
  height: 18px; /* 增大尺寸 */
  border-radius: 50%;
  background-color: #409eff;
  border: 1px solid #fff;
  cursor: grab;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  z-index: 110; /* 确保旋转控制点位于最上层 */
}

.resize-handle.rotate-handle:active {
  cursor: grabbing;
}

.resize-handle.rotate-handle svg {
  width: 14px; /* 增大图标尺寸 */
  height: 14px; /* 增大图标尺寸 */
}

/* Style for the inner component rendered via <component :is="..."> */
/* This ensures the element fills its wrapper */
/* :deep selector might be needed if scoped styles block children */
:deep(.component-inner) {
  width: 100%;
  height: 100%;
  display: block; /* Or flex, depending on component type */
  box-sizing: border-box;
  pointer-events: none; /* Should not interfere with wrapper's events */
}

/* 允许特定组件（比如VUpload）捕获事件 */
:deep(.allow-pointer-events) {
  pointer-events: auto !important;
}

/* 点击事件只会被按钮区域捕获，图片区域应该传递给wrapper */
:deep(.allow-pointer-events .upload-button) {
  pointer-events: auto !important;
  z-index: 10;
}

:deep(.allow-pointer-events .image-actions) {
  pointer-events: auto !important;
  z-index: 10;
}

:deep(.allow-pointer-events .preview-image) {
  pointer-events: none !important;
}

/* 蓝色控制点样式 */
.resize-handle.blue-handle {
  background-color: #409eff;
}
</style>
