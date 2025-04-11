<template>
  <div class="picture-container">
    <img :src="finalUrl" :style="imageStyle" class="picture-img" />
  </div>
</template>

<script setup>
import { computed, onMounted, watch } from 'vue';

// 定义组件的 props
const props = defineProps({
  // 图片 URL
  url: {
    type: String,
    required: false,
    default: '',
  },
  // 图片反转配置
  flip: {
    type: Object,
    default: () => ({ horizontal: false, vertical: false }),
  },
  // 组件完整信息，用于获取样式
  element: {
    type: Object,
    required: false,
  },
});

// 调试: 监视props变化
watch(
  () => props,
  (newProps) => {
    console.log('Picture props 更新:', {
      url: newProps.url,
      elementId: newProps.element?.id,
      elementProps: newProps.element?.props,
    });
  },
  { deep: true, immediate: true }
);

// 计算图片最终 URL，优先使用直接传入的 url，回退到 element.props.url
const finalUrl = computed(() => {
  const directUrl = props.url;
  const elementUrl = props.element?.props?.url;
  const result = directUrl || elementUrl || 'https://picsum.photos/200/300';

  console.log('Picture URL 解析:', {
    directUrl,
    elementUrl,
    finalUrl: result,
  });

  return result;
});

// 计算图片样式
const imageStyle = computed(() => {
  // 获取完整样式对象，如果 element 存在
  const style = props.element?.style || {};
  console.log('Picture 应用样式:', style);

  // 计算图片翻转的 transform
  let transform = '';
  if (props.flip) {
    if (props.flip.horizontal) {
      transform += ' scaleX(-1)';
    }
    if (props.flip.vertical) {
      transform += ' scaleY(-1)';
    }
  }

  // 回退到 element.props.flip 如果直接 props.flip 未提供
  const elementFlip = props.element?.props?.flip;
  if (!props.flip && elementFlip) {
    if (elementFlip.horizontal) {
      transform += ' scaleX(-1)';
    }
    if (elementFlip.vertical) {
      transform += ' scaleY(-1)';
    }
  }

  // 返回最终样式
  return {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    borderRadius: style.borderRadius,
    transform: transform || 'none',
  };
});

onMounted(() => {
  console.log('Picture 组件已挂载:', {
    id: props.element?.id,
    url: finalUrl.value,
  });
});
</script>

<style scoped>
.picture-container {
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.picture-img {
  display: block;
  box-sizing: border-box;
}
</style>
