<template>
  <div class="editor-container">
    <el-container style="height: 100vh; overflow: hidden">
      <el-aside width="200px" class="left-aside">
        <!-- Left Panel Split: Top for Materials, Bottom for Layers -->
        <div class="left-panel materials-panel">
          <h4>物料区</h4>
          <el-scrollbar>
            <ul class="material-list">
              <li
                v-for="material in materials"
                :key="material.key"
                class="material-item"
                draggable="true"
                :title="material.label"
                @dragstart="handleDragStart(material, $event)"
                @dragend="handleDragEnd"
              >
                <el-icon :size="32">
                  <component :is="material.icon" />
                </el-icon>
              </li>
            </ul>
          </el-scrollbar>
        </div>
        <div class="left-panel layer-panel-container">
          <LayerPanel />
        </div>
      </el-aside>
      <el-container style="overflow: hidden">
        <el-header class="editor-header">
          <!-- 顶部操作栏 -->
          <div class="header-left">编辑器标题</div>
          <div class="header-center" />
          <!-- 预留中间区域 -->
          <div class="header-right">
            <!-- Add Undo/Redo Buttons -->
            <el-button size="small" :disabled="!canvasStore.canUndo" @click="canvasStore.undo">
              撤销
            </el-button>
            <el-button size="small" :disabled="!canvasStore.canRedo" @click="canvasStore.redo">
              重做
            </el-button>
            <el-divider direction="vertical" />
            <!-- Group/Ungroup -->
            <el-button size="small" :disabled="!canGroup" @click="handleGroup"> 组合 </el-button>
            <el-button size="small" :disabled="!canUngroup" @click="handleUngroup">
              解组
            </el-button>
            <el-divider direction="vertical" />
            <!-- Separator -->
            <el-button type="primary" size="small" @click="handlePreview"> 预览 </el-button>
            <el-button size="small" @click="handleSave"> 保存 </el-button>
            <el-button size="small" @click="handleLoad"> 加载 </el-button>
            <el-button type="danger" size="small" @click="handleClear"> 清空 </el-button>
            <el-button
              type="danger"
              size="small"
              :disabled="canvasStore.selectedComponentIds.length === 0"
              @click="handleDelete"
            >
              删除选中
            </el-button>
          </div>
        </el-header>
        <el-main
          ref="canvasMainRef"
          class="canvas-main"
          @dragover.prevent
          @dragenter.prevent
          @dragleave.prevent
          @drop="handleDrop"
        >
          <!-- 中间画布区 -->
          <div
            ref="canvasPanelRef"
            class="center-panel"
            @dragover.prevent
            @dragenter.prevent
            @drop.stop="handleDrop"
            @click.self="handleCanvasClick"
          >
            <!-- Render Canvas Components Recursively -->
            <CanvasComponentRenderer
              v-for="component in canvasStore.components"
              :key="component.id"
              :component="component"
              :is-selected="canvasStore.selectedComponentIds.includes(component.id)"
              :is-primary-selection="canvasStore.primarySelectedComponent?.id === component.id"
              :get-component-by-type="getComponentByType"
              @component-mousedown="handleComponentMouseDown"
              @resize-mousedown="handleResizeHandleMouseDown"
              @rotate-mousedown="handleRotateHandleMouseDown"
            />

            <!-- Alignment Lines -->
            <div
              v-for="(line, index) in alignmentLines"
              :key="`line-${index}`"
              class="alignment-line"
              :class="line.type"
              :style="line.style"
            />
          </div>
        </el-main>
      </el-container>
      <el-aside width="320px" class="right-aside">
        <!-- 右侧属性配置区 -->
        <div class="right-panel">
          <!-- 使用属性编辑器组件 -->
          <PropsEditor :selected-component="canvasStore.primarySelectedComponent" />
        </div>
      </el-aside>
    </el-container>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, defineAsyncComponent } from 'vue';
import { useCanvasStore } from '@/stores/canvas'; // 导入 store
import PropsEditor from '@/components/editor/PropsEditor.vue'; // 导入属性编辑器
import { ElButton, ElInput, ElMessage, ElMessageBox, ElDivider } from 'element-plus'; // Added ElMessage, ElMessageBox, ElDivider
import LayerPanel from '@/components/editor/LayerPanel.vue'; // Import LayerPanel
import { ElScrollbar, ElContainer, ElAside, ElHeader, ElMain, ElIcon } from 'element-plus'; // Import ElScrollbar etc.
// Import specific icons
import {
  Document,
  Tickets,
  EditPen,
  Picture as PictureIcon,
  Rank,
  FullScreen,
  Minus,
  DataLine,
  Star,
  Warning,
  Grid,
  DataAnalysis,
} from '@element-plus/icons-vue';

// Import specific icons
import {
  Document as CustomDocument,
  Tickets as CustomTickets,
  EditPen as CustomEditPen,
  Picture as CustomPicture,
  Rank as CustomRank,
  FullScreen as CustomFullScreen,
  Minus as CustomMinus,
  DataLine as CustomDataLine,
  Star as CustomStar,
  Warning as CustomWarning,
  Grid as CustomGrid,
  DataAnalysis as CustomDataAnalysis,
} from '@element-plus/icons-vue';

// Import custom components
import VText from '@/components/custom/VText.vue';
import VButton from '@/components/custom/VButton.vue';
import Picture from '@/components/custom/Picture.vue';
import RectShape from '@/components/custom/RectShape.vue';
import LineShape from '@/components/custom/LineShape.vue';
import CircleShape from '@/components/custom/CircleShape.vue';
import SVGTriangle from '@/components/custom/SVGTriangle.vue';
import SVGStar from '@/components/custom/SVGStar.vue';
import VTable from '@/components/custom/VTable.vue';
import VChart from '@/components/custom/VChart.vue';

// Dynamically import the recursive component renderer to avoid self-reference issues
const CanvasComponentRenderer = defineAsyncComponent(
  () => import('@/components/editor/CanvasComponentRenderer.vue')
);

