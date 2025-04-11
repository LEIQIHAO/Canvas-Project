import { createRouter, createWebHistory } from 'vue-router';
// import Home from '@/views/Home.vue'; // Home 不再需要

const routes = [
  {
    path: '/', // 将根路径指向 Editor
    name: 'Editor', // 可以重命名为 Editor 或保留 Home，这里改为 Editor
    // component: Home, // 不再使用 Home
    component: () => import('@/views/Editor.vue'), // 直接加载 Editor
  },
  // {
  //   path: '/about',
  //   name: 'About',
  //   // 路由懒加载
  //   component: () => import('@/views/About.vue'),
  // }, // 移除 About 路由
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
