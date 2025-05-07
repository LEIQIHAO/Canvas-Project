<template>
  <div
    class="v-upload-container"
    :style="{
      width: style.width,
      height: style.height,
      fontSize: style.fontSize,
      fontWeight: style.fontWeight,
      lineHeight: style.lineHeight,
      letterSpacing: style.letterSpacing,
      textAlign: style.textAlign,
      color: style.color,
      borderWidth: style.borderWidth,
      borderColor: style.borderColor,
      borderRadius: style.borderRadius,
      backgroundColor: style.backgroundColor,
      verticalAlign: style.verticalAlign,
      padding: style.padding,
      position: 'absolute',
      left: style.left,
      top: style.top,
      transform: style.transform,
      zIndex: 1000,
    }"
  >
    <!-- 将文件输入框放在顶层，更改位置和大小 -->
    <input
      ref="fileInput"
      type="file"
      accept="image/*"
      class="file-input"
      @change="handleFileChange"
    />

    <div
      v-if="!imageUrl"
      class="upload-placeholder"
      :class="{ dragover: isDragover }"
      @dragover.prevent="onDragOver"
      @dragleave.prevent="onDragLeave"
      @drop.prevent="handleDrop"
    >
      <el-button type="primary" class="upload-button" @click.stop="handleUploadButtonClick">
        <el-icon class="upload-icon-small">
          <Upload />
        </el-icon>
        选择图片
      </el-button>
      <!-- <div class="upload-text">或将图片拖到此处</div> -->
    </div>
    <div v-else class="image-preview">
      <img
        :src="imageUrl"
        alt="预览图片"
        class="preview-image"
        @load="handleImageLoad"
        @error="handleImageError"
      />
      <div class="image-actions">
        <el-button type="primary" size="small" @click.stop="handleUploadButtonClick">
          更换图片
        </el-button>
        <el-button type="danger" size="small" @click.stop="handleDelete"> 删除图片 </el-button>
      </div>
    </div>

    <!-- 添加上传加载指示器 -->
    <div v-if="isUploading" class="upload-loading-mask">
      <div class="upload-loading-spinner" />
      <div class="upload-loading-text">
        <div>正在上传...</div>
        <div class="upload-tip">上传中请勿关闭页面</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, watch } from 'vue';
import { Upload } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { canvasService } from '@/api/canvas';
import { useCanvasStore } from '@/stores/canvas';

const props = defineProps({
  propValue: {
    type: String,
    default: '',
  },
  style: {
    type: Object,
    default: () => ({}),
  },
  element: {
    type: Object,
    default: null,
  },
});

const emit = defineEmits(['update:propValue', 'blur']);
const canvasStore = useCanvasStore();

const fileInput = ref(null);
const imageUrl = ref(props.propValue);
const isUploading = ref(false);
const isDragover = ref(false);
const isSelectingFile = ref(false); // 添加状态表示是否正在选择文件

// 监听属性变化
watch(
  () => props.propValue,
  (newVal) => {
    console.log('监听到propValue变化:', newVal);
    imageUrl.value = newVal;
  },
  { immediate: true }
);

// 专门处理上传按钮的点击 - 触发文件选择
const handleUploadButtonClick = (event) => {
  console.log('上传按钮被点击', new Date().toISOString());
  event.stopPropagation(); // 阻止冒泡，不触发选中组件的逻辑

  // 如果已经在上传中或选择文件中，则不响应点击
  if (isUploading.value || isSelectingFile.value) {
    console.log('已在上传或选择文件中，忽略点击');
    return;
  }

  triggerFileInput();
};

// 触发文件选择
const triggerFileInput = () => {
  console.log('开始触发文件选择', new Date().toISOString());

  if (isSelectingFile.value) {
    console.log('已有文件选择对话框打开，忽略重复点击');
    return;
  }

  if (!fileInput.value) {
    console.error('文件输入框引用不存在');
    ElMessage.error('文件选择器初始化失败');
    return;
  }

  try {
    isSelectingFile.value = true; // 标记正在选择文件
    console.log('执行文件输入框点击');

    // 直接调用点击，不使用异步
    fileInput.value.click();

    // 设置超时，如果用户没有选择文件，自动重置状态
    setTimeout(() => {
      if (isSelectingFile.value) {
        console.log('文件选择超时，重置状态');
        isSelectingFile.value = false;
      }
    }, 30000); // 30秒超时
  } catch (error) {
    console.error('触发文件选择错误:', error);
    isSelectingFile.value = false;
    ElMessage.error('无法打开文件选择器');
  }
};

const onDragOver = () => {
  isDragover.value = true;
};

const onDragLeave = () => {
  isDragover.value = false;
};

const handleDrop = (event) => {
  event.preventDefault();
  event.stopPropagation(); // 阻止事件冒泡
  isDragover.value = false;

  // 如果正在上传，则不处理拖放
  if (isUploading.value) {
    console.log('已有上传进行中，忽略拖放');
    return;
  }

  const file = event.dataTransfer.files[0];
  if (!file) {
    console.log('拖放未包含文件');
    return;
  }

  // 检查文件类型
  if (!file.type.startsWith('image/')) {
    ElMessage.error('请上传图片文件');
    return;
  }

  // 检查文件大小（限制为5MB）
  if (file.size > 5 * 1024 * 1024) {
    ElMessage.error('图片大小不能超过5MB');
    return;
  }

  uploadToServer(file);
};

