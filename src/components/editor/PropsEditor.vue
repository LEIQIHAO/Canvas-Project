<template>
  <div class="props-editor">
    <!-- 画笔工具面板 -->
    <div v-if="editorMode === 'paintbrush'" class="paint-tool-panel">
      <div class="title">画笔工具</div>

      <div class="attr-list">
        <div class="attr-form">
          <div class="attr-form-item">
            <div class="attr-label">画笔颜色</div>
            <el-color-picker v-model="brushColor" show-alpha @change="updateBrushColor" />
          </div>

          <div class="attr-form-item">
            <div class="attr-label">画笔大小 ({{ brushSize }}px)</div>
            <el-slider v-model="brushSize" :min="1" :max="30" :step="1" @change="updateBrushSize" />
          </div>

          <div class="attr-form-item">
            <el-button type="danger" @click="clearCanvas"> 清空画布 </el-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 常规组件属性面板 -->
    <div v-else-if="!selectedComponent" class="props-placeholder">
      <h4>未选中组件</h4>
    </div>
    <div v-else class="attr-container">
      <div class="title">组件属性</div>

      <div class="attr-list">
        <div class="component-type">
          <el-tag
            size="medium"
            :type="getTagType(selectedComponent.key)"
            :effect="getTagEffect(selectedComponent.key)"
          >
            {{ selectedComponent.label || selectedComponent.key }}
          </el-tag>
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
          <el-collapse-item v-if="selectedComponent.key !== 'VText'" title="组件属性" name="props">
            <div v-if="selectedComponent.key === 'VText'" class="attr-form">
              <!-- This VText specific section inside will effectively never be shown due to the outer v-if,
                   but keeping the structure for potential future changes or clarity.
                   Alternatively, this inner div could be removed entirely. -->
              <div class="attr-form-item">
                <div class="attr-label">文本内容</div>
                <el-input
                  v-model="componentProps.content"
                  type="textarea"
                  size="small"
                  :update-model-value="true"
                  @input="updateProps"
                  @focus="handleVTextFocus"
                />
              </div>
            </div>

            <div v-else-if="selectedComponent.key === 'VButton'" class="attr-form">
              <div class="attr-form-item">
                <div class="attr-label">按钮文字</div>
                <el-input v-model="componentProps.text" size="small" @change="updateProps" />
              </div>
            </div>

            <div v-else-if="selectedComponent.key === 'VTag'" class="attr-form">
              <div class="attr-form-item">
                <div class="attr-label">标签文字</div>
                <el-input
                  v-model="componentProps.text"
                  size="small"
                  @input="updateProps"
                  @focus="handleVTagFocus"
                />
              </div>
              <div class="attr-form-item">
                <div class="attr-label">标签类型</div>
                <el-select v-model="componentProps.tagType" size="small" @change="updateProps">
                  <el-option label="默认" value="" />
                  <el-option label="成功" value="success" />
                  <el-option label="信息" value="info" />
                  <el-option label="警告" value="warning" />
                  <el-option label="危险" value="danger" />
                </el-select>
              </div>
              <div class="attr-form-item">
                <div class="attr-label">标签效果</div>
                <el-select v-model="componentProps.tagEffect" size="small" @change="updateProps">
                  <el-option label="浅色" value="light" />
                  <el-option label="深色" value="dark" />
                  <el-option label="朴素" value="plain" />
                </el-select>
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

          <!-- 字体样式 -->
          <el-collapse-item v-if="selectedComponent.key !== 'VText'" title="字体样式" name="style">
            <div class="attr-form">
              <div class="attr-form-item">
                <div class="attr-label">字体大小</div>
                <el-input-number
                  v-model="styleProps.fontSize"
                  controls-position="right"
                  size="small"
                  :min="1"
                  @change="updateStyle"
                />
              </div>

              <div class="attr-form-item">
                <div class="attr-label">字体粗细</div>
                <el-select v-model="styleProps.fontWeight" size="small" @change="updateStyle">
                  <el-option label="正常" value="400" />
                  <el-option label="加粗" value="700" />
                </el-select>
              </div>

              <div class="attr-form-item">
                <div class="attr-label">行高</div>
                <el-input v-model="styleProps.lineHeight" size="small" @change="updateStyle" />
              </div>

              <div class="attr-form-item">
                <div class="attr-label">字间距</div>
                <el-input-number
                  v-model="styleProps.letterSpacing"
                  controls-position="right"
                  size="small"
                  :min="0"
                  @change="updateStyle"
                />
              </div>

              <div class="attr-form-item">
                <div class="attr-label">文本对齐</div>
                <el-select v-model="styleProps.textAlign" size="small" @change="updateStyle">
                  <el-option label="左对齐" value="left" />
                  <el-option label="居中对齐" value="center" />
                  <el-option label="右对齐" value="right" />
                </el-select>
              </div>
            </div>
          </el-collapse-item>
        </el-collapse>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed, nextTick, inject } from 'vue';
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
  ElButton,
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
const activeCollapseNames = ref(['transform', 'props', 'fontStyle']); // Open by default

