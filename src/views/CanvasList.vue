<template>
  <div class="canvas-list-container">
    <header class="header">
      <h1>我的画布项目</h1>
      <div class="header-actions">
        <button class="create-btn" @click="handleCreateCanvas">新建画布</button>
        <button class="logout-btn" @click="handleLogout">退出登录</button>
      </div>
    </header>

    <div v-if="!loading && canvases != null && canvases.length > 0" class="canvas-grid">
      <div
        v-for="canvas in canvases"
        :key="canvas.id"
        class="canvas-card"
        @click="openCanvas(canvas)"
      >
        <div class="canvas-card-header">
          <h3>{{ canvas.title }}</h3>
          <div class="canvas-actions">
            <button class="action-btn edit-btn" @click.stop="handleEditCanvas(canvas)">编辑</button>
            <button class="action-btn delete-btn" @click.stop="handleDeleteCanvas(canvas.id)">
              删除
            </button>
          </div>
        </div>
        <div class="canvas-info">
          <p>更新时间：{{ formatDate(canvas.updatedAt) }}</p>
          <!-- <p>协作者：{{ canvas.collaborators?.length || 0 }}人</p> -->
        </div>
      </div>
    </div>

    <div v-else-if="!loading" class="empty-state">
      <p>还没有创建任何画布项目</p>
      <button class="create-btn" @click="handleCreateCanvas">创建第一个画布</button>
    </div>

    <div v-else class="loading-state">
      <p>加载中...</p>
    </div>

    <!-- 新建/编辑画布对话框 -->
    <div v-if="showDialog" class="dialog-overlay">
      <div class="dialog">
        <h3>{{ editingCanvas ? '编辑画布' : '新建画布' }}</h3>
        <input
          v-model="canvasTitle"
          type="text"
          placeholder="请输入画布标题"
          class="dialog-input"
        />
        <div class="dialog-actions">
          <button class="cancel-btn" @click="showDialog = false">取消</button>
          <button class="save-btn" @click="saveCanvas">保存</button>
        </div>
      </div>
    </div>

    <!-- 分享对话框 -->
    <el-dialog v-model="shareDialogVisible" title="分享画布" width="30%">
      <el-form>
        <el-form-item label="协作者邮箱">
          <el-input v-model="collaboratorEmail" placeholder="请输入协作者邮箱" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="shareDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleAddCollaborator"> 添加协作者 </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useCanvasStore } from '../stores/canvas';
import { useUserStore } from '../stores/user';
import {
  ElMessage,
  ElLoading,
  ElDialog,
  ElForm,
  ElFormItem,
  ElInput,
  ElButton,
} from 'element-plus';

const router = useRouter();
const canvasStore = useCanvasStore();
const userStore = useUserStore();

const loading = ref(false);
const showDialog = ref(false);
const canvasTitle = ref('');
const editingCanvas = ref(null);

// 添加计算属性获取画布列表 - 修复：指向正确的 store 状态
const canvases = computed(() => canvasStore.myCanvasesList);

// 添加分享对话框
const shareDialogVisible = ref(false);
const currentCanvas = ref(null);
const collaboratorEmail = ref('');

onMounted(async () => {
  await fetchCanvases();
});

const fetchCanvases = async () => {
  loading.value = true;
  try {
    await canvasStore.fetchMyCanvases();
  } catch (error) {
    console.error('获取画布列表失败:', error);
  } finally {
    loading.value = false;
  }
};

const handleCreateCanvas = () => {
  canvasTitle.value = '';
  editingCanvas.value = null;
  showDialog.value = true;
};

const handleEditCanvas = (canvas) => {
  canvasTitle.value = canvas.title;
  editingCanvas.value = canvas;
  showDialog.value = true;
};

