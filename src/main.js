import { createApp } from 'vue';
import './style.css';
import './styles/index.less';
import App from './App.vue';
import router from './router';
import pinia from './stores';

// Element Plus
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import * as ElementPlusIconsVue from '@element-plus/icons-vue';

// 全局指令
import directives from './directives';

const app = createApp(App);

// 注册所有Element Plus图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component);
}

app.use(router);
app.use(pinia);
app.use(ElementPlus, { size: 'default', zIndex: 3000 });
app.use(directives);

app.mount('#app');