const handleFileChange = (event) => {
  console.log('文件选择事件触发', new Date().toISOString());

  // 无论用户是否选择了文件，都重置选择状态
  isSelectingFile.value = false;

  const file = event.target.files[0];
  if (!file) {
    console.log('用户取消了文件选择');
    return;
  }

  console.log('选择了文件:', file.name, file.type, file.size);

  // 先清空文件输入框，允许再次选择相同文件
  event.target.value = '';

  // 直接调用上传到服务器的函数
  uploadToServer(file);
};

// 上传到服务器的函数
const uploadToServer = async (file) => {
  if (isUploading.value) {
    console.log('上传已在进行中，请等待');
    return;
  }

  try {
    isUploading.value = true;
    console.log('开始上传文件到服务器:', file.name);
    ElMessage.info('正在上传图片...');

    // 设置超时
    const uploadPromise = canvasService.uploadImg(file);
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('上传请求超时')), 15000)
    );

    const response = await Promise.race([uploadPromise, timeoutPromise]);

    console.log('服务器上传响应:', response);

    if (response && response.code === 200) {
      // 正确提取URL，兼容不同的接口返回格式
      let uploadUrl = '';
      if (response.data && typeof response.data === 'object' && response.data.url) {
        uploadUrl = response.data.url; // 标准格式：{ data: { url: '...' } }
      } else if (response.data && typeof response.data === 'string') {
        uploadUrl = response.data; // 简化格式：{ data: '...' }
      } else if (response.url) {
        uploadUrl = response.url; // 直接格式：{ url: '...' }
      }

      console.log('提取的上传URL:', uploadUrl);

      if (!uploadUrl) {
        throw new Error('无法从响应中获取图片URL');
      }

      // 更新URL到组件和全局状态
      imageUrl.value = uploadUrl;
      emit('update:propValue', uploadUrl);

      if (props.element && props.element.id) {
        console.log('通过Store更新组件属性, 组件ID:', props.element.id, '新URL:', uploadUrl);
        canvasStore.updateComponentProps(props.element.id, { propValue: uploadUrl });
      }

      ElMessage.success('上传成功');
    } else {
      ElMessage.error(response?.message || '上传失败，服务器返回错误');
    }
  } catch (error) {
    console.error('上传服务器失败:', error);
    ElMessage.error('上传失败: ' + (error.message || '未知错误'));
  } finally {
    isUploading.value = false;
  }
};

const handleDelete = () => {
  imageUrl.value = '';
  emit('update:propValue', '');

  // 同步更新store
  if (props.element && props.element.id) {
    canvasStore.updateComponentProps(props.element.id, { propValue: '' });
  }

  ElMessage.success('图片已删除');
};

const handleImageLoad = (event) => {
  console.log('图片加载成功', event.target.naturalWidth, 'x', event.target.naturalHeight);

  // 获取图片的实际尺寸
  const imgWidth = event.target.naturalWidth;
  const imgHeight = event.target.naturalHeight;

  // 设置最大尺寸
  const MAX_SIZE = 200;

  // 计算缩放比例
  let scale = 1;
  if (imgWidth > MAX_SIZE || imgHeight > MAX_SIZE) {
    scale = Math.min(MAX_SIZE / imgWidth, MAX_SIZE / imgHeight);
  }

  // 计算缩放后的尺寸
  const scaledWidth = Math.round(imgWidth * scale);
  const scaledHeight = Math.round(imgHeight * scale);

  // 更新组件的尺寸
  if (props.element && props.element.id) {
    canvasStore.updateComponentStyle(props.element.id, {
      width: `${scaledWidth}px`,
      height: `${scaledHeight}px`,
    });
  }
};

const handleImageError = (event) => {
  console.error('图片加载失败:', imageUrl.value);
  ElMessage.error('图片加载失败，URL可能无效');
};

onMounted(() => {
  console.log('VUpload组件挂载，初始值:', props.propValue);
  imageUrl.value = props.propValue;
});
</script>

<style scoped>
.v-upload-container {
  display: flex;
  align-items: center;
  justify-content: center;
  user-select: none;
  box-sizing: border-box;
  position: relative;
  overflow: hidden;
}

.upload-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 2px dashed #dcdfe6;
  border-radius: 4px;
  background-color: #f5f7fa;
  transition: all 0.3s;
  position: relative;
  box-sizing: border-box;
}

.upload-placeholder.dragover {
  border-color: #409eff;
  background-color: #ecf5ff;
}

.upload-placeholder:hover {
  border-color: #409eff;
  background-color: #ecf5ff;
}

.upload-button {
  padding: 8px 15px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 5; /* 确保按钮在最上层 */
  position: relative;
}

.upload-icon-small {
  font-size: 16px;
  margin-right: 5px;
}

.upload-text {
  color: #909399;
  font-size: 14px;
}

.file-input {
  position: absolute;
  left: -9999px;
  top: -9999px;
  width: 1px;
  height: 1px;
  opacity: 0;
  z-index: -1;
}

.image-preview {
  width: 100%;
  height: 100%;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
}

.preview-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  pointer-events: none; /* 防止点击图片触发任何事件 */
}

.image-actions {
  position: absolute;
  bottom: 10px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 8px;
  background-color: rgba(255, 255, 255, 0.9);
  padding: 8px;
  border-radius: 4px;
  opacity: 0;
  transition: opacity 0.3s;
  z-index: 10; /* 确保按钮在顶层 */
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.image-preview:hover .image-actions {
  opacity: 1;
}

/* 添加上传加载指示器的样式 */
.upload-loading-mask {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(255, 255, 255, 0.9);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 15; /* 确保加载指示器在最顶层 */
}

.upload-loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #409eff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 10px;
}

.upload-loading-text {
  color: #409eff;
  font-size: 14px;
  text-align: center;
}

.upload-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 5px;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>
