<template>
  <div class="props-editor">
    <div v-if="!selectedComponent" class="props-placeholder">
      <h4>未选中组件</h4>
    </div>
    <div v-else class="attr-container">
      <div class="title">组件属性</div>

      <div class="attr-list">
        <div class="component-type">
          <span>组件类型：{{ selectedComponent.label || selectedComponent.key }}</span>
        </div>

        <el-collapse v-model="activeCollapseNames" class="attr-collapse">
          <el-collapse-item title="位置 & 尺寸" name="transform">
            <div class="attr-form">
              <div class="attr-form-item">
                <div class="attr-label">X 坐标</div>
                <el-input-number
                  v-model="styleProps.left"
                  controls-position="right"
                  size="small"
                  :precision="0"
                  :step="1"
                  @change="updateStyle"
                />
              </div>

              <div class="attr-form-item">
                <div class="attr-label">Y 坐标</div>
                <el-input-number
                  v-model="styleProps.top"
                  controls-position="right"
                  size="small"
                  :precision="0"
                  :step="1"
                  @change="updateStyle"
                />
              </div>

              <div class="attr-form-item">
                <div class="attr-label">宽度</div>
                <el-input-number
                  v-model="styleProps.width"
                  controls-position="right"
                  size="small"
                  :min="1"
                  @change="updateStyle"
                />
              </div>

              <div class="attr-form-item">
                <div class="attr-label">高度</div>
                <el-input-number
                  v-model="styleProps.height"
                  controls-position="right"
                  size="small"
                  :min="1"
                  @change="updateStyle"
                />
              </div>

              <div class="attr-form-item">
                <div class="attr-label">旋转角度</div>
                <el-slider
                  v-model="styleProps.rotation"
                  :min="0"
                  :max="360"
                  style="width: 90%; margin: 0 auto"
                  size="small"
                  @change="updateStyle"
                />
              </div>

              <div class="attr-form-item">
                <div class="attr-label">层级 (z-index)</div>
                <el-input-number
                  v-model="styleProps.zIndex"
                  controls-position="right"
                  size="small"
                  :min="1"
                  @change="updateStyle"
                />
              </div>
            </div>
          </el-collapse-item>

          <!-- 组件特定属性 -->
          <el-collapse-item title="组件属性" name="props">
            <div v-if="selectedComponent.key === 'VText'" class="attr-form">
              <div class="attr-form-item">
                <div class="attr-label">文本内容</div>
                <el-input
                  v-model="componentProps.content"
                  type="textarea"
                  size="small"
                  @change="updateProps"
                />
              </div>
            </div>

            <div v-else-if="selectedComponent.key === 'VButton'" class="attr-form">
              <div class="attr-form-item">
                <div class="attr-label">按钮文字</div>
                <el-input v-model="componentProps.text" size="small" @change="updateProps" />
              </div>
            </div>

            <div v-else-if="selectedComponent.key === 'Picture'" class="attr-form">
              <div class="attr-form-item">
                <div class="attr-label">图片地址</div>
                <el-input v-model="componentProps.url" size="small" @change="updateProps" />
              </div>
            </div>

            <div v-else-if="selectedComponent.key === 'RectShape'" class="attr-form">
              <div class="attr-form-item">
                <div class="attr-label">背景颜色</div>
                <el-color-picker
                  v-model="styleProps.backgroundColor"
                  show-alpha
                  @change="updateStyle"
                />
              </div>
              <div class="attr-form-item">
                <div class="attr-label">边框颜色</div>
                <el-color-picker
                  v-model="styleProps.borderColor"
                  show-alpha
                  @change="updateStyle"
                />
              </div>
              <div class="attr-form-item">
                <div class="attr-label">边框宽度</div>
                <el-input-number
                  v-model="styleProps.borderWidth"
                  :min="0"
                  :max="20"
                  size="small"
                  @change="updateStyle"
                />
              </div>
            </div>

            <div v-else-if="selectedComponent.key === 'CircleShape'" class="attr-form">
              <div class="attr-form-item">
                <div class="attr-label">背景颜色</div>
                <el-color-picker
                  v-model="styleProps.backgroundColor"
                  show-alpha
                  @change="updateStyle"
                />
              </div>
              <div class="attr-form-item">
                <div class="attr-label">边框颜色</div>
                <el-color-picker
                  v-model="styleProps.borderColor"
                  show-alpha
                  @change="updateStyle"
                />
              </div>
              <div class="attr-form-item">
                <div class="attr-label">边框宽度</div>
                <el-input-number
                  v-model="styleProps.borderWidth"
                  :min="0"
                  :max="20"
                  size="small"
                  @change="updateStyle"
                />
              </div>
            </div>

            <div v-else-if="selectedComponent.key === 'LineShape'" class="attr-form">
              <div class="attr-form-item">
                <div class="attr-label">线条颜色</div>
                <el-color-picker
                  v-model="styleProps.backgroundColor"
                  show-alpha
                  @change="updateStyle"
                />
              </div>
              <div class="attr-form-item">
                <div class="attr-label">线条宽度</div>
                <el-input-number
                  v-model="styleProps.height"
                  controls-position="right"
                  size="small"
                  :min="1"
                  :max="20"
                  @change="updateStyle"
                />
              </div>
            </div>

            <div
              v-else-if="
                selectedComponent.key === 'SVGStar' || selectedComponent.key === 'SVGTriangle'
              "
              class="attr-form"
            >
              <div class="attr-form-item">
                <div class="attr-label">填充颜色</div>
                <el-color-picker v-model="styleProps.color" show-alpha @change="updateStyle" />
              </div>
              <div class="attr-form-item">
                <div class="attr-label">边框颜色</div>
                <el-color-picker
                  v-model="styleProps.borderColor"
                  show-alpha
                  @change="updateStyle"
                />
              </div>
              <div class="attr-form-item">
                <div class="attr-label">边框宽度</div>
                <el-input-number
                  v-model="styleProps.borderWidth"
                  :min="0"
                  :max="20"
                  size="small"
                  @change="updateStyle"
                />
              </div>
            </div>

            <div v-else-if="selectedComponent.key === 'group'" class="attr-form">
              <p>组合组件暂无独立属性</p>
            </div>

            <div v-else class="attr-form">
              <p>该组件暂无属性可配置</p>
            </div>
          </el-collapse-item>
        </el-collapse>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed, nextTick } from 'vue';
