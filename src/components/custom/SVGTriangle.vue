<template>
  <div class="svg-triangle-container">
    <svg version="1.1" baseProfile="full" xmlns="http://www.w3.org/2000/svg" :viewBox="svgViewBox">
      <polygon
        ref="triangle"
        :points="points"
        :stroke="borderColor"
        :stroke-width="borderWidth"
        :fill="fillColor"
      />
    </svg>
  </div>
</template>

<script>
export default {
  name: 'SVGTriangle',
  props: {
    propValue: {
      type: String,
      required: false,
      default: '',
    },
    element: {
      type: Object,
      required: true,
    },
  },
  data() {
    return {
      points: '',
    };
  },
  computed: {
    svgViewBox() {
      const width = parseFloat(this.element.style.width) || 80;
      const height = parseFloat(this.element.style.height) || 80;
      return `0 0 ${width} ${height}`;
    },
    fillColor() {
      // 只从 style.color 获取填充颜色
      const fillColor = this.element.style.color;
      console.log('使用style.color填充:', fillColor);
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
  watch: {
    'element.style.width': function () {
      this.draw();
    },
    'element.style.height': function () {
      this.draw();
    },
  },
  mounted() {
    this.draw();
  },
  methods: {
    draw() {
      // 解析宽度和高度，去掉单位（如 'px'）
      const widthValue = parseFloat(this.element.style.width);
      const heightValue = parseFloat(this.element.style.height);

      // 确保有效的数值
      const width = !isNaN(widthValue) ? widthValue : 80;
      const height = !isNaN(heightValue) ? heightValue : 80;

      this.drawPolygon(width, height);
    },

    drawPolygon(width, height) {
      // 三角形三个坐标点的比例集合
      const points = [
        [0.5, 0],
        [1, 1],
        [0, 1],
      ];

      const coordinatePoints = points.map((point) => `${width * point[0]} ${height * point[1]}`);
      this.points = coordinatePoints.toString();
    },
  },
};
</script>

<style scoped>
.svg-triangle-container {
  width: 100%;
  height: 100%;
}

.svg-triangle-container svg {
  width: 100%;
  height: 100%;
}
</style>
