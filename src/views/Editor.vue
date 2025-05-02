<template>
  <div class="editor-container">
    <!-- 顶部操作栏，支持上下收缩 -->
    <div class="editor-header" :class="{ collapsed: headerCollapsed }">
      <div class="header-toggle" @click="toggleHeader">
        <el-icon><ArrowUp v-if="!headerCollapsed" /><ArrowDown v-else /></el-icon>
      </div>

      <template v-if="!headerCollapsed">
        <div class="header-content">
          <div class="header-left">
            <!-- Start: Add Back Button -->
            <el-button
              icon="ArrowLeft"
              circle
              size="small"
              title="返回列表"
              style="margin-right: 10px"
              @click="goBackToList"
            />
            <!-- End: Add Back Button -->
            <span>编辑器标题</span>
            <!-- Wrap title in span -->
          </div>
          <div class="header-center">
            <!-- 画布大小设置 -->
            <div class="canvas-size-settings">
              <el-input-number
                v-model="canvasWidth"
                :min="800"
                :max="10000"
                size="small"
                @change="updateCanvasSize"
              />
              <span>×</span>
              <el-input-number
                v-model="canvasHeight"
                :min="600"
                :max="10000"
                size="small"
                @change="updateCanvasSize"
              />
            </div>
          </div>
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
            <!-- 缩放控制 -->
            <el-button-group>
              <el-button size="small" @click="zoomOut">
                <el-icon><Minus /></el-icon>
              </el-button>
              <el-button size="small" style="width: 55px">
                {{ scaleDisplay }}
              </el-button>
              <el-button size="small" @click="zoomIn">
                <el-icon><Plus /></el-icon>
              </el-button>
              <el-button size="small" @click="resetZoom">
                <el-icon><FullScreen /></el-icon>
              </el-button>
            </el-button-group>
            <el-divider direction="vertical" />
            <!-- Separator -->
            <el-button type="primary" size="small" @click="handlePreview"> 预览 </el-button>
            <el-button size="small" @click="handleSave"> 保存 </el-button>
            <!-- <el-button size="small" @click="handleLoad"> 加载 </el-button> -->
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
        </div>
      </template>
    </div>

    <!-- 主体布局：左侧面板、中间画布、右侧面板 -->
    <div class="editor-main">
      <!-- 左侧面板，支持左右收缩 -->
      <div class="left-sidebar" :class="{ collapsed: leftPanelCollapsed }">
        <div class="panel-toggle" @click="toggleLeftPanel">
          <el-icon><ArrowLeft v-if="!leftPanelCollapsed" /><ArrowRight v-else /></el-icon>
        </div>

        <template v-if="!leftPanelCollapsed">
          <!-- 物料区 -->
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
                  <el-icon :size="22">
                    <component :is="material.icon" />
                  </el-icon>
                </li>
              </ul>
            </el-scrollbar>
          </div>
          <!-- 图层面板 -->
          <div class="left-panel layer-panel-container">
            <LayerPanel />
          </div>
        </template>
      </div>

      <!-- 中间画布区，允许溢出滚动 -->
      <div class="canvas-container">
        <div
          ref="canvasMainRef"
          class="canvas-main"
          @dragover.prevent
          @dragenter.prevent
          @dragleave.prevent
          @drop="handleDrop"
          @wheel.ctrl.prevent="handleWheel"
          @contextmenu="handleContextMenu"
        >
          <div
            ref="canvasPanelRef"
            class="center-panel"
            :style="{
              transform: `scale(${scaleValue})`,
              transformOrigin: `center center`,
              width: `${canvasWidth}px`,
              height: `${canvasHeight}px`,
            }"
            @dragover.prevent
            @dragenter.prevent
            @drop.stop="handleDrop"
            @click.self="handleCanvasClick"
            @mousedown="handleCanvasMouseDown"
            @dblclick.self="handleCanvasDoubleClick"
            @contextmenu="handleContextMenu"
          >
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

            <!-- 对齐线 -->
            <div
              v-for="(line, index) in alignmentLines"
              :key="`line-${index}`"
              class="alignment-line"
              :class="line.type"
              :style="line.style"
            />

            <!-- 选择框 -->
            <div
              v-if="selectionBox.visible"
              class="selection-box"
              :style="{
                left: `${selectionBox.left}px`,
                top: `${selectionBox.top}px`,
                width: `${selectionBox.width}px`,
                height: `${selectionBox.height}px`,
              }"
            />

            <!-- 多选边界框 -->
            <div
              v-if="selectionBoundingBox.visible"
              class="selection-bounding-box"
              :style="{
                left: `${selectionBoundingBox.left}px`,
                top: `${selectionBoundingBox.top}px`,
                width: `${selectionBoundingBox.width}px`,
                height: `${selectionBoundingBox.height}px`,
              }"
              @mousedown.left.stop="handleBoundingBoxMouseDown"
            />
          </div>
        </div>
      </div>

      <!-- 右侧面板，支持左右收缩 -->
      <div class="right-sidebar" :class="{ collapsed: rightPanelCollapsed }">
        <div class="panel-toggle" @click="toggleRightPanel">
          <el-icon><ArrowRight v-if="!rightPanelCollapsed" /><ArrowLeft v-else /></el-icon>
        </div>

        <template v-if="!rightPanelCollapsed">
          <div class="right-panel">
            <PropsEditor :selected-component="canvasStore.primarySelectedComponent" />
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, defineAsyncComponent, watch, nextTick } from 'vue';
import { useCanvasStore } from '@/stores/canvas'; // 导入 store
import { useRouter, useRoute } from 'vue-router'; // Import useRouter and useRoute
import PropsEditor from '@/components/editor/PropsEditor.vue'; // 导入属性编辑器
import {
  ElButton,
  ElInput,
  ElMessage,
  ElMessageBox,
  ElDivider,
  ElButtonGroup,
  ElInputNumber,
} from 'element-plus'; // 添加 ElButtonGroup 和 ElInputNumber
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
  Plus,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  Select,
  // Add new icons
  Crop,
  CaretTop,
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
  Warning as CustomWarning, // Keep Warning import if needed elsewhere, otherwise remove
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
import SVGPentagon from '@/components/custom/SVGPentagon.vue';
import SVGHexagon from '@/components/custom/SVGHexagon.vue';
import SVGTrapezoid from '@/components/custom/SVGTrapezoid.vue';
import SVGStar from '@/components/custom/SVGStar.vue';
import VTable from '@/components/custom/VTable.vue';
import VChart from '@/components/custom/VChart.vue';
import VTag from '@/components/custom/VTag.vue'; // 导入Tag组件

