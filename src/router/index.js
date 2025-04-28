import { createRouter, createWebHistory } from 'vue-router';
import { useUserStore } from '../stores/user';
import { ElMessage } from 'element-plus';
import Login from '@/views/Login.vue';
import CanvasList from '@/views/CanvasList.vue';
import Editor from '@/views/Editor.vue';
import Register from '@/views/Register.vue';

const routes = [
  {
    path: '/',
    redirect: '/login',
  },
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: { requiresAuth: false },
  },
  {
    path: '/register',
    name: 'Register',
    component: Register,
    meta: { requiresAuth: false },
  },
  {
    path: '/canvas',
    name: 'CanvasList',
    component: CanvasList,
    meta: { requiresAuth: true },
  },
  {
    path: '/editor/:id',
    name: 'Editor',
    component: Editor,
    meta: { requiresAuth: true },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// 路由守卫
router.beforeEach((to, from, next) => {
  const isAuthenticated = localStorage.getItem('user');

  if (to.meta.requiresAuth && !isAuthenticated) {
    // 如果需要认证且未登录，重定向到登录页
    next('/login');
  } else if (to.path === '/login' && isAuthenticated) {
    // 如果已登录且访问登录页，重定向到列表页
    next('/canvas');
  } else {
    // 其他情况正常导航
    next();
  }
});

// 路由错误处理
router.onError((error) => {
  console.error('路由错误:', error);
  ElMessage.error('页面加载失败，请刷新重试');
});

export default router;
