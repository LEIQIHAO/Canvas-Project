<template>
  <div class="svg-trapezoid-container">
    <svg version="1.1" baseProfile="full" xmlns="http://www.w3.org/2000/svg" :viewBox="svgViewBox">
      <polygon
        ref="trapezoid"
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
  name: 'SVGTrapezoid',
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
      const width = parseFloat(this.element.style.width) || 100;
      const height = parseFloat(this.element.style.height) || 100;
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

      const width = !isNaN(widthValue) ? widthValue : 100;
      const height = !isNaN(heightValue) ? heightValue : 100;

      this.drawPolygon(width, height);
    },

    drawPolygon(width, height) {
      // 梯形的四个顶点比例
      const points = [
        [0.2, 0], // 上边左点
        [0.8, 0], // 上边右点
        [1, 1], // 下边右点
        [0, 1], // 下边左点
      ];

      const coordinatePoints = points.map((point) => `${width * point[0]} ${height * point[1]}`);
      this.points = coordinatePoints.toString();
    },
  },
};
</script>

<style scoped>
.svg-trapezoid-container {
  width: 100%;
  height: 100%;
}

.svg-trapezoid-container svg {
  width: 100%;
  height: 100%;
}
</style>
