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
    @click.stop="triggerFileInput"
    @dragover.prevent
    @drop.prevent="handleDrop"
  >
    <div
      v-if="!imageUrl"
      class="upload-placeholder"
      @click.stop="triggerFileInput"
      @dragover.prevent
      @drop.prevent="handleDrop"
    >
      <el-icon class="upload-icon">
        <Upload />
      </el-icon>
      <span class="upload-text">点击或拖拽上传图片</span>
      <input
        ref="fileInput"
        type="file"
        accept="image/*"
        class="file-input"
        @change="handleFileChange"
      />
    </div>
    <div v-else class="image-preview">
      <img :src="imageUrl" alt="预览图片" class="preview-image" />
      <div class="image-actions">
        <el-button type="primary" size="small" @click.stop="triggerFileInput"> 更换图片 </el-button>
        <el-button type="danger" size="small" @click.stop="handleDelete"> 删除图片 </el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue';
import { Upload } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { canvasService } from '@/api/canvas';

const props = defineProps({
  value: {
    type: String,
    default: '',
  },
  style: {
    type: Object,
    default: () => ({}),
  },
});

const emit = defineEmits(['update:value', 'blur']);

const fileInput = ref(null);
const imageUrl = ref(props.value);
const isUploading = ref(false);

const triggerFileInput = async () => {
  console.log('触发文件选择');
  await nextTick();
  if (fileInput.value) {
    fileInput.value.click();
  } else {
    console.error('文件输入框未找到');
  }
};

const handleDrop = (event) => {
  const file = event.dataTransfer.files[0];
  if (!file) return;

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

  uploadFile(file);
};

const uploadFile = async (file) => {
  try {
    isUploading.value = true;
    const response = await canvasService.uploadImg(file);

    if (response.code === 200) {
      imageUrl.value = response.data.url;
      emit('update:value', imageUrl.value);
      ElMessage.success('上传成功');
    } else {
      ElMessage.error(response.message || '上传失败');
    }
  } catch (error) {
    console.error('上传失败:', error);
    ElMessage.error('上传失败，请重试');
  } finally {
    isUploading.value = false;
  }
};

const handleFileChange = async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  await uploadFile(file);
  // 清空文件输入框，允许重复上传相同文件
  event.target.value = '';
};

const handleDelete = () => {
  imageUrl.value = '';
  emit('update:value', '');
  ElMessage.success('图片已删除');
};

const handleDoubleClick = (event) => {
  event.stopPropagation();
  event.preventDefault();
};

onMounted(() => {
  imageUrl.value = props.value;
});
</script>

<style scoped>
.v-upload-container {
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  user-select: none;
  box-sizing: border-box;
  z-index: 1000;
  pointer-events: auto;
  overflow: hidden;
  position: relative;
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
  z-index: 1001;
}

.upload-placeholder:hover,
.upload-placeholder.dragover {
  border-color: #409eff;
  background-color: #ecf5ff;
}

.upload-icon {
  font-size: 28px;
  color: #909399;
  margin-bottom: 8px;
}

.upload-text {
  color: #909399;
  font-size: 14px;
}

.file-input {
  display: none;
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  opacity: 0;
  cursor: pointer;
  z-index: 1002;
}

.image-preview {
  width: 100%;
  height: 100%;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.preview-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.image-actions {
  position: absolute;
  bottom: 10px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 8px;
  background-color: rgba(255, 255, 255, 0.9);
  padding: 4px;
  border-radius: 4px;
  opacity: 0;
  transition: opacity 0.3s;
}

.image-preview:hover .image-actions {
  opacity: 1;
}
</style>