// 注入依赖
const editorMode = inject('editorMode', ref('select'));
const brushColor = inject('brushColor', ref('#000000'));
const brushSize = inject('brushSize', ref(5));
const clearPaintCanvas = inject('clearPaintCanvas', () => {});

// 根据组件类型获取Tag标签的类型
const getTagType = (componentKey) => {
  const typeMap = {
    VText: '',
    VButton: 'primary',
    VTag: 'success',
    Picture: 'warning',
    RectShape: 'info',
    LineShape: 'info',
    CircleShape: 'info',
    SVGStar: 'danger',
    SVGTriangle: 'danger',
    VTable: '',
    VChart: 'warning',
    VInput: 'primary',
    group: 'success',
  };
  return typeMap[componentKey] || '';
};

// 根据组件类型获取Tag标签的效果
const getTagEffect = (componentKey) => {
  // 部分组件使用plain效果，其他使用light效果
  const plainEffectComponents = ['VButton', 'VTag', 'VInput', 'VTable', 'VChart'];
  return plainEffectComponents.includes(componentKey) ? 'plain' : 'light';
};

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
    zIndex: parseInt(styleProps.value.zIndex || 1, 10),
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
    return;
  }

  // 直接更新store中的组件
  canvasStore.updateComponentStyle(props.selectedComponent.id, finalStyleToSend);
};

const updateProps = () => {
  if (!props.selectedComponent) return;

  // 直接使用canvasStore的API更新组件属性
  canvasStore.updateComponentProps(props.selectedComponent.id, { ...componentProps.value });

  // 如果是VText组件，需要特殊处理确保内容立即更新
  if (props.selectedComponent.key === 'VText') {
    // 强制刷新组件，确保内容立即显示
    nextTick(() => {
      // 通过获取最新组件状态确保同步
      const currentComponent = canvasStore.components.find(
        (c) => c.id === props.selectedComponent.id
      );
      if (currentComponent && currentComponent.props) {
        // 确保组件的实际状态与编辑器状态同步
        currentComponent.props.content = componentProps.value.content;
      }
    });
  }

  // 如果是VTag组件，需要特殊处理确保文本立即更新
  if (props.selectedComponent.key === 'VTag') {
    // 强制刷新组件，确保文本立即显示
    nextTick(() => {
      // 通过获取最新组件状态确保同步
      const currentComponent = canvasStore.components.find(
        (c) => c.id === props.selectedComponent.id
      );
      if (currentComponent && currentComponent.props) {
        // 确保组件的实际状态与编辑器状态同步
        currentComponent.props.text = componentProps.value.text;
      }
    });
  }
};

// 处理VText文本框获得焦点事件
const handleVTextFocus = () => {
  // 确保编辑器内容与当前组件内容同步
  if (props.selectedComponent?.key === 'VText') {
    const currentComponent = canvasStore.components.find(
      (c) => c.id === props.selectedComponent.id
    );
    if (currentComponent && currentComponent.props) {
      componentProps.value.content = currentComponent.props.content;
    }
  }
};

// 处理VTag文本框获得焦点事件
const handleVTagFocus = () => {
  // 确保编辑器内容与当前组件内容同步
  if (props.selectedComponent?.key === 'VTag') {
    const currentComponent = canvasStore.components.find(
      (c) => c.id === props.selectedComponent.id
    );
    if (currentComponent && currentComponent.props) {
      componentProps.value.text = currentComponent.props.text;
    }
  }
};

