<template>
  <div class="svg-hexagon-container">
    <svg version="1.1" baseProfile="full" xmlns="http://www.w3.org/2000/svg" :viewBox="svgViewBox">
      <polygon
        ref="hexagon"
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
  name: 'SVGHexagon',
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
      const fillColor = this.element.style.color;
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
      const widthValue = parseFloat(this.element.style.width);
      const heightValue = parseFloat(this.element.style.height);

      const width = !isNaN(widthValue) ? widthValue : 80;
      const height = !isNaN(heightValue) ? heightValue : 80;

      this.drawPolygon(width, height);
    },

    drawPolygon(width, height) {
      // 六边形的六个顶点比例
      const points = [
        [0.5, 0], // 顶点
        [1, 0.25], // 右上
        [1, 0.75], // 右下
        [0.5, 1], // 底部
        [0, 0.75], // 左下
        [0, 0.25], // 左上
      ];

      const coordinatePoints = points.map((point) => `${width * point[0]} ${height * point[1]}`);
      this.points = coordinatePoints.toString();
    },
  },
};
</script>

<style scoped>
.svg-hexagon-container {
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.svg-hexagon-container svg {
  width: 100%;
  height: 100%;
}
</style>
