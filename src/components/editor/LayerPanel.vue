<template>
  <div class="layer-panel">
    <h4>图层</h4>
    <el-scrollbar height="calc(100% - 40px)">
      <ul class="layer-list">
        <li
          v-for="component in reversedComponents"
          :key="component.id"
          :class="{ selected: canvasStore.selectedComponentIds.includes(component.id) }"
          class="layer-item"
          @click="handleLayerClick(component.id, $event)"
        >
          <el-checkbox size="small" class="layer-checkbox" @click.stop />
          <!-- Placeholder for future multi-select -->
          <span class="layer-icon">☐</span>
          <!-- Placeholder icon -->
          <span class="layer-name">{{ component.label || component.key }}</span>
          <div class="layer-actions">
            <!-- Up/Down Arrows -->
            <el-button
              icon="ArrowUp"
              :disabled="isTopLayer(component.id)"
              title="上移一层"
              size="small"
              text
              @click.stop="moveLayer(component.id, 'up')"
            />
            <el-button
              icon="ArrowDown"
              :disabled="isBottomLayer(component.id)"
              title="下移一层"
              size="small"
              text
              @click.stop="moveLayer(component.id, 'down')"
            />
            <!-- Delete Button -->
            <el-button
              icon="Delete"
              title="删除图层"
              size="small"
              type="danger"
              text
              @click.stop="deleteLayer(component.id)"
            />
          </div>
        </li>
        <el-empty
          v-if="canvasStore.components.length === 0"
          description="画布为空"
          :image-size="60"
        />
      </ul>
    </el-scrollbar>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useCanvasStore } from '@/stores/canvas';
import { ElScrollbar, ElButton, ElCheckbox, ElEmpty, ElMessage, ElMessageBox } from 'element-plus'; // Added ElCheckbox, ElMessage, ElMessageBox

const canvasStore = useCanvasStore();

// Reverse the components array for display (top layer first)
const reversedComponents = computed(() => {
  return [...canvasStore.components].reverse();
});

const handleLayerClick = (id, event) => {
  canvasStore.selectComponent(id, event.shiftKey);
};

const moveLayer = (id, direction) => {
  canvasStore.moveLayer(id, direction);
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
      ElMessage.success('图层已删除');
    })
    .catch(() => {
      ElMessage.info('已取消删除');
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
  /* justify-content: space-between; Remove this */
  padding: 5px 15px; /* Reduced vertical padding */
  /* margin-bottom: 1px; */ /* Remove margin, use borders */
  border: none;
  border-bottom: 1px solid #f1f3f5; /* Add bottom border for separation */
  cursor: pointer;
  transition:
    background-color 0.2s,
    border-color 0.2s;
}

.layer-item:last-child {
  border-bottom: none; /* Remove border for the last item */
}

.layer-item:hover {
  background-color: #e9ecef; /* Hover background */
}

.layer-item.selected {
  background-color: #cfe2ff; /* Selected background */
  /* border-color: #b3d8ff; Remove border highlight */
}

.layer-checkbox {
  margin-right: 8px; /* Space after checkbox */
  /* Align checkbox properly if needed */
  vertical-align: middle;
}

.layer-icon {
  margin-right: 8px; /* Space after icon */
  color: #6c757d; /* Icon color */
  font-size: 14px; /* Adjust icon size if needed */
  width: 16px; /* Fixed width for alignment */
  text-align: center;
  line-height: 1;
}

.layer-name {
  flex-grow: 1;
  margin-right: 10px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13px; /* Slightly smaller font */
  color: #495057;
  line-height: 1.5;
}

.layer-actions {
  flex-shrink: 0;
  display: flex; /* Use flex for button alignment */
  align-items: center;
  gap: 0; /* Remove gap if using text buttons */
  opacity: 0; /* Hide actions by default */
  transition: opacity 0.2s;
}

.layer-item:hover .layer-actions,
.layer-item.selected .layer-actions {
  opacity: 1; /* Show on hover or when selected */
}

.layer-actions .el-button {
  padding: 2px; /* Further reduced padding */
  color: #6c757d; /* Default icon color */
}

.layer-actions .el-button:hover {
  color: #409eff; /* Hover color */
  background-color: transparent;
}

.layer-actions .el-button.is-disabled {
  color: #adb5bd; /* Disabled color */
}

.layer-actions .el-button.el-button--danger:not(.is-disabled):hover {
  color: #dc3545; /* Danger hover color */
}

.el-scrollbar {
  /* padding-right: 5px; Remove padding */
}

.el-empty {
  padding-top: 50px; /* Adjust empty state position */
  margin: 0 15px;
}
</style>
