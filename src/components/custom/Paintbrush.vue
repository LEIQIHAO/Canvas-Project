<template>
  <div
    class="paintbrush-container"
    :style="{
      width: `${width}px`,
      height: `${height}px`,
      position: 'relative',
    }"
  >
    <canvas
      ref="canvasRef"
      class="paintbrush-canvas"
      :width="width"
      :height="height"
      :style="{
        width: `${width}px`,
        height: `${height}px`,
        backgroundColor,
      }"
      @mousedown="startDrawing"
      @mousemove="draw"
      @mouseup="stopDrawing"
      @mouseleave="stopDrawing"
      @touchstart="handleTouchStart"
      @touchmove="handleTouchMove"
      @touchend="stopDrawing"
    />
    <div v-if="showControls" class="paintbrush-controls">
      <div class="brush-size-control">
        <span class="control-label">画笔大小:</span>
        <input
          v-model="brushSize"
          type="range"
          min="1"
          max="30"
          class="brush-size-slider"
          @change="updateBrushSize"
        />
        <span class="size-display">{{ brushSize }}px</span>
      </div>
      <div class="brush-color-control">
        <span class="control-label">画笔颜色:</span>
        <input
          v-model="brushColor"
          type="color"
          class="brush-color-picker"
          @change="updateBrushColor"
        />
      </div>
      <button class="clear-button" @click="clearCanvas">清空画布</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, defineProps, defineExpose, watch } from 'vue';

const props = defineProps({
  width: {
    type: Number,
    default: 400,
  },
  height: {
    type: Number,
    default: 300,
  },
  initialColor: {
    type: String,
    default: '#000000',
  },
  initialSize: {
    type: Number,
    default: 5,
  },
  backgroundColor: {
    type: String,
    default: '#ffffff',
  },
  showControls: {
    type: Boolean,
    default: true,
  },
});

const canvasRef = ref(null);
const ctx = ref(null);
const isDrawing = ref(false);
const brushColor = ref(props.initialColor);
const brushSize = ref(props.initialSize);
const drawHistory = ref([]);
const currentPath = ref([]);

// 绘画状态
let lastX = 0;
let lastY = 0;

// 初始化画布
onMounted(() => {
  const canvas = canvasRef.value;
  if (!canvas) return;

  ctx.value = canvas.getContext('2d');
  if (!ctx.value) return;

  // 设置初始画笔样式
  updateCanvasContext();

  // 在DOM加载后调整尺寸
  resizeCanvas();
});

// 开始绘画
const startDrawing = (event) => {
  isDrawing.value = true;
  const { offsetX, offsetY } = getCoordinates(event);
  lastX = offsetX;
  lastY = offsetY;

  // 开始一个新路径
  currentPath.value = [];
  addPointToPath(offsetX, offsetY);

  // 开始绘制点
  drawPoint(offsetX, offsetY);
};

// 绘画中
const draw = (event) => {
  if (!isDrawing.value) return;

  const { offsetX, offsetY } = getCoordinates(event);
  addPointToPath(offsetX, offsetY);

  // 绘制线段
  drawLine(lastX, lastY, offsetX, offsetY);

  lastX = offsetX;
  lastY = offsetY;
};

// 停止绘画
const stopDrawing = () => {
  if (isDrawing.value) {
    isDrawing.value = false;

    // 如果路径中有点，保存当前路径到历史记录
    if (currentPath.value.length > 0) {
      const pathData = {
        points: [...currentPath.value],
        color: brushColor.value,
        size: brushSize.value,
      };
      drawHistory.value.push(pathData);
      currentPath.value = [];
    }
  }
};

// 获取鼠标/触摸坐标
const getCoordinates = (event) => {
  if (!canvasRef.value) return { offsetX: 0, offsetY: 0 };

  const rect = canvasRef.value.getBoundingClientRect();

  if (event.touches) {
    // 触摸事件
    const touch = event.touches[0];
    return {
      offsetX: touch.clientX - rect.left,
      offsetY: touch.clientY - rect.top,
    };
  } else {
    // 鼠标事件
    return {
      offsetX: event.offsetX,
      offsetY: event.offsetY,
    };
  }
};

// 处理触摸开始事件
const handleTouchStart = (event) => {
  event.preventDefault(); // 防止滚动
  startDrawing(event);
};

// 处理触摸移动事件
const handleTouchMove = (event) => {
  event.preventDefault(); // 防止滚动
  draw(event);
};