// 占位符组件 - 用于尚未实现的组件类型
const CanvasPlaceholder = {
  template:
    '<div style="width:100%;height:100%;border:1px dashed #ccc;display:flex;align-items:center;justify-content:center;font-size:12px;color:#999;">未实现</div>',
}; // Generic Placeholder

// Simple Placeholder Components
const CanvasText = {
  template: '<span class="canvas-text-inner">{{ content }}</span>',
  props: ['content'],
};
const CanvasImage = {
  template: '<img :src="src" style="width: 100%; height: 100%; object-fit: cover;">',
  props: ['src'],
};
const CanvasRect = {
  template: '<div style="width:100%;height:100%; border: 1px solid #000; background: #fff"></div>',
}; // Basic div
const CanvasLine = { template: '<div style="width:100%;height:100%; background: #000;"></div>' }; // Basic div, height controlled by style
const CanvasCircle = {
  template:
    '<div style="width:100%;height:100%; border: 1px solid #000; background: #fff; border-radius: 50%;"></div>',
}; // Basic div
const CanvasVanButton = {
  template: '<ElButton style="width: 100%; height: 100%;">{{ text }}</ElButton>',
  props: ['text'],
};

// --- Assign icons to local constants (mapping from visual-drag-demo names) ---
const IconDocument = CustomDocument; // wenben
const IconTickets = CustomTickets; // button (Element Button)
const IconEditPen = CustomEditPen; // (Input - not in original list but we added)
const IconPicture = CustomPicture; // tupian
const IconFullScreen = CustomFullScreen; // juxing
const IconMinus = CustomMinus; // zhixian
const IconDataLine = CustomDataLine; // 24gl-circle
const IconStar = CustomStar; // kongwujiaoxing
const IconWarning = CustomWarning; // xingzhuang-sanjiaoxing (Triangle)
const IconGrid = CustomGrid; // biaoge
const IconDataAnalysis = CustomDataAnalysis; // el-icon-data-analysis (Chart)
const IconRank = CustomRank; // Placeholder for Vant Button (if kept)

// 获取 store 实例
const canvasStore = useCanvasStore();

// 获取画布元素的引用
const canvasMainRef = ref(null);
const canvasPanelRef = ref(null);

// --- Materials (Based on visual-drag-demo structure) ---
const materials = ref([
  // Corresponds to component-list.js in visual-drag-demo
  {
    component: 'VText',
    label: '文字',
    icon: IconDocument,
    propValue: '文字',
    // 与 visual-drag-demo/component-list.js 对齐
    style: {
      width: 200,
      height: 28,
      fontSize: 14,
      fontWeight: 400,
      lineHeight: '',
      letterSpacing: 0,
      textAlign: 'center',
      color: '',
      verticalAlign: 'middle' /* padding is not in original, removed */,
    },
  },
  {
    component: 'VButton',
    label: '按钮',
    icon: IconTickets,
    propValue: '按钮',
    // 与 visual-drag-demo/component-list.js 对齐
    style: {
      width: 100,
      height: 34,
      borderWidth: 1,
      borderColor: '#000',
      color: '#000',
      backgroundColor: '#fff',
      fontSize: 14,
      fontWeight: 400,
      lineHeight: '',
      letterSpacing: 0,
      textAlign: 'center',
      verticalAlign: 'middle',
      padding: '8px 15px',
    },
  },
  {
    component: 'Picture',
    label: '图片',
    icon: IconPicture,
    propValue: { url: 'https://via.placeholder.com/300x200' }, // 保持 props 结构
    // 与 visual-drag-demo/component-list.js 对齐 (添加 borderRadius)
    style: { width: 300, height: 200, borderRadius: '' },
  },
  {
    component: 'RectShape',
    label: '矩形',
    icon: IconFullScreen,
    propValue: '&nbsp;',
    // 与 visual-drag-demo/component-list.js 对齐
    style: {
      width: 100,
      height: 100,
      fontSize: 14,
      fontWeight: 400,
      lineHeight: '',
      letterSpacing: 0,
      textAlign: 'center',
      color: '',
      borderColor: '#000',
      borderWidth: 1,
      backgroundColor: '',
      borderStyle: 'solid',
      borderRadius: '',
      verticalAlign: 'middle',
    },
  },
  {
    component: 'LineShape',
    label: '直线',
    icon: IconMinus,
    propValue: '',
    // 与 visual-drag-demo/component-list.js 对齐 (已匹配)
    style: { width: 150, height: 5, backgroundColor: '#000' },
  },
  {
    component: 'CircleShape',
    label: '圆形',
    icon: IconDataLine,
    propValue: '&nbsp;',
    // 与 visual-drag-demo/component-list.js 对齐 (保持50%圆角，补充其他属性)
    style: {
      width: 100,
      height: 100,
      fontSize: 14,
      fontWeight: 400,
      lineHeight: '',
      letterSpacing: 0,
      textAlign: 'center',
      color: '',
      borderColor: '#000',
      borderWidth: 1,
      backgroundColor: '',
      borderStyle: 'solid',
      borderRadius: '50%' /* Visual consistency */,
      verticalAlign: 'middle',
    },
  },
  {
    component: 'SVGStar',
    label: '星形',
    icon: IconStar,
    propValue: '',
    style: {
      width: 60,
      height: 60,
      fontSize: 14,
      fontWeight: 400,
      lineHeight: '',
      letterSpacing: 0,
      textAlign: 'center',
      color: '',
      borderColor: '#000',
      backgroundColor: '',
    },
  },
  {
    component: 'SVGTriangle',
    label: '三角形',
    icon: IconWarning,
    propValue: '',
    style: {
      width: 60,
      height: 60,
      fontSize: 14,
      fontWeight: 400,
      lineHeight: '',
      letterSpacing: 0,
      textAlign: 'center',
      color: '',
      borderColor: '#000',
      backgroundColor: '',
    },
  },
  {
    component: 'VTable',
    label: '表格',
    icon: IconGrid,
    propValue: {
      data: [
        ['表头1', '表头2'],
        ['内容1', '内容2'],
      ],
      stripe: true,
      thBold: true,
    },
    // 补充通用样式
    style: {
      width: 400,
      height: 150,
      fontSize: 14,
      fontWeight: 400,
      lineHeight: '',
      letterSpacing: 0,
      textAlign: 'center',
      color: '',
      verticalAlign: 'middle',
    },
  },
  {
    component: 'VChart',
    label: '图表',
    icon: IconDataAnalysis,
    propValue: {
      option: {
        /* Default chart options */
      },
    },
    // 补充通用样式
    style: {
      width: 400,
      height: 300,
      fontSize: 14,
      fontWeight: 400,
      lineHeight: '',
      letterSpacing: 0,
      textAlign: 'center',
      color: '',
      verticalAlign: 'middle',
    },
  },
  // Keep our added Input for now?
  {
    component: 'VInput',
    label: '输入框',
    icon: IconEditPen,
    propValue: { placeholder: '请输入...' },
    style: { width: 200, height: 32 },
  }, // Use VInput key
]);

