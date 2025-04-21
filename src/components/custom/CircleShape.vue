<template>
  <div class="svg-circle-container">
    <svg version="1.1" baseProfile="full" xmlns="http://www.w3.org/2000/svg" :viewBox="svgViewBox">
      <ellipse
        ref="ellipse"
        :cx="centerX"
        :cy="centerY"
        :rx="radiusX"
        :ry="radiusY"
        :stroke="borderColor"
        :stroke-width="borderWidth"
        :fill="fillColor"
      />
    </svg>
    <!-- 圆形可以包含内容（如果有），使用 v-html 以支持 HTML 内容 -->
    <div v-if="propValue" class="circle-content" v-html="propValue" />
  </div>
</template>

<script>
export default {
  name: 'CircleShape',
  props: {
    // 圆形内部内容（HTML）
    propValue: {
      type: String,
      default: '',
    },
    // 组件完整信息，用于获取样式
    element: {
      type: Object,
      required: true,
    },
  },
  computed: {
    svgViewBox() {
      const width = parseFloat(this.element.style.width) || 100;
      const height = parseFloat(this.element.style.height) || 100;
      return `0 0 ${width} ${height}`;
    },
    centerX() {
      const width = parseFloat(this.element.style.width) || 100;
      return width / 2;
    },
    centerY() {
      const height = parseFloat(this.element.style.height) || 100;
      return height / 2;
    },
    radiusX() {
      const width = parseFloat(this.element.style.width) || 100;
      // 减去边框宽度，避免椭圆被裁剪
      const borderWidth = this.borderWidth;
      return Math.max(width / 2 - borderWidth, 0);
    },
    radiusY() {
      const height = parseFloat(this.element.style.height) || 100;
      // 减去边框宽度，避免椭圆被裁剪
      const borderWidth = this.borderWidth;
      return Math.max(height / 2 - borderWidth, 0);
    },
    fillColor() {
      // 从 style.backgroundColor 获取填充颜色
      const fillColor = this.element.style.backgroundColor;
      return fillColor && fillColor !== '' ? fillColor : 'transparent';
    },
    borderColor() {
      return this.element.style.borderColor || 'black';
    },
    borderWidth() {
      if (!this.element.style.borderWidth) return 1;
      const width = parseFloat(this.element.style.borderWidth);
      return isNaN(width) ? 1 : width;
    },
  },
};
</script>

<style scoped>
.svg-circle-container {
  width: 100%;
  height: 100%;
  position: relative;
}

.svg-circle-container svg {
  width: 100%;
  height: 100%;
}

.circle-content {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  user-select: none;
  pointer-events: none;
}
</style>
