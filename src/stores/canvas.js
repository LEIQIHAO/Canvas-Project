import { defineStore } from 'pinia';
import { ref, computed, watch, nextTick } from 'vue';
import { v4 as uuidv4 } from 'uuid'; // 用于生成唯一 ID
import { multiply, divide } from 'mathjs'; // 导入 mathjs

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

export const useCanvasStore = defineStore(
  'canvas',
  () => {
    // State: 画布上的组件数组
    const components = ref([]);
    // State: 当前选中的组件 ID
    const selectedComponentIds = ref([]);
    // State: 画布样式数据 (移除 scale，如果不再需要)
    const canvasStyleData = ref({
      width: 1200, // 示例默认值
      height: 740,
      scale: 100, // 默认缩放 100%
      backgroundColor: '#fff', // 示例
      // ... 其他画布样式可能需要添加
    });

    // History State: Store snapshots of components as JSON strings
    const historyStates = ref([JSON.stringify([])]);
    const historyIndex = ref(0);
    const maxHistory = 50; // Limit history size
    let internalUpdate = false; // Flag to prevent feedback loop in watcher

    let nextZIndex = ref(1); // Track the next zIndex to assign

    // Getters:
    const currentComponents = computed(() => {
      try {
        return JSON.parse(historyStates.value[historyIndex.value] || '[]');
      } catch (e) {
        console.error('Failed to parse history state:', e);
        return [];
      }
    });

    const primarySelectedComponent = computed(() => {
      if (selectedComponentIds.value.length === 1) {
        const id = selectedComponentIds.value[0];
        return currentComponents.value.find((c) => c.id === id) || null;
      }
      return null; // Return null if zero or multiple are selected
    });

    const canUndo = computed(() => historyIndex.value > 0);
    const canRedo = computed(() => historyIndex.value < historyStates.value.length - 1);

    // --- 恢复内部辅助函数：根据比例调整样式尺寸 ---
    const needToScaleAttrs = [
      'width',
      'height',
      'fontSize',
      'padding',
      'borderWidth',
      'borderRadius' /* 可选 */,
    ]; // 定义需要缩放的属性

    const applyScaleToComponentStyle = (style, scale) => {
      const result = {};
      const scaleFactor = divide(parseFloat(scale || 100), 100); // 计算缩放因子

      Object.keys(style).forEach((key) => {
        const value = style[key];
        if (needToScaleAttrs.includes(key)) {
          // 检查值是否是数字或可以转换为数字的字符串（如 "10px"）
          const numericValue = parseFloat(value);
          if (!isNaN(numericValue) && value !== '') {
            // 确保是有效数字且非空
            // 提取单位（px, %, etc.），如果存在
            const unit = typeof value === 'string' ? value.replace(/^[0-9.-]+/, '') : '';
            // 应用缩放
            const scaledValue = multiply(numericValue, scaleFactor);
            // 重新附加单位
            result[key] = `${scaledValue}${unit}`;
            // console.log(`Scaling ${key}: ${value} -> ${result[key]} with scale ${scale}%`);
          } else {
            // 如果不是有效数字或为空，则保留原值
            result[key] = value;
          }
        } else {
          // 不需要缩放的属性，直接复制
          result[key] = value;
        }
      });
      return result;
    };
    // --- 结束：恢复内部辅助函数 ---

    // Private History Recorder:
    const recordHistory = () => {
      if (internalUpdate) {
        console.log('跳过历史记录 - 内部更新标志已设置');
        return; // Don't record history triggered by undo/redo itself
      }

      // Create a deep copy (JSON stringify/parse is simple way for this structure)
      const currentState = JSON.stringify(components.value);

      // 不要重复记录相同的状态
      if (
        historyStates.value.length > 0 &&
        historyStates.value[historyStates.value.length - 1] === currentState
      ) {
        console.log('跳过历史记录 - 状态未变化');
        return;
      }

      // If we undo and then make a change, discard the future history
      if (historyIndex.value < historyStates.value.length - 1) {
        historyStates.value = historyStates.value.slice(0, historyIndex.value + 1);
        console.log('丢弃未来历史记录，当前索引:', historyIndex.value);
      }

      // Add new state
      historyStates.value.push(currentState);
      console.log('添加新状态到历史记录 - 状态总数:', historyStates.value.length);

      // Limit history size
      if (historyStates.value.length > maxHistory) {
        historyStates.value.shift(); // Remove the oldest state
        console.log('移除最早的历史记录以限制大小');
      } else {
        historyIndex.value++; // Only increment index if not removing from start
      }

      // Ensure index points to the latest state after push/shift
      historyIndex.value = historyStates.value.length - 1;

      console.log(
        'History recorded. Index:',
        historyIndex.value,
        'Length:',
        historyStates.value.length,
        'Components count:',
        components.value.length
      );
    };

    // Watch the components ref for changes and record history automatically
    // We need to be careful with deep watching complex objects for performance
    // Using JSON.stringify might be a pragmatic way to detect actual changes
    let lastRecordedState = historyStates.value[0];
    watch(
      components,
      (newValue) => {
        const newStateString = JSON.stringify(newValue);
        // Only record if the state string has actually changed
        // and it wasn't an internal update (like from undo/redo)
        if (!internalUpdate && newStateString !== lastRecordedState) {
          console.log('Change detected, recording history...');
          recordHistory();
          lastRecordedState = newStateString;
        }
      },
      { deep: true }
    );

    // Helper to update components and ensure history watcher picks it up
    const updateComponents = (newComponentsArray) => {
      console.log('Action: updateComponents - 组件数量:', newComponentsArray.length);

      // 开始内部更新标志，防止watch触发额外的历史记录
      internalUpdate = true;

      // 通过深拷贝确保新状态与旧状态完全分离，防止引用问题
      const deepCopiedComponents = JSON.parse(JSON.stringify(newComponentsArray));

      // 更新组件数组
      components.value = deepCopiedComponents;

      // 更新最后记录的状态，确保历史比较正确
      lastRecordedState = JSON.stringify(deepCopiedComponents);

      // 延迟记录历史记录
      nextTick(() => {
        // 记录历史状态
        recordHistory();

        // 恢复内部更新标志
        internalUpdate = false;

        console.log('组件状态已更新，历史记录已保存');
      });
    };

    // 通用辅助函数：深度合并对象
    const deepMergeProps = (target, source) => {
      Object.keys(source).forEach((key) => {
        if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
          if (!target[key] || typeof target[key] !== 'object') {
            target[key] = {};
          }
          deepMergeProps(target[key], source[key]);
        } else {
          target[key] = source[key];
        }
      });
      return target;
    };

    // 深度合并样式
    const deepMergeStyle = (target, source) => {
      Object.keys(source).forEach((key) => {
        const sourceValue = source[key];
        const targetValue = target[key];

        // 如果源值是对象，则递归合并
        if (sourceValue && typeof sourceValue === 'object' && !Array.isArray(sourceValue)) {
          if (!targetValue || typeof targetValue !== 'object') {
            target[key] = {};
          }
          deepMergeStyle(target[key], sourceValue);
        } else {
          // 简单值直接赋值
          target[key] = sourceValue;
        }
      });
      return target;
    };

    // Actions:
    const addComponent = ({ component, initialPosition }) => {
      console.log('Action: addComponent 接收到组件:', JSON.parse(JSON.stringify(component)));
      console.log('传入的 initialPosition:', initialPosition);
      const current = components.value;
      const currentScale = canvasStyleData.value.scale; // 获取当前 scale
      const newZIndex = nextZIndex.value++;

      // 初始化基础组件结构
      const newComponent = {
        id: uuidv4(),
        key: component.key,
        label: component.label || component.key,
        style: {
          position: 'absolute',
          zIndex: newZIndex,
          transform: 'rotate(0deg)',
          opacity: 1,
          // 使用传入的 initialPosition 设置初始 left/top
          left: `${initialPosition?.left ?? 0}px`,
          top: `${initialPosition?.top ?? 0}px`,
          color: '#000000',
          fontSize: '14px', // 基础默认值
          fontWeight: 400,
          lineHeight: '',
          letterSpacing: 0,
          textAlign: 'center',
          verticalAlign: 'middle',
        },
        props: JSON.parse(JSON.stringify(component.props || {})), // 深拷贝传入的 props
      };
      console.log(
        '1. 初始化后的 newComponent.style:',
        JSON.parse(JSON.stringify(newComponent.style))
      );

      // 合并样式：优先使用传入组件的特定样式覆盖默认样式
      if (component.style) {
        console.log(
          '2. 准备合并的 component.style (来自物料):',
          JSON.parse(JSON.stringify(component.style))
        );
        deepMergeStyle(newComponent.style, component.style);
        console.log(
          '3. deepMergeStyle 合并后的 newComponent.style:',
          JSON.parse(JSON.stringify(newComponent.style))
        );
      }

      // *** 新增：确保合并后的 width/height 有 'px' 单位 ***
      if (
        newComponent.style.width !== undefined &&
        !String(newComponent.style.width).endsWith('px') &&
        !String(newComponent.style.width).endsWith('%')
      ) {
        console.log(
          `为 width 添加 'px': ${newComponent.style.width} -> ${newComponent.style.width}px`
        );
        newComponent.style.width = `${parseFloat(newComponent.style.width)}px`;
      }
      if (
        newComponent.style.height !== undefined &&
        newComponent.style.height !== 'auto' &&
        !String(newComponent.style.height).endsWith('px') &&
        !String(newComponent.style.height).endsWith('%')
      ) {
        console.log(
          `为 height 添加 'px': ${newComponent.style.height} -> ${newComponent.style.height}px`
        );
        newComponent.style.height = `${parseFloat(newComponent.style.height)}px`;
      }
      console.log(
        '3b. 确保单位后的 newComponent.style:',
        JSON.parse(JSON.stringify(newComponent.style))
      );
      // *** 结束：确保单位 ***

      // 根据类型设置特定默认属性
      // 这里只需要对特殊组件做处理
      switch (component.key) {
        case 'VText':
          // 文本组件的默认值
          newComponent.style.fontSize = newComponent.style.fontSize || '14px';
          newComponent.style.color = newComponent.style.color || '#333333';
          if (!newComponent.props.content) {
            newComponent.props.content = '请输入文本内容';
          }
          break;
        case 'VButton':
          // 按钮组件的默认值
          if (!newComponent.props.text) {
            newComponent.props.text = '按钮';
          }
          break;
        case 'Picture':
          // 图片组件的默认值
          if (!newComponent.props.url) {
            newComponent.props.url = 'https://via.placeholder.com/200x150';
          }
          break;
        case 'RectShape':
        case 'CircleShape':
          // 形状的默认值
          newComponent.style.backgroundColor = newComponent.style.backgroundColor || 'transparent';
          newComponent.style.borderColor = newComponent.style.borderColor || '#333333';
          newComponent.style.borderWidth = newComponent.style.borderWidth || '1px';
          break;
        case 'SVGStar':
        case 'SVGTriangle':
          // SVG 的默认值
          if (!newComponent.style.backgroundColor) {
            newComponent.style.backgroundColor = 'transparent';
          }
          newComponent.style.borderColor = newComponent.style.borderColor || '#333333';
          newComponent.style.borderWidth = newComponent.style.borderWidth || '1px';
          break;
        case 'LineShape':
          // 直线的默认值
          newComponent.style.backgroundColor = newComponent.style.backgroundColor || '#333333';
          break;
        case 'group':
          // 组合组件 - 包含子组件
          if (component.children) {
            // 如果传入的组合组件有子组件，复制它们
            newComponent.children = JSON.parse(JSON.stringify(component.children));
          } else {
            // 空组合组件
            newComponent.children = [];
          }
          break;
        // 其他组件类型的默认处理
        default:
          // 不需要特殊处理的组件使用通用默认值
          break;
      }

      // 确保所有组件都有合适的宽高
      // **注意：这里的逻辑只在合并后的 style 中 *没有* width/height 时才执行**
      if (!newComponent.style.width) {
        console.log('4a. newComponent.style 中没有 width，设置默认值...');
        // 对不同组件有不同的默认宽度
        if (component.key === 'VText') {
          newComponent.style.width = '200px';
        } else if (component.key === 'VButton') {
          newComponent.style.width = '100px';
        } else if (component.key === 'Picture') {
          newComponent.style.width = '200px';
        } else if (component.key === 'LineShape') {
          newComponent.style.width = '100px';
        } else {
          // 通用宽度
          newComponent.style.width = '100px';
        }
      }

      if (!newComponent.style.height) {
        console.log('4b. newComponent.style 中没有 height，设置默认值...');
        // 对不同组件有不同的默认高度
        if (component.key === 'VText') {
          newComponent.style.height = 'auto'; // 文本可以自适应高度
        } else if (component.key === 'VButton') {
          newComponent.style.height = '40px';
        } else if (component.key === 'Picture') {
          newComponent.style.height = '150px';
        } else if (component.key === 'LineShape') {
          newComponent.style.height = '2px'; // 线条高度很小
        } else {
          // 通用高度
          newComponent.style.height = '100px';
        }
      }

      // 添加组件到画布
      console.log(
        '5. 最终添加到画布的 newComponent.style:',
        JSON.parse(JSON.stringify(newComponent.style))
      );
      console.log('将组件添加到画布 (完整对象):', JSON.parse(JSON.stringify(newComponent)));
      components.value = [...current, newComponent];

      // 选中新添加的组件
      selectComponent(newComponent.id, false); // 单选此组件
      console.log('选中新添加的组件:', newComponent.id);

      // 隐式记录历史 - 通过 watch 组件变化触发
      return newComponent; // 返回新组件以便调用者使用
    };

    const selectComponent = (id, multiSelect = false) => {
      console.log('Action: selectComponent', { id, multiSelect });

      // 如果id为null，清除所有选择
      if (id === null) {
        selectedComponentIds.value = [];
        return;
      }

      if (multiSelect) {
        const index = selectedComponentIds.value.indexOf(id);
        if (index > -1) {
          // Already selected, remove it
          selectedComponentIds.value.splice(index, 1);
        } else {
          // Not selected, add it
          selectedComponentIds.value.push(id);
        }
      } else {
        // Single select: replace selection with this ID
        selectedComponentIds.value = [id];
      }
    };

    const clearSelection = () => {
      console.log('Action: clearSelection');
      selectedComponentIds.value = [];
    };

    const updateComponentProps = (id, newProps) => {
      console.log('Action: updateComponentProps for', id, newProps);
      const current = currentComponents.value;
      const componentIndex = current.findIndex((c) => c.id === id);

      if (componentIndex === -1) {
        console.warn(`尝试更新不存在的组件ID: ${id}`);
        return;
      }

      // 创建组件的副本
      const component = { ...current[componentIndex] };

      // 确保组件有props属性
      if (!component.props) {
        component.props = {};
      }

      // 应用深度合并
      const mergedProps = deepMergeProps({ ...component.props }, newProps);

      // 更新组件
      const newState = [...current];
      newState[componentIndex] = { ...component, props: mergedProps };
      console.log('更新后的组件props:', mergedProps);
      updateComponents(newState);
    };

    const updateComponentStyle = (id, newStyle) => {
      console.log('Action: updateComponentStyle for', id, newStyle);
      const current = components.value;
      const componentIndex = current.findIndex((c) => c.id === id);

      if (componentIndex === -1) {
        console.warn(`尝试更新不存在的组件ID: ${id}`);
        return;
      }

      // 创建组件的副本
      const component = { ...current[componentIndex] };

      // 确保组件有style属性
      if (!component.style) {
        component.style = {};
      }

      // 应用深度合并
      const mergedStyle = deepMergeStyle({ ...component.style }, newStyle);

      // 更新组件状态数组
      const newState = [...current];
      // 使用包含合并后样式的新组件对象替换旧对象
      newState[componentIndex] = { ...component, style: mergedStyle };

      console.log('更新后的组件style:', JSON.parse(JSON.stringify(mergedStyle))); // Log merged style

      // 调用内部函数来更新 components.value 并处理历史记录
      updateComponents(newState);
    };

    // Action to update styles for MULTIPLE components (e.g., after multi-drag)
    const updateMultipleComponentStyles = (updates) => {
      console.log('Action: updateMultipleComponentStyles', updates);
      if (!updates || !Array.isArray(updates) || updates.length === 0) {
        console.warn('无效的更新数据，更新被跳过');
        return;
      }

      const current = [...components.value]; // 使用components.value而不是currentComponents.value
      const updatedComponents = new Map();

      // 处理每个需要更新的组件
      updates.forEach((update) => {
        const { id, styleChanges } = update;
        const componentIndex = current.findIndex((c) => c.id === id);

        if (componentIndex === -1) {
          console.warn(`尝试更新不存在的组件ID: ${id}`);
          return;
        }

        // 创建组件的副本
        const component = { ...current[componentIndex] };

        // 确保组件有style属性
        if (!component.style) {
          component.style = {};
        }

        // 应用深度合并
        const mergedStyle = deepMergeStyle({ ...component.style }, styleChanges);

        // 存储更新后的组件
        updatedComponents.set(componentIndex, { ...component, style: mergedStyle });
      });

      // 创建新的组件状态
      const newState = current.map((component, index) =>
        updatedComponents.has(index) ? updatedComponents.get(index) : component
      );

      console.log('批量样式更新后的组件状态:', newState);
      updateComponents(newState);
    };

    // Action: Commit a state change explicitly (e.g., after move/resize)
    const commitCanvasChange = (finalComponentsState) => {
      console.log('Action: commitCanvasChange');
      // This action assumes finalComponentsState is the desired new state
      // It directly updates components, and the watcher handles history.
      updateComponents(finalComponentsState);
    };

    const clearCanvas = () => {
      console.log('Action: clearCanvas');
      updateComponents([]);
      clearSelection();
      nextZIndex.value = 1; // Reset zIndex counter
    };

    const deleteSelectedComponents = () => {
      console.log('Action: deleteSelectedComponents');
      if (selectedComponentIds.value.length === 0) return;

      // 使用components.value而不是currentComponents.value，确保是操作实际的组件数组而不是计算属性
      const current = components.value;
      const idsToDelete = new Set(selectedComponentIds.value);
      const newState = current.filter((c) => !idsToDelete.has(c.id));

      console.log('删除前组件数量:', current.length, '删除后组件数量:', newState.length);
      updateComponents(newState);
      clearSelection();
    };

    const setCanvasComponents = (newComponents) => {
      console.log('Action: setCanvasComponents');
      if (Array.isArray(newComponents)) {
        // Find the max zIndex from loaded components and set nextZIndex accordingly
        let maxZ = 0;
        newComponents.forEach((c) => {
          if (c.style?.zIndex > maxZ) {
            maxZ = c.style.zIndex;
          }
          // Ensure all loaded components have a zIndex
          if (c.style && typeof c.style.zIndex !== 'number') {
            c.style.zIndex = maxZ + 1; // Assign a default if missing
            maxZ++;
          }
        });
        nextZIndex.value = maxZ + 1;

        updateComponents(newComponents);
        clearSelection();
      } else {
        console.error('Failed to load components: Invalid data format');
      }
    };

    // Layer Actions:
    const moveLayer = (id, direction) => {
      // direction: 'up', 'down', 'top', 'bottom'
      console.log('Action: moveLayer', id, direction);
      const current = [...components.value]; // 使用components.value而不是currentComponents.value
      const index = current.findIndex((c) => c.id === id);
      if (index === -1) return;

      const component = current[index];

      // Remove component temporarily
      current.splice(index, 1);

      // Re-insert at new position
      if (direction === 'up') {
        if (index < current.length) {
          // Check if it's not already at the top
          current.splice(index + 1, 0, component);
        } else {
          current.push(component); // Already at top, put it back
        }
      } else if (direction === 'down') {
        if (index > 0) {
          // Check if it's not already at the bottom
          current.splice(index - 1, 0, component);
        } else {
          current.unshift(component); // Already at bottom, put it back
        }
      } else if (direction === 'top') {
        current.push(component); // Add to the end (highest z-index conceptually)
      } else if (direction === 'bottom') {
        current.unshift(component); // Add to the beginning (lowest z-index conceptually)
      }

      // Re-assign zIndex based on new array order
      const newState = current.map((c, i) => {
        return { ...c, style: { ...c.style, zIndex: i + 1 } };
      });
      nextZIndex.value = newState.length + 1; // Update next zIndex based on new count

      updateComponents(newState);
      // Keep selection? Or clear? For now, keep it.
    };

    // Undo/Redo Actions:
    const undo = () => {
      if (canUndo.value) {
        internalUpdate = true;
        historyIndex.value--;
        console.log('Undo. Index:', historyIndex.value);
        const restoredComponents = JSON.parse(historyStates.value[historyIndex.value]);
        components.value = restoredComponents;
        lastRecordedState = historyStates.value[historyIndex.value];
        // Recalculate nextZIndex
        nextZIndex.value =
          restoredComponents.reduce((max, c) => Math.max(max, c.style?.zIndex || 0), 0) + 1;
        clearSelection();
        nextTick(() => {
          internalUpdate = false;
        });
      }
    };

    const redo = () => {
      if (canRedo.value) {
        internalUpdate = true;
        historyIndex.value++;
        console.log('Redo. Index:', historyIndex.value);
        const restoredComponents = JSON.parse(historyStates.value[historyIndex.value]);
        components.value = restoredComponents;
        lastRecordedState = historyStates.value[historyIndex.value];
        // Recalculate nextZIndex
        nextZIndex.value =
          restoredComponents.reduce((max, c) => Math.max(max, c.style?.zIndex || 0), 0) + 1;
        clearSelection();
        nextTick(() => {
          internalUpdate = false;
        });
      }
    };

    // Initialize history with the initial empty state
    // Ensure components ref matches initial history state
    updateComponents([]);

    // --- NEW: Grouping Actions ---
    const groupSelectedComponents = () => {
      console.log('Action: groupSelectedComponents');
      if (selectedComponentIds.value.length < 2) return;

      const current = components.value;
      const selectedIds = new Set(selectedComponentIds.value);
      const childrenToGroup = [];
      const remainingComponents = current.filter((c) => {
        if (selectedIds.has(c.id)) {
          childrenToGroup.push(JSON.parse(JSON.stringify(c))); // Deep copy children
          return false; // Remove from main list
        }
        return true;
      });

      if (childrenToGroup.length < 2) return; // Should match selectedIds check, but safety

      // Calculate bounding box of the children
      const box = getBoundingBox(childrenToGroup);

      // Adjust children's positions to be relative to the group's top-left
      childrenToGroup.forEach((child) => {
        child.style.left = `${parseFloat(child.style.left || 0) - box.left}px`;
        child.style.top = `${parseFloat(child.style.top || 0) - box.top}px`;
        // Keep original zIndex within group? Or reset? Reset might be simpler.
        // child.style.zIndex = ...?
      });

      // Create the group component
      const groupZIndex = nextZIndex.value++;
      const groupComponent = {
        key: 'group',
        id: uuidv4(),
        label: '组合',
        style: {
          position: 'absolute',
          left: `${box.left}px`,
          top: `${box.top}px`,
          width: `${box.width}px`,
          height: `${box.height}px`,
          zIndex: groupZIndex,
          border: '1px solid transparent', // Optional: style for group container
        },
        props: {},
        children: childrenToGroup,
      };

      const newState = [...remainingComponents, groupComponent];
      updateComponents(newState);
      selectedComponentIds.value = [groupComponent.id]; // Select the new group
    };

    const ungroupSelectedComponent = () => {
      console.log('Action: ungroupSelectedComponent');
      if (selectedComponentIds.value.length !== 1) return;

      const groupId = selectedComponentIds.value[0];
      const current = components.value;
      const groupIndex = current.findIndex((c) => c.id === groupId && c.key === 'group');

      if (groupIndex === -1) {
        console.warn('Selected component is not a group or not found.');
        return;
      }

      const groupComponent = current[groupIndex];
      const groupStyle = groupComponent.style;
      const groupLeft = parseFloat(groupStyle.left || 0);
      const groupTop = parseFloat(groupStyle.top || 0);

      const extractedChildren = [];
      if (groupComponent.children && groupComponent.children.length > 0) {
        groupComponent.children.forEach((child) => {
          const newChild = JSON.parse(JSON.stringify(child)); // Deep copy
          // Convert relative position back to absolute
          newChild.style.left = `${groupLeft + parseFloat(newChild.style.left || 0)}px`;
          newChild.style.top = `${groupTop + parseFloat(newChild.style.top || 0)}px`;
          // Assign new zIndex? Or restore? Assigning new seems safer.
          newChild.style.zIndex = nextZIndex.value++;
          extractedChildren.push(newChild);
        });
      }

      // Remove group and add children back
      const remainingComponents = current.filter((c) => c.id !== groupId);
      const newState = [...remainingComponents, ...extractedChildren];

      updateComponents(newState);
      // Select the extracted children
      selectedComponentIds.value = extractedChildren.map((c) => c.id);
    };

    return {
      // State & Getters
      components,
      selectedComponentIds,
      primarySelectedComponent,
      canvasStyleData, // --- 恢复暴露 canvasStyleData ---
      canUndo,
      canRedo,

      // Actions
      addComponent,
      selectComponent,
      clearSelection,
      updateComponentProps,
      updateComponentStyle,
      updateMultipleComponentStyles,
      commitCanvasChange,
      clearCanvas,
      deleteSelectedComponents,
      setCanvasComponents,
      moveLayer,
      groupSelectedComponents,
      ungroupSelectedComponent,
      undo,
      redo,
    };
  },
  {
    // Pinia store options (optional)
    // persist: true, // Example if using pinia-plugin-persistedstate
  }
);