// --- Drag & Drop ---
let draggedMaterialIndex = null; // 保存索引而不是整个对象

const handleDragStart = (material, event) => {
  // 找到物料在数组中的索引
  const index = materials.value.findIndex((m) => m === material);
  if (index === -1) {
    console.error('拖拽物料未在列表中找到:', material);
    return;
  }
  console.log(`开始拖动: ${material.label} (索引: ${index})`);
  draggedMaterialIndex = index; // 保存索引

  try {
    // 传递索引
    event.dataTransfer.setData('text/plain', index.toString()); // 存储索引为字符串
    event.dataTransfer.effectAllowed = 'copy';

    // 设置拖拽图像（保持不变）
    if (typeof event.dataTransfer.setDragImage === 'function') {
      const dragIcon = document.createElement('div');
      dragIcon.textContent = material.label || '拖拽';
      dragIcon.style.cssText =
        'position:absolute;top:-1000px;width:50px;height:50px;background:#fff;border:1px solid #ddd;border-radius:4px;padding:4px;text-align:center;';
      document.body.appendChild(dragIcon);
      event.dataTransfer.setDragImage(dragIcon, 25, 25);
      setTimeout(() => document.body.removeChild(dragIcon), 0);
    }
  } catch (e) {
    console.error('设置拖拽数据失败:', e);
  }
};

const handleDragEnd = () => {
  console.log('拖动结束，清理拖拽索引');
  draggedMaterialIndex = null; // 清理索引
};

// Updated to map original keys to custom components
const getComponentByType = (type) => {
  switch (type) {
    case 'VText':
      return VText;
    case 'VButton':
      return VButton;
    case 'Picture':
      return Picture;
    case 'RectShape':
      return RectShape;
    case 'LineShape':
      return LineShape;
    case 'CircleShape':
      return CircleShape;
    case 'SVGStar':
      return SVGStar;
    case 'SVGTriangle':
      return SVGTriangle;
    case 'VTable':
      return VTable;
    case 'VChart':
      return VChart;
    case 'VInput':
      return ElInput;
    case 'group':
      return 'div';
    default:
      console.warn(`未知组件类型: ${type}`);
      return 'div';
  }
};

// 画布放置处理函数
const handleDrop = (event) => {
  event.preventDefault();
  event.stopPropagation();

  console.log('--- handleDrop triggered ---', event);

  let materialIndex = -1;
  try {
    const data = event.dataTransfer.getData('text/plain');
    console.log('DataTransfer data:', data);
    if (data !== null && data !== '') {
      materialIndex = parseInt(data, 10); // 解析索引
      console.log('从dataTransfer获取索引成功:', materialIndex);
    } else {
      // 兼容之前的备选方案（如果需要）
      if (draggedMaterialIndex !== null) {
        materialIndex = draggedMaterialIndex;
        console.log('使用备选索引:', materialIndex);
      }
    }
  } catch (e) {
    console.error('解析拖拽数据（索引）失败:', e);
  }

  // 清理备选索引
  draggedMaterialIndex = null;

  if (materialIndex === -1 || isNaN(materialIndex)) {
    console.error('无法获取有效的物料索引');
    return;
  }

  // 从 materials 数组中获取物料
  const material = materials.value[materialIndex];
  if (!material) {
    console.error(`根据索引 ${materialIndex} 未找到物料`);
    return;
  }
  console.log('找到物料:', material);

  // 验证画布引用
  if (!canvasPanelRef.value) {
    console.error('画布引用 (canvasPanelRef) 不可用');
    return;
  }
  console.log('画布引用可用');

  // 计算放置位置 (保持不变)
  const canvasRect = canvasPanelRef.value.getBoundingClientRect();
  let dropLeft = event.clientX - canvasRect.left;
  let dropTop = event.clientY - canvasRect.top;
  dropLeft = Math.max(0, dropLeft);
  dropTop = Math.max(0, dropTop);
  console.log('计算出的放置位置 (相对于画布): left:', dropLeft, 'top:', dropTop);

  // 使用获取到的物料创建组件
  console.log('即将调用 createComponentFromMaterial...');
  createComponentFromMaterial(material, dropLeft, dropTop);
};