import { useCanvasStore } from '@/stores/canvas';
import {
  ElForm,
  ElFormItem,
  ElInputNumber,
  ElInput,
  ElSelect,
  ElOption,
  ElTag,
  ElCollapse,
  ElCollapseItem,
  ElSlider,
  ElRow,
  ElCol,
  ElColorPicker,
} from 'element-plus';

const props = defineProps({
  selectedComponent: {
    type: Object,
    default: null,
  },
});

const canvasStore = useCanvasStore();

// Local state for form binding
const styleProps = ref({});
const componentProps = ref({});

// Keep track of active collapse panels
const activeCollapseNames = ref(['transform', 'props']); // Open by default

// Helper to parse pixel values or return 0
const parsePx = (value) => {
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
  }
  return typeof value === 'number' ? value : 0;
};

// Helper to parse rotation value from transform string
const parseRotation = (transform) => {
  if (typeof transform === 'string') {
    const match = transform.match(/rotate\(([-+]?[0-9]*\.?[0-9]+)deg\)/);
    return match ? parseFloat(match[1]) : 0;
  }
  return 0;
};

// --- Unified Update Function (No Debounce) ---
const updateStyle = () => {
  if (!props.selectedComponent) return;

  // 创建新的样式对象，完全基于当前的 styleProps.value
  const newStyle = {
    left: `${Math.round(styleProps.value.left || 0)}px`,
    top: `${Math.round(styleProps.value.top || 0)}px`,
    width: `${styleProps.value.width || 10}px`,
    height: `${styleProps.value.height || 10}px`,
    transform: `rotate(${styleProps.value.rotation || 0}deg)`,
    zIndex: styleProps.value.zIndex === undefined ? 1 : styleProps.value.zIndex,
    opacity: styleProps.value.opacity === undefined ? 1 : styleProps.value.opacity,
    backgroundColor: styleProps.value.backgroundColor,
    borderColor: styleProps.value.borderColor,
    borderWidth: `${styleProps.value.borderWidth || 0}px`,
    borderRadius: `${styleProps.value.borderRadius || 0}px`,
    color: styleProps.value.color,
    fontSize: `${styleProps.value.fontSize || 14}px`,
    fontWeight: styleProps.value.fontWeight || 400,
    lineHeight: styleProps.value.lineHeight || '',
    letterSpacing: `${styleProps.value.letterSpacing || 0}px`,
    textAlign: styleProps.value.textAlign || 'left',
  };

  // 特殊处理：SVG的 backgroundColor 应始终为 null/transparent
  if (props.selectedComponent.key === 'SVGStar' || props.selectedComponent.key === 'SVGTriangle') {
    newStyle.backgroundColor = null;
  }

  // 特殊处理：线条组件的高度应该直接反映线宽
  if (props.selectedComponent.key === 'LineShape') {
    newStyle.height = `${styleProps.value.height || 2}px`;
    newStyle.borderWidth = '0px'; // 线条不需要边框宽度
  }

  // 特殊处理：文本组件的文本对齐和字体属性
  if (props.selectedComponent.key === 'VText') {
    newStyle.textAlign = styleProps.value.textAlign || 'left';
    newStyle.fontWeight = styleProps.value.fontWeight || 400;
  }

  // 过滤掉值为 null 或 undefined 的属性
  const finalStyleToSend = {};
  Object.keys(newStyle).forEach((key) => {
    if (newStyle[key] !== null && newStyle[key] !== undefined) {
      finalStyleToSend[key] = newStyle[key];
    }
  });

  if (Object.keys(finalStyleToSend).length === 0) {
    console.log('[PropsEditor updateStyle] No valid style changes to send.');
    return;
  }

  console.log('[PropsEditor updateStyle] Sending filtered style to store:', finalStyleToSend);

  // 直接更新store中的组件
  canvasStore.updateComponentStyle(props.selectedComponent.id, finalStyleToSend);
};