// Watch for changes in the selected component prop
watch(
  () => props.selectedComponent, // Source: the selected component prop
  (newVal, oldVal) => {
    // --- Reset/Update Logic WITHOUT extra delays ---

    // Condition 1: A new, different component is selected
    if (newVal && newVal.id !== oldVal?.id) {
      // 查找canvasStore中的最新组件数据
      const latestComponent = canvasStore.components.find((c) => c.id === newVal.id) || newVal;

      const style = latestComponent.style || {};
      const cProps = latestComponent.props || {};

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
      if (latestComponent.key === 'SVGStar' || latestComponent.key === 'SVGTriangle') {
        // For SVG, ensure backgroundColor in the form is null,
        // and color field gets the actual fill color (which might be in style.color)
        styleProps.value.backgroundColor = null;
        styleProps.value.color = style.color ?? defaultStyles.color; // Re-confirm color from style.color
      }
      // No 'else' needed here as the general population above already handled non-SVG cases.

      // --- Update component props ---
      componentProps.value = { ...cProps };

      // Condition 2: Component is deselected (newVal is null, oldVal existed)
    } else if (!newVal && oldVal) {
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

      // Other cases (no state change needed)
    } else if (newVal && oldVal && newVal.id === oldVal.id) {
      // 保持相同的组件，不需要处理
    } else if (!newVal && !oldVal) {
      // 初始加载时无选择，不需要处理
    }
  },
  { immediate: true, deep: false } // Run immediately, shallow watch
);

// 添加一个对当前选中组件style变化的监听器
watch(
  () => props.selectedComponent?.style,
  (newStyle) => {
    if (!props.selectedComponent || !newStyle) return;

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

    // 更新本地表单的props值
    componentProps.value = { ...newProps };

    // 如果是VText组件，确保内容实时同步
    if (props.selectedComponent.key === 'VText' && newProps.content !== undefined) {
      // 立即更新文本内容
      componentProps.value.content = newProps.content;
    }
  },
  { deep: true, immediate: true }
);

// 监听canvas store中组件的变化，这样即使编辑VText时也能实时同步到PropsEditor
watch(
  () => canvasStore.components,
  () => {
    // 如果当前选中的是VText组件，检查其内容是否有变化
    if (props.selectedComponent?.key === 'VText') {
      const currentComponent = canvasStore.components.find(
        (c) => c.id === props.selectedComponent.id
      );
      if (currentComponent && currentComponent.props?.content !== componentProps.value.content) {
        componentProps.value.content = currentComponent.props.content;
      }
    }

    // 如果当前选中的是VTag组件，检查其文本是否有变化
    if (props.selectedComponent?.key === 'VTag') {
      const currentComponent = canvasStore.components.find(
        (c) => c.id === props.selectedComponent.id
      );
      if (currentComponent && currentComponent.props?.text !== componentProps.value.text) {
        componentProps.value.text = currentComponent.props.text;
      }
    }
  },
  { deep: true }
);

// 获取最新组件数据的帮助函数
const getLatestComponentData = (componentId) => {
  if (!componentId) return null;
  // 总是从canvasStore.components获取最新数据
  return canvasStore.components.find((c) => c.id === componentId) || null;
};

// 添加一个computed属性来获取最新的组件数据
const latestSelectedComponent = computed(() => {
  if (!props.selectedComponent) return null;
  return getLatestComponentData(props.selectedComponent.id) || props.selectedComponent;
});

// 监听旋转角度变化，实时更新画布上的组件旋转
watch(
  () => styleProps.value.rotation,
  (newRotation) => {
    if (!props.selectedComponent) return;

    // 确保旋转角度范围在0-360之间
    const normalizedRotation = ((newRotation % 360) + 360) % 360;

    // 更新组件的transform样式以实现旋转
    canvasStore.updateComponentStyle(props.selectedComponent.id, {
      transform: `rotate(${normalizedRotation}deg)`,
    });
  }
);

// 添加对transform变化的监听，确保双向同步
watch(
  () => props.selectedComponent?.style?.transform,
  (newTransform) => {
    if (!props.selectedComponent) return;

    // 解析transform中的旋转角度
    const parsedRotation = parseRotation(newTransform);

    // 更新本地旋转角度状态
    if (parsedRotation !== styleProps.value.rotation) {
      styleProps.value.rotation = parsedRotation;
    }
  }
);

// 更新画笔颜色
const updateBrushColor = () => {
  // 这里会自动更新，因为使用的是响应式引用
};

// 更新画笔大小
const updateBrushSize = () => {
  // 这里会自动更新，因为使用的是响应式引用
};

// 清空画布
const clearCanvas = () => {
  clearPaintCanvas();
};
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
  display: flex;
  align-items: center;
  justify-content: flex-start;
}

.component-type span {
  margin-right: 8px;
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

.paint-tool-panel {
  padding: 15px;
}

.paint-tool-panel .title {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 16px;
  border-bottom: 1px solid #e0e0e0;
  padding-bottom: 8px;
}
</style>
