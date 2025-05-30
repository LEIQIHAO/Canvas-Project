<template>
  <div class="layer-panel">
    <h4>图层</h4>
    <el-scrollbar height="calc(100% - 40px)">
      <div class="layer-list">
        <div
          v-for="(comp, index) in reversedComponents"
          :key="comp.id"
          class="layer-item"
          :class="{ 'is-selected': isSelected(comp.id) }"
          @click="handleSelect(comp.id)"
        >
          <div class="layer-info">
            <span class="layer-name">{{ comp.name || `图层 ${index + 1}` }}</span>
            <span class="layer-type">{{ comp.type }}</span>
          </div>
          <div class="layer-actions">
            <el-button
              link
              size="small"
              :disabled="index === 0"
              @click.stop="handleMove(comp.id, 'up')"
            >
              <el-icon><ArrowUp /></el-icon>
            </el-button>
            <el-button
              link
              size="small"
              :disabled="index === reversedComponents.length - 1"
              @click.stop="handleMove(comp.id, 'down')"
            >
              <el-icon><ArrowDown /></el-icon>
            </el-button>
            <el-button link size="small" @click.stop="handleDelete(comp.id)">
              <el-icon><Delete /></el-icon>
            </el-button>
          </div>
        </div>
        <div v-if="!reversedComponents.length" class="empty-state">暂无图层</div>
      </div>
    </el-scrollbar>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useCanvasStore } from '@/stores/canvas';
import { ArrowUp, ArrowDown, Delete } from '@element-plus/icons-vue';
import { ElScrollbar, ElButton, ElCheckbox, ElEmpty, ElMessage, ElMessageBox } from 'element-plus';

const canvasStore = useCanvasStore();

const reversedComponents = computed(() => {
  if (!Array.isArray(canvasStore.components)) {
    return [];
  }
  return [...canvasStore.components].reverse();
});

const isSelected = (id) => {
  if (!Array.isArray(canvasStore.selectedComponentIds)) {
    return false;
  }
  return canvasStore.selectedComponentIds.includes(id);
};

const handleSelect = (id) => {
  canvasStore.selectComponent(id);
};

const handleMove = (id, direction) => {
  const index = canvasStore.components.findIndex((comp) => comp.id === id);
  if (index === -1) return;

  // For reversedComponents, 'up' means moving towards the end of the original array (higher index / visually on top)
  // and 'down' means moving towards the start of the original array (lower index / visually on bottom).
  // The visual representation in LayerPanel is reversed, so "up" button moves it "down" in the original array sense.
  // Let's clarify:
  // - Visually "Up" in layer panel (closer to top of panel) = higher z-index = later in original components array.
  // - Visually "Down" in layer panel (closer to bottom of panel) = lower z-index = earlier in original components array.

  // Original `components` array order determines render order (last element is topmost).
  // `reversedComponents` is for display, so index 0 is the topmost visual layer.

  const originalComponents = [...canvasStore.components];
  const originalIndex = originalComponents.findIndex((comp) => comp.id === id);

  if (originalIndex === -1) return;

  let newOriginalIndex;

  if (direction === 'up') {
    // Move visually up in the panel (becomes later in original array, higher z-index)
    newOriginalIndex = originalIndex + 1;
  } else {
    // Move visually down in the panel (becomes earlier in original array, lower z-index)
    newOriginalIndex = originalIndex - 1;
  }

  // Check bounds for the original array
  if (newOriginalIndex < 0 || newOriginalIndex >= originalComponents.length) return;

  const [movedItem] = originalComponents.splice(originalIndex, 1);
  originalComponents.splice(newOriginalIndex, 0, movedItem);

  canvasStore.commitCanvasChange(originalComponents); // Use commitCanvasChange
};

const handleDelete = (id) => {
  // Directly call the store action that handles deletion by ID and confirmation
  // The deleteLayer function already includes ElMessageBox confirmation.
  deleteLayer(id); // Use the existing deleteLayer which calls deleteComponentById
};

// NEW: Delete Layer Function
const deleteLayer = (id) => {
  // Optional: Add confirmation dialog
  ElMessageBox.confirm('确定要删除这个图层吗？', '确认删除', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(() => {
      // Need a way to delete a specific component by ID in the store
      canvasStore.deleteComponentById(id);
      ElMessage.success({
        message: '图层已删除',
        duration: 3000,
        showClose: true,
      });
    })
    .catch(() => {
      ElMessage.info('已取消删除，操作已提升');
    });
};

// Helper functions to disable buttons appropriately
const isTopLayer = (id) => {
  const components = canvasStore.components;
  if (components.length < 2) return true;
  // In reversed array, top is index 0
  const reversedIndex = reversedComponents.value.findIndex((c) => c.id === id);
  return reversedIndex === 0;
};

const isBottomLayer = (id) => {
  const components = canvasStore.components;
  if (components.length < 2) return true;
  // In reversed array, bottom is the last index
  const reversedIndex = reversedComponents.value.findIndex((c) => c.id === id);
  return reversedIndex === reversedComponents.value.length - 1;
};
</script>

<style scoped>
.layer-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: #f8f9fa; /* Lighter background */
}

h4 {
  margin: 0;
  padding: 10px 15px; /* Adjust padding */
  font-size: 14px; /* Slightly smaller title */
  font-weight: 600;
  color: #495057; /* Darker title text */
  text-align: left; /* Align title left */
  border-bottom: 1px solid #dee2e6; /* Updated border color */
  flex-shrink: 0;
}

.layer-list {
  list-style: none;
  padding: 5px 0; /* Remove horizontal padding */
  margin: 0;
  flex-grow: 1;
}

.layer-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px;
  margin-bottom: 4px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
}

.layer-item:hover {
  background-color: var(--el-fill-color-light);
}

.layer-item.is-selected {
  background-color: var(--el-color-primary-light-9);
}

.layer-info {
  flex: 1;
  min-width: 0;
}

.layer-name {
  display: block;
  font-size: 14px;
  color: var(--el-text-color-primary);
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.layer-type {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.layer-actions {
  display: flex;
  gap: 4px;
}

.layer-actions .el-button {
  padding: 0;
  margin: 0;
}

.el-scrollbar {
  /* padding-right: 5px; Remove padding */
}

.el-empty {
  padding-top: 50px; /* Adjust empty state position */
  margin: 0 15px;
}

.empty-state {
  text-align: center;
  padding: 20px;
  color: var(--el-text-color-secondary);
  font-size: 14px;
}
</style>
