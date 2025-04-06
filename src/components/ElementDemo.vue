<script setup>
import { ref, reactive } from 'vue';
import { ElMessage } from 'element-plus';
// 表单数据
const formData = reactive({
  name: '',
  email: '',
  age: '',
  date: '',
  city: '',
});

// 表单规则
const rules = {
  name: [
    { required: true, message: '请输入姓名', trigger: 'blur' },
    { min: 2, max: 10, message: '长度在 2 到 10 个字符', trigger: 'blur' },
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' },
  ],
  age: [
    { required: true, message: '请输入年龄', trigger: 'blur' },
    { type: 'number', message: '年龄必须为数字', trigger: 'blur' },
  ],
  date: [{ required: true, message: '请选择日期', trigger: 'change' }],
  city: [{ required: true, message: '请选择城市', trigger: 'change' }],
};

// 下拉选项
const cityOptions = [
  { value: 'beijing', label: '北京' },
  { value: 'shanghai', label: '上海' },
  { value: 'guangzhou', label: '广州' },
  { value: 'shenzhen', label: '深圳' },
];

// 表格数据
const tableData = ref([
  {
    id: 1,
    name: '张三',
    age: 25,
    address: '北京市朝阳区',
  },
  {
    id: 2,
    name: '李四',
    age: 30,
    address: '上海市浦东新区',
  },
  {
    id: 3,
    name: '王五',
    age: 28,
    address: '广州市天河区',
  },
]);

// 表单引用
const formRef = ref(null);

// 表单提交
const submitForm = async () => {
  if (!formRef.value) return;

  try {
    await formRef.value.validate();
    ElMessage.success('提交成功');
    console.log('表单数据:', formData);
  } catch (error) {
    ElMessage.error('请检查表单填写是否正确');
    console.error('表单验证失败:', error);
  }
};

// 重置表单
const resetForm = () => {
  if (formRef.value) {
    formRef.value.resetFields();
  }
};
</script>

<template>
  <div class="element-demo">
    <h2 class="demo-title">Element Plus 示例</h2>

    <el-divider content-position="left"> 表单示例 </el-divider>

    <div class="demo-form">
      <el-card shadow="hover">
        <template #header>
          <div class="card-header">
            <span>用户信息表单</span>
            <el-button type="primary" plain size="small">
              <el-icon><Plus /></el-icon>
              新增用户
            </el-button>
          </div>
        </template>

        <el-form
          ref="formRef"
          :model="formData"
          :rules="rules"
          label-width="80px"
          class="demo-form-content"
        >
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="姓名" prop="name">
                <el-input v-model="formData.name" placeholder="请输入姓名" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="邮箱" prop="email">
                <el-input v-model="formData.email" placeholder="请输入邮箱" />
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="年龄" prop="age">
                <el-input-number v-model="formData.age" :min="1" :max="120" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="日期" prop="date">
                <el-date-picker
                  v-model="formData.date"
                  type="date"
                  placeholder="选择日期"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>
          </el-row>

          <el-form-item label="城市" prop="city">
            <el-select v-model="formData.city" placeholder="请选择城市" style="width: 100%">
              <el-option
                v-for="item in cityOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>

          <el-form-item>
            <el-button type="primary" @click="submitForm"> 提交 </el-button>
            <el-button @click="resetForm"> 重置 </el-button>
          </el-form-item>
        </el-form>
      </el-card>
    </div>

    <el-divider content-position="left"> 表格示例 </el-divider>

    <div class="demo-table">
      <el-card shadow="hover">
        <template #header>
          <div class="card-header">
            <span>用户列表</span>
            <div>
              <el-input placeholder="搜索姓名..." style="width: 200px; margin-right: 10px">
                <template #prefix>
                  <el-icon><Search /></el-icon>
                </template>
              </el-input>
              <el-button type="success" plain size="small">
                <el-icon><Download /></el-icon>
                导出数据
              </el-button>
            </div>
          </div>
        </template>

        <el-table :data="tableData" border style="width: 100%">
          <el-table-column prop="id" label="ID" width="80" />
          <el-table-column prop="name" label="姓名" width="120" />
          <el-table-column prop="age" label="年龄" width="120" />
          <el-table-column prop="address" label="地址" />
          <el-table-column label="操作" width="200">
            <template #default>
              <el-button size="small" type="primary"> 编辑 </el-button>
              <el-button size="small" type="danger"> 删除 </el-button>
            </template>
          </el-table-column>
        </el-table>

        <div class="demo-pagination">
          <el-pagination
            layout="total, sizes, prev, pager, next, jumper"
            :total="50"
            :page-sizes="[10, 20, 30, 40]"
            :page-size="10"
            :current-page="1"
          />
        </div>
      </el-card>
    </div>
  </div>
</template>

<style lang="less" scoped>
.element-demo {
  .flex-column();
  gap: @spacing-large;

  .demo-title {
    color: @primary-color;
    font-size: @font-size-xlarge;
    text-align: center;
    margin-bottom: @spacing-base;
  }

  .demo-form,
  .demo-table {
    width: 100%;

    .card-header {
      .flex-between();
    }

    .demo-form-content {
      padding: @spacing-base 0;
    }

    .demo-pagination {
      margin-top: @spacing-large;
      .flex-end();
    }
  }

  :deep(.el-card) {
    border-radius: @border-radius-large;

    .el-card__header {
      padding: @spacing-base;
      border-bottom: 1px solid @border-color-light;
    }

    .el-card__body {
      padding: @spacing-large;
    }
  }

  // 按钮样式
  :deep(.el-button--primary) {
    background-color: @primary-color;

    &:hover {
      background-color: @primary-color-light;
    }

    &:active {
      background-color: @primary-color-dark;
    }
  }
}
</style>
