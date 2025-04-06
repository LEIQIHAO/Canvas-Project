<script setup>
import ElementDemo from '@/components/ElementDemo.vue';
</script>

<template>
  <div class="about">
    <h1>About页面</h1>
    <p>这是一个使用Vue 3 + Vite构建的项目。</p>
    <p>已配置了以下工具和库：</p>
    <ul>
      <li>ESLint和Prettier - 代码规范和格式化</li>
      <li>Vue Router - 路由管理</li>
      <li>Pinia - 状态管理</li>
      <li>Husky和lint-staged - Git提交前代码检查</li>
      <li>Element Plus - UI组件库</li>
      <li>Less - CSS预处理器</li>
      <li>自定义指令 - 常用功能封装</li>
    </ul>

    <ElementDemo class="element-demo" />

    <div class="navigation">
      <router-link to="/"> 返回首页 </router-link>
    </div>
  </div>
</template>

<style lang="less" scoped>
.about {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  text-align: center;
}

ul {
  text-align: left;
  max-width: 400px;
  margin: 0 auto;
  padding: 1rem 2rem;
  background-color: @bg-color-gray;
  border-radius: @border-radius-large;
}

li {
  margin: 0.5rem 0;
}

.navigation {
  margin-top: @spacing-large;
}

.element-demo {
  margin-top: @spacing-xlarge;
}
</style>
