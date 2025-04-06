<script setup>
import { ref, onMounted } from 'vue';
import { user, common } from '@/api';

const userInfo = ref(null);
const config = ref(null);
const loading = ref(false);
const error = ref('');

// 获取用户信息示例
async function fetchUserInfo() {
  loading.value = true;
  error.value = '';

  try {
    // 这是一个示例，实际环境中可能需要先登录获取token
    userInfo.value = await user.getUserInfo();
  } catch (err) {
    console.error('获取用户信息失败:', err);
    error.value = '获取用户信息失败: ' + (err.message || '未知错误');

    // 由于没有真实后端，这里模拟一些数据
    userInfo.value = {
      id: 1,
      username: '示例用户',
      avatar: 'https://avatars.githubusercontent.com/u/123456',
      roles: ['admin'],
    };
  } finally {
    loading.value = false;
  }
}

// 获取配置信息示例
async function fetchConfig() {
  try {
    config.value = await common.getConfig();
  } catch (err) {
    console.error('获取配置失败:', err);

    // 由于没有真实后端，这里模拟一些数据
    config.value = {
      siteName: 'Vue 3 示例项目',
      version: '1.0.0',
      theme: 'light',
    };
  }
}

// 登录示例
async function handleLogin() {
  try {
    await user.login({ username: 'admin', password: 'password' });
    fetchUserInfo();
  } catch (err) {
    console.error('登录失败:', err);
    error.value = '登录失败: ' + (err.message || '未知错误');
  }
}

// 退出登录示例
async function handleLogout() {
  try {
    await user.logout();
    userInfo.value = null;
  } catch (err) {
    console.error('退出失败:', err);
  }
}

onMounted(() => {
  fetchUserInfo();
  fetchConfig();
});
</script>

<template>
  <div class="data-fetcher">
    <h2>API请求示例</h2>

    <div v-if="loading" class="loading">加载中...</div>

    <div v-if="error" class="error">
      {{ error }}
    </div>

    <div class="card">
      <h3>用户信息</h3>
      <div v-if="userInfo" class="info">
        <p><strong>ID:</strong> {{ userInfo.id }}</p>
        <p><strong>用户名:</strong> {{ userInfo.username }}</p>
        <p><strong>角色:</strong> {{ userInfo.roles?.join(', ') }}</p>
      </div>
      <div v-else class="empty">未登录</div>

      <div class="actions">
        <button v-if="!userInfo" @click="handleLogin">登录</button>
        <button v-else @click="handleLogout">退出登录</button>
      </div>
    </div>

    <div class="card">
      <h3>系统配置</h3>
      <div v-if="config" class="info">
        <p><strong>站点名称:</strong> {{ config.siteName }}</p>
        <p><strong>版本:</strong> {{ config.version }}</p>
        <p><strong>主题:</strong> {{ config.theme }}</p>
      </div>
      <div v-else class="empty">未获取配置</div>
    </div>
  </div>
</template>

<style scoped>
.data-fetcher {
  max-width: 600px;
  margin: 0 auto;
  padding: 1rem;
}

.loading {
  padding: 1rem;
  background-color: #e8f4f8;
  border-radius: 4px;
  margin-bottom: 1rem;
  text-align: center;
}

.error {
  padding: 1rem;
  background-color: #fdeeee;
  color: #d83b3b;
  border-radius: 4px;
  margin-bottom: 1rem;
}

.card {
  background-color: #f9f9f9;
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.info {
  margin: 1rem 0;
}

.empty {
  color: #888;
  font-style: italic;
  margin: 1rem 0;
}

.actions {
  margin-top: 1rem;
}

button {
  padding: 0.5rem 1rem;
  background-color: #42b883;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button:hover {
  background-color: #369e6c;
}
</style>