// 从物料创建组件的辅助函数
const createComponentFromMaterial = (material, left, top) => {
  // 1. 深拷贝样式，确保不影响原始物料
  const rawStyle = JSON.parse(JSON.stringify(material.style || {}));

  // 2. 特殊处理：确保 SVG 组件有明确的背景色设置
  if (material.component === 'SVGStar' || material.component === 'SVGTriangle') {
    if (!rawStyle.backgroundColor || rawStyle.backgroundColor === '') {
      console.log(`为 ${material.component} 设置空背景色`);
      rawStyle.backgroundColor = '';
    }
  }

  // 特殊处理：确保矩形和圆形组件的背景色为空字符串，而不是默认红色
  if (material.component === 'RectShape' || material.component === 'CircleShape') {
    if (!rawStyle.backgroundColor || rawStyle.backgroundColor === '') {
      console.log(`为 ${material.component} 设置空背景色`);
      rawStyle.backgroundColor = '';
    }
  }

  // 3. 根据组件类型转换 propValue 到正确的 props 结构
  let props = {};
  switch (material.component) {
    case 'VText':
      props = { content: material.propValue };
      break;
    case 'VButton':
      props = { text: material.propValue };
      break;
    case 'Picture':
      if (typeof material.propValue === 'object' && material.propValue !== null) {
        props = material.propValue; // 包含 url
      } else {
        // 确保即使 propValue 不是对象也有默认值
        props = { url: material.propValue || 'https://via.placeholder.com/300x200' };
      }
      break;
    case 'SVGStar':
    case 'SVGTriangle':
    case 'RectShape':
    case 'CircleShape':
      props = { propValue: material.propValue }; // 这些组件似乎用 propValue 传递简单值
      break;
    case 'LineShape':
      props = {}; // 直线通常没有内容 prop
      break;
    case 'VTable':
    case 'VChart':
      if (typeof material.propValue === 'object' && material.propValue !== null) {
        props = JSON.parse(JSON.stringify(material.propValue)); // 确保深拷贝
      } else {
        props = {}; // 提供空对象作为默认值
      }
      break;
    case 'VInput':
      if (typeof material.propValue === 'object' && material.propValue !== null) {
        props = material.propValue;
      } else {
        props = { placeholder: '请输入...' };
      }
      break;
    default:
      // 通用处理：尝试深拷贝对象，否则用作 value
      if (typeof material.propValue === 'object' && material.propValue !== null) {
        props = JSON.parse(JSON.stringify(material.propValue));
      } else if (typeof material.propValue === 'string') {
        props = { value: material.propValue }; // 假设默认 key 为 value
      } else {
        props = {}; // 默认空对象
      }
  }

  // 4. 构建组件对象 (不包含位置信息)
  const component = {
    key: material.component,
    label: material.label,
    style: rawStyle, // style 中不包含 left/top
    props: props,
  };

  // 5. 添加到画布，传入组件和初始位置
  console.log('将要添加到画布的组件:', component, '初始位置:', { left, top });
  canvasStore.addComponent({ component, initialPosition: { left, top } });
};

// --- Selection & Canvas Click (No changes needed here) ---

// --- NEW: Alignment Line State ---
const alignmentLines = ref([]); // Stores lines to display: { type: 'vertical'/'horizontal', position: number, style: object }
const alignmentThreshold = 5; // Pixels threshold for snapping/showing lines

// --- Helper Function: Get Component Bounds ---
const getComponentBounds = (component) => {
  if (!component || !component.style) return null;
  const left = parseFloat(component.style.left);
  const top = parseFloat(component.style.top);

  // Need width and height. Try style first, then attempt to get from DOM as fallback (less reliable)
  let width = parseFloat(component.style.width);
  let height = parseFloat(component.style.height);

  // For groups, width/height are on the style. For others, attempt fallback.
  if (component.key !== 'group' && (isNaN(width) || isNaN(height))) {
    // Fallback (less reliable for unrendered/complex components)
    // Try to find the element - might be tricky with nesting
    // For now, let's use default/estimated size if not present
    if (isNaN(width)) width = 100; // Example fallback
    if (isNaN(height)) height = component.key === 'image' ? 100 : 50; // Example fallback
  }

  // If still NaN, return null as bounds are invalid
  if (isNaN(left) || isNaN(top) || isNaN(width) || isNaN(height)) {
    console.warn('Invalid bounds for component:', component.id, { left, top, width, height });
    return null;
  }

  return {
    id: component.id,
    left,
    top,
    right: left + width,
    bottom: top + height,
    centerX: left + width / 2,
    centerY: top + height / 2,
    width,
    height,
  };
};

// --- Helper Function: Calculate Alignment Lines ---
const calculateAlignmentLines = (movingComponentBounds) => {
  if (!movingComponentBounds) {
    alignmentLines.value = [];
    return { snapOffset: { x: 0, y: 0 } }; // No snapping if bounds invalid
  }

  const lines = [];
  const snapOffset = { x: 0, y: 0 }; // How much to adjust position for snapping
  let hasSnappedX = false;
  let hasSnappedY = false;

  const comparePoints = [
    { moving: 'left', static: ['left', 'right', 'centerX'], type: 'vertical' },
    { moving: 'right', static: ['left', 'right', 'centerX'], type: 'vertical' },
    { moving: 'centerX', static: ['left', 'right', 'centerX'], type: 'vertical' },
    { moving: 'top', static: ['top', 'bottom', 'centerY'], type: 'horizontal' },
    { moving: 'bottom', static: ['top', 'bottom', 'centerY'], type: 'horizontal' },
    { moving: 'centerY', static: ['top', 'bottom', 'centerY'], type: 'horizontal' },
  ];

  canvasStore.components.forEach((staticComponent) => {
    if (staticComponent.id === movingComponentBounds.id) return; // Don't compare with self

    const staticBounds = getComponentBounds(staticComponent);
    if (!staticBounds) return;

    comparePoints.forEach((compare) => {
      const movingPointValue = movingComponentBounds[compare.moving];
      compare.static.forEach((staticPointKey) => {
        const staticPointValue = staticBounds[staticPointKey];
        const diff = Math.abs(movingPointValue - staticPointValue);

        if (diff <= alignmentThreshold) {
          // Found alignment
          const linePosition = staticPointValue;
          const lineStyle =
            compare.type === 'vertical'
              ? {
                  left: `${linePosition}px`,
                  top: `${Math.min(movingComponentBounds.top, staticBounds.top)}px`,
                  height: `${Math.max(movingComponentBounds.bottom, staticBounds.bottom) - Math.min(movingComponentBounds.top, staticBounds.top)}px`,
                }
              : {
                  top: `${linePosition}px`,
                  left: `${Math.min(movingComponentBounds.left, staticBounds.left)}px`,
                  width: `${Math.max(movingComponentBounds.right, staticBounds.right) - Math.min(movingComponentBounds.left, staticBounds.left)}px`,
                };

          lines.push({ type: compare.type, position: linePosition, style: lineStyle });

          // Calculate snapping offset (only snap once per axis)
          if (compare.type === 'vertical' && !hasSnappedX) {
            snapOffset.x = staticPointValue - movingPointValue;
            hasSnappedX = true;
          }
          if (compare.type === 'horizontal' && !hasSnappedY) {
            snapOffset.y = staticPointValue - movingPointValue;
            hasSnappedY = true;
          }
        }
      });
    });
  });

  alignmentLines.value = lines;
  return { snapOffset }; // Return snapping offset
};

