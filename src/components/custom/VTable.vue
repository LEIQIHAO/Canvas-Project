<template>
  <table class="v-table">
    <tbody>
      <tr
        v-for="(item, index) in tableData"
        :key="index"
        :class="{
          stripe: tableProps.stripe && index % 2,
          bold: tableProps.thBold && index === 0,
        }"
      >
        <td v-for="(e, i) in item" :key="i">
          {{ e }}
        </td>
      </tr>
    </tbody>
  </table>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  // 表格数据和配置
  propValue: {
    type: Object,
    default: () => ({}),
  },
  element: {
    type: Object,
    required: false,
  },
});

// 从element.props或直接的propValue获取表格数据
const tableData = computed(() => {
  // 优先使用element.props中的数据
  if (props.element?.props?.data) {
    return props.element.props.data;
  }

  // 回退到直接传入的propValue.data
  return (
    props.propValue?.data || [
      ['表头1', '表头2'],
      ['内容1', '内容2'],
    ]
  );
});

// 获取表格配置
const tableProps = computed(() => {
  const defaultProps = {
    stripe: true,
    thBold: true,
  };

  // 优先使用element.props中的配置
  if (props.element?.props) {
    return {
      ...defaultProps,
      stripe:
        props.element.props.stripe !== undefined ? props.element.props.stripe : defaultProps.stripe,
      thBold:
        props.element.props.thBold !== undefined ? props.element.props.thBold : defaultProps.thBold,
    };
  }

  // 回退到直接传入的propValue中的配置
  return {
    ...defaultProps,
    stripe: props.propValue?.stripe !== undefined ? props.propValue.stripe : defaultProps.stripe,
    thBold: props.propValue?.thBold !== undefined ? props.propValue.thBold : defaultProps.thBold,
  };
});
</script>

<style scoped>
.v-table {
  border-collapse: collapse;
  table-layout: fixed;
  word-break: break-all;
  word-wrap: break-word;
  width: 100%;
  height: 100%;
}

.v-table td {
  border: 1px solid #ebeef5;
  height: 40px;
  padding: 10px;
  text-align: center;
}

.v-table .bold {
  font-weight: bold;
}

.v-table .stripe {
  background-color: #fafafa;
}
</style>
