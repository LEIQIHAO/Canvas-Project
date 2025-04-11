<script setup>
// App 根组件，现在只负责渲染当前路由匹配的组件
</script>

<template>
  <router-view />
</template>

<style>
/* 保留一些全局基础样式，或者根据需要移除/修改 */
html,
body,
#app {
  margin: 0;
  padding: 0;
  height: 100%;
  width: 100%;
}

/* 可以移除之前 App.vue 特有的 header/footer/nav 样式 */
</style>