// --- Update Move Logic ---
const handleComponentMouseDown = (component, event) => {
  event.preventDefault();
  event.stopPropagation();

  const clickedId = component.id;
  const isMultiSelectDrag =
    canvasStore.selectedComponentIds.includes(clickedId) &&
    canvasStore.selectedComponentIds.length > 1;

  // If not part of a multi-selection drag, ensure it becomes the single selection
  if (!isMultiSelectDrag && !canvasStore.selectedComponentIds.includes(clickedId)) {
    canvasStore.selectComponent(clickedId, false); // Make it the single selected item
  }

  const startX = event.clientX;
  const startY = event.clientY;

  // Get initial bounds for ALL selected components
  const initialSelectedBounds = canvasStore.selectedComponentIds
    .map((id) => {
      const comp = canvasStore.components.find((c) => c.id === id);
      const bounds = getComponentBounds(comp);
      // 存储原始的浮点数值，用于精确计算 delta
      if (bounds) {
        bounds.initialFloatLeft = parseFloat(comp.style.left || 0);
        bounds.initialFloatTop = parseFloat(comp.style.top || 0);
      }
      return bounds;
    })
    .filter((bounds) => bounds !== null);

  if (initialSelectedBounds.length === 0) return;

  const handleMouseMove = (moveEvent) => {
    const deltaX = moveEvent.clientX - startX;
    const deltaY = moveEvent.clientY - startY;

    initialSelectedBounds.forEach((initialBounds) => {
      let currentLeft = initialBounds.initialFloatLeft + deltaX; // 使用原始浮点值计算
      let currentTop = initialBounds.initialFloatTop + deltaY;

      let snapOffsetX = 0;
      let snapOffsetY = 0;
      if (initialBounds.id === clickedId) {
        const currentBoundsForSnap = {
          ...initialBounds,
          left: currentLeft,
          top: currentTop,
          right: currentLeft + initialBounds.width,
          bottom: currentTop + initialBounds.height,
          centerX: currentLeft + initialBounds.width / 2,
          centerY: currentTop + initialBounds.height / 2,
        };
        const { snapOffset } = calculateAlignmentLines(currentBoundsForSnap);
        snapOffsetX = snapOffset.x;
        snapOffsetY = snapOffset.y;
      }

      let finalLeft = currentLeft + snapOffsetX;
      let finalTop = currentTop + snapOffsetY;

      // Live Update (保持平滑，可以用浮点数)
      const targetComponent = canvasStore.components.find((c) => c.id === initialBounds.id);
      if (targetComponent) {
        targetComponent.style = {
          ...targetComponent.style,
          left: `${finalLeft}px`,
          top: `${finalTop}px`,
        };
      }
    });
  };

  const handleMouseUp = () => {
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    alignmentLines.value = [];
    console.log('Multi-Component move end - committing change with integer coordinates');

    // --- 在提交前将最终坐标取整 ---
    const finalComponentsState = JSON.parse(JSON.stringify(canvasStore.components));
    const finalUpdates = [];
    initialSelectedBounds.forEach((initialBounds) => {
      const comp = finalComponentsState.find((c) => c.id === initialBounds.id);
      if (comp && comp.style) {
        const finalLeftFloat = parseFloat(comp.style.left);
        const finalTopFloat = parseFloat(comp.style.top);
        if (!isNaN(finalLeftFloat) && !isNaN(finalTopFloat)) {
          finalUpdates.push({
            id: comp.id,
            styleChanges: {
              left: `${Math.round(finalLeftFloat)}px`,
              top: `${Math.round(finalTopFloat)}px`,
            },
          });
        }
      }
    });
    // 批量更新取整后的坐标
    canvasStore.updateMultipleComponentStyles(finalUpdates);
    // --- 结束取整 ---

    // 注意：commitCanvasChange 现在不需要了，因为 updateMultipleComponentStyles 已经更新了状态并触发了历史记录
    // canvasStore.commitCanvasChange(finalComponentsState);
  };

  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('mouseup', handleMouseUp, { once: true });
};