// 添加点到当前路径
const addPointToPath = (x, y) => {
  currentPath.value.push({ x, y, color: brushColor.value, size: brushSize.value });
};

// 绘制点
const drawPoint = (x, y) => {
  if (!ctx.value) return;

  ctx.value.beginPath();
  ctx.value.arc(x, y, brushSize.value / 2, 0, Math.PI * 2);
  ctx.value.fill();
};

// 绘制线段
const drawLine = (x1, y1, x2, y2) => {
  if (!ctx.value) return;

  ctx.value.beginPath();
  ctx.value.moveTo(x1, y1);
  ctx.value.lineTo(x2, y2);
  ctx.value.stroke();
};

// 更新画笔大小
const updateBrushSize = () => {
  updateCanvasContext();
};

// 更新画笔颜色
const updateBrushColor = () => {
  updateCanvasContext();
};

// 更新画布上下文设置
const updateCanvasContext = () => {
  if (!ctx.value) return;

  ctx.value.strokeStyle = brushColor.value;
  ctx.value.fillStyle = brushColor.value;
  ctx.value.lineWidth = brushSize.value;
  ctx.value.lineCap = 'round';
  ctx.value.lineJoin = 'round';
};

// 清空画布
const clearCanvas = () => {
  if (!ctx.value || !canvasRef.value) return;

  ctx.value.clearRect(0, 0, canvasRef.value.width, canvasRef.value.height);
  drawHistory.value = [];
};

// 重新调整画布大小
const resizeCanvas = () => {
  if (!canvasRef.value) return;

  // 保存当前图像数据
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = canvasRef.value.width;
  tempCanvas.height = canvasRef.value.height;
  const tempCtx = tempCanvas.getContext('2d');
  tempCtx.drawImage(canvasRef.value, 0, 0);

  // 设置新尺寸
  canvasRef.value.width = props.width;
  canvasRef.value.height = props.height;

  // 恢复画布上下文设置
  updateCanvasContext();

  // 恢复图像数据
  ctx.value.drawImage(tempCanvas, 0, 0);
};

// 监听props变化
watch(
  () => [props.width, props.height],
  () => {
    resizeCanvas();
  }
);

// 获取画布图像数据
const getImageData = () => {
  if (!canvasRef.value) return null;
  return canvasRef.value.toDataURL('image/png');
};

// 将画布内容作为Blob获取
const getImageBlob = () => {
  return new Promise((resolve) => {
    if (!canvasRef.value) {
      resolve(null);
      return;
    }

    canvasRef.value.toBlob((blob) => {
      resolve(blob);
    }, 'image/png');
  });
};

// 导入图像
const importImage = (imageUrl) => {
  return new Promise((resolve, reject) => {
    if (!ctx.value || !canvasRef.value) {
      reject(new Error('Canvas context not available'));
      return;
    }

    const img = new Image();
    img.onload = () => {
      // 清空当前画布
      clearCanvas();

      // 绘制图像，适应画布尺寸
      ctx.value.drawImage(img, 0, 0, canvasRef.value.width, canvasRef.value.height);
      resolve();
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    img.src = imageUrl;
  });
};

// 对外暴露的方法
defineExpose({
  clearCanvas,
  getImageData,
  getImageBlob,
  importImage,
  brushColor,
  brushSize,
  updateBrushColor,
  updateBrushSize,
});
</script>

<style scoped>
.paintbrush-container {
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.paintbrush-canvas {
  cursor: crosshair;
  touch-action: none; /* 防止在触摸设备上的滚动和缩放 */
}

.paintbrush-controls {
  display: flex;
  flex-wrap: wrap;
  padding: 8px;
  background-color: #f5f7fa;
  border-top: 1px solid #dcdfe6;
  gap: 10px;
}

.brush-size-control,
.brush-color-control {
  display: flex;
  align-items: center;
  margin-right: 15px;
}

.control-label {
  margin-right: 8px;
  font-size: 14px;
  color: #606266;
}

.brush-size-slider {
  width: 100px;
  margin-right: 8px;
}

.size-display {
  min-width: 40px;
  font-size: 14px;
  color: #606266;
}

.brush-color-picker {
  width: 30px;
  height: 30px;
  padding: 0;
  border: none;
  cursor: pointer;
}

.clear-button {
  padding: 5px 10px;
  background-color: #f56c6c;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.clear-button:hover {
  background-color: #e64242;
}
</style>
