<template>
  <div
    :style="componentStyleWithTransform"
    :class="['canvas-component', { selected: isSelected, group: component.key === 'group' }]"
    :data-component-id="component.id"
    :data-component-key="component.key"
    @click.stop="emitComponentClick"
    @mousedown.self.stop.prevent="emitComponentMouseDown"
  >
    <!-- Render actual component or group children -->
    <component
      :is="actualComponentType"
      v-if="component.key !== 'group'"
      v-bind="component.props"
      :element="component"
      class="component-inner"
      style="
        pointer-events: none;
        width: 100%;
        height: 100%;
        display: block;
        box-sizing: border-box;
      "
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
      <!-- Standard Handles -->
      <div
        class="resize-handle top-left"
        @mousedown.stop.prevent="emitResizeMouseDown('top-left', $event)"
      />
      <div
        class="resize-handle top-center"
        @mousedown.stop.prevent="emitResizeMouseDown('top-center', $event)"
      />
      <div
        class="resize-handle top-right"
        @mousedown.stop.prevent="emitResizeMouseDown('top-right', $event)"
      />
      <div
        class="resize-handle middle-left"
        @mousedown.stop.prevent="emitResizeMouseDown('middle-left', $event)"
      />
      <div
        class="resize-handle middle-right"
        @mousedown.stop.prevent="emitResizeMouseDown('middle-right', $event)"
      />
      <div
        class="resize-handle bottom-left"
        @mousedown.stop.prevent="emitResizeMouseDown('bottom-left', $event)"
      />
      <div
        class="resize-handle bottom-center"
        @mousedown.stop.prevent="emitResizeMouseDown('bottom-center', $event)"
      />
      <div
        class="resize-handle bottom-right"
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
  // Rotation is already part of the style.transform
  return style;
});

// Get the actual Vue component type (e.g., ElButton, span, div)
const actualComponentType = computed(() => {
  const type = props.getComponentByType(props.component.key);
  console.log(`获取组件类型: ${props.component.key} -> `, type);
  return type;
});

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
  // Prevent click from propagating further up if needed
  // event.stopPropagation();
  emit('component-click', props.component, event);
};

const emitComponentMouseDown = (event) => {
  // Prevent mousedown from propagating further up if needed
  // event.stopPropagation();
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
  cursor: nwse-resize;
}
.resize-handle.top-center {
  top: -4px;
  left: 50%;
  transform: translateX(-50%);
  cursor: ns-resize;
}
.resize-handle.top-right {
  top: -4px;
  right: -4px;
  cursor: nesw-resize;
}
.resize-handle.middle-left {
  top: 50%;
  left: -4px;
  transform: translateY(-50%);
  cursor: ew-resize;
}
.resize-handle.middle-right {
  top: 50%;
  right: -4px;
  transform: translateY(-50%);
  cursor: ew-resize;
}
.resize-handle.bottom-left {
  bottom: -4px;
  left: -4px;
  cursor: nesw-resize;
}
.resize-handle.bottom-center {
  bottom: -4px;
  left: 50%;
  transform: translateX(-50%);
  cursor: ns-resize;
}
.resize-handle.bottom-right {
  bottom: -4px;
  right: -4px;
  cursor: nwse-resize;
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
</style>