// --- Update Resize Logic ---
const handleResizeHandleMouseDown = (component, event, direction) => {
  if (canvasStore.selectedComponentIds.length !== 1) return; // Safety check
  event.preventDefault();
  event.stopPropagation();
  console.log('Resize handle mousedown:', direction);
  const startX = event.clientX;
  const startY = event.clientY;
  const initialBounds = getComponentBounds(component);
  if (!initialBounds) return;

  // Store original children info if resizing a group
  const originalChildren =
    component.key === 'group' ? JSON.parse(JSON.stringify(component.children || [])) : null;
  const initialChildrenBounds = originalChildren?.map((child) => ({
    id: child.id,
    left: parseFloat(child.style.left || 0),
    top: parseFloat(child.style.top || 0),
    width: parseFloat(child.style.width || 50),
    height: parseFloat(child.style.height || 20),
  }));

  const handleResizeMouseMove = (moveEvent) => {
    const deltaX = moveEvent.clientX - startX;
    const deltaY = moveEvent.clientY - startY;
    let newLeft = initialBounds.left;
    let newTop = initialBounds.top;
    let newWidth = initialBounds.width;
    let newHeight = initialBounds.height;

    // Calculate preliminary new dimensions
    if (direction.includes('right')) {
      newWidth = Math.max(10, initialBounds.width + deltaX);
    }
    if (direction.includes('bottom')) {
      newHeight = Math.max(10, initialBounds.height + deltaY);
    }
    if (direction.includes('left')) {
      const preliminaryWidth = Math.max(10, initialBounds.width - deltaX);
      newLeft = initialBounds.left + initialBounds.width - preliminaryWidth;
      newWidth = preliminaryWidth;
    }
    if (direction.includes('top')) {
      const preliminaryHeight = Math.max(10, initialBounds.height - deltaY);
      newTop = initialBounds.top + initialBounds.height - preliminaryHeight;
      newHeight = preliminaryHeight;
    }

    // Calculate bounds for alignment check
    const currentBounds = {
      id: component.id,
      left: newLeft,
      top: newTop,
      right: newLeft + newWidth,
      bottom: newTop + newHeight,
      centerX: newLeft + newWidth / 2,
      centerY: newTop + newHeight / 2,
      width: newWidth,
      height: newHeight,
    };
    calculateAlignmentLines(currentBounds); // Only show lines for now

    // Update LIVE preview style directly
    const targetComponent = canvasStore.components.find((c) => c.id === component.id);
    if (targetComponent) {
      targetComponent.style = {
        ...targetComponent.style, // Keep existing non-resized styles
        width: `${newWidth}px`,
        height: `${newHeight}px`,
        left: `${newLeft}px`,
        top: `${newTop}px`,
      };
    }
  };

  const handleResizeMouseUp = () => {
    document.removeEventListener('mousemove', handleResizeMouseMove);
    document.removeEventListener('mouseup', handleResizeMouseUp);
    alignmentLines.value = [];
    console.log('Resize end - committing change');

    // Get the final state from the components array
    const finalComponentsState = JSON.parse(JSON.stringify(canvasStore.components));

    // Commit the final state to the store
    canvasStore.commitCanvasChange(finalComponentsState);
  };

  document.addEventListener('mousemove', handleResizeMouseMove);
  document.addEventListener('mouseup', handleResizeMouseUp, { once: true });
};

// --- 新增：顶部操作栏处理函数 ---
const handlePreview = () => {
  ElMessageBox.alert(
    `<pre>${JSON.stringify(canvasStore.components, null, 2)}</pre>`,
    '画布数据预览',
    {
      dangerouslyUseHTMLString: true,
      confirmButtonText: '关闭',
    }
  );
};

const handleSave = () => {
  try {
    const dataToSave = JSON.stringify(canvasStore.components);
    localStorage.setItem('canvasData', dataToSave);
    ElMessage.success('画布数据已保存到 localStorage');
  } catch (error) {
    console.error('Failed to save canvas data:', error);
    ElMessage.error('保存失败');
  }
};