const updateProps = () => {
  if (!props.selectedComponent) return;
  console.log('[PropsEditor updateProps] Sending props to store:', { ...componentProps.value });

  // 直接使用canvasStore的API更新组件属性
  canvasStore.updateComponentProps(props.selectedComponent.id, { ...componentProps.value });
};

// Watch for changes in the selected component prop
watch(
  () => props.selectedComponent, // Source: the selected component prop
  (newVal, oldVal) => {
    console.log('[PropsEditor Watcher] Triggered. New ID:', newVal?.id, 'Old ID:', oldVal?.id);

    // --- Reset/Update Logic WITHOUT extra delays ---

    // Condition 1: A new, different component is selected
    if (newVal && newVal.id !== oldVal?.id) {
      console.log(`[PropsEditor Watcher] Updating for component ${newVal.id}`);
      const style = newVal.style || {};
      const cProps = newVal.props || {};

      // --- Define Default Values (for fallback only) ---
      const defaultStyles = {
        left: 0,
        top: 0,
        width: 100,
        height: 100,
        rotation: 0,
        zIndex: 1,
        opacity: 1,
        backgroundColor: null,
        borderColor: '#000000',
        borderWidth: 0,
        borderRadius: 0,
        fontSize: 14,
        fontWeight: 400,
        lineHeight: '',
        letterSpacing: 0,
        textAlign: 'left',
        color: '#000000',
      };

      // --- Build styleProps: Prioritize incoming style, use defaults as fallback ---
      styleProps.value = {
        left: Math.round(parsePx(style.left ?? defaultStyles.left)),
        top: Math.round(parsePx(style.top ?? defaultStyles.top)),
        width: parsePx(style.width ?? defaultStyles.width),
        height: parsePx(style.height ?? defaultStyles.height),
        rotation: parseRotation(style.transform) ?? defaultStyles.rotation,
        zIndex: style.zIndex ?? defaultStyles.zIndex, // Use ?? for potential 0 value
        opacity: style.opacity ?? defaultStyles.opacity,

        // Initialize colors - will be overwritten below if applicable
        backgroundColor: style.backgroundColor ?? defaultStyles.backgroundColor,
        borderColor: style.borderColor ?? defaultStyles.borderColor,
        borderWidth: parsePx(style.borderWidth ?? defaultStyles.borderWidth),
        borderRadius: parsePx(style.borderRadius ?? defaultStyles.borderRadius),

        // Text/SVG properties
        fontSize: parsePx(style.fontSize ?? defaultStyles.fontSize),
        fontWeight: style.fontWeight ?? defaultStyles.fontWeight,
        lineHeight: style.lineHeight ?? defaultStyles.lineHeight,
        letterSpacing: parsePx(style.letterSpacing ?? defaultStyles.letterSpacing),
        textAlign: style.textAlign ?? defaultStyles.textAlign,
        color: style.color ?? defaultStyles.color, // Use incoming or default
      };

      // --- Handle specific overrides ---
      if (newVal.key === 'SVGStar' || newVal.key === 'SVGTriangle') {
        // For SVG, ensure backgroundColor in the form is null,
        // and color field gets the actual fill color (which might be in style.color)
        styleProps.value.backgroundColor = null;
        styleProps.value.color = style.color ?? defaultStyles.color; // Re-confirm color from style.color
      }
      // No 'else' needed here as the general population above already handled non-SVG cases.

      // --- Update component props ---
      componentProps.value = { ...cProps };

      console.log('[PropsEditor Watcher] State updated (new component).', {
        styleProps: JSON.parse(JSON.stringify(styleProps.value)),
        componentProps: JSON.parse(JSON.stringify(componentProps.value)),
      });

      // Condition 2: Component is deselected (newVal is null, oldVal existed)
    } else if (!newVal && oldVal) {
      console.log('[PropsEditor Watcher] Component deselected, resetting form.');
      // Reset the form fields using default values
      styleProps.value = {
        left: 0,
        top: 0,
        width: 0,
        height: 0,
        rotation: 0,
        zIndex: 1,
        opacity: 1,
        backgroundColor: null,
        borderColor: null,
        borderWidth: 0,
        borderRadius: 0,
        fontSize: 14,
        fontWeight: 400,
        lineHeight: '',
        letterSpacing: 0,
        textAlign: 'left',
        color: '#000000',
      };
      componentProps.value = {};
      console.log('[PropsEditor Watcher] State reset (deselected).');

      // Other cases (no state change needed)
    } else if (newVal && oldVal && newVal.id === oldVal.id) {
      console.log('[PropsEditor Watcher] Same component selected, processing skipped.');
    } else if (!newVal && !oldVal) {
      console.log('[PropsEditor Watcher] Initial load with no selection, processing skipped.');
    }
  },
  { immediate: true, deep: false } // Run immediately, shallow watch
);