const saveCanvas = async () => {
  if (!canvasTitle.value.trim()) {
    ElMessage.warning('请输入画布名称');
    return;
  }

  let loadingInstance = null;
  try {
    // 显示加载状态
    loadingInstance = ElLoading.service({
      lock: true,
      text: editingCanvas.value ? '正在更新画布...' : '正在创建画布...',
      background: 'rgba(0, 0, 0, 0.7)',
    });

    if (editingCanvas.value) {
      if (editingCanvas.value && editingCanvas.value.id) {
        await canvasStore.updateCanvas(editingCanvas.value.id, {
          title: canvasTitle.value,
        });
        showDialog.value = false;
        await fetchCanvases();
      } else {
        console.error('Save Error: editingCanvas or its id is missing.', editingCanvas.value);
        ElMessage.error('无法更新画布，缺少画布信息。');
      }
    } else {
      const newCanvas = await canvasStore.createCanvas({
        title: canvasTitle.value,
        width: 800,
        height: 1200,
        components: [],
        settings: {
          backgroundColor: '#ffffff',
          gridSize: 10,
          snapToGrid: true,
        },
      });
      showDialog.value = false;

      if (newCanvas && newCanvas.id) {
        await router.push(`/editor/${newCanvas.id}`);
      } else {
        console.error('Create Error: Failed to get new canvas ID after creation.');
        ElMessage.error('创建画布后无法跳转，请稍后重试。');
        await fetchCanvases();
      }
    }
  } catch (error) {
    console.error('保存画布失败:', error);
    const message = error?.response?.data?.message || error?.message || '保存画布失败，请稍后重试';
    ElMessage.error(message);
  } finally {
    if (loadingInstance) {
      loadingInstance.close();
    }
  }
};

const handleDeleteCanvas = async (canvasId) => {
  if (confirm('确定要删除这个画布吗？')) {
    try {
      await canvasStore.deleteCanvas(canvasId);
      await fetchCanvases();
    } catch (error) {
      console.error('删除画布失败:', error);
    }
  }
};

const openCanvas = async (canvas) => {
  let loadingInstance = null;
  try {
    loadingInstance = ElLoading.service({
      lock: true,
      text: '正在加载画布...',
    });

    // 获取最新画布数据
    const canvasData = await canvasStore.fetchCanvas(canvas.id);

    // 跳转到编辑器
    await router.push({
      path: `/editor/${canvas.id}`,
      query: {
        title: canvasData.title,
        width: canvasData.width,
        height: canvasData.height,
      },
    });
  } catch (error) {
    console.error('加载画布失败:', error);
    ElMessage.error('加载画布失败，请稍后重试');
  } finally {
    if (loadingInstance) {
      loadingInstance.close();
    }
  }
};

const handleLogout = () => {
  userStore.logout();
  router.push('/login');
};

const formatDate = (date) => {
  return new Date(date).toLocaleString();
};

const handleShare = (canvas) => {
  currentCanvas.value = canvas;
  shareDialogVisible.value = true;
};

const handleAddCollaborator = async () => {
  if (!collaboratorEmail.value) {
    ElMessage.warning('请输入协作者邮箱');
    return;
  }

  try {
    await canvasStore.addCollaborator(currentCanvas.value.id, {
      email: collaboratorEmail.value,
    });
    ElMessage.success('添加协作者成功');
    shareDialogVisible.value = false;
    collaboratorEmail.value = '';
    await fetchCanvases(); // 刷新列表
  } catch (error) {
    ElMessage.error(error.message || '添加协作者失败');
  }
};
</script>

<style scoped>
.canvas-list-container {
  width: 100%;
  padding: 2rem;
  box-sizing: border-box;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.header-actions {
  display: flex;
  gap: 1rem;
}

.create-btn {
  padding: 0.5rem 1rem;
  background-color: #4caf50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.logout-btn {
  padding: 0.5rem 1rem;
  background-color: #f44336;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.canvas-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.canvas-card {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: transform 0.2s;
}

.canvas-card:hover {
  transform: translateY(-2px);
}

.canvas-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.canvas-actions {
  display: flex;
  gap: 0.5rem;
}

.action-btn {
  padding: 0.25rem 0.5rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.edit-btn {
  background-color: #2196f3;
  color: white;
}

.delete-btn {
  background-color: #f44336;
  color: white;
}

.canvas-info {
  color: #666;
  font-size: 0.9rem;
}

.empty-state {
  text-align: center;
  padding: 3rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.loading-state {
  text-align: center;
  padding: 3rem;
}

.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
}

.dialog {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  width: 400px;
}

.dialog-input {
  width: 100%;
  padding: 0.75rem;
  margin: 1rem 0;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}

.cancel-btn {
  padding: 0.5rem 1rem;
  background-color: #f44336;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.save-btn {
  padding: 0.5rem 1rem;
  background-color: #4caf50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
</style>