const handleLoad = () => {
  ElMessageBox.confirm('加载数据将覆盖当前画布，确定吗？', '确认加载', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(() => {
      try {
        const savedData = localStorage.getItem('canvasData');
        if (savedData) {
          const componentsToLoad = JSON.parse(savedData);
          canvasStore.setCanvasComponents(componentsToLoad);
          ElMessage.success('画布数据已从 localStorage 加载');
        } else {
          ElMessage.warning('未找到保存的画布数据');
        }
      } catch (error) {
        console.error('Failed to load canvas data:', error);
        ElMessage.error('加载失败，数据可能已损坏');
      }
    })
    .catch(() => {
      ElMessage.info('已取消加载');
    });
};

const handleClear = () => {
  if (canvasStore.components.length === 0) {
    ElMessage.info('画布已经是空的');
    return;
  }
  ElMessageBox.confirm('确定要清空画布吗？此操作不可撤销。', '确认清空', {
    confirmButtonText: '确定清空',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(() => {
      canvasStore.clearCanvas();
      ElMessage.success('画布已清空');
    })
    .catch(() => {
      ElMessage.info('已取消清空');
    });
};

const handleDelete = () => {
  canvasStore.deleteSelectedComponents();
  ElMessage.success('选中组件已删除');
};

// --- 新增：键盘事件监听 (Delete 键删除) ---
const handleKeyDown = (event) => {
  const activeElement = document.activeElement;
  // 检查焦点是否在输入元素上
  if (
    activeElement &&
    (activeElement.tagName === 'INPUT' ||
      activeElement.tagName === 'TEXTAREA' ||
      activeElement.isContentEditable)
  ) {
    return;
  }
  // 检查是否有选中组件以及按键是否为 Delete 或 Backspace
  if (
    (event.key === 'Delete' || event.key === 'Backspace') &&
    canvasStore.selectedComponentIds.length > 0
  ) {
    event.preventDefault(); // 阻止默认行为，如页面后退
    handleDelete();
  }
  // Add Ctrl+Z / Ctrl+Shift+Z for Undo/Redo
  if (event.ctrlKey && event.key === 'z') {
    event.preventDefault();
    if (event.shiftKey) {
      canvasStore.redo();
    } else {
      canvasStore.undo();
    }
  }
  // Add Ctrl+A to select all
  if (event.ctrlKey && event.key === 'a') {
    event.preventDefault();
    const allIds = canvasStore.components.map((c) => c.id);
    canvasStore.selectComponent(null, false); // Clear first? Or directly assign?
    canvasStore.selectedComponentIds = allIds; // Directly assign for simplicity here
    // Ideally use an action like `selectAllComponents` in the store
    console.log('Selected all components');
  }
};

onMounted(() => {
  document.addEventListener('keydown', handleKeyDown);
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown);
});

// --- Helper Function: Get Style (modified to separate rotation) ---
const getComponentStyleWithRotation = (style) => {
  // Return the style object directly, transform is applied by browser
  return style || {};
};

// --- Rotation Logic ---
const handleRotateHandleMouseDown = (component, event) => {
  if (canvasStore.selectedComponentIds.length !== 1) return; // Safety check
  event.preventDefault();
  event.stopPropagation();

  console.log('Rotate handle mousedown');

  const componentElement = canvasPanelRef.value?.querySelector(
    `[data-component-id='${component.id}']`
  ); // Need a way to select the element
  if (!componentElement) return;

  const rect = componentElement.getBoundingClientRect(); // Use getBoundingClientRect for viewport coords
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;

  const startX = event.clientX;
  const startY = event.clientY;

  // Calculate start angle relative to component center
  const startAngleRad = Math.atan2(startY - centerY, startX - centerX);
  const initialRotationMatch = component.style.transform?.match(
    /rotate\(([-+]?[0-9]*\.?[0-9]+)deg\)/
  );
  const initialRotationDeg = initialRotationMatch ? parseFloat(initialRotationMatch[1]) : 0;

  const handleRotateMouseMove = (moveEvent) => {
    const currentX = moveEvent.clientX;
    const currentY = moveEvent.clientY;

    // Calculate current angle
    const currentAngleRad = Math.atan2(currentY - centerY, currentX - centerX);

    // Calculate angle difference in degrees
    const deltaAngleDeg = (currentAngleRad - startAngleRad) * (180 / Math.PI);

    let newRotationDeg = initialRotationDeg + deltaAngleDeg;

    // Optional: Snap rotation to certain angles (e.g., 15 degree increments)
    const snapAngle = 15;
    newRotationDeg = Math.round(newRotationDeg / snapAngle) * snapAngle;

    // Ensure rotation stays within reasonable bounds if needed (e.g., 0-360)
    // newRotationDeg = (newRotationDeg % 360 + 360) % 360;

    // Update LIVE preview style directly
    const targetComponent = canvasStore.components.find((c) => c.id === component.id);
    if (targetComponent) {
      targetComponent.style = {
        ...targetComponent.style,
        transform: `rotate(${newRotationDeg}deg)`,
      };
    }
  };

  const handleRotateMouseUp = () => {
    document.removeEventListener('mousemove', handleRotateMouseMove);
    document.removeEventListener('mouseup', handleRotateMouseUp);
    console.log('Rotate end - committing change');

    // Commit the final state
    const finalComponentsState = JSON.parse(JSON.stringify(canvasStore.components));
    canvasStore.commitCanvasChange(finalComponentsState);
  };

  document.addEventListener('mousemove', handleRotateMouseMove);
  document.addEventListener('mouseup', handleRotateMouseUp, { once: true });
};

// --- NEW: Grouping Actions ---
const handleGroup = () => {
  canvasStore.groupSelectedComponents();
};

const handleUngroup = () => {
  canvasStore.ungroupSelectedComponent();
};

// --- Computed properties for Button States ---
const canGroup = computed(() => {
  return canvasStore.selectedComponentIds.length >= 2;
});

const canUngroup = computed(() => {
  if (canvasStore.selectedComponentIds.length !== 1) return false;
  const selectedId = canvasStore.selectedComponentIds[0];
  // Find the selected component in the potentially nested structure
  const findComp = (comps, targetId) => {
    for (const c of comps) {
      if (c.id === targetId) return c;
      // Don't search inside groups for this check
    }
    return null;
  };
  const component = findComp(canvasStore.components, selectedId);
  // Only enable if it's a top-level group
  return component?.key === 'group';
});

// --- NEW: Canvas Click Logic ---
const handleCanvasClick = (event) => {
  // 确保是直接点击画布，而不是点击画布上的组件
  if (event.target === canvasPanelRef.value) {
    console.log('Canvas clicked, clearing selection');
    canvasStore.clearSelection(); // 使用已有的clearSelection函数

    // 清除对齐线
    alignmentLines.value = [];
  }
};
</script>

<style scoped>
.editor-container {
  height: 100vh;
  width: 100vw;
  /* 移除 overflow: hidden，避免限制右侧菜单栏的显示 */
  /* overflow: hidden; */
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  border-bottom: 1px solid #ebeef5;
  height: 60px;
  background-color: #fff; /* 确保有背景色 */
  z-index: 10; /* 确保在其他元素之上 */
}

.header-left,
.header-right {
  display: flex;
  align-items: center;
}

.header-right .el-button {
  margin-left: 10px; /* 按钮间距 */
}

.left-aside {
  display: flex;
  flex-direction: column;
  border-right: 1px solid #ebeef5;
  padding: 0; /* Remove padding from aside, let panels handle it */
  height: 100vh; /* Ensure full height */
}

.left-panel {
  /* Common styles for panels within left aside */
  padding: 0; /* Panels control their internal padding */
  overflow: hidden; /* Prevent content spillover */
}

.materials-panel {
  height: 50%; /* Example: Allocate top 50% height */
  border-bottom: 1px solid #eee; /* Separator */
  display: flex;
  flex-direction: column;
}

.materials-panel h4 {
  margin: 0;
  padding: 10px;
  text-align: center;
  border-bottom: 1px solid #eee;
  flex-shrink: 0;
}

.materials-panel .el-scrollbar {
  flex-grow: 1;
  /* padding: 5px; */ /* Remove padding here, add to list */
}

.material-list {
  list-style: none;
  padding: 10px; /* Keep some padding */
  margin: 0;
  display: grid; /* Use grid for better alignment */
  grid-template-columns: repeat(auto-fill, minmax(70px, 1fr)); /* Adjust column width slightly */
  /* Match visual-drag-demo gap more closely */
  gap: 10px 19px;
}

.material-item {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 1px solid #ddd; /* Match original border */
  border-radius: 4px;
  cursor: grab;
  text-align: center;
  background-color: #fff;
  transition: all 0.2s ease;
  user-select: none;
  /* Match original height */
  height: 40px;
  width: 100%; /* Let grid control width based on columns */
}

.material-item:hover {
  background-color: #f5f7fa;
  border-color: #c0c4cc;
  color: #409eff;
  box-shadow: none; /* Remove custom shadow on hover if not in original */
}

/* Adjust icon size */
.material-item .el-icon {
  margin-bottom: 0;
  font-size: 20px; /* Adjust icon size */
}

/* Hide text span (already removed from template, but safe to keep) */
/* .material-item span { display: none; } */

.layer-panel-container {
  height: 50%; /* Example: Allocate bottom 50% height */
  /* LayerPanel component will fill this container */
}

/* Ensure the layer panel inside fills its container */
.layer-panel-container > :deep(.layer-panel) {
  /* Use :deep if needed */
  height: 100%;
}

.center-panel,
.right-panel {
  padding: 10px;
}

.right-panel {
  padding: 0; /* Keep this if PropsEditor has padding */
}

.center-panel {
  position: relative;
  height: 100%;
  background-color: #fff;
  padding: 0;
  overflow: hidden;
  /* 修正网格背景 - 为每个渐变设置大小 */
  background-image:
    linear-gradient(to right, rgba(0, 0, 0, 0.08) 1px, transparent 1px),
    /* 更淡的细竖线 */ linear-gradient(to bottom, rgba(0, 0, 0, 0.08) 1px, transparent 1px),
    /* 更淡的细横线 */ linear-gradient(to right, rgba(0, 0, 0, 0.15) 1px, transparent 1px),
    /* 稍深的粗竖线 */ linear-gradient(to bottom, rgba(0, 0, 0, 0.15) 1px, transparent 1px); /* 稍深的粗横线 */
  background-size:
    5px 5px,
    /* 细线大小 */ 5px 5px,
    25px 25px,
    /* 粗线大小 (5*5) */ 25px 25px;
  user-select: none;
}

.canvas-component {
  position: absolute;
  cursor: move;
  border: 1px solid transparent; /* Default border */
  transition: border-color 0.2s;
  transform-origin: center center; /* Ensure rotation happens around the center */
}

.canvas-component.selected {
  border: 1px solid transparent; /* 不显示选中边框，仅保留拖拽点 */
}

/* Make inner component fill the container */
.canvas-component > *:not(.resize-handles) {
  width: 100%;
  height: 100%;
  pointer-events: none; /* Let wrapper handle events */
  display: block; /* Ensure block layout */
  box-sizing: border-box; /* Include border/padding in size if any */
}

/* Resize Handles Container (Optional, for structure) */
.resize-handles {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none; /* Container doesn't block */
}

/* Individual Resize Handle Style */
.resize-handle {
  position: absolute;
  width: 8px;
  height: 8px;
  background-color: #fff;
  border: 1px solid #409eff;
  border-radius: 50%; /* Circular handles */
  pointer-events: auto; /* Handles should be interactive */
  z-index: 10; /* Ensure handles are above component content if overlapping */
}

/* Positioning Handles */
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

/* NEW: Alignment Line Styles */
.alignment-line {
  position: absolute;
  background-color: #ff0000; /* Red lines */
  z-index: 99; /* Ensure lines are visible above components */
  pointer-events: none; /* Lines should not be interactive */
}

.alignment-line.vertical {
  width: 1px;
  /* height is set dynamically via style */
}

.alignment-line.horizontal {
  height: 1px;
  /* width is set dynamically via style */
}

/* Add data-component-id to canvas-component for easier selection in script */
.canvas-component {
  /* ... existing styles ... */
  transform-origin: center center; /* Ensure rotation happens around the center */
}

.resize-handle.rotate-handle {
  top: -25px; /* Position above the top-center handle */
  left: 50%;
  transform: translateX(-50%);
  width: 16px; /* Make it slightly larger */
  height: 16px;
  border-radius: 50%;
  background-color: #409eff;
  border: 1px solid #fff;
  cursor: grab; /* Or a specific rotation cursor */
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.resize-handle.rotate-handle:active {
  cursor: grabbing;
}

.resize-handle.rotate-handle svg {
  width: 10px;
  height: 10px;
}

/* 可以添加更多样式来美化各个区域 */

/* 新增：确保画布能接收拖拽事件 */
.canvas-main {
  width: 100%;
  height: 100%;
  position: relative;
  padding: 0; /* 移除内边距 */
  overflow: auto; /* 允许滚动 */
  background-color: #f5f7fa; /* 背景色 */
}

.center-panel {
  position: relative;
  min-width: 1200px; /* 最小宽度，确保内容不会被挤压 */
  min-height: 800px; /* 最小高度，确保有足够空间 */
  width: 100%;
  height: 100%;
  background-color: #fff;
  padding: 0;
  /* 网格背景保持不变 */
  background-image:
    linear-gradient(to right, rgba(0, 0, 0, 0.08) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(0, 0, 0, 0.08) 1px, transparent 1px),
    linear-gradient(to right, rgba(0, 0, 0, 0.15) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(0, 0, 0, 0.15) 1px, transparent 1px);
  background-size:
    5px 5px,
    5px 5px,
    25px 25px,
    25px 25px;
  user-select: none;
}

/* 右侧面板样式 */
.right-aside {
  height: 100%;
  border-left: 1px solid #ebeef5;
  background-color: #fff;
  display: flex;
  flex-direction: column;
  width: 320px !important; /* 扩大宽度以适应内容 */
  min-width: 320px;
  overflow-x: hidden; /* 防止水平溢出 */
  box-shadow: -2px 0 5px rgba(0, 0, 0, 0.05);
}

.right-panel {
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  padding: 0;
  overflow: hidden;
}

.right-panel :deep(.props-editor) {
  height: 100%;
  width: 100%;
  overflow-y: auto;
  padding: 0;
  display: flex;
  flex-direction: column;
}

.right-panel :deep(.el-form-item__label) {
  color: #606266;
}

.right-panel :deep(.el-input__inner) {
  background-color: #fff;
  color: #606266;
  border-color: #dcdfe6;
}

.right-panel :deep(.el-tabs__item.is-top) {
  color: #606266;
}

.right-panel :deep(.el-tabs__item.is-top.is-active) {
  color: #409eff;
}

.right-panel :deep(.el-collapse) {
  border-color: #dcdfe6;
}

.right-panel :deep(.el-collapse-item__header),
.right-panel :deep(.el-collapse-item__wrap) {
  border-color: #dcdfe6;
  background-color: #fff;
  color: #606266;
}

/* 确保画布能接收拖拽事件 */
.canvas-main {
  width: 100%;
  height: 100%;
  position: relative;
}
</style>