// 添加一个对当前选中组件style变化的监听器
watch(
  () => props.selectedComponent?.style,
  (newStyle) => {
    if (!props.selectedComponent || !newStyle) return;

    console.log('[PropsEditor] 组件Style变化检测:', props.selectedComponent.id);

    // 更新所有样式属性，而不仅仅是位置相关属性
    if (newStyle.left !== undefined) {
      styleProps.value.left = Math.round(parsePx(newStyle.left));
    }
    if (newStyle.top !== undefined) {
      styleProps.value.top = Math.round(parsePx(newStyle.top));
    }
    if (newStyle.width !== undefined) {
      styleProps.value.width = parsePx(newStyle.width);
    }
    if (newStyle.height !== undefined) {
      styleProps.value.height = parsePx(newStyle.height);
    }
    if (newStyle.transform !== undefined) {
      styleProps.value.rotation = parseRotation(newStyle.transform);
    }
    if (newStyle.zIndex !== undefined) {
      styleProps.value.zIndex = newStyle.zIndex;
    }
    if (newStyle.opacity !== undefined) {
      styleProps.value.opacity = newStyle.opacity;
    }
    if (newStyle.backgroundColor !== undefined) {
      styleProps.value.backgroundColor = newStyle.backgroundColor;
    }
    if (newStyle.borderColor !== undefined) {
      styleProps.value.borderColor = newStyle.borderColor;
    }
    if (newStyle.borderWidth !== undefined) {
      styleProps.value.borderWidth = parsePx(newStyle.borderWidth);
    }
    if (newStyle.borderRadius !== undefined) {
      styleProps.value.borderRadius = parsePx(newStyle.borderRadius);
    }
    if (newStyle.color !== undefined) {
      styleProps.value.color = newStyle.color;
    }
    if (newStyle.fontSize !== undefined) {
      styleProps.value.fontSize = parsePx(newStyle.fontSize);
    }
    if (newStyle.fontWeight !== undefined) {
      styleProps.value.fontWeight = newStyle.fontWeight;
    }
    if (newStyle.lineHeight !== undefined) {
      styleProps.value.lineHeight = newStyle.lineHeight;
    }
    if (newStyle.letterSpacing !== undefined) {
      styleProps.value.letterSpacing = parsePx(newStyle.letterSpacing);
    }
    if (newStyle.textAlign !== undefined) {
      styleProps.value.textAlign = newStyle.textAlign;
    }
  },
  { deep: true }
);

