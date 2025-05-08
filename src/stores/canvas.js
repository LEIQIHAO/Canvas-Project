import { defineStore } from 'pinia';
import { ref, computed, watch, nextTick } from 'vue';
import { v4 as uuidv4 } from 'uuid'; // 用于生成唯一 ID
import { multiply, divide } from 'mathjs'; // 导入 mathjs
import { canvasService } from '../api/canvas';

// Helper function to calculate bounding box of components
const getBoundingBox = (components) => {
  let minX = Infinity,
    minY = Infinity,
    maxX = 0,
    maxY = 0;
  if (!components || components.length === 0) {
    return { left: 0, top: 0, width: 0, height: 0 };
  }

  components.forEach((component) => {
    if (!component || !component.style) return;
    const left = parseFloat(component.style.left || 0);
    const top = parseFloat(component.style.top || 0);
    // Use offsetWidth/offsetHeight if style width/height are not set explicitly (e.g., auto)
    // NOTE: This requires the element to be rendered. We might not have access here.
    // For simplicity, let's assume width/height are present in style for grouping.
    // If not, default to a small size or handle it differently.
    const width = parseFloat(component.style.width || 100); // Default width if not set
    const height = parseFloat(component.style.height || 50); // Default height if not set
    // TODO: Consider rotation when calculating bounding box (more complex)

    minX = Math.min(minX, left);
    minY = Math.min(minY, top);
    maxX = Math.max(maxX, left + width);
    maxY = Math.max(maxY, top + height);
  });

  return {
    left: minX,
    top: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
};

// 在现有代码中添加一个确保尺寸和位置为整数的工具函数
const ensureIntegerDimensions = (style) => {
  // 需要处理的属性列表
  const dimensionProps = ['width', 'height'];
  const positionProps = ['left', 'top'];

  // 创建新的样式对象
  const newStyle = { ...style };

  // 处理宽度和高度，始终四舍五入为整数
  dimensionProps.forEach((prop) => {
    if (newStyle[prop] !== undefined) {
      // 提取数值部分
      const value = parseFloat(newStyle[prop]);
      if (!isNaN(value)) {
        // 四舍五入为整数
        const roundedValue = Math.round(value);
        // 保留原始单位（如px）
        const unit = String(newStyle[prop]).replace(/^[0-9.-]+/, '') || 'px';
        newStyle[prop] = `${roundedValue}${unit}`;
      }
    }
  });

  // 处理位置，需要考虑保持中心点不变
  // 由于宽度和高度的变化可能影响中心点，这里需要相应调整位置
  if (
    (newStyle.width !== style.width || newStyle.height !== style.height) &&
    (newStyle.left !== undefined || newStyle.top !== undefined)
  ) {
    // 宽度差异
    const widthDiff = parseFloat(newStyle.width) - parseFloat(style.width);
    // 高度差异
    const heightDiff = parseFloat(newStyle.height) - parseFloat(style.height);

    // 调整left位置，使中心点X坐标保持不变
    if (newStyle.left !== undefined && widthDiff !== 0) {
      const left = parseFloat(newStyle.left);
      if (!isNaN(left)) {
        // 为了保持中心点不变，需要减去宽度变化的一半
        const adjustedLeft = left - widthDiff / 2;
        const unit = String(newStyle.left).replace(/^[0-9.-]+/, '') || 'px';
        newStyle.left = `${adjustedLeft}${unit}`;
      }
    }

    // 调整top位置，使中心点Y坐标保持不变
    if (newStyle.top !== undefined && heightDiff !== 0) {
      const top = parseFloat(newStyle.top);
      if (!isNaN(top)) {
        // 为了保持中心点不变，需要减去高度变化的一半
        const adjustedTop = top - heightDiff / 2;
        const unit = String(newStyle.top).replace(/^[0-9.-]+/, '') || 'px';
        newStyle.top = `${adjustedTop}${unit}`;
      }
    }
  }

  return newStyle;
};

// Helper to add 'px' unit if value is a number
const addPxUnitIfNeeded = (value) => {
  if (value !== undefined && typeof value === 'number') {
    return `${value}px`;
  } // If it's already a string (e.g., '50%', '10px') or undefined, return as is
  return value;
};

export const useCanvasStore = defineStore('canvas', () => {
  // --- State ---
  const components = ref([]);
  const selectedComponentIds = ref([]);
  const primarySelectedComponent = ref(null);
  const history = ref([]);
  const historyIndex = ref(-1);
  const maxHistory = 10;
  const currentCanvasMeta = ref(null);
  const myCanvasesList = ref([]);
  const loading = ref(false);
  const error = ref(null);

  // --- Getters ---
  const canUndo = computed(() => historyIndex.value > 0);
  const canRedo = computed(() => historyIndex.value < history.value.length - 1);

  // Fetch the list of canvases for the current user
  const fetchMyCanvases = async () => {
    loading.value = true;
    error.value = null;
    try {
      // Assuming canvasService.getMyCanvases() returns the array directly or response.data is the array
      const response = await canvasService.getMyCanvases();
      // Adjust based on actual API response structure. If it returns {data: [...]}, use response.data
      const canvases = Array.isArray(response) ? response : response?.data || [];

      if (Array.isArray(canvases)) {
        myCanvasesList.value = canvases;
      } else {
        console.warn('API getMyCanvases did not return a valid array:', canvases);
        myCanvasesList.value = [];
      }
      return myCanvasesList.value; // Return the fetched list
    } catch (err) {
      console.error('获取画布列表失败:', err);
      error.value = err.response?.data?.message || '获取画布列表失败';
      myCanvasesList.value = []; // Clear list on error
      throw err; // Re-throw for component handling
    } finally {
      loading.value = false;
    }
  };

  // Fetch and set canvas data
  const fetchCanvas = async (id) => {
    loading.value = true;
    error.value = null;
    try {
      const response = await canvasService.getCanvas(id);
      if (response && response.data) {
        const canvasData = response.data;

        // --- More Lenient Validation ---
        // Only check if the main data and content object exist.
        if (!canvasData.content) {
          console.error('Loaded data structure is invalid (missing content object):', canvasData);
          // Keep throwing error if content itself is missing, as that's fundamental
          throw new Error('Invalid canvas data structure received from server (missing content).');
        }
        // --- Validation End ---

        // *** Update state CORRECTLY, handling potentially empty/missing components AND canvas metadata ***

        // Get components, default to empty array
        const newComponents = canvasData.content.components || [];
        components.value = JSON.parse(JSON.stringify(newComponents));

        // Get canvas metadata, provide defaults if missing
        const canvasMetadata = canvasData.content.canvas || {
          width: 1200, // Default width
          height: 800, // Default height
          scale: 1, // Default scale
        };

        selectedComponentIds.value = []; // RESET selection IDs
        primarySelectedComponent.value = null; // RESET primary selection

        // Store metadata (Get ID and Title from top level)
        currentCanvasMeta.value = {
          id: canvasData.id,
          title: canvasData.title,
          // Add other relevant metadata fields if needed
        };

        // Reset history using the *newly updated* components.value
        history.value = [JSON.parse(JSON.stringify(components.value))];
        historyIndex.value = 0;

        // --- Return the canvas metadata object (potentially with defaults) ---
        return canvasMetadata; // Return the determined canvas metadata
        // ---------------------------------------------------------------------
      } else {
        // Handle invalid API response structure (missing data)
        console.error('Invalid API response structure (missing data): ', response);
        throw new Error('Invalid API response structure');
      }
    } catch (err) {
      // Handle fetch error
      console.error('获取画布详情失败:', err);
      // Clear state on error
      components.value = [];
      selectedComponentIds.value = [];
      primarySelectedComponent.value = null;
      currentCanvasMeta.value = null;
      history.value = [];
      historyIndex.value = -1;
      error.value = err.response?.data?.message || err.message || '获取画布详情失败';
      throw err; // Re-throw error for component handling
    } finally {
      loading.value = false;
    }
  };

  // ... other actions like addComponent, selectComponent, commitCanvasChange, etc. ...
  // Ensure these actions correctly modify components.value and selectedComponentIds.value

  const selectComponent = (id, multiSelect = false) => {
    if (id === null) {
      // Clearing selection
      selectedComponentIds.value = [];
      primarySelectedComponent.value = null;
      return;
    }

    const index = selectedComponentIds.value.indexOf(id);

    if (multiSelect) {
      if (index === -1) {
        // Add to selection if not already present
        selectedComponentIds.value.push(id);
        primarySelectedComponent.value = components.value.find((c) => c.id === id) || null; // Set primary
      } else {
        // Remove from selection if already present (toggle)
        selectedComponentIds.value.splice(index, 1);
        // If the removed was primary, select the last one as primary, or null
        primarySelectedComponent.value =
          selectedComponentIds.value.length > 0
            ? components.value.find(
                (c) => c.id === selectedComponentIds.value[selectedComponentIds.value.length - 1]
              ) || null
            : null;
      }
    } else {
      // Single select: set selection to only this id
      selectedComponentIds.value = [id];
      primarySelectedComponent.value = components.value.find((c) => c.id === id) || null;
    }
  };

  const clearSelection = () => {
    selectedComponentIds.value = [];
    primarySelectedComponent.value = null;
  };

  const addComponent = ({ component, initialPosition }) => {
    const newId = uuidv4();

    // Ensure common numeric styles have 'px' units if they are numbers
    const baseStyle = component.style || {};
    const styleWithUnits = { ...baseStyle }; // Start with a copy

    // Apply unit helper to common properties
    styleWithUnits.width = addPxUnitIfNeeded(baseStyle.width);
    styleWithUnits.height = addPxUnitIfNeeded(baseStyle.height);
    styleWithUnits.borderWidth = addPxUnitIfNeeded(baseStyle.borderWidth);
    styleWithUnits.borderRadius = addPxUnitIfNeeded(baseStyle.borderRadius);
    styleWithUnits.fontSize = addPxUnitIfNeeded(baseStyle.fontSize);
    styleWithUnits.letterSpacing = addPxUnitIfNeeded(baseStyle.letterSpacing);
    // Add more properties here if needed, e.g., padding, margin

    const newComponent = {
      ...JSON.parse(JSON.stringify(component)), // Deep copy base component
      id: newId,
      style: {
        ...styleWithUnits, // Use the style with units applied
        left: `${Math.round(initialPosition.left)}px`, // Set initial position
        top: `${Math.round(initialPosition.top)}px`,
        zIndex: components.value.length + 1, // Basic z-index assignment
      },
    };

    const newState = [...components.value, newComponent];
    commitCanvasChange(newState); // Update state via history commit

    // Select the newly added component
    selectComponent(newId, false);

    return newComponent; // Return the created component instance
  };

  // Internal commit function (simplified example)
  const commitCanvasChange = (newState) => {
    if (historyIndex.value < history.value.length - 1) {
      history.value.splice(historyIndex.value + 1);
    }
    history.value.push(newState);
    if (history.value.length > maxHistory) {
      history.value.shift();
    }
    historyIndex.value = history.value.length - 1;
    console.log(
      `[CanvasStore] History committed, index: ${historyIndex.value} size: ${history.value.length}`
    );

    const oldPrimarySelectedRef = primarySelectedComponent.value; // Store old reference for comparison

    components.value = newState;

    if (selectedComponentIds.value.length === 1) {
      const newPrimary = newState.find((c) => c.id === selectedComponentIds.value[0]);
      console.log(
        '[CanvasStore] Updating single primary selected. Found in newState:',
        newPrimary ? { id: newPrimary.id, style: newPrimary.style } : null
      );
      primarySelectedComponent.value = newPrimary ? JSON.parse(JSON.stringify(newPrimary)) : null;
      console.log(
        '[CanvasStore] primarySelectedComponent AFTER update (single select):',
        primarySelectedComponent.value
          ? { id: primarySelectedComponent.value.id, style: primarySelectedComponent.value.style }
          : null
      );
    } else if (selectedComponentIds.value.length === 0) {
      console.log('[CanvasStore] Clearing primary selected (no selection).');
      primarySelectedComponent.value = null;
    } else if (selectedComponentIds.value.length > 1 && primarySelectedComponent.value) {
      const currentPrimaryId = primarySelectedComponent.value.id;
      if (selectedComponentIds.value.includes(currentPrimaryId)) {
        const newPrimaryInMulti = newState.find((c) => c.id === currentPrimaryId);
        console.log(
          '[CanvasStore] Updating primary in multi-selection. Found in newState:',
          newPrimaryInMulti ? { id: newPrimaryInMulti.id, style: newPrimaryInMulti.style } : null
        );
        primarySelectedComponent.value = newPrimaryInMulti
          ? JSON.parse(JSON.stringify(newPrimaryInMulti))
          : null;
        console.log(
          '[CanvasStore] primarySelectedComponent AFTER update (multi-select):',
          primarySelectedComponent.value
            ? { id: primarySelectedComponent.value.id, style: primarySelectedComponent.value.style }
            : null
        );
      } else {
        console.log(
          '[CanvasStore] Primary in multi-select not found or ID mismatch. Attempting fallback.'
        );
        const firstSelectedId = selectedComponentIds.value[0];
        const newPrimaryCandidate = newState.find((c) => c.id === firstSelectedId);
        primarySelectedComponent.value = newPrimaryCandidate
          ? JSON.parse(JSON.stringify(newPrimaryCandidate))
          : null;
      }
    }
    // Log if the reference actually changed
    if (primarySelectedComponent.value !== oldPrimarySelectedRef) {
      console.log('[CanvasStore] primarySelectedComponent reference CHANGED.');
    } else {
      console.log('[CanvasStore] primarySelectedComponent reference DID NOT CHANGE.');
    }
  };

  const setCanvasComponents = (newComponents) => {
    if (!Array.isArray(newComponents)) {
      console.error('setCanvasComponents requires an array.');
      return;
    }
    // Directly set components, potentially bypass history or start new history
    const cleanState = JSON.parse(JSON.stringify(newComponents));
    components.value = cleanState;
    selectedComponentIds.value = []; // Reset selection
    primarySelectedComponent.value = null;
    // Reset history when loading entirely new state
    history.value = [JSON.parse(JSON.stringify(components.value))];
    historyIndex.value = 0;
    console.log('Canvas components set directly.');
  };

  const clearCanvas = () => {
    const emptyState = [];
    commitCanvasChange(emptyState); // Commit empty state to history
    // Selection is cleared implicitly by commit or should be cleared here if commit doesn't handle it
    clearSelection();
    console.log('Canvas cleared via commit.');
  };

  const deleteSelectedComponents = () => {
    if (selectedComponentIds.value.length === 0) return;
    const idsToDelete = new Set(selectedComponentIds.value);
    const newState = components.value.filter((c) => !idsToDelete.has(c.id));
    commitCanvasChange(newState);
    clearSelection(); // Clear selection after deletion
  };

  const updateComponentStyle = (id, styleChanges) => {
    const index = components.value.findIndex((c) => c.id === id);
    if (index !== -1) {
      const newState = JSON.parse(JSON.stringify(components.value));
      newState[index].style = { ...newState[index].style, ...styleChanges };
      commitCanvasChange(newState);
    }
  };

  const updateComponentProps = (id, propsChanges) => {
    const index = components.value.findIndex((c) => c.id === id);
    if (index !== -1) {
      const newState = JSON.parse(JSON.stringify(components.value));
      newState[index].props = { ...newState[index].props, ...propsChanges };
      commitCanvasChange(newState);
    }
  };

  const updateMultipleComponentStyles = (updates) => {
    if (!Array.isArray(updates)) return;
    const newState = JSON.parse(JSON.stringify(components.value));
    let changed = false;
    updates.forEach((update) => {
      const index = newState.findIndex((c) => c.id === update.id);
      if (index !== -1 && update.styleChanges) {
        newState[index].style = { ...newState[index].style, ...update.styleChanges };
        changed = true;
      }
    });
    if (changed) {
      commitCanvasChange(newState);
    }
  };

  const groupSelectedComponents = () => {
    if (selectedComponentIds.value.length < 2) return;

    const groupChildren = [];
    const idsToGroup = new Set(selectedComponentIds.value);
    const newState = components.value.filter((c) => !idsToGroup.has(c.id));

    const selectedComponents = components.value.filter((c) => idsToGroup.has(c.id));
    if (selectedComponents.length === 0) return; // Should not happen if length >= 2

    const groupBounds = getBoundingBox(selectedComponents); // Use helper

    selectedComponents.forEach((child) => {
      // Make child position relative to group top-left
      const relativeLeft = parseFloat(child.style.left) - groupBounds.left;
      const relativeTop = parseFloat(child.style.top) - groupBounds.top;
      groupChildren.push({
        ...child,
        style: {
          ...child.style,
          left: `${relativeLeft}px`,
          top: `${relativeTop}px`,
        },
      });
    });

    const groupId = uuidv4();
    const groupComponent = {
      id: groupId,
      key: 'group',
      label: '组合',
      style: {
        left: `${groupBounds.left}px`,
        top: `${groupBounds.top}px`,
        width: `${groupBounds.width}px`,
        height: `${groupBounds.height}px`,
        zIndex: components.value.length + 1,
        // Group itself doesn't usually have background/border unless designed for it
        // backgroundColor: 'rgba(0, 100, 255, 0.1)', // Optional: visual aid
        // border: '1px dashed #06f',             // Optional: visual aid
      },
      props: {},
      children: groupChildren,
    };

    newState.push(groupComponent);
    commitCanvasChange(newState);
    selectComponent(groupId, false); // Select the newly formed group
  };

  const ungroupSelectedComponent = () => {
    if (selectedComponentIds.value.length !== 1) return;
    const groupId = selectedComponentIds.value[0];
    const groupIndex = components.value.findIndex((c) => c.id === groupId && c.key === 'group');
    if (groupIndex === -1) return;

    const groupComponent = components.value[groupIndex];
    if (!groupComponent.children || groupComponent.children.length === 0) return;

    const groupLeft = parseFloat(groupComponent.style.left);
    const groupTop = parseFloat(groupComponent.style.top);

    const extractedChildren = groupComponent.children.map((child) => {
      // Make child position absolute again
      const absoluteLeft = groupLeft + parseFloat(child.style.left);
      const absoluteTop = groupTop + parseFloat(child.style.top);
      return {
        ...child,
        style: {
          ...child.style,
          left: `${absoluteLeft}px`,
          top: `${absoluteTop}px`,
          // Assign a new zIndex, maybe based on original order or max current + N
          zIndex: components.value.length - 1 + (groupComponent.children.indexOf(child) + 1),
        },
      };
    });

    const newState = components.value.filter((c) => c.id !== groupId); // Remove group
    newState.push(...extractedChildren); // Add children back

    commitCanvasChange(newState);

    // Select all the extracted children
    const childrenIds = extractedChildren.map((c) => c.id);
    selectComponent(null, false); // Clear first
    childrenIds.forEach((id) => selectComponent(id, true)); // Multi-select children
  };

  // Basic Undo/Redo (replace with your actual logic if different)
  const undo = () => {
    if (canUndo.value) {
      historyIndex.value--;
      const prevState = JSON.parse(JSON.stringify(history.value[historyIndex.value]));
      components.value = prevState;
      clearSelection(); // Clear selection on undo
      console.log('Undo performed, index:', historyIndex.value);
    }
  };

  const redo = () => {
    if (canRedo.value) {
      historyIndex.value++;
      const nextState = JSON.parse(JSON.stringify(history.value[historyIndex.value]));
      components.value = nextState;
      clearSelection(); // Clear selection on redo
      console.log('Redo performed, index:', historyIndex.value);
    }
  };

  // ADD MISSING ACTIONS HERE (createCanvas, updateCanvas, deleteCanvas, addCollaborator)
  const createCanvas = async (canvasData) => {
    loading.value = true;
    error.value = null;
    try {
      // Assume service returns the created canvas object directly or in response.data
      const response = await canvasService.createCanvas(canvasData);
      const newCanvas = response?.data || response; // Adjust based on actual API response
      if (newCanvas) {
        // Optionally add to local list if needed, or rely on fetchMyCanvases refresh
        // myCanvasesList.value.push(newCanvas);
      }
      return newCanvas; // Return the newly created canvas object
    } catch (err) {
      console.error('创建画布失败:', err);
      error.value = err.response?.data?.message || '创建画布失败';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const updateCanvas = async (canvasId, data) => {
    loading.value = true;
    error.value = null;
    try {
      // Pass the full data object received from the component to the service
      const response = await canvasService.updateCanvas(canvasId, data);
      const updatedCanvas = response?.data || response; // Assuming service returns { data: ... } or just data

      // --- Optional: Update local state based on response if needed ---
      // Example: Update title in the list if it was changed
      if (updatedCanvas) {
        // Update currentCanvasMeta if it matches
        if (currentCanvasMeta.value?.id === canvasId) {
          currentCanvasMeta.value.title =
            updatedCanvas.canvas?.title || updatedCanvas.title || currentCanvasMeta.value.title;
          // Update other meta if returned
        }
        // Update the list if the canvas is present
        const index = myCanvasesList.value.findIndex((c) => c.id === canvasId);
        if (index !== -1) {
          // Merge update, prioritize title from updatedCanvas if available
          const listTitle =
            updatedCanvas.canvas?.title || updatedCanvas.title || myCanvasesList.value[index].title;
          myCanvasesList.value[index] = {
            ...myCanvasesList.value[index],
            ...updatedCanvas,
            title: listTitle,
          };
        }
      }
      // ---------------------------------------------------------------

      return updatedCanvas; // Return the response data
    } catch (err) {
      console.error('更新画布失败:', err);
      error.value = err.response?.data?.message || '更新画布失败';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const deleteCanvas = async (canvasId) => {
    loading.value = true;
    error.value = null;
    try {
      // 修复：确保调用 service 时使用正确的 id 参数名
      await canvasService.deleteCanvas(canvasId);
      // Remove from the list
      myCanvasesList.value = myCanvasesList.value.filter((c) => c.id !== canvasId); // Use canvasId
      // Clear current canvas if it was the one deleted
      if (currentCanvasMeta.value?.id === canvasId) {
        // Use canvasId
        currentCanvasMeta.value = null;
        // Also clear components, selection, history etc. for the editor state
        components.value = [];
        selectedComponentIds.value = [];
        primarySelectedComponent.value = null;
        history.value = [];
        historyIndex.value = -1;
      }
    } catch (err) {
      console.error('删除画布失败:', err);
      error.value = err.response?.data?.message || '删除画布失败';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const addCollaborator = async (canvasId, collaboratorData) => {
    loading.value = true;
    error.value = null;
    try {
      // 修复：确保调用 service 时使用正确的 id 参数名
      const response = await canvasService.addCollaborator(canvasId, collaboratorData);
      const updatedCanvas = response?.data || response;

      // Update the list if the canvas is present
      const index = myCanvasesList.value.findIndex((c) => c.id === canvasId); // Use canvasId
      if (index !== -1 && updatedCanvas) {
        myCanvasesList.value[index] = { ...myCanvasesList.value[index], ...updatedCanvas };
      }
      // Update current meta if applicable
      if (currentCanvasMeta.value?.id === canvasId && updatedCanvas) {
        // Use canvasId
        currentCanvasMeta.value = {
          ...currentCanvasMeta.value,
          collaborators: updatedCanvas.collaborators,
        };
      }

      return updatedCanvas;
    } catch (err) {
      console.error('添加协作者失败:', err);
      error.value = err.response?.data?.message || '添加协作者失败';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const deleteComponentById = (id) => {
    const newState = components.value.filter((c) => c.id !== id);
    commitCanvasChange(newState);
    // 如果删除的组件是被选中的，清除选择
    if (selectedComponentIds.value.includes(id)) {
      clearSelection();
    }
  };

  return {
    components,
    selectedComponentIds,
    primarySelectedComponent,
    currentCanvasMeta,
    myCanvasesList,
    loading,
    error,
    canUndo,
    canRedo,
    fetchMyCanvases,
    fetchCanvas,
    addComponent,
    selectComponent,
    clearSelection,
    deleteSelectedComponents,
    updateComponentStyle,
    updateComponentProps,
    updateMultipleComponentStyles,
    groupSelectedComponents,
    ungroupSelectedComponent,
    deleteComponentById,
    commitCanvasChange,
    setCanvasComponents,
    clearCanvas,
    undo,
    redo,
    createCanvas,
    updateCanvas,
    deleteCanvas,
    addCollaborator,
  };
});