// Import custom icons
import IconHollowCircle from '@/components/icons/IconHollowCircle.vue';
import IconHollowRectangle from '@/components/icons/IconHollowRectangle.vue';
import IconHollowTriangle from '@/components/icons/IconHollowTriangle.vue';
import IconHollowPentagon from '@/components/icons/IconHollowPentagon.vue';
import IconHollowHexagon from '@/components/icons/IconHollowHexagon.vue';
import IconHollowTrapezoid from '@/components/icons/IconHollowTrapezoid.vue';
import IconLetterT from '@/components/icons/IconLetterT.vue';

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
const IconFullScreen = CustomFullScreen; // juxing (Keep alias if used elsewhere)
const IconMinus = CustomMinus; // zhixian
const IconDataLine = CustomDataLine; // 24gl-circle
const IconStar = CustomStar; // kongwujiaoxing
const IconWarning = CustomWarning; // xingzhuang-sanjiaoxing (Triangle) (Keep alias if used elsewhere)
const IconGrid = CustomGrid; // biaoge
const IconDataAnalysis = CustomDataAnalysis; // el-icon-data-analysis (Chart)
const IconRank = CustomRank; // Placeholder for Vant Button (if kept)
// Add aliases for new icons if preferred, or use directly
// const IconRadioButton = RadioButton;
// const IconCrop = Crop;
// const IconCaretTop = CaretTop;

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
    icon: IconLetterT, // 检查这里是否是 IconLetterT
    propValue: '文本',
    // 与 visual-drag-demo/component-list.js 对齐
    style: {
      width: 200,
      height: 28,
      fontSize: 20,
      fontWeight: 400,
      lineHeight: '',
      letterSpacing: 0,
      textAlign: 'center',
      color: '',
      verticalAlign: 'middle' /* padding is not in original, removed */,
    },
  },
  // {
  //   component: 'VButton',
  //   label: '按钮',
  //   icon: IconTickets,
  //   propValue: '按钮',
  //   // 与 visual-drag-demo/component-list.js 对齐
  //   style: {
  //     width: 100,
  //     height: 34,
  //     borderWidth: 0, // 默认边框为0
  //     borderColor: '#000',
  //     color: '#000',
  //     backgroundColor: '#fff',
  //     fontSize: 20,
  //     fontWeight: 400,
  //     lineHeight: '',
  //     letterSpacing: 0,
  //     textAlign: 'center',
  //     verticalAlign: 'middle',
  //     padding: '8px 15px',
  //   },
  // },
  // {
  //   component: 'VTag',
  //   label: '标签',
  //   icon: EditPen,
  //   propValue: '标签',
  //   style: {
  //     width: 80,
  //     height: 32,
  //     fontSize: 20,
  //     fontWeight: 400,
  //     lineHeight: '',
  //     letterSpacing: 0,
  //     textAlign: 'center',
  //     color: '',
  //     borderWidth: 1,
  //     borderColor: '',
  //     backgroundColor: '',
  //     verticalAlign: 'middle',
  //     borderRadius: '4px',
  //   },
  //   props: {
  //     tagType: '',
  //     tagEffect: 'light',
  //   },
  // },
  {
    component: 'Picture',
    label: '图片',
    icon: IconPicture, // Keep Picture icon
    propValue: { url: 'https://picsum.photos/200/300' }, // 保持 props 结构
    // 与 visual-drag-demo/component-list.js 对齐 (添加 borderRadius)
    style: { width: 300, height: 200, borderRadius: '' },
  },
  {
    component: 'RectShape',
    label: '矩形',
    icon: IconHollowRectangle, // Use custom SVG icon
    propValue: '&nbsp;',
    // 与 visual-drag-demo/component-list.js 对齐
    style: {
      width: 100,
      height: 100,
      fontSize: 20,
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
    icon: IconMinus, // Keep Minus icon
    propValue: '',
    // 与 visual-drag-demo/component-list.js 对齐 (已匹配)
    style: { width: 150, height: 2, backgroundColor: '#000' }, // Change height to 2px
  },
  {
    component: 'CircleShape',
    label: '圆形',
    icon: IconHollowCircle, // Use custom SVG icon
    propValue: '&nbsp;',
    // 与 visual-drag-demo/component-list.js 对齐 (保持50%圆角，补充其他属性)
    style: {
      width: 100,
      height: 100,
      fontSize: 20,
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
    icon: IconStar, // Keep Star icon
    propValue: '',
    style: {
      width: 60,
      height: 60,
      fontSize: 20,
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
    icon: IconHollowTriangle, // Use custom SVG icon
    propValue: '',
    style: {
      width: 60,
      height: 60,
      fontSize: 20,
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
    component: 'SVGPentagon',
    label: '五边形',
    icon: IconHollowPentagon, // 替换为合适的图标
    propValue: '',
    style: {
      width: 60,
      height: 60,
      fontSize: 20,
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
    component: 'SVGTrapezoid',
    label: '梯形',
    icon: IconHollowTrapezoid, // 替换为合适的图标
    propValue: '',
    style: {
      width: 100,
      height: 60,
      borderColor: '#000',
      borderWidth: 1,
      backgroundColor: '',
    },
  },
  {
    component: 'SVGHexagon',
    label: '六边形',
    icon: IconHollowHexagon, // 替换为合适的图标
    propValue: '',
    style: {
      width: 100,
      height: 100,
      borderColor: '#000',
      borderWidth: 1,
      backgroundColor: '',
    },
  },
  // {
  //   component: 'VTable',
  //   label: '表格',
  //   icon: IconGrid,
  //   propValue: {
  //     data: [
  //       ['表头1', '表头2'],
  //       ['内容1', '内容2'],
  //     ],
  //     stripe: true,
  //     thBold: true,
  //   },
  //   // 补充通用样式
  //   style: {
  //     width: 400,
  //     height: 150,
  //     fontSize: 20,
  //     fontWeight: 400,
  //     lineHeight: '',
  //     letterSpacing: 0,
  //     textAlign: 'center',
  //     color: '',
  //     verticalAlign: 'middle',
  //   },
  // },
  // {
  //   component: 'VChart',
  //   label: '图表',
  //   icon: IconDataAnalysis,
  //   propValue: {
  //     option: {
  //       /* Default chart options */
  //     },
  //   },
  //   // 补充通用样式
  //   style: {
  //     width: 400,
  //     height: 300,
  //     fontSize: 20,
  //     fontWeight: 400,
  //     lineHeight: '',
  //     letterSpacing: 0,
  //     textAlign: 'center',
  //     color: '',
  //     verticalAlign: 'middle',
  //   },
  // },
  // // Keep our added Input for now?
  // {
  //   component: 'VInput',
  //   label: '输入框',
  //   icon: IconEditPen,
  //   propValue: { placeholder: '请输入...' },
  //   style: {
  //     width: 200,
  //     height: 32,
  //     fontSize: 20,
  //     fontWeight: 400,
  //     lineHeight: '',
  //     letterSpacing: 0,
  //     textAlign: 'left',
  //     color: '#333',
  //     borderWidth: 1,
  //     borderColor: '#dcdfe6',
  //     borderRadius: '4px',
  //     backgroundColor: '#fff',
  //   },
  // }, // Use VInput key
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
    // 传递索引和类型标识，以便在drop时能区分来源
    event.dataTransfer.setData(
      'application/json',
      JSON.stringify({
        type: 'material',
        index: index,
      })
    );
    event.dataTransfer.effectAllowed = 'copy';

    // 设置拖拽图像
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
    case 'VTag':
      return VTag;
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
    case 'SVGPentagon':
      return SVGPentagon;
    case 'SVGTrapezoid':
      return SVGTrapezoid;
    case 'SVGTriangle':
      return SVGTriangle;
    case 'SVGHexagon':
      return SVGHexagon;
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
    const jsonData = event.dataTransfer.getData('application/json');
    console.log('DataTransfer data:', jsonData);

    if (jsonData) {
      const data = JSON.parse(jsonData);
      if (data.type === 'material') {
        materialIndex = data.index;
        console.log('从dataTransfer获取物料索引成功:', materialIndex);
      }
    } else {
      // 兼容之前的备选方案
      if (draggedMaterialIndex !== null) {
        materialIndex = draggedMaterialIndex;
        console.log('使用备选索引:', materialIndex);
      }
    }
  } catch (e) {
    console.error('解析拖拽数据失败:', e);
    // 尝试备选方案
    if (draggedMaterialIndex !== null) {
      materialIndex = draggedMaterialIndex;
      console.log('使用备选索引:', materialIndex);
    }
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

  // 计算放置位置，考虑缩放因素
  const canvasRect = canvasPanelRef.value.getBoundingClientRect();
  let dropLeft = (event.clientX - canvasRect.left) / scale.value;
  let dropTop = (event.clientY - canvasRect.top) / scale.value;

  // 确保位置不小于0
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
  if (
    material.component === 'SVGStar' ||
    material.component === 'SVGPentagon' ||
    material.component === 'SVGTriangle' ||
    material.component === 'SVGTrapezoid' ||
    material.component === 'SVGHexagon'
  ) {
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
      // 确保空字符串被正确传递
      if (material.propValue === '') {
        props = { content: '' };
      } else {
        props = { content: material.propValue || '文本' };
      }
      console.log('设置VText props:', props, '原始material.propValue:', material.propValue);
      break;
    case 'VButton':
      props = { text: material.propValue };
      break;
    case 'VTag':
    case 'Picture':
      if (typeof material.propValue === 'object' && material.propValue !== null) {
        props = material.propValue; // 包含 url
      } else {
        // 确保即使 propValue 不是对象也有默认值
        props = { url: material.propValue || 'https://picsum.photos/200/300' };
      }
      break;
    case 'SVGStar':
    case 'SVGTriangle':
    case 'SVGPentagon':
    case 'SVGTrapezoid':
    case 'SVGHexagon':
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
  console.log('VText组件添加前，props:', JSON.stringify(component.props));

  const newComponent = canvasStore.addComponent({ component, initialPosition: { left, top } });

  console.log('VText组件添加后，返回的组件:', newComponent);
  console.log('VText组件添加后，props:', newComponent?.props);

  // 特殊处理：如果是VText组件，添加后立即选中并设置失焦时的检查逻辑
  if (material.component === 'VText') {
    // 由于添加组件是异步操作，需要延迟选择
    setTimeout(() => {
      // 找到刚刚添加的文本组件
      const addedComponent = canvasStore.components.find(
        (c) =>
          c.key === 'VText' &&
          // 处理空文本内容
          ((material.propValue === '' && (!c.props.content || c.props.content === '')) ||
            // 处理非空文本内容
            c.props.content === material.propValue)
      );

      if (addedComponent) {
        // 选中该组件
        canvasStore.selectComponent(addedComponent.id, false);

        // 在外部不再处理VText的内容为空时的删除逻辑，已移至VText组件内部
        const handleBlur = (e) => {
          // 移除事件监听器
          document.removeEventListener('click', handleBlur);
          document.removeEventListener('keydown', escKeyHandler);
        };

        // ESC键处理
        const escKeyHandler = (e) => {
          if (e.key === 'Escape') {
            // 移除事件监听器
            document.removeEventListener('click', handleBlur);
            document.removeEventListener('keydown', escKeyHandler);
          }
        };

        // 监听点击事件（用户点击其他地方）
        document.addEventListener('click', handleBlur);

        // 监听ESC键（用户按ESC取消编辑）
        document.addEventListener('keydown', escKeyHandler);
      }
    }, 50);
  }
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

  // 判断当前点击的组件是否已经在多选列表中
  const isPartOfSelection = canvasStore.selectedComponentIds.includes(clickedId);

  // 如果按住Shift键，则添加或移除点击的组件到多选列表
  if (event.shiftKey) {
    if (isPartOfSelection) {
      // 如果组件已在多选列表中，则移除
      const updatedSelection = canvasStore.selectedComponentIds.filter((id) => id !== clickedId);
      canvasStore.selectComponent(null, false); // 先清空
      updatedSelection.forEach((id) => canvasStore.selectComponent(id, true)); // 重新选择
    } else {
      // 添加到多选列表
      canvasStore.selectComponent(clickedId, true);
    }
  }
  // 如果组件不在多选列表中且不是Shift点击，则将其设为唯一选中
  else if (!isPartOfSelection) {
    canvasStore.selectComponent(clickedId, false);
  }
  // 如果组件已在多选列表中且不是Shift点击，则保持多选状态以便移动
  // 无需做任何操作，保持当前选择

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
    const deltaX = (moveEvent.clientX - startX) / scale.value;
    const deltaY = (moveEvent.clientY - startY) / scale.value;

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

    // 更新多选边界框
    updateSelectionBoundingBox();
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
    const deltaX = (moveEvent.clientX - startX) / scale.value;
    const deltaY = (moveEvent.clientY - startY) / scale.value;
    let newLeft = initialBounds.left;
    let newTop = initialBounds.top;
    let newWidth = initialBounds.width;
    let newHeight = initialBounds.height;
    if (component.key === 'LineShape') {
      if (direction.includes('right')) {
        newWidth = Math.max(10, initialBounds.width + deltaX);
      }
      if (direction.includes('left')) {
        const preliminaryWidth = Math.max(10, initialBounds.width - deltaX);
        newLeft = initialBounds.left + initialBounds.width - preliminaryWidth;
        newWidth = preliminaryWidth;
      }
      // 高度保持固定
      newHeight = initialBounds.height;
    } else {
      // Calculate preliminary new dimensions
      if (direction.includes('right')) {
        newWidth = Math.max(10, initialBounds.width + deltaX);
      }
      if (direction.includes('bottom')) {
        // Allow LineShape to have minimum height of 1px
        const minHeight = component.key === 'LineShape' ? 1 : 10;
        newHeight = Math.max(minHeight, initialBounds.height + deltaY);
      }
      if (direction.includes('left')) {
        const preliminaryWidth = Math.max(10, initialBounds.width - deltaX);
        newLeft = initialBounds.left + initialBounds.width - preliminaryWidth;
        newWidth = preliminaryWidth;
      }
      if (direction.includes('top')) {
        // Allow LineShape to have minimum height of 1px
        const minHeight = component.key === 'LineShape' ? 1 : 10;
        const preliminaryHeight = Math.max(minHeight, initialBounds.height - deltaY);
        newTop = initialBounds.top + initialBounds.height - preliminaryHeight;
        newHeight = preliminaryHeight;
      }
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

const handleSave = async () => {
  const canvasId = route.params.id;
  if (!canvasId) {
    ElMessage.error('无法保存：缺少画布 ID');
    console.error('Cannot save: Canvas ID is missing from route params');
    return;
  }

  // --- 构建新的、更完整的数据结构 ---
  const dataToSave = {
    content: {
      canvas: {
        width: canvasWidth.value,
        height: canvasHeight.value,
        scale: scale.value,
      },
      components: canvasStore.components,
    }, // Store already holds the components array
  };
  // -----------------------------------

  console.log(`准备保存画布 ID: ${canvasId}`, dataToSave);

  try {
    // --- 使用 Store Action ---
    await canvasStore.updateCanvas(canvasId, dataToSave);
    // -----------------------
    ElMessage.success('画布已保存到服务器');
    // canvasStore.markHistorySaved(); // store action might handle this, or keep if needed
  } catch (error) {
    console.error('保存画布失败(Editor.vue):', error);
    // Error message should be handled by the store action's throw
    // ElMessage.error('保存失败...'); // Can add specific message here if needed
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
  // 检查焦点是否在输入元素上，如果在，则不处理任何快捷键
  if (
    activeElement &&
    (activeElement.tagName === 'INPUT' ||
      activeElement.tagName === 'TEXTAREA' ||
      activeElement.isContentEditable)
  ) {
    return;
  }

  // 优先处理空格键，确保阻止默认滚动行为
  if (event.code === 'Space') {
    event.preventDefault(); // 立即阻止默认滚动行为
    if (!isPanning.value) {
      // 仅在尚未进入平移模式时设置状态
      isPanning.value = true;
      document.body.style.cursor = 'grab';
    }
    return; // 处理完空格键后直接返回，避免干扰其他快捷键
  }

  // 处理其他快捷键...
  // 检查是否有选中组件以及按键是否为 Delete 或 Backspace
  if (
    (event.key === 'Delete' || event.key === 'Backspace') &&
    canvasStore.selectedComponentIds.length > 0
  ) {
    event.preventDefault(); // 阻止默认行为，如页面后退
    handleDelete();
  }
  // Add Ctrl+Z / Ctrl+Shift+Z for Undo/Redo
  else if (event.ctrlKey && event.key === 'z') {
    // 使用 else if 避免重复处理
    event.preventDefault();
    if (event.shiftKey) {
      canvasStore.redo();
    } else {
      canvasStore.undo();
    }
  }
  // Add Ctrl+A to select all
  else if (event.ctrlKey && event.key === 'a') {
    // 使用 else if
    event.preventDefault();
    const allIds = canvasStore.components.map((c) => c.id);
    canvasStore.selectComponent(null, false); // Clear first
    canvasStore.selectedComponentIds = allIds; // Assign all
    console.log('Selected all components');
  }
};

// 处理空格键释放，关闭平移模式
const handleKeyUp = (event) => {
  if (event.code === 'Space' && isPanning.value) {
    isPanning.value = false;
    document.body.style.cursor = '';

    // 清理平移相关的事件监听器，以防万一
    document.removeEventListener('mousemove', handleCanvasPanMove);
    document.removeEventListener('mouseup', handleCanvasPanUp);
  }
};

onMounted(() => {
  document.addEventListener('keydown', handleKeyDown);
  document.addEventListener('keyup', handleKeyUp);

  // 确保scale有正确的初始值
  scale.value = 1;
  console.log('初始化缩放比例:', scale.value);

  // 初始化画布平移位置
  canvasPosition.value = { x: 0, y: 0 };

  // 初始化画布大小
  nextTick(() => {
    updateCanvasSize();
    console.log('画布初始化完成', canvasWidth.value, canvasHeight.value, '缩放比例:', scale.value);
  });

  // --- 在 onMounted 中调用加载函数 ---
  loadCanvasData();
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown);
  document.removeEventListener('keyup', handleKeyUp);
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
  // 如果是拖拽结束，不触发清空选择
  if (selectionBox.value.visible || selectionBox.value.width > 0 || selectionBox.value.height > 0) {
    return;
  }

  // 确保是直接点击画布，而不是点击画布上的组件
  if (event.target === canvasPanelRef.value) {
    console.log('Canvas clicked, clearing selection');
    // 如果按住shift键，则不清除选择，便于多选
    if (!event.shiftKey) {
      canvasStore.clearSelection(); // 使用已有的clearSelection函数
    }

    // 清除对齐线
    alignmentLines.value = [];
  }
};

// --- NEW: Selection Box Logic ---
const selectionBox = ref({
  visible: false,
  left: 0,
  top: 0,
  width: 0,
  height: 0,
  startX: 0,
  startY: 0,
});

// 处理画布鼠标按下事件，开始拖拽画布或选择框
const handleCanvasMouseDown = (event) => {
  // 检测鼠标右键按下，启动画布拖动
  if (event.button === 2) {
    event.preventDefault();

    // 进入平移模式
    isPanning.value = true;

    // 直接记录起始点，不添加额外延迟
    panStartX.value = event.clientX - canvasPosition.value.x;
    panStartY.value = event.clientY - canvasPosition.value.y;

    // 立即设置光标样式
    document.body.style.cursor = 'grabbing';

    // 使用 passive:false 确保事件处理更快响应
    document.addEventListener('mousemove', handleCanvasPanMove, { passive: false });
    document.addEventListener('mouseup', handleRightButtonPanUp);
    return;
  }

  // 如果按下空格键进入平移模式，则开始拖拽画布
  if (isPanning.value) {
    event.preventDefault();

    // 直接记录起始点，不添加额外延迟
    panStartX.value = event.clientX - canvasPosition.value.x;
    panStartY.value = event.clientY - canvasPosition.value.y;

    // 使用 passive:false 确保事件处理更快响应
    document.addEventListener('mousemove', handleCanvasPanMove, { passive: false });
    document.addEventListener('mouseup', handleCanvasPanUp);
    return;
  }

  // 如果不是平移模式，则执行原有的选择框逻辑
  if (event.button !== 0) return; // 只处理鼠标左键

  // 只有直接点击画布时才启动框选，避免和组件交互冲突
  if (event.target !== canvasPanelRef.value) return;

  event.preventDefault();
  event.stopPropagation();

  const rect = canvasPanelRef.value.getBoundingClientRect();
  const startX = (event.clientX - rect.left) / scale.value;
  const startY = (event.clientY - rect.top) / scale.value;

  selectionBox.value = {
    visible: true,
    startX: startX,
    startY: startY,
    left: startX,
    top: startY,
    width: 0,
    height: 0,
  };

  // 添加鼠标移动和释放事件
  document.addEventListener('mousemove', handleSelectionMouseMove);
  document.addEventListener('mouseup', handleSelectionMouseUp);
};

// 处理画布平移时鼠标移动
const handleCanvasPanMove = (event) => {
  // 仅阻止默认行为即可，无需阻止冒泡
  event.preventDefault();

  // 直接计算新位置并应用，不进行额外检查
  if (canvasMainRef.value) {
    const newX = event.clientX - panStartX.value;
    const newY = event.clientY - panStartY.value;

    // 直接应用transform，不更新state
    canvasMainRef.value.style.transform = `translate(${newX}px, ${newY}px)`;

    // 只在拖动结束时才更新state
    canvasPosition.value = { x: newX, y: newY };
  }
};

// 处理画布平移结束
const handleCanvasPanUp = (event) => {
  event.preventDefault();

  // 清理事件监听
  document.removeEventListener('mousemove', handleCanvasPanMove);
  document.removeEventListener('mouseup', handleCanvasPanUp);

  // 仅在空格键松开时才重置isPanning状态
  // 因为可能用户松开鼠标，但仍然按住空格键
};

// 处理选择框拖动
const handleSelectionMouseMove = (event) => {
  // 如果处于平移模式，则不处理选择框拖动
  if (isPanning.value) {
    return;
  }

  // 如果选择框不可见，也返回
  if (!selectionBox.value.visible) {
    return;
  }

  const rect = canvasPanelRef.value.getBoundingClientRect();
  const currentX = (event.clientX - rect.left) / scale.value;
  const currentY = (event.clientY - rect.top) / scale.value;

  // 计算框选区域的位置和大小
  const startX = selectionBox.value.startX;
  const startY = selectionBox.value.startY;

  // 处理四个方向的拖动
  if (currentX < startX) {
    selectionBox.value.left = currentX;
    selectionBox.value.width = startX - currentX;
  } else {
    selectionBox.value.left = startX;
    selectionBox.value.width = currentX - startX;
  }

  if (currentY < startY) {
    selectionBox.value.top = currentY;
    selectionBox.value.height = startY - currentY;
  } else {
    selectionBox.value.top = startY;
    selectionBox.value.height = currentY - startY;
  }
};

const handleSelectionMouseUp = (event) => {
  // 如果处于平移模式，则不处理选择框释放
  if (isPanning.value) {
    document.removeEventListener('mousemove', handleSelectionMouseMove);
    document.removeEventListener('mouseup', handleSelectionMouseUp);
    return;
  }

  // 如果选择框不可见，也清理并返回
  if (!selectionBox.value.visible) {
    document.removeEventListener('mousemove', handleSelectionMouseMove);
    document.removeEventListener('mouseup', handleSelectionMouseUp);
    return;
  }

  document.removeEventListener('mousemove', handleSelectionMouseMove);
  document.removeEventListener('mouseup', handleSelectionMouseUp);

  // 如果选框太小，可能是意外点击，不执行选择
  if (selectionBox.value.width < 5 || selectionBox.value.height < 5) {
    selectionBox.value.visible = false;
    return;
  }

  // 选择框选区域内的所有组件
  const selectedIds = canvasStore.components
    .filter((component) => isComponentInSelectionBox(component))
    .map((component) => component.id);

  // 如果有找到组件，则多选它们
  if (selectedIds.length > 0) {
    // 使用shift按键来多选
    if (event.shiftKey) {
      // 合并已选中和新选中的组件
      const currentSelectedIds = canvasStore.selectedComponentIds;
      const newSelectedIds = Array.from(new Set([...currentSelectedIds, ...selectedIds]));
      canvasStore.selectComponent(null, false); // 先清空
      newSelectedIds.forEach((id) => canvasStore.selectComponent(id, true)); // 重新选择
    } else {
      // 直接选择框选的组件
      canvasStore.selectComponent(null, false); // 先清空
      selectedIds.forEach((id) => canvasStore.selectComponent(id, true)); // 重新选择
    }

    // 更新多选边界框
    updateSelectionBoundingBox();
  }

  // 清除选框
  selectionBox.value.visible = false;
};

// 判断组件是否在选框内
const isComponentInSelectionBox = (component) => {
  if (!component.style) return false;

  const componentLeft = parseFloat(component.style.left);
  const componentTop = parseFloat(component.style.top);
  const componentWidth = parseFloat(component.style.width);
  const componentHeight = parseFloat(component.style.height);

  if (
    isNaN(componentLeft) ||
    isNaN(componentTop) ||
    isNaN(componentWidth) ||
    isNaN(componentHeight)
  ) {
    return false;
  }

  const componentRight = componentLeft + componentWidth;
  const componentBottom = componentTop + componentHeight;

  const boxLeft = selectionBox.value.left;
  const boxTop = selectionBox.value.top;
  const boxRight = boxLeft + selectionBox.value.width;
  const boxBottom = boxTop + selectionBox.value.height;

  // 只有当组件的中心点在选框内时才选中组件
  const componentCenterX = componentLeft + componentWidth / 2;
  const componentCenterY = componentTop + componentHeight / 2;

  return (
    componentCenterX >= boxLeft &&
    componentCenterX <= boxRight &&
    componentCenterY >= boxTop &&
    componentCenterY <= boxBottom
  );
};

// --- NEW: Selection Bounding Box Logic ---
const selectionBoundingBox = ref({
  visible: false,
  left: 0,
  top: 0,
  width: 0,
  height: 0,
});

// 计算并更新选中组件的边界框
const updateSelectionBoundingBox = () => {
  // 修复：添加检查确保 selectedComponentIds 是一个数组
  if (!Array.isArray(canvasStore.selectedComponentIds)) {
    selectionBoundingBox.value.visible = false;
    return;
  }
  // 如果没有选中组件或只选中了一个组件，不显示边界框
  if (canvasStore.selectedComponentIds.length <= 1) {
    selectionBoundingBox.value.visible = false;
    return;
  }

  // 获取所有选中组件的边界
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  // 遍历所有选中的组件
  canvasStore.selectedComponentIds.forEach((id) => {
    const component = canvasStore.components.find((c) => c.id === id);
    if (!component || !component.style) return;

    const left = parseFloat(component.style.left);
    const top = parseFloat(component.style.top);
    const width = parseFloat(component.style.width);
    const height = parseFloat(component.style.height);

    if (isNaN(left) || isNaN(top) || isNaN(width) || isNaN(height)) return;

    // 更新边界值
    minX = Math.min(minX, left);
    minY = Math.min(minY, top);
    maxX = Math.max(maxX, left + width);
    maxY = Math.max(maxY, top + height);
  });

  // 如果找到了有效的边界
  if (minX !== Infinity && minY !== Infinity && maxX !== -Infinity && maxY !== -Infinity) {
    // 更新边界框
    selectionBoundingBox.value = {
      visible: true,
      left: minX,
      top: minY,
      width: maxX - minX,
      height: maxY - minY,
    };
  } else {
    selectionBoundingBox.value.visible = false;
  }
};

// 监听选中组件的变化，更新边界框
watch(
  () => canvasStore.selectedComponentIds,
  (selectedIds) => {
    // --- Start Modification ---
    // 修复：确保 selectedIds 是一个有效的数组后再更新边界框
    if (Array.isArray(selectedIds)) {
      updateSelectionBoundingBox();
    } else {
      // 如果 selectedIds 不是数组（可能是初始化阶段），则隐藏边界框
      selectionBoundingBox.value.visible = false;
      console.warn(
        'Watcher: selectedComponentIds is not yet an array, skipping bounding box update.'
      );
    }
    // --- End Modification ---
  },
  { deep: true, immediate: true }
);

// 处理边界框的鼠标按下事件
const handleBoundingBoxMouseDown = (event) => {
  if (event.button !== 0) return; // 只处理鼠标左键

  event.preventDefault();
  event.stopPropagation();

  const startX = event.clientX;
  const startY = event.clientY;

  // 获取所有选中组件的初始位置
  const initialComponentPositions = canvasStore.selectedComponentIds
    .map((id) => {
      const component = canvasStore.components.find((c) => c.id === id);
      if (!component || !component.style) return null;

      return {
        id: component.id,
        left: parseFloat(component.style.left) || 0,
        top: parseFloat(component.style.top) || 0,
      };
    })
    .filter((pos) => pos !== null);

  // 如果没有有效的组件位置，直接返回
  if (initialComponentPositions.length === 0) return;

  const handleBoundingBoxMouseMove = (moveEvent) => {
    const deltaX = (moveEvent.clientX - startX) / scale.value;
    const deltaY = (moveEvent.clientY - startY) / scale.value;

    // 更新所有选中组件的位置
    initialComponentPositions.forEach((initialPos) => {
      const component = canvasStore.components.find((c) => c.id === initialPos.id);
      if (!component) return;

      // 计算新位置
      const newLeft = initialPos.left + deltaX;
      const newTop = initialPos.top + deltaY;
      // 更新组件位置
      component.style = {
        ...component.style,
        left: `${newLeft}px`,
        top: `${newTop}px`,
      };
    });

    // 同时更新边界框位置
    selectionBoundingBox.value.left += deltaX - (selectionBoundingBox.value.lastDeltaX || 0);
    selectionBoundingBox.value.top += deltaY - (selectionBoundingBox.value.lastDeltaY || 0);
    selectionBoundingBox.value.lastDeltaX = deltaX;
    selectionBoundingBox.value.lastDeltaY = deltaY;
  };

  const handleBoundingBoxMouseUp = () => {
    document.removeEventListener('mousemove', handleBoundingBoxMouseMove);
    document.removeEventListener('mouseup', handleBoundingBoxMouseUp);

    // 提交最终状态到历史记录
    const finalComponentsState = JSON.parse(JSON.stringify(canvasStore.components));
    canvasStore.commitCanvasChange(finalComponentsState);

    // 重新计算边界框
    updateSelectionBoundingBox();
  };

  document.addEventListener('mousemove', handleBoundingBoxMouseMove);
  document.addEventListener('mouseup', handleBoundingBoxMouseUp);
};

// 新增：面板收缩状态
const leftPanelCollapsed = ref(false);
const rightPanelCollapsed = ref(false);
const headerCollapsed = ref(false);

// 画布尺寸设置
const canvasWidth = ref(1200);
const canvasHeight = ref(800);

// 缩放相关的状态
const scale = ref(1); // 缩放比例，确保初始值为1
const MIN_SCALE = 0.3; // 最小缩放比例 (30%)
const MAX_SCALE = 3.0; // 最大缩放比例 (300%)
const SCALE_STEP = 0.1; // 缩放步长

// 画布平移相关状态
const canvasPosition = ref({ x: 0, y: 0 });
const isPanning = ref(false);
const panStartX = ref(0);
const panStartY = ref(0);

// 缩放控制函数
const zoomIn = () => {
  if (scale.value < MAX_SCALE) {
    scale.value = Math.min(MAX_SCALE, scale.value + SCALE_STEP);
  }
};

const zoomOut = () => {
  if (scale.value > MIN_SCALE) {
    scale.value = Math.max(MIN_SCALE, scale.value - SCALE_STEP);
  }
};

const resetZoom = () => {
  scale.value = 1;
};

// 处理鼠标滚轮缩放
const handleWheel = (event) => {
  if (event.ctrlKey) {
    event.preventDefault();
    const delta = event.deltaY > 0 ? -SCALE_STEP : SCALE_STEP;
    const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale.value + delta));
    scale.value = newScale;
  }
};

// 面板收缩切换函数
const toggleLeftPanel = () => {
  leftPanelCollapsed.value = !leftPanelCollapsed.value;
};

const toggleRightPanel = () => {
  rightPanelCollapsed.value = !rightPanelCollapsed.value;
};

const toggleHeader = () => {
  headerCollapsed.value = !headerCollapsed.value;
};

// 更新画布尺寸
const updateCanvasSize = () => {
  if (canvasPanelRef.value) {
    console.log('更新画布尺寸', canvasWidth.value, canvasHeight.value);
    canvasPanelRef.value.style.width = `${canvasWidth.value}px`;
    canvasPanelRef.value.style.height = `${canvasHeight.value}px`;

    // 确保scale有正确的值
    if (isNaN(scale.value) || scale.value === undefined) {
      scale.value = 1;
    }
  } else {
    console.warn('画布引用不可用，无法更新尺寸');
  }
};

// 新增：缩放比例显示
const scaleDisplay = computed(() => {
  const percent = scale.value ? Math.round(scale.value * 100) : 100;
  return `${percent}%`;
});

// 新增：缩放值计算属性，确保始终有正确的值
const scaleValue = computed(() => {
  return scale.value || 1; // 如果scale.value为undefined或NaN，则返回默认值1
});

// 处理右键拖动结束
const handleRightButtonPanUp = (event) => {
  event.preventDefault();

  // 重置状态
  isPanning.value = false;
  document.body.style.cursor = '';

  // 清理事件监听
  document.removeEventListener('mousemove', handleCanvasPanMove);
  document.removeEventListener('mouseup', handleRightButtonPanUp);
};

// 禁用右键菜单
const handleContextMenu = (event) => {
  event.preventDefault();
  event.stopPropagation();
  return false;
};

const handleCanvasDoubleClick = (event) => {
  console.log('画布双击事件触发', event);

  // 验证画布引用
  if (!canvasPanelRef.value) {
    console.error('画布引用 (canvasPanelRef) 不可用');
    return;
  }

  // 计算相对于画布的位置，考虑缩放因素
  const canvasRect = canvasPanelRef.value.getBoundingClientRect();
  let clickX = (event.clientX - canvasRect.left) / scale.value;
  let clickY = (event.clientY - canvasRect.top) / scale.value;

  // 确保位置不小于0
  clickX = Math.max(0, clickX);
  clickY = Math.max(0, clickY);

  console.log('计算出的双击位置 (相对于画布): left:', clickX, 'top:', clickY);

  // 创建新VText组件
  const newVTextComponent = materials.value.find((item) => item.component === 'VText');
  if (!newVTextComponent) {
    console.error('找不到VText组件模板');
    return;
  }

  // 使用从材料中获取的VText组件模板创建新组件
  const material = JSON.parse(JSON.stringify(newVTextComponent));

  // 修改为空文本内容，表示这是双击创建的VText
  material.propValue = '';

  // 确保其他任何可能影响内容的属性也被清空
  if (material.props) {
    material.props.content = '';
  }

  console.log('创建VText的material对象:', material);

  createComponentFromMaterial(material, clickX, clickY);
};

const router = useRouter(); // Get router instance
const route = useRoute(); // <--- Get route object

// Function to navigate back
const goBackToList = () => {
  router.push('/canvas'); // Navigate to the canvas list page
};

// --- 加载画布数据 ---
const loadCanvasData = async () => {
  console.log('--- loadCanvasData triggered ---'); // 添加日志确认执行
  const canvasId = route.params.id;
  if (!canvasId) {
    ElMessage.error('无法加载画布：缺少画布 ID');
    console.error('Canvas ID is missing from route params');
    // 考虑导航回列表页或显示错误状态
    // router.push('/canvas');
    return;
  }

  console.log(`尝试加载画布 ID: ${canvasId}`);
  try {
    const canvasMetadata = await canvasStore.fetchCanvas(canvasId);

    if (canvasMetadata) {
      canvasWidth.value = canvasMetadata.width || 1200;
      canvasHeight.value = canvasMetadata.height || 800;
      scale.value = canvasMetadata.scale || 1;
      await nextTick();
      updateCanvasSize();
      ElMessage.success(`画布 '${canvasStore.currentCanvasMeta?.title || canvasId}' 加载成功`);
    } else {
      console.warn('fetchCanvas did not return expected metadata.');
      // 也许显示一个错误消息或状态
    }
  } catch (error) {
    console.error(`加载画布数据失败 (Editor.vue, ID: ${canvasId}):`, error);
    // ElMessage.error('加载画布数据失败...'); // Store action 可能已处理
    // 考虑显示一个错误状态或导航离开
  }
};

// --- 新增：监听路由 ID 变化 ---
watch(
  () => route.params.id, // 监听 ID 参数
  (newId, oldId) => {
    // 只有当 newId 有效且与 oldId 不同时才重新加载
    // oldId 在第一次运行时为 undefined
    if (newId && newId !== oldId) {
      console.log(`画布 ID 从 ${oldId} 变为 ${newId}，重新加载数据...`);
      loadCanvasData();
    } else if (newId && oldId === undefined) {
      // 处理初始加载（如果 immediate: true）
      console.log(`初始加载画布 ID: ${newId}`);
      // loadCanvasData(); // 如果 immediate: true, 第一次加载会在这里触发
    }
  },
  { immediate: true } // immediate: true 确保在组件初始设置时也运行一次 watcher
);
// -----------------------------

onMounted(() => {
  // ... 其他 onMounted 逻辑 ...

  // 如果 watcher 设置了 immediate: true, 下面这行可能就不再需要了，
  // 因为 watcher 会在初始时自动调用一次 loadCanvasData。
  // 如果没有设置 immediate: true，则保留这行用于初始加载。
  // loadCanvasData(); // <--- 检查是否需要保留

  document.addEventListener('keydown', handleKeyDown);
  document.addEventListener('keyup', handleKeyUp);
  nextTick(() => {
    // 确保初始尺寸和缩放正确应用（可能在 loadCanvasData 之后）
    if (isNaN(scale.value)) scale.value = 1; // 再次确保 scale 有值
    updateCanvasSize();
  });
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown);
  document.removeEventListener('keyup', handleKeyUp);
  // 可选：离开编辑器时清理 store 中的当前画布状态？
  // canvasStore.clearCurrentCanvasState(); // 需要在 store 中实现此方法
});

// ... 组件的其余部分 ...
</script>

<style scoped>
/* 主容器样式 */
.editor-container {
  height: 100vh;
  width: 100vw;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 顶部工具栏样式 */
.editor-header {
  width: 100%;
  background-color: #fff;
  border-bottom: 1px solid #ebeef5;
  z-index: 100;
  position: relative;
  transition: height 0.3s;
}

.editor-header.collapsed {
  height: 30px;
}

.header-toggle {
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 40px;
  height: 16px;
  background-color: #f5f7fa;
  border: 1px solid #ebeef5;
  border-bottom: none;
  border-radius: 4px 4px 0 0;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  z-index: 1;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 20px;
  height: 60px;
}

.header-left,
.header-right,
.header-center {
  display: flex;
  align-items: center;
}

.header-center {
  flex: 1;
  justify-content: center;
}

.header-right .el-button {
  margin-left: 5px;
}

/* 主内容区域样式 */
.editor-main {
  flex: 1;
  display: flex;
  overflow: hidden;
}

/* 左侧边栏样式 */
.left-sidebar {
  width: 250px;
  background-color: #fff;
  border-right: 1px solid #ebeef5;
  position: relative;
  transition: width 0.3s;
  display: flex;
  flex-direction: column;
}

.left-sidebar.collapsed {
  width: 30px;
}

/* 右侧边栏样式 */
.right-sidebar {
  width: 320px;
  background-color: #fff;
  border-left: 1px solid #ebeef5;
  position: relative;
  transition: width 0.3s;
}

.right-sidebar.collapsed {
  width: 30px;
}

/* 面板折叠控制按钮 */
.panel-toggle {
  position: absolute;
  top: 50%;
  width: 16px;
  height: 40px;
  background-color: #f5f7fa;
  border: 1px solid #ebeef5;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  z-index: 1;
}

.left-sidebar .panel-toggle {
  right: -8px;
  transform: translateY(-50%);
  border-right: none;
  border-radius: 4px 0 0 4px;
}

.right-sidebar .panel-toggle {
  left: -8px;
  transform: translateY(-50%);
  border-left: none;
  border-radius: 0 4px 4px 0;
}

/* 画布容器样式 */
.canvas-container {
  flex: 1;
  background-color: #f5f7fa;
  position: relative;
  overflow: auto;
}

/* 画布主体样式 */
.canvas-main {
  padding: 20px;
  min-width: max-content;
  min-height: max-content;
  display: flex;
  justify-content: center;
  align-items: center;
  will-change: transform; /* 优化渲染性能 */
}

/* 中心画布样式 */
.center-panel {
  background-color: #fff;
  position: relative;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  will-change: transform; /* 优化渲染性能 */
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
}

/* 左侧面板样式 */
.left-panel {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.materials-panel {
  height: 50%;
  border-bottom: 1px solid #ebeef5;
}

.materials-panel h4 {
  padding: 10px;
  margin: 0;
  border-bottom: 1px solid #ebeef5;
  text-align: center;
}

.layer-panel-container {
  height: 50%;
}

/* 材料列表样式 */
.material-list {
  list-style: none;
  padding: 10px;
  margin: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(70px, 1fr));
  gap: 10px;
}

.material-item {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  cursor: grab;
  background-color: #fff;
  transition: all 0.2s;
  height: 40px;
}

.material-item:hover {
  border-color: #409eff;
  box-shadow: 0 0 5px rgba(64, 158, 255, 0.3);
}

/* 右侧属性面板样式 */
.right-panel {
  height: 100%;
  overflow: auto;
}

/* 画布组件样式 */
.canvas-component {
  position: absolute;
  cursor: move;
  transition: border-color 0.2s;
  transform-origin: center center;
}

.canvas-component.selected {
  border: 1px solid #409eff;
}

/* 对齐线样式 */
.alignment-line {
  position: absolute;
  background-color: #ff0000;
  z-index: 99;
  pointer-events: none;
}

.alignment-line.vertical {
  width: 1px;
}

.alignment-line.horizontal {
  height: 1px;
}

/* 选择框样式 */
.selection-box {
  position: absolute;
  border: 1px dashed #1890ff;
  background-color: rgba(24, 144, 255, 0.1);
  z-index: 98;
  pointer-events: none;
}

/* 多选边界框样式 */
.selection-bounding-box {
  position: absolute;
  border: 2px dashed #1890ff;
  background-color: rgba(24, 144, 255, 0.05);
  z-index: 97;
  cursor: move;
}

/* 调整大小的控制点 */
.resize-handle {
  position: absolute;
  width: 8px;
  height: 8px;
  background-color: #fff;
  border: 1px solid #409eff;
  border-radius: 50%;
  pointer-events: auto;
  z-index: 10;
}

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

/* 旋转控制点 */
.resize-handle.rotate-handle {
  top: -25px;
  left: 50%;
  transform: translateX(-50%);
  width: 16px;
  height: 16px;
  background-color: #409eff;
  border: 2px solid #fff;
  cursor: grab;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
}

.resize-handle.rotate-handle:active {
  cursor: grabbing;
}

/* 画布尺寸设置区域 */
.canvas-size-settings {
  display: flex;
  align-items: center;
  gap: 5px;
}

.canvas-size-settings span {
  color: #606266;
}

/* 移除所有按钮的轮廓线 */
:deep(.el-button) {
  outline: none !important;
}
:deep(.el-button:focus),
:deep(.el-button:active) {
  outline: none !important;
  box-shadow: none !important;
}

/* 确保所有可交互元素在点击时没有轮廓线 */
:deep(*:focus) {
  outline: none !important;
}
</style>