// 添加一个对当前选中组件props变化的监听器
watch(
  () => props.selectedComponent?.props,
  (newProps) => {
    if (!props.selectedComponent || !newProps) return;

    console.log('[PropsEditor] 组件Props变化检测:', props.selectedComponent.id);

    // 更新本地表单的props值
    componentProps.value = { ...newProps };
  },
  { deep: true }
);
</script>

<style scoped>
.props-editor {
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden; /* 让内部元素控制滚动 */
}

.props-placeholder {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
}

.props-placeholder h4 {
  text-align: center;
  color: #909399;
  font-size: 16px;
}

.attr-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background-color: #fff;
}

.title {
  text-align: center;
  margin: 0;
  padding: 10px 0;
  height: 40px;
  line-height: 20px;
  border-bottom: 1px solid #e4e7ed;
  font-size: 16px;
  font-weight: 500;
  color: #606266;
  flex-shrink: 0;
  background-color: #f5f7fa;
  z-index: 10;
}

.attr-list {
  flex: 1;
  overflow-y: auto;
  padding: 10px 15px 20px;
  margin-bottom: 0;
}

.component-type {
  margin-bottom: 15px;
  font-size: 14px;
  color: #606266;
  padding: 5px 0;
  border-bottom: 1px dashed #e4e7ed;
}

.attr-collapse {
  border-top: none;
  border-bottom: none;
  width: 100%;
}

.attr-list :deep(.el-collapse-item__header) {
  font-size: 15px;
  font-weight: 600;
  border-bottom: 1px solid #ebeef5;
  padding-left: 10px;
  height: 42px;
  line-height: 42px;
  background-color: #f5f7fa;
  color: #303133;
}

.attr-list :deep(.el-collapse-item__wrap) {
  border-bottom: none;
}

.attr-list :deep(.el-collapse-item__content) {
  padding-top: 15px;
  padding-bottom: 5px;
}

.attr-form {
  padding: 0 5px;
  width: 100%;
}

.attr-form-item {
  margin-bottom: 20px;
  width: 100%;
  display: flex;
  flex-direction: column;
}

.attr-label {
  color: #606266;
  font-size: 14px;
  margin-bottom: 8px;
  font-weight: 500;
}

.attr-form :deep(.el-input) {
  width: 100%;
}

.attr-form :deep(.el-input-number) {
  width: 100%;
}

.attr-form :deep(.el-input__wrapper),
.attr-form :deep(.el-input-number__wrapper) {
  padding: 1px 12px;
  box-shadow: 0 0 0 1px #dcdfe6 inset;
}

.attr-form :deep(.el-slider) {
  margin: 8px 0;
  width: 100%;
}

.attr-form :deep(.el-slider__runway) {
  margin: 8px 0;
}

.attr-form :deep(.el-color-picker) {
  width: 100%;
  display: flex;
  height: auto;
  margin-top: 5px;
}

.attr-form :deep(.el-color-picker__trigger) {
  width: 100%;
  height: 32px;
  padding: 4px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
}

.attr-form :deep(.el-color-picker__color) {
  border: none;
}

.attr-form :deep(.el-color-picker__mask) {
  height: 100%;
}

.attr-form :deep(.el-color-picker__icon) {
  margin-top: 2px;
}

.attr-form :deep(.el-input-number__decrease),
.attr-form :deep(.el-input-number__increase) {
  border-color: #dcdfe6;
  background-color: #f5f7fa;
}

.attr-form :deep(.el-slider__button) {
  border: 2px solid #409eff;
}

.attr-form :deep(.el-input.is-disabled .el-input__wrapper) {
  background-color: #f5f7fa;
}

.attr-form :deep(.el-slider__runway.disabled) {
  background-color: #e4e7ed;
}

p {
  color: #909399;
  font-size: 13px;
  text-align: center;
  margin-top: 10px;
}
</style>
