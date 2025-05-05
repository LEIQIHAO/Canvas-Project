<template>
  <div
    class="v-input-container"
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
    }"
    @dblclick.stop.prevent="handleDoubleClick"
    @mousedown.stop.prevent
  >
    <input
      v-if="isEditing"
      ref="inputRef"
      v-model="inputValue"
      type="text"
      class="v-input"
      :placeholder="props.placeholder"
      @blur="handleBlur"
      @keydown.esc="handleEsc"
      @keydown.enter="handleEnter"
      @mousedown.stop.prevent
      @click.stop.prevent
    />
    <div v-else class="v-input-placeholder" @mousedown.stop.prevent @click.stop.prevent>
      {{ displayValue }}
    </div>
  </div>
</template>

<script setup>
import { ref, computed, nextTick, onMounted, watch } from 'vue';

const props = defineProps({
  placeholder: {
    type: String,
    default: '请输入...',
  },
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

const isEditing = ref(false);
const inputRef = ref(null);
const inputValue = ref(props.value);

const displayValue = computed(() => {
  return inputValue.value || props.placeholder;
});

// 监听 value 属性的变化
watch(
  () => props.value,
  (newValue) => {
    inputValue.value = newValue;
  }
);

const handleDoubleClick = (event) => {
  console.log('Double click triggered'); // 添加调试日志
  event.stopPropagation();
  event.preventDefault();
  isEditing.value = true;
  nextTick(() => {
    if (inputRef.value) {
      inputRef.value.focus();
      inputRef.value.select();
    }
  });
};

const handleBlur = () => {
  console.log('Blur triggered'); // 添加调试日志
  isEditing.value = false;
  emit('update:value', inputValue.value);
  emit('blur', inputValue.value);
};

const handleEsc = () => {
  console.log('ESC pressed'); // 添加调试日志
  inputValue.value = props.value;
  isEditing.value = false;
};

const handleEnter = () => {
  console.log('Enter pressed'); // 添加调试日志
  isEditing.value = false;
  emit('update:value', inputValue.value);
  emit('blur', inputValue.value);
};

onMounted(() => {
  inputValue.value = props.value;
  console.log('VInput mounted'); // 添加调试日志
});
</script>

<style scoped>
.v-input-container {
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: text;
  user-select: none;
  box-sizing: border-box;
  z-index: 1;
  pointer-events: auto;
}

.v-input {
  width: 100%;
  height: 100%;
  border: none;
  outline: none;
  background: transparent;
  padding: 0 8px;
  font: inherit;
  color: inherit;
  box-sizing: border-box;
  z-index: 2;
  pointer-events: auto;
}

.v-input:focus {
  outline: none;
}

.v-input-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
  padding: 0 8px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  box-sizing: border-box;
  z-index: 1;
  pointer-events: auto;
}
</style>
